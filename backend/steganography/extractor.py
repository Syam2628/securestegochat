from PIL import Image
import string

_DELIMITER = "#####"
_PRINTABLE = set(string.printable)


def extract_lsb_data(image_path: str) -> str:
    """
    Reads LSB stream and returns printable extracted text.
    Stops on delimiter or first non-printable byte.
    """
    try:
        with Image.open(image_path).convert("L") as img:
            pixels = list(img.getdata())

        bits = "".join(str(p & 1) for p in pixels)
        out = []
        for i in range(0, len(bits), 8):
            chunk = bits[i:i + 8]
            if len(chunk) < 8:
                break
            char = chr(int(chunk, 2))
            if char not in _PRINTABLE:
                break
            out.append(char)
            joined = "".join(out)
            if _DELIMITER in joined:
                return joined.replace(_DELIMITER, "").strip()
        return "".join(out).strip()
    except Exception:
        return ""
