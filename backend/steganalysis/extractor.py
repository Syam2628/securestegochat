import numpy as np
from PIL import Image
from typing import Optional
import string


class SteganographyExtractor:

    DELIMITER = "#####"
    PRINTABLE = set(string.printable)

    def extract_lsb_data(self, image_path: str) -> Optional[str]:
        try:
            img = Image.open(image_path).convert("L")
            pixels = np.array(img).flatten()

            bits = "".join(str(p & 1) for p in pixels)

            extracted = ""

            for i in range(0, len(bits), 8):
                byte = bits[i:i+8]
                if len(byte) < 8:
                    break

                char = chr(int(byte, 2))

                # Stop if non-printable character appears
                if char not in self.PRINTABLE:
                    break

                extracted += char

                # Stop when delimiter found
                if self.DELIMITER in extracted:
                    return extracted.replace(self.DELIMITER, "")

            return None

        except Exception as e:
            print("Extraction error:", e)
            return None
