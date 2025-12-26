"""
TapStack - Main infrastructure component for IaC - AWS Nova Model Breaking
Serverless architecture with Lambda, API Gateway, S3, Kinesis, and CloudWatch
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class TapStackArgs:
    """Configuration arguments for TapStack deployment"""
    
    def __init__(
        self,
        *,
        environment_suffix: str = "dev",
        region: str = "us-east-1",
        project_name: str = "NovaModelBreaking",
        enable_multi_region: bool = False,
        lambda_memory_size: int = 256,
        lambda_timeout: int = 30,
        kinesis_shard_count: int = 1,
        s3_lifecycle_days: int = 30,
        cloudwatch_retention_days: int = 14,
        enable_xray_tracing: bool = False,  # Disabled for LocalStack compatibility
        custom_tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment_suffix  # Compatibility alias
        self.region = region
        self.project_name = project_name
        self.enable_multi_region = enable_multi_region
        self.lambda_memory_size = lambda_memory_size
        self.lambda_timeout = lambda_timeout
        self.kinesis_shard_count = kinesis_shard_count
        self.s3_lifecycle_days = s3_lifecycle_days
        self.cloudwatch_retention_days = cloudwatch_retention_days
        self.enable_xray_tracing = enable_xray_tracing
        self.custom_tags = custom_tags or {}


class TapStack(ComponentResource):
    """
    Main infrastructure stack for Nova Model Breaking serverless architecture.
    Deploys Lambda functions, API Gateway, S3 buckets, Kinesis streams, and monitoring.
    """
    
    def __init__(
        self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None
    ):
        super().__init__("tap:index:TapStack", name, {}, opts)
        
        # Initialize configuration and tags
        self.config = pulumi.Config()
        self.args = args
        # Try to get region from AWS provider or use args region
        try:
            self.region = aws.get_region().name
        except Exception:  # pylint: disable=broad-exception-caught
            self.region = args.region
        
        # Standard tagging policy for all resources
        self.tags = {
            "Project": args.project_name,
            "Environment": args.environment,
            "Region": self.region,
            "ManagedBy": "Pulumi",
            "Stack": pulumi.get_stack(),
            **args.custom_tags
        }
        
        # Resource naming convention
        # Shortened to avoid AWS 64-char limit for IAM roles
        # Take first 3 letters of each word in project name, lowercase
        project_words = args.project_name.replace('-', ' ').replace('_', ' ').split()
        if len(project_words) == 1:
            project_abbrev = project_words[0][:3].lower()
        else:
            project_abbrev = ''.join(word[0].lower() for word in project_words)
        region_abbrev = self.region.replace("us-east-1", "use1").replace("us-west-2", "usw2").replace("us-west-1", "usw1").replace("us-east-2", "use2")
        self.resource_prefix = f"{project_abbrev}-{args.environment}-{region_abbrev}"
        
        # Initialize resource containers
        self.lambda_functions = {}
        self.iam_roles = {}
        self.s3_buckets = {}
        self.kinesis_streams = {}
        self.secrets = {}
        self.cloudwatch_log_groups = {}
        self.api_gateway = None
        
        # Create infrastructure components in order
        self._create_secrets_manager()
        self._create_s3_buckets()
        self._create_kinesis_streams()
        self._create_lambdas()
        self._create_api_gateway()
        self._create_cloudwatch_monitoring()
        
        # Register stack outputs
        self.register_outputs({
            "api_gateway_url": (
                pulumi.Output.concat(
                    self.api_gateway.api_endpoint, "/", args.environment
                ) if self.api_gateway else None
            ),
            "lambda_functions": {
                name: func.arn for name, func in self.lambda_functions.items()
            },
            "s3_buckets": {
                name: bucket.bucket for name, bucket in self.s3_buckets.items()
            },
            "kinesis_streams": {
                name: stream.arn for name, stream in self.kinesis_streams.items()
            },
            "region": self.region,
            "environment": args.environment
        })
    
    def _create_secrets_manager(self):
        """Create AWS Secrets Manager secrets for secure configuration"""
        
        # KMS key for encrypting secrets
        secrets_kms_key = aws.kms.Key(
            f"{self.resource_prefix}-secrets-key",
            description="KMS key for encrypting Secrets Manager secrets",
            deletion_window_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # KMS key alias for easier reference
        aws.kms.Alias(
            f"{self.resource_prefix}-secrets-key-alias",
            name=f"alias/{self.resource_prefix}-secrets",
            target_key_id=secrets_kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )
        
        # Database connection secrets
        db_secret = aws.secretsmanager.Secret(
            f"{self.resource_prefix}-db-credentials",
            name=f"{self.resource_prefix}-db-credentials",
            description="Database connection credentials for Nova Model Breaking",
            kms_key_id=secrets_kms_key.arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # API keys and external service credentials
        api_keys_secret = aws.secretsmanager.Secret(
            f"{self.resource_prefix}-api-keys",
            name=f"{self.resource_prefix}-api-keys",
            description="API keys and external service credentials",
            kms_key_id=secrets_kms_key.arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Store secrets for Lambda access
        self.secrets = {
            "db_credentials": db_secret,
            "api_keys": api_keys_secret,
            "kms_key": secrets_kms_key
        }
    
    def _create_s3_buckets(self):
        """Create S3 buckets with versioning, encryption, and lifecycle policies"""
        
        # Data processing bucket for input/output files
        data_bucket = aws.s3.Bucket(
            f"{self.resource_prefix}-data-bucket",
            bucket=f"{self.resource_prefix}-data",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Configure bucket versioning
        aws.s3.BucketVersioningV2(
            f"{self.resource_prefix}-data-bucket-versioning",
            bucket=data_bucket.id,
            versioning_configuration=(
                aws.s3.BucketVersioningV2VersioningConfigurationArgs(status="Enabled")
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # Configure server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{self.resource_prefix}-data-bucket-encryption",
            bucket=data_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                            sse_algorithm="AES256"
                        )
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self)
        )
        
        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfigurationV2(
            f"{self.resource_prefix}-data-bucket-lifecycle",
            bucket=data_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="delete_old_versions",
                    status="Enabled",
                    noncurrent_version_expiration=(
                        aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(  # pylint: disable=line-too-long
                            noncurrent_days=self.args.s3_lifecycle_days
                        )
                    ),
                    abort_incomplete_multipart_upload=(
                        aws.s3.BucketLifecycleConfigurationV2RuleAbortIncompleteMultipartUploadArgs(  # pylint: disable=line-too-long
                            days_after_initiation=7
                        )
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.resource_prefix}-data-bucket-pab",
            bucket=data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        # Logs bucket for storing access logs
        logs_bucket = aws.s3.Bucket(
            f"{self.resource_prefix}-logs-bucket",
            bucket=f"{self.resource_prefix}-logs",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Block public access for logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"{self.resource_prefix}-logs-bucket-pab",
            bucket=logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        self.s3_buckets = {
            "data": data_bucket,
            "logs": logs_bucket
        }
    
    def _create_kinesis_streams(self):
        """Create Kinesis streams for real-time data processing"""
        
        # Main data processing stream
        data_stream = aws.kinesis.Stream(
            f"{self.resource_prefix}-data-stream",
            name=f"{self.resource_prefix}-data-stream",
            shard_count=self.args.kinesis_shard_count,
            retention_period=24,  # 24 hours retention
            # Encryption disabled for LocalStack compatibility
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Error stream for failed processing events
        error_stream = aws.kinesis.Stream(
            f"{self.resource_prefix}-error-stream",
            name=f"{self.resource_prefix}-error-stream",
            shard_count=1,
            retention_period=168,  # 7 days retention for errors
            # Encryption disabled for LocalStack compatibility
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        self.kinesis_streams = {
            "data": data_stream,
            "error": error_stream
        }
    
    def _create_lambdas(self):
        """Create Lambda functions with dedicated IAM roles and configuration"""
        
        # Lambda execution role for data processing
        data_processor_role = aws.iam.Role(
            f"{self.resource_prefix}-data-processor-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Basic Lambda execution policy (inline for LocalStack compatibility)
        aws.iam.RolePolicy(
            f"{self.resource_prefix}-data-processor-basic-execution",
            role=data_processor_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        # Custom policy for data processor Lambda
        _data_processor_policy = aws.iam.RolePolicy(
            f"{self.resource_prefix}-data-processor-policy",
            role=data_processor_role.id,
            policy=pulumi.Output.all(
                self.s3_buckets["data"].arn,
                self.kinesis_streams["data"].arn,
                self.kinesis_streams["error"].arn,
                self.secrets["db_credentials"].arn,
                self.secrets["api_keys"].arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:DescribeStream",
                            "kinesis:GetShardIterator",
                            "kinesis:GetRecords",
                            "kinesis:ListShards",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": [args[1], args[2]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": [args[3], args[4]]
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
            })),
            opts=ResourceOptions(parent=self)
        )
        
        # Data processing Lambda function
        data_processor_lambda = aws.lambda_.Function(
            f"{self.resource_prefix}-data-processor",
            name=f"{self.resource_prefix}-data-processor",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset("""
import json
import boto3
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    \"\"\"Process incoming data events\"\"\"
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        # Get environment variables
        data_bucket = os.environ['DATA_BUCKET']
        error_stream = os.environ['ERROR_STREAM']
        
        # Process the event
        result = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'processed_records': len(event.get('Records', []))
            })
        }
        
        logger.info(f"Processing completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
                """)
            }),
            handler="lambda_function.lambda_handler",
            role=data_processor_role.arn,
            memory_size=self.args.lambda_memory_size,
            timeout=self.args.lambda_timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DATA_BUCKET": self.s3_buckets["data"].bucket,
                    "ERROR_STREAM": self.kinesis_streams["error"].name,
                    "ENVIRONMENT": self.args.environment,
                    "REGION": self.region
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.args.enable_xray_tracing else "PassThrough"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # API handler Lambda role
        api_handler_role = aws.iam.Role(
            f"{self.resource_prefix}-api-handler-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Basic Lambda execution policy (inline for LocalStack compatibility)
        aws.iam.RolePolicy(
            f"{self.resource_prefix}-api-handler-basic-execution",
            role=api_handler_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        # API handler Lambda function
        api_handler_lambda = aws.lambda_.Function(
            f"{self.resource_prefix}-api-handler",
            name=f"{self.resource_prefix}-api-handler",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset("""
import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    \"\"\"Handle API Gateway requests\"\"\"
    try:
        logger.info(f"API request: {json.dumps(event)}")
        
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        if path == '/health':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'status': 'healthy',
                    'environment': os.environ.get('ENVIRONMENT', 'unknown')
                })
            }
        elif path == '/process':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'message': 'Processing request received',
                    'method': http_method
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not found'})
            }
            
    except Exception as e:
        logger.error(f"Error handling API request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
                """)
            }),
            handler="lambda_function.lambda_handler",
            role=api_handler_role.arn,
            memory_size=128,
            timeout=30,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.args.environment,
                    "REGION": self.region
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.args.enable_xray_tracing else "PassThrough"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Kinesis event source mapping for data processor
        aws.lambda_.EventSourceMapping(
            f"{self.resource_prefix}-kinesis-trigger",
            event_source_arn=self.kinesis_streams["data"].arn,
            function_name=data_processor_lambda.name,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=ResourceOptions(parent=self)
        )
        
        
        
        # Lambda permission for S3 to invoke the function
        self.lambda_permission = aws.lambda_.Permission(
            f"{self.resource_prefix}-s3-invoke-permission",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function=data_processor_lambda.name,
            principal="s3.amazonaws.com",
            source_arn=self.s3_buckets["data"].arn,
            opts=ResourceOptions(parent=self)
        )
        


        self.lambda_functions = {
            "data_processor": data_processor_lambda,
            "api_handler": api_handler_lambda
        }
        
        self.iam_roles = {
            "data_processor": data_processor_role,
            "api_handler": api_handler_role
        }

        # S3 bucket notification for data processor
        aws.s3.BucketNotification(
            f"{self.resource_prefix}-s3-notification",
            bucket=self.s3_buckets["data"].id,
            lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=data_processor_lambda.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="input/",
                filter_suffix=".json"
            )],
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_permission])
        )
    
    def _create_api_gateway(self):
        """Create API Gateway with Lambda integrations and custom authorizers"""
        
        # API Gateway REST API
        api = aws.apigatewayv2.Api(
            f"{self.resource_prefix}-api",
            name=f"{self.resource_prefix}-api",
            protocol_type="HTTP",
            description="Nova Model Breaking API Gateway",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_credentials=False,
                allow_headers=["content-type", "x-amz-date", "authorization", "x-api-key"],
                allow_methods=["*"],
                allow_origins=["*"],
                max_age=86400
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda integration for API handler
        api_integration = aws.apigatewayv2.Integration(
            f"{self.resource_prefix}-api-integration",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_uri=self.lambda_functions["api_handler"].invoke_arn,
            integration_method="POST",
            payload_format_version="2.0",
            opts=ResourceOptions(parent=self)
        )
        
        # Health check route
        _health_route = aws.apigatewayv2.Route(
            f"{self.resource_prefix}-health-route",
            api_id=api.id,
            route_key="GET /health",
            target=pulumi.Output.concat("integrations/", api_integration.id),
            opts=ResourceOptions(parent=self)
        )
        
        # Process route
        _process_route = aws.apigatewayv2.Route(
            f"{self.resource_prefix}-process-route",
            api_id=api.id,
            route_key="POST /process",
            target=pulumi.Output.concat("integrations/", api_integration.id),
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway stage
        _api_stage = aws.apigatewayv2.Stage(
            f"{self.resource_prefix}-api-stage",
            api_id=api.id,
            name=self.args.environment,
            auto_deploy=True,
            access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=pulumi.Output.concat(
                    "arn:aws:logs:",
                    self.region,
                    ":",
                    aws.get_caller_identity().account_id,
                    ":log-group:",
                    f"/aws/apigateway/{self.resource_prefix}-api"
                ),
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "caller": "$context.identity.caller",
                    "user": "$context.identity.user",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda permission for API Gateway
        aws.lambda_.Permission(
            f"{self.resource_prefix}-api-invoke-permission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=self.lambda_functions["api_handler"].name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )
        
        self.api_gateway = api
    
    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch log groups, alarms, and monitoring resources"""
        
        # Log group for API Gateway
        _api_log_group = aws.cloudwatch.LogGroup(
            f"{self.resource_prefix}-api-logs",
            name=f"/aws/apigateway/{self.resource_prefix}-api",
            retention_in_days=self.args.cloudwatch_retention_days,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Log groups for Lambda functions
        for name, lambda_func in self.lambda_functions.items():
            log_group = aws.cloudwatch.LogGroup(
                f"{self.resource_prefix}-{name}-logs",
                name=pulumi.Output.concat("/aws/lambda/", lambda_func.name),
                retention_in_days=self.args.cloudwatch_retention_days,
                tags=self.tags,
                opts=ResourceOptions(parent=self)
            )
            self.cloudwatch_log_groups[name] = log_group
        
        # SNS topic for alarm notifications
        alarm_topic = aws.sns.Topic(
            f"{self.resource_prefix}-alarms",
            name=f"{self.resource_prefix}-alarms",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch alarms for Lambda errors
        for name, lambda_func in self.lambda_functions.items():
            aws.cloudwatch.MetricAlarm(
                f"{self.resource_prefix}-{name}-errors",
                name=f"{self.resource_prefix}-{name}-errors",
                alarm_description=f"Lambda errors for {name}",
                metric_name="Errors",
                namespace="AWS/Lambda",
                statistic="Sum",
                period=300,
                evaluation_periods=2,
                threshold=1,
                comparison_operator="GreaterThanOrEqualToThreshold",
                dimensions={"FunctionName": lambda_func.name},
                alarm_actions=[alarm_topic.arn],
                tags=self.tags,
                opts=ResourceOptions(parent=self)
            )
            
            # Duration alarm
            aws.cloudwatch.MetricAlarm(
                f"{self.resource_prefix}-{name}-duration",
                name=f"{self.resource_prefix}-{name}-duration",
                alarm_description=f"Lambda duration for {name}",
                metric_name="Duration",
                namespace="AWS/Lambda",
                statistic="Average",
                period=300,
                evaluation_periods=2,
                threshold=self.args.lambda_timeout * 1000 * 0.8,  # 80% of timeout
                comparison_operator="GreaterThanThreshold",
                dimensions={"FunctionName": lambda_func.name},
                alarm_actions=[alarm_topic.arn],
                tags=self.tags,
                opts=ResourceOptions(parent=self)
            )
        
        # API Gateway 4XX errors alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.resource_prefix}-api-4xx-errors",
            name=f"{self.resource_prefix}-api-4xx-errors",
            alarm_description="API Gateway 4XX errors",
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            statistic="Sum",
            period=300,
            evaluation_periods=2,
            threshold=10,
            comparison_operator="GreaterThanThreshold",
            dimensions={"ApiName": f"{self.resource_prefix}-api"},
            alarm_actions=[alarm_topic.arn],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Kinesis incoming records alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.resource_prefix}-kinesis-incoming-records",
            name=f"{self.resource_prefix}-kinesis-incoming-records",
            alarm_description="Kinesis incoming records",
            metric_name="IncomingRecords",
            namespace="AWS/Kinesis",
            statistic="Sum",
            period=300,
            evaluation_periods=1,
            threshold=0,
            comparison_operator="LessThanOrEqualToThreshold",
            dimensions={"StreamName": self.kinesis_streams["data"].name},
            alarm_actions=[alarm_topic.arn],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
