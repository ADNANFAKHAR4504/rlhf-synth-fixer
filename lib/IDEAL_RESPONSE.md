# Serverless Fraud Detection System - CDKTF Python Implementation (Corrected)

This implementation creates a serverless fraud detection system using CDKTF with Python to process financial transactions.

## File: tap.py

```python
#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
region = os.getenv("AWS_REGION") or "us-east-1"

app = App()

# Create stack with environment suffix
TapStack(
    app,
    f"tap-stack-{region}",
    region=region,
    environment_suffix=environment_suffix
)

# Synthesize the app to generate Terraform configuration
app.synth()
```

## File: lib/__init__.py

```python
# Empty file to make lib a package
```

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableTtl
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionTracingConfig, LambdaFunctionDeadLetterConfig
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings, ApiGatewayMethodSettingsSettings
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json
import os
import hashlib


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, region: str, environment_suffix: str):
        super().__init__(scope, id)

        self.region = region
        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws", region=self.region)

        # Create DynamoDB tables
        self.transactions_table = self._create_transactions_table()
        self.fraud_scores_table = self._create_fraud_scores_table()

        # Create SQS Dead Letter Queues
        self.ingestion_dlq = self._create_dlq("transaction-ingestion")
        self.processor_dlq = self._create_dlq("transaction-processor")
        self.scorer_dlq = self._create_dlq("fraud-scorer")

        # Create SNS Topic for fraud alerts
        self.fraud_alerts_topic = self._create_sns_topic()

        # Create IAM roles
        self.ingestion_role = self._create_ingestion_lambda_role()
        self.processor_role = self._create_processor_lambda_role()
        self.scorer_role = self._create_scorer_lambda_role()

        # Create Lambda functions
        self.ingestion_lambda = self._create_transaction_ingestion()
        self.processor_lambda = self._create_transaction_processor()
        self.scorer_lambda = self._create_fraud_scorer()

        # Create DynamoDB Stream trigger
        self._create_stream_trigger()

        # Create API Gateway
        self.api = self._create_api_gateway()

        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()

        # Outputs
        TerraformOutput(self, "api_endpoint",
            value=f"https://{self.api.id}.execute-api.{self.region}.amazonaws.com/prod/transactions",
            description="API Gateway endpoint URL"
        )
        TerraformOutput(self, "transactions_table_name",
            value=self.transactions_table.name,
            description="Transactions DynamoDB table name"
        )
        TerraformOutput(self, "fraud_scores_table_name",
            value=self.fraud_scores_table.name,
            description="Fraud scores DynamoDB table name"
        )
        TerraformOutput(self, "fraud_alerts_topic_arn",
            value=self.fraud_alerts_topic.arn,
            description="SNS topic ARN for fraud alerts"
        )

    def _create_transactions_table(self) -> DynamodbTable:
        """Create transactions DynamoDB table"""
        return DynamodbTable(
            self, "transactions-table",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            stream_enabled=True,
            stream_view_type="NEW_IMAGE",
            tags={"Environment": self.environment_suffix}
        )

    def _create_fraud_scores_table(self) -> DynamodbTable:
        """Create fraud scores DynamoDB table"""
        return DynamodbTable(
            self, "fraud-scores-table",
            name=f"fraud-scores-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S")
            ],
            ttl=DynamodbTableTtl(
                enabled=True,
                attribute_name="expiry"
            ),
            tags={"Environment": self.environment_suffix}
        )

    def _create_dlq(self, function_name: str) -> SqsQueue:
        """Create SQS Dead Letter Queue"""
        return SqsQueue(
            self, f"{function_name}-dlq",
            name=f"{function_name}-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Environment": self.environment_suffix}
        )

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for fraud alerts"""
        return SnsTopic(
            self, "fraud-alerts-topic",
            name=f"fraud-alerts-{self.environment_suffix}",
            tags={"Environment": self.environment_suffix}
        )

    def _create_ingestion_lambda_role(self) -> IamRole:
        """Create IAM role for transaction ingestion Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
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
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": self.transactions_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": self.ingestion_dlq.arn
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
        }

        role = IamRole(
            self, "ingestion-lambda-role",
            name=f"transaction-ingestion-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="ingestion-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_processor_lambda_role(self) -> IamRole:
        """Create IAM role for transaction processor Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
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
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": self.transactions_table.stream_arn
                },
                {
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": self.processor_dlq.arn
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
        }

        role = IamRole(
            self, "processor-lambda-role",
            name=f"transaction-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="processor-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_scorer_lambda_role(self) -> IamRole:
        """Create IAM role for fraud scorer Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
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
                        "dynamodb:Query"
                    ],
                    "Resource": self.fraud_scores_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": ["sns:Publish"],
                    "Resource": self.fraud_alerts_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": self.scorer_dlq.arn
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
        }

        role = IamRole(
            self, "scorer-lambda-role",
            name=f"fraud-scorer-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="scorer-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_transaction_ingestion(self) -> LambdaFunction:
        """Create transaction ingestion Lambda function"""
        # Create CloudWatch Log Group
        CloudwatchLogGroup(
            self, "ingestion-log-group",
            name=f"/aws/lambda/transaction-ingestion-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix}
        )

        # Get the Lambda function code path
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        ingestion_zip = os.path.join(lambda_dir, "transaction-ingestion.zip")

        return LambdaFunction(
            self, "transaction-ingestion",
            function_name=f"transaction-ingestion-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.ingestion_role.arn,
            filename=ingestion_zip,
            source_code_hash=Fn.filebase64sha256(ingestion_zip),
            memory_size=256,
            timeout=30,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TRANSACTIONS_TABLE": self.transactions_table.name,
                    "DLQ_URL": self.ingestion_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.ingestion_dlq.arn
            ),
            tags={"Environment": self.environment_suffix}
        )

    def _create_transaction_processor(self) -> LambdaFunction:
        """Create transaction processor Lambda function"""
        # Create CloudWatch Log Group
        CloudwatchLogGroup(
            self, "processor-log-group",
            name=f"/aws/lambda/transaction-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix}
        )

        # Get the Lambda function code path
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        processor_zip = os.path.join(lambda_dir, "transaction-processor.zip")

        return LambdaFunction(
            self, "transaction-processor",
            function_name=f"transaction-processor-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.processor_role.arn,
            filename=processor_zip,
            source_code_hash=Fn.filebase64sha256(processor_zip),
            memory_size=512,
            timeout=60,
            reserved_concurrent_executions=100,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORER_FUNCTION": f"fraud-scorer-{self.environment_suffix}",
                    "DLQ_URL": self.processor_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.processor_dlq.arn
            ),
            tags={"Environment": self.environment_suffix}
        )

    def _create_fraud_scorer(self) -> LambdaFunction:
        """Create fraud scorer Lambda function"""
        # Create CloudWatch Log Group
        CloudwatchLogGroup(
            self, "scorer-log-group",
            name=f"/aws/lambda/fraud-scorer-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix}
        )

        # Get the Lambda function code path
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        scorer_zip = os.path.join(lambda_dir, "fraud-scorer.zip")

        return LambdaFunction(
            self, "fraud-scorer",
            function_name=f"fraud-scorer-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.scorer_role.arn,
            filename=scorer_zip,
            source_code_hash=Fn.filebase64sha256(scorer_zip),
            memory_size=1024,
            timeout=120,
            reserved_concurrent_executions=50,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORES_TABLE": self.fraud_scores_table.name,
                    "SNS_TOPIC_ARN": self.fraud_alerts_topic.arn,
                    "DLQ_URL": self.scorer_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.scorer_dlq.arn
            ),
            tags={"Environment": self.environment_suffix}
        )

    def _create_stream_trigger(self):
        """Create DynamoDB Stream event source mapping"""
        LambdaEventSourceMapping(
            self, "transactions-stream-trigger",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.processor_lambda.function_name,
            starting_position="LATEST",
            maximum_retry_attempts=5,
            batch_size=100
        )

    def _create_api_gateway(self) -> ApiGatewayRestApi:
        """Create API Gateway REST API"""
        # Create REST API
        api = ApiGatewayRestApi(
            self, "fraud-detection-api",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="API for fraud detection system"
        )

        # Create /transactions resource
        resource = ApiGatewayResource(
            self, "transactions-resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )

        # Create POST method
        method = ApiGatewayMethod(
            self, "transactions-post-method",
            rest_api_id=api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self, "transactions-integration",
            rest_api_id=api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.ingestion_lambda.invoke_arn
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self, "api-deployment",
            rest_api_id=api.id,
            depends_on=[method, integration]
        )

        # Create stage
        stage = ApiGatewayStage(
            self, "api-stage",
            rest_api_id=api.id,
            stage_name="prod",
            deployment_id=deployment.id,
            xray_tracing_enabled=True,
            tags={"Environment": self.environment_suffix}
        )

        # Configure throttling settings
        ApiGatewayMethodSettings(
            self, "api-method-settings",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings=ApiGatewayMethodSettingsSettings(
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            )
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self, "api-lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.ingestion_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        return api

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda errors"""
        # Alarm for transaction ingestion
        CloudwatchMetricAlarm(
            self, "ingestion-error-alarm",
            alarm_name=f"transaction-ingestion-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,  # More than 1 error
            alarm_description="Alert when transaction ingestion has errors",
            dimensions={
                "FunctionName": self.ingestion_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        # Alarm for transaction processor
        CloudwatchMetricAlarm(
            self, "processor-error-alarm",
            alarm_name=f"transaction-processor-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,  # More than 1 error
            alarm_description="Alert when transaction processor has errors",
            dimensions={
                "FunctionName": self.processor_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        # Alarm for fraud scorer
        CloudwatchMetricAlarm(
            self, "scorer-error-alarm",
            alarm_name=f"fraud-scorer-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,  # More than 1 error
            alarm_description="Alert when fraud scorer has errors",
            dimensions={
                "FunctionName": self.scorer_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )
```

## File: lib/lambda/transaction-ingestion/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Processing transaction ingestion:', JSON.stringify(event, null, 2));

    const transactionsTable = process.env.TRANSACTIONS_TABLE;

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { transaction_id, amount, merchant } = body;

        if (!transaction_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'transaction_id is required' })
            };
        }

        const timestamp = Date.now();

        // Store transaction in DynamoDB
        await dynamodb.send(new PutCommand({
            TableName: transactionsTable,
            Item: {
                transaction_id: transaction_id,
                timestamp: timestamp,
                amount: amount || 0,
                merchant: merchant || 'unknown',
                created_at: new Date().toISOString()
            }
        }));

        console.log(`Stored transaction ${transaction_id} in DynamoDB`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Transaction stored successfully',
                transaction_id: transaction_id,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Error storing transaction:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to store transaction' })
        };
    }
};
```

## File: lib/lambda/transaction-ingestion/package.json

```json
{
  "name": "transaction-ingestion",
  "version": "1.0.0",
  "description": "Lambda function for transaction ingestion",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

## File: lib/lambda/transaction-processor/index.js

```javascript
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({});

exports.handler = async (event) => {
    console.log('Processing DynamoDB stream records:', JSON.stringify(event, null, 2));

    const fraudScorerFunction = process.env.FRAUD_SCORER_FUNCTION;

    try {
        // Process each record from DynamoDB stream
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const transaction = record.dynamodb.NewImage;

                // Invoke fraud scorer Lambda
                const payload = JSON.stringify({
                    transaction_id: transaction.transaction_id.S,
                    timestamp: parseInt(transaction.timestamp.N),
                    amount: transaction.amount ? parseFloat(transaction.amount.N) : 0,
                    merchant: transaction.merchant ? transaction.merchant.S : 'unknown'
                });

                await lambda.send(new InvokeCommand({
                    FunctionName: fraudScorerFunction,
                    InvocationType: 'Event',
                    Payload: Buffer.from(payload)
                }));

                console.log(`Invoked fraud scorer for transaction ${transaction.transaction_id.S}`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully processed records' })
        };
    } catch (error) {
        console.error('Error processing records:', error);
        throw error;
    }
};
```

## File: lib/lambda/transaction-processor/package.json

```json
{
  "name": "transaction-processor",
  "version": "1.0.0",
  "description": "Lambda function for transaction processing",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-lambda": "^3.0.0"
  }
}
```

## File: lib/lambda/fraud-scorer/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});

exports.handler = async (event) => {
    console.log('Scoring transaction:', JSON.stringify(event, null, 2));

    const fraudScoresTable = process.env.FRAUD_SCORES_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    try {
        const { transaction_id, timestamp, amount, merchant } = event;

        // Simple fraud scoring logic (in real world, this would be ML-based)
        const fraudScore = calculateFraudScore(amount, merchant);

        // Store fraud score in DynamoDB
        const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        await dynamodb.send(new PutCommand({
            TableName: fraudScoresTable,
            Item: {
                transaction_id: transaction_id,
                fraud_score: fraudScore,
                timestamp: timestamp,
                merchant: merchant,
                amount: amount,
                expiry: expiryTime,
                scored_at: new Date().toISOString()
            }
        }));

        console.log(`Stored fraud score ${fraudScore} for transaction ${transaction_id}`);

        // Send alert if fraud score exceeds threshold
        if (fraudScore > 0.8) {
            await sns.send(new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: 'Fraud Alert',
                Message: JSON.stringify({
                    transaction_id: transaction_id,
                    fraud_score: fraudScore,
                    amount: amount,
                    merchant: merchant,
                    timestamp: timestamp
                }, null, 2)
            }));

            console.log(`Sent fraud alert for transaction ${transaction_id}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                transaction_id: transaction_id,
                fraud_score: fraudScore
            })
        };
    } catch (error) {
        console.error('Error scoring transaction:', error);
        throw error;
    }
};

function calculateFraudScore(amount, merchant) {
    // Simple heuristic for demo purposes
    let score = 0.0;

    // High amounts are suspicious
    if (amount > 10000) {
        score += 0.5;
    } else if (amount > 5000) {
        score += 0.3;
    }

    // Certain merchants are higher risk
    const highRiskMerchants = ['unknown', 'offshore', 'crypto'];
    if (highRiskMerchants.some(term => merchant.toLowerCase().includes(term))) {
        score += 0.4;
    }

    return Math.min(score, 1.0);
}
```

## File: lib/lambda/fraud-scorer/package.json

```json
{
  "name": "fraud-scorer",
  "version": "1.0.0",
  "description": "Lambda function for fraud scoring",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  }
}
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 tap.py",
  "projectId": "fraud-detection-system",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: lib/README.md

```markdown
# Serverless Fraud Detection System

A complete serverless fraud detection system built with CDKTF Python that processes financial transactions in real-time.

## Architecture

The system implements a serverless fraud detection pipeline:

1. **API Gateway** receives transaction POST requests at /transactions endpoint
2. **Transaction Ingestion Lambda** writes transactions to DynamoDB transactions table
3. **DynamoDB Streams** triggers processor Lambda for new transactions
4. **Transaction Processor Lambda** reads from stream and invokes fraud scorer
5. **Fraud Scorer Lambda** analyzes transactions and stores scores in fraud_scores table
6. **SNS** sends alerts for high-risk transactions (score > 0.8)
7. **SQS DLQs** capture failed Lambda executions with 5 retry attempts
8. **CloudWatch Alarms** monitor Lambda error rates
9. **X-Ray** provides distributed tracing across all components

## AWS Services Used

- **DynamoDB**: Two tables for transactions and fraud scores
- **Lambda**: Three functions for ingestion, processing, and scoring
- **API Gateway**: REST API for transaction ingestion
- **SQS**: Dead letter queues for each Lambda function
- **SNS**: Topic for fraud alert notifications
- **CloudWatch**: Log groups with 7-day retention and metric alarms
- **IAM**: Least privilege roles for each Lambda function
- **X-Ray**: Distributed tracing enabled on all components

## Prerequisites

1. Python 3.9+
2. Node.js 18+ (for Lambda runtime)
3. CDKTF CLI
4. AWS credentials configured

## Installation

1. Install Python dependencies:
```bash
pip install cdktf cdktf-cdktf-provider-aws constructs
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Install Lambda function dependencies and package:
```bash
# Transaction ingestion
cd lib/lambda/transaction-ingestion
npm install
zip -r ../transaction-ingestion.zip index.js node_modules package.json

# Transaction processor
cd ../transaction-processor
npm install
zip -r ../transaction-processor.zip index.js node_modules package.json

# Fraud scorer
cd ../fraud-scorer
npm install
zip -r ../fraud-scorer.zip index.js node_modules package.json

cd ../../..
```

## Configuration

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
```

## Deployment

1. Initialize CDKTF (first time only):
```bash
cdktf get
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy the stack:
```bash
cdktf deploy
```

4. Note the outputs, especially the API endpoint URL.

## Testing

Test the API endpoint:

```bash
# Get the API endpoint from outputs
API_ENDPOINT="https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions"

# Send a test transaction
curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-001",
    "amount": 5000,
    "merchant": "Amazon"
  }'

# Send a high-risk transaction (should trigger fraud alert)
curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-002",
    "amount": 15000,
    "merchant": "offshore-vendor"
  }'
```

## Monitoring

- **CloudWatch Logs**: Check `/aws/lambda/<function-name>-<environment-suffix>` log groups
- **CloudWatch Alarms**: Monitor error alarms for each Lambda function
- **X-Ray**: View distributed traces in AWS X-Ray console
- **DynamoDB**: Query tables to see stored transactions and fraud scores

## Configuration Details

### Lambda Functions

- **transaction-ingestion**: 256MB memory, 30s timeout
- **transaction-processor**: 512MB memory, 60s timeout, 100 reserved concurrent executions
- **fraud-scorer**: 1024MB memory, 120s timeout, 50 reserved concurrent executions

### API Gateway

- **Rate Limit**: 1000 requests/second (steady-state)
- **Burst Limit**: 2000 requests/second
- **X-Ray Tracing**: Enabled

### DynamoDB

- **Billing Mode**: On-demand (PAY_PER_REQUEST)
- **Streams**: Enabled on transactions table
- **TTL**: Enabled on fraud_scores table (30 days)

### Dead Letter Queues

- **Retention**: 14 days
- **Retry Attempts**: 5 (configured on event source mapping)

### CloudWatch Logs

- **Retention**: 7 days
- **All Lambda functions have dedicated log groups**

## Clean Up

To destroy all resources:

```bash
cdktf destroy
```

## Security Features

1. **Least Privilege IAM**: Each Lambda has minimal required permissions
2. **X-Ray Tracing**: Full distributed tracing enabled
3. **CloudWatch Monitoring**: Error alarms on all Lambda functions
4. **DLQ Configuration**: Failed messages captured for retry
5. **Log Retention**: 7-day retention on all logs
6. **Environment Isolation**: All resources tagged with environment suffix

## Notes

- All resource names include `environment_suffix` for multi-environment support
- Lambda functions use Node.js 18.x with AWS SDK v3
- System supports concurrent deployments with different environment suffixes
- All resources are fully destroyable (no retention policies)
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install cdktf cdktf-cdktf-provider-aws constructs
npm install -g cdktf-cli
```

2. Package Lambda functions:
```bash
# Transaction ingestion
cd lib/lambda/transaction-ingestion
npm install
zip -r ../transaction-ingestion.zip index.js node_modules package.json

# Transaction processor
cd ../transaction-processor
npm install
zip -r ../transaction-processor.zip index.js node_modules package.json

# Fraud scorer
cd ../fraud-scorer
npm install
zip -r ../fraud-scorer.zip index.js node_modules package.json
```

3. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
```

4. Deploy:
```bash
cdktf deploy
```

5. Test the API:
```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-123",
    "amount": 5000,
    "merchant": "Amazon"
  }'
```
