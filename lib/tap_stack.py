"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the static website with Lambda backend project.
It provisions S3 bucket for static hosting and Lambda function for dynamic content.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
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


class TapStack(Stack):
  """
  Represents the main CDK stack for the static website with Lambda backend.

  This stack provisions:
  - S3 bucket for static website hosting
  - Lambda function for dynamic content
  - IAM roles with least privilege access
  - Static content deployment

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the 
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
      website_bucket (s3.Bucket): The S3 bucket used for static website hosting.
      lambda_function (_lambda.Function): The Lambda function for dynamic content.
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use default
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create S3 bucket for static website hosting
    self.website_bucket = s3.Bucket(
        self,
        "WebsiteBucket",
        bucket_name=f"static-website-{self.environment_suffix}-{self.account}",
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
        website_index_document="index.html",
        website_error_document="error.html",
        public_read_access=True,
        block_public_access=s3.BlockPublicAccess(
            block_public_acls=False,
            block_public_policy=False,
            ignore_public_acls=False,
            restrict_public_buckets=False,
        ),
    )

    # Create IAM role for Lambda function with least privilege
    lambda_role = iam.Role(
        self,
        "LambdaExecutionRole",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ],
        inline_policies={
            "S3AccessPolicy": iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket",
                        ],
                        resources=[
                            self.website_bucket.bucket_arn,
                            f"{self.website_bucket.bucket_arn}/*",
                        ],
                    )
                ]
            )
        },
    )

    # Create Lambda function for dynamic content
    self.lambda_function = _lambda.Function(
        self,
        "DynamicContentFunction",
        runtime=_lambda.Runtime.PYTHON_3_9,
        handler="lambda_function.lambda_handler",
        code=_lambda.Code.from_inline(self._get_lambda_code()),
        role=lambda_role,
        timeout=Duration.seconds(30),
        memory_size=128,
        environment={
            "WEBSITE_BUCKET": self.website_bucket.bucket_name,
        },
    )

    # Deploy static content to S3 bucket
    s3_deployment.BucketDeployment(
        self,
        "WebsiteDeployment",
        sources=[s3_deployment.Source.asset("lib/static_content")],
        destination_bucket=self.website_bucket,
        destination_key_prefix="",
    )

    # Output the website URL and Lambda function ARN
    CfnOutput(
        self,
        "WebsiteURL",
        value=self.website_bucket.bucket_website_url,
        description="URL of the static website",
    )

    CfnOutput(
        self,
        "LambdaFunctionARN",
        value=self.lambda_function.function_arn,
        description="ARN of the Lambda function",
    )

    CfnOutput(
        self,
        "LambdaFunctionName",
        value=self.lambda_function.function_name,
        description="Name of the Lambda function",
    )

    CfnOutput(
        self,
        "S3BucketName",
        value=self.website_bucket.bucket_name,
        description="Name of the S3 bucket",
    )

  def _get_lambda_code(self) -> str:
    """
    Returns the Lambda function source code as a string.
    """
    return '''
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Lambda function handler for dynamic content requests.
    Returns a JSON response with current timestamp and request information.
    """
    try:
        # Get the website bucket name from environment variables
        website_bucket = os.environ.get('WEBSITE_BUCKET')
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Prepare response data
        response_data = {
            "message": "Hello from Lambda!",
            "timestamp": current_time,
            "request_id": context.aws_request_id,
            "function_name": context.function_name,
            "website_bucket": website_bucket,
            "event": event
        }
        
        # Return successful response
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
            },
            "body": json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        # Return error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": str(e),
                "message": "Internal server error"
            }, indent=2)
        }
'''
