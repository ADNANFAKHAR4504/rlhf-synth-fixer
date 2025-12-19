# Cryptocurrency Price Processing System - CDKTF Python Implementation

This implementation provides a complete serverless cryptocurrency price processing pipeline using CDKTF with Python. The system handles webhook ingestion, data enrichment, and storage with comprehensive monitoring and error handling.

## Architecture Overview

The solution consists of:
- Two Lambda functions (webhook-processor and price-enricher) with ARM64 architecture
- DynamoDB table with streams for event-driven processing
- KMS encryption for sensitive environment variables
- SQS dead letter queues for error handling
- SNS topic for success notifications
- CloudWatch Logs with subscription filters
- IAM roles with least-privilege policies

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from tap_stack import TapStack

app = App()
TapStack(app, "crypto-price-processor")
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "crypto-price-processor",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true"
  }
}
```

## File: tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery, DynamodbTableStreamSpecification
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionDeadLetterConfig
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping, LambdaEventSourceMappingDestinationConfigOnFailure
from cdktf_cdktf_provider_aws.lambda_function_event_invoke_config import LambdaFunctionEventInvokeConfig, LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_subscription_filter import CloudwatchLogSubscriptionFilter
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument, DataAwsIamPolicyDocumentStatement, DataAwsIamPolicyDocumentStatementPrincipals
import json
import os


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Get environment suffix from environment variable or use default
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # KMS Key for Lambda environment variable encryption
        kms_key = KmsKey(self, f"lambda-kms-key-{environment_suffix}",
            description=f"KMS key for encrypting Lambda environment variables - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10
        )

        KmsAlias(self, f"lambda-kms-alias-{environment_suffix}",
            name=f"alias/lambda-crypto-processor-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # DynamoDB Table
        dynamodb_table = DynamodbTable(self, f"crypto-prices-{environment_suffix}",
            name=f"crypto-prices-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="symbol",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="symbol", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor",
                "ManagedBy": "CDKTF"
            }
        )

        # SQS Dead Letter Queue for webhook-processor
        webhook_dlq = SqsQueue(self, f"webhook-processor-dlq-{environment_suffix}",
            name=f"webhook-processor-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # SQS Dead Letter Queue for price-enricher
        enricher_dlq = SqsQueue(self, f"price-enricher-dlq-{environment_suffix}",
            name=f"price-enricher-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # SNS Topic for success notifications
        success_topic = SnsTopic(self, f"price-updates-success-{environment_suffix}",
            name=f"price-updates-success-{environment_suffix}",
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # IAM Role for webhook-processor Lambda
        webhook_assume_role_policy = DataAwsIamPolicyDocument(self, "webhook-assume-role-policy",
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[
                        DataAwsIamPolicyDocumentStatementPrincipals(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        webhook_role = IamRole(self, f"webhook-processor-role-{environment_suffix}",
            name=f"webhook-processor-role-{environment_suffix}",
            assume_role_policy=webhook_assume_role_policy.json,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-write-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": dynamodb_table.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-decrypt-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:DescribeKey"
                                ],
                                "Resource": kms_key.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sqs:SendMessage"
                                ],
                                "Resource": webhook_dlq.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sns-publish-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": success_topic.arn
                            }
                        ]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(self, f"webhook-lambda-basic-{environment_suffix}",
            role=webhook_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # IAM Role for price-enricher Lambda
        enricher_assume_role_policy = DataAwsIamPolicyDocument(self, "enricher-assume-role-policy",
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[
                        DataAwsIamPolicyDocumentStatementPrincipals(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        enricher_role = IamRole(self, f"price-enricher-role-{environment_suffix}",
            name=f"price-enricher-role-{environment_suffix}",
            assume_role_policy=enricher_assume_role_policy.json,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-stream-policy",
                    policy=json.dumps({
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
                                "Resource": f"{dynamodb_table.arn}/stream/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:UpdateItem",
                                    "dynamodb:PutItem"
                                ],
                                "Resource": dynamodb_table.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-decrypt-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:DescribeKey"
                                ],
                                "Resource": kms_key.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sqs:SendMessage"
                                ],
                                "Resource": enricher_dlq.arn
                            }
                        ]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(self, f"enricher-lambda-basic-{environment_suffix}",
            role=enricher_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # CloudWatch Log Group for webhook-processor
        webhook_log_group = CloudwatchLogGroup(self, f"webhook-processor-logs-{environment_suffix}",
            name=f"/aws/lambda/webhook-processor-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # CloudWatch Log Group for price-enricher
        enricher_log_group = CloudwatchLogGroup(self, f"price-enricher-logs-{environment_suffix}",
            name=f"/aws/lambda/price-enricher-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Lambda function for webhook-processor
        webhook_lambda = LambdaFunction(self, f"webhook-processor-{environment_suffix}",
            function_name=f"webhook-processor-{environment_suffix}",
            role=webhook_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=1024,
            timeout=60,
            reserved_concurrent_executions=10,
            filename="lambda/webhook_processor.zip",
            source_code_hash=Fn.filebase64sha256("lambda/webhook_processor.zip"),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "EXCHANGE_API_ENDPOINT": "https://api.exchange.example.com"
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=webhook_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            },
            depends_on=[webhook_log_group]
        )

        # Lambda destination for webhook-processor success
        LambdaFunctionEventInvokeConfig(self, f"webhook-invoke-config-{environment_suffix}",
            function_name=webhook_lambda.function_name,
            maximum_retry_attempts=2,
            destination_config=LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess(
                destination=success_topic.arn
            )
        )

        # Lambda function for price-enricher
        enricher_lambda = LambdaFunction(self, f"price-enricher-{environment_suffix}",
            function_name=f"price-enricher-{environment_suffix}",
            role=enricher_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=60,
            reserved_concurrent_executions=10,
            filename="lambda/price_enricher.zip",
            source_code_hash=Fn.filebase64sha256("lambda/price_enricher.zip"),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=enricher_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            },
            depends_on=[enricher_log_group]
        )

        # Lambda Event Source Mapping for DynamoDB Stream
        LambdaEventSourceMapping(self, f"dynamodb-stream-mapping-{environment_suffix}",
            event_source_arn=dynamodb_table.stream_arn,
            function_name=enricher_lambda.function_name,
            starting_position="LATEST",
            batch_size=10,
            maximum_retry_attempts=3,
            maximum_record_age_in_seconds=3600,
            bisect_batch_on_function_error=True,
            destination_config=LambdaEventSourceMappingDestinationConfigOnFailure(
                destination_arn=enricher_dlq.arn
            )
        )

        # CloudWatch Log Subscription Filter for webhook-processor errors
        CloudwatchLogSubscriptionFilter(self, f"webhook-error-filter-{environment_suffix}",
            name=f"webhook-error-filter-{environment_suffix}",
            log_group_name=webhook_log_group.name,
            filter_pattern="?ERROR ?Error ?error ?exception ?Exception",
            destination_arn=success_topic.arn
        )

        # CloudWatch Log Subscription Filter for price-enricher errors
        CloudwatchLogSubscriptionFilter(self, f"enricher-error-filter-{environment_suffix}",
            name=f"enricher-error-filter-{environment_suffix}",
            log_group_name=enricher_log_group.name,
            filter_pattern="?ERROR ?Error ?error ?exception ?Exception",
            destination_arn=success_topic.arn
        )

        # Outputs
        TerraformOutput(self, "webhook_processor_arn",
            value=webhook_lambda.arn,
            description="ARN of the webhook processor Lambda function"
        )

        TerraformOutput(self, "price_enricher_arn",
            value=enricher_lambda.arn,
            description="ARN of the price enricher Lambda function"
        )

        TerraformOutput(self, "dynamodb_table_name",
            value=dynamodb_table.name,
            description="Name of the DynamoDB table for crypto prices"
        )

        TerraformOutput(self, "sns_topic_arn",
            value=success_topic.arn,
            description="ARN of the SNS topic for success notifications"
        )

        TerraformOutput(self, "kms_key_id",
            value=kms_key.key_id,
            description="ID of the KMS key for Lambda encryption"
        )
```

## File: lambda/webhook_processor/index.py

```python
import json
import boto3
import os
import logging
from datetime import datetime
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Webhook processor Lambda function to receive cryptocurrency price updates.
    Validates incoming data and writes to DynamoDB.
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Parse incoming webhook payload
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        # Validate required fields
        required_fields = ['symbol', 'price', 'exchange']
        for field in required_fields:
            if field not in body:
                raise ValueError(f"Missing required field: {field}")

        # Normalize data
        symbol = body['symbol'].upper()
        price = Decimal(str(body['price']))
        exchange = body['exchange']
        timestamp = int(datetime.utcnow().timestamp())

        # Validate price is positive
        if price <= 0:
            raise ValueError(f"Invalid price value: {price}")

        # Prepare item for DynamoDB
        item = {
            'symbol': symbol,
            'timestamp': timestamp,
            'price': price,
            'exchange': exchange,
            'raw_data': json.dumps(body),
            'processed_at': datetime.utcnow().isoformat()
        }

        # Write to DynamoDB
        response = table.put_item(Item=item)
        logger.info(f"Successfully wrote item to DynamoDB: {symbol} @ {price}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Price update processed successfully',
                'symbol': symbol,
                'timestamp': timestamp
            })
        }

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Validation error',
                'message': str(e)
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise
```

## File: lambda/price_enricher/index.py

```python
import json
import boto3
import os
import logging
from decimal import Decimal
from statistics import mean, stdev

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def calculate_moving_average(prices, window=10):
    """Calculate simple moving average"""
    if len(prices) < window:
        window = len(prices)
    return mean(prices[-window:]) if prices else 0

def calculate_volatility(prices):
    """Calculate price volatility (standard deviation)"""
    if len(prices) < 2:
        return 0
    return stdev(prices)

def lambda_handler(event, context):
    """
    Price enricher Lambda function triggered by DynamoDB Streams.
    Adds moving averages and volatility metrics to price data.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records from DynamoDB Stream")

        for record in event['Records']:
            if record['eventName'] not in ['INSERT', 'MODIFY']:
                logger.info(f"Skipping record with eventName: {record['eventName']}")
                continue

            # Extract new image from DynamoDB Stream record
            new_image = record['dynamodb']['NewImage']

            symbol = new_image['symbol']['S']
            timestamp = int(new_image['timestamp']['N'])
            current_price = Decimal(new_image['price']['N'])

            logger.info(f"Processing enrichment for {symbol} at {timestamp}")

            # Query historical prices for this symbol
            response = table.query(
                KeyConditionExpression='symbol = :symbol',
                ExpressionAttributeValues={
                    ':symbol': symbol
                },
                ScanIndexForward=False,  # Most recent first
                Limit=50  # Last 50 records for calculations
            )

            historical_prices = [float(item['price']) for item in response['Items']]

            # Calculate metrics
            ma_10 = Decimal(str(calculate_moving_average(historical_prices, 10)))
            ma_20 = Decimal(str(calculate_moving_average(historical_prices, 20)))
            volatility = Decimal(str(calculate_volatility(historical_prices)))

            # Calculate price change percentage
            if len(historical_prices) > 1:
                previous_price = historical_prices[1]
                price_change_pct = Decimal(str(((float(current_price) - previous_price) / previous_price) * 100))
            else:
                price_change_pct = Decimal('0')

            # Update DynamoDB item with enriched data
            table.update_item(
                Key={
                    'symbol': symbol,
                    'timestamp': timestamp
                },
                UpdateExpression='SET ma_10 = :ma10, ma_20 = :ma20, volatility = :vol, price_change_pct = :pct, enriched = :enriched',
                ExpressionAttributeValues={
                    ':ma10': ma_10,
                    ':ma20': ma_20,
                    ':vol': volatility,
                    ':pct': price_change_pct,
                    ':enriched': True
                }
            )

            logger.info(f"Successfully enriched data for {symbol}: MA10={ma_10}, MA20={ma_20}, Vol={volatility}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} records'
            })
        }

    except Exception as e:
        logger.error(f"Error enriching price data: {str(e)}", exc_info=True)
        raise
```

## File: lambda/webhook_processor/requirements.txt

```text
boto3>=1.26.0
```

## File: lambda/price_enricher/requirements.txt

```text
boto3>=1.26.0
```

## File: requirements.txt

```text
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
```

## File: lib/README.md

```markdown
# Cryptocurrency Price Processing System

A serverless cryptocurrency price processing pipeline built with CDKTF Python that handles real-time webhook ingestion, data enrichment, and storage.

## Architecture

The system consists of:

1. **Webhook Processor Lambda**: Receives price updates from exchanges, validates data, and writes to DynamoDB
2. **Price Enricher Lambda**: Triggered by DynamoDB Streams to add moving averages and volatility metrics
3. **DynamoDB Table**: Stores cryptocurrency prices with partition key 'symbol' and sort key 'timestamp'
4. **KMS Key**: Encrypts Lambda environment variables containing sensitive configuration
5. **SQS Dead Letter Queues**: Captures failed Lambda executions for both functions
6. **SNS Topic**: Receives success notifications via Lambda destinations
7. **CloudWatch Logs**: Monitors both Lambda functions with subscription filters for error detection

## Prerequisites

- Python 3.9 or higher
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Prepare Lambda deployment packages:
```bash
# Create webhook processor package
cd lambda/webhook_processor
pip install -r requirements.txt -t .
zip -r ../webhook_processor.zip .
cd ../..

# Create price enricher package
cd lambda/price_enricher
pip install -r requirements.txt -t .
zip -r ../price_enricher.zip .
cd ../..
```

## Configuration

Set the environment suffix for resource naming:
```bash
export ENVIRONMENT_SUFFIX=dev
```

## Deployment

1. Initialize CDKTF:
```bash
cdktf init
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy the stack:
```bash
cdktf deploy
```

The deployment will output:
- Lambda function ARNs
- DynamoDB table name
- SNS topic ARN
- KMS key ID

## Resource Configuration

### Lambda Functions

- **webhook-processor**:
  - Memory: 1GB
  - Timeout: 60 seconds
  - Architecture: ARM64
  - Reserved Concurrency: 10
  - Runtime: Python 3.11

- **price-enricher**:
  - Memory: 512MB
  - Timeout: 60 seconds
  - Architecture: ARM64
  - Reserved Concurrency: 10
  - Runtime: Python 3.11

### DynamoDB Table

- Billing Mode: On-demand
- Point-in-time Recovery: Enabled
- Streams: Enabled (NEW_AND_OLD_IMAGES)
- Partition Key: symbol (String)
- Sort Key: timestamp (Number)

### CloudWatch Logs

- Retention: 3 days
- Error Pattern Filter: Detects ERROR, Error, error, exception, Exception

### Dead Letter Queues

- Message Retention: 4 days (345600 seconds)
- Separate queues for each Lambda function

## Testing

### Test Webhook Processor

Invoke the webhook processor Lambda with sample data:
```bash
aws lambda invoke \
  --function-name webhook-processor-$ENVIRONMENT_SUFFIX \
  --payload '{"symbol":"BTC","price":50000.00,"exchange":"binance"}' \
  response.json
```

### Monitor DynamoDB Stream Processing

Check CloudWatch Logs for the price-enricher function:
```bash
aws logs tail /aws/lambda/price-enricher-$ENVIRONMENT_SUFFIX --follow
```

### Check Dead Letter Queues

Monitor failed messages:
```bash
aws sqs receive-message \
  --queue-url $(aws sqs get-queue-url --queue-name webhook-processor-dlq-$ENVIRONMENT_SUFFIX --query 'QueueUrl' --output text)
```

## Cost Optimization

The system is optimized for cost:
- ARM64 Lambda architecture (20% cost savings)
- On-demand DynamoDB billing (pay per request)
- 3-day CloudWatch Logs retention
- Serverless architecture (no idle resources)
- Reserved concurrency prevents runaway costs

## Security

- Customer-managed KMS key for environment variable encryption
- Least-privilege IAM roles for each Lambda function
- DynamoDB and KMS access scoped to specific resources
- CloudWatch Logs for audit trail

## Monitoring

Monitor the system health:
- CloudWatch Logs for both Lambda functions
- DynamoDB metrics for table performance
- SQS metrics for dead letter queue depth
- SNS for success notifications

Set up CloudWatch Alarms:
```bash
# Example: Alert on DLQ messages
aws cloudwatch put-metric-alarm \
  --alarm-name crypto-processor-dlq-alert \
  --metric-name ApproximateNumberOfMessagesVisible \
  --namespace AWS/SQS \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/webhook-processor-$ENVIRONMENT_SUFFIX --follow
```

### DynamoDB Stream Issues

Verify stream is enabled:
```bash
aws dynamodb describe-table --table-name crypto-prices-$ENVIRONMENT_SUFFIX
```

### KMS Decryption Failures

Ensure Lambda execution role has KMS decrypt permissions:
```bash
aws kms list-grants --key-id <key-id>
```

## Additional Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
```
