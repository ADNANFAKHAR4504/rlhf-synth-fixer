terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket-us-west-2"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws    = { source = "hashicorp/aws",    version = "~> 4.0" }
    random = { source = "hashicorp/random", version = ">= 3.0" }
  }
}

### Variables
variable "allowed_cidrs" {
  description = "CIDR blocks allowed to access RDS"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}
variable "min_size" { description = "Minimum ASG size"; type = number; default = 2 }
variable "max_size" { description = "Maximum ASG size"; type = number; default = 5 }

### Locals
locals {
  common_tags = {
    Environment = "Production"
    Owner       = "DevOpsTeam"
    Project     = "WebApp"
  }
  azs = ["us-west-2a", "us-west-2b"]
}

### Provider improvements
provider "aws" {
  region = "us-west-2"

  # ✅ Added: centralized default_tags to avoid per-resource duplication
  default_tags {
    tags = local.common_tags
  }
}

### Random provider must be declared for random_id
provider "random" {}

### VPC and Subnets
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # ✅ Added default_tags on provider, so no need to tag here manually
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = local.azs[count.index]
  tags = {
    Name = "public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 2)
  availability_zone = local.azs[count.index]
  tags = {
    Name = "private-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
}

### ✅ Added NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count = length(local.azs)
  vpc   = true
}

resource "aws_nat_gateway" "nat" {
  count         = length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = {
    Name = "nat-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_route_table_association" "public" {
  count = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count = length(local.azs)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
}

resource "aws_route_table_association" "private" {
  count = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

### IAM Roles (unchanged except comments added)
resource "aws_iam_role" "ec2" {
  name = "ec2-app-role"
  assume_role_policy = <<EOF
{
  "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]
}
EOF
}

resource "aws_iam_policy" "ec2_policy" {
  name   = "ec2-policy"
  policy = file("ec2-policy.json")
}

resource "aws_iam_role_policy_attachment" "ec2_attach" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_role" "rds" {
  name = "rds-s3-access-role"
  assume_role_policy = <<EOF
{
  "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"rds.amazonaws.com"},"Action":"sts:AssumeRole"}]
}
EOF
}

resource "aws_iam_policy" "rds_policy" {
  name   = "rds-policy"
  policy = file("rds-policy.json")
}

resource "aws_iam_role_policy_attachment" "rds_attach" {
  role       = aws_iam_role.rds.name
  policy_arn = aws_iam_policy.rds_policy.arn
}

### RDS Security Group
resource "aws_security_group" "rds" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
}

### ✅ Added RDS Subnet Group for private subnets
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-prod"
  subnet_ids = aws_subnet.private[*].id
  description = "Subnet group for production RDS"
}

### ✅ RDS Parameter Group to enforce in-transit TLS (MySQL)
resource "aws_db_parameter_group" "tls" {
  name        = "mysql-tls-param"
  family      = "mysql8.0"
  description = "MySQL TLS-required settings"
  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }
}

resource "aws_db_instance" "main" {
  engine                    = "mysql"
  instance_class            = var.db_instance_class
  multi_az                  = true
  storage_encrypted         = true
  vpc_security_group_ids    = [aws_security_group.rds.id]
  db_subnet_group_name      = aws_db_subnet_group.main.name
  parameter_group_name      = aws_db_parameter_group.tls.name
  publicly_accessible       = false
  tags                      = local.common_tags
}

### S3 – App Data and Logs
resource "random_id" "bucket" {
  byte_length = 4
}

resource "aws_s3_bucket" "logs" {
  bucket = "app-logs-${random_id.bucket.hex}"
  acl    = "log-delivery-write"
  # ✅ Added versioning for safety
  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "app_data" {
  bucket = "app-data-${random_id.bucket.hex}"
  logging {
    target_bucket = aws_s3_bucket.logs.bucket
    target_prefix = "app-data/"
  }
}

### ✅ Added S3 Bucket Policy for ALB access logs (ELB account principal)
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "elb_log_policy" {
  statement {
    actions = ["s3:GetBucketAcl"]
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    resources = [aws_s3_bucket.logs.arn]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
  statement {
    actions = ["s3:PutObject"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${lookup(data.aws_caller_identity.current, "account_id")}:root",
                     "delivery.logs.amazonaws.com"]
    }
    resources = ["${aws_s3_bucket.logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "elb_logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.elb_log_policy.json
}

### ALB + ASG + Compute

resource "aws_security_group" "alb" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "app-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
  enable_deletion_protection = true
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb"
    enabled = true
  }
}

resource "aws_lb_target_group" "main" {
  name        = "app-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"
  health_check {
    path = "/"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

### ✅ Updated to use launch_template (replace launch_configuration)
resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-"
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  network_interfaces {
    security_groups = [aws_security_group.ec2.id]
    associate_public_ip_address = false
  }
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }
  tag_specifications {
    resource_type = "instance"
    tags = { Name = "app-instance" }
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix         = "app-asg"
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.min_size
  vpc_zone_identifier = aws_subnet.private[*].id     # 🧭 FIX: now references subnet IDs
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  tags = [
    {
      key                 = "Name"
      value               = "app-instance"
      propagate_at_launch = true
    }
  ]
}

resource "aws_security_group" "ec2" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]

