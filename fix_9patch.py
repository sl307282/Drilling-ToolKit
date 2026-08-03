import sys
from PIL import Image

def fix_9patch(path):
    img = Image.open(path).convert('RGBA')
    pixels = img.load()
    width, height = img.size
    
    # Check borders and make non-black pixels transparent
    for x in range(width):
        # Top border
        if pixels[x, 0][:3] != (0, 0, 0):
            pixels[x, 0] = (0, 0, 0, 0)
        # Bottom border
        if pixels[x, height - 1][:3] != (0, 0, 0):
            pixels[x, height - 1] = (0, 0, 0, 0)
            
    for y in range(height):
        # Left border
        if pixels[0, y][:3] != (0, 0, 0):
            pixels[0, y] = (0, 0, 0, 0)
        # Right border
        if pixels[width - 1, y][:3] != (0, 0, 0):
            pixels[width - 1, y] = (0, 0, 0, 0)
            
    img.save(path)
    print("Fixed 9-patch borders!")

if __name__ == '__main__':
    fix_9patch('android/app/src/main/res/drawable-nodpi/splash_background.9.png')
