variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-west-2", "eu-west-1"], var.aws_region)
    error_message = "Region must be one of: us-east-1, us-west-2, eu-west-1."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "payment-processor"
}

variable "service_name" {
  description = "Service name component for resource naming"
  type        = string
  default     = "tap"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "database_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100

  validation {
    condition     = var.database_allocated_storage >= 20 && var.database_allocated_storage <= 65536
    error_message = "Allocated storage must be between 20 and 65536 GB."
  }
}

variable "database_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.8"
}

variable "database_name" {
  description = "Initial database name"
  type        = string
  default     = "paymentdb"
}

variable "database_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
}

variable "database_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
  default     = ""
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

variable "compute_instance_type" {
  description = "EC2 instance type for compute layer"
  type        = string
  default     = "t3.medium"
}

variable "compute_desired_capacity" {
  description = "Desired number of EC2 instances"
  type        = number
  default     = 2

  validation {
    condition     = var.compute_desired_capacity > 0 && var.compute_desired_capacity <= 10
    error_message = "Desired capacity must be between 1 and 10."
  }
}

variable "storage_buckets" {
  description = "Map of S3 bucket configurations"
  type = map(object({
    versioning_enabled = bool
    encryption_enabled = bool
    lifecycle_rules = optional(list(object({
      id              = string
      enabled         = bool
      prefix          = optional(string)
      expiration_days = optional(number)
    })), [])
  }))
  default = {
    transactions = {
      versioning_enabled = true
      encryption_enabled = true
      lifecycle_rules    = []
    }
    logs = {
      versioning_enabled = false
      encryption_enabled = true
      lifecycle_rules = [{
        id              = "expire-old-logs"
        enabled         = true
        prefix          = "logs/"
        expiration_days = 30
      }]
    }
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

locals {
  environment = terraform.workspace
  region      = var.aws_region

  name_prefix   = "${local.environment}-${local.region}-${var.service_name}"
  random_suffix = random_id.suffix.hex

  database_password = var.database_password != "" ? var.database_password : random_password.db_password.result

  common_tags = {
    Environment = terraform.workspace
    Project     = var.project_name
    Service     = var.service_name
    ManagedBy   = "Terraform"
  }

  availability_zones = length(var.availability_zones) > 0 ? var.availability_zones : data.aws_availability_zones.available.names

  # Environment-specific configurations: dev, staging, prod
  compute_instance_type_map = {
    dev     = "t3.small"
    staging = "t3.medium"
    prod    = "m5.large"
  }

  compute_capacity_map = {
    dev     = 2
    staging = 3
    prod    = 5
  }

  database_instance_class_map = {
    dev     = "db.t3.small"
    staging = "db.t3.medium"
    prod    = "db.r5.large"
  }

  selected_instance_type = lookup(local.compute_instance_type_map, local.environment, var.compute_instance_type)
  selected_capacity      = lookup(local.compute_capacity_map, local.environment, var.compute_desired_capacity)
  selected_db_class      = lookup(local.database_instance_class_map, local.environment, var.database_instance_class)
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "public" {
  for_each = {
    for idx, az in slice(local.availability_zones, 0, 2) : az => {
      az  = az
      idx = idx
    }
  }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, each.value.idx)
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${replace(each.value.az, "-", "")}"
    Type = "Public"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "private" {
  for_each = {
    for idx, az in slice(local.availability_zones, 0, 2) : az => {
      az  = az
      idx = idx + 10
    }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, each.value.idx)
  availability_zone = each.value.az

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${replace(each.value.az, "-", "")}"
    Type = "Private"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "database" {
  for_each = {
    for idx, az in slice(local.availability_zones, 0, 2) : az => {
      az  = az
      idx = idx + 20
    }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, each.value.idx)
  availability_zone = each.value.az

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${replace(each.value.az, "-", "")}"
    Type = "Database"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_eip" "nat" {
  for_each = var.enable_nat_gateway ? aws_subnet.public : {}

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${replace(each.key, "-", "")}"
  })

  depends_on = [aws_internet_gateway.main]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_nat_gateway" "main" {
  for_each = var.enable_nat_gateway ? aws_subnet.public : {}

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${replace(each.key, "-", "")}"
  })

  depends_on = [aws_internet_gateway.main]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table" "private" {
  for_each = aws_subnet.private

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[each.key].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${replace(each.key, "-", "")}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

resource "aws_route_table_association" "database" {
  for_each = aws_subnet.database

  subnet_id      = each.value.id
  route_table_id = aws_route_table.database.id
}

resource "aws_security_group" "compute" {
  name        = "${local.name_prefix}-compute-sg"
  description = "Security group for compute layer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from load balancer"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  ingress {
    description = "HTTPS from load balancer"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-compute-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-database-sg"
  description = "Security group for database layer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from compute"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.compute.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "storage" {
  name        = "${local.name_prefix}-storage-sg"
  description = "Security group for storage access"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-storage-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_kms_key" "database" {
  description             = "KMS key for RDS database encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-kms"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_kms_alias" "database" {
  name          = "alias/${local.name_prefix}-database"
  target_key_id = aws_kms_key.database.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [for subnet in aws_subnet.database : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "main" {
  identifier              = "${local.name_prefix}-database"
  engine                  = "postgres"
  engine_version          = var.database_engine_version
  instance_class          = local.selected_db_class
  allocated_storage       = var.database_allocated_storage
  storage_type            = "gp3"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.database.arn
  db_name                 = var.database_name
  username                = var.database_username
  password                = local.database_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.database.id]
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  multi_az                = local.environment == "prod" ? true : false
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })

  lifecycle {
    create_before_destroy = true
    ignore_changes = [
      password
    ]
  }
}

resource "aws_s3_bucket" "storage" {
  for_each = var.storage_buckets

  bucket = "${local.name_prefix}-${each.key}-${local.random_suffix}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  for_each = { for k, v in var.storage_buckets : k => v if v.versioning_enabled }

  bucket = aws_s3_bucket.storage[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  for_each = { for k, v in var.storage_buckets : k => v if v.encryption_enabled }

  bucket = aws_s3_bucket.storage[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  for_each = {
    for k, v in var.storage_buckets : k => v
    if length(v.lifecycle_rules) > 0
  }

  bucket = aws_s3_bucket.storage[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "filter" {
        for_each = rule.value.prefix != null ? [1] : []
        content {
          prefix = rule.value.prefix
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.storage]
}

resource "aws_s3_bucket_public_access_block" "storage" {
  for_each = aws_s3_bucket.storage

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_launch_template" "compute" {
  name_prefix   = "${local.name_prefix}-compute-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.selected_instance_type

  vpc_security_group_ids = [aws_security_group.compute.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-compute"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

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
}

resource "aws_autoscaling_group" "compute" {
  name                = "${local.name_prefix}-compute-asg"
  vpc_zone_identifier = [for subnet in aws_subnet.private : subnet.id]
  min_size            = 1
  max_size            = 10
  desired_capacity    = local.selected_capacity
  health_check_type   = "EC2"

  launch_template {
    id      = aws_launch_template.compute.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-compute"
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

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/${local.name_prefix}-${local.random_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-logs"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${local.name_prefix}-vpc-flow-logs-role-${local.random_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${local.name_prefix}-vpc-flow-logs-policy-${local.random_suffix}"
  role  = aws_iam_role.vpc_flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "vpc" {
  count                = var.enable_flow_logs ? 1 : 0
  iam_role_arn         = aws_iam_role.vpc_flow_logs[0].arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log"
  })

  lifecycle {
    create_before_destroy = true
  }
}


output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = [for subnet in aws_subnet.database : subnet.id]
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "storage_bucket_names" {
  description = "S3 bucket names"
  value       = { for k, v in aws_s3_bucket.storage : k => v.id }
}

output "storage_bucket_arns" {
  description = "S3 bucket ARNs"
  value       = { for k, v in aws_s3_bucket.storage : k => v.arn }
}

output "compute_security_group_id" {
  description = "Compute security group ID"
  value       = aws_security_group.compute.id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.compute.name
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    database = aws_kms_key.database.id
    s3       = aws_kms_key.s3.id
  }
}

output "environment" {
  description = "Current workspace environment"
  value       = local.environment
}

output "region" {
  description = "AWS region"
  value       = local.region
}

