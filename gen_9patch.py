from PIL import Image, ImageDraw

bg_color = (253, 251, 248, 255) # FDFBF8
img = Image.new('RGBA', (800, 800), bg_color)

drill = Image.open('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png').convert("RGBA")
# For high quality, just use the raw image size or scale it properly
drill.thumbnail((300, 300), Image.Resampling.LANCZOS)

x = (800 - drill.width) // 2
y = (800 - drill.height) // 2
img.paste(drill, (x, y), drill)

# Save the solid fallback image (non-9-patch)
img.save('android/app/src/main/res/drawable-nodpi/splash_solid.png')

# Draw 9-patch borders
draw = ImageDraw.Draw(img)
draw.line([(350, 0), (450, 0)], fill='black', width=1) 
draw.line([(0, 350), (0, 450)], fill='black', width=1) 
draw.line([(1, 799), (798, 799)], fill='black', width=1) 
draw.line([(799, 1), (799, 798)], fill='black', width=1) 
img.save('android/app/src/main/res/drawable-nodpi/splash_background.9.png')
print("Generated images!")
