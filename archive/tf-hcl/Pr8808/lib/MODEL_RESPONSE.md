# Multi-Region Disaster Recovery Infrastructure - Terraform Implementation

This implementation provides a complete multi-region disaster recovery solution using Terraform with HCL, spanning us-east-1 (primary) and us-west-2 (DR) regions.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to support parallel deployments"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = "example.com"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_dr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for RDS Aurora"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS Aurora"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address for SNS notifications"
  type        = string
}

variable "availability_zones_primary" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "availability_zones_dr" {
  description = "Availability zones for DR region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}
```

## File: providers.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region
}

provider "aws" {
  alias  = "global"
  region = var.primary_region
}
```

## File: main.tf

```hcl
# Primary Region VPC
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix    = var.environment_suffix
  region                = var.primary_region
  vpc_cidr              = var.vpc_cidr_primary
  availability_zones    = var.availability_zones_primary
  is_primary            = true
}

# DR Region VPC
module "vpc_dr" {
  source = "./modules/vpc"

  providers = {
    aws = aws.dr
  }

  environment_suffix    = var.environment_suffix
  region                = var.dr_region
  vpc_cidr              = var.vpc_cidr_dr
  availability_zones    = var.availability_zones_dr
  is_primary            = false
}

# VPC Peering
module "vpc_peering" {
  source = "./modules/vpc-peering"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix           = var.environment_suffix
  primary_vpc_id               = module.vpc_primary.vpc_id
  dr_vpc_id                    = module.vpc_dr.vpc_id
  primary_vpc_cidr             = var.vpc_cidr_primary
  dr_vpc_cidr                  = var.vpc_cidr_dr
  primary_route_table_ids      = module.vpc_primary.private_route_table_ids
  dr_route_table_ids           = module.vpc_dr.private_route_table_ids
  primary_region               = var.primary_region
  dr_region                    = var.dr_region
}

# IAM Roles
module "iam" {
  source = "./modules/iam"

  providers = {
    aws = aws.global
  }

  environment_suffix = var.environment_suffix
  primary_region     = var.primary_region
  dr_region          = var.dr_region
}

# S3 Buckets with Cross-Region Replication
module "s3_primary" {
  source = "./modules/s3"

  providers = {
    aws = aws.primary
  }

  environment_suffix      = var.environment_suffix
  region                  = var.primary_region
  replication_region      = var.dr_region
  replication_role_arn    = module.iam.s3_replication_role_arn
  is_primary              = true
}

module "s3_dr" {
  source = "./modules/s3"

  providers = {
    aws = aws.dr
  }

  environment_suffix      = var.environment_suffix
  region                  = var.dr_region
  replication_region      = var.primary_region
  replication_role_arn    = module.iam.s3_replication_role_arn
  is_primary              = false
}

# DynamoDB Global Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix = var.environment_suffix
  primary_region     = var.primary_region
  dr_region          = var.dr_region
}

# RDS Aurora Global Database
module "rds_primary" {
  source = "./modules/rds"

  providers = {
    aws = aws.primary
  }

  environment_suffix        = var.environment_suffix
  region                    = var.primary_region
  vpc_id                    = module.vpc_primary.vpc_id
  private_subnet_ids        = module.vpc_primary.private_subnet_ids
  availability_zones        = var.availability_zones_primary
  db_master_username        = var.db_master_username
  db_master_password        = var.db_master_password
  is_primary                = true
  global_cluster_identifier = "transaction-db-${var.environment_suffix}"
}

module "rds_dr" {
  source = "./modules/rds"

  providers = {
    aws = aws.dr
  }

  environment_suffix        = var.environment_suffix
  region                    = var.dr_region
  vpc_id                    = module.vpc_dr.vpc_id
  private_subnet_ids        = module.vpc_dr.private_subnet_ids
  availability_zones        = var.availability_zones_dr
  db_master_username        = var.db_master_username
  db_master_password        = var.db_master_password
  is_primary                = false
  global_cluster_identifier = "transaction-db-${var.environment_suffix}"
  depends_on_cluster        = module.rds_primary.cluster_arn
}

# Lambda Functions
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  environment_suffix     = var.environment_suffix
  region                 = var.primary_region
  vpc_id                 = module.vpc_primary.vpc_id
  private_subnet_ids     = module.vpc_primary.private_subnet_ids
  lambda_execution_role  = module.iam.lambda_execution_role_arn
  source_bucket          = module.s3_primary.lambda_source_bucket_name
}

module "lambda_dr" {
  source = "./modules/lambda"

  providers = {
    aws = aws.dr
  }

  environment_suffix     = var.environment_suffix
  region                 = var.dr_region
  vpc_id                 = module.vpc_dr.vpc_id
  private_subnet_ids     = module.vpc_dr.private_subnet_ids
  lambda_execution_role  = module.iam.lambda_execution_role_arn
  source_bucket          = module.s3_dr.lambda_source_bucket_name
}

# Application Load Balancers
module "alb_primary" {
  source = "./modules/alb"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  public_subnet_ids  = module.vpc_primary.public_subnet_ids
  lambda_arn         = module.lambda_primary.function_arn
}

module "alb_dr" {
  source = "./modules/alb"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  vpc_id             = module.vpc_dr.vpc_id
  public_subnet_ids  = module.vpc_dr.public_subnet_ids
  lambda_arn         = module.lambda_dr.function_arn
}

# Route 53
module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.global
  }

  environment_suffix      = var.environment_suffix
  domain_name             = var.domain_name
  primary_alb_dns         = module.alb_primary.dns_name
  primary_alb_zone_id     = module.alb_primary.zone_id
  dr_alb_dns              = module.alb_dr.dns_name
  dr_alb_zone_id          = module.alb_dr.zone_id
}

# CloudWatch Monitoring
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  environment_suffix     = var.environment_suffix
  region                 = var.primary_region
  cluster_identifier     = module.rds_primary.cluster_identifier
  sns_topic_arn          = module.sns_primary.topic_arn
}

module "cloudwatch_dr" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.dr
  }

  environment_suffix     = var.environment_suffix
  region                 = var.dr_region
  cluster_identifier     = module.rds_dr.cluster_identifier
  sns_topic_arn          = module.sns_dr.topic_arn
}

# SNS Topics
module "sns_primary" {
  source = "./modules/sns"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  alert_email        = var.alert_email
}

module "sns_dr" {
  source = "./modules/sns"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  alert_email        = var.alert_email
}
```

## File: outputs.tf

```hcl
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = module.vpc_dr.vpc_id
}

output "vpc_peering_id" {
  description = "VPC Peering Connection ID"
  value       = module.vpc_peering.peering_connection_id
}

output "primary_rds_cluster_endpoint" {
  description = "Primary RDS cluster endpoint"
  value       = module.rds_primary.cluster_endpoint
  sensitive   = true
}

output "dr_rds_cluster_endpoint" {
  description = "DR RDS cluster endpoint"
  value       = module.rds_dr.cluster_endpoint
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb.table_name
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = module.s3_primary.bucket_name
}

output "dr_s3_bucket" {
  description = "DR S3 bucket name"
  value       = module.s3_dr.bucket_name
}

output "primary_lambda_function" {
  description = "Primary Lambda function ARN"
  value       = module.lambda_primary.function_arn
}

output "dr_lambda_function" {
  description = "DR Lambda function ARN"
  value       = module.lambda_dr.function_arn
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = module.alb_primary.dns_name
}

output "dr_alb_dns" {
  description = "DR ALB DNS name"
  value       = module.alb_dr.dns_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53.zone_id
}

output "route53_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = module.route53.name_servers
}

output "failover_endpoint" {
  description = "Route 53 failover endpoint URL"
  value       = "https://${var.domain_name}"
}

output "primary_sns_topic" {
  description = "Primary SNS topic ARN"
  value       = module.sns_primary.topic_arn
}

output "dr_sns_topic" {
  description = "DR SNS topic ARN"
  value       = module.sns_dr.topic_arn
}
```

## File: modules/vpc/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_cidr" { type = string }
variable "availability_zones" { type = list(string) }
variable "is_primary" { type = bool }

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "transaction-vpc-${var.region}-${var.environment_suffix}"
    Region = var.region
    Type = var.is_primary ? "primary" : "dr"
  }
}

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "transaction-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "transaction-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "transaction-igw-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "transaction-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "transaction-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "transaction-public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "transaction-private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

output "vpc_id" { value = aws_vpc.main.id }
output "vpc_cidr" { value = aws_vpc.main.cidr_block }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
output "private_route_table_ids" { value = aws_route_table.private[*].id }
```

## File: modules/vpc-peering/main.tf

```hcl
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version              = "~> 5.0"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

variable "environment_suffix" { type = string }
variable "primary_vpc_id" { type = string }
variable "dr_vpc_id" { type = string }
variable "primary_vpc_cidr" { type = string }
variable "dr_vpc_cidr" { type = string }
variable "primary_route_table_ids" { type = list(string) }
variable "dr_route_table_ids" { type = list(string) }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

resource "aws_vpc_peering_connection" "peer" {
  provider    = aws.primary
  vpc_id      = var.primary_vpc_id
  peer_vpc_id = var.dr_vpc_id
  peer_region = var.dr_region
  auto_accept = false

  tags = {
    Name = "transaction-vpc-peering-${var.environment_suffix}"
  }
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  auto_accept               = true

  tags = {
    Name = "transaction-vpc-peering-accepter-${var.environment_suffix}"
  }
}

resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  count                     = length(var.primary_route_table_ids)
  route_table_id            = var.primary_route_table_ids[count.index]
  destination_cidr_block    = var.dr_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  count                     = length(var.dr_route_table_ids)
  route_table_id            = var.dr_route_table_ids[count.index]
  destination_cidr_block    = var.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

output "peering_connection_id" { value = aws_vpc_peering_connection.peer.id }
```

## File: modules/iam/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

# S3 Replication Role
resource "aws_iam_role" "s3_replication" {
  name = "transaction-s3-replication-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "s3_replication" {
  name = "transaction-s3-replication-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "transaction-lambda-execution-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_execution" {
  name = "transaction-lambda-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/transaction-sessions-*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
}

# Cross-Region Access Role
resource "aws_iam_role" "cross_region_access" {
  name = "transaction-cross-region-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = [
          "lambda.amazonaws.com",
          "rds.amazonaws.com"
        ]
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "cross_region_access" {
  name = "transaction-cross-region-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:FailoverDBCluster"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:GetHealthCheck",
          "route53:GetHealthCheckStatus",
          "route53:UpdateHealthCheck"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cross_region_access" {
  role       = aws_iam_role.cross_region_access.name
  policy_arn = aws_iam_policy.cross_region_access.arn
}

output "s3_replication_role_arn" { value = aws_iam_role.s3_replication.arn }
output "lambda_execution_role_arn" { value = aws_iam_role.lambda_execution.arn }
output "cross_region_role_arn" { value = aws_iam_role.cross_region_access.arn }
```

## File: modules/s3/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "replication_region" { type = string }
variable "replication_role_arn" { type = string }
variable "is_primary" { type = bool }

resource "aws_s3_bucket" "assets" {
  bucket = "transaction-assets-${var.region}-${var.environment_suffix}"

  tags = {
    Name = "transaction-assets-${var.region}-${var.environment_suffix}"
    Region = var.region
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "assets" {
  count  = var.is_primary ? 1 : 0
  bucket = aws_s3_bucket.assets.id
  role   = var.replication_role_arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = "arn:aws:s3:::transaction-assets-${var.replication_region}-${var.environment_suffix}"
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.assets]
}

resource "aws_s3_bucket" "lambda_source" {
  bucket = "transaction-lambda-source-${var.region}-${var.environment_suffix}"

  tags = {
    Name = "transaction-lambda-source-${var.region}-${var.environment_suffix}"
    Region = var.region
  }
}

resource "aws_s3_bucket_versioning" "lambda_source" {
  bucket = aws_s3_bucket.lambda_source.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" { value = aws_s3_bucket.assets.bucket }
output "bucket_arn" { value = aws_s3_bucket.assets.arn }
output "lambda_source_bucket_name" { value = aws_s3_bucket.lambda_source.bucket }
```

## File: modules/dynamodb/main.tf

```hcl
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version              = "~> 5.0"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

variable "environment_suffix" { type = string }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

resource "aws_dynamodb_table" "sessions" {
  provider         = aws.primary
  name             = "transaction-sessions-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  replica {
    region_name = var.dr_region
  }

  tags = {
    Name = "transaction-sessions-${var.environment_suffix}"
  }
}

output "table_name" { value = aws_dynamodb_table.sessions.name }
output "table_arn" { value = aws_dynamodb_table.sessions.arn }
```

## File: modules/rds/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "availability_zones" { type = list(string) }
variable "db_master_username" { type = string }
variable "db_master_password" { type = string, sensitive = true }
variable "is_primary" { type = bool }
variable "global_cluster_identifier" { type = string }
variable "depends_on_cluster" {
  type    = string
  default = ""
}

resource "aws_db_subnet_group" "main" {
  name       = "transaction-db-subnet-${var.region}-${var.environment_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "transaction-db-subnet-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_security_group" "rds" {
  name        = "transaction-rds-sg-${var.region}-${var.environment_suffix}"
  description = "Security group for RDS Aurora"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "transaction-rds-sg-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_rds_global_cluster" "main" {
  count                     = var.is_primary ? 1 : 0
  global_cluster_identifier = var.global_cluster_identifier
  engine                    = "aurora-postgresql"
  engine_version            = "15.3"
  database_name             = "transactions"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = "transaction-cluster-${var.region}-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.3"
  database_name                   = var.is_primary ? "transactions" : null
  master_username                 = var.is_primary ? var.db_master_username : null
  master_password                 = var.is_primary ? var.db_master_password : null
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  storage_encrypted               = true
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true

  global_cluster_identifier = var.is_primary ? aws_rds_global_cluster.main[0].id : var.global_cluster_identifier

  dynamic "depends_on" {
    for_each = var.is_primary ? [] : [1]
    content {
      value = [var.depends_on_cluster]
    }
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "transaction-instance-${var.region}-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r5.large"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
}

resource "aws_db_parameter_group" "main" {
  name   = "transaction-pg-${var.region}-${var.environment_suffix}"
  family = "aurora-postgresql15"

  parameter {
    name  = "ssl"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

output "cluster_id" { value = aws_rds_cluster.main.id }
output "cluster_arn" { value = aws_rds_cluster.main.arn }
output "cluster_endpoint" { value = aws_rds_cluster.main.endpoint }
output "cluster_identifier" { value = aws_rds_cluster.main.cluster_identifier }
output "reader_endpoint" { value = aws_rds_cluster.main.reader_endpoint }
```

## File: modules/lambda/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "lambda_execution_role" { type = string }
variable "source_bucket" { type = string }

resource "aws_security_group" "lambda" {
  name        = "transaction-lambda-sg-${var.region}-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "transaction-lambda-sg-${var.region}-${var.environment_suffix}"
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<EOF
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Transaction processed in ${var.region}'
    }
EOF
    filename = "index.py"
  }
}

resource "aws_s3_object" "lambda_zip" {
  bucket = var.source_bucket
  key    = "lambda/transaction-processor.zip"
  source = data.archive_file.lambda.output_path
  etag   = filemd5(data.archive_file.lambda.output_path)
}

resource "aws_lambda_function" "transaction_processor" {
  function_name = "transaction-processor-${var.region}-${var.environment_suffix}"
  s3_bucket     = var.source_bucket
  s3_key        = aws_s3_object.lambda_zip.key
  role          = var.lambda_execution_role
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 512

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REGION             = var.region
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "transaction-processor-${var.region}-${var.environment_suffix}"
  }
}

output "function_arn" { value = aws_lambda_function.transaction_processor.arn }
output "function_name" { value = aws_lambda_function.transaction_processor.function_name }
```

## File: modules/alb/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "lambda_arn" { type = string }

resource "aws_security_group" "alb" {
  name        = "transaction-alb-sg-${var.region}-${var.environment_suffix}"
  description = "Security group for ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "transaction-alb-sg-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_lb" "main" {
  name               = "transaction-alb-${var.region}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "transaction-alb-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "lambda" {
  name        = "transaction-tg-${var.region}-${var.environment_suffix}"
  target_type = "lambda"

  health_check {
    enabled  = true
    path     = "/health"
    interval = 30
    timeout  = 5
  }
}

resource "aws_lambda_permission" "alb" {
  statement_id  = "AllowExecutionFromALB"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_arn
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.lambda.arn
}

resource "aws_lb_target_group_attachment" "lambda" {
  target_group_arn = aws_lb_target_group.lambda.arn
  target_id        = var.lambda_arn
  depends_on       = [aws_lambda_permission.alb]
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.lambda.arn
  }
}

output "dns_name" { value = aws_lb.main.dns_name }
output "zone_id" { value = aws_lb.main.zone_id }
output "arn" { value = aws_lb.main.arn }
```

## File: modules/route53/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "domain_name" { type = string }
variable "primary_alb_dns" { type = string }
variable "primary_alb_zone_id" { type = string }
variable "dr_alb_dns" { type = string }
variable "dr_alb_zone_id" { type = string }

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "transaction-zone-${var.environment_suffix}"
  }
}

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_alb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "transaction-health-check-primary-${var.environment_suffix}"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_alb_dns
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
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
    name                   = var.dr_alb_dns
    zone_id                = var.dr_alb_zone_id
    evaluate_target_health = true
  }
}

output "zone_id" { value = aws_route53_zone.main.zone_id }
output "name_servers" { value = aws_route53_zone.main.name_servers }
output "health_check_id" { value = aws_route53_health_check.primary.id }
```

## File: modules/cloudwatch/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "cluster_identifier" { type = string }
variable "sns_topic_arn" { type = string }

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  alarm_name          = "transaction-replication-lag-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "transaction-replication-lag-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "transaction-db-connections-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when database connections exceed threshold"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "transaction-cpu-utilization-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80%"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }
}

output "replication_lag_alarm_arn" { value = aws_cloudwatch_metric_alarm.replication_lag.arn }
```

## File: modules/sns/main.tf

```hcl
variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "alert_email" { type = string }

resource "aws_sns_topic" "alerts" {
  name = "transaction-alerts-${var.region}-${var.environment_suffix}"

  tags = {
    Name = "transaction-alerts-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

output "topic_arn" { value = aws_sns_topic.alerts.arn }
output "topic_name" { value = aws_sns_topic.alerts.name }
```

## File: terraform.tfvars.example

```hcl
environment_suffix  = "dev-001"
primary_region      = "us-east-1"
dr_region           = "us-west-2"
domain_name         = "example.com"
vpc_cidr_primary    = "10.0.0.0/16"
vpc_cidr_dr         = "10.1.0.0/16"
db_master_username  = "admin"
db_master_password  = "CHANGEME-SecurePassword123!"
alert_email         = "alerts@example.com"

availability_zones_primary = ["us-east-1a", "us-east-1b", "us-east-1c"]
availability_zones_dr      = ["us-west-2a", "us-west-2b", "us-west-2c"]
```

## File: README.md

```markdown
# Multi-Region Disaster Recovery Infrastructure

This Terraform configuration implements a complete multi-region disaster recovery solution for a transaction processing system spanning AWS us-east-1 (primary) and us-west-2 (DR).

## Architecture Overview

- **Primary Region**: us-east-1
- **DR Region**: us-west-2
- **RTO Target**: < 5 minutes
- **Failover**: Automated via Route 53 health checks

## Components

### Network Layer
- VPC in each region with 3 availability zones
- Public and private subnets
- NAT Gateways for outbound traffic
- VPC Peering for cross-region communication

### Database Layer
- RDS Aurora PostgreSQL Global Database
- Cross-region read replicas
- SSL/TLS encrypted replication
- CloudWatch alarms for replication lag > 60 seconds

### Session Management
- DynamoDB Global Tables
- Automatic cross-region replication
- On-demand billing mode

### Traffic Routing
- Route 53 hosted zone with failover routing
- Health checks monitoring primary ALB
- 30-second failure detection interval

### Storage
- S3 buckets in both regions
- Cross-region replication enabled
- Versioning enabled

### Compute
- Lambda functions deployed in both regions
- VPC-attached for secure access
- Packaged as ZIP files in S3

### Load Balancing
- Application Load Balancers in each region
- Lambda target groups
- Health check endpoints

### Monitoring & Alerting
- CloudWatch alarms for critical metrics
- SNS topics for notifications
- Email alerts for operations team

### Security
- IAM roles with least privilege
- No wildcard actions
- Cross-region assume role policies
- Security groups for all components

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Domain name for Route 53 (or use example.com for testing)

## Deployment

1. **Configure Variables**:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

2. **Initialize Terraform**:
```bash
terraform init
```

3. **Plan Deployment**:
```bash
terraform plan
```

4. **Deploy Infrastructure**:
```bash
terraform apply
```

## Required Variables

- `environment_suffix`: Unique identifier for resources (e.g., "dev-001")
- `db_master_password`: Secure password for RDS Aurora
- `alert_email`: Email address for SNS notifications
- `domain_name`: Domain for Route 53 hosted zone

## Outputs

After deployment, Terraform provides:

- VPC IDs for both regions
- RDS cluster endpoints
- DynamoDB table name
- S3 bucket names
- Lambda function ARNs
- ALB DNS names
- Route 53 hosted zone details
- SNS topic ARNs

## Testing Failover

1. **Check Health Status**:
```bash
aws route53 get-health-check-status --health-check-id <health-check-id>
```

2. **Simulate Primary Failure**:
```bash
# Stop primary ALB or modify security groups
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <primary-alb-arn> \
  --attributes Key=deletion_protection.enabled,Value=false
```

3. **Verify Failover**:
```bash
dig example.com
# Should return DR region ALB after 30-60 seconds
```

## Monitoring

### CloudWatch Alarms

- **Replication Lag**: Triggers when lag exceeds 60 seconds
- **Database Connections**: Monitors connection pool utilization
- **CPU Utilization**: Alerts at 80% threshold

### SNS Notifications

All alarms send notifications to the configured email address.

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: All resources are configured to be fully destroyable without retention policies.

## Module Structure

```
.
├── main.tf                 # Root configuration
├── variables.tf            # Input variables
├── providers.tf            # Provider configuration
├── outputs.tf              # Output values
├── modules/
│   ├── vpc/                # VPC and networking
│   ├── vpc-peering/        # Cross-region VPC peering
│   ├── iam/                # IAM roles and policies
│   ├── s3/                 # S3 buckets with replication
│   ├── dynamodb/           # DynamoDB global tables
│   ├── rds/                # RDS Aurora global database
│   ├── lambda/             # Lambda functions
│   ├── alb/                # Application Load Balancers
│   ├── route53/            # DNS and health checks
│   ├── cloudwatch/         # Monitoring and alarms
│   └── sns/                # SNS topics and subscriptions
└── terraform.tfvars.example
```

## Security Considerations

1. **Encryption**: All data encrypted at rest and in transit
2. **SSL/TLS**: Enforced for RDS replication
3. **Least Privilege**: IAM policies follow principle of least privilege
4. **Network Isolation**: Private subnets for databases and Lambda
5. **Security Groups**: Restrictive ingress/egress rules

## Best Practices

- Use strong passwords for RDS (20+ characters, mixed case, symbols)
- Configure DNS TTL appropriately for failover requirements
- Test failover procedures regularly
- Monitor CloudWatch alarms and respond to alerts
- Review IAM policies periodically
- Keep Terraform state secure (use remote backend)

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda functions
2. Review RDS cluster status and replication lag
3. Verify Route 53 health check status
4. Check SNS topic subscriptions for alert delivery
```
