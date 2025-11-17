"""
Main entry point for the Pulumi fraud detection pipeline.

This module initializes the TapStack with proper configuration and
serves as the entry point for Pulumi deployments.
"""

import os
import pulumi
from lib.tap_stack import TapStack, TapStackArgs


def main():
    """
    Main function to initialize the TapStack.

    Creates the fraud detection pipeline infrastructure with environment-specific configuration.
    """
    # Get configuration
    config = pulumi.Config()

    # Get environment suffix from config or environment variable
    environment_suffix = config.get("environmentSuffix")
    if not environment_suffix:
        environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

    # Create TapStack arguments
    stack_args = TapStackArgs(environment_suffix=environment_suffix)

    # Create the TapStack
    stack = TapStack(
        f"TapStack{environment_suffix}",
        stack_args,
        opts=pulumi.ResourceOptions()
    )


if __name__ == "__main__":
    main()
