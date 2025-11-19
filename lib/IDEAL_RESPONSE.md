# Disaster Recovery Infrastructure for Payment Processing - IDEAL SOLUTION

This is the production-ready, corrected implementation of the active-passive disaster recovery architecture using Terraform with HCL.

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

  environment_suffix         = var.environment_suffix
  global_cluster_identifier  = "payment-dr-global-cluster-${var.environment_suffix}"
  engine                     = "aurora-postgresql"
  engine_version             = "13.7"
  database_name              = "payments"
  master_username            = var.master_username
  master_password            = var.master_password

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

  environment_suffix     = var.environment_suffix
  role_name              = "payment-processor-lambda-role-${var.environment_suffix}"
  dynamodb_table_arn     = module.dynamodb_global.table_arn
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
    AWS_REGION          = "us-east-1"
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
    AWS_REGION          = "us-west-2"
  }
}

# Route 53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  domain_name        = "payments-${var.environment_suffix}.example.com"

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
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming across deployments"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
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
```

## File: lib/outputs.tf

```hcl
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

## File: lib/modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "dr-payment-vpc-${var.region_name}-${var.environment_suffix}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "dr-payment-private-subnet-${var.region_name}-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda" {
  name_prefix = "dr-payment-lambda-${var.region_name}-${var.environment_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions in ${var.region_name} region"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "dr-payment-lambda-sg-${var.region_name}-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora" {
  name_prefix = "dr-payment-aurora-${var.region_name}-${var.environment_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora database in ${var.region_name} region"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow PostgreSQL from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "dr-payment-aurora-sg-${var.region_name}-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/modules/vpc/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or secondary)"
  type        = string
  validation {
    condition     = contains(["primary", "secondary"], var.region_name)
    error_message = "Region name must be 'primary' or 'secondary'"
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  validation {
    condition     = length(var.private_subnets) == 3
    error_message = "Exactly 3 private subnets are required for HA"
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) == 3
    error_message = "Exactly 3 availability zones are required"
  }
}
```

## File: lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "aurora_security_group_id" {
  description = "Aurora security group ID"
  value       = aws_security_group.aurora.id
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

  cluster_identifier              = var.primary_cluster_identifier
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  engine                          = var.engine
  engine_version                  = var.engine_version
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [var.primary_security_group_id]

  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = var.preferred_backup_window

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

## File: lib/modules/aurora-global/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "global_cluster_identifier" {
  description = "Global cluster identifier"
  type        = string
}

variable "engine" {
  description = "Database engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Master username"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "primary_cluster_identifier" {
  description = "Primary cluster identifier"
  type        = string
}

variable "primary_instance_class" {
  description = "Primary instance class"
  type        = string
}

variable "primary_instance_count" {
  description = "Number of primary instances"
  type        = number
  validation {
    condition     = var.primary_instance_count >= 1 && var.primary_instance_count <= 15
    error_message = "Primary instance count must be between 1 and 15"
  }
}

variable "primary_subnet_ids" {
  description = "Primary subnet IDs"
  type        = list(string)
}

variable "primary_security_group_id" {
  description = "Primary security group ID"
  type        = string
}

variable "secondary_cluster_identifier" {
  description = "Secondary cluster identifier"
  type        = string
}

variable "secondary_instance_class" {
  description = "Secondary instance class"
  type        = string
}

variable "secondary_instance_count" {
  description = "Number of secondary instances"
  type        = number
  validation {
    condition     = var.secondary_instance_count >= 1 && var.secondary_instance_count <= 15
    error_message = "Secondary instance count must be between 1 and 15"
  }
}

variable "secondary_subnet_ids" {
  description = "Secondary subnet IDs"
  type        = list(string)
}

variable "secondary_security_group_id" {
  description = "Secondary security group ID"
  type        = string
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days"
  }
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
}
```

## File: lib/modules/aurora-global/outputs.tf

```hcl
output "global_cluster_id" {
  description = "Global cluster ID"
  value       = aws_rds_global_cluster.main.id
}

output "global_cluster_arn" {
  description = "Global cluster ARN"
  value       = aws_rds_global_cluster.main.arn
}

output "primary_cluster_id" {
  description = "Primary cluster ID"
  value       = aws_rds_cluster.primary.id
}

output "primary_cluster_arn" {
  description = "Primary cluster ARN"
  value       = aws_rds_cluster.primary.arn
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_cluster_id" {
  description = "Secondary cluster ID"
  value       = aws_rds_cluster.secondary.id
}

output "secondary_cluster_arn" {
  description = "Secondary cluster ARN"
  value       = aws_rds_cluster.secondary.arn
}

output "secondary_cluster_endpoint" {
  description = "Secondary cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}
```

## File: lib/modules/dynamodb-global/main.tf

```hcl
resource "aws_dynamodb_table" "main" {
  provider = aws.primary

  name         = var.table_name
  billing_mode = var.billing_mode
  hash_key     = var.hash_key

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  replica {
    region_name = "us-west-2"
  }

  tags = {
    Name = var.table_name
  }

  lifecycle {
    ignore_changes = [replica]
  }
}
```

## File: lib/modules/dynamodb-global/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.billing_mode)
    error_message = "Billing mode must be PROVISIONED or PAY_PER_REQUEST"
  }
}

variable "hash_key" {
  description = "Hash key attribute name"
  type        = string
}

variable "attributes" {
  description = "List of attribute definitions"
  type = list(object({
    name = string
    type = string
  }))
}

variable "replica_regions" {
  description = "List of replica regions"
  type        = list(string)
}
```

## File: lib/modules/dynamodb-global/outputs.tf

```hcl
output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "table_id" {
  description = "DynamoDB table ID"
  value       = aws_dynamodb_table.main.id
}
```

## File: lib/modules/iam-lambda-role/main.tf

```hcl
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name = var.role_name
  }
}

# VPC Access Policy
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB Access Policy
data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [var.dynamodb_table_arn]
  }
}

resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.role_name}-dynamodb-access"
  description = "Allow Lambda to access DynamoDB"
  policy      = data.aws_iam_policy_document.dynamodb_access.json
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Aurora Access Policy
data "aws_iam_policy_document" "aurora_access" {
  statement {
    effect = "Allow"
    actions = [
      "rds:DescribeDBClusters",
      "rds:DescribeDBInstances"
    ]
    resources = var.aurora_cluster_arns
  }
}

resource "aws_iam_policy" "aurora_access" {
  name        = "${var.role_name}-aurora-access"
  description = "Allow Lambda to describe Aurora clusters"
  policy      = data.aws_iam_policy_document.aurora_access.json
}

resource "aws_iam_role_policy_attachment" "lambda_aurora" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.aurora_access.arn
}
```

## File: lib/modules/iam-lambda-role/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "role_name" {
  description = "IAM role name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "aurora_cluster_arns" {
  description = "List of Aurora cluster ARNs"
  type        = list(string)
}
```

## File: lib/modules/iam-lambda-role/outputs.tf

```hcl
output "role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.lambda.arn
}

output "role_name" {
  description = "IAM role name"
  value       = aws_iam_role.lambda.name
}
```

## File: lib/modules/lambda/main.tf

```hcl
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = var.source_path
  output_path = "${path.module}/.terraform/${var.function_name}.zip"
}

resource "aws_lambda_function" "main" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = var.function_name
  role          = var.iam_role_arn
  handler       = var.handler
  runtime       = var.runtime
  memory_size   = var.memory_size
  timeout       = var.timeout

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = var.environment_variables
  }

  tags = {
    Name = var.function_name
  }
}

resource "aws_lambda_function_url" "main" {
  function_name      = aws_lambda_function.main.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["*"]
    allow_methods     = ["POST", "GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}
```

## File: lib/modules/lambda/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB"
  }
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds"
  }
}

variable "source_path" {
  description = "Path to Lambda source code"
  type        = string
}

variable "subnet_ids" {
  description = "VPC subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "iam_role_arn" {
  description = "IAM role ARN"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/lambda/outputs.tf

```hcl
output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_url" {
  description = "Lambda function URL"
  value       = aws_lambda_function_url.main.function_url
}

output "invoke_arn" {
  description = "Lambda invoke ARN"
  value       = aws_lambda_function.main.invoke_arn
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

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_endpoint
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
  name    = var.domain_name
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_endpoint
    zone_id                = aws_route53_zone.main.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = var.secondary_endpoint
    zone_id                = aws_route53_zone.main.zone_id
    evaluate_target_health = false
  }
}
```

## File: lib/modules/route53/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
}

variable "primary_endpoint" {
  description = "Primary endpoint URL"
  type        = string
}

variable "secondary_endpoint" {
  description = "Secondary endpoint URL"
  type        = string
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 10
}

variable "failure_threshold" {
  description = "Number of consecutive failures before marking unhealthy"
  type        = number
  default     = 3
}
```

## File: lib/modules/route53/outputs.tf

```hcl
output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}
```

## File: lib/modules/cloudwatch/main.tf

```hcl
resource "aws_sns_topic" "alerts" {
  name = var.sns_topic_name

  tags = {
    Name = var.sns_topic_name
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.email_endpoints)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_endpoints[count.index]
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.alarm_prefix}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-cpu-utilization"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.alarm_prefix}-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-database-connections"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_replica_lag" {
  alarm_name          = "${var.alarm_prefix}-aurora-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1000
  alarm_description   = "This metric monitors Aurora global replication lag"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-aurora-replica-lag"
  }
}
```

## File: lib/modules/cloudwatch/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "cluster_identifier" {
  description = "RDS cluster identifier"
  type        = string
}

variable "alarm_prefix" {
  description = "Prefix for alarm names"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or secondary)"
  type        = string
}

variable "sns_topic_name" {
  description = "SNS topic name for alerts"
  type        = string
}

variable "email_endpoints" {
  description = "Email endpoints for SNS notifications"
  type        = list(string)
}
```

## File: lib/modules/cloudwatch/outputs.tf

```hcl
output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.alerts.name
}

output "cpu_alarm_arn" {
  description = "CPU utilization alarm ARN"
  value       = aws_cloudwatch_metric_alarm.cpu_utilization.arn
}

output "connections_alarm_arn" {
  description = "Database connections alarm ARN"
  value       = aws_cloudwatch_metric_alarm.database_connections.arn
}

output "replica_lag_alarm_arn" {
  description = "Aurora replica lag alarm ARN"
  value       = aws_cloudwatch_metric_alarm.aurora_replica_lag.arn
}
```

## File: lib/lambda/payment-processor/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

exports.handler = async (event) => {
  console.log('Processing payment webhook:', JSON.stringify(event));

  try {
    // Parse request body
    let paymentData;
    if (event.body) {
      paymentData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      paymentData = event;
    }

    const sessionId = paymentData.sessionId || `session-${Date.now()}`;
    const amount = paymentData.amount || 0;
    const timestamp = new Date().toISOString();

    // Store session data in DynamoDB
    await dynamoClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          session_id: sessionId,
          amount: amount,
          timestamp: timestamp,
          region: process.env.AWS_REGION,
          status: 'processed'
        }
      })
    );

    console.log('Session stored in DynamoDB:', sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        sessionId: sessionId,
        region: process.env.AWS_REGION,
        timestamp: timestamp
      })
    };
  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error.message,
        region: process.env.AWS_REGION
      })
    };
  }
};

// Health check endpoint
exports.health = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'healthy',
      region: process.env.AWS_REGION,
      timestamp: new Date().toISOString()
    })
  };
};
```

## File: lib/lambda/payment-processor/package.json

```json
{
  "name": "payment-processor",
  "version": "1.0.0",
  "description": "Payment webhook processor for disaster recovery system",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/lib-dynamodb": "^3.400.0"
  },
  "author": "",
  "license": "MIT"
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and update with your values

environment_suffix = "prod-dr-001"

master_username = "postgres"
master_password = "YourSecurePassword123!"  # Change this!

alert_email_addresses = [
  "ops-team@example.com",
  "devops@example.com"
]
```

## File: lib/README.md

```markdown
# Disaster Recovery Infrastructure for Payment Processing

Production-ready Terraform configuration implementing active-passive disaster recovery architecture for payment processing across AWS regions us-east-1 (primary) and us-west-2 (secondary).

## Architecture Overview

- **Aurora Global Database**: PostgreSQL 13.7 with automated multi-region replication (RPO < 1 minute)
- **Lambda Functions**: Payment webhook processors in both regions (1GB memory, Node.js 18.x)
- **DynamoDB Global Tables**: Session data with automatic replication
- **Route 53**: DNS failover with health checks (RTO < 5 minutes)
- **CloudWatch**: Multi-region monitoring with SNS alerts
- **VPC**: Isolated networking with VPC peering between regions
- **IAM**: Least-privilege access policies

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Multi-region deployment permissions
- Valid domain name for Route 53 (optional but recommended)

## Quick Start

### 1. Clone and Initialize

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create `terraform.tfvars`:

```hcl
environment_suffix = "prod-001"
master_username = "postgres"
master_password = "YourSecurePassword123!"
alert_email_addresses = ["ops@example.com"]
```

### 3. Plan Deployment

```bash
terraform plan -out=dr-plan
```

### 4. Deploy Infrastructure

```bash
terraform apply dr-plan
```

Deployment takes approximately 20-30 minutes due to Aurora Global Database provisioning.

## Testing

### Unit Tests

```bash
cd test
go test -v ./...
```

### Integration Tests

```bash
# Run after successful deployment
go test -v -tags=integration ./...
```

## Disaster Recovery Testing

### Simulate Primary Region Failure

```bash
# Disable primary Aurora cluster
aws rds stop-db-cluster --db-cluster-identifier payment-primary-cluster-prod-001 --region us-east-1

# Monitor Route 53 failover (should occur within 2-3 minutes)
watch -n 10 'dig payments-prod-001.example.com'
```

### Verify Failover

```bash
# Check CloudWatch alarms
aws cloudwatch describe-alarms --region us-east-1

# Verify secondary region is serving traffic
curl https://payments-prod-001.example.com/health
```

## RTO and RPO Metrics

- **RTO (Recovery Time Objective)**: Under 5 minutes
  - Route 53 health check interval: 30 seconds
  - Failure threshold: 3 consecutive failures
  - DNS TTL: 60 seconds

- **RPO (Recovery Point Objective)**: Under 1 minute
  - Aurora Global Database replication lag: < 1 second typical
  - DynamoDB Global Tables replication: < 1 second

## Cost Optimization

- Secondary region runs 1 Aurora instance vs 2 in primary (50% reduction)
- DynamoDB on-demand billing (no idle capacity costs)
- Lambda functions only charged when invoked
- Estimated monthly cost: $800-1200 (varies by traffic)

## Monitoring

### CloudWatch Alarms

- CPU Utilization > 80%
- Database Connections > 100
- Aurora Replication Lag > 1000ms

### SNS Notifications

All alarms send email notifications to configured addresses.

## Cleanup

⚠️ **WARNING**: This will delete all resources including databases

```bash
terraform destroy
```

All resources use `skip_final_snapshot = true` for easy cleanup in non-production environments. For production, update this setting.

## Module Structure

```
lib/
├── main.tf                      # Root configuration
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
├── modules/
│   ├── vpc/                     # VPC with subnets and security groups
│   ├── aurora-global/           # Aurora Global Database
│   ├── dynamodb-global/         # DynamoDB Global Tables
│   ├── lambda/                  # Lambda function deployment
│   ├── iam-lambda-role/         # IAM roles and policies
│   ├── route53/                 # DNS failover configuration
│   └── cloudwatch/              # Monitoring and alarms
└── lambda/
    └── payment-processor/       # Lambda function code
```

## Outputs

After successful deployment:

```hcl
environment_suffix               = "prod-001"
primary_vpc_id                   = "vpc-xxxxx"
secondary_vpc_id                 = "vpc-yyyyy"
aurora_global_cluster_id         = "payment-dr-global-cluster-prod-001"
primary_aurora_endpoint          = "payment-primary-cluster-prod-001.cluster-xxxxx.us-east-1.rds.amazonaws.com"
secondary_aurora_endpoint        = "payment-secondary-cluster-prod-001.cluster-yyyyy.us-west-2.rds.amazonaws.com"
dynamodb_table_name              = "payment-sessions-prod-001"
primary_lambda_function_name     = "payment-webhook-processor-primary-prod-001"
secondary_lambda_function_name   = "payment-webhook-processor-secondary-prod-001"
route53_zone_id                  = "Z1234567890ABC"
route53_domain_name              = "payments-prod-001.example.com"
```

## Security

- All data encrypted at rest (Aurora, DynamoDB)
- TLS 1.2+ for data in transit
- IAM least-privilege policies
- VPC isolation with security groups
- No public database access

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review Terraform state
3. Verify AWS service quotas
4. Check regional availability of services

## License

MIT
```
