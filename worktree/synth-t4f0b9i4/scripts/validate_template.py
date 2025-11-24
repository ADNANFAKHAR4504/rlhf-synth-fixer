#!/usr/bin/env python3
"""
CloudFormation template validation script.
Validates the TapStack.json template for syntax and structure.
"""
import json
import sys
from pathlib import Path


def validate_template():
    """Validate CloudFormation template JSON syntax and structure."""
    template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"

    if not template_path.exists():
        print(f"ERROR: Template not found at {template_path}")
        sys.exit(1)

    try:
        with open(template_path, 'r') as f:
            template = json.load(f)

        # Basic CloudFormation structure validation
        required_keys = ['AWSTemplateFormatVersion', 'Description', 'Resources']
        missing_keys = [key for key in required_keys if key not in template]

        if missing_keys:
            print(f"ERROR: Template missing required keys: {missing_keys}")
            sys.exit(1)

        # Validate resources exist
        if not template.get('Resources'):
            print("ERROR: Template has no resources defined")
            sys.exit(1)

        resource_count = len(template['Resources'])
        print(f"✅ Template validation passed")
        print(f"   - Resources: {resource_count}")
        print(f"   - Parameters: {len(template.get('Parameters', {}))}")
        print(f"   - Outputs: {len(template.get('Outputs', {}))}")

        return True

    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON syntax: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Validation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":  # pragma: no cover
    validate_template()
