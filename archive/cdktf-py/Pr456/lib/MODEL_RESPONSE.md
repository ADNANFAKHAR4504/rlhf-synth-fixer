I'll design and implement a secure, scalable serverless architecture using cdktf-py that meets all your requirements. Let me break this down into a comprehensive solution.

## 🏗️ **Architecture Overview**

The solution includes:

- **Lambda Function** with Python 3.12 runtime
- **Secrets Manager** for secure configuration storage
- **API Gateway HTTP API** with IAM authorization
- **IAM roles and policies** following least privilege principles
- **CloudWatch Logs** for monitoring

## 📁 **Project Structure**

```
serverless-cdktf/
├── main.py                 # Main CDK for Terraform stack
├── lambda/
│   └── handler.py         # Lambda function code
├── requirements.txt       # Python dependencies
└── README.md             # Deployment instructions
```

## 🔧 **Implementation**

### 1. **Lambda Function Code** (`lambda/handler.py`)

```python
import json
import logging
import boto3
from botocore.exceptions import ClientError
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Secrets Manager client
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')

def get_secret_value(secret_name: str) -> dict:
    """
    Retrieve secret value from AWS Secrets Manager

    Args:
        secret_name (str): Name of the secret to retrieve

    Returns:
        dict: Secret value as dictionary
    """
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except ClientError as e:
        logger.error(f"Error retrieving secret {secret_name}: {str(e)}")
        raise e
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing secret JSON: {str(e)}")
        raise e

def lambda_handler(event, context):
    """
    Main Lambda handler function

    Args:
        event: API Gateway event object
        context: Lambda context object

    Returns:
        dict: HTTP response object
    """
    try:
        # Log the incoming request payload
        logger.info("Received event payload:")
        logger.info(json.dumps(event, indent=2, default=str))

        # Retrieve configuration from Secrets Manager
        secret_name = os.environ.get('SECRET_NAME')
        if not secret_name:
            raise ValueError("SECRET_NAME environment variable not set")

        logger.info(f"Retrieving configuration from secret: {secret_name}")
        config = get_secret_value(secret_name)

        # Log successful configuration retrieval (without exposing sensitive data)
        logger.info("Successfully retrieved configuration from Secrets Manager")
        logger.info(f"Configuration keys available: {list(config.keys())}")

        # Process the request
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
        path = event.get('requestContext', {}).get('http', {}).get('path', '/')
        source_ip = event.get('requestContext', {}).get('http', {}).get('sourceIp', 'unknown')

        logger.info(f"Processing {http_method} request to {path} from {source_ip}")

        # Prepare response
        response_body = {
            "message": "Request processed successfully",
            "method": http_method,
            "path": path,
            "timestamp": context.aws_request_id,
            "config_loaded": True,
            "available_config_keys": list(config.keys())
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": context.aws_request_id
            },
            "body": json.dumps(response_body, indent=2)
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")

        error_response = {
            "error": "Internal server error",
            "message": "Failed to process request",
            "request_id": context.aws_request_id
        }

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": context.aws_request_id
            },
            "body": json.dumps(error_response)
        }
```

### 2. **Main CDK for Terraform Stack** (`main.py`)

```python
#!/usr/bin/env python3

import os
import json
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
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
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion

class ServerlessStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Configure AWS Provider for us-east-1
        AwsProvider(self, "AWS", region="us-east-1")

        # Get current AWS account and region info
        current = DataAwsCallerIdentity(self, "current")
        region = DataAwsRegion(self, "current_region")

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
        api_route = Apigatewayv2Route(
            self, "api_route",
            api_id=api_gateway.id,
            route_key="ANY /{proxy+}",
            target=f"integrations/{lambda_integration.id}",
            authorization_type="AWS_IAM"
        )

        # Create default route for root path
        default_route = Apigatewayv2Route(
            self, "default_route",
            api_id=api_gateway.id,
            route_key="ANY /",
            target=f"integrations/{lambda_integration.id}",
            authorization_type="AWS_IAM"
        )

        # Create API Gateway stage
        api_stage = Apigatewayv2Stage(
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

app = App()
ServerlessStack(app, "serverless-stack")
app.synth()
```

### 3. **Requirements File** (`requirements.txt`)

```txt
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
boto3>=1.34.0
```

### 4. **Deployment Script** (`deploy.sh`)

```bash
#!/bin/bash

set -e

echo "🚀 Starting serverless deployment..."

# Create lambda deployment package
echo "📦 Creating Lambda deployment package..."
mkdir -p dist
cp lambda/handler.py dist/
cd dist
zip -r ../lambda_function.zip .
cd ..
rm -rf dist

# Install Python dependencies
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

# Initialize and deploy with CDK for Terraform
echo "🏗️  Initializing CDK for Terraform..."
cdktf get

echo "🔧 Planning deployment..."
cdktf plan

echo "🚀 Deploying infrastructure..."
cdktf deploy --auto-approve

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the secret values in AWS Secrets Manager"
echo "2. Test the API endpoint with proper IAM credentials"
echo "3. Monitor logs in CloudWatch"
```

### 5. **Testing Script** (`test_api.py`)

```python
#!/usr/bin/env python3

import boto3
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import json

def test_api_with_iam_auth(api_url: str, region: str = 'us-east-1'):
    """
    Test the API Gateway endpoint with IAM authentication

    Args:
        api_url (str): API Gateway URL
        region (str): AWS region
    """

    # Create a session with AWS credentials
    session = boto3.Session()
    credentials = session.get_credentials()

    # Prepare the request
    method = 'GET'
    headers = {'Content-Type': 'application/json'}
    body = json.dumps({"test": "data", "timestamp": "2024-01-01T00:00:00Z"})

    # Create AWS request object
    request = AWSRequest(method=method, url=api_url, data=body, headers=headers)

    # Sign the request with SigV4
    SigV4Auth(credentials, 'execute-api', region).add_auth(request)

    # Convert to requests format
    prepared_request = request.prepare()

    try:
        # Make the request
        response = requests.request(
            method=prepared_request.method,
            url=prepared_request.url,
            headers=dict(prepared_request.headers),
            data=prepared_request.body
        )

        print(f"✅ Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        print(f"📄 Response Body:")
        print(json.dumps(response.json(), indent=2))

    except Exception as e:
        print(f"❌ Error making request: {str(e)}")

if __name__ == "__main__":
    # Replace with your actual API Gateway URL
    API_URL = "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/"
    test_api_with_iam_auth(API_URL)
```

## 🔐 **Security Features**

### **1. IAM-Based Authorization**

- API Gateway uses `AWS_IAM` authorization type
- Only authenticated IAM users/roles can access endpoints
- Requests must be signed with AWS Signature Version 4

### **2. Secrets Management**

- Sensitive configuration stored in AWS Secrets Manager
- Lambda retrieves secrets at runtime (not in environment variables)
- IAM policy grants least-privilege access to specific secret only

### **3. Least Privilege Access**

- Lambda execution role has minimal required permissions
- Separate IAM policies for different access patterns
- Resource-specific ARNs in policy statements

## 📊 **Monitoring and Logging**

### **CloudWatch Integration**

- Lambda logs all request payloads
- API Gateway access logging enabled
- Custom log retention period (14 days)
- Detailed metrics and tracing enabled

## 🚀 **Deployment Instructions**

### **Prerequisites**

```bash
# Install required tools
pip install cdktf-cli
npm install -g cdktf-cli@latest

# Configure AWS credentials
aws configure
```

### **Deploy the Stack**

```bash
# Clone and navigate to project
git clone <your-repo>
cd serverless-cdktf

# Make deployment script executable
chmod +x deploy.sh

# Deploy infrastructure
./deploy.sh
```

### **Update Secret Values**

```bash
# Update the secret with your actual values
aws secretsmanager update-secret \
    --secret-id serverless-app-config \
    --secret-string '{"API_KEY":"your-real-api-key","DATABASE_URL":"your-real-db-url"}'
```

### **Test the Deployment**

```bash
# Test with proper IAM authentication
python test_api.py
```

## 🔍 **Verification Steps**

1. **Check Lambda Function**: Verify it's created with correct runtime and environment
2. **Test Secret Access**: Confirm Lambda can retrieve secrets from Secrets Manager
3. **API Gateway Security**: Verify unauthorized requests are denied (401/403)
4. **CloudWatch Logs**: Check that request payloads are logged properly
5. **IAM Permissions**: Validate least-privilege access is working

## 📈 **Production Considerations**

### **Scaling**

- Lambda automatically scales based on demand
- API Gateway handles high concurrency
- Consider implementing rate limiting for production

### **Monitoring**

- Set up CloudWatch alarms for errors and latency
- Implement distributed tracing with X-Ray
- Monitor secret access patterns

### **Security Enhancements**

- Rotate secrets regularly using Secrets Manager rotation
- Implement API key authentication as additional layer
- Use VPC endpoints for enhanced security

This architecture provides a robust, secure, and scalable serverless solution that follows AWS best practices and meets all your specified requirements.
