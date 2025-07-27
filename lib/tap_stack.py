"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

# Import resource-specific stacks
from .iam_stack import IAMStack, IAMStackProps
from .s3_stack import S3Stack, S3StackProps  
from .codebuild_stack import CodeBuildStack, CodeBuildStackProps
from .codepipeline_stack import CodePipelineStack, CodePipelineStackProps


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
    iam_props = IAMStackProps(environment_suffix=environment_suffix)
    iam_stack = IAMStack(
      self,
      f"IAMStack{environment_suffix}",
      props=iam_props
    )
    
    # Create S3 stack for artifacts storage
    s3_props = S3StackProps(environment_suffix=environment_suffix)
    s3_stack = S3Stack(
      self,
      f"S3Stack{environment_suffix}",
      props=s3_props
    )
    
    # Create CodeBuild stack for build projects
    codebuild_props = CodeBuildStackProps(
      environment_suffix=environment_suffix,
      codebuild_role=iam_stack.codebuild_role,
      artifacts_bucket=s3_stack.artifacts_bucket
    )
    codebuild_stack = CodeBuildStack(
      self,
      f"CodeBuildStack{environment_suffix}",
      props=codebuild_props
    )
    
    # Create CodePipeline stack for CI/CD orchestration
    codepipeline_props = CodePipelineStackProps(
      environment_suffix=environment_suffix,
      codepipeline_role=iam_stack.codepipeline_role,
      artifacts_bucket=s3_stack.artifacts_bucket,
      build_project=codebuild_stack.build_project,
      deploy_staging_project=codebuild_stack.deploy_staging_project,
      deploy_production_project=codebuild_stack.deploy_production_project
    )
    codepipeline_stack = CodePipelineStack(
      self,
      f"CodePipelineStack{environment_suffix}",
      props=codepipeline_props
    )
    
    # Make key resources available as properties of this stack
    self.repository = codepipeline_stack.repository
    self.pipeline = codepipeline_stack.pipeline
    self.artifacts_bucket = s3_stack.artifacts_bucket
