# Terraform Infrastructure Code

## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

## tap_stack.tf

```hcl
############################################
# tap_stack.tf — Single-file stack with embedded Lambda code 
############################################

# terraform {
#   required_version = ">= 1.6.0"
#   required_providers {
#     aws = {
#       source  = "hashicorp/aws"
#       version = "~> 5.0"
#     }
#     archive = {
#       source  = "hashicorp/archive"
#       version = "~> 2.4"
#     }
#   }
# }

############################################
# Variables
############################################

variable "aws_region" {
  description = "AWS region to deploy into (referenced by provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "company_name" {
  description = "Company name used in resource names"
  type        = string
  default     = "acme"
}

variable "environment" {
  description = "Environment name (e.g., dev, stage, prod)"
  type        = string
  default     = "dev"
}

variable "lambda_runtime" {
  description = "Runtime for both Lambda functions"
  type        = string
  default     = "python3.12"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_memory_size" {
  description = "Lambda memory size (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda timeout (seconds)"
  type        = number
  default     = 30
}

variable "dynamodb_read_capacity" {
  description = "Provisioned read capacity (RCU) for DynamoDB"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Provisioned write capacity (WCU) for DynamoDB"
  type        = number
  default     = 5
}

variable "tags" {
  description = "Additional tags to merge into all resources"
  type        = map(string)
  default     = {}
}

############################################
# Locals
############################################

locals {
  name_prefix = "${var.company_name}-${var.environment}"
  # Consistent tagging
  common_tags = merge(
    {
      Project     = "serverless-baseline"
      Company     = var.company_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags
  )

  # Deterministic names
  ddb_table_name    = "${local.name_prefix}-table"
  lambda1_name      = "${local.name_prefix}-lambda1"
  lambda2_name      = "${local.name_prefix}-lambda2"
  log_group_lambda1 = "/aws/lambda/${local.lambda1_name}"
  log_group_lambda2 = "/aws/lambda/${local.lambda2_name}"
  kms_alias_name    = "alias/${local.name_prefix}-cmk"
}

############################################
# Identity & Partition
############################################
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

############################################
# KMS: Customer-managed key and alias
# - Used by: CloudWatch Log Groups (encryption at rest)
#            Lambda environment variables
#            DynamoDB table SSE (CMK)
############################################

data "aws_iam_policy_document" "kms_key_policy" {
  # Root admin
  statement {
    sid     = "AllowRootAccount"
    effect  = "Allow"
    actions = ["kms:*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    resources = ["*"]
  }

  # Allow CloudWatch Logs service in this region to use the key
  statement {
    sid    = "AllowCloudWatchLogsUse"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    principals {
      type        = "Service"
      identifiers = ["logs.${var.aws_region}.amazonaws.com"]
    }
    resources = ["*"]
  }

  # Allow Lambda service to use the key for environment variables
  statement {
    sid    = "AllowLambdaUse"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    resources = ["*"]
  }
}

resource "aws_kms_key" "cmk" {
  description         = "CMK for ${local.name_prefix} (logs, Lambda env, DynamoDB SSE)"
  enable_key_rotation = true
  policy              = data.aws_iam_policy_document.kms_key_policy.json
  tags                = local.common_tags
}

resource "aws_kms_alias" "cmk_alias" {
  name          = local.kms_alias_name
  target_key_id = aws_kms_key.cmk.id
}

############################################
# DynamoDB (Provisioned, SSE with CMK, PITR enabled)
############################################

resource "aws_dynamodb_table" "main" {
  name           = local.ddb_table_name
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity

  hash_key = "id"
  attribute {
    name = "id"
    type = "S"
  }

  # Server-side encryption with customer-managed CMK
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.cmk.arn
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

############################################
# CloudWatch Log Groups (encrypted, retention)
############################################

resource "aws_cloudwatch_log_group" "lambda1" {
  name              = local.log_group_lambda1
  retention_in_days = 14
  kms_key_id        = aws_kms_key.cmk.arn
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda2" {
  name              = local.log_group_lambda2
  retention_in_days = 14
  kms_key_id        = aws_kms_key.cmk.arn
  tags              = local.common_tags
}

############################################
# IAM: Lambda execution role (least privilege)
############################################

resource "aws_iam_role" "lambda_exec" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

# AWS-managed: CloudWatch logs permissions
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom least-privilege policy for DynamoDB + KMS
data "aws_iam_policy_document" "lambda_custom" {
  statement {
    sid    = "DynamoDBCrudOnTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [aws_dynamodb_table.main.arn]
  }

  statement {
    sid    = "KmsForLogsAndEnv"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.cmk.arn]
  }
}

resource "aws_iam_policy" "lambda_custom" {
  name        = "${local.name_prefix}-lambda-policy"
  description = "Least-privilege access to DynamoDB table and CMK"
  policy      = data.aws_iam_policy_document.lambda_custom.json
  tags        = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_custom_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_custom.arn
}

############################################
# Embedded Lambda code (inline) -> zipped with archive_file
############################################

# Lambda 1 writer
data "archive_file" "lambda1_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda1_inline.zip"

  source {
    filename = "index.py"
    content  = <<EOF
import os, json, boto3
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

def handler(event, context):
    item = {
        "id": event.get("id", "default-1"),
        "source": "lambda1",
        "requestId": getattr(context, "aws_request_id", "unknown")
    }
    table.put_item(Item=item)
    return {"statusCode": 200, "body": json.dumps({"written": item})}
EOF
  }
}

# Lambda 2 reader
data "archive_file" "lambda2_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda2_inline.zip"

  source {
    filename = "index.py"
    content  = <<EOF
import os, json, boto3
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

def handler(event, context):
    key = {"id": event.get("id", "default-1")}
    resp = table.get_item(Key=key)
    return {"statusCode": 200, "body": json.dumps(resp.get("Item", {"missing": True}))}
EOF
  }
}

############################################
# Lambda Functions
############################################

resource "aws_lambda_function" "lambda1" {
  function_name    = local.lambda1_name
  filename         = data.archive_file.lambda1_zip.output_path
  source_code_hash = data.archive_file.lambda1_zip.output_base64sha256
  role             = aws_iam_role.lambda_exec.arn
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  kms_key_arn      = aws_kms_key.cmk.arn

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
    }
  }

  # Ensure encrypted log group exists before first writes
  depends_on = [aws_cloudwatch_log_group.lambda1]

  tags = local.common_tags
}

resource "aws_lambda_function" "lambda2" {
  function_name    = local.lambda2_name
  filename         = data.archive_file.lambda2_zip.output_path
  source_code_hash = data.archive_file.lambda2_zip.output_base64sha256
  role             = aws_iam_role.lambda_exec.arn
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  kms_key_arn      = aws_kms_key.cmk.arn

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda2]

  tags = local.common_tags
}

############################################
# Outputs (safe for CI/CD)
############################################

output "region" { value = var.aws_region }
output "company_name" { value = var.company_name }
output "environment" { value = var.environment }

output "kms_key_arn" { value = aws_kms_key.cmk.arn }
output "kms_key_alias" { value = aws_kms_alias.cmk_alias.name }

output "dynamodb_table_name" { value = aws_dynamodb_table.main.name }
output "dynamodb_table_arn" { value = aws_dynamodb_table.main.arn }

output "lambda1_name" { value = aws_lambda_function.lambda1.function_name }
output "lambda1_arn" { value = aws_lambda_function.lambda1.arn }
output "lambda2_name" { value = aws_lambda_function.lambda2.function_name }
output "lambda2_arn" { value = aws_lambda_function.lambda2.arn }

output "log_group_lambda1" { value = aws_cloudwatch_log_group.lambda1.name }
output "log_group_lambda2" { value = aws_cloudwatch_log_group.lambda2.name }

output "lambda_role_name" { value = aws_iam_role.lambda_exec.name }
output "lambda_role_arn" { value = aws_iam_role.lambda_exec.arn }

```
