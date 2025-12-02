"""
Pulumi stack for serverless webhook processing system.
Implements API Gateway, Lambda, DynamoDB, S3, SQS, EventBridge infrastructure.
"""

from typing import Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output

class TapStackArgs:
    """Arguments for TapStack component."""

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}

class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for webhook processing system.
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

        # Merge default tags
        resource_tags = {
            'Environment': self.environment_suffix,
            'Service': 'webhook-processing',
            **self.tags
        }

        # 1. S3 Bucket for webhook payload storage
        self.payload_bucket = aws.s3.Bucket(
            f'webhook-payloads-{self.environment_suffix}',
            bucket=f'webhook-payloads-{self.environment_suffix}-{pulumi.get_stack()}'.lower(),
            force_destroy=True,
            tags=resource_tags,
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id='archive-old-payloads',
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=30,
                            storage_class='GLACIER'
                        )
                    ]
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f'webhook-payloads-pab-{self.environment_suffix}',
            bucket=self.payload_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.payload_bucket)
        )

        # 2. DynamoDB table for webhook metadata
        self.webhook_table = aws.dynamodb.Table(
            f'webhook-metadata-{self.environment_suffix}',
            name=f'webhook-metadata-{self.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='webhook_id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='webhook_id',
                    type='S'
                )
            ],
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 3. SQS Dead Letter Queue (FIFO to match main queue)
        self.dead_letter_queue = aws.sqs.Queue(
            f'webhook-dlq-{self.environment_suffix}',
            name=f'webhook-dlq-{self.environment_suffix}.fifo',
            fifo_queue=True,
            message_retention_seconds=1209600,  # 14 days
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 4. SQS FIFO Queue for ordered processing
        self.processing_queue = aws.sqs.Queue(
            f'webhook-processing-queue-{self.environment_suffix}',
            name=f'webhook-processing-{self.environment_suffix}.fifo',
            fifo_queue=True,
            content_based_deduplication=True,
            message_retention_seconds=345600,  # 4 days
            visibility_timeout_seconds=180,
            redrive_policy=self.dead_letter_queue.arn.apply(
                lambda arn: json.dumps({
                    'deadLetterTargetArn': arn,
                    'maxReceiveCount': 3
                })
            ),
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 5. EventBridge custom event bus
        self.event_bus = aws.cloudwatch.EventBus(
            f'webhook-events-{self.environment_suffix}',
            name=f'webhook-events-{self.environment_suffix}',
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 6. IAM role for ingestion Lambda
        self.ingestion_role = aws.iam.Role(
            f'webhook-ingestion-role-{self.environment_suffix}',
            name=f'webhook-ingestion-role-{self.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution role
        aws.iam.RolePolicyAttachment(
            f'ingestion-lambda-basic-{self.environment_suffix}',
            role=self.ingestion_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self.ingestion_role)
        )

        # Attach X-Ray write permissions
        aws.iam.RolePolicyAttachment(
            f'ingestion-xray-{self.environment_suffix}',
            role=self.ingestion_role.name,
            policy_arn='arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
            opts=ResourceOptions(parent=self.ingestion_role)
        )

        # Custom policy for ingestion Lambda
        ingestion_policy = aws.iam.RolePolicy(
            f'ingestion-policy-{self.environment_suffix}',
            role=self.ingestion_role.id,
            policy=Output.all(
                self.payload_bucket.arn,
                self.webhook_table.arn,
                self.processing_queue.arn
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': ['s3:PutObject', 's3:PutObjectAcl'],
                        'Resource': f'{args[0]}/*'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['dynamodb:PutItem'],
                        'Resource': args[1]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['sqs:SendMessage', 'sqs:GetQueueUrl'],
                        'Resource': args[2]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.ingestion_role)
        )

        # 7. CloudWatch Log Group for ingestion Lambda
        self.ingestion_log_group = aws.cloudwatch.LogGroup(
            f'ingestion-logs-{self.environment_suffix}',
            name=f'/aws/lambda/webhook-ingestion-{self.environment_suffix}',
            retention_in_days=7,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 8. Lambda function for webhook ingestion
        self.ingestion_function = aws.lambda_.Function(
            f'webhook-ingestion-{self.environment_suffix}',
            name=f'webhook-ingestion-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.handler',
            role=self.ingestion_role.arn,
            memory_size=256,
            timeout=30,
            code=pulumi.FileArchive('./lib/lambda/ingestion'),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.payload_bucket.id,
                    'TABLE_NAME': self.webhook_table.name,
                    'QUEUE_URL': self.processing_queue.url,
                    'ENVIRONMENT': self.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active'
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.ingestion_log_group, ingestion_policy]
            )
        )

        # 9. IAM role for processing Lambda
        self.processing_role = aws.iam.Role(
            f'webhook-processing-role-{self.environment_suffix}',
            name=f'webhook-processing-role-{self.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution role
        aws.iam.RolePolicyAttachment(
            f'processing-lambda-basic-{self.environment_suffix}',
            role=self.processing_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self.processing_role)
        )

        # Attach X-Ray write permissions
        aws.iam.RolePolicyAttachment(
            f'processing-xray-{self.environment_suffix}',
            role=self.processing_role.name,
            policy_arn='arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
            opts=ResourceOptions(parent=self.processing_role)
        )

        # Custom policy for processing Lambda
        processing_policy = aws.iam.RolePolicy(
            f'processing-policy-{self.environment_suffix}',
            role=self.processing_role.id,
            policy=Output.all(
                self.processing_queue.arn,
                self.event_bus.arn
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'sqs:ReceiveMessage',
                            'sqs:DeleteMessage',
                            'sqs:GetQueueAttributes'
                        ],
                        'Resource': args[0]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['events:PutEvents'],
                        'Resource': args[1]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.processing_role)
        )

        # 10. CloudWatch Log Group for processing Lambda
        self.processing_log_group = aws.cloudwatch.LogGroup(
            f'processing-logs-{self.environment_suffix}',
            name=f'/aws/lambda/webhook-processing-{self.environment_suffix}',
            retention_in_days=7,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 11. Lambda function for webhook processing
        self.processing_function = aws.lambda_.Function(
            f'webhook-processing-{self.environment_suffix}',
            name=f'webhook-processing-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.handler',
            role=self.processing_role.arn,
            memory_size=256,
            timeout=30,
            code=pulumi.FileArchive('./lib/lambda/processing'),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'EVENT_BUS_NAME': self.event_bus.name,
                    'ENVIRONMENT': self.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active'
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.processing_log_group, processing_policy]
            )
        )

        # 12. SQS trigger for processing Lambda
        self.queue_trigger = aws.lambda_.EventSourceMapping(
            f'queue-trigger-{self.environment_suffix}',
            event_source_arn=self.processing_queue.arn,
            function_name=self.processing_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self.processing_function)
        )

        # 13. API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f'webhook-api-{self.environment_suffix}',
            name=f'webhook-api-{self.environment_suffix}',
            description='Webhook ingestion API',
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # 14. API Gateway request validator
        self.request_validator = aws.apigateway.RequestValidator(
            f'webhook-validator-{self.environment_suffix}',
            rest_api=self.api.id,
            name='webhook-validator',
            validate_request_parameters=True,
            validate_request_body=False,
            opts=ResourceOptions(parent=self.api)
        )

        # 15. API Gateway resource for /webhook
        self.webhook_resource = aws.apigateway.Resource(
            f'webhook-resource-{self.environment_suffix}',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='webhook',
            opts=ResourceOptions(parent=self.api)
        )

        # 16. API Gateway POST method
        self.webhook_method = aws.apigateway.Method(
            f'webhook-method-{self.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.webhook_resource.id,
            http_method='POST',
            authorization='NONE',
            request_parameters={
                'method.request.header.X-Webhook-Signature': True,
                'method.request.header.X-Provider-ID': True
            },
            request_validator_id=self.request_validator.id,
            opts=ResourceOptions(parent=self.webhook_resource)
        )

        # 17. API Gateway Lambda integration
        self.webhook_integration = aws.apigateway.Integration(
            f'webhook-integration-{self.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.webhook_resource.id,
            http_method=self.webhook_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=self.ingestion_function.invoke_arn,
            opts=ResourceOptions(parent=self.webhook_method)
        )

        # 18. Lambda permission for API Gateway
        self.api_lambda_permission = aws.lambda_.Permission(
            f'api-invoke-lambda-{self.environment_suffix}',
            action='lambda:InvokeFunction',
            function=self.ingestion_function.name,
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(self.api.execution_arn, self.webhook_resource.path, self.webhook_method.http_method).apply(
                lambda args: f'{args[0]}/*/{args[2]}{args[1]}'
            ),
            opts=ResourceOptions(parent=self.ingestion_function)
        )

        # 19. API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f'webhook-deployment-{self.environment_suffix}',
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self.api,
                depends_on=[self.webhook_integration]
            )
        )

        # 20. API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f'webhook-stage-{self.environment_suffix}',
            rest_api=self.api.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            tags=resource_tags,
            opts=ResourceOptions(parent=self.api_deployment)
        )

        # 21. API Gateway throttling settings
        self.throttle_settings = aws.apigateway.MethodSettings(
            f'throttle-settings-{self.environment_suffix}',
            rest_api=self.api.id,
            stage_name=self.api_stage.stage_name,
            method_path='*/*',
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=5000,
                throttling_rate_limit=10000,
                logging_level='INFO',
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            opts=ResourceOptions(parent=self.api_stage)
        )

        # 22. EventBridge rule for Stripe webhooks (example)
        self.stripe_rule = aws.cloudwatch.EventRule(
            f'stripe-webhook-rule-{self.environment_suffix}',
            name=f'stripe-webhook-rule-{self.environment_suffix}',
            event_bus_name=self.event_bus.name,
            description='Route Stripe webhook events',
            event_pattern=json.dumps({
                'source': ['webhook.processor'],
                'detail-type': ['Webhook Processed'],
                'detail': {
                    'provider': ['stripe']
                }
            }),
            tags=resource_tags,
            opts=ResourceOptions(parent=self.event_bus)
        )

        # 23. EventBridge CloudWatch Logs target (example)
        self.event_log_group = aws.cloudwatch.LogGroup(
            f'webhook-events-log-{self.environment_suffix}',
            name=f'/aws/events/webhook-events-{self.environment_suffix}',
            retention_in_days=7,
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        self.stripe_rule_target = aws.cloudwatch.EventTarget(
            f'stripe-rule-target-{self.environment_suffix}',
            rule=self.stripe_rule.name,
            event_bus_name=self.event_bus.name,
            arn=self.event_log_group.arn.apply(
                lambda arn: arn.replace(':log-group:', ':log-group:/aws/events/')
            ),
            opts=ResourceOptions(parent=self.stripe_rule)
        )

        # Export stack outputs
        self.api_endpoint = Output.concat(
            'https://',
            self.api.id,
            '.execute-api.us-east-1.amazonaws.com/',
            self.api_stage.stage_name,
            '/webhook'
        )

        self.register_outputs({
            'api_endpoint': self.api_endpoint,
            'dynamodb_table_name': self.webhook_table.name,
            's3_bucket_name': self.payload_bucket.id,
            'sqs_queue_url': self.processing_queue.url,
            'eventbridge_bus_arn': self.event_bus.arn,
            'ingestion_function_name': self.ingestion_function.name,
            'processing_function_name': self.processing_function.name
        })
