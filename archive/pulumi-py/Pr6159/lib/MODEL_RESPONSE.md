# Fraud Detection Pipeline Implementation

This implementation creates a complete serverless fraud detection pipeline using Pulumi with Python.

## File: lib/tap_stack.py

```python
import pulumi
import pulumi_aws as aws
import json

config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Common tags for all resources
common_tags = {
    "Environment": "production",
    "CostCenter": "fraud-detection"
}

# KMS Key for encryption
kms_key = aws.kms.Key(
    f"fraud-detection-kms-{environment_suffix}",
    description="KMS key for fraud detection pipeline encryption",
    deletion_window_in_days=10,
    enable_key_rotation=True,
    tags=common_tags
)

kms_alias = aws.kms.Alias(
    f"fraud-detection-kms-alias-{environment_suffix}",
    target_key_id=kms_key.id,
    name=f"alias/fraud-detection-{environment_suffix}"
)

# IAM Role for process-transaction Lambda
process_transaction_role = aws.iam.Role(
    f"process-transaction-role-{environment_suffix}",
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
    tags=common_tags
)

# Attach basic execution policy
aws.iam.RolePolicyAttachment(
    f"process-transaction-basic-{environment_suffix}",
    role=process_transaction_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# DynamoDB Table
transactions_table = aws.dynamodb.Table(
    f"transactions-{environment_suffix}",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transaction_id",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="timestamp",
            type="N"
        )
    ],
    hash_key="transaction_id",
    range_key="timestamp",
    billing_mode="PAY_PER_REQUEST",
    stream_enabled=True,
    stream_view_type="NEW_AND_OLD_IMAGES",
    tags=common_tags
)

# Policy for process-transaction Lambda
process_transaction_policy = aws.iam.RolePolicy(
    f"process-transaction-policy-{environment_suffix}",
    role=process_transaction_role.id,
    policy=pulumi.Output.all(transactions_table.arn, kms_key.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": args[1]
                }
            ]
        })
    )
)

# CloudWatch Log Group for process-transaction
process_transaction_log_group = aws.cloudwatch.LogGroup(
    f"process-transaction-logs-{environment_suffix}",
    name=f"/aws/lambda/process-transaction-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# Lambda Function: process-transaction
process_transaction_lambda = aws.lambda_.Function(
    f"process-transaction-{environment_suffix}",
    runtime="python3.9",
    role=process_transaction_role.arn,
    handler="index.handler",
    memory_size=512,
    reserved_concurrent_executions=50,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import time
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if 'transaction_id' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id'})
            }

        # Store transaction in DynamoDB
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': int(time.time() * 1000),
            'amount': body.get('amount', 0),
            'merchant': body.get('merchant', ''),
            'card_number': body.get('card_number', ''),
            'location': body.get('location', ''),
            'status': 'pending'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': body['transaction_id']
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": transactions_table.name
        }
    ),
    kms_key_arn=kms_key.arn,
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[process_transaction_log_group])
)

# SQS Queue for fraud alerts
fraud_alerts_queue = aws.sqs.Queue(
    f"fraud-alerts-{environment_suffix}",
    visibility_timeout_seconds=300,
    tags=common_tags
)

# IAM Role for detect-fraud Lambda
detect_fraud_role = aws.iam.Role(
    f"detect-fraud-role-{environment_suffix}",
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
    tags=common_tags
)

aws.iam.RolePolicyAttachment(
    f"detect-fraud-basic-{environment_suffix}",
    role=detect_fraud_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Policy for detect-fraud Lambda
detect_fraud_policy = aws.iam.RolePolicy(
    f"detect-fraud-policy-{environment_suffix}",
    role=detect_fraud_role.id,
    policy=pulumi.Output.all(
        transactions_table.stream_arn,
        fraud_alerts_queue.arn,
        kms_key.arn
    ).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": args[2]
                }
            ]
        })
    )
)

# CloudWatch Log Group for detect-fraud
detect_fraud_log_group = aws.cloudwatch.LogGroup(
    f"detect-fraud-logs-{environment_suffix}",
    name=f"/aws/lambda/detect-fraud-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# Lambda Function: detect-fraud
detect_fraud_lambda = aws.lambda_.Function(
    f"detect-fraud-{environment_suffix}",
    runtime="python3.9",
    role=detect_fraud_role.arn,
    handler="index.handler",
    memory_size=512,
    reserved_concurrent_executions=50,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sqs = boto3.client('sqs')
queue_url = os.environ['QUEUE_URL']

def handler(event, context):
    try:
        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                new_image = record['dynamodb'].get('NewImage', {})

                # Extract transaction details
                transaction_id = new_image.get('transaction_id', {}).get('S', '')
                amount = float(new_image.get('amount', {}).get('N', 0))

                # Simple fraud detection logic
                is_suspicious = False
                reasons = []

                if amount > 1000:
                    is_suspicious = True
                    reasons.append('High amount transaction')

                if amount > 5000:
                    is_suspicious = True
                    reasons.append('Very high amount transaction')

                # If suspicious, send to SQS
                if is_suspicious:
                    message = {
                        'transaction_id': transaction_id,
                        'amount': amount,
                        'reasons': reasons,
                        'severity': 'high' if amount > 5000 else 'medium'
                    }

                    sqs.send_message(
                        QueueUrl=queue_url,
                        MessageBody=json.dumps(message)
                    )

                    print(f"Suspicious transaction detected: {transaction_id}")

        return {'statusCode': 200, 'body': 'Processed successfully'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "QUEUE_URL": fraud_alerts_queue.url
        }
    ),
    kms_key_arn=kms_key.arn,
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[detect_fraud_log_group])
)

# Event Source Mapping for DynamoDB Stream
stream_mapping = aws.lambda_.EventSourceMapping(
    f"detect-fraud-stream-mapping-{environment_suffix}",
    event_source_arn=transactions_table.stream_arn,
    function_name=detect_fraud_lambda.arn,
    starting_position="LATEST",
    batch_size=100
)

# SNS Topic for notifications
fraud_notifications_topic = aws.sns.Topic(
    f"fraud-notifications-{environment_suffix}",
    display_name="Fraud Detection Alerts",
    tags=common_tags
)

# IAM Role for notify-team Lambda
notify_team_role = aws.iam.Role(
    f"notify-team-role-{environment_suffix}",
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
    tags=common_tags
)

aws.iam.RolePolicyAttachment(
    f"notify-team-basic-{environment_suffix}",
    role=notify_team_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Policy for notify-team Lambda
notify_team_policy = aws.iam.RolePolicy(
    f"notify-team-policy-{environment_suffix}",
    role=notify_team_role.id,
    policy=pulumi.Output.all(
        fraud_alerts_queue.arn,
        fraud_notifications_topic.arn,
        kms_key.arn
    ).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
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
                        "sns:Publish"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": args[2]
                }
            ]
        })
    )
)

# CloudWatch Log Group for notify-team
notify_team_log_group = aws.cloudwatch.LogGroup(
    f"notify-team-logs-{environment_suffix}",
    name=f"/aws/lambda/notify-team-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# Lambda Function: notify-team
notify_team_lambda = aws.lambda_.Function(
    f"notify-team-{environment_suffix}",
    runtime="python3.9",
    role=notify_team_role.arn,
    handler="index.handler",
    memory_size=512,
    reserved_concurrent_executions=50,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sns = boto3.client('sns')
topic_arn = os.environ['TOPIC_ARN']

def handler(event, context):
    try:
        for record in event['Records']:
            body = json.loads(record['body'])

            transaction_id = body.get('transaction_id', 'Unknown')
            amount = body.get('amount', 0)
            reasons = body.get('reasons', [])
            severity = body.get('severity', 'medium')

            # Create notification message
            message = f"""
FRAUD ALERT - {severity.upper()} SEVERITY

Transaction ID: {transaction_id}
Amount: ${amount}
Reasons: {', '.join(reasons)}

Please investigate this transaction immediately.
"""

            # Publish to SNS
            sns.publish(
                TopicArn=topic_arn,
                Subject=f"Fraud Alert: Transaction {transaction_id}",
                Message=message
            )

            print(f"Notification sent for transaction: {transaction_id}")

        return {'statusCode': 200, 'body': 'Notifications sent successfully'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TOPIC_ARN": fraud_notifications_topic.arn
        }
    ),
    kms_key_arn=kms_key.arn,
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[notify_team_log_group])
)

# Event Source Mapping for SQS
sqs_mapping = aws.lambda_.EventSourceMapping(
    f"notify-team-sqs-mapping-{environment_suffix}",
    event_source_arn=fraud_alerts_queue.arn,
    function_name=notify_team_lambda.arn,
    batch_size=10
)

# API Gateway REST API
api = aws.apigateway.RestApi(
    f"fraud-detection-api-{environment_suffix}",
    description="Fraud Detection API",
    tags=common_tags
)

# API Gateway Resource
transactions_resource = aws.apigateway.Resource(
    f"transactions-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="transactions"
)

# Request Validator
request_validator = aws.apigateway.RequestValidator(
    f"api-request-validator-{environment_suffix}",
    rest_api=api.id,
    validate_request_body=True,
    validate_request_parameters=True
)

# API Gateway Method
transactions_method = aws.apigateway.Method(
    f"transactions-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method="POST",
    authorization="NONE",
    request_validator_id=request_validator.id
)

# Lambda Permission for API Gateway
lambda_permission = aws.lambda_.Permission(
    f"api-lambda-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=process_transaction_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.execution_arn).apply(
        lambda args: f"{args[0]}/*/*"
    )
)

# API Gateway Integration
integration = aws.apigateway.Integration(
    f"transactions-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method=transactions_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=process_transaction_lambda.invoke_arn
)

# API Gateway Method Response
method_response = aws.apigateway.MethodResponse(
    f"transactions-method-response-{environment_suffix}",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method=transactions_method.http_method,
    status_code="200"
)

# API Gateway Deployment
deployment = aws.apigateway.Deployment(
    f"api-deployment-{environment_suffix}",
    rest_api=api.id,
    opts=pulumi.ResourceOptions(depends_on=[
        integration,
        method_response
    ])
)

# API Gateway Stage
stage = aws.apigateway.Stage(
    f"api-stage-{environment_suffix}",
    rest_api=api.id,
    deployment=deployment.id,
    stage_name="prod",
    tags=common_tags
)

# Exports
pulumi.export("api_endpoint", pulumi.Output.concat("https://", api.id, ".execute-api.us-east-1.amazonaws.com/prod/transactions"))
pulumi.export("transactions_table_name", transactions_table.name)
pulumi.export("fraud_alerts_queue_url", fraud_alerts_queue.url)
pulumi.export("fraud_notifications_topic_arn", fraud_notifications_topic.arn)
pulumi.export("kms_key_id", kms_key.id)
```

## File: lib/__init__.py

```python
# Empty file to make lib a Python package
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install pulumi pulumi-aws
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Get API endpoint:
```bash
pulumi stack output api_endpoint
```

5. Test the pipeline:
```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-12345",
    "amount": 5500,
    "merchant": "Test Store",
    "card_number": "****1234",
    "location": "New York, NY"
  }'
```

6. Subscribe to SNS notifications (optional):
```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output fraud_notifications_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Architecture Components

- **KMS Key**: Encrypts Lambda environment variables
- **Lambda Functions**: Three functions for processing, fraud detection, and notifications
- **DynamoDB**: Transactions table with streams enabled
- **SQS**: Decouples fraud detection from notifications
- **SNS**: Sends email alerts to fraud team
- **API Gateway**: REST API endpoint for transaction ingestion
- **CloudWatch**: Log groups for each Lambda function
- **IAM**: Least privilege roles for each component

## Constraint Compliance

All 10 mandatory constraints are satisfied:
1. Reserved concurrency: 50 for all Lambda functions
2. DynamoDB billing: PAY_PER_REQUEST (on-demand)
3. Lambda runtime: python3.9
4. API Gateway: REST API (not HTTP API)
5. Environment variables: encrypted with KMS
6. DynamoDB streams: NEW_AND_OLD_IMAGES
7. Resource tags: Environment=production, CostCenter=fraud-detection
8. Lambda memory: 512MB
9. Request validation: enabled on API Gateway
10. SQS visibility timeout: 300 seconds
