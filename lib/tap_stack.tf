# /lib/tap_stack.tf

# ------------------------------------------------------------------------------
# VARIABLES
# ------------------------------------------------------------------------------

variable "db_username" {
  description = "Username for the RDS PostgreSQL database."
  type        = string
  default     = "novaadmin"
}

variable "ssh_key_name" {
  description = "The name of the EC2 Key Pair to allow SSH access to instances."
  type        = string
  default     = "nova-key-291295"
}

variable "allowed_ssh_cidr" {
  description = "The CIDR block allowed to SSH into the EC2 instances. Should be your IP."
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Not recommended for production. Replace with your IP address.
}

variable "domain_name" {
  description = "The domain name to use for Route 53."
  type        = string
  default     = "novaproject-291295.example.com"
}

# ------------------------------------------------------------------------------
# LOCALS
# ------------------------------------------------------------------------------

locals {
  # Common tags applied to all resources for consistency and cost tracking.
  common_tags = {
    Project     = "IaC - AWS Nova Model Breaking"
    Environment = "Production"
    Owner       = "DevOps-Team"
    ManagedBy   = "terraform"
    Suffix      = "291295"
  }
}

# ------------------------------------------------------------------------------
# GLOBAL & SHARED RESOURCES
# ------------------------------------------------------------------------------

# Generates a secure, random password for the RDS database.
# This removes the need for manual input during bootstrap.
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# PRIMARY REGION (us-east-1) RESOURCES
# ------------------------------------------------------------------------------

# --- Networking ---

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "vpc-primary-291295" })
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "subnet-public-primary-${count.index + 1}-291295"
  })
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.1.${count.index + 101}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  tags = merge(local.common_tags, {
    Name = "subnet-private-primary-${count.index + 1}-291295"
  })
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  tags     = merge(local.common_tags, { Name = "igw-primary-291295" })
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  tags = merge(local.common_tags, { Name = "rt-public-primary-291295" })
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# --- Security ---

resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "sg-alb-primary-291295"
  description = "Allow HTTP/HTTPS inbound traffic to ALB"
  vpc_id      = aws_vpc.primary.id

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
  tags = merge(local.common_tags, { Name = "sg-alb-primary-291295" })
}

resource "aws_security_group" "primary_ec2" {
  provider    = aws.primary
  name        = "sg-ec2-primary-291295"
  description = "Allow web and SSH traffic"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
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
  tags = merge(local.common_tags, { Name = "sg-ec2-primary-291295" })
}

resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "sg-rds-primary-291295"
  description = "Allow PostgreSQL traffic from EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }
  tags = merge(local.common_tags, { Name = "sg-rds-primary-291295" })
}

# --- IAM Roles and Policies ---

resource "aws_iam_role" "ec2_role" {
  name = "iam-role-ec2-nova-291295"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "iam-policy-ec2-nova-291295"
  description = "Policy for EC2 instances to access S3 and CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = ["s3:GetObject", "s3:PutObject"],
        Effect   = "Allow",
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"],
        Effect   = "Allow",
        Resource = "${aws_cloudwatch_log_group.app_logs.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "iam-instance-profile-ec2-nova-291295"
  role = aws_iam_role.ec2_role.name
}

# --- Compute (EC2 Auto Scaling Group & ELB) ---

data "aws_ami" "amazon_linux_2" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "primary_app" {
  provider      = aws.primary
  name_prefix   = "lt-app-primary-291295-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t2.micro"
  key_name      = var.ssh_key_name

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 10
      encrypted   = true
    }
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Deployed in us-east-1 (291295)</h1>" > /var/www/html/index.html
    EOF
  )

  tags = merge(local.common_tags, { Name = "lt-app-primary-291295" })
}

resource "aws_autoscaling_group" "primary_app" {
  provider            = aws.primary
  name                = "asg-app-primary-291295"
  desired_capacity    = 2
  max_size            = 3
  min_size            = 1
  vpc_zone_identifier = [for subnet in aws_subnet.primary_public : subnet.id]

  launch_template {
    id      = aws_launch_template.primary_app.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.primary_app.arn]
  health_check_type = "ELB"

  tag {
    key                 = "Name"
    value               = "ec2-app-primary-291295"
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

resource "aws_lb" "primary_app" {
  provider                   = aws.primary
  name                       = "alb-app-primary-291295"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.primary_alb.id]
  subnets                    = [for subnet in aws_subnet.primary_public : subnet.id]
  enable_deletion_protection = false
  tags                       = merge(local.common_tags, { Name = "alb-app-primary-291295" })
}

resource "aws_lb_target_group" "primary_app" {
  provider = aws.primary
  name     = "tg-app-primary-291295"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id
  health_check {
    path = "/"
  }
  tags = merge(local.common_tags, { Name = "tg-app-primary-291295" })
}

resource "aws_lb_listener" "primary_app_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary_app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_app.arn
  }
}

# --- Database (RDS) ---

resource "aws_db_subnet_group" "primary_rds" {
  provider   = aws.primary
  name       = "sng-rds-primary-291295"
  subnet_ids = [for subnet in aws_subnet.primary_private : subnet.id]
  tags       = merge(local.common_tags, { Name = "sng-rds-primary-291295" })
}

resource "aws_db_instance" "primary_db" {
  provider                = aws.primary
  identifier              = "rds-postgres-primary-db-291295"
  allocated_storage       = 20
  engine                  = "postgres"
  engine_version          = "14.5"
  instance_class          = "db.t3.micro"
  username                = var.db_username
  password                = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.primary_rds.name
  vpc_security_group_ids  = [aws_security_group.primary_rds.id]
  multi_az                = true
  backup_retention_period = 7
  skip_final_snapshot     = true
  publicly_accessible     = false
  tags                    = merge(local.common_tags, { Name = "rds-postgres-primary-db-291295" })
}

# ------------------------------------------------------------------------------
# SECONDARY REGION (us-west-2) RESOURCES
# ------------------------------------------------------------------------------

# --- Networking ---

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "vpc-secondary-291295" })
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.2.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "subnet-public-secondary-${count.index + 1}-291295"
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags     = merge(local.common_tags, { Name = "igw-secondary-291295" })
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  tags = merge(local.common_tags, { Name = "rt-public-secondary-291295" })
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# --- Security ---

resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "sg-alb-secondary-291295"
  description = "Allow HTTP/HTTPS inbound traffic to ALB"
  vpc_id      = aws_vpc.secondary.id

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
  tags = merge(local.common_tags, { Name = "sg-alb-secondary-291295" })
}

resource "aws_security_group" "secondary_ec2" {
  provider    = aws.secondary
  name        = "sg-ec2-secondary-291295"
  description = "Allow web and SSH traffic"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
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
  tags = merge(local.common_tags, { Name = "sg-ec2-secondary-291295" })
}

# --- Compute (EC2 Auto Scaling Group & ELB) ---

data "aws_ami" "amazon_linux_2_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "secondary_app" {
  provider      = aws.secondary
  name_prefix   = "lt-app-secondary-291295-"
  image_id      = data.aws_ami.amazon_linux_2_secondary.id
  instance_type = "t2.micro"
  key_name      = var.ssh_key_name

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 10
      encrypted   = true
    }
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Deployed in us-west-2 (291295)</h1>" > /var/www/html/index.html
    EOF
  )

  tags = merge(local.common_tags, { Name = "lt-app-secondary-291295" })
}

resource "aws_autoscaling_group" "secondary_app" {
  provider            = aws.secondary
  name                = "asg-app-secondary-291295"
  desired_capacity    = 2
  max_size            = 3
  min_size            = 1
  vpc_zone_identifier = [for subnet in aws_subnet.secondary_public : subnet.id]

  launch_template {
    id      = aws_launch_template.secondary_app.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.secondary_app.arn]
  health_check_type = "ELB"

  tag {
    key                 = "Name"
    value               = "ec2-app-secondary-291295"
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

resource "aws_lb" "secondary_app" {
  provider                   = aws.secondary
  name                       = "alb-app-secondary-291295"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.secondary_alb.id]
  subnets                    = [for subnet in aws_subnet.secondary_public : subnet.id]
  enable_deletion_protection = false
  tags                       = merge(local.common_tags, { Name = "alb-app-secondary-291295" })
}

resource "aws_lb_target_group" "secondary_app" {
  provider = aws.secondary
  name     = "tg-app-secondary-291295"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id
  health_check {
    path = "/"
  }
  tags = merge(local.common_tags, { Name = "tg-app-secondary-291295" })
}

resource "aws_lb_listener" "secondary_app_http" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary_app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_app.arn
  }
}

# ------------------------------------------------------------------------------
# CROSS-REGION RESOURCES (Peering & DNS)
# ------------------------------------------------------------------------------

resource "aws_vpc_peering_connection" "peer" {
  provider      = aws.primary
  peer_owner_id = data.aws_caller_identity.current.account_id
  peer_vpc_id   = aws_vpc.secondary.id
  vpc_id        = aws_vpc.primary.id
  peer_region   = "us-west-2"
  auto_accept   = true
  tags          = merge(local.common_tags, { Name = "vpc-peering-primary-to-secondary-291295" })
}

resource "aws_route53_zone" "main" {
  name = var.domain_name
  tags = local.common_tags
}

resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.primary_app.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags              = merge(local.common_tags, { Name = "hc-primary-alb-291295" })
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = aws_lb.secondary_app.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags              = merge(local.common_tags, { Name = "hc-secondary-alb-291295" })
}

resource "aws_route53_record" "failover" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary-alb-failover-291295"
  health_check_id = aws_route53_health_check.primary.id
  alias {
    name                   = aws_lb.primary_app.dns_name
    zone_id                = aws_lb.primary_app.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "failover_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "secondary-alb-failover-291295"
  health_check_id = aws_route53_health_check.secondary.id
  alias {
    name                   = aws_lb.secondary_app.dns_name
    zone_id                = aws_lb.secondary_app.zone_id
    evaluate_target_health = true
  }
}

# ------------------------------------------------------------------------------
# GLOBAL & MONITORING RESOURCES
# ------------------------------------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket = "iac-nova-model-artifacts-${data.aws_caller_identity.current.account_id}-291295"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "artifacts_versioning" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts_encryption" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts_access_block" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudwatch_log_group" "app_logs" {
  provider          = aws.primary
  name              = "/app/nova-project-logs-291295"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.primary
  alarm_name          = "alarm-primary-cpu-utilization-high-291295"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary_app.name
  }
}

# ------------------------------------------------------------------------------
# COST OPTIMIZATION LAMBDA
# ------------------------------------------------------------------------------

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_code = <<-EOT
import boto3
import os

def lambda_handler(event, context):
    region = os.environ['AWS_REGION']
    ec2 = boto3.client('ec2', region_name=region)
    # Example: Stop EC2 instances with a specific tag
    print("Checking for non-essential EC2 instances to stop...")
    # This logic is illustrative.
    return { 'statusCode': 200, 'body': 'Cost optimization check complete.' }
EOT
  output_path = "cost_saver_lambda.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "iam-role-lambda-cost-saver-291295"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "iam-policy-lambda-cost-saver-291295"
  description = "Policy for Lambda to stop EC2/RDS instances"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action   = ["ec2:StopInstances", "ec2:DescribeInstances"],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_lambda_function" "cost_saver" {
  provider         = aws.primary
  function_name    = "lambda-cost-saver-nova-291295"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.9"
  tags             = local.common_tags
}

resource "aws_cloudwatch_event_rule" "daily_shutdown" {
  provider            = aws.primary
  name                = "rule-daily-resource-shutdown-291295"
  schedule_expression = "cron(0 0 * * ? *)"
  tags                = local.common_tags
}

resource "aws_cloudwatch_event_target" "invoke_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.daily_shutdown.name
  target_id = "target-invoke-cost-saver-lambda-291295"
  arn       = aws_lambda_function.cost_saver.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_saver.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_shutdown.arn
}

# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------

output "primary_alb_dns" {
  description = "DNS name of the Application Load Balancer in the primary region."
  value       = aws_lb.primary_app.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the Application Load Balancer in the secondary region."
  value       = aws_lb.secondary_app.dns_name
}

output "rds_endpoint" {
  description = "Endpoint of the PostgreSQL RDS instance."
  value       = aws_db_instance.primary_db.endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for artifacts."
  value       = aws_s3_bucket.artifacts.id
}

output "application_url" {
  description = "The Route 53 URL for the application."
  value       = "http://app.${var.domain_name}"
}
