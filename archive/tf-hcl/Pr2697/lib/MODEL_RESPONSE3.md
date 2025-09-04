Here's the fixed code snippet with highlighted changes and additional outputs:

## **Fixed Code Snippet:**

```hcl
# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "tap-stack-config-${random_string.config_bucket_suffix.result}"
  
  tags = merge(local.common_tags, {
    Name = "config-s3-bucket"
  })
}

resource "random_string" "config_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ✅ NEW: S3 Bucket Policy for Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# IAM Role for Config
resource "aws_iam_role" "config_role" {
  name = "config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# ✅ CHANGED: Updated IAM policy attachment with correct ARN
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigServiceRole"
}

# ✅ NEW: Additional IAM policy for Config to access S3
resource "aws_iam_policy" "config_s3_policy" {
  name        = "config-s3-policy"
  description = "Policy for Config to access S3 bucket"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_s3_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = aws_iam_policy.config_s3_policy.arn
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "main-config-recorder"
  role_arn = aws_iam_role.config_role.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
  
  # ✅ NEW: Add dependency to ensure role is ready
  depends_on = [aws_iam_role_policy_attachment.config_role_policy]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "main-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket
  
  # ✅ NEW: Add dependency to ensure bucket policy is in place
  depends_on = [aws_s3_bucket_policy.config]
}

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "tap-stack-cloudtrail-${random_string.cloudtrail_bucket_suffix.result}"
  
  tags = merge(local.common_tags, {
    Name = "cloudtrail-s3-bucket"
  })
}

resource "random_string" "cloudtrail_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ✅ CHANGED: Updated S3 Bucket Policy for CloudTrail with correct conditions
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/main-cloudtrail"
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/main-cloudtrail"
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
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "main-cloudtrail"
  })
  
  # ✅ NEW: Add dependency to ensure bucket policy is in place
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# IAM Group for MFA enforcement (Fixed - removed tags)
resource "aws_iam_group" "mfa_required" {
  name = "mfa-required-group"
}
```

## **Enhanced Outputs Section:**

```hcl
# ✅ ENHANCED: Complete outputs for all resources
output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS region"
  value       = var.region
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.availability_zones
}

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
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

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of NAT gateways"
  value       = aws_eip.nat[*].public_ip
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# Security Group Outputs
output "security_group_ec2_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "security_group_vpc_endpoint_id" {
  description = "ID of the VPC endpoint security group"
  value       = aws_security_group.vpc_endpoint.id
}

# VPC Endpoint Outputs
output "vpc_s3_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_lambda_endpoint_id" {
  description = "ID of the Lambda VPC endpoint"
  value       = aws_vpc_endpoint.lambda.id
}

# RDS Outputs
output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_subnet_group_name" {
  description = "Name of the RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

# Secrets Manager Outputs
output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for RDS"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret for RDS"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

# EC2 Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_private_ip" {
  description = "Private IP address of EC2 instance"
  value       = aws_instance.main.private_ip
}

output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux.id
}

output "ami_name" {
  description = "AMI name used for EC2 instances"
  value       = data.aws_ami.amazon_linux.name
}

# Lambda Outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.rds_backup.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.rds_backup.arn
}

output "lambda_function_version" {
  description = "Version of the Lambda function"
  value       = aws_lambda_function.rds_backup.version
}

# IAM Role Outputs
output "iam_ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "iam_lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "iam_lambda_role_name" {
  description = "Name of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.name
}

output "iam_config_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config_role.arn
}

output "iam_config_role_name" {
  description = "Name of the Config IAM role"
  value       = aws_iam_role.config_role.name
}

output "iam_ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# S3 Bucket Outputs
output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_config_bucket_name" {
  description = "Name of the Config S3 bucket"
  value       = aws_s3_bucket.config.bucket
}

output "s3_config_bucket_arn" {
  description = "ARN of the Config S3 bucket"
  value       = aws_s3_bucket.config.arn
}

output "s3_cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "s3_cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.arn
}

# CloudTrail Outputs
output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# AWS Config Outputs
output "config_recorder_name" {
  description = "Name of the Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

# IAM Policy Outputs
output "mfa_policy_arn" {
  description = "ARN of the MFA required policy"
  value       = aws_iam_policy.mfa_required.arn
}

output "lambda_rds_backup_policy_arn" {
  description = "ARN of the Lambda RDS backup policy"
  value       = aws_iam_policy.lambda_rds_backup.arn
}

output "config_s3_policy_arn" {
  description = "ARN of the Config S3 policy"
  value       = aws_iam_policy.config_s3_policy.arn
}

# IAM Group Outputs
output "mfa_group_name" {
  description = "Name of the MFA required IAM group"
  value       = aws_iam_group.mfa_required.name
}

output "mfa_group_arn" {
  description = "ARN of the MFA required IAM group"
  value       = aws_iam_group.mfa_required.arn
}

# Random String Outputs (for reference)
output "rds_username_suffix" {
  description = "Random suffix used for RDS username"
  value       = random_string.rds_username.result
}

output "bucket_suffix" {
  description = "Random suffix used for main S3 bucket"
  value       = random_string.bucket_suffix.result
}
```

## **Key Changes Made:**

### 🔧 **Fixed Issues:**
1. **Config Delivery Channel**: Added S3 bucket policy for AWS Config service
2. **IAM Policy**: Changed from `service-role/ConfigRole` to `service-role/AWS_ConfigServiceRole`
3. **CloudTrail**: Updated S3 bucket policy with correct `AWS:SourceArn` condition
4. **Dependencies**: Added proper `depends_on` attributes to ensure resources are created in correct order
5. **IAM Group**: Removed unsupported `tags` argument

### ➕ **Added Resources:**
1. **S3 Bucket Policy for Config**: Allows Config service to write to S3 bucket
2. **Additional IAM Policy**: Extra permissions for Config to access S3
3. **Enhanced Dependencies**: Proper resource creation order

### 📊 **Enhanced Outputs:**
- Added 40+ comprehensive outputs covering all resources
- Included ARNs, names, IDs, and other important attributes
- Organized by resource type for easy reference
- Added metadata like account ID, region, and availability zones

These changes will resolve all the deployment errors and provide comprehensive visibility into your infrastructure.
