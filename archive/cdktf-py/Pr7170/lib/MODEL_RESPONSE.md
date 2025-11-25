# Market Data Processing System - CDKTF Python Implementation

This implementation provides a complete serverless real-time market data processing system using CDKTF with Python.

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue as DeadLetterQueue
import json


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # KMS Key for Lambda environment variables
        self.kms_key = KmsKey(self, "lambda_kms_key",
            description=f"KMS key for Lambda environment variables - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"lambda-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        KmsAlias(self, "lambda_kms_alias",
            name=f"alias/lambda-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # Dead Letter Queue for failed messages
        self.dead_letter_queue = DeadLetterQueue(self, "market_data_dlq",
            name=f"market-data-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={
                "Name": f"market-data-dlq-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # SQS Queue for market data
        self.sqs_queue = SqsQueue(self, "market_data_queue",
            name=f"market-data-queue-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=360,  # 6 times Lambda timeout
            redrive_policy=json.dumps({
                "deadLetterTargetArn": self.dead_letter_queue.arn,
                "maxReceiveCount": 3
            }),
            tags={
                "Name": f"market-data-queue-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # DynamoDB Table for market alerts
        self.dynamodb_table = DynamodbTable(self, "market_alerts_table",
            name=f"market-alerts-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="symbol",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="symbol", type="S"),
                DynamodbTableAttribute(name="timestamp", type="S")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            tags={
                "Name": f"market-alerts-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # SNS Topic for trading alerts
        self.sns_topic = SnsTopic(self, "trading_alerts_topic",
            name=f"trading-alerts-{environment_suffix}",
            tags={
                "Name": f"trading-alerts-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # IAM Role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Lambda Function
        self.lambda_function = LambdaFunction(self, "data_processor",
            function_name=f"data-processor-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            filename="lambda_function.zip",
            source_code_hash=Fn.filebase64sha256("lambda_function.zip"),
            role=self.lambda_role.arn,
            memory_size=3072,
            timeout=60,
            architectures=["arm64"],
            reserved_concurrent_executions=5,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags={
                "Name": f"data-processor-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # Lambda Event Source Mapping
        self.event_source_mapping = LambdaEventSourceMapping(self, "sqs_trigger",
            event_source_arn=self.sqs_queue.arn,
            function_name=self.lambda_function.function_name,
            batch_size=25,
            enabled=True
        )

        # CloudWatch Alarm for Lambda errors
        self.error_alarm = CloudwatchMetricAlarm(self, "lambda_error_alarm",
            alarm_name=f"data-processor-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=0.01,  # 1% error rate
            alarm_description="Alert when Lambda error rate exceeds 1%",
            dimensions={
                "FunctionName": self.lambda_function.function_name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"data-processor-errors-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # Outputs
        TerraformOutput(self, "sqs_queue_url",
            value=self.sqs_queue.url,
            description="SQS Queue URL for market data"
        )

        TerraformOutput(self, "sns_topic_arn",
            value=self.sns_topic.arn,
            description="SNS Topic ARN for trading alerts"
        )

        TerraformOutput(self, "dynamodb_table_name",
            value=self.dynamodb_table.name,
            description="DynamoDB table name for market alerts"
        )

        TerraformOutput(self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Lambda function name"
        )

    def _create_lambda_role(self) -> IamRole:
        """Create IAM role for Lambda with required permissions"""

        # Trust policy for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }
            ]
        }

        # Inline policy with specific permissions
        inline_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": self.sqs_queue.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": self.dynamodb_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": self.sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": self.kms_key.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }

        role = IamRole(self, "lambda_role",
            name=f"data-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-permissions",
                    policy=json.dumps(inline_policy)
                )
            ],
            tags={
                "Name": f"data-processor-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        return role
```

## File: lib/lambda/index.py

```python
import json
import boto3
import os
import time
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'market-alerts')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)

# Price thresholds for alerts
PRICE_THRESHOLD_HIGH = 150.0
PRICE_THRESHOLD_LOW = 50.0


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing market data messages

    Args:
        event: SQS event with market data messages
        context: Lambda context

    Returns:
        Dict with batch item failures for retry
    """
    batch_item_failures = []

    for record in event.get('Records', []):
        message_id = record.get('messageId')

        try:
            # Parse message body
            body = json.loads(record.get('body', '{}'))

            # Process the market data
            process_market_data(body)

        except Exception as e:
            print(f"Error processing message {message_id}: {str(e)}")
            # Add to batch failures for retry with exponential backoff
            batch_item_failures.append({
                'itemIdentifier': message_id
            })

    # Return failed messages for retry
    return {
        'batchItemFailures': batch_item_failures
    }


def process_market_data(data: Dict[str, Any]) -> None:
    """
    Process market data and create alerts if thresholds are met

    Args:
        data: Market data dictionary with symbol and price
    """
    symbol = data.get('symbol')
    price = float(data.get('price', 0))
    timestamp = datetime.utcnow().isoformat()

    # Check if price crosses thresholds
    should_alert = False
    alert_type = None

    if price > PRICE_THRESHOLD_HIGH:
        should_alert = True
        alert_type = 'HIGH'
    elif price < PRICE_THRESHOLD_LOW:
        should_alert = True
        alert_type = 'LOW'

    if should_alert:
        # Write to DynamoDB with exponential backoff
        write_to_dynamodb_with_retry(symbol, timestamp, price, alert_type)

        # Publish to SNS with exponential backoff
        publish_to_sns_with_retry(symbol, price, alert_type)


def write_to_dynamodb_with_retry(
    symbol: str,
    timestamp: str,
    price: float,
    alert_type: str,
    max_retries: int = 3
) -> None:
    """
    Write alert to DynamoDB with exponential backoff retry logic

    Args:
        symbol: Stock symbol
        timestamp: ISO format timestamp
        price: Current price
        alert_type: Type of alert (HIGH or LOW)
        max_retries: Maximum number of retry attempts
    """
    for attempt in range(max_retries):
        try:
            table.put_item(
                Item={
                    'symbol': symbol,
                    'timestamp': timestamp,
                    'price': Decimal(str(price)),
                    'alert_type': alert_type,
                    'environment': ENVIRONMENT
                }
            )
            print(f"Successfully wrote alert for {symbol} to DynamoDB")
            return
        except Exception as e:
            wait_time = (2 ** attempt) + (time.time() % 1)  # Exponential backoff with jitter
            print(f"DynamoDB write attempt {attempt + 1} failed: {str(e)}")

            if attempt < max_retries - 1:
                print(f"Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Failed to write to DynamoDB after {max_retries} attempts")
                raise


def publish_to_sns_with_retry(
    symbol: str,
    price: float,
    alert_type: str,
    max_retries: int = 3
) -> None:
    """
    Publish alert to SNS with exponential backoff retry logic

    Args:
        symbol: Stock symbol
        price: Current price
        alert_type: Type of alert (HIGH or LOW)
        max_retries: Maximum number of retry attempts
    """
    message = {
        'symbol': symbol,
        'price': price,
        'alert_type': alert_type,
        'timestamp': datetime.utcnow().isoformat()
    }

    for attempt in range(max_retries):
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"Trading Alert: {symbol} - {alert_type}",
                Message=json.dumps(message, indent=2)
            )
            print(f"Successfully published alert for {symbol} to SNS")
            return
        except Exception as e:
            wait_time = (2 ** attempt) + (time.time() % 1)  # Exponential backoff with jitter
            print(f"SNS publish attempt {attempt + 1} failed: {str(e)}")

            if attempt < max_retries - 1:
                print(f"Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Failed to publish to SNS after {max_retries} attempts")
                raise
```

## File: bin/tap.py

```python
#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

TapStack(app, "tap", environment_suffix=environment_suffix)

app.synth()
```

## File: lib/README.md

```markdown
# Market Data Processing System

A serverless real-time market data processing system built with CDKTF and Python.

## Architecture

- **Lambda Function**: Processes market data messages from SQS queue
- **DynamoDB**: Stores market alerts with point-in-time recovery
- **SNS**: Sends notifications for trading alerts
- **SQS**: Message queue with 14-day retention and dead-letter queue
- **KMS**: Encrypts Lambda environment variables
- **CloudWatch**: Monitors Lambda error rates

## Prerequisites

- Python 3.11+
- Node.js 18+
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

1. Set environment suffix (optional):
```bash
export ENVIRONMENT_SUFFIX=dev
```

2. Create Lambda deployment package:
```bash
cd lib/lambda
zip ../../lambda_function.zip index.py
cd ../..
```

3. Synthesize CDKTF stack:
```bash
cdktf synth
```

4. Deploy infrastructure:
```bash
cdktf deploy
```

## Configuration

The stack accepts an `environment_suffix` parameter for multi-environment deployments:

```python
TapStack(app, "tap", environment_suffix="prod")
```

All resources will be named with this suffix for uniqueness.

## Testing

### Unit Tests

Test Lambda function:
```bash
pytest tests/unit/test_lambda_function.py -v --cov=lib/lambda --cov-report=term-missing
```

Test infrastructure stack:
```bash
pytest tests/unit/test_tap_stack.py -v --cov=lib --cov-report=term-missing
```

### Integration Tests

Run after deployment:
```bash
pytest tests/integration/test_deployment.py -v
```

## Outputs

After deployment, the following outputs are available:

- `sqs_queue_url`: SQS queue URL for sending market data
- `sns_topic_arn`: SNS topic ARN for alert subscriptions
- `dynamodb_table_name`: DynamoDB table name for querying alerts
- `lambda_function_name`: Lambda function name

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

All resources are configured for complete removal without retention.

## Monitoring

CloudWatch alarm monitors Lambda error rate:
- Threshold: 1% error rate
- Period: 5 minutes
- Metric: Lambda Errors

View logs:
```bash
aws logs tail /aws/lambda/data-processor-{environmentSuffix} --follow
```

## Cost Optimization

- Lambda uses ARM64 architecture (Graviton2) for 20% cost savings
- DynamoDB uses on-demand billing
- Reserved concurrency set to 5 to prevent runaway costs
- SQS dead-letter queue prevents infinite retry loops
```

## File: requirements.txt

```text
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=18.0.0
constructs>=10.0.0
boto3>=1.28.0
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-mock>=3.11.0
moto>=4.2.0
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python bin/tap.py",
  "projectId": "c4e6q1",
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
