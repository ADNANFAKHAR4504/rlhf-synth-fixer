# Terraform Infrastructure Code

## alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  for_each = toset(["dev"])

  name               = "${local.project_prefix}-${each.key}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web[each.key].id]
  subnets = [
    aws_subnet.public["${each.key}-${var.availability_zones[0]}"].id,
    aws_subnet.public["${each.key}-${var.availability_zones[1]}"].id
  ]

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "${each.key}-alb"
    enabled = true
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  for_each = aws_lb.main

  name     = "${local.project_prefix}-${each.key}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main[each.key].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-target-group"
  })
}

# ALB Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  for_each = {
    for k, v in aws_instance.web : k => v
  }

  target_group_arn = aws_lb_target_group.main[split("-", each.key)[0]].arn
  target_id        = each.value.id
  port             = 80
}

# ALB Listener
resource "aws_lb_listener" "main" {
  for_each = aws_lb.main

  load_balancer_arn = each.value.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[each.key].arn
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-listener"
  })
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${local.project_prefix}-alb-logs-${random_string.alb_logs_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alb-logs"
  })
}

resource "random_string" "alb_logs_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ALB Access Logs Policy
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root" # ELB service account for us-east-1
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  for_each = aws_lb.main

  resource_arn = each.value.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## backup.tf

```hcl
# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${local.project_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.ebs_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-backup-vault"
  })
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${local.project_prefix}-backup-plan"

  rule {
    rule_name         = "${local.project_prefix}-backup-rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = merge(local.common_tags, {
      BackupPlan = "${local.project_prefix}-backup-plan"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-backup-plan"
  })
}

# Backup Selection
resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${local.project_prefix}-backup-selection"
  plan_id      = aws_backup_plan.main.id

  resources = [
    "*"
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/environment"
      value = "dev"
    }
  }

  condition {
    string_equals {
      key   = "aws:ResourceTag/environment"
      value = "test"
    }
  }
}
```

## cloudwatch.tf

```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "alb_logs" {
  name              = "/aws/alb/access-logs"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alb-logs"
  })
}

# CloudWatch Alarms for EC2 CPU Usage
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  for_each = aws_instance.web

  alarm_name          = "${local.project_prefix}-${split("-", each.key)[0]}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = each.value.id
  }

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${split("-", each.key)[0]}-high-cpu-alarm"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.project_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alerts"
  })
}
```

## config.tf

```hcl
# Configuration Recorder (must be created before delivery channel)
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.project_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_iam_role_policy.config_role_policy]
}

# Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.project_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rules for Required Tags
resource "aws_config_config_rule" "required_tags" {
  name = "${local.project_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key   = "environment"
    tag2Key   = "owner"
  })

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-required-tags-rule"
  })
}

# Enable Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}
```

## data.tf

```hcl
# Current AWS Account ID
data "aws_caller_identity" "current" {}

# Current AWS Region
data "aws_region" "current" {}

# Available Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

## ec2.tf

```hcl
# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# EC2 Instances
resource "aws_instance" "web" {
  for_each = toset(["dev-web"]) # Only deploy dev to avoid resource limits

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public["${split("-", each.key)[0]}-${var.availability_zones[0]}"].id
  vpc_security_group_ids = [aws_security_group.web[split("-", each.key)[0]].id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.ebs_key.arn
    delete_on_termination = true
  }

  user_data_base64 = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = split("-", each.key)[0]
  }))

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${each.key}-instance"
  })
}

# Elastic IPs
resource "aws_eip" "web" {
  for_each = aws_instance.web

  instance = each.value.id
  domain   = "vpc"

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${each.key}-eip"
  })
}
```

## iam.tf

```hcl
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.project_prefix}-ec2-role"

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
    Name = "${local.project_prefix}-ec2-role"
  })
}

# IAM Policy for EC2 CloudWatch access
resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "${local.project_prefix}-ec2-cloudwatch-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.project_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-ec2-profile"
  })
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${local.project_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-lambda-role"
  })
}

# IAM Policy for Lambda basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda VPC access
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name = "${local.project_prefix}-flow-log-role"

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
    Name = "${local.project_prefix}-flow-log-role"
  })
}

# IAM Policy for Flow Logs
resource "aws_iam_role_policy" "flow_log_policy" {
  name = "${local.project_prefix}-flow-log-policy"
  role = aws_iam_role.flow_log_role.id

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

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "${local.project_prefix}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-backup-role"
  })
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "${local.project_prefix}-config-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-config-role"
  })
}

# Inline policy for Config role instead of managed policy
resource "aws_iam_role_policy" "config_role_policy" {
  name = "${local.project_prefix}-config-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## kms.tf

```hcl
# KMS Key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-s3-key"
  })
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${local.project_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-rds-key"
  })
}

resource "aws_kms_alias" "rds_key_alias" {
  name          = "alias/${local.project_prefix}-rds-key"
  target_key_id = aws_kms_key.rds_key.key_id
}

# KMS Key for EBS encryption
resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-ebs-key"
  })
}

resource "aws_kms_alias" "ebs_key_alias" {
  name          = "alias/${local.project_prefix}-ebs-key"
  target_key_id = aws_kms_key.ebs_key.key_id
}
```

## lambda.tf

```hcl
# Lambda function
resource "aws_lambda_function" "example" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_prefix}-example-lambda"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30

  vpc_config {
    subnet_ids         = [aws_subnet.public["dev-${var.availability_zones[0]}"].id]
    security_group_ids = [aws_security_group.lambda["dev"].id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-example-lambda"
  })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
  ]
}

# Lambda function code
resource "local_file" "lambda_code" {
  content = <<-EOT
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
EOT
  filename = "${path.module}/lambda_function.py"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda_function.zip"
  depends_on  = [local_file.lambda_code]
}
```

## locals.tf

```hcl
locals {
  # Add environment suffix to project name for unique naming
  project_prefix = "${var.project_name}-${var.environment_suffix}"
  
  common_tags = {
    environment = "multi"
    owner       = var.owner
    project     = var.project_name
    managed_by  = "terraform"
    env_suffix  = var.environment_suffix
  }

  env_tags = {
    for env in var.environments : env => merge(local.common_tags, {
      environment = env
    })
  }
}
```

## main.tf

```hcl
# This file contains all the terraform infrastructure for the secure cloud environment

```

## outputs.tf

```hcl
# VPC Outputs
output "vpc_ids" {
  description = "IDs of the VPCs"
  value       = { for k, v in aws_vpc.main : k => v.id }
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

# EC2 Outputs
output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = { for k, v in aws_instance.web : k => v.id }
}

output "elastic_ips" {
  description = "Elastic IP addresses"
  value       = { for k, v in aws_eip.web : k => v.public_ip }
}

# RDS Outputs
output "rds_endpoints" {
  description = "RDS instance endpoints"
  value       = { for k, v in aws_db_instance.main : k => v.endpoint }
  sensitive   = true
}

# Load Balancer Outputs
output "alb_dns_names" {
  description = "DNS names of the Application Load Balancers"
  value       = { for k, v in aws_lb.main : k => v.dns_name }
}

# S3 Bucket Outputs
output "s3_bucket_names" {
  description = "Names of the S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket }
}

# Lambda Output
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.example.function_name
}

# WAF Output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# Backup Vault Output
output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = aws_backup_vault.main.name
}

# Secrets Manager Outputs
output "secrets_manager_secret_arns" {
  description = "ARNs of the Secrets Manager secrets"
  value       = { for k, v in aws_secretsmanager_secret.db_credentials : k => v.arn }
  sensitive   = true
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
}

```

## rds.tf

```hcl
# DB Subnet Groups
resource "aws_db_subnet_group" "main" {
  for_each = aws_vpc.main

  name       = "${local.project_prefix}-${each.key}-db-subnet-group"
  subnet_ids = [for k, v in aws_subnet.private : v.id if startswith(k, "${each.key}-")]

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-db-subnet-group"
  })
}

# RDS Instances
resource "aws_db_instance" "main" {
  for_each = toset(["dev"]) # Only deploy dev to avoid resource limits

  identifier     = "${local.project_prefix}-${each.key}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds_key.arn

  db_name  = "mydb"
  username = var.db_username
  password = random_password.db_password[each.key].result

  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-database"
  })
}

# Random passwords for RDS
resource "random_password" "db_password" {
  for_each = toset(["dev"])

  length  = 16
  special = true
}
```

## s3.tf

```hcl
# S3 Buckets for different environments
resource "aws_s3_bucket" "main" {
  for_each = toset(var.environments)

  bucket        = "${local.project_prefix}-${each.key}-data-bucket-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-data-bucket"
  })
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Config Service
resource "aws_s3_bucket" "config" {
  bucket        = "${local.project_prefix}-config-bucket-${random_string.config_bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-config-bucket"
  })
}

resource "random_string" "config_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

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
```

## secrets-manager.tf

```hcl
# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  for_each = toset(["dev"])

  name                    = "${local.project_prefix}-${each.key}-db-credentials"
  description             = "Database credentials for ${each.key} environment"
  recovery_window_in_days = 0  # Immediate deletion for dev/test environments

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  for_each = aws_secretsmanager_secret.db_credentials

  secret_id = each.value.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password[each.key].result
    endpoint = aws_db_instance.main[each.key].endpoint
    port     = aws_db_instance.main[each.key].port
  })
}
```

## security-groups.tf

```hcl
# Security Group for Web Servers
resource "aws_security_group" "web" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-web-sg"
  description = "Security group for web servers"
  vpc_id      = each.value.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-web-sg"
  })
}

# Security Group for Database
resource "aws_security_group" "rds" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = each.value.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web[each.key].id]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-rds-sg"
  })
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  for_each = aws_vpc.main

  name        = "${local.project_prefix}-${each.key}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = each.value.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-lambda-sg"
  })
}
```

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "proj"
}

variable "environments" {
  description = "List of environments"
  type        = list(string)
  default     = ["dev"]  # Reduced to just dev to avoid VPC limits
}

variable "owner" {
  description = "Resource owner tag"
  type        = string
  default     = "devops-team"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "synthtrainr843"
}
```

## vpc.tf

```hcl
# VPCs for different environments
resource "aws_vpc" "main" {
  for_each = toset(var.environments)

  cidr_block           = each.key == "dev" ? "10.1.0.0/16" : each.key == "test" ? "10.2.0.0/16" : "10.3.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-vpc"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main" {
  for_each = aws_vpc.main

  vpc_id = each.value.id

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for combo in setproduct(var.environments, var.availability_zones) : "${combo[0]}-${combo[1]}" => {
      env = combo[0]
      az  = combo[1]
    }
  }

  vpc_id                  = aws_vpc.main[each.value.env].id
  cidr_block              = each.value.env == "dev" ? (each.value.az == "us-east-1a" ? "10.1.1.0/24" : "10.1.2.0/24") : each.value.env == "test" ? (each.value.az == "us-east-1a" ? "10.2.1.0/24" : "10.2.2.0/24") : (each.value.az == "us-east-1a" ? "10.3.1.0/24" : "10.3.2.0/24")
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(local.env_tags[each.value.env], {
    Name = "${local.project_prefix}-${each.value.env}-public-subnet-${substr(each.value.az, -1, 1)}"
    Type = "public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private" {
  for_each = {
    for combo in setproduct(var.environments, var.availability_zones) : "${combo[0]}-${combo[1]}" => {
      env = combo[0]
      az  = combo[1]
    }
  }

  vpc_id            = aws_vpc.main[each.value.env].id
  cidr_block        = each.value.env == "dev" ? (each.value.az == "us-east-1a" ? "10.1.10.0/24" : "10.1.11.0/24") : each.value.env == "test" ? (each.value.az == "us-east-1a" ? "10.2.10.0/24" : "10.2.11.0/24") : (each.value.az == "us-east-1a" ? "10.3.10.0/24" : "10.3.11.0/24")
  availability_zone = each.value.az

  tags = merge(local.env_tags[each.value.env], {
    Name = "${local.project_prefix}-${each.value.env}-private-subnet-${substr(each.value.az, -1, 1)}"
    Type = "private"
  })
}

# Route Tables for Public Subnets
resource "aws_route_table" "public" {
  for_each = aws_vpc.main

  vpc_id = each.value.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-public-rt"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[split("-", each.key)[0]].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  for_each = aws_vpc.main

  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = each.value.id

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-flow-log"
  })
}
```

## waf.tf

```hcl
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${local.project_prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rule - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.project_prefix}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-web-acl"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_log.arn]
  
  depends_on = [aws_cloudwatch_log_resource_policy.waf_logging]
}

# Resource policy for WAF logging
resource "aws_cloudwatch_log_resource_policy" "waf_logging" {
  policy_name = "${local.project_prefix}-waf-logging-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "wafv2.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.waf_log.arn}:*"
        Condition = {
          ArnLike = {
            "aws:SourceArn" = "arn:aws:wafv2:us-east-1:718240086340:*/webacl/*/*"
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "waf_log" {
  name              = "aws-waf-logs-${local.project_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-waf-logs"
  })
}
```
