"""
tap_stack.py

This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project. It orchestrates the instantiation
of other resource-specific stacks and manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  Duration,
  RemovalPolicy,
  Tags,
  CfnOutput,
  aws_lambda as _lambda,
  aws_kms as kms,
  aws_iam as iam,
)
from constructs import Construct


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

  This stack creates secure infrastructure including KMS encryption and Lambda functions
  with encrypted environment variables. It determines the environment suffix from the 
  provided properties, CDK context, or defaults to 'dev'.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the stack.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,  # pylint: disable=unused-argument
      **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Determine environment suffix (for future use if needed)
    # environment_suffix = (
    #     props.environment_suffix if props else None
    # ) or self.node.try_get_context("environmentSuffix") or "dev"

    # Define the KMS Key for encrypting environment variables 
    self.encryption_key = kms.Key(
      self,
      "LambdaEnvVarsEncryptionKey",
      description="KMS key for encrypting Lambda environment variables",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY,
    )
    
    # Add alias for KMS key
    kms.Alias(
      self,
      "LambdaEncryptionKeyAlias",
      alias_name="alias/lambda-encryption-key",
      target_key=self.encryption_key
    )

    # Define the Lambda function
    self.lambda_function = _lambda.Function(
      self,
      "SecureLambdaFunction",
      runtime=_lambda.Runtime.PYTHON_3_8,
      handler="lambda_function.handler",
      code=_lambda.Code.from_asset("lib/lambda"),
      environment={
        "SECRET_KEY": "my-secret-value"
      },
      environment_encryption=self.encryption_key,
      timeout=Duration.seconds(10),
      function_name="SecureLambdaFunction",
    )

    # IAM policy for logging
    self.lambda_function.add_to_role_policy(
      iam.PolicyStatement(
        actions=[
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources=["arn:aws:logs:*:*:*"],
      )
    )

    # Apply tags
    Tags.of(self).add("Environment", "Production")
    Tags.of(self).add("Team", "DevOps")

    # Export stack outputs for integration tests
    CfnOutput(
        self,
        "LambdaFunctionArn",
        value=self.lambda_function.function_arn,
        description="ARN of the secure Lambda function"
    )

    CfnOutput(
        self,
        "KmsKeyId",
        value=self.encryption_key.key_id,
        description="ID of the KMS key used for Lambda environment encryption"
    )

    CfnOutput(
        self,
        "KmsKeyArn",
        value=self.encryption_key.key_arn,
        description="ARN of the KMS key used for Lambda environment encryption"
    )
