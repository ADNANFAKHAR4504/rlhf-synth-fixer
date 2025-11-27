#!/usr/bin/env python3
"""Package Lambda function into a zip file."""
import os
import zipfile
from pathlib import Path


def package_lambda(source_dir: str, output_file: str):
    """
    Package Lambda function from source directory into a zip file.

    Args:
        source_dir: Path to the Lambda function source directory
        output_file: Path to the output zip file
    """
    source_path = Path(source_dir)
    output_path = Path(output_file)

    print(f"📦 Packaging Lambda function from {source_dir}...")

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_path):
            # Skip pycache and git directories
            dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git']]

            for file in files:
                # Skip .pyc files
                if file.endswith('.pyc'):
                    continue

                file_path = Path(root) / file
                arcname = file_path.relative_to(source_path)
                zipf.write(file_path, arcname)
                print(f"  Added: {arcname}")

    print(f"✅ Lambda function packaged successfully: {output_file}")
    print(f"   Size: {output_path.stat().st_size} bytes")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: package_lambda.py <source_dir> <output_file>")
        sys.exit(1)

    source_dir = sys.argv[1]
    output_file = sys.argv[2]

    if not os.path.isdir(source_dir):
        print(f"❌ Source directory not found: {source_dir}")
        sys.exit(1)

    package_lambda(source_dir, output_file)
