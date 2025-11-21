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

# Instantiate the TapStack only when running in Pulumi execution context
# This prevents execution during unit test imports
def _create_stack():
    """Create and export the TapStack. Only runs during Pulumi execution."""
    config = pulumi.Config()
    environment_suffix = config.get('environment_suffix') or pulumi.get_stack().replace('TapStack', '').lower() or 'dev'

    # Get default tags from Pulumi config if available
    default_tags = {}
    try:
        aws_tags = config.get_object('aws:defaultTags')
        if aws_tags and 'tags' in aws_tags:
            default_tags = aws_tags['tags']
    except (AttributeError, KeyError, TypeError):
        # Config may not have aws:defaultTags or it may be in wrong format
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

# Only create stack if Pulumi runtime is properly initialized
# Check if we can safely get the stack name (indicates Pulumi is running)
try:
    _ = pulumi.get_stack()
    _create_stack()
except (AttributeError, RuntimeError, Exception):
    # Pulumi runtime not available (e.g., during unit tests or imports)
    # Stack will be created when Pulumi actually runs the program
    pass
