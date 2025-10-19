# tap_stack.tf - Production-grade AWS infrastructure configuration
# This configuration sets up essential AWS resources following security best practices

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# AWS Provider configuration for us-west-2 region
provider "aws" {
  region = "us-west-2"

  # Best practice: Define default tags at provider level for consistency
  default_tags {
    tags = {
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

# Input variables for configuration flexibility
variable "key_name" {
  description = "Name of the AWS key pair for EC2 SSH access"
  type        = string

  validation {
    condition     = length(var.key_name) > 0
    error_message = "Key name must not be empty"
  }
}

variable "allowed_ip" {
  description = "IP address allowed to SSH into EC2 instance (format: x.x.x.x/32)"
  type        = string

  # Best practice: Validate IP format to prevent misconfigurations
  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", var.allowed_ip))
    error_message = "Allowed IP must be in CIDR format (e.g., 192.168.1.1/32)"
  }
}

# Data source to get the latest Amazon Linux 2 AMI
# Best practice: Use data sources for AMI to ensure latest patched version
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

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# Generate unique suffix for S3 bucket name to ensure global uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# S3 Bucket with versioning and encryption
resource "aws_s3_bucket" "prod_app_bucket" {
  # Best practice: Use lowercase and include unique identifier for global uniqueness
  bucket = "prod-app-bucket-${random_id.bucket_suffix.hex}"

  # Best practice: Prevent accidental deletion of production resources
  lifecycle {
    prevent_destroy = false # Set to true in actual production
  }

  tags = {
    Name        = "ProdAppBucket"
    Environment = "Production"
    Purpose     = "Application storage bucket"
  }
}

# Enable versioning for S3 bucket - critical for production data protection
resource "aws_s3_bucket_versioning" "prod_app_bucket_versioning" {
  bucket = aws_s3_bucket.prod_app_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Best practice: Enable server-side encryption for S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "prod_app_bucket_encryption" {
  bucket = aws_s3_bucket.prod_app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Best practice: Block public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "prod_app_bucket_pab" {
  bucket = aws_s3_bucket.prod_app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Security Group for EC2 instance with restrictive ingress rules
resource "aws_security_group" "prod_ec2_sg" {
  name        = "ProdEC2SecurityGroup"
  description = "Production security group for EC2 instance - SSH access only"

  # Best practice: Explicitly define ingress rules with minimal access
  ingress {
    description = "SSH from allowed IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ip]
  }

  # Allow all outbound traffic for package updates and AWS service access
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ProdEC2SecurityGroup"
    Environment = "Production"
    Purpose     = "EC2 SSH access control"
  }
}

# IAM role for EC2 instance with trust policy
resource "aws_iam_role" "prod_ec2_role" {
  name = "ProdEC2S3AccessRole"

  # Trust policy allowing EC2 service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "ProdEC2S3AccessRole"
    Environment = "Production"
    Purpose     = "EC2 to S3 access"
  }
}

# IAM policy for S3 read access - principle of least privilege
resource "aws_iam_role_policy" "prod_ec2_s3_policy" {
  name = "ProdEC2S3ReadPolicy"
  role = aws_iam_role.prod_ec2_role.id

  # Best practice: Grant minimal required permissions
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BucketList"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.prod_app_bucket.arn
      },
      {
        Sid    = "S3ObjectRead"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.prod_app_bucket.arn}/*"
      }
    ]
  })
}

# Instance profile to attach IAM role to EC2 instance
resource "aws_iam_instance_profile" "prod_ec2_profile" {
  name = "ProdEC2InstanceProfile"
  role = aws_iam_role.prod_ec2_role.name

  tags = {
    Name        = "ProdEC2InstanceProfile"
    Environment = "Production"
  }
}

# EC2 Instance with production configurations
resource "aws_instance" "prod_server" {
  # Use t3.micro for cost optimization while meeting performance requirements
  instance_type = "t3.micro"
  ami           = data.aws_ami.amazon_linux_2.id
  key_name      = var.key_name

  # Security configuration
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.prod_ec2_profile.name

  # Best practice: Enable detailed monitoring for production instances
  monitoring = true

  # Best practice: Enable termination protection for production instances
  disable_api_termination = false # Set to true in actual production

  # Best practice: Use IMDSv2 for enhanced security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Root volume configuration with encryption
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "ProdEC2RootVolume"
      Environment = "Production"
    }
  }

  # User data script for initial configuration
  user_data = <<-EOF
    #!/bin/bash
    # Best practice: Update system packages on launch
    yum update -y
    
    # Install AWS CLI for S3 interaction
    yum install -y aws-cli
    
    # Install CloudWatch agent for monitoring
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Log deployment information
    echo "EC2 instance deployed at $(date)" >> /var/log/deployment.log
    echo "S3 bucket: ${aws_s3_bucket.prod_app_bucket.id}" >> /var/log/deployment.log
  EOF

  # Explicit dependencies to ensure proper resource creation order
  depends_on = [
    aws_iam_role_policy.prod_ec2_s3_policy,
    aws_security_group.prod_ec2_sg
  ]

  tags = {
    Name        = "ProdApplicationServer"
    Environment = "Production"
    Purpose     = "Application server with S3 access"
  }
}

# Best practice: Create CloudWatch log group for application logs
resource "aws_cloudwatch_log_group" "prod_app_logs" {
  name              = "/aws/ec2/prod-application"
  retention_in_days = 30 # Adjust based on compliance requirements

  tags = {
    Name        = "ProdApplicationLogs"
    Environment = "Production"
  }
}

# Outputs for accessing deployed resources
output "s3_bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.prod_app_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.prod_app_bucket.arn
}

output "ec2_instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.prod_server.public_dns
}

output "ec2_instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.prod_server.public_ip
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.prod_server.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.prod_ec2_sg.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role"
  value       = aws_iam_role.prod_ec2_role.arn
}

# Output connection command for convenience
output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.prod_server.public_dns}"
}