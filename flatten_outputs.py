#!/usr/bin/env python3
import json
import sys

def flatten_output(obj):
    if isinstance(obj, dict):
        if '@isPulumiResource' in obj or 'urn' in obj:
            return None
        return {k: flatten_output(v) for k, v in obj.items() if flatten_output(v) is not None}
    elif isinstance(obj, list):
        flattened = [flatten_output(item) for item in obj]
        return [item for item in flattened if item is not None]
    return obj

with open('/tmp/pulumi-outputs-raw.json', 'r') as f:
    data = json.load(f)

result = {k: flatten_output(v) for k, v in data.items()}
result = {k: v for k, v in result.items() if v is not None and v != {}}

with open('cfn-outputs/flat-outputs.json', 'w') as f:
    json.dump(result, f, indent=2)

print(json.dumps(result, indent=2))
