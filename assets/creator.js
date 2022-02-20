// Cookie Comic Creator, by syrupyy
"use strict";

// Define global comic creator data
var cc = {
    comic: {"title": "", "rows": 1, "columns": 3, "sprites": [], "backgrounds": []},
    openTabs: ["ovenbreak", "ovenbreak", 0],
    cookieHistory: {"ovenbreak": [], "kingdom": []},
    sortHistory: [],
    pageHistory: [],
    undoHistory: [],
    undoPointer: -1,
    startX: 0,
    startY: 0,
    textboxRenderCount: 0,
    tail: null,
    selected: null,
    holding: false,
    mobile: false,
    saved: false,
    language: document.documentElement.getAttribute("lang"),
    canvas: document.getElementById("comic"),
    ctx: document.getElementById("comic").getContext("2d"),
    textCanvas: document.getElementById("text"),
    textCtx: document.getElementById("text").getContext("2d"),
    title: document.getElementById("title"),
    images: document.getElementById("images")
};
if(window.innerWidth < 980) {
    cc.mobile = true;
    cc.comic.rows = 2;
    cc.comic.columns = 2;
    cc.canvas.width -= 470;
    cc.canvas.height += 336;
    document.getElementById("remove-row").disabled = false;
}
index.backgrounds["game"].unshift("bg_none.png");
if(document.body.className === "" && document.cookie.includes("theme=")) document.body.className = document.cookie.split("theme=")[1].split(";")[0];
render();
makeUndoPoint();

// Define functions

// Clone an object
function cloneObject(object, stringify) {
    if(object instanceof Element) {
        if(stringify && typeof object.src !== "null") return object.src;
        return object;
    }
    if(object instanceof Array) {
        var copy = [];
        for(var i = 0, length = object.length; i < length; i++) copy[i] = cloneObject(object[i], stringify);
    } else if(object instanceof Object) {
        var copy = {};
        for(var attribute in object) if(object.hasOwnProperty(attribute)) copy[attribute] = cloneObject(object[attribute], stringify);
    } else return object;
    return copy;
}

// Draw a textbox to the textbox canvas
function drawTextbox() {
    var inputWords = document.getElementById("textbox").value.split(" ");
    var inputLines = [""];
    var currentLine = 0;
    cc.textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";

    // Calculate the length of each line for splitting purposes
    inputWords.forEach(function(word) {
        var splitWord = word.split("\n");
        if(splitWord.length > 1) splitWord.forEach(function(subword, index) {
            if(index > 0) {
                inputLines.push(subword);
            } else word = subword;
        });
        if(cc.textCtx.measureText(inputLines[currentLine] + (inputLines[currentLine] === "" ? "" : " ") + word).width > 282 && inputLines[currentLine] !== "") {
            currentLine++;
            inputLines.splice(currentLine, 0, "");
        }
        if(inputLines[currentLine] === "") inputLines[currentLine] = word;
        else inputLines[currentLine] += " " + word;
        if(splitWord.length > 1) currentLine += splitWord.length - 1;
    });
    cc.textCanvas.height = inputLines.length * 22 + 41;
    cc.textCanvas.width = 0;
    inputLines.forEach(function(line) {
        cc.textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";
        var lineWidth = cc.textCtx.measureText(line).width;
        if(lineWidth > cc.textCanvas.width) cc.textCanvas.width = lineWidth;
    });
    if(cc.textCanvas.width === 0) {
        document.getElementById("create").disabled = true;
        return;
    }
    cc.textCanvas.width += 38;
    if(cc.textCanvas.width < 62 && cc.tail !== null) cc.textCanvas.width = 62;
    else if(cc.textCanvas.width > 320) cc.textCanvas.width = 320;
    cc.textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";

    // Draw the corners of the textbox (stored in Base64 so this can run offline without tainting the canvas)
    var img = new Image();
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAABkUlEQVQ4jaWTXUsCQRSG37MmubtlUiuW9GFrFyVlVhpBIkREBV3UxV4XQRd9QBFEVPQrCroyJegLivoDq/fdhBX9gH6GmRMDjSiV7doLA/OeGZ45Z84MTW/Nwa5ezsz294I0QYzFQYgA6AbQVGeHk0tmlxixTYAiBAZQ5bolWC5lGozREQi+avuqwp5SmWiR4QSgaHlcVRswNTOL8UQC/QNhdHYF4Ha7f4c9JjPzRLgrj+nBHmxsbWPBMCDLirXMcsnsIhHSwte7XNjdP8TK2jqcTqf1Mr8yKoG69SBS51foDYV+hfwIy52ao0RUKi0cGcLFzR00r/dP0DdYEXQiuh3QdVze3qNF0yyBuKRSVinTIGCYz12yjPT5tS1QBYwxOhbznb0DS3f0Tfw7+RqVZZ9bYXzEBvpYPp9ntUhktikOWVndqNr+aiJ/s9zxUaA3vkdRVDw8v0KzeVdCUvFdmhQmNjYGj8dTE4hLYhKLCzM4PAKHw1E7DAxhYfhr/494A3QBaG3z/xvWJIyiqrWTAHwCD2mOCcxJ9y4AAAAASUVORK5CYII=";
    img.onload = function() {
        if(cc.tail === "top-left") {
            cc.textCtx.save();
            cc.textCtx.translate(cc.textCanvas.width, cc.textCanvas.height);
            cc.textCtx.scale(-1, -1);
        } else if(cc.tail === "top-middle" || cc.tail === "top-right") {
            cc.textCtx.save();
            cc.textCtx.translate(0, cc.textCanvas.height);
            cc.textCtx.scale(1, -1);
        }
        cc.textCtx.drawImage(img, 0, 0);
        cc.textCtx.translate(cc.textCanvas.width, 0);
        cc.textCtx.scale(-1, 1);
        cc.textCtx.drawImage(img, 0, 0);
        img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAVCAYAAACkCdXRAAACF0lEQVQ4jaVSQWsTQRh932YDMQniranWaooUi4o1XhQqYnPwItKTHsWCF0Hw7knwF3i3BVEPihS8qIcEKWrRaLYJCr24Gw1xEwPB7CYhMdkdmUmm2GjqJn3wMfNmPh7vezMY2x1kslKpFGu322xUKOhDq9XqP/IMLubIZtd10Wg0diT2U5J6rQbbtnckpktSNL+jUqkIh6OJEbKSGPoXsZbL5dHEyKXXkmS1tFjz+fxI7hRFdZOSvF9bw6/eaxYKheHFjl2JfwPrjtpo1LH6qqtdKpVEDSXWW+/KgyePHsJxur+FjztMfr5Dp6YRiUW1omZcBxCyLQuhUAgzR46Khmq1Cp/Ph3A47NkZiNgNuX+wvISvhrHZxB3yko63dcYROTH12dSMiwSMO04H2scUzp6LIxAIiPt6vY5isShcBoNBENFgMY4fmr4O0DW+r9k2susaTs+d2RTksCwLpmmi2Wyi0+n0piIoigI6f/PCFnXtXnKBCCuS7903gVu37+BANPrfzLY44xiPRTdK6VwOhAXObdtC4uUL+P1+TB+eEQ48i4n8YtGMmdazRHSZ826GH7CaTCAQ2IX9k5Pwqao3sa7DqY2Spj9noJP8UaTLd2/f4NnKU+R0XeTKmAtVVUX9ldm/kFlOXGKM+Mce265vcAB/4PjV+OPZxfkIMVoEQ2ZQnydn/fh0PzHR7ijzxNgcCLMADgLY8xuYQxiIUPwcOgAAAABJRU5ErkJggg==";
        img.onload = function() {
            cc.textCtx.drawImage(img, 0, cc.textCanvas.height - 36);
            cc.textCtx.translate(cc.textCanvas.width, 0);
            cc.textCtx.scale(-1, 1);
            cc.textCtx.drawImage(img, 0, cc.textCanvas.height - 36);

            // Draw the lines of the textbox
            cc.textCtx.fillStyle = "#170e0a";
            cc.textCtx.fillRect(19, 0, cc.textCanvas.width - 38, 3);
            cc.textCtx.fillRect(19, cc.textCanvas.height - 18, cc.textCanvas.width - 38, 3);
            cc.textCtx.fillRect(0, 19, 3, cc.textCanvas.height - 55);
            cc.textCtx.fillRect(cc.textCanvas.width - 3, 19, 3, cc.textCanvas.height - 55);
            cc.textCtx.fillStyle = "#cbcbcb";
            cc.textCtx.fillRect(19, cc.textCanvas.height - 22, cc.textCanvas.width - 38, 4);
            cc.textCtx.fillRect(3, 19, 1, cc.textCanvas.height - 55);
            cc.textCtx.fillRect(cc.textCanvas.width - 4, 19, 1, cc.textCanvas.height - 55);
            cc.textCtx.fillStyle = "#fff";
            cc.textCtx.fillRect(19, 3, cc.textCanvas.width - 38, cc.textCanvas.height - 25);
            cc.textCtx.fillRect(4, 19, cc.textCanvas.width - 8, cc.textCanvas.height - 55);

            // Draw a tail if applicable
            if(cc.tail === "top-middle" || cc.tail === "bottom-middle") img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAMAAADto6y6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/FBMVEUAAAAAAAAqAAAbDQ0VDgcaDwoZDwoYEAwXDwsXDQoYDwkYDQsXDQoYDgoXDgkYDQsXDgoWDgoYDwkWDgoXDgoXDgoXDgoXDgoXDgoXDgoYDgsXDgoXDgoXDgoXDgoXDgr////+/v79/f38/Pz6+vrt7Ozq6uro6Ojm5ubm5eTl5eXj4+Pi4uLh4eHb2dnMzMzLy8vKysrJycnHx8bFxMTBwcC+vb2+vLuzsK6UkZCVkI+NioiJhIKHhIKGgoF+enl3c3FxbGpwa2lpZGJfWVZbVVNTTEk4MC03MC0xKSYuJiIsJCEnHhsjGxcfFxMdFREbEg8aEQ0YDwsXDgoAEmAwAAAAIHRSTlMAAgYTJDIzQUNMVmFja291fH+MlLHExsnL1Nnc4efo8ef7850AAADSSURBVHjapcvVVgNBFETRiwYnuJMmBCd04e7ucv7/X1iZnkl6wiPnsfYq8/Iul1eSeflqvFfr0HRJ9wDRZVMZAHwuZXtF0sFHbUuAkww2JN3QgMdy2Bcl7b8HMLM5OAywLukKpixUhLtkL0vae4PuFNrge60Gq5IuYdqyxuEsPey+Qk8dCvBScW5F0gXMWqMZOHILknaeoTeCAXhwy5JOYT7arRV+tiRtP0F/DDYGt5LOodSSg07g/vj6C/os3wihSWtuONknOv6AtQ+ODnXZP/oFvL9CRV856VEAAAAASUVORK5CYII=";
            else img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAMAAADto6y6AAAACXBIWXMAD0JAAA9CQAE0jWzJAAABIFBMVEUAAAAAAAAXCwsWEAsVEAoaDwoZDwoWDQkYEAwYDgoYDwkYDQsXDQoYDgoXDgkXDgkXDgkYDgoXDgoXDQoXDgsXDgsXDgoXDgkXDQkYDgoXDgoXDgoXDgoXDwoXDgoXDgoXDgoXDgoXDgoXDgr////+/v79/f35+fn19fXy8vLx8fHv7+/u7u7t7e3s7Ozr6+vo6Ojm5ubk5OTj4+Pi4uLh4eHg4ODLy8vKysrJycnHx8fHx8bFxcXDw8PCwcG9vLy2tbSvra2urayrqqmop6anpaShn56dm5qcmZiWk5KTkI+Oi4qMiYiHg4J7d3VtaGZlYF1gWlhUTktPSUdIQT5FPjs/ODQ8NTEzLCgsJCEmHhogGBQdFBAZEAwYDwsXDgrW9Kz0AAAAJHRSTlMAAS0vMTI0OUFKVGBkam1ucYKTmqaptLy+w8TKy9LW3N3q+PrbcBt7AAAA6UlEQVR42m3Q11ICURBF0TZhzjmnEQHFjMecwZyzovv//8K6DJR3ptiPvZ76mJQJYiUlySRlY5CqgJarwraklSjsOuB5T9KqD+lTwOD1QNJaFeD9UNK6B2cwZR3Ax5GkjX8owLBZK/B5LClXgUwI1gJ85SVtJkNYKIM1A9/nTuajYE0zULxyb6VKcAGDJbDGafi5dZJ2cAkDIVhiEn7vnCwGQdYDqxsF7rckLc3lfLDaEeDRDSdFwKwPeHL76Rr6PbAe4GVf0gN0+mDdwNvJzk0RGiJgXZQbs1ht4X08EQer752YHWqvMfsD9ZFYzrgEYpYAAAAASUVORK5CYII=";
            img.onload = function() {
                switch(cc.tail) {
                    case "top-left":
                    case "top-right":
                        cc.textCtx.drawImage(img, cc.textCanvas.width - 43, cc.textCanvas.height - 22);
                        cc.textCtx.restore();
                        break;
                    case "top-middle":
                        cc.textCtx.drawImage(img, cc.textCanvas.width / 2 - 12, cc.textCanvas.height - 22);
                        cc.textCtx.restore();
                        break;
                    case "bottom-left":
                        cc.textCtx.save();
                        cc.textCtx.translate(cc.textCanvas.width, 0);
                        cc.textCtx.scale(-1, 1);
                        cc.textCtx.drawImage(img, cc.textCanvas.width - 43, cc.textCanvas.height - 22);
                        cc.textCtx.restore();
                        break;
                    case "bottom-middle":
                        cc.textCtx.drawImage(img, cc.textCanvas.width / 2 - 12, cc.textCanvas.height - 22);
                        break;
                    case "bottom-right":
                        cc.textCtx.drawImage(img, cc.textCanvas.width - 43, cc.textCanvas.height - 22);
                }

                // Finally, draw text
                cc.textCtx.fillStyle = "#000";
                cc.textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";
                inputLines.forEach(function(line, index) {
                    if(cc.tail !== null && cc.tail.startsWith("top-")) cc.textCtx.fillText(line, 19, 45 + (24 * index));
                    else cc.textCtx.fillText(line, 19, 28 + (22 * index));
                });

                // Undisable the create button
                document.getElementById("create").disabled = false;
            };
        };
    };
}

// Format for filenames
function formatFilename(name) {
    return name.replace(/[^a-z0-9-._]+/gi, " ").replace(/ {2,}/g, " ").trim().replace(/ /g, "_").toLowerCase();
}

// Load an image into the canvas
function loadImage(url, callback) {
    var img = new Image();
    img.onload = function() {
        callback(img);
    };
    img.src = url;
}

// Make a backup that can be undone
function makeUndoPoint() {
    if(cc.undoPointer < cc.undoHistory.length - 1) cc.undoHistory = cc.undoHistory.slice(0, cc.undoPointer + 1);
    cc.undoHistory.push(cloneObject(cc.comic, false));
    if(cc.undoHistory.length > 50) cc.undoHistory.shift();
    else cc.undoPointer++;
    toggleControls();
}

// Print a page of sprites
function pagify(sprites, id, offset = 0) {
    var className = id.slice(0, -1);
    var newOffset = offset + (id === "backgrounds" ? 12 : 20);
    if(sprites.length === 2) {
        var key = sprites[0];
        var entries = Object.entries(sprites[1]);
    } else var entries = sprites;
    cc.images.innerHTML = "";
    if(offset === 0) cc.pageHistory = [];
    if(offset !== 0 || entries.length > newOffset) {
        var previous = document.createElement("button");
        previous.innerText = translateText("Previous Page");
        previous.id = "previous-page";
        if(offset === 0) previous.disabled = true;
        else previous.onclick = function() {
            pagify(sprites, id, id === "cookies" && key.startsWith("cookie") ? cc.pageHistory[0] : offset - (id === "backgrounds" ? 12 : 20));
            cc.pageHistory.shift();
        };
        cc.images.appendChild(previous);
        var next = document.createElement("button");
        next.innerText = translateText("Next Page");
        next.id = "next-page";
        if(newOffset >= entries.length) next.disabled = true;
        else next.onclick = function() {
            pagify(sprites, id, newOffset);
            cc.pageHistory.unshift(offset);
        };
        cc.images.appendChild(next);
        cc.images.appendChild(document.createElement("br"));
    }
    if(id === "backgrounds") {
        var button = document.createElement("button");
        button.className = "custom-background";
        button.textContent = translateText("+ Custom Background");
        button.onclick = function() {
            var file = document.createElement("input");
            file.className = "none";
            file.setAttribute("type", "file");
            file.setAttribute("accept", "image/*");
            file.onchange = function() {
                file.remove();
                if(file.files.length) {
                    var img = new Image();
                    img.onload = function() {
                        if(img.width > 0 && img.height > 0) {
                            var imgCanvas = document.createElement("canvas");
                            imgCanvas.width = 454;
                            imgCanvas.height = 320;
                            var imgCtx = imgCanvas.getContext("2d");
                            imgCtx.imageSmoothingQuality = "high";
                            if(img.width / img.height < 1.41875) {
                                var newHeight = img.height / img.width * 454;
                                imgCtx.drawImage(img, 0, (320 - newHeight) / 2, 454, newHeight);
                            } else {
                                var newWidth = img.width / img.height * 320;
                                imgCtx.drawImage(img, (454 - newWidth) / 2, 0, newWidth, 320);
                            }
                            var newImg = new Image();
                            newImg.onload = function() {
                                if(cc.selected === null || cc.selected[0] < 0) {
                                    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                                    resetCopy();
                                    cc.selected = [-1, newImg];
                                } else {
                                    var backgroundX = 470 * cc.selected[1] + 8;
                                    var backgroundY = 336 * cc.selected[0] + 8;
                                    cc.comic.backgrounds.forEach(function(background, index) {
                                        if(background.x === backgroundX && background.y === backgroundY) cc.comic.backgrounds.splice(index, 1);
                                    });
                                    cc.comic.backgrounds.push({"img": newImg, "x": backgroundX, "y": backgroundY});
                                    cc.selected = null;
                                    makeUndoPoint();
                                    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                                }
                                render();
                            };
                            newImg.src = imgCanvas.toDataURL();
                        }
                    };
                    var reader = new FileReader();
                    reader.onload = () => img.src = reader.result;
                    reader.readAsDataURL(file.files[0]);
                }
            };
            document.body.appendChild(file);
            file.click();
        };
        cc.images.appendChild(button);
        cc.images.appendChild(document.createElement("br"));
    }
    var ovenbreakOffset = offset;
    entries.forEach(function(sprite, i) {
        if(sprite[0] === "name") return;
        if(id === "cookies" && key.startsWith("cookie")) {
            if(i < ovenbreakOffset) return;
            if(sprite[0].endsWith("_shop.png") && i - ovenbreakOffset > 3) {
                if(i - ovenbreakOffset < 10) {
                    ovenbreakOffset = i;
                    cc.images.appendChild(document.createElement("hr"));
                } else {
                    newOffset = i;
                    ovenbreakOffset = 9999;
                    return;
                }
            }
            if(typeof next !== "undefined" && entries.length - 1 === i) next.disabled = true;
        } else if(i < offset || i >= newOffset) return;
        var img = document.createElement("img");
        if(sprites.length === 2) {
            if(id === "cookies" && cc.openTabs[0] === "kingdom") img.src = "assets/img/cookies/kingdom/" + key + "/" + sprite[0];
            else img.src = "assets/img/" + id + "/" + key + "/" + sprite[0];
            if(id === "cookies" && (!sprite[1].hasOwnProperty("resize") || sprite[1].resize === true)) {
                img.width = sprite[1].width - sprite[1].width * 0.25;
                img.height = sprite[1].height - sprite[1].height * 0.25;
            } else {
                img.width = sprite[1].width;
                img.height = sprite[1].height;
            }
        } else img.src = "assets/img/" + id + "/" + sprite;
        img.className = className;
        img.onload = function() {
            img.onclick = function() {
                if(img.naturalWidth === 0) return;
                if(id === "backgrounds") {
                    if(cc.selected === null || cc.selected[0] < 0) {
                        if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                        resetCopy();
                        cc.selected = [-1, img];
                    } else {
                        var backgroundX = 470 * cc.selected[1] + 8;
                        var backgroundY = 336 * cc.selected[0] + 8;
                        cc.comic.backgrounds.forEach(function(background, index) {
                            if(background.x === backgroundX && background.y === backgroundY) cc.comic.backgrounds.splice(index, 1);
                        });
                        if(sprite !== "bg_none.png") cc.comic.backgrounds.push({"img": img, "x": backgroundX, "y": backgroundY});
                        cc.selected = null;
                        makeUndoPoint();
                        if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                    }
                } else {
                    if((id === "cookies" || id === "pets") && (!sprite[1].hasOwnProperty("resize") || sprite[1].resize === true)) {
                        var imgCopy = img.cloneNode();
                        if(id === "pets") {
                            var width = img.width * 0.5;
                            var height = img.height * 0.5;
                        } else {
                            var width = sprite[1].width - sprite[1].width * 0.25;
                            var height = sprite[1].height - sprite[1].height * 0.25;
                            imgCopy.width = sprite[1].width;
                            imgCopy.height = sprite[1].height;
                        }
                        if(cc.selected !== null) cc.comic.sprites.push({"img": imgCopy, "x": 470 * cc.selected[1] + 235 - width / 2, "y": 336 * cc.selected[0] + 168 - height / 2, "width": width, "height": height, "resized": (id === "pets" ? -2 : -1), "flipped": false, "rotated": 0, "held": false});
                        else cc.comic.sprites.push({"img": imgCopy, "x": 470 * Math.floor(cc.comic.columns / 2) + 235 - width / 2, "y": 336 * Math.floor(cc.comic.rows / 2) + 168 - height / 2, "width": width, "height": height, "resized": (id === "pets" ? -2 : -1), "flipped": false, "rotated": 0, "held": false});
                        imgCopy.addEventListener("load", render);
                    } else {
                        if(cc.selected !== null) cc.comic.sprites.push({"img": img, "x": 470 * cc.selected[1] + 235 - img.width / 2, "y": 336 * cc.selected[0] + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                        else cc.comic.sprites.push({"img": img, "x": 470 * Math.floor(cc.comic.columns / 2) + 235 - img.width / 2, "y": 336 * Math.floor(cc.comic.rows / 2) + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                    }
                    makeUndoPoint();
                    toggleControls();
                    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                }
                render();
            };
        };
        cc.images.appendChild(img);
    });
    if(typeof next !== "undefined") {
        if(!next.disabled || !previous.disabled) {
            cc.images.appendChild(document.createElement("br"));
            var previousClone = previous.cloneNode(true);
            if(!previous.disabled) previousClone.onclick = function() {
                pagify(sprites, id, id === "cookies" && key.startsWith("cookie") ? cc.pageHistory[0] : offset - (id === "backgrounds" ? 12 : 20));
                cc.pageHistory.shift();
            };
            cc.images.appendChild(previousClone);
            var nextClone = next.cloneNode(true);
            if(!next.disabled) nextClone.onclick = function() {
                pagify(sprites, id, newOffset);
                cc.pageHistory.unshift(offset);
            };
            cc.images.appendChild(nextClone);
        } else {
            next.nextElementSibling.remove();
            next.remove();
            previous.remove();
        }
    }
    if(sprites.length === 2 && ["dark_cacao", "eclair", "golden_cheese", "npcs", "sonic", "tails", "tea_knight", "white_lily"].includes(sprites[0])) {
        var p = document.createElement("p");
        p.innerHTML = translateText("(Sprites provided by <a href=\"https://cookierunkingdom.fandom.com/wiki/Cookie_Run:_Kingdom_Wiki\">the Cookie Run: Kingdom Wiki</a>)");
        cc.images.appendChild(p);
    }
}

// (Re)render the canvas
function render() {
    cc.canvas.width = cc.canvas.width;
    cc.ctx.beginPath();
    cc.ctx.rect(0, 0, cc.canvas.width, cc.canvas.height);
    cc.ctx.fillStyle = "white";
    cc.ctx.fill();
    cc.ctx.beginPath();
    cc.ctx.lineWidth = "4";
    cc.ctx.strokeStyle = "black";
    cc.ctx.imageSmoothingQuality = "high";
    cc.comic.backgrounds.forEach((background) => cc.ctx.drawImage(background.img, background.x, background.y));
    for(var i = 0; i < cc.comic.columns; i++) for(var i2 = 0; i2 < cc.comic.rows; i2++) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = 454;
        canvas.height = 320;
        var ix = 470 * i + 8;
        var iy = 336 * i2 + 8;
        cc.comic.sprites.forEach(function(sprite) {
            var centerX = sprite.x + sprite.width / 2;
            var centerY = sprite.y + sprite.height / 2;
            var differenceX = centerX - ix;
            var differenceY = centerY - iy;
            if((differenceX >= -8 || i === 0) && (differenceX <= 462 || i === cc.comic.columns - 1) && (differenceY >= -8 || i2 === 0) && (differenceY <= 328 || i2 === cc.comic.rows - 1)) {
                if(sprite.flipped || sprite.rotated !== 0) {
                    ctx.save();
                    ctx.translate(differenceX, differenceY);
                    if(sprite.flipped) ctx.scale(-1, 1);
                    if(sprite.rotated !== 0) ctx.rotate((sprite.flipped ? sprite.rotated : -sprite.rotated) * Math.PI / 180);
                    ctx.drawImage(sprite.img, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
                    ctx.restore();
                } else ctx.drawImage(sprite.img, differenceX - sprite.width / 2, differenceY - sprite.height / 2, sprite.width, sprite.height);
            }
        });
        cc.ctx.drawImage(canvas, ix, iy);
    }
    cc.ctx.fillRect(0, 0, cc.canvas.width, 6);
    cc.ctx.fillRect(0, 0, 6, cc.canvas.height);
    if(cc.selected !== null && cc.selected[0] < 0) {
        if(cc.selected[0] === -3) cc.ctx.strokeStyle = "#ccc";
        else cc.ctx.strokeStyle = "#ffd71e";
    }
    for(var i = 0; i < cc.comic.rows; i++) for(var i2 = 0; i2 < cc.comic.columns; i2++) {
        cc.ctx.rect(470 * i2 + 8, 336 * i + 8, 454, 320);
        cc.ctx.stroke();
        cc.ctx.fillRect(470 * i2 + 464, 336 * i + 6, 12, 336);
        cc.ctx.fillRect(470 * i2 + 6, 336 * i + 330, 464, 12);
    }
    if(cc.selected !== null && cc.selected[0] >= 0) {
        cc.ctx.beginPath();
        cc.ctx.strokeStyle = "#ffd71e";
        cc.ctx.rect(470 * cc.selected[1] + 8, 336 * cc.selected[0] + 8, 454, 320);
        cc.ctx.stroke();
    } else if(cc.selected !== null && cc.selected[0] === -3) {
        cc.ctx.beginPath();
        cc.ctx.strokeStyle = "black";
        cc.ctx.rect(470 * cc.selected[1][1] + 8, 336 * cc.selected[1][0] + 8, 454, 320);
        cc.ctx.stroke();
    }
    cc.ctx.fillRect(0, cc.canvas.height - 48, cc.canvas.width, 48);
    cc.ctx.font = "Bold 24px CookieRun, Open Sans, sans-serif";
    cc.ctx.fillStyle = "black";
    cc.ctx.textAlign = "left";
    if(cc.selected !== null && cc.selected[0] === -1) {
        if(cc.selected[1].src.endsWith("/bg_none.png")) cc.ctx.fillText(translateText("Select a background to delete"), 10, cc.canvas.height - 20);
        else cc.ctx.fillText(translateText("Select a panel to place the background"), 10, cc.canvas.height - 20);
    } else if(cc.selected !== null && cc.selected[0] === -2) cc.ctx.fillText(translateText("Select a panel to copy"), 10, cc.canvas.height - 20);
    else if(cc.selected !== null && cc.selected[0] === -3) cc.ctx.fillText(translateText("Select a panel to paste over"), 10, cc.canvas.height - 20);
    else cc.ctx.fillText(cc.comic.title, 10, cc.canvas.height - 20);
}

// Clear the selection and reset the "Copy Panel" button's text
function resetCopy() {
    cc.selected = null;
    document.getElementById("copy-panel").textContent = translateText("Copy Panel");
}

// Sync canvas with undo history
function syncUndoHistory() {
    if(cc.comic.rows !== cc.undoHistory[cc.undoPointer].rows || cc.comic.columns !== cc.undoHistory[cc.undoPointer].columns) {
        cc.canvas.width = cc.undoHistory[cc.undoPointer].columns * 470;
        cc.canvas.height = cc.undoHistory[cc.undoPointer].rows * 336 + 48;
        if(cc.undoHistory[cc.undoPointer].rows >= (cc.mobile ? 4 : 5)) document.getElementById("add-row").disabled = true;
        else document.getElementById("add-row").disabled = false;
        if(cc.undoHistory[cc.undoPointer].rows === 1) document.getElementById("remove-row").disabled = true;
        else document.getElementById("remove-row").disabled = false;
        if(cc.undoHistory[cc.undoPointer].columns >= (cc.mobile ? 3 : 4)) document.getElementById("add-column").disabled = true;
        else document.getElementById("add-column").disabled = false;
        if(cc.undoHistory[cc.undoPointer].columns === 1) document.getElementById("remove-column").disabled = true;
        else document.getElementById("remove-column").disabled = false;
    }
    cc.comic = cloneObject(cc.undoHistory[cc.undoPointer], false);
    cc.title.value = cc.comic.title;
    toggleControls();
    render();
}

// Update controls
function toggleControls() {
    Array.prototype.forEach.call(document.getElementById("controls").children, function(element) {
        if(cc.comic.sprites.length === 0) element.setAttribute("disabled", "");
        else element.removeAttribute("disabled");
    });
    if(cc.comic.sprites.length > 0) {
        document.getElementById("rotate").disabled = false;
        if(cc.title.parentNode.className === "left-buttons flex") {
            document.getElementById("back").after(cc.title);
            if(document.getElementById("tabs").className !== "none" || document.getElementById("back").className !== "none") cc.title.className = "none";
        }
        document.getElementById("rotate").value = cc.comic.sprites[cc.comic.sprites.length - 1].rotated;
        document.getElementById("resize").value = (cc.comic.sprites[cc.comic.sprites.length - 1].resized + 3) * 100 / 6;
    } else {
        document.getElementById("rotate").disabled = true;
        if(cc.title.parentNode.className === "right-buttons") {
            document.getElementById("backgrounds").after(cc.title);
            cc.title.className = "";
        }
    }
    if(cc.undoPointer === 0) document.getElementById("undo").disabled = true;
    else document.getElementById("undo").disabled = false;
    if(cc.undoPointer >= cc.undoHistory.length - 1) document.getElementById("redo").disabled = true;
    else document.getElementById("redo").disabled = false;
}

// Translate text to the user's language
function translateText(text) {
    if(cc.language === "en") return text;
    if(cc.language === "es") switch(text) {
        case "Clear":
            return "Borrar";
        case "Are you sure?":
            return "¿Está seguro?";
        case "Share":
            return "Compartir";
        case "Uploading...":
            return "Subiendo...";
        case "Previous Page":
            return "Anterior";
        case "Next Page":
            return "Siguiente";
        case "(Sprites provided by <a href=\"https://cookierunkingdom.fandom.com/wiki/Cookie_Run:_Kingdom_Wiki\">the Cookie Run: Kingdom Wiki</a>)":
            return "(Los sprites se proporcionaron por <a href=\"https://cookierunkingdom.fandom.com/wiki/Cookie_Run:_Kingdom_Wiki\">la wiki de Cookie Run: Kingdom</a>)";
        case "Select a background to delete":
            return "¿Qué fondo quieres borrar?";
        case "Select a panel to place the background":
            return "¿En qué viñeta colocarás este fondo?";
        case "Select a panel to copy":
            return "Selecciona una viñeta para copiar";
        case "Select a panel to paste over":
            return "Selecciona una viñeta para pegar encima";
        case "Copy Panel":
            return "Copiar Viñeta";
        case "Cancel Copy":
            return "Cancelar Copia";
        case "Game Locations":
            return "Lugares del Juego";
        case "Basic Backdrops":
            return "Fondos Básicos";
        case "Secret sort":
            return "Orden secreto";
        case "Create":
            return "Crear";
        case "+ Custom Background":
            return "+ Fondo Personalizado";
        case "Could not import your comic. Is it in the right format?":
            return "No se pudo importar tu cómic. ¿Su archivo está usando el formato correcto?";
        case "An error occurred while trying to share the comic. (":
            return "Se ha producido un error al intentar compartir el cómic. (";
        case "Warning! Your comic will be lost unless you save or export it.":
            return "¡Advertencia! Tu cómic se perderá si no lo guardas o exportas.";
        case "Due to browser limitations, the download button doesn't work while running this site from local files. Instead, right click or long press the comic and select \"Save image as...\" to save your comic.":
            return "Debido a las limitaciones de su explorador, el botón de descarga no funciona mientras corre este programa desde los archivos locales. En su lugar, haga clic derecho, o toque el comic con su dedo si se encuentra en teléfono móvil, y seleccione \"Guardar imágen como...\" para guardarlo.";
    } else if(cc.language === "ko") switch(text) {
        case "Clear":
            return "지우다";
        case "Are you sure?":
            return "확실합니까?";
        case "Share":
            return "공유";
        case "Uploading...":
            return "업로드 중...";
        case "Previous Page":
            return "이전 페이지로 가기";
        case "Next Page":
            return "다음 페이지로 가기";
        case "(Sprites provided by <a href=\"https://cookierunkingdom.fandom.com/wiki/Cookie_Run:_Kingdom_Wiki\">the Cookie Run: Kingdom Wiki</a>)":
            return "스프라이트는 <a href=\"https://cookierunkingdom.fandom.com/wiki/Cookie_Run:_Kingdom_Wiki\">the Cookie Run: Kingdom Wiki</a>에서 제공했습니다.";
        case "Select a background to delete":
            return "삭제할 배경 선택";
        case "Select a panel to place the background":
            return "배경을 배치할 패널 선택";
        case "Select a panel to copy":
            return "복사할 패널 선택";
        case "Select a panel to paste over":
            return "교체할 패널 선택";
        case "Copy Panel":
            return "컷 하기 복사";
        case "Cancel Copy":
            return "복사 취소";
        case "OvenBreak/LINE":
            return "오븐브레이크/Kakao";
        case "Kingdom":
            return "킹덤";
        case "Game Locations":
            return "게임 장소";
        case "Basic Backdrops":
            return "컬러 배경";
        case "Secret sort":
            return "비밀 정렬";
        case "Create":
            return "만들기";
        case "+ Custom Background":
            return "+ 사용자 정의 배경";
        case "Could not import your comic. Is it in the right format?":
            return "만화 가져오기에 실패했습니다. 파일이 올바른 형식을 사용하고 있습니까?";
        case "An error occurred while trying to share the comic. (":
            return "만화를 공유하는 동안 오류가 발생했습니다. (";
        case "Warning! Your comic will be lost unless you save or export it.":
            return "이미지를 내보내거나 다운로드하지 않으면 만화가 손실됩니다!";
        case "Due to browser limitations, the download button doesn't work while running this site from local files. Instead, right click or long press the comic and select \"Save image as...\" to save your comic.":
            return "웹 브라우저 제한으로 인해 로컬 파일에서 이 웹 사이트를 실행하는 동안 다운로드 버튼이 작동하지 않습니다. 대신 만화를 마우스 오른쪽 버튼으로 클릭하거나 길게 누르고 \"이미지 다운로드를\"을 선택하여 만화를 저장합니다.";
    }
    return text;
}

// Define events

// Handle user leaving the page with comic unfinished
window.onbeforeunload = function() {
    if(cc.comic.sprites.length > 2 && !cc.saved) return translateText("Warning! Your comic will be lost unless you save or export it.");
}

// Handle clicks and taps
cc.canvas.onmousedown = cc.canvas.ontouchstart = function(event) {
    if(event.type === "touchstart" || event.button === 0) {
        if(event.type === "touchstart") {
            var x = (event.changedTouches[0].pageX - cc.canvas.offsetLeft) * cc.canvas.width / cc.canvas.clientWidth;
            var y = (event.changedTouches[0].pageY - cc.canvas.offsetTop) * cc.canvas.height / cc.canvas.clientHeight;
        } else {
            var x = (event.pageX - cc.canvas.offsetLeft) * cc.canvas.width / cc.canvas.clientWidth;
            var y = (event.pageY - cc.canvas.offsetTop) * cc.canvas.height / cc.canvas.clientHeight;
        }
        for(var i = cc.comic.sprites.length - 1; i >= 0 && cc.holding === false; i--) {
            var element = cc.comic.sprites[i];
            if(x > element.x && x < element.x + element.width && y > element.y && y < element.y + element.height) {
                if(event.type === "touchstart") event.preventDefault();
                cc.comic.sprites[i].held = true;
                cc.comic.sprites.push(cc.comic.sprites.splice(i, 1)[0]);
                cc.holding = true;
                cc.startX = x;
                cc.startY = y;
                toggleControls();
            }
        }
        if(cc.holding === false) {
            for(var i = 0; i < cc.comic.columns; i++) for(var i2 = 0; i2 < cc.comic.rows; i2++) {
                if(x > 470 * i + 8 && x < 470 * i + 462 && y > 336 * i2 + 8 && y < 336 * i2 + 328) {
                    if(cc.selected !== null && cc.selected[0] === i2 && cc.selected[1] === i) cc.selected = null;
                    else if(cc.selected !== null && cc.selected[0] === -1) {
                        var backgroundX = 470 * i + 8;
                        var backgroundY = 336 * i2 + 8;
                        cc.comic.backgrounds.forEach(function(background, i) {
                            if(background.x === backgroundX && background.y === backgroundY) cc.comic.backgrounds.splice(i, 1);
                        });
                        if(!cc.selected[1].src.endsWith("/bg_none.png")) cc.comic.backgrounds.push({"img": cc.selected[1], "x": backgroundX, "y": backgroundY});
                        cc.selected = null;
                        makeUndoPoint();
                    } else if(cc.selected !== null && cc.selected[0] === -2) {
                        cc.selected = [-3, [i2, i]];
                        render();
                    } else if(cc.selected !== null && cc.selected[0] === -3) {
                        if(i2 !== cc.selected[1][0] || i !== cc.selected[1][1]) {
                            var backgroundX = 470 * i + 8;
                            var backgroundY = 336 * i2 + 8;
                            var oldBackgroundX = 470 * cc.selected[1][1] + 8;
                            var oldBackgroundY = 336 * cc.selected[1][0] + 8;
                            cc.comic.backgrounds.forEach(function(background, i) {
                                if(background.x === backgroundX && background.y === backgroundY) {
                                    cc.comic.backgrounds.splice(i, 1);
                                    return;
                                }
                            });
                            cc.comic.backgrounds.forEach(function(background) {
                                if(background.x === oldBackgroundX && background.y === oldBackgroundY) {
                                    cc.comic.backgrounds.push({"img": background.img, "x": backgroundX, "y": backgroundY});
                                    return;
                                }
                            });
                            var splices = [];
                            cc.comic.sprites.forEach(function(sprite, i) {
                                var centerX = sprite.x + sprite.width / 2;
                                var centerY = sprite.y + sprite.height / 2;
                                var differenceX = centerX - oldBackgroundX;
                                var differenceY = centerY - oldBackgroundY;
                                if(differenceX >= 0 && differenceX <= 470 && differenceY >= 0 && differenceY <= 336) cc.comic.sprites.push({"img": sprite.img, "x": backgroundX + differenceX - sprite.width / 2, "y": backgroundY + differenceY - sprite.height / 2, "width": sprite.width, "height": sprite.height, "resized": sprite.resized, "flipped": sprite.flipped, "rotated": sprite.rotated, "held": false});
                                else if(centerX - backgroundX >= 0 && centerX - backgroundX <= 470 && centerY - backgroundY >= 0 && centerY - backgroundY <= 336) splices.push(i);
                            });
                            splices.forEach(function(splice, i) {
                                cc.comic.sprites.splice(splice - i, 1);
                            });
                            resetCopy();
                            makeUndoPoint();
                        }
                    } else cc.selected = [i2, i];
                }
            }
        }
        render();
    }
};

// Handle dragging
document.onmousemove = document.ontouchmove = function(event) {
    if(cc.holding === true) {
        cc.comic.sprites.forEach(function(element) {
            if(element.held === true) {
                if(event.type === "touchmove") {
                    event.preventDefault();
                    var canvasX = (event.changedTouches[0].pageX - cc.canvas.offsetLeft) * cc.canvas.width / cc.canvas.clientWidth;
                    var canvasY = (event.changedTouches[0].pageY - cc.canvas.offsetTop) * cc.canvas.height / cc.canvas.clientHeight;
                } else {
                    var canvasX = (event.pageX - cc.canvas.offsetLeft) * cc.canvas.width / cc.canvas.clientWidth;
                    var canvasY = (event.pageY - cc.canvas.offsetTop) * cc.canvas.height / cc.canvas.clientHeight;
                }
                element.x += canvasX - cc.startX;
                cc.startX = canvasX;
                element.y += canvasY - cc.startY;
                cc.startY = canvasY;
            }
        });
        render();
    }
};

// Handle mouse/finger release
document.onmouseup = document.ontouchend = function() {
    cc.holding = false;
    cc.comic.sprites.forEach(function(element, index) {
        if(element.held) {
            element.held = false;
            if(element.x > cc.canvas.width - 10 || element.y > cc.canvas.height - 58 || element.x <= -element.width + 10 || element.y <= -element.height + 10) cc.comic.sprites.splice(index, 1);
            makeUndoPoint();
        }
    });
    toggleControls();
};

// Cancel touch event to avoid weird canvas selection bug
cc.canvas.ontouchend = function(event) {
    event.preventDefault();
};

// Handle file drag
document.ondragover = document.ondragenter = function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}

// Handle file paste
document.ondrop = document.onpaste = function(event) {
    var files;
    if(event.type === "drop") files = event.dataTransfer.files;
    else {
        if(event.clipboardData.files.length === 0) return;
        files = event.clipboardData.files;
    }
    Array.from(files).forEach(function(file) {
        if(file.type.startsWith("image/")) {
            event.preventDefault();
            var img = new Image();
            img.onload = function() {
                if(img.width > 0 && img.height > 0) {
                    if(img.width > 324) {
                        img.height = img.height * (324 / img.width);
                        img.width = 324;
                    }
                    if(img.height > 182) {
                        img.width = img.width * (182 / img.height);
                        img.height = 182;
                    }
                    if(cc.selected !== null) cc.comic.sprites.push({"img": img, "x": 470 * cc.selected[1] + 235 - img.width / 2, "y": 336 * cc.selected[0] + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                    else cc.comic.sprites.push({"img": img, "x": 470 * Math.floor(cc.comic.columns / 2) + 235 - img.width / 2, "y": 336 * Math.floor(cc.comic.rows / 2) + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                    makeUndoPoint();
                    toggleControls();
                    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                    render();
                }
            };
            var reader = new FileReader();
            reader.onload = () => img.src = reader.result;
            reader.readAsDataURL(file);
        }
    });
}

// Handle tab clicks
Array.prototype.forEach.call(document.getElementsByClassName("openable"), function(element) {
    if(element.id !== "textboxes") element.onclick = function() {
        cc.title.className = "";
        document.getElementById("tabs").className = "none";
        document.getElementById("back").className = "none";
        document.getElementById("options").className = "none";
        cc.images.className = "";
        cc.textCanvas.className = "none";
        if(this.className === "openable") {
            if(element.id === "cookys" || element.id === "props") {
                if(element.id === "cookys") {
                    if(cc.openTabs[2] !== 0) {
                        cc.openTabs[2] = 0;
                        if(cc.openTabs[0] !== cc.openTabs[1]) {
                            document.getElementById(cc.openTabs[0]).className = "tab";
                            document.getElementById(cc.openTabs[1]).className = "tab unopened";
                        }
                        document.getElementById("ovenbreak").textContent = translateText("OvenBreak/LINE");
                        document.getElementById("kingdom").textContent = translateText("Kingdom");
                    }
                    if(cc.comic.sprites.length) cc.title.className = "none";
                    document.getElementById("tabs").className = "";
                    document.getElementById("options").className = "";
                }
                cc.images.innerHTML = "";
                var sprites = Object.entries(element.id === "cookys" ? index["cookies"][cc.openTabs[0]] : index.props);
                if(element.id === "cookys") switch(document.getElementById("sort").value) {
                    case "release-new":
                        if(cc.openTabs[0] === "ovenbreak") {
                            sprites.reverse();
                            // This could be made more compact with a ... operator and a reverse(), but this way is better supported in browsers
                            sprites.push(sprites.splice(2, 1)[0]);
                            sprites.push(sprites.splice(1, 1)[0]);
                            sprites.push(sprites.splice(0, 1)[0]);
                        }
                        break;
                    case "a-z":
                        if(cc.openTabs[0] === "ovenbreak") var wars = sprites.splice(sprites.length - 1, 1)[0];
                        var npcs = sprites.splice(sprites.length - 1, 1)[0];
                        sprites.sort((a, b) => a[1]["name"].localeCompare(b[1]["name"]));
                        sprites.push(npcs);
                        if(cc.openTabs[0] === "ovenbreak") sprites.push(wars);
                        break;
                    case "z-a":
                        if(cc.openTabs[0] === "ovenbreak") var wars = sprites.splice(sprites.length - 1, 1)[0];
                        var npcs = sprites.splice(sprites.length - 1, 1)[0];
                        sprites.sort((a, b) => b[1]["name"].localeCompare(a[1]["name"]));
                        sprites.push(npcs);
                        if(cc.openTabs[0] === "ovenbreak") sprites.push(wars);
                        break;
                    case "recent":
                        cc.cookieHistory[cc.openTabs[0]].forEach(function(cookie) {
                            sprites.every(function(sprite, i) {
                                if(sprite[0] === cookie) sprites.unshift(sprites.splice(i, 1)[0]);
                                else return true;
                            });
                        });
                        break;
                    case "secret":
                        var bestSprite = null;
                        sprites.every(function(sprite) {
                            if(sprite[0] !== "cookie0157" && sprite[0] !== "espresso") return true;
                            bestSprite = sprite;
                        });
                        var length = sprites.length;
                        sprites = [];
                        for(var i = 0; i < length; i++) sprites.push(bestSprite);
                }
                sprites.forEach(function(sprite) {
                    var img = document.createElement("img");
                    var subentries = Object.entries(sprite[1]);
                    if(element.id === "cookys") {
                        if(cc.openTabs[0] === "kingdom") {
                            img.src = "assets/img/heads/kingdom/" + sprite[0] + ".png";
                            img.className = "head-kingdom";
                            if(typeof index["cookies"]["kingdom"][sprite[0]]["name"] !== "undefined") {
                                img.setAttribute("alt", sprite[1]["name"]);
                                img.setAttribute("title", sprite[1]["name"]);
                            }
                        } else {
                            img.src = "assets/img/heads/" + sprite[0] + "_head.png";
                            img.className = "head";
                            if(typeof index["cookies"]["ovenbreak"][sprite[0]]["name"] !== "undefined") {
                                img.setAttribute("alt", sprite[1]["name"]);
                                img.setAttribute("title", sprite[1]["name"]);
                            }
                        }
                    } else {
                        img.src = "assets/img/props/" + sprite[0] + "/" + Object.entries(subentries[sprite[0] === "effect" ? 12 : 0])[0][1];
                        if(sprite[0] === "relic") {
                            img.width = 82;
                            img.height = 92;
                        }
                    }
                    img.onclick = function() {
                        if(element.id === "cookys") {
                            if(cc.cookieHistory[cc.openTabs[0]].includes(sprite[0])) cc.cookieHistory[cc.openTabs[0]].splice(cc.cookieHistory[cc.openTabs[0]].indexOf(sprite[0]), 1);
                            cc.cookieHistory[cc.openTabs[0]].push(sprite[0]);
                        }
                        if(cc.comic.sprites.length) cc.title.className = "none";
                        document.getElementById("tabs").className = "none";
                        document.getElementById("back").className = element.id;
                        document.getElementById("options").className = "none";
                        pagify(sprite, element.id === "cookys" ? "cookies" : element.id);
                    };
                    cc.images.appendChild(img);
                    if(element.id === "cookys" && document.getElementById("sort").value === "recent" && sprite[0] === cc.cookieHistory[cc.openTabs[0]][0]) cc.images.appendChild(document.createElement("br"));
                });
            } else {
                if(element.id === "backgrounds") {
                    if(cc.openTabs[2] !== 1) {
                        cc.openTabs[2] = 1;
                        if(cc.openTabs[0] !== cc.openTabs[1]) {
                            document.getElementById(cc.openTabs[0]).className = "tab unopened";
                            document.getElementById(cc.openTabs[1]).className = "tab";
                        }
                        document.getElementById("ovenbreak").textContent = translateText("Game Locations");
                        document.getElementById("kingdom").textContent = translateText("Basic Backdrops");
                    }
                    if(cc.comic.sprites.length) cc.title.className = "none";
                    document.getElementById("tabs").className = "";
                    document.getElementById("options").className = "none";
                }
                pagify(element.id === "backgrounds" ? (cc.openTabs[1] === "kingdom" ? index.backgrounds.basic : index.backgrounds.game) : index.pets, element.id);
            }
            Array.prototype.forEach.call(document.getElementsByClassName("opened"), function(opened) {
                opened.className = "openable";
            });
            this.className = "openable opened";
        } else {
            cc.images.innerHTML = "";
            this.className = "openable";
        }
    };
});

// Handle opening the text tab
document.getElementById("textboxes").onclick = function() {
    if(this.className === "openable") {
        cc.title.className = "";
        document.getElementById("tabs").className = "none";
        document.getElementById("back").className = "none";
        cc.images.innerHTML = "";
        cc.images.className = "flex";
        cc.tail = null;
        cc.textCanvas.className = "";
        cc.textCanvas.width = 0;
        cc.textCanvas.height = 0;
        var text = document.createElement("textarea");
        text.id = "textbox";
        text.oninput = function() {
            cc.textboxRenderCount++;
            // This 10-millisecond timer is necessary to avoid a bug where typing too fast in a textbox can cause the text to flip or double
            var localTextboxRenderCount = cc.textboxRenderCount;
            setTimeout(function() {
                if(cc.textboxRenderCount === localTextboxRenderCount) drawTextbox();
            }, 10);
        };
        cc.images.appendChild(text);
        var button = document.createElement("button");
        button.innerText = translateText("Create");
        button.id = "create";
        button.disabled = true;
        cc.images.appendChild(button);
        button.outerHTML = '<div id="text-buttons" class="right-buttons">' + button.outerHTML + '<div id="tails" class="column"><button id="top-left" class="tail noblock">&#8598;</button><button id="top-middle" class="tail noblock">&#8593;</button><button id="top-right" class="tail noblock">&#8599;</button><br><button id="bottom-left" class="tail noblock">&#8601;</button><button id="bottom-middle" class="tail noblock">&#8595;</button><button id="bottom-right" class="tail noblock">&#8600;</button></div></div>';
        document.getElementById("create").onclick = function() {
            this.disabled = true;
            var img = document.createElement("img");
            img.src = cc.textCanvas.toDataURL();
            img.onload = function() {
                if(cc.selected !== null) cc.comic.sprites.push({"img": img, "x": 470 * cc.selected[1] + 235 - img.width / 2, "y": 336 * cc.selected[0] + 168 - img.height / 2, "width": cc.textCanvas.width, "height": cc.textCanvas.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                else cc.comic.sprites.push({"img": img, "x": 470 * Math.floor(cc.comic.columns / 2) + 235 - img.width / 2, "y": 336 * Math.floor(cc.comic.rows / 2) + 168 - img.height / 2, "width": cc.textCanvas.width, "height": cc.textCanvas.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                cc.textboxRenderCount = 0;
                text.value = "";
                cc.textCanvas.width = 0;
                cc.textCanvas.height = 0;
                render();
                makeUndoPoint();
                if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
            };
        };
        Array.prototype.forEach.call(document.getElementsByClassName("tail"), function(element) {
            element.onclick = function() {
                if(this.className === "tail noblock") {
                    Array.prototype.forEach.call(document.getElementsByClassName("tail"), function(subelement) {
                        subelement.className = "tail noblock";
                    });
                    this.className = "tail noblock opened";
                    cc.tail = this.id;
                } else {
                    this.className = "tail noblock";
                    cc.tail = null;
                }
                drawTextbox();
            };
        });
        Array.prototype.forEach.call(document.getElementsByClassName("opened"), function(opened) {
            opened.className = "openable";
        });
        this.className = "openable opened";
    } else {
        cc.images.innerHTML = "";
        cc.images.className = "";
        cc.textCanvas.className = "none";
        this.className = "openable";
    }
};

// Handle import button
document.getElementById("import").onclick = function() {
    var file = document.createElement("input");
    file.setAttribute("type", "file");
    file.setAttribute("accept", "application/json");
    file.onchange = function() {
        if(file.files.length) {
            var reader = new FileReader();
            reader.addEventListener("load", function(event) {
                try {
                    var comic = JSON.parse(event.target.result);
                    cc.comic.title = comic.title;
                    cc.title.value = comic.title;
                    cc.comic.rows = comic.rows;
                    cc.comic.columns = comic.columns;
                    cc.canvas.width = comic.columns * 470;
                    cc.canvas.height = comic.rows * 336 + 48;
                    cc.comic.sprites = [];
                    cc.comic.backgrounds = [];
                    comic.sprites.forEach(function(sprite) {
                        var imgTemp = document.createElement("img");
                        imgTemp.onload = function() {
                            var img = document.createElement("img");
                            img.src = sprite.img;
                            img.onload = function() {
                                sprite.img = img;
                                cc.undoPointer--;
                                makeUndoPoint();
                                toggleControls();
                                render();
                            };
                            sprite.img = imgTemp;
                            cc.comic.sprites.push(sprite);
                        };
                        imgTemp.src = "data:image/gif;base64,R0lGODlhAQABAIABAAAAAP///yH5BAEAAAEALAAAAAABAAEAQAICTAEAOw==";
                    });
                    comic.backgrounds.forEach(function(background) {
                        var img = document.createElement("img");
                        img.src = background.img;
                        img.onload = function() {
                            background.img = img;
                            cc.comic.backgrounds.push(background);
                            cc.undoPointer--;
                            makeUndoPoint();
                            toggleControls();
                            render();
                        };
                    });
                    render();
                } catch(err) {
                    console.log(err);
                    alert(translateText("Could not import your comic. Is it in the right format?"));
                }
            });
            reader.readAsBinaryString(file.files[0]);
        }
    };
    file.click();
};

// Handle export button
document.getElementById("export").onclick = function() {
    var link = document.createElement("a");
    link.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cloneObject(cc.comic, true)));
    if(cc.comic.title === "") link.download = "comic.json";
    else link.download = formatFilename(cc.comic.title) + ".json";
    link.click();
    cc.saved = true;
};

// Handle clear button
document.getElementById("clear").onclick = function() {
    if(this.textContent !== translateText("Are you sure?")) {
        this.textContent = translateText("Are you sure?");
        setTimeout(function() {
            document.getElementById("clear").textContent = translateText("Clear");
        }, 3000);
    } else {
        this.textContent = translateText("Clear");
        cc.comic = {"title": "", "rows": cc.comic.rows, "columns": cc.comic.columns, "sprites": [], "backgrounds": []};
        document.getElementById("share").className = "";
        document.getElementById("share-output").className = "none";
        cc.title.value = "";
        cc.saved = false;
        render();
        makeUndoPoint();
    }
};

// Handle share button
document.getElementById("share").onclick = function() {
    this.disabled = true;
    this.textContent = translateText("Uploading...");
    resetCopy();
    render();
    if(cc.comic.columns > 1 || cc.comic.title === "") {
        cc.ctx.font = "Bold 24px CookieRun, Open Sans, sans-serif";
        cc.ctx.fillStyle = "black";
        cc.ctx.textAlign = "right";
        cc.ctx.fillText("cookiecomiccreator.co", cc.canvas.width - 10, cc.canvas.height - 20); // If this annoys you, feel free to crop it out
    }
    try {
        cc.canvas.toBlob(function(blob) {
            var data = new FormData();
            data.append("comic", JSON.stringify(cloneObject(cc.comic, true), null, null));
            if(cc.comic.title === "") data.append("image", blob, "comic.png");
            else data.append("image", blob, formatFilename(cc.comic.title) + ".png");
            fetch("https://cookiecomiccreator.co/share", {
                method: "POST",
                body: data
            }).then(function(response) {
                response.text().then(function(text) {
                    render();
                    document.getElementById("share").disabled = false;
                    document.getElementById("share").textContent = translateText("Share");
                    if(!response.ok) {
                        if(text.length) alert(translateText("An error occurred while trying to share the comic. (") + text + ")");
                        else alert(translateText("An error occurred while trying to share the comic. (") + response.status + ")");
                    } else {
                        document.getElementById("share").className = "none";
                        document.getElementById("share-output").className = "";
                        document.getElementById("share-link").href = "https://" + text;
                        document.getElementById("share-link").textContent = text;
                        document.getElementById("tweet-link").href = "https://twitter.com/intent/tweet?text=%23cookiecomiccreator%20%23cookierun&url=https%3A%2F%2F" + encodeURIComponent(text);
                        document.getElementById("facebook-link").href = "https://www.facebook.com/sharer/sharer.php?display=page&u=https%3A%2F%2F" + encodeURIComponent(text);
                        document.getElementById("tumblr-link").href = "https://www.tumblr.com/widgets/share/tool?posttype=photo&tags=cookie%20comic%20creator%2C%20cookie%20run&canonicalUrl=https%3A%2F%2Fcookiecomiccreator.co%2F&content=https%3A%2F%2F" + encodeURIComponent(text);
                        cc.saved = true;
                    }
                });
            });
        });
    } catch(err) {
        document.getElementById("share").disabled = false;
        document.getElementById("share").textContent = translateText("Share");
        render();
        alert(err);
    }
};

// Handle external share button
document.getElementById("share-external").onclick = function() {
    try {
        navigator.share({title: cc.comic.title.length > 0 ? cc.comic.title : "Comic", url: document.getElementById("share-link").href});
    } catch(err) {
        alert(translateText("An error occurred while trying to share the comic. (") + err + ")");
    }
};

// Handle title changes
cc.title.oninput = function() {
    cc.comic.title = this.value;
    render();
};

// Make an undo point after the title is changed
cc.title.onchange = function() {
    makeUndoPoint();
}

// Handle rotate slider move
document.getElementById("rotate").oninput = function() {
    cc.comic.sprites[cc.comic.sprites.length - 1].rotated = this.value;
    render();
};

// Make an undo point when the rotate slider is released
document.getElementById("rotate").onchange = function() {
    makeUndoPoint();
};

// Handle flip image button
document.getElementById("flip-image").onclick = function() {
    if(cc.comic.sprites[cc.comic.sprites.length - 1].flipped) cc.comic.sprites[cc.comic.sprites.length - 1].flipped = false;
    else cc.comic.sprites[cc.comic.sprites.length - 1].flipped = true;
    render();
    makeUndoPoint();
};

// Handle resize slider move
document.getElementById("resize").oninput = function() {
    cc.comic.sprites[cc.comic.sprites.length - 1].resized = this.value / (100 / 6) - 3;
    var new_width = cc.comic.sprites[cc.comic.sprites.length - 1].img.width + (cc.comic.sprites[cc.comic.sprites.length - 1].img.width * cc.comic.sprites[cc.comic.sprites.length - 1].resized * 0.25);;
    var new_height = cc.comic.sprites[cc.comic.sprites.length - 1].img.height + (cc.comic.sprites[cc.comic.sprites.length - 1].img.height * cc.comic.sprites[cc.comic.sprites.length - 1].resized * 0.25);
    cc.comic.sprites[cc.comic.sprites.length - 1].x += (cc.comic.sprites[cc.comic.sprites.length - 1].width - new_width) / 2;
    cc.comic.sprites[cc.comic.sprites.length - 1].y += (cc.comic.sprites[cc.comic.sprites.length - 1].height - new_height) / 2;
    cc.comic.sprites[cc.comic.sprites.length - 1].width = new_width;
    cc.comic.sprites[cc.comic.sprites.length - 1].height = new_height;
    render();
};

// Make an undo point when the resize slider is released
document.getElementById("resize").onchange = function() {
    makeUndoPoint();
};

// Handle undo button
document.getElementById("undo").onclick = function() {
    cc.undoPointer--;
    syncUndoHistory();
};

// Handle redo button
document.getElementById("redo").onclick = function() {
    cc.undoPointer++;
    syncUndoHistory();
};

// Handle new row button
document.getElementById("add-row").onclick = function() {
    cc.comic.rows += 1;
    cc.canvas.height += 336;
    resetCopy();
    render();
    makeUndoPoint();
    if(cc.comic.rows >= (cc.mobile ? 4 : 5)) this.disabled = true;
    else document.getElementById("remove-row").disabled = false;
};

// Handle delete row button
document.getElementById("remove-row").onclick = function() {
    cc.comic.rows -= 1;
    cc.canvas.height -= 336;
    resetCopy();
    render();
    makeUndoPoint();
    if(cc.comic.rows === 1) this.disabled = true;
    else document.getElementById("add-row").disabled = false;
};

// Handle new column button
document.getElementById("add-column").onclick = function() {
    cc.comic.columns += 1;
    cc.canvas.width += 470;
    resetCopy();
    render();
    makeUndoPoint();
    if(cc.comic.columns >= (cc.mobile ? 3 : 4)) this.disabled = true;
    else document.getElementById("remove-column").disabled = false;
};

// Handle delete column button
document.getElementById("remove-column").onclick = function() {
    cc.comic.columns -= 1;
    cc.canvas.width -= 470;
    resetCopy();
    render();
    makeUndoPoint();
    if(cc.comic.columns === 1) this.disabled = true;
    else document.getElementById("add-column").disabled = false;
};

// Handle panel copy button
document.getElementById("copy-panel").onclick = function() {
    this.textContent = translateText("Cancel Copy");
    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
    if(cc.selected === null || cc.selected[0] === -1) cc.selected = [-2, 0];
    else if(cc.selected[0] >= 0) cc.selected = [-3, cc.selected];
    else resetCopy();
    render();
};

// Handle save image button
document.getElementById("save-image").onclick = function() {
    resetCopy();
    render();
    if(cc.comic.columns > 1 || cc.comic.title === "") {
        cc.ctx.font = "Bold 24px CookieRun, Open Sans, sans-serif";
        cc.ctx.fillStyle = "black";
        cc.ctx.textAlign = "right";
        cc.ctx.fillText("cookiecomiccreator.co", cc.canvas.width - 10, cc.canvas.height - 20); // If this annoys you, feel free to crop it out
    }
    try {
        var link = document.createElement("a");
        link.href = cc.canvas.toDataURL();
        if(cc.comic.columns > 1 || cc.comic.title === "") render();
        if(cc.comic.title === "") link.download = "comic.png";
        else link.download = formatFilename(cc.comic.title) + ".png";
        link.click();
        cc.saved = true;
    } catch(err) {
        if(err.code === 18) alert(translateText("Due to browser limitations, the download button doesn't work while running this site from local files. Instead, right click or long press the comic and select \"Save image as...\" to save your comic."));
        else alert(err);
    }
};

// Handle game switch tabs
document.getElementById("ovenbreak").onclick = document.getElementById("kingdom").onclick = function() {
    if(cc.openTabs[cc.openTabs[2]] === this.id) return;
    document.getElementById(cc.openTabs[cc.openTabs[2]]).className = "tab unopened";
    cc.openTabs[cc.openTabs[2]] = this.id;
    this.className = "tab";
    if(cc.openTabs[2] === 0) {
        if(cc.openTabs[0] === "kingdom") {
            document.getElementById("release").setAttribute("hidden", "");
            document.getElementById("release-new").setAttribute("hidden", "");
        } else {
            document.getElementById("release").removeAttribute("hidden");
            document.getElementById("release-new").removeAttribute("hidden");
        }
    }
    document.getElementById(cc.openTabs[2] === 0 ? "cookys" : "backgrounds").className = "openable";
    document.getElementById(cc.openTabs[2] === 0 ? "cookys" : "backgrounds").click();
};

// Handle back button
document.getElementById("back").onclick = function() {
    document.getElementById(this.className).className = "openable";
    document.getElementById(this.className).click();
    this.className = "none";
};

// Handle custom sprite button
document.getElementById("custom").onclick = function() {
    var file = document.createElement("input");
    file.className = "none";
    file.setAttribute("type", "file");
    file.setAttribute("accept", "image/*");
    file.addEventListener("change", function() {
        file.remove();
        if(file.files.length) {
            var img = new Image();
            img.onload = function() {
                if(img.width > 0 && img.height > 0) {
                    if(img.width > 324) {
                        img.height = img.height * (324 / img.width);
                        img.width = 324;
                    }
                    if(img.height > 182) {
                        img.width = img.width * (182 / img.height);
                        img.height = 182;
                    }
                    if(cc.selected !== null) cc.comic.sprites.push({"img": img, "x": 470 * cc.selected[1] + 235 - img.width / 2, "y": 336 * cc.selected[0] + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                    else cc.comic.sprites.push({"img": img, "x": 470 * Math.floor(cc.comic.columns / 2) + 235 - img.width / 2, "y": 336 * Math.floor(cc.comic.rows / 2) + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "rotated": 0, "held": false});
                    makeUndoPoint();
                    toggleControls();
                    if(window.scrollY > cc.canvas.offsetTop) cc.canvas.scrollIntoView();
                    render();
                }
            };
            var reader = new FileReader();
            reader.onload = () => img.src = reader.result;
            reader.readAsDataURL(file.files[0]);
        }
    });
    document.body.appendChild(file);
    file.click();
};

// Handle search bar
document.getElementById("search").oninput = function() {
    if(this.value === "") document.getElementById("search-style").textContent = "";
    else document.getElementById("search-style").textContent = "img[title]:not([title*='" + this.value.replace(/'/g, "\\'") + "'i]) { display: none } .creator { width: calc(100% - 20px) }";
};

// Handle sort selector
document.getElementById("sort").onchange = function() {
    if(!cc.sortHistory.includes(this.value)) cc.sortHistory.push(this.value);
    if(cc.sortHistory.length === 5) {
        var option = document.createElement("option");
        option.value = "secret";
        option.textContent = translateText("Secret sort");
        this.appendChild(option);
    }
    var opened = document.getElementsByClassName("opened")[0];
    opened.className = "openable";
    opened.click();
};

// Handle theme changer
Array.prototype.forEach.call(document.getElementsByClassName("theme"), function(element) {
    element.onclick = function() {
        document.body.className = element.getAttribute("name");
        document.cookie = "theme=" + element.getAttribute("name") + "; max-age=2592000; path=/";
    };
});