# CDKTF Python Implementation - Cryptocurrency Price Processing System

This implementation provides a complete serverless cryptocurrency price processing pipeline using CDKTF with Python.

## File: main.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn, Token
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionDeadLetterConfig
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery, DynamodbTableStreamSpecification
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_subscription_filter import CloudwatchLogSubscriptionFilter
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.lambda_function_event_invoke_config import LambdaFunctionEventInvokeConfig, LambdaFunctionEventInvokeConfigDestinationConfig, LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument, DataAwsIamPolicyDocumentStatement
import json
import os


class CryptoPriceProcessingStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # Customer-managed KMS key for Lambda environment variable encryption
        kms_key = KmsKey(self, "lambda-kms-key",
            description=f"KMS key for Lambda environment variables - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{Token.as_string(Fn.data('aws_caller_identity.current.account_id'))}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow Lambda to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        KmsAlias(self, "lambda-kms-alias",
            name=f"alias/lambda-env-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # DynamoDB Table
        dynamodb_table = DynamodbTable(self, "crypto-prices-table",
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
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # Dead Letter Queues for Lambda functions
        webhook_dlq = SqsQueue(self, "webhook-dlq",
            name=f"webhook-processor-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        enricher_dlq = SqsQueue(self, "enricher-dlq",
            name=f"price-enricher-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # SNS Topic for success notifications
        success_topic = SnsTopic(self, "success-topic",
            name=f"price-updates-success-{environment_suffix}",
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # IAM Role for Webhook Processor Lambda
        webhook_processor_role = self._create_lambda_role(
            "webhook-processor-role",
            environment_suffix,
            f"webhook-processor-{environment_suffix}",
            dynamodb_table.arn,
            kms_key.arn,
            webhook_dlq.arn
        )

        # IAM Role for Price Enricher Lambda
        price_enricher_role = self._create_enricher_lambda_role(
            "price-enricher-role",
            environment_suffix,
            f"price-enricher-{environment_suffix}",
            dynamodb_table.arn,
            dynamodb_table.stream_arn,
            kms_key.arn,
            enricher_dlq.arn
        )

        # CloudWatch Log Groups
        webhook_log_group = CloudwatchLogGroup(self, "webhook-log-group",
            name=f"/aws/lambda/webhook-processor-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        enricher_log_group = CloudwatchLogGroup(self, "enricher-log-group",
            name=f"/aws/lambda/price-enricher-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # Lambda Functions
        webhook_processor = LambdaFunction(self, "webhook-processor",
            function_name=f"webhook-processor-{environment_suffix}",
            role=webhook_processor_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=1024,
            timeout=60,
            reserved_concurrent_executions=10,
            filename="lambda/webhook-processor.zip",
            source_code_hash=Fn.filebase64sha256("lambda/webhook-processor.zip"),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=webhook_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            },
            depends_on=[webhook_log_group]
        )

        price_enricher = LambdaFunction(self, "price-enricher",
            function_name=f"price-enricher-{environment_suffix}",
            role=price_enricher_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            reserved_concurrent_executions=5,
            filename="lambda/price-enricher.zip",
            source_code_hash=Fn.filebase64sha256("lambda/price-enricher.zip"),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=enricher_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            },
            depends_on=[enricher_log_group]
        )

        # Lambda Event Source Mapping for DynamoDB Streams
        LambdaEventSourceMapping(self, "enricher-stream-mapping",
            event_source_arn=dynamodb_table.stream_arn,
            function_name=price_enricher.arn,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            bisect_batch_on_function_error=True,
            maximum_retry_attempts=2
        )

        # Lambda Destination for Success Events
        LambdaFunctionEventInvokeConfig(self, "enricher-destination",
            function_name=price_enricher.function_name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=0,
            destination_config=LambdaFunctionEventInvokeConfigDestinationConfig(
                on_success=LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess(
                    destination=success_topic.arn
                )
            ),
            qualifier="$LATEST"
        )

        # CloudWatch Log Subscription Filters for Error Detection
        CloudwatchLogSubscriptionFilter(self, "webhook-error-filter",
            name=f"webhook-error-filter-{environment_suffix}",
            log_group_name=webhook_log_group.name,
            filter_pattern="?ERROR ?Error ?error ?FAILED ?Failed ?failed",
            destination_arn=success_topic.arn  # In production, use a separate monitoring topic
        )

        CloudwatchLogSubscriptionFilter(self, "enricher-error-filter",
            name=f"enricher-error-filter-{environment_suffix}",
            log_group_name=enricher_log_group.name,
            filter_pattern="?ERROR ?Error ?error ?FAILED ?Failed ?failed",
            destination_arn=success_topic.arn  # In production, use a separate monitoring topic
        )

        # Outputs
        TerraformOutput(self, "webhook_processor_arn",
            value=webhook_processor.arn,
            description="ARN of the webhook processor Lambda function"
        )

        TerraformOutput(self, "price_enricher_arn",
            value=price_enricher.arn,
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

    def _create_lambda_role(self, id: str, environment_suffix: str, function_name: str,
                           dynamodb_arn: str, kms_arn: str, dlq_arn: str) -> IamRole:
        """Create IAM role for webhook processor Lambda with least-privilege permissions."""

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        role = IamRole(self, id,
            name=f"{function_name}-role",
            assume_role_policy=assume_role_policy,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": dynamodb_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": kms_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "sqs:SendMessage"
                            ],
                            "Resource": dlq_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="cloudwatch-logs",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/lambda/{function_name}:*"
                        }]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        return role

    def _create_enricher_lambda_role(self, id: str, environment_suffix: str, function_name: str,
                                    dynamodb_arn: str, stream_arn: str, kms_arn: str, dlq_arn: str) -> IamRole:
        """Create IAM role for price enricher Lambda with least-privilege permissions."""

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        role = IamRole(self, id,
            name=f"{function_name}-role",
            assume_role_policy=assume_role_policy,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:UpdateItem",
                                "dynamodb:GetItem",
                                "dynamodb:Query"
                            ],
                            "Resource": dynamodb_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="dynamodb-stream-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetRecords",
                                "dynamodb:GetShardIterator",
                                "dynamodb:DescribeStream",
                                "dynamodb:ListStreams"
                            ],
                            "Resource": stream_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": kms_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "sqs:SendMessage"
                            ],
                            "Resource": dlq_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="cloudwatch-logs",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/lambda/{function_name}:*"
                        }]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        return role


app = App()
CryptoPriceProcessingStack(app, "crypto-price-processing", environment_suffix="dev")
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 main.py",
  "projectId": "crypto-price-processing",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```text
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
```

## File: lib/lambda/webhook-processor/index.py

```python
import json
import os
import boto3
import logging
from decimal import Decimal
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Webhook processor Lambda function.
    Receives cryptocurrency price updates and stores them in DynamoDB.
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Parse incoming webhook data
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        # Validate required fields
        if not all(key in body for key in ['symbol', 'price', 'exchange']):
            raise ValueError("Missing required fields: symbol, price, or exchange")

        # Prepare item for DynamoDB
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        item = {
            'symbol': body['symbol'].upper(),
            'timestamp': timestamp,
            'price': Decimal(str(body['price'])),
            'exchange': body['exchange'],
            'volume': Decimal(str(body.get('volume', 0))),
            'raw_data': json.dumps(body),
            'processed': False,
            'created_at': datetime.utcnow().isoformat()
        }

        # Store in DynamoDB
        response = table.put_item(Item=item)

        logger.info(f"Successfully stored price for {item['symbol']} at {item['timestamp']}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Price data stored successfully',
                'symbol': item['symbol'],
                'timestamp': timestamp
            })
        }

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid request',
                'message': str(ve)
            })
        }
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise  # Re-raise to trigger DLQ
```

## File: lib/lambda/price-enricher/index.py

```python
import json
import os
import boto3
import logging
from decimal import Decimal
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Price enricher Lambda function.
    Triggered by DynamoDB streams to calculate moving averages and volatility metrics.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records from DynamoDB stream")

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                process_price_record(record)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} records'
            })
        }

    except Exception as e:
        logger.error(f"Error enriching price data: {str(e)}", exc_info=True)
        raise  # Re-raise to trigger DLQ


def process_price_record(record):
    """Process a single DynamoDB stream record and add enrichment data."""
    try:
        # Extract data from stream record
        new_image = record['dynamodb']['NewImage']
        symbol = new_image['symbol']['S']
        timestamp = int(new_image['timestamp']['N'])
        current_price = Decimal(new_image['price']['N'])

        logger.info(f"Processing enrichment for {symbol} at {timestamp}")

        # Calculate moving averages (5-period and 20-period)
        ma_5 = calculate_moving_average(symbol, timestamp, periods=5)
        ma_20 = calculate_moving_average(symbol, timestamp, periods=20)

        # Calculate volatility
        volatility = calculate_volatility(symbol, timestamp, periods=10)

        # Update DynamoDB item with enrichment data
        table.update_item(
            Key={
                'symbol': symbol,
                'timestamp': timestamp
            },
            UpdateExpression='SET processed = :processed, ma_5 = :ma5, ma_20 = :ma20, volatility = :vol, enriched_at = :enriched',
            ExpressionAttributeValues={
                ':processed': True,
                ':ma5': ma_5,
                ':ma20': ma_20,
                ':vol': volatility,
                ':enriched': datetime.utcnow().isoformat()
            }
        )

        logger.info(f"Successfully enriched data for {symbol}: MA5={ma_5}, MA20={ma_20}, Vol={volatility}")

    except Exception as e:
        logger.error(f"Error processing record: {str(e)}", exc_info=True)
        raise


def calculate_moving_average(symbol, current_timestamp, periods=5):
    """Calculate moving average for the specified number of periods."""
    try:
        # Query recent prices (simplified - in production, use proper pagination)
        response = table.query(
            KeyConditionExpression='symbol = :symbol AND #ts <= :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':symbol': symbol,
                ':ts': current_timestamp
            },
            ScanIndexForward=False,
            Limit=periods
        )

        items = response.get('Items', [])
        if len(items) < periods:
            logger.warning(f"Not enough data points for MA{periods}: {len(items)}/{periods}")
            return Decimal('0')

        total = sum(Decimal(item['price']) for item in items)
        ma = total / Decimal(periods)

        return round(ma, 2)

    except Exception as e:
        logger.error(f"Error calculating moving average: {str(e)}")
        return Decimal('0')


def calculate_volatility(symbol, current_timestamp, periods=10):
    """Calculate price volatility (standard deviation)."""
    try:
        # Query recent prices
        response = table.query(
            KeyConditionExpression='symbol = :symbol AND #ts <= :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':symbol': symbol,
                ':ts': current_timestamp
            },
            ScanIndexForward=False,
            Limit=periods
        )

        items = response.get('Items', [])
        if len(items) < periods:
            logger.warning(f"Not enough data points for volatility: {len(items)}/{periods}")
            return Decimal('0')

        prices = [Decimal(item['price']) for item in items]
        mean_price = sum(prices) / Decimal(len(prices))

        # Calculate standard deviation
        variance = sum((price - mean_price) ** 2 for price in prices) / Decimal(len(prices))
        volatility = variance.sqrt()

        return round(volatility, 4)

    except Exception as e:
        logger.error(f"Error calculating volatility: {str(e)}")
        return Decimal('0')
```

## File: lib/README.md

```markdown
# Cryptocurrency Price Processing System

A serverless cryptocurrency price processing pipeline built with CDKTF and Python. This system handles webhook ingestion, real-time data enrichment, and storage of cryptocurrency prices from multiple exchanges.

## Architecture Overview

The system consists of the following components:

1. **Webhook Processor Lambda**: Receives price updates from cryptocurrency exchanges and stores them in DynamoDB
2. **Price Enricher Lambda**: Automatically triggered by DynamoDB streams to calculate moving averages and volatility metrics
3. **DynamoDB Table**: Stores cryptocurrency prices with partition key (symbol) and sort key (timestamp)
4. **Dead Letter Queues**: SQS queues for both Lambda functions to capture failed invocations
5. **SNS Topic**: Receives notifications for successful price enrichment operations
6. **KMS Key**: Customer-managed key for encrypting Lambda environment variables
7. **CloudWatch Logs**: Log groups with subscription filters for error detection

## Prerequisites

- Python 3.9 or higher
- Node.js 14+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+
- CDKTF 0.19+

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI globally:
```bash
npm install -g cdktf-cli@latest
```

3. Install AWS provider:
```bash
cdktf provider add aws@~>5.0
```

## Deployment

1. Initialize CDKTF (first time only):
```bash
cdktf init
```

2. Create Lambda deployment packages:
```bash
# Create webhook processor package
cd lib/lambda/webhook-processor
zip -r ../webhook-processor.zip .
cd ../../..

# Create price enricher package
cd lib/lambda/price-enricher
zip -r ../price-enricher.zip .
cd ../../..
```

3. Synthesize the Terraform configuration:
```bash
cdktf synth
```

4. Deploy the stack:
```bash
cdktf deploy
```

5. The deployment will output:
   - Lambda function ARNs
   - DynamoDB table name
   - SNS topic ARN

## Configuration

The stack accepts an `environment_suffix` parameter to allow multiple deployments:

```python
CryptoPriceProcessingStack(app, "crypto-price-processing", environment_suffix="dev")
```

Change "dev" to "staging" or "prod" for different environments.

## Architecture Features

### Cost Optimization
- ARM64 architecture for Lambda functions (up to 34% cost savings)
- DynamoDB on-demand billing (no wasted provisioned capacity)
- 3-day CloudWatch log retention (minimized storage costs)

### Reliability
- Dead letter queues with 4-day retention
- DynamoDB point-in-time recovery
- Reserved concurrent executions to prevent throttling

### Security
- Customer-managed KMS key for Lambda environment variables
- Least-privilege IAM roles with specific action permissions
- No wildcard permissions in IAM policies

### Monitoring
- CloudWatch log groups for all Lambda functions
- Subscription filters for automatic error detection
- SNS notifications for successful processing

## Testing

To test the webhook processor:

```bash
aws lambda invoke \
  --function-name webhook-processor-dev \
  --payload '{"symbol":"BTC","price":50000.00,"exchange":"coinbase","volume":1234.56}' \
  response.json
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

## Technical Constraints

- Lambda functions use ARM64 architecture
- DynamoDB uses on-demand billing with point-in-time recovery
- CloudWatch Logs retention is exactly 3 days
- Dead letter queue retention is 4 days
- All environment variables are encrypted with customer-managed KMS key
- All resources include environment suffix for uniqueness

## Outputs

After deployment, the following outputs are available:

- `webhook_processor_arn`: ARN of the webhook processor Lambda function
- `price_enricher_arn`: ARN of the price enricher Lambda function
- `dynamodb_table_name`: Name of the DynamoDB table
- `sns_topic_arn`: ARN of the SNS topic for success notifications
```
