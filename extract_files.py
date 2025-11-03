#!/usr/bin/env python3
"""Extract code files from MODEL_RESPONSE.md"""
import re
import os
from pathlib import Path

def extract_files_from_markdown(md_file_path, base_dir):
    """Extract code blocks from markdown file and write them to disk"""
    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match: ## File: path\n\n```language\ncode\n```
    pattern = r'## File: ([^\n]+)\n+```(\w+)\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)

    extracted_files = []
    for file_path, language, code in matches:
        file_path = file_path.strip()
        full_path = os.path.join(base_dir, file_path)

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Write the file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(code)

        extracted_files.append(file_path)
        print(f"Extracted: {file_path}")

    return extracted_files

if __name__ == '__main__':
    base_dir = '/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/synth-1au4og'
    md_file = os.path.join(base_dir, 'lib', 'MODEL_RESPONSE.md')

    print("Extracting files from MODEL_RESPONSE.md...")
    extracted = extract_files_from_markdown(md_file, base_dir)
    print(f"\nTotal files extracted: {len(extracted)}")
