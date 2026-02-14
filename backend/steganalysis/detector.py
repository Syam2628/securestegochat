import numpy as np
from PIL import Image
from typing import Tuple
from scipy.stats import chisquare


class SteganographyDetector:

    def __init__(self):
        # tuned for grayscale LSB
        self.threshold = 0.40

    def detect_lsb_steganography(self, image_path: str) -> Tuple[bool, float]:
        try:
            img = Image.open(image_path).convert("L")
            pixels = np.array(img).flatten()

            lsb = pixels & 1

            observed = [
                np.sum(lsb == 0),
                np.sum(lsb == 1)
            ]

            expected = [len(lsb) / 2, len(lsb) / 2]

            chi_stat, p_value = chisquare(observed, expected)

            score = 1 - p_value
            confidence = round(score * 100, 2)

            is_suspicious = score > self.threshold

            return is_suspicious, confidence

        except Exception as e:
            print("Detection error:", e)
            return False, 0.0
