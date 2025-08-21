terraform {
backend "s3" { # Backend config is provided at init (e.g. -backend-config)
}
}

#######################

# Variables with Validation

#######################

variable "author" {
description = "The author of the infrastructure"
type = string
default = "ngwakoleslieelijah"

validation {
condition = length(var.author) > 0
error_message = "Author name must not be empty."
}
}

variable "created_date" {
description = "The date when the infrastructure was created"
type = string
default = "2025-08-17"

validation {
condition = can(regex("^\\d{4}-\\d{2}-\\d{2}$", var.created_date))
error_message = "Created date must be in YYYY-MM-DD format."
}
}

variable "aws_region" {
description = "AWS region"
type = string
default = "us-east-1"
}

variable "environment" {
description = "Environment name (dev/staging/prod)"
type = string
default = "dev"
}

variable "project_name" {
description = "Project name"
type = string
default = "tap-app"
}

variable "instance_type" {
description = "EC2 instance type"
type = string
default = "t3.micro"
}

variable "key_pair_name" {
description = "EC2 key pair name (optional)"
type = string
default = ""
}

variable "db_username" {
description = "Database master username (min 8 chars)"
type = string
sensitive = true
default = "database_admin"

validation {
condition = length(var.db_username) >= 8
error_message = "Database username must be at least 8 characters."
}
}

variable "vpc_cidr" {
description = "VPC CIDR"
type = string
default = "10.0.0.0/16"
}

variable "backup_retention_days" {
description = "Backup retention in days"
type = number
default = 7
}

variable "log_retention_days" {
description = "Log retention in days"
type = number
default = 90
}

variable "enable_waf" {
description = "Enable WAF"
type = bool
default = true
}

variable "db_engine" {
description = "DB engine"
type = string
default = "mysql"
}

variable "db_engine_version" {
description = "DB engine version"
type = string
default = "8.0"
}

variable "db_instance_class" {
description = "DB instance class"
type = string
default = "db.t3.micro"
}

variable "db_allocated_storage" {
description = "DB allocated storage (GB)"
type = number
default = 20
}

variable "db_multi_az" {
description = "Enable Multi-AZ for RDS"
type = bool
default = true
}

variable "allowed_ips" {
description = "Allowed IPs for bastion (CIDR list)"
type = list(string)
default = ["0.0.0.0/0"]
}

variable "notification_email" {
description = "Email for notifications"
type = string
default = "security@example.com"
}

# --- ADDED / FIXES variables ---

variable "enable_performance_insights" {
description = "Enable RDS Performance Insights (only for supported instance classes)"
type = bool
default = false
}

variable "route53_zone_id" {
description = "Route53 Hosted Zone ID for automatic ACM validation. Leave empty to validate externally."
type = string
default = ""
}

variable "manage_config_recorder" {
description = "If true Terraform will create/manage AWS Config recorder/delivery channel. If your account already has one, set to false and import."
type = bool
default = false
}

#######################

# Random resources

#######################

resource "random_string" "suffix" {
length = 6
special = false
upper = false
}

resource "random*password" "db_password" {
length = 24
special = true
override_special = "!#$%&\*()-*=+[]{}<>:?"
lifecycle {
ignore_changes = all
}
}

#######################

# Locals

#######################

locals {
timestamp = formatdate("YYYYMMDDHHMMSS", timestamp())
name_prefix = "${substr(var.project_name, 0, 3)}-${var.environment}-${local.timestamp}-${random_string.suffix.result}"

common_tags = {
Environment = var.environment
Project = var.project_name
ManagedBy = "Terraform"
CreatedBy = var.author
CreatedDate = var.created_date
DeployTime = local.timestamp
Compliance = "Enterprise-v2.0"
CostCenter = "IT-${upper(var.environment)}"
SecurityScan = "Required"
DataClassification = "Confidential"
}

vpc_cidr = var.vpc_cidr
public_subnets_cidr = [cidrsubnet(local.vpc_cidr, 8, 0), cidrsubnet(local.vpc_cidr, 8, 1), cidrsubnet(local.vpc_cidr, 8, 2)]
private_subnets_cidr = [cidrsubnet(local.vpc_cidr, 8, 10), cidrsubnet(local.vpc_cidr, 8, 11), cidrsubnet(local.vpc_cidr, 8, 12)]
db_subnets_cidr = [cidrsubnet(local.vpc_cidr, 8, 20), cidrsubnet(local.vpc_cidr, 8, 21), cidrsubnet(local.vpc_cidr, 8, 22)]

http_port = 80
https_port = 443
ssh_port = 22
db_port = var.db_engine == "mysql" ? 3306 : 5432

logs_bucket_name = "${local.name_prefix}-logs"
}

#######################

# Data sources

#######################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_elb_service_account" "elb_account" {}

data "aws_availability_zones" "available" {
state = "available"
}

data "aws_ami" "amazon_linux" {
most_recent = true
owners = ["amazon"]
filter {
name = "name"
values = ["amzn2-ami-hvm-*-x86_64-gp2"]
}
filter {
name = "virtualization-type"
values = ["hvm"]
}
}

#######################

# KMS Keys

#######################

resource "aws_kms_key" "main" {
description = "KMS key for general encryption - ${local.name_prefix}"
deletion_window_in_days = 30
enable_key_rotation = true

policy = jsonencode({
Version = "2012-10-17",
Statement = [
{
Sid = "EnableIAM"
Effect = "Allow"
Principal = {
AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws*caller_identity.current.account_id}:root"
}
Action = "kms:*"
Resource = "_"
},
{
Sid = "AllowLogs"
Effect = "Allow"
Principal = {
Service = "logs.${data.aws_region.current.name}.amazonaws.com"
}
Action = [
"kms:Encrypt*",
"kms:Decrypt*",
"kms:ReEncrypt*",
"kms:GenerateDataKey*",
"kms:Describe*"
]
Resource = "_"
},
{
Sid = "AllowELBServiceToUseKMSForS3Logging"
Effect = "Allow"
Principal = {
Service = "elasticloadbalancing.amazonaws.com"
}
Action = [
"kms:GenerateDataKey",
"kms:Encrypt",
"kms:ReEncrypt_",
"kms:DescribeKey"
]
Resource = "\*"
Condition = {
StringEquals = {
"aws:SourceAccount" = data.aws_caller_identity.current.account_id
}
}
}
]
})

tags = merge(local.common_tags, { Name = "${local.name_prefix}-kms-key", Type = "Encryption" })
}

resource "aws_kms_alias" "main" {
name = "alias/${local.name_prefix}-key"
target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key" "rds" {
description = "KMS key for RDS encryption - ${local.name_prefix}"
deletion_window_in_days = 30
enable_key_rotation = true

policy = jsonencode({
Version = "2012-10-17",
Statement = [
{
Sid = "EnableIAM"
Effect = "Allow"
Principal = {
AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws*caller_identity.current.account_id}:root"
}
Action = "kms:*"
Resource = "\_"
},
{
Sid = "AllowRDS"
Effect = "Allow"
Principal = {
Service = "rds.amazonaws.com"
}
Action = [
"kms:Encrypt*",
"kms:Decrypt*",
"kms:ReEncrypt*",
"kms:GenerateDataKey*",
"kms:Describe*"
]
Resource = "\*"
}
]
})

tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-kms-key", Type = "Encryption" })
}

resource "aws_kms_alias" "rds" {
name = "alias/${local.name_prefix}-rds-key"
target_key_id = aws_kms_key.rds.key_id
}

#######################

# S3 Logging Bucket

#######################

resource "aws_s3_bucket" "logs" {
bucket = local.logs_bucket_name

lifecycle {
prevent_destroy = true
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-logs", Type = "Logging" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
bucket = aws_s3_bucket.logs.id
rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.main.arn
sse_algorithm = "aws:kms"
}
}
}

resource "aws_s3_bucket_versioning" "logs" {
bucket = aws_s3_bucket.logs.id
versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
bucket = aws_s3_bucket.logs.id
rule {
id = "log-lifecycle"
status = "Enabled"
filter {
prefix = "logs/"
}
transition {
days = 30
storage_class = "STANDARD_IA"
}
transition {
days = 90
storage_class = "GLACIER"
}
expiration { days = 365 }
}
}

resource "aws_s3_bucket_public_access_block" "logs" {
bucket = aws_s3_bucket.logs.id
block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs" {
bucket = aws_s3_bucket.logs.id

policy = jsonencode({
Version = "2012-10-17",
Statement = [
{
Sid = "AWSLogDeliveryWrite"
Effect = "Allow"
Principal = { Service = "delivery.logs.amazonaws.com" }
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.logs.arn}/*"
Condition = {
StringEquals = {
"s3:x-amz-acl" = "bucket-owner-full-control"
}
}
},
{
Sid = "AWSLogDeliveryAclCheck"
Effect = "Allow"
Principal = { Service = "delivery.logs.amazonaws.com" }
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.logs.arn
},
{
Sid = "ALBLogs"
Effect = "Allow"
Principal = { AWS = data.aws_elb_service_account.elb_account.arn }
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
},
{
Sid = "AllowALBToPutObjectFromThisAccount"
Effect = "Allow"
Principal = { Service = "elasticloadbalancing.amazonaws.com" }
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.logs.arn}/*"
Condition = {
StringEquals = {
"aws:SourceAccount" = data.aws_caller_identity.current.account_id
},
ArnLike = {
"aws:SourceArn" = "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*"
}
}
}
]
})
}

#######################

# VPC & Networking

#######################

resource "aws_vpc" "main" {
cidr_block = local.vpc_cidr
enable_dns_support = true
enable_dns_hostnames = true
tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_flow_log" "vpc_flow_log" {
vpc_id = aws_vpc.main.id
log_destination = aws_s3_bucket.logs.arn
log_destination_type = "s3"
traffic_type = "ALL"
tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc-flow-log" })
}

resource "aws_internet_gateway" "main" {
vpc_id = aws_vpc.main.id
tags = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
count = length(local.public_subnets_cidr)
vpc_id = aws_vpc.main.id
cidr_block = local.public_subnets_cidr[count.index]
availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
map_public_ip_on_launch = true
tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private" {
count = length(local.private_subnets_cidr)
vpc_id = aws_vpc.main.id
cidr_block = local.private_subnets_cidr[count.index]
availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-${count.index + 1}", Tier = "private" })
}

resource "aws_subnet" "database" {
count = length(local.db_subnets_cidr)
vpc_id = aws_vpc.main.id
cidr_block = local.db_subnets_cidr[count.index]
availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-${count.index + 1}", Tier = "database" })
}

resource "aws_route_table" "public" {
vpc_id = aws_vpc.main.id
route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.main.id
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-rt" })
}

resource "aws_route_table_association" "public" {
count = length(aws_subnet.public)
subnet_id = aws_subnet.public[count.index].id
route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
count = length(aws_subnet.public)
domain = "vpc"
tags = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
count = length(aws_subnet.public)
allocation_id = aws_eip.nat[count.index].id
subnet_id = aws_subnet.public[count.index].id
tags = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })
depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
count = length(aws_nat_gateway.main)
vpc_id = aws_vpc.main.id
route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.main[count.index].id
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
count = length(aws_subnet.private)
subnet_id = aws_subnet.private[count.index].id
route_table_id = aws_route_table.private[count.index % length(aws_route_table.private)].id
}

resource "aws_route_table" "database" {
count = length(aws_nat_gateway.main)
vpc_id = aws_vpc.main.id
route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.main[count.index].id
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "database" {
count = length(aws_subnet.database)
subnet_id = aws_subnet.database[count.index].id
route_table_id = aws_route_table.database[count.index % length(aws_route_table.database)].id
}

resource "aws_network_acl" "public" {
vpc_id = aws_vpc.main.id
subnet_ids = aws_subnet.public[*].id

ingress {
protocol = "tcp"
rule_no = 100
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = local.http_port
to_port = local.http_port
}
ingress {
protocol = "tcp"
rule_no = 110
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = local.https_port
to_port = local.https_port
}
ingress {
protocol = "tcp"
rule_no = 120
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = local.ssh_port
to_port = local.ssh_port
}
ingress {
protocol = "tcp"
rule_no = 130
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 1024
to_port = 65535
}
egress {
protocol = "-1"
rule_no = 100
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 0
to_port = 0
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-nacl" })
}

resource "aws_network_acl" "private" {
vpc_id = aws_vpc.main.id
subnet_ids = aws_subnet.private[*].id

ingress {
protocol = "tcp"
rule_no = 100
action = "allow"
cidr_block = local.vpc_cidr
from_port = 0
to_port = 65535
}
ingress {
protocol = "tcp"
rule_no = 200
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 1024
to_port = 65535
}
egress {
protocol = "-1"
rule_no = 100
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 0
to_port = 0
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-nacl" })
}

resource "aws_network_acl" "database" {
vpc_id = aws_vpc.main.id
subnet_ids = aws_subnet.database[*].id

ingress {
protocol = "tcp"
rule_no = 100
action = "allow"
cidr_block = local.vpc_cidr
from_port = local.db_port
to_port = local.db_port
}
ingress {
protocol = "tcp"
rule_no = 200
action = "allow"
cidr_block = local.vpc_cidr
from_port = 1024
to_port = 65535
}
egress {
protocol = "tcp"
rule_no = 100
action = "allow"
cidr_block = local.vpc_cidr
from_port = 1024
to_port = 65535
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-nacl" })
}

#######################

# Security Groups

#######################

resource "aws_security_group" "alb" {
name = "${local.name_prefix}-alb-sg"
description = "ALB SG"
vpc_id = aws_vpc.main.id

ingress {
description = "HTTP"
from_port = local.http_port
to_port = local.http_port
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}
ingress {
description = "HTTPS"
from_port = local.https_port
to_port = local.https_port
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}
egress {
description = "All"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb-sg" })
}

resource "aws_security_group" "web" {
name = "${local.name_prefix}-web-sg"
description = "web SG"
vpc_id = aws_vpc.main.id

ingress {
description = "HTTP from ALB"
from_port = local.http_port
to_port = local.http_port
protocol = "tcp"
security_groups = [aws_security_group.alb.id]
}
ingress {
description = "HTTPS from ALB"
from_port = local.https_port
to_port = local.https_port
protocol = "tcp"
security_groups = [aws_security_group.alb.id]
}
egress {
description = "All"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-sg" })
}

resource "aws_security_group" "bastion" {
name = "${local.name_prefix}-bastion-sg"
description = "bastion SG"
vpc_id = aws_vpc.main.id

ingress {
description = "SSH"
from_port = local.ssh_port
to_port = local.ssh_port
protocol = "tcp"
cidr_blocks = var.allowed_ips
}
egress {
description = "All"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-bastion-sg" })
}

resource "aws_security_group" "db" {
name = "${local.name_prefix}-db-sg"
description = "db SG"
vpc_id = aws_vpc.main.id

ingress {
description = "DB from web"
from_port = local.db_port
to_port = local.db_port
protocol = "tcp"
security_groups = [aws_security_group.web.id]
}
egress {
description = "Private outbound"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = local.private_subnets_cidr
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-sg" })
}

#######################

# IAM Roles & Policies

#######################

resource "aws_iam_role" "ec2_role" {
name = "${local.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2-role" })
}

resource "aws*iam_policy" "ec2_policy" {
name = "${local.name_prefix}-ec2-policy"
  description = "EC2 least privilege"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${local.name_prefix}*:*"
      },
      {
        Effect = "Allow",
        Action = ["s3:GetObject","s3:ListBucket"],
        Resource = [ aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*" ]
},
{
Effect = "Allow",
Action = ["kms:Decrypt","kms:GenerateDataKey_"],
Resource = aws_kms_key.main.arn
}
]
})
tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2-policy" })
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
role = aws_iam_role.ec2_role.name
policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_role_policy_attachment" "ssm_policy_attachment" {
role = aws_iam_role.ec2_role.name
policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
role = aws_iam_role.ec2_role.name
policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
name = "${local.name_prefix}-ec2-profile"
role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role" "rds_monitoring" {
name = "${local.name_prefix}-rds-monitoring"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-monitoring" })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
role = aws_iam_role.rds_monitoring.name
policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "config_role" {
name = "${local.name_prefix}-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-config-role" })
}

resource "aws_iam_role_policy_attachment" "config_policy_attach" {
role = aws_iam_role.config_role.name
policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWS_ConfigRole"
}

#######################

# CloudWatch & SNS

#######################

resource "aws_cloudwatch_log_group" "web" {
name = "/aws/ec2/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-web-logs" })
}

resource "aws_cloudwatch_log_group" "alb" {
name = "/aws/alb/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-alb-logs" })
}

resource "aws_sns_topic" "alerts" {
name = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.main.id
  tags              = merge(local.common_tags, { Name = "${local.name_prefix}-alerts" })
}

resource "aws_sns_topic_subscription" "email" {
topic_arn = aws_sns_topic.alerts.arn
protocol = "email"
endpoint = var.notification_email
}

#######################

# Database

#######################

resource "aws_db_subnet_group" "main" {
name = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-db-subnet-group" })
}

resource "aws_db_parameter_group" "main" {
name = "${local.name_prefix}-db-params"
  family = "${var.db_engine}8.0"
parameter {
name = "character_set_server"
value = "utf8"
}
parameter {
name = "character_set_client"
value = "utf8"
}
parameter {
name = "log_output"
value = "FILE"
}
parameter {
name = "slow_query_log"
value = "1"
}
tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-params" })
}

resource "aws_db_instance" "main" {
identifier = "${local.name_prefix}-db"
engine = var.db_engine
engine_version = var.db_engine_version
instance_class = var.db_instance_class
allocated_storage = var.db_allocated_storage
max_allocated_storage = var.db_allocated_storage \* 5

db*name = "app*${var.environment}"
username = var.db_username
password = random_password.db_password.result
port = local.db_port
multi_az = var.db_multi_az
db_subnet_group_name = aws_db_subnet_group.main.name
parameter_group_name = aws_db_parameter_group.main.name
vpc_security_group_ids = [aws_security_group.db.id]

storage_type = "gp3"
storage_encrypted = true
kms_key_id = aws_kms_key.rds.arn

backup_retention_period = var.backup_retention_days
backup_window = "03:00-04:00"
maintenance_window = "sun:04:30-sun:05:30"

deletion_protection = var.environment == "prod" ? true : false
skip_final_snapshot = var.environment == "prod" ? false : true
final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot" : null

enabled_cloudwatch_logs_exports = ["error", "general", "slowquery", "audit"]

# Performance Insights: conditional to avoid invalid configs for unsupported instance classes

performance_insights_enabled = var.enable_performance_insights
performance_insights_retention_period = var.enable_performance_insights ? 7 : 0
performance_insights_kms_key_id = var.enable_performance_insights ? aws_kms_key.rds.arn : null

monitoring_interval = 60
monitoring_role_arn = aws_iam_role.rds_monitoring.arn

auto_minor_version_upgrade = true
apply_immediately = var.environment != "prod"

tags = merge(local.common_tags, { Name = "${local.name_prefix}-db" })
depends_on = [aws_cloudwatch_log_group.web]
}

#######################

# ALB & ACM

#######################

resource "aws_acm_certificate" "main" {
domain_name = "${local.name_prefix}.example.com"
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cert" })
}

# Route53 validation records: create one record per domain_validation_options entry (safe iteration)

resource "aws_route53_record" "acm_validation" {
for_each = var.route53_zone_id != "" ? { for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => dvo } : {}

zone_id = var.route53_zone_id
name = each.value.resource_record_name
type = each.value.resource_record_type
ttl = 300
records = [each.value.resource_record_value]
}

resource "aws_acm_certificate_validation" "main" {
count = var.route53_zone_id != "" ? 1 : 0
certificate_arn = aws_acm_certificate.main.arn
validation_record_fqdns = [for rec in aws_route53_record.acm_validation : rec.fqdn]
}

resource "aws_lb" "main" {
name = "${local.name_prefix}-alb"
internal = false
load_balancer_type = "application"
security_groups = [aws_security_group.alb.id]
subnets = aws_subnet.public[*].id

enable_deletion_protection = var.environment == "prod"
drop_invalid_header_fields = true
enable_cross_zone_load_balancing = true

access_logs {
bucket = aws_s3_bucket.logs.id
prefix = "alb-logs"
enabled = true
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb" })
}

# Keep target group name short to satisfy <= 32 char limit

resource "aws_lb_target_group" "http" {
name = "${local.name_prefix}-tg"
port = 80
protocol = "HTTP"
vpc_id = aws_vpc.main.id

health_check {
enabled = true
interval = 30
path = "/health"
port = "traffic-port"
healthy_threshold = 3
unhealthy_threshold = 3
timeout = 5
matcher = "200"
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-http-tg" })
}

resource "aws_lb_listener" "http" {
load_balancer_arn = aws_lb.main.arn
port = 80
protocol = "HTTP"

default_action {
type = "redirect"
redirect {
port = "443"
protocol = "HTTPS"
status_code = "HTTP_301"
}
}
}

resource "aws_lb_listener" "https" {
load_balancer_arn = aws_lb.main.arn
port = 443
protocol = "HTTPS"
ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06"
certificate_arn = aws_acm_certificate.main.arn

default_action {
type = "forward"
target_group_arn = aws_lb_target_group.http.arn
}
}

#######################

# Launch Template & ASG

#######################

resource "aws_launch_template" "web" {
name_prefix = "${local.name_prefix}-web-"
image_id = data.aws_ami.amazon_linux.id
instance_type = var.instance_type

user_data = base64encode(<<-EOF
#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
yum update -y
yum install -y httpd amazon-cloudwatch-agent amazon-ssm-agent jq awslogs
cat > /var/www/html/index.html <<'HTML'

<html><body><h1>Hello from ${local.name_prefix}</h1><p>Created by: ${var.author}</p></body></html>
HTML
echo "OK" > /var/www/html/health
systemctl enable httpd; systemctl start httpd
systemctl enable amazon-ssm-agent; systemctl start amazon-ssm-agent
systemctl enable amazon-cloudwatch-agent; systemctl start amazon-cloudwatch-agent
EOF
)

iam_instance_profile { name = aws_iam_instance_profile.ec2_profile.name }

network_interfaces {
associate_public_ip_address = false
security_groups = [aws_security_group.web.id]
delete_on_termination = true
}

block_device_mappings {
device_name = "/dev/xvda"
ebs {
volume_size = 20
volume_type = "gp3"
encrypted = true
kms_key_id = aws_kms_key.main.arn
delete_on_termination = true
}
}

metadata_options {
http_endpoint = "enabled"
http_tokens = "required"
http_put_response_hop_limit = 1
instance_metadata_tags = "enabled"
}

monitoring { enabled = true }

tag_specifications {
resource_type = "instance"
tags = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
}

tag_specifications {
resource_type = "volume"
tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-volume" })
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-lt" })
}

resource "aws_autoscaling_group" "web" {
name_prefix = "${local.name_prefix}-web-asg-"
max_size = 4
min_size = 2
desired_capacity = 2
health_check_grace_period = 300
health_check_type = "ELB"
vpc_zone_identifier = aws_subnet.private[*].id
target_group_arns = [aws_lb_target_group.http.arn]

launch_template {
id = aws_launch_template.web.id
version = "$Latest"
}

termination_policies = ["OldestLaunchTemplate", "OldestInstance"]

enabled_metrics = ["GroupMinSize","GroupMaxSize","GroupDesiredCapacity","GroupInServiceInstances","GroupPendingInstances","GroupStandbyInstances","GroupTerminatingInstances","GroupTotalInstances"]

instance_refresh {
strategy = "Rolling"
preferences {
min_healthy_percentage = 50
instance_warmup = 300
}
triggers = ["tag"]
}

dynamic "tag" {
for_each = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
content {
key = tag.key
value = tag.value
propagate_at_launch = true
}
}

lifecycle { create_before_destroy = true }

depends_on = [aws_lb_target_group.http, aws_launch_template.web]
}

resource "aws_autoscaling_policy" "web_scale_up" {
name = "${local.name_prefix}-web-scale-up"
autoscaling_group_name = aws_autoscaling_group.web.name
adjustment_type = "ChangeInCapacity"
scaling_adjustment = 1
cooldown = 300
}

resource "aws_autoscaling_policy" "web_scale_down" {
name = "${local.name_prefix}-web-scale-down"
autoscaling_group_name = aws_autoscaling_group.web.name
adjustment_type = "ChangeInCapacity"
scaling_adjustment = -1
cooldown = 300
}

#######################

# Bastion

#######################

resource "aws_instance" "bastion" {
ami = data.aws_ami.amazon_linux.id
instance_type = "t3.micro"
subnet_id = aws_subnet.public[0].id
vpc_security_group_ids = [aws_security_group.bastion.id]
iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
key_name = var.key_pair_name

root_block_device {
volume_type = "gp3"
volume_size = 10
encrypted = true
kms_key_id = aws_kms_key.main.arn
delete_on_termination = true
}

metadata_options {
http_endpoint = "enabled"
http_tokens = "required"
http_put_response_hop_limit = 1
}

user_data = <<-EOF
#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
EOF

tags = merge(local.common_tags, { Name = "${local.name_prefix}-bastion" })
}

#######################

# Alarms

#######################

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
alarm_name = "${local.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "EC2 CPU high"
  alarm_actions       = [aws_autoscaling_policy.web_scale_up.arn, aws_sns_topic.alerts.arn]
  dimensions = { AutoScalingGroupName = aws_autoscaling_group.web.name }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cpu-high" })
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
alarm_name = "${local.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = { LoadBalancer = aws_lb.main.arn_suffix }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb-5xx-errors" })
}

#######################

# WAF (valid HCL formatting)

#######################

resource "aws_wafv2_web_acl" "main" {
count = var.enable_waf ? 1 : 0
name = "${local.name_prefix}-waf"
description = "WAF web ACL"
scope = "REGIONAL"

default_action {
allow {}
}

rule {
name = "SQLiRule"
priority = 1

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli-rule"
      sampled_requests_enabled   = true
    }

}

rule {
name = "CommonRuleSet"
priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common-rule"
      sampled_requests_enabled   = true
    }

}

rule {
name = "RateLimitRule"
priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit-rule"
      sampled_requests_enabled   = true
    }

}

visibility_config {
cloudwatch_metrics_enabled = true
metric_name = "${local.name_prefix}-waf"
sampled_requests_enabled = true
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-waf" })
}

resource "aws_wafv2_web_acl_association" "main" {
count = var.enable_waf ? 1 : 0
resource_arn = aws_lb.main.arn
web_acl_arn = aws_wafv2_web_acl.main[0].arn
}

#######################

# AWS Config (conditional)

#######################

resource "aws_config_configuration_recorder" "main" {
count = var.manage_config_recorder ? 1 : 0
name = "${local.name_prefix}-recorder"
role_arn = aws_iam_role.config_role.arn

recording_group {
all_supported = true
include_global_resource_types = true
}
}

resource "aws_config_configuration_recorder_status" "main" {
count = var.manage_config_recorder ? 1 : 0
name = aws_config_configuration_recorder.main[0].name
is_enabled = true
}

resource "aws_config_delivery_channel" "main" {
count = var.manage_config_recorder ? 1 : 0
name = "${local.name_prefix}-delivery-channel"
s3_bucket_name = aws_s3_bucket.logs.id
s3_key_prefix = "config"
depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
name = "${local.name_prefix}-encrypted-volumes"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-encrypted-volumes" })
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
name = "${local.name_prefix}-rds-storage-encrypted"
  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-storage-encrypted" })
}

resource "aws_config_config_rule" "restricted_ssh" {
name = "${local.name_prefix}-restricted-ssh"
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-restricted-ssh" })
}

resource "aws_config_config_rule" "root_mfa" {
name = "${local.name_prefix}-root-mfa-enabled"
  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-root-mfa-enabled" })
}

#######################

# Outputs

#######################

output "vpc_id" {
description = "VPC ID"
value = aws_vpc.main.id
}

output "alb_dns_name" {
description = "ALB DNS"
value = aws_lb.main.dns_name
}

output "bastion_public_ip" {
description = "Bastion public IP"
value = aws_instance.bastion.public_ip
}

output "db_endpoint" {
description = "RDS endpoint"
value = aws_db_instance.main.endpoint
sensitive = true
}

output "web_asg_name" {
description = "Web ASG name"
value = aws_autoscaling_group.web.name
}

output "logs_bucket" {
description = "S3 logs bucket"
value = aws_s3_bucket.logs.id
}

---
# tap_stack.tf
# Main infrastructure resources with comprehensive security controls
# Problem ID: security_configuration_as_code_Terraform_HCL_h7js29a0kdr1

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
  region = var.region

  default_tags {
    tags = local.common_tags
  }
}

# Local values for consistent tagging and naming
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "ngwakoleslieelijah"
    CreatedDate = "2025-08-15"
    ProblemID   = "security_configuration_as_code_Terraform_HCL_h7js29a0kdr1"
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

#######################
# Modules
#######################

module "data" {
  source = "./modules/data"

  project_name           = var.project_name
  environment            = var.environment
  app_data_s3_bucket_arn = aws_s3_bucket.app_data.arn
  s3_kms_key_arn         = aws_kms_key.s3_key.arn
  region                 = var.region
}

module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = aws_vpc.main.id
  allowed_cidr_blocks = var.allowed_cidr_blocks
  common_tags         = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name       = var.project_name
  environment        = var.environment
  notification_email = var.notification_email
  asg_name           = aws_autoscaling_group.app.name
  common_tags        = local.common_tags
}

#######################
# VPC and Networking
#######################

# Main VPC with DNS support enabled for RDS
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "networking"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
    Type = "networking"
  })
}

# Public subnets for ALB and NAT Gateways (Multi-AZ)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    Tier = "public"
  })
}

# Private subnets for EC2 instances (Multi-AZ)
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    Tier = "application"
  })
}

# Database subnets for RDS (Multi-AZ)
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "database-subnet"
    Tier = "database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
    Type = "networking"
  })
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
    Type = "networking"
  })
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "networking"
  })
}

# Route tables for private subnets (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    Type = "networking"
  })
}

# Route table for database subnets (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
    Type = "networking"
  })
}

# Route table associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = 2

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

#######################
# KMS Keys for Encryption
#######################

# KMS key for RDS encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
    Type = "encryption"
  })
}

# KMS key alias for RDS
resource "aws_kms_alias" "rds_key" {
  name          = "alias/${local.name_prefix}-rds-key"
  target_key_id = aws_kms_key.rds_key.key_id
}

# KMS key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
    Type = "encryption"
  })
}

# KMS key alias for S3
resource "aws_kms_alias" "s3_key" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms-key"
    Type = "encryption"
  })
}

# KMS key alias for EBS
resource "aws_kms_alias" "ebs_key" {
  name          = "alias/${local.name_prefix}-ebs-key"
  target_key_id = aws_kms_key.ebs_key.key_id
}

#######################
# Application Load Balancer
#######################

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.security.alb_sg_id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "prod" ? var.enable_deletion_protection : false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
    Type = "load-balancer"
  })
}

# Target group for EC2 instances
resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-target-group"
    Type = "load-balancer"
  })
}

# ALB Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-listener"
    Type = "load-balancer"
  })
}

#######################
# IAM Roles and Policies
#######################

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name               = "${local.name_prefix}-ec2-role"
  assume_role_policy = module.data.ec2_assume_role_policy

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
    Type = "iam"
  })
}

# IAM policy for EC2 S3 access
resource "aws_iam_role_policy" "ec2_s3_policy" {
  name   = "${local.name_prefix}-ec2-s3-policy"
  role   = aws_iam_role.ec2_role.id
  policy = module.data.ec2_s3_access_policy
}

# IAM policy for CloudWatch logs
resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name   = "${local.name_prefix}-ec2-cloudwatch-policy"
  role   = aws_iam_role.ec2_role.id
  policy = module.data.cloudwatch_logs_policy
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-instance-profile"
    Type = "iam"
  })
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name               = "${local.name_prefix}-lambda-role"
  assume_role_policy = module.data.lambda_assume_role_policy

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-role"
    Type = "iam"
  })
}

# Attach VPC execution policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

#######################
# EC2 Instances
#######################

# Launch template for EC2 instances with security hardening
resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-app-"
  image_id      = module.data.amazon_linux_ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  vpc_security_group_ids = [module.security.ec2_sg_id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = aws_kms_key.ebs_key.arn
    }
  }

  # User data script with CloudWatch logging
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = module.monitoring.ec2_log_group_name
    region         = var.region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-instance"
      Type = "compute"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-volume"
      Type = "storage"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-launch-template"
    Type = "compute"
  })
}

# Auto Scaling Group for high availability
resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-app-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"

  min_size         = 1
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app-asg-instance"
    propagate_at_launch = true
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

#######################
# RDS Database
#######################

# DB subnet group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
    Type = "database"
  })
}

# RDS instance with encryption and Multi-AZ
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-database"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.environment == "prod" ? "db.t3.medium" : "db.t3.micro"

  allocated_storage     = var.environment == "prod" ? 100 : 20
  max_allocated_storage = var.environment == "prod" ? 1000 : 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_key.arn

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [module.security.rds_sg_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  multi_az            = var.environment == "prod" ? true : false
  publicly_accessible = false
  deletion_protection = var.environment == "prod" ? var.enable_deletion_protection : false

  skip_final_snapshot       = var.environment == "staging" ? true : false
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
    Type = "database"
  })
}

#######################
# S3 Buckets
#######################

# S3 bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket = "${local.name_prefix}-app-data-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-data-bucket"
    Type = "storage"
  })
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-logs-bucket"
    Type = "storage"
  })
}

# Random string for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_key.arn
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for ALB logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  policy = data.aws_iam_policy_document.alb_logs_s3_policy.json
}

data "aws_iam_policy_document" "alb_logs_s3_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_elb_service_account.main.id}:root"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.alb_logs.arn}/alb-logs/*"]
  }
}

data "aws_elb_service_account" "main" {}

---
# vars.tf
########################
# Variables
########################

variable "region" {
  description = "AWS region for deployment (us-east-1 or eu-west-1)"
  type        = string

  validation {
    condition     = contains(["us-east-1", "eu-west-1"], var.region)
    error_message = "Region must be either 'us-east-1' or 'eu-west-1'."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming convention"
  type        = string
  default     = "secure-infra"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (prod or staging) for resource tagging and configuration"
  type        = string

  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be either 'prod' or 'staging'."
  }
}

# VPC CIDR with enhanced validation
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB (specific IP ranges, never 0.0.0.0/0)"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

  validation {
    condition = alltrue([
      for cidr in var.allowed_cidr_blocks : !contains(["0.0.0.0/0"], cidr)
    ])
    error_message = "CIDR blocks must not include 0.0.0.0/0 for security compliance."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"

  validation {
    condition = contains([
      "t3.micro", "t3.small", "t3.medium", "t3.large",
      "m5.large", "m5.xlarge", "c5.large", "c5.xlarge"
    ], var.instance_type)
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 12
    error_message = "Database password must be at least 12 characters long."
  }
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for SSH access"
  type        = string
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_period >= 7 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 7 and 35 days."
  }
}

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instances in production"
  type        = bool
  default     = true
}

---
# outputs.tf
# Outputs for the secure infrastructure module

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS database instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_data_s3_bucket_name" {
  description = "Name of the S3 bucket for application data"
  value       = aws_s3_bucket.app_data.bucket
}

output "alb_logs_s3_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances in the Auto Scaling group"
  value       = aws_autoscaling_group.app.instances
}

---
# provider.tf
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
  region = var.region

  default_tags {
    tags = local.common_tags
  }
}

---
# terraform.tfvars
# terraform.tfvars
# Example variables for the secure infrastructure module

project_name = "secure-infra"
environment  = "staging"
region       = "us-east-1"

allowed_cidr_blocks = ["10.0.0.0/8"]

db_username = "dbadmin"
db_password = "your-secure-password"

instance_type = "t3.micro"
key_pair_name = "your-key-pair-name"

notification_email = "your-email@example.com"

---
# user_data.sh
#!/bin/bash
# User data script for EC2 instances with security hardening

# Log all output to CloudWatch Logs
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update the system
yum update -y

# Install and configure the CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/bin/config.json
{
  "agent": {
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s

# Install a simple web server
yum install -y httpd
echo "<h1>Hello from Terraform</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
systemctl start httpd
systemctl enable httpd

---
# modules/data/data.tf
# data.tf
# Data sources for dynamic infrastructure values
# Security-focused data source definitions

# Get current AWS account information
data "aws_caller_identity" "current" {}

# Get current AWS region information
data "aws_region" "current" {}

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get latest Amazon Linux 2 AMI (trusted source)
data "aws_ami" "amazon_linux" {
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
    name   = "state"
    values = ["available"]
  }
}

# Get latest Ubuntu LTS AMI (trusted source)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# Get current partition for ARN construction
data "aws_partition" "current" {}

# IAM policy document for EC2 instance role
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    effect = "Allow"
  }
}

# IAM policy document for Lambda execution role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    effect = "Allow"
  }
}

# IAM policy document for S3 access from EC2
data "aws_iam_policy_document" "ec2_s3_access" {
  statement {
    sid    = "AllowS3Access"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]

    resources = [
      var.app_data_s3_bucket_arn,
      "${var.app_data_s3_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "AllowKMSAccess"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [var.s3_kms_key_arn]
  }
}

# IAM policy document for CloudWatch logs access
data "aws_iam_policy_document" "cloudwatch_logs_policy" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
      "logs:DescribeLogGroups"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*",
      "arn:${data.aws_partition.current.partition}:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
    ]
  }
}

---
# modules/data/outputs.tf
output "amazon_linux_ami_id" {
  description = "ID of the latest Amazon Linux 2 AMI"
  value       = data.aws_ami.amazon_linux.id
}

output "ubuntu_ami_id" {
  description = "ID of the latest Ubuntu LTS AMI"
  value       = data.aws_ami.ubuntu.id
}

output "ec2_assume_role_policy" {
  description = "IAM policy document for EC2 assume role"
  value       = data.aws_iam_policy_document.ec2_assume_role.json
}

output "lambda_assume_role_policy" {
  description = "IAM policy document for Lambda assume role"
  value       = data.aws_iam_policy_document.lambda_assume_role.json
}

output "ec2_s3_access_policy" {
  description = "IAM policy document for S3 access from EC2"
  value       = data.aws_iam_policy_document.ec2_s3_access.json
}

output "cloudwatch_logs_policy" {
  description = "IAM policy document for CloudWatch logs access"
  value       = data.aws_iam_policy_document.cloudwatch_logs_policy.json
}

---
# modules/data/vars.tf
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_data_s3_bucket_arn" {
  description = "ARN of the app data S3 bucket"
  type        = string
}

variable "s3_kms_key_arn" {
  description = "ARN of the S3 KMS key"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

---
# modules/monitoring/monitoring.tf
# monitoring.tf
# CloudWatch and SNS configurations for monitoring and alerting

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# SNS topic for alarm notifications
resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-alarms-topic"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-alarms-topic"
    Type = "monitoring"
  })
}

# SNS topic subscription for email notifications
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch log group for EC2 instances
resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-ec2-log-group"
    Type = "monitoring"
  })
}

# CloudWatch alarm for high CPU utilization on EC2 instances
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${local.name_prefix}-ec2-high-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = var.asg_name
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-ec2-cpu-alarm"
    Type = "monitoring"
  })
}

---
# modules/monitoring/outputs.tf
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "ec2_log_group_name" {
  description = "Name of the CloudWatch log group for EC2 instances"
  value       = aws_cloudwatch_log_group.ec2_logs.name
}

---
# modules/monitoring/vars.tf
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "asg_name" {
  description = "Name of the Auto Scaling group to monitor"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

---
# modules/security/security.tf
# security.tf
# Security groups and IAM policies for the secure infrastructure

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Security group for the Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for the ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "Allow HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
    Type = "security"
  })
}

# Security group for the EC2 instances
resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for the EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow HTTP from the ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
    Type = "security"
  })
}

# Security group for the RDS database
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for the RDS database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow MySQL from the EC2 instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
    Type = "security"
  })
}

---
# modules/security/outputs.tf
output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_sg_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_sg_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

---
# modules/security/vars.tf
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
