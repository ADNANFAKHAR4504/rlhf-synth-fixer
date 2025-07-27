"""tap_stack.py
This module defines the TapStack class and resource-specific stacks, which create
a secure, auditable AWS cloud environment with S3, DynamoDB, Lambda, and CloudTrail resources.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
aws_s3 as s3,
aws_dynamodb as dynamodb,
aws_lambda as \_lambda,
aws_iam as iam,
aws_cloudtrail as cloudtrail,
aws_s3_notifications as s3n,
Duration,
RemovalPolicy,
NestedStack
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

class ResourceStackProps:
"""
ResourceStackProps defines the properties for resource-specific stacks.

    Args:
        environment_suffix (str): The environment suffix for resource naming.

    Attributes:
        environment_suffix (str): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix

class CloudTrailStack(NestedStack):
"""
CloudTrailStack creates CloudTrail resources for audit logging.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (ResourceStackProps): Properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        trail (cloudtrail.Trail): The CloudTrail for audit logging.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: ResourceStackProps,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create S3 bucket for CloudTrail logs
        cloudtrail_bucket = s3.Bucket(
            self, f"CloudTrailBucket{env_suffix}",
            bucket_name=f"proj-cloudtrail-{env_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Create CloudTrail
        self.trail = cloudtrail.Trail(
            self, f"CloudTrail{env_suffix}",
            trail_name=f"proj-trail-{env_suffix}",
            bucket=cloudtrail_bucket,
            is_multi_region_trail=True,
            enable_file_validation=True,
            include_global_service_events=True
        )

class DynamoDBStack(cdk.Stack):
"""
DynamoDBStack creates DynamoDB table with required configurations.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (ResourceStackProps): Properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        table (dynamodb.Table): The DynamoDB table.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: ResourceStackProps,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        self.table = dynamodb.Table(
            self, f"DynamoDBTable{env_suffix}",
            table_name=f"proj-table-{env_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            contributor_insights_enabled=True,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

class NestedDynamoDBStack(NestedStack):
"""
NestedDynamoDBStack creates a nested stack containing DynamoDB resources.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (ResourceStackProps): Properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the NestedStack.

    Attributes:
        table (dynamodb.Table): The DynamoDB table from the nested stack.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: ResourceStackProps,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Use the original DynamoDBStack logic here
        self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
        self.table = self.ddb_stack.table

class S3Stack(NestedStack):
"""
S3Stack creates S3 bucket with versioning and access logging.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (ResourceStackProps): Properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        bucket (s3.Bucket): The main S3 bucket.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: ResourceStackProps,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create access logging bucket first
        access_log_bucket = s3.Bucket(
            self, f"S3AccessLogBucket{env_suffix}",
            bucket_name=f"proj-access-logs-{env_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Create main S3 bucket
        self.bucket = s3.Bucket(
            self, f"S3Bucket{env_suffix}",
            bucket_name=f"proj-bucket-{env_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=access_log_bucket,
            server_access_logs_prefix="access-logs/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

class LambdaStack(NestedStack):
"""
LambdaStack creates Lambda function with least privilege IAM role.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (ResourceStackProps): Properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.
                  Must include 's3_bucket_arn', 's3_bucket_name',
                  'dynamodb_table_arn', and 'dynamodb_table_name' keys.

    Attributes:
        function (_lambda.Function): The Lambda function.
    """

    def __init__(self, scope, construct_id, props, **kwargs):
        # Extract required resource information from kwargs
        dynamodb_table_arn = kwargs.pop('dynamodb_table_arn')
        dynamodb_table_name = kwargs.pop('dynamodb_table_name')
        s3_bucket_name = kwargs.pop('s3_bucket_name', 'placeholder')

        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, f"LambdaRole{env_suffix}",
            role_name=f"proj-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for DynamoDB only (S3 permissions added later)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                resources=[dynamodb_table_arn]
            )
        )

        # Create Lambda function
        self.function = _lambda.Function(
            self, f"LambdaFunction{env_suffix}",
            function_name=f"proj-lambda-{env_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_handler.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role,
            timeout=Duration.minutes(5),
            environment={
                "TABLE_NAME": dynamodb_table_name,
                "BUCKET_NAME": s3_bucket_name or "placeholder"
            }
        )

        # Store the role for later modification
        self.role = lambda_role

class TapStack(cdk.Stack):
"""
Represents the main CDK stack for secure, auditable cloud infrastructure.

    This stack orchestrates the creation of separate resource stacks:
    - CloudTrail stack for audit logging
    - DynamoDB nested stack with encryption, point-in-time recovery, and insights
    - S3 stack with versioning, Lambda triggers, and access logging
    - Lambda stack with S3-triggered function and least privilege IAM role

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
        s3_bucket (s3.Bucket): The main S3 bucket for the application.
        dynamodb_table (dynamodb.Table): The main DynamoDB table.
        lambda_function (_lambda.Function): The S3-triggered Lambda function.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store environment suffix for reference
        self.environment_suffix = environment_suffix

        # Create resource stack properties
        resource_props = ResourceStackProps(environment_suffix=environment_suffix)

        # Create CloudTrail stack for audit logging first
        CloudTrailStack(
            self,
            f"CloudTrailStack{environment_suffix}",
            props=resource_props
        )

        # Create the DynamoDB stack as a nested stack
        dynamodb_stack = NestedDynamoDBStack(
            self,
            f"DynamoDBStack{environment_suffix}",
            props=resource_props
        )

        # Make the table available as a property of this stack
        self.dynamodb_table = dynamodb_stack.table

        # Create S3 stack with versioning and access logging
        s3_stack = S3Stack(
            self,
            f"S3Stack{environment_suffix}",
            props=resource_props
        )

        # Make the bucket available as a property of this stack
        self.s3_bucket = s3_stack.bucket

        # Create Lambda stack with least privilege IAM role (S3 permissions added later)
        lambda_stack = LambdaStack(
            self,
            f"LambdaStack{environment_suffix}",
            props=resource_props,
            dynamodb_table_arn=self.dynamodb_table.table_arn,
            dynamodb_table_name=self.dynamodb_table.table_name
        )

        # Make the function available as a property of this stack
        self.lambda_function = lambda_stack.function

        # Add S3 permissions to Lambda role (after both stacks are created)
        self._add_s3_permissions_to_lambda(lambda_stack)

        # Update Lambda environment variable with actual bucket name
        self._update_lambda_environment()

        # Set up S3 trigger for Lambda (done after both stacks are created)
        self._setup_s3_trigger()

        # Create outputs for integration tests
        self._create_outputs(environment_suffix)


    def _add_s3_permissions_to_lambda(self, lambda_stack):
        """Add S3 permissions to Lambda role after both stacks are created."""
        lambda_stack.role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )

    def _update_lambda_environment(self):
        """Update Lambda environment variable with actual bucket name."""
        # Update the Lambda function environment variable
        self.lambda_function.add_environment("BUCKET_NAME", self.s3_bucket.bucket_name)

    def _setup_s3_trigger(self):
        """Set up S3 bucket to trigger Lambda on object creation."""
        self.s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.lambda_function)
        )

    def _create_outputs(self, env_suffix: str):
        """Create stack outputs for integration tests."""
        # S3 Bucket outputs
        cdk.CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the main S3 bucket",
            export_name=f"TapStack{env_suffix}-S3BucketName"
        )

        cdk.CfnOutput(
            self, "S3BucketArn",
            value=self.s3_bucket.bucket_arn,
            description="ARN of the main S3 bucket",
            export_name=f"TapStack{env_suffix}-S3BucketArn"
        )

        # DynamoDB Table outputs
        cdk.CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table",
            export_name=f"TapStack{env_suffix}-DynamoDBTableName"
        )

        cdk.CfnOutput(
            self, "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="ARN of the DynamoDB table",
            export_name=f"TapStack{env_suffix}-DynamoDBTableArn"
        )

        # Lambda Function outputs
        cdk.CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Name of the Lambda function",
            export_name=f"TapStack{env_suffix}-LambdaFunctionName"
        )

        cdk.CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="ARN of the Lambda function",
            export_name=f"TapStack{env_suffix}-LambdaFunctionArn"
        )

        # IAM Role outputs
        cdk.CfnOutput(
            self, "LambdaRoleArn",
            value=self.lambda_function.role.role_arn,
            description="ARN of the Lambda execution role",
            export_name=f"TapStack{env_suffix}-LambdaRoleArn"
        )

"""
Lambda function handler for processing S3 object creation events.

This Lambda function is triggered when objects are created in the S3 bucket.
It processes the event information and stores metadata in DynamoDB with
proper error handling and logging.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

# Configure logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients

dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')

# Get environment variables

TABLE_NAME = os.environ.get('TABLE_NAME')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
"""
Process S3 object creation events and store metadata in DynamoDB.

    Args:
        event: AWS Lambda event containing S3 event information
        context: AWS Lambda context object

    Returns:
        Dict containing the response status and processed record count
    """
    logger.info(f"Processing event: {json.dumps(event)}")

    if not TABLE_NAME:
        logger.error("TABLE_NAME environment variable is not set")
        raise ValueError("TABLE_NAME environment variable is required")

    processed_records = 0
    errors = []

    try:
        # Process each record in the S3 event
        for record in event.get('Records', []):
            try:
                processed_records += process_s3_record(record)
            except Exception as e:
                error_msg = f"Error processing record: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        # Log summary
        logger.info(f"Successfully processed {processed_records} records")
        if errors:
            logger.warning(f"Encountered {len(errors)} errors: {errors}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} records',
                'processed_count': processed_records,
                'error_count': len(errors),
                'errors': errors if errors else None
            })
        }

    except Exception as e:
        logger.error(f"Fatal error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Fatal error: {str(e)}',
                'processed_count': processed_records
            })
        }

def process_s3_record(record: Dict[str, Any]) -> int:
"""
Process a single S3 record and store metadata in DynamoDB.

    Args:
        record: Single S3 event record

    Returns:
        int: 1 if processed successfully, 0 otherwise
    """
    try:
        # Extract S3 event information
        s3_info = record['s3']
        bucket_name = s3_info['bucket']['name']
        object_key = unquote_plus(s3_info['object']['key'])
        object_size = s3_info['object']['size']
        etag = s3_info['object']['eTag']

        # Get additional object metadata from S3
        object_metadata = get_s3_object_metadata(bucket_name, object_key)

        # Create DynamoDB item
        timestamp = datetime.now(timezone.utc).isoformat()
        item = {
            'pk': {'S': f'OBJECT#{object_key}'},
            'sk': {'S': f'CREATED#{timestamp}'},
            'bucket_name': {'S': bucket_name},
            'object_key': {'S': object_key},
            'object_size': {'N': str(object_size)},
            'etag': {'S': etag},
            'created_at': {'S': timestamp},
            'event_source': {'S': record['eventSource']},
            'event_name': {'S': record['eventName']},
            'event_time': {'S': record['eventTime']},
            'aws_region': {'S': record['awsRegion']}
        }

        # Add content type if available
        if object_metadata and 'ContentType' in object_metadata:
            item['content_type'] = {'S': object_metadata['ContentType']}

        # Add last modified if available
        if object_metadata and 'LastModified' in object_metadata:
            item['last_modified'] = {'S': object_metadata['LastModified'].isoformat()}

        # Store in DynamoDB
        store_in_dynamodb(item)

        logger.info(f"Successfully processed S3 object: {bucket_name}/{object_key}")
        return 1

    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        raise

def get_s3_object_metadata(bucket_name: str, object_key: str) -> Dict[str, Any]:
"""
Get additional metadata for an S3 object.

    Args:
        bucket_name: Name of the S3 bucket
        object_key: Key of the S3 object

    Returns:
        Dict containing object metadata, or empty dict if error
    """
    try:
        response = s3.head_object(Bucket=bucket_name, Key=object_key)
        return response
    except ClientError as e:
        logger.warning(f"Could not get metadata for {bucket_name}/{object_key}: {str(e)}")
        return {}

def store_in_dynamodb(item: Dict[str, Any]) -> None:
"""
Store an item in DynamoDB.

    Args:
        item: DynamoDB item to store

    Raises:
        Exception: If DynamoDB operation fails
    """
    try:
        response = dynamodb.put_item(
            TableName=TABLE_NAME,
            Item=item,
            # Use condition to prevent overwriting existing items
            ConditionExpression='attribute_not_exists(pk)'
        )
        logger.debug(f"DynamoDB put_item response: {response}")

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Item already exists in DynamoDB: {item['pk']['S']}")
        else:
            logger.error(f"DynamoDB error: {e.response['Error']}")
            raise
    except Exception as e:
        logger.error(f"Unexpected error storing item in DynamoDB: {str(e)}")
        raise
