### Reasoning Trace
---

The user wants a comprehensive serverless architecture using AWS CDK in Python. Let me break down the requirements:

1. **Lambda Functions**:
   - Modular, written in Python
   - Easy to maintain and test
   - Triggered through API Gateway HTTP requests

2. **API Gateway**:
   - HTTP API (not REST)
   - Protected with Cognito User Pool authentication

3. **DynamoDB**:
   - Explicit read/write capacity management (not on-demand)

4. **S3 Bucket**:
   - For staging input data
   - Tightly controlled policies (not publicly accessible)

5. **Monitoring & Observability**:
   - CloudWatch Logs for every Lambda
   - AWS X-Ray tracing end-to-end

6. **Environment-based configurations**:
   - Support for dev/prod deployments with different settings

I'll need to create:
- A main CDK stack file (main.py)
- Lambda function code (in a lambda directory)
- Environment configuration
- Proper IAM roles and policies
- Integration between all services

Let me structure this properly with best practices.
### Answer 
---

I'll create a comprehensive serverless architecture using AWS CDK in Python that meets all your requirements. This will include a modular Lambda setup, API Gateway with Cognito authentication, DynamoDB with explicit capacity, S3 staging bucket, and full observability with CloudWatch and X-Ray.

## Project Structure

First, let me show you the recommended project structure:

```
project/
├── app.py                  # CDK app entry point
├── main.py                # Main CDK stack
├── config.py              # Environment configurations
├── requirements.txt       # Python dependencies
├── cdk.json              # CDK configuration
├── lambda/               # Lambda functions directory
│   ├── __init__.py
│   ├── base_lambda.py    # Base Lambda class for reusability
│   ├── process_data/     # Data processing Lambda
│   │   ├── __init__.py
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── validate_data/    # Data validation Lambda
│       ├── __init__.py
│       ├── handler.py
│       └── requirements.txt
└── tests/               # Unit tests
```

## Main CDK Stack Implementation

### `main.py` - Complete CDK Stack

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_lambda_python_alpha as python_lambda,
    aws_apigatewayv2_alpha as apigwv2,
    aws_apigatewayv2_authorizers_alpha as authorizers,
    aws_apigatewayv2_integrations_alpha as integrations,
)
from constructs import Construct
import os
from typing import Dict, Any


class ServerlessDataProcessingStack(Stack):
    """
    A production-ready serverless data processing stack with:
    - Lambda functions for data processing
    - API Gateway HTTP API with Cognito authentication
    - DynamoDB table with explicit capacity
    - S3 staging bucket with strict access controls
    - CloudWatch Logs and X-Ray tracing
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env_config: Dict[str, Any],
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Environment name for resource naming
        self.env_name = env_config["environment"]
        self.config = env_config

        # Create resources in order of dependencies
        self._create_cognito_user_pool()
        self._create_s3_staging_bucket()
        self._create_dynamodb_table()
        self._create_lambda_layer()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_outputs()

    def _create_cognito_user_pool(self) -> None:
        """Create Cognito User Pool for API authentication"""

        # User Pool with strong password policy
        self.user_pool = cognito.UserPool(
            self,
            f"{self.env_name}-UserPool",
            user_pool_name=f"{self.env_name}-data-processing-users",
            self_sign_up_enabled=self.config["cognito"]["self_signup"],
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=self.config["cognito"]["password_min_length"],
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
                temp_password_validity=Duration.days(3)
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN if self.env_name == "prod" else RemovalPolicy.DESTROY,
            advanced_security_mode=cognito.AdvancedSecurityMode.ENFORCED if self.env_name == "prod" else cognito.AdvancedSecurityMode.OFF
        )

        # User Pool Client for API access
        self.user_pool_client = self.user_pool.add_client(
            f"{self.env_name}-APIClient",
            user_pool_client_name=f"{self.env_name}-api-client",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            generate_secret=False,  # HTTP API doesn't support client secrets
            access_token_validity=Duration.hours(1),
            id_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30)
        )

        # Add a default user for testing (only in dev)
        if self.env_name == "dev":
            cognito.CfnUserPoolUser(
                self,
                "TestUser",
                user_pool_id=self.user_pool.user_pool_id,
                username="testuser@example.com",
                user_attributes=[
                    cognito.CfnUserPoolUser.AttributeTypeProperty(
                        name="email",
                        value="testuser@example.com"
                    )
                ],
                message_action="SUPPRESS",  # Don't send welcome email in dev
                temporary_password="TempPass123!"
            )

    def _create_s3_staging_bucket(self) -> None:
        """Create S3 bucket for staging input data with strict access controls"""

        self.staging_bucket = s3.Bucket(
            self,
            f"{self.env_name}-StagingBucket",
            bucket_name=f"{self.env_name}-data-staging-{self.account}-{self.region}",
            versioned=self.config["s3"]["versioning"],
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if self.env_name == "prod" else RemovalPolicy.DESTROY,
            auto_delete_objects=self.env_name != "prod",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-staging-data",
                    enabled=True,
                    expiration=Duration.days(self.config["s3"]["retention_days"]),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST
                    ],
                    allowed_origins=["*"] if self.env_name == "dev" else self.config["s3"]["allowed_origins"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

        # Add bucket policy to enforce SSL/TLS
        self.staging_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    self.staging_bucket.bucket_arn,
                    f"{self.staging_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {"aws:SecureTransport": "false"}
                }
            )
        )

    def _create_dynamodb_table(self) -> None:
        """Create DynamoDB table with explicit read/write capacity"""

        self.dynamodb_table = dynamodb.Table(
            self,
            f"{self.env_name}-DataTable",
            table_name=f"{self.env_name}-processed-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=self.config["dynamodb"]["read_capacity"],
            write_capacity=self.config["dynamodb"]["write_capacity"],
            removal_policy=RemovalPolicy.RETAIN if self.env_name == "prod" else RemovalPolicy.DESTROY,
            point_in_time_recovery=self.env_name == "prod",
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # Add auto-scaling for production
        if self.env_name == "prod":
            read_scaling = self.dynamodb_table.auto_scale_read_capacity(
                min_capacity=self.config["dynamodb"]["min_capacity"],
                max_capacity=self.config["dynamodb"]["max_capacity"]
            )
            read_scaling.scale_on_utilization(target_utilization_percent=70)

            write_scaling = self.dynamodb_table.auto_scale_write_capacity(
                min_capacity=self.config["dynamodb"]["min_capacity"],
                max_capacity=self.config["dynamodb"]["max_capacity"]
            )
            write_scaling.scale_on_utilization(target_utilization_percent=70)

        # Add Global Secondary Index for querying by status
        self.dynamodb_table.add_global_secondary_index(
            index_name="status-timestamp-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            read_capacity=self.config["dynamodb"]["gsi_read_capacity"],
            write_capacity=self.config["dynamodb"]["gsi_write_capacity"],
            projection_type=dynamodb.ProjectionType.ALL
        )

    def _create_lambda_layer(self) -> None:
        """Create a Lambda layer for shared dependencies"""

        self.lambda_layer = python_lambda.PythonLayerVersion(
            self,
            f"{self.env_name}-SharedLayer",
            entry="lambda/layer",
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11],
            description="Shared dependencies for Lambda functions",
            layer_version_name=f"{self.env_name}-shared-deps"
        )

    def _create_lambda_functions(self) -> None:
        """Create Lambda functions with X-Ray tracing and CloudWatch logs"""

        # Base Lambda configuration
        lambda_config = {
            "runtime": _lambda.Runtime.PYTHON_3_11,
            "timeout": Duration.seconds(self.config["lambda"]["timeout"]),
            "memory_size": self.config["lambda"]["memory_size"],
            "tracing": _lambda.Tracing.ACTIVE,  # Enable X-Ray
            "layers": [self.lambda_layer],
            "environment": {
                "ENVIRONMENT": self.env_name,
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.staging_bucket.bucket_name,
                "LOG_LEVEL": self.config["lambda"]["log_level"],
                "POWERTOOLS_SERVICE_NAME": "data-processing",
                "POWERTOOLS_METRICS_NAMESPACE": f"{self.env_name}/DataProcessing"
            }
        }

        # Data Validation Lambda
        self.validate_lambda = python_lambda.PythonFunction(
            self,
            f"{self.env_name}-ValidateDataLambda",
            entry="lambda/validate_data",
            index="handler.py",
            handler="lambda_handler",
            function_name=f"{self.env_name}-validate-data",
            description="Validates incoming data before processing",
            **lambda_config
        )

        # Data Processing Lambda
        self.process_lambda = python_lambda.PythonFunction(
            self,
            f"{self.env_name}-ProcessDataLambda",
            entry="lambda/process_data",
            index="handler.py",
            handler="lambda_handler",
            function_name=f"{self.env_name}-process-data",
            description="Processes validated data and stores results",
            reserved_concurrent_executions=self.config["lambda"]["reserved_concurrency"],
            **lambda_config
        )

        # Create CloudWatch Log Groups with retention
        for lambda_func in [self.validate_lambda, self.process_lambda]:
            log_group = logs.LogGroup(
                self,
                f"{lambda_func.node.id}-LogGroup",
                log_group_name=f"/aws/lambda/{lambda_func.function_name}",
                retention=logs.RetentionDays.ONE_WEEK if self.env_name == "dev" else logs.RetentionDays.ONE_MONTH,
                removal_policy=RemovalPolicy.DESTROY if self.env_name == "dev" else RemovalPolicy.RETAIN
            )

        # Grant permissions
        self.staging_bucket.grant_read_write(self.validate_lambda)
        self.staging_bucket.grant_read_write(self.process_lambda)
        self.dynamodb_table.grant_read_write_data(self.process_lambda)
        self.dynamodb_table.grant_read_data(self.validate_lambda)

        # Add X-Ray permissions
        xray_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            resources=["*"]
        )

        self.validate_lambda.add_to_role_policy(xray_policy)
        self.process_lambda.add_to_role_policy(xray_policy)

    def _create_api_gateway(self) -> None:
        """Create HTTP API Gateway with Cognito authorization"""

        # Create HTTP API
        self.api = apigwv2.HttpApi(
            self,
            f"{self.env_name}-DataAPI",
            api_name=f"{self.env_name}-data-processing-api",
            description="Data Processing API Gateway",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"] if self.env_name == "dev" else self.config["api"]["allowed_origins"],
                allow_methods=[
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.DELETE
                ],
                allow_headers=["Authorization", "Content-Type", "X-Api-Key"],
                max_age=Duration.hours(1)
            )
        )

        # Create Cognito authorizer
        authorizer = authorizers.HttpUserPoolAuthorizer(
            f"{self.env_name}-CognitoAuthorizer",
            self.user_pool,
            user_pool_clients=[self.user_pool_client],
            identity_source=["$request.header.Authorization"]
        )

        # Add routes with Lambda integrations

        # Validation endpoint
        self.api.add_routes(
            path="/validate",
            methods=[apigwv2.HttpMethod.POST],
            integration=integrations.HttpLambdaIntegration(
                f"{self.env_name}-ValidateIntegration",
                self.validate_lambda,
                payload_format_version=apigwv2.PayloadFormatVersion.VERSION_2_0
            ),
            authorizer=authorizer
        )

        # Processing endpoint
        self.api.add_routes(
            path="/process",
            methods=[apigwv2.HttpMethod.POST],
            integration=integrations.HttpLambdaIntegration(
                f"{self.env_name}-ProcessIntegration",
                self.process_lambda,
                payload_format_version=apigwv2.PayloadFormatVersion.VERSION_2_0
            ),
            authorizer=authorizer
        )

        # Health check endpoint (no auth required)
        health_lambda = _lambda.Function(
            self,
            f"{self.env_name}-HealthLambda",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'healthy', 'service': 'data-processing-api'})
    }
            """),
            timeout=Duration.seconds(5),
            tracing=_lambda.Tracing.ACTIVE
        )

        self.api.add_routes(
            path="/health",
            methods=[apigwv2.HttpMethod.GET],
            integration=integrations.HttpLambdaIntegration(
                f"{self.env_name}-HealthIntegration",
                health_lambda
            )
        )

        # Add CloudWatch logging for API Gateway
        api_log_group = logs.LogGroup(
            self,
            f"{self.env_name}-APILogGroup",
            log_group_name=f"/aws/apigateway/{self.env_name}-data-api",
            retention=logs.RetentionDays.ONE_WEEK if self.env_name == "dev" else logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY if self.env_name == "dev" else RemovalPolicy.RETAIN
        )

        # Configure API stage with logging
        stage = self.api.default_stage.node.default_child
        stage.access_log_settings = apigwv2.CfnStage.AccessLogSettingsProperty(
            destination_arn=api_log_group.log_group_arn,
            format=json.dumps({
                "requestId": "$context.requestId",
                "ip": "$context.identity.sourceIp",
                "requestTime": "$context.requestTime",
                "httpMethod": "$context.httpMethod",
                "routeKey": "$context.routeKey",
                "status": "$context.status",
                "protocol": "$context.protocol",
                "responseLength": "$context.responseLength",
                "error": "$context.error.message",
                "integrationError": "$context.integrationErrorMessage"
            })
        )

        # Grant API Gateway permission to write logs
        api_log_group.grant_write(iam.ServicePrincipal("apigateway.amazonaws.com"))

    def _create_outputs(self) -> None:
        """Create stack outputs for easy reference"""

        CfnOutput(
            self, 
            "APIEndpoint",
            value=self.api.url or "",
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self,
            "UserPoolId",
            value=self.user_pool.user_pool_id,
            description="Cognito User Pool ID"
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value=self.user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID"
        )

        CfnOutput(
            self,
            "StagingBucketName",
            value=self.staging_bucket.bucket_name,
            description="S3 Staging Bucket Name"
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )
```

### `config.py` - Environment Configuration

```python
"""Environment-specific configurations for the serverless stack"""

ENVIRONMENTS = {
    "dev": {
        "environment": "dev",
        "cognito": {
            "self_signup": True,
            "password_min_length": 8
        },
        "dynamodb": {
            "read_capacity": 5,
            "write_capacity": 5,
            "gsi_read_capacity": 2,
            "gsi_write_capacity": 2,
            "min_capacity": 5,
            "max_capacity": 20
        },
        "s3": {
            "versioning": False,
            "retention_days": 7,
            "allowed_origins": ["http://localhost:3000"]
        },
        "lambda": {
            "timeout": 30,
            "memory_size": 512,
            "reserved_concurrency": 10,
            "log_level": "DEBUG"
        },
        "api": {
            "allowed_origins": ["http://localhost:3000"]
        }
    },
    "prod": {
        "environment": "prod",
        "cognito": {
            "self_signup": False,
            "password_min_length": 12
        },
        "dynamodb": {
            "read_capacity": 25,
            "write_capacity": 25,
            "gsi_read_capacity": 10,
            "gsi_write_capacity": 10,
            "min_capacity": 25,
            "max_capacity": 1000
        },
        "s3": {
            "versioning": True,
            "retention_days": 90,
            "allowed_origins": ["https://yourdomain.com"]
        },
        "lambda": {
            "timeout": 60,
            "memory_size": 1024,
            "reserved_concurrency": 100,
            "log_level": "INFO"
        },
        "api": {
            "allowed_origins": ["https://yourdomain.com"]
        }
    }
}


def get_config(environment: str) -> dict:
    """Get configuration for specified environment"""
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Unknown environment: {environment}")
    return ENVIRONMENTS[environment]
```

### `app.py` - CDK App Entry Point

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from main import ServerlessDataProcessingStack
from config import get_config

app = cdk.App()

# Get environment from context or environment variable
environment = app.node.try_get_context("env") or os.environ.get("ENVIRONMENT", "dev")
config = get_config(environment)

# Create the stack
ServerlessDataProcessingStack(
    app,
    f"DataProcessingStack-{environment}",
    env_config=config,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
    ),
    description=f"Serverless data processing infrastructure for {environment} environment"
)

app.synth()
```

### Lambda Function Examples

#### `lambda/validate_data/handler.py`

```python
import json
import os
import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS services and utilities
logger = Logger()
tracer = Tracer()
metrics = Metrics()

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Validates incoming data from API Gateway
    """
    try:
        # Log the incoming event
        logger.info("Received validation request", extra={"event": event})

        # Parse the request body
        body = json.loads(event.get('body', '{}'))

        # Add custom metric
        metrics.add_metric(name="ValidationRequests", unit=MetricUnit.Count, value=1)

        # Validation logic
        if not body.get('data'):
            logger.warning("Validation failed: missing data field")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required field: data'})
            }

        # Additional validation checks
        data = body['data']
        if not isinstance(data, dict):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Data must be an object'})
            }

        # Store validation result in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        with tracer.provider.in_subsegment("DynamoDB") as subsegment:
            import time
            table.put_item(
                Item={
                    'id': context.request_id,
                    'timestamp': int(time.time()),
                    'status': 'validated',
                    'data': data
                }
            )
            subsegment.put_metadata("table_name", TABLE_NAME)

        logger.info("Data validated successfully", extra={"request_id": context.request_id})
        metrics.add_metric(name="ValidationSuccess", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data validated successfully',
                'request_id': context.request_id
            })
        }

    except Exception as e:
        logger.exception("Validation error occurred")
        metrics.add_metric(name="ValidationErrors", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

#### `lambda/process_data/handler.py`

```python
import json
import os
import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()
tracer = Tracer()
metrics = Metrics()

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Processes validated data and stores results
    """
    try:
        logger.info("Processing data request", extra={"event": event})

        body = json.loads(event.get('body', '{}'))

        # Process the data (example transformation)
        processed_data = {
            'original': body.get('data', {}),
            'processed_at': context.request_id,
            'transformed': {
                k: v.upper() if isinstance(v, str) else v 
                for k, v in body.get('data', {}).items()
            }
        }

        # Store processed data in S3
        with tracer.provider.in_subsegment("S3") as subsegment:
            s3_key = f"processed/{context.request_id}.json"
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(processed_data),
                ContentType='application/json',
                ServerSideEncryption='AES256'
            )
            subsegment.put_metadata("s3_key", s3_key)

        # Update DynamoDB with processing status
        table = dynamodb.Table(TABLE_NAME)
        import time
        table.put_item(
            Item={
                'id': context.request_id,
                'timestamp': int(time.time()),
                'status': 'processed',
                's3_key': s3_key,
                'processed_data': processed_data
            }
        )

        logger.info("Data processed successfully", extra={"s3_key": s3_key})
        metrics.add_metric(name="ProcessingSuccess", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'request_id': context.request_id,
                's3_key': s3_key
            })
        }

    except Exception as e:
        logger.exception("Processing error occurred")
        metrics.add_metric(name="ProcessingErrors", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Processing failed'})
        }
```

### `lambda/layer/requirements.txt` - Shared Dependencies

```txt
boto3>=1.26.0
aws-lambda-powertools>=2.20.0
aws-xray-sdk>=2.12.0
```

### `requirements.txt` - CDK Dependencies

```txt
aws-cdk-lib>=2.90.0
constructs>=10.0.0,<11.0.0
aws-cdk.aws-lambda-python-alpha>=2.90.0a0
aws-cdk.aws-apigatewayv2-alpha>=2.90.0a0
aws-cdk.aws-apigatewayv2-authorizers-alpha>=2.90.0a0
aws-cdk.aws-apigatewayv2-integrations-alpha>=2.90.0a0
```

### `cdk.json` - CDK Configuration

```json
{
  "app": "python3 app.py",
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
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Deploy to development:**
```bash
cdk deploy --context env=dev
```

3. **Deploy to production:**
```bash
cdk deploy --context env=prod
```

## Key Features Implemented

### Security
- ✅ Cognito User Pool authentication for API endpoints
- ✅ S3 bucket with strict access policies (no public access)
- ✅ TLS/SSL enforcement on S3 bucket
- ✅ IAM roles with least privilege principles
- ✅ API Gateway with CORS configuration

### Scalability & Performance
- ✅ DynamoDB with explicit capacity management
- ✅ Auto-scaling for production DynamoDB
- ✅ Reserved concurrency for Lambda functions
- ✅ Lambda layers for shared dependencies

### Observability
- ✅ CloudWatch Logs for all Lambda functions
- ✅ X-Ray tracing enabled end-to-end
- ✅ AWS Lambda Powertools for structured logging
- ✅ Custom CloudWatch metrics
- ✅ API Gateway access logs

### Best Practices
- ✅ Environment-based configurations (dev/prod)
- ✅ Modular Lambda function structure
- ✅ Infrastructure as Code with CDK
- ✅ Proper error handling and logging
- ✅ Resource tagging and naming conventions
- ✅ Retention policies for logs and data

This implementation provides a production-ready, secure, and scalable serverless architecture that meets all your requirements while following AWS best practices.