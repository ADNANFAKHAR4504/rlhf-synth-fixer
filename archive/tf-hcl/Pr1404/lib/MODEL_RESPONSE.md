I'll create the two Terraform files as requested. Here's the complete solution:

## File 1: provider.tf

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

provider "aws" {
  region = "us-east-1"
}
```

## File 2: tap_stack.tf

```hcl
# Variables
variable "environment_tag" {
  description = "Environment tag to be applied to all resources"
  type        = string
  default     = "production"
}

variable "owner_tag" {
  description = "Owner tag to be applied to all resources"
  type        = string
  default     = "devops-team"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "private-subnet-1"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "private-subnet-2"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "private-route-table"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Route table associations
resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

# S3 VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name        = "s3-vpc-endpoint"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# KMS Key
resource "aws_kms_key" "main" {
  description             = "KMS key for encrypting sensitive outputs"
  deletion_window_in_days = 7

  tags = {
    Name        = "main-kms-key"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/main-key"
  target_key_id = aws_kms_key.main.key_id
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "cloudtrail-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "cloudtrail-logs-bucket"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
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
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "main-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name        = "main-cloudtrail"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# Secure Data S3 Bucket
resource "aws_s3_bucket" "secure_data" {
  bucket        = "secure-data-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "secure-data-bucket"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

resource "aws_s3_bucket_public_access_block" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Secure Data S3 Bucket Policy
resource "aws_s3_bucket_policy" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.secure_data.arn,
          "${aws_s3_bucket.secure_data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "DenyAccessNotFromVPCEndpoint"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.secure_data.arn,
          "${aws_s3_bucket.secure_data.arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "aws:sourceVpce" = aws_vpc_endpoint.s3.id
          }
        }
      }
    ]
  })
}

# IAM Group for MFA Enforcement
resource "aws_iam_group" "mfa_required" {
  name = "mfa-required-group"
}

# IAM Group Policy for MFA Enforcement
resource "aws_iam_group_policy" "mfa_enforcement" {
  name  = "mfa-enforcement-policy"
  group = aws_iam_group.mfa_required.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptUsersWithMFA"
        Effect = "Deny"
        Action = "*"
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

# Security Group for EC2 Instance
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg"
  vpc_id      = aws_vpc.main.id

  # Allow HTTPS outbound for SSM
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ec2-security-group"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# IAM Role for EC2 Instance
resource "aws_iam_role" "ec2_role" {
  name = "ec2-ssm-role"

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
    Name        = "ec2-ssm-role"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Attach AWS Managed Policy to IAM Role
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-ssm-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "ec2-ssm-profile"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# EC2 Instance
resource "aws_instance" "main" {
  ami                     = data.aws_ami.amazon_linux.id
  instance_type           = "t3.micro"
  subnet_id               = aws_subnet.private_1.id
  vpc_security_group_ids  = [aws_security_group.ec2.id]
  iam_instance_profile    = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  tags = {
    Name        = "main-ec2-instance"
    Environment = var.environment_tag
    Owner       = var.owner_tag
  }
}

# Outputs
output "secure_data_bucket_name" {
  description = "Name of the secure data S3 bucket"
  value       = aws_s3_bucket.secure_data.bucket
  sensitive   = true
}
```

## Key Features Implemented:

### Security & Compliance:
- **KMS Encryption**: All sensitive data encrypted with customer-managed KMS key
- **VPC Endpoint**: Private S3 access without internet gateway
- **CloudTrail**: Complete API logging to dedicated S3 bucket
- **MFA Enforcement**: IAM group policy requiring MFA for all actions
- **Secure Transport**: S3 bucket policy enforcing HTTPS-only access

### Network Security:
- **Private Subnets**: EC2 instances have no public IP addresses
- **Security Groups**: Minimal egress rules for SSM connectivity
- **VPC Isolation**: All resources deployed within private VPC

### Access Control:
- **Least Privilege**: EC2 role uses only necessary AWS managed policy
- **Bucket Policies**: Dual enforcement (VPC endpoint + HTTPS)
- **Public Access Block**: S3 buckets completely private

### Best Practices:
- **Resource Tagging**: Consistent tagging across all resources
- **Random Naming**: Unique S3 bucket names using random suffixes
- **Sensitive Outputs**: Bucket name marked as sensitive in Terraform state

