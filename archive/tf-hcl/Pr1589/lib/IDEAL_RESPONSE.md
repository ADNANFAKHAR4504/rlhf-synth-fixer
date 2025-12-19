# File: lib/tap_stack.tf

# Data Sources

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}
```

# Locals

```hcl
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
```

# S3 Module

```hcl
module "s3" {
  source             = "./modules/s3"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
}
```

# Network Module

```hcl
module "network" {
  source             = "./modules/network"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  azs                = local.azs
}
```

# IAM Module

```hcl
module "iam" {
  source                   = "./modules/iam"
  project_name             = var.project_name
  environment_suffix       = var.environment_suffix
  common_tags              = local.common_tags
  enable_vpc_flow_logs     = var.enable_vpc_flow_logs
  cloudtrail_log_group_arn = module.logging.cloudtrail_log_group_arn
}
```

# Logging Module (includes CloudTrail and VPC Flow Logs)

```hcl
module "logging" {
  source               = "./modules/logging"
  project_name         = var.project_name
  environment_suffix   = var.environment_suffix
  common_tags          = local.common_tags
  enable_vpc_flow_logs = var.enable_vpc_flow_logs
  enable_cloudtrail    = var.enable_cloudtrail
  aws_region           = var.aws_region
  logging_bucket_name  = module.s3.logging_bucket_name
  logging_bucket_id    = module.s3.logging_bucket_id
  logging_bucket_arn   = module.s3.logging_bucket_arn
  cloudtrail_role_arn  = module.iam.cloudtrail_role_arn
  vpc_id               = module.network.vpc_id
  vpc_flow_role_arn    = module.iam.vpc_flow_role_arn
}
```

# Compute Module

```hcl
module "compute" {
  source                    = "./modules/compute"
  project_name              = var.project_name
  environment_suffix        = var.environment_suffix
  common_tags               = local.common_tags
  vpc_id                    = module.network.vpc_id
  private_subnet_ids        = module.network.private_subnet_ids
  instance_type             = var.instance_type
  allowed_ssh_cidrs         = var.allowed_ssh_cidrs
  ec2_instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                    = data.aws_ssm_parameter.al2023_ami.value
}
```

# Alerts Module (SNS Topic and Subscriptions)

```hcl
module "alerts" {
  source             = "./modules/alerts"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  notification_email = var.notification_email
  common_tags        = local.common_tags
}
```

# Monitoring Module (CloudWatch Alarms and Metric Filters)

```hcl
module "monitoring" {
  source                    = "./modules/monitoring"
  project_name              = var.project_name
  environment_name          = var.environment_name
  environment_suffix        = var.environment_suffix
  cloudtrail_log_group_name = module.logging.cloudtrail_log_group_name
  sns_topic_arn             = module.alerts.sns_topic_arn
  common_tags               = local.common_tags
}
```

# Lambda Module (Auto-remediation)

```hcl
module "lambda" {
  source             = "./modules/lambda"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  lambda_role_arn    = module.iam.lambda_role_arn
}
```

# Outputs

```hcl
output "vpc_id" {
  value = module.network.vpc_id
}

output "public_subnet_ids" {
  value = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "nat_gateway_ids" {
  value = module.network.nat_gateway_ids
}

output "asg_name" {
  value = module.compute.asg_name
}

output "data_bucket_name" {
  value = module.s3.data_bucket_name
}

output "logging_bucket_name" {
  value = module.s3.logging_bucket_name
}

output "cloudtrail_name" {
  value = module.logging.cloudtrail_name
}

output "cloudtrail_log_group_arn" {
  value = module.logging.cloudtrail_log_group_arn
}

output "vpc_flow_log_group_arn" {
  value = module.logging.vpc_flow_log_group_arn
}

output "sns_topic_arn" {
  value = module.alerts.sns_topic_arn
}

output "lambda_function_name" {
  value = module.lambda.lambda_function_name
}

output "lambda_function_arn" {
  value = module.lambda.lambda_function_arn
}
```

# File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  backend "s3" {
    # Configuration will be provided via -backend-config during init
  }
}

provider "aws" {
  region = var.aws_region
}
```

# File: lib/vars.tf

```hcl
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
```

# File: lib/modules/alerts/main.tf

```hcl
# Random suffix to prevent naming conflicts
resource "random_id" "suffix" {
  byte_length = 4
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "alerts" {
  name         = "${var.project_name}-${var.environment_suffix}-security-alerts-${random_id.suffix.hex}"
  display_name = "Security Alerts Topic"
  delivery_policy = jsonencode({
    "http" = {
      "defaultHealthyRetryPolicy" = {
        "minDelayTarget"     = 20
        "maxDelayTarget"     = 20
        "numRetries"         = 3
        "numMaxDelayRetries" = 0
        "numMinDelayRetries" = 0
        "numNoDelayRetries"  = 0
        "backoffFunction"    = "linear"
      }
    }
  })
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
```

# File: lib/modules/alerts/variables.tf

```hcl
variable "project_name" {
  type        = string
  description = "Name of the project"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
}

variable "notification_email" {
  type        = string
  description = "Email address for security notifications"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to resources"
  default     = {}
}
```

# File: lib/modules/alerts/outputs.tf

```hcl
output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "ARN of the SNS topic for security alerts"
}
```

# File: lib/modules/compute/main.tf

```hcl
// Module: compute
// Contains security groups, launch template, auto scaling group

resource "aws_security_group" "ec2" {
  name   = "${var.project_name}-${var.environment_suffix}-ec2-sg"
  vpc_id = var.vpc_id
  tags   = merge(var.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-ec2-sg" })

  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_launch_template" "main" {
  name          = "${var.project_name}-${var.environment_suffix}-lt"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  iam_instance_profile {
    name = var.ec2_instance_profile_name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -euxo pipefail
    dnf -y update || true
    # AL2023 includes SSM agent; ensure it is enabled and running
    systemctl enable --now amazon-ssm-agent || true
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = merge(var.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-instance" })
  }

  tags = var.common_tags
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.project_name}-${var.environment_suffix}-asg"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = []
  health_check_type         = "EC2"
  health_check_grace_period = 600

  wait_for_capacity_timeout = "0"

  min_size         = 1
  max_size         = 2
  desired_capacity = 1

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment_suffix}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
```

# File: lib/modules/compute/variables.tf

```hcl
// Variables for compute module

variable "project_name" { type = string }
variable "environment_suffix" { type = string }
variable "common_tags" { type = map(string) }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "instance_type" { type = string }
variable "allowed_ssh_cidrs" { type = list(string) }
variable "ec2_instance_profile_name" { type = string }
variable "ami_id" { type = string }
```

# File: lib/modules/compute/outputs.tf

```hcl
output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "security_group_id" {
  value = aws_security_group.ec2.id
}
```

// Outputs for compute module

# File: lib/modules/iam/main.tf

```hcl
// Module: iam
// Contains roles, instance profile, policies, and assume role policy documents

########################
# Assume Role Policies  #
########################

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "vpc_flow_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

########################
# Inline Policies       #
########################

data "aws_iam_policy_document" "cloudtrail_policy" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${var.cloudtrail_log_group_arn}:*"]
  }
}

data "aws_iam_policy_document" "vpc_flow_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "ec2_policy" {
  statement {
    actions = [
      "ssm:UpdateInstanceInformation",
      "ssm:SendCommand",
      "ssm:ListCommands",
      "ssm:ListCommandInvocations",
      "ssm:DescribeInstanceInformation",
      "ssm:GetDeployablePatchSnapshotForInstance",
      "ssm:GetDefaultPatchBaseline",
      "ssm:GetManifest",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:ListAssociations",
      "ssm:ListInstanceAssociations",
      "ssm:PutInventory",
      "ssm:PutComplianceItems",
      "ssm:PutConfigurePackageResult",
      "ssm:UpdateAssociationStatus",
      "ssm:UpdateInstanceAssociationStatus",
      "ec2messages:AcknowledgeMessage",
      "ec2messages:DeleteMessage",
      "ec2messages:FailMessage",
      "ec2messages:GetEndpoint",
      "ec2messages:GetMessages",
      "ec2messages:SendReply"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    actions = [
      "ec2:DescribeSecurityGroups",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:RevokeSecurityGroupIngress"
    ]
    resources = ["*"]
  }
}

###############
# IAM Roles    #
###############

resource "aws_iam_role" "cloudtrail" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-cloudtrail-role-"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "cloudtrail" {
  name   = "${var.project_name}-${var.environment_suffix}-cloudtrail-policy"
  role   = aws_iam_role.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_policy.json
}

resource "aws_iam_role" "vpc_flow" {
  count              = var.enable_vpc_flow_logs ? 1 : 0
  name_prefix        = "${var.project_name}-${var.environment_suffix}-vpc-flow-role-"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "vpc_flow" {
  count  = var.enable_vpc_flow_logs ? 1 : 0
  name   = "${var.project_name}-${var.environment_suffix}-vpc-flow-policy"
  role   = aws_iam_role.vpc_flow[0].id
  policy = data.aws_iam_policy_document.vpc_flow_policy.json
}

resource "aws_iam_role" "ec2" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-ec2-role-"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "ec2" {
  name   = "${var.project_name}-${var.environment_suffix}-ec2-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_policy.json
}

resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-ec2-profile-"
  role        = aws_iam_role.ec2.name
  tags        = var.common_tags
}

resource "aws_iam_role" "lambda" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-lambda-role-"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${var.project_name}-${var.environment_suffix}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}
```

# File: lib/modules/iam/variables.tf
```hcl
// Variables for iam module

variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "enable_vpc_flow_logs" {
  type    = bool
  default = true
}

// Needed to build CloudTrail policy for logs
variable "cloudtrail_log_group_arn" {
  type = string
}


# File: lib/modules/iam/outputs.tf
```hcl
// Outputs for iam module

output "cloudtrail_role_arn" {
  value = aws_iam_role.cloudtrail.arn
}

output "vpc_flow_role_arn" {
  value = var.enable_vpc_flow_logs ? aws_iam_role.vpc_flow[0].arn : null
}

output "ec2_role_arn" {
  value = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_name" {
  value = aws_iam_instance_profile.ec2.name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}
```

# File: lib/modules/lambda/main.tf

```hcl
// Module: lambda
// Contains remediation function, archive_file, permissions, and EventBridge wiring

resource "aws_lambda_function" "sg_remediation" {
  filename         = "sg_remediation.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-sg-remediation"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.sg_remediation.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60
  tags             = var.common_tags
}

data "archive_file" "sg_remediation" {
  type        = "zip"
  output_path = "sg_remediation.zip"
  source {
    content  = <<EOF
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
ec2 = boto3.client('ec2')

def handler(event, context):
    try:
        detail = event['detail']
        if detail['eventName'] not in ['AuthorizeSecurityGroupIngress', 'RevokeSecurityGroupIngress']:
            return

        sg_id = detail['requestParameters']['groupId']
        response = ec2.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        for rule in sg['IpPermissions']:
            if rule.get('FromPort') in [22, 3389]:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        logger.warning(f"Removing dangerous rule from {sg_id}: {rule}")
                        ec2.revoke_security_group_ingress(GroupId=sg_id, IpPermissions=[rule])

        return {'statusCode': 200, 'body': 'Remediation complete'}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
EOF
    filename = "index.py"
  }
}

resource "aws_cloudwatch_event_rule" "sg_changes" {
  name = "${var.project_name}-${var.environment_suffix}-sg-changes"
  event_pattern = jsonencode({
    source        = ["aws.ec2"]
    "detail-type" = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName   = ["AuthorizeSecurityGroupIngress", "RevokeSecurityGroupIngress"]
    }
  })
  tags = var.common_tags
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.sg_changes.name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.sg_remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sg_remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sg_changes.arn
}
```

# File: lib/modules/lambda/variables.tf

```hcl
// Variables for lambda module

// Module: lambda
variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "lambda_role_arn" {
  type = string
}
```

# File: lib/modules/lambda/outputs.tf

```hcl
// Outputs for lambda module

output "lambda_function_name" {
  value = aws_lambda_function.sg_remediation.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.sg_remediation.arn
}
```

# File: lib/modules/logging/main.tf

```hcl
// Module: logging
// Contains CloudTrail (toggled), CloudWatch log groups, and optional VPC flow logs

# Random suffix to prevent naming conflicts
resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment_suffix}-${random_id.suffix.hex}"
  retention_in_days = 90
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment_suffix}-${random_id.suffix.hex}"
  retention_in_days = 90
  tags              = var.common_tags
}

# Data sources needed for CloudTrail
data "aws_caller_identity" "current" {}

# CloudTrail Bucket Policy Data
data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = [var.logging_bucket_arn]
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
    resources = ["${var.logging_bucket_arn}/cloudtrail/*"]
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

# CloudTrail Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket" {
  bucket = var.logging_bucket_id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json

  depends_on = [
    data.aws_iam_policy_document.cloudtrail_bucket_policy
  ]
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  name                          = "${var.project_name}-${var.environment_suffix}-trail"
  s3_bucket_name                = var.logging_bucket_name
  s3_key_prefix                 = "cloudtrail/"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = var.cloudtrail_role_arn
  tags                          = var.common_tags
  depends_on                    = [aws_s3_bucket_policy.cloudtrail_bucket]
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  count           = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn    = var.vpc_flow_role_arn
  log_destination = aws_cloudwatch_log_group.vpc_flow[0].arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id
  tags            = var.common_tags
}
```

# File: lib/modules/logging/variables.tf
```hcl
// Variables for logging module

variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "enable_vpc_flow_logs" {
  type    = bool
  default = true
}

variable "enable_cloudtrail" {
  type        = bool
  default     = true
  description = "Create a dedicated CloudTrail for this stack"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "logging_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for logs"
}

variable "logging_bucket_id" {
  type        = string
  description = "ID of the S3 bucket for logs"
}

variable "logging_bucket_arn" {
  type        = string
  description = "ARN of the S3 bucket for logs"
}

variable "cloudtrail_role_arn" {
  type        = string
  description = "ARN of the CloudTrail IAM role"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for flow logs"
}

variable "vpc_flow_role_arn" {
  type        = string
  description = "ARN of the VPC Flow Logs IAM role"
}

# File: lib/modules/logging/outputs.tf
// Outputs for logging module

output "cloudtrail_log_group_arn" {
  value = aws_cloudwatch_log_group.cloudtrail.arn
}

output "cloudtrail_log_group_name" {
  value = aws_cloudwatch_log_group.cloudtrail.name
}

output "vpc_flow_log_group_arn" {
  value = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow[0].arn : null
}

output "cloudtrail_name" {
  value = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null
}
```

# File: lib/modules/monitoring/main.tf

```hcl
# CloudWatch Metric Filter for Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_calls" {
  name           = "${var.project_name}-${var.environment_suffix}-unauthorized-calls"
  log_group_name = var.cloudtrail_log_group_name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment_name}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for Unauthorized API Calls
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
  alarm_actions       = [var.sns_topic_arn]
  tags                = var.common_tags
}
```

# File: lib/modules/monitoring/variables.tf
```hcl
variable "project_name" {
  type        = string
  description = "Name of the project"
}

variable "environment_name" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
}

variable "cloudtrail_log_group_name" {
  type        = string
  description = "Name of the CloudTrail log group"
}

variable "sns_topic_arn" {
  type        = string
  description = "ARN of the SNS topic for alerts"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to resources"
  default     = {}
}
```

# File: lib/modules/monitoring/outputs.tf

```hcl
output "unauthorized_calls_metric_filter_name" {
  value       = aws_cloudwatch_log_metric_filter.unauthorized_calls.name
  description = "Name of the unauthorized calls metric filter"
}

output "unauthorized_calls_alarm_name" {
  value       = aws_cloudwatch_metric_alarm.unauthorized_calls.alarm_name
  description = "Name of the unauthorized calls alarm"
}

# File: lib/modules/network/main.tf
```hcl
// Module: network
// Contains VPC, subnets, routing, NAT, IGW

locals {
  common_tags = var.common_tags
  public_subnets = {
    for i, az in var.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i)
      az   = az
    }
  }
  private_subnets = {
    for i, az in var.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i + 10)
      az   = az
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-igw" })
}

resource "aws_subnet" "public" {
  for_each                = local.public_subnets
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-public-${each.key}" })
}

resource "aws_subnet" "private" {
  for_each          = local.private_subnets
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags              = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-private-${each.key}" })
}

resource "aws_eip" "nat" {
  for_each = local.public_subnets
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "main" {
  for_each      = local.public_subnets
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  tags          = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-nat-${each.key}" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-public-rt" })
}

resource "aws_route_table" "private" {
  for_each = local.private_subnets
  vpc_id   = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[each.key].id
  }
  tags = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-private-rt-${each.key}" })
}

resource "aws_route_table_association" "public" {
  for_each       = local.public_subnets
  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each       = local.private_subnets
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}
```

# File: lib/modules/network/variables.tf

```hcl
// Variables for network module

variable "project_name" { type = string }
variable "environment_suffix" { type = string }
variable "common_tags" { type = map(string) }
variable "azs" { type = list(string) }
```

# File: lib/modules/network/outputs.tf

```hcl
// Outputs for network module

output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = [for s in aws_subnet.public : s.id] }
output "private_subnet_ids" { value = [for s in aws_subnet.private : s.id] }
output "nat_gateway_ids" { value = [for n in aws_nat_gateway.main : n.id] }
```

# File: lib/modules/s3/main.tf

```hcl
// Module: s3
// Contains data and logging buckets, encryption, versioning, bucket policies

locals {
  common_tags = var.common_tags
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "logging" {
  bucket        = "${var.project_name}-${var.environment_suffix}-logging-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags          = local.common_tags
}

resource "aws_s3_bucket" "data" {
  bucket        = "${var.project_name}-${var.environment_suffix}-data-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags          = local.common_tags
}

resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket                  = aws_s3_bucket.logging.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/"
}

data "aws_iam_policy_document" "s3_tls_only" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "data_tls_only" {
  bucket = aws_s3_bucket.data.id
  policy = data.aws_iam_policy_document.s3_tls_only.json
}
```

# File: lib/modules/s3/variables.tf

```hcl
// Variables for s3 module

variable "project_name" {
  type = string
}

variable "environment_suffix" {
  type = string
}

variable "common_tags" {
  type = map(string)
}
```

# File: lib/modules/s3/outputs.tf

```hcl
// Outputs for s3 module

output "data_bucket_name" { value = aws_s3_bucket.data.bucket }
output "data_bucket_id" { value = aws_s3_bucket.data.id }
output "data_bucket_arn" { value = aws_s3_bucket.data.arn }

output "logging_bucket_name" { value = aws_s3_bucket.logging.bucket }
output "logging_bucket_id" { value = aws_s3_bucket.logging.id }
output "logging_bucket_arn" { value = aws_s3_bucket.logging.arn }
```
