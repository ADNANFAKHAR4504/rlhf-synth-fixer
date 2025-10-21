# Ideal Response - Production Network Infrastructure

This document describes the ideal/expected solution for the Terraform infrastructure prompt. The solution should demonstrate production-ready AWS infrastructure with security, scalability, and compliance.

## Overview

The ideal response creates a secure, multi-AZ network infrastructure in AWS using Terraform, featuring:
- VPC with public and private subnets across 2 availability zones
- Internet Gateway and NAT Gateways for internet connectivity
- Security groups with least-privilege access
- IAM roles and policies for EC2 instances
- VPC Flow Logs with CloudWatch monitoring
- VPN Gateway for secure remote access
- Comprehensive tagging and naming conventions

## Key Characteristics of an Ideal Response

### 1. **File Structure**
```
lib/
├── tap_stack.tf          # Single comprehensive Terraform file
└── (test files separate)
```

### 2. **Code Organization**
The ideal response should organize resources logically with clear sections:
- Terraform and provider configuration
- Variables and locals
- VPC and networking (VPC, subnets, IGW)
- NAT Gateways with Elastic IPs
- Route tables (public and private)
- Security groups
- IAM roles and policies
- VPC Flow Logs and CloudWatch monitoring
- VPN Gateway configuration
- Outputs

### 3. **Security Best Practices**

#### ✅ Network Segmentation
- **Public subnets**: For resources requiring internet access (NAT Gateways, load balancers)
- **Private subnets**: For application servers with outbound-only access via NAT

#### ✅ Least Privilege Security Groups
```hcl
# Web server SG - restrictive inbound
- SSH: Only from office CIDR (not 0.0.0.0/0)
- HTTP: From internet (necessary for web traffic)
- Egress: All traffic (standard for web servers)

# Private instance SG - highly restricted
- Ingress: Only from web server SG
- Egress: Only HTTPS (443) and DNS (53)
```

#### ✅ IAM Best Practices
- EC2 instances use IAM roles (no hardcoded credentials)
- Policies follow least privilege (read-only S3 access)
- Instance profiles for temporary credentials

#### ✅ No Hardcoded Secrets
- No passwords, API keys, or access keys in code
- Variables for configurable values
- Comments indicate where to replace placeholder values

### 4. **High Availability & Reliability**

#### ✅ Multi-AZ Architecture
```hcl
locals {
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
}

# Subnets span multiple AZs
resource "aws_subnet" "public_subnets" {
  count = length(local.azs)
  availability_zone = local.azs[count.index]
  # ...
}
```

#### ✅ NAT Gateway Redundancy
- One NAT Gateway per AZ (not shared)
- Each private subnet uses NAT Gateway in its AZ
- Prevents single point of failure

### 5. **Monitoring & Observability**

#### ✅ VPC Flow Logs
```hcl
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"  # Captures accepted, rejected, and all traffic
  vpc_id          = aws_vpc.prod_vpc.id
}
```

#### ✅ CloudWatch Alarms
```hcl
# DDoS detection with metric filters
resource "aws_cloudwatch_log_metric_filter" "ddos_detection" {
  pattern = "[version, account, eni, source, destination, srcport, destport, protocol, packets > 10000, ...]"
  # Triggers on high packet counts
}

resource "aws_cloudwatch_metric_alarm" "ddos_alarm" {
  threshold = 100
  # Can be connected to SNS for notifications
}
```

### 6. **Naming Conventions**

#### ✅ Consistent Resource Names
```
Format: prod-<resource-type>-<identifier>

Examples:
- VPC: prod-VPC
- Subnets: prod-subnet-public-a, prod-subnet-private-b
- NAT Gateways: prod-NAT-a, prod-NAT-b
- Security Groups: prod-web-server-sg, prod-private-instance-sg
- IAM Role: prod-ec2-s3-readonly-role
```

#### ✅ Comprehensive Tagging
```hcl
locals {
  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Owner       = "Infrastructure-Team"
    Project     = "prod-network"
  }
}

# Applied to all resources using merge()
tags = merge(local.common_tags, {
  Name = "prod-specific-name"
})
```

### 7. **VPN & Remote Access**

#### ✅ VPN Gateway Configuration
```hcl
resource "aws_vpn_gateway" "prod_vpn_gateway" {
  vpc_id = aws_vpc.prod_vpc.id
}

# Route propagation for both public and private route tables
resource "aws_vpn_gateway_route_propagation" "vpn_propagation_public" {
  vpn_gateway_id = aws_vpn_gateway.prod_vpn_gateway.id
  route_table_id = aws_route_table.public_route_table.id
}
```

### 8. **Terraform Best Practices**

#### ✅ Resource Dependencies
```hcl
# Explicit dependencies where needed
depends_on = [aws_internet_gateway.prod_igw]

# Implicit dependencies through references
nat_gateway_id = aws_nat_gateway.nat_gateways[count.index].id
```

#### ✅ Use of Count for Scaling
```hcl
resource "aws_subnet" "public_subnets" {
  count = length(local.azs)  # Dynamic based on AZ list
  cidr_block = local.public_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
}
```

#### ✅ Variables & Locals
```hcl
# Variables for user input
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# Locals for computed values
locals {
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
}
```

### 9. **Comprehensive Outputs**

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public_subnets[*].id
}

# All key resource IDs exported for reference
```

### 10. **Code Quality**

#### ✅ Clear Documentation
- File header describing purpose
- Section comments (e.g., "# ========================================")
- Inline comments explaining complex logic

#### ✅ Proper Formatting
- Consistent indentation (2 spaces)
- Logical grouping of resources
- Blank lines between resource blocks

#### ✅ Valid HCL Syntax
- Proper use of interpolation `${}`
- Correct function calls (merge, jsonencode)
- Valid argument names

## What Makes This Solution Production-Ready?

1. **Security First**: Least privilege access, network segmentation, encrypted logs
2. **High Availability**: Multi-AZ deployment, redundant NAT Gateways
3. **Monitoring**: VPC Flow Logs, CloudWatch alarms, metric filters
4. **Compliance**: Consistent tagging, approved AMIs, audit trails
5. **Maintainability**: Clear code structure, comprehensive documentation
6. **Scalability**: Use of count, locals, and variables for easy expansion

## Common Pitfalls to Avoid

❌ **Avoid These Mistakes**:
1. Hardcoded credentials or passwords
2. Security group rules with 0.0.0.0/0 for SSH
3. Single NAT Gateway for multiple AZs (SPOF)
4. Missing dependencies (e.g., NAT depends on IGW)
5. Inconsistent naming conventions
6. Missing or inadequate tagging
7. No monitoring or logging
8. Overly permissive IAM policies
9. Using deprecated parameters (e.g., log_destination_arn → log_destination)

## Complete Implementation Code

### lib/tap_stack.tf

The complete Terraform configuration implementing all requirements:

```hcl
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
    Name = "prod-VPC"
  })
}

# ========================================
# Internet Gateway
# ========================================

resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = merge(local.common_tags, {
    Name = "prod-IGW"
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
    Name = "prod-subnet-public-${substr(local.azs[count.index], -1, 1)}"
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
    Name = "prod-subnet-private-${substr(local.azs[count.index], -1, 1)}"
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
    Name = "prod-EIP-NAT-${substr(local.azs[count.index], -1, 1)}"
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
    Name = "prod-NAT-${substr(local.azs[count.index], -1, 1)}"
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
    Name = "prod-route-table-public"
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
    Name = "prod-route-table-private-${substr(local.azs[count.index], -1, 1)}"
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
  name_prefix = "prod-web-server-sg"
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
    Name = "prod-web-server-sg"
  })
}

# Private Instance Security Group
resource "aws_security_group" "private_instance_sg" {
  name_prefix = "prod-private-instance-sg"
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
    Name = "prod-private-instance-sg"
  })
}

# ========================================
# IAM Roles for EC2
# ========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "prod-ec2-s3-readonly-role"
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
  name        = "prod-s3-backup-readonly-policy"
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
  name = "prod-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# ========================================
# VPC Flow Logs
# ========================================

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/prod-vpc-flow-logs"
  retention_in_days = 30

  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log_role" {
  name = "prod-vpc-flow-log-role"

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
  name = "prod-vpc-flow-log-policy"
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
    Name = "prod-vpc-flow-logs"
  })
}

# ========================================
# CloudWatch Alarms
# ========================================

# Metric Filter for DDoS Detection
resource "aws_cloudwatch_log_metric_filter" "ddos_detection" {
  name           = "prod-ddos-detection-filter"
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
  alarm_name          = "prod-potential-ddos-alarm"
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
    Name = "prod-VPN-Gateway"
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
    Name = "prod-Customer-Gateway"
  })
}

# VPN Connection
resource "aws_vpn_connection" "main" {
  vpn_gateway_id      = aws_vpn_gateway.prod_vpn_gateway.id
  customer_gateway_id = aws_customer_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = true

  tags = merge(local.common_tags, {
    Name = "prod-VPN-Connection"
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
```

## Conclusion

The ideal response demonstrates not just working infrastructure, but production-grade AWS architecture that balances security, reliability, cost, and maintainability. It follows AWS Well-Architected Framework principles and Terraform best practices while remaining practical and deployable.