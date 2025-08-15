I'll help you build a secure financial app infrastructure using Terraform. Here's a complete solution that meets all your requirements:

## provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment
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
      Environment = var.environment
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

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

## tap_stack.tf

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
      }
    ]
  })

  tags = {
    Name = "financial-app-kms-primary"
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
      }
    ]
  })

  tags = {
    Name = "financial-app-kms-secondary"
  }
}

resource "aws_kms_alias" "financial_app_primary" {
  provider      = aws.primary
  name          = "alias/financial-app-primary"
  target_key_id = aws_kms_key.financial_app_primary.key_id
}

resource "aws_kms_alias" "financial_app_secondary" {
  provider      = aws.secondary
  name          = "alias/financial-app-secondary"
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
    Name = "financial-app-vpc-primary"
  }
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "financial-app-vpc-secondary"
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name = "financial-app-igw-primary"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name = "financial-app-igw-secondary"
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
    Name = "financial-app-public-subnet-primary-${count.index + 1}"
    Type = "public"
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
    Name = "financial-app-private-subnet-primary-${count.index + 1}"
    Type = "private"
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
    Name = "financial-app-public-subnet-secondary-${count.index + 1}"
    Type = "public"
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
    Name = "financial-app-private-subnet-secondary-${count.index + 1}"
    Type = "private"
  }
}

# NAT Gateways for private subnets
resource "aws_eip" "nat_primary" {
  count    = 2
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name = "financial-app-nat-eip-primary-${count.index + 1}"
  }
}

resource "aws_eip" "nat_secondary" {
  count    = 2
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name = "financial-app-nat-eip-secondary-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "primary" {
  count         = 2
  provider      = aws.primary
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = {
    Name = "financial-app-nat-primary-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "secondary" {
  count         = 2
  provider      = aws.secondary
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = {
    Name = "financial-app-nat-secondary-${count.index + 1}"
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
    Name = "financial-app-public-rt-primary"
  }
}

resource "aws_route_table" "private_primary" {
  count    = 2
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name = "financial-app-private-rt-primary-${count.index + 1}"
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
    Name = "financial-app-public-rt-secondary"
  }
}

resource "aws_route_table" "private_secondary" {
  count    = 2
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = {
    Name = "financial-app-private-rt-secondary-${count.index + 1}"
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
  name = "financial-app-role"

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
    Name = "financial-app-role"
  }
}

resource "aws_iam_policy" "financial_app_policy" {
  name        = "financial-app-policy"
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
        Resource = "arn:aws:logs:*:*:*"
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
  name = "financial-app-profile"
  role = aws_iam_role.financial_app_role.name
}

# CloudWatch Log Groups - Primary Region
resource "aws_cloudwatch_log_group" "financial_app_primary" {
  provider          = aws.primary
  name              = "/aws/financial-app/primary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_primary.arn

  tags = {
    Name = "financial-app-logs-primary"
  }
}

# CloudWatch Log Groups - Secondary Region
resource "aws_cloudwatch_log_group" "financial_app_secondary" {
  provider          = aws.secondary
  name              = "/aws/financial-app/secondary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_secondary.arn

  tags = {
    Name = "financial-app-logs-secondary"
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_primary" {
  provider            = aws.primary
  alarm_name          = "financial-app-high-cpu-primary"
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
    Name = "financial-app-cpu-alarm-primary"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_secondary" {
  provider            = aws.secondary
  alarm_name          = "financial-app-high-cpu-secondary"
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
    Name = "financial-app-cpu-alarm-secondary"
  }
}

# SNS Topics for alerts
resource "aws_sns_topic" "alerts_primary" {
  provider         = aws.primary
  name             = "financial-app-alerts-primary"
  kms_master_key_id = aws_kms_key.financial_app_primary.id

  tags = {
    Name = "financial-app-alerts-primary"
  }
}

resource "aws_sns_topic" "alerts_secondary" {
  provider         = aws.secondary
  name             = "financial-app-alerts-secondary"
  kms_master_key_id = aws_kms_key.financial_app_secondary.id

  tags = {
    Name = "financial-app-alerts-secondary"
  }
}

# Security Groups
resource "aws_security_group" "financial_app_primary" {
  provider    = aws.primary
  name        = "financial-app-sg-primary"
  description = "Security group for financial app - primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
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
    Name = "financial-app-sg-primary"
  }
}

resource "aws_security_group" "financial_app_secondary" {
  provider    = aws.secondary
  name        = "financial-app-sg-secondary"
  description = "Security group for financial app - secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
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
    Name = "financial-app-sg-secondary"
  }
}
```

## outputs.tf

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
```

## How to Deploy

1. **Initialize Terraform:**

   ```bash
   terraform init
   ```

2. **Plan the deployment:**

   ```bash
   terraform plan
   ```

3. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## What This Infrastructure Provides

✅ **Multi-Region Setup**: Primary (us-east-1) and secondary (us-west-2) regions for high availability

✅ **Secure VPC Design**:

- Public subnets for load balancers/bastion hosts
- Private subnets for application servers and databases
- NAT Gateways for secure outbound internet access

✅ **Data Encryption**:

- KMS keys in both regions with automatic rotation enabled
- All CloudWatch logs and SNS topics encrypted

✅ **IAM Security**:

- Least privilege IAM roles and policies
- Separate permissions for KMS, CloudWatch, and logging

✅ **Monitoring & Logging**:

- CloudWatch log groups in both regions
- CPU utilization alarms
- SNS topics for alert notifications

✅ **Network Security**:

- Security groups allowing only HTTPS/HTTP traffic
- Proper subnet isolation

This setup gives you a solid foundation for a financial services application with enterprise-grade security and availability. You can extend it by adding RDS databases, ECS clusters, or Lambda functions as needed for your specific application requirements.
