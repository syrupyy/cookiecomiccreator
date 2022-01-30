#!/usr/bin/env python

# Cookie Comic Creator image formatter for Cookie Run, by syrupyy
# To use this, put the script and the rest of the contents of the index/ folder in the root folder of a CROB data download ((data/)data/com.devsisters.gb/files/download/ on an Android filesystem), merge it with the resources from a Google Play Asset Pack or APK, then run it via the command line (python index.py)
from itertools import chain
from PIL import Image, ImageChops, ImageDraw
from shutil import copyfile
from xml.etree import ElementTree
import json
import math
import os
import PIL
import re
import sys

# Compute the colors of a gradient
def gradient_fill(minval, maxval, val, color_palette):
    max_index = len(color_palette) - 1
    delta = maxval - minval
    if delta == 0:
        delta = 1
    v = float(val - minval) / delta * max_index
    i1, i2 = int(v), min(int(v) + 1, max_index)
    (r1, g1, b1), (r2, g2, b2) = color_palette[i1], color_palette[i2]
    f = v - i1
    return int(r1 + f * (r2 - r1)), int(g1 + f * (g2 - g1)), int(b1 + f * (b2 - b1))

# Define tree to dictionary function
def tree_to_dict(tree):
    d = {}
    for index, item in enumerate(tree):
        if item.tag == "key":
            if tree[index + 1].tag == "string":
                d[item.text] = tree[index + 1].text
            elif tree[index + 1].tag == "true":
                d[item.text] = True
            elif tree[index + 1].tag == "false":
                d[item.text] = False
            elif tree[index + 1].tag == "integer":
                d[item.text] = int(tree[index + 1].text)
            elif tree[index + 1].tag == "dict":
                d[item.text] = tree_to_dict(tree[index + 1])
            elif tree[index + 1].tag == "array":
                d[item.text] = []
                for i in tree[index + 1]:
                    if i.tag == "string":
                        d[item.text].append(i.text)
                    elif i.tag == "true":
                        d[item.text].append(True)
                    elif i.tag == "false":
                        d[item.text].append(False)
                    elif i.tag == "integer":
                        d[item.text].append(int(i.text))
                    elif i.tag == "dict":
                        d[item.text].append(tree_to_dict(i))
    return d

# Define image trim function
def trim(im):
    bg = Image.new(im.mode, im.size)
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)

# Define texture unpacking function (heavily modified from https://github.com/onepill/texture_unpacker_scirpt)
def unpack_texture(file, path, suffix):
    im = Image.open(file)
    root = ElementTree.fromstring(open(file.replace(".png", ".plist"), "r").read())
    plist_dict = tree_to_dict(root[0])
    for key, frame in plist_dict["frames"].items():
        if suffix == None or key.endswith(suffix):
            output = os.path.split(key)[-1]
            if forbidden and output in forbidden:
                continue
            if(plist_dict["metadata"]["format"] == 3):
                frame["frame"] = frame["textureRect"]
                frame["rotated"] = frame["textureRotated"]
            rectlist = frame["frame"].replace("{", "").replace("}", "").split(",")
            width = int(float(rectlist[3] if frame["rotated"] else rectlist[2]))
            height = int(float(rectlist[2] if frame["rotated"] else rectlist[3]))
            if width < 4 and height < 4:
                continue
            cropped = im.crop((int(float(rectlist[0])), int(float(rectlist[1])), int(float(rectlist[0])) + width, int(float(rectlist[1])) + height))
            cropped = trim(cropped)
            if frame["rotated"]:
                cropped = cropped.transpose(Image.ROTATE_90)
            if not os.path.exists(os.path.split(path)[0]):
                os.makedirs(os.path.split(path)[0])
            cropped.save(path + output)
            if suffix != None and suffix != "_1.png":
                return output, cropped.size
            prop = path.split("/")[2]
            if prop not in index["props"]:
                index["props"][prop] = dict()
            index["props"][prop][output] = dict()
            index["props"][prop][output]["width"] = cropped.size[0]
            index["props"][prop][output]["height"] = cropped.size[1]
            if verbosity > 0: print(output)
    # Blame Yogurt Cream Cookie for this
    if suffix == "_happy_ani00.png":
        return unpack_texture(file, path, "_happy_ani01.png")
    if suffix == "_sad_ani00.png":
        return unpack_texture(file, path, "_sad_ani01.png")
    return None, None

# Make initial file checks
if not os.path.exists("ccb/resources-phonehd/title.png"):
    print("This is not a valid HD Cookie Run: OvenBreak data download! Or you're in the wrong folder. Make sure you're running this script in the same folder as index.json(.enc) and /ccb, /image, etc. If you're in the right folder but don't have HD assets, get files from an emulator with higher graphics settings.")
    sys.exit(1)
if not os.path.exists("ccb/resources-phonehd/cookie0157_stand.png"):
    print("This Cookie Run: OvenBreak data download appears to be incomplete (missing example standing image). You may encounter issues!")
if not os.path.exists("kingdom/Heads/gingerbrave.png"):
    print("No Cookie Run: Kingdom files found! Please put the index/kingdom/ folder in here and merge it with a download of the Cookie folder from the fankit. (https://www.dropbox.com/sh/pkmdawhvj08rmxf/AAAT2UqHoRw1gfw239xaLiz1a/03.%20Cookie?dl=0)")
    sys.exit(1)
if not os.path.exists("kingdom/GingerBrave/default.png"):
    print("No Cookie Run: Kingdom fankit download found. You may encounter issues!")

# Initialize index
index = dict()
index_old = False
if os.path.exists("index.js"):
    with open("index.js") as js:
        data = js.read()
        obj = data[data.find("{") : data.rfind("}") + 1]
        index_old = json.loads(obj)
        print("Loaded index.js successfully!")
index["cookies"] = dict()
index["cookies"]["ovenbreak"] = dict()
index["cookies"]["kingdom"] = dict()
index["pets"] = []
index["props"] = dict()
index["backgrounds"] = dict()
index["backgrounds"]["game"] = []
index["backgrounds"]["basic"] = []

# Load data files
forbidden = []
if os.path.exists("forbidden.txt"):
    with open("forbidden.txt") as txt:
        forbidden = txt.read().split("\n")
npcs = []
if os.path.exists("npcs.txt"):
    with open("npcs.txt") as txt:
        npcs = txt.read().split("\n")
cutscenebgs = []
if os.path.exists("cutscenebgs.txt"):
    with open("cutscenebgs.txt") as txt:
        cutscenebgs = txt.read().split("\n")

# Load verbosity argument (0 = only system messages, 1 = list all new files, 2 = list all files)
if len(sys.argv) > 1 and isnumeric(sys.argv[1]):
    verbosity = int(sys.argv[1])
else:
    verbosity = 1

# Walk through and parse all /ccb files
cutscene = re.compile("ccb/cutscene([0-9]{4}|_land)/resources-phonehd/cookie[0-9]{4}.+\\.png")
duelloading = re.compile("ccb/cookieAni_duelLoading/resources-phonehd/cookie[0-9]{4}(z[0-9]{2})?_duelLoading\\.png")
duelwin = re.compile("ccb/cookieAni_duelWin/resources-phonehd/cookie[0-9]{4}(z[0-9]{2})?_duelWin\\.png")
exhausted = re.compile("ccb/cookie_exhausted/resources-phonehd/cookie[0-9]{4}(z[0-9]{2})?_shop_exhausted\\.png")
head = re.compile("ccb/cookieHead/resources-phonehd/cookie[0-9]{4}_head\\.png")
stand = re.compile("ccb/resources-phonehd/cookie[0-9]{4}(z[0-9]{2})?_stand\\.png")
state = re.compile("ccb/resources-phonehd/cookie[0-9]{4}(z[0-9]{2})?_state\\.png")
pet = re.compile("ccb/pet/resources-phonehd/pet[0-9]{4}(z[0-9]{2})?_shop\\.png")
treasure = re.compile("ccb/treasure/resources-phonehd/tr[0-9]{4}.png")
loadingbackgrounds = re.compile("ccb/loadingBackgrounds/resources-phonehd")
lobbyskin = re.compile("ccb/lobbySkinImages/resources-phonehd/bg_lobby_skin[0-9]+\\.png")
cutscenebackgrounds = re.compile("ccb/cutscene[0-9]{4}/resources-phonehd/(img_)?cutscenc?e[0-9]{4}_[0-9]{2}.*\\.png")
for subdir, dirs, files in os.walk("ccb"):
    for file in files:
        if forbidden and file in forbidden:
            continue
        path = os.path.join(subdir, file).replace("\\", "/")
        cookie = file[0:10]
        if path in npcs:
            if "npc" not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"]["npc"] = dict()
                index["cookies"]["ovenbreak"]["npc"]["cutscene"] = dict()
                index["cookies"]["ovenbreak"]["npc"]["gameplay"] = dict()
            if index_old and file in index_old["cookies"]["ovenbreak"]["npc"]:
                index["cookies"]["ovenbreak"]["npc"]["cutscene"][file] = index_old["cookies"]["ovenbreak"]["npc"][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            width = im.size[0]
            if path == "ccb/cutscene6001/resources-phonehd/a_hermit_carb_embarrassed.png": # Random floating pixels
                im = im.crop((142, 129, 359, 385))
            else:
                im = trim(im)
            if not os.path.exists("img/cookies/npc"):
                os.makedirs("img/cookies/npc")
            im.save("img/cookies/npc/" + file)
            index["cookies"]["ovenbreak"]["npc"]["cutscene"][file] = dict()
            if width > 700:
                index["cookies"]["ovenbreak"]["npc"]["cutscene"][file]["width"] = round(im.size[0] / 4)
                index["cookies"]["ovenbreak"]["npc"]["cutscene"][file]["height"] = round(im.size[1] / 4)
            else:
                index["cookies"]["ovenbreak"]["npc"]["cutscene"][file]["width"] = round(im.size[0] / 2)
                index["cookies"]["ovenbreak"]["npc"]["cutscene"][file]["height"] = round(im.size[1] / 2)
            if verbosity > 0: print(file)
        elif cutscene.match(path):
            if path == "ccb/cutscene9006/resources-phonehd/cookie0145_AUFKM.png":
                cookie = "cookie0144"
                file = "cookie0144_AUFKM_old.png"
            elif path == "ccb/cutscene_land/resources-phonehd/cookie00002_touching.png":
                cookie = "cookie0002"
                file = "cookie0002_touching.png"
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            if index_old and file in index_old["cookies"]["ovenbreak"][cookie]:
                index["cookies"]["ovenbreak"][cookie]["cutscene"][file] = index_old["cookies"]["ovenbreak"][cookie][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            width = im.size[0]
            # I don't know why but certain sprites don't like my automatic cropping function, it doesn't even appear to be random floating pixels since my image editing programs can do it just fine
            if path == "ccb/cutscene_land/resources-phonehd/cookie0026_embrassed.png":
                im = im.crop((87, 14, 424, 393))
            if path == "ccb/cutscene_land/resources-phonehd/cookie0026_sorry.png":
                im = im.crop((94, 21, 431, 387))
            elif path == "ccb/cutscene9004/resources-phonehd/cookie0026_embarrassed.png":
                im = im.crop((77, 42, 423, 415))
            elif path == "ccb/cutscene9003/resources-phonehd/cookie0016_ghost_smile.png":
                im = im.crop((109, 12, 397, 434))
            elif path == "ccb/cutscene9003/resources-phonehd/cookie0016_ghost_standard.png":
                im = im.crop((76, 12, 397, 434))
            elif path == "ccb/cutscene9015/resources-phonehd/cookie0065_determination.png":
                im = im.crop((92, 1, 456, 435))
            else:
                im = trim(im)
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            index["cookies"]["ovenbreak"][cookie]["cutscene"][file] = dict()
            if width > 700:
                index["cookies"]["ovenbreak"][cookie]["cutscene"][file]["width"] = round(im.size[0] / 4)
                index["cookies"]["ovenbreak"][cookie]["cutscene"][file]["height"] = round(im.size[1] / 4)
            else:
                index["cookies"]["ovenbreak"][cookie]["cutscene"][file]["width"] = round(im.size[0] / 2)
                index["cookies"]["ovenbreak"][cookie]["cutscene"][file]["height"] = round(im.size[1] / 2)
            if verbosity > 0: print(file)
        elif duelloading.match(path) or duelwin.match(path):
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            if index_old and file in index_old["cookies"]["ovenbreak"][cookie]:
                index["cookies"]["ovenbreak"][cookie]["gameplay"][file] = index_old["cookies"]["ovenbreak"][cookie][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            # Blame Yogurt Cream Cookie for this too
            if path == "ccb/cookieAni_duelLoading/resources-phonehd/cookie0140z02_duelLoading.png":
                im = im.crop((59, 56, 671, 724))
            elif path == "ccb/cookieAni_duelWin/resources-phonehd/cookie0048_duelWin.png":
                im = im.crop((191, 223, 724, 756))
            elif path == "ccb/cookieAni_duelWin/resources-phonehd/cookie0065_duelWin.png":
                im = im.crop((0, 155, 687, 771))
            else:
                im = trim(im)
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file] = dict()
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file]["width"] = round(im.size[0] / 3)
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file]["height"] = round(im.size[1] / 3)
            if verbosity > 0: print(file)
        elif exhausted.match(path):
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            if index_old and file in index_old["cookies"]["ovenbreak"][cookie]:
                index["cookies"]["ovenbreak"][cookie]["gameplay"][file] = index_old["cookies"]["ovenbreak"][cookie][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            im = trim(im)
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file] = dict()
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file]["width"] = round(im.size[0])
            index["cookies"]["ovenbreak"][cookie]["gameplay"][file]["height"] = round(im.size[1])
            if verbosity > 0: print(file)
        elif head.match(path):
            if os.path.exists("img/heads/" + file):
                if verbosity > 1: print(file + " (skipped)")
                continue
            if not os.path.exists("img/heads"):
                os.makedirs("img/heads")
            copyfile(path, "img/heads/" + file)
            if verbosity > 0: print(file)
        elif stand.match(path):
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            if index_old and file in index_old["cookies"]["ovenbreak"][cookie]:
                index["cookies"]["ovenbreak"][cookie]["gameplay"][file] = index_old["cookies"]["ovenbreak"][cookie][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            shop, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_shop.png")
            index["cookies"]["ovenbreak"][cookie]["gameplay"][shop] = dict()
            index["cookies"]["ovenbreak"][cookie]["gameplay"][shop]["width"] = round(size[0] * 0.875)
            index["cookies"]["ovenbreak"][cookie]["gameplay"][shop]["height"] = round(size[1] * 0.875)
        elif state.match(path):
            if cookie not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][cookie] = dict()
                index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
            if path != "ccb/resources-phonehd/cookie0057_state.png" and path != "ccb/resources-phonehd/cookie0065z01_state.png" and path != "ccb/resources-phonehd/cookie0065z02_state.png":
                happy, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_happy_ani00.png")
                if happy != None:
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][happy] = dict()
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][happy]["width"] = round(size[0] * 0.875)
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][happy]["height"] = round(size[1] * 0.875)
                    if verbosity > 0: print(happy)
            # Devsisters Co., Ltd. *laugh track*
            if path == "ccb/resources-phonehd/cookie0033z02_state.png":
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_san_ani00.png")
            elif path == "ccb/resources-phonehd/cookie0043_state.png":
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_ani00.png")
            elif path == "ccb/resources-phonehd/cookie0038z01_state.png" or path == "ccb/resources-phonehd/cookie0056z01_state.png" or path == "ccb/resources-phonehd/cookie0144_state.png" or path == "ccb/resources-phonehd/cookie0144z01_state.png" or path == "ccb/resources-phonehd/cookie0144z02_state.png": # Duplicate poses
                continue
            else:
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_sad_ani00.png")
            if sad != None:
                index["cookies"]["ovenbreak"][cookie]["gameplay"][sad] = dict()
                index["cookies"]["ovenbreak"][cookie]["gameplay"][sad]["width"] = round(size[0] * 0.875)
                index["cookies"]["ovenbreak"][cookie]["gameplay"][sad]["height"] = round(size[1] * 0.875)
                if verbosity > 0: print(sad)
        elif pet.match(path):
            if index_old and file in index_old["pets"]:
                index["pets"].append(file)
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            im = trim(im)
            if not os.path.exists("img/pets"):
                os.makedirs("img/pets")
            im.save("img/pets/" + file)
            index["pets"].append(file)
            if verbosity > 0: print(file)
        elif treasure.match(path):
            if "treasure" not in index["props"]:
                index["props"]["treasure"] = dict()
            if index_old and file in index_old["props"]["treasure"]:
                index["props"]["treasure"][file] = index_old["props"]["treasure"][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            im = trim(im)
            if not os.path.exists("img/props/treasure"):
                os.makedirs("img/props/treasure")
            im.save("img/props/treasure/" + file)
            index["props"]["treasure"][file] = dict()
            index["props"]["treasure"][file]["width"] = im.size[0]
            index["props"]["treasure"][file]["height"] = im.size[1]
            if verbosity > 0: print(file)
        elif loadingbackgrounds.match(path) or lobbyskin.match(path):
            if index_old and file in index_old["backgrounds"]["game"]:
                index["backgrounds"]["game"].append(file)
                if verbosity > 1: print(file + " (skipped)")
                continue
            im = Image.open(path)
            im = im.convert("RGB") # Not converting images to RGB leads PIL to only use nearest neighbor scaling, which doesn't look nearly as good
            height_percent = 320 / float(im.size[1])
            width_size = int((float(im.size[0]) * float(height_percent)))
            im = im.resize((width_size, 320), PIL.Image.BILINEAR)
            if im.size[0] != 454:
                left = (im.size[0] - 454) / 2
                im = im.crop((left, 0, left + 454, im.size[1]))
            if not os.path.exists("img/backgrounds"):
                os.makedirs("img/backgrounds")
            im.save("img/backgrounds/" + file)
            index["backgrounds"]["game"].append(file)
            if verbosity > 0: print(file)
        elif cutscenebackgrounds.match(path):
            # Usable cutscene backgrounds are rare enough that we grab them from a whitelist instead of a blacklist
            if file in cutscenebgs:
                if index_old and file in index_old["backgrounds"]["game"]:
                    index["backgrounds"]["game"].append(file)
                    if verbosity > 1: print(file + " (skipped)")
                    continue
                im = Image.open(path)
                im = im.convert("RGB")
                height_percent = 320 / float(im.size[1])
                width_size = int((float(im.size[0]) * float(height_percent)))
                im = im.resize((width_size, 320), PIL.Image.BILINEAR)
                if im.size[0] != 454:
                    left = (im.size[0] - 454) / 2
                    im = im.crop((left, 0, left + 454, im.size[1]))
                if not os.path.exists("img/backgrounds"):
                    os.makedirs("img/backgrounds")
                im.save("img/backgrounds/" + file)
                index["backgrounds"]["game"].append(file)
                if verbosity > 0: print(file)

# Unpack gameplay sprites
animations = ["bend", "crash", "exhausted", "extra 1", "extra 2", "extra 3", "extra 4", "extra 5", "extra 6", "extra slide", "fever end fall start", "fever start 1", "fever start 2", "fever start 3", "fever start 4", "slide", "slide2", "transform end", "transform flight", "transform jump", "transform run", "transform start"]
large = ["cookie0051", "cookie0109", "cookie0112", "cookie0122", "cookie0140", "cookie0141", "cookie0142", "cookie0145", "cookie0150", "cookie0152", "cookie0154", "cookie0155", "cookie0158", "cookie0161", "cookie0163", "cookie0170", "cookie0179", "cookie0182", "cookie0187", "cookie0189", "cookie0190", "cookie0191", "cookie0517", "cookie0522"] # Some cookies' gameplay sprites are randomly really big compared to their shop sprites, so we adjust for that with this array
small = ["cookie0049", "cookie0057", "cookie0064", "cookie0065", "cookie0070", "cookie0109", "cookie0125", "cookie0155", "cookie0158", "cookie0166", "cookie0178"] # And some cookies' sprites go over our height limit in weird, inconsisent ways that need to be excluded
for subdir, dirs, files in os.walk("image/cookie/resources-common"):
    for file in files:
        if forbidden and file in forbidden:
            continue
        if file.endswith("x2_aniinfo.plist"):
            path = os.path.join(subdir, file).replace("\\", "/")
            root = ElementTree.fromstring(open(path, "r").read())
            plist_dict = tree_to_dict(root[0])
            for key, animation in plist_dict["animationlist"].items():
                if key not in animations or len(animation["FrameList"]) == 0:
                    continue
                cookie = file[0:10]
                if index_old and plist_dict["framelist"][animation["FrameList"][0]] in index_old["cookies"]["ovenbreak"][cookie]:
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][plist_dict["framelist"][animation["FrameList"][0]]] = index_old["cookies"]["ovenbreak"][cookie][plist_dict["framelist"][animation["FrameList"][0]]]
                    if verbosity > 1: print(plist_dict["framelist"][animation["FrameList"][0]] + " (skipped)")
                    continue
                if key == "fever start 3":
                    if cookie in ["cookie0061", "cookie0066", "cookie0067", "cookie0068", "cookie0108", "cookie0112", "cookie0125", "cookie0134", "cookie0140", "cookie0143", "cookie0154", "cookie0156", "cookie0161", "cookie0169", "cookie0171", "cookie0184", "cookie0185", "cookie0522"]:
                        output, size = unpack_texture(path.replace("_aniinfo.plist", ".png"), "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][2]])
                    elif cookie in ["cookie0109", "cookie0137", "cookie0145", "cookie0182"]:
                        output, size = unpack_texture(path.replace("_aniinfo.plist", ".png"), "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][0]])
                    elif cookie in ["cookie0151", "cookie0157"]:
                        output, size = unpack_texture(path.replace("_aniinfo.plist", ".png"), "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][3]])
                    else:
                        output, size = unpack_texture(path.replace("_aniinfo.plist", ".png"), "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][1]])
                else:
                    output, size = unpack_texture(path.replace("_aniinfo.plist", ".png"), "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][0]])
                if output != None:
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][output] = dict()
                    if (size[1] > 292 and cookie not in small and (cookie != "cookie0067" or not output.endswith("_0091.png"))) or output == "cookie0071x2_0136.png" or output == "cookie0071x2_0138.png" or output == "cookie0071z01x2_0136.png" or output == "cookie0071x2_0138.png":
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = round(size[0] * 0.75)
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = round(size[1] * 0.75)
                    else:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = size[0]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = size[1]
                    if cookie not in large and (cookie != "cookie0009" or (file[10:3] != "z01" and file[10:13] != "z02")) and (cookie != "cookie0160" or "second" not in file):
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["resize"] = False
                    if verbosity > 0: print(output)

# Unpack cookie effect sprites
if os.path.exists("effects.json"):
    with open("effects.json") as effectsjson:
        data = effectsjson.read()
        effects = json.loads(data)
        for i in effects.keys():
            path = "image/effect_cookie/resources-common/" + i
            root = ElementTree.fromstring(open(path, "r").read())
            plist_dict = tree_to_dict(root[0])
            for key, animation in plist_dict["animationlist"].items():
                if key not in effects[i]:
                    continue
                cookie = i[0:10]
                if index_old and plist_dict["framelist"][animation["FrameList"][0]] in index_old["cookies"]["ovenbreak"][cookie]:
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][plist_dict["framelist"][animation["FrameList"][0]]] = index_old["cookies"]["ovenbreak"][cookie][plist_dict["framelist"][animation["FrameList"][0]]]
                    if verbosity > 1: print(plist_dict["framelist"][animation["FrameList"][0]] + " (skipped)")
                    continue
                output, size = unpack_texture("image/effect_cookie/resources-phonehd/" + plist_dict["texture"] + ".png", "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][0]])
                if output != None:
                    index["cookies"]["ovenbreak"][cookie]["gameplay"][output] = dict()
                    if size[1] > 292 and cookie not in small:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = round(size[0] * 0.75)
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = round(size[1] * 0.75)
                    else:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = size[0]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = size[1]
                    if cookie not in large:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["resize"] = False
                    if verbosity > 0: print(output)

# Add bonustime backgrounds
for subdir, dirs, files in os.walk("image/map_bg/resources-common"):
    for file in files:
        if forbidden and file in forbidden:
            continue
        if file.endswith("_tm101_bg_simple.png"):
            if index_old and file in index_old["backgrounds"]["game"]:
                index["backgrounds"]["game"].append(file)
                if verbosity > 1: print(file + " (skipped)")
                continue
            path = os.path.join(subdir, file).replace("\\", "/")
            output, size = unpack_texture(path, "img/backgrounds/", "_bg_simple1.png")
            if output != None:
                im = Image.open("img/backgrounds/" + output)
                im = im.convert("RGB")
                height_percent = 320 / float(size[1])
                width_size = int((float(size[0]) * float(height_percent)))
                im = im.resize((width_size, 320), PIL.Image.BILINEAR)
                left = (im.size[0] - 454) / 2
                im = im.crop((left, 0, left + 454, im.size[1]))
                im.save("img/backgrounds/" + output)
                index["backgrounds"]["game"].append(output)
                if verbosity > 0: print(output)


# Add Kingdom backgrounds
for i in range(1, 18):
    index["backgrounds"]["game"].append("bgKingdom" + str(i).rjust(2, "0") + ".png")
    if verbosity > 0: print("bgKingdom" + str(i).rjust(2, "0") + ".png")

# Add OvenBreak Infinity sprites and other sprites not in the files
if os.path.exists("extra.json"):
    with open("extra.json") as extrajson:
        data = extrajson.read()
        extra = json.loads(data)
        for i in extra["cookies"].keys():
            if i not in index["cookies"]["ovenbreak"]:
                index["cookies"]["ovenbreak"][i] = dict()
                index["cookies"]["ovenbreak"][i]["cutscene"] = dict()
                index["cookies"]["ovenbreak"][i]["gameplay"] = dict()
            for i2 in extra["cookies"][i].keys():
                index["cookies"]["ovenbreak"][i]["gameplay"][i2] = dict()
                index["cookies"]["ovenbreak"][i]["gameplay"][i2]["width"] = extra["cookies"][i][i2]["width"]
                index["cookies"]["ovenbreak"][i]["gameplay"][i2]["height"] = extra["cookies"][i][i2]["height"]
                if "resize" in extra["cookies"][i][i2]:
                    index["cookies"]["ovenbreak"][i]["gameplay"][i2]["resize"] = extra["cookies"][i][i2]["resize"]
                if verbosity > 0: print(i2)
        for i in extra["backgrounds"]:
            if i not in index["backgrounds"]["game"]:
                index["backgrounds"]["game"].append(i)
                if verbosity > 0: print(i)

# Unpack props
if not os.path.exists("img/props/effect"):
    os.makedirs("img/props/effect")
unpack_texture("image/etc/resources-phonehd/effect.png", "img/props/effect/", None)
if not os.path.exists("img/props/jelly"):
    os.makedirs("img/props/jelly")
unpack_texture("image/jelly/resources-phonehd/basic_jelly.png", "img/props/jelly/", None)
unpack_texture("image/jelly/resources-phonehd/bear_jelly.png", "img/props/jelly/", None)
output, size = unpack_texture("image/jelly/resources-phonehd/jelly_bearrainbow_fly.png", "img/props/jelly/", "fly01.png")
index["props"]["jelly"][output] = dict()
index["props"]["jelly"][output]["width"] = size[0]
index["props"]["jelly"][output]["height"] = size[1]
if verbosity > 0: print(output)
unpack_texture("image/jelly/resources-phonehd/playing_jelly.png", "img/props/jelly/", "_1.png")
bonustime = ["m2", "b0", "c", "i2", "e0", "f", "g", "b2", "i0", "j", "k", "o1", "m0", "n0", "o0", "n2", "q", "r", "s0", "t0", "u0", "u1", "w", "x", "t1", "z", "e1", "o2", "n1", "u2", "e2"]
for letter in bonustime:
    output, size = unpack_texture("image/jelly/resources-phonehd/fever_jelly.png", "img/props/jelly/", "_" + letter + ".png")
    index["props"]["jelly"][output] = dict()
    index["props"]["jelly"][output]["width"] = size[0]
    index["props"]["jelly"][output]["height"] = size[1]
    if verbosity > 0: print(output)

# Create basic color backgrounds
colors = {"red": (255, 224, 224), "aqua": (224, 255, 255), "yellow": (255, 255, 224), "green": (224, 255, 224), "orange": (255, 224, 192), "pink": (255, 208, 255), "purple": (224, 192, 255), "blue": (176, 208, 255), "brown": (192, 160, 128), "gray": (224, 224, 224), "darkgray": (160, 160, 160), "black": (0, 0, 0)}
for color in colors.items():
    if index_old and "img/backgrounds/bg_basic_" + color[0] + ".png" in index_old["backgrounds"]["basic"]:
        index["backgrounds"]["basic"].append("bg_basic_" + color[0] + ".png")
        if verbosity > 1: print("bg_basic_" + color[0] + ".png (skipped)")
        continue
    im = Image.new("RGB", (454, 320), color[1])
    im.save("img/backgrounds/bg_basic_" + color[0] + ".png")
    index["backgrounds"]["basic"].append("bg_basic_" + color[0] + ".png")
    if verbosity > 0: print("bg_basic_" + color[0] + ".png")
# Create gradients: white-darkgray, white-red, white-blue, white-yellow, white-green, white-pink, blue-pink, blue-green, orange-green, orange-pink, yellow-brown, aqua-blue
white = (255, 255, 255)
gradients = ([white, colors["darkgray"]], [white, (255, 192, 192)], [white, colors["blue"]], [white, (255, 255, 192)], [white, (192, 255, 192)], [white, colors["pink"]], [(192, 224, 255), colors["pink"]], [colors["blue"], (192, 255, 192)], [colors["orange"], (160, 255, 192)], [colors["pink"], (255, 224, 160)], [(255, 255, 192), colors["brown"]], [colors["aqua"], (128, 192, 255)])
i = 1
for gradient in gradients:
    if index_old and "bg_basic_gradient" + str(i) + ".png" in index_old["backgrounds"]["basic"]:
        index["backgrounds"]["basic"].append("bg_basic_gradient" + str(i) + ".png")
        if verbosity > 1: print("bg_basic_gradient" + str(i) + ".png (skipped)")
        i += 1
        continue
    im = Image.new("RGB", (454, 320), gradient[0])
    draw = ImageDraw.Draw(im)
    for y in range(106, 320):
        draw.line([(0, y), (453, y)], fill=gradient_fill(1, 2, (y - 106) / 214 + 1, gradient))
    im.save("img/backgrounds/bg_basic_gradient" + str(i) + ".png")
    index["backgrounds"]["basic"].append("bg_basic_gradient" + str(i) + ".png")
    if verbosity > 0: print("bg_basic_gradient" + str(i) + ".png")
    i += 1

# Add Kakao sprites if available
if os.path.exists("Patch"):
    ch = re.compile("Patch/kakaoBC_SD/ch[0-9]{2}(_.+)?x2\\.png")
    intros = ["intro_epN04.png", "intro_epN05.png", "intro_epS01.png", "intro_epS02.png"]
    intro_suffixes = {"intro_epN04.png": "intro_epN04_back.png", "intro_epN05.png": "intro_epN05_bg.png", "intro_epS01.png": "intro_epS01_bg.png", "intro_epS02.png": "intro_epS02_1.png"}
    cookies = ["ch04", "ch05", "ch06", "ch10", "ch14", "ch21", "ch22"]
    # TODO: Add Halloween costumes
    for subdir, dirs, files in os.walk("Patch"):
        for file in files:
            if forbidden and file in forbidden:
                continue
            path = os.path.join(subdir, file).replace("\\", "/")
            if path.startswith("Patch/kakaoBC_HD/tr_"):
                im = Image.open(path)
                im = trim(im)
                if not os.path.exists("img/props/treasure"):
                    os.makedirs("img/props/treasure")
                im.save("img/props/treasure/" + file)
                if "treasure" not in index["props"]:
                    index["props"]["treasure"] = dict()
                index["props"]["treasure"][file] = dict()
                index["props"]["treasure"][file]["width"] = im.size[0]
                index["props"]["treasure"][file]["height"] = im.size[1]
            elif ch.match(path) and file[0:4] in cookies:
                cookie = file[0:4].replace("ch", "cookie00")
                if cookie not in index["cookies"]["ovenbreak"]:
                    index["cookies"]["ovenbreak"][cookie] = dict()
                    index["cookies"]["ovenbreak"][cookie]["cutscene"] = dict()
                    index["cookies"]["ovenbreak"][cookie]["gameplay"] = dict()
                # Animation list 1 (general)
                root = ElementTree.fromstring(open(path.replace(".png", "_1_aniinfo.plist"), "r").read())
                plist_dict = tree_to_dict(root[0])
                i = 0
                animations = [4, 6, 14, 17, 23, 24, 25]
                for animation in plist_dict["animationlist"]:
                    if len(animation["FrameList"]) == 0 or i not in animations:
                        i += 1
                        continue
                    if index_old and plist_dict["framelist"][animation["FrameList"][0]] in index_old["cookies"]["ovenbreak"][cookie]:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][plist_dict["framelist"][animation["FrameList"][0]]] = index_old["cookies"]["ovenbreak"][cookie][plist_dict["framelist"][animation["FrameList"][0]]]
                        if verbosity > 1: print(plist_dict["framelist"][animation["FrameList"][0]] + " (skipped)")
                        i += 1
                        continue
                    output, size = unpack_texture(path, "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][0]])
                    if output != None:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output] = dict()
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = size[0]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = size[1]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["resize"] = False
                        if verbosity > 0: print(output)
                    i += 1
                # Animation list 2 (bonustime)
                root = ElementTree.fromstring(open(path.replace(".png", "_2_aniinfo.plist"), "r").read())
                plist_dict = tree_to_dict(root[0])
                i = 0
                animations = [1, 2, 3, 4, 8]
                for animation in plist_dict["animationlist"]:
                    if len(animation["FrameList"]) == 0 or i not in animations:
                        i += 1
                        continue
                    if index_old and plist_dict["framelist"][animation["FrameList"][0]] in index_old["cookies"]["ovenbreak"][cookie]:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][plist_dict["framelist"][animation["FrameList"][0]]] = index_old["cookies"]["ovenbreak"][cookie][plist_dict["framelist"][animation["FrameList"][0]]]
                        if verbosity > 1: print(plist_dict["framelist"][animation["FrameList"][0]] + " (skipped)")
                        i += 1
                        continue
                    if i == 3:
                        output, size = unpack_texture(path, "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][1]])
                    else:
                        output, size = unpack_texture(path, "img/cookies/" + cookie + "/", plist_dict["framelist"][animation["FrameList"][0]])
                    if output != None:
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output] = dict()
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["width"] = size[0]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["height"] = size[1]
                        index["cookies"]["ovenbreak"][cookie]["gameplay"][output]["resize"] = False
                        if verbosity > 0: print(output)
                    i += 1
            elif file in intros and not path.startswith("Patch/kakaoBC_SD"):
                output, size = unpack_texture(path, "img/backgrounds/", intro_suffixes[file])
                if output != None:
                    im = Image.open("img/backgrounds/" + output)
                    im = im.convert("RGB")
                    height_percent = 320 / float(size[1])
                    width_size = int((float(size[0]) * float(height_percent)))
                    im = im.resize((width_size, 320), PIL.Image.BILINEAR)
                    left = (im.size[0] - 454) / 2
                    im = im.crop((left, 0, left + 454, im.size[1]))
                    im.save("img/backgrounds/" + output)
                    index["backgrounds"]["game"].append(output)
                    if verbosity > 0: print(output)
    pets = ["pet03", "pet04", "pet05", "pet07", "pet08", "pet09", "pet10", "pet14", "pet19", "pet27", "pet29", "pet30", "pet32", "pet39", "pet43", "pet44", "pet49", "pet57", "pet62", "pet65", "pet68", "pet901", "pet902"]
    root = ElementTree.fromstring(open("Patch/kakaoBC_HD/shop_item_pet.plist", "r").read())
    plist_dict = tree_to_dict(root[0])
    for key in plist_dict["frames"].keys():
        if key.split("_")[0] in pets:
            output, size = unpack_texture("Patch/kakaoBC_HD/shop_item_pet.png", "img/pets/sweetescape_", key)
            index["pets"].append("sweetescape_" + output)
            if verbosity > 0: print(output)
else:
    print("Kakao sprites not found; if you want to add those, run a data download on a copy of Cookie Run for Kakao and copy the Patch/ folder into this one, then combine it with the assets/ folder of the Cookie Run for Kakao APK.")

# Add CookieWars sprites if available
if os.path.exists("cookiewars"):
    index["cookies"]["ovenbreak"]["wars"] = dict()
    index["cookies"]["ovenbreak"]["wars"]["cutscene"] = dict()
    index["cookies"]["ovenbreak"]["wars"]["gameplay"] = dict()
    if not os.path.exists("img/cookies/wars"):
        os.makedirs("img/cookies/wars")
    for subdir, dirs, files in os.walk("cookiewars"):
        for file in files:
            if index_old and file in index_old["cookies"]["ovenbreak"]["wars"]:
                if file.startswith("cutin"):
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file] = index_old["cookies"]["ovenbreak"]["wars"][file]
                else:
                    index["cookies"]["ovenbreak"]["wars"]["gameplay"][file] = index_old["cookies"]["ovenbreak"]["wars"][file]
                if verbosity > 1: print(file + " (skipped)")
                continue
            path = os.path.join(subdir, file).replace("\\", "/")
            im = Image.open(path)
            if file.startswith("icon_big"):
                im = im.resize((256, 224), PIL.Image.BILINEAR)
            im = trim(im)
            im.save("img/cookies/wars/" + file)
            if file.startswith("cutin") or file.startswith("icon"):
                index["cookies"]["ovenbreak"]["wars"]["cutscene"][file] = dict()
                if file.startswith("cutin"):
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["width"] = round(im.size[0] / (14 / 9))
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["height"] = round(im.size[1] / (14 / 9))
                elif file.startswith("icon_unit"):
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["width"] = round(im.size[0] / 1.6)
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["height"] = round(im.size[1] / 1.6)
                else:
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["width"] = im.size[0]
                    index["cookies"]["ovenbreak"]["wars"]["cutscene"][file]["height"] = im.size[1]
            else:
                index["cookies"]["ovenbreak"]["wars"]["gameplay"][file] = dict()
                index["cookies"]["ovenbreak"]["wars"]["gameplay"][file]["width"] = im.size[0]
                index["cookies"]["ovenbreak"]["wars"]["gameplay"][file]["height"] = im.size[1]
                index["cookies"]["ovenbreak"]["wars"]["gameplay"][file]["resize"] = False
            if verbosity > 0: print(file)
else:
    print("CookieWars sprites not found! Make sure the index/cookiewars/ folder is here.")

# Add Kingdom sprites
for subdir, dirs, files in os.walk("kingdom"):
    for file in files:
        if file == "stand.png" and subdir[8:] in ["Almond Cookie", "Black Raison Cookie", "Dark Choco Cookie", "Herb Cookie", "Parfait Cookie", "Red Velvet Cookie", "Rye Cookie"]:
            continue
        path = os.path.join(subdir, file).replace("\\", "/")
        if subdir[8:] == "Heads":
            if os.path.exists("img/heads/kingdom/" + file):
                if verbosity > 1: print(path + " (skipped)")
                continue
            im = Image.open(path)
            padded = Image.new("RGBA", (150, 150))
            padded.paste(im, (math.ceil((150 - im.size[0]) / 2), math.floor((150 - im.size[1]) / 2)))
            if not os.path.exists("img/heads/kingdom"):
                os.makedirs("img/heads/kingdom")
            padded.save("img/heads/kingdom/" + file)
            if verbosity > 0: print(path)
        elif subdir[8:] == "Treasures":
            if "treasure_kingdom" not in index["props"]:
                index["props"]["treasure_kingdom"] = dict()
            if index_old and file in index_old["props"]["treasure_kingdom"]:
                index["props"]["treasure_kingdom"][file] = index_old["props"]["treasure_kingdom"][file]
                if verbosity > 1: print(path + " (skipped)")
                continue
            if not os.path.exists("img/props/treasure_kingdom"):
                os.makedirs("img/props/treasure_kingdom")
            copyfile(path, "img/props/treasure_kingdom/" + file)
            im = Image.open(path)
            index["props"]["treasure_kingdom"][file] = dict()
            index["props"]["treasure_kingdom"][file]["width"] = im.size[0]
            index["props"]["treasure_kingdom"][file]["height"] = im.size[1]
            if verbosity > 0: print(path)
        elif subdir[8:] == "Relics":
            if "relic" not in index["props"]:
                index["props"]["relic"] = dict()
            if index_old and file in index_old["props"]["relic"]:
                index["props"]["relic"][file] = index_old["props"]["relic"][file]
                if verbosity > 1: print(path + " (skipped)")
                continue
            if not os.path.exists("img/props/relic"):
                os.makedirs("img/props/relic")
            copyfile(path, "img/props/relic/" + file)
            im = Image.open(path)
            index["props"]["relic"][file] = dict()
            index["props"]["relic"][file]["width"] = round(im.size[0] / 2)
            index["props"]["relic"][file]["height"] = round(im.size[1] / 2)
            if verbosity > 0: print(path)
        else:
            if file == "cookie0512_stand.png":
                file = "stand.png"
            cookie = subdir[8:].replace(" Cookie", "").replace(" ", "_").lower()
            if cookie not in index["cookies"]["kingdom"]:
                index["cookies"]["kingdom"][cookie] = dict()
                if subdir[8:] == "Black Raison Cookie": index["cookies"]["kingdom"][cookie]["name"] = "Black Raisin Cookie"
                else: index["cookies"]["kingdom"][cookie]["name"] = subdir[8:]
            if index_old and cookie in index_old["cookies"]["kingdom"] and file in index_old["cookies"]["kingdom"][cookie]:
                index["cookies"]["kingdom"][cookie][file] = index_old["cookies"]["kingdom"][cookie][file]
                if verbosity > 1: print(path + " (skipped)")
                continue
            im = Image.open(path)
            if im.size[1] > 1300:
                factor = 6.5
            elif im.size[1] > 1000 or path == "kingdom/Pure Vanilla Cookie/hoodless.png":
                factor = 5.5
            elif path == "kingdom/NPCs/cakehound_crowned.png":
                factor = 4
            elif path == "kingdom/Sonic Cookie/default.png" or path == "kingdom/Tails Cookie/default.png":
                factor = 2.5
            elif path.startswith("kingdom/NPCs/dreggman"):
                factor = 1.5
            elif im.size[1] > 500 or path == "kingdom/NPCs/cakehound_default.png":
                factor = 2.75
            elif im.size[1] > 400 or path == "kingdom/NPCs/sherbet_sick.png":
                factor = 2.5
            elif path == "kingdom/Hollyberry Cookie/stand.png":
                factor = 2
            elif path.startswith("kingdom/NPCs/durian"):
                factor = 1
            else:
                factor = 1.5
            # Floating pixel be like: hi I'm a floating pixel
            if subdir[8:] == "Adventurer Cookie":
                if file == "embarrassed.png":
                    im = im.crop((284, 45, 1012, 1083))
                elif file == "happy.png":
                    im = im.crop((310, 0, 1023, 1084))
                elif file == "motivated.png":
                    im = im.crop((158, 0, 986, 1082))
                elif file == "relieved.png":
                    im = im.crop((299, 18, 1015, 1077))
                elif file == "sad.png":
                    im = im.crop((311, 21, 1038, 1080))
                elif file == "serious.png":
                    im = im.crop((299, 8, 1015, 1077))
                elif file == "stand.png":
                    im = im.crop((66, 17, 260, 305))
                else:
                    im = trim(im)
            else:
                im = trim(im)
            if not os.path.exists("img/cookies/kingdom/" + cookie):
                os.makedirs("img/cookies/kingdom/" + cookie)
            im.save("img/cookies/kingdom/" + cookie + "/" + file)
            index["cookies"]["kingdom"][cookie][file] = dict()
            index["cookies"]["kingdom"][cookie][file]["width"] = round(im.size[0] / factor)
            index["cookies"]["kingdom"][cookie][file]["height"] = round(im.size[1] / factor)
            if verbosity > 0: print(path)

# Prepare to add names to each cookie
names = False
if not os.path.exists("names.json"):
    print("Names.json not found! To get this file, go to https://tcrf.net/Notes:Cookie_Run:_OvenBreak and run this bookmarklet in your URL bar, as a bookmark, or in the console.\njavascript:var cookies={};Array.prototype.forEach.call(document.getElementsByTagName(\"ol\")[0].children,function(a,b){var c=a.textContent;\"(unused)\"===c||\"(skipped)\"===c||\"Banana (prototype)\"===c||\"Dino-Sour (alternate)\"===c||(![\"GingerBrave\",\"GingerBright\",\"Ginger Claus\",\"Space Doughnut\",\"Hello Kitty\",\"Mimmy\",\"Ion Cookie Robot\",\"Cookiedroid\"].includes(c)&&(c+=\" Cookie\"),cookies[\"cookie\"+(b+1).toString().padStart(4,\"0\")]=c)}),prompt(\"Copy this and put it in names.json.\",JSON.stringify(cookies))")
else:
    with open("names.json") as namesjson:
        data = namesjson.read()
        names = json.loads(data)
        print("Loaded names.json successfully!")

# Sort the index for ease of use
print("Sorting...")
sorted_index = dict()
sorted_index["cookies"] = dict()
sorted_index["cookies"]["ovenbreak"] = dict()
sorted_index["cookies"]["kingdom"] = dict()
for i in sorted(index["cookies"]["ovenbreak"].keys()):
    cookies = index["cookies"]["ovenbreak"][i]
    sorted_cookies = dict()
    if names:
        if i not in names:
            if i == "cookie0503": sorted_cookies["name"] = "Licorice Cookie"
            elif i == "cookie0517": sorted_cookies["name"] = "Almond Cookie"
            elif i == "cookie0522": sorted_cookies["name"] = "Lilac Cookie"
            elif i == "dozer": sorted_cookies["name"] = "Dozer"
            elif i == "npc": sorted_cookies["name"] = "NPCs"
            elif i == "wars": sorted_cookies["name"] = "CookieWars"
            else: sorted_cookies["name"] = input("What is the name of " + i + "? ")
            names[i] = sorted_cookies["name"]
            with open("names.json", "w") as namesjson:
                namesjson.write(json.dumps(names))
        else: sorted_cookies["name"] = names[i]
    if i != "cookie0070":
        if i + "_standard.png" in cookies["cutscene"]:
            sorted_cookies[i + "_standard.png"] = cookies["cutscene"][i + "_standard.png"]
        for i2 in sorted(cookies["cutscene"].keys()):
            if i2 not in sorted_cookies and "skin_" not in i2 and "goggles_" not in i2:
                sorted_cookies[i2] = cookies["cutscene"][i2]
        for i2 in sorted(cookies["cutscene"].keys()):
            if i2 not in sorted_cookies:
                sorted_cookies[i2] = cookies["cutscene"][i2]
    suffixes = ["_shop.png", "_state_happy_ani00.png", "_state_happy_ani01.png", "_state_sad_ani00.png", "_state_sad_ani01.png", "_duelLoading.png", "_duelWin.png", "_shop_exhausted.png"]
    for suffix in suffixes:
        if i + suffix in cookies["gameplay"]:
            sorted_cookies[i + suffix] = cookies["gameplay"][i + suffix]
    if i == "cookie0070":
        sorted_cookies["cookie0070_exhausted.png"] = cookies["cutscene"]["cookie0070_exhausted.png"]
    for i2 in sorted(cookies["gameplay"].keys()):
        if not i2.startswith(i + "z") and i2 not in sorted_cookies and "_effect" not in i2:
            sorted_cookies[i2] = cookies["gameplay"][i2]
    for i2 in sorted(cookies["gameplay"].keys()):
        if not i2.startswith(i + "z") and i2 not in sorted_cookies:
            sorted_cookies[i2] = cookies["gameplay"][i2]
    for i2 in chain(range(1, 8), [99]):
        costume = "z" + str(i2).rjust(2, "0")
        for suffix in suffixes:
            if i + costume + suffix in cookies["gameplay"]:
                sorted_cookies[i + costume + suffix] = cookies["gameplay"][i + costume + suffix]
            if i == "cookie0070" and suffix == "_shop.png":
                if i2 == 2:
                    sorted_cookies["cookie0070_standard.png"] = cookies["cutscene"]["cookie0070_standard.png"]
                    sorted_cookies["cookie0070z02_fight.png"] = cookies["cutscene"]["cookie0070z02_fight.png"]
                elif i2 == 3:
                    for i3 in sorted(cookies["cutscene"].keys()):
                        if i3 not in sorted_cookies:
                            sorted_cookies[i3] = cookies["cutscene"][i3]
        for i2 in sorted(cookies["gameplay"].keys()):
            if costume in i2 and i2 not in sorted_cookies and "_effect" not in i2:
                sorted_cookies[i2] = cookies["gameplay"][i2]
        for i2 in sorted(cookies["gameplay"].keys()):
            if costume in i2 and i2 not in sorted_cookies:
                sorted_cookies[i2] = cookies["gameplay"][i2]
    for i2 in sorted(cookies["gameplay"].keys()):
        if i2 not in sorted_cookies:
            sorted_cookies[i2] = cookies["gameplay"][i2]
    sorted_index["cookies"]["ovenbreak"][i] = sorted_cookies
for i in sorted(index["cookies"]["kingdom"].keys()):
    if i == "npcs":
        continue
    cookies = index["cookies"]["kingdom"][i]
    sorted_cookies = dict()
    sorted_cookies["name"] = cookies["name"]
    if "stand.png" in cookies:
        sorted_cookies["stand.png"] = cookies["stand.png"]
    if "default.png" in cookies:
        sorted_cookies["default.png"] = cookies["default.png"]
    for i2 in sorted(cookies.keys()):
        if "costume" not in i2 and i2 not in sorted_cookies:
            sorted_cookies[i2] = cookies[i2]
    for i2 in sorted(cookies.keys()):
        if i2 not in sorted_cookies:
            sorted_cookies[i2] = cookies[i2]
    sorted_index["cookies"]["kingdom"][i] = sorted_cookies
sorted_index["cookies"]["kingdom"]["npcs"] = index["cookies"]["kingdom"]["npcs"]
sorted_index["pets"] = sorted(index["pets"])
sorted_index["props"] = dict()
for i in sorted(index["props"].keys()):
    sorted_index["props"][i] = index["props"][i]
sorted_index["backgrounds"] = dict()
sorted_index["backgrounds"]["game"] = sorted(index["backgrounds"]["game"])
sorted_index["backgrounds"]["basic"] = index["backgrounds"]["basic"]
with open("index.js", "w") as js:
    js.write("var index = " + json.dumps(sorted_index, ensure_ascii=False) + ";")
print("Done!")