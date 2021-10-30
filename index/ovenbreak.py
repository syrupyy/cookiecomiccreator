#!/usr/bin/env python

# Cookie Comic Creator image formatter for Cookie Run: OvenBreak, by syrupyy
# To use this, put the script in the root folder of a CROB data download ((data/)data/com.devsisters.gb/files/download/ on an Android filesystem, usually merged with assets/release/ from a Google Play asset pack), then run it via the command line (python ovenbreak.py)
from PIL import Image, ImageChops
from shutil import copyfile
from xml.etree import ElementTree
import json
import os
import PIL
import re
import sys

# Define tree to dictionary function
def tree_to_dict(tree):
    d = {}
    for index, item in enumerate(tree):
        if item.tag == 'key':
            if tree[index + 1].tag == 'string':
                d[item.text] = tree[index + 1].text
            elif tree[index + 1].tag == 'true':
                d[item.text] = True
            elif tree[index + 1].tag == 'false':
                d[item.text] = False
            elif tree[index + 1].tag == 'integer':
                d[item.text] = int(tree[index + 1].text);
            elif tree[index + 1].tag == 'dict':
                d[item.text] = tree_to_dict(tree[index + 1])
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
            cropped = im.crop((int(float(rectlist[0])), int(float(rectlist[1])), int(float(rectlist[0])) + width, int(float(rectlist[1])) + height))
            if frame["rotated"]:
                cropped = cropped.transpose(Image.ROTATE_90)
            if not os.path.exists(os.path.split(path)[0]):
                os.makedirs(os.path.split(path)[0])
            cropped.save(path + output)
            if suffix != None:
                return output, cropped.size
            prop = path.split("/")[2]
            if prop not in index["props"]:
                index["props"][prop] = dict()
            index["props"][prop][output] = dict()
            index["props"][prop][output]["width"] = cropped.size[0]
            index["props"][prop][output]["height"] = cropped.size[1]
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
    print("This data download appears to be incomplete (missing example standing image). You may encounter issues!")

# Initialize index
index = dict()
if os.path.exists("index.js"):
    with open("index.js") as js:
        data = js.read()
        obj = data[data.find("{") : data.rfind("}") + 1]
        index = json.loads(obj)
        print("Loaded index.js successfully!")
else:
    index["cookies"] = dict()
    index["pets"] = []
    index["props"] = dict()
    index["backgrounds"] = []
forbidden = []
if os.path.exists("forbidden.txt"):
    with open("forbidden.txt") as txt:
        forbidden = txt.read().split("\n")
cutscenebgs = []
if os.path.exists("cutscenebgs.txt"):
    with open("cutscenebgs.txt") as txt:
        cutscenebgs = txt.read().split("\n")

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
            # This is mainly for getting rid of unusable backgrounds but if you want to use this to get rid of cookie/other sprites just delete the old index
            if file in index["backgrounds"]:
                index["backgrounds"].remove(file)
            continue
        path = os.path.join(subdir, file).replace("\\", "/")
        if cutscene.match(path):
            im = Image.open(path)
            width = im.size[0]
            # I don't know why but certain sprites don't like my automatic cropping function
            if path == "ccb/cutscene_land/resources-phonehd/cookie0026_embrassed.png":
                im = im.crop((87, 14, 424, 393))
            if path == "ccb/cutscene_land/resources-phonehd/cookie0026_sorry.png":
                im = im.crop((94, 21, 431, 387))
            elif path == "ccb/cutscene9004/resources-phonehd/cookie0026_embarrassed.png":
                im = im.crop((77, 42, 423, 415))
            elif path == "ccb/cutscene9015/resources-phonehd/cookie0065_determination.png":
                im = im.crop((92, 1, 456, 435))
            else:
                im = trim(im)
            cookie = file[0:10]
            if path == "ccb/cutscene9006/resources-phonehd/cookie0145_AUFKM.png":
                cookie = "cookie0144"
                file = "cookie0144_AUFKM_old.png"
            elif path == "ccb/cutscene_land/resources-phonehd/cookie00002_touching.png":
                cookie = "cookie0002"
                file = "cookie0002_touching.png"
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][file] = dict()
            if width > 700:
                index["cookies"][cookie][file]["width"] = im.size[0] / 4
                index["cookies"][cookie][file]["height"] = im.size[1] / 4
            else:
                index["cookies"][cookie][file]["width"] = im.size[0] / 2
                index["cookies"][cookie][file]["height"] = im.size[1] / 2
            print(file)
        elif duelloading.match(path) or duelwin.match(path):
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
            cookie = file[0:10]
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][file] = dict()
            index["cookies"][cookie][file]["width"] = im.size[0] / 3
            index["cookies"][cookie][file]["height"] = im.size[1] / 3
            print(file)
        elif exhausted.match(path):
            im = Image.open(path)
            im = trim(im)
            cookie = file[0:10]
            if not os.path.exists("img/cookies/" + cookie):
                os.makedirs("img/cookies/" + cookie)
            im.save("img/cookies/" + cookie + "/" + file)
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][file] = dict()
            index["cookies"][cookie][file]["width"] = im.size[0] * 0.875
            index["cookies"][cookie][file]["height"] = im.size[1] * 0.875
        elif head.match(path):
            # Used to resize these on the server but it makes so little size difference that it looks better to do it at the CSS level instead
            #im = Image.open(path)
            #im = im.convert("RGBA")
            #im = im.resize((52, 52), PIL.Image.BILINEAR)
            if not os.path.exists("img/heads"):
                os.makedirs("img/heads")
            #im.save("img/heads/" + file)
            copyfile(path, "img/heads/" + file)
            print(file)
        elif stand.match(path):
            cookie = file[0:10]
            shop, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_shop.png")
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][shop] = dict()
            index["cookies"][cookie][shop]["width"] = size[0] * 0.875
            index["cookies"][cookie][shop]["height"] = size[1] * 0.875
        elif state.match(path):
            cookie = file[0:10]
            if path != "ccb/resources-phonehd/cookie0057_state.png" and path != "ccb/resources-phonehd/cookie0065z02_state.png":
                happy, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_happy_ani00.png")
                if cookie not in index["cookies"]:
                    index["cookies"][cookie] = dict()
                index["cookies"][cookie][happy] = dict()
                index["cookies"][cookie][happy]["width"] = size[0] * 0.875
                index["cookies"][cookie][happy]["height"] = size[1] * 0.875
            # Devsisters Co., Ltd. *laugh track*
            if path == "ccb/resources-phonehd/cookie0033z02_state.png":
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_san_ani00.png")
            elif path == "ccb/resources-phonehd/cookie0043_state.png":
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_ani00.png")
            elif path == "ccb/resources-phonehd/cookie0038z01_state.png" or path == "ccb/resources-phonehd/cookie0056z01_state.png" or path == "ccb/resources-phonehd/cookie0144_state.png" or path == "ccb/resources-phonehd/cookie0144z01_state.png": # Duplicate poses
                continue
            else:
                sad, size = unpack_texture(path, "img/cookies/" + cookie + "/", "_sad_ani00.png")
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][sad] = dict()
            index["cookies"][cookie][sad]["width"] = size[0] * 0.875
            index["cookies"][cookie][sad]["height"] = size[1] * 0.875
        elif pet.match(path):
            im = Image.open(path)
            im = trim(im)
            if not os.path.exists("img/pets"):
                os.makedirs("img/pets")
            im.save("img/pets/" + file)
            if file not in index["pets"]:
                index["pets"].append(file)
            print(file)
        elif treasure.match(path):
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
            print(file)
        elif loadingbackgrounds.match(path) or lobbyskin.match(path):
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
            if file not in index["backgrounds"]:
                index["backgrounds"].append(file)
            print(file)
        elif cutscenebackgrounds.match(path):
            # Usable cutscene backgrounds are rare enough that we grab them from a whitelist instead of a blacklist
            if file in cutscenebgs:
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
                if file not in index["backgrounds"]:
                    index["backgrounds"].append(file)
                print(file)
                

# Unpack props
if not os.path.exists("img/props/effect"):
    os.makedirs("img/props/effect")
unpack_texture("image/etc/resources-phonehd/effect.png", "img/props/effect/", None)
if not os.path.exists("img/props/jelly"):
    os.makedirs("img/props/jelly")
unpack_texture("image/jelly/resources-phonehd/basic_jelly.png", "img/props/jelly/", None)

# Sort the index for ease of use
print("Sorting...")
sorted_index = dict()
sorted_index["cookies"] = dict()
for i in sorted(index["cookies"].keys()):
    cookies = index["cookies"][i]
    sorted_cookies = dict()
    if i + "_standard.png" in cookies:
        sorted_cookies[i + "_standard.png"] = cookies[i + "_standard.png"]
    elif i + "_shop.png" in cookies:
        sorted_cookies[i + "_shop.png"] = cookies[i + "_shop.png"]
    suffixes1 = ["_shop.png", "_ani00.png", "_ani01.png"]
    suffixes2 = ["_duelLoading.png", "_duelWin.png", "_exhausted.png"]
    # The world's wackest sorting algorithm
    for i2 in sorted(cookies.keys()):
        if i2 in sorted_cookies:
            continue
        for suffix in suffixes1:
            if i2.endswith(suffix):
                continue
        for suffix in suffixes2:
            if i2.endswith(suffix):
                continue
        sorted_cookies[i2] = cookies[i2]
    for i2 in sorted(cookies.keys()):
        if i2 in sorted_cookies:
            continue
        for suffix in suffixes2:
            if i2.endswith(suffix):
                continue
        sorted_cookies[i2] = cookies[i2]
    for i2 in sorted(cookies.keys()):
        if i2 not in sorted_cookies:
            sorted_cookies[i2] = cookies[i2]
    sorted_index["cookies"][i] = sorted_cookies
sorted_index["pets"] = sorted(index["pets"])
sorted_index["props"] = dict()
for i in sorted(index["props"].keys()):
    sorted_index["props"][i] = index["props"][i]
sorted_index["backgrounds"] = sorted(index["backgrounds"])
with open("index.js", "w") as js:
    js.write("// Index of all the Cookie Run: OvenBreak files\nvar index = " + json.dumps(sorted_index, ensure_ascii=False) + ";")
print("Done!")