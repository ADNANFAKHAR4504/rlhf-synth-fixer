"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import os

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    CfnOutput,
    Duration,
    RemovalPolicy
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





class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DataPipeline"
        }

        # Create DynamoDB table with on-demand capacity
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name=f"file-metadata-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            point_in_time_recovery=True
        )

        # Add tags to DynamoDB table
        for key, value in common_tags.items():
            metadata_table.node.add_metadata(key, value)

        # Create S3 bucket with versioning
        data_bucket = s3.Bucket(
            self, "DataBucket",
            bucket_name=None,  # Let AWS generate unique name
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            auto_delete_objects=True,  # For demo purposes
            event_bridge_enabled=False  # We'll use direct Lambda trigger
        )

        # Add tags to S3 bucket
        for key, value in common_tags.items():
            data_bucket.node.add_metadata(key, value)

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for S3 read access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{data_bucket.bucket_arn}/*"]
            )
        )

        # Add specific permissions for DynamoDB write access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                resources=[metadata_table.table_arn]
            )
        )

        # Create Lambda function
        processor_lambda = _lambda.Function(
            self, "FileProcessorLambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="process_file.lambda_handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda")
            ),
            role=lambda_role,
            timeout=Duration.seconds(15),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": metadata_table.table_name,
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn,
                "AWS_REGION": self.region
            }
        )

        # Add tags to Lambda function
        for key, value in common_tags.items():
            processor_lambda.node.add_metadata(key, value)

        # Add S3 trigger to Lambda
        data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(processor_lambda)
        )

        # Stack outputs
        CfnOutput(
            self, "S3BucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data uploads"
        )

        CfnOutput(
            self, "S3BucketURL",
            value=f"https://{data_bucket.bucket_name}.s3.amazonaws.com",
            description="URL of the S3 bucket"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=metadata_table.table_name,
            description="Name of the DynamoDB metadata table"
        )
