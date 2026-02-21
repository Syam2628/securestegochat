import re

_PATTERNS = {
    "python": [r"\bdef\s+\w+\(", r"\bimport\s+\w+", r"\breturn\b", r"\bclass\s+\w+"],
    "c_cpp": [r"#include\s*<", r"\bint\s+main\s*\(", r"std::", r"printf\s*\("],
    "java": [r"\bpublic\s+class\b", r"\bSystem\.out\.println\s*\(", r"\bstatic\s+void\s+main\b"],
    "html": [r"<html", r"<script", r"<div", r"<!DOCTYPE\s+html"],
    "javascript": [r"\bfunction\b", r"=>", r"console\.log\s*\(", r"\b(let|const|var)\s+\w+"],
    "sql": [r"\bSELECT\b", r"\bINSERT\s+INTO\b", r"\bUPDATE\s+\w+\s+SET\b", r"\bDELETE\s+FROM\b"],
}


def classify_extracted_text(text: str) -> tuple[bool, str | None, int, list[str]]:
    if not text or len(text.strip()) < 12:
        return False, None, 0, []

    scores = {}
    matches = {}
    for language, patterns in _PATTERNS.items():
        found = []
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
                found.append(pattern)
        scores[language] = len(found)
        matches[language] = found

    top_language = max(scores, key=scores.get)
    top_score = scores[top_language]

    is_code = top_score >= 2
    confidence = min(95, top_score * 25)
    return is_code, (top_language if is_code else None), confidence, matches[top_language]
