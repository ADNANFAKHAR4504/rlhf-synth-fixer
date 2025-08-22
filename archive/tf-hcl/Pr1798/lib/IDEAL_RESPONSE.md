```hcl
# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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

```hcl
# tap_stack.tf

########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

########################
# Random String for S3 Bucket Suffix
########################
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

########################
# VPC
########################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Internet Gateway
########################
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "main-igw-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Public Subnets
########################
resource "aws_subnet" "public_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1a-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_1b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1b-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Private Subnets
########################
resource "aws_subnet" "private_1a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "private-subnet-1a-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_1b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "private-subnet-1b-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Elastic IPs for NAT Gateways
########################
resource "aws_eip" "nat_1a" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-1a-${var.environment_suffix}"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat_1b" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-1b-${var.environment_suffix}"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

########################
# NAT Gateways
########################
resource "aws_nat_gateway" "nat_1a" {
  allocation_id = aws_eip.nat_1a.id
  subnet_id     = aws_subnet.public_1a.id

  tags = {
    Name        = "nat-gateway-1a-${var.environment_suffix}"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "nat_1b" {
  allocation_id = aws_eip.nat_1b.id
  subnet_id     = aws_subnet.public_1b.id

  tags = {
    Name        = "nat-gateway-1b-${var.environment_suffix}"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

########################
# Route Tables
########################
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-route-table-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_1a" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1a.id
  }

  tags = {
    Name        = "private-route-table-1a-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_1b" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1b.id
  }

  tags = {
    Name        = "private-route-table-1b-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Route Table Associations
########################
resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.public_1a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_1b" {
  subnet_id      = aws_subnet.public_1b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1a" {
  subnet_id      = aws_subnet.private_1a.id
  route_table_id = aws_route_table.private_1a.id
}

resource "aws_route_table_association" "private_1b" {
  subnet_id      = aws_subnet.private_1b.id
  route_table_id = aws_route_table.private_1b.id
}

########################
# Security Groups
########################
resource "aws_security_group" "app_servers" {
  name        = "app-servers-sg-${var.environment_suffix}"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH access from specific CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"]
  }

  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
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
    Name        = "app-servers-sg-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# S3 Bucket for Logs
########################
resource "aws_s3_bucket" "logs" {
  bucket = "production-logs-bucket-${var.environment_suffix}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "logs-bucket-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

########################
# IAM Role for EC2 instances
########################
resource "aws_iam_role" "ec2_log_role" {
  name = "ec2-log-access-role-${var.environment_suffix}"

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

  tags = {
    Name        = "ec2-log-access-role-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# IAM Policy for S3 log bucket access
########################
resource "aws_iam_policy" "s3_log_access" {
  name        = "s3-log-access-policy-${var.environment_suffix}"
  description = "Policy for EC2 instances to access S3 log bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logs.arn
      }
    ]
  })

  tags = {
    Name        = "s3-log-access-policy-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Attach policy to role
########################
resource "aws_iam_role_policy_attachment" "ec2_log_access" {
  role       = aws_iam_role.ec2_log_role.name
  policy_arn = aws_iam_policy.s3_log_access.arn
}

########################
# Instance Profile
########################
resource "aws_iam_instance_profile" "ec2_log_profile" {
  name = "ec2-log-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_log_role.name

  tags = {
    Name        = "ec2-log-profile-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Get Latest Amazon Linux 2 AMI
########################
data "aws_ami" "amazon_linux_2" {
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

########################
# EC2 Instances
########################
resource "aws_instance" "app_server_1a" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private_1a.id
  vpc_security_group_ids = [aws_security_group.app_servers.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_log_profile.name

  tags = {
    Name        = "app-server-1a-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_instance" "app_server_1b" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private_1b.id
  vpc_security_group_ids = [aws_security_group.app_servers.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_log_profile.name

  tags = {
    Name        = "app-server-1b-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# CloudWatch Alarms
########################
resource "aws_cloudwatch_metric_alarm" "cpu_alarm_1a" {
  alarm_name          = "cpu-utilization-high-1a-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.app_server_1a.id
  }

  tags = {
    Name        = "cpu-alarm-1a-${var.environment_suffix}"
    Environment = "Production"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_alarm_1b" {
  alarm_name          = "cpu-utilization-high-1b-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.app_server_1b.id
  }

  tags = {
    Name        = "cpu-alarm-1b-${var.environment_suffix}"
    Environment = "Production"
  }
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1a_id" {
  description = "ID of public subnet 1a"
  value       = aws_subnet.public_1a.id
}

output "public_subnet_1b_id" {
  description = "ID of public subnet 1b"
  value       = aws_subnet.public_1b.id
}

output "private_subnet_1a_id" {
  description = "ID of private subnet 1a"
  value       = aws_subnet.private_1a.id
}

output "private_subnet_1b_id" {
  description = "ID of private subnet 1b"
  value       = aws_subnet.private_1b.id
}

output "nat_gateway_1a_id" {
  description = "ID of NAT Gateway 1a"
  value       = aws_nat_gateway.nat_1a.id
}

output "nat_gateway_1b_id" {
  description = "ID of NAT Gateway 1b"
  value       = aws_nat_gateway.nat_1b.id
}

output "s3_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "ec2_instance_1a_id" {
  description = "ID of EC2 instance in AZ 1a"
  value       = aws_instance.app_server_1a.id
}

output "ec2_instance_1b_id" {
  description = "ID of EC2 instance in AZ 1b"
  value       = aws_instance.app_server_1b.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_log_role.arn
}

output "security_group_id" {
  description = "ID of the security group for app servers"
  value       = aws_security_group.app_servers.id
}
```