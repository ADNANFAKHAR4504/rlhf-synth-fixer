# IDEAL RESPONSE - AWS VPC Infrastructure with Terraform

This document provides the complete, ideal solution for the secure and scalable AWS VPC infrastructure as described in PROMPT.md.

## Solution Overview

This implementation creates a production-ready AWS VPC infrastructure entirely in Terraform, following Infrastructure-as-Code best practices with proper file organization.

## Architecture

The solution implements:
- **VPC**: 10.0.0.0/16 CIDR in us-west-2
- **High Availability**: 3 public and 3 private subnets across 3 Availability Zones
- **Internet Connectivity**: Internet Gateway for public subnets, NAT Gateways for private subnets
- **Security**: Encrypted S3 bucket with restricted access, IAM roles for EC2 instances
- **Best Practices**: IMDSv2, encrypted EBS volumes, VPC endpoints, proper tagging

## File Structure

```
lib/
  - provider.tf      # Terraform and AWS provider configuration with S3 backend
  - tap_stack.tf     # Complete VPC infrastructure resources
```

## Complete Implementation

### File 1: provider.tf

**Purpose**: Terraform version requirements, AWS provider configuration, and S3 backend for state management.

**Location**: `lib/provider.tf`

```hcl
# provider.tf
# Terraform configuration and AWS provider setup

terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # S3 backend for state management (configured via GitHub Actions)
  # This enables remote state storage for team collaboration and CI/CD
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

### File 2: tap_stack.tf

**Purpose**: Complete AWS VPC infrastructure with all required resources.

**Location**: `lib/tap_stack.tf`

```hcl
# tap_stack.tf - Complete AWS VPC Infrastructure with EC2 and S3
# This configuration creates a secure, scalable VPC infrastructure following AWS best practices

# ==========================================
# VARIABLES
# ==========================================
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "region" {
  description = "AWS region for all resources (alias for compatibility)"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "allowed_ssh_ip" {
  description = "IP address allowed to SSH to EC2 instances"
  type        = string
  default     = "0.0.0.0/32" # Replace with your actual IP in production
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "bucket_name" {
  description = "Name for the S3 bucket"
  type        = string
  default     = "secure-vpc-bucket-demo-2024"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ==========================================
# DATA SOURCES
# ==========================================
# Get availability zones for the region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get the latest Amazon Linux 2 AMI
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

# ==========================================
# VPC CONFIGURATION
# ==========================================
# Create VPC with DNS support for better service discovery
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc-${var.environment_suffix}"
    Environment = "production"
  }
}

# ==========================================
# INTERNET GATEWAY
# ==========================================
# Internet Gateway for public subnet outbound connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw-${var.environment_suffix}"
  }
}

# ==========================================
# ELASTIC IPs FOR NAT GATEWAYS
# ==========================================
# Allocate Elastic IPs for NAT Gateways (one per AZ for high availability)
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = {
    Name = "nat-eip-az${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==========================================
# PUBLIC SUBNETS
# ==========================================
# Create public subnets across multiple AZs for high availability
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "PublicSubnet${count.index + 1}-${var.environment_suffix}"
    Type = "Public"
    AZ   = data.aws_availability_zones.available.names[count.index]
  }
}

# ==========================================
# PRIVATE SUBNETS
# ==========================================
# Create private subnets for secure workloads
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "PrivateSubnet${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
    AZ   = data.aws_availability_zones.available.names[count.index]
  }
}

# ==========================================
# NAT GATEWAYS
# ==========================================
# NAT Gateways for private subnet outbound internet connectivity
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-az${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==========================================
# ROUTE TABLES
# ==========================================
# Public route table - routes traffic to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-route-table-${var.environment_suffix}"
    Type = "Public"
  }
}

# Private route tables - one per AZ for fault isolation
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-route-table-az${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  }
}

# ==========================================
# ROUTE TABLE ASSOCIATIONS
# ==========================================
# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with their respective private route tables
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==========================================
# S3 BUCKET CONFIGURATION
# ==========================================
# Create S3 bucket with security best practices
resource "aws_s3_bucket" "main" {
  bucket        = "${var.bucket_name}-${var.environment_suffix}"
  force_destroy = true # Enable for testing; remove in production

  tags = {
    Name        = "${var.bucket_name}-${var.environment_suffix}"
    Environment = "production"
    Encryption  = "enabled"
  }
}

# Enable versioning for data protection and recovery
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access for security
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption with AES256
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ==========================================
# IAM ROLE FOR EC2 INSTANCES
# ==========================================
# IAM role for EC2 instances to access S3
resource "aws_iam_role" "ec2_s3_access" {
  name = "ec2-s3-access-role-${var.environment_suffix}"

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
    Name = "ec2-s3-access-role"
  }
}

# IAM policy for S3 bucket access
resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "ec2-s3-access-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetObjectVersion",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      }
    ]
  })
}

# IAM instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_s3_access" {
  name = "ec2-s3-access-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_s3_access.name
}

# ==========================================
# S3 BUCKET POLICY
# ==========================================
# Bucket policy to restrict access to VPC and IAM role only
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCAndRoleAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_s3_access.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

# ==========================================
# SECURITY GROUP FOR EC2 INSTANCES
# ==========================================
# Security group with restricted SSH access and internal VPC communication
resource "aws_security_group" "ec2" {
  name        = "ec2-security-group-${var.environment_suffix}"
  description = "Security group for EC2 instances in private subnets"
  vpc_id      = aws_vpc.main.id

  # SSH access from specified IP only
  ingress {
    description = "SSH from allowed IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_ip]
  }

  # Allow internal VPC communication
  ingress {
    description = "Internal VPC traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  # Outbound internet access for updates and S3 communication
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-security-group-${var.environment_suffix}"
  }
}

# ==========================================
# EC2 INSTANCES
# ==========================================
# Launch EC2 instances in private subnets with IAM role for S3 access
resource "aws_instance" "private" {
  count                  = length(var.private_subnet_cidrs)
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_s3_access.name

  # User data script to install AWS CLI and configure S3 access
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y aws-cli
    
    # Create a test file and upload to S3
    echo "Instance ${count.index + 1} initialized at $(date)" > /tmp/instance-init.txt
    aws s3 cp /tmp/instance-init.txt s3://${var.bucket_name}-${var.environment_suffix}/instance-${count.index + 1}-init.txt
    
    # Log S3 access test
    echo "S3 access test completed" >> /var/log/user-data.log
  EOF

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 for enhanced security
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true # Enable EBS encryption for data at rest protection
  }

  tags = {
    Name = "private-instance-az${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
    AZ   = data.aws_availability_zones.available.names[count.index]
  }
}

# ==========================================
# VPC ENDPOINTS (Optional - for better S3 performance)
# ==========================================
# S3 VPC Endpoint for private subnet traffic to S3 without NAT Gateway
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  route_table_ids = aws_route_table.private[*].id

  tags = {
    Name = "s3-vpc-endpoint-${var.environment_suffix}"
  }
}

# ==========================================
# OUTPUTS
# ==========================================
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

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.private[*].id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.private[*].private_ip
}

output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}
```

## Key Features & Best Practices

### Security Best Practices Implemented

1. **S3 Bucket Security**
   - Server-side encryption (AES256)
   - Versioning enabled for data recovery
   - All public access blocked
   - Bucket policy enforcing secure transport (HTTPS only)
   - Access restricted to IAM role only

2. **EC2 Security**
   - Instances deployed in private subnets (no direct internet access)
   - IAM roles instead of access keys
   - IMDSv2 enforced (enhanced metadata security)
   - Encrypted EBS volumes
   - Security group with minimal ingress rules

3. **Network Security**
   - Private subnets isolated from direct internet access
   - NAT Gateways for controlled outbound connectivity
   - VPC Endpoints for private S3 access (reduces NAT Gateway costs)
   - Proper subnet tagging and organization

4. **High Availability**
   - Resources distributed across 3 Availability Zones
   - Independent NAT Gateways per AZ (no single point of failure)
   - Separate route tables per private subnet

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Terraform >= 1.4.0 installed
- AWS Provider >= 5.0

### Local Deployment

```bash
# Navigate to the lib directory
cd lib

# Initialize Terraform (without backend)
terraform init -backend=false

# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply configuration
terraform apply
```

### CI/CD Deployment (GitHub Actions)

The infrastructure is designed to be deployed via GitHub Actions with S3 backend for state management:

```bash
# The pipeline automatically:
# 1. Configures S3 backend
# 2. Runs terraform init with backend configuration
# 3. Runs terraform plan
# 4. Deploys infrastructure with terraform apply
# 5. Exports outputs for verification
```

## Outputs After Deployment

Upon successful deployment, you'll receive:

```
Outputs:

vpc_id = "vpc-xxxxxxxxx"
public_subnet_ids = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
private_subnet_ids = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]
nat_gateway_ids = ["nat-xxx", "nat-yyy", "nat-zzz"]
ec2_instance_ids = ["i-xxx", "i-yyy", "i-zzz"]
s3_bucket_name = "secure-vpc-bucket-demo-2024-dev"
ec2_private_ips = ["10.0.101.x", "10.0.102.y", "10.0.103.z"]
security_group_id = "sg-xxxxxxxxx"
```

## Cost Optimization Considerations

1. **VPC Endpoints**: S3 VPC Endpoint reduces NAT Gateway data transfer costs
2. **NAT Gateway**: Consider using a single NAT Gateway for dev/test environments
3. **Instance Sizing**: t2.micro instances eligible for AWS Free Tier
4. **S3 Lifecycle**: Implement lifecycle policies for older versions

## Compliance & Security

This solution meets the following compliance requirements:

**CIS AWS Foundations Benchmark:**
- Encrypted storage (S3, EBS)
- VPC flow logs ready (can be enabled)
- IAM roles follow least privilege principle
- Network segmentation implemented

**AWS Well-Architected Framework:**
- **Security**: Encryption, IAM roles, private subnets, security groups
- **Reliability**: Multi-AZ deployment, no single points of failure
- **Performance**: VPC endpoints for optimized S3 access
- **Cost Optimization**: Right-sized instances, efficient routing
- **Operational Excellence**: Infrastructure as Code with Terraform

## Conclusion

This implementation provides a production-ready, secure, and scalable AWS VPC infrastructure that:
- Meets all requirements specified in PROMPT.md
- Follows AWS and Terraform best practices
- Is fully documented and maintainable
- Ready for CI/CD deployment
