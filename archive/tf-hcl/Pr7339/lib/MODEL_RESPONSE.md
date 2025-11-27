# Multi-Region Disaster Recovery Solution for PostgreSQL

I'll provide a comprehensive Terraform HCL implementation for multi-region disaster recovery using Aurora PostgreSQL with automated failover capabilities.

## File: main.tf

```hcl
# Main Terraform configuration for multi-region DR
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "aurora-dr/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  region = var.primary_region
  alias  = "primary"
}

# Secondary region provider (us-west-2)
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}
```

## File: vpc.tf

```hcl
# VPC in primary region (us-east-1)
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name         = "vpc-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Subnets in primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name         = "subnet-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.primary_vpc_cidr, 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name         = "subnet-primary-public-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Internet Gateway for primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name         = "igw-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# VPC in secondary region (us-west-2)
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name         = "vpc-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Subnets in secondary region
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.secondary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name         = "subnet-secondary-private-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.secondary_vpc_cidr, 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name         = "subnet-secondary-public-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Internet Gateway for secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name         = "igw-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# NAT Gateways for primary region
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = 3
  domain   = "vpc"

  tags = {
    Name         = "eip-nat-primary-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 3
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = {
    Name         = "nat-primary-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Route tables for primary region
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name         = "rt-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}
```

## File: aurora.tf

```hcl
# KMS key for primary region
resource "aws_kms_key" "primary" {
  provider    = aws.primary
  description = "KMS key for Aurora encryption in primary region"

  tags = {
    Name         = "kms-aurora-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# KMS key for secondary region
resource "aws_kms_key" "secondary" {
  provider    = aws.secondary
  description = "KMS key for Aurora encryption in secondary region"

  tags = {
    Name         = "kms-aurora-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# DB subnet group for primary
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "aurora-subnet-group-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name         = "subnet-group-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# DB subnet group for secondary
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-group-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = {
    Name         = "subnet-group-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Security group for Aurora in primary
resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name        = "aurora-sg-primary-${var.environment_suffix}"
  description = "Security group for Aurora cluster in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = aws_subnet.primary_private[*].cidr_block
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name         = "sg-aurora-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Security group for Aurora in secondary
resource "aws_security_group" "aurora_secondary" {
  provider    = aws.secondary
  name        = "aurora-sg-secondary-${var.environment_suffix}"
  description = "Security group for Aurora cluster in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = aws_subnet.secondary_private[*].cidr_block
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name         = "sg-aurora-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Parameter group with pg_stat_statements
resource "aws_rds_cluster_parameter_group" "aurora" {
  provider    = aws.primary
  name        = "aurora-pg-params-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Custom parameter group with pg_stat_statements enabled"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  tags = {
    Name         = "pg-params-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Aurora Global Database
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.database_name
  storage_encrypted         = true
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  master_username                 = var.db_username
  master_password                 = random_password.db_password.result
  database_name                   = var.database_name
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.aurora_primary.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  kms_key_id                      = aws_kms_key.primary.arn
  storage_encrypted               = true
  skip_final_snapshot             = true

  tags = {
    Name         = "aurora-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Primary Aurora instances
resource "aws_rds_cluster_instance" "primary" {
  provider             = aws.primary
  count                = 3
  identifier           = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = "aurora-postgresql"
  publicly_accessible  = false

  tags = {
    Name         = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Secondary Aurora Cluster
resource "aws_rds_cluster" "secondary" {
  provider                     = aws.secondary
  cluster_identifier           = "aurora-secondary-${var.environment_suffix}"
  engine                       = "aurora-postgresql"
  engine_version               = "15.4"
  global_cluster_identifier    = aws_rds_global_cluster.main.id
  db_subnet_group_name         = aws_db_subnet_group.secondary.name
  vpc_security_group_ids       = [aws_security_group.aurora_secondary.id]
  kms_key_id                   = aws_kms_key.secondary.arn
  storage_encrypted            = true
  skip_final_snapshot          = true

  depends_on = [aws_rds_cluster_instance.primary]

  tags = {
    Name         = "aurora-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Secondary Aurora instances
resource "aws_rds_cluster_instance" "secondary" {
  provider             = aws.secondary
  count                = 3
  identifier           = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = "db.r6g.large"
  engine               = "aurora-postgresql"
  publicly_accessible  = false

  tags = {
    Name         = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}
```

## File: secrets.tf

```hcl
# Random password generation
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Secrets Manager secret for database password (primary)
resource "aws_secretsmanager_secret" "db_password_primary" {
  provider                = aws.primary
  name                    = "aurora-db-password-primary-${var.environment_suffix}"
  recovery_window_in_days = 0

  tags = {
    Name         = "secret-db-password-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.primary.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

# Secrets Manager secret for database password (secondary)
resource "aws_secretsmanager_secret" "db_password_secondary" {
  provider                = aws.secondary
  name                    = "aurora-db-password-secondary-${var.environment_suffix}"
  recovery_window_in_days = 0

  tags = {
    Name         = "secret-db-password-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_secretsmanager_secret_version" "db_password_secondary" {
  provider      = aws.secondary
  secret_id     = aws_secretsmanager_secret.db_password_secondary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.secondary.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

# Rotation configuration would be added here
```

## File: s3.tf

```hcl
# S3 bucket in primary region for database exports
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "aurora-backups-primary-${var.environment_suffix}"

  tags = {
    Name         = "s3-backups-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

# S3 bucket in secondary region for replication
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "aurora-backups-secondary-${var.environment_suffix}"

  tags = {
    Name         = "s3-backups-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

# IAM role for replication
resource "aws_iam_role" "replication" {
  provider = aws.primary
  name     = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = {
    Name         = "iam-role-replication-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

resource "aws_iam_role_policy" "replication" {
  provider = aws.primary
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# S3 replication configuration
resource "aws_s3_bucket_replication_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  role     = aws_iam_role.replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}
```

## File: route53.tf

```hcl
# Route 53 hosted zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  tags = {
    Name         = "route53-zone-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Health check for primary cluster
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = aws_rds_cluster.primary.endpoint
  port              = 5432
  type              = "TCP"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name         = "healthcheck-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Health check for secondary cluster
resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  fqdn              = aws_rds_cluster.secondary.endpoint
  port              = 5432
  type              = "TCP"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name         = "healthcheck-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Primary database DNS record with failover
resource "aws_route53_record" "primary" {
  provider        = aws.primary
  zone_id         = aws_route53_zone.main.zone_id
  name            = "db.${var.domain_name}"
  type            = "CNAME"
  ttl             = 60
  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  failover_routing_policy {
    type = "PRIMARY"
  }

  records = [aws_rds_cluster.primary.endpoint]
}

# Secondary database DNS record with failover
resource "aws_route53_record" "secondary" {
  provider       = aws.primary
  zone_id        = aws_route53_zone.main.zone_id
  name           = "db.${var.domain_name}"
  type           = "CNAME"
  ttl            = 60
  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  records = [aws_rds_cluster.secondary.endpoint]
}
```

## File: sns.tf

```hcl
# Dead Letter Queue for primary SNS
resource "aws_sqs_queue" "dlq_primary" {
  provider = aws.primary
  name     = "sns-dlq-primary-${var.environment_suffix}"

  message_retention_seconds = 1209600

  tags = {
    Name         = "sqs-dlq-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# SNS topic for primary region
resource "aws_sns_topic" "primary" {
  provider = aws.primary
  name     = "aurora-events-primary-${var.environment_suffix}"

  tags = {
    Name         = "sns-events-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# SNS topic subscription with DLQ
resource "aws_sns_topic_subscription" "primary" {
  provider               = aws.primary
  topic_arn              = aws_sns_topic.primary.arn
  protocol               = "sqs"
  endpoint               = aws_sqs_queue.dlq_primary.arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq_primary.arn
  })
}

# RDS event subscription for primary
resource "aws_db_event_subscription" "primary" {
  provider    = aws.primary
  name        = "aurora-events-primary-${var.environment_suffix}"
  sns_topic   = aws_sns_topic.primary.arn
  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.primary.id]

  event_categories = [
    "failover",
    "failure",
    "notification"
  ]

  tags = {
    Name         = "event-sub-primary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# Dead Letter Queue for secondary SNS
resource "aws_sqs_queue" "dlq_secondary" {
  provider = aws.secondary
  name     = "sns-dlq-secondary-${var.environment_suffix}"

  message_retention_seconds = 1209600

  tags = {
    Name         = "sqs-dlq-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# SNS topic for secondary region
resource "aws_sns_topic" "secondary" {
  provider = aws.secondary
  name     = "aurora-events-secondary-${var.environment_suffix}"

  tags = {
    Name         = "sns-events-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}

# SNS topic subscription with DLQ
resource "aws_sns_topic_subscription" "secondary" {
  provider               = aws.secondary
  topic_arn              = aws_sns_topic.secondary.arn
  protocol               = "sqs"
  endpoint               = aws_sqs_queue.dlq_secondary.arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq_secondary.arn
  })
}

# RDS event subscription for secondary
resource "aws_db_event_subscription" "secondary" {
  provider    = aws.secondary
  name        = "aurora-events-secondary-${var.environment_suffix}"
  sns_topic   = aws_sns_topic.secondary.arn
  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.secondary.id]

  event_categories = [
    "failover",
    "failure",
    "notification"
  ]

  tags = {
    Name         = "event-sub-secondary-${var.environment_suffix}"
    Environment  = "production"
    DR-Tier      = "critical"
  }
}
```

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "transactiondb"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
}
```

## File: outputs.tf

```hcl
output "primary_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_cluster_reader_endpoint" {
  description = "Primary Aurora cluster reader endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "secondary_cluster_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_cluster_reader_endpoint" {
  description = "Secondary Aurora cluster reader endpoint"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "route53_failover_dns" {
  description = "Route 53 failover DNS name"
  value       = "db.${var.domain_name}"
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket for backups"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket" {
  description = "Secondary S3 bucket for backups"
  value       = aws_s3_bucket.secondary.id
}

output "primary_secret_arn" {
  description = "Primary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_primary.arn
}

output "secondary_secret_arn" {
  description = "Secondary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_secondary.arn
}
```
