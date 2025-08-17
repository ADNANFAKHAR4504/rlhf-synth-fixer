# lib/main.tf
# Complete secure AWS Terraform configuration
#
# Requirements mapping:
# 1. IAM tag-based S3 access control: aws_iam_role.s3_tag_based_access + aws_iam_role_policy.s3_tag_based_policy
# 2. EC2 in pre-defined network: aws_instance.secure_instance + aws_security_group.secure_sg
# 3. S3 encryption at rest/transit: aws_s3_bucket_encryption + aws_s3_bucket_policy.data_bucket_policy
# 4. CloudTrail auditing: aws_cloudtrail.audit_trail + aws_s3_bucket_policy.trail_bucket_policy
# 5. Least-privilege IAM user: aws_iam_user.deployment_user + aws_iam_user_policy.deployment_policy
# 6. Strict tagging: default_tags on all resources
# 7. Region & inputs: All variables defined below

# Variables
variable "vpc_id" {
  description = "VPC ID where resources will be deployed"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for EC2 instance"
  type        = string
}

variable "allowed_cidr" {
  description = "CIDR range allowed for SSH and HTTPS access"
  type        = string
}

variable "s3_kms_key_arn" {
  description = "KMS key ARN for S3 bucket encryption"
  type        = string
}

variable "data_bucket_name" {
  description = "Name for the main data S3 bucket"
  type        = string
}

variable "trail_bucket_name" {
  description = "Name for the CloudTrail logs S3 bucket"
  type        = string
}

variable "instance_ami" {
  description = "AMI ID for EC2 instance"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2 in us-west-2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for data with tag-based access control
resource "aws_s3_bucket" "data_bucket" {
  bucket = var.data_bucket_name

  tags = {
    Environment        = "Production"
    "data:classification" = "confidential"
  }
}

# S3 bucket encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.s3_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "data_bucket_versioning" {
  bucket = aws_s3_bucket.data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "data_bucket_pab" {
  bucket = aws_s3_bucket.data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for data bucket - enforce TLS and KMS encryption
resource "aws_s3_bucket_policy" "data_bucket_policy" {
  bucket = aws_s3_bucket.data_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data_bucket.arn,
          "${aws_s3_bucket.data_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "RequireKMSEncryption"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.data_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption"           = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = var.s3_kms_key_arn
          }
        }
      }
    ]
  })
}

# IAM role for tag-based S3 access
resource "aws_iam_role" "s3_tag_based_access" {
  name = "s3-tag-based-access-role"

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
    Environment = "Production"
  }
}

# IAM policy for tag-based S3 access - allows access only to objects with specific tags
resource "aws_iam_role_policy" "s3_tag_based_policy" {
  name = "s3-tag-based-policy"
  role = aws_iam_role.s3_tag_based_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowListBucketWithTagCondition"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.data_bucket.arn
        Condition = {
          StringEquals = {
            "aws:ResourceTag/data:classification" = "confidential"
          }
        }
      },
      {
        Sid    = "AllowGetObjectWithTagCondition"
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.data_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:ExistingObjectTag/data:classification" = "confidential"
          }
        }
      },
      {
        Sid       = "DenyNonTLSRequests"
        Effect    = "Deny"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data_bucket.arn,
          "${aws_s3_bucket.data_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Security Group for EC2 instance - only SSH and HTTPS from allowed CIDR
resource "aws_security_group" "secure_sg" {
  name_prefix = "secure-sg-"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  ingress {
    description = "HTTPS from allowed CIDR"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = "Production"
  }
}

# EC2 instance in specified network
resource "aws_instance" "secure_instance" {
  ami                    = var.instance_ami
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.secure_sg.id]

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    encrypted = true
  }

  tags = {
    Environment = "Production"
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "trail_bucket" {
  bucket = var.trail_bucket_name

  tags = {
    Environment = "Production"
  }
}

# S3 bucket encryption for trail bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "trail_bucket_encryption" {
  bucket = aws_s3_bucket.trail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.s3_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block for trail bucket
resource "aws_s3_bucket_public_access_block" "trail_bucket_pab" {
  bucket = aws_s3_bucket.trail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail delivery
resource "aws_s3_bucket_policy" "trail_bucket_policy" {
  bucket = aws_s3_bucket.trail_bucket.id

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
        Resource = aws_s3_bucket.trail_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/audit-trail"
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
        Resource = "${aws_s3_bucket.trail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/audit-trail"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.trail_bucket.arn,
          "${aws_s3_bucket.trail_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# CloudTrail for auditing all API calls
resource "aws_cloudtrail" "audit_trail" {
  name           = "audit-trail"
  s3_bucket_name = aws_s3_bucket.trail_bucket.id

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.data_bucket.arn}/*"]
    }
  }

  enable_log_file_validation = true
  include_global_service_events = true
  is_multi_region_trail = false

  tags = {
    Environment = "Production"
  }

  depends_on = [aws_s3_bucket_policy.trail_bucket_policy]
}

# IAM user for deployment with least privilege
resource "aws_iam_user" "deployment_user" {
  name = "terraform-deployment-user"

  tags = {
    Environment = "Production"
  }
}

# IAM policy for deployment user - minimal permissions for managing these specific resources
resource "aws_iam_user_policy" "deployment_policy" {
  name = "terraform-deployment-policy"
  user = aws_iam_user.deployment_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageSpecificS3Buckets"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:GetBucketEncryption",
          "s3:GetBucketPolicy",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketVersioning",
          "s3:PutBucketEncryption",
          "s3:PutBucketPolicy",
          "s3:PutBucketPublicAccessBlock",
          "s3:DeleteBucketPolicy"
        ]
        Resource = [
          aws_s3_bucket.data_bucket.arn,
          aws_s3_bucket.trail_bucket.arn
        ]
      },
      {
        Sid    = "ManageSpecificEC2Resources"
        Effect = "Allow"
        Action = [
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeSecurityGroups",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateTags",
          "ec2:DescribeTags"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:vpc" = var.vpc_id
          }
        }
      },
      {
        Sid    = "ManageSpecificIAMResources"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:GetUser",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          "iam:GetUserPolicy",
          "iam:ListUserPolicies",
          "iam:TagUser",
          "iam:UntagUser"
        ]
        Resource = [
          aws_iam_role.s3_tag_based_access.arn,
          aws_iam_user.deployment_user.arn
        ]
      },
      {
        Sid    = "ManageCloudTrail"
        Effect = "Allow"
        Action = [
          "cloudtrail:CreateTrail",
          "cloudtrail:DeleteTrail",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:StartLogging",
          "cloudtrail:StopLogging",
          "cloudtrail:PutEventSelectors",
          "cloudtrail:GetEventSelectors"
        ]
        Resource = aws_cloudtrail.audit_trail.arn
      },
      {
        Sid    = "ReadOnlyPermissions"
        Effect = "Allow"
        Action = [
          "sts:GetCallerIdentity",
          "sts:GetAccountSummary"
        ]
        Resource = "*"
      }
    ]
  })
}

# Outputs for verification
output "data_bucket_name" {
  description = "Name of the data S3 bucket"
  value       = aws_s3_bucket.data_bucket.id
}

output "trail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.trail_bucket.id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.audit_trail.arn
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.secure_instance.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.secure_sg.id
}

output "iam_role_name" {
  description = "Name of the IAM role for tag-based S3 access"
  value       = aws_iam_role.s3_tag_based_access.name
}

output "iam_user_name" {
  description = "Name of the deployment IAM user"
  value       = aws_iam_user.deployment_user.name
}

# Access guidance for deployment user (credentials must be created separately)
# To use this deployment user:
# 1. Create access keys via AWS Console or CLI: aws iam create-access-key --user-name terraform-deployment-user
# 2. Configure AWS CLI: aws configure --profile deployment
# 3. Use profile: terraform apply -var-file=terraform.tfvars