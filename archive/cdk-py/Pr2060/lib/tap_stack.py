"""
Main CDK stack that orchestrates all serverless resources.
"""
from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    aws_s3_notifications as s3n,
    aws_dynamodb as dynamodb,
    CfnOutput,
    RemovalPolicy,
    Duration,
    Tags
)
from constructs import Construct

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        environment_suffix = (props.environment_suffix if props else None) or 'dev'
        
        # Apply tags to all resources
        Tags.of(self).add('Environment', environment_suffix)
        Tags.of(self).add('Project', 'ServerlessFileProcessor')
        Tags.of(self).add('Owner', 'DevOps')
        
        # S3 bucket for file uploads
        self.upload_bucket = s3.Bucket(
            self, f'FileUploadBucket{environment_suffix}',
            bucket_name=f'serverless-file-processor-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}',
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id='DeleteOldVersions',
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(1)
                )
            ]
        )
        
        # DynamoDB table for processing metadata
        self.metadata_table = dynamodb.Table(
            self, f'ProcessingMetadata{environment_suffix}',
            table_name=f'processing-metadata-{environment_suffix}',
            partition_key=dynamodb.Attribute(
                name='fileId',
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )
        
        # IAM role for Lambda functions
        lambda_role = iam.Role(
            self, f'LambdaExecutionRole{environment_suffix}',
            role_name=f'ServerlessFileProcessor-LambdaRole-{environment_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole')
            ],
            inline_policies={
                'S3Access': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
                            resources=[self.upload_bucket.bucket_arn + '/*']
                        ),
                        iam.PolicyStatement(
                            actions=['s3:ListBucket'],
                            resources=[self.upload_bucket.bucket_arn]
                        )
                    ]
                ),
                'DynamoDBAccess': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
                            resources=[self.metadata_table.table_arn]
                        )
                    ]
                ),
                'BedrockAccess': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=['bedrock:InvokeModel', 'bedrock:GetFoundationModel'],
                            resources=['*']
                        )
                    ]
                )
            }
        )
        
        # Common Lambda environment variables
        common_env_vars = {
            'METADATA_TABLE_NAME': self.metadata_table.table_name,
            'UPLOAD_BUCKET_NAME': self.upload_bucket.bucket_name,
            'LOG_LEVEL': 'INFO'
        }
        
        # Lambda function for image processing
        self.image_processor = _lambda.Function(
            self, f'ImageProcessor{environment_suffix}',
            function_name=f'image-processor-{environment_suffix}',
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler='image_processor.handler',
            code=_lambda.Code.from_asset('lib/lambda'),
            role=lambda_role,
            environment=common_env_vars,
            timeout=Duration.minutes(5),
            memory_size=512,
            reserved_concurrent_executions=10,
            retry_attempts=2,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Lambda function for document processing
        self.document_processor = _lambda.Function(
            self, f'DocumentProcessor{environment_suffix}',
            function_name=f'document-processor-{environment_suffix}',
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler='document_processor.handler',
            code=_lambda.Code.from_asset('lib/lambda'),
            role=lambda_role,
            environment=common_env_vars,
            timeout=Duration.minutes(10),
            memory_size=1024,
            reserved_concurrent_executions=5,
            retry_attempts=2,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Lambda function for data processing
        self.data_processor = _lambda.Function(
            self, f'DataProcessor{environment_suffix}',
            function_name=f'data-processor-{environment_suffix}',
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler='data_processor.handler',
            code=_lambda.Code.from_asset('lib/lambda'),
            role=lambda_role,
            environment=common_env_vars,
            timeout=Duration.minutes(15),
            memory_size=2048,
            reserved_concurrent_executions=3,
            retry_attempts=2,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # API Gateway Lambda function
        self.api_function = _lambda.Function(
            self, f'ApiFunction{environment_suffix}',
            function_name=f'api-function-{environment_suffix}',
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler='api_handler.handler',
            code=_lambda.Code.from_asset('lib/lambda'),
            role=lambda_role,
            environment=common_env_vars,
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # S3 event notifications
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.image_processor),
            s3.NotificationKeyFilter(suffix='.jpg')
        )
        
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.image_processor),
            s3.NotificationKeyFilter(suffix='.png')
        )
        
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.document_processor),
            s3.NotificationKeyFilter(suffix='.pdf')
        )
        
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.document_processor),
            s3.NotificationKeyFilter(suffix='.txt')
        )
        
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.data_processor),
            s3.NotificationKeyFilter(suffix='.csv')
        )
        
        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.data_processor),
            s3.NotificationKeyFilter(suffix='.json')
        )
        
        # API Gateway
        self.api = apigateway.RestApi(
            self, f'FileProcessorApi{environment_suffix}',
            rest_api_name=f'file-processor-api-{environment_suffix}',
            description='REST API for file processing status and metadata',
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token']
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=environment_suffix,
                throttling_rate_limit=100,
                throttling_burst_limit=200,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # API Gateway integration
        lambda_integration = apigateway.LambdaIntegration(
            self.api_function,
            request_templates={'application/json': '{"statusCode": "200"}'}
        )
        
        # API routes
        files_resource = self.api.root.add_resource('files')
        files_resource.add_method('GET', lambda_integration)  # List all files
        
        file_resource = files_resource.add_resource('{fileId}')
        file_resource.add_method('GET', lambda_integration)  # Get specific file status
        
        status_resource = file_resource.add_resource('status')
        status_resource.add_method('GET', lambda_integration)  # Get processing status
        
        # Outputs
        CfnOutput(
            self, f'ApiGatewayUrl{environment_suffix}',
            value=self.api.url,
            description='API Gateway URL for file processing API'
        )
        
        CfnOutput(
            self, f'S3BucketName{environment_suffix}',
            value=self.upload_bucket.bucket_name,
            description='S3 bucket name for file uploads'
        )
        
        CfnOutput(
            self, f'ImageProcessorArn{environment_suffix}',
            value=self.image_processor.function_arn,
            description='Image processor Lambda function ARN'
        )
        
        CfnOutput(
            self, f'DocumentProcessorArn{environment_suffix}',
            value=self.document_processor.function_arn,
            description='Document processor Lambda function ARN'
        )
        
        CfnOutput(
            self, f'DataProcessorArn{environment_suffix}',
            value=self.data_processor.function_arn,
            description='Data processor Lambda function ARN'
        )
        
        CfnOutput(
            self, f'ApiHandlerArn{environment_suffix}',
            value=self.api_function.function_arn,
            description='API handler Lambda function ARN'
        )
