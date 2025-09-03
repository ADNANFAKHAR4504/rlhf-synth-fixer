"""
CodePipeline for deployment
"""
import json
from typing import Dict
import pulumi
import pulumi_aws as aws


def setup_codepipeline(stack: str) -> Dict:

  # S3 bucket for source
  source_bucket = aws.s3.Bucket(
    f"pipeline-source-bucket-{stack}",
    bucket_prefix="infra-src-",
    force_destroy=True
  )

  aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"pipeline-source-bucket-encryption-{stack}",
    bucket=source_bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
      apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
        sse_algorithm="aws:kms"
      ))]
  )

  # Artifact store bucket
  artifact_bucket = aws.s3.Bucket(
    f"pipeline-artifact-bucket-{stack}",
    bucket_prefix="infra-artifacts-",
    force_destroy=True
  )

  # IAM Roles
  pipeline_role = aws.iam.Role(
    f"pipeline-role-{stack}",
    assume_role_policy="""{
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": { "Service": "codepipeline.amazonaws.com" },
              "Action": "sts:AssumeRole"
          }]
      }"""
  )

  # Pipeline service role policy
  pipeline_policy = aws.iam.Policy(
    f"pipeline-policy-{stack}",
    policy=pulumi.Output.all(
      artifact_bucket_arn=artifact_bucket.arn,
      source_bucket_arn=source_bucket.arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetBucketVersioning",
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ],
          "Resource": [
            args["artifact_bucket_arn"],
            f"{args['artifact_bucket_arn']}/*",
            args["source_bucket_arn"],
            f"{args['source_bucket_arn']}/*"
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
            "iam:PassRole"
          ],
          "Resource": "*"
        }
      ]
    }))
  )

  aws.iam.RolePolicyAttachment(
    f"pipeline-policy-attach-{stack}",
    role=pipeline_role.name,
    policy_arn=pipeline_policy.arn
  )

  codebuild_role = aws.iam.Role(
    f"codebuild-role-{stack}",
    assume_role_policy="""{
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": { "Service": "codebuild.amazonaws.com" },
              "Action": "sts:AssumeRole"
          }]
      }"""
  )

  codebuild_policy = aws.iam.Policy(
    f"codebuild-policy-{stack}",
    policy=json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "s3:GetObject",
            "s3:PutObject",
            "ecr:GetAuthorizationToken",
            "ecr:BatchGetImage",
            "ecr:GetDownloadUrlForLayer"
          ],
          "Resource": "*"
        }
      ]
    })
  )

  aws.iam.RolePolicyAttachment(
    f"codebuild-policy-attach-{stack}",
    role=codebuild_role.name,
    policy_arn=codebuild_policy.arn
  )

  # CodeBuild project for tests
  test_project = aws.codebuild.Project(
    f"infra-test-project-{stack}",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
    environment=aws.codebuild.ProjectEnvironmentArgs(
      compute_type="BUILD_GENERAL1_SMALL",
      image="aws/codebuild/standard:5.0",
      type="LINUX_CONTAINER",
    ),
    source=aws.codebuild.ProjectSourceArgs(
      type="CODEPIPELINE",
      buildspec="""version: 0.2
  phases:
    build:
      commands:
        - echo "Running compliance checks..."
        - python3 -m pip install pulumi pulumi_aws
        - python3 scripts/security_checks.py
  artifacts:
    files:
      - '**/*'
  """
    ),
  )

  # CodeBuild project for deploy
  deploy_project = aws.codebuild.Project(
    f"infra-deploy-project-{stack}",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
    environment=aws.codebuild.ProjectEnvironmentArgs(
      compute_type="BUILD_GENERAL1_SMALL",
      image="aws/codebuild/standard:5.0",
      type="LINUX_CONTAINER",
      environment_variables=[
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="PULUMI_STACK",
          value="dev"
        ),
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="AWS_REGION_EAST",
          value="us-east-1"
        ),
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="AWS_REGION_WEST",
          value="us-west-2"
        ),
      ]
    ),
    source=aws.codebuild.ProjectSourceArgs(
      type="CODEPIPELINE",
      buildspec="""version: 0.2
  phases:
    install:
      commands:
        - echo "Installing Pulumi..."
        - curl -fsSL https://get.pulumi.com | sh
        - export PATH=$PATH:$HOME/.pulumi/bin
        - pip3 install pulumi pulumi_aws
    build:
      commands:
        - echo "Deploying multi-region infrastructure..."
        - pulumi stack select $PULUMI_STACK
        - pulumi up --yes
  artifacts:
    files:
      - '**/*'
  """
    ),
  )

  # CodePipeline definition
  pipeline = aws.codepipeline.Pipeline(
    f"infra-pipeline-{stack}",
    role_arn=pipeline_role.arn,
    artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
      location=artifact_bucket.bucket,
      type="S3",
    )],
    stages=[
      aws.codepipeline.PipelineStageArgs(
        name="Source",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="SourceAction",
          category="Source",
          owner="AWS",
          provider="S3",
          version="1",
          output_artifacts=["source_output"],
          configuration={
            "S3Bucket": source_bucket.bucket,
            "S3ObjectKey": "source.zip",
            "PollForSourceChanges": "true",
          },
        )],
      ),
      aws.codepipeline.PipelineStageArgs(
        name="Test",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="TestAction",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["source_output"],
          output_artifacts=["test_output"],
          configuration={
            "ProjectName": test_project.name,
          },
        )],
      ),
      aws.codepipeline.PipelineStageArgs(
        name="Deploy",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="DeployAction",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["test_output"],
          configuration={
            "ProjectName": deploy_project.name,
          },
        )],
      ),
    ],
  )

  return {
    "pipeline_name": pipeline.name,
    "pipeline_source_bucket": source_bucket.bucket,
    "pipeline_artifact_bucket": artifact_bucket.bucket
  }
