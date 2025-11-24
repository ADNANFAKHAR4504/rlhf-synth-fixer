"""
Template loader module for CloudFormation JSON templates.
Provides functions to load and validate the template structure.
"""

import json
import os
from typing import Dict, Any, List, Optional


def load_template(template_name: str = "TapStack.json") -> Dict[str, Any]:
    """
    Load a CloudFormation template from the lib directory.

    Args:
        template_name: Name of the template file

    Returns:
        Dict containing the parsed template

    Raises:
        FileNotFoundError: If template file doesn't exist
        json.JSONDecodeError: If template is not valid JSON
    """
    template_path = os.path.join(os.path.dirname(__file__), template_name)
    with open(template_path, "r") as f:
        return json.load(f)


def get_resources(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract resources section from template.

    Args:
        template: CloudFormation template dict

    Returns:
        Dict of resources
    """
    return template.get("Resources", {})


def get_parameters(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract parameters section from template.

    Args:
        template: CloudFormation template dict

    Returns:
        Dict of parameters
    """
    return template.get("Parameters", {})


def get_outputs(template: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract outputs section from template.

    Args:
        template: CloudFormation template dict

    Returns:
        Dict of outputs
    """
    return template.get("Outputs", {})


def get_resource_by_type(
    template: Dict[str, Any], resource_type: str
) -> Dict[str, Dict[str, Any]]:
    """
    Get all resources of a specific type.

    Args:
        template: CloudFormation template dict
        resource_type: AWS resource type (e.g., "AWS::S3::Bucket")

    Returns:
        Dict of resources matching the type
    """
    resources = get_resources(template)
    return {
        name: resource
        for name, resource in resources.items()
        if resource.get("Type") == resource_type
    }


def get_resource_properties(
    template: Dict[str, Any], resource_name: str
) -> Dict[str, Any]:
    """
    Get properties of a specific resource.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource

    Returns:
        Dict of resource properties
    """
    resources = get_resources(template)
    resource = resources.get(resource_name, {})
    return resource.get("Properties", {})


def validate_parameter_exists(template: Dict[str, Any], parameter_name: str) -> bool:
    """
    Check if a parameter exists in the template.

    Args:
        template: CloudFormation template dict
        parameter_name: Name of the parameter

    Returns:
        True if parameter exists, False otherwise
    """
    parameters = get_parameters(template)
    return parameter_name in parameters


def validate_resource_exists(template: Dict[str, Any], resource_name: str) -> bool:
    """
    Check if a resource exists in the template.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource

    Returns:
        True if resource exists, False otherwise
    """
    resources = get_resources(template)
    return resource_name in resources


def validate_output_exists(template: Dict[str, Any], output_name: str) -> bool:
    """
    Check if an output exists in the template.

    Args:
        template: CloudFormation template dict
        output_name: Name of the output

    Returns:
        True if output exists, False otherwise
    """
    outputs = get_outputs(template)
    return output_name in outputs


def get_resource_dependencies(
    template: Dict[str, Any], resource_name: str
) -> List[str]:
    """
    Get explicit dependencies (DependsOn) for a resource.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource

    Returns:
        List of resource names this resource depends on
    """
    resources = get_resources(template)
    resource = resources.get(resource_name, {})
    depends_on = resource.get("DependsOn", [])

    if isinstance(depends_on, str):
        return [depends_on]
    return depends_on


def check_resource_has_property(
    template: Dict[str, Any], resource_name: str, property_name: str
) -> bool:
    """
    Check if a resource has a specific property.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource
        property_name: Name of the property to check

    Returns:
        True if property exists, False otherwise
    """
    properties = get_resource_properties(template, resource_name)
    return property_name in properties


def get_resource_tags(template: Dict[str, Any], resource_name: str) -> List[Dict[str, str]]:
    """
    Get tags for a specific resource.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource

    Returns:
        List of tag dicts
    """
    properties = get_resource_properties(template, resource_name)
    return properties.get("Tags", [])


def count_resources_by_type(template: Dict[str, Any], resource_type: str) -> int:
    """
    Count resources of a specific type.

    Args:
        template: CloudFormation template dict
        resource_type: AWS resource type

    Returns:
        Count of matching resources
    """
    return len(get_resource_by_type(template, resource_type))


def get_iam_roles(template: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Get all IAM roles from the template.

    Args:
        template: CloudFormation template dict

    Returns:
        Dict of IAM role resources
    """
    return get_resource_by_type(template, "AWS::IAM::Role")


def get_iam_role_policies(
    template: Dict[str, Any], role_name: str
) -> List[Dict[str, Any]]:
    """
    Get inline policies for an IAM role.

    Args:
        template: CloudFormation template dict
        role_name: Logical name of the IAM role

    Returns:
        List of policy documents
    """
    properties = get_resource_properties(template, role_name)
    return properties.get("Policies", [])


def validate_encryption_enabled(template: Dict[str, Any], resource_name: str) -> bool:
    """
    Check if a resource has encryption enabled.

    Args:
        template: CloudFormation template dict
        resource_name: Logical name of the resource

    Returns:
        True if encryption is configured, False otherwise
    """
    properties = get_resource_properties(template, resource_name)

    # Check for KMS encryption
    if "KmsKeyId" in properties:
        return True

    # Check for S3 bucket encryption
    if "BucketEncryption" in properties:
        return True

    # Check for encryption key reference
    if "EncryptionKey" in properties:
        return True

    return False


def get_parameter_default(
    template: Dict[str, Any], parameter_name: str
) -> Optional[Any]:
    """
    Get default value for a parameter.

    Args:
        template: CloudFormation template dict
        parameter_name: Name of the parameter

    Returns:
        Default value or None if not specified
    """
    parameters = get_parameters(template)
    parameter = parameters.get(parameter_name, {})
    return parameter.get("Default")


def get_output_value(template: Dict[str, Any], output_name: str) -> Optional[Any]:
    """
    Get value expression for an output.

    Args:
        template: CloudFormation template dict
        output_name: Name of the output

    Returns:
        Output value expression or None
    """
    outputs = get_outputs(template)
    output = outputs.get(output_name, {})
    return output.get("Value")


def list_all_resource_types(template: Dict[str, Any]) -> List[str]:
    """
    List all unique resource types in the template.

    Args:
        template: CloudFormation template dict

    Returns:
        List of resource type strings
    """
    resources = get_resources(template)
    types = set()
    for resource in resources.values():
        resource_type = resource.get("Type")
        if resource_type:
            types.add(resource_type)
    return sorted(list(types))


def get_template_description(template: Dict[str, Any]) -> str:
    """
    Get template description.

    Args:
        template: CloudFormation template dict

    Returns:
        Description string
    """
    return template.get("Description", "")


def get_template_version(template: Dict[str, Any]) -> str:
    """
    Get template format version.

    Args:
        template: CloudFormation template dict

    Returns:
        Template version string
    """
    return template.get("AWSTemplateFormatVersion", "")
