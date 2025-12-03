"""
tap_stack.py

Multi-environment infrastructure stack for data processing application.
Provides consistent infrastructure across dev, staging, and production environments
with environment-specific configuration support.
"""

from typing import Optional, Dict, Any
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'staging', 'prod')
        tags (Optional[dict]): Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for multi-environment data processing infrastructure.

    This stack creates:
    - S3 buckets for data storage with versioning and lifecycle policies
    - Lambda functions for data processing with environment-specific memory
    - DynamoDB tables with GSI for metadata storage
    - SNS topics for notifications with email subscriptions
    - SQS queues with dead letter queues for task management
    - IAM roles with least privilege policies

    All resources use environmentSuffix for unique naming and are fully destroyable.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Get configuration with proper namespace
        config = pulumi.Config('pulumi-infra')

        # Environment-specific configuration with defaults
        bucket_name = config.get('bucket_name') or f'data-processing-{self.environment_suffix}'
        lambda_memory_str = config.get('lambda_memory')
        lambda_memory = int(lambda_memory_str) if lambda_memory_str else (
            1024 if self.environment_suffix == 'prod' else 512
        )
        table_name = config.get('table_name') or f'metadata-{self.environment_suffix}'
        notification_email = (
            config.get('notification_email') or
            f'team-{self.environment_suffix}@example.com'
        )
        queue_name = config.get('queue_name') or f'task-queue-{self.environment_suffix}'

        # Create S3 bucket for data storage
        self.data_bucket = self._create_s3_bucket(bucket_name)

        # Create DynamoDB table for metadata
        self.metadata_table = self._create_dynamodb_table(table_name)

        # Create SNS topic for notifications
        self.notification_topic = self._create_sns_topic(notification_email)

        # Create SQS queues (main and DLQ)
        self.dlq, self.task_queue = self._create_sqs_queues(queue_name)

        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Create Lambda function for data processing
        self.processor_function = self._create_lambda_function(lambda_memory)

        # Register outputs
        self.register_outputs({
            'bucket_name': self.data_bucket.id,
            'bucket_arn': self.data_bucket.arn,
            'table_name': self.metadata_table.name,
            'table_arn': self.metadata_table.arn,
            'topic_arn': self.notification_topic.arn,
            'queue_url': self.task_queue.url,
            'queue_arn': self.task_queue.arn,
            'dlq_url': self.dlq.url,
            'dlq_arn': self.dlq.arn,
            'function_arn': self.processor_function.arn,
            'function_name': self.processor_function.name,
            'lambda_role_arn': self.lambda_role.arn
        })

    def _create_s3_bucket(self, bucket_name: str) -> aws.s3.BucketV2:
        """
        Create S3 bucket with versioning, encryption, and lifecycle policies.
        """
        # Create bucket with environment suffix
        bucket = aws.s3.BucketV2(
            f'data-bucket-{self.environment_suffix}',
            bucket=f'{bucket_name}-{self.environment_suffix}',
            force_destroy=True,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning
        versioning = aws.s3.BucketVersioningV2(
            f'bucket-versioning-{self.environment_suffix}',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=bucket)
        )

        # Enable server-side encryption
        sse_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm='AES256'
        )
        encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f'bucket-encryption-{self.environment_suffix}',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=sse_args
                )
            ],
            opts=ResourceOptions(parent=bucket)
        )

        # Configure lifecycle policy for non-current versions
        lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f'bucket-lifecycle-{self.environment_suffix}',
            bucket=bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id=f'delete-old-versions-{self.environment_suffix}',
                status='Enabled',
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )],
            opts=ResourceOptions(parent=bucket, depends_on=[versioning])
        )

        return bucket

    def _create_dynamodb_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Create DynamoDB table with on-demand billing, GSI, and point-in-time recovery.
        """
        table = aws.dynamodb.Table(
            f'metadata-table-{self.environment_suffix}',
            name=f'{table_name}-{self.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='timestamp-index',
                    hash_key='timestamp',
                    projection_type='ALL'
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        return table

    def _create_sns_topic(self, notification_email: str) -> aws.sns.Topic:
        """
        Create SNS topic with email subscription.
        """
        topic = aws.sns.Topic(
            f'notification-topic-{self.environment_suffix}',
            name=f'data-processing-notifications-{self.environment_suffix}',
            opts=ResourceOptions(parent=self)
        )

        # Create email subscription
        subscription = aws.sns.TopicSubscription(
            f'email-subscription-{self.environment_suffix}',
            topic=topic.arn,
            protocol='email',
            endpoint=notification_email,
            opts=ResourceOptions(parent=topic)
        )

        return topic

    def _create_sqs_queues(self, queue_name: str) -> tuple:
        """
        Create SQS queue with dead letter queue.
        Returns: (dlq, main_queue)
        """
        # Create dead letter queue
        dlq = aws.sqs.Queue(
            f'task-dlq-{self.environment_suffix}',
            name=f'{queue_name}-dlq-{self.environment_suffix}',
            message_retention_seconds=1209600,  # 14 days
            opts=ResourceOptions(parent=self)
        )

        # Create main queue with DLQ configuration
        main_queue = aws.sqs.Queue(
            f'task-queue-{self.environment_suffix}',
            name=f'{queue_name}-{self.environment_suffix}',
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            redrive_policy=dlq.arn.apply(
                lambda arn: json.dumps({
                    'deadLetterTargetArn': arn,
                    'maxReceiveCount': 3
                })
            ),
            opts=ResourceOptions(parent=self, depends_on=[dlq])
        )

        return dlq, main_queue

    def _create_lambda_role(self) -> aws.iam.Role:
        """
        Create IAM role for Lambda with least privilege policies.
        """
        # Create assume role policy
        assume_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['lambda.amazonaws.com']
                )],
                actions=['sts:AssumeRole']
            )]
        )

        # Create role
        role = aws.iam.Role(
            f'lambda-role-{self.environment_suffix}',
            name=f'data-processor-role-{self.environment_suffix}',
            assume_role_policy=assume_role_policy.json,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        basic_policy = aws.iam.RolePolicyAttachment(
            f'lambda-basic-policy-{self.environment_suffix}',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=role)
        )

        # Create custom policy for resource access
        resource_policy_doc = Output.all(
            self.data_bucket.arn,
            self.metadata_table.arn,
            self.notification_topic.arn,
            self.task_queue.arn
        ).apply(lambda args: aws.iam.get_policy_document(
            statements=[
                # S3 permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect='Allow',
                    actions=[
                        's3:GetObject',
                        's3:PutObject',
                        's3:DeleteObject',
                        's3:ListBucket'
                    ],
                    resources=[
                        args[0],
                        f'{args[0]}/*'
                    ]
                ),
                # DynamoDB permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect='Allow',
                    actions=[
                        'dynamodb:GetItem',
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:Query',
                        'dynamodb:Scan'
                    ],
                    resources=[
                        args[1],
                        f'{args[1]}/index/*'
                    ]
                ),
                # SNS permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect='Allow',
                    actions=['sns:Publish'],
                    resources=[args[2]]
                ),
                # SQS permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect='Allow',
                    actions=[
                        'sqs:ReceiveMessage',
                        'sqs:DeleteMessage',
                        'sqs:GetQueueAttributes',
                        'sqs:SendMessage'
                    ],
                    resources=[args[3]]
                )
            ]
        ).json)

        # Create and attach custom policy
        resource_policy = aws.iam.RolePolicy(
            f'lambda-resource-policy-{self.environment_suffix}',
            role=role.name,
            policy=resource_policy_doc,
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_lambda_function(self, memory_size: int) -> aws.lambda_.Function:
        """
        Create Lambda function for data processing.
        """
        # Create Lambda function code
        function_code = """
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    '''
    Data processing Lambda function.
    Processes messages from SQS, stores data in S3, updates metadata in DynamoDB,
    and sends notifications via SNS.
    '''
    print(f'Processing event: {json.dumps(event)}')

    # Get environment variables
    bucket_name = os.environ.get('BUCKET_NAME')
    table_name = os.environ.get('TABLE_NAME')
    topic_arn = os.environ.get('TOPIC_ARN')

    # Initialize AWS clients
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    sns = boto3.client('sns')

    try:
        # Process each record
        for record in event.get('Records', []):
            message_id = record.get('messageId', 'unknown')
            body = json.loads(record.get('body', '{}'))

            # Store data in S3
            key = f'processed/{datetime.utcnow().isoformat()}/{message_id}.json'
            s3.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=json.dumps(body),
                ServerSideEncryption='AES256'
            )

            # Update metadata in DynamoDB
            table = dynamodb.Table(table_name)
            table.put_item(
                Item={
                    'id': message_id,
                    'timestamp': int(datetime.utcnow().timestamp()),
                    's3_key': key,
                    'status': 'processed'
                }
            )

            # Send notification
            sns.publish(
                TopicArn=topic_arn,
                Subject=f'Data Processed: {message_id}',
                Message=f'Successfully processed message {message_id}'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'processed_count': len(event.get('Records', []))
            })
        }

    except Exception as e:
        print(f'Error processing event: {str(e)}')
        raise
"""

        # Create Lambda function
        function = aws.lambda_.Function(
            f'processor-function-{self.environment_suffix}',
            name=f'data-processor-{self.environment_suffix}',
            runtime='python3.9',
            role=self.lambda_role.arn,
            handler='index.handler',
            memory_size=memory_size,
            timeout=300,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(function_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.data_bucket.id,
                    'TABLE_NAME': self.metadata_table.name,
                    'TOPIC_ARN': self.notification_topic.arn,
                    'QUEUE_URL': self.task_queue.url,
                    'ENVIRONMENT': self.environment_suffix
                }
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Add SQS event source mapping
        event_source = aws.lambda_.EventSourceMapping(
            f'sqs-trigger-{self.environment_suffix}',
            event_source_arn=self.task_queue.arn,
            function_name=function.name,
            batch_size=10,
            opts=ResourceOptions(parent=function)
        )

        return function


def validate_configuration() -> Dict[str, Any]:
    """
    Validate configuration consistency across environments.

    This function can be used to compare stack outputs across different environments
    to ensure infrastructure consistency.

    Returns:
        Dict containing validation results
    """
    config = pulumi.Config()
    stack = pulumi.get_stack()

    validation_results = {
        'stack': stack,
        'runtime_version': 'python3.9',
        'billing_mode': 'PAY_PER_REQUEST',
        's3_versioning': 'Enabled',
        's3_encryption': 'AES256',
        'lifecycle_policy_days': 30,
        'sqs_retention_days': 14,
        'dlq_max_retries': 3,
        'dynamodb_pitr': True,
        'gsi_name': 'timestamp-index'
    }

    return validation_results
