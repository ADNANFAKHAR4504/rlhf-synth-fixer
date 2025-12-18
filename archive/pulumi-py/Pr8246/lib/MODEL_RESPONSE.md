# Serverless Event Processing Infrastructure - MODEL RESPONSE

This document contains the initial generated code for the serverless event processing system.

## File: lib/tap_stack.py

```python
"""
TapStack infrastructure for serverless event processing pipeline.
"""
import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class TapStackArgs:
    """Arguments for TapStack."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    Serverless event processing infrastructure for financial transactions.

    Creates:
    - API Gateway REST API with webhook endpoint
    - Lambda functions for validation and routing
    - SQS queues for different transaction types
    - DynamoDB table for event deduplication
    - CloudWatch log groups
    - IAM roles and policies
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('custom:infrastructure:TapStack', name, {}, opts)

        self.environment_suffix = args.environment_suffix

        # Create DynamoDB table for event deduplication
        self.events_table = aws.dynamodb.Table(
            f"transaction-events-{self.environment_suffix}",
            name=f"transaction-events-{self.environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="event_id",
                    type="S",
                )
            ],
            hash_key="event_id",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create dead letter queues
        self.payments_dlq = aws.sqs.Queue(
            f"payments-dlq-{self.environment_suffix}",
            name=f"payments-dlq-{self.environment_suffix}",
            message_retention_seconds=604800,  # 7 days
            opts=ResourceOptions(parent=self)
        )

        self.refunds_dlq = aws.sqs.Queue(
            f"refunds-dlq-{self.environment_suffix}",
            name=f"refunds-dlq-{self.environment_suffix}",
            message_retention_seconds=604800,
            opts=ResourceOptions(parent=self)
        )

        self.disputes_dlq = aws.sqs.Queue(
            f"disputes-dlq-{self.environment_suffix}",
            name=f"disputes-dlq-{self.environment_suffix}",
            message_retention_seconds=604800,
            opts=ResourceOptions(parent=self)
        )

        # Create primary SQS queues
        self.payments_queue = aws.sqs.Queue(
            f"payments-queue-{self.environment_suffix}",
            name=f"payments-queue-{self.environment_suffix}",
            message_retention_seconds=604800,
            visibility_timeout_seconds=300,
            redrive_policy=self.payments_dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": 3
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        self.refunds_queue = aws.sqs.Queue(
            f"refunds-queue-{self.environment_suffix}",
            name=f"refunds-queue-{self.environment_suffix}",
            message_retention_seconds=604800,
            visibility_timeout_seconds=300,
            redrive_policy=self.refunds_dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": 3
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        self.disputes_queue = aws.sqs.Queue(
            f"disputes-queue-{self.environment_suffix}",
            name=f"disputes-queue-{self.environment_suffix}",
            message_retention_seconds=604800,
            visibility_timeout_seconds=300,
            redrive_policy=self.disputes_dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": 3
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for validator Lambda
        validator_role = aws.iam.Role(
            f"validator-lambda-role-{self.environment_suffix}",
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

        # Attach policies to validator role
        aws.iam.RolePolicyAttachment(
            f"validator-lambda-logs-{self.environment_suffix}",
            role=validator_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"validator-lambda-xray-{self.environment_suffix}",
            role=validator_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for DynamoDB access
        validator_policy = aws.iam.RolePolicy(
            f"validator-dynamodb-policy-{self.environment_suffix}",
            role=validator_role.id,
            policy=self.events_table.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem"
                    ],
                    "Resource": arn
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for validator
        validator_log_group = aws.cloudwatch.LogGroup(
            f"validator-logs-{self.environment_suffix}",
            name=f"/aws/lambda/webhook-validator-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        # Create webhook validator Lambda function
        self.validator_lambda = aws.lambda_.Function(
            f"webhook-validator-{self.environment_suffix}",
            name=f"webhook-validator-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=validator_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_validator_code())
            }),
            architectures=["arm64"],
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.events_table.name
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            reserved_concurrent_executions=10,
            opts=ResourceOptions(parent=self, depends_on=[validator_log_group])
        )

        # Create IAM role for router Lambda
        router_role = aws.iam.Role(
            f"router-lambda-role-{self.environment_suffix}",
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

        # Attach policies to router role
        aws.iam.RolePolicyAttachment(
            f"router-lambda-logs-{self.environment_suffix}",
            role=router_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"router-lambda-xray-{self.environment_suffix}",
            role=router_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for SQS access
        router_policy = aws.iam.RolePolicy(
            f"router-sqs-policy-{self.environment_suffix}",
            role=router_role.id,
            policy=pulumi.Output.all(
                self.payments_queue.arn,
                self.refunds_queue.arn,
                self.disputes_queue.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": arns
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for router
        router_log_group = aws.cloudwatch.LogGroup(
            f"router-logs-{self.environment_suffix}",
            name=f"/aws/lambda/event-router-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        # Create event router Lambda function
        self.router_lambda = aws.lambda_.Function(
            f"event-router-{self.environment_suffix}",
            name=f"event-router-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=router_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_router_code())
            }),
            architectures=["arm64"],
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PAYMENTS_QUEUE_URL": self.payments_queue.url,
                    "REFUNDS_QUEUE_URL": self.refunds_queue.url,
                    "DISPUTES_QUEUE_URL": self.disputes_queue.url
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            reserved_concurrent_executions=10,
            opts=ResourceOptions(parent=self, depends_on=[router_log_group])
        )

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"webhook-api-{self.environment_suffix}",
            name=f"webhook-api-{self.environment_suffix}",
            description="Webhook API for transaction events",
            opts=ResourceOptions(parent=self)
        )

        # Create /webhook resource
        webhook_resource = aws.apigateway.Resource(
            f"webhook-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="webhook",
            opts=ResourceOptions(parent=self)
        )

        # Create request validator
        request_validator = aws.apigateway.RequestValidator(
            f"webhook-validator-{self.environment_suffix}",
            rest_api=self.api.id,
            name=f"webhook-validator-{self.environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=False,
            opts=ResourceOptions(parent=self)
        )

        # Create model for request validation
        request_model = aws.apigateway.Model(
            f"webhook-model-{self.environment_suffix}",
            rest_api=self.api.id,
            name="WebhookModel",
            content_type="application/json",
            schema=json.dumps({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "required": ["event_id", "transaction_type", "amount", "timestamp"],
                "properties": {
                    "event_id": {"type": "string"},
                    "transaction_type": {"type": "string"},
                    "amount": {"type": "number"},
                    "timestamp": {"type": "string"}
                }
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create POST method
        webhook_method = aws.apigateway.Method(
            f"webhook-post-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=webhook_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=request_validator.id,
            request_models={
                "application/json": request_model.name
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda integration
        webhook_integration = aws.apigateway.Integration(
            f"webhook-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=webhook_resource.id,
            http_method=webhook_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.validator_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke validator Lambda
        lambda_permission = aws.lambda_.Permission(
            f"api-gateway-invoke-validator-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.validator_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(self.api.execution_arn, webhook_resource.path).apply(
                lambda args: f"{args[0]}/*/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create deployment
        deployment = aws.apigateway.Deployment(
            f"webhook-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[webhook_integration]
            )
        )

        # Create stage with throttling
        stage = aws.apigateway.Stage(
            f"webhook-stage-{self.environment_suffix}",
            rest_api=self.api.id,
            deployment=deployment.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            opts=ResourceOptions(parent=self)
        )

        # Configure stage settings with throttling
        stage_settings = aws.apigateway.MethodSettings(
            f"webhook-stage-settings-{self.environment_suffix}",
            rest_api=self.api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=1000,
                throttling_rate_limit=1000,
                logging_level="INFO",
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create event source mapping for router Lambda
        event_source_mapping = aws.lambda_.EventSourceMapping(
            f"router-event-source-{self.environment_suffix}",
            event_source_arn=self.validator_lambda.arn,
            function_name=self.router_lambda.name,
            enabled=True,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        pulumi.export("api_endpoint", pulumi.Output.concat(
            "https://",
            self.api.id,
            ".execute-api.us-east-1.amazonaws.com/prod/webhook"
        ))
        pulumi.export("validator_lambda_arn", self.validator_lambda.arn)
        pulumi.export("router_lambda_arn", self.router_lambda.arn)
        pulumi.export("payments_queue_url", self.payments_queue.url)
        pulumi.export("refunds_queue_url", self.refunds_queue.url)
        pulumi.export("disputes_queue_url", self.disputes_queue.url)
        pulumi.export("dynamodb_table_name", self.events_table.name)

        self.register_outputs({
            "api_endpoint": pulumi.Output.concat(
                "https://",
                self.api.id,
                ".execute-api.us-east-1.amazonaws.com/prod/webhook"
            ),
            "validator_lambda_arn": self.validator_lambda.arn,
            "router_lambda_arn": self.router_lambda.arn,
            "payments_queue_url": self.payments_queue.url,
            "refunds_queue_url": self.refunds_queue.url,
            "disputes_queue_url": self.disputes_queue.url
        })

    def _get_validator_code(self) -> str:
        """Returns the Lambda code for webhook validator."""
        return """
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])

        # Extract required fields
        event_id = body['event_id']
        transaction_type = body['transaction_type']
        amount = body['amount']
        timestamp = body['timestamp']

        # Check for duplicate event
        response = table.get_item(Key={'event_id': event_id})
        if 'Item' in response:
            return {
                'statusCode': 409,
                'body': json.dumps({'error': 'Duplicate event'})
            }

        # Store event ID for deduplication
        table.put_item(Item={
            'event_id': event_id,
            'transaction_type': transaction_type,
            'amount': amount,
            'timestamp': timestamp,
            'processed_at': datetime.utcnow().isoformat()
        })

        # Return validated event
        return {
            'statusCode': 200,
            'body': json.dumps({
                'event_id': event_id,
                'transaction_type': transaction_type,
                'amount': amount,
                'timestamp': timestamp
            })
        }

    except KeyError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Missing required field: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

    def _get_router_code(self) -> str:
        """Returns the Lambda code for event router."""
        return """
import json
import os
import boto3

sqs = boto3.client('sqs')

PAYMENTS_QUEUE_URL = os.environ['PAYMENTS_QUEUE_URL']
REFUNDS_QUEUE_URL = os.environ['REFUNDS_QUEUE_URL']
DISPUTES_QUEUE_URL = os.environ['DISPUTES_QUEUE_URL']

def handler(event, context):
    try:
        # Parse the event from validator Lambda
        body = json.loads(event['body'])
        transaction_type = body['transaction_type']

        # Route to appropriate queue based on transaction type
        if transaction_type == 'payment':
            queue_url = PAYMENTS_QUEUE_URL
        elif transaction_type == 'refund':
            queue_url = REFUNDS_QUEUE_URL
        elif transaction_type == 'dispute':
            queue_url = DISPUTES_QUEUE_URL
        else:
            raise ValueError(f'Unknown transaction type: {transaction_type}')

        # Send message to SQS queue
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(body)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event routed successfully',
                'message_id': response['MessageId']
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
```

## File: lib/__init__.py

```python
"""
Infrastructure library for TAP Pulumi stack.
"""
```
