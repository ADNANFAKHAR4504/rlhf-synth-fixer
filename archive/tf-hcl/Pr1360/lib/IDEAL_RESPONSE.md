Below is the synchronized, ideal single-file Terraform implementation for `lib/tap_stack.tf` reflecting all current edits and fixes.

```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment (prod or dev)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["prod", "dev"], var.environment)
    error_message = "Environment must be either 'prod' or 'dev'."
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "tap"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = []
}

variable "api_access_log_retention_days" {
  description = "API Gateway access log retention in days"
  type        = number
  default     = 30
}

variable "vpc_flow_log_retention_days" {
  description = "VPC Flow Log retention in days"
  type        = number
  default     = 90
}

variable "rds_engine" {
  description = "RDS engine type"
  type        = string
  default     = "postgres"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_backup_retention_days" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_deletion_protection" {
  description = "Enable RDS deletion protection"
  type        = bool
  default     = true
}

variable "deploy_ec2" {
  description = "Deploy EC2 instance"
  type        = bool
  default     = false
}

variable "use_cmk" {
  description = "Use customer managed KMS key"
  type        = bool
  default     = false
}

variable "enable_config_managed_policy" {
  description = "Attach AWS managed policy AWSConfigRole to the Config role"
  type        = bool
  default     = false
}

variable "create_cloudtrail" {
  description = "Whether to create a CloudTrail trail (set false if account limit reached)"
  type        = bool
  default     = false
}

variable "s3_data_retention_days" {
  description = "S3 data bucket retention in days"
  type        = number
  default     = 365
}

variable "s3_logs_retention_days" {
  description = "S3 logs bucket retention in days"
  type        = number
  default     = 1825
}

variable "enable_api_stage_logging" {
  description = "Enable API Gateway stage access logging"
  type        = bool
  default     = false
}

########################
# Data sources
########################
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Locals
########################
locals {
  region      = var.aws_region
  name_prefix = "${var.environment}-${var.project}"

  common_tags = {
    Environment = var.environment
    Project     = var.project
    Owner       = var.owner
  }

  # Get first two AZs in the selected region
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

########################
# Optional KMS for encryption (CMK)
########################
resource "aws_kms_key" "main" {
  count = var.use_cmk ? 1 : 0

  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 7

  # Restrictive key policy; grants account root and CloudTrail limited permissions
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid       = "AllowCloudTrailEncrypt"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = ["kms:GenerateDataKey*", "kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  count         = var.use_cmk ? 1 : 0
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main[0].key_id
}

########################
# IAM password policy
########################
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
}

########################
# Networking (VPC, subnets, routing)
########################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_eip" "nat" {
  count      = 2
  domain     = "vpc"
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-private-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

########################
# Security groups
########################
resource "aws_security_group" "web" {
  name_prefix = "${local.name_prefix}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-sg" })
}

resource "aws_security_group" "app" {
  name_prefix = "${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id

  # Optional SSH from allowed CIDRs
  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  # Example app port from web SG
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-app-sg" })
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.rds_engine == "postgres" ? 5432 : 3306
    to_port         = var.rds_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-sg" })
}

########################
# CloudWatch log groups & VPC Flow Logs
########################
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = var.vpc_flow_log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.api_access_log_retention_days
  tags              = local.common_tags
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = aws_cloudwatch_log_group.vpc_flow_logs.arn
    }]
  })
}

resource "aws_flow_log" "vpc" {
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  log_group_name       = aws_cloudwatch_log_group.vpc_flow_logs.name
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  tags                 = local.common_tags
}

########################
# S3 buckets (logs, data) with security controls
########################
resource "random_id" "bucket_suffix" { byte_length = 4 }

resource "aws_s3_bucket" "logs" {
  # Region included in name to emphasize region scoping
  bucket        = "${local.name_prefix}-logs-${local.region}-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags          = local.common_tags
}

resource "aws_s3_bucket" "data" {
  bucket        = "${local.name_prefix}-data-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags          = local.common_tags
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.use_cmk ? "aws:kms" : "AES256"
      kms_master_key_id = var.use_cmk ? aws_kms_key.main[0].arn : null
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.use_cmk ? "aws:kms" : "AES256"
      kms_master_key_id = var.use_cmk ? aws_kms_key.main[0].arn : null
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Require TLS and allow CloudTrail to write with bucket-owner-full-control
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "DenyInsecureConnections",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:*",
        Resource  = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"],
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid       = "AllowCloudTrailWrite",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = ["s3:PutObject"],
        Resource  = "${aws_s3_bucket.logs.arn}/cloudtrail/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      },
      {
        Sid       = "AllowCloudTrailGetBucketAcl",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = ["s3:GetBucketAcl"],
        Resource  = aws_s3_bucket.logs.arn
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "DenyInsecureConnections",
      Effect    = "Deny",
      Principal = "*",
      Action    = "s3:*",
      Resource  = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"],
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "logs_lifecycle"
    status = "Enabled"
    filter {
      prefix = ""
    }
    expiration { days = var.s3_logs_retention_days }
    noncurrent_version_expiration { noncurrent_days = 30 }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    id     = "data_lifecycle"
    status = "Enabled"
    filter {
      prefix = ""
    }
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration {
      days = var.s3_data_retention_days
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

########################
# RDS (private, encrypted, backups on)
########################
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-db-subnet-group" })
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_db_instance" "main" {
  identifier              = "${local.name_prefix}-database"
  engine                  = var.rds_engine
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  max_allocated_storage   = var.rds_allocated_storage * 2
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id              = var.use_cmk ? aws_kms_key.main[0].arn : null
  db_name                 = var.rds_engine == "postgres" ? "appdb" : "appdb"
  username                = "dbadmin"
  password                = random_password.db_password.result
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = var.rds_backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  skip_final_snapshot     = var.environment == "dev"
  deletion_protection     = var.rds_deletion_protection
  publicly_accessible     = false
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}-database" })
}

########################
# EC2 (optional, private)
########################
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:GetObject", "s3:PutObject"],
        Resource = ["${aws_s3_bucket.data.arn}/*"]
      },
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  tags = local.common_tags
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  count                  = var.deploy_ec2 ? 1 : 0
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = null
  vpc_security_group_ids = [aws_security_group.app.id]
  subnet_id              = aws_subnet.private[0].id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = var.use_cmk ? aws_kms_key.main[0].arn : null
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-app-instance" })
}

########################
# API Gateway (REST) with stage logging
########################
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "Main API for ${local.name_prefix}"
  endpoint_configuration { types = ["REGIONAL"] }
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_mock" {
  rest_api_id       = aws_api_gateway_rest_api.main.id
  resource_id       = aws_api_gateway_resource.health.id
  http_method       = aws_api_gateway_method.health_get.http_method
  type              = "MOCK"
  request_templates = { "application/json" = jsonencode({ statusCode = 200 }) }
}

resource "aws_api_gateway_method_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "health_200" {
  rest_api_id        = aws_api_gateway_rest_api.main.id
  resource_id        = aws_api_gateway_resource.health.id
  http_method        = aws_api_gateway_method.health_get.http_method
  status_code        = aws_api_gateway_method_response.health_200.status_code
  response_templates = { "application/json" = jsonencode({ status = "healthy" }) }
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  depends_on  = [aws_api_gateway_method.health_get, aws_api_gateway_integration.health_mock]
  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  depends_on    = [aws_api_gateway_deployment.main]
  dynamic "access_log_settings" {
    for_each = var.enable_api_stage_logging ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api_gateway.arn
      format = jsonencode({
        requestId      = "$context.requestId",
        ip             = "$context.identity.sourceIp",
        caller         = "$context.identity.caller",
        user           = "$context.identity.user",
        requestTime    = "$context.requestTime",
        httpMethod     = "$context.httpMethod",
        resourcePath   = "$context.resourcePath",
        status         = "$context.status",
        protocol       = "$context.protocol",
        responseLength = "$context.responseLength"
      })
    }
  }
  tags = local.common_tags
}

########################
# CloudTrail (multi-region) to logs bucket
########################
resource "aws_cloudtrail" "main" {
  count                         = var.create_cloudtrail ? 1 : 0
  name                          = "${local.name_prefix}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.logs.bucket
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = var.use_cmk ? aws_kms_key.main[0].arn : null
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.data.arn}/*"]
    }
  }
  tags = local.common_tags
}

########################
# AWS Config (recorder, delivery channel, rules)
########################
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config" {
  count      = var.enable_config_managed_policy ? 1 : 0
  role       = aws_iam_role.config.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "${local.name_prefix}-config-s3-policy"
  role = aws_iam_role.config.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["s3:GetBucketAcl", "s3:ListBucket"], Resource = aws_s3_bucket.logs.arn },
      { Effect = "Allow", Action = "s3:PutObject", Resource = "${aws_s3_bucket.logs.arn}/config/*", Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } } },
      { Effect = "Allow", Action = "s3:GetObject", Resource = "${aws_s3_bucket.logs.arn}/config/*" }
    ]
  })
}

resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-recorder"
  role_arn = aws_iam_role.config.arn
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "config"
  depends_on     = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  is_enabled = true
  name       = aws_config_configuration_recorder.main.name
  depends_on = [aws_config_delivery_channel.main]
}

# Managed rules required by prompt
resource "aws_config_config_rule" "s3_sse" {
  name = "${local.name_prefix}-s3-bucket-sse-enabled"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${local.name_prefix}-cloudtrail-enabled"
  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${local.name_prefix}-encrypted-volumes"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "restricted_ssh" {
  name = "${local.name_prefix}-restricted-ssh"
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-enabled"
  source {
    owner             = "AWS"
    source_identifier = "VPC_FLOW_LOGS_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder_status.main]
}

########################
# GuardDuty
########################
resource "aws_guardduty_detector" "main" {
  enable = true
  tags   = local.common_tags
}

########################
# Outputs (explicit per prompt)
########################
output "vpc_id" { value = aws_vpc.main.id }

output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }

output "web_sg_id" { value = aws_security_group.web.id }
output "app_sg_id" { value = aws_security_group.app.id }
output "rds_sg_id" { value = aws_security_group.rds.id }

output "rds_endpoint" { value = aws_db_instance.main.endpoint }

output "logs_bucket_name" { value = aws_s3_bucket.logs.bucket }
output "logs_bucket_arn" { value = aws_s3_bucket.logs.arn }
output "data_bucket_name" { value = aws_s3_bucket.data.bucket }
output "data_bucket_arn" { value = aws_s3_bucket.data.arn }

output "cloudtrail_arn" {
  value = var.create_cloudtrail ? aws_cloudtrail.main[0].arn : null
}
output "cloudtrail_home_region" { value = var.aws_region }

output "config_recorder_name" { value = aws_config_configuration_recorder.main.name }
output "config_delivery_name" { value = aws_config_delivery_channel.main.name }

output "guardduty_detector_id" { value = aws_guardduty_detector.main.id }

output "api_gateway_id" { value = aws_api_gateway_rest_api.main.id }
output "api_gateway_stage" { value = aws_api_gateway_stage.main.stage_name }
output "api_gateway_invoke_url" {
  # Explicitly use var.aws_region per prompt
  value = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}/"
}
```
