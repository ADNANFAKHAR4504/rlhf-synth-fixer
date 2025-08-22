#!/usr/bin/env python3
"""Convert CloudFormation YAML to JSON for testing"""

import yaml
import json
import sys
from pathlib import Path

# Custom loader for CloudFormation tags
class CfnYamlLoader(yaml.SafeLoader):
    pass

def cfn_tag_constructor(loader, node):
    """Handle CloudFormation intrinsic functions"""
    tag = node.tag[1:]  # Remove the ! prefix
    
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    elif isinstance(node, yaml.MappingNode):
        value = loader.construct_mapping(node)
    else:
        raise yaml.constructor.ConstructorError(
            None, None,
            f"could not determine a constructor for the tag {tag}",
            node.start_mark)
    
    return {tag: value}

def multi_constructor(loader, tag_suffix, node):
    """Handle any CloudFormation tag"""
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    elif isinstance(node, yaml.MappingNode):
        value = loader.construct_mapping(node)
    else:
        value = None
    
    return {tag_suffix: value}

# Register CloudFormation intrinsic functions
cfn_tags = ['!Ref', '!GetAtt', '!Join', '!Sub', '!Select', '!Split',
            '!Not', '!Equals', '!And', '!Or', '!If', '!ImportValue',
            '!Base64', '!GetAZs', '!FindInMap', '!Cidr']

for tag in cfn_tags:
    CfnYamlLoader.add_constructor(tag, cfn_tag_constructor)

# Multi-constructor for any CF tag
CfnYamlLoader.add_multi_constructor('!', multi_constructor)

def convert_yaml_to_json(yaml_file, json_file):
    """Convert YAML to JSON"""
    with open(yaml_file, 'r') as f:
        data = yaml.load(f, Loader=CfnYamlLoader)
    
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Converted {yaml_file} to {json_file}")

if __name__ == "__main__":
    yaml_path = Path(__file__).parent.parent / 'lib' / 'TapStack.yml'
    json_path = Path(__file__).parent / 'TapStack.json'
    
    convert_yaml_to_json(yaml_path, json_path)