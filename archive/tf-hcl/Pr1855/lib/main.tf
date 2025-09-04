###############################
# ./lib/main.tf
# Single-file Terraform HCL stack
# - No provider blocks here (provider.tf must exist)
# - All variables, locals, resources, and outputs in this file
###############################

########################################
# Variables
########################################
variable "aws_region" {
  description = "Primary AWS region (provider.tf should consume this variable)"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "ProdApp"
}

variable "environment" {
  description = "Environment name for tags (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for cost allocation"
  type        = string
  default     = "platform-team"
}

variable "ssh_allowed_cidrs" {
  description = "CIDRs allowed for SSH (kept conservative; not used by default)"
  type        = list(string)
  default     = []
}

variable "http_allowed_cidrs" {
  description = "CIDRs allowed for HTTP/HTTPS (default opens HTTP/HTTPS to public)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "app.handler"
}


variable "create_rds" {
  description = "Whether to create an RDS instance (toggle to avoid limits)"
  type        = bool
  default     = true
}

variable "db_engine" {
  description = "RDS engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "14"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}

variable "db_master_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
}

variable "db_master_password" {
  description = "RDS master password (sensitive - provide via CI/secret store)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "random_suffix_bytes" {
  description = "Bytes for random suffix used in resource names (avoid collisions)"
  type        = number
  default     = 4
}

########################################
# Locals & Data
########################################
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# Use default VPC and its subnets (the prompt allowed default VPC usage)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Resolve a recent Amazon Linux 2 AMI for convenience (if you later add EC2)
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  suffix_hex  = random_id.suffix.hex
  name_prefix = lower("${var.project}-${var.environment}-${local.account_id}-${local.suffix_hex}")

  common_tags = {
    Owner       = var.owner
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
  }

  # Bucket names (must be globally unique) - include account & suffix
  s3_names = {
    static  = "prodapp-static-${local.account_id}-${local.suffix_hex}"
    logging = "prodapp-logs-${local.account_id}-${local.suffix_hex}"
  }

  # If create_rds = false, tests expect outputs to exist (but empty)
  rds_enabled = var.create_rds ? true : false
}

########################################
# Random suffix
########################################
resource "random_id" "suffix" {
  byte_length = var.random_suffix_bytes
}

########################################
# Tag helper - we merge with resource-specific Name tag where needed
########################################
# (We simply use locals.common_tags when setting tags on resources)

########################################
# S3: Logging bucket (encrypted + versioned)
########################################
resource "aws_s3_bucket" "logging" {
  bucket = local.s3_names.logging
  tags   = merge(local.common_tags, { Name = "${var.project}-logging-${local.suffix_hex}" })
}

resource "aws_s3_bucket_acl" "logging" {
  bucket     = aws_s3_bucket.logging.id
  acl        = "log-delivery-write" # appropriate for S3 access logs
  depends_on = [aws_s3_bucket_ownership_controls.logging]
}

resource "aws_s3_bucket_ownership_controls" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket                  = aws_s3_bucket.logging.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Use AWS-managed S3 encryption for access logs (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = false
  }
}

########################################
# S3: Static content bucket (encrypted, versioned, logging, lifecycle)
########################################
resource "aws_s3_bucket" "static" {
  bucket = local.s3_names.static
  tags   = merge(local.common_tags, { Name = "${var.project}-static-${local.suffix_hex}" })
}

resource "aws_s3_bucket_acl" "static" {
  bucket     = aws_s3_bucket.static.id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.static]
}

resource "aws_s3_bucket_ownership_controls" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket                  = aws_s3_bucket.static.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Use AWS-managed KMS for S3 objects (alias/aws/s3) to avoid CMK admin work in example.
# This is secure and avoids needing to manage a CMK's key policy in this example.
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "alias/aws/s3"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_logging" "static" {
  bucket        = aws_s3_bucket.static.id
  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "static-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    id     = "expire-objects-365"
    status = "Enabled"

    filter {}

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

########################################
# IAM: Lambda execution role (least privilege)
########################################
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-exec-${local.suffix_hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowLambdaServicePrincipal",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# Policy document: allow CloudWatch logs (scoped) and read access to the static S3 bucket (scoped)
data "aws_iam_policy_document" "lambda_policy_doc" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/*"]
  }

  statement {
    sid    = "ReadStaticS3"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.static.arn,
      "${aws_s3_bucket.static.arn}/*"
    ]
  }

  # VPC permissions for Lambda to access RDS in VPC
  statement {
    sid    = "VPCAccess"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]
    resources = ["*"] # EC2 VPC permissions require wildcard resources
  }
}

resource "aws_iam_role_policy" "lambda_exec_policy" {
  name   = "${var.project}-lambda-policy-${local.suffix_hex}"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy_doc.json
}

########################################
# Security Groups: Lambda SG and RDS SG
# - Lambda SG allows outbound to the DB (egress open)
# - RDS SG allows inbound only from Lambda SG on DB port
########################################
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project}-lambda-sg-${local.suffix_hex}"
  description = "Security group for Lambda functions"
  vpc_id      = data.aws_vpc.default.id
  tags        = local.common_tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg-${local.suffix_hex}"
  description = "Security group for RDS (allow from Lambda)"
  vpc_id      = data.aws_vpc.default.id
  tags        = local.common_tags

  # Allow inbound Postgres (5432) or MySQL (3306) from Lambda SG only (added dynamically below)
  ingress {
    from_port       = var.db_engine == "mysql" ? 3306 : 5432
    to_port         = var.db_engine == "mysql" ? 3306 : 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
    description     = "Allow DB access from Lambda SG only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

########################################
# Lambda function (regional) + API Gateway (regional)
########################################
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda.zip"
  source {
    content  = <<EOF
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from inline Lambda!'
    }
EOF
    filename = "app.py"
  }
}

resource "aws_lambda_function" "app" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project}-backend-${local.suffix_hex}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  memory_size      = 256
  publish          = true
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # If your Lambda needs VPC access to reach RDS, specify subnet_ids & security_group_ids:
  vpc_config {
    subnet_ids         = slice(data.aws_subnets.default_vpc.ids, 0, 2)
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = local.common_tags
  # Do not put secrets in environment variables - keep them in a secret manager in real use.
  environment {
    variables = {
      STATIC_BUCKET = aws_s3_bucket.static.bucket
      ENVIRONMENT   = var.environment
      PROJECT       = var.project
    }
  }
}

# API Gateway REST API (regional)
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project}-api-${local.suffix_hex}"
  description = "Regional API for ${var.project}"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  tags = local.common_tags
}

# Root resource id is available as rest_api.root_resource_id
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

# ANY method on proxy resource
resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Integration (Lambda proxy)
resource "aws_api_gateway_integration" "lambda_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:${data.aws_partition.current.partition}:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.app.arn}/invocations"
}

# Permission for API Gateway to invoke Lambda
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke-${local.suffix_hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# Deployment & Stage
resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_integration.lambda_proxy]
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy_any.id,
      aws_api_gateway_integration.lambda_proxy.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
  tags          = local.common_tags
}

########################################
# RDS (optional) - encrypted, in default VPC, secured by SG
########################################
resource "aws_db_subnet_group" "default" {
  name       = "db-subnet-group-${lower(var.project)}-${local.suffix_hex}"
  subnet_ids = slice(data.aws_subnets.default_vpc.ids, 0, 2)
  tags       = local.common_tags
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_db_instance" "db" {
  count                  = var.create_rds ? 1 : 0
  identifier             = "db-${lower(var.project)}-${local.suffix_hex}"
  engine                 = var.db_engine
  engine_version         = var.db_engine_version
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  db_name                = "${var.project}_db"
  username               = var.db_master_username
  manage_master_user_password = true
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  multi_az               = false
  storage_encrypted      = true
  tags                   = local.common_tags

  # Storage encryption uses AWS-managed keys by default (no CMK created here).
}

########################################
# Minimal IAM policy to allow CloudWatch to put metric logs or alarms if needed (optional)
# (We keep this minimal and optional; not attached automatically)
########################################
data "aws_iam_policy_document" "cw_event_policy" {
  statement {
    sid = "AllowCWPut"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

resource "aws_iam_policy" "cloudwatch_put" {
  name   = "${var.project}-cw-put-${local.suffix_hex}"
  policy = data.aws_iam_policy_document.cw_event_policy.json
  tags   = local.common_tags
}

########################################
# Outputs (non-sensitive; return empty string for optional resources when disabled)
########################################
output "s3_static_bucket_name" {
  description = "Static S3 bucket name"
  value       = aws_s3_bucket.static.bucket
}

output "s3_logging_bucket_name" {
  description = "Logging S3 bucket name"
  value       = aws_s3_bucket.logging.bucket
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.app.function_name
}

# API Gateway invoke URL (constructed)
output "api_gateway_url" {
  description = "Regional API Gateway invoke URL (prod stage)"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
}

output "rds_instance_identifier" {
  description = "RDS instance identifier (empty if create_rds = false)"
  value       = var.create_rds ? aws_db_instance.db[0].id : ""
  sensitive   = false
}

output "aws_region" {
  description = "AWS region used by the stack"
  value       = var.aws_region
}

########################################
# Inline notes & guidance (non-functional comments)
########################################
/*
Notes:
- This template uses AWS-managed KMS for S3 encryption (alias/aws/s3). If you require a customer-managed CMK
  (for example to apply granular key policies or cross-account access) replace kms_master_key_id with a created aws_kms_key
  and add appropriate grants for cross-region or cross-account replication.

- Lambda code path (var.lambda_zip_path) must be provided by CI or existing local file. The source_code_hash uses filebase64sha256()
  so plan will fail if the file doesn't exist. In CI pipelines, ensure you provide/upload the zip before `terraform plan`.

- RDS password is a sensitive variable (do not output it). Provide it through CI secret injection (e.g., CI secret store or env var).

- Resource names include the account id and a random suffix to avoid global name collisions across CI runs.

- IAM policies are scoped to resource ARNs where possible (S3 static bucket and CloudWatch logs).
  If you add more permissions, scope them minimally.

Test-friendliness:
- When `create_rds = false`, outputs still exist but `rds_instance_identifier` is an empty string (tests can check and skip RDS-related asserts).
- All outputs are non-sensitive strings suitable for `cfn-outputs/all-outputs.json` consumption by your integration tests.

Security reminders:
- Do not store secrets in Terraform files committed to source control.
- Rotate any customer-managed keys periodically (not implemented here).
- Review any IAM policies and scope further if needed before production.
*/
