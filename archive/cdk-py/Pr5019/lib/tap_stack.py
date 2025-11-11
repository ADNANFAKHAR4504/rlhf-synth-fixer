"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

import os
from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy
from aws_cdk import aws_apigateway as apigateway
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_notifications as s3_notifications
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
    This stack creates a complete serverless setup with S3, Lambda, and API Gateway
    for CSV file processing based on the PROMPT requirements.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.
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
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Configuration - IP addresses allowed to access the API
        ALLOWED_IP_ADDRESSES = [
            "192.168.1.0/24",  # Example IP range - Replace with your actual IPs
            "10.0.0.0/8"       # Example IP range
        ]

        # Create S3 bucket with versioning enabled for CSV storage
        csv_bucket = s3.Bucket(
            self,
            "CsvStorageBucket",
            bucket_name=f"csv-processor-{self.account}-{self.region}-{environment_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,  # Use RETAIN for production
            auto_delete_objects=False,  # Disable for production
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        # Create CloudWatch log group for Lambda with 7-day retention
        lambda_log_group = logs.LogGroup(
            self,
            "CsvProcessorLogGroup",
            log_group_name=f"/aws/lambda/csv-processor-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self,
            "CsvProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for CSV processor Lambda function with least privilege"
        )

        # Add CloudWatch Logs permissions
        lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        )

        # Add S3 read permissions for the specific bucket only
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                ],
                resources=[
                    csv_bucket.bucket_arn,
                    f"{csv_bucket.bucket_arn}/*"
                ]
            )
        )

        # Lambda function code (inline as per MODEL_RESPONSE)
        lambda_code = '''
import json
import csv
import os
import logging
import boto3
from typing import Dict, Any, List, Optional
from io import StringIO
import traceback
from datetime import datetime
# Configure logging
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))
# Initialize AWS clients
s3_client = boto3.client('s3')
# Configuration from environment variables
BUCKET_NAME = os.environ.get('BUCKET_NAME', '')
MAX_CSV_SIZE_MB = int(os.environ.get('MAX_CSV_SIZE_MB', '100'))
PROCESSING_MODE = os.environ.get('PROCESSING_MODE', 'STANDARD')
class CsvProcessingError(Exception):
    """Custom exception for CSV processing errors"""
    pass
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler function for processing CSV files.
    
    Args:
        event: Event data from S3 or API Gateway
        context: Lambda context object
        
    Returns:
        Response dict with status and details
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Processing started at {start_time}")
        logger.info(f"Event: {json.dumps(event, default=str)}")
        
        # Determine event source
        if 'Records' in event and event['Records']:
            # S3 event
            return handle_s3_event(event)
        elif 'httpMethod' in event:
            # API Gateway event
            return handle_api_event(event)
        else:
            raise ValueError("Unknown event source")
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'processing_time': str(datetime.now() - start_time)
            })
        }
    finally:
        processing_time = datetime.now() - start_time
        logger.info(f"Processing completed in {processing_time}")
def handle_s3_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle S3 bucket event for CSV file uploads.
    
    Args:
        event: S3 event data
        
    Returns:
        Response dict with processing results
    """
    results = []
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']
        
        logger.info(f"Processing S3 object: {bucket}/{key} (size: {size} bytes)")
        
        try:
            # Check file size
            if size > MAX_CSV_SIZE_MB * 1024 * 1024:
                raise CsvProcessingError(f"File size {size} exceeds maximum of {MAX_CSV_SIZE_MB}MB")
            
            # Process the CSV file
            result = process_csv_from_s3(bucket, key)
            results.append({
                'bucket': bucket,
                'key': key,
                'status': 'success',
                'details': result
            })
            
        except CsvProcessingError as e:
            logger.error(f"CSV processing error for {key}: {str(e)}")
            results.append({
                'bucket': bucket,
                'key': key,
                'status': 'error',
                'error': str(e)
            })
        except Exception as e:
            logger.error(f"Unexpected error processing {key}: {str(e)}")
            results.append({
                'bucket': bucket,
                'key': key,
                'status': 'error',
                'error': f"Unexpected error: {str(e)}"
            })
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'S3 event processed',
            'results': results
        })
    }
def handle_api_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle API Gateway event for manual triggering.
    
    Args:
        event: API Gateway event data
        
    Returns:
        Response dict with processing results
    """
    try:
        body = json.loads(event.get('body', '{}'))
        bucket = body.get('bucket', BUCKET_NAME)
        key = body.get('key')
        
        if not key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required parameter: key'
                })
            }
        
        logger.info(f"Manual processing requested for {bucket}/{key}")
        
        # Process the CSV file
        result = process_csv_from_s3(bucket, key)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'CSV processed successfully',
                'bucket': bucket,
                'key': key,
                'result': result
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }
    except CsvProcessingError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': str(e)
            })
        }
def process_csv_from_s3(bucket: str, key: str) -> Dict[str, Any]:
    """
    Download and process a CSV file from S3.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        Dict with processing results
    """
    try:
        # Download CSV from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse and analyze CSV
        analysis = analyze_csv(csv_content, key)
        
        logger.info(f"Successfully processed CSV: {key}")
        logger.info(f"Analysis: {json.dumps(analysis, default=str)}");
        
        return analysis
        
    except s3_client.exceptions.NoSuchKey:
        raise CsvProcessingError(f"File not found: {bucket}/{key}")
    except UnicodeDecodeError:
        raise CsvProcessingError(f"Unable to decode file as UTF-8: {key}")
    except Exception as e:
        raise CsvProcessingError(f"Error processing CSV: {str(e)}")
def analyze_csv(csv_content: str, filename: str) -> Dict[str, Any]:
    """
    Analyze CSV content and extract statistics.
    
    Args:
        csv_content: CSV file content as string
        filename: Original filename for reference
        
    Returns:
        Dict with CSV analysis results
    """
    try:
        csv_file = StringIO(csv_content)
        
        # Try to detect delimiter
        sample = csv_content[:1024]
        sniffer = csv.Sniffer()
        delimiter = sniffer.sniff(sample).delimiter
        
        csv_file.seek(0)
        reader = csv.DictReader(csv_file, delimiter=delimiter)
        
        rows = list(reader)
        
        if not rows:
            raise CsvProcessingError("CSV file is empty or has no data rows")
        
        # Gather statistics
        stats = {
            'filename': filename,
            'row_count': len(rows),
            'column_count': len(reader.fieldnames) if reader.fieldnames else 0,
            'columns': reader.fieldnames if reader.fieldnames else [],
            'delimiter': delimiter,
            'processing_mode': PROCESSING_MODE,
            'sample_data': rows[:3] if len(rows) >= 3 else rows,  # First 3 rows as sample
        }
        
        # Additional analysis based on processing mode
        if PROCESSING_MODE == 'DETAILED':
            stats['column_stats'] = analyze_columns(rows, reader.fieldnames)
        
        return stats
        
    except csv.Error as e:
        raise CsvProcessingError(f"CSV parsing error: {str(e)}")
    except Exception as e:
        raise CsvProcessingError(f"Error analyzing CSV: {str(e)}")
def analyze_columns(rows: List[Dict], columns: Optional[List[str]]) -> Dict[str, Any]:
    """
    Perform detailed analysis on CSV columns.
    
    Args:
        rows: List of row dictionaries
        columns: List of column names
        
    Returns:
        Dict with column statistics
    """
    if not columns:
        return {}
    
    column_stats = {}
    
    for col in columns:
        values = [row.get(col, '') for row in rows]
        non_empty = [v for v in values if v]
        
        column_stats[col] = {
            'total_values': len(values),
            'non_empty_values': len(non_empty),
            'empty_values': len(values) - len(non_empty),
            'unique_values': len(set(non_empty)),
            'sample_values': list(set(non_empty))[:5]  # First 5 unique values
        }
    return column_stats
'''

        # Create Lambda function
        csv_processor_lambda = lambda_.Function(
            self,
            "CsvProcessorFunction",
            function_name=f"csv-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(lambda_code),
            role=lambda_role,
            timeout=Duration.minutes(3),  # 3 minutes as per PROMPT requirement
            memory_size=512,
            environment={
                "BUCKET_NAME": csv_bucket.bucket_name,
                "LOG_LEVEL": "INFO",
                "MAX_CSV_SIZE_MB": "100",
                "PROCESSING_MODE": "STANDARD"
            },
            log_group=lambda_log_group,
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            description="Lambda function for processing CSV files from S3"
        )

        # Add S3 event notification to trigger Lambda when CSV files are uploaded
        csv_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.LambdaDestination(csv_processor_lambda),
            s3.NotificationKeyFilter(suffix=".csv")
        )

        # Create API Gateway with IP whitelisting
        api = apigateway.RestApi(
            self,
            "CsvProcessorApi",
            rest_api_name=f"csv-processor-api-{environment_suffix}",
            description="API for manually triggering CSV processor with IP whitelisting",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_rate_limit=100,  # Requests per second
                throttling_burst_limit=200,
                tracing_enabled=True  # Enable X-Ray tracing
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL],
            cloud_watch_role=True  # Automatically create CloudWatch role
        )

        # Create resource policy for IP whitelisting
        api_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["execute-api:Invoke"],
                    resources=["execute-api:/*"],
                    conditions={
                        "IpAddress": {
                            "aws:SourceIp": ALLOWED_IP_ADDRESSES
                        }
                    }
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=["execute-api:Invoke"],
                    resources=["execute-api:/*"],
                    conditions={
                        "NotIpAddress": {
                            "aws:SourceIp": ALLOWED_IP_ADDRESSES
                        }
                    }
                )
            ]
        )

        # Apply the resource policy to the API
        api_cfn = api.node.default_child
        api_cfn.policy = api_policy

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            csv_processor_lambda,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": "$input.json('$')"
                    }
                )
            ]
        )

        # Add /process resource for manual CSV processing
        process_resource = api.root.add_resource("process")
        process_method = process_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                ),
                apigateway.MethodResponse(status_code="400"),
                apigateway.MethodResponse(status_code="500")
            ]
        )

        # Store important attributes for access by other constructs
        self.csv_bucket = csv_bucket
        self.csv_processor_lambda = csv_processor_lambda
        self.api = api
        self.environment_suffix = environment_suffix

        # CloudFormation Outputs
        CfnOutput(
            self,
            "BucketName",
            value=csv_bucket.bucket_name,
            description="Name of the S3 bucket for CSV uploads"
        )

        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL for manual CSV processing"
        )

        CfnOutput(
            self,
            "ProcessEndpoint",
            value=f"{api.url}process",
            description="Full API endpoint URL for POST requests"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=csv_processor_lambda.function_name,
            description="Name of the Lambda function for CSV processing"
        )

        CfnOutput(
            self,
            "Environment",
            value=environment_suffix,
            description="Environment suffix used for resource naming"
        )