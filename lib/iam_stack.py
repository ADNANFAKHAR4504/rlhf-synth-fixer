"""iam_stack.py
This module defines the IAMStack class, which creates IAM roles and policies
for the CI/CD pipeline components including CodePipeline and CodeBuild.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_iam as iam
from constructs import Construct


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


class IAMStack(cdk.NestedStack):
  """
  IAMStack creates IAM roles and policies for CI/CD pipeline components.
  
  This stack creates:
  - CodePipeline service role
  - CodeBuild service role  
  - CloudFormation execution role for deployments
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    props (Optional[IAMStackProps]): Optional properties for configuring the stack
    **kwargs: Additional keyword arguments passed to the CDK NestedStack
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[IAMStackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)
    
    environment_suffix = props.environment_suffix if props else 'dev'
    
    # CodePipeline service role
    self.codepipeline_role = iam.Role(
      self,
      "CodePipelineRole",
      role_name=f"ciapp-{environment_suffix}-codepipeline-role",
      assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodePipelineFullAccess"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeBuildDeveloperAccess"),
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
    
    # CodeBuild service role
    self.codebuild_role = iam.Role(
      self,
      "CodeBuildRole", 
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
    
    # CloudFormation execution role for deployments
    self.cloudformation_role = iam.Role(
      self,
      "CloudFormationRole",
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
