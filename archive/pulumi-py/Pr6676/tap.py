#!/usr/bin/env python3
"""
Pulumi application entry point for CI/CD Pipeline Infrastructure.

This script initializes the TapStack component with configuration from
environment variables or Pulumi config.
"""

import os

import pulumi
from pulumi import Config

from lib.tap_stack import TapStack, TapStackArgs

# Read configuration
config = Config()
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'

# GitHub configuration
github_owner = config.get('github_owner') or 'example-org'
github_repo = config.get('github_repo') or 'example-repo'
github_branch = config.get('github_branch') or 'main'
# CodeStar Connections ARN: prefer Pulumi config, fallback to env var
github_connection_arn = config.get('github_connection_arn') or os.getenv('GITHUB_CONNECTION_ARN')

# For testing purposes, use a dummy ARN if not provided
if not github_connection_arn:
    github_connection_arn = 'arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'

# Notification email
notification_email = config.get('notification_email') or 'devops@example.com'

# Pulumi access token (SecureString - will be stored encrypted)
pulumi_token = config.get_secret('pulumi_access_token') or 'placeholder-token'

# Default tags
default_tags = {
    'Environment': environment_suffix,
    'Project': 'pulumi-cicd-pipeline',
    'ManagedBy': 'Pulumi',
    'Repository': f'{github_owner}/{github_repo}',
    'Team': os.getenv('TEAM', 'devops')
}

# Create the stack
stack = TapStack(
    name='pulumi-cicd-pipeline',
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags,
        github_owner=github_owner,
        github_repo=github_repo,
        github_connection_arn=github_connection_arn,
        github_branch=github_branch,
        notification_email=notification_email,
        pulumi_access_token=pulumi_token
    )
)

# Export comprehensive outputs
pulumi.export('pipeline_name', stack.pipeline.name)
pulumi.export('pipeline_arn', stack.pipeline.arn)
pulumi.export('pipeline_url', pulumi.Output.concat(
    'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/',
    stack.pipeline.name,
    '/view?region=',
    stack.region
))
pulumi.export('artifact_bucket_name', stack.artifact_bucket.id)
pulumi.export('state_bucket_name', stack.state_bucket.id)
pulumi.export('codebuild_project_name', stack.codebuild_project.name)
pulumi.export('sns_topic_arn', stack.sns_topic.arn)
pulumi.export('log_group_name', stack.log_group.name)
pulumi.export('pulumi_token_parameter', stack.pulumi_token_param.name)
pulumi.export('kms_key_id', stack.kms_key.id)

# Export connection information
pulumi.export('connection_info', {
    'pipeline_console': pulumi.Output.concat(
        'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/',
        stack.pipeline.name,
        '/view?region=',
        stack.region
    ),
    'codebuild_console': pulumi.Output.concat(
        'https://console.aws.amazon.com/codesuite/codebuild/',
        stack.account_id,
        '/projects/',
        stack.codebuild_project.name,
        '?region=',
        stack.region
    ),
    'logs_console': pulumi.Output.concat(
        'https://console.aws.amazon.com/cloudwatch/home?region=',
        stack.region,
        '#logsV2:log-groups/log-group/$252Faws$252Fcodebuild$252Fpulumi-build-',
        environment_suffix
    ),
    'github_repo': f'https://github.com/{github_owner}/{github_repo}',
    'notification_email': notification_email
})