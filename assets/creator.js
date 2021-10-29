// Cookie Comic Creator, by syrupyy
"use strict";

// Functions

// Load an image into the canvas
function loadImage(url, callback) {
    var img = new Image();
    img.onload = function() {
        callback(img);
    };
    img.src = url;
}

// Print a page of sprites
function pagify(sprites, id, offset = 0) {
    var className = id.slice(0, -1);
    var newOffset = offset + (id === "backgrounds" ? 12 : 20);
    if(sprites.length === 2) {
        var key = sprites[0];
        var entries = Object.entries(sprites[1]);
    } else var entries = sprites;
    document.getElementById("images").innerHTML = "";
    if(offset !== 0 || entries.length > newOffset) {
        var previous = document.createElement("button");
        previous.innerText = "Previous Page";
        previous.id = "previous-page";
        if(offset === 0) previous.disabled = true;
        else previous.onclick = function() {
            pagify(sprites, id, offset - (id === "backgrounds" ? 12 : 20));
        }
        document.getElementById("images").appendChild(previous);
        var next = document.createElement("button");
        next.innerText = "Next Page";
        next.id = "next-page";
        if(newOffset >= entries.length) next.disabled = true;
        else next.onclick = function() {
            pagify(sprites, id, newOffset);
        }
        document.getElementById("images").appendChild(next);
        document.getElementById("images").appendChild(document.createElement("br"));
    }
    entries.forEach(function(sprite, i) {
        if(i < offset || i >= newOffset) return;
        var img = document.createElement("img");
        if(typeof key !== "undefined") {
            img.src = "assets/img/" + id + "/" + key + "/" + sprite[0];
            img.width = sprite[1].width;
            img.height = sprite[1].height;
        } else img.src = "assets/img/" + id + "/" + sprite;
        img.className = className;
        img.onload = function() {
            img.onclick = function() {
                if(id === "backgrounds") {
                    if(comic.selected === null) {
                        if(window.scrollY > canvas.offsetTop) canvas.scrollIntoView();
                        comic.selected = [-1, img];
                    } else {
                        var backgroundX = 470 * comic.selected[1] + 8;
                        var backgroundY = 336 * comic.selected[0] + 8;
                        comic.backgrounds.forEach(function(background, index) {
                            if(background.x === backgroundX && background.y === backgroundY) comic.backgrounds.splice(index, 1);
                        });
                        if(sprite !== "bg_none.png") comic.backgrounds.push({"img": img, "x": backgroundX, "y": backgroundY});
                        comic.selected = null;
                        if(window.scrollY > canvas.offsetTop) canvas.scrollIntoView();
                    }
                } else {
                    if(id === "cookies" || id === "pets") {
                        if(id === "pets") {
                            var width = img.width * 0.5;
                            var height = img.height * 0.5;
                        } else {
                            var width = sprite[1].width - sprite[1].width * 0.25;
                            var height = sprite[1].height - sprite[1].height * 0.25;
                        }
                        if(comic.selected !== null) comic.sprites.push({"img": img, "x": 470 * comic.selected[1] + 235 - width / 2, "y": 336 * comic.selected[0] + 168 - height / 2, "width": width, "height": height, "resized": (id === "pets" ? -2 : -1), "flipped": false, "held": false});
                        else comic.sprites.push({"img": img, "x": canvas.width / 2 - width / 2, "y": (canvas.height - 48) / 2 - height / 2, "width": width, "height": height, "resized": (id === "pets" ? -2 : -1), "flipped": false, "held": false});
                    } else {
                        if(comic.selected !== null) comic.sprites.push({"img": img, "x": 470 * comic.selected[1] + 235 - img.width / 2, "y": 336 * comic.selected[0] + 168 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "held": false});
                        else comic.sprites.push({"img": img, "x": canvas.width / 2 - img.width / 2, "y": (canvas.height - 48) / 2 - img.height / 2, "width": img.width, "height": img.height, "resized": 0, "flipped": false, "held": false});
                    }
                    toggleControls(false);
                    if(window.scrollY > canvas.offsetTop) canvas.scrollIntoView();
                }
                render();
            }
        }
        document.getElementById("images").appendChild(img);
    });
}

// (Re)render the canvas
function render() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = "4";
    ctx.strokeStyle = "black";
    ctx.imageSmoothingQuality = "high";
    comic.backgrounds.forEach(function(element) {
        ctx.drawImage(element.img, element.x, element.y);
    });
    comic.sprites.forEach(function(element) {
        if(element.flipped) {
            ctx.save();
            ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(element.img, -element.width / 2, -element.height / 2, element.width, element.height);
            ctx.restore();
        } else ctx.drawImage(element.img, element.x, element.y, element.width, element.height);
    });
    ctx.fillRect(0, 0, canvas.width, 6);
    ctx.fillRect(0, 0, 6, canvas.height);
    if(comic.selected !== null && comic.selected[0] < 0) ctx.strokeStyle = "#ffd71e";
    for(var i = 0; i < comic.rows; i++) for(var i2 = 0; i2 < comic.columns; i2++) {
        ctx.rect(470 * i2 + 8, 336 * i + 8, 454, 320);
        ctx.stroke();
        ctx.fillRect(470 * i2 + 464, 336 * i + 6, 12, 336);
        ctx.fillRect(470 * i2 + 6, 336 * i + 330, 464, 12);
    }
    if(comic.selected !== null && comic.selected[0] >= 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#ffd71e";
        ctx.rect(470 * comic.selected[1] + 8, 336 * comic.selected[0] + 8, 454, 320);
        ctx.stroke();
    } else if(comic.selected !== null && comic.selected[0] === -3) {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.rect(470 * comic.selected[1][1] + 8, 336 * comic.selected[1][0] + 8, 454, 320);
        ctx.stroke();
    }
    ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
    ctx.font = "Bold 24px CookieRun, Open Sans, sans-serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    if(comic.selected !== null && comic.selected[0] === -1) ctx.fillText("Select a panel to place the background", 10, canvas.height - 20);
    else if(comic.selected !== null && comic.selected[0] === -2) ctx.fillText("Select a panel to copy", 10, canvas.height - 20);
    else if(comic.selected !== null && comic.selected[0] === -3) ctx.fillText("Select a panel to paste over", 10, canvas.height - 20);
    else ctx.fillText(comic.title, 10, canvas.height - 20);
}

// Draw a textbox to the textbox canvas
function drawTextbox() {
	var inputWords = document.getElementById("textbox").value.split(" ");
    var inputLines = [""];
    var currentLine = 0;
    textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";

    // Calculate the length of each line for splitting purposes
    inputWords.forEach(function(word) {
        var splitWord = word.split("\n");
        if(splitWord.length > 1) splitWord.forEach(function(subword, index) {
            if(index > 0) {
                inputLines.push(subword);
            } else word = subword;
        });
        if(textCtx.measureText(inputLines[currentLine] + (inputLines[currentLine] === "" ? "" : " ") + word).width > 282 && inputLines[currentLine] !== "") {
            currentLine++;
            inputLines.splice(currentLine, 0, "");
        }
        if(inputLines[currentLine] === "") inputLines[currentLine] = word;
        else inputLines[currentLine] += " " + word;
        if(splitWord.length > 1) currentLine += splitWord.length - 1;
    });
    textCanvas.height = inputLines.length * 22 + 41;
    textCanvas.width = 0;
    inputLines.forEach(function(line, i) {
        textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";
        var lineWidth = textCtx.measureText(line).width;
        if(lineWidth > textCanvas.width) textCanvas.width = lineWidth;
    });
    textCanvas.width += 38;
    if(textCanvas.width < 62) {
        textCanvas.width = 0;
        textCanvas.height = 0;
        document.getElementById("create").disabled = true;
        return;
    }
    if(textCanvas.width > 320) textCanvas.width = 320;
    textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";

    // Draw the corners of the textbox (stored in Base64 so this can run offline without tainting the canvas)
    var img = new Image();
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAABkUlEQVQ4jaWTXUsCQRSG37MmubtlUiuW9GFrFyVlVhpBIkREBV3UxV4XQRd9QBFEVPQrCroyJegLivoDq/fdhBX9gH6GmRMDjSiV7doLA/OeGZ45Z84MTW/Nwa5ezsz294I0QYzFQYgA6AbQVGeHk0tmlxixTYAiBAZQ5bolWC5lGozREQi+avuqwp5SmWiR4QSgaHlcVRswNTOL8UQC/QNhdHYF4Ha7f4c9JjPzRLgrj+nBHmxsbWPBMCDLirXMcsnsIhHSwte7XNjdP8TK2jqcTqf1Mr8yKoG69SBS51foDYV+hfwIy52ao0RUKi0cGcLFzR00r/dP0DdYEXQiuh3QdVze3qNF0yyBuKRSVinTIGCYz12yjPT5tS1QBYwxOhbznb0DS3f0Tfw7+RqVZZ9bYXzEBvpYPp9ntUhktikOWVndqNr+aiJ/s9zxUaA3vkdRVDw8v0KzeVdCUvFdmhQmNjYGj8dTE4hLYhKLCzM4PAKHw1E7DAxhYfhr/494A3QBaG3z/xvWJIyiqrWTAHwCD2mOCcxJ9y4AAAAASUVORK5CYII=";
    img.onload = function() {
        if(tail === "top-left") {
            textCtx.save();
            textCtx.translate(textCanvas.width, textCanvas.height);
            textCtx.scale(-1, -1);
        } else if(tail === "top-middle" || tail === "top-right") {
            textCtx.save();
            textCtx.translate(0, textCanvas.height);
            textCtx.scale(1, -1);
        }
        textCtx.drawImage(img, 0, 0);
        textCtx.translate(textCanvas.width, 0);
        textCtx.scale(-1, 1);
        textCtx.drawImage(img, 0, 0);
        img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAVCAYAAACkCdXRAAACF0lEQVQ4jaVSQWsTQRh932YDMQniranWaooUi4o1XhQqYnPwItKTHsWCF0Hw7knwF3i3BVEPihS8qIcEKWrRaLYJCr24Gw1xEwPB7CYhMdkdmUmm2GjqJn3wMfNmPh7vezMY2x1kslKpFGu322xUKOhDq9XqP/IMLubIZtd10Wg0diT2U5J6rQbbtnckpktSNL+jUqkIh6OJEbKSGPoXsZbL5dHEyKXXkmS1tFjz+fxI7hRFdZOSvF9bw6/eaxYKheHFjl2JfwPrjtpo1LH6qqtdKpVEDSXWW+/KgyePHsJxur+FjztMfr5Dp6YRiUW1omZcBxCyLQuhUAgzR46Khmq1Cp/Ph3A47NkZiNgNuX+wvISvhrHZxB3yko63dcYROTH12dSMiwSMO04H2scUzp6LIxAIiPt6vY5isShcBoNBENFgMY4fmr4O0DW+r9k2susaTs+d2RTksCwLpmmi2Wyi0+n0piIoigI6f/PCFnXtXnKBCCuS7903gVu37+BANPrfzLY44xiPRTdK6VwOhAXObdtC4uUL+P1+TB+eEQ48i4n8YtGMmdazRHSZ826GH7CaTCAQ2IX9k5Pwqao3sa7DqY2Spj9noJP8UaTLd2/f4NnKU+R0XeTKmAtVVUX9ldm/kFlOXGKM+Mce265vcAB/4PjV+OPZxfkIMVoEQ2ZQnydn/fh0PzHR7ijzxNgcCLMADgLY8xuYQxiIUPwcOgAAAABJRU5ErkJggg==";
        img.onload = function() {
            textCtx.drawImage(img, 0, textCanvas.height - 36);
            textCtx.translate(textCanvas.width, 0);
            textCtx.scale(-1, 1);
            textCtx.drawImage(img, 0, textCanvas.height - 36);

            // Draw the lines of the textbox
            textCtx.fillStyle = "#170e0a";
            textCtx.fillRect(19, 0, textCanvas.width - 38, 3);
            textCtx.fillRect(19, textCanvas.height - 18, textCanvas.width - 38, 3);
            textCtx.fillRect(0, 19, 3, textCanvas.height - 55);
            textCtx.fillRect(textCanvas.width - 3, 19, 3, textCanvas.height - 55);
            textCtx.fillStyle = "#cbcbcb";
            textCtx.fillRect(19, textCanvas.height - 22, textCanvas.width - 38, 4);
            textCtx.fillRect(3, 19, 1, textCanvas.height - 55);
            textCtx.fillRect(textCanvas.width - 4, 19, 1, textCanvas.height - 55);
            textCtx.fillStyle = "#fff";
            textCtx.fillRect(19, 3, textCanvas.width - 38, textCanvas.height - 25);
            textCtx.fillRect(4, 19, textCanvas.width - 8, textCanvas.height - 55);

            // Draw a tail if applicable
            if(tail === "top-middle" || tail === "bottom-middle") img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAMAAADto6y6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/FBMVEUAAAAAAAAqAAAbDQ0VDgcaDwoZDwoYEAwXDwsXDQoYDwkYDQsXDQoYDgoXDgkYDQsXDgoWDgoYDwkWDgoXDgoXDgoXDgoXDgoXDgoXDgoYDgsXDgoXDgoXDgoXDgoXDgr////+/v79/f38/Pz6+vrt7Ozq6uro6Ojm5ubm5eTl5eXj4+Pi4uLh4eHb2dnMzMzLy8vKysrJycnHx8bFxMTBwcC+vb2+vLuzsK6UkZCVkI+NioiJhIKHhIKGgoF+enl3c3FxbGpwa2lpZGJfWVZbVVNTTEk4MC03MC0xKSYuJiIsJCEnHhsjGxcfFxMdFREbEg8aEQ0YDwsXDgoAEmAwAAAAIHRSTlMAAgYTJDIzQUNMVmFja291fH+MlLHExsnL1Nnc4efo8ef7850AAADSSURBVHjapcvVVgNBFETRiwYnuJMmBCd04e7ucv7/X1iZnkl6wiPnsfYq8/Iul1eSeflqvFfr0HRJ9wDRZVMZAHwuZXtF0sFHbUuAkww2JN3QgMdy2Bcl7b8HMLM5OAywLukKpixUhLtkL0vae4PuFNrge60Gq5IuYdqyxuEsPey+Qk8dCvBScW5F0gXMWqMZOHILknaeoTeCAXhwy5JOYT7arRV+tiRtP0F/DDYGt5LOodSSg07g/vj6C/os3wihSWtuONknOv6AtQ+ODnXZP/oFvL9CRV856VEAAAAASUVORK5CYII=";
            else img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAMAAADto6y6AAAACXBIWXMAD0JAAA9CQAE0jWzJAAABIFBMVEUAAAAAAAAXCwsWEAsVEAoaDwoZDwoWDQkYEAwYDgoYDwkYDQsXDQoYDgoXDgkXDgkXDgkYDgoXDgoXDQoXDgsXDgsXDgoXDgkXDQkYDgoXDgoXDgoXDgoXDwoXDgoXDgoXDgoXDgoXDgoXDgr////+/v79/f35+fn19fXy8vLx8fHv7+/u7u7t7e3s7Ozr6+vo6Ojm5ubk5OTj4+Pi4uLh4eHg4ODLy8vKysrJycnHx8fHx8bFxcXDw8PCwcG9vLy2tbSvra2urayrqqmop6anpaShn56dm5qcmZiWk5KTkI+Oi4qMiYiHg4J7d3VtaGZlYF1gWlhUTktPSUdIQT5FPjs/ODQ8NTEzLCgsJCEmHhogGBQdFBAZEAwYDwsXDgrW9Kz0AAAAJHRSTlMAAS0vMTI0OUFKVGBkam1ucYKTmqaptLy+w8TKy9LW3N3q+PrbcBt7AAAA6UlEQVR42m3Q11ICURBF0TZhzjmnEQHFjMecwZyzovv//8K6DJR3ptiPvZ76mJQJYiUlySRlY5CqgJarwraklSjsOuB5T9KqD+lTwOD1QNJaFeD9UNK6B2cwZR3Ax5GkjX8owLBZK/B5LClXgUwI1gJ85SVtJkNYKIM1A9/nTuajYE0zULxyb6VKcAGDJbDGafi5dZJ2cAkDIVhiEn7vnCwGQdYDqxsF7rckLc3lfLDaEeDRDSdFwKwPeHL76Rr6PbAe4GVf0gN0+mDdwNvJzk0RGiJgXZQbs1ht4X08EQer752YHWqvMfsD9ZFYzrgEYpYAAAAASUVORK5CYII=";
            img.onload = function() {
                switch(tail) {
                    case "top-left":
                    case "top-right":
                        textCtx.drawImage(img, textCanvas.width - 43, textCanvas.height - 22);
                        textCtx.restore();
                        break;
                    case "top-middle":
                        textCtx.drawImage(img, textCanvas.width / 2 - 12, textCanvas.height - 22);
                        textCtx.restore();
                        break;
                    case "bottom-left":
                        textCtx.save();
                        textCtx.translate(textCanvas.width, 0);
                        textCtx.scale(-1, 1);
                        textCtx.drawImage(img, textCanvas.width - 43, textCanvas.height - 22);
                        textCtx.restore();
                        break;
                    case "bottom-middle":
                        textCtx.drawImage(img, textCanvas.width / 2 - 12, textCanvas.height - 22);
                        break;
                    case "bottom-right":
                        textCtx.drawImage(img, textCanvas.width - 43, textCanvas.height - 22);
                }

                // Finally, draw text
                textCtx.fillStyle = "#000";
                textCtx.font = "Bold 18px CookieRun, Open Sans, sans-serif";
                inputLines.forEach(function(line, index) {
                    if(tail !== null && tail.startsWith("top-")) textCtx.fillText(line, 19, 45 + (24 * index));
                    else textCtx.fillText(line, 19, 28 + (22 * index));
                });

                // Undisable the create button
                document.getElementById("create").disabled = false;
            }
        }
    }
}

// Turn controls on or off
function toggleControls(disabled) {
    Array.prototype.forEach.call(document.getElementById("controls").children, function(element) {
        if(disabled) element.setAttribute("disabled", "");
        else element.removeAttribute("disabled");
    });
}

// Define variables
var canvas = document.getElementById("comic");
var ctx = canvas.getContext("2d");
var textCanvas = document.getElementById("text");
var textCtx = textCanvas.getContext("2d");
var comic = {"rows": 1, "columns": 3, "title": "", "selected": null, "backgrounds": [], "sprites": []};
if(window.innerWidth < 980) {
    comic.rows = 2;
    comic.columns = 2;
    canvas.width -= 470;
    canvas.height += 336;
    document.getElementById("remove-row").disabled = false;
    document.getElementById("add-column").disabled = false;
}
var holding = false;
var startX, startY;
var tail = null;
var textboxRenderCount = 0;
index.backgrounds.unshift("bg_none.png");
render();

// Events

// Handle clicks and taps
canvas.onmousedown = function(event) {
    if(event.type === "touchstart") {
        var pageX = event.changedTouches[0].pageX;
        var pageY = event.changedTouches[0].pageY;
    } else {
        var pageX = event.pageX;
        var pageY = event.pageY;
    }
    if(event.type === "touchstart" || event.button === 0) {
        var x = (pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth;
        var y = (pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight;
        for(var i = comic.sprites.length - 1; i >= 0 && holding === false; i--) {
            var element = comic.sprites[i];
            if(x > element.x && x < element.x + element.width && y > element.y && y < element.y + element.height) {
                comic.sprites[i].held = true;
                comic.sprites.push(comic.sprites.splice(i, 1)[0]);
                holding = true;
                startX = x;
                startY = y;
                if(element.resized === 3) document.getElementById("increase-size").disabled = true;
                else document.getElementById("increase-size").disabled = false;
                if(element.resized === -3) document.getElementById("decrease-size").disabled = true;
                else document.getElementById("decrease-size").disabled = false; 
            }
        }
        if(holding === false) {
            for(var i = 0; i < comic.rows; i++) for(var i2 = 0; i2 < comic.columns; i2++) {
                if(x > 470 * i2 + 8 && x < 470 * i2 + 462 && y > 336 * i + 8 && y < 336 * i + 328) {
                    if(comic.selected !== null && comic.selected[0] === i && comic.selected[1] === i2) comic.selected = null;
                    else if(comic.selected !== null && comic.selected[0] === -1) {
                        var backgroundX = 470 * i2 + 8;
                        var backgroundY = 336 * i + 8;
                        comic.backgrounds.forEach(function(background, index) {
                            if(background.x === backgroundX && background.y === backgroundY) comic.backgrounds.splice(index, 1);
                        });
                        if(!comic.selected[1].src.endsWith("/bg_none.png")) comic.backgrounds.push({"img": comic.selected[1], "x": backgroundX, "y": backgroundY});
                        comic.selected = null;
                    } else if(comic.selected !== null && comic.selected[0] === -2) {
                        comic.selected = [-3, [i, i2]];
                        render();
                    } else if(comic.selected !== null && comic.selected[0] === -3) {
                        if(i !== comic.selected[1][0] || i2 !== comic.selected[1][1]) {
                            var backgroundX = 470 * i2 + 8;
                            var backgroundY = 336 * i + 8;
                            var oldBackgroundX = 470 * comic.selected[1][1] + 8;
                            var oldBackgroundY = 336 * comic.selected[1][0] + 8;
                            var oldBackground = null;
                            comic.backgrounds.forEach(function(background, i) {
                                if(background.x === oldBackgroundX && background.y === oldBackgroundY) oldBackground = background.img;
                                else if(background.x === backgroundX && background.y === backgroundY) comic.backgrounds.splice(i, 1);
                            });
                            if(oldBackground !== null) comic.backgrounds.push({"img": oldBackground, "x": backgroundX, "y": backgroundY});
                            var splices = [];
                            comic.sprites.forEach(function(sprite, i) {
                                var differenceX = (backgroundX + 454) - sprite.x;
                                var differenceY = (backgroundY + 320) - sprite.y;
                                var oldDifferenceX = (oldBackgroundX + 454) - sprite.x;
                                var oldDifferenceY = (oldBackgroundY + 320) - sprite.y;
                                if(differenceX >= 0 && differenceX - sprite.width <= 454 && differenceY >= 0 && differenceY - sprite.height <= 320) splices.push(i);
                                else if(oldDifferenceX >= 0 && oldDifferenceX - sprite.width <= 454 && oldDifferenceY >= 0 && oldDifferenceY - sprite.height <= 320) {
                                    comic.sprites.push({"img": sprite.img, "x": backgroundX + 454 - oldDifferenceX, "y": backgroundY + 320 - oldDifferenceY, "width": sprite.width, "height": sprite.height, "resized": sprite.resized, "flipped": sprite.flipped, "held": false});
                                }
                            });
                            splices.forEach(function(splice, i) {
                                comic.sprites.splice(splice - i, 1);
                            });
                            document.getElementById("copy-panel").textContent = "Copy Panel";
                            comic.selected = null;
                        }
                    } else comic.selected = [i, i2];
                }
            }
        }
        render();
    }
}
canvas.addEventListener("touchstart", canvas.onmousedown, {passive: true});

// Handle dragging
document.onmousemove = document.ontouchmove = function(event) {
    if(holding === true) {
        if(event.type === "touchmove") {
            event.preventDefault();
            var pageX = event.changedTouches[0].pageX;
            var pageY = event.changedTouches[0].pageY;
        } else {
            var pageX = event.pageX;
            var pageY = event.pageY;
        }
        comic.sprites.forEach(function(element) {
            if(element.held === true) {
                var canvasX = ((pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth);
                element.x += canvasX - startX;
                startX = canvasX;
                var canvasY = ((pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight);
                element.y += canvasY - startY;
                startY = canvasY;
            }
        });
        render();
    }
}

// Handle mouse/finger release
document.onmouseup = document.ontouchend = function() {
    holding = false;
    comic.sprites.forEach(function(element, index) {
        element.held = false;
        if(element.x > canvas.width - 10 || element.y > canvas.height - 58 || element.x <= -element.width + 10 || element.y <= -element.height + 10) comic.sprites.splice(index, 1);
    });
    if(comic.sprites.length === 0) toggleControls(true);
    else {
        if(comic.sprites[comic.sprites.length - 1].resized === 3) document.getElementById("increase-size").disabled = true;
        else document.getElementById("increase-size").disabled = false;
        if(comic.sprites[comic.sprites.length - 1].resized === -3) document.getElementById("decrease-size").disabled = true;
        else document.getElementById("decrease-size").disabled = false; 
    }
}

// Cancel touch event to avoid weird canvas selection bug
canvas.ontouchend = function(event) {
    event.preventDefault();
}

// Handle tab clicks
Array.prototype.forEach.call(document.getElementsByClassName("openable"), function(element) {
    if(element.id !== "textboxes") element.onclick = function() {
        document.getElementById("back").className = "none";
        document.getElementById("images").className = "";
        textCanvas.className = "none";
        if(this.className === "openable") {
            if(element.id === "cookies" || element.id === "props") {
                document.getElementById("images").innerHTML = "";
                var sprites = Object.entries(element.id === "cookies" ? index.cookies : index.props);
                sprites.forEach(function(sprite) {
                    var img = document.createElement("img");
                    var subentries = Object.entries(sprite[1]);
                    if(element.id === "cookies") {
                        img.src = "assets/img/heads/" + sprite[0] + "_head.png";
                        img.className = "head";
                    } else img.src = "assets/img/props/" + sprite[0] + "/" + Object.entries(subentries[sprite[0] === "effect" ? 12 : 0])[0][1];
                    img.onclick = function() {
                        document.getElementById("back").className = element.id;
                        pagify(sprite, element.id);
                    }
                    document.getElementById("images").appendChild(img);
                });
            } else pagify(element.id === "pets" ? index.pets : index.backgrounds, element.id);
            Array.prototype.forEach.call(document.getElementsByClassName("opened"), function(opened) {
                opened.className = "openable";
            });
            this.className = "openable opened";
        } else {
            document.getElementById("images").innerHTML = "";
            this.className = "openable";
        }
    }
});

// Handle opening the text tab
document.getElementById("textboxes").onclick = function() {
    if(this.className === "openable") {
        document.getElementById("back").className = "none";
        document.getElementById("images").innerHTML = "";
        document.getElementById("images").className = "flex";
        tail = null;
        textCanvas.className = "";
        textCanvas.width = 0;
        textCanvas.height = 0;
        var text = document.createElement("textarea");
        text.id = "textbox";
        text.oninput = function() {
            textboxRenderCount++;
            // This 10-millisecond timer is necessary to avoid a bug where typing too fast in a textbox can cause the text to flip or double
            var localTextboxRenderCount = textboxRenderCount;
            setTimeout(function() {
                if(textboxRenderCount === localTextboxRenderCount) drawTextbox();
            }, 10);
        };
        document.getElementById("images").appendChild(text);
        var button = document.createElement("button");
        button.innerText = "Create";
        button.id = "create";
        button.disabled = true;
        document.getElementById("images").appendChild(button);
        button.outerHTML = '<div id="text-buttons" class="right-buttons">' + button.outerHTML + '<div id="tails" class="column"><button id="top-left" class="tail noblock">&#8598;</button><button id="top-middle" class="tail noblock">&#8593;</button><button id="top-right" class="tail noblock">&#8599;</button><br><button id="bottom-left" class="tail noblock">&#8601;</button><button id="bottom-middle" class="tail noblock">&#8595;</button><button id="bottom-right" class="tail noblock">&#8600;</button></div></div>';
        document.getElementById("create").onclick = function() {
            this.disabled = true;
            var img = document.createElement("img");
            img.src = textCanvas.toDataURL();
            img.onload = function() {
                if(comic.selected !== null) comic.sprites.push({"img": img, "x": 470 * comic.selected[1] + 235 - img.width / 2, "y": 336 * comic.selected[0] + 168 - img.height / 2, "width": textCanvas.width, "height": textCanvas.height, "resized": 0, "flipped": false, "held": false});
                else comic.sprites.push({"img": img, "x": canvas.width / 2 - img.width / 2, "y": canvas.height / 2 - img.height / 2, "width": textCanvas.width, "height": textCanvas.height, "resized": 0, "flipped": false, "held": false});
                textboxRenderCount = 0;
                text.value = "";
                textCanvas.width = 0;
                textCanvas.height = 0;
                render();
            }
        }
        Array.prototype.forEach.call(document.getElementsByClassName("tail"), function(element) {
            element.onclick = function() {
                if(this.className === "tail noblock") {
                    Array.prototype.forEach.call(document.getElementsByClassName("tail"), function(subelement) {
                        subelement.className = "tail noblock";
                    });
                    this.className = "tail noblock opened";
                    tail = this.id;
                } else {
                    this.className = "tail noblock";
                    tail = null;
                }
                drawTextbox();
            }
        });
        Array.prototype.forEach.call(document.getElementsByClassName("opened"), function(opened) {
            opened.className = "openable";
        });
        this.className = "openable opened";
    } else {
        document.getElementById("images").innerHTML = "";
        document.getElementById("images").className = "";
        textCanvas.className = "none";
        this.className = "openable";
    }
}

// Handle title changes
document.getElementById("title").oninput = function() {
    comic.title = this.value;
    render();
}

// Handle flip button
document.getElementById("flip").onclick = function() {
    if(comic.sprites[comic.sprites.length - 1].flipped) comic.sprites[comic.sprites.length - 1].flipped = false;
    else comic.sprites[comic.sprites.length - 1].flipped = true;
    render();
}

// Handle upscale button
document.getElementById("increase-size").onclick = function() {
    if(comic.sprites[comic.sprites.length - 1].resized === 3) {
        this.disabled = true;
        return;
    }
    comic.sprites[comic.sprites.length - 1].resized += 1;
    comic.sprites[comic.sprites.length - 1].width = comic.sprites[comic.sprites.length - 1].img.width + (comic.sprites[comic.sprites.length - 1].img.width * comic.sprites[comic.sprites.length - 1].resized * 0.25);
    comic.sprites[comic.sprites.length - 1].height = comic.sprites[comic.sprites.length - 1].img.height + (comic.sprites[comic.sprites.length - 1].img.height * comic.sprites[comic.sprites.length - 1].resized * 0.25);
    render();
    if(comic.sprites[comic.sprites.length - 1].resized === 3) this.disabled = true;
    else document.getElementById("decrease-size").disabled = false;
}

// Handle downscale button
document.getElementById("decrease-size").onclick = function() {
    if(comic.sprites[comic.sprites.length - 1].resized === -3) {
        this.disabled = true;
        return;
    }
    comic.sprites[comic.sprites.length - 1].resized -= 1;
    comic.sprites[comic.sprites.length - 1].width = comic.sprites[comic.sprites.length - 1].img.width + (comic.sprites[comic.sprites.length - 1].img.width * comic.sprites[comic.sprites.length - 1].resized * 0.25);
    comic.sprites[comic.sprites.length - 1].height = comic.sprites[comic.sprites.length - 1].img.height + (comic.sprites[comic.sprites.length - 1].img.height * comic.sprites[comic.sprites.length - 1].resized * 0.25);
    render();
    if(comic.sprites[comic.sprites.length - 1].resized === -3) this.disabled = true;
    else document.getElementById("increase-size").disabled = false;
}

// Handle new row button
document.getElementById("add-row").onclick = function() {
    comic.rows += 1;
    canvas.height += 336;
    comic.selected = null;
    render();
    if(comic.rows === 4) this.disabled = true;
    else document.getElementById("remove-row").disabled = false;
}

// Handle delete row button
document.getElementById("remove-row").onclick = function() {
    comic.rows -= 1;
    canvas.height -= 336;
    comic.selected = null;
    render();
    if(comic.rows === 1) this.disabled = true;
    else document.getElementById("add-row").disabled = false;
}

// Handle new column button
document.getElementById("add-column").onclick = function() {
    comic.columns += 1;
    canvas.width += 470;
    comic.selected = null;
    render();
    if(comic.columns === 3) this.disabled = true;
    else document.getElementById("remove-column").disabled = false;
}

// Handle delete column button
document.getElementById("remove-column").onclick = function() {
    comic.columns -= 1;
    canvas.width -= 470;
    comic.selected = null;
    render();
    if(comic.columns === 1) this.disabled = true;
    else document.getElementById("add-column").disabled = false;
}

// Handle panel copy button
document.getElementById("copy-panel").onclick = function() {
    if(window.scrollY > canvas.offsetTop) canvas.scrollIntoView();
    if(comic.selected === null || comic.selected[0] === -1) comic.selected = [-2, 0];
    else if(comic.selected[0] >= 0) comic.selected = [-3, comic.selected];
    else comic.selected = null;
    if(comic.selected !== null) this.textContent = "Cancel Copy";
    else this.textContent = "Copy Panel";
    render();
}

// Handle save image button
document.getElementById("save-image").onclick = function() {
    comic.selected = null;
    render();
    if(comic.columns > 1 || comic.title === "") {
        ctx.font = "Bold 24px CookieRun, Open Sans, sans-serif";
        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText("cookiecomiccreator.co", canvas.width - 10, canvas.height - 20); // If this annoys you, feel free to crop it out
    }
    try {
        var link = document.createElement("a");
        link.href = canvas.toDataURL();
        if(comic.columns > 1) render();
        link.download = "comic.png";
        link.click();
    } catch(err) {
        if(err.code === 18) alert("Due to browser limitations, the download button doesn't work while running this site from local files. Instead, right click or long press the comic and select \"Save image as...\" to save your comic.");
        else alert(err);
    }
}

// Handle back button
document.getElementById("back").onclick = function() {
    document.getElementById(this.className).className = "openable";
    document.getElementById(this.className).click();
    this.className = "none";
}