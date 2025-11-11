#!/usr/bin/env python3
import json

outputs = {}
with open('cfn-outputs/flat-outputs.txt', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line:
            key, value = line.split('=', 1)
            outputs[key] = value

with open('cfn-outputs/flat-outputs.json', 'w') as f:
    json.dump(outputs, f, indent=2)

print(f"Converted {len(outputs)} outputs to JSON")
