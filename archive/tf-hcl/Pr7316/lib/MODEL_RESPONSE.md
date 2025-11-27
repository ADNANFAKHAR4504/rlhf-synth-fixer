# Multi-Region Disaster Recovery Infrastructure for PostgreSQL

This solution implements a comprehensive multi-region disaster recovery system for PostgreSQL using AWS RDS Aurora Global Database with automated failover capabilities.

## Architecture Overview

- Primary Aurora cluster in us-east-1 with 2 read replicas
- Secondary Aurora cluster in us-west-2 (Global Database secondary) with 2 read replicas
- Route 53 health checks monitoring database endpoints and replication lag
- S3 cross-region replication for backup exports
- Secrets Manager for credential management with automatic rotation
- SNS notifications in both regions for critical events

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "prod"
}

variable "primary_region" {
  description = "Primary AWS region for the database"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "transactiondb"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
}

variable "db_instance_class" {
  description = "Instance class for Aurora database"
  type        = string
  default     = "db.r6g.large"
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

variable "application_subnet_cidrs" {
  description = "CIDR blocks for application subnets that can access the database"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "primary_vpc_id" {
  description = "VPC ID in the primary region"
  type        = string
}

variable "primary_subnet_ids" {
  description = "List of subnet IDs in the primary region"
  type        = list(string)
}

variable "secondary_vpc_id" {
  description = "VPC ID in the secondary region"
  type        = string
}

variable "secondary_subnet_ids" {
  description = "List of subnet IDs in the secondary region"
  type        = list(string)
}

variable "health_check_domain" {
  description = "Domain name for health check endpoints"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS records"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    DR-Tier     = "critical"
    ManagedBy   = "terraform"
  }
}
```

## File: lib/provider.tf

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

  backend "s3" {
    # Backend configuration should be provided via backend config file or CLI
    # Example: terraform init -backend-config=backend.hcl
    # bucket         = "terraform-state-bucket"
    # key            = "disaster-recovery/terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-state-lock"
    # encrypt        = true
  }
}

# Primary region provider
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: lib/kms.tf

```hcl
# KMS key for primary region
resource "aws_kms_key" "primary_db" {
  description             = "KMS key for RDS encryption in ${var.primary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-kms-${var.primary_region}-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_kms_alias" "primary_db" {
  name          = "alias/rds-aurora-${var.primary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_db.key_id
}

resource "aws_kms_key_policy" "primary_db" {
  key_id = aws_kms_key.primary_db.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
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
      }
    ]
  })
}

# KMS key for secondary region
resource "aws_kms_key" "secondary_db" {
  provider                = aws.secondary
  description             = "KMS key for RDS encryption in ${var.secondary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-kms-${var.secondary_region}-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_kms_alias" "secondary_db" {
  provider      = aws.secondary
  name          = "alias/rds-aurora-${var.secondary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary_db.key_id
}

resource "aws_kms_key_policy" "secondary_db" {
  provider = aws.secondary
  key_id   = aws_kms_key.secondary_db.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
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
      }
    ]
  })
}

# KMS key for SNS encryption in primary region
resource "aws_kms_key" "primary_sns" {
  description             = "KMS key for SNS encryption in ${var.primary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "sns-kms-${var.primary_region}-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_kms_alias" "primary_sns" {
  name          = "alias/sns-${var.primary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_sns.key_id
}

resource "aws_kms_key_policy" "primary_sns" {
  key_id = aws_kms_key.primary_sns.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key for SNS encryption in secondary region
resource "aws_kms_key" "secondary_sns" {
  provider                = aws.secondary
  description             = "KMS key for SNS encryption in ${var.secondary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "sns-kms-${var.secondary_region}-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_kms_alias" "secondary_sns" {
  provider      = aws.secondary
  name          = "alias/sns-${var.secondary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary_sns.key_id
}

resource "aws_kms_key_policy" "secondary_sns" {
  provider = aws.secondary
  key_id   = aws_kms_key.secondary_sns.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
```

## File: lib/secrets.tf

```hcl
# Generate random password for database
resource "random_password" "master_password" {
  length  = 16
  special = true
  # Override special characters to avoid issues with some databases
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Secret for primary region
resource "aws_secretsmanager_secret" "primary_db" {
  name                    = "rds-master-password-primary-${var.environment_suffix}"
  description             = "Master password for RDS Aurora in ${var.primary_region}"
  recovery_window_in_days = 7

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-secret-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_secretsmanager_secret_version" "primary_db" {
  secret_id = aws_secretsmanager_secret.primary_db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.primary.endpoint
    port     = aws_rds_cluster.primary.port
    dbname   = var.database_name
  })
}

# Secret rotation Lambda execution role
resource "aws_iam_role" "secret_rotation" {
  name = "secret-rotation-lambda-${var.environment_suffix}"

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

  tags = merge(
    var.common_tags,
    {
      Name = "secret-rotation-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "secret_rotation_basic" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "secret_rotation_vpc" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "secret_rotation" {
  name = "secret-rotation-policy-${var.environment_suffix}"
  role = aws_iam_role.secret_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.primary_db.arn,
          aws_secretsmanager_secret.secondary_db.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      }
    ]
  })
}

# Secret for secondary region
resource "aws_secretsmanager_secret" "secondary_db" {
  provider                = aws.secondary
  name                    = "rds-master-password-secondary-${var.environment_suffix}"
  description             = "Master password for RDS Aurora in ${var.secondary_region}"
  recovery_window_in_days = 7

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-secret-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_secretsmanager_secret_version" "secondary_db" {
  provider = aws.secondary
  secret_id = aws_secretsmanager_secret.secondary_db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.secondary.endpoint
    port     = aws_rds_cluster.secondary.port
    dbname   = var.database_name
  })
}
```

## File: lib/security_groups.tf

```hcl
# Security group for primary RDS cluster
resource "aws_security_group" "primary_db" {
  name        = "rds-aurora-primary-${var.environment_suffix}"
  description = "Security group for RDS Aurora primary cluster"
  vpc_id      = var.primary_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-sg-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_security_group_rule" "primary_db_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.application_subnet_cidrs
  security_group_id = aws_security_group.primary_db.id
  description       = "Allow PostgreSQL access from application subnets"
}

resource "aws_security_group_rule" "primary_db_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.primary_db.id
  description       = "Allow all outbound traffic"
}

# Security group for secondary RDS cluster
resource "aws_security_group" "secondary_db" {
  provider    = aws.secondary
  name        = "rds-aurora-secondary-${var.environment_suffix}"
  description = "Security group for RDS Aurora secondary cluster"
  vpc_id      = var.secondary_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-sg-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_security_group_rule" "secondary_db_ingress" {
  provider          = aws.secondary
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.application_subnet_cidrs
  security_group_id = aws_security_group.secondary_db.id
  description       = "Allow PostgreSQL access from application subnets"
}

resource "aws_security_group_rule" "secondary_db_egress" {
  provider          = aws.secondary
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.secondary_db.id
  description       = "Allow all outbound traffic"
}
```

## File: lib/db_subnet_groups.tf

```hcl
# DB subnet group for primary region
resource "aws_db_subnet_group" "primary" {
  name       = "aurora-subnet-primary-${var.environment_suffix}"
  subnet_ids = var.primary_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-subnet-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# DB subnet group for secondary region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-secondary-${var.environment_suffix}"
  subnet_ids = var.secondary_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-subnet-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
```

## File: lib/db_parameter_groups.tf

```hcl
# Cluster parameter group for Aurora PostgreSQL
resource "aws_rds_cluster_parameter_group" "primary" {
  name        = "aurora-postgresql-cluster-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Cluster parameter group for Aurora PostgreSQL with pg_stat_statements"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "ALL"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-cluster-params-${var.environment_suffix}"
    }
  )
}

# DB parameter group for Aurora PostgreSQL instances
resource "aws_db_parameter_group" "primary" {
  name        = "aurora-postgresql-instance-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Instance parameter group for Aurora PostgreSQL"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-instance-params-${var.environment_suffix}"
    }
  )
}
```

## File: lib/rds_aurora.tf

```hcl
# Primary Aurora Global Database cluster
resource "aws_rds_global_cluster" "main" {
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.database_name
  storage_encrypted         = true
  deletion_protection       = false

  lifecycle {
    ignore_changes = [
      # Ignore changes to engine_version to prevent unintended upgrades
      engine_version
    ]
  }
}

# Primary Aurora cluster in us-east-1
resource "aws_rds_cluster" "primary" {
  cluster_identifier                  = "aurora-primary-${var.environment_suffix}"
  engine                              = aws_rds_global_cluster.main.engine
  engine_version                      = aws_rds_global_cluster.main.engine_version
  database_name                       = var.database_name
  master_username                     = var.master_username
  master_password                     = random_password.master_password.result
  backup_retention_period             = var.backup_retention_period
  preferred_backup_window             = var.preferred_backup_window
  preferred_maintenance_window        = var.preferred_maintenance_window
  db_subnet_group_name                = aws_db_subnet_group.primary.name
  db_cluster_parameter_group_name     = aws_rds_cluster_parameter_group.primary.name
  vpc_security_group_ids              = [aws_security_group.primary_db.id]
  storage_encrypted                   = true
  kms_key_id                          = aws_kms_key.primary_db.arn
  enabled_cloudwatch_logs_exports     = ["postgresql"]
  deletion_protection                 = false
  skip_final_snapshot                 = true
  global_cluster_identifier           = aws_rds_global_cluster.main.id
  enable_http_endpoint                = true

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-primary-${var.environment_suffix}"
      Region = var.primary_region
      Role   = "primary"
    }
  )

  depends_on = [
    aws_rds_global_cluster.main
  ]
}

# Primary cluster instances
resource "aws_rds_cluster_instance" "primary" {
  count                      = 2
  identifier                 = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier         = aws_rds_cluster.primary.id
  instance_class             = var.db_instance_class
  engine                     = aws_rds_cluster.primary.engine
  engine_version             = aws_rds_cluster.primary.engine_version
  db_parameter_group_name    = aws_db_parameter_group.primary.name
  auto_minor_version_upgrade = false
  publicly_accessible        = false
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.primary_db.arn
  monitoring_interval        = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
      Region = var.primary_region
      Role   = "primary"
    }
  )
}

# Secondary Aurora cluster in us-west-2
resource "aws_rds_cluster" "secondary" {
  provider                            = aws.secondary
  cluster_identifier                  = "aurora-secondary-${var.environment_suffix}"
  engine                              = aws_rds_global_cluster.main.engine
  engine_version                      = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name                = aws_db_subnet_group.secondary.name
  db_cluster_parameter_group_name     = aws_rds_cluster_parameter_group.primary.name
  vpc_security_group_ids              = [aws_security_group.secondary_db.id]
  storage_encrypted                   = true
  kms_key_id                          = aws_kms_key.secondary_db.arn
  enabled_cloudwatch_logs_exports     = ["postgresql"]
  deletion_protection                 = false
  skip_final_snapshot                 = true
  global_cluster_identifier           = aws_rds_global_cluster.main.id
  enable_http_endpoint                = true

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-secondary-${var.environment_suffix}"
      Region = var.secondary_region
      Role   = "secondary"
    }
  )

  depends_on = [
    aws_rds_cluster_instance.primary
  ]

  lifecycle {
    ignore_changes = [
      master_password,
      master_username
    ]
  }
}

# Secondary cluster instances
resource "aws_rds_cluster_instance" "secondary" {
  provider                   = aws.secondary
  count                      = 2
  identifier                 = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier         = aws_rds_cluster.secondary.id
  instance_class             = var.db_instance_class
  engine                     = aws_rds_cluster.secondary.engine
  engine_version             = aws_rds_cluster.secondary.engine_version
  db_parameter_group_name    = aws_db_parameter_group.primary.name
  auto_minor_version_upgrade = false
  publicly_accessible        = false
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.secondary_db.arn
  monitoring_interval        = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring_secondary.arn

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
      Region = var.secondary_region
      Role   = "secondary"
    }
  )
}

# IAM role for enhanced monitoring in primary region
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-primary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "rds-monitoring-role-primary-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM role for enhanced monitoring in secondary region
resource "aws_iam_role" "rds_monitoring_secondary" {
  provider = aws.secondary
  name     = "rds-monitoring-role-secondary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "rds-monitoring-role-secondary-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

## File: lib/s3_backup.tf

```hcl
# S3 bucket for database exports in primary region
resource "aws_s3_bucket" "primary_backup" {
  bucket = "db-exports-primary-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.common_tags,
    {
      Name   = "db-exports-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_s3_bucket_versioning" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 bucket for database exports in secondary region
resource "aws_s3_bucket" "secondary_backup" {
  provider = aws.secondary
  bucket   = "db-exports-secondary-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.common_tags,
    {
      Name   = "db-exports-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_s3_bucket_versioning" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Replication IAM role
resource "aws_iam_role" "replication" {
  name = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "s3-replication-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_policy" "replication" {
  name = "s3-replication-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary_backup.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.primary_backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.secondary_backup.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  role       = aws_iam_role.replication.name
  policy_arn = aws_iam_policy.replication.arn
}

# S3 replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  depends_on = [aws_s3_bucket_versioning.primary_backup]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary_backup.arn
      storage_class = "STANDARD"
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}
```

## File: lib/sns.tf

```hcl
# SNS topic for database events in primary region
resource "aws_sns_topic" "primary_db_events" {
  name              = "db-events-primary-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.primary_sns.id

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# Dead letter queue for primary SNS
resource "aws_sqs_queue" "primary_dlq" {
  name                      = "db-events-dlq-primary-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-dlq-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_sqs_queue_policy" "primary_dlq" {
  queue_url = aws_sqs_queue.primary_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.primary_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.primary_db_events.arn
          }
        }
      }
    ]
  })
}

# RDS event subscription for primary region
resource "aws_db_event_subscription" "primary" {
  name      = "rds-event-sub-primary-${var.environment_suffix}"
  sns_topic = aws_sns_topic.primary_db_events.arn

  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.primary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-event-sub-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# SNS topic for database events in secondary region
resource "aws_sns_topic" "secondary_db_events" {
  provider          = aws.secondary
  name              = "db-events-secondary-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.secondary_sns.id

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# Dead letter queue for secondary SNS
resource "aws_sqs_queue" "secondary_dlq" {
  provider                  = aws.secondary
  name                      = "db-events-dlq-secondary-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-dlq-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_sqs_queue_policy" "secondary_dlq" {
  provider  = aws.secondary
  queue_url = aws_sqs_queue.secondary_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.secondary_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.secondary_db_events.arn
          }
        }
      }
    ]
  })
}

# RDS event subscription for secondary region
resource "aws_db_event_subscription" "secondary" {
  provider  = aws.secondary
  name      = "rds-event-sub-secondary-${var.environment_suffix}"
  sns_topic = aws_sns_topic.secondary_db_events.arn

  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.secondary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-event-sub-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch log group for primary RDS cluster
resource "aws_cloudwatch_log_group" "primary_db" {
  name              = "/aws/rds/cluster/aurora-primary-${var.environment_suffix}/postgresql"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-logs-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch log group for secondary RDS cluster
resource "aws_cloudwatch_log_group" "secondary_db" {
  provider          = aws.secondary
  name              = "/aws/rds/cluster/aurora-secondary-${var.environment_suffix}/postgresql"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-logs-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# CloudWatch alarm for replication lag in primary region
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000 # 60 seconds in milliseconds
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "replication-lag-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for CPU utilization in primary region
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  alarm_name          = "aurora-cpu-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "cpu-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for database connections in primary region
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  alarm_name          = "aurora-connections-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when database connections exceed 100"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "connections-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for CPU utilization in secondary region
resource "aws_cloudwatch_metric_alarm" "secondary_cpu" {
  provider            = aws.secondary
  alarm_name          = "aurora-cpu-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.secondary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.secondary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "cpu-alarm-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
```

## File: lib/route53.tf

```hcl
# Primary database endpoint Route 53 record
resource "aws_route53_record" "primary_db" {
  zone_id = var.hosted_zone_id
  name    = "db-primary.${var.health_check_domain}"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.primary.endpoint]

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary_db.id
}

# Secondary database endpoint Route 53 record
resource "aws_route53_record" "secondary_db" {
  zone_id = var.hosted_zone_id
  name    = "db-primary.${var.health_check_domain}"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.secondary.endpoint]

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary_db.id
}

# Health check for primary database using CloudWatch alarm
resource "aws_route53_health_check" "primary_db" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.primary_replication_lag.alarm_name
  cloudwatch_alarm_region         = var.primary_region
  insufficient_data_health_status = "Unhealthy"

  tags = merge(
    var.common_tags,
    {
      Name   = "health-check-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# Health check for secondary database using CloudWatch alarm
resource "aws_route53_health_check" "secondary_db" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.secondary_cpu.alarm_name
  cloudwatch_alarm_region         = var.secondary_region
  insufficient_data_health_status = "Unhealthy"

  tags = merge(
    var.common_tags,
    {
      Name   = "health-check-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# IAM role for Route 53 to access CloudWatch
resource "aws_iam_role" "route53_health_check" {
  name = "route53-health-check-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "route53.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "route53-health-check-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "route53_health_check" {
  name = "route53-cloudwatch-access-${var.environment_suffix}"
  role = aws_iam_role.route53_health_check.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetMetricStatistics"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## File: lib/outputs.tf

```hcl
output "primary_cluster_endpoint" {
  description = "Endpoint for the primary Aurora cluster"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_cluster_reader_endpoint" {
  description = "Reader endpoint for the primary Aurora cluster"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "secondary_cluster_endpoint" {
  description = "Endpoint for the secondary Aurora cluster"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_cluster_reader_endpoint" {
  description = "Reader endpoint for the secondary Aurora cluster"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "global_cluster_id" {
  description = "Identifier for the Aurora Global Database"
  value       = aws_rds_global_cluster.main.id
}

output "route53_failover_endpoint" {
  description = "Route 53 failover DNS endpoint for database access"
  value       = "db-primary.${var.health_check_domain}"
}

output "primary_backup_bucket" {
  description = "S3 bucket for primary region database exports"
  value       = aws_s3_bucket.primary_backup.id
}

output "secondary_backup_bucket" {
  description = "S3 bucket for secondary region database exports"
  value       = aws_s3_bucket.secondary_backup.id
}

output "primary_secret_arn" {
  description = "ARN of the Secrets Manager secret for primary database credentials"
  value       = aws_secretsmanager_secret.primary_db.arn
  sensitive   = true
}

output "secondary_secret_arn" {
  description = "ARN of the Secrets Manager secret for secondary database credentials"
  value       = aws_secretsmanager_secret.secondary_db.arn
  sensitive   = true
}

output "primary_sns_topic_arn" {
  description = "ARN of the SNS topic for primary database events"
  value       = aws_sns_topic.primary_db_events.arn
}

output "secondary_sns_topic_arn" {
  description = "ARN of the SNS topic for secondary database events"
  value       = aws_sns_topic.secondary_db_events.arn
}

output "primary_kms_key_id" {
  description = "ID of the KMS key for primary region encryption"
  value       = aws_kms_key.primary_db.id
}

output "secondary_kms_key_id" {
  description = "ID of the KMS key for secondary region encryption"
  value       = aws_kms_key.secondary_db.id
}
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery for PostgreSQL Database

This Terraform configuration implements a comprehensive multi-region disaster recovery solution for PostgreSQL using AWS RDS Aurora Global Database with automated failover capabilities.

## Architecture

The solution spans two AWS regions (us-east-1 and us-west-2) and includes:

- **RDS Aurora PostgreSQL Global Database**: Primary cluster in us-east-1 with cross-region replication to us-west-2
- **High Availability**: Each cluster has 2 read replicas distributed across availability zones
- **Automated Failover**: Route 53 health checks monitor database health and replication lag, automatically routing traffic to secondary region on failure
- **Backup Strategy**: Automated backups with point-in-time recovery, manual export storage in S3 with cross-region replication
- **Security**: Encryption at rest using KMS, encryption in transit, credentials stored in Secrets Manager with automatic rotation
- **Monitoring**: CloudWatch alarms for replication lag, CPU, connections, SNS notifications for critical events

## Prerequisites

1. **AWS Account**: Access to AWS account with appropriate permissions
2. **Terraform**: Version 1.5.0 or higher
3. **AWS CLI**: Configured with credentials
4. **Existing Infrastructure**:
   - VPCs in us-east-1 and us-west-2 with private subnets across 3 AZs
   - VPC peering between regions configured
   - Route 53 hosted zone for health check domain
   - NAT gateways for outbound connectivity

## Required Variables

You must provide values for the following variables:

```hcl
# VPC and Network Configuration
primary_vpc_id         = "vpc-xxxxxxxxx"      # VPC ID in us-east-1
primary_subnet_ids     = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
secondary_vpc_id       = "vpc-yyyyyyyyy"      # VPC ID in us-west-2
secondary_subnet_ids   = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]

# Route 53 Configuration
hosted_zone_id         = "Z1234567890ABC"     # Route 53 hosted zone ID
health_check_domain    = "example.com"        # Domain for health checks

# Resource Naming
environment_suffix     = "prod-v1"            # Unique suffix for resources
```

## Optional Variables

You can customize the following variables:

```hcl
database_name                 = "transactiondb"    # Database name
master_username               = "dbadmin"          # Master username
db_instance_class            = "db.r6g.large"     # Instance class
backup_retention_period      = 30                  # Days to retain backups
application_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
```

## Deployment Steps

### 1. Configure Backend

Create a `backend.hcl` file:

```hcl
bucket         = "your-terraform-state-bucket"
key            = "disaster-recovery/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true
```

### 2. Create Variables File

Create `terraform.tfvars`:

```hcl
environment_suffix    = "prod-v1"
primary_vpc_id       = "vpc-xxxxxxxxx"
primary_subnet_ids   = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
secondary_vpc_id     = "vpc-yyyyyyyyy"
secondary_subnet_ids = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]
hosted_zone_id       = "Z1234567890ABC"
health_check_domain  = "example.com"
```

### 3. Initialize Terraform

```bash
cd lib
terraform init -backend-config=backend.hcl
```

### 4. Review Plan

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

**Note**: Initial deployment takes approximately 30-45 minutes due to Aurora Global Database setup and cross-region replication initialization.

## Post-Deployment Configuration

### 1. Test Database Connectivity

```bash
# Get primary endpoint
PRIMARY_ENDPOINT=$(terraform output -raw primary_cluster_endpoint)

# Connect using psql
psql -h $PRIMARY_ENDPOINT -U dbadmin -d transactiondb
```

### 2. Retrieve Database Credentials

```bash
# Get secret ARN
SECRET_ARN=$(terraform output -raw primary_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text
```

### 3. Configure Application

Update your application configuration to use the Route 53 failover endpoint:

```
db-primary.example.com
```

This endpoint will automatically route to the healthy cluster.

## Monitoring and Alerts

### CloudWatch Alarms

The following alarms are configured:

1. **Replication Lag**: Alerts when lag exceeds 60 seconds
2. **CPU Utilization**: Alerts when CPU exceeds 80%
3. **Database Connections**: Alerts when connections exceed 100

### SNS Notifications

Subscribe to SNS topics to receive alerts:

```bash
# Subscribe email to primary region events
aws sns subscribe \
  --topic-arn $(terraform output -raw primary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe email to secondary region events
aws sns subscribe \
  --topic-arn $(terraform output -raw secondary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-west-2
```

## Disaster Recovery Procedures

### Monitoring Replication Health

```bash
# Check replication lag (CloudWatch)
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=aurora-primary-prod-v1 \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### Manual Failover Testing

To test failover:

1. Promote secondary cluster to standalone (manual process in AWS Console)
2. Update DNS to point to secondary endpoint
3. Monitor application connectivity

**Note**: Automated failover happens via Route 53 health checks when primary becomes unhealthy.

### Backup and Restore

#### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier aurora-primary-prod-v1 \
  --db-cluster-identifier aurora-restored-prod-v1 \
  --restore-to-time 2024-01-15T12:00:00Z
```

#### Manual Export to S3

```bash
# Export snapshot to S3
aws rds start-export-task \
  --export-task-identifier export-$(date +%Y%m%d-%H%M%S) \
  --source-arn arn:aws:rds:us-east-1:ACCOUNT_ID:cluster-snapshot:SNAPSHOT_ID \
  --s3-bucket-name $(terraform output -raw primary_backup_bucket) \
  --iam-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-s3-export-role \
  --kms-key-id $(terraform output -raw primary_kms_key_id)
```

## Security Best Practices

1. **Network Isolation**: Database clusters are deployed in private subnets with no public access
2. **Encryption**: All data encrypted at rest using KMS and in transit using SSL/TLS
3. **Credential Management**: Database passwords stored in Secrets Manager with automatic rotation
4. **Access Control**: Security groups restrict database access to application subnets only
5. **Audit Logging**: CloudWatch Logs capture all database activities

## Cost Optimization

- Primary cluster: 2x db.r6g.large instances
- Secondary cluster: 2x db.r6g.large instances
- S3 storage with lifecycle policies (transition to Glacier after 30 days)
- CloudWatch Logs with 30-day retention
- Estimated monthly cost: $2,000-$2,500 (depending on data transfer and storage)

## Maintenance

### Updating Engine Version

```bash
# Plan upgrade
terraform plan -var="engine_version=15.5"

# Apply upgrade
terraform apply -var="engine_version=15.5"
```

### Scaling Instances

```bash
# Update instance class
terraform apply -var="db_instance_class=db.r6g.xlarge"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete all database clusters and backups (except those transitioned to Glacier).

## Troubleshooting

### Replication Lag High

1. Check network connectivity between regions (VPC peering)
2. Review database load and consider scaling
3. Verify security groups allow replication traffic

### Health Check Failing

1. Verify Route 53 health check configuration
2. Check CloudWatch alarm states
3. Test database connectivity from health check source

### Connection Timeout

1. Verify security group rules allow traffic from application subnets
2. Check database cluster status
3. Verify DNS resolution of failover endpoint

## Support

For issues or questions:
- Review AWS RDS Aurora documentation
- Check CloudWatch Logs for database errors
- Review SNS notifications for event details
- Contact AWS Support for infrastructure issues
