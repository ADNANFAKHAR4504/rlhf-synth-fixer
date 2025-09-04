### Reasoning Trace
---

The user is asking me to complete the Terraform configuration from where I left off. Looking at the last part of my response, I was in the middle of creating the secondary VPC Flow Logs role and hadn't finished that section, plus I need to add:

1. Complete the secondary VPC flow logs configuration
2. CloudFront distribution with AWS Shield
3. EBS snapshot capabilities 
4. Complete all the outputs for all resources

Let me continue from where I left off and complete the entire configuration.
### Answer 
---

I'll continue from where I left off and complete the entire configuration including all outputs.

```hcl
# Continuing from where we left off...

# Secondary VPC Flow Logs Role (continued)
resource "aws_iam_role" "secondary_flow_logs_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-flow-logs-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "secondary_flow_logs_policy" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-flow-logs-policy"
  role     = aws_iam_role.secondary_flow_logs_role.id

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

# CloudWatch Log Group for Secondary VPC Flow Logs
resource "aws_cloudwatch_log_group" "secondary_vpc_flow_logs" {
  provider          = aws.us_west_1
  name              = "/aws/vpc/flowlogs-secondary"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-vpc-flow-logs"
  })
}

# Secondary VPC Flow Logs
resource "aws_flow_log" "secondary_vpc_flow_logs" {
  provider        = aws.us_west_1
  iam_role_arn    = aws_iam_role.secondary_flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.secondary_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-vpc-flow-logs"
  })
}

# ===============================================
# CLOUDFRONT DISTRIBUTION WITH AWS SHIELD
# ===============================================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  provider = aws.us_east_2
  comment  = "Origin Access Identity for ${local.primary_name_prefix}"
}

# Update S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "primary_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.primary_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution with AWS Shield Standard (enabled by default)
resource "aws_cloudfront_distribution" "main_distribution" {
  provider = aws.us_east_2

  origin {
    domain_name = aws_s3_bucket.primary_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.primary_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # Additional origin for ALB
  origin {
    domain_name = aws_lb.primary_alb.dns_name
    origin_id   = "ALB-${aws_lb.primary_alb.name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.primary_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior for ALB
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.primary_alb.name}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # AWS Shield Standard is enabled by default for CloudFront
  # AWS Shield Advanced would require additional subscription

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-cloudfront"
  })
}

# ===============================================
# EBS SNAPSHOT LIFECYCLE POLICY
# ===============================================

# IAM Role for DLM (Data Lifecycle Manager)
resource "aws_iam_role" "dlm_lifecycle_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-dlm-lifecycle-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-dlm-lifecycle-role"
  })
}

resource "aws_iam_role_policy" "dlm_lifecycle_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-dlm-lifecycle-policy"
  role     = aws_iam_role.dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:DeleteSnapshot",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# DLM Lifecycle Policy for Primary Region
resource "aws_dlm_lifecycle_policy" "primary_ebs_backup" {
  provider           = aws.us_east_2
  description        = "EBS snapshot lifecycle policy for primary region"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types   = ["VOLUME"]
    target_tags = {
      Environment = "Production"
    }

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 7
      }

      tags_to_add = merge(local.common_tags, {
        SnapshotCreator = "DLM"
      })

      copy_tags = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ebs-backup-policy"
  })
}

# DLM Resources for Secondary Region
resource "aws_iam_role" "secondary_dlm_lifecycle_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-dlm-lifecycle-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-dlm-lifecycle-role"
  })
}

resource "aws_iam_role_policy" "secondary_dlm_lifecycle_policy" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-dlm-lifecycle-policy"
  role     = aws_iam_role.secondary_dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:DeleteSnapshot",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# DLM Lifecycle Policy for Secondary Region
resource "aws_dlm_lifecycle_policy" "secondary_ebs_backup" {
  provider           = aws.us_west_1
  description        = "EBS snapshot lifecycle policy for secondary region"
  execution_role_arn = aws_iam_role.secondary_dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types   = ["VOLUME"]
    target_tags = {
      Environment = "Production"
    }

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 7
      }

      tags_to_add = merge(local.common_tags, {
        SnapshotCreator = "DLM"
      })

      copy_tags = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ebs-backup-policy"
  })
}

# ===============================================
# OUTPUTS
# ===============================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary_vpc.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary_vpc.cidr_block
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary_vpc.id
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary_vpc.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public_subnets[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private_subnets[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public_subnets[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private_subnets[*].id
}

# Internet Gateway Outputs
output "primary_igw_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary_igw.id
}

output "secondary_igw_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary_igw.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_id" {
  description = "ID of the primary NAT gateway"
  value       = aws_nat_gateway.primary_nat.id
}

output "secondary_nat_gateway_id" {
  description = "ID of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary_nat.id
}

# Security Group Outputs
output "primary_ec2_sg_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2_sg.id
}

output "primary_rds_sg_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds_sg.id
}

output "primary_alb_sg_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb_sg.id
}

output "secondary_ec2_sg_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2_sg.id
}

output "secondary_rds_sg_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds_sg.id
}

output "secondary_alb_sg_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb_sg.id
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_rds_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary_rds.port
}

output "primary_rds_db_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary_rds.db_name
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.endpoint
}

output "secondary_rds_port" {
  description = "Port of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.port
}

output "secondary_rds_db_name" {
  description = "Database name of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.db_name
}

# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS secret"
  value       = aws_secretsmanager_secret.primary_rds_secret.arn
}

output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS secret"
  value       = aws_secretsmanager_secret.secondary_rds_secret.arn
}

# S3 Bucket Outputs
output "primary_s3_bucket_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.arn
}

output "primary_s3_bucket_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.bucket_domain_name
}

output "secondary_s3_bucket_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.id
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.arn
}

output "cloudtrail_s3_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_bucket.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of the primary EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "secondary_ec2_role_arn" {
  description = "ARN of the secondary EC2 IAM role"
  value       = aws_iam_role.secondary_ec2_role.arn
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication_role.arn
}

output "primary_lambda_role_arn" {
  description = "ARN of the primary Lambda IAM role"
  value       = aws_iam_role.primary_lambda_role.arn
}

output "secondary_lambda_role_arn" {
  description = "ARN of the secondary Lambda IAM role"
  value       = aws_iam_role.secondary_lambda_role.arn
}

# EC2 Instance Outputs
output "primary_ec2_instance_ids" {
  description = "IDs of the primary EC2 instances"
  value       = aws_instance.primary_ec2[*].id
}

output "primary_ec2_private_ips" {
  description = "Private IP addresses of the primary EC2 instances"
  value       = aws_instance.primary_ec2[*].private_ip
}

output "secondary_ec2_instance_ids" {
  description = "IDs of the secondary EC2 instances"
  value       = aws_instance.secondary_ec2[*].id
}

output "secondary_ec2_private_ips" {
  description = "Private IP addresses of the secondary EC2 instances"
  value       = aws_instance.secondary_ec2[*].private_ip
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used for primary region instances"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used for secondary region instances"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# ALB Outputs
output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary_alb.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary_alb.zone_id
}

output "primary_alb_arn" {
  description = "ARN of the primary ALB"
  value       = aws_lb.primary_alb.arn
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary_alb.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary_alb.zone_id
}

output "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  value       = aws_lb.secondary_alb.arn
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary_tg.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary_tg.arn
}

# WAF Outputs
output "primary_waf_arn" {
  description = "ARN of the primary WAF Web ACL"
  value       = aws_wafv2_web_acl.primary_waf.arn
}

output "secondary_waf_arn" {
  description = "ARN of the secondary WAF Web ACL"
  value       = aws_wafv2_web_acl.secondary_waf.arn
}

# Lambda Function Outputs
output "primary_lambda_function_arn" {
  description = "ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_rds_backup.arn
}

output "primary_lambda_function_name" {
  description = "Name of the primary Lambda function"
  value       = aws_lambda_function.primary_rds_backup.function_name
}

output "secondary_lambda_function_arn" {
  description = "ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_rds_backup.arn
}

output "secondary_lambda_function_name" {
  description = "Name of the secondary Lambda function"
  value       = aws_lambda_function.secondary_rds_backup.function_name
}

# CloudWatch Alarms Outputs
output "primary_ec2_cpu_alarm_names" {
  description = "Names of the primary EC2 CPU alarms"
  value       = aws_cloudwatch_metric_alarm.primary_ec2_cpu_alarm[*].alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu_alarm.alarm_name
}

output "secondary_ec2_cpu_alarm_names" {
  description = "Names of the secondary EC2 CPU alarms"
  value       = aws_cloudwatch_metric_alarm.secondary_ec2_cpu_alarm[*].alarm_name
}

output "secondary_rds_cpu_alarm_name" {
  description = "Name of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu_alarm.alarm_name
}

# CloudTrail Outputs
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main_trail.arn
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main_trail.home_region
}

# VPC Flow Logs Outputs
output "primary_vpc_flow_logs_id" {
  description = "ID of the primary VPC flow logs"
  value       = aws_flow_log.primary_vpc_flow_logs.id
}

output "secondary_vpc_flow_logs_id" {
  description = "ID of the secondary VPC flow logs"
  value       = aws_flow_log.secondary_vpc_flow_logs.id
}

output "primary_flow_logs_log_group_name" {
  description = "Name of the primary flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.primary_vpc_flow_logs.name
}

output "secondary_flow_logs_log_group_name" {
  description = "Name of the secondary flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.secondary_vpc_flow_logs.name
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.hosted_zone_id
}

# DLM Lifecycle Policy Outputs
output "primary_dlm_policy_arn" {
  description = "ARN of the primary DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.primary_ebs_backup.arn
}

output "secondary_dlm_policy_arn" {
  description = "ARN of the secondary DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.secondary_ebs_backup.arn
}

# Availability Zones Outputs
output "primary_availability_zones" {
  description = "List of availability zones in the primary region"
  value       = data.aws_availability_zones.primary_azs.names
}

output "secondary_availability_zones" {
  description = "List of availability zones in the secondary region"
  value       = data.aws_availability_zones.secondary_azs.names
}

# Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Regional Information
output "primary_region" {
  description = "Primary region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary region"
  value       = var.secondary_region
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public_rt.id
}

output "primary_private_route_table_id" {
  description = "ID of the primary private route table"
  value       = aws_route_table.primary_private_rt.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public_rt.id
}

output "secondary_private_route_table_id" {
  description = "ID of the secondary private route table"
  value       = aws_route_table.secondary_private_rt.id
}

# Environment and Naming Outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "primary_name_prefix" {
  description = "Primary region name prefix"
  value       = local.primary_name_prefix
}

output "secondary_name_prefix" {
  description = "Secondary region name prefix"
  value       = local.secondary_name_prefix
}
```

## Summary

This complete Terraform configuration includes:

### **Infrastructure Components:**
- **Multi-region VPCs** with proper CIDR blocks (10.0.0.0/16 and 10.1.0.0/16)
- **Public and private subnets** in each region with NAT gateways and internet gateways
- **Route tables and associations** for proper network routing

### **Security:**
- **Security groups** with least privilege access (SSH from specific CIDRs, HTTPS from anywhere)
- **IAM roles and policies** following least privilege principle
- **WAF protection** for ALBs with managed rule sets
- **Encrypted EBS volumes** with KMS AWS-managed keys
- **S3 encryption** using AES256
- **VPC Flow Logs** for network monitoring

### **Database:**
- **Multi-AZ RDS instances** in both regions with encryption
- **Random credentials** stored in AWS Secrets Manager
- **Automated minor version upgrades** enabled

### **Compute:**
- **EC2 instances** using latest Amazon Linux 2 AMI in private subnets
- **Application Load Balancers** with health checks
- **Auto-scaling capabilities** through target groups

### **Storage & CDN:**
- **S3 buckets** with versioning, encryption, and cross-region replication
- **CloudFront distribution** with AWS Shield Standard protection

### **Monitoring & Compliance:**
- **CloudWatch alarms** for CPU monitoring
- **CloudTrail** for audit logging across all regions
- **EBS snapshot lifecycle policies** for backup management
- **Lambda functions** for RDS backup automation with concurrency limits

### **Outputs:**
The configuration provides comprehensive outputs for all created resources including IDs, ARNs, endpoints, and other essential identifiers for integration with other systems or for reference.

All resources are properly tagged with the required tags (`Environment:Production`, `ownership:self`, `departmental:businessunit`) and use consistent naming conventions through locals.
