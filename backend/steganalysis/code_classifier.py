import re
from typing import Tuple, Optional


class CodeClassifier:

    def classify(self, text: str) -> Tuple[bool, Optional[str], int]:

        if not text or len(text) < 20:
            return False, None, 0

        patterns = {
            "python": [
                r"\bdef\s+\w+\(",
                r"\breturn\b",
                r"\bif\b",
                r":\s*$"
            ],
            "javascript": [
                r"\bfunction\b",
                r"=>",
                r"\bconsole\.log"
            ],
            "java": [
                r"\bpublic\s+class\b",
                r"\bSystem\.out\.println"
            ],
            "c_cpp": [
                r"#include",
                r"\bint\s+main"
            ]
        }

        language_scores = {}

        for lang, pats in patterns.items():
            score = 0
            for p in pats:
                score += len(re.findall(p, text, re.MULTILINE))
            language_scores[lang] = score

        detected_language = max(language_scores, key=language_scores.get)
        max_score = language_scores[detected_language]

        is_code = max_score >= 2
        confidence = min(max_score * 20, 95)

        return is_code, detected_language if is_code else None, confidence
