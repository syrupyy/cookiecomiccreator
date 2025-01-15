# Cookie Comic Creator
Create comics with Cookie Run characters and send them to your friends!
## Installation
Clone or download the repo, then download [this index of images](https://cookiecomiccreator.co/assets/img.zip) and merge it into your assets/ folder. You can then just run it in your browser locally (this method does not support sharing or saving images without right-clicking, however) or run it on a web server!
## Building the index yourself
If you want this for something else or would prefer to use your own assets, you can use the scripts in the index/ folder to make your own index.
1. Get an Android emulator (BlueStacks doesn't work from my testing; I use MEmu, but be sure to say no to any fishy offers in the installer) or a rooted Android device + a good file manager, and an (X)APK of Cookie Run: OvenBreak.
2. Make sure your Android installation of OvenBreak has the latest files downloaded (and turn segmented downloads off in the game's settings if you can), then get those files to somewhere you can access them on your computer, either through opening the virtual machine disk with 7zip on Windows (mine was in C:\Program Files (x86)\Microvirt\MEmu\MemuHyperv VMs\MEmu\Memu76-[datetime numbers]FFF-disk2.vmdk and then 2.img in there) or old APK versions of ES File Explorer, and extracting (data/)data/com.devsisters.gb/files/download/.
3. Once that is copied somewhere you can access it on your computer, open the (X)APK (again, in an app like 7zip) and find assets/release, either in the Google Play Asset Pack in an XAPK or just lying around in a normal APK.
4. Drag the asset folders in there to combine them with your data download and you're done combining the original OvenBreak files!
5. Optional: To get Cookie Run for LINE/Kakao sprites, download [쿠키런 for Kakao](https://play.google.com/store/apps/details?id=com.devsisters.CookieRunForKakao) and log in, then complete the data download and use the same steps above to copy the "Patch" folder from your emulator's data into the download folder. Once that's done, open the APK and merge the contents of assets/ into your Patch folder in case of a few extra missing files. If asked what to do with duplicate files, choose "Skip".
6. Put the contents of index/ (index.py, forbidden.txt, kingdom/, etc.) in your download folder (the one with ccb/, image/ and etc).
7. For Kingdom files, [download the folder of cookies from the Kingdom fankit](https://www.dropbox.com/sh/pkmdawhvj08rmxf/AAAT2UqHoRw1gfw239xaLiz1a/03.%20Cookie?dl=0) and extract its contents to the kingdom/ folder. If asked what to do with duplicate files, choose "Skip".
8. Install Python 3.x if you don't already have it.
9. Run index.py, usually by going into said download folder in the command line and running `python3 index.py`
10. Wait for it to make the files.
11. Merge the img/ folder and index.js file into the assets folder of your instance.
12. Done!
## License
The CookieRun Typeface is provided by Devsisters Corp. under their proprietary license, which can be found at CookieRun-Bold-License.pdf or [on their website here.](https://www.cookierunfont.com/static/download/License_ko_en.pdf) All other software in this repository is protected under the MIT license.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.