"""
AWS CodePipeline CI/CD Implementation for Pulumi Multi-Region Infrastructure
This module creates a complete CI/CD pipeline using AWS CodePipeline to deploy
secure multi-region infrastructure using Pulumi.
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict, List, Any

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()

# Common tags for all resources
common_tags = {
  "Environment": stack_name,
  "Owner": config.get("owner") or "DevOps Team",
  "Project": config.get("project") or project_name,
  "ManagedBy": "Pulumi"
}

# GitHub repository configuration
github_owner = config.require("github_owner")
github_repo = config.require("github_repo")
github_branch = config.get("github_branch") or "main"

# Create S3 bucket for CodePipeline artifacts
artifacts_bucket = aws.s3.Bucket(
  "codepipeline-artifacts",
  bucket=f"{project_name}-{stack_name}-pipeline-artifacts",
  force_destroy=True,
  server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
      apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
        sse_algorithm="AES256"
      )
    )
  ),
  public_access_block=aws.s3.BucketPublicAccessBlockArgs(
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
  ),
  tags=common_tags
)

# S3 bucket policy to enforce encryption in transit
artifacts_bucket_policy = aws.s3.BucketPolicy(
  "codepipeline-artifacts-policy",
  bucket=artifacts_bucket.id,
  policy=artifacts_bucket.arn.apply(lambda arn: json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "DenyInsecureConnections",
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:*",
        "Resource": [
          arn,
          f"{arn}/*"
        ],
        "Condition": {
          "Bool": {
            "aws:SecureTransport": "false"
          }
        }
      }
    ]
  }))
)

# IAM Role for CodePipeline
codepipeline_role = aws.iam.Role(
  "codepipeline-role",
  assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "codepipeline.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }),
  tags=common_tags
)

# IAM Policy for CodePipeline
codepipeline_policy = aws.iam.RolePolicy(
  "codepipeline-policy",
  role=codepipeline_role.id,
  policy=pulumi.Output.all(artifacts_bucket.arn).apply(lambda args: json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ],
        "Resource": [
          args[0],
          f"{args[0]}/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      }
    ]
  }))
)

# IAM Role for CodeBuild
codebuild_role = aws.iam.Role(
  "codebuild-role",
  assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "codebuild.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }),
  tags=common_tags
)

# IAM Policy for CodeBuild (with extensive permissions for Pulumi deployments)
codebuild_policy = aws.iam.RolePolicy(
  "codebuild-policy",
  role=codebuild_role.id,
  policy=pulumi.Output.all(artifacts_bucket.arn).apply(lambda args: json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ],
        "Resource": [
          args[0],
          f"{args[0]}/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "ec2:*",
          "iam:*",
          "s3:*",
          "cloudtrail:*",
          "logs:*",
          "kms:*"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "sts:AssumeRole",
          "sts:GetCallerIdentity"
        ],
        "Resource": "*"
      }
    ]
  }))
)

# CodeBuild project for linting and validation
lint_project = aws.codebuild.Project(
  "pulumi-lint",
  name=f"{project_name}-{stack_name}-lint",
  service_role=codebuild_role.arn,
  artifacts=aws.codebuild.ProjectArtifactsArgs(
    type="CODEPIPELINE"
  ),
  environment=aws.codebuild.ProjectEnvironmentArgs(
    compute_type="BUILD_GENERAL1_SMALL",
    image="aws/codebuild/standard:7.0",
    type="LINUX_CONTAINER",
    environment_variables=[
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="PULUMI_ACCESS_TOKEN",
        value="pulumi-access-token",
        type="PARAMETER_STORE"
      )
    ]
  ),
  source=aws.codebuild.ProjectSourceArgs(
    type="CODEPIPELINE",
    buildspec="buildspecs/lint-buildspec.yml"
  ),
  tags=common_tags
)

# CodeBuild project for development deployment
dev_deploy_project = aws.codebuild.Project(
  "pulumi-dev-deploy",
  name=f"{project_name}-{stack_name}-dev-deploy",
  service_role=codebuild_role.arn,
  artifacts=aws.codebuild.ProjectArtifactsArgs(
    type="CODEPIPELINE"
  ),
  environment=aws.codebuild.ProjectEnvironmentArgs(
    compute_type="BUILD_GENERAL1_SMALL",
    image="aws/codebuild/standard:7.0",
    type="LINUX_CONTAINER",
    environment_variables=[
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="PULUMI_ACCESS_TOKEN",
        value="pulumi-access-token",
        type="PARAMETER_STORE"
      ),
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="STACK_NAME",
        value="dev"
      )
    ]
  ),
  source=aws.codebuild.ProjectSourceArgs(
    type="CODEPIPELINE",
    buildspec="buildspecs/deploy-buildspec.yml"
  ),
  tags=common_tags
)

# CodeBuild project for testing
test_project = aws.codebuild.Project(
  "pulumi-test",
  name=f"{project_name}-{stack_name}-test",
  service_role=codebuild_role.arn,
  artifacts=aws.codebuild.ProjectArtifactsArgs(
    type="CODEPIPELINE"
  ),
  environment=aws.codebuild.ProjectEnvironmentArgs(
    compute_type="BUILD_GENERAL1_SMALL",
    image="aws/codebuild/standard:7.0",
    type="LINUX_CONTAINER",
    environment_variables=[
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="PULUMI_ACCESS_TOKEN",
        value="pulumi-access-token",
        type="PARAMETER_STORE"
      ),
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="STACK_NAME",
        value="dev"
      )
    ]
  ),
  source=aws.codebuild.ProjectSourceArgs(
    type="CODEPIPELINE",
    buildspec="buildspecs/test-buildspec.yml"
  ),
  tags=common_tags
)

# CodeBuild project for production deployment
prod_deploy_project = aws.codebuild.Project(
  "pulumi-prod-deploy",
  name=f"{project_name}-{stack_name}-prod-deploy",
  service_role=codebuild_role.arn,
  artifacts=aws.codebuild.ProjectArtifactsArgs(
    type="CODEPIPELINE"
  ),
  environment=aws.codebuild.ProjectEnvironmentArgs(
    compute_type="BUILD_GENERAL1_SMALL",
    image="aws/codebuild/standard:7.0",
    type="LINUX_CONTAINER",
    environment_variables=[
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="PULUMI_ACCESS_TOKEN",
        value="pulumi-access-token",
        type="PARAMETER_STORE"
      ),
      aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
        name="STACK_NAME",
        value="prod"
      )
    ]
  ),
  source=aws.codebuild.ProjectSourceArgs(
    type="CODEPIPELINE",
    buildspec="buildspecs/deploy-buildspec.yml"
  ),
  tags=common_tags
)

# GitHub connection for CodePipeline
github_connection = aws.codestarconnections.Connection(
  "github-connection",
  name=f"{project_name}-{stack_name}-github",
  provider_type="GitHub",
  tags=common_tags
)

# CodePipeline
pipeline = aws.codepipeline.Pipeline(
  "pulumi-pipeline",
  name=f"{project_name}-{stack_name}-pipeline",
  role_arn=codepipeline_role.arn,
  artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
    location=artifacts_bucket.bucket,
    type="S3",
    encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
      id="alias/aws/s3",
      type="KMS"
    )
  ),
  stages=[
    # Source stage
    aws.codepipeline.PipelineStageArgs(
      name="Source",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="Source",
          category="Source",
          owner="AWS",
          provider="CodeStarSourceConnection",
          version="1",
          output_artifacts=["source_output"],
          configuration={
            "ConnectionArn": github_connection.arn,
            "FullRepositoryId": f"{github_owner}/{github_repo}",
            "BranchName": github_branch,
            "OutputArtifactFormat": "CODE_ZIP"
          }
        )
      ]
    ),
    # Lint and validate stage
    aws.codepipeline.PipelineStageArgs(
      name="Lint",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="Lint",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["source_output"],
          output_artifacts=["lint_output"],
          configuration={
            "ProjectName": lint_project.name
          }
        )
      ]
    ),
    # Deploy to dev stage
    aws.codepipeline.PipelineStageArgs(
      name="DeployDev",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="DeployDev",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["lint_output"],
          output_artifacts=["dev_output"],
          configuration={
            "ProjectName": dev_deploy_project.name
          }
        )
      ]
    ),
    # Test stage
    aws.codepipeline.PipelineStageArgs(
      name="Test",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="Test",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["dev_output"],
          output_artifacts=["test_output"],
          configuration={
            "ProjectName": test_project.name
          }
        )
      ]
    ),
    # Manual approval stage
    aws.codepipeline.PipelineStageArgs(
      name="ManualApproval",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="ManualApproval",
          category="Approval",
          owner="AWS",
          provider="Manual",
          version="1",
          configuration={
            "CustomData": "Please review the test results and approve deployment to production."
          }
        )
      ]
    ),
    # Deploy to production stage
    aws.codepipeline.PipelineStageArgs(
      name="DeployProd",
      actions=[
        aws.codepipeline.PipelineStageActionArgs(
          name="DeployProd",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["test_output"],
          configuration={
            "ProjectName": prod_deploy_project.name
          }
        )
      ]
    )
  ],
  tags=common_tags
)

# CloudWatch Log Group for pipeline logs
pipeline_log_group = aws.cloudwatch.LogGroup(
  "pipeline-logs",
  name=f"/aws/codepipeline/{project_name}-{stack_name}",
  retention_in_days=30,
  tags=common_tags
)

# SNS Topic for pipeline notifications
notification_topic = aws.sns.Topic(
  "pipeline-notifications",
  name=f"{project_name}-{stack_name}-notifications",
  tags=common_tags
)

# CloudWatch Event Rule for pipeline state changes
pipeline_event_rule = aws.cloudwatch.EventRule(
  "pipeline-state-change",
  name=f"{project_name}-{stack_name}-pipeline-state-change",
  description="Capture pipeline state changes",
  event_pattern=json.dumps({
    "source": ["aws.codepipeline"],
    "detail-type": ["CodePipeline Pipeline Execution State Change"],
    "detail": {
      "pipeline": [pipeline.name]
    }
  }),
  tags=common_tags
)

# CloudWatch Event Target
pipeline_event_target = aws.cloudwatch.EventTarget(
  "pipeline-notification-target",
  rule=pipeline_event_rule.name,
  arn=notification_topic.arn
)

# SNS Topic Policy for CloudWatch Events
topic_policy = aws.sns.TopicPolicy(
  "pipeline-topic-policy",
  arn=notification_topic.arn,
  policy=notification_topic.arn.apply(lambda arn: json.dumps({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "events.amazonaws.com"
        },
        "Action": "SNS:Publish",
        "Resource": arn
      }
    ]
  }))
)

# Outputs
pulumi.export("pipeline_name", pipeline.name)
pulumi.export("artifacts_bucket", artifacts_bucket.bucket)
pulumi.export("github_connection_arn", github_connection.arn)
pulumi.export("notification_topic_arn", notification_topic.arn)
pulumi.export("codebuild_projects", {
  "lint": lint_project.name,
  "dev_deploy": dev_deploy_project.name,
  "test": test_project.name,
  "prod_deploy": prod_deploy_project.name
})

# Export buildspec configurations as files (these would be separate files in actual implementation)
buildspecs = {
  "lint-buildspec.yml": """version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip
      - pip install pulumi pulumi-aws boto3 pytest flake8 black mypy
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin

  pre_build:
    commands:
      - echo "Running linting and validation..."
      - pulumi login --non-interactive

  build:
    commands:
      - echo "Linting Python code..."
      - flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
      - black --check .
      - mypy . --ignore-missing-imports
      - echo "Validating Pulumi configuration..."
      - pulumi stack select dev --create
      - pulumi preview --diff

  post_build:
    commands:
      - echo "Linting and validation completed successfully"

artifacts:
  files:
    - '**/*'
""",

  "deploy-buildspec.yml": """version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip
      - pip install pulumi pulumi-aws boto3
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin

  pre_build:
    commands:
      - echo "Preparing Pulumi deployment..."
      - pulumi login --non-interactive
      - pulumi stack select $STACK_NAME --create

  build:
    commands:
      - echo "Deploying infrastructure with Pulumi..."
      - pulumi up --yes --skip-preview
      - pulumi stack output --json > stack-outputs.json

  post_build:
    commands:
      - echo "Deployment completed successfully"
      - cat stack-outputs.json

artifacts:
  files:
    - stack-outputs.json
    - '**/*'
""",

  "test-buildspec.yml": """version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip
      - pip install pulumi pulumi-aws boto3 pytest
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin

  pre_build:
    commands:
      - echo "Preparing tests..."
      - pulumi login --non-interactive
      - pulumi stack select $STACK_NAME

  build:
    commands:
      - echo "Running infrastructure tests..."
      - pytest tests/ -v --tb=short
      - echo "Running compliance checks..."
      - python tests/compliance_tests.py
      - echo "Validating security configurations..."
      - python tests/security_tests.py

  post_build:
    commands:
      - echo "All tests passed successfully"

artifacts:
  files:
    - test-results.xml
    - '**/*'
"""
}

pulumi.export("buildspecs", buildspecs)