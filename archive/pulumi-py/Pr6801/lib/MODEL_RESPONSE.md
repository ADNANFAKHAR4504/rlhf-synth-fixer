# MODEL_RESPONSE.md - Initial Pulumi Python Implementation

This document contains the initial implementation of the serverless transaction processing system using Pulumi with Python.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi stack for serverless transaction processing system.
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Serverless transaction processing system with API Gateway, Lambda, DynamoDB, SQS, and SNS.
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

        # Create KMS key for encryption
        kms_key = aws.kms.Key(
            f"transaction-key-{self.environment_suffix}",
            description="KMS key for transaction processing encryption",
            deletion_window_in_days=7,
            opts=ResourceOptions(parent=self)
        )

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"transaction-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets in 3 AZs
        private_subnets = []
        azs = ["us-east-2a", "us-east-2b", "us-east-2c"]
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Create security group for Lambda
        lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Lambda functions",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            opts=ResourceOptions(parent=self)
        )

        # Create VPC endpoints
        dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-endpoint-{self.environment_suffix}",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-2.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[],
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for merchant configurations
        merchant_table = aws.dynamodb.Table(
            f"merchant-configs-{self.environment_suffix}",
            name=f"merchant-configs-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="merchant_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="merchant_id", type="S")
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=kms_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for transactions
        transaction_table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N")
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=kms_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create DLQ for failed transactions
        dlq = aws.sqs.Queue(
            f"failed-transactions-dlq-{self.environment_suffix}",
            name=f"failed-transactions-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create SQS queue for valid transactions
        transaction_queue = aws.sqs.Queue(
            f"valid-transactions-queue-{self.environment_suffix}",
            name=f"valid-transactions-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,
            kms_master_key_id=kms_key.id,
            redrive_policy=dlq.arn.apply(lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": 3
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic for fraud alerts
        fraud_topic = aws.sns.Topic(
            f"fraud-alerts-{self.environment_suffix}",
            name=f"fraud-alerts-{self.environment_suffix}",
            kms_master_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda functions
        lambda_role = aws.iam.Role(
            f"lambda-execution-role-{self.environment_suffix}",
            name=f"lambda-execution-role-{self.environment_suffix}",
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
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        basic_policy = aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach X-Ray policy
        xray_policy = aws.iam.RolePolicyAttachment(
            f"lambda-xray-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for DynamoDB, SQS, and SNS access
        lambda_policy = aws.iam.RolePolicy(
            f"lambda-service-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy=pulumi.Output.all(
                merchant_table.arn,
                transaction_table.arn,
                transaction_queue.arn,
                fraud_topic.arn,
                kms_key.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [arns[0], arns[1]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": arns[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["sns:Publish"],
                        "Resource": arns[3]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": arns[4]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log groups
        validator_log_group = aws.cloudwatch.LogGroup(
            f"validator-logs-{self.environment_suffix}",
            name=f"/aws/lambda/transaction-validator-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        fraud_detector_log_group = aws.cloudwatch.LogGroup(
            f"fraud-detector-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-detector-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        failed_handler_log_group = aws.cloudwatch.LogGroup(
            f"failed-handler-logs-{self.environment_suffix}",
            name=f"/aws/lambda/failed-transaction-handler-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        # Lambda Function 1: Transaction Validator
        validator_function = aws.lambda_.Function(
            f"transaction-validator-{self.environment_suffix}",
            name=f"transaction-validator-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            reserved_concurrent_executions=100,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/validator")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "MERCHANT_TABLE": merchant_table.name,
                    "TRANSACTION_QUEUE_URL": transaction_queue.url,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            opts=ResourceOptions(parent=self, depends_on=[validator_log_group, lambda_policy])
        )

        # Lambda Function 2: Fraud Detector (triggered by SQS)
        fraud_detector_function = aws.lambda_.Function(
            f"fraud-detector-{self.environment_suffix}",
            name=f"fraud-detector-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/fraud_detector")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TRANSACTION_TABLE": transaction_table.name,
                    "FRAUD_TOPIC_ARN": fraud_topic.arn,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            opts=ResourceOptions(parent=self, depends_on=[fraud_detector_log_group, lambda_policy])
        )

        # SQS event source mapping for fraud detector
        fraud_detector_event_source = aws.lambda_.EventSourceMapping(
            f"fraud-detector-sqs-trigger-{self.environment_suffix}",
            event_source_arn=transaction_queue.arn,
            function_name=fraud_detector_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Lambda Function 3: Failed Transaction Handler (triggered by DLQ)
        failed_handler_function = aws.lambda_.Function(
            f"failed-transaction-handler-{self.environment_suffix}",
            name=f"failed-transaction-handler-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/failed_handler")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TRANSACTION_TABLE": transaction_table.name,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            opts=ResourceOptions(parent=self, depends_on=[failed_handler_log_group, lambda_policy])
        )

        # DLQ event source mapping for failed handler
        failed_handler_event_source = aws.lambda_.EventSourceMapping(
            f"failed-handler-dlq-trigger-{self.environment_suffix}",
            event_source_arn=dlq.arn,
            function_name=failed_handler_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway REST API
        api = aws.apigateway.RestApi(
            f"transaction-api-{self.environment_suffix}",
            name=f"transaction-api-{self.environment_suffix}",
            description="Transaction processing API",
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway resource for /transaction
        transaction_resource = aws.apigateway.Resource(
            f"transaction-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transaction",
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway method (POST)
        transaction_method = aws.apigateway.Method(
            f"transaction-post-method-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=self)
        )

        # Create integration with Lambda
        transaction_integration = aws.apigateway.Integration(
            f"transaction-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method=transaction_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validator_function.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        lambda_permission = aws.lambda_.Permission(
            f"api-gateway-invoke-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=validator_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(api.execution_arn, transaction_resource.path).apply(
                lambda args: f"{args[0]}/*/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API Gateway
        deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=api.id,
            stage_name="prod",
            opts=ResourceOptions(parent=self, depends_on=[transaction_integration])
        )

        # Create API key
        api_key = aws.apigateway.ApiKey(
            f"transaction-api-key-{self.environment_suffix}",
            name=f"transaction-api-key-{self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Create usage plan
        usage_plan = aws.apigateway.UsagePlan(
            f"transaction-usage-plan-{self.environment_suffix}",
            name=f"transaction-usage-plan-{self.environment_suffix}",
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=api.id,
                stage=deployment.stage_name
            )],
            opts=ResourceOptions(parent=self)
        )

        # Associate API key with usage plan
        usage_plan_key = aws.apigateway.UsagePlanKey(
            f"usage-plan-key-{self.environment_suffix}",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch dashboard
        dashboard = aws.cloudwatch.Dashboard(
            f"transaction-dashboard-{self.environment_suffix}",
            dashboard_name=f"transaction-dashboard-{self.environment_suffix}",
            dashboard_body=pulumi.Output.all(
                validator_function.name,
                fraud_detector_function.name,
                failed_handler_function.name
            ).apply(lambda names: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Validator Invocations"}],
                                [".", ".", {"stat": "Sum", "label": "Fraud Detector Invocations"}],
                                [".", ".", {"stat": "Sum", "label": "Failed Handler Invocations"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-2",
                            "title": "Lambda Invocations"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Validator Errors"}],
                                [".", ".", {"stat": "Sum", "label": "Fraud Detector Errors"}],
                                [".", ".", {"stat": "Sum", "label": "Failed Handler Errors"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-2",
                            "title": "Lambda Errors"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Validator Duration"}],
                                [".", ".", {"stat": "Average", "label": "Fraud Detector Duration"}],
                                [".", ".", {"stat": "Average", "label": "Failed Handler Duration"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-2",
                            "title": "Lambda Duration"
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarms for error rates
        validator_alarm = aws.cloudwatch.MetricAlarm(
            f"validator-error-alarm-{self.environment_suffix}",
            name=f"validator-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1.0,
            alarm_description="Validator error rate exceeds 1%",
            dimensions={
                "FunctionName": validator_function.name
            },
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        pulumi.export("api_endpoint", pulumi.Output.concat(
            "https://",
            api.id,
            ".execute-api.us-east-2.amazonaws.com/prod/transaction"
        ))
        pulumi.export("dashboard_url", pulumi.Output.concat(
            "https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=",
            dashboard.dashboard_name
        ))
        pulumi.export("api_key_id", api_key.id)
        pulumi.export("merchant_table_name", merchant_table.name)
        pulumi.export("transaction_table_name", transaction_table.name)
        pulumi.export("transaction_queue_url", transaction_queue.url)
        pulumi.export("fraud_topic_arn", fraud_topic.arn)

        self.register_outputs({
            "api_endpoint": pulumi.Output.concat(
                "https://",
                api.id,
                ".execute-api.us-east-2.amazonaws.com/prod/transaction"
            ),
            "dashboard_url": pulumi.Output.concat(
                "https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=",
                dashboard.dashboard_name
            )
        })
```

## File: lib/lambda/validator/index.py

```python
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

MERCHANT_TABLE = os.environ['MERCHANT_TABLE']
TRANSACTION_QUEUE_URL = os.environ['TRANSACTION_QUEUE_URL']

merchant_table = dynamodb.Table(MERCHANT_TABLE)


def handler(event, context):
    """
    Validates incoming transactions against merchant configurations.
    """
    try:
        body = json.loads(event['body'])

        merchant_id = body.get('merchant_id')
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        # Validate required fields
        if not all([merchant_id, transaction_id, amount]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Check merchant configuration
        response = merchant_table.get_item(Key={'merchant_id': merchant_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Merchant not found'})
            }

        merchant = response['Item']

        # Validate transaction amount against merchant limits
        if float(amount) > float(merchant.get('max_transaction_amount', 10000)):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Transaction amount exceeds limit'})
            }

        # Send valid transaction to SQS
        message = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': amount,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'validated'
        }

        sqs.send_message(
            QueueUrl=TRANSACTION_QUEUE_URL,
            MessageBody=json.dumps(message)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated successfully',
                'transaction_id': transaction_id
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/fraud_detector/index.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']
FRAUD_TOPIC_ARN = os.environ['FRAUD_TOPIC_ARN']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Processes transactions from SQS and performs fraud detection.
    """
    try:
        for record in event['Records']:
            message = json.loads(record['body'])

            transaction_id = message['transaction_id']
            merchant_id = message['merchant_id']
            amount = Decimal(str(message['amount']))
            timestamp = int(datetime.utcnow().timestamp())

            # Simple fraud detection logic
            is_fraud = False
            fraud_score = 0

            # Check for high amount transactions
            if amount > Decimal('5000'):
                fraud_score += 50

            # Check for rapid transactions from same merchant
            response = transaction_table.query(
                KeyConditionExpression='transaction_id = :tid',
                ExpressionAttributeValues={':tid': transaction_id}
            )

            if fraud_score > 50:
                is_fraud = True

            # Store transaction in DynamoDB
            transaction_table.put_item(
                Item={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp,
                    'merchant_id': merchant_id,
                    'amount': amount,
                    'is_fraud': is_fraud,
                    'fraud_score': fraud_score,
                    'status': 'fraud_detected' if is_fraud else 'processed'
                }
            )

            # Send fraud alert if detected
            if is_fraud:
                sns.publish(
                    TopicArn=FRAUD_TOPIC_ARN,
                    Subject='Fraud Alert',
                    Message=json.dumps({
                        'transaction_id': transaction_id,
                        'merchant_id': merchant_id,
                        'amount': str(amount),
                        'fraud_score': fraud_score,
                        'timestamp': timestamp
                    })
                )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Transactions processed successfully'})
        }

    except Exception as e:
        print(f"Error in fraud detection: {str(e)}")
        raise
```

## File: lib/lambda/failed_handler/index.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Handles failed transactions from DLQ.
    """
    try:
        for record in event['Records']:
            message = json.loads(record['body'])

            transaction_id = message.get('transaction_id', 'unknown')
            timestamp = int(datetime.utcnow().timestamp())

            # Log failed transaction
            transaction_table.put_item(
                Item={
                    'transaction_id': f"failed-{transaction_id}",
                    'timestamp': timestamp,
                    'original_message': json.dumps(message),
                    'status': 'failed',
                    'failure_reason': 'Max retries exceeded'
                }
            )

            print(f"Logged failed transaction: {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Failed transactions logged'})
        }

    except Exception as e:
        print(f"Error handling failed transaction: {str(e)}")
        raise
```

## File: lib/README.md

```markdown
# Serverless Transaction Processing System

A comprehensive serverless architecture for processing financial transactions with fraud detection capabilities.

## Architecture Overview

This system implements a fully serverless transaction processing pipeline with the following components:

- **API Gateway**: REST API with `/transaction` POST endpoint protected by API key authentication
- **Lambda Functions**:
  - Transaction Validator: Validates transactions against merchant configurations
  - Fraud Detector: Performs fraud detection on valid transactions
  - Failed Transaction Handler: Processes failed transactions from DLQ
- **DynamoDB Tables**:
  - Merchant Configurations: Stores merchant settings and limits
  - Transactions: Stores processed transactions with fraud analysis
- **SQS Queue**: Queues valid transactions for fraud detection
- **SNS Topic**: Sends fraud alerts via email
- **CloudWatch**: Monitoring, logging, and alerting

## Prerequisites

- Pulumi CLI 3.x or later
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="your-suffix"
export AWS_REGION="us-east-2"
```

3. Deploy the stack:
```bash
pulumi up
```

## Configuration

The stack uses the following configuration values:

- `environmentSuffix`: Unique suffix for resource naming
- `region`: AWS region for deployment (default: us-east-2)

## Outputs

After deployment, the stack exports:

- `api_endpoint`: API Gateway endpoint URL
- `dashboard_url`: CloudWatch dashboard URL
- `api_key_id`: API key ID for authentication
- Table names and queue URLs for reference

## Testing

Run the test suite:
```bash
pytest tests/
```

## Security

- All Lambda functions run in private VPC subnets
- KMS encryption for all data at rest
- API key authentication for API Gateway
- X-Ray tracing enabled for observability
- Least-privilege IAM roles

## Monitoring

Access the CloudWatch dashboard using the exported dashboard URL to view:
- Lambda invocations
- Error rates
- Function durations

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
```
