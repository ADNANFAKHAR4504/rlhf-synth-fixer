# Infrastructure as Code Solution

## Terraform Configuration Files


### outputs.tf

```hcl
# VPC Outputs
output "vpc_primary_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "public_subnet_ids_primary" {
  description = "IDs of the public subnets in primary region"
  value       = aws_subnet.public_primary[*].id
}

output "private_subnet_ids_primary" {
  description = "IDs of the private subnets in primary region"
  value       = aws_subnet.private_primary[*].id
}

output "public_subnet_ids_secondary" {
  description = "IDs of the public subnets in secondary region"
  value       = aws_subnet.public_secondary[*].id
}

output "private_subnet_ids_secondary" {
  description = "IDs of the private subnets in secondary region"
  value       = aws_subnet.private_secondary[*].id
}

# KMS Key Outputs
output "kms_key_primary_id" {
  description = "ID of the KMS key in primary region"
  value       = aws_kms_key.financial_app_primary.id
}

output "kms_key_secondary_id" {
  description = "ID of the KMS key in secondary region"
  value       = aws_kms_key.financial_app_secondary.id
}

output "kms_key_primary_arn" {
  description = "ARN of the KMS key in primary region"
  value       = aws_kms_key.financial_app_primary.arn
}

output "kms_key_secondary_arn" {
  description = "ARN of the KMS key in secondary region"
  value       = aws_kms_key.financial_app_secondary.arn
}

# IAM Role Outputs
output "financial_app_role_arn" {
  description = "ARN of the financial app IAM role"
  value       = aws_iam_role.financial_app_role.arn
}

output "financial_app_instance_profile_name" {
  description = "Name of the financial app instance profile"
  value       = aws_iam_instance_profile.financial_app_profile.name
}

# Security Group Outputs
output "security_group_primary_id" {
  description = "ID of the security group in primary region"
  value       = aws_security_group.financial_app_primary.id
}

output "security_group_secondary_id" {
  description = "ID of the security group in secondary region"
  value       = aws_security_group.financial_app_secondary.id
}

# CloudWatch Log Group Outputs
output "log_group_primary_name" {
  description = "Name of the CloudWatch log group in primary region"
  value       = aws_cloudwatch_log_group.financial_app_primary.name
}

output "log_group_secondary_name" {
  description = "Name of the CloudWatch log group in secondary region"
  value       = aws_cloudwatch_log_group.financial_app_secondary.name
}

# SNS Topic Outputs
output "sns_topic_primary_arn" {
  description = "ARN of the SNS topic in primary region"
  value       = aws_sns_topic.alerts_primary.arn
}

output "sns_topic_secondary_arn" {
  description = "ARN of the SNS topic in secondary region"
  value       = aws_sns_topic.alerts_secondary.arn
}

# Region Information
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

# Environment and Naming Outputs
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

output "name_prefix" {
  description = "Name prefix used for all resources"
  value       = local.name_prefix
}

# Random suffix for verification
output "random_suffix" {
  description = "Random suffix for unique resource naming"
  value       = random_string.suffix.result
}

# Internet Gateway Outputs
output "igw_primary_id" {
  description = "ID of the internet gateway in primary region"
  value       = aws_internet_gateway.primary.id
}

output "igw_secondary_id" {
  description = "ID of the internet gateway in secondary region"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "nat_gateway_primary_ids" {
  description = "IDs of NAT gateways in primary region"
  value       = aws_nat_gateway.primary[*].id
}

output "nat_gateway_secondary_ids" {
  description = "IDs of NAT gateways in secondary region"
  value       = aws_nat_gateway.secondary[*].id
}

# Route Table Outputs
output "public_route_table_primary_id" {
  description = "ID of public route table in primary region"
  value       = aws_route_table.public_primary.id
}

output "private_route_table_primary_ids" {
  description = "IDs of private route tables in primary region"
  value       = aws_route_table.private_primary[*].id
}

output "public_route_table_secondary_id" {
  description = "ID of public route table in secondary region"
  value       = aws_route_table.public_secondary.id
}

output "private_route_table_secondary_ids" {
  description = "IDs of private route tables in secondary region"
  value       = aws_route_table.private_secondary[*].id
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_primary_name" {
  description = "Name of CloudWatch alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.high_cpu_primary.alarm_name
}

output "cloudwatch_alarm_secondary_name" {
  description = "Name of CloudWatch alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.high_cpu_secondary.alarm_name
}

# KMS Alias Outputs
output "kms_alias_primary_name" {
  description = "Name of KMS alias in primary region"
  value       = aws_kms_alias.financial_app_primary.name
}

output "kms_alias_secondary_name" {
  description = "Name of KMS alias in secondary region"
  value       = aws_kms_alias.financial_app_secondary.name
}

# Application Monitoring Outputs
output "app_metrics_log_group_primary" {
  description = "Application metrics log group in primary region"
  value       = aws_cloudwatch_log_group.app_metrics_primary.name
}

output "app_metrics_log_group_secondary" {
  description = "Application metrics log group in secondary region"
  value       = aws_cloudwatch_log_group.app_metrics_secondary.name
}

# Monitoring Alarm Outputs
output "app_response_time_alarm_primary" {
  description = "Application response time alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_response_time_primary.alarm_name
}

output "app_response_time_alarm_secondary" {
  description = "Application response time alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_response_time_secondary.alarm_name
}

output "app_error_rate_alarm_primary" {
  description = "Application error rate alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_error_rate_primary.alarm_name
}

output "app_error_rate_alarm_secondary" {
  description = "Application error rate alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_error_rate_secondary.alarm_name
}

output "transaction_volume_alarm_primary" {
  description = "Transaction volume alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.transaction_volume_primary.alarm_name
}

output "transaction_volume_alarm_secondary" {
  description = "Transaction volume alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.transaction_volume_secondary.alarm_name
}

output "memory_utilization_alarm_primary" {
  description = "Memory utilization alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.memory_utilization_primary.alarm_name
}

output "memory_utilization_alarm_secondary" {
  description = "Memory utilization alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.memory_utilization_secondary.alarm_name
}

output "app_health_check_alarm_primary" {
  description = "Application health check alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_health_check_primary.alarm_name
}

output "app_health_check_alarm_secondary" {
  description = "Application health check alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_health_check_secondary.alarm_name
}
```


### provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = local.environment_suffix
      Project     = "financial-app"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary region provider for multi-region setup
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = local.environment_suffix
      Project     = "financial-app"
      ManagedBy   = "terraform"
    }
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region setup"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Random string for unique resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Local values for consistent naming
locals {
  environment_suffix = var.environment_suffix
  name_prefix        = "financial-app-${local.environment_suffix}-${random_string.suffix.result}"
}
```


### tap_stack.tf

```hcl
# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# KMS Keys for encryption
resource "aws_kms_key" "financial_app_primary" {
  provider                = aws.primary
  description             = "KMS key for financial app encryption - primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

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
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.primary_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${local.name_prefix}-kms-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_kms_key" "financial_app_secondary" {
  provider                = aws.secondary
  description             = "KMS key for financial app encryption - secondary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

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
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.secondary_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${local.name_prefix}-kms-secondary"
    Environment = local.environment_suffix
  }
}

resource "aws_kms_alias" "financial_app_primary" {
  provider      = aws.primary
  name          = "alias/${local.name_prefix}-primary"
  target_key_id = aws_kms_key.financial_app_primary.key_id
}

resource "aws_kms_alias" "financial_app_secondary" {
  provider      = aws.secondary
  name          = "alias/${local.name_prefix}-secondary"
  target_key_id = aws_kms_key.financial_app_secondary.key_id
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.name_prefix}-vpc-primary"
    Environment = local.environment_suffix
  }
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.name_prefix}-vpc-secondary"
    Environment = local.environment_suffix
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name        = "${local.name_prefix}-igw-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name        = "${local.name_prefix}-igw-secondary"
    Environment = local.environment_suffix
  }
}

# Public Subnets - Primary Region
resource "aws_subnet" "public_primary" {
  count                   = 2
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.name_prefix}-public-subnet-primary-${count.index + 1}"
    Type        = "public"
    Environment = local.environment_suffix
  }
}

# Private Subnets - Primary Region
resource "aws_subnet" "private_primary" {
  count             = 2
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name        = "${local.name_prefix}-private-subnet-primary-${count.index + 1}"
    Type        = "private"
    Environment = local.environment_suffix
  }
}

# Public Subnets - Secondary Region
resource "aws_subnet" "public_secondary" {
  count                   = 2
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.name_prefix}-public-subnet-secondary-${count.index + 1}"
    Type        = "public"
    Environment = local.environment_suffix
  }
}

# Private Subnets - Secondary Region
resource "aws_subnet" "private_secondary" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name        = "${local.name_prefix}-private-subnet-secondary-${count.index + 1}"
    Type        = "private"
    Environment = local.environment_suffix
  }
}

# NAT Gateways for private subnets (optimized for cost - 1 per region)
resource "aws_eip" "nat_primary" {
  count    = 1
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name        = "${local.name_prefix}-nat-eip-primary-${count.index + 1}"
    Environment = local.environment_suffix
  }
}

resource "aws_eip" "nat_secondary" {
  count    = 1
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name        = "${local.name_prefix}-nat-eip-secondary-${count.index + 1}"
    Environment = local.environment_suffix
  }
}

resource "aws_nat_gateway" "primary" {
  count         = 1
  provider      = aws.primary
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = {
    Name        = "${local.name_prefix}-nat-primary-${count.index + 1}"
    Environment = local.environment_suffix
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "secondary" {
  count         = 1
  provider      = aws.secondary
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = {
    Name        = "${local.name_prefix}-nat-secondary-${count.index + 1}"
    Environment = local.environment_suffix
  }

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Primary Region
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "${local.name_prefix}-public-rt-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_route_table" "private_primary" {
  count    = 2
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[0].id
  }

  tags = {
    Name        = "${local.name_prefix}-private-rt-primary-${count.index + 1}"
    Environment = local.environment_suffix
  }
}

# Route Tables - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name        = "${local.name_prefix}-public-rt-secondary"
    Environment = local.environment_suffix
  }
}

resource "aws_route_table" "private_secondary" {
  count    = 2
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[0].id
  }

  tags = {
    Name        = "${local.name_prefix}-private-rt-secondary-${count.index + 1}"
    Environment = local.environment_suffix
  }
}

# Route Table Associations - Primary Region
resource "aws_route_table_association" "public_primary" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# Route Table Associations - Secondary Region
resource "aws_route_table_association" "public_secondary" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# IAM Roles and Policies
resource "aws_iam_role" "financial_app_role" {
  name = "${local.name_prefix}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "lambda.amazonaws.com", "ecs-tasks.amazonaws.com"]
        }
      }
    ]
  })

  tags = {
    Name        = "${local.name_prefix}-role"
    Environment = local.environment_suffix
  }
}

resource "aws_iam_policy" "financial_app_policy" {
  name        = "${local.name_prefix}-policy"
  description = "Policy for financial app with minimal required permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.financial_app_primary.arn,
          aws_kms_key.financial_app_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/${local.name_prefix}/*",
          "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/${local.name_prefix}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "financial_app_policy_attachment" {
  role       = aws_iam_role.financial_app_role.name
  policy_arn = aws_iam_policy.financial_app_policy.arn
}

resource "aws_iam_instance_profile" "financial_app_profile" {
  name = "${local.name_prefix}-profile"
  role = aws_iam_role.financial_app_role.name
}

# CloudWatch Log Groups - Primary Region
resource "aws_cloudwatch_log_group" "financial_app_primary" {
  provider          = aws.primary
  name              = "/aws/${local.name_prefix}/primary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_primary.arn

  tags = {
    Name        = "${local.name_prefix}-logs-primary"
    Environment = local.environment_suffix
  }
}

# CloudWatch Log Groups - Secondary Region
resource "aws_cloudwatch_log_group" "financial_app_secondary" {
  provider          = aws.secondary
  name              = "/aws/${local.name_prefix}/secondary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_secondary.arn

  tags = {
    Name        = "${local.name_prefix}-logs-secondary"
    Environment = local.environment_suffix
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-high-cpu-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]

  tags = {
    Name        = "${local.name_prefix}-cpu-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-high-cpu-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  tags = {
    Name        = "${local.name_prefix}-cpu-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# SNS Topics for alerts
resource "aws_sns_topic" "alerts_primary" {
  provider          = aws.primary
  name              = "${local.name_prefix}-alerts-primary"
  kms_master_key_id = aws_kms_key.financial_app_primary.id

  tags = {
    Name        = "${local.name_prefix}-alerts-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_sns_topic" "alerts_secondary" {
  provider          = aws.secondary
  name              = "${local.name_prefix}-alerts-secondary"
  kms_master_key_id = aws_kms_key.financial_app_secondary.id

  tags = {
    Name        = "${local.name_prefix}-alerts-secondary"
    Environment = local.environment_suffix
  }
}

# Security Groups
resource "aws_security_group" "financial_app_primary" {
  provider    = aws.primary
  name        = "${local.name_prefix}-sg-primary"
  description = "Security group for financial app - primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "HTTPS access from private networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16", "172.16.0.0/12", "192.168.0.0/16"]
  }

  ingress {
    description = "HTTP access from VPC only (for health checks)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.name_prefix}-sg-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_security_group" "financial_app_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-sg-secondary"
  description = "Security group for financial app - secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTPS access from private networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16", "172.16.0.0/12", "192.168.0.0/16"]
  }

  ingress {
    description = "HTTP access from VPC only (for health checks)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.name_prefix}-sg-secondary"
    Environment = local.environment_suffix
  }
}

# Additional Application-Level Monitoring

# Custom CloudWatch Log Groups for Application Metrics
resource "aws_cloudwatch_log_group" "app_metrics_primary" {
  provider          = aws.primary
  name              = "/aws/${local.name_prefix}/application-metrics/primary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_primary.arn

  tags = {
    Name        = "${local.name_prefix}-app-metrics-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_log_group" "app_metrics_secondary" {
  provider          = aws.secondary
  name              = "/aws/${local.name_prefix}/application-metrics/secondary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_secondary.arn

  tags = {
    Name        = "${local.name_prefix}-app-metrics-secondary"
    Environment = local.environment_suffix
  }
}

# Application Performance Monitoring - Response Time
resource "aws_cloudwatch_metric_alarm" "app_response_time_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-app-response-time-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ResponseTime"
  namespace           = "Financial/Application"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000"
  alarm_description   = "This alarm monitors application response time"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-response-time-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "app_response_time_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-app-response-time-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ResponseTime"
  namespace           = "Financial/Application"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000"
  alarm_description   = "This alarm monitors application response time"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-response-time-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# Application Error Rate Monitoring
resource "aws_cloudwatch_metric_alarm" "app_error_rate_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-app-error-rate-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorRate"
  namespace           = "Financial/Application"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This alarm monitors application error rate percentage"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-error-rate-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "app_error_rate_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-app-error-rate-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorRate"
  namespace           = "Financial/Application"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This alarm monitors application error rate percentage"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-error-rate-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# Business Transaction Volume Monitoring
resource "aws_cloudwatch_metric_alarm" "transaction_volume_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-transaction-volume-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "TransactionVolume"
  namespace           = "Financial/Business"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This alarm monitors business transaction volume drop"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "breaching"

  tags = {
    Name        = "${local.name_prefix}-transaction-volume-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "transaction_volume_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-transaction-volume-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "TransactionVolume"
  namespace           = "Financial/Business"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This alarm monitors business transaction volume drop"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "breaching"

  tags = {
    Name        = "${local.name_prefix}-transaction-volume-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# Database Connection Pool Monitoring
resource "aws_cloudwatch_metric_alarm" "db_connection_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-db-connections-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "Financial/Database"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors database connection pool utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-db-connections-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connection_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-db-connections-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "Financial/Database"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors database connection pool utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-db-connections-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# Memory Utilization Monitoring
resource "aws_cloudwatch_metric_alarm" "memory_utilization_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-memory-utilization-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This alarm monitors memory utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-memory-utilization-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "memory_utilization_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-memory-utilization-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This alarm monitors memory utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${local.name_prefix}-memory-utilization-alarm-secondary"
    Environment = local.environment_suffix
  }
}

# Application Health Check Monitoring
resource "aws_cloudwatch_metric_alarm" "app_health_check_primary" {
  provider            = aws.primary
  alarm_name          = "${local.name_prefix}-app-health-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheck"
  namespace           = "Financial/Application"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This alarm monitors application health check status"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]
  treat_missing_data  = "breaching"

  tags = {
    Name        = "${local.name_prefix}-app-health-alarm-primary"
    Environment = local.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "app_health_check_secondary" {
  provider            = aws.secondary
  alarm_name          = "${local.name_prefix}-app-health-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheck"
  namespace           = "Financial/Application"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This alarm monitors application health check status"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]
  treat_missing_data  = "breaching"

  tags = {
    Name        = "${local.name_prefix}-app-health-alarm-secondary"
    Environment = local.environment_suffix
  }
}
```
