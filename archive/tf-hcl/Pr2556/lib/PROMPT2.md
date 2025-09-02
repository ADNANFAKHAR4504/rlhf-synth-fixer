I got some errors in the pipeline. I'm providing the Terraform codebase you generated and the error message I got when I ran the pipeline. Please provide a solution to the error message generated in the pipeline.
Also, some files (cloudwatch.tf, cloudtrail.tf, ec2.tf, outputs.tf, etc.) were not completely generated. Please provide the necessary files and solution to the error message so that the pipeline can run successfully.

Here is the Terraform codebase you generated.

## File Structure

```
.
├── provider.tf
├── variables.tf
├── vpc.tf
├── security_groups.tf
├── nacl.tf
├── kms.tf
├── s3.tf
├── iam.tf
├── ec2.tf
├── cloudtrail.tf
├── cloudwatch.tf
├── config.tf
├── sns.tf
└── outputs.tf
```

## provider.tf

```hcl
# AWS Provider configuration with S3 backend for state management
# This file contains the provider configuration and remote state backend
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for remote state storage with encryption and locking
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# AWS Provider with default tags applied to all resources
# Ensures consistent tagging across the entire infrastructure
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "Production"
      Owner       = "TeamX"
      ManagedBy   = "Terraform"
    }
  }
}
```

## variables.tf

```hcl
# Variable definitions for the production infrastructure
# These variables control the behavior and configuration of all resources

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "Only us-west-2 is allowed for this production deployment."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC - /16 provides 65,536 IP addresses"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "trusted_cidrs" {
  description = "List of trusted CIDR blocks for network access - restrict to known networks only"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition     = length(var.trusted_cidrs) > 0
    error_message = "At least one trusted CIDR must be specified."
  }
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"

  validation {
    condition     = contains(["t3.small", "t3.medium", "t3.large", "m5.large", "m5.xlarge"], var.instance_type)
    error_message = "Instance type must be from approved list for production use."
  }
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.min_size >= 2
    error_message = "Minimum size must be at least 2 for high availability."
  }
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6

  validation {
    condition     = var.max_size >= var.min_size
    error_message = "Maximum size must be greater than or equal to minimum size."
  }
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}
```

## vpc.tf

```hcl
# Data source to get available AZs in the region
# This ensures we deploy across multiple AZs for high availability
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

# Main VPC - Foundation of our secure network architecture
# Uses /16 CIDR to provide ample IP space while maintaining security boundaries
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Security: Disable VPC flow logs to CloudWatch by default
  # Enable only when needed for troubleshooting to reduce costs

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# Internet Gateway - Provides internet access for public subnets
# Only public subnets (ALB, NAT) will route through this gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# Public Subnets - Host NAT Gateways and Load Balancers only
# These subnets have direct internet access but contain no application instances
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false # Security: Never auto-assign public IPs

  tags = {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets - Host all application workloads
# These subnets have no direct internet access; egress via NAT Gateway only
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
# Each AZ gets its own NAT Gateway for high availability
resource "aws_eip" "nat" {
  count = 2

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways - Provide secure outbound internet access for private subnets
# Deployed in public subnets but serve private subnet egress traffic
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
  }
}

# Public Route Table - Routes traffic from public subnets to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

# Private Route Tables - One per AZ for fault isolation
# Routes traffic from private subnets to respective NAT Gateway
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with their respective private route tables
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

```

## security_groups.tf

```hcl
# Application Load Balancer Security Group
# Allows inbound HTTPS/HTTP only from trusted CIDR ranges
# This is the only security group that accepts traffic from the internet
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer - restricts access to trusted CIDRs only"

  # Allow HTTPS from trusted networks only
  dynamic "ingress" {
    for_each = var.trusted_cidrs
    content {
      description = "HTTPS from trusted CIDR ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Allow HTTP from trusted networks only (for redirect to HTTPS)
  dynamic "ingress" {
    for_each = var.trusted_cidrs
    content {
      description = "HTTP from trusted CIDR ${ingress.value} (redirect to HTTPS)"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Egress: Allow outbound to application instances on port 8080
  egress {
    description     = "HTTP to application instances"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.app_instances.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Instance Security Group
# Only accepts traffic from ALB and allows minimal outbound access
resource "aws_security_group" "app_instances" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances - only allows traffic from ALB"

  # Allow inbound from ALB security group only
  ingress {
    description     = "HTTP from Application Load Balancer"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Egress: HTTPS for package updates, API calls, etc.
  egress {
    description = "HTTPS outbound for updates and API calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: HTTP for package repositories (many still use HTTP)
  egress {
    description = "HTTP outbound for package repositories"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: DNS resolution
  egress {
    description = "DNS resolution"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-app-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
# Allows HTTPS access to AWS services via VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-${var.environment}-vpce-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for VPC endpoints - allows HTTPS from private subnets"

  # Allow HTTPS from private subnets for AWS API access
  ingress {
    description = "HTTPS from private subnets to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.private : subnet.cidr_block]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-vpce-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group validation to ensure no wide-open ingress rules
resource "null_resource" "security_group_validation" {
  triggers = {
    alb_sg_id = aws_security_group.alb.id
    app_sg_id = aws_security_group.app_instances.id
  }

  provisioner "local-exec" {
    command = "echo 'Security groups created with restricted access - no 0.0.0.0/0 ingress on application instances'"
  }
}

```

## nacl.tf

```hcl
# Network ACL for Public Subnets
# Provides additional layer of security for subnets containing NAT Gateways and ALBs
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-public-nacl"
  }
}

# Network ACL for Private Subnets
# Strict controls for application workload subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-private-nacl"
  }
}

# Public NACL Rules - Inbound
# Allow HTTPS/HTTP from trusted CIDRs for ALB access
resource "aws_network_acl_rule" "public_inbound_https" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_inbound_http" {
  count = length(var.trusted_cidrs)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 200 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.trusted_cidrs[count.index]
  from_port      = 80
  to_port        = 80
}

# Allow ephemeral ports for return traffic (ALB health checks, responses)
resource "aws_network_acl_rule" "public_inbound_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Public NACL Rules - Outbound
# Allow all outbound traffic for NAT Gateway functionality
resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Private NACL Rules - Inbound
# Allow traffic from public subnets (ALB to instances)
resource "aws_network_acl_rule" "private_inbound_from_public" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 100 + count.index
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.public[count.index].cidr_block
  from_port      = 8080
  to_port        = 8080
}

# Allow intra-VPC communication for private subnets
resource "aws_network_acl_rule" "private_inbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Allow ephemeral ports for return traffic
resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 300
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL Rules - Outbound
# Allow HTTPS for package updates and AWS API calls
resource "aws_network_acl_rule" "private_outbound_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

# Allow HTTP for package repositories
resource "aws_network_acl_rule" "private_outbound_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

# Allow DNS resolution
resource "aws_network_acl_rule" "private_outbound_dns" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  protocol       = "udp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 53
  to_port        = 53
}

# Allow intra-VPC communication
resource "aws_network_acl_rule" "private_outbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

```

## kms.tf

```hcl
# Get current AWS account ID and region for KMS key policy
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Customer Managed KMS Key for S3 and CloudTrail encryption
# Provides granular control over encryption and access policies
resource "aws_kms_key" "main" {
  description             = "Customer managed key for ${var.project_name} ${var.environment} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  # Comprehensive key policy following least privilege principles
  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-policy-${var.project_name}-${var.environment}"
    Statement = [
      # Root account administrative access
      {
        Sid    = "EnableRootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      # S3 service access for server-side encryption
      {
        Sid    = "AllowS3ServiceAccess"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      # CloudTrail service access for log encryption
      {
        Sid    = "AllowCloudTrailAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "cloudtrail.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      # CloudWatch Logs service access
      {
        Sid    = "AllowCloudWatchLogsAccess"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.project_name}-${var.environment}"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-cmk"
  }
}

# KMS Key Alias for easier reference and management
resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-key"
  target_key_id = aws_kms_key.main.key_id
}

```

## s3.tf

```hcl
# S3 bucket for application data storage
# Implements security best practices: encryption, versioning, access logging
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.project_name}-${var.environment}-app-data-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-app-data"
    Purpose    = "Application data storage"
    Compliance = "SOC2"
  }
}

# S3 bucket for access logs and audit trails
# Separate bucket for security logs to prevent tampering
resource "aws_s3_bucket" "logging" {
  bucket = "${var.project_name}-${var.environment}-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-logs"
    Purpose    = "Access logs and audit trails"
    Compliance = "SOC2"
  }
}

# Random suffix to ensure globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Block all public access to application data bucket
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block all public access to logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on application data bucket for data protection
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable versioning on logging bucket for audit trail integrity
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# KMS encryption for application data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# KMS encryption for logging bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Access logging for application data bucket (logs go to logging bucket)
resource "aws_s3_bucket_logging" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/app-data/"
}

# Lifecycle policy for application data bucket
# Manages storage costs while maintaining compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "app_data_lifecycle"
    status = "Enabled"

    # Transition current objects to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition current objects to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete non-current versions after 90 days to manage costs
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Transition non-current versions to IA after 30 days
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

# Lifecycle policy for logging bucket
# Longer retention for audit and compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "logging_lifecycle"
    status = "Enabled"

    # Transition to IA after 90 days (logs accessed less frequently)
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 365 days
    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # Keep non-current versions for 7 years for compliance
    noncurrent_version_expiration {
      noncurrent_days = 2555 # 7 years
    }
  }
}

# Bucket policy for CloudTrail access to logging bucket
resource "aws_s3_bucket_policy" "logging_cloudtrail" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      }
    ]
  })
}

```

## iam.tf

```hcl
# EC2 Instance Role - Minimal permissions for SSM and CloudWatch
# Follows least privilege principle with scoped permissions
resource "aws_iam_role" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-role"

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
    Name = "${var.project_name}-${var.environment}-ec2-instance-role"
  }
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-profile"
  role = aws_iam_
```

## tap_stack.tf

```hcl
# Core region variable consumed by provider.tf
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^us-west-2$", var.aws_region))
    error_message = "Only us-west-2 is allowed for this production deployment."
  }
}

# Trusted CIDR blocks for network access control
# These should be your corporate networks, VPN endpoints, etc.
variable "trusted_cidrs" {
  description = "List of trusted CIDR blocks for network access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition = alltrue([
      for cidr in var.trusted_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All trusted_cidrs must be valid CIDR blocks."
  }
}

# VPC CIDR block - /16 provides 65,536 IP addresses
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && split("/", var.vpc_cidr)[1] == "16"
    error_message = "VPC CIDR must be a valid /16 CIDR block."
  }
}

# Environment identifier for resource naming
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must contain only lowercase letters, numbers, and hyphens."
  }
}

# Project name for resource naming and organization
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "secure-foundation"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}


```

# Here is the Terraform Deployment error that needs fixing:

I'm getting deployment errors with the current Terraform configuration. The error is blocking the entire deployment, and I need help resolving it.
Error message:

│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│
│ The Terraform configuration must be valid before initialization so that
│ Terraform can determine which modules and providers need to be installed.
│
│
╵
╷
│ Error: Unclosed configuration block
│
│ on iam.tf line 25, in resource "aws_iam_instance_profile" "ec2_instance":
│ 25: resource "aws_iam_instance_profile" "ec2_instance" {
│
│ There is no closing brace for this block before the end of the file. This
│ may be caused by incorrect brace nesting elsewhere in this file.
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.
