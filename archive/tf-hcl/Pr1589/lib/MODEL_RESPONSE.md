## provider.tf

```hcl
terraform {
  required_version = "~> 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "tap-stack/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = "us-east-1"
}
```

## tap_stack.tf

```hcl
# Variables
variable "project_name" { type = string }
variable "environment_name" { type = string }
variable "notification_email" { type = string }
variable "allowed_ssh_cidrs" { type = list(string); default = [] }
variable "instance_type" { type = string; default = "t3.micro" }
variable "enable_vpc_flow_logs" { type = bool; default = true }
variable "tags" { type = map(string); default = {} }

# Data Sources
data "aws_availability_zones" "available" { state = "available" }
data "aws_caller_identity" "current" {}
data "aws_ssm_parameter" "al2023_ami" { name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64" }

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

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${var.project_name}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-igw" })
}

# Subnets
resource "aws_subnet" "public" {
  for_each                = local.public_subnets
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-public-${each.key}" })
}

resource "aws_subnet" "private" {
  for_each          = local.private_subnets
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags              = merge(local.common_tags, { Name = "${var.project_name}-private-${each.key}" })
}

# NAT Gateways
resource "aws_eip" "nat" {
  for_each = local.public_subnets
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${var.project_name}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "main" {
  for_each      = local.public_subnets
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  tags          = merge(local.common_tags, { Name = "${var.project_name}-nat-${each.key}" })
  depends_on    = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route { cidr_block = "0.0.0.0/0"; gateway_id = aws_internet_gateway.main.id }
  tags = merge(local.common_tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route_table" "private" {
  for_each = local.private_subnets
  vpc_id   = aws_vpc.main.id
  route { cidr_block = "0.0.0.0/0"; nat_gateway_id = aws_nat_gateway.main[each.key].id }
  tags = merge(local.common_tags, { Name = "${var.project_name}-private-rt-${each.key}" })
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

# S3 Buckets
resource "aws_s3_bucket" "logging" {
  bucket        = "${var.project_name}-${var.environment_name}-logging-${random_id.bucket_suffix.hex}"
  force_destroy = false
  tags          = local.common_tags
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket" "data" {
  bucket        = "${var.project_name}-${var.environment_name}-data-${random_id.bucket_suffix.hex}"
  force_destroy = false
  tags          = local.common_tags
}

resource "random_id" "bucket_suffix" { byte_length = 4 }

resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
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
    sid       = "DenyInsecureConnections"
    effect    = "Deny"
    principals { type = "*"; identifiers = ["*"] }
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
    condition { test = "Bool"; variable = "aws:SecureTransport"; values = ["false"] }
  }
}

resource "aws_s3_bucket_policy" "data_tls_only" {
  bucket = aws_s3_bucket.data.id
  policy = data.aws_iam_policy_document.s3_tls_only.json
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment_name}"
  retention_in_days = 90
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment_name}"
  retention_in_days = 90
  tags              = local.common_tags
}

# IAM Policies
data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["cloudtrail.amazonaws.com"] }
  }
}

data "aws_iam_policy_document" "cloudtrail_policy" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.cloudtrail.arn}:*"]
  }
}

data "aws_iam_policy_document" "vpc_flow_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["vpc-flow-logs.amazonaws.com"] }
  }
}

data "aws_iam_policy_document" "vpc_flow_policy" {
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogGroups", "logs:DescribeLogStreams"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["ec2.amazonaws.com"] }
  }
}

data "aws_iam_policy_document" "ec2_policy" {
  statement {
    actions   = ["ssm:UpdateInstanceInformation", "ssm:SendCommand", "ssm:ListCommands", "ssm:ListCommandInvocations", "ssm:DescribeInstanceInformation", "ssm:GetDeployablePatchSnapshotForInstance", "ssm:GetDefaultPatchBaseline", "ssm:GetManifest", "ssm:GetParameter", "ssm:GetParameters", "ssm:ListAssociations", "ssm:ListInstanceAssociations", "ssm:PutInventory", "ssm:PutComplianceItems", "ssm:PutConfigurePackageResult", "ssm:UpdateAssociationStatus", "ssm:UpdateInstanceAssociationStatus", "ec2messages:AcknowledgeMessage", "ec2messages:DeleteMessage", "ec2messages:FailMessage", "ec2messages:GetEndpoint", "ec2messages:GetMessages", "ec2messages:SendReply"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["lambda.amazonaws.com"] }
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    actions   = ["ec2:DescribeSecurityGroups", "ec2:AuthorizeSecurityGroupIngress", "ec2:RevokeSecurityGroupIngress"]
    resources = ["*"]
  }
}

# IAM Roles
resource "aws_iam_role" "cloudtrail" {
  name               = "${var.project_name}-${var.environment_name}-cloudtrail-role"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail" {
  name   = "${var.project_name}-${var.environment_name}-cloudtrail-policy"
  role   = aws_iam_role.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_policy.json
}

resource "aws_iam_role" "vpc_flow" {
  count              = var.enable_vpc_flow_logs ? 1 : 0
  name               = "${var.project_name}-${var.environment_name}-vpc-flow-role"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow" {
  count  = var.enable_vpc_flow_logs ? 1 : 0
  name   = "${var.project_name}-${var.environment_name}-vpc-flow-policy"
  role   = aws_iam_role.vpc_flow[0].id
  policy = data.aws_iam_policy_document.vpc_flow_policy.json
}

resource "aws_iam_role" "ec2" {
  name               = "${var.project_name}-${var.environment_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "ec2" {
  name   = "${var.project_name}-${var.environment_name}-ec2-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_policy.json
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-${var.environment_name}-ec2-profile"
  role = aws_iam_role.ec2.name
  tags = local.common_tags
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}-${var.environment_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${var.project_name}-${var.environment_name}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                         = "${var.project_name}-${var.environment_name}-trail"
  s3_bucket_name               = aws_s3_bucket.logging.bucket
  s3_key_prefix                = "cloudtrail/"
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  cloud_watch_logs_group_arn   = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn    = aws_iam_role.cloudtrail.arn
  tags                         = local.common_tags
  depends_on                   = [aws_s3_bucket_policy.cloudtrail_bucket]
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.logging.arn]
    principals { type = "Service"; identifiers = ["cloudtrail.amazonaws.com"] }
    condition { test = "StringEquals"; variable = "AWS:SourceArn"; values = ["arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_name}-trail"] }
  }
  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logging.arn}/cloudtrail/*"]
    principals { type = "Service"; identifiers = ["cloudtrail.amazonaws.com"] }
    condition { test = "StringEquals"; variable = "s3:x-amz-acl"; values = ["bucket-owner-full-control"] }
    condition { test = "StringEquals"; variable = "AWS:SourceArn"; values = ["arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_name}-trail"] }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket" {
  bucket = aws_s3_bucket.logging.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  count           = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn    = aws_iam_role.vpc_flow[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  tags            = local.common_tags
}

# Security Groups
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-${var.environment_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.common_tags, { Name = "${var.project_name}-ec2-sg" })
  
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

# EC2 Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-${var.environment_name}-"
  image_id      = data.aws_ssm_parameter.al2023_ami.value
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile { name = aws_iam_instance_profile.ec2.name }
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_name}-instance" })
  }
  
  tags = local.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-${var.environment_name}-asg"
  vpc_zone_identifier = [for subnet in aws_subnet.private : subnet.id]
  target_group_arns   = []
  health_check_type   = "EC2"
  health_check_grace_period = 300
  
  min_size         = 1
  max_size         = 2
  desired_capacity = 1
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment_name}-asg"
    propagate_at_launch = false
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment_name}-security-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Metric Filter
resource "aws_cloudwatch_metric_filter" "unauthorized_calls" {
  name           = "${var.project_name}-${var.environment_name}-unauthorized-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"
  
  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment_name}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm
resource "aws_cloudwatch_metric_alarm" "unauthorized_calls" {
  alarm_name          = "${var.project_name}-${var.environment_name}-unauthorized-calls"
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

# Lambda Function
resource "aws_lambda_function" "sg_remediation" {
  filename         = "sg_remediation.zip"
  function_name    = "${var.project_name}-${var.environment_name}-sg-remediation"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.sg_remediation.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60
  tags            = local.common_tags
}

data "archive_file" "sg_remediation" {
  type        = "zip"
  output_path = "sg_remediation.zip"
  source {
    content = <<EOF
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

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "sg_changes" {
  name = "${var.project_name}-${var.environment_name}-sg-changes"
  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName   = ["AuthorizeSecurityGroupIngress", "RevokeSecurityGroupIngress"]
    }
  })
  tags = local.common_tags
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

# Outputs
output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = [for subnet in aws_subnet.public : subnet.id] }
output "private_subnet_ids" { value = [for subnet in aws_subnet.private : subnet.id] }
output "nat_gateway_ids" { value = [for nat in aws_nat_gateway.main : nat.id] }
output "asg_name" { value = aws_autoscaling_group.main.name }
output "data_bucket_name" { value = aws_s3_bucket.data.bucket }
output "logging_bucket_name" { value = aws_s3_bucket.logging.bucket }
output "cloudtrail_name" { value = aws_cloudtrail.main.name }
output "cloudtrail_log_group_arn" { value = aws_cloudwatch_log_group.cloudtrail.arn }
output "vpc_flow_log_group_arn" { value = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow[0].arn : null }
output "sns_topic_arn" { value = aws_sns_topic.alerts.arn }
output "lambda_function_name" { value = aws_lambda_function.sg_remediation.function_name }
output "lambda_function_arn" { value = aws_lambda_function.sg_remediation.arn }
```