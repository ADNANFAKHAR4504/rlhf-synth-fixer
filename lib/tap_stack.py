"""tap_stack.py
This module defines the TapStack class, which implements a serverless web backend 
architecture using AWS CDK with Python.

The stack includes:
- Lambda Function (Python 3.8)
- API Gateway HTTP API with CORS
- S3 Bucket with static website hosting via CloudFront
- CloudFront distribution with Origin Access Control
- DynamoDB Table with GSI
- CloudWatch monitoring and alarms
- KMS encryption for S3 and DynamoDB

Note: This stack orchestrates the instantiation of separate nested stacks for each resource type.
Do NOT create AWS resources directly in this stack. Instead, instantiate separate stacks 
for each resource type within this stack.
"""
from typing import Optional

from aws_cdk import CfnOutput, Stack, StackProps
from constructs import Construct

from lib.nested_stacks import (
  NestedApiGatewayStack,
  NestedDynamoDBStack,
  NestedLambdaStack,
  NestedMonitoringStack,
  NestedS3CloudFrontStack,
)
from lib.stacks.api_gateway_stack import ApiGatewayStackProps
from lib.stacks.dynamodb_stack import DynamoDBStackProps
from lib.stacks.lambda_stack import LambdaStackProps
from lib.stacks.monitoring_stack import MonitoringStackProps
from lib.stacks.s3_cloudfront_stack import S3CloudFrontStackProps


class TapStackProps(StackProps):
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


class TapStack(Stack):
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
    # Store in a class variable if needed elsewhere in the stack
    self.environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create DynamoDB nested stack
    db_props = DynamoDBStackProps(
      environment_suffix=self.environment_suffix
    )

    dynamodb_stack = NestedDynamoDBStack(
      self,
      f"DynamoDBStack{self.environment_suffix}",
      props=db_props
    )

    # Make the table available as a property of this stack
    self.table = dynamodb_stack.table

    # Create S3 and CloudFront nested stack (combined to avoid circular dependencies)
    s3_cloudfront_props = S3CloudFrontStackProps(
      environment_suffix=self.environment_suffix
    )

    s3_cloudfront_stack = NestedS3CloudFrontStack(
      self,
      f"S3CloudFrontStack{self.environment_suffix}",
      props=s3_cloudfront_props
    )

    # Make the bucket and distribution available as properties of this stack
    self.bucket = s3_cloudfront_stack.bucket
    self.distribution = s3_cloudfront_stack.distribution

    # Create Lambda nested stack
    lambda_props = LambdaStackProps(
      table_name=self.table.table_name,
      environment_suffix=self.environment_suffix
    )

    lambda_stack = NestedLambdaStack(
      self,
      f"LambdaStack{self.environment_suffix}",
      props=lambda_props
    )

    # Make the Lambda function available as a property of this stack
    self.lambda_function = lambda_stack.lambda_function

    # Grant least-privilege permissions to Lambda
    self.table.grant_write_data(self.lambda_function)

    # Create API Gateway nested stack
    api_props = ApiGatewayStackProps(
      lambda_function=self.lambda_function,
      environment_suffix=self.environment_suffix
    )

    api_stack = NestedApiGatewayStack(
      self,
      f"ApiGatewayStack{self.environment_suffix}",
      props=api_props
    )

    # Make the HTTP API available as a property of this stack
    self.http_api = api_stack.http_api


    # Create Monitoring nested stack
    monitoring_props = MonitoringStackProps(
      lambda_function=self.lambda_function,
      http_api=self.http_api,
      environment_suffix=self.environment_suffix
    )

    NestedMonitoringStack(
      self,
      f"MonitoringStack{self.environment_suffix}",
      props=monitoring_props
    )

    # CloudFormation Outputs
    CfnOutput(
      self,
      "ApiEndpoint",
      value=self.http_api.url or "API URL not available",
      description="API Gateway endpoint URL"
    )

    CfnOutput(
      self,
      "WebsiteURL",
      value=f"https://{self.distribution.distribution_domain_name}",
      description="URL of the static website via CloudFront distribution"
    )

    CfnOutput(
      self,
      "CloudFrontDistributionId",
      value=self.distribution.distribution_id,
      description="CloudFront Distribution ID"
    )

    CfnOutput(
      self,
      "CloudFrontDistributionDomain",
      value=self.distribution.distribution_domain_name,
      description="CloudFront Distribution Domain Name"
    )

    CfnOutput(
      self,
      "FrontendBucketName",
      value=self.bucket.bucket_name,
      description="Name of the S3 bucket for frontend hosting"
    )

    CfnOutput(
      self,
      "VisitsTableName",
      value=self.table.table_name,
      description="Name of the DynamoDB table for visit logs"
    )

    CfnOutput(
      self,
      "LambdaFunctionName",
      value=self.lambda_function.function_name,
      description="Name of the Lambda function"
    )

    CfnOutput(
      self,
      "StackName",
      value=self.stack_name,
      description="Name of the CloudFormation stack"
    )
