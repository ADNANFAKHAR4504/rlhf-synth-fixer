from typing import Optional
import uuid

from aws_cdk import (
    Duration,
    Stack,
    StackProps,
    CfnOutput,
    Tags,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_kms as kms,
    aws_cloudwatch_actions as cw_actions
)
from constructs import Construct


class TapStackProps(StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.
    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base StackProps.
    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Represents the main CDK stack for the TAP project.
    This stack is responsible for orchestrating the instantiation of resources.
    It determines the environment suffix from the provided properties, CDK context, or defaults to 'dev'.
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
            **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Generate unique suffix for bucket name to ensure uniqueness
        unique_suffix = f"{self.environment_suffix}-{str(uuid.uuid4())[:8]}"

        # 1. Create SNS Topic with AWS-managed encryption
        self.error_notification_topic = sns.Topic(
            self, "ErrorNotificationTopic",
            display_name="TAP Error Notifications",
            topic_name=f"tap-errors-{unique_suffix}",
            master_key=kms.Alias.from_alias_name(
                self, "SNSKey", "alias/aws/sns"
            )  # AWS-managed CMK
        )

        # 2. Create IAM Role for Lambda with least privilege permissions
        self.lambda_execution_role = iam.Role(
            self, "TapLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"TapLambdaRole-{unique_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # 3. Create Lambda Function 
        self.tap_processor_function = _lambda.Function(
            self, "TapProcessorFunction",
            function_name=f"tap-processor-{unique_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="index.lambda_handler",
            code=_lambda.Code.from_inline(self._get_lambda_code()),
            timeout=Duration.seconds(15),  # Back to 15 seconds as per original spec
            role=self.lambda_execution_role,
            description="Processes files uploaded to S3 bucket"
        )

        # 4. Create S3 Bucket with unique name
        self.tap_storage_bucket = s3.Bucket(
            self, "TapStorageBucket",
            bucket_name=f"tap-storage-{unique_suffix}",
            versioned=False,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldFiles",
                    expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(1)
                )
            ]
        )

        # 5. Grant Lambda permission to read from S3 bucket (simplified)
        self.tap_storage_bucket.grant_read(self.tap_processor_function)

        # 6. Add explicit permission for S3 to invoke Lambda
        self.tap_processor_function.add_permission(
            "AllowS3Invoke",
            principal=iam.ServicePrincipal("s3.amazonaws.com"),
            source_arn=self.tap_storage_bucket.bucket_arn,
            action="lambda:InvokeFunction"
        )

        # 7. Configure S3 event notification (using standard CDK approach)
        notification_destination = s3n.LambdaDestination(self.tap_processor_function)
        
        # Add dependency to ensure Lambda permission is created first
        if hasattr(notification_destination, 'node'):
            permission_node = self.tap_processor_function.node.find_child("AllowS3Invoke")
            if permission_node:
                notification_destination.node.add_dependency(permission_node)
        
        # Add the notification
        self.tap_storage_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED_PUT,
            notification_destination
        )

        # 8. Create CloudWatch Alarm for Lambda errors
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            alarm_name=f"TAP-Lambda-Errors-{unique_suffix}",
            alarm_description="Triggers when Lambda function encounters errors",
            metric=self.tap_processor_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # 9. Connect CloudWatch Alarm to SNS Topic
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.error_notification_topic)
        )

        # 10. Tag all resources
        self._tag_all_resources()

        # 11. Create CloudFormation Outputs
        self._create_outputs(unique_suffix)

    def _get_lambda_code(self) -> str:
        """Returns the Lambda function code as a string."""
        return '''
import json
import boto3
import logging
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Processes files uploaded to S3 bucket.
    This function is triggered by S3 PUT events.
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        # Process each S3 record in the event
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            
            logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")
            
            # Initialize S3 client
            s3_client = boto3.client('s3')
            
            # Get object metadata
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            file_size = response['ContentLength']
            last_modified = response['LastModified']
            
            logger.info(f"File details - Size: {file_size} bytes, Last Modified: {last_modified}")
            
            # Simulate file processing logic
            if object_key.lower().endswith(('.txt', '.csv', '.json')):
                logger.info(f"Processing text-based file: {object_key}")
                # Add your file processing logic here
            elif object_key.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                logger.info(f"Processing image file: {object_key}")
                # Add your image processing logic here
            else:
                logger.info(f"Unsupported file type for: {object_key}")
            
            # Log successful processing
            logger.info(f"Successfully processed file: {object_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} files',
                'processedFiles': [
                    unquote_plus(record['s3']['object']['key']) 
                    for record in event['Records']
                ]
            })
        }
        
    except Exception as e:
        error_message = f"Error processing files: {str(e)}"
        logger.error(error_message, exc_info=True)
        
        # This will trigger the CloudWatch alarm
        raise Exception(error_message)
'''

    def _tag_all_resources(self):
        """Tags all resources with environment information."""
        Tags.of(self).add("Environment", self.environment_suffix.capitalize())
        Tags.of(self).add("Project", "TAP")
        Tags.of(self).add("ManagedBy", "CDK")

    def _create_outputs(self, unique_suffix: str):
        """Creates CloudFormation outputs for all created resources."""

        # S3 Bucket Output
        CfnOutput(
            self, "S3BucketName",
            value=self.tap_storage_bucket.bucket_name,
            description="Name of the S3 bucket for file storage",
            export_name=f"TAP-S3Bucket-{unique_suffix}"
        )

        # Lambda Function Output
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.tap_processor_function.function_arn,
            description="ARN of the file processing Lambda function",
            export_name=f"TAP-Lambda-{unique_suffix}"
        )

        # SNS Topic Output
        CfnOutput(
            self, "SNSTopicArn",
            value=self.error_notification_topic.topic_arn,
            description="ARN of the SNS topic for error notifications",
            export_name=f"TAP-SNS-{unique_suffix}"
        )

        # IAM Role Output
        CfnOutput(
            self, "LambdaExecutionRoleArn",
            value=self.lambda_execution_role.role_arn,
            description="ARN of the Lambda execution role",
            export_name=f"TAP-Role-{unique_suffix}"
        )

        # CloudWatch Dashboard URL (informational)
        CfnOutput(
            self, "MonitoringInfo",
            value=f"Check CloudWatch for monitoring: https://console.aws.amazon.com/cloudwatch/home?region={self.region}#alarmsV2:alarm/{self.tap_processor_function.function_name}",
            description="CloudWatch monitoring information"
        )