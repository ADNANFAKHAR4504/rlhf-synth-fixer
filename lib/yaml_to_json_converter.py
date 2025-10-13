#!/usr/bin/env python3
import yaml
import json
import sys

def convert_yaml_to_json(yaml_file_path, json_file_path):
    try:
        with open(yaml_file_path, 'r') as yaml_file:
            yaml_content = yaml.safe_load(yaml_file)
        
        with open(json_file_path, 'w') as json_file:
            json.dump(yaml_content, json_file, indent=2)
        
        print(f"Successfully converted {yaml_file_path} to {json_file_path}")
        return True
    except Exception as e:
        print(f"Error converting YAML to JSON: {str(e)}")
        return False

if __name__ == "__main__":
    yaml_file = "lib/TapStack.yml"
    json_file = "lib/TapStack.json"
    convert_yaml_to_json(yaml_file, json_file)