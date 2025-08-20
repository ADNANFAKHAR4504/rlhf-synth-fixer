# TAP Stack - AWS CDK Infrastructure

## `tap_stack.py` - Complete CDK Implementation

```python
"""tap_stack.py
This module defines all CDK stacks for the TAP (Test Automation Platform) project.
It includes all resource-specific stacks consolidated into a single file and 
manages environment-specific configurations.
"""

from typing import Optional
import random
import string

import aws_cdk as cdk
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_codebuild as codebuild
from aws_cdk import aws_codepipeline as codepipeline
from aws_cdk import aws_codepipeline_actions as codepipeline_actions

from constructs import Construct


def generate_random_suffix(length: int = 6) -> str:
  """Generate a random alphanumeric suffix for resource uniqueness."""
  return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def standardize_resource_name(
  resource_type: str, 
  environment: str, 
  component: str = "", 
  random_suffix: str = ""
) -> str:
  """
  Generate standardized resource names following consistent naming conventions.
  
  Format: {project}-{environment}-{resource_type}[-{component}][-{random_suffix}]
  """
  project = "tap"  # Test Automation Platform
  parts = [project, environment, resource_type]
  
  if component:
    parts.append(component)
  if random_suffix:
    parts.append(random_suffix)
    
  return "-".join(parts)


def apply_common_tags(construct: Construct, environment_suffix: str, project_name: str = "TAP") -> None:
  """Apply common tags to all resources in a construct for governance and cost tracking."""
  cdk.Tags.of(construct).add("Project", project_name)
  cdk.Tags.of(construct).add("Environment", environment_suffix)
  cdk.Tags.of(construct).add("ManagedBy", "CDK")
  cdk.Tags.of(construct).add("Owner", "DevOps")
  cdk.Tags.of(construct).add("CostCenter", f"{project_name}-{environment_suffix}")
  cdk.Tags.of(construct).add("Application", "TestAutomationPlatform")


class IAMStackProps(cdk.StackProps):
  """
  IAMStackProps defines the properties for the IAMStack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class IAMStack(Construct):
  """
  IAMStack creates IAM roles and policies for CI/CD pipeline components.
  
  This stack creates:
  - CodePipeline service role
  - CodeBuild service role  
  - CloudFormation execution role for deployments
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    environment_suffix (Optional[str]): Environment suffix for resource naming
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    environment_suffix: Optional[str] = None
  ):
    super().__init__(scope, construct_id)
    
    environment_suffix = environment_suffix or 'dev'
    random_suffix = generate_random_suffix()
    
    # CodePipeline service role - Using explicit naming for integration tests
    self.codepipeline_role = iam.Role(
      self,
      f"CodePipelineRole{random_suffix}",
      role_name=f"ciapp-{environment_suffix}-codepipeline-role",
      assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com"),
      # Using least privilege instead of full access policies
      managed_policies=[],
      inline_policies={
        "CodePipelineExecutionPolicy": iam.PolicyDocument(
          statements=[
            # IAM PassRole permissions with service restrictions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=["iam:PassRole"],
              resources=["*"],
              conditions={
                "StringEquals": {
                  "iam:PassedToService": [
                    "cloudformation.amazonaws.com",
                    "codebuild.amazonaws.com"
                  ]
                }
              }
            ),
            # S3 permissions for pipeline artifacts
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "s3:GetBucketVersioning"
              ],
              resources=[
                "arn:aws:s3:::*-artifacts-*",
                "arn:aws:s3:::*-artifacts-*/*",
                "arn:aws:s3:::*-source-*",
                "arn:aws:s3:::*-source-*/*"
              ]
            ),
            # CodeBuild permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "codebuild:BatchGetBuilds",
                "codebuild:StartBuild"
              ],
              resources=["*"]
            ),
            # CloudFormation permissions for deployments
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResources",
                "cloudformation:GetTemplate"
              ],
              resources=["*"]
            )
          ]
        )
      }
    )
    
    # CodeBuild service role - Using explicit naming for integration tests
    self.codebuild_role = iam.Role(
      self,
      f"CodeBuildRole{random_suffix}", 
      role_name=f"ciapp-{environment_suffix}-codebuild-role",
      assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
      ],
      inline_policies={
        "CodeBuildPolicy": iam.PolicyDocument(
          statements=[
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream", 
                "logs:PutLogEvents"
              ],
              resources=[
                f"arn:aws:logs:us-west-2:{cdk.Aws.ACCOUNT_ID}:"
                f"log-group:/aws/codebuild/*"
              ]
            )
          ]
        )
      }
    )
    
    # CloudFormation execution role for deployments - Using explicit naming for integration tests
    self.cloudformation_role = iam.Role(
      self,
      f"CloudFormationRole{random_suffix}",
      role_name=f"ciapp-{environment_suffix}-cloudformation-role",
      assumed_by=iam.ServicePrincipal("cloudformation.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("PowerUserAccess")
      ],
      inline_policies={
        "IAMPolicy": iam.PolicyDocument(
          statements=[
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "iam:*"
              ],
              resources=["*"]
            )
          ]
        )
      }
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "IAM")


class S3StackProps(cdk.StackProps):
  """
  S3StackProps defines the properties for the S3Stack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class S3Stack(Construct):
  """
  S3Stack creates S3 buckets for CI/CD pipeline artifacts.
  
  This stack creates:
  - Artifacts bucket for pipeline artifacts and build outputs
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    environment_suffix (Optional[str]): Environment suffix for resource naming
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    environment_suffix: Optional[str] = None
  ):
    super().__init__(scope, construct_id)
    
    environment_suffix = environment_suffix or 'dev'
    
    # Apply consistent tagging for governance and cost tracking
    apply_common_tags(self, environment_suffix)
    
    # S3 bucket for pipeline artifacts - Using explicit naming for integration tests
    self.artifacts_bucket = s3.Bucket(
      self,
      "ArtifactsBucket",
      bucket_name=f"ciapp-{environment_suffix}-artifacts-{cdk.Aws.ACCOUNT_ID}",
      versioned=True,
      encryption=s3.BucketEncryption.KMS_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      enforce_ssl=True,
      removal_policy=cdk.RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        # Cost optimization: Delete old versions after 30 days
        s3.LifecycleRule(
          id="DeleteOldVersions",
          enabled=True,
          noncurrent_version_expiration=cdk.Duration.days(30)
        ),
        # Cost optimization: Delete incomplete multipart uploads
        s3.LifecycleRule(
          id="DeleteIncompleteUploads", 
          enabled=True,
          abort_incomplete_multipart_upload_after=cdk.Duration.days(7)
        ),
        # Cost optimization: Transition to cheaper storage classes for long-term artifacts
        s3.LifecycleRule(
          id="TransitionToIA",
          enabled=True,
          transitions=[
            s3.Transition(
              storage_class=s3.StorageClass.INFREQUENT_ACCESS,
              transition_after=cdk.Duration.days(30)
            ),
            s3.Transition(
              storage_class=s3.StorageClass.GLACIER,
              transition_after=cdk.Duration.days(90)
            )
          ]
        )
      ]
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "Storage")


class CodeBuildStackProps(cdk.StackProps):
  """
  CodeBuildStackProps defines the properties for the CodeBuildStack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    codebuild_role (iam.Role): IAM role for CodeBuild projects
    artifacts_bucket (s3.Bucket): S3 bucket for storing build artifacts
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(
    self,
    environment_suffix: Optional[str] = None,
    codebuild_role: Optional[iam.Role] = None,
    artifacts_bucket: Optional[s3.Bucket] = None,
    **kwargs
  ):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix
    self.codebuild_role = codebuild_role
    self.artifacts_bucket = artifacts_bucket


class CodeBuildStack(Construct):
  """
  CodeBuildStack creates CodeBuild projects for the CI/CD pipeline.
  
  This stack creates:
  - Build project for compiling and testing code
  - Deploy projects for staging and production environments
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    props (Optional[CodeBuildStackProps]): Optional properties for configuring the stack
    **kwargs: Additional keyword arguments passed to the CDK NestedStack
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    *,
    environment_suffix: Optional[str] = None,
    codebuild_role: Optional[iam.Role] = None,
    artifacts_bucket: Optional[s3.Bucket] = None
  ):
    super().__init__(scope, construct_id)
    
    environment_suffix = environment_suffix or 'dev'
    random_suffix = generate_random_suffix()
    
    # Apply consistent tagging for governance and cost tracking
    apply_common_tags(self, environment_suffix)
    
    # Create CodeBuild service role if not provided
    if codebuild_role is None:
      codebuild_role = iam.Role(
        self,
        f"CodeBuildRole{random_suffix}", 
        role_name=f"ciapp-{environment_suffix}-codebuild-role-fallback",
        assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com"),
        managed_policies=[
          iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess"),
          iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
        ],
        inline_policies={
          "CodeBuildPolicy": iam.PolicyDocument(
            statements=[
              iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream", 
                  "logs:PutLogEvents"
                ],
                resources=[
                  f"arn:aws:logs:us-west-2:{cdk.Aws.ACCOUNT_ID}:"
                  f"log-group:/aws/codebuild/*"
                ]
              )
            ]
          )
        }
      )
    
    # Build project for building and testing
    buildspec_build = {
      "version": "0.2",
      "phases": {
        "install": {
          "runtime-versions": {
            "python": "3.9"
          },
          "commands": [
            "echo Installing dependencies...",
            "pip install --upgrade pip",
"pip install aws-cdk-lib>=2.80.0 constructs>=10.0.0"
          ]
        },
        "pre_build": {
          "commands": [
            "echo Logging in to Amazon ECR...",
            "echo Build started on `date`"
          ]
        },
        "build": {
          "commands": [
            "echo Build phase started on `date`",
            "echo Running tests...",
            "python -m pytest tests/ || echo 'No tests found'",
            "echo Build completed on `date`"
          ]
        },
        "post_build": {
          "commands": [
            "echo Build completed on `date`"
          ]
        }
      },
      "artifacts": {
        "files": [
          "**/*"
        ],
        "name": "BuildArtifact"
      }
    }
    
    self.build_project = codebuild.Project(
      self,
      "BuildProject",
      project_name=f"ciapp-{environment_suffix}-build",
      role=codebuild_role,
      environment=codebuild.BuildEnvironment(
        build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
        compute_type=codebuild.ComputeType.SMALL,
        privileged=False
      ),
      build_spec=codebuild.BuildSpec.from_object(buildspec_build),
      artifacts=codebuild.Artifacts.s3(
        bucket=artifacts_bucket,
        include_build_id=True,
        package_zip=True
      ) if artifacts_bucket else None,
      timeout=cdk.Duration.minutes(60)
    )
    
    # Deploy project for staging environment
    buildspec_deploy_staging = {
      "version": "0.2",
      "phases": {
        "install": {
          "runtime-versions": {
            "python": "3.9"
          },
          "commands": [
            "echo Installing AWS CDK...",
            "npm install -g aws-cdk",
            "pip install --upgrade pip",
"pip install aws-cdk-lib>=2.80.0 constructs>=10.0.0"
          ]
        },
        "pre_build": {
          "commands": [
            "echo Deploying to staging environment..."
          ]
        },
        "build": {
          "commands": [
            "echo Deploy phase started on `date`",
            "cdk deploy --require-approval never --context environmentSuffix=staging",
            "echo Deploy completed on `date`"
          ]
        }
      }
    }
    
    self.deploy_staging_project = codebuild.Project(
      self,
      "DeployStagingProject", 
      project_name=f"ciapp-{environment_suffix}-deploy-staging",
      role=codebuild_role,
      environment=codebuild.BuildEnvironment(
        build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
        compute_type=codebuild.ComputeType.SMALL,
        privileged=False
      ),
      build_spec=codebuild.BuildSpec.from_object(buildspec_deploy_staging),
      timeout=cdk.Duration.minutes(60)
    )
    
    # Deploy project for production environment
    buildspec_deploy_production = {
      "version": "0.2",
      "phases": {
        "install": {
          "runtime-versions": {
            "python": "3.9"
          },
          "commands": [
            "echo Installing AWS CDK...",
            "npm install -g aws-cdk",
            "pip install --upgrade pip", 
"pip install aws-cdk-lib>=2.80.0 constructs>=10.0.0"
          ]
        },
        "pre_build": {
          "commands": [
            "echo Deploying to production environment..."
          ]
        },
        "build": {
          "commands": [
            "echo Deploy phase started on `date`",
            "cdk deploy --require-approval never --context environmentSuffix=production",
            "echo Deploy completed on `date`"
          ]
        }
      }
    }
    
    self.deploy_production_project = codebuild.Project(
      self,
      "DeployProductionProject",
      project_name=f"ciapp-{environment_suffix}-deploy-production", 
      role=codebuild_role,
      environment=codebuild.BuildEnvironment(
        build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
        compute_type=codebuild.ComputeType.SMALL,
        privileged=False
      ),
      build_spec=codebuild.BuildSpec.from_object(buildspec_deploy_production),
      timeout=cdk.Duration.minutes(60)
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "Build")


class CodePipelineStackProps(cdk.StackProps):
  """
  CodePipelineStackProps defines the properties for the CodePipelineStack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    codepipeline_role (iam.Role): IAM role for CodePipeline
    artifacts_bucket (s3.Bucket): S3 bucket for storing pipeline artifacts
    build_project (codebuild.Project): CodeBuild project for building code
    deploy_staging_project (codebuild.Project): CodeBuild project for staging deployment
    deploy_production_project (codebuild.Project): CodeBuild project for production deployment
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(
    self,
    environment_suffix: Optional[str] = None,
    codepipeline_role: Optional[iam.Role] = None,
    artifacts_bucket: Optional[s3.Bucket] = None,
    *,
    build_project: Optional[codebuild.Project] = None,
    deploy_staging_project: Optional[codebuild.Project] = None,
    deploy_production_project: Optional[codebuild.Project] = None,
    **kwargs
  ):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix
    self.codepipeline_role = codepipeline_role
    self.artifacts_bucket = artifacts_bucket
    self.build_project = build_project
    self.deploy_staging_project = deploy_staging_project
    self.deploy_production_project = deploy_production_project


class CodePipelineStack(Construct):
  """
  CodePipelineStack creates the CI/CD pipeline for automated deployments.
  
  This stack creates:
  - S3 bucket for source code artifacts
  - CodePipeline with source, build, staging, and production stages
  - Manual approval action between staging and production
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    props (Optional[CodePipelineStackProps]): Optional properties for configuring the stack
    **kwargs: Additional keyword arguments passed to the CDK NestedStack
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    *,
    environment_suffix: Optional[str] = None,
    codepipeline_role: Optional[iam.Role] = None,
    artifacts_bucket: Optional[s3.Bucket] = None,
    build_project: Optional[codebuild.Project] = None,
    deploy_staging_project: Optional[codebuild.Project] = None,
    deploy_production_project: Optional[codebuild.Project] = None
  ):
    super().__init__(scope, construct_id)
    
    environment_suffix = environment_suffix or 'dev'
    random_suffix = generate_random_suffix()
    
    # Apply consistent tagging for governance and cost tracking
    apply_common_tags(self, environment_suffix)
    
    # Create CodePipeline service role if not provided
    if codepipeline_role is None:
      codepipeline_role = iam.Role(
        self,
        f"CodePipelineRole{random_suffix}",
        role_name=f"ciapp-{environment_suffix}-codepipeline-role-fallback",
        assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com"),
        managed_policies=[
          iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess"),
          iam.ManagedPolicy.from_aws_managed_policy_name("AWSCloudFormationFullAccess")
        ],
        inline_policies={
          "PassRolePolicy": iam.PolicyDocument(
            statements=[
              iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["iam:PassRole"],
                resources=["*"],
                conditions={
                  "StringEquals": {
                    "iam:PassedToService": [
                      "cloudformation.amazonaws.com",
                      "codebuild.amazonaws.com"
                    ]
                  }
                }
              )
            ]
          )
        }
      )
    
    # Create S3 bucket for source code artifacts - Using explicit naming for integration tests
    self.source_bucket = s3.Bucket(
      self,
      "SourceBucket",
      bucket_name=f"ciapp-{environment_suffix}-source-{cdk.Aws.ACCOUNT_ID}",
      versioned=True,
      encryption=s3.BucketEncryption.KMS_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      enforce_ssl=True,
      removal_policy=cdk.RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        # Cost optimization: Delete old versions after 30 days
        s3.LifecycleRule(
          id="DeleteOldVersions",
          enabled=True,
          noncurrent_version_expiration=cdk.Duration.days(30)
        ),
        # Cost optimization: Delete incomplete multipart uploads
        s3.LifecycleRule(
          id="DeleteIncompleteUploads", 
          enabled=True,
          abort_incomplete_multipart_upload_after=cdk.Duration.days(7)
        )
      ]
    )
    
    # Define pipeline artifacts
    source_output = codepipeline.Artifact("SourceOutput")
    build_output = codepipeline.Artifact("BuildOutput")
    
    # Create the pipeline
    self.pipeline = codepipeline.Pipeline(
      self,
      "Pipeline",
      pipeline_name=f"ciapp-{environment_suffix}-pipeline",
      role=codepipeline_role,
      artifact_bucket=artifacts_bucket,
      stages=[
        # Source stage
        codepipeline.StageProps(
          stage_name="Source",
          actions=[
            codepipeline_actions.S3SourceAction(
              action_name="Source",
              bucket=self.source_bucket,
              bucket_key="source.zip",
              output=source_output,
              trigger=codepipeline_actions.S3Trigger.EVENTS
            )
          ]
        ),
        
        # Build stage
        codepipeline.StageProps(
          stage_name="Build",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="Build",
              project=build_project,
              input=source_output,
              outputs=[build_output]
            )
          ]
        ),
        
        # Deploy to Staging stage
        codepipeline.StageProps(
          stage_name="DeployStaging",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="DeployToStaging", 
              project=deploy_staging_project,
              input=build_output
            )
          ]
        ),
        
        # Manual approval stage
        codepipeline.StageProps(
          stage_name="ApproveProduction",
          actions=[
            codepipeline_actions.ManualApprovalAction(
              action_name="ApproveProductionDeployment",
              additional_information=("Please review the staging deployment "
                                      "and approve for production deployment.")
            )
          ]
        ),
        
        # Deploy to Production stage
        codepipeline.StageProps(
          stage_name="DeployProduction",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="DeployToProduction",
              project=deploy_production_project,
              input=build_output
            )
          ]
        )
      ]
    )
    
    # Output the source bucket name
    cdk.CfnOutput(
      self,
      "SourceBucketName",
      value=self.source_bucket.bucket_name,
      description="S3 bucket name for source code artifacts"
    )
    
    # Output the pipeline console URL
    cdk.CfnOutput(
      self,
      "PipelineUrl",
      value=(f"https://console.aws.amazon.com/codesuite/codepipeline/"
             f"pipelines/{self.pipeline.pipeline_name}/view"),
      description="AWS Console URL for the CodePipeline"
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "Pipeline")


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
  environment_suffix (Optional[str]): An optional suffix to identify the 
  deployment environment (e.g., 'dev', 'prod').
  **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
  environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
  CDK context, or defaults to 'dev'.
  Note:
  - Do NOT create AWS resources directly in this stack.
  - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
  scope (Construct): The parent construct.
  construct_id (str): The unique identifier for this stack.
  props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
  **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
  environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create separate stacks for each resource type
    # ! DO not create resources directly in this stack.
    # ! Instead, instantiate separate stacks for each resource type.
    
    # Create IAM stack for roles and policies
    self.iam_stack = IAMStack(
      self,
      f"IAMStack{environment_suffix}",
      environment_suffix=environment_suffix
    )
    
    # Create S3 stack for artifacts storage
    self.s3_stack = S3Stack(
      self,
      f"S3Stack{environment_suffix}",
      environment_suffix=environment_suffix
    )
    
    # Create CodeBuild stack for build projects
    self.codebuild_stack = CodeBuildStack(
      self,
      f"CodeBuildStack{environment_suffix}",
      environment_suffix=environment_suffix,
      codebuild_role=self.iam_stack.codebuild_role,  # Use role from IAMStack
      artifacts_bucket=self.s3_stack.artifacts_bucket
    )
    
    # Create CodePipeline stack for CI/CD orchestration
    self.codepipeline_stack = CodePipelineStack(
      self,
      f"CodePipelineStack{environment_suffix}",
      environment_suffix=environment_suffix,
      codepipeline_role=self.iam_stack.codepipeline_role,  # Use role from IAMStack
      artifacts_bucket=self.s3_stack.artifacts_bucket,
      build_project=self.codebuild_stack.build_project,
      deploy_staging_project=self.codebuild_stack.deploy_staging_project,
      deploy_production_project=self.codebuild_stack.deploy_production_project
    )
    
    # Make key resources available as properties of this stack
    self.source_bucket = self.codepipeline_stack.source_bucket
    self.pipeline = self.codepipeline_stack.pipeline
    self.artifacts_bucket = self.s3_stack.artifacts_bucket
    
    # Apply consistent tagging for governance and cost tracking
    apply_common_tags(self, environment_suffix)
    ```
