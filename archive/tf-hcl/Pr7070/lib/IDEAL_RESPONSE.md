## tap_stack.tf
```hcl
# tap_stack.tf - Payment Processing Platform Infrastructure

# ================================
# DATA SOURCES
# ================================

# Get available AZs in eu-central-1 region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2023 AMI for NAT instance
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ================================
# LOCALS
# ================================

locals {
  # Fixed CIDR blocks as specified in prompt
  vpc_cidr = "10.0.0.0/16"

  # Subnet CIDRs as specified
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_cidrs   = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_cidrs    = ["10.0.21.0/24", "10.0.22.0/24"]

  # On-premises network for Transit Gateway
  onprem_cidr = "10.100.0.0/16"

  # Blocked CIDR ranges for NACLs
  blocked_cidrs = ["192.168.0.0/16", "172.16.0.0/12"]

  # Resource naming
  name_prefix = "payment-platform-${var.environment_suffix}"

  # Timestamp-based suffix for S3 bucket uniqueness
  bucket_suffix = formatdate("YYYYMMDDhhmmss", timestamp())

  # Common tags as specified in prompt
  common_tags = {
    Environment = "Production"
    Project     = "PaymentPlatform"
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    ManagedBy   = "Terraform"
  }
}

# ================================
# VPC AND CORE NETWORKING
# ================================

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# ================================
# SUBNETS
# ================================

# Public Subnets (for ALB and NAT instance)
resource "aws_subnet" "public" {
  count = length(local.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Tier = "Public"
  })
}

# Private Application Subnets
resource "aws_subnet" "private_app" {
  count = length(local.private_app_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_app_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-subnet-${count.index + 1}"
    Tier = "Application"
  })
}

# Private Database Subnets
resource "aws_subnet" "private_db" {
  count = length(local.private_db_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_db_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-${count.index + 1}"
    Tier = "Database"
  })
}

# ================================
# NAT INSTANCE (t3.micro for cost optimization)
# ================================

# IAM role for NAT instance
resource "aws_iam_role" "nat_instance" {
  name = "${local.name_prefix}-nat-instance-role"

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

# IAM policy for NAT instance
resource "aws_iam_role_policy" "nat_instance" {
  name = "${local.name_prefix}-nat-instance-policy"
  role = aws_iam_role.nat_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:AssociateAddress",
          "ec2:ModifyInstanceAttribute",
          "ec2:DescribeAddresses",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile for NAT instance
resource "aws_iam_instance_profile" "nat_instance" {
  name = "${local.name_prefix}-nat-instance-profile"
  role = aws_iam_role.nat_instance.name

  tags = local.common_tags
}

# Security Group for NAT Instance
resource "aws_security_group" "nat_instance" {
  name_prefix = "${local.name_prefix}-nat-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for NAT instance"

  # Allow HTTP traffic from private subnets
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [local.private_app_cidrs[0], local.private_app_cidrs[1], local.private_db_cidrs[0], local.private_db_cidrs[1]]
  }

  # Allow HTTPS traffic from private subnets
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.private_app_cidrs[0], local.private_app_cidrs[1], local.private_db_cidrs[0], local.private_db_cidrs[1]]
  }

  # Allow SSH for management
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-sg"
  })
}

# Elastic IP for NAT Instance
resource "aws_eip" "nat_instance" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

# NAT Instance
resource "aws_instance" "nat_instance" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.nat_instance.id]
  iam_instance_profile        = aws_iam_instance_profile.nat_instance.name
  source_dest_check           = false
  associate_public_ip_address = true

  user_data = base64encode(templatefile("${path.module}/nat_instance_userdata.sh", {
    eip_allocation_id = aws_eip.nat_instance.allocation_id
    aws_region        = var.aws_region
  }))

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-instance"
  })

  depends_on = [aws_internet_gateway.main]
}

# Associate EIP with NAT Instance
resource "aws_eip_association" "nat_instance" {
  instance_id   = aws_instance.nat_instance.id
  allocation_id = aws_eip.nat_instance.allocation_id
}

# ================================
# ROUTE TABLES
# ================================

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  route {
    cidr_block         = local.onprem_cidr
    transit_gateway_id = aws_ec2_transit_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Private Route Tables (route through NAT instance)
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_instance.nat_instance.primary_network_interface_id
  }

  route {
    cidr_block         = local.onprem_cidr
    transit_gateway_id = aws_ec2_transit_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-app-rt"
  })
}

resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_instance.nat_instance.primary_network_interface_id
  }

  route {
    cidr_block         = local.onprem_cidr
    transit_gateway_id = aws_ec2_transit_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-db-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count = length(aws_subnet.private_app)

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

resource "aws_route_table_association" "private_db" {
  count = length(aws_subnet.private_db)

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}

# ================================
# NETWORK ACLs
# ================================

# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Deny traffic from blocked CIDR ranges - inbound
  dynamic "ingress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, ingress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = ingress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other inbound traffic
  ingress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # Deny traffic to blocked CIDR ranges - outbound
  dynamic "egress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, egress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = egress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other outbound traffic
  egress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-nacl"
  })
}

# Network ACL for Private App Subnets
resource "aws_network_acl" "private_app" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private_app[*].id

  # Deny traffic from blocked CIDR ranges - inbound
  dynamic "ingress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, ingress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = ingress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other inbound traffic
  ingress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # Deny traffic to blocked CIDR ranges - outbound
  dynamic "egress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, egress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = egress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other outbound traffic
  egress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-app-nacl"
  })
}

# Network ACL for Private DB Subnets
resource "aws_network_acl" "private_db" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private_db[*].id

  # Deny traffic from blocked CIDR ranges - inbound
  dynamic "ingress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, ingress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = ingress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other inbound traffic
  ingress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # Deny traffic to blocked CIDR ranges - outbound
  dynamic "egress" {
    for_each = local.blocked_cidrs
    content {
      rule_no    = 100 + index(local.blocked_cidrs, egress.value)
      protocol   = "-1"
      action     = "deny"
      cidr_block = egress.value
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all other outbound traffic
  egress {
    rule_no    = 200
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-db-nacl"
  })
}

# ================================
# VPC FLOW LOGS
# ================================

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "vpc_flow_logs" {
  bucket = "fintech-vpc-flow-logs-${local.bucket_suffix}"

  tags = merge(local.common_tags, {
    Name = "fintech-vpc-flow-logs-${local.bucket_suffix}"
  })
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"

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

# IAM policy for VPC Flow Logs S3 access
resource "aws_iam_role_policy" "vpc_flow_logs_s3" {
  name = "${local.name_prefix}-vpc-flow-logs-s3-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.vpc_flow_logs.arn,
          "${aws_s3_bucket.vpc_flow_logs.arn}/*"
        ]
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  log_destination      = aws_s3_bucket.vpc_flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

# ================================
# TRANSIT GATEWAY
# ================================

# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for Payment Platform"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw"
  })
}

# Transit Gateway VPC Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  subnet_ids         = aws_subnet.private_app[*].id
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-attachment"
  })
}

# Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table" "main" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-rt"
  })
}

# Transit Gateway Route for on-premises network
resource "aws_ec2_transit_gateway_route" "onprem" {
  destination_cidr_block         = local.onprem_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.main.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.main.id
}
```

## provider.tf
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

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

```

## variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

## outputs.tf
```hcl
# outputs.tf - Payment Processing Platform Outputs

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# ================================
# SUBNET OUTPUTS (GROUPED BY TIER)
# ================================

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "all_subnet_ids_by_tier" {
  description = "All subnet IDs grouped by tier"
  value = {
    public      = aws_subnet.public[*].id
    application = aws_subnet.private_app[*].id
    database    = aws_subnet.private_db[*].id
  }
}

# ================================
# NAT INSTANCE OUTPUTS
# ================================

output "nat_instance_id" {
  description = "The ID of the NAT instance"
  value       = aws_instance.nat_instance.id
}

output "nat_instance_private_ip" {
  description = "Private IP address of the NAT instance"
  value       = aws_instance.nat_instance.private_ip
}

output "nat_instance_public_ip" {
  description = "Public IP address of the NAT instance"
  value       = aws_eip.nat_instance.public_ip
}

# ================================
# TRANSIT GATEWAY OUTPUTS
# ================================

output "transit_gateway_id" {
  description = "The ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_attachment_id" {
  description = "The ID of the Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.main.id
}

output "transit_gateway_route_table_id" {
  description = "The ID of the Transit Gateway route table"
  value       = aws_ec2_transit_gateway_route_table.main.id
}

# ================================
# SECURITY OUTPUTS
# ================================

output "nat_instance_security_group_id" {
  description = "Security group ID for the NAT instance"
  value       = aws_security_group.nat_instance.id
}

output "network_acl_ids" {
  description = "Network ACL IDs by tier"
  value = {
    public      = aws_network_acl.public.id
    application = aws_network_acl.private_app.id
    database    = aws_network_acl.private_db.id
  }
}

# ================================
# MONITORING OUTPUTS
# ================================

output "vpc_flow_logs_s3_bucket" {
  description = "S3 bucket name for VPC Flow Logs"
  value       = aws_s3_bucket.vpc_flow_logs.bucket
}

output "vpc_flow_log_id" {
  description = "The ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

# ================================
# NETWORKING OUTPUTS
# ================================

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "route_table_ids" {
  description = "Route table IDs by type"
  value = {
    public      = aws_route_table.public.id
    application = aws_route_table.private_app.id
    database    = aws_route_table.private_db.id
  }
}

# ================================
# AVAILABILITY ZONE OUTPUTS
# ================================

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# ================================
# INTEGRATION OUTPUTS
# ================================

output "integration_summary" {
  description = "Summary of key infrastructure components for integration"
  value = {
    vpc_id                     = aws_vpc.main.id
    vpc_cidr                   = aws_vpc.main.cidr_block
    public_subnets             = aws_subnet.public[*].id
    application_subnets        = aws_subnet.private_app[*].id
    database_subnets           = aws_subnet.private_db[*].id
    nat_instance_id            = aws_instance.nat_instance.id
    transit_gateway_id         = aws_ec2_transit_gateway.main.id
    transit_gateway_attachment = aws_ec2_transit_gateway_vpc_attachment.main.id
    flow_logs_bucket           = aws_s3_bucket.vpc_flow_logs.bucket
    region                     = var.aws_region
  }
}
```
