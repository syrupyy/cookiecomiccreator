#!/usr/bin/env python

# Cookie Comic Creator image formatter for Cookie Run: Kingdom, by syrupyy
# To use this, put the script in the root folder of a download of cookies from the Cookie Run: Kingdom fankit (https://www.dropbox.com/sh/pkmdawhvj08rmxf/AAAT2UqHoRw1gfw239xaLiz1a/03.%20Cookie?dl=0), then run it via the command line (python ovenbreak.py)
from PIL import Image, ImageChops
import json
import math
import os
import sys

# Define image trim function
def trim(im):
    bg = Image.new(im.mode, im.size)
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)

# Make initial file checks
if not os.path.exists("GingerBrave/default.png"):
    print("This is not a valid Cookie Run: Kingdom fankit download! Or you're in the wrong folder. Make sure you're running this script in the same folder as the one with all the cookies' names.")
    sys.exit(1)
if not os.path.exists("Heads/gingerbrave.png"):
    print("This fankit download does not have heads/extra sprites. You may encounter issues!")

# Initialize index
index = dict()
# I have disabled index resuming as it was unhelpful
"""
if os.path.exists("../index_kingdom.js"):
    with open("../index_kingdom.js") as js:
        data = js.read()
        obj = data[data.find("{") : data.rfind("}") + 1]
        index = json.loads(obj)
        print("Loaded index_kingdom.js successfully!")
else:
"""
# Leaving this as an OvenBreak-format dict in case I add backgrounds later
index["cookies"] = dict()
banned_stands = ["Almond Cookie", "Black Raison Cookie", "Dark Choco Cookie", "Herb Cookie", "Parfait Cookie", "Red Velvet Cookie", "Rye Cookie"] # Duplicate or near-duplicate poses

# Walk through and parse all files in folder
for subdir, dirs, files in os.walk("."):
    for file in files:
        if file == "kingdom.py" or (file == "stand.png" and subdir[2:] in banned_stands):
            continue
        path = os.path.join(subdir, file).replace("\\", "/")[2:]
        if subdir[2:] == "Heads":
            im = Image.open(path)
            padded = Image.new("RGBA", (150, 150))
            padded.paste(im, (math.ceil((150 - im.size[0]) / 2), math.floor((150 - im.size[1]) / 2)))
            if not os.path.exists("../img/heads/kingdom"):
                os.makedirs("../img/heads/kingdom")
            padded.save("../img/heads/kingdom/" + file)
            print(path)
        else:
            im = Image.open(path)
            # I wish Python added switch statements sooner
            if im.size[1] > 1300:
                factor = 6.5
            elif im.size[1] > 1000:
                factor = 5.5
            elif path == "NPCs/cakehound_crowned.png":
                factor = 4
            elif path == "Sonic Cookie/default.png" or path == "Tails Cookie/default.png":
                factor = 2.5
            elif path.startswith("NPCs/dreggman"):
                factor = 1.5
            elif im.size[1] > 500 or path == "NPCs/cakehound_default.png":
                factor = 2.75
            elif im.size[1] > 400 or path == "NPCs/sherbet_sick.png":
                factor = 2.5
            elif path == "Hollyberry Cookie/stand.png":
                factor = 2
            elif path.startswith("NPCs/durian"):
                factor = 1
            else:
                factor = 1.5
            if subdir[2:] == "Adventurer Cookie":
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
            cookie = subdir[2:].replace(" Cookie", "").replace(" ", "_").lower()
            if not os.path.exists("../img/cookies/kingdom/" + cookie):
                os.makedirs("../img/cookies/kingdom/" + cookie)
            if(file == "cookie0512_stand.png"):
                file = "stand.png"
            im.save("../img/cookies/kingdom/" + cookie + "/" + file)
            if cookie not in index["cookies"]:
                index["cookies"][cookie] = dict()
            index["cookies"][cookie][file] = dict()
            index["cookies"][cookie][file]["width"] = round(im.size[0] / factor)
            index["cookies"][cookie][file]["height"] = round(im.size[1] / factor)
            print(path)

# Sort the index for ease of use
print("Sorting...")
sorted_index = dict()
sorted_index["cookies"] = dict()
for i in sorted(index["cookies"].keys()):
    if i == "npcs":
        continue
    cookies = index["cookies"][i]
    sorted_cookies = dict()
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
    sorted_index["cookies"][i] = sorted_cookies
sorted_index["cookies"]["npcs"] = index["cookies"]["npcs"]
with open("../index_kingdom.js", "w") as js:
    js.write("// Index of all the Cookie Run: Kingdom files\nvar indexKingdom = " + json.dumps(sorted_index, ensure_ascii=False) + ";")
print("Done!")