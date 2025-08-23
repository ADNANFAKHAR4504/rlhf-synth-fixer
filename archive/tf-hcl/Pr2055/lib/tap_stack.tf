# tap_stack.tf - Complete Terraform configuration for secure infrastructure

#==============================================================================
# VARIABLES
#==============================================================================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "Resources must be deployed in us-west-2 region."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "tap-secure"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
  default     = ""
}

#==============================================================================
# LOCALS
#==============================================================================

locals {
  # Consistent naming convention
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Region      = var.aws_region
  }

  # VPC configuration
  vpc_cidr = "10.0.0.0/16"
  
  # Availability zones
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
}

#==============================================================================
# DATA SOURCES
#==============================================================================

# Get latest Amazon Linux 2 AMI
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

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

#==============================================================================
# VPC AND NETWORKING
#==============================================================================

# VPC
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

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(aws_subnet.public)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(aws_subnet.private)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

#==============================================================================
# VPC ENDPOINTS
#==============================================================================

# S3 VPC Endpoint (Gateway)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

#==============================================================================
# RANDOM STRINGS FOR UNIQUE NAMING
#==============================================================================

# Random string for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Random string for CloudTrail bucket
resource "random_string" "cloudtrail_suffix" {
  length  = 8
  special = false
  upper   = false
}

#==============================================================================
# KMS KEY
#==============================================================================

# AWS managed KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption and CloudTrail"
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
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${local.name_prefix}-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

#==============================================================================
# S3 BUCKET
#==============================================================================

# Private S3 Bucket
resource "aws_s3_bucket" "private" {
  bucket = "${local.name_prefix}-private-bucket-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-bucket"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "private" {
  bucket = aws_s3_bucket.private.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "private" {
  bucket = aws_s3_bucket.private.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "private" {
  bucket = aws_s3_bucket.private.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy to deny public access
resource "aws_s3_bucket_policy" "private" {
  bucket = aws_s3_bucket.private.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.private.arn,
          "${aws_s3_bucket.private.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.private]
}

#==============================================================================
# CLOUDTRAIL S3 BUCKET
#==============================================================================

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-cloudtrail-${random_string.cloudtrail_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-bucket"
  })
}

# CloudTrail S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# CloudTrail S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# CloudTrail S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

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
        Resource = aws_s3_bucket.cloudtrail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
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
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail]
}

#==============================================================================
# IAM ROLES AND POLICIES
#==============================================================================

# IAM Role for EC2 Instance
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

# IAM Policy for EC2 to access S3 (least privilege)
resource "aws_iam_policy" "ec2_s3_policy" {
  name        = "${local.name_prefix}-ec2-s3-policy"
  description = "Policy for EC2 to access specific S3 bucket"

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
        Resource = "${aws_s3_bucket.private.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.private.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_encryption.arn
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_s3_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_s3_policy.arn
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-profile"
  })
}

# IAM Group with MFA requirement
resource "aws_iam_group" "mfa_required" {
  name = "${local.name_prefix}-mfa-required-group"
}

# IAM Policy requiring MFA
resource "aws_iam_policy" "mfa_policy" {
  name        = "${local.name_prefix}-mfa-policy"
  description = "Policy requiring MFA for all actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# Attach MFA policy to group
resource "aws_iam_group_policy_attachment" "mfa_policy" {
  group      = aws_iam_group.mfa_required.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

#==============================================================================
# SECURITY GROUPS
#==============================================================================

# Security Group for EC2 Instance (HTTPS only from VPC)
resource "aws_security_group" "ec2_sg" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instance - HTTPS only from VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })
}

#==============================================================================
# EC2 INSTANCE
#==============================================================================

# EC2 Instance in Private Subnet
resource "aws_instance" "private" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name != "" ? var.key_pair_name : null
  subnet_id             = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile  = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring
  monitoring = true

  # EBS encryption
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-ec2-root-volume"
    })
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y awscli
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": ["used_percent"],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": ["mem_used_percent"],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    EOL
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-private"
  })
}

#==============================================================================
# CLOUDTRAIL
#==============================================================================

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  # Enable logging for all regions
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  # Enable log file validation
  enable_log_file_validation = true

  # KMS encryption
  kms_key_id = aws_kms_key.s3_encryption.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.private.arn}/*"]
    }
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail,
    aws_kms_key.s3_encryption
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

#==============================================================================
# OUTPUTS
#==============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# S3 Bucket Outputs
output "s3_bucket_id" {
  description = "ID of the private S3 bucket"
  value       = aws_s3_bucket.private.id
}

output "s3_bucket_arn" {
  description = "ARN of the private S3 bucket"
  value       = aws_s3_bucket.private.arn
}

output "cloudtrail_s3_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

# KMS Key Outputs
output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

# EC2 Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.private.id
}

output "ec2_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.private.private_ip
}

output "ec2_ami_id" {
  description = "AMI ID used for the EC2 instance"
  value       = data.aws_ami.amazon_linux.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "mfa_group_name" {
  description = "Name of the IAM group requiring MFA"
  value       = aws_iam_group.mfa_required.name
}

# Security Group Outputs
output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_sg.id
}

# CloudTrail Outputs
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# VPC Endpoint Outputs
output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

# Network Infrastructure Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "route_table_public_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "route_table_private_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

#==============================================================================
# ADDITIONAL OUTPUTS - EXTENDED
#==============================================================================

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = local.azs
}

# Public Subnet Details
output "public_subnet_cidrs" {
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "public_subnet_azs" {
  description = "Availability zones of the public subnets"
  value       = aws_subnet.public[*].availability_zone
}

# Private Subnet Details
output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "private_subnet_azs" {
  description = "Availability zones of the private subnets"
  value       = aws_subnet.private[*].availability_zone
}

# Elastic IP Outputs
output "nat_eip_ids" {
  description = "IDs of the Elastic IPs for NAT Gateways"
  value       = aws_eip.nat[*].id
}

output "nat_eip_public_ips" {
  description = "Public IP addresses of the Elastic IPs for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "nat_eip_allocation_ids" {
  description = "Allocation IDs of the Elastic IPs for NAT Gateways"
  value       = aws_eip.nat[*].allocation_id
}

# NAT Gateway Details
output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_nat_gateway.main[*].public_ip
}

output "nat_gateway_private_ips" {
  description = "Private IP addresses of the NAT Gateways"
  value       = aws_nat_gateway.main[*].private_ip
}

output "nat_gateway_subnet_ids" {
  description = "Subnet IDs where NAT Gateways are deployed"
  value       = aws_nat_gateway.main[*].subnet_id
}

# Route Table Association IDs
output "public_route_table_association_ids" {
  description = "IDs of the public subnet route table associations"
  value       = aws_route_table_association.public[*].id
}

output "private_route_table_association_ids" {
  description = "IDs of the private subnet route table associations"
  value       = aws_route_table_association.private[*].id
}

# VPC Endpoint Details
output "s3_vpc_endpoint_dns_entries" {
  description = "DNS entries for the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.dns_entry
}

output "s3_vpc_endpoint_route_table_ids" {
  description = "Route table IDs associated with S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.route_table_ids
}

output "s3_vpc_endpoint_policy_document" {
  description = "Policy document of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.policy
}

# Random String Outputs
output "s3_bucket_suffix" {
  description = "Random suffix used for S3 bucket naming"
  value       = random_string.bucket_suffix.result
}

output "cloudtrail_bucket_suffix" {
  description = "Random suffix used for CloudTrail bucket naming"
  value       = random_string.cloudtrail_suffix.result
}

# KMS Key Alias
output "kms_key_alias_name" {
  description = "Name of the KMS key alias"
  value       = aws_kms_alias.s3_encryption.name
}

output "kms_key_alias_arn" {
  description = "ARN of the KMS key alias"
  value       = aws_kms_alias.s3_encryption.arn
}

# S3 Bucket Detailed Outputs
output "s3_bucket_domain_name" {
  description = "Domain name of the private S3 bucket"
  value       = aws_s3_bucket.private.bucket_domain_name
}

output "s3_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the private S3 bucket"
  value       = aws_s3_bucket.private.hosted_zone_id
}

output "s3_bucket_region" {
  description = "Region of the private S3 bucket"
  value       = aws_s3_bucket.private.region
}

output "s3_bucket_versioning_status" {
  description = "Versioning status of the private S3 bucket"
  value       = aws_s3_bucket_versioning.private.versioning_configuration[0].status
}

# CloudTrail S3 Bucket Detailed Outputs
output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "cloudtrail_s3_bucket_domain_name" {
  description = "Domain name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket_domain_name
}

output "cloudtrail_s3_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.hosted_zone_id
}

output "cloudtrail_s3_bucket_region" {
  description = "Region of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.region
}

output "cloudtrail_s3_bucket_versioning_status" {
  description = "Versioning status of the CloudTrail S3 bucket"
  value       = aws_s3_bucket_versioning.cloudtrail.versioning_configuration[0].status
}

# IAM Role and Policy Details
output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_iam_role_unique_id" {
  description = "Unique ID of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.unique_id
}

output "ec2_s3_policy_arn" {
  description = "ARN of the EC2 S3 access policy"
  value       = aws_iam_policy.ec2_s3_policy.arn
}

output "ec2_s3_policy_name" {
  description = "Name of the EC2 S3 access policy"
  value       = aws_iam_policy.ec2_s3_policy.name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_unique_id" {
  description = "Unique ID of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.unique_id
}

# MFA IAM Resources
output "mfa_group_arn" {
  description = "ARN of the MFA required IAM group"
  value       = aws_iam_group.mfa_required.arn
}

output "mfa_group_unique_id" {
  description = "Unique ID of the MFA required IAM group"
  value       = aws_iam_group.mfa_required.unique_id
}

output "mfa_policy_arn" {
  description = "ARN of the MFA policy"
  value       = aws_iam_policy.mfa_policy.arn
}

output "mfa_policy_name" {
  description = "Name of the MFA policy"
  value       = aws_iam_policy.mfa_policy.name
}

# Security Group Details
output "ec2_security_group_arn" {
  description = "ARN of the EC2 security group"
  value       = aws_security_group.ec2_sg.arn
}

output "ec2_security_group_name" {
  description = "Name of the EC2 security group"
  value       = aws_security_group.ec2_sg.name
}

output "ec2_security_group_description" {
  description = "Description of the EC2 security group"
  value       = aws_security_group.ec2_sg.description
}

output "ec2_security_group_ingress_rules" {
  description = "Ingress rules of the EC2 security group"
  value       = aws_security_group.ec2_sg.ingress
}

output "ec2_security_group_egress_rules" {
  description = "Egress rules of the EC2 security group"
  value       = aws_security_group.ec2_sg.egress
}

# EC2 Instance Detailed Outputs
output "ec2_instance_arn" {
  description = "ARN of the EC2 instance"
  value       = aws_instance.private.arn
}

output "ec2_instance_state" {
  description = "State of the EC2 instance"
  value       = aws_instance.private.instance_state
}

output "ec2_instance_type" {
  description = "Instance type of the EC2 instance"
  value       = aws_instance.private.instance_type
}

output "ec2_instance_availability_zone" {
  description = "Availability zone of the EC2 instance"
  value       = aws_instance.private.availability_zone
}

output "ec2_instance_subnet_id" {
  description = "Subnet ID where EC2 instance is deployed"
  value       = aws_instance.private.subnet_id
}

output "ec2_instance_vpc_security_group_ids" {
  description = "VPC security group IDs associated with EC2 instance"
  value       = aws_instance.private.vpc_security_group_ids
}

output "ec2_instance_key_name" {
  description = "Key pair name associated with EC2 instance"
  value       = aws_instance.private.key_name
}

output "ec2_instance_monitoring" {
  description = "Monitoring status of the EC2 instance"
  value       = aws_instance.private.monitoring
}

output "ec2_root_block_device" {
  description = "Root block device details of the EC2 instance"
  value       = aws_instance.private.root_block_device
}

# CloudTrail Detailed Outputs
output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main.home_region
}

output "cloudtrail_s3_bucket_name" {
  description = "S3 bucket name used by CloudTrail"
  value       = aws_cloudtrail.main.s3_bucket_name
}

output "cloudtrail_kms_key_id" {
  description = "KMS key ID used by CloudTrail"
  value       = aws_cloudtrail.main.kms_key_id
}

output "cloudtrail_is_multi_region_trail" {
  description = "Whether CloudTrail is multi-region"
  value       = aws_cloudtrail.main.is_multi_region_trail
}

output "cloudtrail_include_global_service_events" {
  description = "Whether CloudTrail includes global service events"
  value       = aws_cloudtrail.main.include_global_service_events
}

output "cloudtrail_enable_log_file_validation" {
  description = "Whether CloudTrail log file validation is enabled"
  value       = aws_cloudtrail.main.enable_log_file_validation
}

output "cloudtrail_event_selector" {
  description = "Event selector configuration of CloudTrail"
  value       = aws_cloudtrail.main.event_selector
}

# Data Source Outputs
output "current_aws_account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "current_aws_region" {
  description = "Current AWS region"
  value       = data.aws_region.current.name
}

output "amazon_linux_ami_name" {
  description = "Name of the Amazon Linux AMI used"
  value       = data.aws_ami.amazon_linux.name
}

output "amazon_linux_ami_description" {
  description = "Description of the Amazon Linux AMI used"
  value       = data.aws_ami.amazon_linux.description
}

output "amazon_linux_ami_owner_id" {
  description = "Owner ID of the Amazon Linux AMI used"
  value       = data.aws_ami.amazon_linux.owner_id
}

output "amazon_linux_ami_creation_date" {
  description = "Creation date of the Amazon Linux AMI used"
  value       = data.aws_ami.amazon_linux.creation_date
}

# Local Values Outputs
output "name_prefix" {
  description = "Name prefix used for all resources"
  value       = local.name_prefix
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

output "vpc_cidr" {
  description = "VPC CIDR block from locals"
  value       = local.vpc_cidr
}

# S3 Bucket Public Access Block Details
output "s3_bucket_public_access_block_id" {
  description = "ID of the S3 bucket public access block"
  value       = aws_s3_bucket_public_access_block.private.id
}

output "cloudtrail_s3_bucket_public_access_block_id" {
  description = "ID of the CloudTrail S3 bucket public access block"
  value       = aws_s3_bucket_public_access_block.cloudtrail.id
}

# S3 Bucket Encryption Details
output "s3_bucket_encryption_configuration" {
  description = "Encryption configuration of the private S3 bucket"
  value       = aws_s3_bucket_server_side_encryption_configuration.private.rule
}

output "cloudtrail_s3_bucket_encryption_configuration" {
  description = "Encryption configuration of the CloudTrail S3 bucket"
  value       = aws_s3_bucket_server_side_encryption_configuration.cloudtrail.rule
}

# Variable Values (for reference)
output "input_aws_region" {
  description = "Input AWS region variable value"
  value       = var.aws_region
}

output "input_environment" {
  description = "Input environment variable value"
  value       = var.environment
}

output "input_project_name" {
  description = "Input project name variable value"
  value       = var.project_name
}

output "input_instance_type" {
  description = "Input instance type variable value"
  value       = var.instance_type
}

output "input_key_pair_name" {
  description = "Input key pair name variable value"
  value       = var.key_pair_name
}

# Resource Counts
output "public_subnets_count" {
  description = "Number of public subnets created"
  value       = length(aws_subnet.public)
}

output "private_subnets_count" {
  description = "Number of private subnets created"
  value       = length(aws_subnet.private)
}

output "nat_gateways_count" {
  description = "Number of NAT gateways created"
  value       = length(aws_nat_gateway.main)
}

output "elastic_ips_count" {
  description = "Number of Elastic IPs created"
  value       = length(aws_eip.nat)
}
