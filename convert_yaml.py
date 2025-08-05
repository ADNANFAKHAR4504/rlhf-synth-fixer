#!/usr/bin/env python3
import yaml
import json
import re

class CloudFormationLoader(yaml.SafeLoader):
    pass

def construct_ref(loader, node):
    return {'Ref': loader.construct_scalar(node)}

def construct_getatt(loader, node):
    if isinstance(node, yaml.ScalarNode):
        return {'Fn::GetAtt': loader.construct_scalar(node).split('.')}
    elif isinstance(node, yaml.SequenceNode):
        return {'Fn::GetAtt': loader.construct_sequence(node)}

def construct_sub(loader, node):
    return {'Fn::Sub': loader.construct_scalar(node)}

def construct_join(loader, node):
    return {'Fn::Join': loader.construct_sequence(node)}

def construct_findinmap(loader, node):
    return {'Fn::FindInMap': loader.construct_sequence(node)}

def construct_if(loader, node):
    return {'Fn::If': loader.construct_sequence(node)}

def construct_not(loader, node):
    return {'Fn::Not': loader.construct_sequence(node)}

def construct_equals(loader, node):
    return {'Fn::Equals': loader.construct_sequence(node)}

def construct_and(loader, node):
    return {'Fn::And': loader.construct_sequence(node)}

def construct_or(loader, node):
    return {'Fn::Or': loader.construct_sequence(node)}

def construct_base64(loader, node):
    return {'Fn::Base64': loader.construct_scalar(node)}

def construct_cidr(loader, node):
    return {'Fn::Cidr': loader.construct_sequence(node)}

def construct_select(loader, node):
    return {'Fn::Select': loader.construct_sequence(node)}

def construct_split(loader, node):
    return {'Fn::Split': loader.construct_sequence(node)}

def construct_getazs(loader, node):
    return {'Fn::GetAZs': loader.construct_scalar(node)}

CloudFormationLoader.add_constructor('!Ref', construct_ref)
CloudFormationLoader.add_constructor('!GetAtt', construct_getatt)
CloudFormationLoader.add_constructor('!Sub', construct_sub)
CloudFormationLoader.add_constructor('!Join', construct_join)
CloudFormationLoader.add_constructor('!FindInMap', construct_findinmap)
CloudFormationLoader.add_constructor('!If', construct_if)
CloudFormationLoader.add_constructor('!Not', construct_not)
CloudFormationLoader.add_constructor('!Equals', construct_equals)
CloudFormationLoader.add_constructor('!And', construct_and)
CloudFormationLoader.add_constructor('!Or', construct_or)
CloudFormationLoader.add_constructor('!Base64', construct_base64)
CloudFormationLoader.add_constructor('!Cidr', construct_cidr)
CloudFormationLoader.add_constructor('!Select', construct_select)
CloudFormationLoader.add_constructor('!Split', construct_split)
CloudFormationLoader.add_constructor('!GetAZs', construct_getazs)

# Read TapStack.yml
with open('lib/TapStack.yml', 'r') as f:
    template = yaml.load(f, Loader=CloudFormationLoader)

# Write as JSON
with open('lib/TapStack.json', 'w') as f:
    json.dump(template, f, indent=2)

print('Converted TapStack.yml to TapStack.json successfully!')