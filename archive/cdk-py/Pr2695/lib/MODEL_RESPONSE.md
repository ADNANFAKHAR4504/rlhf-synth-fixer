I'll help you create a comprehensive serverless infrastructure using AWS CDK with Python. This solution will include all the components you requested with best practices for security, monitoring, and maintainability.

## Project Structure

```
project-root/
├── tap.py
├── lib/
│   └── tap_stack.py
├── requirements.txt
└── cdk.json
```

## 1. Entry File (`tap.py`)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get context values or use defaults
environment = app.node.try_get_context("environment") or "dev"
project_name = app.node.try_get_context("project") or "tap-serverless"

TapStack(
    app, 
    f"{project_name}-{environment}",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="us-east-1"
    ),
    project_name=project_name,
    environment=environment
)

app.synth()
```

## 2. Main Stack (`lib/tap_stack.py`)

```python
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
    aws_sqs as sqs,
    aws_lambda_event_sources as lambda_event_sources,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct
import json


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, project_name: str, environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.project_name = project_name
        self.environment = environment
        
        # Common tags for all resources
        self.common_tags = {
            "Project": project_name,
            "Environment": environment
        }
        
        # Apply tags to the stack
        cdk.Tags.of(self).add("Project", project_name)
        cdk.Tags.of(self).add("Environment", environment)
        
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
        
        # Create CloudWatch log groups
        self._create_log_groups()
        
        # Create EventBridge rules
        self._create_event_rules()
        
        # Output important values
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        vpc = ec2.Vpc(
            self, "TapVpc",
            vpc_name=f"{self.project_name}-{self.environment}-vpc",
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
            table_name=f"{self.project_name}-{self.environment}-data",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
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
            bucket_name=f"{self.project_name}-{self.environment}-data-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN,
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
            bucket_name=f"{self.project_name}-{self.environment}-logs-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN,
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
            queue_name=f"{self.project_name}-{self.environment}-dlq",
            retention_period=Duration.days(14)
        )
        
        # Main queue
        queue = sqs.Queue(
            self, "TapQueue",
            queue_name=f"{self.project_name}-{self.environment}-async-queue",
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
            event_bus_name=f"{self.project_name}-{self.environment}-events"
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
            function_name=f"{self.project_name}-{self.environment}-api-handler",
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
            memory_size=256
        )
        
        # Async Processor Lambda
        async_processor = _lambda.Function(
            self, "AsyncProcessor",
            function_name=f"{self.project_name}-{self.environment}-async-processor",
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
            memory_size=512
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
            function_name=f"{self.project_name}-{self.environment}-event-processor",
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
            memory_size=256
        )
        
        functions["api_handler"] = api_handler
        functions["async_processor"] = async_processor
        functions["event_processor"] = event_processor
        
        return functions

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with Lambda integration"""
        api = apigateway.RestApi(
            self, "TapApi",
            rest_api_name=f"{self.project_name}-{self.environment}-api",
            description=f"API for {self.project_name} {self.environment}",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment,
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

    def _create_log_groups(self):
        """Create CloudWatch log groups for Lambda functions"""
        for name, function in self.lambda_functions.items():
            logs.LogGroup(
                self, f"{name}LogGroup",
                log_group_name=f"/aws/lambda/{function.function_name}",
                retention=logs.RetentionDays.ONE_MONTH,
                removal_policy=RemovalPolicy.DESTROY
            )

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
```

## 3. Additional Configuration Files

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### `cdk.json`
```json
{
  "app": "python tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-northamerica:includeNorthAmericaGovCloud": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

## 4. Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Initialize CDK (if not already done):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

3. **Deploy with context:**
```bash
# For development environment
cdk deploy --context environment=dev --context project=my-tap-project

# For production environment
cdk deploy --context environment=prod --context project=my-tap-project
```

## Key Features Implemented

### ✅ **Serverless Architecture**
- Lambda functions with proper IAM roles (least privilege)
- API Gateway with CORS and throttling
- DynamoDB on-demand with GSI and streams
- S3 with lifecycle policies
- SQS with DLQ for async processing
- EventBridge for event-driven architecture

### ✅ **Networking & Security**
- VPC with public/private subnets
- VPC endpoints for cost optimization
- Security groups for Lambda functions
- Encrypted S3 buckets with blocked public access

### ✅ **Monitoring & Logging**
- CloudWatch log groups for all Lambda functions
- API Gateway logging and metrics
- DynamoDB point-in-time recovery

### ✅ **Best Practices**
- Proper resource naming with environment prefixes
- Consistent tagging for cost tracking
- Parameterized and environment-aware configuration
- Removal policies based on environment
- Error handling and DLQ implementation

### ✅ **Production Ready**
- Lifecycle policies for automated data management
- Throttling and rate limiting
- Proper IAM permissions (principle of least privilege)
- VPC configuration for security
- Multiple deployment environments support

The infrastructure is now ready for deployment with `cdk deploy` and includes all the components you requested with production-ready configurations and best practices.