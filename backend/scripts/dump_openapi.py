"""Dump the FastAPI OpenAPI spec to stdout (or a file).

Used to drive openapi-typescript client generation without needing a running
server. Run from backend/ as:  python -m scripts.dump_openapi > openapi.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from app.core.config import get_settings
from app.main import _build_app


def main() -> None:
    app = _build_app(get_settings())
    spec = app.openapi()
    out = json.dumps(spec, indent=2, sort_keys=True)
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(out, encoding="utf-8")
    else:
        sys.stdout.write(out)


if __name__ == "__main__":
    main()
