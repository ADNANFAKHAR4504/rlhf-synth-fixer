# IDEAL_RESPONSE - Production-Ready Terraform Infrastructure

This response provides an optimized, production-ready Terraform configuration with enhanced security, better error handling, cost optimization, and adherence to AWS Well-Architected Framework principles.

## Improvements Over MODEL_RESPONSE

1. **Enhanced Security**: Added AWS PrivateLink endpoints, improved security group rules, KMS key policies
2. **Cost Optimization**: Removed NAT Gateways where not needed, optimized RDS configuration
3. **Better Error Handling**: Added validation, error recovery patterns
4. **High Availability**: Improved multi-AZ configuration
5. **Operational Excellence**: Added comprehensive tagging, better monitoring
6. **Terraform Best Practices**: Data sources, conditional logic, dynamic blocks

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{5,10}$", var.environment_suffix))
    error_message = "Environment suffix must be 5-10 lowercase alphanumeric characters."
  }
}

variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.region))
    error_message = "Region must be a valid AWS region format."
  }
}

variable "project_name" {
  description = "Project name for tagging and resource identification"
  type        = string
  default     = "payment-processing"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,50}$", var.project_name))
    error_message = "Project name must be 3-50 characters, lowercase alphanumeric and hyphens only."
  }
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "fintech-team"
}

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

variable "enable_cross_region_replication" {
  description = "Enable S3 cross-region replication for production"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "Region for S3 cross-region replication"
  type        = string
  default     = "us-west-2"
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateways for private subnets (can be disabled for cost savings in dev)"
  type        = bool
  default     = true
}

variable "db_backup_retention_days" {
  description = "Number of days to retain RDS backups"
  type        = number
  default     = null # Will use environment-specific defaults
}

variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "CloudWatch log retention must be a valid value."
  }
}
```

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
      CostCenter  = "${var.project_name}-${var.environment}"
    }
  }
}

# Secondary provider for replication region
provider "aws" {
  alias  = "replication"
  region = var.replication_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
      CostCenter  = "${var.project_name}-${var.environment}"
    }
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  vpc_cidr = var.environment == "dev" ? "10.0.0.0/16" : "172.16.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)

  api_throttle_rate_limit  = var.environment == "dev" ? 100 : 1000
  api_throttle_burst_limit = var.environment == "dev" ? 200 : 2000

  # Environment-specific RDS configuration
  db_backup_retention_days = coalesce(
    var.db_backup_retention_days,
    var.environment == "prod" ? 30 : 7
  )

  db_instance_count = var.environment == "prod" ? 2 : 1

  # Cost optimization: NAT Gateways
  nat_gateway_count = var.enable_nat_gateway ? length(local.azs) : 0

  common_tags = {
    Environment     = var.environment
    Project         = var.project_name
    Owner           = var.owner
    Terraform       = "true"
    EnvironmentType = var.environment == "prod" ? "production" : "non-production"
  }

  # Account ID for ARN construction
  account_id = data.aws_caller_identity.current.account_id
}
```

## File: lib/networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-${var.environment}-${var.environment_suffix}"
    }
  )
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-flow-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${var.environment}-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-flow-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "public"
      Tier = "public"
    }
  )
}

# Private Subnets (for Lambda and application workloads)
resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "private"
      Tier = "application"
    }
  )
}

# Database Subnets (isolated from application tier)
resource "aws_subnet" "database" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "database-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "private"
      Tier = "database"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = local.nat_gateway_count
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (conditional based on var.enable_nat_gateway)
resource "aws_nat_gateway" "main" {
  count         = local.nat_gateway_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-gateway-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "public-rt-${var.environment}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for better isolation)
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "private-rt-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

# Conditional NAT Gateway routes
resource "aws_route" "private_nat_gateway" {
  count                  = local.nat_gateway_count
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "database-rt-${var.environment}-${var.environment_suffix}"
      Type = "private"
      Tier = "database"
    }
  )
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment}-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "db-subnet-group-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Network ACLs for Database Subnets (additional security layer)
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Allow inbound from private subnets (Lambda)
  dynamic "ingress" {
    for_each = aws_subnet.private[*].cidr_block
    content {
      protocol   = "tcp"
      rule_no    = 100 + ingress.key
      action     = "allow"
      cidr_block = ingress.value
      from_port  = 5432
      to_port    = 5432
    }
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 200
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(
    local.common_tags,
    {
      Name = "database-nacl-${var.environment}-${var.environment_suffix}"
    }
  )
}
```

## File: lib/vpc_endpoints.tf

```hcl
# Security Group for Interface Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.environment}-${var.environment_suffix}-"
  description = "Security group for VPC interface endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-endpoints-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# S3 VPC Endpoint (Gateway endpoint - no cost)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    [aws_route_table.database.id]
  )

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:*"
        Resource  = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "s3-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# DynamoDB VPC Endpoint (Gateway endpoint - no cost)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "dynamodb:*"
        Resource  = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "dynamodb-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda VPC Endpoint (Interface endpoint)
resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Secrets Manager VPC Endpoint (Interface endpoint - for enhanced security)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "secretsmanager-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# CloudWatch Logs VPC Endpoint (Interface endpoint - optional for cost savings)
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "logs-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}
```

## File: lib/security.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "rds-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "s3-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment}-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster - restrictive ingress rules"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Separate security group rules for better management
resource "aws_security_group_rule" "rds_ingress_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  description              = "PostgreSQL from Lambda functions"
  security_group_id        = aws_security_group.rds.id
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.rds.id
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "lambda-${var.environment}-${var.environment_suffix}-"
  description = "Security group for Lambda functions with VPC access"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda egress to RDS
resource "aws_security_group_rule" "lambda_egress_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  description              = "PostgreSQL to RDS"
  security_group_id        = aws_security_group.lambda.id
}

# Lambda egress to VPC endpoints
resource "aws_security_group_rule" "lambda_egress_vpc_endpoints" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.vpc_endpoints.id
  description              = "HTTPS to VPC endpoints"
  security_group_id        = aws_security_group.lambda.id
}

# Lambda egress for S3 via VPC endpoint (no security group needed for gateway endpoint)
resource "aws_security_group_rule" "lambda_egress_https" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "HTTPS for AWS services"
  security_group_id = aws_security_group.lambda.id
}
```

## File: lib/rds.tf

```hcl
# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# RDS Aurora PostgreSQL Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "main" {
  name        = "aurora-pg-cluster-params-${var.environment}-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Custom cluster parameter group for ${var.environment}"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking longer than 1 second
  }

  tags = local.common_tags
}

# RDS Aurora PostgreSQL DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name        = "aurora-pg-params-${var.environment}-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Custom DB parameter group for ${var.environment}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = local.common_tags
}

# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment}-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.4"
  database_name                   = "payments"
  master_username                 = "dbadmin"
  master_password                 = random_password.db_password.result
  db_subnet_group_name            = aws_db_subnet_group.main.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = local.db_backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.rds.arn
  skip_final_snapshot             = true
  final_snapshot_identifier       = null
  apply_immediately               = var.environment == "dev" ? true : false
  deletion_protection             = var.environment == "prod" ? true : false

  serverlessv2_scaling_configuration {
    max_capacity = var.environment == "prod" ? 16.0 : 4.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name         = "aurora-cluster-${var.environment}-${var.environment_suffix}"
      BackupPolicy = "automated"
    }
  )

  lifecycle {
    ignore_changes = [master_password]
  }
}

# RDS Aurora Instances
resource "aws_rds_cluster_instance" "main" {
  count                        = local.db_instance_count
  identifier                   = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
  cluster_identifier           = aws_rds_cluster.main.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.main.engine
  engine_version               = aws_rds_cluster.main.engine_version
  db_parameter_group_name      = aws_db_parameter_group.main.name
  publicly_accessible          = false
  auto_minor_version_upgrade   = var.environment == "prod" ? false : true
  performance_insights_enabled = var.environment == "prod" ? true : false

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Store DB credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-password-${var.environment}-${var.environment_suffix}"
  description             = "RDS master credentials for ${var.environment} environment"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-password-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username            = aws_rds_cluster.main.master_username
    password            = random_password.db_password.result
    endpoint            = aws_rds_cluster.main.endpoint
    reader_endpoint     = aws_rds_cluster.main.reader_endpoint
    port                = aws_rds_cluster.main.port
    database            = aws_rds_cluster.main.database_name
    engine              = "postgres"
    connection_string   = "postgresql://${aws_rds_cluster.main.master_username}:${random_password.db_password.result}@${aws_rds_cluster.main.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
  })
}
```

## File: lib/storage.tf

```hcl
# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "transaction-logs-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name        = "transaction-logs-${var.environment}-${var.environment_suffix}"
      Purpose     = "transaction-logs"
      Compliance  = "financial-records"
    }
  )
}

resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = "transactions/"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555 # 7 years retention for financial records
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_logging" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "transaction-logs/"
}

# S3 Bucket for Customer Documents
resource "aws_s3_bucket" "customer_documents" {
  bucket = "customer-documents-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name       = "customer-documents-${var.environment}-${var.environment_suffix}"
      Purpose    = "customer-documents"
      Compliance = "pii-data"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_logging" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "customer-documents/"
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "access-logs-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name    = "access-logs-${var.environment}-${var.environment_suffix}"
      Purpose = "access-logs"
    }
  )
}

resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# Cross-Region Replication for Production Customer Documents
resource "aws_s3_bucket" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = "customer-documents-replica-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name    = "customer-documents-replica-${var.environment}-${var.environment_suffix}"
      Purpose = "disaster-recovery"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.customer_documents_replica[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.customer_documents_replica[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Replication IAM Role
resource "aws_iam_role" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-policy-${var.environment}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.customer_documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.customer_documents.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.customer_documents_replica[0].arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.s3.arn
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

resource "aws_s3_bucket_replication_configuration" "customer_documents" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0

  depends_on = [
    aws_s3_bucket_versioning.customer_documents,
    aws_s3_bucket_versioning.customer_documents_replica[0]
  ]

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {
      prefix = ""
    }

    destination {
      bucket        = aws_s3_bucket.customer_documents_replica[0].arn
      storage_class = "STANDARD_IA"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}
```

## File: lib/iam.tf

```hcl
# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution" {
  name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"
    }
  )
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda-logging-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda CloudWatch logging with explicit deny for destructive operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLogOperations"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.region}:${local.account_id}:log-group:/aws/lambda/*",
          "arn:aws:logs:${var.region}:${local.account_id}:log-group:/aws/lambda/*:log-stream:*"
        ]
      },
      {
        Sid    = "DenyDestructiveLogOperations"
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "logs:DeleteRetentionPolicy"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - VPC Access
resource "aws_iam_policy" "lambda_vpc" {
  name        = "lambda-vpc-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda VPC network interface management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCNetworkManagement"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - S3 Access
resource "aws_iam_policy" "lambda_s3" {
  name        = "lambda-s3-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda S3 access with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ObjectOperations"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.transaction_logs.arn}/*",
          "${aws_s3_bucket.customer_documents.arn}/*"
        ]
      },
      {
        Sid    = "AllowS3ListOperations"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.transaction_logs.arn,
          aws_s3_bucket.customer_documents.arn
        ]
      },
      {
        Sid    = "DenyDestructiveS3Operations"
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy",
          "s3:DeleteBucketWebsite",
          "s3:PutBucketPolicy"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - Secrets Manager Access
resource "aws_iam_policy" "lambda_secrets" {
  name        = "lambda-secrets-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda Secrets Manager read-only access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecretsRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      },
      {
        Sid    = "DenySecretsModification"
        Effect = "Deny"
        Action = [
          "secretsmanager:DeleteSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecret"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - KMS Access
resource "aws_iam_policy" "lambda_kms" {
  name        = "lambda-kms-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda KMS decryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowKMSDecryption"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.rds.arn
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.region}.amazonaws.com",
              "secretsmanager.${var.region}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - SNS Publishing
resource "aws_iam_policy" "lambda_sns" {
  name        = "lambda-sns-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda SNS publishing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.transaction_alerts.arn,
          aws_sns_topic.system_errors.arn
        ]
      },
      {
        Sid    = "DenyDestructiveSNSOperations"
        Effect = "Deny"
        Action = [
          "sns:DeleteTopic",
          "sns:SetTopicAttributes",
          "sns:RemovePermission"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_vpc.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_secrets.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_sns.arn
}
```

## File: lib/lambda.tf

```hcl
# CloudWatch Log Group for Payment Validation Lambda
resource "aws_cloudwatch_log_group" "payment_validation" {
  name              = "/aws/lambda/payment-validation-${var.environment}-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name     = "payment-validation-logs-${var.environment}-${var.environment_suffix}"
      Function = "payment-validation"
    }
  )
}

# Lambda Function - Payment Validation
resource "aws_lambda_function" "payment_validation" {
  filename         = "${path.module}/lambda/payment_validation.zip"
  function_name    = "payment-validation-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "payment_validation.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_validation.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  reserved_concurrent_executions = var.environment == "prod" ? 100 : 10

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DB_SECRET_ARN           = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      REGION                  = var.region
      LOG_LEVEL               = var.environment == "prod" ? "INFO" : "DEBUG"
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.system_errors.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.payment_validation,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name     = "payment-validation-${var.environment}-${var.environment_suffix}"
      Function = "payment-validation"
    }
  )
}

# CloudWatch Log Group for Transaction Processing Lambda
resource "aws_cloudwatch_log_group" "transaction_processing" {
  name              = "/aws/lambda/transaction-processing-${var.environment}-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name     = "transaction-processing-logs-${var.environment}-${var.environment_suffix}"
      Function = "transaction-processing"
    }
  )
}

# Lambda Function - Transaction Processing
resource "aws_lambda_function" "transaction_processing" {
  filename         = "${path.module}/lambda/transaction_processing.zip"
  function_name    = "transaction-processing-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "transaction_processing.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/transaction_processing.zip")
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 1024

  reserved_concurrent_executions = var.environment == "prod" ? 100 : 10

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DB_SECRET_ARN           = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      CUSTOMER_DOCS_BUCKET    = aws_s3_bucket.customer_documents.id
      SNS_TOPIC_ARN           = aws_sns_topic.transaction_alerts.arn
      REGION                  = var.region
      LOG_LEVEL               = var.environment == "prod" ? "INFO" : "DEBUG"
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.system_errors.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.transaction_processing,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name     = "transaction-processing-${var.environment}-${var.environment_suffix}"
      Function = "transaction-processing"
    }
  )
}

# Lambda Permission for API Gateway - Payment Validation
resource "aws_lambda_permission" "payment_validation_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Lambda Permission for API Gateway - Transaction Processing
resource "aws_lambda_permission" "transaction_processing_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processing.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# CloudWatch Alarms for Lambda Functions
resource "aws_cloudwatch_metric_alarm" "payment_validation_errors" {
  alarm_name          = "lambda-payment-validation-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when payment validation Lambda errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_validation.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "transaction_processing_errors" {
  alarm_name          = "lambda-transaction-processing-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when transaction processing Lambda errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_processing.function_name
  }

  tags = local.common_tags
}
```

## File: lib/api_gateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "payment-api-${var.environment}-${var.environment_suffix}"
  description = "Payment Processing API for ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "request-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway Resource - /validate
resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "validate"
}

# API Gateway Method - POST /validate
resource "aws_api_gateway_method" "validate_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.validate.id
  http_method   = "POST"
  authorization = "AWS_IAM" # Changed from NONE for better security

  request_validator_id = aws_api_gateway_request_validator.main.id

  request_models = {
    "application/json" = aws_api_gateway_model.payment_validation.name
  }
}

# API Gateway Model for Payment Validation
resource "aws_api_gateway_model" "payment_validation" {
  rest_api_id  = aws_api_gateway_rest_api.main.id
  name         = "PaymentValidationModel"
  description  = "Schema for payment validation requests"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    title     = "PaymentValidationRequest"
    type      = "object"
    required  = ["amount", "currency", "payment_method", "customer_id"]
    properties = {
      amount = {
        type    = "number"
        minimum = 0.01
      }
      currency = {
        type      = "string"
        pattern   = "^[A-Z]{3}$"
        minLength = 3
        maxLength = 3
      }
      payment_method = {
        type = "string"
        enum = ["credit_card", "debit_card", "bank_transfer", "digital_wallet"]
      }
      customer_id = {
        type      = "string"
        minLength = 1
      }
    }
  })
}

# API Gateway Integration - Payment Validation Lambda
resource "aws_api_gateway_integration" "validate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.validate.id
  http_method             = aws_api_gateway_method.validate_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validation.invoke_arn
}

# API Gateway Resource - /process
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

# API Gateway Method - POST /process
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "AWS_IAM" # Changed from NONE for better security

  request_validator_id = aws_api_gateway_request_validator.main.id

  request_models = {
    "application/json" = aws_api_gateway_model.transaction_processing.name
  }
}

# API Gateway Model for Transaction Processing
resource "aws_api_gateway_model" "transaction_processing" {
  rest_api_id  = aws_api_gateway_rest_api.main.id
  name         = "TransactionProcessingModel"
  description  = "Schema for transaction processing requests"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    title     = "TransactionProcessingRequest"
    type      = "object"
    required  = ["amount", "currency", "payment_method", "customer_id"]
    properties = {
      amount = {
        type    = "number"
        minimum = 0.01
      }
      currency = {
        type      = "string"
        pattern   = "^[A-Z]{3}$"
        minLength = 3
        maxLength = 3
      }
      payment_method = {
        type = "string"
        enum = ["credit_card", "debit_card", "bank_transfer", "digital_wallet"]
      }
      customer_id = {
        type      = "string"
        minLength = 1
      }
    }
  })
}

# API Gateway Integration - Transaction Processing Lambda
resource "aws_api_gateway_integration" "process_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.process.id
  http_method             = aws_api_gateway_method.process_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_processing.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.validate.id,
      aws_api_gateway_method.validate_post.id,
      aws_api_gateway_integration.validate_lambda.id,
      aws_api_gateway_resource.process.id,
      aws_api_gateway_method.process_post.id,
      aws_api_gateway_integration.process_lambda.id,
      aws_api_gateway_model.payment_validation.id,
      aws_api_gateway_model.transaction_processing.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.validate_lambda,
    aws_api_gateway_integration.process_lambda
  ]
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/payment-api-${var.environment}-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      caller          = "$context.identity.caller"
      user            = "$context.identity.user"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      resourcePath    = "$context.resourcePath"
      status          = "$context.status"
      protocol        = "$context.protocol"
      responseLength  = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  xray_tracing_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-stage-${var.environment}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_cloudwatch_log_group.api_gateway]
}

# API Gateway Method Settings for Throttling
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = var.environment == "dev" ? true : false
    throttling_rate_limit  = local.api_throttle_rate_limit
    throttling_burst_limit = local.api_throttle_burst_limit
    caching_enabled        = var.environment == "prod" ? true : false
    cache_ttl_in_seconds   = 300
    cache_data_encrypted   = true
  }
}

# API Gateway Account (for CloudWatch Logs)
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

## File: lib/waf.tf

```hcl
# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api_gateway" {
  name  = "api-gateway-waf-${var.environment}-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting per IP
  rule {
    name     = "rate-limiting-per-ip"
    priority = 1

    action {
      block {
        custom_response {
          response_code = 429
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.environment == "prod" ? 2000 : 500
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRulePerIP"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - Common Rule Set
  rule {
    name     = "aws-managed-common-rule-set"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        # Exclude rules that might cause false positives
        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedKnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: SQL Injection Protection
  rule {
    name     = "sql-injection-protection"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: Geo-blocking (optional - example for non-US traffic in prod)
  dynamic "rule" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      name     = "geo-blocking"
      priority = 5

      action {
        block {
          custom_response {
            response_code = 403
          }
        }
      }

      statement {
        not_statement {
          statement {
            geo_match_statement {
              country_codes = ["US", "CA"] # Allow US and Canada only
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlocking"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIGatewayWAF"
    sampled_requests_enabled   = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-waf-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Associate WAF Web ACL with API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.environment}-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name = "waf-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "api_gateway" {
  resource_arn            = aws_wafv2_web_acl.api_gateway.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# CloudWatch Metric Filter for WAF Blocked Requests
resource "aws_cloudwatch_log_metric_filter" "waf_blocked_requests" {
  name           = "waf-blocked-requests-${var.environment}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.waf.name
  pattern        = "[... action=BLOCK ...]"

  metric_transformation {
    name      = "WAFBlockedRequests"
    namespace = "CustomMetrics/WAF"
    value     = "1"
    unit      = "Count"
  }
}

# CloudWatch Alarm for High WAF Block Rate
resource "aws_cloudwatch_metric_alarm" "waf_high_block_rate" {
  alarm_name          = "waf-high-block-rate-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "WAFBlockedRequests"
  namespace           = "CustomMetrics/WAF"
  period              = 300
  statistic           = "Sum"
  threshold           = var.environment == "prod" ? 100 : 50
  alarm_description   = "Alert when WAF blocks exceed threshold - possible attack"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}
```

## File: lib/monitoring.tf

```hcl
# SNS Topic for Transaction Alerts
resource "aws_sns_topic" "transaction_alerts" {
  name              = "transaction-alerts-${var.environment}-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-alerts-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription for Transaction Alerts
resource "aws_sns_topic_subscription" "transaction_alerts_email" {
  topic_arn = aws_sns_topic.transaction_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic for System Errors
resource "aws_sns_topic" "system_errors" {
  name              = "system-errors-${var.environment}-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.s3.arn

  tags = merge(
    local.common_tags,
    {
      Name = "system-errors-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription for System Errors
resource "aws_sns_topic_subscription" "system_errors_email" {
  topic_arn = aws_sns_topic.system_errors.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "payment-processing-${var.environment}-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p99", label = "p99 Latency" }],
            ["...", { stat = "p95", label = "p95 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Latency (ms)"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Total Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Request Count and Errors"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", { stat = "Sum", label = "Throttles" }],
            [".", "ConcurrentExecutions", { stat = "Average", label = "Concurrent Executions" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Lambda Errors, Throttles and Concurrency"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "Avg Duration" }],
            ["...", { stat = "p99", label = "p99 Duration" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Lambda Duration (ms)"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "CPUUtilization", { stat = "Average", label = "CPU %" }],
            [".", "ServerlessDatabaseCapacity", { stat = "Average", label = "ACU Capacity" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", label = "Read Latency" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Latency (ms)"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", { stat = "Average", label = "Transaction Logs" }],
            ["...", { stat = "Average", label = "Customer Documents" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "S3 Bucket Size"
          period  = 86400
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["CustomMetrics/WAF", "WAFBlockedRequests", { stat = "Sum", label = "Blocked Requests" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "WAF Blocked Requests"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms

# API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "api-gateway-5xx-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway 5XX errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = local.common_tags
}

# API Gateway High Latency
resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "api-gateway-high-latency-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 2000 # 2 seconds
  alarm_description   = "Alert when API Gateway latency exceeds 2 seconds"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = local.common_tags
}

# RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "rds-cpu-utilization-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when RDS CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

# RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "rds-database-connections-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when RDS database connections exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

# RDS Serverless Capacity
resource "aws_cloudwatch_metric_alarm" "rds_capacity" {
  alarm_name          = "rds-serverless-capacity-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ServerlessDatabaseCapacity"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.environment == "prod" ? 14 : 3.5 # Alert at 87.5% of max
  alarm_description   = "Alert when RDS serverless capacity nearing maximum"
  alarm_actions       = [aws_sns_topic.system_errors.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}
```

## File: lib/outputs.tf

```hcl
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = local.azs
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways (if enabled)"
  value       = aws_nat_gateway.main[*].id
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_cluster_arn" {
  description = "ARN of the RDS cluster"
  value       = aws_rds_cluster.main.arn
}

output "rds_cluster_database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.main.database_name
}

output "rds_cluster_port" {
  description = "Port of the RDS cluster"
  value       = aws_rds_cluster.main.port
}

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

# S3 Outputs
output "transaction_logs_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.id
}

output "transaction_logs_bucket_arn" {
  description = "ARN of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.arn
}

output "customer_documents_bucket_name" {
  description = "Name of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.id
}

output "customer_documents_bucket_arn" {
  description = "ARN of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.arn
}

output "access_logs_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  value       = aws_s3_bucket.access_logs.id
}

# Lambda Outputs
output "payment_validation_lambda_arn" {
  description = "ARN of the payment validation Lambda function"
  value       = aws_lambda_function.payment_validation.arn
}

output "payment_validation_lambda_name" {
  description = "Name of the payment validation Lambda function"
  value       = aws_lambda_function.payment_validation.function_name
}

output "transaction_processing_lambda_arn" {
  description = "ARN of the transaction processing Lambda function"
  value       = aws_lambda_function.transaction_processing.arn
}

output "transaction_processing_lambda_name" {
  description = "Name of the transaction processing Lambda function"
  value       = aws_lambda_function.transaction_processing.function_name
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_endpoint" {
  description = "Invoke URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.arn
}

# SNS Outputs
output "transaction_alerts_topic_arn" {
  description = "ARN of the SNS topic for transaction alerts"
  value       = aws_sns_topic.transaction_alerts.arn
}

output "system_errors_topic_arn" {
  description = "ARN of the SNS topic for system errors"
  value       = aws_sns_topic.system_errors.arn
}

# Monitoring Outputs
output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

# WAF Outputs
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api_gateway.arn
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api_gateway.id
}

# KMS Outputs
output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
  sensitive   = true
}

output "kms_key_s3_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
  sensitive   = true
}

# Security Group Outputs
output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# VPC Endpoint Outputs
output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

# Cost Tracking Output
output "estimated_monthly_cost_notes" {
  description = "Notes on estimated monthly costs"
  value = <<-EOT
    Estimated monthly costs (approximate):
    - Aurora Serverless v2: $${var.environment == "prod" ? "50-200" : "10-30"} (depends on usage)
    - Lambda: $${var.environment == "prod" ? "10-50" : "5-10"} (depends on invocations)
    - API Gateway: $${var.environment == "prod" ? "20-100" : "5-20"} (depends on requests)
    - S3: $5-50 (depends on storage and data transfer)
    - NAT Gateways: $${var.enable_nat_gateway ? "100-150" : "0"} (per AZ)
    - VPC Endpoints (Interface): ~$21 per endpoint per month
    - WAF: ~$5 + $1 per million requests

    To reduce costs in dev environment:
    - Set enable_nat_gateway = false
    - Use smaller RDS capacity limits
    - Reduce log retention periods
  EOT
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this to terraform.tfvars and update with your values

# REQUIRED: Unique suffix for resource naming (5-10 lowercase alphanumeric)
environment_suffix = "abc123"

# REQUIRED: Environment (dev or prod)
environment = "dev"

# AWS Region
region = "us-east-1"

# Project identification
project_name = "payment-processing"
owner        = "fintech-team"

# REQUIRED: Email for SNS alerts (must be valid email)
alert_email = "alerts@example.com"

# Cost optimization: Disable NAT Gateways in dev to save ~$100/month
enable_nat_gateway = false

# Cross-region replication (production only)
enable_cross_region_replication = false
replication_region              = "us-west-2"

# CloudWatch log retention (days)
cloudwatch_log_retention_days = 30

# RDS backup retention (overrides environment defaults if specified)
# db_backup_retention_days = 7

# ---
# Production example configuration:
# ---
# environment_suffix              = "prod01"
# environment                     = "prod"
# alert_email                     = "prod-alerts@example.com"
# enable_nat_gateway              = true
# enable_cross_region_replication = true
# db_backup_retention_days        = 30
# cloudwatch_log_retention_days   = 90
```

## File: lib/README.md

```markdown
# Payment Processing Platform Infrastructure - Production Ready

This Terraform configuration provisions a production-ready, multi-environment AWS infrastructure for a payment processing platform following AWS Well-Architected Framework principles.

## Key Improvements Over Basic Implementation

1. **Enhanced Security**
   - VPC Flow Logs for network monitoring
   - Network ACLs for database tier
   - KMS key policies with service-specific permissions
   - Security group rules as separate resources
   - IAM policies with explicit deny statements
   - Encrypted CloudWatch logs
   - SNS topic encryption

2. **Cost Optimization**
   - Optional NAT Gateways (save ~$100/month in dev)
   - Aurora Serverless v2 with appropriate scaling
   - S3 Intelligent Tiering for customer documents
   - S3 lifecycle policies for log archival
   - Gateway VPC endpoints (no cost) for S3 and DynamoDB

3. **Operational Excellence**
   - VPC Flow Logs
   - Enhanced CloudWatch dashboard with more metrics
   - Comprehensive alarms for proactive monitoring
   - S3 access logging
   - API Gateway request/response logging
   - WAF logging with redacted sensitive fields

4. **Reliability**
   - Multi-AZ deployment
   - Aurora read replicas in production
   - Lambda reserved concurrency
   - Lambda dead letter queues
   - API Gateway caching in production
   - Deletion protection for RDS in production

5. **Performance**
   - VPC endpoints for AWS services (reduced latency)
   - API Gateway caching
   - Lambda in VPC with optimized security groups
   - Aurora Serverless v2 auto-scaling

## Architecture Overview

### Network Architecture
- **VPC**: Separate VPCs for dev (10.0.0.0/16) and prod (172.16.0.0/16)
- **Subnets**: 3-tier architecture across 3 AZs
  - Public subnets (for load balancers, NAT gateways)
  - Private subnets (for Lambda, application tier)
  - Database subnets (isolated, no internet access)
- **VPC Endpoints**: S3, DynamoDB (Gateway), Lambda, Secrets Manager, CloudWatch Logs (Interface)
- **Network ACLs**: Additional security layer for database subnets

### Compute Layer
- **Lambda Functions**: Payment validation and transaction processing
  - Run in private subnets
  - VPC endpoints for AWS service access
  - Reserved concurrency limits
  - Dead letter queues
  - X-Ray tracing enabled

### Data Layer
- **RDS Aurora PostgreSQL Serverless v2**
  - Custom parameter groups
  - Automated backups with point-in-time recovery
  - Multi-instance in production
  - Performance Insights in production
  - Customer-managed KMS encryption

- **S3 Buckets**
  - Transaction logs (7-year retention for compliance)
  - Customer documents (Intelligent Tiering)
  - Access logs
  - Cross-region replication for prod (optional)

### API Layer
- **API Gateway REST API**
  - Request validation with JSON schemas
  - IAM authorization
  - Environment-specific throttling
  - CloudWatch logging
  - X-Ray tracing
  - Caching in production

### Security Layer
- **AWS WAF**
  - Rate limiting per IP
  - AWS Managed Rules (Common, Bad Inputs, SQLi)
  - Optional geo-blocking
  - CloudWatch metrics and alarms

- **IAM**
  - Least privilege policies
  - Explicit deny for destructive operations
  - Service-specific policies

- **Encryption**
  - KMS customer-managed keys for RDS and S3
  - Encrypted CloudWatch logs
  - Encrypted SNS topics
  - TLS in transit

### Monitoring & Alerting
- **CloudWatch Dashboard**: API latency, Lambda metrics, RDS performance, WAF blocks
- **CloudWatch Alarms**: API errors/latency, Lambda errors, RDS CPU/connections, WAF blocks
- **SNS Topics**: Transaction alerts and system errors

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- An email address for SNS alert subscriptions

## Cost Estimates

### Development Environment (with NAT Gateway disabled)
- Aurora Serverless v2: ~$10-30/month
- Lambda: ~$5-10/month
- API Gateway: ~$5-20/month
- S3: ~$5-10/month
- VPC Endpoints (Interface): ~$63/month (3 endpoints)
- CloudWatch: ~$5-10/month
- **Total: ~$93-143/month**

### Production Environment (with NAT Gateways)
- Aurora Serverless v2: ~$50-200/month
- Lambda: ~$10-50/month
- API Gateway: ~$20-100/month
- S3: ~$10-50/month
- NAT Gateways: ~$100-150/month (3 AZs)
- VPC Endpoints (Interface): ~$63/month (3 endpoints)
- CloudWatch: ~$10-20/month
- WAF: ~$5-20/month
- **Total: ~$268-653/month**

## Directory Structure

```
lib/
├── main.tf                  # Provider and locals configuration
├── variables.tf             # Input variables with validation
├── networking.tf            # VPC, subnets, route tables, NAT gateways, VPC Flow Logs
├── vpc_endpoints.tf         # VPC endpoints (Gateway and Interface)
├── security.tf              # Security groups, KMS keys
├── rds.tf                   # RDS Aurora cluster with parameter groups
├── storage.tf               # S3 buckets with lifecycle, logging, replication
├── iam.tf                   # IAM roles and policies
├── lambda.tf                # Lambda functions with alarms
├── api_gateway.tf           # API Gateway with models and caching
├── waf.tf                   # AWS WAF rules and logging
├── monitoring.tf            # CloudWatch dashboard, alarms, SNS topics
├── outputs.tf               # Output values
├── terraform.tfvars.example # Example variables file
├── lambda/                  # Lambda function code
│   ├── payment_validation.py
│   ├── payment_validation.zip
│   ├── transaction_processing.py
│   └── transaction_processing.zip
└── README.md               # This file
```

## Deployment Instructions

### 1. Prepare Lambda Code

Lambda functions are pre-packaged, but if you make changes:

```bash
cd lib/lambda
zip payment_validation.zip payment_validation.py
zip transaction_processing.zip transaction_processing.py
cd ../..
```

### 2. Configure Variables

Copy the example variables file:

```bash
cp lib/terraform.tfvars.example lib/terraform.tfvars
```

Edit `lib/terraform.tfvars`:

```hcl
environment_suffix = "dev01"          # 5-10 lowercase alphanumeric
environment        = "dev"             # "dev" or "prod"
region             = "us-east-1"       # AWS region
alert_email        = "your@email.com"  # Valid email address
enable_nat_gateway = false             # Set to false to save costs in dev
```

### 3. Initialize Terraform

```bash
cd lib
terraform init
```

### 4. Validate Configuration

```bash
terraform validate
terraform fmt -check
```

### 5. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully, noting:
- Number of resources to be created
- Estimated costs
- Security group rules

### 6. Apply Configuration

```bash
terraform apply tfplan
```

Deployment typically takes 15-20 minutes due to:
- RDS cluster creation (~10 minutes)
- NAT Gateway creation (if enabled)
- VPC endpoint provisioning

### 7. Confirm SNS Subscriptions

Check your email and confirm both SNS topic subscriptions:
- Transaction alerts
- System errors

### 8. Test API Endpoints

After deployment, test the API:

```bash
# Get API endpoint from outputs
API_ENDPOINT=$(terraform output -raw api_gateway_endpoint)

# Test payment validation
curl -X POST "$API_ENDPOINT/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "payment_method": "credit_card",
    "customer_id": "cust_123"
  }'
```

## Environment-Specific Configurations

### Development Environment

Optimized for cost:

```hcl
environment_suffix              = "dev01"
environment                     = "dev"
alert_email                     = "dev-alerts@example.com"
enable_nat_gateway              = false  # Save ~$100/month
enable_cross_region_replication = false
cloudwatch_log_retention_days   = 7
```

**Features:**
- Single RDS instance
- No NAT Gateways (Lambda uses VPC endpoints)
- 7-day backups
- Shorter log retention
- Lower API throttling limits

### Production Environment

Optimized for reliability and performance:

```hcl
environment_suffix              = "prod01"
environment                     = "prod"
alert_email                     = "prod-alerts@example.com"
enable_nat_gateway              = true
enable_cross_region_replication = true
replication_region              = "us-west-2"
cloudwatch_log_retention_days   = 90
db_backup_retention_days        = 30
```

**Features:**
- Multi-instance RDS with read replicas
- NAT Gateways for high availability
- 30-day backups
- Cross-region S3 replication
- API Gateway caching
- Performance Insights
- Deletion protection

## Security Best Practices

### Network Security
1. **VPC Flow Logs**: Enabled for all traffic
2. **Network ACLs**: Database subnets have restrictive NACLs
3. **Security Groups**: Least privilege with separate rules
4. **VPC Endpoints**: Private connectivity to AWS services

### Data Security
1. **Encryption at Rest**: KMS customer-managed keys
2. **Encryption in Transit**: TLS for all connections
3. **S3 Encryption**: KMS for sensitive data, AES256 for logs
4. **Secrets Management**: Credentials in Secrets Manager

### Access Control
1. **IAM Policies**: Least privilege with explicit denies
2. **API Gateway**: IAM authorization (not open)
3. **RDS**: No public access, private subnets only
4. **Lambda**: VPC-isolated with specific security groups

### Monitoring & Compliance
1. **CloudWatch Logs**: All services log to CloudWatch
2. **S3 Access Logging**: Enabled for all buckets
3. **API Gateway Logging**: Request/response logging
4. **WAF Logging**: With sensitive data redaction

## Cost Optimization Strategies

### Development Environment
1. **Disable NAT Gateways**: Use VPC endpoints only (~$100/month savings)
2. **Single RDS Instance**: One instance instead of two
3. **Shorter Retention**: 7-day backups, logs
4. **No Replication**: Disable cross-region replication

### Production Environment
1. **Aurora Serverless v2**: Auto-scales based on demand
2. **S3 Lifecycle Policies**: Automatic tiering to cheaper storage
3. **API Gateway Caching**: Reduce Lambda invocations
4. **Reserved Capacity**: Consider for predictable workloads

### Both Environments
1. **Gateway VPC Endpoints**: Free for S3, DynamoDB
2. **CloudWatch Log Retention**: Balance between compliance and cost
3. **S3 Intelligent Tiering**: Automatic cost optimization
4. **Lambda Optimization**: Right-size memory and timeout

## Monitoring & Troubleshooting

### CloudWatch Dashboard

Access at: AWS Console → CloudWatch → Dashboards → `payment-processing-{env}-{suffix}`

**Metrics displayed:**
- API Gateway latency (avg, p95, p99)
- API request count and errors
- Lambda errors, throttles, concurrency
- Lambda duration
- RDS connections, CPU, ACU capacity
- RDS latency (read/write)
- S3 bucket sizes
- WAF blocked requests

### CloudWatch Alarms

Configured alarms:
1. **API Gateway 5XX errors** > 10 in 5 minutes
2. **API Gateway latency** > 2 seconds
3. **Lambda errors** > 5 in 5 minutes
4. **RDS CPU** > 80%
5. **RDS connections** > 100
6. **RDS capacity** near maximum
7. **WAF blocked requests** > threshold

### Log Groups

All logs centralized in CloudWatch:
- `/aws/lambda/payment-validation-{env}-{suffix}`
- `/aws/lambda/transaction-processing-{env}-{suffix}`
- `/aws/apigateway/payment-api-{env}-{suffix}`
- `/aws/vpc/flowlogs-{env}-{suffix}`
- `aws-waf-logs-{env}-{suffix}`

### Common Issues

#### Lambda Cannot Connect to RDS
- Check security group rules (Lambda → RDS on port 5432)
- Verify Lambda is in correct private subnets
- Confirm RDS secret ARN is correct

#### High Costs
- Check NAT Gateway usage (disable if not needed in dev)
- Review CloudWatch log retention
- Check for unused resources

#### API Gateway Throttling
- Adjust throttling limits in variables
- Check Lambda concurrency limits
- Review CloudWatch metrics

## Testing

### Unit Testing

Test infrastructure with Terraform:

```bash
# Validate syntax
terraform validate

# Check formatting
terraform fmt -check

# Static analysis
tflint
```

### Integration Testing

Test deployed infrastructure:

```bash
# Test API endpoints
./scripts/test-api.sh

# Test RDS connectivity
./scripts/test-rds.sh

# Test S3 uploads
./scripts/test-s3.sh
```

### Load Testing

Use tools like Apache Bench or Locust:

```bash
# Basic load test
ab -n 1000 -c 10 -p payload.json -T application/json "$API_ENDPOINT/validate"
```

## Cleanup

To destroy all resources:

```bash
cd lib
terraform destroy
```

**Warning:** This will delete:
- All S3 buckets and data
- RDS cluster and backups
- CloudWatch logs
- All other resources

Ensure you have backups of any important data before destroying.

## Additional Documentation

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Aurora Serverless v2](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/)

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review CloudWatch Dashboard for metrics
3. Check SNS alerts for notifications
4. Review Terraform state: `terraform show`

## License

This infrastructure code is provided for the payment processing platform.
```
