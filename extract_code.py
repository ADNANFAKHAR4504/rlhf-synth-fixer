#!/usr/bin/env python3
"""Extract code files from MODEL_RESPONSE.md"""

import re
import os
from pathlib import Path

def extract_files(model_response_path, output_dir):
    """Extract code blocks from MODEL_RESPONSE.md into separate files"""

    with open(model_response_path, 'r') as f:
        content = f.read()

    # Pattern to match ## File: filename followed by ```language and code block
    pattern = r'## File: ([^\n]+)\n\n```(?:hcl|python|bash|markdown)?\n(.*?)```'

    matches = re.findall(pattern, content, re.DOTALL)

    created_files = []
    for filename, code in matches:
        filename = filename.strip()

        # Skip certain files
        if filename in ['terraform.tfvars.example', 'README.md']:
            print(f"Skipping {filename}")
            continue

        # Determine output path
        if '/' in filename:  # subdirectory file like lambda/metric_processor.py
            file_path = os.path.join(output_dir, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
        else:
            file_path = os.path.join(output_dir, filename)

        # Write the file
        with open(file_path, 'w') as f:
            f.write(code.strip() + '\n')

        created_files.append(file_path)
        print(f"Created: {file_path}")

    return created_files

if __name__ == '__main__':
    model_response = '/var/www/turing/iac-test-automations/worktree/synth-101912822/lib/MODEL_RESPONSE.md'
    output_dir = '/var/www/turing/iac-test-automations/worktree/synth-101912822/lib'

    files = extract_files(model_response, output_dir)
    print(f"\nTotal files created: {len(files)}")
