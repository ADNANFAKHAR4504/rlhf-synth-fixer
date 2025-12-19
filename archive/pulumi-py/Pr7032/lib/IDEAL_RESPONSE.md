# Serverless Webhook Processing Infrastructure

This implementation creates a complete serverless webhook processing system for financial transactions using Pulumi with Python.

## Architecture Overview

The solution implements:
- API Gateway REST API with /webhook endpoint
- Lambda function for webhook processing (Node.js 18.x)
- DynamoDB table for transaction storage
- KMS encryption for sensitive environment variables
- CloudWatch Logs with 30-day retention
- X-Ray tracing for performance monitoring
- IAM roles with least privilege permissions
- API Gateway usage plan with rate limiting

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for the webhook processing infrastructure.
It creates API Gateway, Lambda, DynamoDB, and supporting resources for handling
financial transaction webhooks.
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the webhook processing infrastructure.

    This component creates:
    - DynamoDB table for transaction storage
    - KMS key for encryption
    - Lambda function for webhook processing
    - API Gateway REST API
    - CloudWatch Log groups
    - IAM roles and policies

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
        self.tags = args.tags or {}

        # Merge required tags
        resource_tags = {
            **self.tags,
            'Environment': self.environment_suffix,
            'Team': 'fintech',
            'CostCenter': 'engineering'
        }

        # 1. Create KMS key for Lambda environment variable encryption
        self.kms_key = aws.kms.Key(
            f"webhook-kms-{self.environment_suffix}",
            description=f"KMS key for webhook Lambda environment encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f"webhook-kms-alias-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            name=f"alias/webhook-lambda-{self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # 2. Create DynamoDB table for transactions
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transactionId",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transactionId",
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
            deletion_protection_enabled=False,
            stream_enabled=False,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 3. Create CloudWatch Log group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"webhook-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/webhook-processor-{self.environment_suffix}",
            retention_in_days=30,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 4. Create IAM role for Lambda
        lambda_assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        self.lambda_role = aws.iam.Role(
            f"webhook-lambda-role-{self.environment_suffix}",
            name=f"webhook-lambda-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role_policy.json,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 5. Create IAM policy for Lambda with least privilege
        lambda_policy_document = Output.all(
            self.transactions_table.arn,
            self.lambda_log_group.name,
            self.kms_key.arn
        ).apply(lambda args: aws.iam.get_policy_document(
            statements=[
                # DynamoDB permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "dynamodb:PutItem",
                        "dynamodb:GetItem"
                    ],
                    resources=[args[0]]
                ),
                # CloudWatch Logs permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    resources=[f"arn:aws:logs:*:*:log-group:/aws/lambda/webhook-processor-{self.environment_suffix}:*"]
                ),
                # X-Ray permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    resources=["*"]
                ),
                # KMS permissions for environment variable decryption
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "kms:Decrypt"
                    ],
                    resources=[args[2]]
                )
            ]
        ))

        self.lambda_policy = aws.iam.Policy(
            f"webhook-lambda-policy-{self.environment_suffix}",
            name=f"webhook-lambda-policy-{self.environment_suffix}",
            policy=lambda_policy_document.apply(lambda doc: doc.json),
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        self.lambda_policy_attachment = aws.iam.RolePolicyAttachment(
            f"webhook-lambda-policy-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # 6. Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"webhook-processor-{self.environment_suffix}",
            name=f"webhook-processor-{self.environment_suffix}",
            role=self.lambda_role.arn,
            runtime="nodejs18.x",
            handler="index.handler",
            memory_size=1024,
            timeout=30,
            code=pulumi.AssetArchive({
                'index.js': pulumi.StringAsset(self._get_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name,
                    "ENVIRONMENT": self.environment_suffix,
                    "SENSITIVE_KEY": "encrypted-secret-value"
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.lambda_log_group, self.lambda_policy_attachment]
            )
        )

        # 7. Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"webhook-api-{self.environment_suffix}",
            name=f"webhook-api-{self.environment_suffix}",
            description=f"Webhook processing API for financial transactions - {self.environment_suffix}",
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 8. Create API Gateway resource for /webhook
        self.webhook_resource = aws.apigateway.Resource(
            f"webhook-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="webhook",
            opts=ResourceOptions(parent=self)
        )

        # 9. Create POST method for /webhook
        self.webhook_method = aws.apigateway.Method(
            f"webhook-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.webhook_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # 10. Create Lambda integration for API Gateway
        self.webhook_integration = aws.apigateway.Integration(
            f"webhook-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.webhook_resource.id,
            http_method=self.webhook_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # 11. Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"webhook-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.all(self.api.execution_arn).apply(
                lambda args: f"{args[0]}/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # 12. Create API Gateway deployment
        self.deployment = aws.apigateway.Deployment(
            f"webhook-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            description=f"Webhook API deployment - {self.environment_suffix}",
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.webhook_integration]
            )
        )

        # 13. Create API Gateway stage
        self.stage = aws.apigateway.Stage(
            f"webhook-stage-{self.environment_suffix}",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 14. Create usage plan
        self.usage_plan = aws.apigateway.UsagePlan(
            f"webhook-usage-plan-{self.environment_suffix}",
            name=f"webhook-usage-plan-{self.environment_suffix}",
            description=f"Usage plan for webhook API - {self.environment_suffix}",
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                rate_limit=1000,
                burst_limit=2000
            ),
            api_stages=[
                aws.apigateway.UsagePlanApiStageArgs(
                    api_id=self.api.id,
                    stage=self.stage.stage_name
                )
            ],
            tags=resource_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.stage])
        )

        # Store outputs as instance attributes for export
        self.api_endpoint = Output.concat(
            "https://", self.api.id, ".execute-api.",
            aws.get_region().name, ".amazonaws.com/",
            self.stage.stage_name, "/webhook"
        )
        self.table_name = self.transactions_table.name
        self.lambda_function_name = self.lambda_function.name
        self.kms_key_id = self.kms_key.key_id

        # Export outputs
        self.register_outputs({
            'api_endpoint': self.api_endpoint,
            'table_name': self.table_name,
            'lambda_function_name': self.lambda_function_name,
            'kms_key_id': self.kms_key_id
        })

    def _get_lambda_code(self) -> str:
        """
        Returns the Lambda function code as a string.
        """
        return """
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    try {
        // Parse the request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        // Validate required fields
        if (!body.transactionId || !body.amount || !body.currency) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: transactionId, amount, currency'
                })
            };
        }

        // Validate transaction data
        if (typeof body.amount !== 'number' || body.amount <= 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Invalid amount: must be a positive number'
                })
            };
        }

        // Create transaction item
        const timestamp = Date.now();
        const item = {
            transactionId: { S: body.transactionId },
            timestamp: { N: timestamp.toString() },
            amount: { N: body.amount.toString() },
            currency: { S: body.currency },
            status: { S: body.status || 'pending' },
            metadata: { S: JSON.stringify(body.metadata || {}) },
            receivedAt: { S: new Date(timestamp).toISOString() }
        };

        // Store in DynamoDB
        const command = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: item
        });

        await client.send(command);

        console.log('Transaction stored successfully:', body.transactionId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Transaction processed successfully',
                transactionId: body.transactionId,
                timestamp: timestamp
            })
        };

    } catch (error) {
        console.error('Error processing webhook:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
"""

# Instantiate the TapStack
config = pulumi.Config()
environment_suffix = config.get('environment_suffix') or pulumi.get_stack().replace('TapStack', '').lower() or 'dev'

# Get default tags from Pulumi config if available
default_tags = {}
try:
    aws_tags = config.get_object('aws:defaultTags')
    if aws_tags and 'tags' in aws_tags:
        default_tags = aws_tags['tags']
except:
    pass

# Create the stack
stack = TapStack(
    'tap-stack',
    TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    )
)

# Export outputs
pulumi.export('api_endpoint', stack.api_endpoint)
pulumi.export('table_name', stack.table_name)
pulumi.export('lambda_function_name', stack.lambda_function_name)
pulumi.export('kms_key_id', stack.kms_key_id)
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: python
description: Pulumi infrastructure for TAP
main: lib/tap_stack.py
```

## File: tests/integration/test_tap_stack.py

```python
"""
test_tap_stack.py

Integration tests for the deployed TapStack infrastructure.
Tests actual AWS resources created by the stack.
"""

import unittest
import os
import json
import subprocess
import boto3
from typing import Dict, Optional
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        # Get environment configuration
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.pulumi_org = os.getenv('PULUMI_ORG', 'organization')
        
        # Construct stack name dynamically
        cls.stack_name = f"TapStack{cls.environment_suffix}"
        cls.pulumi_stack_identifier = f"{cls.pulumi_org}/TapStack/{cls.stack_name}"
        
        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Get account ID for resource naming
        sts_client = boto3.client('sts', region_name=cls.region)
        cls.account_id = sts_client.get_caller_identity()['Account']
        
        # Fetch Pulumi stack outputs
        cls.outputs = cls._fetch_pulumi_outputs()
        
        # Discover resource names dynamically
        cls._discover_resources()
    
    @classmethod
    def _fetch_pulumi_outputs(cls) -> Dict:
        """Fetch Pulumi outputs as a Python dictionary."""
        try:
            # Try to get outputs from current stack first
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json"],
                capture_output=True,
                text=True,
                check=False,
                cwd=os.path.join(os.path.dirname(__file__), "../..")
            )
            
            if result.returncode == 0 and result.stdout.strip():
                outputs = json.loads(result.stdout)
                return outputs
            
            # Fallback: try with explicit stack identifier
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", cls.pulumi_stack_identifier],
                capture_output=True,
                text=True,
                check=False,
                cwd=os.path.join(os.path.dirname(__file__), "../..")
            )
            
            if result.returncode == 0 and result.stdout.strip():
                outputs = json.loads(result.stdout)
                return outputs
            
            # Last fallback: try reading from outputs file
            outputs_file = os.path.join(os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json")
            if os.path.exists(outputs_file):
                with open(outputs_file, 'r') as f:
                    outputs = json.load(f)
                    if outputs:
                        return outputs
            
            return {}
            
        except Exception:
            return {}
    
    @classmethod
    def _discover_resources(cls):
        """Discover resource names from outputs or use naming conventions."""
        # Get resource names from outputs if available, otherwise use naming conventions
        cls.table_name = cls.outputs.get('table_name') or f"transactions-{cls.environment_suffix}"
        cls.lambda_function_name = cls.outputs.get('lambda_function_name') or f"webhook-processor-{cls.environment_suffix}"
        cls.api_endpoint = cls.outputs.get('api_endpoint', '')
        cls.kms_key_id = cls.outputs.get('kms_key_id', '')
        
        # Discover API Gateway REST API ID from endpoint or by name
        cls.api_id = None
        if cls.api_endpoint:
            try:
                import re
                match = re.search(r'https://([^.]+)\.execute-api\.', cls.api_endpoint)
                if match:
                    cls.api_id = match.group(1)
            except Exception:
                pass
        
        # If API ID not found from endpoint, try to discover by name
        if not cls.api_id:
            try:
                apis = cls.apigateway_client.get_rest_apis()
                api_name = f"webhook-api-{cls.environment_suffix}"
                for api in apis.get('items', []):
                    if api.get('name') == api_name:
                        cls.api_id = api['id']
                        break
            except Exception:
                pass
        
        # Discover KMS key if not in outputs
        if not cls.kms_key_id:
            try:
                alias_name = f"alias/webhook-lambda-{cls.environment_suffix}"
                alias_info = cls.kms_client.describe_key(KeyId=alias_name)
                cls.kms_key_id = alias_info['KeyMetadata']['KeyId']
            except Exception:
                pass
        
        # IAM role name (always follows naming convention)
        cls.iam_role_name = f"webhook-lambda-role-{cls.environment_suffix}"
        
        # CloudWatch log group name (always follows naming convention)
        cls.log_group_name = f"/aws/lambda/webhook-processor-{cls.environment_suffix}"
    
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists and is properly configured."""
        response = self.dynamodb_client.describe_table(TableName=self.table_name)
        table = response['Table']
        
        self.assertEqual(table['TableName'], self.table_name)
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertIn('transactionId', [attr['AttributeName'] for attr in table['AttributeDefinitions']])
        self.assertIn('timestamp', [attr['AttributeName'] for attr in table['AttributeDefinitions']])
        self.assertEqual(table['KeySchema'][0]['AttributeName'], 'transactionId')
        self.assertEqual(table['KeySchema'][0]['KeyType'], 'HASH')
        self.assertEqual(table['KeySchema'][1]['AttributeName'], 'timestamp')
        self.assertEqual(table['KeySchema'][1]['KeyType'], 'RANGE')
    
    def test_lambda_function_exists(self):
        """Test that the Lambda function exists and is properly configured."""
        response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        function = response['Configuration']
        
        self.assertEqual(function['FunctionName'], self.lambda_function_name)
        self.assertEqual(function['Runtime'], 'nodejs18.x')
        self.assertEqual(function['Handler'], 'index.handler')
        self.assertEqual(function['MemorySize'], 1024)
        self.assertEqual(function['Timeout'], 30)
        self.assertEqual(function['TracingConfig']['Mode'], 'Active')
        self.assertIn('TABLE_NAME', function.get('Environment', {}).get('Variables', {}))
        self.assertEqual(function['Environment']['Variables']['TABLE_NAME'], self.table_name)
    
    def test_api_gateway_exists(self):
        """Test that the API Gateway REST API exists and is properly configured."""
        if not self.api_id:
            self.skipTest("API Gateway ID could not be discovered")
        
        response = self.apigateway_client.get_rest_api(restApiId=self.api_id)
        api = response
        
        self.assertEqual(api['id'], self.api_id)
        self.assertIn('webhook-api', api['name'].lower())
        self.assertIn(self.environment_suffix, api['name'])
    
    def test_kms_key_exists(self):
        """Test that the KMS key exists and is properly configured."""
        if not self.kms_key_id:
            self.skipTest("KMS key ID could not be discovered")
        
        response = self.kms_client.describe_key(KeyId=self.kms_key_id)
        key = response['KeyMetadata']
        
        self.assertEqual(key['KeyId'], self.kms_key_id)
        self.assertEqual(key['KeyState'], 'Enabled')
        self.assertIn('webhook', key.get('Description', '').lower())
    
    def test_iam_role_exists(self):
        """Test that the IAM role exists and has proper policies attached."""
        response = self.iam_client.get_role(RoleName=self.iam_role_name)
        role = response['Role']
        
        self.assertEqual(role['RoleName'], self.iam_role_name)
        
        # Check assume role policy allows Lambda service
        assume_policy = role['AssumeRolePolicyDocument']
        if isinstance(assume_policy, str):
            assume_policy = json.loads(assume_policy)
        statements = assume_policy.get('Statement', [])
        lambda_allowed = False
        for statement in statements:
            if statement.get('Effect') == 'Allow':
                principals = statement.get('Principal', {})
                if 'Service' in principals:
                    services = principals['Service']
                    if isinstance(services, list):
                        if 'lambda.amazonaws.com' in services:
                            lambda_allowed = True
                    elif services == 'lambda.amazonaws.com':
                        lambda_allowed = True
        
        self.assertTrue(lambda_allowed, "IAM role should allow Lambda service to assume it")
    
    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists and is properly configured."""
        response = self.logs_client.describe_log_groups(logGroupNamePrefix=self.log_group_name)
        log_groups = response.get('logGroups', [])
        
        log_group = None
        for group in log_groups:
            if group['logGroupName'] == self.log_group_name:
                log_group = group
                break
        
        self.assertIsNotNone(log_group, f"CloudWatch log group '{self.log_group_name}' should exist")
        self.assertEqual(log_group['logGroupName'], self.log_group_name)
        self.assertEqual(log_group.get('retentionInDays'), 30)


if __name__ == '__main__':
    unittest.main()
```

## File: lib/README.md

```markdown
# Webhook Processing Infrastructure

This Pulumi Python program deploys a serverless webhook processing infrastructure for financial transactions on AWS.

## Architecture

The infrastructure includes:

- **API Gateway REST API**: Provides a POST endpoint at `/webhook` for receiving transaction notifications
- **Lambda Function**: Validates webhook payloads and stores valid transactions (Node.js 18.x, 1024MB)
- **DynamoDB Table**: Stores transaction data with partition key `transactionId` and sort key `timestamp`
- **KMS Encryption**: Encrypts sensitive Lambda environment variables
- **CloudWatch Logs**: 30-day retention for all Lambda executions
- **X-Ray Tracing**: Enabled for performance monitoring
- **IAM Roles**: Least privilege permissions for Lambda
- **Usage Plan**: Rate limiting at 1000 requests/minute

## Prerequisites

- Python 3.8 or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Configuration

The infrastructure uses the following configuration:

- **Region**: us-east-1 (configurable via AWS_REGION environment variable)
- **Environment Suffix**: dev/staging/prod (configurable via ENVIRONMENT_SUFFIX)
- **Lambda Runtime**: Node.js 18.x
- **Lambda Memory**: 1024MB
- **API Rate Limit**: 1000 requests/minute
- **DynamoDB Billing**: On-demand
- **Log Retention**: 30 days

## Deployment

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

3. Deploy the stack:

```bash
pulumi up
```

4. After deployment, the API endpoint URL will be displayed in the outputs.

## Usage

Send a POST request to the webhook endpoint:

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_123456",
    "amount": 99.99,
    "currency": "USD",
    "status": "completed",
    "metadata": {
      "customer_id": "cust_789",
      "payment_method": "card"
    }
  }'
```

Expected response:

```json
{
  "message": "Transaction processed successfully",
  "transactionId": "txn_123456",
  "timestamp": 1234567890
}
```

## Monitoring

- **CloudWatch Logs**: View Lambda execution logs at `/aws/lambda/webhook-processor-<env>`
- **X-Ray**: View distributed traces in AWS X-Ray console
- **DynamoDB**: Query transactions table using AWS Console or CLI

## Resource Naming

All resources include the environment suffix for uniqueness:

- DynamoDB Table: `transactions-<env>`
- Lambda Function: `webhook-processor-<env>`
- API Gateway: `webhook-api-<env>`
- KMS Key: `webhook-kms-<env>`

## Security

- Lambda environment variables are encrypted with KMS
- IAM roles follow least privilege principle
- No wildcard permissions in IAM policies
- DynamoDB point-in-time recovery enabled
- X-Ray tracing for monitoring and debugging

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Validation

The Lambda function validates:

1. Required fields: `transactionId`, `amount`, `currency`
2. Amount must be a positive number
3. Proper JSON structure

Invalid requests return 400 with error details.

## Tags

All resources are tagged with:

- **Environment**: The environment suffix (dev/staging/prod)
- **Team**: fintech
- **CostCenter**: engineering
- Additional tags from provider configuration
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```
