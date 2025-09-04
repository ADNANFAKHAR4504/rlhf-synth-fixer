I'll create a complete Terraform serverless setup with Lambda, API Gateway, and Secrets Manager. Here's the implementation:

## Terraform Files

### `providers.tf`
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### `variables.tf`
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "serverless-demo"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128
}
```

### `secrets.tf`
```hcl
# Create secret in Secrets Manager
resource "aws_secretsmanager_secret" "lambda_config" {
  name                    = "${var.project_name}-${var.environment}-lambda-config"
  description             = "Configuration secrets for Lambda function"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-lambda-config"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Store secret values
resource "aws_secretsmanager_secret_version" "lambda_config" {
  secret_id = aws_secretsmanager_secret.lambda_config.id
  secret_string = jsonencode({
    database_url = "postgresql://user:pass@localhost:5432/mydb"
    api_key      = "super-secret-api-key-12345"
    debug_mode   = "true"
    app_version  = "1.0.0"
  })
}
```

### `iam.tf`
```hcl
# IAM role for Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-lambda-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Custom policy for Secrets Manager access
resource "aws_iam_role_policy" "lambda_secrets_policy" {
  name = "${var.project_name}-${var.environment}-lambda-secrets-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.lambda_config.arn
      }
    ]
  })
}

# IAM role for API Gateway to invoke Lambda
resource "aws_iam_role" "apigw_lambda_role" {
  name = "${var.project_name}-${var.environment}-apigw-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-apigw-lambda-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Policy for API Gateway to invoke Lambda
resource "aws_iam_role_policy" "apigw_lambda_policy" {
  name = "${var.project_name}-${var.environment}-apigw-lambda-policy"
  role = aws_iam_role.apigw_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.main.arn
      }
    ]
  })
}
```

### `lambda.tf`
```hcl
# Create ZIP file for Lambda deployment
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/handler.py"
  output_path = "${path.module}/lambda_function.zip"
}

# Lambda function
resource "aws_lambda_function" "main" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-function"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handler.lambda_handler"
  runtime         = "python3.9"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.lambda_config.arn
      ENVIRONMENT = var.environment
      PROJECT_NAME = var.project_name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_secrets_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]

  tags = {
    Name        = "${var.project_name}-lambda-function"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-function"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-lambda-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
```

### `apigw.tf`
```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "Serverless API with IAM authentication"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "invoke"
}

# API Gateway Method with IAM authorization
resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "AWS_IAM"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.main.invoke_arn
}

# API Gateway Method Response
resource "aws_api_gateway_method_response" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# API Gateway Integration Response
resource "aws_api_gateway_integration_response" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = aws_api_gateway_method_response.proxy.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_method.proxy,
    aws_api_gateway_integration.lambda
  ]
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.proxy,
    aws_api_gateway_integration.lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  tags = {
    Name        = "${var.project_name}-api-stage"
    Environment = var.environment
    Project     = var.project_name
  }
}
```

### `outputs.tf`
```hcl
output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/invoke"
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.lambda_config.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}
```

## Python Lambda Handler

### `handler.py`
```python
import json
import boto3
import logging
import os
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')

def get_secret(secret_arn):
    """Retrieve secret from AWS Secrets Manager"""
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret_string = response['SecretString']
        return json.loads(secret_string)
    except ClientError as e:
        logger.error(f"Error retrieving secret: {str(e)}")
        raise e
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing secret JSON: {str(e)}")
        raise e

def lambda_handler(event, context):
    """Main Lambda handler function"""
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event, default=str)}")
    
    try:
        # Get environment variables
        secret_arn = os.environ.get('SECRET_ARN')
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        project_name = os.environ.get('PROJECT_NAME', 'unknown')
        
        logger.info(f"Environment: {environment}, Project: {project_name}")
        
        if not secret_arn:
            raise ValueError("SECRET_ARN environment variable not set")
        
        # Retrieve secrets from Secrets Manager
        logger.info(f"Retrieving secrets from: {secret_arn}")
        secrets = get_secret(secret_arn)
        
        # Log secret keys (but not values for security)
        secret_keys = list(secrets.keys())
        logger.info(f"Retrieved secret keys: {secret_keys}")
        
        # Process the request
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        
        logger.info(f"Processing {http_method} request to {path}")
        logger.info(f"Query parameters: {query_params}")
        
        # Create response body
        response_body = {
            'message': 'Lambda function executed successfully!',
            'timestamp': context.aws_request_id,
            'environment': environment,
            'project_name': project_name,
            'method': http_method,
            'path': path,
            'query_params': query_params,
            'secret_keys_retrieved': secret_keys,
            'lambda_info': {
                'function_name': context.function_name,
                'function_version': context.function_version,
                'memory_limit': context.memory_limit_in_mb,
                'remaining_time': context.get_remaining_time_in_millis()
            }
        }
        
        # Log successful execution
        logger.info(f"Lambda execution successful. Response: {json.dumps(response_body, default=str)}")
        
        # Return API Gateway compatible response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_body, default=str, indent=2)
        }
        
    except Exception as e:
        # Log error details
        error_message = f"Lambda execution failed: {str(e)}"
        logger.error(error_message, exc_info=True)
        
        # Return error response
        error_response = {
            'error': 'Internal server error',
            'message': str(e),
            'request_id': context.aws_request_id
        }
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(error_response, indent=2)
        }
```

## README.md

```markdown
# Serverless Setup with Terraform

This project creates a secure serverless setup in AWS us-east-1 using Terraform with:
- AWS Lambda (Python) with CloudWatch logging
- API Gateway HTTP endpoint with IAM authentication
- AWS Secrets Manager for secure environment variables

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0 installed
- Python 3.9+ (for local testing)

## Project Structure

```
.
├── providers.tf          # Terraform providers configuration
├── variables.tf          # Input variables
├── lambda.tf            # Lambda function resources
├── apigw.tf             # API Gateway resources
├── secrets.tf           # Secrets Manager resources
├── iam.tf               # IAM roles and policies
├── outputs.tf           # Output values
├── handler.py           # Python Lambda handler
└── README.md            # This file
```

## Deployment Steps

1. **Clone and navigate to the project directory**
   ```bash
   git clone <repository-url>
   cd serverless-terraform-setup
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Review the deployment plan**
   ```bash
   terraform plan
   ```

4. **Deploy the infrastructure**
   ```bash
   terraform apply
   ```
   Type `yes` when prompted to confirm the deployment.

5. **Note the outputs**
   After successful deployment, note the API Gateway URL and other important outputs.

## Testing the API

### Positive Test (Authorized Request)

Use AWS CLI to make an authenticated request:

```bash
# Get the API Gateway URL from Terraform outputs
API_URL=$(terraform output -raw api_gateway_url)

# Make authenticated request using AWS SigV4
aws apigatewayv2 invoke \
  --region us-east-1 \
  --api-id $(terraform output -raw api_gateway_rest_api_id) \
  --stage dev \
  --route-key "ANY /invoke" \
  response.json

# Or use curl with AWS credentials (requires aws-cli and proper setup)
curl -X GET "$API_URL" \
  --aws-sigv4 "aws:amz:us-east-1:execute-api" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY"
```

Alternative using boto3 (Python script):

```python
import boto3
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

# Get API URL from terraform output
api_url = "YOUR_API_GATEWAY_URL"

# Create AWS session
session = boto3.Session()
credentials = session.get_credentials()

# Create signed request
request = AWSRequest(method='GET', url=api_url)
SigV4Auth(credentials, 'execute-api', 'us-east-1').add_auth(request)

# Make request
response = requests.get(api_url, headers=dict(request.headers))
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

### Negative Test (Unauthorized Request)

Make a request without authentication:

```bash
# This should return 403 Forbidden
curl -X GET "$API_URL"
```

Expected response: `{"message":"Missing Authentication Token"}`

## Viewing CloudWatch Logs

1. **Using AWS Console:**
   - Go to CloudWatch → Log groups
   - Find `/aws/lambda/serverless-demo-dev-function`
   - View the latest log stream

2. **Using AWS CLI:**
   ```bash
   # Get log group name
   LOG_GROUP=$(terraform output -raw cloudwatch_log_group)
   
   # View recent logs
   aws logs describe-log-streams \
     --log-group-name "$LOG_GROUP" \
     --order-by LastEventTime \
     --descending \
     --max-items 1
   
   # Get latest log stream name and view logs
   STREAM_NAME=$(aws logs describe-log-streams \
     --log-group-name "$LOG_GROUP" \
     --order-by LastEventTime \
     --descending \
     --max-items 1 \
     --query 'logStreams[0].logStreamName' \
     --output text)
   
   aws logs get-log-events \
     --log-group-name "$LOG_GROUP" \
     --log-stream-name "$STREAM_NAME"
   ```

## Expected Log Output

Successful request logs should show:
- Event details
- Secret retrieval from Secrets Manager
- Processing information
- Response data

Example log entry:
```
[INFO] Received event: {"httpMethod": "GET", "path": "/invoke", ...}
[INFO] Environment: dev, Project: serverless-demo
[INFO] Retrieving secrets from: arn:aws:secretsmanager:us-east-1:...
[INFO] Retrieved secret keys: ['database_url', 'api_key', 'debug_mode', 'app_version']
[INFO] Processing GET request to /invoke
[INFO] Lambda execution successful. Response: {...}
```

## Customization

### Modify Secret Values

Edit the `secrets.tf` file to change the secret values:

```hcl
resource "aws_secretsmanager_secret_version" "lambda_config" {
  secret_id = aws_secretsmanager_secret.lambda_config.id
  secret_string = jsonencode({
    your_key = "your_value"
    # Add more secrets as needed
  })
}
```

### Change Lambda Configuration

Modify variables in `variables.tf`:

```hcl
variable "lambda_timeout" {
  default = 60  # Increase timeout
}

variable "lambda_memory_size" {
  default = 256  # Increase memory
}
```

### Update Python Handler

Modify `handler.py` to add your business logic while keeping the secrets retrieval functionality.

## Security Features

1. **IAM Authentication**: API Gateway requires AWS IAM credentials
2. **Least Privilege**: Lambda can only access its specific secret
3. **Encrypted Secrets**: Secrets Manager encrypts data at rest
4. **VPC Isolation**: Can be extended to run Lambda in VPC
5. **CloudWatch Logging**: All activities are logged for audit

## Troubleshooting

### Common Issues

1. **403 Forbidden on API calls**
   - Ensure you're using proper AWS credentials
   - Check IAM permissions for the calling user

2. **Lambda timeout errors**
   - Increase timeout in `variables.tf`
   - Check CloudWatch logs for specific errors

3. **Secrets Manager access denied**
   - Verify IAM role has correct permissions
   - Check secret ARN in environment variables

### Debug Commands

```bash
# Check Terraform state
terraform show

# Validate Terraform configuration
terraform validate

# Check AWS credentials
aws sts get-caller-identity

# Test Lambda function directly
aws lambda invoke \
  --function-name $(terraform output -raw lambda_function_name) \
  --payload '{"test": "data"}' \
  response.json
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm the destruction.

**Note**: This will permanently delete all resources including the Secrets Manager secret (after the recovery window).

## Cost Considerations

This setup uses AWS Free Tier eligible services:
- Lambda: 1M free requests per month
- API Gateway: 1M free requests per month  
- Secrets Manager: $0.40 per secret per month
- CloudWatch: Basic logging included in free tier

Estimated monthly cost for low usage: ~$0.40-$1.00

## Next Steps

- Add API versioning
- Implement request validation
- Add custom authorizers
- Set up CI/CD pipeline
- Add monitoring and alerting
- Implement caching strategies
```

This complete setup provides:

1. **Security**: IAM authentication, least privilege access, encrypted secrets
2. **Monitoring**: CloudWatch logging with detailed information
3. **Scalability**: Serverless architecture that scales automatically
4. **Maintainability**: Well-structured Terraform code with proper resource organization
5. **Testing**: Clear instructions for both positive and negative test cases

The Lambda function retrieves secrets from Secrets Manager and logs all activities to CloudWatch, while the API Gateway ensures only authenticated requests can invoke the function.