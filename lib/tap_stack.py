"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional
import json
from datetime import datetime
import base64

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
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

        # Configuration
        config = pulumi.Config()
        environment = config.get("environment") or self.environment_suffix or "production"
        retention_days = 2555  # 7 years for financial compliance

        # Tags for all resources
        default_tags = {
            "Environment": environment,
            "Project": "financial-etl-pipeline",
            "Compliance": "PCI-DSS",
            "DataClassification": "Confidential",
            "ManagedBy": "Pulumi"
        }
        if self.tags:
            default_tags.update(self.tags)

        # ============================================================================
        # S3 Buckets for Data Storage
        # ============================================================================

        # Bucket for raw transaction data
        raw_data_bucket = aws.s3.Bucket(
            "raw-transactions-bucket",
            bucket=f"financial-raw-transactions-{environment}-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="archive-old-data",
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        ),
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=365,
                            storage_class="DEEP_ARCHIVE"
                        )
                    ]
                )
            ],
            tags={**default_tags, "DataType": "Raw"},
            opts=ResourceOptions(parent=self)
        )

        # Bucket for processed transaction data
        processed_data_bucket = aws.s3.Bucket(
            "processed-transactions-bucket",
            bucket=f"financial-processed-transactions-{environment}-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={**default_tags, "DataType": "Processed"},
            opts=ResourceOptions(parent=self)
        )

        # Block public access for both buckets
        for bucket in [raw_data_bucket, processed_data_bucket]:
            aws.s3.BucketPublicAccessBlock(
                f"{bucket._name}-public-access-block",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(parent=self)
            )

        # ============================================================================
        # DynamoDB Tables
        # ============================================================================

        # Transaction metadata table
        transaction_metadata_table = aws.dynamodb.Table(
            "transaction-metadata",
            name=f"transaction-metadata-{environment}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
                aws.dynamodb.TableAttributeArgs(name="status", type="S"),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
            tags={**default_tags, "Purpose": "TransactionMetadata"},
            opts=ResourceOptions(parent=self)
        )

        # Audit log table
        audit_log_table = aws.dynamodb.Table(
            "audit-log",
            name=f"etl-audit-log-{environment}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="audit_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="audit_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
            tags={**default_tags, "Purpose": "AuditLog"},
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # SNS Topics and SQS Queues for Error Handling
        # ============================================================================

        # Dead letter queue
        dlq = aws.sqs.Queue(
            "etl-dlq",
            name=f"etl-pipeline-dlq-{environment}",
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id="alias/aws/sqs",
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Main error queue
        error_queue = aws.sqs.Queue(
            "etl-error-queue",
            name=f"etl-pipeline-errors-{environment}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            redrive_policy=pulumi.Output.all(dlq.arn).apply(
                lambda args: json.dumps({
                    "deadLetterTargetArn": args[0],
                    "maxReceiveCount": 3
                })
            ),
            kms_master_key_id="alias/aws/sqs",
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS topic for alerts
        alert_topic = aws.sns.Topic(
            "etl-alerts",
            name=f"etl-pipeline-alerts-{environment}",
            kms_master_key_id="alias/aws/sns",
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Subscribe error queue to alert topic
        aws.sns.TopicSubscription(
            "alert-to-error-queue",
            topic=alert_topic.arn,
            protocol="sqs",
            endpoint=error_queue.arn,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # EventBridge Event Bus and Rules
        # ============================================================================

        # Custom event bus for ETL pipeline
        etl_event_bus = aws.cloudwatch.EventBus(
            "etl-event-bus",
            name=f"etl-pipeline-bus-{environment}",
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # Lambda Functions
        # ============================================================================

        # Shared Lambda execution role
        lambda_role = aws.iam.Role(
            "lambda-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic execution policy
        aws.iam.RolePolicyAttachment(
            "lambda-basic-execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Custom policy for Lambda functions
        lambda_policy = aws.iam.RolePolicy(
            "lambda-custom-policy",
            role=lambda_role.id,
            policy=pulumi.Output.all(
                raw_bucket_arn=raw_data_bucket.arn,
                processed_bucket_arn=processed_data_bucket.arn,
                metadata_table_arn=transaction_metadata_table.arn,
                audit_table_arn=audit_log_table.arn,
                error_queue_arn=error_queue.arn,
                alert_topic_arn=alert_topic.arn,
                event_bus_arn=etl_event_bus.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"{args['raw_bucket_arn']}/*",
                            f"{args['processed_bucket_arn']}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            args['metadata_table_arn'],
                            f"{args['metadata_table_arn']}/index/*",
                            args['audit_table_arn']
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage"
                        ],
                        "Resource": args['error_queue_arn']
                    },
                    {
                        "Effect": "Allow",
                        "Action": "sns:Publish",
                        "Resource": args['alert_topic_arn']
                    },
                    {
                        "Effect": "Allow",
                        "Action": "events:PutEvents",
                        "Resource": args['event_bus_arn']
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Lambda layer for common dependencies
        lambda_layer = aws.lambda_.LayerVersion(
            "etl-common-layer",
            layer_name=f"etl-common-{environment}",
            compatible_runtimes=["python3.9"],
            code=pulumi.AssetArchive({
                "python": pulumi.FileArchive("./lambda_layer")
            }),
            description="Common dependencies for ETL Lambda functions",
            opts=ResourceOptions(parent=self)
        )

        # Environment variables for Lambda functions
        lambda_env_vars = {
            "RAW_BUCKET": raw_data_bucket.bucket,
            "PROCESSED_BUCKET": processed_data_bucket.bucket,
            "METADATA_TABLE": transaction_metadata_table.name,
            "AUDIT_TABLE": audit_log_table.name,
            "ERROR_QUEUE_URL": error_queue.url,
            "ALERT_TOPIC_ARN": alert_topic.arn,
            "EVENT_BUS_NAME": etl_event_bus.name,
            "ENVIRONMENT": environment
        }

        # 1. Ingestion Lambda
        ingestion_lambda_code = """
import json
import boto3
import os
import uuid
from datetime import datetime
import hashlib

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')

def handler(event, context):
    try:
        # Parse incoming transaction
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id') or str(uuid.uuid4())
        
        # Add metadata
        timestamp = datetime.utcnow()
        body['ingestion_timestamp'] = timestamp.isoformat()
        body['transaction_id'] = transaction_id
        
        # Generate checksum for data integrity
        checksum = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
        body['checksum'] = checksum
        
        # Store raw data in S3
        s3_key = f"raw/{timestamp.strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=os.environ['RAW_BUCKET'],
            Key=s3_key,
            Body=json.dumps(body),
            ServerSideEncryption='AES256',
            Metadata={
                'transaction_id': transaction_id,
                'checksum': checksum
            }
        )
        
        # Store metadata in DynamoDB
        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        table.put_item(Item={
            'transaction_id': transaction_id,
            'timestamp': int(timestamp.timestamp()),
            'status': 'INGESTED',
            's3_key': s3_key,
            'checksum': checksum
        })
        
        # Publish event for next stage
        events.put_events(
            Entries=[{
                'Source': 'etl.pipeline',
                'DetailType': 'TransactionIngested',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    's3_key': s3_key,
                    'timestamp': timestamp.isoformat()
                }),
                'EventBusName': os.environ['EVENT_BUS_NAME']
            }]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'transaction_id': transaction_id,
                'status': 'accepted'
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        # Send to error queue
        boto3.client('sqs').send_message(
            QueueUrl=os.environ['ERROR_QUEUE_URL'],
            MessageBody=json.dumps({
                'error': str(e),
                'event': event,
                'stage': 'ingestion'
            })
        )
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal error'})}
"""

        ingestion_lambda = aws.lambda_.Function(
            "ingestion-lambda",
            name=f"etl-ingestion-{environment}",
            runtime="python3.9",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(ingestion_lambda_code)
            }),
            role=lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(variables=lambda_env_vars),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=10,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # 2. Validation Lambda
        validation_lambda_code = """
import json
import boto3
import os
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
sns = boto3.client('sns')

REQUIRED_FIELDS = ['amount', 'currency', 'account_id', 'transaction_type']
VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY']
VALID_TYPES = ['DEBIT', 'CREDIT', 'TRANSFER']

def handler(event, context):
    try:
        detail = event.get('detail')
        if isinstance(detail, str):
            detail = json.loads(detail)
        transaction_id = detail['transaction_id']
        s3_key = detail['s3_key']
        
        # Fetch data from S3
        response = s3.get_object(Bucket=os.environ['RAW_BUCKET'], Key=s3_key)
        data = json.loads(response['Body'].read())
        
        # Validation rules
        errors = []
        
        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        # Validate currency
        if data.get('currency') not in VALID_CURRENCIES:
            errors.append(f"Invalid currency: {data.get('currency')}")
        
        # Validate transaction type
        if data.get('transaction_type') not in VALID_TYPES:
            errors.append(f"Invalid transaction type: {data.get('transaction_type')}")
        
        # Validate amount
        try:
            amount = float(data.get('amount', 0))
            if amount <= 0:
                errors.append("Amount must be positive")
            if amount > 1000000:  # Fraud detection threshold
                errors.append("Amount exceeds maximum threshold")
                # Send alert for large transaction
                sns.publish(
                    TopicArn=os.environ['ALERT_TOPIC_ARN'],
                    Subject=f"Large Transaction Alert: {transaction_id}",
                    Message=json.dumps({
                        'transaction_id': transaction_id,
                        'amount': amount,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                )
        except (TypeError, ValueError):
            errors.append("Invalid amount format")
        
        # Update status in DynamoDB
        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        timestamp_value = detail.get('timestamp')
        if isinstance(timestamp_value, str):
            timestamp_value = int(datetime.fromisoformat(timestamp_value.replace('Z', '+00:00')).timestamp())
        else:
            timestamp_value = int(float(timestamp_value))
        
        if errors:
            # Validation failed
            table.update_item(
                Key={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp_value
                },
                UpdateExpression="SET #status = :status, validation_errors = :errors",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'VALIDATION_FAILED',
                    ':errors': errors
                }
            )
            
            # Send to error handling
            boto3.client('sqs').send_message(
                QueueUrl=os.environ['ERROR_QUEUE_URL'],
                MessageBody=json.dumps({
                    'transaction_id': transaction_id,
                    'errors': errors,
                    'stage': 'validation'
                })
            )
        else:
            # Validation passed
            table.update_item(
                Key={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp_value
                },
                UpdateExpression="SET #status = :status",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'VALIDATED'}
            )
            
            # Trigger next stage
            events.put_events(
                Entries=[{
                    'Source': 'etl.pipeline',
                    'DetailType': 'TransactionValidated',
                    'Detail': json.dumps({
                        'transaction_id': transaction_id,
                        's3_key': s3_key,
                        'timestamp': detail.get('timestamp')
                    }),
                    'EventBusName': os.environ['EVENT_BUS_NAME']
                }]
            )
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        boto3.client('sqs').send_message(
            QueueUrl=os.environ['ERROR_QUEUE_URL'],
            MessageBody=json.dumps({
                'error': str(e),
                'event': event,
                'stage': 'validation'
            })
        )
        raise
"""

        validation_lambda = aws.lambda_.Function(
            "validation-lambda",
            name=f"etl-validation-{environment}",
            runtime="python3.9",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(validation_lambda_code)
            }),
            role=lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(variables=lambda_env_vars),
            timeout=30,
            memory_size=256,
            reserved_concurrent_executions=5,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # 3. Transformation Lambda
        transformation_lambda_code = """
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')

def handler(event, context):
    try:
        detail = event.get('detail')
        if isinstance(detail, str):
            detail = json.loads(detail)
        transaction_id = detail['transaction_id']
        s3_key = detail['s3_key']
        
        # Fetch data from S3
        response = s3.get_object(Bucket=os.environ['RAW_BUCKET'], Key=s3_key)
        data = json.loads(response['Body'].read())
        
        # Apply transformations
        transformed = {
            'transaction_id': transaction_id,
            'amount_cents': int(float(data['amount']) * 100),  # Convert to cents
            'amount_decimal': str(Decimal(str(data['amount']))),
            'currency': data['currency'].upper(),
            'account_id': data['account_id'].strip(),
            'transaction_type': data['transaction_type'].upper(),
            'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
            'processing_timestamp': datetime.utcnow().isoformat(),
            'metadata': {
                'original_checksum': data.get('checksum'),
                'ingestion_timestamp': data.get('ingestion_timestamp'),
                'transformation_version': '1.0'
            }
        }
        
        # Add derived fields
        if transformed['transaction_type'] == 'DEBIT':
            transformed['amount_signed'] = -transformed['amount_cents']
        else:
            transformed['amount_signed'] = transformed['amount_cents']
        
        # Categorize transaction
        amount = float(data['amount'])
        if amount < 100:
            transformed['category'] = 'SMALL'
        elif amount < 10000:
            transformed['category'] = 'MEDIUM'
        else:
            transformed['category'] = 'LARGE'
        
        # Store transformed data
        processed_key = f"processed/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}_transformed.json"
        s3.put_object(
            Bucket=os.environ['PROCESSED_BUCKET'],
            Key=processed_key,
            Body=json.dumps(transformed),
            ServerSideEncryption='AES256'
        )
        
        # Update metadata
        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        timestamp_value = detail.get('timestamp')
        if isinstance(timestamp_value, str):
            timestamp_value = int(datetime.fromisoformat(timestamp_value.replace('Z', '+00:00')).timestamp())
        else:
            timestamp_value = int(float(timestamp_value))
        
        table.update_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp_value
            },
            UpdateExpression="SET #status = :status, processed_key = :key",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'TRANSFORMED',
                ':key': processed_key
            }
        )
        
        # Trigger next stage
        events.put_events(
            Entries=[{
                'Source': 'etl.pipeline',
                'DetailType': 'TransactionTransformed',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'raw_key': s3_key,
                    'processed_key': processed_key,
                    'timestamp': detail.get('timestamp')
                }),
                'EventBusName': os.environ['EVENT_BUS_NAME']
            }]
        )
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        boto3.client('sqs').send_message(
            QueueUrl=os.environ['ERROR_QUEUE_URL'],
            MessageBody=json.dumps({
                'error': str(e),
                'event': event,
                'stage': 'transformation'
            })
        )
        raise
"""

        transformation_lambda = aws.lambda_.Function(
            "transformation-lambda",
            name=f"etl-transformation-{environment}",
            runtime="python3.9",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(transformation_lambda_code)
            }),
            role=lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(variables=lambda_env_vars),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=5,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # 4. Enrichment Lambda
        enrichment_lambda_code = """
import json
import boto3
import os
from datetime import datetime
import hashlib

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')

def handler(event, context):
    try:
        detail = event.get('detail')
        if isinstance(detail, str):
            detail = json.loads(detail)
        transaction_id = detail['transaction_id']
        processed_key = detail['processed_key']
        
        # Fetch transformed data
        response = s3.get_object(Bucket=os.environ['PROCESSED_BUCKET'], Key=processed_key)
        data = json.loads(response['Body'].read())
        
        # Enrich with additional data
        enriched = data.copy()
        
        # Add risk score (simplified example)
        risk_score = 0
        if data['category'] == 'LARGE':
            risk_score += 30
        if data['transaction_type'] == 'TRANSFER':
            risk_score += 20
        
        enriched['risk_score'] = risk_score
        enriched['risk_level'] = 'HIGH' if risk_score > 50 else 'MEDIUM' if risk_score > 25 else 'LOW'
        
        # Add compliance flags
        enriched['compliance'] = {
            'pci_dss': True,
            'aml_check': risk_score < 75,
            'requires_review': risk_score > 50
        }
        
        # Generate final checksum
        enriched['final_checksum'] = hashlib.sha256(
            json.dumps(enriched, sort_keys=True).encode()
        ).hexdigest()
        
        # Store final enriched data
        final_key = f"final/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}_final.json"
        s3.put_object(
            Bucket=os.environ['PROCESSED_BUCKET'],
            Key=final_key,
            Body=json.dumps(enriched),
            ServerSideEncryption='AES256'
        )
        
        # Update metadata with completion
        table = dynamodb.Table(os.environ['METADATA_TABLE'])
        timestamp_value = detail.get('timestamp')
        if isinstance(timestamp_value, str):
            timestamp_value = int(datetime.fromisoformat(timestamp_value.replace('Z', '+00:00')).timestamp())
        else:
            timestamp_value = int(float(timestamp_value))
        
        table.update_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp_value
            },
            UpdateExpression="SET #status = :status, final_key = :key, risk_score = :risk",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':key': final_key,
                ':risk': risk_score
            }
        )
        
        # Log to audit table
        audit_table = dynamodb.Table(os.environ['AUDIT_TABLE'])
        audit_table.put_item(Item={
            'audit_id': f"{transaction_id}-complete",
            'timestamp': int(datetime.utcnow().timestamp()),
            'transaction_id': transaction_id,
            'event': 'PIPELINE_COMPLETED',
            'details': json.dumps({
                'risk_score': risk_score,
                'final_key': final_key,
                'checksum': enriched['final_checksum']
            })
        })
        
        # Send completion event
        events.put_events(
            Entries=[{
                'Source': 'etl.pipeline',
                'DetailType': 'TransactionCompleted',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'final_key': final_key,
                    'risk_score': risk_score,
                    'timestamp': datetime.utcnow().isoformat()
                }),
                'EventBusName': os.environ['EVENT_BUS_NAME']
            }]
        )
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        boto3.client('sqs').send_message(
            QueueUrl=os.environ['ERROR_QUEUE_URL'],
            MessageBody=json.dumps({
                'error': str(e),
                'event': event,
                'stage': 'enrichment'
            })
        )
        raise
"""

        enrichment_lambda = aws.lambda_.Function(
            "enrichment-lambda",
            name=f"etl-enrichment-{environment}",
            runtime="python3.9",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(enrichment_lambda_code)
            }),
            role=lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(variables=lambda_env_vars),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=5,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # 5. Error Handler Lambda
        error_handler_lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    try:
        for record in event['Records']:
            message = json.loads(record['body'])
            
            # Log error to audit table
            audit_table = dynamodb.Table(os.environ['AUDIT_TABLE'])
            audit_table.put_item(Item={
                'audit_id': f"error-{record['messageId']}",
                'timestamp': int(datetime.utcnow().timestamp()),
                'event': 'PIPELINE_ERROR',
                'details': json.dumps(message)
            })
            
            # Send alert for critical errors
            if message.get('stage') in ['validation', 'transformation']:
                sns.publish(
                    TopicArn=os.environ['ALERT_TOPIC_ARN'],
                    Subject=f"ETL Pipeline Error - {message.get('stage', 'unknown')}",
                    Message=json.dumps({
                        'error': message.get('error'),
                        'transaction_id': message.get('transaction_id'),
                        'stage': message.get('stage'),
                        'timestamp': datetime.utcnow().isoformat()
                    }, indent=2)
                )
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error handler failed: {str(e)}")
        raise
"""

        error_handler_lambda = aws.lambda_.Function(
            "error-handler-lambda",
            name=f"etl-error-handler-{environment}",
            runtime="python3.9",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(error_handler_lambda_code)
            }),
            role=lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(variables=lambda_env_vars),
            timeout=30,
            memory_size=256,
            reserved_concurrent_executions=2,
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure error handler to process SQS messages
        aws.lambda_.EventSourceMapping(
            "error-queue-trigger",
            event_source_arn=error_queue.arn,
            function_name=error_handler_lambda.name,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # API Gateway
        # ============================================================================

        # REST API for transaction ingestion
        api = aws.apigateway.RestApi(
            "transaction-api",
            name=f"transaction-ingestion-api-{environment}",
            description="API for ingesting financial transactions",
            endpoint_configuration={
                "types": ["REGIONAL"]
            },
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create /transactions resource
        transactions_resource = aws.apigateway.Resource(
            "transactions-resource",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions",
            opts=ResourceOptions(parent=self)
        )

        # Create POST method
        post_method = aws.apigateway.Method(
            "post-transaction",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration
        lambda_integration = aws.apigateway.Integration(
            "lambda-integration",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=ingestion_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            "api-lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function=ingestion_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API
        api_deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=api.id,
            stage_name=environment,
            opts=pulumi.ResourceOptions(depends_on=[post_method, lambda_integration], parent=self)
        )

        # Enable CloudWatch logging for API Gateway
        api_log_group = aws.cloudwatch.LogGroup(
            "api-log-group",
            name=f"/aws/apigateway/transaction-api-{environment}",
            retention_in_days=30,
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        api_stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=api.id,
            deployment=api_deployment.id,
            stage_name=environment,
            access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "caller": "$context.identity.caller",
                    "user": "$context.identity.user",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            xray_tracing_enabled=True,
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # EventBridge Rules
        # ============================================================================

        # Rule: Ingested -> Validation
        validation_rule = aws.cloudwatch.EventRule(
            "validation-rule",
            name=f"etl-validation-trigger-{environment}",
            event_bus_name=etl_event_bus.name,
            event_pattern=json.dumps({
                "source": ["etl.pipeline"],
                "detail-type": ["TransactionIngested"]
            }),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            "validation-target",
            rule=validation_rule.name,
            arn=validation_lambda.arn,
            event_bus_name=etl_event_bus.name,
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            "validation-eventbridge-permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=validation_lambda.name,
            principal="events.amazonaws.com",
            source_arn=validation_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Rule: Validated -> Transformation
        transformation_rule = aws.cloudwatch.EventRule(
            "transformation-rule",
            name=f"etl-transformation-trigger-{environment}",
            event_bus_name=etl_event_bus.name,
            event_pattern=json.dumps({
                "source": ["etl.pipeline"],
                "detail-type": ["TransactionValidated"]
            }),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            "transformation-target",
            rule=transformation_rule.name,
            arn=transformation_lambda.arn,
            event_bus_name=etl_event_bus.name,
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            "transformation-eventbridge-permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=transformation_lambda.name,
            principal="events.amazonaws.com",
            source_arn=transformation_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Rule: Transformed -> Enrichment
        enrichment_rule = aws.cloudwatch.EventRule(
            "enrichment-rule",
            name=f"etl-enrichment-trigger-{environment}",
            event_bus_name=etl_event_bus.name,
            event_pattern=json.dumps({
                "source": ["etl.pipeline"],
                "detail-type": ["TransactionTransformed"]
            }),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            "enrichment-target",
            rule=enrichment_rule.name,
            arn=enrichment_lambda.arn,
            event_bus_name=etl_event_bus.name,
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            "enrichment-eventbridge-permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=enrichment_lambda.name,
            principal="events.amazonaws.com",
            source_arn=enrichment_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # CloudWatch Alarms
        # ============================================================================

        # Lambda error rate alarm
        for lambda_func, func_name in [(ingestion_lambda, "ingestion"), 
                              (validation_lambda, "validation"),
                              (transformation_lambda, "transformation"),
                              (enrichment_lambda, "enrichment")]:
            aws.cloudwatch.MetricAlarm(
                f"{func_name}-error-alarm",
                name=f"etl-{func_name}-errors-{environment}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=60,
                statistic="Sum",
                threshold=5,
                alarm_description=f"Alert when {func_name} Lambda errors exceed threshold",
                alarm_actions=[alert_topic.arn],
                dimensions={"FunctionName": lambda_func.name},
                tags=default_tags,
                opts=ResourceOptions(parent=self)
            )

        # DLQ alarm
        aws.cloudwatch.MetricAlarm(
            "dlq-alarm",
            name=f"etl-dlq-messages-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when messages are in DLQ",
            alarm_actions=[alert_topic.arn],
            dimensions={"QueueName": dlq.name},
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # ============================================================================
        # Store instance variables for reference
        # ============================================================================
        
        self.raw_data_bucket = raw_data_bucket
        self.processed_data_bucket = processed_data_bucket
        self.transaction_metadata_table = transaction_metadata_table
        self.audit_log_table = audit_log_table
        self.error_queue = error_queue
        self.dlq = dlq
        self.alert_topic = alert_topic
        self.event_bus = etl_event_bus
        self.ingestion_lambda = ingestion_lambda
        self.validation_lambda = validation_lambda
        self.transformation_lambda = transformation_lambda
        self.enrichment_lambda = enrichment_lambda
        self.error_handler_lambda = error_handler_lambda
        self.api = api
        self.environment = environment

        # Register outputs
        self.register_outputs({
            "api_endpoint": pulumi.Output.concat(
                "https://", api.id, ".execute-api.", aws.config.region, ".amazonaws.com/", environment, "/transactions"
            ),
            "raw_data_bucket": raw_data_bucket.bucket,
            "processed_data_bucket": processed_data_bucket.bucket,
            "metadata_table": transaction_metadata_table.name,
            "audit_table": audit_log_table.name,
            "error_queue_url": error_queue.url,
            "dlq_url": dlq.url,
            "alert_topic_arn": alert_topic.arn,
            "event_bus_name": etl_event_bus.name,
            "lambda_functions": pulumi.Output.all(
                ingestion=ingestion_lambda.name,
                validation=validation_lambda.name,
                transformation=transformation_lambda.name,
                enrichment=enrichment_lambda.name,
                error_handler=error_handler_lambda.name
            ).apply(lambda funcs: funcs)
        })
