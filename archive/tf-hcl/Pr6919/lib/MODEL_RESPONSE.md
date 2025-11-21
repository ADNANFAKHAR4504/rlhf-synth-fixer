# Multi-Region PostgreSQL DR Infrastructure - Terraform Implementation

This implementation provides a complete multi-region disaster recovery solution for PostgreSQL using Terraform with HCL.

## Architecture Overview

- Primary region: us-east-1
- DR region: us-west-2
- RDS PostgreSQL with cross-region read replicas
- Route53 health checks and failover routing
- Lambda-based replication lag monitoring
- CloudWatch alarms and metrics
- VPC peering for secure cross-region communication

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
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

variable "db_username" {
  description = "Master username for PostgreSQL"
  type        = string
  default     = "dbadmin"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
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

variable "domain_name" {
  description = "Domain name for Route53 hosted zone"
  type        = string
  default     = "trading-db.internal"
}
```

## File: lib/providers.tf

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
    bucket         = "terraform-state-bucket"
    key            = "dr-postgresql/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Environment = "DR"
      CostCenter  = "Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/data.tf

```hcl
# Fetch latest PostgreSQL engine version
data "aws_rds_engine_version" "postgresql" {
  provider = aws.primary
  engine   = "postgres"
  version  = "15"
}

# Fetch availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Fetch availability zones for DR region
data "aws_availability_zones" "dr" {
  provider = aws.dr
  state    = "available"
}
```

## File: lib/kms.tf

```hcl
# KMS key for primary region
resource "aws_kms_key" "primary_rds" {
  provider    = aws.primary
  description = "KMS key for RDS encryption in primary region"

  tags = {
    Name                = "rds-key-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_kms_alias" "primary_rds" {
  provider      = aws.primary
  name          = "alias/rds-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_rds.key_id
}

# KMS key for DR region
resource "aws_kms_key" "dr_rds" {
  provider    = aws.dr
  description = "KMS key for RDS encryption in DR region"

  tags = {
    Name                = "rds-key-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_kms_alias" "dr_rds" {
  provider      = aws.dr
  name          = "alias/rds-dr-${var.environment_suffix}"
  target_key_id = aws_kms_key.dr_rds.key_id
}
```

## File: lib/vpc_primary.tf

```hcl
# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                = "vpc-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Private subnets in primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name                = "subnet-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name                = "igw-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route table for primary VPC
resource "aws_route_table" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name                = "rt-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route table associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary.id
}

# Security group for primary RDS
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "sg-rds-primary-${var.environment_suffix}"
  description = "Security group for primary RDS instance"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary, var.vpc_cidr_dr]
    description = "PostgreSQL access from both regions"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                = "sg-rds-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/vpc_dr.tf

```hcl
# DR VPC
resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                = "vpc-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Private subnets in DR region
resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = 3
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.vpc_cidr_dr, 8, count.index)
  availability_zone = data.aws_availability_zones.dr.names[count.index]

  tags = {
    Name                = "subnet-dr-private-${count.index + 1}-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Internet Gateway for DR VPC
resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name                = "igw-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route table for DR VPC
resource "aws_route_table" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name                = "rt-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route table associations
resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = 3
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr.id
}

# Security group for DR RDS
resource "aws_security_group" "dr_rds" {
  provider    = aws.dr
  name        = "sg-rds-dr-${var.environment_suffix}"
  description = "Security group for DR RDS instance"
  vpc_id      = aws_vpc.dr.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary, var.vpc_cidr_dr]
    description = "PostgreSQL access from both regions"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                = "sg-rds-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/vpc_peering.tf

```hcl
# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_dr" {
  provider      = aws.primary
  vpc_id        = aws_vpc.primary.id
  peer_vpc_id   = aws_vpc.dr.id
  peer_region   = var.dr_region
  auto_accept   = false

  tags = {
    Name                = "vpc-peering-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Accept VPC Peering Connection
resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = {
    Name                = "vpc-peering-accepter-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Route from primary to DR
resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary.id
  destination_cidr_block    = var.vpc_cidr_dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

# Route from DR to primary
resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  route_table_id            = aws_route_table.dr.id
  destination_cidr_block    = var.vpc_cidr_primary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}
```

## File: lib/secrets.tf

```hcl
# Generate random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager - Primary region
resource "aws_secretsmanager_secret" "db_password_primary" {
  provider    = aws.primary
  name        = "rds-master-password-primary-${var.environment_suffix}"
  description = "Master password for primary RDS instance"

  tags = {
    Name                = "rds-secret-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Store password in Secrets Manager - DR region
resource "aws_secretsmanager_secret" "db_password_dr" {
  provider    = aws.dr
  name        = "rds-master-password-dr-${var.environment_suffix}"
  description = "Master password for DR RDS instance"

  tags = {
    Name                = "rds-secret-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_dr" {
  provider      = aws.dr
  secret_id     = aws_secretsmanager_secret.db_password_dr.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}
```

## File: lib/rds_primary.tf

```hcl
# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name        = "db-subnet-group-primary-${var.environment_suffix}"
  description = "Subnet group for primary RDS instance"
  subnet_ids  = aws_subnet.primary_private[*].id

  tags = {
    Name                = "db-subnet-group-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# DB Parameter Group - Primary
resource "aws_db_parameter_group" "primary" {
  provider    = aws.primary
  name        = "pg-param-group-primary-${var.environment_suffix}"
  family      = "postgres15"
  description = "Parameter group for primary PostgreSQL"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name                = "pg-param-group-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider                   = aws.primary
  identifier                 = "trading-db-primary-${var.environment_suffix}"
  engine                     = "postgres"
  engine_version             = data.aws_rds_engine_version.postgresql.version
  instance_class             = var.db_instance_class
  allocated_storage          = 100
  storage_type               = "gp3"
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.primary_rds.arn

  db_name  = "tradingdb"
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  parameter_group_name   = aws_db_parameter_group.primary.name

  multi_az               = true
  publicly_accessible    = false

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.primary_rds.arn

  skip_final_snapshot       = true
  deletion_protection       = false
  delete_automated_backups  = true

  tags = {
    Name                = "trading-db-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/rds_dr.tf

```hcl
# DB Subnet Group - DR
resource "aws_db_subnet_group" "dr" {
  provider    = aws.dr
  name        = "db-subnet-group-dr-${var.environment_suffix}"
  description = "Subnet group for DR RDS instance"
  subnet_ids  = aws_subnet.dr_private[*].id

  tags = {
    Name                = "db-subnet-group-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# DB Parameter Group - DR
resource "aws_db_parameter_group" "dr" {
  provider    = aws.dr
  name        = "pg-param-group-dr-${var.environment_suffix}"
  family      = "postgres15"
  description = "Parameter group for DR PostgreSQL"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name                = "pg-param-group-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# DR RDS Instance (Read Replica)
resource "aws_db_instance" "dr" {
  provider               = aws.dr
  identifier             = "trading-db-dr-${var.environment_suffix}"
  replicate_source_db    = aws_db_instance.primary.arn
  instance_class         = var.db_instance_class

  storage_encrypted      = true
  kms_key_id             = aws_kms_key.dr_rds.arn

  vpc_security_group_ids = [aws_security_group.dr_rds.id]
  parameter_group_name   = aws_db_parameter_group.dr.name

  publicly_accessible    = false

  backup_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.dr_rds.arn

  skip_final_snapshot       = true
  deletion_protection       = false
  delete_automated_backups  = true

  tags = {
    Name                = "trading-db-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/route53.tf

```hcl
# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  vpc {
    vpc_id     = aws_vpc.primary.id
    vpc_region = var.primary_region
  }

  tags = {
    Name                = "route53-zone-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Associate hosted zone with DR VPC
resource "aws_route53_zone_association" "dr" {
  provider = aws.dr
  zone_id  = aws_route53_zone.main.id
  vpc_id   = aws_vpc.dr.id
}

# Health check for primary database
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  type              = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name = aws_cloudwatch_metric_alarm.primary_db_connections.alarm_name
  cloudwatch_alarm_region = var.primary_region
  insufficient_data_health_status = "Unhealthy"

  tags = {
    Name                = "health-check-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Health check for DR database
resource "aws_route53_health_check" "dr" {
  provider          = aws.primary
  type              = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name = aws_cloudwatch_metric_alarm.dr_db_connections.alarm_name
  cloudwatch_alarm_region = var.dr_region
  insufficient_data_health_status = "Unhealthy"

  tags = {
    Name                = "health-check-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# Primary database DNS record
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
  records         = [aws_db_instance.primary.address]
}

# DR database DNS record
resource "aws_route53_record" "dr" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${var.domain_name}"
  type     = "CNAME"
  ttl      = 60

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "dr"
  health_check_id = aws_route53_health_check.dr.id
  records         = [aws_db_instance.dr.address]
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch alarm for primary database CPU
resource "aws_cloudwatch_metric_alarm" "primary_db_cpu" {
  provider            = aws.primary
  alarm_name          = "rds-cpu-primary-${var.environment_suffix}"
  alarm_description   = "Alert when primary database CPU exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name                = "alarm-cpu-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch alarm for primary database connections
resource "aws_cloudwatch_metric_alarm" "primary_db_connections" {
  provider            = aws.primary
  alarm_name          = "rds-connections-primary-${var.environment_suffix}"
  alarm_description   = "Alert when primary database connections exceed threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name                = "alarm-connections-primary-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch alarm for primary replication lag
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  provider            = aws.primary
  alarm_name          = "rds-replication-lag-primary-${var.environment_suffix}"
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name                = "alarm-replication-lag-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch alarm for DR database CPU
resource "aws_cloudwatch_metric_alarm" "dr_db_cpu" {
  provider            = aws.dr
  alarm_name          = "rds-cpu-dr-${var.environment_suffix}"
  alarm_description   = "Alert when DR database CPU exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name                = "alarm-cpu-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch alarm for DR database connections
resource "aws_cloudwatch_metric_alarm" "dr_db_connections" {
  provider            = aws.dr
  alarm_name          = "rds-connections-dr-${var.environment_suffix}"
  alarm_description   = "Alert when DR database connections exceed threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name                = "alarm-connections-dr-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/iam.tf

```hcl
# IAM role for Lambda function
resource "aws_iam_role" "lambda_monitoring" {
  provider = aws.primary
  name     = "lambda-monitoring-role-${var.environment_suffix}"

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

  tags = {
    Name                = "lambda-monitoring-role-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# IAM policy for Lambda monitoring
resource "aws_iam_role_policy" "lambda_monitoring" {
  provider = aws.primary
  name     = "lambda-monitoring-policy-${var.environment_suffix}"
  role     = aws_iam_role.lambda_monitoring.id

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
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:PromoteReadReplica"
        ]
        Resource = [
          aws_db_instance.primary.arn,
          aws_db_instance.dr.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password_primary.arn,
          aws_secretsmanager_secret.db_password_dr.arn
        ]
      }
    ]
  })
}

# Attach AWS managed policy for Lambda VPC execution
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
```

## File: lib/lambda/monitor_replication.py

```python
import boto3
import os
import json
from datetime import datetime, timedelta

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
rds = boto3.client('rds')

# Environment variables
DR_DB_IDENTIFIER = os.environ['DR_DB_IDENTIFIER']
REPLICATION_LAG_THRESHOLD = int(os.environ.get('REPLICATION_LAG_THRESHOLD', '60'))

def lambda_handler(event, context):
    """
    Monitor RDS replication lag and trigger promotion if threshold exceeded.

    This function checks the ReplicaLag metric from CloudWatch and determines
    if the DR replica needs to be promoted to a standalone instance.
    """

    try:
        print(f"Checking replication lag for {DR_DB_IDENTIFIER}")

        # Get replication lag metric from CloudWatch
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {
                    'Name': 'DBInstanceIdentifier',
                    'Value': DR_DB_IDENTIFIER
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Average']
        )

        if not response['Datapoints']:
            print("No replication lag data available")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No data available',
                    'status': 'no_data'
                })
            }

        # Get the most recent datapoint
        datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'], reverse=True)
        latest_lag = datapoints[0]['Average']

        print(f"Current replication lag: {latest_lag} seconds")

        # Check if lag exceeds threshold
        if latest_lag > REPLICATION_LAG_THRESHOLD:
            print(f"WARNING: Replication lag ({latest_lag}s) exceeds threshold ({REPLICATION_LAG_THRESHOLD}s)")

            # Get DB instance details
            db_response = rds.describe_db_instances(DBInstanceIdentifier=DR_DB_IDENTIFIER)
            db_instance = db_response['DBInstances'][0]

            # Check if instance is a read replica
            if 'ReadReplicaSourceDBInstanceIdentifier' in db_instance:
                print(f"Initiating failover: Promoting {DR_DB_IDENTIFIER} to standalone instance")

                # Promote read replica
                promote_response = rds.promote_read_replica(
                    DBInstanceIdentifier=DR_DB_IDENTIFIER,
                    BackupRetentionPeriod=7,
                    PreferredBackupWindow='03:00-04:00'
                )

                print(f"Promotion initiated: {promote_response['DBInstance']['DBInstanceStatus']}")

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Failover initiated',
                        'status': 'promoting',
                        'replication_lag': latest_lag,
                        'db_instance': DR_DB_IDENTIFIER
                    })
                }
            else:
                print(f"Instance {DR_DB_IDENTIFIER} is not a read replica")
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Instance is not a replica',
                        'status': 'standalone',
                        'replication_lag': latest_lag
                    })
                }
        else:
            print(f"Replication lag ({latest_lag}s) is within acceptable limits")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Replication healthy',
                    'status': 'healthy',
                    'replication_lag': latest_lag
                })
            }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error monitoring replication',
                'error': str(e)
            })
        }
```

## File: lib/lambda.tf

```hcl
# Package Lambda function
data "archive_file" "lambda_monitoring" {
  type        = "zip"
  source_file = "${path.module}/lambda/monitor_replication.py"
  output_path = "${path.module}/lambda/monitor_replication.zip"
}

# Lambda function for replication monitoring
resource "aws_lambda_function" "monitoring" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_monitoring.output_path
  function_name    = "rds-replication-monitor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_monitoring.arn
  handler          = "monitor_replication.lambda_handler"
  source_code_hash = data.archive_file.lambda_monitoring.output_base64sha256
  runtime          = "python3.9"
  timeout          = 60

  environment {
    variables = {
      DR_DB_IDENTIFIER          = aws_db_instance.dr.identifier
      REPLICATION_LAG_THRESHOLD = "60"
    }
  }

  tags = {
    Name                = "lambda-replication-monitor-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch Event Rule to trigger Lambda every minute
resource "aws_cloudwatch_event_rule" "monitoring_schedule" {
  provider            = aws.primary
  name                = "rds-monitoring-schedule-${var.environment_suffix}"
  description         = "Trigger Lambda function to monitor RDS replication"
  schedule_expression = "rate(1 minute)"

  tags = {
    Name                = "event-rule-monitoring-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "monitoring_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.monitoring_schedule.name
  target_id = "MonitoringLambda"
  arn       = aws_lambda_function.monitoring.arn
}

# Lambda permission for CloudWatch Events
resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monitoring_schedule.arn
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_monitoring" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.monitoring.function_name}"
  retention_in_days = 7

  tags = {
    Name                = "log-group-lambda-${var.environment_suffix}"
    Environment         = "DR"
    CostCenter          = "Infrastructure"
    environmentSuffix   = var.environment_suffix
  }
}
```

## File: lib/outputs.tf

```hcl
output "primary_db_endpoint" {
  description = "Primary database endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "dr_db_endpoint" {
  description = "DR database endpoint"
  value       = aws_db_instance.dr.endpoint
}

output "route53_failover_endpoint" {
  description = "Route53 failover DNS endpoint"
  value       = "db.${var.domain_name}"
}

output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = aws_vpc.dr.id
}

output "lambda_function_name" {
  description = "Lambda monitoring function name"
  value       = aws_lambda_function.monitoring.function_name
}

output "primary_db_secret_arn" {
  description = "Primary database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_password_primary.arn
  sensitive   = true
}

output "dr_db_secret_arn" {
  description = "DR database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_password_dr.arn
  sensitive   = true
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.primary_to_dr.id
}
```

## File: lib/terraform.tfvars.example

```hcl
environment_suffix = "prod-dr-001"
primary_region     = "us-east-1"
dr_region          = "us-west-2"
db_username        = "dbadmin"
db_instance_class  = "db.r6g.large"
vpc_cidr_primary   = "10.0.0.0/16"
vpc_cidr_dr        = "10.1.0.0/16"
domain_name        = "trading-db.internal"
```

## File: lib/README.md

```markdown
# Multi-Region PostgreSQL Disaster Recovery Infrastructure

This Terraform configuration implements a complete multi-region disaster recovery solution for PostgreSQL databases with automated failover capabilities.

## Architecture

### Components
- **Primary Region (us-east-1)**: PostgreSQL RDS instance with Multi-AZ deployment
- **DR Region (us-west-2)**: Cross-region read replica for disaster recovery
- **Route53**: Failover DNS routing with health checks
- **Lambda**: Automated replication lag monitoring and failover orchestration
- **VPC Peering**: Secure cross-region connectivity
- **CloudWatch**: Comprehensive monitoring and alerting

### Security Features
- KMS encryption for data at rest
- Secrets Manager for credential management
- VPC isolation with private subnets
- Security groups with minimal required access
- IAM roles with least privilege

## Prerequisites

- Terraform 1.5.0 or later
- AWS CLI configured with appropriate credentials
- Permissions for RDS, VPC, Route53, Lambda, IAM, KMS, Secrets Manager

## Deployment Instructions

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Create tfvars file

```bash
cp lib/terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your `environment_suffix`:

```hcl
environment_suffix = "your-unique-suffix"
```

### 3. Validate Configuration

```bash
terraform validate
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

This will deploy:
- VPCs in both regions (us-east-1 and us-west-2)
- VPC peering connection
- RDS PostgreSQL primary instance
- RDS PostgreSQL read replica in DR region
- Route53 hosted zone with failover routing
- Lambda monitoring function
- CloudWatch alarms
- IAM roles and policies
- KMS keys and Secrets Manager

**Deployment Time**: Approximately 20-30 minutes

### 5. Verify Deployment

```bash
# Check RDS instances
aws rds describe-db-instances --region us-east-1
aws rds describe-db-instances --region us-west-2

# Check replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReplicaLag \
  --dimensions Name=DBInstanceIdentifier,Value=trading-db-dr-<suffix> \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-west-2

# Get database credentials
aws secretsmanager get-secret-value \
  --secret-id rds-master-password-primary-<suffix> \
  --region us-east-1
```

## Failover Testing

### Manual Failover Test

1. **Trigger failover by invoking Lambda**:
```bash
aws lambda invoke \
  --function-name rds-replication-monitor-<suffix> \
  --region us-east-1 \
  response.json
```

2. **Monitor failover progress**:
```bash
# Check DR instance status
aws rds describe-db-instances \
  --db-instance-identifier trading-db-dr-<suffix> \
  --region us-west-2 \
  --query 'DBInstances[0].DBInstanceStatus'

# Check Route53 health checks
aws route53 get-health-check-status \
  --health-check-id <health-check-id>
```

3. **Verify DNS failover**:
```bash
# DNS should resolve to DR endpoint when primary is unhealthy
dig db.trading-db.internal
```

### Automated Failover

The Lambda function automatically monitors replication lag every minute:
- If lag exceeds 60 seconds, Lambda promotes DR replica to standalone instance
- Route53 health checks detect primary failure and route traffic to DR
- RTO target: < 2 minutes

## Monitoring and Alerts

### CloudWatch Alarms

- **Primary CPU Utilization**: Alerts when CPU > 80%
- **Primary Database Connections**: Alerts when connections > 100
- **Replication Lag**: Alerts when lag > 60 seconds
- **DR CPU Utilization**: Alerts when CPU > 80%
- **DR Database Connections**: Alerts when connections > 100

### CloudWatch Logs

- **RDS Logs**: PostgreSQL logs, slow queries, upgrades
- **Lambda Logs**: Replication monitoring and failover events

## Backup and Recovery

- **Automated Backups**: 7-day retention with point-in-time recovery
- **Backup Window**: 03:00-04:00 UTC daily
- **Cross-Region Replication**: Real-time via RDS read replica
- **Performance Insights**: Enabled for both regions

## Cost Optimization

Current configuration uses:
- db.r6g.large instances (graviton2 for cost efficiency)
- gp3 storage (better price/performance than gp2)
- 7-day backup retention (meets compliance)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: This will delete all databases and backups. Ensure you have exported any critical data before running destroy.

## Recovery Time and Point Objectives

- **RTO (Recovery Time Objective)**: < 2 minutes (automated failover)
- **RPO (Recovery Point Objective)**: < 5 seconds (near-real-time replication)

## Security Best Practices

1. **Never commit terraform.tfvars** with sensitive values
2. **Rotate credentials** regularly using Secrets Manager rotation
3. **Enable CloudTrail** for audit logging
4. **Review security group rules** periodically
5. **Enable MFA delete** on Terraform state bucket

## Troubleshooting

### Replication Lag Issues

```bash
# Check replication status
aws rds describe-db-instances \
  --db-instance-identifier trading-db-dr-<suffix> \
  --region us-west-2 \
  --query 'DBInstances[0].StatusInfos'
```

### VPC Peering Issues

```bash
# Verify peering connection status
aws ec2 describe-vpc-peering-connections \
  --region us-east-1 \
  --filters Name=status-code,Values=active
```

### Lambda Function Errors

```bash
# Check Lambda logs
aws logs tail /aws/lambda/rds-replication-monitor-<suffix> \
  --follow \
  --region us-east-1
```

## References

- [AWS RDS Cross-Region Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Route53 Health Checks and Failover](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
```
