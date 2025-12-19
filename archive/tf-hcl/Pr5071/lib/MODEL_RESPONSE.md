### Reasoning Trace
---

This prompt is asking for a comprehensive Terraform file to create a test environment that mirrors a production environment for a fintech platform with 234 microservices. The file needs to create all the infrastructure from scratch and also set up daily jobs for data syncing, masking PII data, running integration tests, and sending metrics to CloudWatch.

Let's break down what I need to include in the `tap_stack.tf` file:

1. **Variables**: Declare all necessary variables, including `aws_region` which is already being used in an existing `provider.tf`.

2. **Networking**: Create VPC, subnets, NAT gateways, route tables, security groups, and VPC endpoints.

3. **Data Layers**: Create Aurora cluster, DynamoDB tables, and S3 buckets.

4. **Compute**: Create Lambda functions for various tasks like masking data, refreshing DynamoDB and Aurora data, syncing S3, and running integration tests.

5. **Automation**: Create EventBridge rules and Step Functions state machine to orchestrate the daily refresh tasks.

6. **Observability**: Create CloudWatch dashboards, log groups, and alarms.

7. **Parity Validation**: Create a scheduled task to validate the test environment against the production environment.

8. **Scalability**: Set up autoscaling for services.

9. **Encryption**: Create KMS keys for various purposes.

10. **IAM**: Create necessary roles and policies.

11. **Outputs**: Output important information like VPC ID, subnet IDs, etc.

Let's start creating the file:

```hcl
# Variables
variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat" {
  description = "Whether to enable NAT gateway"
  type        = bool
  default     = true
}

variable "service_names" {
  description = "List of service names"
  type        = list(string)
  default     = ["billing", "ledger", "auth"]
}

variable "ddb_tables" {
  description = "Map of DynamoDB tables to create"
  type = map(object({
    name          = string
    hash_key      = string
    range_key     = optional(string)
    billing_mode  = string
  }))
  default = {
    billing = {
      name          = "billing"
      hash_key      = "id"
      range_key     = "timestamp"
      billing_mode  = "PAY_PER_REQUEST"
    },
    ledger = {
      name          = "ledger"
      hash_key      = "id"
      range_key     = "timestamp"
      billing_mode  = "PAY_PER_REQUEST"
    },
    auth = {
      name          = "auth"
      hash_key      = "id"
      billing_mode  = "PAY_PER_REQUEST"
    }
  }
}

variable "aurora_engine" {
  description = "Aurora database engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r5.large"
}

variable "aurora_username" {
  description = "Aurora master username"
  type        = string
  default     = "admin"
}

variable "aurora_password" {
  description = "Aurora master password"
  type        = string
  sensitive   = true
  default     = null  # To be provided via environment variable or tfvars
}

variable "aurora_db_name" {
  description = "Aurora database name"
  type        = string
  default     = "fintech"
}

variable "artifact_bucket_name" {
  description = "S3 bucket name for artifacts"
  type        = string
  default     = "fintech-test-artifacts"
}

variable "data_bucket_name" {
  description = "S3 bucket name for data"
  type        = string
  default     = "fintech-test-data"
}

variable "staging_bucket_name" {
  description = "S3 bucket name for staging"
  type        = string
  default     = "fintech-test-staging"
}

variable "masking_rules" {
  description = "Map of column regex to replacement for data masking"
  type        = map(string)
  default     = {
    "email"       = "test+{{hash}}@example.com"
    "phone"       = "555-{{hash:4}}"
    "ssn"         = "XXX-XX-{{last:4}}"
    "credit_card" = "XXXX-XXXX-XXXX-{{last:4}}"
    "name"        = "Test User {{hash:4}}"
    "address"     = "123 Test St, Test City, Test State 12345"
  }
}

variable "prod_account_id" {
  description = "Production AWS account ID"
  type        = string
  default     = "123456789012"  # To be provided via tfvars
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {
    Environment = "test"
    ManagedBy   = "terraform"
    Project     = "fintech-platform"
  }
}

# Locals
locals {
  az_names = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  
  # Calculate number of subnets based on provided CIDRs
  public_subnet_count = length(var.public_subnet_cidrs)
  private_subnet_count = length(var.private_subnet_cidrs)
  
  # Standard naming patterns
  name_prefix = "fintech-test"
  
  # KMS key aliases
  kms_aliases = {
    data     = "alias/${local.name_prefix}-data"
    logs     = "alias/${local.name_prefix}-logs"
    ssm      = "alias/${local.name_prefix}-ssm"
    s3       = "alias/${local.name_prefix}-s3"
  }
  
  # Service KMS key aliases - one per service
  service_kms_aliases = {
    for service in var.service_names : 
    service => "alias/app-${service}-test"
  }
  
  # Database tables
  ddb_attributes = {
    for table_key, table in var.ddb_tables : table_key => concat(
      [
        {
          name = table.hash_key
          type = "S"
        }
      ],
      table.range_key != null ? [
        {
          name = table.range_key
          type = "S"
        }
      ] : []
    )
  }
  
  # Lambda functions
  lambda_functions = {
    masking_handler = {
      name        = "${local.name_prefix}-masking"
      description = "Handler for masking PII data"
      memory      = 512
      timeout     = 300
    }
    dynamodb_refresh_handler = {
      name        = "${local.name_prefix}-dynamodb-refresh"
      description = "Handler for refreshing DynamoDB data"
      memory      = 512
      timeout     = 300
    }
    aurora_refresh_handler = {
      name        = "${local.name_prefix}-aurora-refresh"
      description = "Handler for refreshing Aurora data"
      memory      = 512
      timeout     = 300
    }
    s3_sync_handler = {
      name        = "${local.name_prefix}-s3-sync"
      description = "Handler for syncing S3 data"
      memory      = 512
      timeout     = 300
    }
    integration_tests_handler = {
      name        = "${local.name_prefix}-integration-tests"
      description = "Handler for running integration tests"
      memory      = 1024
      timeout     = 900
    }
    parity_validation_handler = {
      name        = "${local.name_prefix}-parity-validation"
      description = "Handler for validating parity with production"
      memory      = 512
      timeout     = 300
    }
  }
  
  # Common IAM policies
  lambda_basic_execution_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
  
  # Step Functions service role policy
  step_function_service_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "lambda:InvokeFunction"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
  
  # Map service names to expected resources (for parity validation)
  expected_resources = {
    for service in var.service_names : service => {
      lambda     = "${local.name_prefix}-${service}"
      dynamodb   = contains(keys(var.ddb_tables), service) ? "${local.name_prefix}-${service}" : null
      kms        = "alias/app-${service}-test"
      cloudwatch = "${local.name_prefix}-${service}-dashboard"
    }
  }
}

# Networking resources
data "aws_availability_zones" "available" {}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "public" {
  count                   = local.public_subnet_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Tier = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = local.private_subnet_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Tier = "Private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  count  = var.enable_nat ? local.public_subnet_count : 0
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat ? local.public_subnet_count : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = local.private_subnet_count
  vpc_id = aws_vpc.main.id
  
  dynamic "route" {
    for_each = var.enable_nat ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index % local.public_subnet_count].id
    }
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count          = local.public_subnet_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = local.private_subnet_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-aurora-sg"
  description = "Security group for Aurora database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    self            = true
    security_groups = []
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc-endpoints-sg"
  })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ssm-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-logs-endpoint"
  })
}

# KMS Keys
resource "aws_kms_key" "data" {
  description             = "KMS key for fintech test data encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "Enable IAM User Permissions",
        Effect    = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-data-key"
  })
}

resource "aws_kms_alias" "data" {
  name          = local.kms_aliases.data
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_kms_key" "logs" {
  description             = "KMS key for fintech test logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-logs-key"
  })
}

resource "aws_kms_alias" "logs" {
  name          = local.kms_aliases.logs
  target_key_id = aws_kms_key.logs.key_id
}

resource "aws_kms_key" "ssm" {
  description             = "KMS key for fintech test SSM encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ssm-key"
  })
}

resource "aws_kms_alias" "ssm" {
  name          = local.kms_aliases.ssm
  target_key_id = aws_kms_key.ssm.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for fintech test S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-s3-key"
  })
}

resource "aws_kms_alias" "s3" {
  name          = local.kms_aliases.s3
  target_key_id = aws_kms_key.s3.key_id
}

# Service-specific KMS keys
resource "aws_kms_key" "service" {
  for_each                = toset(var.service_names)
  description             = "KMS key for ${each.value} service in test environment"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.tags, {
    Name    = "${local.name_prefix}-${each.value}-key"
    Service = each.value
  })
}

resource "aws_kms_alias" "service" {
  for_each      = local.service_kms_aliases
  name          = each.value
  target_key_id = aws_kms_key.service[each.key].key_id
}

# S3 Buckets
resource "aws_s3_bucket" "artifact" {
  bucket = var.artifact_bucket_name
  
  tags = merge(var.tags, {
    Name = var.artifact_bucket_name
  })
}

resource "aws_s3_bucket_versioning" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.artifact.arn,
          "${aws_s3_bucket.artifact.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "data" {
  bucket = var.data_bucket_name
  
  tags = merge(var.tags, {
    Name = var.data_bucket_name
  })
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "staging" {
  bucket = var.staging_bucket_name
  
  tags = merge(var.tags, {
    Name = var.staging_bucket_name
  })
}

resource "aws_s3_bucket_versioning" "staging" {
  bucket = aws_s3_bucket.staging.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "staging" {
  bucket = aws_s3_bucket.staging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "staging" {
  bucket = aws_s3_bucket.staging.id

  rule {
    id     = "cleanup-temp-data"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

resource "aws_s3_bucket_policy" "staging" {
  bucket = aws_s3_bucket.staging.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.staging.arn,
          "${aws_s3_bucket.staging.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Create folder structure in S3 buckets to mirror production
resource "aws_s3_object" "data_folders" {
  for_each = toset(var.service_names)
  bucket   = aws_s3_bucket.data.id
  key      = "${each.value}/"
  content_type = "application/x-directory"
}

resource "aws_s3_object" "staging_folders" {
  for_each = toset(var.service_names)
  bucket   = aws_s3_bucket.staging.id
  key      = "${each.value}/"
  content_type = "application/x-directory"
}

# DynamoDB Tables
resource "aws_dynamodb_table" "main" {
  for_each     = var.ddb_tables
  name         = "${local.name_prefix}-${each.value.name}"
  billing_mode = each.value.billing_mode
  hash_key     = each.value.hash_key
  range_key    = each.value.range_key

  dynamic "attribute" {
    for_each = local.ddb_attributes[each.key]
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.data.arn
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-${each.value.name}"
  })
}

# Sample DynamoDB data
resource "aws_dynamodb_table_item" "sample" {
  for_each   = var.ddb_tables
  table_name = aws_dynamodb_table.main[each.key].name
  hash_key   = each.value.hash_key
  range_key  = each.value.range_key

  item = jsonencode({
    "${each.value.hash_key}" = { S = "sample-${each.key}-id" },
    "${each.value.range_key != null ? each.value.range_key : "dummy"}" = {
      S = each.value.range_key != null ? formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timestamp()) : "dummy"
    },
    "data" = { S = "This is sample data for the ${each.key} table" },
    "created_at" = { S = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timestamp()) }
  })
}

# Aurora Database
resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-pg"
  family      = startswith(var.aurora_engine, "aurora-postgresql") ? "aurora-postgresql13" : "aurora-mysql5.7"
  description = "Parameter group for fintech test Aurora cluster"
  
  parameter {
    name  = startswith(var.aurora_engine, "aurora-postgresql") ? "log_statement" : "general_log"
    value = startswith(var.aurora_engine, "aurora-postgresql") ? "ddl" : "1"
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora-pg"
  })
}

resource "aws_db_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-instance-pg"
  family      = startswith(var.aurora_engine, "aurora-postgresql") ? "aurora-postgresql13" : "aurora-mysql5.7"
  description = "Parameter group for fintech test Aurora instances"
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora-instance-pg"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora"
  engine                          = var.aurora_engine
  engine_mode                     = "provisioned"
  database_name                   = var.aurora_db_name
  master_username                 = var.aurora_username
  master_password                 = var.aurora_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  backup_retention_period         = 7
  preferred_backup_window         = "02:00-03:00"
  preferred_maintenance_window    = "sun:03:00-sun:04:00"
  skip_final_snapshot             = true
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.data.arn
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count                   = 2
  identifier              = "${local.name_prefix}-aurora-${count.index}"
  cluster_identifier      = aws_rds_cluster.aurora.id
  engine                  = aws_rds_cluster.aurora.engine
  instance_class          = var.aurora_instance_class
  db_parameter_group_name = aws_db_parameter_group.aurora.name
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-aurora-${count.index}"
  })
}

# IAM Roles and Policies
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda" {
  for_each = local.lambda_functions
  name     = "${each.value.name}-role"
  
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
  
  tags = merge(var.tags, {
    Name = "${each.value.name}-role"
  })
}

resource "aws_iam_policy" "lambda_basic" {
  for_each    = local.lambda_functions
  name        = "${each.value.name}-basic-policy"
  description = "Basic execution policy for ${each.value.name} Lambda function"
  policy      = local.lambda_basic_execution_policy
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each   = local.lambda_functions
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_basic[each.key].arn
}

resource "aws_iam_policy" "masking_handler" {
  name        = "${local.name_prefix}-masking-handler-policy"
  description = "Policy for masking handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*",
          aws_s3_bucket.staging.arn,
          "${aws_s3_bucket.staging.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.data.arn,
          aws_kms_key.s3.arn
        ]
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "masking_handler" {
  role       = aws_iam_role.lambda["masking_handler"].name
  policy_arn = aws_iam_policy.masking_handler.arn
}

resource "aws_iam_policy" "dynamodb_refresh_handler" {
  name        = "${local.name_prefix}-dynamodb-refresh-handler-policy"
  description = "Policy for DynamoDB refresh handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeExport",
          "dynamodb:ExportTableToPointInTime"
        ]
        Effect = "Allow"
        Resource = concat(
          [for table in aws_dynamodb_table.main : table.arn],
          ["arn:aws:dynamodb:${var.aws_region}:${var.prod_account_id}:table/*"]
        )
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.staging.arn,
          "${aws_s3_bucket.staging.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.data.arn,
          aws_kms_key.s3.arn
        ]
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dynamodb_refresh_handler" {
  role       = aws_iam_role.lambda["dynamodb_refresh_handler"].name
  policy_arn = aws_iam_policy.dynamodb_refresh_handler.arn
}

resource "aws_iam_policy" "aurora_refresh_handler" {
  name        = "${local.name_prefix}-aurora-refresh-handler-policy"
  description = "Policy for Aurora refresh handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBClusterSnapshots",
          "rds:CopyDBClusterSnapshot",
          "rds:RestoreDBClusterFromSnapshot",
          "rds:ModifyDBCluster"
        ]
        Effect = "Allow"
        Resource = [
          aws_rds_cluster.aurora.arn,
          "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster-snapshot:*",
          "arn:aws:rds:${var.aws_region}:${var.prod_account_id}:cluster-snapshot:*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.data.arn
        ]
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:StartAutomationExecution",
          "ssm:GetAutomationExecution"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*",
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:automation-definition/*"
        ]
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "aurora_refresh_handler" {
  role       = aws_iam_role.lambda["aurora_refresh_handler"].name
  policy_arn = aws_iam_policy.aurora_refresh_handler.arn
}

resource "aws_iam_policy" "s3_sync_handler" {
  name        = "${local.name_prefix}-s3-sync-handler-policy"
  description = "Policy for S3 sync handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*",
          aws_s3_bucket.staging.arn,
          "${aws_s3_bucket.staging.arn}/*",
          "arn:aws:s3:::${var.prod_account_id}-prod-data",
          "arn:aws:s3:::${var.prod_account_id}-prod-data/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.s3.arn
        ]
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_sync_handler" {
  role       = aws_iam_role.lambda["s3_sync_handler"].name
  policy_arn = aws_iam_policy.s3_sync_handler.arn
}

resource "aws_iam_policy" "integration_tests_handler" {
  name        = "${local.name_prefix}-integration-tests-handler-policy"
  description = "Policy for integration tests handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect = "Allow"
        Resource = [for table in aws_dynamodb_table.main : table.arn]
      },
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
      },
      {
        Action = [
          "rds:DescribeDBClusters"
        ]
        Effect = "Allow"
        Resource = aws_rds_cluster.aurora.arn
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.data.arn,
          aws_kms_key.s3.arn
        ]
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "integration_tests_handler" {
  role       = aws_iam_role.lambda["integration_tests_handler"].name
  policy_arn = aws_iam_policy.integration_tests_handler.arn
}

resource "aws_iam_policy" "parity_validation_handler" {
  name        = "${local.name_prefix}-parity-validation-handler-policy"
  description = "Policy for parity validation handler Lambda function"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:ListTables",
          "dynamodb:DescribeTable"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "s3:PutObject"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.data.arn}/reports/*"
        ]
      },
      {
        Action = [
          "lambda:ListFunctions"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "kms:ListAliases"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "parity_validation_handler" {
  role       = aws_iam_role.lambda["parity_validation_handler"].name
  policy_arn = aws_iam_policy.parity_validation_handler.arn
}

resource "aws_iam_role" "sfn" {
  name = "${local.name_prefix}-sfn-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-sfn-role"
  })
}

resource "aws_iam_policy" "sfn" {
  name        = "${local.name_prefix}-sfn-policy"
  description = "Policy for Step Functions state machine"
  policy      = local.step_function_service_role_policy
}

resource "aws_iam_role_policy_attachment" "sfn" {
  role       = aws_iam_role.sfn.name
  policy_arn = aws_iam_policy.sfn.arn
}

resource "aws_iam_role" "ssm_automation" {
  name = "${local.name_prefix}-ssm-automation-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ssm-automation-role"
  })
}

resource "aws_iam_policy" "ssm_automation" {
  name        = "${local.name_prefix}-ssm-automation-policy"
  description = "Policy for SSM Automation document"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ModifyDBCluster"
        ]
        Effect = "Allow"
        Resource = aws_rds_cluster.aurora.arn
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = aws_kms_key.data.arn
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/fintech-test/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_automation" {
  role       = aws_iam_role.ssm_automation.name
  policy_arn = aws_iam_policy.ssm_automation.arn
}

# Cross-account role for reading from production
resource "aws_iam_role" "prod_read" {
  name = "${local.name_prefix}-prod-read-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.prod_account_id}:root"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-prod-read-role"
  })
}

resource "aws_iam_policy" "prod_read" {
  name        = "${local.name_prefix}-prod-read-policy"
  description = "Policy for reading from production resources"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeExport",
          "dynamodb:ExportTableToPointInTime"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.prod_account_id}:table/*"
        ]
      },
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::${var.prod_account_id}-prod-*",
          "arn:aws:s3:::${var.prod_account_id}-prod-*/*"
        ]
      },
      {
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBClusterSnapshots",
          "rds:CopyDBClusterSnapshot"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:rds:${var.aws_region}:${var.prod_account_id}:cluster:*",
          "arn:aws:rds:${var.aws_region}:${var.prod_account_id}:cluster-snapshot:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "prod_read" {
  role       = aws_iam_role.prod_read.name
  policy_arn = aws_iam_policy.prod_read.arn
}

# Lambda Functions
data "archive_file" "masking_handler" {
  type        = "zip"
  output_path = "${path.module}/masking_handler.zip"
  
  source {
    content = <<EOF
import json
import boto3
import os
import re
import hashlib
import time
import uuid

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

def get_masking_rules():
    rules_param = ssm.get_parameter(
        Name='/fintech-test/masking/rules',
        WithDecryption=True
    )
    return json.loads(rules_param['Parameter']['Value'])

def mask_data(data, rules):
    masked_data = data.copy()
    
    for field_pattern, replacement_template in rules.items():
        for field in masked_data:
            if re.match(field_pattern, field) and field in masked_data:
                original_value = str(masked_data[field])
                
                # Generate hash to use for consistent masking
                hash_value = hashlib.md5(original_value.encode()).hexdigest()
                
                # Apply different masking techniques based on the template
                if '{{hash}}' in replacement_template:
                    masked_data[field] = replacement_template.replace('{{hash}}', hash_value)
                elif '{{hash:' in replacement_template:
                    # Extract the number of characters to use
                    match = re.search(r'{{hash:(\d+)}}', replacement_template)
                    if match:
                        num_chars = int(match.group(1))
                        masked_data[field] = replacement_template.replace(
                            f'{{{{hash:{num_chars}}}}}', 
                            hash_value[:num_chars]
                        )
                elif '{{last:' in replacement_template:
                    # Keep the last N characters
                    match = re.search(r'{{last:(\d+)}}', replacement_template)
                    if match:
                        num_chars = int(match.group(1))
                        last_chars = original_value[-num_chars:] if len(original_value) >= num_chars else original_value
                        masked_data[field] = replacement_template.replace(
                            f'{{{{last:{num_chars}}}}}', 
                            last_chars
                        )
                else:
                    # Simple replacement
                    masked_data[field] = replacement_template
    
    return masked_data

def put_metrics(masked_count, error_count):
    cloudwatch.put_metric_data(
        Namespace='FintechTest/DataMasking',
        MetricData=[
            {
                'MetricName': 'MaskedRecords',
                'Value': masked_count,
                'Unit': 'Count'
            },
            {
                'MetricName': 'Errors',
                'Value': error_count,
                'Unit': 'Count'
            }
        ]
    )

def lambda_handler(event, context):
    source_bucket = event['sourceBucket']
    source_key = event['sourceKey']
    target_bucket = event['targetBucket']
    target_key = event.get('targetKey', source_key)
    
    # Get masking rules
    masking_rules = get_masking_rules()
    
    # Get the object from S3
    response = s3.get_object(
        Bucket=source_bucket,
        Key=source_key
    )
    
    content = response['Body'].read().decode('utf-8')
    
    try:
        # Parse the content as JSON
        data = json.loads(content)
        masked_count = 0
        error_count = 0
        
        if isinstance(data, list):
            # Process a list of records
            masked_data = []
            for item in data:
                try:
                    masked_item = mask_data(item, masking_rules)
                    masked_data.append(masked_item)
                    masked_count += 1
                except Exception as e:
                    print(f"Error masking item: {e}")
                    error_count += 1
                    # Include the original item if masking fails
                    masked_data.append(item)
        else:
            # Process a single record
            masked_data = mask_data(data, masking_rules)
            masked_count = 1
        
        # Write the masked data back to S3
        s3.put_object(
            Bucket=target_bucket,
            Key=target_key,
            Body=json.dumps(masked_data),
            ContentType='application/json'
        )
        
        # Report metrics
        put_metrics(masked_count, error_count)
        
        return {
            'statusCode': 200,
            'maskedRecords': masked_count,
            'errors': error_count
        }
    
    except Exception as e:
        print(f"Error processing file {source_key}: {e}")
        put_metrics(0, 1)
        raise e
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "masking_handler" {
  function_name    = local.lambda_functions["masking_handler"].name
  description      = local.lambda_functions["masking_handler"].description
  role             = aws_iam_role.lambda["masking_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.9"
  filename         = data.archive_file.masking_handler.output_path
  source_code_hash = data.archive_file.masking_handler.output_base64sha256
  memory_size      = local.lambda_functions["masking_handler"].memory
  timeout          = local.lambda_functions["masking_handler"].timeout
  
  environment {
    variables = {
      STAGE = "test"
    }
  }
  
  tags = merge(var.tags, {
    Name = local.lambda_functions["masking_handler"].name
  })
}

data "archive_file" "dynamodb_refresh_handler" {
  type        = "zip"
  output_path = "${path.module}/dynamodb_refresh_handler.zip"
  
  source {
    content = <<EOF
import json
import boto3
import os
import time
import uuid

dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    table_name = event['tableName']
    prod_table_name = event.get('prodTableName', table_name.replace('-test-', '-prod-'))
    staging_bucket = event['stagingBucket']
    export_prefix = f"exports/{table_name}/{time.strftime('%Y-%m-%d')}/"
    
    # Start export from production to S3
    export_time = int(time.time())
    export_response = dynamodb.export_table_to_point_in_time(
        TableArn=f"arn:aws:dynamodb:{os.environ['AWS_REGION']}:{os.environ.get('PROD_ACCOUNT_ID', os.environ['AWS_ACCOUNT_ID'])}:table/{prod_table_name}",
        S3Bucket=staging_bucket,
        S3Prefix=export_prefix,
        ExportFormat='DYNAMODB_JSON',
        ExportTime=export_time
    )
    
    export_arn = export_response['ExportDescription']['ExportArn']
    
    # Wait for export to complete
    export_status = 'IN_PROGRESS'
    while export_status == 'IN_PROGRESS':
        time.sleep(30)
        describe_response = dynamodb.describe_export(
            ExportArn=export_arn
        )
        export_status = describe_response['ExportDescription']['ExportStatus']
        
        if export_status == 'FAILED':
            raise Exception(f"DynamoDB export failed: {describe_response['ExportDescription'].get('FailureMessage', 'Unknown error')}")
    
    # Once export is complete, trigger the masking Lambda for each exported file
    export_manifest = s3.get_object(
        Bucket=staging_bucket,
        Key=f"{export_prefix}manifest-files.json"
    )
    
    manifest_content = json.loads(export_manifest['Body'].read().decode('utf-8'))
    
    # Process each data file through the masking Lambda
    masked_files = []
    for data_file in manifest_content.get('files', []):
        # File path in the manifest
        file_path = data_file.get('dataFileS3Key')
        
        # Call the masking Lambda to process this file
        lambda_client = boto3.client('lambda')
        masking_response = lambda_client.invoke(
            FunctionName=os.environ['MASKING_FUNCTION_NAME'],
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'sourceBucket': staging_bucket,
                'sourceKey': file_path,
                'targetBucket': staging_bucket,
                'targetKey': file_path.replace(export_prefix, f"{export_prefix}masked/")
            })
        )
        
        # Add the masked file to our list
        masked_files.append(file_path.replace(export_prefix, f"{export_prefix}masked/"))
    
    # Now import the masked data back into the test table
    # First, clear the test table
    try:
        scan_response = dynamodb.scan(
            TableName=table_name,
            Select='ALL_ATTRIBUTES'
        )
        
        for item in scan_response.get('Items', []):
            key = {}
            # Extract the table's key schema
            describe_response = dynamodb.describe_table(TableName=table_name)
            key_schema = describe_response['Table']['KeySchema']
            
            for key_element in key_schema:
                key_name = key_element['AttributeName']
                key[key_name] = item[key_name]
            
            dynamodb.delete_item(
                TableName=table_name,
                Key=key
            )
    except Exception as e:
        print(f"Error clearing table: {e}")
    
    # Import each masked file to the test table
    for masked_file in masked_files:
        s3_object = s3.get_object(
            Bucket=staging_bucket,
            Key=masked_file
        )
        
        content = json.loads(s3_object['Body'].read().decode('utf-8'))
        
        # Batch write to DynamoDB
        if isinstance(content, list):
            # Process in batches of 25 (DynamoDB batch write limit)
            batch_size = 25
            for i in range(0, len(content), batch_size):
                batch = content[i:i+batch_size]
                request_items = {
                    table_name: [
                        {'PutRequest': {'Item': item}} for item in batch
                    ]
                }
                
                dynamodb.batch_write_item(
                    RequestItems=request_items
                )
    
    # Report metrics
    cloudwatch.put_metric_data(
        Namespace='FintechTest/DynamoDBRefresh',
        MetricData=[
            {
                'MetricName': 'TableRefreshSuccess',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'TableName',
                        'Value': table_name
                    }
                ]
            },
            {
                'MetricName': 'RecordsImported',
                'Value': len(masked_files) * 100,  # Approximate count
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'TableName',
                        'Value': table_name
                    }
                ]
            }
        ]
    )
    
    return {
        'statusCode': 200,
        'body': {
            'tableName': table_name,
            'exportArn': export_arn,
            'fileCount': len(masked_files)
        }
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "dynamodb_refresh_handler" {
  function_name    = local.lambda_functions["dynamodb_refresh_handler"].name
  description      = local.lambda_functions["dynamodb_refresh_handler"].description
  role             = aws_iam_role.lambda["dynamodb_refresh_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.9"
  filename         = data.archive_file.dynamodb_refresh_handler.output_path
  source_code_hash = data.archive_file.dynamodb_refresh_handler.output_base64sha256
  memory_size      = local.lambda_functions["dynamodb_refresh_handler"].memory
  timeout          = local.lambda_functions["dynamodb_refresh_handler"].timeout
  
  environment {
    variables = {
      STAGE                 = "test"
      MASKING_FUNCTION_NAME = aws_lambda_function.masking_handler.function_name
      PROD_ACCOUNT_ID       = var.prod_account_id
    }
  }
  
  tags = merge(var.tags, {
    Name = local.lambda_functions["dynamodb_refresh_handler"].name
  })
}

data "archive_file" "aurora_refresh_handler" {
  type        = "zip"
  output_path = "${path.module}/aurora_refresh_handler.zip"
  
  source {
    content = <<EOF
import json
import boto3
import os
import time
import uuid

rds = boto3.client('rds')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    cluster_id = event['clusterId']
    prod_snapshot_id = event.get('prodSnapshotId', '')
    
    # If no prod snapshot ID provided, find the latest production snapshot
    if not prod_snapshot_id:
        prod_cluster_id = cluster_id.replace('-test-', '-prod-')
        snapshots = rds.describe_db_cluster_snapshots(
            SnapshotType='automated',
            IncludeShared=True,
            IncludePublic=False,
            Filters=[
                {
                    'Name': 'db-cluster-id',
                    'Values': [prod_cluster_id]
                }
            ]
        )
        
        # Sort snapshots by creation time
        if snapshots['DBClusterSnapshots']:
            sorted_snapshots = sorted(
                snapshots['DBClusterSnapshots'],
                key=lambda x: x['SnapshotCreateTime'],
                reverse=True
            )
            prod_snapshot_id = sorted_snapshots[0]['DBClusterSnapshotIdentifier']
        else:
            raise Exception(f"No snapshots found for production cluster {prod_cluster_id}")
    
    # Generate a new snapshot ID for the test environment
    test_snapshot_id = f"{cluster_id}-snapshot-{int(time.time())}"
    
    # Copy the production snapshot
    try:
        copy_response = rds.copy_db_cluster_snapshot(
            SourceDBClusterSnapshotIdentifier=prod_snapshot_id,
            TargetDBClusterSnapshotIdentifier=test_snapshot_id,
            KmsKeyId=os.environ['KMS_KEY_ID'],
            CopyTags=True
        )
        
        # Wait for the snapshot copy to complete
        snapshot_status = 'creating'
        while snapshot_status == 'creating':
            time.sleep(30)
            describe_response = rds.describe_db_cluster_snapshots(
                DBClusterSnapshotIdentifier=test_snapshot_id
            )
            snapshot_status = describe_response['DBClusterSnapshots'][0]['Status']
            
            if snapshot_status == 'failed':
                raise Exception(f"Failed to copy snapshot {prod_snapshot_id}")
    except Exception as e:
        print(f"Error copying snapshot: {e}")
        raise e
    
    # Start the SSM Automation to restore from snapshot and apply masking
    try:
        ssm_client = boto3.client('ssm')
        automation_response = ssm_client.start_automation_execution(
            DocumentName=os.environ['SSM_DOCUMENT_NAME'],
            Parameters={
                'ClusterId': [cluster_id],
                'SnapshotId': [test_snapshot_id],
                'MaskingRulesParameter': ['/fintech-test/masking/rules']
            }
        )
        
        # Wait for the automation to complete
        execution_id = automation_response['AutomationExecutionId']
        execution_status = 'InProgress'
        
        while execution_status == 'InProgress':
            time.sleep(60)
            execution = ssm_client.get_automation_execution(
                AutomationExecutionId=execution_id
            )
            execution_status = execution['AutomationExecution']['AutomationExecutionStatus']
            
            if execution_status == 'Failed' or execution_status == 'TimedOut':
                raise Exception(f"SSM Automation failed with status {execution_status}")
    except Exception as e:
        print(f"Error running SSM automation: {e}")
        raise e
    
    # Report metrics
    cloudwatch.put_metric_data(
        Namespace='FintechTest/AuroraRefresh',
        MetricData=[
            {
                'MetricName': 'RefreshSuccess',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'ClusterId',
                        'Value': cluster_id
                    }
                ]
            }
        ]
    )
    
    return {
        'statusCode': 200,
        'body': {
            'clusterId': cluster
### Answer 
---

