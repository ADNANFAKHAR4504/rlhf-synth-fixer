Looking at the logs, I can see two main issues:

1. **Lint Issues**: Indentation problems and line ending format issues
2. **Synth Issue**: Problem with the `secretObjectValue` parameter in the Secrets Manager configuration

Let me provide the corrected code:

## Fixed `lib/tap_stack.py`

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    SecretValue,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct
import json


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for file storage
        self.upload_bucket = self._create_s3_bucket()
        
        # Create secrets for sensitive configuration
        self.secrets = self._create_secrets()
        
        # Create Lambda function for upload processing
        self.upload_lambda = self._create_lambda_function()
        
        # Create API Gateway
        self.api = self._create_api_gateway()
        
        # Output important information
        self._create_outputs()

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with security and lifecycle policies"""
        bucket = s3.Bucket(
            self, "TapUploadBucket",
            bucket_name=f"tap-upload-bucket-{self.account}-{self.region}",
            versioned=True,  # Enable versioning
            encryption=s3.BucketEncryption.S3_MANAGED,  # Encrypt at rest
            enforce_ssl=True,  # Enforce SSL for transfers
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Block all public access
            removal_policy=RemovalPolicy.RETAIN,  # Retain bucket on stack deletion
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )
        
        # Add CORS configuration for web uploads
        bucket.add_cors_rule(
            allowed_methods=[s3.HttpMethods.POST, s3.HttpMethods.PUT],
            allowed_origins=["*"],  # Restrict this in production
            allowed_headers=["*"],
            max_age=3000
        )
        
        return bucket

    def _create_secrets(self) -> secretsmanager.Secret:
        """Create secrets manager for sensitive configuration"""
        # Create the secret object value using SecretValue
        secret_object = {
            "max_file_size": SecretValue.unsafe_plain_text("5242880"),  # 5MB in bytes
            "allowed_mime_types": SecretValue.unsafe_plain_text(json.dumps([
                "image/png",
                "image/jpg", 
                "image/jpeg"
            ])),
            "upload_prefix": SecretValue.unsafe_plain_text("uploads/")
        }
        
        secrets = secretsmanager.Secret(
            self, "TapUploadSecrets",
            description="Configuration secrets for TAP upload service",
            secret_object_value=secret_object
        )
        return secrets

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function for upload processing"""
        
        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "TapUploadLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add specific permissions for S3 and Secrets Manager
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:GetObject"
                ],
                resources=[f"{self.upload_bucket.bucket_arn}/*"]
            )
        )
        
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[self.secrets.secret_arn]
            )
        )
        
        # Create Lambda function
        upload_function = _lambda.Function(
            self, "TapUploadFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="upload_handler.lambda_handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(3),  # 3 second timeout as required
            memory_size=256,
            environment={
                "BUCKET_NAME": self.upload_bucket.bucket_name,
                "SECRETS_ARN": self.secrets.secret_arn,
                "AWS_REGION": self.region
            },
            # Deploy across multiple AZs for high availability
            reserved_concurrent_executions=100,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        return upload_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with request validation"""
        
        # Create API Gateway
        api = apigateway.RestApi(
            self, "TapUploadApi",
            rest_api_name="TAP File Upload API",
            description="Secure file upload API with validation",
            binary_media_types=["*/*"],  # Support binary uploads
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            )
        )
        
        # Create request validator
        request_validator = apigateway.RequestValidator(
            self, "TapUploadValidator",
            rest_api=api,
            validate_request_body=True,
            validate_request_parameters=True
        )
        
        # Create model for request validation
        upload_model = api.add_model(
            "UploadModel",
            content_type="application/json",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "filename": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        min_length=1,
                        max_length=255
                    ),
                    "content_type": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=["image/png", "image/jpg", "image/jpeg"]
                    )
                },
                required=["filename", "content_type"]
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.upload_lambda,
            request_templates={
                "application/json": json.dumps({
                    "body": "$input.body",
                    "headers": {
                        "Content-Type": "$input.params('Content-Type')",
                        "Content-Length": "$input.params('Content-Length')"
                    },
                    "httpMethod": "$context.httpMethod",
                    "requestContext": {
                        "requestId": "$context.requestId"
                    }
                })
            }
        )
        
        # Add upload resource and method
        upload_resource = api.root.add_resource("upload")
        upload_resource.add_method(
            "POST",
            lambda_integration,
            request_validator=request_validator,
            request_models={
                "application/json": upload_model
            },
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_models={
                        "application/json": apigateway.Model.ERROR_MODEL
                    }
                ),
                apigateway.MethodResponse(
                    status_code="413",
                    response_models={
                        "application/json": apigateway.Model.ERROR_MODEL
                    }
                )
            ]
        )
        
        # Add CORS support
        upload_resource.add_cors_preflight(
            allow_origins=["*"],  # Restrict in production
            allow_methods=["POST", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization"]
        )
        
        return api

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "BucketName",
            value=self.upload_bucket.bucket_name,
            description="S3 bucket name for uploads"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.upload_lambda.function_name,
            description="Lambda function name"
        )
```

## Fixed Test Files

### `tests/unit/test_tap_stack.py`

```python
import aws_cdk as core
import aws_cdk.assertions as assertions

from lib.tap_stack import TapStack


def test_s3_bucket_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test S3 bucket is created with correct properties
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [{
                "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }
    })


def test_lambda_function_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test Lambda function is created
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.9",
        "Handler": "upload_handler.lambda_handler",
        "Timeout": 3
    })


def test_api_gateway_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test API Gateway is created
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "TAP File Upload API"
    })


def test_secrets_manager_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test Secrets Manager secret is created
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Description": "Configuration secrets for TAP upload service"
    })
```

### `tests/integration/test_tap_stack.py`

```python
import boto3
import pytest
import aws_cdk as core
from lib.tap_stack import TapStack


@pytest.fixture
def stack():
    app = core.App()
    return TapStack(app, "tap-integration-test")


def test_stack_synthesis(stack):
    # Test that the stack can be synthesized without errors
    app = stack.node.root
    cloud_assembly = app.synth()
    assert cloud_assembly is not None


def test_stack_resources_count(stack):
    template = core.assertions.Template.from_stack(stack)
    
    # Verify expected number of resources
    resources = template.to_json()["Resources"]
    
    # Should have at least: S3 bucket, Lambda function, API Gateway, IAM roles, etc.
    assert len(resources) >= 10


def test_iam_roles_have_policies(stack):
    template = core.assertions.Template.from_stack(stack)
    
    # Test that IAM roles have appropriate policies
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
    })
```

## Key Changes Made:

### 1. **Fixed Secrets Manager Issue**
- Added `SecretValue` import from `aws_cdk`
- Used `SecretValue.unsafe_plain_text()` to wrap the configuration values
- This resolves the JSII serialization error

### 2. **Fixed Lint Issues**
- Corrected all indentation to use 4 spaces consistently
- Added final newline to the file
- Fixed line ending format (should be LF, not CRLF)

### 3. **Fixed Test Files**
- Corrected indentation in both test files
- Fixed the constructor call issue in unit tests
- Made tests more robust and focused

### 4. **Additional Improvements**
- Added proper type hints
- Ensured consistent formatting throughout
- Made the code more maintainable

The main issue was with the `secretObjectValue` parameter in Secrets Manager. In CDK, when you want to store plain text values in secrets, you need to wrap them with `SecretValue.unsafe_plain_text()` for proper JSII serialization.

Now your pipeline should pass both the lint and synth phases successfully!