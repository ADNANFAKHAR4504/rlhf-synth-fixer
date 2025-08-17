# Serverless Infrastructure with Terraform

I'll create a modular Terraform infrastructure that deploys two Lambda functions with a shared DynamoDB table, following best practices and the specified naming convention.

## Project Structure

```
terraform-serverless/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
├── modules/
│   ├── lambda/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── dynamodb/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── iam/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── lambda_code/
    ├── function1/
    │   └── index.py
    └── function2/
        └── index.py
```

## Root Configuration Files

### `main.tf`

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

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Create IAM role for Lambda functions
module "lambda_iam" {
  source = "./modules/iam"
  
  company_name = var.company_name
  environment  = var.environment
  
  dynamodb_table_arn = module.dynamodb.table_arn
}

# Create DynamoDB table
module "dynamodb" {
  source = "./modules/dynamodb"
  
  company_name = var.company_name
  environment  = var.environment
  
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
}

# Create Lambda function archives
data "archive_file" "lambda1_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_code/function1"
  output_path = "${path.module}/lambda1.zip"
}

data "archive_file" "lambda2_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_code/function2"
  output_path = "${path.module}/lambda2.zip"
}

# Create Lambda functions
module "lambda1" {
  source = "./modules/lambda"
  
  company_name = var.company_name
  environment  = var.environment
  function_name = "lambda1"
  
  filename         = data.archive_file.lambda1_zip.output_path
  source_code_hash = data.archive_file.lambda1_zip.output_base64sha256
  
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  
  role_arn = module.lambda_iam.lambda_role_arn
  
  environment_variables = {
    DYNAMODB_TABLE_NAME = module.dynamodb.table_name
  }
}

module "lambda2" {
  source = "./modules/lambda"
  
  company_name = var.company_name
  environment  = var.environment
  function_name = "lambda2"
  
  filename         = data.archive_file.lambda2_zip.output_path
  source_code_hash = data.archive_file.lambda2_zip.output_base64sha256
  
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  
  role_arn = module.lambda_iam.lambda_role_arn
  
  environment_variables = {
    DYNAMODB_TABLE_NAME = module.dynamodb.table_name
  }
}
```

### `variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "company_name" {
  description = "Company name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.9"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}
```

### `outputs.tf`

```hcl
output "lambda1_function_name" {
  description = "Name of the first Lambda function"
  value       = module.lambda1.function_name
}

output "lambda1_function_arn" {
  description = "ARN of the first Lambda function"
  value       = module.lambda1.function_arn
}

output "lambda2_function_name" {
  description = "Name of the second Lambda function"
  value       = module.lambda2.function_name
}

output "lambda2_function_arn" {
  description = "ARN of the second Lambda function"
  value       = module.lambda2.function_arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = module.dynamodb.table_arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = module.lambda_iam.lambda_role_arn
}
```

### `terraform.tfvars`

```hcl
company_name = "acme"
environment  = "dev"
aws_region   = "us-east-1"

# Lambda configuration
lambda_runtime     = "python3.9"
lambda_handler     = "index.handler"
lambda_memory_size = 512
lambda_timeout     = 30

# DynamoDB configuration
dynamodb_read_capacity  = 5
dynamodb_write_capacity = 5
```

## Module Files

### Lambda Module (`modules/lambda/main.tf`)

```hcl
resource "aws_lambda_function" "this" {
  filename         = var.filename
  function_name    = "${var.company_name}-${var.environment}-${var.function_name}"
  role            = var.role_arn
  handler         = var.handler
  source_code_hash = var.source_code_hash
  runtime         = var.runtime
  memory_size     = var.memory_size
  timeout         = var.timeout

  environment {
    variables = var.environment_variables
  }

  tags = {
    Name        = "${var.company_name}-${var.environment}-${var.function_name}"
    Environment = var.environment
    Company     = var.company_name
  }
}
```

### Lambda Module (`modules/lambda/variables.tf`)

```hcl
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "filename" {
  description = "Path to the Lambda deployment package"
  type        = string
}

variable "source_code_hash" {
  description = "Base64-encoded SHA256 hash of the package file"
  type        = string
}

variable "role_arn" {
  description = "IAM role ARN for the Lambda function"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}
```

### Lambda Module (`modules/lambda/outputs.tf`)

```hcl
output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.this.invoke_arn
}
```

### DynamoDB Module (`modules/dynamodb/main.tf`)

```hcl
resource "aws_dynamodb_table" "this" {
  name           = "${var.company_name}-${var.environment}-table"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "${var.company_name}-${var.environment}-table"
    Environment = var.environment
    Company     = var.company_name
  }
}
```

### DynamoDB Module (`modules/dynamodb/variables.tf`)

```hcl
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "read_capacity" {
  description = "Read capacity units"
  type        = number
}

variable "write_capacity" {
  description = "Write capacity units"
  type        = number
}
```

### DynamoDB Module (`modules/dynamodb/outputs.tf`)

```hcl
output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.this.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.this.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.this.id
}
```

### IAM Module (`modules/iam/main.tf`)

```hcl
# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.company_name}-${var.environment}-lambda-role"

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
    Name        = "${var.company_name}-${var.environment}-lambda-role"
    Environment = var.environment
    Company     = var.company_name
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${var.company_name}-${var.environment}-dynamodb-policy"
  description = "Policy for Lambda to access DynamoDB table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = var.dynamodb_table_arn
      }
    ]
  })

  tags = {
    Name        = "${var.company_name}-${var.environment}-dynamodb-policy"
    Environment = var.environment
    Company     = var.company_name
  }
}

# Attach DynamoDB policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}
```

### IAM Module (`modules/iam/variables.tf`)

```hcl
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}
```

### IAM Module (`modules/iam/outputs.tf`)

```hcl
output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.name
}
```

## Lambda Function Code

### Function 1 (`lambda_code/function1/index.py`)

```python
import json
import boto3
import os
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function 1 - Writes data to DynamoDB
    """
    try:
        # Sample data to write
        item = {
            'id': event.get('id', 'default-id-1'),
            'data': event.get('data', 'Sample data from Lambda 1'),
            'timestamp': context.aws_request_id,
            'function': 'lambda1'
        }
        
        # Write to DynamoDB
        response = table.put_item(Item=item)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data written successfully to DynamoDB',
                'item': item,
                'dynamodb_response': str(response)
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to write data to DynamoDB'
            })
        }
```

### Function 2 (`lambda_code/function2/index.py`)

```python
import json
import boto3
import os
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function 2 - Reads data from DynamoDB
    """
    try:
        item_id = event.get('id', 'default-id-1')
        
        # Read from DynamoDB
        response = table.get_item(
            Key={'id': item_id}
        )
        
        if 'Item' in response:
            item = response['Item']
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data retrieved successfully from DynamoDB',
                    'item': str(item)  # Convert to string to handle Decimal types
                })
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': f'Item with id {item_id} not found'
                })
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to read data from DynamoDB'
            })
        }
```

## Deployment Instructions

### Prerequisites

1. **Install Terraform** (version >= 1.0)
2. **Configure AWS CLI** with appropriate credentials
3. **Set AWS region** to `us-east-1`

### Deployment Steps

```bash
# 1. Clone or create the project structure
mkdir terraform-serverless && cd terraform-serverless

# 2. Create all the files as shown above

# 3. Initialize Terraform
terraform init

# 4. Validate the configuration
terraform validate

# 5. Plan the deployment
terraform plan

# 6. Apply the configuration
terraform apply
```

### Verification

After deployment, you can verify the resources:

```bash
# List Lambda functions
aws lambda list-functions --region us-east-1

# List DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Test Lambda function 1 (write data)
aws lambda invoke --function-name acme-dev-lambda1 \
  --payload '{"id":"test-1","data":"Hello from test"}' \
  --region us-east-1 response1.json

# Test Lambda function 2 (read data)
aws lambda invoke --function-name acme-dev-lambda2 \
  --payload '{"id":"test-1"}' \
  --region us-east-1 response2.json
```

### Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

## Key Features

1. **Modular Design**: Separated into logical modules (Lambda, DynamoDB, IAM)
2. **Naming Convention**: Follows `companyname-env-resource` pattern
3. **Minimum Permissions**: IAM role has only necessary DynamoDB permissions
4. **Resource Requirements**: 
   - Lambda functions with 512MB memory
   - DynamoDB with 5 RCU/WCU
   - Python 3.9 runtime
5. **Environment Variables**: Lambda functions receive DynamoDB table name
6. **Proper Tagging**: All resources tagged with environment and company info
7. **Error Handling**: Lambda functions include proper error handling

This infrastructure is production-ready and follows AWS and Terraform best practices.