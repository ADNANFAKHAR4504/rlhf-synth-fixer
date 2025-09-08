```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a serverless infrastructure for processing files uploaded to S3.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_sqs as sqs,
    aws_logs as logs,
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
    Represents the main CDK stack for the TAP project with serverless file processing.

    This stack creates a serverless infrastructure that processes files uploaded to S3:
    - S3 bucket with versioning, encryption, and lifecycle policies
    - Lambda function that processes files and appends timestamps
    - SNS topic for email notifications
    - SQS Dead Letter Queue for error handling
    - IAM roles with least privilege permissions
    - CloudWatch logging with retention policies

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
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Define common tags for all resources
        common_tags = {
            'Project': 'ServerlessFileProcessor',
            'Environment': self.environment_suffix,
            'Owner': 'DataTeam',
            'CostCenter': 'Engineering',
            'Stack': 'TapStack'
        }

        # Apply tags to the stack
        for key, value in common_tags.items():
            Tags.of(self).add(key, value)

        # Create resources in correct dependency order
        self._create_s3_bucket()
        self._create_sqs_dlq()
        self._create_sns_topic()
        self._create_cloudwatch_logs()  # Create log group first
        self._create_lambda_role()
        self._create_lambda_function()
        self._configure_s3_notifications()
        self._create_outputs()

    def _create_s3_bucket(self):
        """Create S3 bucket with versioning, encryption, and lifecycle policies"""
        self.file_bucket = s3.Bucket(
            self, 
            f"FileProcessingBucket{self.environment_suffix}",
            # Remove explicit bucket_name to let CDK auto-generate unique names
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # Use DESTROY for testing
            
            # Lifecycle rules for cost optimization
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="GlacierTransition",
                    enabled=True,
                    # Transition to Glacier after 30 days
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30)
                        )
                    ],
                    # Clean up old versions after 90 days
                    noncurrent_version_expiration=Duration.days(90),
                    # Clean up incomplete multipart uploads
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

    def _create_sqs_dlq(self):
        """Create SQS Dead Letter Queue for error handling"""
        self.dlq = sqs.Queue(
            self,
            f"FileProcessingDLQ{self.environment_suffix}",
            queue_name=f"serverless-cf-dlq-{self.environment_suffix.lower()}",
            # Retain messages for 14 days
            retention_period=Duration.days(14),
            # Visibility timeout should be longer than Lambda timeout
            visibility_timeout=Duration.seconds(30),
            # Enable encryption
            encryption=sqs.QueueEncryption.KMS_MANAGED
        )

    def _create_sns_topic(self):
        """Create SNS topic for notifications"""
        self.notification_topic = sns.Topic(
            self,
            f"FileProcessingNotifications{self.environment_suffix}",
            topic_name=f"serverless-cf-notifications-{self.environment_suffix.lower()}",
            display_name=f"File Processing Notifications - {self.environment_suffix}"
        )

        # Only add email subscription if provided via context
        notification_email = 'veerasolaiyappan@gmail.com'
        if notification_email:
            self.notification_topic.add_subscription(
                sns_subs.EmailSubscription(notification_email)
            )
            print(f"📧 SNS email subscription added for: {notification_email}")
        else:
            print("⚠️  No notification email provided. Use --context notificationEmail=your@email.com to add subscription")

    def _create_cloudwatch_logs(self):
        """Create CloudWatch Log Group with retention policy - BEFORE Lambda function"""
        # Create log group with predictable name to avoid circular dependency
        log_group_name = f"/aws/lambda/serverless-cf-file-processor-{self.environment_suffix.lower()}"
        
        self.log_group = logs.LogGroup(
            self,
            f"FileProcessorLogGroup{self.environment_suffix}",
            log_group_name=log_group_name,
            retention=logs.RetentionDays.ONE_MONTH,  # Retain logs for 30 days
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_lambda_role(self):
        """Create IAM role for Lambda function with least privilege permissions"""
        self.lambda_role = iam.Role(
            self,
            f"FileProcessorLambdaRole{self.environment_suffix}",
            # Removed role_name to let CDK generate unique names
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Allow list operations on the bucket (bucket ARN only)
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:ListBucket"],
                resources=[self.file_bucket.bucket_arn]
            )
        )

        # Allow object-level operations on the bucket
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                resources=[f"{self.file_bucket.bucket_arn}/*"]
            )
        )

        # SNS publish (topic only)
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["sns:Publish"],
                resources=[self.notification_topic.topic_arn]
            )
        )

        # SQS DLQ access (if you need to explicitly send messages)
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes"
                ],
                resources=[self.dlq.queue_arn]
            )
        )

        # CloudWatch Logs permissions
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                # Limit to this account/region
                resources=[f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/*"]
            )
        )

    def _create_lambda_function(self):
        """Create Lambda function with inline code for file processing"""
        # Lambda function code with FIXED newline escaping
        lambda_code = """
import json
import boto3
import logging
from datetime import datetime
from urllib.parse import unquote_plus
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    '''
    Process S3 file upload events by appending timestamp and logging details
    '''
    try:
        # Extract environment variables
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        bucket_name = os.environ.get('BUCKET_NAME')
        
        logger.info(f"Processing {len(event['Records'])} records")
        
        # Process each record in the event
        for record in event['Records']:
            # Extract S3 bucket and object information
            event_bucket = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_time = record['eventTime']
            
            logger.info(f"Processing file: {object_key} in bucket: {event_bucket}")
            
            # Skip processed files to avoid infinite loops
            if object_key.startswith('processed/'):
                logger.info(f"Skipping already processed file: {object_key}")
                continue
            
            try:
                # Read the original file
                response = s3_client.get_object(Bucket=event_bucket, Key=object_key)
                
                # Handle different content types
                try:
                    original_content = response['Body'].read().decode('utf-8')
                except UnicodeDecodeError:
                    # Handle binary files
                    original_content = f"Binary file processed - Original size: {object_size} bytes"
                
                # Append timestamp to the content (FIXED escaping)
                timestamp = datetime.utcnow().isoformat()
                processed_content = f"{original_content}\\n\\n--- Processed on: {timestamp} ---\\nOriginal file: {object_key}\\nFile size: {object_size} bytes"
                
                # Create processed file key
                file_extension = object_key.split('.')[-1] if '.' in object_key else 'txt'
                base_filename = object_key.split('/')[-1].replace(f'.{file_extension}', '')
                processed_key = f"processed/{base_filename}_processed_{int(datetime.utcnow().timestamp())}.{file_extension}"
                
                # Upload processed file back to S3
                s3_client.put_object(
                    Bucket=event_bucket,
                    Key=processed_key,
                    Body=processed_content.encode('utf-8'),
                    ContentType='text/plain',
                    Metadata={
                        'original-file': object_key,
                        'processed-timestamp': timestamp,
                        'processor': 'serverless-file-processor'
                    }
                )
                
                # Log successful processing
                log_message = {
                    'action': 'file_processed',
                    'original_file': object_key,
                    'processed_file': processed_key,
                    'file_size': object_size,
                    'processing_time': timestamp,
                    'bucket': event_bucket
                }
                logger.info(f"File processed successfully: {json.dumps(log_message)}")
                
                # Send SNS notification
                if sns_topic_arn:
                    notification_message = f'''File processing completed successfully!

Original File: {object_key}
Processed File: {processed_key}
File Size: {object_size} bytes
Processing Time: {timestamp}
Bucket: {event_bucket}

The file has been processed and saved with timestamp appended.'''
                    
                    sns_client.publish(
                        TopicArn=sns_topic_arn,
                        Message=notification_message,
                        Subject=f'File Processing Successful - {object_key}'
                    )
                    
                    logger.info("SNS notification sent successfully")
                
            except Exception as file_error:
                logger.error(f"Error processing file {object_key}: {str(file_error)}")
                # Re-raise to trigger DLQ
                raise file_error
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Files processed successfully',
                'processed_files': len([r for r in event['Records'] if not r['s3']['object']['key'].startswith('processed/')])
            })
        }
        
    except Exception as e:
        logger.error(f"Lambda function error: {str(e)}")
        # Re-raise to trigger DLQ
        raise e
"""

        self.file_processor_lambda = _lambda.Function(
            self,
            f"FileProcessorFunction{self.environment_suffix}",
            function_name=f"serverless-cf-file-processor-{self.environment_suffix.lower()}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=self.lambda_role,
            timeout=Duration.seconds(30),  # Increased from 10s to 30s
            memory_size=512,               # Increased from 256MB to 512MB
            environment={
                "SNS_TOPIC_ARN": self.notification_topic.topic_arn,
                "BUCKET_NAME": self.file_bucket.bucket_name,
                "ENVIRONMENT": self.environment_suffix
            },
            # Configure Dead Letter Queue
            dead_letter_queue=self.dlq,
            # Configure retry attempts
            retry_attempts=2,
            # Enable X-Ray tracing for monitoring
            tracing=_lambda.Tracing.ACTIVE,
            # Use the pre-created log group
            log_group=self.log_group,
            description=f"Processes files uploaded to S3 bucket - {self.environment_suffix}"
        )

    def _configure_s3_notifications(self):
        """Configure S3 bucket notification to trigger Lambda"""
        # Trigger the Lambda for new objects under uploads/ prefix
        self.file_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.file_processor_lambda),
            s3.NotificationKeyFilter(prefix="uploads/")
        )

    def _create_outputs(self):
        """Create CloudFormation outputs for key resources"""
        CfnOutput(
            self,
            "BucketName",
            value=self.file_bucket.bucket_name,
            description="Name of the S3 bucket for file uploads",
            export_name=f"TapStack-{self.environment_suffix}-BucketName"
        )

        CfnOutput(
            self,
            "BucketArn",
            value=self.file_bucket.bucket_arn,
            description="ARN of the S3 bucket",
            export_name=f"TapStack-{self.environment_suffix}-BucketArn"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.file_processor_lambda.function_name,
            description="Name of the file processor Lambda function",
            export_name=f"TapStack-{self.environment_suffix}-LambdaFunctionName"
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.file_processor_lambda.function_arn,
            description="ARN of the file processor Lambda function",
            export_name=f"TapStack-{self.environment_suffix}-LambdaFunctionArn"
        )

        CfnOutput(
            self,
            "SNSTopicArn",
            value=self.notification_topic.topic_arn,
            description="ARN of the SNS topic for notifications",
            export_name=f"TapStack-{self.environment_suffix}-SNSTopicArn"
        )

        CfnOutput(
            self,
            "DLQUrl",
            value=self.dlq.queue_url,
            description="URL of the Dead Letter Queue",
            export_name=f"TapStack-{self.environment_suffix}-DLQUrl"
        )

        CfnOutput(
            self,
            "DLQArn",
            value=self.dlq.queue_arn,
            description="ARN of the Dead Letter Queue",
            export_name=f"TapStack-{self.environment_suffix}-DLQArn"
        )

        CfnOutput(
            self,
            "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"TapStack-{self.environment_suffix}-EnvironmentSuffix"
        )


```