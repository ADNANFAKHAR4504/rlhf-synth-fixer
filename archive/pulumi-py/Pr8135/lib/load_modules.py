import requests
import os
import shutil


# --- Config ---
# Base URL pointing to the folder in S3
S3_PUBLIC_BASE_URL = "https://model-noval-failurepr082025.s3.us-east-1.amazonaws.com/modules/"
REPO_NAME = "iac-test-automations"
TARGET_MODULES_PATH = os.path.join(REPO_NAME, "lib", "modules")
MODULES_LIST = [
    "vpc.py",
    "logging.py",
    "__init__.py",
    "s3.py",
    "kms.py",
    "iam.py",
    # Add all files/directories to fetch from S3
]

# Download and save file from S3 public URL


def download_file(file_name, target_dir):
    url = f"{S3_PUBLIC_BASE_URL}{file_name}"
    response = requests.get(url, stream=True, timeout=30)
    response.raise_for_status()
    local_path = os.path.join(target_dir, file_name)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

# Download full modules directory


def download_modules():
    if os.path.exists(TARGET_MODULES_PATH):
        shutil.rmtree(TARGET_MODULES_PATH)  # Overwrite existing modules folder
    os.makedirs(TARGET_MODULES_PATH, exist_ok=True)
    for item in MODULES_LIST:
        print(f"📥 Downloading {item}...")
        download_file(item, TARGET_MODULES_PATH)
