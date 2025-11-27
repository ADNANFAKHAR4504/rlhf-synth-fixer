"""CloudFormation Template Loader and Validator

This module provides utilities for loading and validating CloudFormation templates.
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional


class CloudFormationTemplate:
    """Represents a CloudFormation template and provides validation methods."""

    def __init__(self, template_path: str = "lib/TapStack.json"):
        """
        Initialize the CloudFormation template loader.

        Args:
            template_path: Path to the CloudFormation JSON template file
        """
        self.template_path = Path(template_path)
        self.template_data = self._load_template()

    def _load_template(self) -> Dict[str, Any]:
        """
        Load the CloudFormation template from the JSON file.

        Returns:
            Dict containing the template data

        Raises:
            FileNotFoundError: If template file doesn't exist
            json.JSONDecodeError: If template is not valid JSON
        """
        if not self.template_path.exists():
            raise FileNotFoundError(f"Template file not found: {self.template_path}")

        with open(self.template_path, 'r') as f:
            return json.load(f)

    def get_template(self) -> Dict[str, Any]:
        """Get the full template data."""
        return self.template_data

    def get_resources(self) -> Dict[str, Any]:
        """Get all resources from the template."""
        return self.template_data.get('Resources', {})

    def get_resource(self, logical_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific resource by logical ID.

        Args:
            logical_id: The logical ID of the resource

        Returns:
            Resource definition or None if not found
        """
        return self.get_resources().get(logical_id)

    def get_resource_type(self, logical_id: str) -> Optional[str]:
        """
        Get the resource type for a given logical ID.

        Args:
            logical_id: The logical ID of the resource

        Returns:
            Resource type (e.g., 'AWS::Logs::LogGroup') or None
        """
        resource = self.get_resource(logical_id)
        return resource.get('Type') if resource else None

    def get_resource_properties(self, logical_id: str) -> Dict[str, Any]:
        """
        Get the properties of a resource.

        Args:
            logical_id: The logical ID of the resource

        Returns:
            Resource properties dict or empty dict if not found
        """
        resource = self.get_resource(logical_id)
        return resource.get('Properties', {}) if resource else {}

    def get_resources_by_type(self, resource_type: str) -> Dict[str, Dict[str, Any]]:
        """
        Get all resources of a specific type.

        Args:
            resource_type: The AWS resource type (e.g., 'AWS::Logs::LogGroup')

        Returns:
            Dict of matching resources with logical IDs as keys
        """
        resources = {}
        for logical_id, resource in self.get_resources().items():
            if resource.get('Type') == resource_type:
                resources[logical_id] = resource
        return resources

    def get_parameters(self) -> Dict[str, Any]:
        """Get all parameters from the template."""
        return self.template_data.get('Parameters', {})

    def get_parameter(self, param_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific parameter definition.

        Args:
            param_name: The parameter name

        Returns:
            Parameter definition or None if not found
        """
        return self.get_parameters().get(param_name)

    def get_outputs(self) -> Dict[str, Any]:
        """Get all outputs from the template."""
        return self.template_data.get('Outputs', {})

    def get_output(self, output_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific output definition.

        Args:
            output_name: The output name

        Returns:
            Output definition or None if not found
        """
        return self.get_outputs().get(output_name)

    def validate_structure(self) -> List[str]:
        """
        Validate the basic structure of the CloudFormation template.

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Check required top-level keys
        if 'AWSTemplateFormatVersion' not in self.template_data:
            errors.append("Missing required key: AWSTemplateFormatVersion")

        if 'Resources' not in self.template_data:
            errors.append("Missing required key: Resources")
        elif not self.template_data['Resources']:
            errors.append("Resources section is empty")

        # Validate each resource has Type
        for logical_id, resource in self.get_resources().items():
            if 'Type' not in resource:
                errors.append(f"Resource '{logical_id}' missing Type")

        return errors

    def count_resources_by_type(self) -> Dict[str, int]:
        """
        Count resources by type.

        Returns:
            Dict mapping resource types to counts
        """
        counts = {}
        for resource in self.get_resources().values():
            resource_type = resource.get('Type', 'Unknown')
            counts[resource_type] = counts.get(resource_type, 0) + 1
        return counts

    def has_environment_suffix(self, resource_name: Any) -> bool:
        """
        Check if a resource name includes environmentSuffix parameter reference.

        Args:
            resource_name: The resource name (can be string or dict for Fn::Sub)

        Returns:
            True if environmentSuffix is referenced, False otherwise
        """
        if isinstance(resource_name, dict):
            if 'Fn::Sub' in resource_name:
                sub_value = resource_name['Fn::Sub']
                if isinstance(sub_value, str):
                    return '${environmentSuffix}' in sub_value or '${EnvironmentSuffix}' in sub_value
                elif isinstance(sub_value, list) and len(sub_value) > 0:
                    return '${environmentSuffix}' in sub_value[0] or '${EnvironmentSuffix}' in sub_value[0]
        elif isinstance(resource_name, str):
            return '${environmentSuffix}' in resource_name or '${EnvironmentSuffix}' in resource_name

        return False

    def get_resource_tags(self, logical_id: str) -> List[Dict[str, str]]:
        """
        Get tags for a specific resource.

        Args:
            logical_id: The logical ID of the resource

        Returns:
            List of tag dicts or empty list if no tags
        """
        properties = self.get_resource_properties(logical_id)
        tags = properties.get('Tags', [])

        # Handle tags as dict (SSM Parameter format: {Key: Value})
        if isinstance(tags, dict):
            return [{'Key': k, 'Value': v} for k, v in tags.items()]

        # Handle tags as list (standard format: [{Key: X, Value: Y}])
        return tags if isinstance(tags, list) else []

    def validate_required_tags(self, required_tags: List[str]) -> Dict[str, List[str]]:
        """
        Validate that all resources have required tags.

        Args:
            required_tags: List of required tag keys

        Returns:
            Dict mapping resource logical IDs to missing tags
        """
        missing_tags = {}

        for logical_id in self.get_resources().keys():
            tags = self.get_resource_tags(logical_id)
            tag_keys = {tag.get('Key') for tag in tags}

            missing = [tag for tag in required_tags if tag not in tag_keys]
            if missing:
                missing_tags[logical_id] = missing

        return missing_tags
