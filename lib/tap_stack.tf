# Variables
variable "aws_region" {
  type    = string
  default = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in format like us-east-1."
  }
}
variable "project_name" {
  type = string
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.project_name))
    error_message = "Project name must start with letter and contain only alphanumeric characters and hyphens."
  }
}
variable "environment_name" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment_name)
    error_message = "Environment must be dev, staging, or prod."
  }
}
variable "environment_suffix" {
  type        = string
  default     = "dev"
  description = "Unique suffix to avoid resource naming conflicts between deployments"
}
variable "enable_cloudtrail" {
  type        = bool
  default     = true
  description = "Create a dedicated CloudTrail for this stack"
}
variable "notification_email" {
  type = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}
variable "allowed_ssh_cidrs" {
  type    = list(string)
  default = []
}
variable "instance_type" {
  type    = string
  default = "t3.micro"
  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium", "t3.large"], var.instance_type)
    error_message = "Instance type must be one of: t3.micro, t3.small, t3.medium, t3.large."
  }
}
variable "enable_vpc_flow_logs" {
  type    = bool
  default = true
}
variable "tags" {
  type    = map(string)
  default = {}
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}
data "aws_caller_identity" "current" {}
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# Locals
locals {
  common_tags = merge({
    Project     = var.project_name
    Environment = var.environment_name
    ManagedBy   = "Terraform"
  }, var.tags)

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnets = {
    for i, az in local.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i)
      az   = az
    }
  }

  private_subnets = {
    for i, az in local.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i + 10)
      az   = az
    }
  }
}

# S3 Module
module "s3" {
  source             = "./modules/s3"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
}

module "network" {
  source             = "./modules/network"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  azs                = local.azs
}

# Logging Module
module "logging" {
  source               = "./modules/logging"
  project_name         = var.project_name
  environment_suffix   = var.environment_suffix
  common_tags          = local.common_tags
  enable_vpc_flow_logs = var.enable_vpc_flow_logs
}

# IAM Module
module "iam" {
  source                 = "./modules/iam"
  project_name           = var.project_name
  environment_suffix     = var.environment_suffix
  common_tags            = local.common_tags
  enable_vpc_flow_logs   = var.enable_vpc_flow_logs
  cloudtrail_log_group_arn = module.logging.cloudtrail_log_group_arn
}

## Log groups are provided by module.logging



# Compute Module
module "compute" {
  source                   = "./modules/compute"
  project_name             = var.project_name
  environment_suffix       = var.environment_suffix
  common_tags              = local.common_tags
  vpc_id                   = module.network.vpc_id
  private_subnet_ids       = module.network.private_subnet_ids
  instance_type            = var.instance_type
  allowed_ssh_cidrs        = var.allowed_ssh_cidrs
  ec2_instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                   = data.aws_ssm_parameter.al2023_ami.value
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  name                          = "${var.project_name}-${var.environment_suffix}-trail"
  s3_bucket_name                = module.s3.logging_bucket_name
  s3_key_prefix                 = "cloudtrail/"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  cloud_watch_logs_group_arn    = "${module.logging.cloudtrail_log_group_arn}:*"
  cloud_watch_logs_role_arn     = module.iam.cloudtrail_role_arn
  tags                          = local.common_tags
  depends_on                    = [aws_s3_bucket_policy.cloudtrail_bucket]
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = [module.s3.logging_bucket_arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_suffix}-trail"]
    }
  }
  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${module.s3.logging_bucket_arn}/cloudtrail/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_suffix}-trail"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket" {
  bucket = module.s3.logging_bucket_id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  count           = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn    = module.iam.vpc_flow_role_arn
  log_destination = module.logging.vpc_flow_log_group_arn
  traffic_type    = "ALL"
  vpc_id          = module.network.vpc_id
  tags            = local.common_tags
}

## Compute resources are provided by module.compute

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment_suffix}-security-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Metric Filter
resource "aws_cloudwatch_log_metric_filter" "unauthorized_calls" {
  name           = "${var.project_name}-${var.environment_suffix}-unauthorized-calls"
  log_group_name = module.logging.cloudtrail_log_group_name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment_name}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm
resource "aws_cloudwatch_metric_alarm" "unauthorized_calls" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-unauthorized-calls"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/${var.environment_name}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Unauthorized API calls detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = local.common_tags
}

## Lambda and EventBridge
module "lambda" {
  source             = "./modules/lambda"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  lambda_role_arn    = module.iam.lambda_role_arn
}

# Outputs
output "vpc_id" { value = module.network.vpc_id }
output "public_subnet_ids" { value = module.network.public_subnet_ids }
output "private_subnet_ids" { value = module.network.private_subnet_ids }
output "nat_gateway_ids" { value = module.network.nat_gateway_ids }
output "asg_name" { value = module.compute.asg_name }
output "data_bucket_name" { value = module.s3.data_bucket_name }
output "logging_bucket_name" { value = module.s3.logging_bucket_name }
output "cloudtrail_name" { value = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null }
output "cloudtrail_log_group_arn" { value = module.logging.cloudtrail_log_group_arn }
output "vpc_flow_log_group_arn" { value = module.logging.vpc_flow_log_group_arn }
output "sns_topic_arn" { value = aws_sns_topic.alerts.arn }
output "lambda_function_name" { value = module.lambda.lambda_function_name }
output "lambda_function_arn" { value = module.lambda.lambda_function_arn }