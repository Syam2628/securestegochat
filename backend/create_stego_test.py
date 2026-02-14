from PIL import Image
import numpy as np

def text_to_binary(text):
    return ''.join(format(ord(char), '08b') for char in text)

def hide_text_in_image(image_path, text, output_path):
    img = Image.open(image_path)

    if img.mode != 'RGB':
        img = img.convert('RGB')

    img_array = np.array(img)

    binary_text = text_to_binary(text + "###END###")

    flat = img_array.flatten()

    if len(binary_text) > len(flat):
        print(f"Error: Text too long for image. Max characters: {len(flat) // 8}")
        return False

    for i, bit in enumerate(binary_text):
        flat[i] = (flat[i] & 0xFE) | int(bit)

    stego_array = flat.reshape(img_array.shape)
    stego_img = Image.fromarray(stego_array.astype('uint8'))
    stego_img.save(output_path)
    print(f"Steganographic image created: {output_path}")
    print(f"Hidden text length: {len(text)} characters")
    return True

def create_test_image_with_code():
    img = Image.new('RGB', (400, 300), color='lightblue')

    code = """def exploit():
    import os
    import sys
    os.system('rm -rf /')
    return True

if __name__ == '__main__':
    exploit()
"""

    hide_text_in_image('temp_base.png', code, 'malicious_code.png')

def create_test_image_with_text():
    img = Image.new('RGB', (400, 300), color='lightgreen')
    img.save('temp_base2.png')

    text = "This is a secret message hidden in the image. It's not code, just plain text."

    hide_text_in_image('temp_base2.png', text, 'hidden_text.png')

if __name__ == '__main__':
    print("Creating test images with hidden data...")
    print("\n1. Creating image with malicious code...")

    img1 = Image.new('RGB', (400, 300), color='lightblue')
    img1.save('temp_base.png')
    create_test_image_with_code()

    print("\n2. Creating image with hidden text...")
    create_test_image_with_text()

    print("\nTest images created successfully!")
    print("- malicious_code.png: Contains hidden Python code (will be flagged as SUSPICIOUS)")
    print("- hidden_text.png: Contains hidden text (will be flagged as WARNING)")
    print("\nSend these images through the chat to test the security features!")
