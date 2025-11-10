"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Dict, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = sanitize_suffix(environment_suffix)
        self.tags = tags or {}


def sanitize_suffix(suffix: Optional[str]) -> str:
    """
    Normalize and sanitize an environment suffix so it is safe to use in resource names.
    """
    if not suffix:
        return 'dev'

    normalized = suffix.strip().lower().replace('_', '-')
    sanitized = ''.join(ch for ch in normalized if ch.isalnum() or ch == '-')
    sanitized = sanitized.strip('-')
    return sanitized or 'dev'


def build_resource_name(base: str, suffix: str) -> str:
    """
    Build a deterministic resource name using the base identifier and sanitized suffix.
    """
    safe_suffix = sanitize_suffix(suffix)
    return f"{base}-{safe_suffix}"


def merge_tags(default_tags: Dict[str, str], extra_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """
    Merge default tags with additional tags, ensuring values are strings.
    """
    merged = {k: str(v) for k, v in (default_tags or {}).items()}
    if extra_tags:
        for key, value in extra_tags.items():
            merged[key] = str(value)
    return merged


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.resource_prefix = build_resource_name(name, self.environment_suffix)
        self.applied_tags = merge_tags(
            {'ManagedBy': 'tap-stack', 'EnvironmentSuffix': self.environment_suffix},
            self.tags
        )

        # Example usage of suffix and tags
        # You would replace this with instantiation of imported components like DynamoDBStack
        
        # s3.Bucket(f"tap-bucket-{self.environment_suffix}",
        #           tags=self.tags,
        #           opts=ResourceOptions(parent=self))

        # self.table = dynamodb_stack.table if you instantiate one

        # Register outputs if needed
        self.register_outputs({})
