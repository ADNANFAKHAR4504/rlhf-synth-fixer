```hcl
resource "aws_iam_role_policy_attachment" "lambda_rds_backup_primary" {
  provider   = aws.us_east_2
  role       = aws_iam_role.lambda_rds_backup_primary.name
  policy_arn = aws_iam_policy.lambda_rds_backup_primary.arn
}
resource "aws_iam_role_policy_attachment" "lambda_rds_backup_secondary" {
  provider   = aws.us_west_1
  role       = aws_iam_role.lambda_rds_backup_secondary.name
  policy_arn = aws_iam_policy.lambda_rds_backup_secondary.arn
}
# =====================================================
# EC2 INSTANCES
# =====================================================
# Primary EC2 Instance
resource "aws_instance" "primary" {
  provider                    = aws.us_east_2
  ami                         = data.aws_ami.amazon_linux_primary.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.primary_private[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_primary.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-ec2-instance"
  })
}
# Secondary EC2 Instance
resource "aws_instance" "secondary" {
  provider                    = aws.us_west_1
  ami                         = data.aws_ami.amazon_linux_secondary.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.secondary_private[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_secondary.id]
  associate_public_ip_address = false
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-ec2-instance"
  })
}
# EBS Snapshots for EC2 instances
resource "aws_ebs_snapshot" "primary_snapshot" {
  provider    = aws.us_east_2
  volume_id   = aws_instance.primary.root_block_device[0].volume_id
  description = "Snapshot of primary EC2 instance root volume"
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-ec2-snapshot"
  })
}
resource "aws_ebs_snapshot" "secondary_snapshot" {
  provider    = aws.us_west_1
  volume_id   = aws_instance.secondary.root_block_device[0].volume_id
  description = "Snapshot of secondary EC2 instance root volume"
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-ec2-snapshot"
  })
}
# =====================================================
# LAMBDA FUNCTIONS FOR RDS BACKUP
# =====================================================
# Lambda function for primary RDS backup
resource "aws_lambda_function" "rds_backup_primary" {
  provider         = aws.us_east_2
  filename         = "rds_backup_lambda.zip"
  function_name    = "${local.primary_prefix}-rds-backup"
  role            = aws_iam_role.lambda_rds_backup_primary.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.9"
  timeout         = 300
  source_code_hash = data.archive_file.lambda_zip_primary.output_base64sha256
  environment {
    variables = {
      DB_INSTANCE_IDENTIFIER = aws_db_instance.primary.id
      REGION                = var.primary_region
    }
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-backup-lambda"
  })
}
# Lambda function for secondary RDS backup
resource "aws_lambda_function" "rds_backup_secondary" {
  provider         = aws.us_west_1
  filename         = "rds_backup_lambda.zip"
  function_name    = "${local.secondary_prefix}-rds-backup"
  role            = aws_iam_role.lambda_rds_backup_secondary.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.9"
  timeout         = 300
  source_code_hash = data.archive_file.lambda_zip_secondary.output_base64sha256
  environment {
    variables = {
      DB_INSTANCE_IDENTIFIER = aws_db_instance.secondary.id
      REGION                = var.secondary_region
    }
  }
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-backup-lambda"
  })
}
# Lambda deployment packages
data "archive_file" "lambda_zip_primary" {
  type        = "zip"
  output_path = "rds_backup_lambda.zip"
  source {
    content = <<EOF
import boto3
import os
from datetime import datetime
def lambda_handler(event, context):
    rds = boto3.client('rds', region_name=os.environ['REGION'])
    db_instance_id = os.environ['DB_INSTANCE_IDENTIFIER']
    
    snapshot_id = f"{db_instance_id}-snapshot-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        return {
            'statusCode': 200,
            'body': f'Snapshot {snapshot_id} created successfully'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Error creating snapshot: {str(e)}'
        }
EOF
    filename = "index.py"
  }
}
data "archive_file" "lambda_zip_secondary" {
  type        = "zip"
  output_path = "rds_backup_lambda.zip"
  source {
    content = <<EOF
import boto3
import os
from datetime import datetime
def lambda_handler(event, context):
    rds = boto3.client('rds', region_name=os.environ['REGION'])
    db_instance_id = os.environ['DB_INSTANCE_IDENTIFIER']
    
    snapshot_id = f"{db_instance_id}-snapshot-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        return {
            'statusCode': 200,
            'body': f'Snapshot {snapshot_id} created successfully'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Error creating snapshot: {str(e)}'
        }
EOF
    filename = "index.py"
  }
}
# =====================================================
# DYNAMODB TABLES
# =====================================================
# Primary DynamoDB Table
resource "aws_dynamodb_table" "primary" {
  provider         = aws.us_east_2
  name             = "${local.primary_prefix}-dynamodb-table"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery {
    enabled = true
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-dynamodb-table"
  })
}
# Secondary DynamoDB Table
resource "aws_dynamodb_table" "secondary" {
  provider         = aws.us_west_1
  name             = "${local.secondary_prefix}-dynamodb-table"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery {
    enabled = true
  }
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-dynamodb-table"
  })
}
# =====================================================
# API GATEWAY
# =====================================================
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-api"
  description = "Main API Gateway for TAP Stack"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-api-gateway"
  })
}
# API Gateway Resource
resource "aws_api_gateway_resource" "api_resource" {
  provider    = aws.us_east_2
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "data"
}
# API Gateway Method with IAM Authentication
resource "aws_api_gateway_method" "api_method" {
  provider         = aws.us_east_2
  rest_api_id      = aws_api_gateway_rest_api.main.id
  resource_id      = aws_api_gateway_resource.api_resource.id
  http_method      = "GET"
  authorization    = "AWS_IAM"
  api_key_required = true
}
# API Gateway Integration
resource "aws_api_gateway_integration" "api_integration" {
  provider            = aws.us_east_2
  rest_api_id         = aws_api_gateway_rest_api.main.id
  resource_id         = aws_api_gateway_resource.api_resource.id
  http_method         = aws_api_gateway_method.api_method.http_method
  integration_http_method = "POST"
  type                = "AWS_PROXY"
  uri                 = aws_lambda_function.rds_backup_primary.invoke_arn
}
# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  provider    = aws.us_east_2
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "prod"
  depends_on = [
    aws_api_gateway_method.api_method,
    aws_api_gateway_integration.api_integration
  ]
  tags = local.common_tags
}
# =====================================================
# CLOUDFRONT DISTRIBUTION
# =====================================================
# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  provider                          = aws.us_east_2
  name                              = "${local.primary_prefix}-s3-oac"
  description                       = "OAC for S3 bucket access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
# CloudFront Distribution
resource "aws_cloudfront_distribution" "s3_distribution" {
  provider = aws.us_east_2
  origin {
    domain_name              = aws_s3_bucket.primary.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id
    origin_id                = "S3-${aws_s3_bucket.primary.bucket}"
  }
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.primary.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudfront-distribution"
  })
}
# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "cloudfront_access" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
          }
        }
      }
    ]
  })
}
# =====================================================
# SNS TOPICS FOR CLOUDWATCH ALARMS
# =====================================================
# SNS Topic for Primary Region
resource "aws_sns_topic" "cloudwatch_alarms_primary" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-cloudwatch-alarms"
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudwatch-alarms-topic"
  })
}
# SNS Topic for Secondary Region
resource "aws_sns_topic" "cloudwatch_alarms_secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-cloudwatch-alarms"
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-cloudwatch-alarms-topic"
  })
}
# SNS Topic Subscriptions
resource "aws_sns_topic_subscription" "email_primary" {
  provider  = aws.us_east_2
  topic_arn = aws_sns_topic.cloudwatch_alarms_primary.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
resource "aws_sns_topic_subscription" "email_secondary" {
  provider  = aws.us_west_1
  topic_arn = aws_sns_topic.cloudwatch_alarms_secondary.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
# =====================================================
# CLOUDWATCH ALARMS
# =====================================================
# Primary EC2 CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_primary" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-ec2-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_primary.arn]
  dimensions = {
    InstanceId = aws_instance.primary.id
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-ec2-cpu-alarm"
  })
}
# Secondary EC2 CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_secondary" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-ec2-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_secondary.arn]
  dimensions = {
    InstanceId = aws_instance.secondary.id
  }
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-ec2-cpu-alarm"
  })
}
# Primary RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_primary" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_primary.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-cpu-alarm"
  })
}
# Secondary RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_secondary" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_secondary.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-cpu-alarm"
  })
}
# =====================================================
# CLOUDTRAIL
# =====================================================
# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.us_east_2
  bucket   = "${local.primary_prefix}-cloudtrail-logs-${random_string.bucket_suffix.result}"
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudtrail-bucket"
  })
}
# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.cloudtrail.id
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
  provider                      = aws.us_east_2
  name                          = "${local.primary_prefix}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.primary.arn}/*"]
    }
  }
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudtrail"
  })
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}
# =====================================================
# OUTPUTS
# =====================================================
# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}
output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}
output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}
output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}
# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public[*].id
}
output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private[*].id
}
output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public[*].id
}
output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private[*].id
}
# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary.id
}
output "secondary_internet_gateway_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.id
}
# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}
output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}
# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary region"
  value       = aws_db_instance.primary.endpoint
}
output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary region"
  value       = aws_db_instance.secondary.endpoint
}
output "primary_rds_instance_id" {
  description = "RDS instance ID for primary region"
  value       = aws_db_instance.primary.id
}
output "secondary_rds_instance_id" {
  description = "RDS instance ID for secondary region"
  value       = aws_db_instance.secondary.id
}
output "primary_rds_port" {
  description = "RDS instance port for primary region"
  value       = aws_db_instance.primary.port
}
output "secondary_rds_port" {
  description = "RDS instance port for secondary region"
  value       = aws_db_instance.secondary.port
}
# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials_primary.arn
}
output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials_secondary.arn
}
# S3 Outputs
output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}
output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket
}
output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}
output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}
output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}
# EC2 Outputs
output "primary_ec2_instance_id" {
  description = "ID of the primary EC2 instance"
  value       = aws_instance.primary.id
}
output "secondary_ec2_instance_id" {
  description = "ID of the secondary EC2 instance"
  value       = aws_instance.secondary.id
}
output "primary_ec2_private_ip" {
  description = "Private IP of the primary EC2 instance"
  value       = aws_instance.primary.private_ip
}
output "secondary_ec2_private_ip" {
  description = "Private IP of the secondary EC2 instance"
  value       = aws_instance.secondary.private_ip
}
# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used for primary EC2 instance"
  value       = data.aws_ami.amazon_linux_primary.id
}
output "secondary_ami_id" {
  description = "AMI ID used for secondary EC2 instance"
  value       = data.aws_ami.amazon_linux_secondary.id
}
# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.ec2_primary.id
}
output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.ec2_secondary.id
}
output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.rds_primary.id
}
output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.rds_secondary.id
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
output "primary_lambda_rds_backup_role_arn" {
  description = "ARN of the primary Lambda RDS backup role"
  value       = aws_iam_role.lambda_rds_backup_primary.arn
}
output "secondary_lambda_rds_backup_role_arn" {
  description = "ARN of the secondary Lambda RDS backup role"
  value       = aws_iam_role.lambda_rds_backup_secondary.arn
}
output "s3_replication_role_arn" {
  description = "ARN of the S3 replication role"
  value       = aws_iam_role.s3_replication.arn
}
# Lambda Outputs
output "primary_lambda_function_name" {
  description = "Name of the primary Lambda function"
  value       = aws_lambda_function.rds_backup_primary.function_name
}
output "secondary_lambda_function_name" {
  description = "Name of the secondary Lambda function"
  value       = aws_lambda_function.rds_backup_secondary.function_name
}
output "primary_lambda_function_arn" {
  description = "ARN of the primary Lambda function"
  value       = aws_lambda_function.rds_backup_primary.arn
}
output "secondary_lambda_function_arn" {
  description = "ARN of the secondary Lambda function"
  value       = aws_lambda_function.rds_backup_secondary.arn
}
# DynamoDB Outputs
output "primary_dynamodb_table_name" {
  description = "Name of the primary DynamoDB table"
  value       = aws_dynamodb_table.primary.name
}
output "secondary_dynamodb_table_name" {
  description = "Name of the secondary DynamoDB table"
  value       = aws_dynamodb_table.secondary.name
}
output "primary_dynamodb_table_arn" {
  description = "ARN of the primary DynamoDB table"
  value       = aws_dynamodb_table.primary.arn
}
output "secondary_dynamodb_table_arn" {
  description = "ARN of the secondary DynamoDB table"
  value       = aws_dynamodb_table.secondary.arn
}
# API Gateway Outputs
output "api_gateway_rest_api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}
output "api_gateway_rest_api_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.arn
}
output "api_gateway_deployment_invoke_url" {
  description = "Invoke URL of the API Gateway deployment"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.primary_region}.amazonaws.com/${aws_api_gateway_deployment.api_deployment.stage_name}"
}
# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.id
}
output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.arn
}
```
