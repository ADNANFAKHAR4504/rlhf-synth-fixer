```hcl
#############################################
# tap_stack.tf — Single-file Terraform (EC2 + S3 + DynamoDB + API GW + Lambda)
# EC2 and Lambda are ALWAYS created (no flags)
#############################################

#############################################
# VARIABLES
#############################################
variable "ProjectName" {
  type        = string
  description = "Name of the project for resource naming and tagging"
  default     = "serverless-app"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.ProjectName))
    error_message = "Must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "Environment" {
  type        = string
  description = "Environment name for resource tagging"
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.Environment)
    error_message = "Environment must be one of dev, staging, prod."
  }
}

#############################################
# DATA & LOCALS
#############################################
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  base_tags = {
    Environment = var.Environment
    Project     = var.ProjectName
  }

  content_bucket_name = "${var.ProjectName}-${var.Environment}-content-${data.aws_caller_identity.current.account_id}"
  logs_bucket_name    = "${var.ProjectName}-${var.Environment}-logs-${data.aws_caller_identity.current.account_id}"
}

#############################################
# KMS
#############################################
resource "aws_kms_key" "KMSKey" {
  description             = "KMS key for ${var.ProjectName} encryption"
  deletion_window_in_days = 30

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch Logs"
        Effect    = "Allow"
        Principal = { Service = "logs.${data.aws_region.current.name}.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      },
      {
        Sid       = "AllowLambdaServiceToUseKey"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey","kms:CreateGrant"]
        Resource  = "*"
        Condition = {
          "StringEquals" = { "kms:ViaService" = "lambda.${data.aws_region.current.name}.amazonaws.com" },
          "Bool"         = { "kms:GrantIsForAWSResource" = "true" }
        }
      }
    ]
  })

  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-kms-key" })
}

resource "aws_kms_alias" "KMSKeyAlias" {
  name          = "alias/${var.ProjectName}-${var.Environment}-key"
  target_key_id = aws_kms_key.KMSKey.key_id
}

#############################################
# S3: logs + content (SSE-KMS)
#############################################
resource "aws_s3_bucket" "S3LoggingBucket" {
  bucket        = local.logs_bucket_name
  force_destroy = true
  tags          = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-logs-bucket" })
}

resource "aws_s3_bucket_ownership_controls" "S3LoggingBucket" {
  bucket = aws_s3_bucket.S3LoggingBucket.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

resource "aws_s3_bucket_public_access_block" "S3LoggingBucket" {
  bucket                  = aws_s3_bucket.S3LoggingBucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "S3LoggingBucket" {
  bucket = aws_s3_bucket.S3LoggingBucket.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "S3LoggingBucket" {
  bucket = aws_s3_bucket.S3LoggingBucket.id
  rule {
    id     = "DeleteOldLogs"
    status = "Enabled"
    filter { prefix = "" }
    expiration { days = 90 }
  }
}

resource "aws_s3_bucket_policy" "LoggingBucketPolicy" {
  bucket = aws_s3_bucket.S3LoggingBucket.id
  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Sid       = "GrantLoggingServiceWriteAccess"
        Effect    = "Allow"
        Principal = { Service = "logging.s3.amazonaws.com" }
        Action    = ["s3:PutObject"]
        Resource  = "${aws_s3_bucket.S3LoggingBucket.arn}/*"
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      },
      {
        Sid       = "AllowReadACP"
        Effect    = "Allow"
        Principal = { Service = "logging.s3.amazonaws.com" }
        Action    = ["s3:GetBucketAcl"]
        Resource  = aws_s3_bucket.S3LoggingBucket.arn
      }
    ]
  })
}

resource "aws_s3_bucket" "S3Bucket" {
  bucket        = local.content_bucket_name
  force_destroy = true
  tags          = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-content-bucket" })
}

resource "aws_s3_bucket_versioning" "S3Bucket" {
  bucket = aws_s3_bucket.S3Bucket.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "S3Bucket" {
  bucket                  = aws_s3_bucket.S3Bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "S3Bucket" {
  bucket = aws_s3_bucket.S3Bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.KMSKey.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_logging" "S3Bucket" {
  bucket        = aws_s3_bucket.S3Bucket.id
  target_bucket = aws_s3_bucket.S3LoggingBucket.id
  target_prefix = "access-logs/"
}

#############################################
# DynamoDB
#############################################
resource "aws_dynamodb_table" "DynamoDBTable" {
  name           = "${var.ProjectName}-${var.Environment}-data"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.KMSKey.arn
  }

  point_in_time_recovery { enabled = true }

  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-table" })
}

#############################################
# Lambda role + function (always on)
#############################################
resource "aws_iam_role" "LambdaExecutionRole" {
  name = "${var.ProjectName}-${var.Environment}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-lambda-role" })
}

resource "aws_iam_role_policy_attachment" "LambdaBasicExecution" {
  role       = aws_iam_role.LambdaExecutionRole.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "LambdaExecutionRole_S3Access" {
  name = "S3Access"
  role = aws_iam_role.LambdaExecutionRole.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:GetObject","s3:PutObject","s3:ListBucket"],
      Resource = [aws_s3_bucket.S3Bucket.arn, "${aws_s3_bucket.S3Bucket.arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy" "LambdaExecutionRole_DynamoDBAccess" {
  name = "DynamoDBAccess"
  role = aws_iam_role.LambdaExecutionRole.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:Query","dynamodb:Scan"],
      Resource = aws_dynamodb_table.DynamoDBTable.arn
    }]
  })
}

resource "aws_iam_role_policy" "LambdaExecutionRole_KMSAccess" {
  name = "KMSAccess"
  role = aws_iam_role.LambdaExecutionRole.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"],
      Resource = aws_kms_key.KMSKey.arn
    }]
  })
}

resource "aws_iam_role_policy" "LambdaExecutionRole_S3NotificationAccess" {
  name = "S3NotificationAccess"
  role = aws_iam_role.LambdaExecutionRole.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["s3:PutBucketNotification","s3:GetBucketNotification"],
      Resource = aws_s3_bucket.S3Bucket.arn
    }]
  })
}

data "archive_file" "LambdaFunction_zip" {
  type        = "zip"
  output_path = "./lambda_processor.zip"
  source {
    content = <<PY
import json, boto3, os
from datetime import datetime
def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    try:
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']
                    table.put_item(Item={
                        'id': f"{bucket}-{key}-{datetime.now().isoformat()}",
                        'bucket': bucket, 'key': key,
                        'timestamp': datetime.now().isoformat(),
                        'event_type': 's3_event'
                    })
        elif 'httpMethod' in event:
            table.put_item(Item={
                'id': f"api-{datetime.now().isoformat()}",
                'method': event['httpMethod'],
                'path': event['path'],
                'timestamp': datetime.now().isoformat(),
                'event_type': 'api_request'
            })
        return {'statusCode':200,'headers':{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
                'body':json.dumps({'message':'Event processed successfully','timestamp':datetime.now().isoformat()})}
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode':500,'headers':{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
                'body':json.dumps({'error':'Internal server error','message':str(e)})}
PY
    filename = "index.py"
  }
}

resource "aws_lambda_function" "LambdaFunction" {
  function_name = "${var.ProjectName}-${var.Environment}-processor"
  role          = aws_iam_role.LambdaExecutionRole.arn
  runtime       = "python3.9"
  handler       = "index.lambda_handler"
  filename         = data.archive_file.LambdaFunction_zip.output_path
  source_code_hash = data.archive_file.LambdaFunction_zip.output_base64sha256
  timeout     = 30
  memory_size = 256
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.DynamoDBTable.name
      S3_BUCKET      = aws_s3_bucket.S3Bucket.id
      KMS_KEY_ID     = aws_kms_key.KMSKey.key_id
    }
  }
  depends_on = [
    aws_iam_role.LambdaExecutionRole,
    aws_iam_role_policy_attachment.LambdaBasicExecution,
    aws_iam_role_policy.LambdaExecutionRole_S3Access,
    aws_iam_role_policy.LambdaExecutionRole_DynamoDBAccess,
    aws_iam_role_policy.LambdaExecutionRole_KMSAccess
  ]
  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-lambda" })
}

resource "aws_cloudwatch_log_group" "LambdaLogGroup" {
  name              = "/aws/lambda/${var.ProjectName}-${var.Environment}-processor"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.KMSKey.arn
}

resource "aws_lambda_permission" "LambdaInvokePermissionS3" {
  statement_id   = "AllowS3Invoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.LambdaFunction.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.S3Bucket.arn
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_s3_bucket_notification" "S3Notification" {
  bucket = aws_s3_bucket.S3Bucket.id
  lambda_function {
    id                  = "ObjectCreatedNotification"
    lambda_function_arn = aws_lambda_function.LambdaFunction.arn
    events              = ["s3:ObjectCreated:*"]
  }
  depends_on = [aws_lambda_permission.LambdaInvokePermissionS3]
}

#############################################
# API Gateway (proxy → Lambda)
#############################################
resource "aws_api_gateway_rest_api" "ApiGateway" {
  name        = "${var.ProjectName}-${var.Environment}-api"
  description = "REST API for serverless application"
  endpoint_configuration { types = ["REGIONAL"] }
  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-api" })
}

resource "aws_api_gateway_resource" "ApiGatewayResource" {
  rest_api_id = aws_api_gateway_rest_api.ApiGateway.id
  parent_id   = aws_api_gateway_rest_api.ApiGateway.root_resource_id
  path_part   = "process"
}

resource "aws_api_gateway_method" "ApiGatewayMethod" {
  rest_api_id   = aws_api_gateway_rest_api.ApiGateway.id
  resource_id   = aws_api_gateway_resource.ApiGatewayResource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "ApiGatewayIntegrationLambda" {
  rest_api_id             = aws_api_gateway_rest_api.ApiGateway.id
  resource_id             = aws_api_gateway_resource.ApiGatewayResource.id
  http_method             = aws_api_gateway_method.ApiGatewayMethod.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.LambdaFunction.arn}/invocations"
}

resource "aws_api_gateway_method_response" "ApiGatewayMethod_200" {
  rest_api_id = aws_api_gateway_rest_api.ApiGateway.id
  resource_id = aws_api_gateway_resource.ApiGatewayResource.id
  http_method = aws_api_gateway_method.ApiGatewayMethod.http_method
  status_code = "200"
  response_models = { "application/json" = "Empty" }
}

resource "aws_api_gateway_deployment" "ApiGatewayDeployment" {
  rest_api_id = aws_api_gateway_rest_api.ApiGateway.id
  depends_on  = [
    aws_api_gateway_integration.ApiGatewayIntegrationLambda,
    aws_api_gateway_method_response.ApiGatewayMethod_200
  ]
}

resource "aws_iam_role" "APIGatewayCloudWatchLogsRole" {
  name = "APIGatewayCloudWatchLogsRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "apigateway.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "APIGatewayLogsAttach" {
  role       = aws_iam_role.APIGatewayCloudWatchLogsRole.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "ApiGatewayAccount" {
  cloudwatch_role_arn = aws_iam_role.APIGatewayCloudWatchLogsRole.arn
  depends_on          = [aws_iam_role_policy_attachment.APIGatewayLogsAttach]
}

resource "aws_cloudwatch_log_group" "ApiGatewayLogGroup" {
  name              = "/aws/apigateway/${var.ProjectName}-${var.Environment}-api"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.KMSKey.arn
}

resource "aws_api_gateway_stage" "ApiGatewayStage" {
  rest_api_id   = aws_api_gateway_rest_api.ApiGateway.id
  deployment_id = aws_api_gateway_deployment.ApiGatewayDeployment.id
  stage_name    = var.Environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.ApiGatewayLogGroup.arn
    format          = "$context.requestId $context.requestTime $context.httpMethod $context.resourcePath $context.status $context.responseLength $context.requestTime"
  }
}

resource "aws_lambda_permission" "LambdaInvokePermissionApi" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.LambdaFunction.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.ApiGateway.id}/${aws_api_gateway_stage.ApiGatewayStage.stage_name}/*/*"
}

#############################################
# EC2 (default VPC) — write proof to S3 and record to DynamoDB
#############################################
resource "aws_default_vpc" "default" {}

data "aws_subnets" "default_vpc_subnets" {
  filter {
    name   = "vpc-id"
    values = [aws_default_vpc.default.id]
  }
}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

resource "aws_iam_role" "EC2InstanceRole" {
  name = "${var.ProjectName}-${var.Environment}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-ec2-role" })
}

resource "aws_iam_role_policy_attachment" "EC2_SSM_Core" {
  role       = aws_iam_role.EC2InstanceRole.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Minimal, explicit permissions for SSE-KMS PUT
resource "aws_iam_role_policy" "EC2InstanceAccess" {
  name = "ec2-s3-ddb-kms-access"
  role = aws_iam_role.EC2InstanceRole.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "S3PutObjectContentBucket"
        Effect   = "Allow"
        Action   = ["s3:PutObject","s3:ListBucket","s3:PutObjectTagging"]
        Resource = [aws_s3_bucket.S3Bucket.arn, "${aws_s3_bucket.S3Bucket.arn}/*"]
      },
      {
        Sid      = "DynamoDBPutItem"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.DynamoDBTable.arn
      },
      {
        Sid      = "KMSForSSEKMSOnBucket"
        Effect   = "Allow"
        Action   = ["kms:Encrypt","kms:GenerateDataKey","kms:GenerateDataKeyWithoutPlaintext","kms:DescribeKey"]
        Resource = aws_kms_key.KMSKey.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "EC2InstanceProfile" {
  name = "${var.ProjectName}-${var.Environment}-ec2-profile"
  role = aws_iam_role.EC2InstanceRole.name
}

resource "aws_security_group" "EC2SecurityGroup" {
  name   = "${var.ProjectName}-${var.Environment}-ec2-sg"
  vpc_id = aws_default_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-ec2-sg" })
}

# Harden boot flow: wait for bucket+encryption before launch, then robust user-data
resource "aws_instance" "EC2TestInstance" {
  ami           = data.aws_ssm_parameter.al2023_ami.value
  instance_type = "t3.micro"

  subnet_id                   = element(data.aws_subnets.default_vpc_subnets.ids, 0)
  vpc_security_group_ids      = [aws_security_group.EC2SecurityGroup.id]
  iam_instance_profile        = aws_iam_instance_profile.EC2InstanceProfile.name
  associate_public_ip_address = true

    user_data = <<-BASH
    #!/usr/bin/env bash
    set -euxo pipefail
    exec > >(tee -a /var/log/user-data.log) 2>&1

    REGION="${data.aws_region.current.name}"
    TABLE="${aws_dynamodb_table.DynamoDBTable.name}"
    BUCKET="${aws_s3_bucket.S3Bucket.id}"
    KMS_ID="${aws_kms_key.KMSKey.key_id}"

    # Basic network wait
    for i in $(seq 1 12); do
      ping -c1 -W1 8.8.8.8 && break || sleep 5
    done

    # Ensure AWS CLI present (AL2023 usually has it, but just in case)
    for i in $(seq 1 8); do
      if command -v aws >/dev/null 2>&1; then break; fi
      (dnf -y install awscli || yum -y install awscli || true)
      sleep 5
    done
    command -v aws

    IID="$(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
    TS="$(date -Is)"
    echo "Hello from $IID at $TS" >/tmp/hello.txt
    KEY="ec2-proof/$${IID}.txt"

    retry() { n=0; until [ "$n" -ge 24 ]; do "$@" && break; n=$((n+1)); sleep 5; done; }

    # Robust S3 put: try high-level cp first (uses bucket default SSE-KMS),
    # then fall back to explicit SSE-KMS if needed.
    s3_put() {
      echo "[BOOT] Trying aws s3 cp..."
      if aws s3 cp /tmp/hello.txt "s3://$BUCKET/$KEY" --region "$REGION"; then
        return 0
      fi
      echo "[BOOT] cp failed, trying s3api put-object with SSE-KMS..."
      aws s3api put-object \
        --bucket "$BUCKET" \
        --key "$KEY" \
        --body /tmp/hello.txt \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$KMS_ID" \
        --region "$REGION"
    }

    retry s3_put

    # DDB proof rows
    ITEM="{\\"id\\":{\\"S\\":\\"ec2-$${IID}\\"},\\"event_type\\":{\\"S\\":\\"ec2_boot\\"},\\"timestamp\\":{\\"S\\":\\"$TS\\"}}"
    retry aws dynamodb put-item --table-name "$TABLE" --item "$ITEM" --region "$REGION"

    ITEM2="{\\"id\\":{\\"S\\":\\"ec2-$${IID}-e2e\\"},\\"event_type\\":{\\"S\\":\\"ec2_proof\\"},\\"timestamp\\":{\\"S\\":\\"$TS\\"}}"
    retry aws dynamodb put-item --table-name "$TABLE" --item "$ITEM2" --region "$REGION"

    echo "BOOT COMPLETE"
  BASH


  tags = merge(local.base_tags, { Name = "${var.ProjectName}-${var.Environment}-ec2" })

  depends_on = [
    aws_s3_bucket_server_side_encryption_configuration.S3Bucket,
    aws_s3_bucket_public_access_block.S3Bucket,
    aws_iam_role_policy.EC2InstanceAccess
  ]
}

#############################################
# OUTPUTS
#############################################
output "Environment" {
  value       = var.Environment
  description = "Environment suffix"
}

output "StackName"         { 
  value = "${var.ProjectName}-${var.Environment}" 
}
output "S3BucketName"      { 
  value = aws_s3_bucket.S3Bucket.id 
}
output "S3BucketArn"       { 
  value = aws_s3_bucket.S3Bucket.arn 
}
output "DynamoDBTableName" { 
  value = aws_dynamodb_table.DynamoDBTable.name 
}
output "DynamoDBTableArn"  { 
  value = aws_dynamodb_table.DynamoDBTable.arn 
}
output "LambdaFunctionName"{ 
  value = aws_lambda_function.LambdaFunction.function_name 
}
output "LambdaFunctionArn" { 
  value = aws_lambda_function.LambdaFunction.arn 
}
output "ApiGatewayUrl" {
  value = "https://${aws_api_gateway_rest_api.ApiGateway.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.ApiGatewayStage.stage_name}/process"
}
output "ApiGatewayId"  { 
  value = aws_api_gateway_rest_api.ApiGateway.id 
}
output "KMSKeyId"      { 
  value = aws_kms_key.KMSKey.key_id 
}
output "KMSKeyArn"     { 
  value = aws_kms_key.KMSKey.arn 
}
output "EC2InstanceId" { 
  value = aws_instance.EC2TestInstance.id 
}
output "EC2PublicIp"   { 
  value = aws_instance.EC2TestInstance.public_ip 
}
```