from PIL import Image

_DELIMITER = "#####"


def detect_lsb_steganography(image_path: str) -> tuple[bool, float]:
    """
    Two-pass LSB steganography detection:
    1. Definitive check — attempt LSB extraction and look for the delimiter.
    2. Statistical heuristic — chi-square test on the first portion of pixels
       where payloads are typically embedded.
    Returns (likely_hidden_data, confidence_percent).
    """
    try:
        with Image.open(image_path).convert("L") as img:
            pixels = list(img.getdata())
    except Exception:
        return False, 0.0

    # ── Pass 1: Try to find the delimiter in the LSB stream ──
    bits = "".join(str(p & 1) for p in pixels)
    extracted_chars = []
    for i in range(0, min(len(bits), 80_000), 8):  # scan first ~10 KB
        chunk = bits[i : i + 8]
        if len(chunk) < 8:
            break
        char = chr(int(chunk, 2))
        extracted_chars.append(char)
        if len(extracted_chars) >= 5:
            tail = "".join(extracted_chars[-5:])
            if tail == _DELIMITER:
                return True, 100.0

    # ── Pass 2: Chi-square on leading pixels ──
    # Payloads sit at the start of the image, so check the first 20% of pixels.
    sample_size = max(256, len(pixels) // 5)
    sample = pixels[:sample_size]

    # Pair adjacent even/odd values and test if LSBs are uniformly distributed.
    pairs = {}
    for p in sample:
        base = p & ~1  # strip LSB
        pairs.setdefault(base, [0, 0])
        pairs[base][p & 1] += 1

    chi_sq = 0.0
    n_pairs = 0
    for base, (c0, c1) in pairs.items():
        total = c0 + c1
        if total < 2:
            continue
        expected = total / 2
        chi_sq += ((c0 - expected) ** 2 + (c1 - expected) ** 2) / expected
        n_pairs += 1

    if n_pairs == 0:
        return False, 0.0

    # Normalise: perfectly uniform LSBs → high chi-sq per pair.
    avg_chi = chi_sq / n_pairs
    # avg_chi close to 0 means the distribution is very uniform (suspicious).
    # Natural images typically have avg_chi > 1.
    if avg_chi < 0.3:
        confidence = min(95.0, (0.3 - avg_chi) / 0.3 * 95)
        return True, round(confidence, 2)

    return False, round(max(0.0, (1.0 - avg_chi) * 50), 2)
