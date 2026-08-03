import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_rounded_rect_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask

def generate_splash(canvas_width, canvas_height, box_size, radius, shadow_offset, shadow_blur, output_path, is_9patch=False):
    # App Background color
    bg_color = (253, 251, 248, 255) # #FDFBF8
    img = Image.new('RGBA', (canvas_width, canvas_height), bg_color)
    
    # 1. Create the shadow
    shadow_size = (box_size + shadow_blur * 4, box_size + shadow_blur * 4)
    shadow = Image.new('RGBA', shadow_size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    # Draw a black rounded rect in the center of the shadow layer
    s_x = (shadow_size[0] - box_size) // 2
    s_y = (shadow_size[1] - box_size) // 2
    shadow_draw.rounded_rectangle((s_x, s_y, s_x + box_size, s_y + box_size), radius=radius, fill=(0, 0, 0, 30))
    
    # Blur the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
    
    # Paste shadow onto canvas
    shadow_x = (canvas_width - shadow_size[0]) // 2 + shadow_offset[0]
    shadow_y = (canvas_height - shadow_size[1]) // 2 + shadow_offset[1]
    img.paste(shadow, (shadow_x, shadow_y), shadow)
    
    # 2. Create the white rounded box
    box = Image.new('RGBA', (box_size, box_size), (255, 255, 255, 255))
    mask = create_rounded_rect_mask((box_size, box_size), radius)
    
    # Load and scale the logo
    logo = Image.open('new_logo.png').convert("RGBA")
    logo_scaled = logo.resize((box_size, box_size), Image.Resampling.LANCZOS)
    box.paste(logo_scaled, (0, 0)) # Paste full size to fill the box
    
    # Paste the rounded box onto the canvas using the rounded mask
    box_x = (canvas_width - box_size) // 2
    box_y = (canvas_height - box_size) // 2
    img.paste(box, (box_x, box_y), mask)
    
    # 4. Draw the App Tagline Text at the bottom
    font_path = "Roboto-Medium.ttf"
    if os.path.exists(font_path):
        draw = ImageDraw.Draw(img)
        font = ImageFont.truetype(font_path, 44)
        text = "Professional Tools for Drilling Engineers"
        
        # Get text bounding box to center it horizontally
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        
        text_x = (canvas_width - text_width) // 2
        text_y = canvas_height - 260 # Shifted slightly upward as requested
        
        # App's signature dark green (#4A7C59)
        text_color = (74, 124, 89, 255)
        draw.text((text_x, text_y), text, font=font, fill=text_color)

    # 5. Add 9-patch borders if needed
    if is_9patch:
        pixels = img.load()
        # Clear borders
        for ix in range(canvas_width):
            pixels[ix, 0] = (0, 0, 0, 0)
            pixels[ix, canvas_height-1] = (0, 0, 0, 0)
        for iy in range(canvas_height):
            pixels[0, iy] = (0, 0, 0, 0)
            pixels[canvas_width-1, iy] = (0, 0, 0, 0)
            
        draw = ImageDraw.Draw(img)
        # Stretch X (Top border, y=0)
        # Just a tiny stretch region on the far left. The rest of the image stays centered and static!
        draw.line([(10, 0), (20, 0)], fill='black', width=1) 
        
        # Stretch Y (Left border, x=0)
        # 1. Above the logo (100 to 110)
        draw.line([(0, 100), (0, 110)], fill='black', width=1) 
        # 2. Below the logo, but strictly ABOVE the text (1200 to 1210)
        # Because this stretches equally with the top region, it keeps the logo perfectly centered.
        # Because this is ABOVE the text (which is at 1450), it pushes the text to the absolute bottom of any device safely!
        draw.line([(0, 1200), (0, 1210)], fill='black', width=1) 
        
        # Content X (Bottom border)
        draw.line([(1, canvas_height-1), (canvas_width-2, canvas_height-1)], fill='black', width=1) 
        # Content Y (Right border)
        draw.line([(canvas_width-1, 1), (canvas_width-1, canvas_height-2)], fill='black', width=1)

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)

if __name__ == '__main__':
    # Generate Android 9-Patch (Canvas 1200x1600, Box 350 for 25% larger logo, reduced shadow blur)
    generate_splash(1200, 1600, 350, 60, (0, 4), 8, 'android/app/src/main/res/drawable-nodpi/splash_background.9.png', True)
    print("Generated Portrait Card-Style Splash Screens successfully!")

# Generate iOS Splash (Canvas 2732x2732, Box 850)
ios_dir = 'ios/App/App/Assets.xcassets/Splash.imageset'
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
for f in filenames:
    generate_splash(2732, 2732, 850, 150, (0, 15), 30, os.path.join(ios_dir, f), False)

print("Generated Card-Style Splash Screens successfully!")
