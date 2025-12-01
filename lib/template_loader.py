"""
CloudFormation Template Loader and Validator Module.

This module provides utilities to load, validate, and analyze CloudFormation templates.
"""

import json
import os
from typing import Any, Dict, List, Optional


class TemplateLoader:
    """Load and parse CloudFormation templates."""

    def __init__(self, template_path: str):
        """
        Initialize template loader.

        Args:
            template_path: Path to the CloudFormation template file
        """
        self.template_path = template_path
        self._template: Optional[Dict[str, Any]] = None

    def load(self) -> Dict[str, Any]:
        """
        Load the CloudFormation template from file.

        Returns:
            Dict containing the parsed template

        Raises:
            FileNotFoundError: If template file doesn't exist
            json.JSONDecodeError: If template is not valid JSON
        """
        if not os.path.exists(self.template_path):
            raise FileNotFoundError(f"Template file not found: {self.template_path}")

        with open(self.template_path, "r", encoding="utf-8") as f:
            self._template = json.load(f)

        return self._template

    @property
    def template(self) -> Dict[str, Any]:
        """Get the loaded template, loading it if necessary."""
        if self._template is None:
            self.load()
        return self._template

    def get_resources(self) -> Dict[str, Any]:
        """
        Get all resources from the template.

        Returns:
            Dict of resource definitions
        """
        return self.template.get("Resources", {})

    def get_parameters(self) -> Dict[str, Any]:
        """
        Get all parameters from the template.

        Returns:
            Dict of parameter definitions
        """
        return self.template.get("Parameters", {})

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get all outputs from the template.

        Returns:
            Dict of output definitions
        """
        return self.template.get("Outputs", {})

    def get_resource_by_type(self, resource_type: str) -> Dict[str, Any]:
        """
        Get all resources of a specific type.

        Args:
            resource_type: AWS resource type (e.g., 'AWS::S3::Bucket')

        Returns:
            Dict of resources matching the specified type
        """
        resources = self.get_resources()
        return {
            name: resource
            for name, resource in resources.items()
            if resource.get("Type") == resource_type
        }

    def get_resource_names_by_type(self, resource_type: str) -> List[str]:
        """
        Get names of all resources of a specific type.

        Args:
            resource_type: AWS resource type

        Returns:
            List of resource names
        """
        return list(self.get_resource_by_type(resource_type).keys())

    def has_resource(self, resource_name: str) -> bool:
        """
        Check if a resource exists in the template.

        Args:
            resource_name: Logical ID of the resource

        Returns:
            True if resource exists, False otherwise
        """
        return resource_name in self.get_resources()

    def get_resource(self, resource_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific resource by name.

        Args:
            resource_name: Logical ID of the resource

        Returns:
            Resource definition or None if not found
        """
        return self.get_resources().get(resource_name)


class TemplateValidator:
    """Validate CloudFormation template against requirements."""

    def __init__(self, loader: TemplateLoader):
        """
        Initialize validator with a template loader.

        Args:
            loader: TemplateLoader instance
        """
        self.loader = loader

    def validate_required_parameters(self, required_params: List[str]) -> bool:
        """
        Validate that all required parameters are present.

        Args:
            required_params: List of required parameter names

        Returns:
            True if all required parameters exist

        Raises:
            ValueError: If any required parameter is missing
        """
        parameters = self.loader.get_parameters()
        missing = [p for p in required_params if p not in parameters]
        if missing:
            raise ValueError(f"Missing required parameters: {missing}")
        return True

    def validate_required_resources(self, required_resources: List[str]) -> bool:
        """
        Validate that all required resources are present.

        Args:
            required_resources: List of required resource logical IDs

        Returns:
            True if all required resources exist

        Raises:
            ValueError: If any required resource is missing
        """
        missing = [r for r in required_resources if not self.loader.has_resource(r)]
        if missing:
            raise ValueError(f"Missing required resources: {missing}")
        return True

    def validate_resource_properties(
        self, resource_name: str, required_properties: List[str]
    ) -> bool:
        """
        Validate that a resource has all required properties.

        Args:
            resource_name: Logical ID of the resource
            required_properties: List of required property names

        Returns:
            True if all required properties exist

        Raises:
            ValueError: If resource doesn't exist or properties are missing
        """
        resource = self.loader.get_resource(resource_name)
        if resource is None:
            raise ValueError(f"Resource {resource_name} not found")

        properties = resource.get("Properties", {})
        missing = [p for p in required_properties if p not in properties]
        if missing:
            raise ValueError(
                f"Resource {resource_name} missing properties: {missing}"
            )
        return True

    def validate_deletion_policies(self, allowed_policies: List[str]) -> bool:
        """
        Validate that all resources use allowed deletion policies.

        Args:
            allowed_policies: List of allowed deletion policies

        Returns:
            True if all deletion policies are allowed

        Raises:
            ValueError: If any resource has disallowed deletion policy
        """
        resources = self.loader.get_resources()
        violations = []

        for name, resource in resources.items():
            policy = resource.get("DeletionPolicy", "Delete")
            if policy not in allowed_policies:
                violations.append(f"{name}: {policy}")

        if violations:
            raise ValueError(f"Invalid deletion policies: {violations}")
        return True

    def count_resources_by_type(self, resource_type: str) -> int:
        """
        Count resources of a specific type.

        Args:
            resource_type: AWS resource type

        Returns:
            Number of resources of the specified type
        """
        return len(self.loader.get_resource_by_type(resource_type))

    def validate_environment_suffix_usage(self) -> bool:
        """
        Validate that resources use EnvironmentSuffix parameter.

        Returns:
            True if EnvironmentSuffix is properly used

        Raises:
            ValueError: If EnvironmentSuffix is not used in resource names
        """
        template_str = json.dumps(self.loader.template)
        if "${EnvironmentSuffix}" not in template_str:
            raise ValueError("EnvironmentSuffix parameter not used in template")
        return True


def load_template(template_path: str) -> Dict[str, Any]:
    """
    Convenience function to load a CloudFormation template.

    Args:
        template_path: Path to the template file

    Returns:
        Parsed template as a dictionary
    """
    loader = TemplateLoader(template_path)
    return loader.load()


def validate_template(
    template_path: str,
    required_parameters: Optional[List[str]] = None,
    required_resources: Optional[List[str]] = None,
) -> bool:
    """
    Convenience function to validate a CloudFormation template.

    Args:
        template_path: Path to the template file
        required_parameters: List of required parameter names
        required_resources: List of required resource logical IDs

    Returns:
        True if validation passes

    Raises:
        ValueError: If validation fails
    """
    loader = TemplateLoader(template_path)
    loader.load()
    validator = TemplateValidator(loader)

    if required_parameters:
        validator.validate_required_parameters(required_parameters)

    if required_resources:
        validator.validate_required_resources(required_resources)

    return True
