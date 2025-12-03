#!/usr/bin/env python3
import re
import os

# Read IDEAL_RESPONSE.md
with open('lib/IDEAL_RESPONSE.md', 'r') as f:
    content = f.read()

# Find all code blocks with file paths
pattern = r'## File: (.*?)\n\n```(?:typescript|python|text)\n(.*?)\n```'
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} code blocks to extract")

for file_path, code in matches:
    # Remove leading 'lib/' if present since we're already in the lib directory context
    full_path = file_path
    
    # Create directory if needed
    dir_path = os.path.dirname(full_path)
    if dir_path and not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created directory: {dir_path}")
    
    # Write file
    with open(full_path, 'w') as f:
        f.write(code)
    print(f"Extracted: {full_path}")

print(f"\nSuccessfully extracted {len(matches)} files")
