import sys
from PIL import Image, ImageDraw

bg_color = (253, 251, 248, 255) # FDFBF8
img = Image.new('RGBA', (800, 800), bg_color)

# Load transparent logo and resize
drill = Image.open('logo_transparent.png').convert("RGBA")
drill.thumbnail((300, 300), Image.Resampling.LANCZOS)

x = (800 - drill.width) // 2
y = (800 - drill.height) // 2
img.paste(drill, (x, y), drill)

# Draw 9-patch borders
draw = ImageDraw.Draw(img)

# CRITICAL FIX: The stretch regions (top and left borders) must be at the EDGES.
# If we put them in the center, the logo itself gets stretched!
# X-axis stretch (top border): stretch columns 1-10 and 789-798
draw.line([(1, 0), (10, 0)], fill='black', width=1) 
draw.line([(789, 0), (798, 0)], fill='black', width=1) 

# Y-axis stretch (left border): stretch rows 1-10 and 789-798
draw.line([(0, 1), (0, 10)], fill='black', width=1) 
draw.line([(0, 789), (0, 798)], fill='black', width=1) 

# Content region (bottom and right borders): Use the whole image
draw.line([(1, 799), (798, 799)], fill='black', width=1) 
draw.line([(799, 1), (799, 798)], fill='black', width=1) 

# Save it directly. (The rest of the 1px border is transparent because we initialized bg_color but wait...
# Image.new('RGBA', (800, 800), bg_color) makes the ENTIRE image bg_color, including the borders!
# We MUST make the borders transparent first!
pixels = img.load()
for ix in range(800):
    pixels[ix, 0] = (0, 0, 0, 0)
    pixels[ix, 799] = (0, 0, 0, 0)
for iy in range(800):
    pixels[0, iy] = (0, 0, 0, 0)
    pixels[799, iy] = (0, 0, 0, 0)

# NOW draw the black lines
draw.line([(1, 0), (10, 0)], fill='black', width=1) 
draw.line([(789, 0), (798, 0)], fill='black', width=1) 
draw.line([(0, 1), (0, 10)], fill='black', width=1) 
draw.line([(0, 789), (0, 798)], fill='black', width=1) 
draw.line([(1, 799), (798, 799)], fill='black', width=1) 
draw.line([(799, 1), (799, 798)], fill='black', width=1) 

img.save('android/app/src/main/res/drawable-nodpi/splash_background.9.png')
print("Generated perfect 9-patch!")
