"""TAP Stack module for CDKTF Python infrastructure."""

import json
from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class TapStack(TerraformStack):
  """CDKTF Python stack for TAP infrastructure."""

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      **kwargs
  ):
    """Initialize the TAP stack with AWS infrastructure."""
    super().__init__(scope, construct_id)

    # Extract configuration from kwargs
    environment_suffix = kwargs.get('environment_suffix', 'dev')
    aws_region = kwargs.get('aws_region', 'us-east-1')
    state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
    state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
    default_tags = kwargs.get('default_tags', {})

    # Configure AWS Provider
    AwsProvider(
        self,
        "aws",
        region=aws_region,
        default_tags=[default_tags],
    )

    # Configure S3 Backend with native state locking
    S3Backend(
        self,
        bucket=state_bucket,
        key=f"{environment_suffix}/{construct_id}.tfstate",
        region=state_bucket_region,
        encrypt=True,
    )

    # Add S3 state locking using escape hatch
    self.add_override("terraform.backend.s3.use_lockfile", True)

    # Create S3 bucket for demonstration
    S3Bucket(
        self,
        "tap_bucket",
        bucket=f"tap-bucket-{environment_suffix}-{construct_id}",
        versioning={"enabled": True},
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        }
    )

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.

    # Get current AWS account info
    current = DataAwsCallerIdentity(self, "current")

    # Create Secrets Manager secret for application configuration
    app_secret = SecretsmanagerSecret(
        self, "app_secret",
        name="serverless-app-config",
        description="Configuration secrets for serverless application",
        recovery_window_in_days=7,
        tags={
            "Environment": "production",
            "Application": "serverless-api",
            "ManagedBy": "cdktf"
        }
    )

    # Store initial secret values
    secret_values = {
        "API_KEY": "your-secure-api-key-here",
        "DATABASE_URL": "your-database-connection-string",
        "EXTERNAL_SERVICE_TOKEN": "your-external-service-token"
    }

    SecretsmanagerSecretVersion(
        self, "app_secret_version",
        secret_id=app_secret.id,
        secret_string=json.dumps(secret_values)
    )

    # Create CloudWatch Log Group for Lambda
    lambda_log_group = CloudwatchLogGroup(
        self, "lambda_log_group",
        name="/aws/lambda/serverless-api-handler",
        retention_in_days=14,
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # IAM policy document for Lambda execution role
    lambda_assume_role_policy = DataAwsIamPolicyDocument(
        self, "lambda_assume_role_policy",
        statement=[{
            "effect": "Allow",
            "principals": [{
                "type": "Service",
                "identifiers": ["lambda.amazonaws.com"]
            }],
            "actions": ["sts:AssumeRole"]
        }]
    )

    # Create Lambda execution role
    lambda_execution_role = IamRole(
        self, "lambda_execution_role",
        name="serverless-lambda-execution-role",
        assume_role_policy=lambda_assume_role_policy.json,
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Attach basic Lambda execution policy
    IamRolePolicyAttachment(
        self, "lambda_basic_execution",
        role=lambda_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Create custom policy for Secrets Manager access
    secrets_policy_document = DataAwsIamPolicyDocument(
        self, "secrets_policy_document",
        statement=[{
            "effect": "Allow",
            "actions": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "resources": [app_secret.arn]
        }]
    )

    secrets_policy = IamPolicy(
        self, "secrets_policy",
        name="serverless-secrets-access-policy",
        description="Policy to allow Lambda to access specific secrets",
        policy=secrets_policy_document.json,
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Attach secrets policy to Lambda role
    IamRolePolicyAttachment(
        self, "lambda_secrets_policy",
        role=lambda_execution_role.name,
        policy_arn=secrets_policy.arn
    )

    # Create Lambda function
    lambda_function = LambdaFunction(
        self, "serverless_lambda",
        function_name="serverless-api-handler",
        role=lambda_execution_role.arn,
        handler="handler.lambda_handler",
        runtime="python3.12",
        filename="lambda_function.zip",
        source_code_hash="${filebase64sha256('lambda_function.zip')}",
        timeout=30,
        memory_size=256,
        environment={
            "variables": {
                "SECRET_NAME": app_secret.name,
                "LOG_LEVEL": "INFO"
            }
        },
        depends_on=[lambda_log_group],
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Create API Gateway HTTP API
    api_gateway = Apigatewayv2Api(
        self, "serverless_api",
        name="serverless-http-api",
        description="Serverless API with IAM authentication",
        protocol_type="HTTP",
        cors_configuration={
            "allow_credentials": False,
            "allow_headers": ["content-type", "x-amz-date", "authorization", "x-api-key"],
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_origins": ["*"],
            "expose_headers": ["date", "keep-alive"],
            "max_age": 86400
        },
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Create Lambda integration
    lambda_integration = Apigatewayv2Integration(
        self, "lambda_integration",
        api_id=api_gateway.id,
        integration_type="AWS_PROXY",
        integration_method="POST",
        integration_uri=lambda_function.invoke_arn,
        payload_format_version="2.0"
    )

    # Create API Gateway route with IAM authorization
    Apigatewayv2Route(
        self, "api_route",
        api_id=api_gateway.id,
        route_key="ANY /{proxy+}",
        target=f"integrations/{lambda_integration.id}",
        authorization_type="AWS_IAM"
    )

    # Create default route for root path
    Apigatewayv2Route(
        self, "default_route",
        api_id=api_gateway.id,
        route_key="ANY /",
        target=f"integrations/{lambda_integration.id}",
        authorization_type="AWS_IAM"
    )

    # Create API Gateway stage
    Apigatewayv2Stage(
        self, "api_stage",
        api_id=api_gateway.id,
        name="prod",
        description="Production stage for serverless API",
        auto_deploy=True,
        default_route_settings={
            "detailed_metrics_enabled": True,
            "logging_level": "INFO",
            "data_trace_enabled": True,
            "throttling_burst_limit": 100,
            "throttling_rate_limit": 50
        },
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Grant API Gateway permission to invoke Lambda
    LambdaPermission(
        self, "api_gateway_lambda_permission",
        statement_id="AllowExecutionFromAPIGateway",
        action="lambda:InvokeFunction",
        function_name=lambda_function.function_name,
        principal="apigateway.amazonaws.com",
        source_arn=f"{api_gateway.execution_arn}/*/*"
    )

    # Create IAM policy for API Gateway access
    api_access_policy_document = DataAwsIamPolicyDocument(
        self, "api_access_policy_document",
        statement=[{
            "effect": "Allow",
            "actions": ["execute-api:Invoke"],
            "resources": [f"{api_gateway.execution_arn}/*"]
        }]
    )

    api_access_policy = IamPolicy(
        self, "api_access_policy",
        name="serverless-api-access-policy",
        description="Policy to allow access to serverless API",
        policy=api_access_policy_document.json,
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Create IAM role for API access (optional - for demonstration)
    api_access_assume_role_policy = DataAwsIamPolicyDocument(
        self, "api_access_assume_role_policy",
        statement=[{
            "effect": "Allow",
            "principals": [{
                "type": "AWS",
                "identifiers": [f"arn:aws:iam::{current.account_id}:root"]
            }],
            "actions": ["sts:AssumeRole"],
            "condition": [{
                "test": "StringEquals",
                "variable": "sts:ExternalId",
                "values": ["serverless-api-access"]
            }]
        }]
    )

    api_access_role = IamRole(
        self, "api_access_role",
        name="serverless-api-access-role",
        assume_role_policy=api_access_assume_role_policy.json,
        description="Role for accessing serverless API",
        tags={
            "Environment": "production",
            "Application": "serverless-api"
        }
    )

    # Attach API access policy to role
    IamRolePolicyAttachment(
        self, "api_access_role_policy",
        role=api_access_role.name,
        policy_arn=api_access_policy.arn
    )

    # Outputs
    TerraformOutput(
        self, "api_gateway_url",
        value=f"https://{api_gateway.id}.execute-api.us-east-1.amazonaws.com/prod",
        description="API Gateway endpoint URL"
    )

    TerraformOutput(
        self, "lambda_function_name",
        value=lambda_function.function_name,
        description="Lambda function name"
    )

    TerraformOutput(
        self, "secrets_manager_secret_name",
        value=app_secret.name,
        description="Secrets Manager secret name"
    )

    TerraformOutput(
        self, "api_access_role_arn",
        value=api_access_role.arn,
        description="IAM role ARN for API access"
    )

    TerraformOutput(
        self, "lambda_log_group_name",
        value=lambda_log_group.name,
        description="CloudWatch log group name for Lambda"
    )
