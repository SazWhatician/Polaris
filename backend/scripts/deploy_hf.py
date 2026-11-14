"""Deploy backend folder to Hugging Face Spaces using huggingface_hub."""

import os
import sys
from pathlib import Path
from huggingface_hub import HfApi


def deploy() -> None:
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("Error: HF_TOKEN environment variable is not set.", file=sys.stderr)
        print("Please set HF_TOKEN=<your_huggingface_write_token>.", file=sys.stderr)
        sys.exit(1)

    space_id = os.environ.get("HF_SPACE", "saswatml123/polaris")
    backend_dir = Path(__file__).resolve().parent.parent

    print(f"Deploying {backend_dir} to Hugging Face Space: {space_id}...")
    api = HfApi(token=token)

    commit_info = api.upload_folder(
        folder_path=str(backend_dir),
        repo_id=space_id,
        repo_type="space",
        ignore_patterns=[
            ".venv/**",
            "__pycache__/**",
            "*.pyc",
            "storage_data/**",
            ".pytest_cache/**",
            ".ruff_cache/**",
            ".coverage",
            "coverage.xml",
            "tests/**",
        ],
        commit_message=os.environ.get("HF_COMMIT_MESSAGE", "Sync backend from GitHub"),
    )
    print(f"Successfully deployed! Commit: {commit_info.commit_id}")


if __name__ == "__main__":
    deploy()

