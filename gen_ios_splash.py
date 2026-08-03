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

# 2. Load the new high-quality logo
drill = Image.open('new_logo.png').convert("RGBA")

# Dynamically sample background color
bg_color = drill.getpixel((0,0))
# Canvas for iOS is 2732x2732 (largest iPad Pro size, fits everything)
CANVAS_SIZE = 2732
img = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), bg_color)

# 3. Scale logo appropriately
# On Android (800px canvas), logo was bounded to 400x400.
# Ratio = 400/800 = 0.5.
# On 2732 canvas, max bounding box is 1366x1366.
drill.thumbnail((1366, 1366), Image.Resampling.LANCZOS)

# 4. Paste logo perfectly in the center
x = (CANVAS_SIZE - drill.width) // 2
y = (CANVAS_SIZE - drill.height) // 2
img.paste(drill, (x, y), drill)

# 5. Draw Professional Text below the logo
draw = ImageDraw.Draw(img)
# On Android, font size was 44 on 800px. 44 * (2732/800) ≈ 150
font = ImageFont.truetype(font_path, 150)
text = "Calculators • Guides • References"

bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

text_x = (CANVAS_SIZE - text_width) // 2
text_y = 2543 # Shifted absolutely as far down to the bottom as safely possible

# Signature green
text_color = (74, 124, 89, 255)
draw.text((text_x, text_y), text, font=font, fill=text_color)

# Save the final image
output_dir = 'ios/App/App/Assets.xcassets/Splash.imageset'
os.makedirs(output_dir, exist_ok=True)

# Define the exact filenames iOS expects in this project
filenames = [
    'Default@1x~universal~anyany.png',
    'Default@2x~universal~anyany.png',
    'Default@3x~universal~anyany.png',
    'Default@1x~universal~anyany-dark.png',
    'Default@2x~universal~anyany-dark.png',
    'Default@3x~universal~anyany-dark.png',
    'splash-2732x2732.png',
    'splash-2732x2732-1.png',
    'splash-2732x2732-2.png'
]

for filename in filenames:
    path = os.path.join(output_dir, filename)
    img.save(path)

print("Generated iOS splash screens successfully!")
