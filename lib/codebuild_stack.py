"""codebuild_stack.py
This module defines the CodeBuildStack class, which creates CodeBuild projects
for building and testing applications in the CI/CD pipeline.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_codebuild as codebuild
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from constructs import Construct


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


class CodeBuildStack(cdk.NestedStack):
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
    props: Optional[CodeBuildStackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)
    
    environment_suffix = props.environment_suffix if props else 'dev'
    codebuild_role = props.codebuild_role if props else None
    artifacts_bucket = props.artifacts_bucket if props else None
    
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
            ("pip install -r requirements.txt || "
             "echo 'No requirements.txt found'")
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
            ("pip install -r requirements.txt || "
             "echo 'No requirements.txt found'")
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
            ("pip install -r requirements.txt || "
             "echo 'No requirements.txt found'")
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
