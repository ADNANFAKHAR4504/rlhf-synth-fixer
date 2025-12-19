## Root Configuration Files

### provider.tf
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

provider "random" {}
```
### tap_stack.tf
```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = data.aws_availability_zones.available.names
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  common_tags         = var.common_tags
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"
  
  secrets_config = var.secrets_config
  common_tags   = var.common_tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  secrets_policy_arn = module.secrets.secrets_access_policy_arn
  common_tags       = var.common_tags
  
  depends_on = [module.secrets]
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  vpc_id            = module.vpc.vpc_id
  common_tags       = var.common_tags
  log_retention_days = var.log_retention_days
  
  depends_on = [module.vpc]
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"
  
  instance_type           = var.instance_type
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  private_subnet_ids     = module.vpc.private_subnet_ids
  ec2_instance_profile   = module.iam.ec2_instance_profile_name
  web_security_group_id  = module.vpc.web_security_group_id
  log_group_name        = module.monitoring.log_group_name
  common_tags           = var.common_tags
  
  depends_on = [module.vpc, module.iam, module.monitoring]
}
```
### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
  
  validation {
    condition = contains([
      "t3.micro", "t3.small", "t3.medium", "t3.large",
      "m5.large", "m5.xlarge", "c5.large", "c5.xlarge"
    ], var.instance_type)
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "ScalableInfrastructure"
    ManagedBy   = "Terraform"
  }
}

variable "secrets_config" {
  description = "Configuration for secrets in AWS Secrets Manager"
  type = map(object({
    description = string
  }))
  default = {
    "prod/database" = {
      description = "Database credentials for production"
    }
    "prod/api-keys" = {
      description = "API keys for production services"
    }
  }
}
```
### outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.vpc.web_security_group_id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = module.vpc.nat_gateway_ids
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.ec2.load_balancer_dns
}

output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.ec2.target_group_arn
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = module.iam.ec2_role_arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = module.iam.lambda_role_arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = module.iam.ec2_role_name
}

output "secrets_arns" {
  description = "ARNs of the secrets in Secrets Manager"
  value       = module.secrets.secret_arns
}

output "secret_names" {
  description = "Names of the created secrets"
  value       = module.secrets.secret_names
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = module.secrets.secrets_access_policy_arn
}

output "secret_ids" {
  description = "IDs of the created secrets"
  value       = module.secrets.secret_ids
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "log_group_name" {
  description = "Name of the main CloudWatch log group"
  value       = module.monitoring.log_group_name
}

output "log_group_arn" {
  description = "ARN of the main CloudWatch log group"
  value       = module.monitoring.log_group_arn
}

output "system_log_group_name" {
  description = "Name of the system CloudWatch log group"
  value       = module.monitoring.system_log_group_name
}
```

## Modules
### modules/vpc/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "main-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.common_tags, {
    Name = "main-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.common_tags, {
    Name = "private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)
  
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "nat-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.common_tags, {
    Name = "nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.common_tags, {
    Name = "public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(var.common_tags, {
    Name = "private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Web Servers
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  vpc_id      = aws_vpc.main.id
  
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
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "web-security-group"
  })
}
```

### modules/vpc/variables.tf
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```
### modules/vpc/outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

### modules/secrets/main.tf
```hcl
# Random passwords for database credentials
resource "random_password" "db_password" {
  for_each = var.secrets_config
  
  length  = 16
  special = true
}

# Random API keys
resource "random_password" "api_key" {
  for_each = var.secrets_config
  
  length  = 32
  special = false
}

# Random service tokens
resource "random_password" "service_token" {
  for_each = var.secrets_config
  
  length  = 24
  special = false
}

# Create secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets_config
  
  name                    = each.key
  description            = each.value.description
  recovery_window_in_days = 7
  
  tags = var.common_tags
}

# Store secret values with dynamic passwords
resource "aws_secretsmanager_secret_version" "secret_versions" {
  for_each = var.secrets_config
  
  secret_id = aws_secretsmanager_secret.secrets[each.key].id
  
  secret_string = jsonencode({
    username      = "admin"
    password      = random_password.db_password[each.key].result
    api_key       = random_password.api_key[each.key].result
    service_token = random_password.service_token[each.key].result
    host          = each.key == "prod/database" ? "prod-db.internal" : "api.service.internal"
    port          = each.key == "prod/database" ? "5432" : "443"
  })
}

# Data source for current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM policy for accessing specific secrets (attached to EC2 role)
resource "aws_iam_policy" "secrets_access" {
  name        = "secrets-manager-access-policy"
  description = "Policy for accessing production secrets"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          for secret in aws_secretsmanager_secret.secrets :
          secret.arn
        ]
        Condition = {
          StringEquals = {
            "secretsmanager:ResourceTag/Environment" = "Production"
          }
        }
      }
    ]
  })
  
  tags = var.common_tags
}
```

### modules/secrets/variables.tf
```hcl
variable "secrets_config" {
  description = "Configuration for secrets in AWS Secrets Manager"
  type = map(object({
    description = string
  }))
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```
### modules/secrets/outputs.tf
```hcl
output "secret_arns" {
  description = "ARNs of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.arn }
}

output "secret_names" {
  description = "Names of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.name }
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = aws_iam_policy.secrets_access.arn
}

output "secret_ids" {
  description = "IDs of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.id }
}
```
### modules/monitoring/main.tf
```hcl
# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/production"
  retention_in_days = var.log_retention_days
  
  tags = merge(var.common_tags, {
    Name = "production-app-logs"
  })
}

# CloudWatch Log Group for system logs
resource "aws_cloudwatch_log_group" "system_logs" {
  name              = "/aws/ec2/system"
  retention_in_days = var.log_retention_days
  
  tags = merge(var.common_tags, {
    Name = "production-system-logs"
  })
}

# CloudWatch Log Metric Filter for errors
resource "aws_cloudwatch_log_metric_filter" "error_logs" {
  name           = "error-count"
  log_group_name = aws_cloudwatch_log_group.app_logs.name
  pattern        = "ERROR"
  
  metric_transformation {
    name      = "ErrorCount"
    namespace = "Production/Application"
    value     = "1"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "production-infrastructure-alerts"
  
  tags = var.common_tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "Production-Infrastructure-Dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "web-asg"],
            [".", "NetworkIn", ".", "."],
            [".", "NetworkOut", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "EC2 Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/web-alb/*"],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Load Balancer Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["CWAgent", "mem_used_percent", "AutoScalingGroupName", "web-asg"],
            [".", "disk_used_percent", ".", ".", "device", "/dev/xvda1", "fstype", "xfs", "path", "/"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Memory and Disk Usage"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.app_logs.name}' | fields @timestamp, @message | sort @timestamp desc | limit 100"
          region  = data.aws_region.current.name
          title   = "Recent Application Logs"
          view    = "table"
        }
      }
    ]
  })
  
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "production-high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = "web-asg"
  }
  
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "production-high-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "mem_used_percent"
  namespace           = "CWAgent"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = "web-asg"
  }
  
  tags = var.common_tags
}

# CloudWatch Alarm for error logs
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "production-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "Production/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors application error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  tags = var.common_tags
}

# CloudWatch Alarm for Load Balancer 5XX errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "production-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  tags = var.common_tags
}

# Data sources
data "aws_region" "current" {}
```

### modules/monitoring/variables.tf
```hcl
variable "vpc_id" {
  description = "VPC ID for monitoring resources"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```
### modules/monitoring/outputs.tf
```hcl
output "log_group_name" {
  description = "Name of the main CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "log_group_arn" {
  description = "ARN of the main CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "system_log_group_name" {
  description = "Name of the system CloudWatch log group"
  value       = aws_cloudwatch_log_group.system_logs.name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_names" {
  description = "Names of the CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.high_cpu.alarm_name,
    aws_cloudwatch_metric_alarm.high_memory.alarm_name,
    aws_cloudwatch_metric_alarm.error_rate.alarm_name,
    aws_cloudwatch_metric_alarm.alb_5xx_errors.alarm_name
  ]
}
```
### modules/iam/main.tf
```hcl
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-production-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.common_tags
}

# IAM Policy for EC2 instances (least privilege)
resource "aws_iam_policy" "ec2_policy" {
  name        = "ec2-production-policy"
  description = "Policy for EC2 instances with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/ec2/*",
          "arn:aws:logs:*:*:log-group:/aws/ec2/*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = var.common_tags
}

# CloudWatch Agent Policy
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach custom policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Attach secrets policy to role
resource "aws_iam_role_policy_attachment" "secrets_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = var.secrets_policy_arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-production-profile"
  role = aws_iam_role.ec2_role.name
  
  tags = var.common_tags
}

# IAM Role for Lambda functions (if needed for automation)
resource "aws_iam_role" "lambda_role" {
  name = "lambda-production-role"
  
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
  
  tags = var.common_tags
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

### modules/iam/variables.tf
```hcl
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "secrets_policy_arn" {
  description = "ARN of the secrets access policy"
  type        = string
}
```
### modules/iam/outputs.tf
```hcl
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}
```
### modules/ec2/main.tf
```hcl
# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template for EC2 instances
resource "aws_launch_template" "web" {
  name_prefix   = "web-template-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [var.web_security_group_id]
  
  iam_instance_profile {
    name = var.ec2_instance_profile
  }
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region         = data.aws_region.current.name
    log_group_name = var.log_group_name
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "web-server"
    })
  }
  
  tags = var.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "web-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = 2
  max_size         = 6
  desired_capacity = 2
  
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "web-asg-instance"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Application Load Balancer
resource "aws_lb" "web" {
  name               = "web-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.web_security_group_id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = false
  
  tags = merge(var.common_tags, {
    Name = "web-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = var.common_tags
}

# Load Balancer Listener
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
  
  tags = var.common_tags
}

# Data sources
data "aws_region" "current" {}
```

### modules/ec2/variables.tf
```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "ec2_instance_profile" {
  description = "IAM instance profile name for EC2"
  type        = string
}

variable "web_security_group_id" {
  description = "Security group ID for web servers"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```
### modules/ec2/outputs.tf
```hcl
output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_autoscaling_group.web.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.web.dns_name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.web.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}
```
### modules/ec2/user_data.sh
```bash
#!/bin/bash
yum update -y
yum install -y httpd aws-cli

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Production Web Server</title>
</head>
<body>
    <h1>Hello from Production Environment!</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Region: ${region}</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${log_group_name}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${log_group_name}",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Enable CloudWatch agent to start on boot
systemctl enable amazon-cloudwatch-agent
```