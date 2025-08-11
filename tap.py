#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with
appropriate configuration based on the deployment environment. It handles
environment-specific settings, tagging, and deployment configuration for AWS
resources.

The stack uses environment suffixes to distinguish between deployment
environments (development, staging, production, etc.).
"""

import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps


def main() -> None:
  """Main entry point for the CDK app."""
  app = cdk.App()

  # Resolve environment suffix from CDK context or default to 'dev'
  environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
  stack_name = f"TapStack{environment_suffix}"

  # Read metadata from environment variables
  repository_name = os.getenv('REPOSITORY', 'unknown')
  commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

  # Apply global tags
  Tags.of(app).add('Environment', environment_suffix)
  Tags.of(app).add('Repository', repository_name)
  Tags.of(app).add('Author', commit_author)

  # Create stack props
  props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
      account=os.getenv('CDK_DEFAULT_ACCOUNT'),
      region=os.getenv('CDK_DEFAULT_REGION')
    )
  )

  # Instantiate the stack
  TapStack(app, stack_name, props=props)

  # Synthesize the app
  app.synth()


if __name__ == '__main__':
  main()
