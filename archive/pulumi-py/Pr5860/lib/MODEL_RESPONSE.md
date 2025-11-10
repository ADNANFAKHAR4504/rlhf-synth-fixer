# Pulumi Python Implementation - Serverless Payment Processing

This implementation creates a complete serverless payment processing infrastructure with API Gateway, Lambda functions, DynamoDB tables, SQS FIFO queues, and comprehensive monitoring.

## File: __main__.py

```python
"""Main Pulumi program for serverless payment processing infrastructure."""
import pulumi
import pulumi_aws as aws
import json
import os

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()
region = config.get("region") or "us-east-2"

# Configure AWS provider
provider = aws.Provider("aws-provider", region=region)

# ========================================
# Dead Letter Queues (DLQ) for SQS
# ========================================

transaction_dlq = aws.sqs.Queue(
    f"transaction-dlq-{environment_suffix}",
    name=f"transaction-dlq-{environment_suffix}.fifo",
    fifo_queue=True,
    content_based_deduplication=True,
    message_retention_seconds=345600,  # 4 days
    opts=pulumi.ResourceOptions(provider=provider)
)

notification_dlq = aws.sqs.Queue(
    f"notification-dlq-{environment_suffix}",
    name=f"notification-dlq-{environment_suffix}.fifo",
    fifo_queue=True,
    content_based_deduplication=True,
    message_retention_seconds=345600,  # 4 days
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# SQS FIFO Queues
# ========================================

transaction_queue = aws.sqs.Queue(
    f"transaction-processing-{environment_suffix}",
    name=f"transaction-processing-{environment_suffix}.fifo",
    fifo_queue=True,
    content_based_deduplication=True,
    message_retention_seconds=345600,  # 4 days
    visibility_timeout_seconds=300,  # Match Lambda timeout
    redrive_policy=transaction_dlq.arn.apply(
        lambda arn: json.dumps({
            "deadLetterTargetArn": arn,
            "maxReceiveCount": 3
        })
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

notification_queue = aws.sqs.Queue(
    f"notifications-{environment_suffix}",
    name=f"notifications-{environment_suffix}.fifo",
    fifo_queue=True,
    content_based_deduplication=True,
    message_retention_seconds=345600,  # 4 days
    visibility_timeout_seconds=300,  # Match Lambda timeout
    redrive_policy=notification_dlq.arn.apply(
        lambda arn: json.dumps({
            "deadLetterTargetArn": arn,
            "maxReceiveCount": 3
        })
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# DynamoDB Tables
# ========================================

transactions_table = aws.dynamodb.Table(
    f"transactions-{environment_suffix}",
    name=f"transactions-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="transaction_id",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transaction_id",
            type="S"
        )
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

fraud_alerts_table = aws.dynamodb.Table(
    f"fraud-alerts-{environment_suffix}",
    name=f"fraud-alerts-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="alert_id",
    range_key="timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="alert_id",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="timestamp",
            type="N"
        )
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# SSM Parameters
# ========================================

webhook_url_parameter = aws.ssm.Parameter(
    f"webhook-url-{environment_suffix}",
    name=f"/payment-processing/{environment_suffix}/webhook-url",
    type="SecureString",
    value="https://example.com/webhook",  # Placeholder
    description="Webhook URL for fraud detection notifications",
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

api_key_parameter = aws.ssm.Parameter(
    f"api-key-{environment_suffix}",
    name=f"/payment-processing/{environment_suffix}/api-key",
    type="SecureString",
    value="placeholder-api-key-12345",  # Placeholder
    description="API key for external service authentication",
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# CloudWatch Log Groups
# ========================================

transaction_processor_log_group = aws.cloudwatch.LogGroup(
    f"transaction-processor-logs-{environment_suffix}",
    name=f"/aws/lambda/transaction-processor-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

fraud_handler_log_group = aws.cloudwatch.LogGroup(
    f"fraud-handler-logs-{environment_suffix}",
    name=f"/aws/lambda/fraud-handler-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

notification_sender_log_group = aws.cloudwatch.LogGroup(
    f"notification-sender-logs-{environment_suffix}",
    name=f"/aws/lambda/notification-sender-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# IAM Roles and Policies
# ========================================

# Transaction Processor IAM Role
transaction_processor_role = aws.iam.Role(
    f"transaction-processor-role-{environment_suffix}",
    name=f"transaction-processor-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

transaction_processor_policy = aws.iam.RolePolicy(
    f"transaction-processor-policy-{environment_suffix}",
    role=transaction_processor_role.id,
    policy=pulumi.Output.all(
        transactions_table.arn,
        transaction_queue.arn,
        notification_queue.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": args[0]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes"
                ],
                "Resource": [args[1], args[2]]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }
        ]
    })),
    opts=pulumi.ResourceOptions(provider=provider)
)

# Fraud Handler IAM Role
fraud_handler_role = aws.iam.Role(
    f"fraud-handler-role-{environment_suffix}",
    name=f"fraud-handler-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

fraud_handler_policy = aws.iam.RolePolicy(
    f"fraud-handler-policy-{environment_suffix}",
    role=fraud_handler_role.id,
    policy=pulumi.Output.all(
        fraud_alerts_table.arn,
        transactions_table.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                ],
                "Resource": [args[0], args[1]]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }
        ]
    })),
    opts=pulumi.ResourceOptions(provider=provider)
)

# Notification Sender IAM Role
notification_sender_role = aws.iam.Role(
    f"notification-sender-role-{environment_suffix}",
    name=f"notification-sender-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

notification_sender_policy = aws.iam.RolePolicy(
    f"notification-sender-policy-{environment_suffix}",
    role=notification_sender_role.id,
    policy=pulumi.Output.all(
        notification_queue.arn,
        webhook_url_parameter.arn,
        api_key_parameter.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                ],
                "Resource": args[0]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                ],
                "Resource": [args[1], args[2]]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }
        ]
    })),
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# Lambda Functions
# ========================================

# Create Lambda function code directory structure
os.makedirs("lib/lambda", exist_ok=True)

# Transaction Processor Lambda
transaction_processor = aws.lambda_.Function(
    f"transaction-processor-{environment_suffix}",
    name=f"transaction-processor-{environment_suffix}",
    runtime="python3.11",
    role=transaction_processor_role.arn,
    handler="index.handler",
    memory_size=3072,  # 3GB
    timeout=300,  # 5 minutes
    architectures=["arm64"],
    reserved_concurrent_executions=50,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
NOTIFICATION_QUEUE_URL = os.environ['NOTIFICATION_QUEUE_URL']

def handler(event, context):
    \"\"\"Process incoming transaction requests.\"\"\"
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Generate transaction ID
        transaction_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Store transaction in DynamoDB
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        transaction = {
            'transaction_id': transaction_id,
            'amount': body.get('amount'),
            'currency': body.get('currency', 'USD'),
            'merchant_id': body.get('merchant_id'),
            'status': 'pending',
            'timestamp': timestamp,
            'created_at': datetime.utcnow().isoformat()
        }

        table.put_item(Item=transaction)

        # Send notification to queue
        sqs.send_message(
            QueueUrl=NOTIFICATION_QUEUE_URL,
            MessageBody=json.dumps({
                'transaction_id': transaction_id,
                'event': 'transaction_created',
                'timestamp': timestamp
            }),
            MessageGroupId='notifications',
            MessageDeduplicationId=f"{transaction_id}-{timestamp}"
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TRANSACTIONS_TABLE": transactions_table.name,
            "NOTIFICATION_QUEUE_URL": notification_queue.url,
            "AWS_XRAY_TRACING_NAME": "transaction-processor"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(
        provider=provider,
        depends_on=[transaction_processor_log_group, transaction_processor_policy]
    )
)

# Fraud Handler Lambda
fraud_handler = aws.lambda_.Function(
    f"fraud-handler-{environment_suffix}",
    name=f"fraud-handler-{environment_suffix}",
    runtime="python3.11",
    role=fraud_handler_role.arn,
    handler="index.handler",
    memory_size=3072,  # 3GB
    timeout=300,  # 5 minutes
    architectures=["arm64"],
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')

FRAUD_ALERTS_TABLE = os.environ['FRAUD_ALERTS_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']

def handler(event, context):
    \"\"\"Handle fraud detection webhook notifications.\"\"\"
    try:
        # Parse webhook payload
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        fraud_score = body.get('fraud_score', 0)
        alert_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Store fraud alert
        fraud_table = dynamodb.Table(FRAUD_ALERTS_TABLE)
        fraud_alert = {
            'alert_id': alert_id,
            'timestamp': timestamp,
            'transaction_id': transaction_id,
            'fraud_score': fraud_score,
            'status': 'review' if fraud_score > 70 else 'approved',
            'created_at': datetime.utcnow().isoformat()
        }

        fraud_table.put_item(Item=fraud_alert)

        # Update transaction status if high fraud score
        if fraud_score > 70:
            transactions_table = dynamodb.Table(TRANSACTIONS_TABLE)
            transactions_table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'fraud_review'}
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Fraud alert processed',
                'alert_id': alert_id
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        print(f"Error processing fraud alert: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "FRAUD_ALERTS_TABLE": fraud_alerts_table.name,
            "TRANSACTIONS_TABLE": transactions_table.name,
            "AWS_XRAY_TRACING_NAME": "fraud-handler"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(
        provider=provider,
        depends_on=[fraud_handler_log_group, fraud_handler_policy]
    )
)

# Notification Sender Lambda
notification_sender = aws.lambda_.Function(
    f"notification-sender-{environment_suffix}",
    name=f"notification-sender-{environment_suffix}",
    runtime="python3.11",
    role=notification_sender_role.arn,
    handler="index.handler",
    memory_size=3072,  # 3GB
    timeout=300,  # 5 minutes
    architectures=["arm64"],
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os

ssm = boto3.client('ssm')

WEBHOOK_URL_PARAM = os.environ['WEBHOOK_URL_PARAM']
API_KEY_PARAM = os.environ['API_KEY_PARAM']

def handler(event, context):
    \"\"\"Send notifications from SQS queue.\"\"\"
    try:
        # Process SQS messages
        for record in event.get('Records', []):
            message = json.loads(record['body'])

            # Retrieve webhook configuration from SSM
            webhook_url = ssm.get_parameter(
                Name=WEBHOOK_URL_PARAM,
                WithDecryption=True
            )['Parameter']['Value']

            api_key = ssm.get_parameter(
                Name=API_KEY_PARAM,
                WithDecryption=True
            )['Parameter']['Value']

            # Log notification (in production, send to actual webhook)
            print(f"Sending notification to {webhook_url}")
            print(f"Message: {json.dumps(message)}")
            print(f"Using API Key: {api_key[:8]}...")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notifications processed'
            })
        }
    except Exception as e:
        print(f"Error sending notifications: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "WEBHOOK_URL_PARAM": webhook_url_parameter.name,
            "API_KEY_PARAM": api_key_parameter.name,
            "AWS_XRAY_TRACING_NAME": "notification-sender"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(
        provider=provider,
        depends_on=[notification_sender_log_group, notification_sender_policy]
    )
)

# ========================================
# Lambda Event Source Mappings
# ========================================

notification_sender_mapping = aws.lambda_.EventSourceMapping(
    f"notification-sender-mapping-{environment_suffix}",
    event_source_arn=notification_queue.arn,
    function_name=notification_sender.name,
    batch_size=10,
    enabled=True,
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# API Gateway REST API
# ========================================

api = aws.apigateway.RestApi(
    f"payment-api-{environment_suffix}",
    name=f"payment-api-{environment_suffix}",
    description="Payment processing API with fraud detection",
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# API Key
api_key = aws.apigateway.ApiKey(
    f"payment-api-key-{environment_suffix}",
    name=f"payment-api-key-{environment_suffix}",
    enabled=True,
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# /transactions resource and methods
# ========================================

transactions_resource = aws.apigateway.Resource(
    f"transactions-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="transactions",
    opts=pulumi.ResourceOptions(provider=provider)
)

# POST /transactions method
post_transactions_method = aws.apigateway.Method(
    f"post-transactions-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method="POST",
    authorization="NONE",
    api_key_required=True,
    request_validator_id=aws.apigateway.RequestValidator(
        f"transactions-validator-{environment_suffix}",
        rest_api=api.id,
        name=f"transactions-validator-{environment_suffix}",
        validate_request_body=True,
        validate_request_parameters=True,
        opts=pulumi.ResourceOptions(provider=provider)
    ).id,
    opts=pulumi.ResourceOptions(provider=provider)
)

# POST /transactions integration
post_transactions_integration = aws.apigateway.Integration(
    f"post-transactions-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method=post_transactions_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=transaction_processor.invoke_arn,
    opts=pulumi.ResourceOptions(provider=provider)
)

# Lambda permission for API Gateway
transaction_processor_permission = aws.lambda_.Permission(
    f"transaction-processor-api-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=transaction_processor.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.execution_arn).apply(
        lambda args: f"{args[0]}/*/*"
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# /fraud-webhook resource and methods
# ========================================

fraud_webhook_resource = aws.apigateway.Resource(
    f"fraud-webhook-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="fraud-webhook",
    opts=pulumi.ResourceOptions(provider=provider)
)

# POST /fraud-webhook method
post_fraud_webhook_method = aws.apigateway.Method(
    f"post-fraud-webhook-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=fraud_webhook_resource.id,
    http_method="POST",
    authorization="NONE",
    api_key_required=True,
    request_validator_id=aws.apigateway.RequestValidator(
        f"fraud-webhook-validator-{environment_suffix}",
        rest_api=api.id,
        name=f"fraud-webhook-validator-{environment_suffix}",
        validate_request_body=True,
        validate_request_parameters=True,
        opts=pulumi.ResourceOptions(provider=provider)
    ).id,
    opts=pulumi.ResourceOptions(provider=provider)
)

# POST /fraud-webhook integration
post_fraud_webhook_integration = aws.apigateway.Integration(
    f"post-fraud-webhook-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=fraud_webhook_resource.id,
    http_method=post_fraud_webhook_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=fraud_handler.invoke_arn,
    opts=pulumi.ResourceOptions(provider=provider)
)

# Lambda permission for fraud handler
fraud_handler_permission = aws.lambda_.Permission(
    f"fraud-handler-api-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=fraud_handler.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.execution_arn).apply(
        lambda args: f"{args[0]}/*/*"
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# /transaction/{id} resource and methods
# ========================================

transaction_id_resource = aws.apigateway.Resource(
    f"transaction-id-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=transactions_resource.id,
    path_part="{id}",
    opts=pulumi.ResourceOptions(provider=provider)
)

# GET /transaction/{id} method
get_transaction_method = aws.apigateway.Method(
    f"get-transaction-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=transaction_id_resource.id,
    http_method="GET",
    authorization="NONE",
    api_key_required=True,
    opts=pulumi.ResourceOptions(provider=provider)
)

# Create a simple Lambda for GET transaction
get_transaction_lambda = aws.lambda_.Function(
    f"get-transaction-{environment_suffix}",
    name=f"get-transaction-{environment_suffix}",
    runtime="python3.11",
    role=transaction_processor_role.arn,
    handler="index.handler",
    memory_size=3072,
    timeout=300,
    architectures=["arm64"],
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']

def handler(event, context):
    try:
        transaction_id = event['pathParameters']['id']
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        response = table.get_item(Key={'transaction_id': transaction_id})

        if 'Item' in response:
            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=str),
                'headers': {'Content-Type': 'application/json'}
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Transaction not found'}),
                'headers': {'Content-Type': 'application/json'}
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            'headers': {'Content-Type': 'application/json'}
        }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TRANSACTIONS_TABLE": transactions_table.name,
            "AWS_XRAY_TRACING_NAME": "get-transaction"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# GET /transaction/{id} integration
get_transaction_integration = aws.apigateway.Integration(
    f"get-transaction-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=transaction_id_resource.id,
    http_method=get_transaction_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=get_transaction_lambda.invoke_arn,
    opts=pulumi.ResourceOptions(provider=provider)
)

# Lambda permission for GET transaction
get_transaction_permission = aws.lambda_.Permission(
    f"get-transaction-api-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=get_transaction_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.execution_arn).apply(
        lambda args: f"{args[0]}/*/*"
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# API Gateway Deployment and Stage
# ========================================

deployment = aws.apigateway.Deployment(
    f"api-deployment-{environment_suffix}",
    rest_api=api.id,
    opts=pulumi.ResourceOptions(
        provider=provider,
        depends_on=[
            post_transactions_integration,
            post_fraud_webhook_integration,
            get_transaction_integration
        ]
    )
)

stage = aws.apigateway.Stage(
    f"api-stage-{environment_suffix}",
    rest_api=api.id,
    deployment=deployment.id,
    stage_name=environment_suffix,
    xray_tracing_enabled=True,
    tags={
        "Environment": environment_suffix,
        "Service": "payment-processing"
    },
    opts=pulumi.ResourceOptions(provider=provider)
)

# Method settings for throttling
stage_method_settings = aws.apigateway.MethodSettings(
    f"api-method-settings-{environment_suffix}",
    rest_api=api.id,
    stage_name=stage.stage_name,
    method_path="*/*",
    settings=aws.apigateway.MethodSettingsSettingsArgs(
        throttling_burst_limit=1000,
        throttling_rate_limit=1000,
        logging_level="INFO",
        data_trace_enabled=True,
        metrics_enabled=True
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# Usage Plan for API Key
usage_plan = aws.apigateway.UsagePlan(
    f"api-usage-plan-{environment_suffix}",
    name=f"payment-api-usage-plan-{environment_suffix}",
    api_stages=[
        aws.apigateway.UsagePlanApiStageArgs(
            api_id=api.id,
            stage=stage.stage_name
        )
    ],
    throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
        burst_limit=1000,
        rate_limit=1000
    ),
    opts=pulumi.ResourceOptions(provider=provider)
)

# Link API Key to Usage Plan
usage_plan_key = aws.apigateway.UsagePlanKey(
    f"api-usage-plan-key-{environment_suffix}",
    key_id=api_key.id,
    key_type="API_KEY",
    usage_plan_id=usage_plan.id,
    opts=pulumi.ResourceOptions(provider=provider)
)

# ========================================
# Exports
# ========================================

pulumi.export("api_gateway_url", pulumi.Output.all(api.id, stage.stage_name).apply(
    lambda args: f"https://{args[0]}.execute-api.{region}.amazonaws.com/{args[1]}"
))
pulumi.export("api_key_id", api_key.id)
pulumi.export("transaction_processor_arn", transaction_processor.arn)
pulumi.export("fraud_handler_arn", fraud_handler.arn)
pulumi.export("notification_sender_arn", notification_sender.arn)
pulumi.export("get_transaction_arn", get_transaction_lambda.arn)
pulumi.export("transactions_table_name", transactions_table.name)
pulumi.export("fraud_alerts_table_name", fraud_alerts_table.name)
pulumi.export("transaction_queue_url", transaction_queue.url)
pulumi.export("notification_queue_url", notification_queue.url)
```

## File: Pulumi.yaml

```yaml
name: payment-processing
runtime: python
description: Serverless payment processing infrastructure with API Gateway, Lambda, DynamoDB, and SQS

config:
  aws:region:
    description: AWS region for deployment
    default: us-east-2
  environmentSuffix:
    description: Environment suffix for resource naming
    default: dev
```

## File: requirements.txt

```text
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: README.md

```markdown
# Serverless Payment Processing Infrastructure

This Pulumi Python program deploys a complete serverless payment processing system on AWS with the following components:

## Architecture

- **API Gateway REST API**: Three endpoints for transaction processing, fraud webhooks, and transaction retrieval
- **Lambda Functions**: Four functions for processing transactions, handling fraud alerts, sending notifications, and retrieving transactions
- **DynamoDB Tables**: Two tables for storing transactions and fraud alerts
- **SQS FIFO Queues**: Two queues with dead letter queues for reliable message processing
- **IAM Roles**: Least-privilege roles for each Lambda function
- **CloudWatch Logs**: 7-day retention for all Lambda functions
- **SSM Parameter Store**: Secure storage for webhook URLs and API keys
- **X-Ray Tracing**: Distributed tracing across all components

## Prerequisites

- Python 3.11+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

1. Install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure Pulumi:
```bash
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

4. Retrieve outputs:
```bash
pulumi stack output api_gateway_url
pulumi stack output api_key_id
```

5. Get API key value:
```bash
aws apigateway get-api-key --api-key $(pulumi stack output api_key_id) --include-value --query 'value' --output text
```

## API Endpoints

- `POST /transactions` - Create a new transaction
- `POST /fraud-webhook` - Receive fraud detection alerts
- `GET /transactions/{id}` - Retrieve transaction details

All endpoints require an API key in the `x-api-key` header.

## Testing

Example request to create a transaction:
```bash
API_URL=$(pulumi stack output api_gateway_url)
API_KEY=$(aws apigateway get-api-key --api-key $(pulumi stack output api_key_id) --include-value --query 'value' --output text)

curl -X POST "$API_URL/transactions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "merchant_id": "merchant-123"
  }'
```

## Configuration

The following SSM parameters are created (update as needed):
- `/payment-processing/{environmentSuffix}/webhook-url` - Webhook URL for notifications
- `/payment-processing/{environmentSuffix}/api-key` - API key for external services

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Features

- **High Availability**: On-demand DynamoDB billing, serverless Lambda functions
- **Security**: IAM least-privilege policies, API keys, SSM Parameter Store for secrets
- **Monitoring**: CloudWatch Logs, X-Ray tracing, API Gateway metrics
- **Reliability**: SQS FIFO queues with DLQs, 4-day message retention
- **Performance**: 3GB Lambda memory, arm64 architecture, reserved concurrency
- **Compliance**: X-Ray tracing for audit trails, point-in-time recovery for DynamoDB

## Cost Optimization

- On-demand billing for DynamoDB
- Serverless Lambda with arm64 for better price/performance
- 7-day log retention to minimize storage costs
- FIFO queues with content-based deduplication to reduce duplicate processing
```
