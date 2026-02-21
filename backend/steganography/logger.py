from pathlib import Path
from datetime import datetime

_LOG_FILE = Path(__file__).resolve().parent.parent / "detection.log"


def log_detection_event(message_id: int, image_name: str, language: str | None, reason: str) -> None:
    line = (
        f"[{datetime.now().isoformat()}] "
        f"message_id={message_id} image={image_name} "
        f"language={language or 'unknown'} reason={reason}\n"
    )
    _LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with _LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line)
