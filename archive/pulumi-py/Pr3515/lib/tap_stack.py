"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
from .image_optimization_stack import ImageOptimizationStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Optional suffix for environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


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

        # Instantiate the Image Optimization Stack
        self.image_optimization = ImageOptimizationStack(
            f"image-optimization-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "upload_bucket": self.image_optimization.upload_bucket.id,
            "webp_bucket": self.image_optimization.webp_bucket.id,
            "jpeg_bucket": self.image_optimization.jpeg_bucket.id,
            "png_bucket": self.image_optimization.png_bucket.id,
            "cloudfront_distribution": self.image_optimization.distribution.domain_name,
            "cloudfront_distribution_id": self.image_optimization.distribution.id,
            "dynamodb_table": self.image_optimization.metadata_table.name,
            "lambda_function": self.image_optimization.processor_function.name,
            "lambda_function_arn": self.image_optimization.processor_function.arn,
        })
