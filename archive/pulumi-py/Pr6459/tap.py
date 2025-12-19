#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)


# CI/CD Pipeline outputs (if CI/CD infrastructure is created)
if hasattr(stack, 'pipeline') and stack.pipeline is not None:
    pulumi.export("ecrRepositoryUrl", stack.ecr_repository.repository_url)
    pulumi.export("ecsClusterName", stack.ecs_cluster.name)
    pulumi.export("ecsClusterArn", stack.ecs_cluster.arn)
    pulumi.export("pipelineName", stack.pipeline.name)
    pulumi.export("pipelineArn", stack.pipeline.arn)
    pulumi.export("codeBuildProjectName", stack.build_project.name)
    pulumi.export("codeDeployAppName", stack.deploy_app.name)
    pulumi.export("kmsKeyId", stack.kms_key.id)
    pulumi.export("kmsKeyArn", stack.kms_key.arn)
    pulumi.export("artifactBucketName", stack.artifact_bucket.bucket)
