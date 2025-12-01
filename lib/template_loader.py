"""
CloudFormation Template Loader
Provides utility functions for loading and validating CloudFormation JSON templates.
"""

import json
from pathlib import Path
from typing import Dict, Any


def load_template(template_path: str) -> Dict[str, Any]:
    """
    Load a CloudFormation JSON template from file.

    Args:
        template_path: Path to the CloudFormation template file

    Returns:
        Dict containing the parsed template

    Raises:
        FileNotFoundError: If template file doesn't exist
        json.JSONDecodeError: If template is not valid JSON
    """
    path = Path(template_path)
    if not path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    with open(path, 'r') as f:
        return json.load(f)


def validate_template_structure(template: Dict[str, Any]) -> bool:
    """
    Validate basic CloudFormation template structure.

    Args:
        template: Parsed CloudFormation template dict

    Returns:
        True if template has valid structure

    Raises:
        ValueError: If template is missing required fields
    """
    if not isinstance(template, dict):
        raise ValueError("Template must be a dictionary")

    if 'AWSTemplateFormatVersion' not in template:
        raise ValueError("Template missing AWSTemplateFormatVersion")

    if 'Resources' not in template:
        raise ValueError("Template missing Resources section")

    return True


def get_resources(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the Resources section from a CloudFormation template.

    Args:
        template: Parsed CloudFormation template dict

    Returns:
        Dict containing all resources
    """
    return template.get('Resources', {})


def get_parameters(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the Parameters section from a CloudFormation template.

    Args:
        template: Parsed CloudFormation template dict

    Returns:
        Dict containing all parameters
    """
    return template.get('Parameters', {})


def get_outputs(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the Outputs section from a CloudFormation template.

    Args:
        template: Parsed CloudFormation template dict

    Returns:
        Dict containing all outputs
    """
    return template.get('Outputs', {})


def find_resource_by_type(template: Dict[str, Any], resource_type: str) -> Dict[str, Any]:
    """
    Find all resources of a specific type in the template.

    Args:
        template: Parsed CloudFormation template dict
        resource_type: AWS resource type (e.g., 'AWS::Lambda::Function')

    Returns:
        Dict of matching resources with logical IDs as keys
    """
    resources = get_resources(template)
    return {
        logical_id: resource
        for logical_id, resource in resources.items()
        if resource.get('Type') == resource_type
    }
