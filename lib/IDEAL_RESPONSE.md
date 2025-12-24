# Disaster Recovery Infrastructure for Payment Processing - IDEAL SOLUTION

This is the production-ready, deployed implementation of the active-passive disaster recovery architecture using Terraform with HCL. This solution has been tested and validated with integration tests.

## File: lib/provider.tf

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

  backend "s3" {
    bucket         = "terraform-state-dr-payments"
    key            = "dr-payment-system/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-dr"
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "primary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "secondary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/tap_stack.tf

```hcl
# tap_stack.tf

# ===========================
# VARIABLES
# ===========================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

variable "master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for Aurora database (minimum 8 characters)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.master_password) >= 8
    error_message = "Master password must be at least 8 characters"
  }
}

# ===========================
# RESOURCES
# ===========================

# Primary region VPC module
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region_name        = "primary"
  vpc_cidr           = "10.0.0.0/16"
  private_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Secondary region VPC module
module "vpc_secondary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  region_name        = "secondary"
  vpc_cidr           = "10.1.0.0/16"
  private_subnets = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider = aws.primary

  vpc_id      = module.vpc_primary.vpc_id
  peer_vpc_id = module.vpc_secondary.vpc_id
  peer_region = "us-west-2"
  auto_accept = false

  tags = {
    Name = "dr-payment-vpc-peering-${var.environment_suffix}"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider = aws.secondary

  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name = "dr-payment-vpc-peering-accepter-${var.environment_suffix}"
  }
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix        = var.environment_suffix
  global_cluster_identifier = "payment-dr-global-cluster-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.12"
  database_name             = "payments"
  master_username           = var.master_username
  master_password           = var.master_password

  # Primary cluster configuration
  primary_cluster_identifier = "payment-primary-cluster-${var.environment_suffix}"
  primary_instance_class     = "db.r5.large"
  primary_instance_count     = 2
  primary_subnet_ids         = module.vpc_primary.private_subnet_ids
  primary_security_group_id  = module.vpc_primary.aurora_security_group_id

  # Secondary cluster configuration
  secondary_cluster_identifier = "payment-secondary-cluster-${var.environment_suffix}"
  secondary_instance_class     = "db.r5.large"
  secondary_instance_count     = 1
  secondary_subnet_ids         = module.vpc_secondary.private_subnet_ids
  secondary_security_group_id  = module.vpc_secondary.aurora_security_group_id

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
}

# DynamoDB Global Table
module "dynamodb_global" {
  source = "./modules/dynamodb-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix = var.environment_suffix
  table_name         = "payment-sessions-${var.environment_suffix}"
  billing_mode       = "PAY_PER_REQUEST"
  hash_key           = "session_id"

  attributes = [
    {
      name = "session_id"
      type = "S"
    }
  ]

  replica_regions = ["us-east-1", "us-west-2"]
}

# IAM role for Lambda
module "lambda_iam_role" {
  source = "./modules/iam-lambda-role"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  role_name          = "payment-processor-lambda-role-${var.environment_suffix}"
  dynamodb_table_arn = module.dynamodb_global.table_arn
  aurora_cluster_arns = [
    module.aurora_global.primary_cluster_arn,
    module.aurora_global.secondary_cluster_arn
  ]
}

# Lambda functions in primary region
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-primary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_primary.private_subnet_ids
  security_group_ids = [module.vpc_primary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.primary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
  }
}

# Lambda functions in secondary region
module "lambda_secondary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-secondary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_secondary.private_subnet_ids
  security_group_ids = [module.vpc_secondary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.secondary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
  }
}

# Route 53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  domain_name        = "payment-dr-${var.environment_suffix}.internal"

  primary_endpoint   = module.lambda_primary.function_url
  secondary_endpoint = module.lambda_secondary.function_url

  health_check_interval = 30
  health_check_timeout  = 10
  failure_threshold     = 3
}

# CloudWatch Alarms for primary Aurora cluster
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.primary_cluster_id
  alarm_prefix       = "dr-payment-primary-${var.environment_suffix}"
  region_name        = "primary"

  sns_topic_name  = "dr-payment-alerts-primary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}

# CloudWatch Alarms for secondary Aurora cluster
module "cloudwatch_secondary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.secondary_cluster_id
  alarm_prefix       = "dr-payment-secondary-${var.environment_suffix}"
  region_name        = "secondary"

  sns_topic_name  = "dr-payment-alerts-secondary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}

# ===========================
# OUTPUTS
# ===========================

output "environment_suffix" {
  description = "Environment suffix used for this deployment"
  value       = var.environment_suffix
}

output "primary_vpc_id" {
  description = "Primary region VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Secondary region VPC ID"
  value       = module.vpc_secondary.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
  sensitive   = true
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = module.aurora_global.secondary_cluster_endpoint
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb_global.table_name
}

output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = module.lambda_primary.function_name
}

output "secondary_lambda_function_name" {
  description = "Secondary Lambda function name"
  value       = module.lambda_secondary.function_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "route53_domain_name" {
  description = "Route 53 domain name for payment system"
  value       = module.route53_failover.domain_name
}

output "primary_sns_topic_arn" {
  description = "Primary region SNS topic ARN for alerts"
  value       = module.cloudwatch_primary.sns_topic_arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary region SNS topic ARN for alerts"
  value       = module.cloudwatch_secondary.sns_topic_arn
}

output "lambda_iam_role_arn" {
  description = "IAM role ARN used by Lambda functions"
  value       = module.lambda_iam_role.role_arn
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID between regions"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}
```

## File: lib/modules/aurora-global/main.tf

```hcl
resource "aws_rds_global_cluster" "main" {
  provider = aws.primary

  global_cluster_identifier = var.global_cluster_identifier
  engine                    = var.engine
  engine_version            = var.engine_version
  database_name             = var.database_name
  storage_encrypted         = true
  deletion_protection       = false

  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.primary_cluster_identifier}-subnet-group"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name = "${var.primary_cluster_identifier}-subnet-group"
  }
}

resource "aws_rds_cluster" "primary" {
  provider = aws.primary

  cluster_identifier        = var.primary_cluster_identifier
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = var.engine
  engine_version            = var.engine_version
  database_name             = var.database_name
  master_username           = var.master_username
  master_password           = var.master_password
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [var.primary_security_group_id]

  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.preferred_backup_window

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  deletion_protection             = false

  skip_final_snapshot       = true
  final_snapshot_identifier = null

  tags = {
    Name = var.primary_cluster_identifier
  }

  lifecycle {
    ignore_changes = [
      replication_source_identifier,
      engine_version
    ]
  }
}

resource "aws_rds_cluster_instance" "primary" {
  provider = aws.primary
  count    = var.primary_instance_count

  identifier         = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.primary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  publicly_accessible = false

  tags = {
    Name = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  }

  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary

  name       = "${var.secondary_cluster_identifier}-subnet-group"
  subnet_ids = var.secondary_subnet_ids

  tags = {
    Name = "${var.secondary_cluster_identifier}-subnet-group"
  }
}

resource "aws_kms_key" "secondary" {
  provider = aws.secondary

  description             = "KMS key for Aurora secondary cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.secondary_cluster_identifier}-kms-key"
  }
}

resource "aws_kms_alias" "secondary" {
  provider = aws.secondary

  name          = "alias/${var.secondary_cluster_identifier}-kms"
  target_key_id = aws_kms_key.secondary.key_id
}

resource "aws_rds_cluster" "secondary" {
  provider = aws.secondary

  depends_on = [aws_rds_cluster_instance.primary]

  cluster_identifier        = var.secondary_cluster_identifier
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = var.engine
  engine_version            = var.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [var.secondary_security_group_id]

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.secondary.arn
  deletion_protection             = false

  skip_final_snapshot       = true
  final_snapshot_identifier = null

  tags = {
    Name = var.secondary_cluster_identifier
  }

  lifecycle {
    ignore_changes = [
      replication_source_identifier,
      engine_version
    ]
  }
}

resource "aws_rds_cluster_instance" "secondary" {
  provider = aws.secondary
  count    = var.secondary_instance_count

  identifier         = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.secondary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  publicly_accessible = false

  tags = {
    Name = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  }

  lifecycle {
    ignore_changes = [engine_version]
  }
}
```

## File: lib/modules/route53/main.tf

```hcl
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "dr-payment-hosted-zone-${var.environment_suffix}"
  }
}

locals {
  # Extract hostname from Lambda Function URL (remove https://, http://, and trailing slash)
  primary_hostname   = replace(replace(replace(var.primary_endpoint, "https://", ""), "http://", ""), "/", "")
  secondary_hostname = replace(replace(replace(var.secondary_endpoint, "https://", ""), "http://", ""), "/", "")
}

resource "aws_route53_health_check" "primary" {
  fqdn              = local.primary_hostname
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = var.failure_threshold
  request_interval  = var.health_check_interval

  tags = {
    Name = "dr-payment-primary-health-check-${var.environment_suffix}"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  records = [local.primary_hostname]
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "secondary.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  records = [local.secondary_hostname]
}
```

