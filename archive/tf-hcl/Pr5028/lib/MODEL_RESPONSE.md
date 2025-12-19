```hcl

# Variables
variable "ProjectName" {
  description = "The name of the project"
  type        = string
  default     = "serverless-app"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.ProjectName))
    error_message = "ProjectName must contain only lowercase alphanumeric characters and hyphens."
  }
}

variable "Environment" {
  description = "The deployment environment"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.Environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Locals for common values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  stack_name = "${var.ProjectName}-${var.Environment}"
  
  # Base tags to be applied to all resources
  base_tags = {
    Environment = var.Environment
    Project     = var.ProjectName
    ManagedBy   = "Terraform"
  }
  
  # S3 bucket names
  content_bucket_name = "${var.ProjectName}-${var.Environment}-content-${local.account_id}"
  logs_bucket_name    = "${var.ProjectName}-${var.Environment}-logs-${local.account_id}"
  
  # DynamoDB table name
  dynamodb_table_name = "${var.ProjectName}-${var.Environment}-table"
  
  # CloudWatch log groups
  lambda_log_group     = "/aws/lambda/${local.stack_name}-processor"
  apigateway_log_group = "API-Gateway-Execution-Logs_${local.stack_name}-api/${var.Environment}"
}
Now let's set up the KMS key with the required policy:

# KMS Key
resource "aws_kms_key" "main" {
  description             = "${local.stack_name} encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "Enable IAM User Permissions",
        Effect    = "Allow",
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" },
        Action    = "kms:*",
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch Logs",
        Effect    = "Allow",
        Principal = { Service = "logs.${local.region}.amazonaws.com" },
        Action    = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ],
        Resource  = "*",
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${local.region}:${local.account_id}:*"
          }
        }
      },
      {
        Sid       = "Allow Lambda Service",
        Effect    = "Allow",
        Principal = { Service = "lambda.amazonaws.com" },
        Action    = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ],
        Resource  = "*",
        Condition = {
          StringEquals = {
            "kms:ViaService": "lambda.${local.region}.amazonaws.com",
            "kms:GrantIsForAWSResource": "true"
          }
        }
      }
    ]
  })
  
  tags = local.base_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.stack_name}-kms-key"
  target_key_id = aws_kms_key.main.key_id
}
Now let's set up the S3 buckets - first the logs bucket:

# S3 Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket = local.logs_bucket_name
  force_destroy = true
  
  tags = local.base_tags
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.bucket
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "expire_old_logs"
    status = "Enabled"
    
    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "logging.s3.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.logs.arn}/access-logs/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl": "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}


# S3 Content Bucket
resource "aws_s3_bucket" "content" {
  bucket = local.content_bucket_name
  force_destroy = true
  
  tags = local.base_tags
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "content" {
  bucket = aws_s3_bucket.content.id
  
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content" {
  bucket = aws_s3_bucket.content.bucket
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_logging" "content" {
  bucket = aws_s3_bucket.content.id
  
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}


# DynamoDB Table
resource "aws_dynamodb_table" "main" {
  name         = local.dynamodb_table_name
  billing_mode = "PROVISIONED"
  
  read_capacity  = 5
  write_capacity = 5
  
  hash_key = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.base_tags
}
Now let's create the Lambda function with its role:

# Lambda IAM Role
resource "aws_iam_role" "lambda" {
  name = "${local.stack_name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "lambda.amazonaws.com" },
        Action    = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.base_tags
}

# Lambda Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda S3 Access Policy
resource "aws_iam_role_policy" "lambda_s3" {
  name = "S3AccessPolicy"
  role = aws_iam_role.lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      }
    ]
  })
}

# Lambda DynamoDB Access Policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "DynamoDBAccessPolicy"
  role = aws_iam_role.lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Resource = aws_dynamodb_table.main.arn
      }
    ]
  })
}

# Lambda KMS Access Policy
resource "aws_iam_role_policy" "lambda_kms" {
  name = "KMSAccessPolicy"
  role = aws_iam_role.lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ],
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# Lambda S3 Notification Policy
resource "aws_iam_role_policy" "lambda_s3_notification" {
  name = "S3NotificationPolicy"
  role = aws_iam_role.lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "s3:GetBucketNotification",
          "s3:PutBucketNotification"
        ],
        Resource = aws_s3_bucket.content.arn
      }
    ]
  })
}

# Lambda CloudWatch Logs Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = local.lambda_log_group
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.base_tags
}

# Lambda Function Code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content  = <<EOF
import json
import os
import boto3
import uuid
import time
from datetime import datetime

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

table = dynamodb.Table(DYNAMODB_TABLE)

def lambda_handler(event, context):
    """
    Handles both S3 events and API Gateway requests.
    For S3 events: records object creation
    For API Gateway: processes JSON in request body
    """
    print(f"Received event: {json.dumps(event)}")
    
    # Generate unique ID for this execution
    execution_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Check if the event is from S3
    if 'Records' in event and event['Records'][0].get('eventSource') == 'aws:s3':
        # Handle S3 event
        s3_record = event['Records'][0]['s3']
        bucket = s3_record['bucket']['name']
        key = s3_record['object']['key']
        
        # Store a record in DynamoDB
        table.put_item(
            Item={
                'id': execution_id,
                'type': 's3_event',
                'timestamp': timestamp,
                'bucket': bucket,
                'key': key,
                'source': 'lambda'
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed S3 event for s3://{bucket}/{key}',
                'id': execution_id
            })
        }
    
    # Otherwise, assume API Gateway request
    else:
        # Parse request body if present
        body = {}
        if 'body' in event:
            try:
                if event['body']:
                    body = json.loads(event['body'])
            except:
                body = {'raw': event['body']}
        
        # Store a record in DynamoDB
        table.put_item(
            Item={
                'id': execution_id,
                'type': 'api_request',
                'timestamp': timestamp,
                'payload': json.dumps(body),
                'source': 'lambda'
            }
        )
        
        # Write a proof file to S3
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=f'api-proofs/{timestamp}-{execution_id}.json',
            Body=json.dumps({
                'id': execution_id,
                'timestamp': timestamp,
                'source': 'lambda_api',
                'payload': body
            }),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Request processed successfully',
                'id': execution_id,
                'timestamp': timestamp
            })
        }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda Function
resource "aws_lambda_function" "processor" {
  function_name    = "${local.stack_name}-processor"
  role             = aws_iam_role.lambda.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  memory_size      = 256
  
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      S3_BUCKET      = aws_s3_bucket.content.bucket
      KMS_KEY_ID     = aws_kms_key.main.key_id
    }
  }
  
  tags = local.base_tags
}

# Lambda S3 Permission
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.content.arn
}

# S3 Bucket Notification for Lambda
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.content.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.processor.arn
    events              = ["s3:ObjectCreated:*"]
  }
  
  depends_on = [aws_lambda_permission.s3_invoke]
}


# API Gateway CloudWatch Role
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${local.stack_name}-api-cloudwatch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "apigateway.amazonaws.com" },
        Action    = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.base_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# API Gateway CloudWatch Logs Group
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = local.apigateway_log_group
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.base_tags
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.stack_name}-api"
  description = "API for ${local.stack_name} serverless application"
  
  endpoint_configuration {
    types = ["EDGE"]
  }
  
  tags = local.base_tags
}

# API Gateway Resource
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

# API Gateway Method
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization_type = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.process.id
  http_method = aws_api_gateway_method.process_post.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.processor.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    # Redeploy when there are changes to the API
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.process.id,
      aws_api_gateway_method.process_post.id,
      aws_api_gateway_integration.lambda.id
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    aws_api_gateway_integration.lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.Environment
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = jsonencode({
      requestId       = "$context.requestId",
      ip              = "$context.identity.sourceIp",
      caller          = "$context.identity.caller",
      user            = "$context.identity.user",
      requestTime     = "$context.requestTime",
      httpMethod      = "$context.httpMethod",
      resourcePath    = "$context.resourcePath",
      status          = "$context.status",
      protocol        = "$context.protocol",
      responseLength  = "$context.responseLength"
    })
  }
  
  tags = local.base_tags
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.Environment}/POST/process"
}

# EC2 IAM Role
resource "aws_iam_role" "ec2" {
  name = "${local.stack_name}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "ec2.amazonaws.com" },
        Action    = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.base_tags
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.stack_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# SSM Managed Instance Core Policy
resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# EC2 S3 Access Policy
resource "aws_iam_role_policy" "ec2_s3" {
  name = "EC2S3AccessPolicy"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "s3:ListBucket",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      }
    ]
  })
}

# EC2 DynamoDB Access Policy
resource "aws_iam_role_policy" "ec2_dynamodb" {
  name = "EC2DynamoDBAccessPolicy"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "dynamodb:PutItem",
        Resource = aws_dynamodb_table.main.arn
      }
    ]
  })
}

# EC2 KMS Access Policy
resource "aws_iam_role_policy" "ec2_kms" {
  name = "EC2KMSAccessPolicy"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ],
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name        = "${local.stack_name}-ec2-sg"
  description = "Security group for EC2 instance"
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = local.base_tags
}

# Fetch the latest Amazon Linux 2023 AMI
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# EC2 Instance
resource "aws_instance" "main" {
  ami                  = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  security_groups      = [aws_security_group.ec2.name]
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"  # IMDSv2
  }
  
  user_data = <<-EOF
#!/bin/bash
# Wait for AWS CLI and network connectivity
until aws --version > /dev/null 2>&1; do
    echo "Waiting for AWS CLI to be available..."
    sleep 5
done

# Get instance metadata for tagging
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# Function to retry a command with exponential backoff
function retry_command {
    local -r cmd="$1"
    local -r max_attempts=5
    local attempt=1
    
    until eval "$cmd"; do
        if ((attempt >= max_attempts)); then
            echo "Command failed after $max_attempts attempts: $cmd"
            return 1
        fi
        
        echo "Attempt $attempt failed, retrying in $((2**attempt)) seconds..."
        sleep $((2**attempt))
        ((attempt++))
    done
    
    return 0
}

# Create timestamp and unique ID
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UUID=$(cat /proc/sys/kernel/random/uuid)

# S3 proof
S3_KEY="ec2-proofs/$TIMESTAMP-$UUID.txt"
S3_CONTENT="EC2 Instance Proof from $INSTANCE_ID at $TIMESTAMP"

echo "Writing proof to S3..."
# Try S3 CP first, fall back to S3API if needed
if ! retry_command "aws s3 cp --sse aws:kms --sse-kms-key-id ${aws_kms_key.main.key_id} --region $REGION - s3://${aws_s3_bucket.content.bucket}/$S3_KEY <<< \"$S3_CONTENT\""; then
    echo "Falling back to s3api put-object..."
    retry_command "aws s3api put-object --bucket ${aws_s3_bucket.content.bucket} --key $S3_KEY --body <(echo \"$S3_CONTENT\") --server-side-encryption aws:kms --ssekms-key-id ${aws_kms_key.main.key_id} --region $REGION"
fi

echo "Writing proofs to DynamoDB..."
# First DynamoDB proof
retry_command "aws dynamodb put-item --table-name ${aws_dynamodb_table.main.name} --item '{\"id\":{\"S\":\"ec2-$UUID-1\"},\"type\":{\"S\":\"ec2_proof\"},\"timestamp\":{\"S\":\"$TIMESTAMP\"},\"instanceId\":{\"S\":\"$INSTANCE_ID\"},\"source\":{\"S\":\"ec2\"},\"attempt\":{\"N\":\"1\"}}' --region $REGION"

# Second DynamoDB proof
sleep 2
TIMESTAMP2=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
retry_command "aws dynamodb put-item --table-name ${aws_dynamodb_table.main.name} --item '{\"id\":{\"S\":\"ec2-$UUID-2\"},\"type\":{\"S\":\"ec2_proof\"},\"timestamp\":{\"S\":\"$TIMESTAMP2\"},\"instanceId\":{\"S\":\"$INSTANCE_ID\"},\"source\":{\"S\":\"ec2\"},\"attempt\":{\"N\":\"2\"}}' --region $REGION"

echo "EC2 proof operations completed successfully."
EOF
  
  tags = merge(local.base_tags, {
    Name = "${local.stack_name}-ec2"
  })
}


# Outputs
output "Environment" {
  description = "Deployment environment"
  value       = var.Environment
}

output "StackName" {
  description = "Name of the stack"
  value       = local.stack_name
}

output "S3BucketName" {
  description = "Name of the content S3 bucket"
  value       = aws_s3_bucket.content.bucket
}

output "S3BucketArn" {
  description = "ARN of the content S3 bucket"
  value       = aws_s3_bucket.content.arn
}

output "DynamoDBTableName" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "DynamoDBTableArn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

output "LambdaFunctionName" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "LambdaFunctionArn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "ApiGatewayUrl" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_stage.main.invoke_url}/process"
}

output "ApiGatewayId" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "KMSKeyId" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "KMSKeyArn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "EC2InstanceId" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "EC2PublicIp" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}
```