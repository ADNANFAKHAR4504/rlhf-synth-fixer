# RDS Cross-Region DR with Automated Failover - Model Response

This is the initial implementation generated from the PROMPT.md requirements.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment type (test or prod)"
  type        = string
  default     = "test"
  validation {
    condition     = contains(["test", "prod"], var.environment)
    error_message = "Environment must be test or prod"
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "DR AWS region"
  type        = string
  default     = "us-west-2"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dr_vpc_cidr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "replication_lag_threshold" {
  description = "Replication lag threshold in seconds for failover"
  type        = number
  default     = 60
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}
```

## File: lib/providers.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-rds-dr"
    key            = "rds-dr/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
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
  alias  = "us-west-2"
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
# Get latest PostgreSQL engine version
data "aws_rds_engine_version" "postgresql" {
  engine = "postgres"
  latest = true
}

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  state = "available"
}

# Get availability zones for DR region
data "aws_availability_zones" "dr" {
  provider = aws.us-west-2
  state    = "available"
}
```

## File: lib/locals.tf

```hcl
locals {
  # Environment-specific sizing
  instance_class = var.environment == "prod" ? "db.r6g.large" : "db.t3.micro"
  multi_az      = var.environment == "prod" ? true : false

  # Monitoring settings
  enable_enhanced_monitoring = var.environment == "prod"
  monitoring_interval       = var.environment == "prod" ? 60 : 0

  # Backup settings
  backup_window      = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"

  # Common tags
  common_tags = {
    Project     = "RDS-DR"
    Environment = var.environment
    Suffix      = var.environment_suffix
  }
}
```

## File: lib/kms.tf

```hcl
# KMS key for primary region
resource "aws_kms_key" "primary" {
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-kms-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "primary" {
  name          = "alias/rds-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for DR region
resource "aws_kms_key" "dr" {
  provider                = aws.us-west-2
  description             = "KMS key for RDS encryption in DR region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-kms-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "dr" {
  provider      = aws.us-west-2
  name          = "alias/rds-dr-${var.environment_suffix}"
  target_key_id = aws_kms_key.dr.key_id
}
```

## File: lib/vpc-primary.tf

```hcl
# Primary VPC
resource "aws_vpc" "primary" {
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-vpc-${var.environment_suffix}"
    }
  )
}

# Primary subnets
resource "aws_subnet" "primary_private_1" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, 1)
  availability_zone = data.aws_availability_zones.primary.names[0]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-1-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "primary_private_2" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-2-${var.environment_suffix}"
    }
  )
}

# Primary DB subnet group
resource "aws_db_subnet_group" "primary" {
  name       = "rds-primary-subnet-group-${var.environment_suffix}"
  subnet_ids = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-subnet-group-${var.environment_suffix}"
    }
  )
}

# Primary security group
resource "aws_security_group" "primary_db" {
  name        = "rds-primary-sg-${var.environment_suffix}"
  description = "Security group for primary RDS instance"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.dr_vpc_cidr]
    description = "PostgreSQL access from VPCs"
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
      Name = "rds-primary-sg-${var.environment_suffix}"
    }
  )
}

# Primary route table
resource "aws_route_table" "primary_private" {
  vpc_id = aws_vpc.primary.id

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "primary_private_1" {
  subnet_id      = aws_subnet.primary_private_1.id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_private_2" {
  subnet_id      = aws_subnet.primary_private_2.id
  route_table_id = aws_route_table.primary_private.id
}
```

## File: lib/vpc-dr.tf

```hcl
# DR VPC
resource "aws_vpc" "dr" {
  provider             = aws.us-west-2
  cidr_block           = var.dr_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-vpc-${var.environment_suffix}"
    }
  )
}

# DR subnets
resource "aws_subnet" "dr_private_1" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.dr_vpc_cidr, 8, 1)
  availability_zone = data.aws_availability_zones.dr.names[0]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-1-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "dr_private_2" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.dr_vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.dr.names[1]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-2-${var.environment_suffix}"
    }
  )
}

# DR DB subnet group
resource "aws_db_subnet_group" "dr" {
  provider   = aws.us-west-2
  name       = "rds-dr-subnet-group-${var.environment_suffix}"
  subnet_ids = [aws_subnet.dr_private_1.id, aws_subnet.dr_private_2.id]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-subnet-group-${var.environment_suffix}"
    }
  )
}

# DR security group
resource "aws_security_group" "dr_db" {
  provider    = aws.us-west-2
  name        = "rds-dr-sg-${var.environment_suffix}"
  description = "Security group for DR RDS instance"
  vpc_id      = aws_vpc.dr.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.dr_vpc_cidr, var.primary_vpc_cidr]
    description = "PostgreSQL access from VPCs"
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
      Name = "rds-dr-sg-${var.environment_suffix}"
    }
  )
}

# DR route table
resource "aws_route_table" "dr_private" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.dr.id

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "dr_private_1" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.dr_private_1.id
  route_table_id = aws_route_table.dr_private.id
}

resource "aws_route_table_association" "dr_private_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.dr_private_2.id
  route_table_id = aws_route_table.dr_private.id
}
```

## File: lib/vpc-peering.tf

```hcl
# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_dr" {
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.dr.id
  peer_region = var.dr_region
  auto_accept = false

  tags = merge(
    local.common_tags,
    {
      Name = "rds-vpc-peering-${var.environment_suffix}"
    }
  )
}

# Accept VPC peering in DR region
resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.us-west-2
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-vpc-peering-accepter-${var.environment_suffix}"
    }
  )
}

# Route from primary to DR
resource "aws_route" "primary_to_dr" {
  route_table_id            = aws_route_table.primary_private.id
  destination_cidr_block    = var.dr_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

# Route from DR to primary
resource "aws_route" "dr_to_primary" {
  provider                  = aws.us-west-2
  route_table_id            = aws_route_table.dr_private.id
  destination_cidr_block    = var.primary_vpc_cidr
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

# Store password in Secrets Manager (primary region)
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-master-password-${var.environment_suffix}"
  description             = "RDS master password"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-master-password-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Replicate secret to DR region
resource "aws_secretsmanager_secret" "db_password_dr" {
  provider                = aws.us-west-2
  name                    = "rds-master-password-${var.environment_suffix}"
  description             = "RDS master password (DR replica)"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-master-password-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password_dr" {
  provider  = aws.us-west-2
  secret_id = aws_secretsmanager_secret.db_password_dr.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}
```

## File: lib/rds-parameter-groups.tf

```hcl
# Parameter group for primary
resource "aws_db_parameter_group" "primary" {
  name   = "rds-primary-params-${var.environment_suffix}"
  family = "postgres16"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-params-${var.environment_suffix}"
    }
  )
}

# Parameter group for DR
resource "aws_db_parameter_group" "dr" {
  provider = aws.us-west-2
  name     = "rds-dr-params-${var.environment_suffix}"
  family   = "postgres16"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-params-${var.environment_suffix}"
    }
  )
}
```

## File: lib/rds.tf

```hcl
# Primary RDS instance
resource "aws_db_instance" "primary" {
  identifier     = "rds-primary-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = data.aws_rds_engine_version.postgresql.version
  instance_class = local.instance_class

  allocated_storage     = var.environment == "prod" ? 100 : 20
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.primary.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.primary_db.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  parameter_group_name   = aws_db_parameter_group.primary.name

  multi_az               = local.multi_az
  backup_retention_period = var.backup_retention_period
  backup_window          = local.backup_window
  maintenance_window     = local.maintenance_window

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "prod"
  performance_insights_kms_key_id = var.environment == "prod" ? aws_kms_key.primary.arn : null

  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-${var.environment_suffix}"
      Role = "primary"
    }
  )
}

# DR Read Replica
resource "aws_db_instance" "dr_replica" {
  provider           = aws.us-west-2
  identifier         = "rds-dr-replica-${var.environment_suffix}"
  replicate_source_db = aws_db_instance.primary.arn

  instance_class = local.instance_class
  storage_encrypted = true
  kms_key_id        = aws_kms_key.dr.arn

  vpc_security_group_ids = [aws_security_group.dr_db.id]
  parameter_group_name   = aws_db_parameter_group.dr.name

  multi_az = false  # Read replicas cannot be multi-AZ

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "prod"
  performance_insights_kms_key_id = var.environment == "prod" ? aws_kms_key.dr.arn : null

  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-replica-${var.environment_suffix}"
      Role = "replica"
    }
  )
}
```

## File: lib/iam.tf

```hcl
# IAM role for Lambda
resource "aws_iam_role" "lambda_failover" {
  name = "lambda-rds-failover-${var.environment_suffix}"

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
    local.common_tags,
    {
      Name = "lambda-rds-failover-${var.environment_suffix}"
    }
  )
}

# IAM policy for Lambda
resource "aws_iam_role_policy" "lambda_failover" {
  name = "lambda-rds-failover-policy"
  role = aws_iam_role.lambda_failover.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:PromoteReadReplica",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
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
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.db_password_dr.arn
        ]
      }
    ]
  })
}
```

## File: lib/lambda/failover_monitor.py

```python
import json
import boto3
import os
from datetime import datetime, timedelta

# Initialize clients
cloudwatch = boto3.client('cloudwatch')
rds = boto3.client('rds')

REPLICATION_LAG_THRESHOLD = int(os.environ.get('REPLICATION_LAG_THRESHOLD', 60))
DR_REPLICA_ID = os.environ['DR_REPLICA_ID']
DR_REGION = os.environ['DR_REGION']

def get_replication_lag(db_instance_id, region):
    """Get replication lag from CloudWatch metrics"""
    cw_client = boto3.client('cloudwatch', region_name=region)

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)

    try:
        response = cw_client.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {
                    'Name': 'DBInstanceIdentifier',
                    'Value': db_instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get most recent datapoint
            latest = sorted(response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            return latest['Average']

        return None

    except Exception as e:
        print(f"Error getting replication lag: {str(e)}")
        return None

def promote_replica(db_instance_id, region):
    """Promote read replica to standalone instance"""
    rds_client = boto3.client('rds', region_name=region)

    try:
        print(f"Promoting replica {db_instance_id} in {region}")

        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=db_instance_id
        )

        print(f"Promotion initiated: {json.dumps(response, default=str)}")
        return True

    except Exception as e:
        print(f"Error promoting replica: {str(e)}")
        return False

def lambda_handler(event, context):
    """Monitor replication lag and trigger failover if needed"""

    print(f"Checking replication lag for {DR_REPLICA_ID} in {DR_REGION}")

    # Get current replication lag
    lag = get_replication_lag(DR_REPLICA_ID, DR_REGION)

    if lag is None:
        print("Unable to retrieve replication lag")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'no_data',
                'message': 'Unable to retrieve replication lag'
            })
        }

    print(f"Current replication lag: {lag} seconds (threshold: {REPLICATION_LAG_THRESHOLD})")

    # Check if lag exceeds threshold
    if lag > REPLICATION_LAG_THRESHOLD:
        print(f"Replication lag ({lag}s) exceeds threshold ({REPLICATION_LAG_THRESHOLD}s)")

        # Promote replica
        success = promote_replica(DR_REPLICA_ID, DR_REGION)

        if success:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'failover_initiated',
                    'lag': lag,
                    'threshold': REPLICATION_LAG_THRESHOLD,
                    'message': f'Replica promotion initiated for {DR_REPLICA_ID}'
                })
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'status': 'failover_failed',
                    'lag': lag,
                    'message': 'Failed to promote replica'
                })
            }
    else:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'lag': lag,
                'threshold': REPLICATION_LAG_THRESHOLD,
                'message': 'Replication lag within acceptable range'
            })
        }
```

## File: lib/lambda.tf

```hcl
# Lambda function for failover monitoring
resource "aws_lambda_function" "failover_monitor" {
  filename      = "lambda_failover_monitor.zip"
  function_name = "rds-failover-monitor-${var.environment_suffix}"
  role          = aws_iam_role.lambda_failover.arn
  handler       = "failover_monitor.lambda_handler"
  runtime       = "python3.11"

  environment {
    variables = {
      REPLICATION_LAG_THRESHOLD = var.replication_lag_threshold
      DR_REPLICA_ID             = aws_db_instance.dr_replica.identifier
      DR_REGION                 = var.dr_region
    }
  }

  timeout = 60

  tags = merge(
    local.common_tags,
    {
      Name = "rds-failover-monitor-${var.environment_suffix}"
    }
  )
}

# CloudWatch Event Rule to trigger Lambda every 5 minutes
resource "aws_cloudwatch_event_rule" "failover_check" {
  name                = "rds-failover-check-${var.environment_suffix}"
  description         = "Trigger RDS failover check every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = merge(
    local.common_tags,
    {
      Name = "rds-failover-check-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_event_target" "failover_check" {
  rule      = aws_cloudwatch_event_rule.failover_check.name
  target_id = "lambda"
  arn       = aws_lambda_function.failover_monitor.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_check.arn
}
```

## File: lib/cloudwatch.tf

```hcl
# SNS topic for alarms
resource "aws_sns_topic" "rds_alerts" {
  name = "rds-alerts-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "rds-alerts-${var.environment_suffix}"
    }
  )
}

# Primary DB CPU alarm
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  alarm_name          = "rds-primary-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Primary RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-cpu-${var.environment_suffix}"
    }
  )
}

# Primary DB connections alarm
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  alarm_name          = "rds-primary-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Primary RDS database connections"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-connections-${var.environment_suffix}"
    }
  )
}

# DR Replica lag alarm
resource "aws_cloudwatch_metric_alarm" "dr_replica_lag" {
  provider            = aws.us-west-2
  alarm_name          = "rds-dr-replica-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "DR replica replication lag"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr_replica.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-replica-lag-${var.environment_suffix}"
    }
  )
}

# DR Replica CPU alarm
resource "aws_cloudwatch_metric_alarm" "dr_cpu" {
  provider            = aws.us-west-2
  alarm_name          = "rds-dr-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "DR RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr_replica.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-cpu-${var.environment_suffix}"
    }
  )
}
```

## File: lib/outputs.tf

```hcl
output "primary_endpoint" {
  description = "Primary RDS endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "dr_replica_endpoint" {
  description = "DR replica endpoint"
  value       = aws_db_instance.dr_replica.endpoint
}

output "primary_arn" {
  description = "Primary RDS ARN"
  value       = aws_db_instance.primary.arn
}

output "dr_replica_arn" {
  description = "DR replica ARN"
  value       = aws_db_instance.dr_replica.arn
}

output "kms_key_primary" {
  description = "KMS key ID for primary region"
  value       = aws_kms_key.primary.id
}

output "kms_key_dr" {
  description = "KMS key ID for DR region"
  value       = aws_kms_key.dr.id
}

output "lambda_function_name" {
  description = "Lambda function name for failover monitoring"
  value       = aws_lambda_function.failover_monitor.function_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.rds_alerts.arn
}

output "vpc_peering_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.primary_to_dr.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}
```

## File: lib/terraform.tfvars.example

```hcl
environment_suffix = "dev-001"
environment        = "test"

primary_region = "us-east-1"
dr_region      = "us-west-2"

primary_vpc_cidr = "10.0.0.0/16"
dr_vpc_cidr      = "10.1.0.0/16"

db_name     = "appdb"
db_username = "dbadmin"

replication_lag_threshold = 60
backup_retention_period   = 7
```
