import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_sqs as sqs,
    aws_lambda_event_sources as lambda_event_sources,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct
import time


class TapStack(Stack):
    """Main stack for TAP serverless infrastructure"""

    def __init__(self, scope: Construct, construct_id: str, 
                 project_name: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.project_name = project_name
        self.environment_suffix = environment_suffix
        # Add unique suffix to avoid resource conflicts
        self.unique_suffix = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        
        # Common tags for all resources
        self.common_tags = {
            "Project": project_name,
            "Environment": environment_suffix
        }
        
        # Apply tags to the stack
        cdk.Tags.of(self).add("Project", project_name)
        cdk.Tags.of(self).add("Environment", environment_suffix)
        
        # Create VPC and networking
        self.vpc = self._create_vpc()
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create S3 buckets
        self.s3_buckets = self._create_s3_buckets()
        
        # Create SQS queue for async processing
        self.sqs_queue = self._create_sqs_queue()
        
        # Create EventBridge custom bus
        self.event_bus = self._create_event_bus()
        
        # Create Lambda functions
        self.lambda_functions = self._create_lambda_functions()
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        
        # Create EventBridge rules
        self._create_event_rules()
        
        # Output important values
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        vpc = ec2.Vpc(
            self, "TapVpc",
            vpc_name=f"{self.project_name}-{self.environment_suffix}-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # VPC Endpoints for AWS services (cost optimization)
        vpc.add_gateway_endpoint("S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )
        
        vpc.add_gateway_endpoint("DynamoDbEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )
        
        return vpc

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with on-demand billing"""
        table = dynamodb.Table(
            self, "TapTable",
            table_name=f"{self.project_name}-{self.environment_suffix}-data-{self.unique_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix == "dev" else RemovalPolicy.RETAIN,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Add GSI for querying by different access patterns
        table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=dynamodb.Attribute(
                name="gsi1pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="gsi1sk",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        return table

    def _create_s3_buckets(self) -> dict:
        """Create S3 buckets with lifecycle policies"""
        buckets = {}
        
        # Data bucket with lifecycle policy
        data_bucket = s3.Bucket(
            self, "TapDataBucket",
            bucket_name=f"{self.project_name}-{self.environment_suffix}-data-{self.unique_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix == "dev" else RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(365)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )
        
        # Logs bucket
        logs_bucket = s3.Bucket(
            self, "TapLogsBucket",
            bucket_name=f"{self.project_name}-{self.environment_suffix}-logs-{self.unique_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix == "dev" else RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )
        
        buckets["data"] = data_bucket
        buckets["logs"] = logs_bucket
        
        return buckets

    def _create_sqs_queue(self) -> sqs.Queue:
        """Create SQS queue for async processing"""
        # Dead letter queue
        dlq = sqs.Queue(
            self, "TapDLQ",
            queue_name=f"{self.project_name}-{self.environment_suffix}-dlq-{self.unique_suffix}",
            retention_period=Duration.days(14)
        )
        
        # Main queue
        queue = sqs.Queue(
            self, "TapQueue",
            queue_name=f"{self.project_name}-{self.environment_suffix}-async-queue-{self.unique_suffix}",
            visibility_timeout=Duration.minutes(5),
            retention_period=Duration.days(14),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            )
        )
        
        return queue

    def _create_event_bus(self) -> events.EventBus:
        """Create custom EventBridge bus"""
        event_bus = events.EventBus(
            self, "TapEventBus",
            event_bus_name=f"{self.project_name}-{self.environment_suffix}-events-{self.unique_suffix}"
        )
        
        return event_bus

    def _create_lambda_functions(self) -> dict:
        """Create Lambda functions with proper IAM roles"""
        functions = {}
        
        # Security group for Lambda functions
        lambda_sg = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )
        
        # Common Lambda execution role
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Add permissions for DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*"
                ]
            )
        )
        
        # Add permissions for S3
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[
                    f"{self.s3_buckets['data'].bucket_arn}/*",
                    f"{self.s3_buckets['logs'].bucket_arn}/*"
                ]
            )
        )
        
        # Add permissions for SQS
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                ],
                resources=[self.sqs_queue.queue_arn]
            )
        )
        
        # Add permissions for EventBridge
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "events:PutEvents"
                ],
                resources=[self.event_bus.event_bus_arn]
            )
        )
        
        # API Handler Lambda
        api_handler = _lambda.Function(
            self, "ApiHandler",
            function_name=f"{self.project_name}-{self.environment_suffix}-api-handler-{self.unique_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        if http_method == 'GET' and path == '/health':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})
            }
        
        elif http_method == 'POST' and path == '/data':
            body = json.loads(event['body']) if event['body'] else {}
            
            # Store in DynamoDB
            item = {
                'pk': f"DATA#{body.get('id', 'unknown')}",
                'sk': datetime.utcnow().isoformat(),
                'data': body,
                'created_at': datetime.utcnow().isoformat()
            }
            
            table.put_item(Item=item)
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Data stored successfully', 'item': item})
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not found'})
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "BUCKET_NAME": self.s3_buckets["data"].bucket_name,
                "QUEUE_URL": self.sqs_queue.queue_url,
                "EVENT_BUS_NAME": self.event_bus.event_bus_name
            },
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Async Processor Lambda
        async_processor = _lambda.Function(
            self, "AsyncProcessor",
            function_name=f"{self.project_name}-{self.environment_suffix}-async-processor-{self.unique_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    try:
        print(f"Processing {len(event['Records'])} messages")
        
        for record in event['Records']:
            # Process SQS message
            body = json.loads(record['body'])
            print(f"Processing message: {body}")
            
            # Add your async processing logic here
            # For example: image processing, data transformation, etc.
            
        return {'statusCode': 200, 'body': 'Messages processed successfully'}
        
    except Exception as e:
        print(f"Error processing messages: {str(e)}")
        raise e
            """),
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "BUCKET_NAME": self.s3_buckets["data"].bucket_name
            },
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.minutes(5),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Add SQS trigger to async processor
        async_processor.add_event_source(
            lambda_event_sources.SqsEventSource(
                self.sqs_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(5)
            )
        )
        
        # Event Processor Lambda
        event_processor = _lambda.Function(
            self, "EventProcessor",
            function_name=f"{self.project_name}-{self.environment_suffix}-event-processor-{self.unique_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3

def handler(event, context):
    try:
        print(f"Processing EventBridge event: {json.dumps(event)}")
        
        # Process the event
        detail = event.get('detail', {})
        source = event.get('source', '')
        
        print(f"Event from {source}: {detail}")
        
        # Add your event processing logic here
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        raise e
            """),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        
        functions["api_handler"] = api_handler
        functions["async_processor"] = async_processor
        functions["event_processor"] = event_processor
        
        return functions

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with Lambda integration"""
        api = apigateway.RestApi(
            self, "TapApi",
            rest_api_name=f"{self.project_name}-{self.environment_suffix}-api",
            description=f"API for {self.project_name} {self.environment_suffix}",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment_suffix,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_functions["api_handler"],
            proxy=True
        )
        
        # Add resources and methods
        api.root.add_method("ANY", lambda_integration)
        
        # Health check endpoint
        health = api.root.add_resource("health")
        health.add_method("GET", lambda_integration)
        
        # Data endpoint
        data = api.root.add_resource("data")
        data.add_method("POST", lambda_integration)
        data.add_method("GET", lambda_integration)
        
        return api

    def _create_event_rules(self):
        """Create EventBridge rules"""
        # Rule for processing custom events
        events.Rule(
            self, "CustomEventRule",
            event_bus=self.event_bus,
            event_pattern=events.EventPattern(
                source=[f"{self.project_name}.custom"],
                detail_type=["Custom Event"]
            ),
            targets=[
                events_targets.LambdaFunction(self.lambda_functions["event_processor"])
            ]
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "DynamoDbTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )
        
        CfnOutput(
            self, "S3DataBucketName",
            value=self.s3_buckets["data"].bucket_name,
            description="S3 Data Bucket Name"
        )
        
        CfnOutput(
            self, "SqsQueueUrl",
            value=self.sqs_queue.queue_url,
            description="SQS Queue URL"
        )
        
        CfnOutput(
            self, "EventBusName",
            value=self.event_bus.event_bus_name,
            description="EventBridge Bus Name"
        )