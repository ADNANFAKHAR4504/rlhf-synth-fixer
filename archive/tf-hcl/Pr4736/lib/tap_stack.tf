# tap_stack.tf - Production Network Infrastructure for AWS
# This file creates a secure, scalable network infrastructure with VPC, subnets, 
# NAT Gateways, VPN, monitoring, and security controls.

terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# ========================================
# Provider Configuration
# ========================================

provider "aws" {
  region = var.aws_region
}

# ========================================
# Variables and Locals
# ========================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "region" {
  description = "AWS region for deployment (alias)"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "office_cidr" {
  description = "Office CIDR for SSH access"
  type        = string
  default     = "203.0.113.0/24" # Replace with your actual office CIDR
}

variable "environment_suffix" {
  description = "Environment suffix to avoid resource conflicts"
  type        = string
  default     = ""
}

variable "s3_backup_bucket" {
  description = "S3 bucket name for backups"
  type        = string
  default     = "prod-backup-bucket"
}

variable "approved_ami_id" {
  description = "Organization-approved secure AMI ID"
  type        = string
  default     = "ami-0c02fb55731490381" # Replace with your approved AMI
}

locals {
  azs = ["${var.aws_region}a", "${var.aws_region}b"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Owner       = "Infrastructure-Team"
    Project     = "prod-network"
  }
}

# ========================================
# VPC Configuration
# ========================================

# Create the main VPC
resource "aws_vpc" "prod_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "prod-VPC-${var.environment_suffix}"
  })
}

# ========================================
# Internet Gateway
# ========================================

resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = merge(local.common_tags, {
    Name = "prod-IGW-${var.environment_suffix}"
  })
}

# ========================================
# Public Subnets
# ========================================

resource "aws_subnet" "public_subnets" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "prod-subnet-public-${substr(local.azs[count.index], -1, 1)}-${var.environment_suffix}"
    Type = "Public"
  })
}

# ========================================
# Private Subnets
# ========================================

resource "aws_subnet" "private_subnets" {
  count = length(local.azs)

  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "prod-subnet-private-${substr(local.azs[count.index], -1, 1)}-${var.environment_suffix}"
    Type = "Private"
  })
}

# ========================================
# Elastic IPs for NAT Gateways
# ========================================

resource "aws_eip" "nat_eips" {
  count = length(local.azs)

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "prod-EIP-NAT-${substr(local.azs[count.index], -1, 1)}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.prod_igw]
}

# ========================================
# NAT Gateways
# ========================================

resource "aws_nat_gateway" "nat_gateways" {
  count = length(local.azs)

  allocation_id = aws_eip.nat_eips[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = merge(local.common_tags, {
    Name = "prod-NAT-${substr(local.azs[count.index], -1, 1)}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.prod_igw]
}

# ========================================
# Route Tables - Public
# ========================================

resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "prod-route-table-public-${var.environment_suffix}"
    Type = "Public"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public_associations" {
  count = length(aws_subnet.public_subnets)

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}

# ========================================
# Route Tables - Private
# ========================================

resource "aws_route_table" "private_route_tables" {
  count = length(local.azs)

  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateways[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "prod-route-table-private-${substr(local.azs[count.index], -1, 1)}-${var.environment_suffix}"
    Type = "Private"
  })
}

# Associate private subnets with respective private route tables
resource "aws_route_table_association" "private_associations" {
  count = length(aws_subnet.private_subnets)

  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_route_tables[count.index].id
}

# ========================================
# Security Groups
# ========================================

# Web Server Security Group
resource "aws_security_group" "web_server_sg" {
  name_prefix = "prod-web-server-sg-${var.environment_suffix}-"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.prod_vpc.id

  # SSH access from office CIDR
  ingress {
    description = "SSH from office"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.office_cidr]
  }

  # HTTP access from anywhere
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Default egress rule - allow all outbound
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "prod-web-server-sg-${var.environment_suffix}"
  })
}

# Private Instance Security Group
resource "aws_security_group" "private_instance_sg" {
  name_prefix = "prod-private-instance-sg-${var.environment_suffix}-"
  description = "Security group for private instances with restricted outbound"
  vpc_id      = aws_vpc.prod_vpc.id

  # Allow inbound from web servers
  ingress {
    description     = "Allow from web servers"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.web_server_sg.id]
  }

  # Restrict outbound to HTTPS only
  egress {
    description = "HTTPS only outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow DNS resolution
  egress {
    description = "DNS UDP"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "DNS TCP"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "prod-private-instance-sg-${var.environment_suffix}"
  })
}

# ========================================
# IAM Roles for EC2
# ========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "prod-ec2-s3-readonly-role-${var.environment_suffix}"
  path = "/"

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

  tags = local.common_tags
}

# IAM Policy for S3 read-only access
resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "prod-s3-backup-readonly-policy-${var.environment_suffix}"
  path        = "/"
  description = "Read-only access to backup S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_backup_bucket}",
          "arn:aws:s3:::${var.s3_backup_bucket}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_s3_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "prod-ec2-instance-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# ========================================
# VPC Flow Logs
# ========================================

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/prod-vpc-flow-logs-${var.environment_suffix}"
  retention_in_days = 30

  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log_role" {
  name = "prod-vpc-flow-log-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "prod-vpc-flow-log-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.prod_vpc.id

  tags = merge(local.common_tags, {
    Name = "prod-vpc-flow-logs-${var.environment_suffix}"
  })
}

# ========================================
# CloudWatch Alarms
# ========================================

# Metric Filter for DDoS Detection
resource "aws_cloudwatch_log_metric_filter" "ddos_detection" {
  name           = "prod-ddos-detection-filter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets > 10000, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name          = "HighPacketCount"
    namespace     = "VPCFlowLogs/DDoS"
    value         = "1"
    default_value = 0
  }
}

# CloudWatch Alarm for potential DDoS
resource "aws_cloudwatch_metric_alarm" "ddos_alarm" {
  alarm_name          = "prod-potential-ddos-alarm-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HighPacketCount"
  namespace           = "VPCFlowLogs/DDoS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors for potential DDoS attacks"
  treat_missing_data  = "notBreaching"

  alarm_actions = [] # Add SNS topic ARN here for notifications

  tags = local.common_tags
}

# ========================================
# VPN Gateway
# ========================================

# VPN Gateway
resource "aws_vpn_gateway" "prod_vpn_gateway" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = merge(local.common_tags, {
    Name = "prod-VPN-Gateway-${var.environment_suffix}"
  })
}

# Enable route propagation for VPN Gateway
resource "aws_vpn_gateway_route_propagation" "vpn_propagation_public" {
  vpn_gateway_id = aws_vpn_gateway.prod_vpn_gateway.id
  route_table_id = aws_route_table.public_route_table.id
}

resource "aws_vpn_gateway_route_propagation" "vpn_propagation_private" {
  count = length(aws_route_table.private_route_tables)

  vpn_gateway_id = aws_vpn_gateway.prod_vpn_gateway.id
  route_table_id = aws_route_table.private_route_tables[count.index].id
}

# Customer Gateway (example - replace with actual customer gateway details)
resource "aws_customer_gateway" "main" {
  bgp_asn    = 65000
  ip_address = "203.0.113.100" # Replace with actual customer gateway IP
  type       = "ipsec.1"

  tags = merge(local.common_tags, {
    Name = "prod-Customer-Gateway-${var.environment_suffix}"
  })
}

# VPN Connection
resource "aws_vpn_connection" "main" {
  vpn_gateway_id      = aws_vpn_gateway.prod_vpn_gateway.id
  customer_gateway_id = aws_customer_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = true

  tags = merge(local.common_tags, {
    Name = "prod-VPN-Connection-${var.environment_suffix}"
  })
}

# VPN Connection Route (example)
resource "aws_vpn_connection_route" "office" {
  destination_cidr_block = var.office_cidr
  vpn_connection_id      = aws_vpn_connection.main.id
}

# ========================================
# Outputs
# ========================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.nat_gateways[*].id
}

output "web_server_sg_id" {
  description = "ID of web server security group"
  value       = aws_security_group.web_server_sg.id
}

output "private_instance_sg_id" {
  description = "ID of private instance security group"
  value       = aws_security_group.private_instance_sg.id
}

output "ec2_instance_profile_name" {
  description = "Name of EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "vpn_gateway_id" {
  description = "ID of VPN Gateway"
  value       = aws_vpn_gateway.prod_vpn_gateway.id
}

output "flow_log_id" {
  description = "ID of VPC Flow Log"
  value       = aws_flow_log.vpc_flow_log.id
}