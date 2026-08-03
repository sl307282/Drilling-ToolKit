import urllib.request
import os
import ssl
from PIL import Image, ImageDraw, ImageFont

ssl._create_default_https_context = ssl._create_unverified_context

# 1. Download Roboto font
font_path = "Roboto-Medium.ttf"
if not os.path.exists(font_path):
    url = "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Medium.ttf"
    urllib.request.urlretrieve(url, font_path)

# Load the new high-quality logo
drill = Image.open('new_logo.png').convert("RGBA")

# Dynamically sample the background color of the new logo from its top-left pixel
# This guarantees that the 9-patch background matches the logo background perfectly!
bg_color = drill.getpixel((0,0))
img = Image.new('RGBA', (800, 800), bg_color)

# Scale the logo to be large and prominent (400x400 max)
drill.thumbnail((400, 400), Image.Resampling.LANCZOS)

# Paste logo perfectly in the center (Y=400 is the center)
x = (800 - drill.width) // 2
y = (800 - drill.height) // 2
img.paste(drill, (x, y), drill)

# 3. Draw Professional Text at the bottom
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(font_path, 44)
text = "Calculators • Guides • References"

# Get text bounding box to center it horizontally
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

text_x = (800 - text_width) // 2
text_y = 620 # Shifted even higher up

# Use a unique color: the app's signature dark green (#4A7C59)
text_color = (74, 124, 89, 255)
draw.text((text_x, text_y), text, font=font, fill=text_color)

# 4. Set up 9-patch borders
# Clear borders first
pixels = img.load()
for ix in range(800):
    pixels[ix, 0] = (0, 0, 0, 0)
    pixels[ix, 799] = (0, 0, 0, 0)
for iy in range(800):
    pixels[0, iy] = (0, 0, 0, 0)
    pixels[799, iy] = (0, 0, 0, 0)

# Draw black stretch marks
# X-axis: Stretch the far left and far right equally to keep content horizontally centered
draw.line([(1, 0), (10, 0)], fill='black', width=1) 
draw.line([(789, 0), (798, 0)], fill='black', width=1) 

# Y-axis: Stretch ABOVE the logo and BELOW the logo (but above the text). 
# Since both are 10px wide, Android splits the extra vertical space 50/50.
# This pushes the logo to the exact vertical center of the screen, and pushes the text to the absolute bottom!
draw.line([(0, 1), (0, 10)], fill='black', width=1)      # Top stretch
draw.line([(0, 580), (0, 590)], fill='black', width=1)  # Middle stretch (shifted up to stay safely above text)

# Content region: Use the whole image bounds
draw.line([(1, 799), (798, 799)], fill='black', width=1) 
draw.line([(799, 1), (799, 798)], fill='black', width=1) 

img.save('android/app/src/main/res/drawable-nodpi/splash_background.9.png')
hex_color = "#{:02x}{:02x}{:02x}".format(bg_color[0], bg_color[1], bg_color[2]).upper()
print(f"Generated 9-patch with text! Detected background color: {hex_color}")
