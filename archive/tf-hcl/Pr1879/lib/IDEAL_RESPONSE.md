# IDEAL_RESPONSE.md

## Purpose

This document provides the ideal, validated representation of all Terraform code files found in the `lib/` folder of this repository. Each code file is shown in its own section, with its filename as the header and its contents in a properly formatted code block. This ensures clarity, traceability, and compliance with validation requirements.

## Structure

- Each section below corresponds to a code file in `lib/`.
- The code for each file is shown in a fenced code block, using the correct language identifier (e.g., `hcl` for Terraform).
- This format allows reviewers and automation to easily verify that every code file in `lib/` is represented here.

---

## `provider.tf`
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

## `tap_stack.tf`
```hcl
########################
# CloudWatch Alarms, Scaling Policies, and SNS Notifications
########################

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "admin@example.com"
}

resource "aws_sns_topic" "scaling_notifications" {
  name = "ha-web-app-scaling-notifications-${var.environment}"
  tags = {
    Name        = "ha-web-app-scaling-notifications-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.scaling_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "ha-web-app-scale-up-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_servers.name
  policy_type            = "SimpleScaling"
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "ha-web-app-scale-down-${var.environment}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_servers.name
  policy_type            = "SimpleScaling"
}

resource "aws_autoscaling_notification" "scaling_notifications" {
  group_names   = [aws_autoscaling_group.web_servers.name]
  notifications = [
    "autoscaling:EC2_INSTANCE_LAUNCH",
    "autoscaling:EC2_INSTANCE_TERMINATE",
    "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
    "autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
  ]
  topic_arn     = aws_sns_topic.scaling_notifications.arn
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "ha-web-app-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_servers.name
  }
  tags = {
    Name        = "ha-web-app-cpu-high-alarm-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "ha-web-app-cpu-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_servers.name
  }
  tags = {
    Name        = "ha-web-app-cpu-low-alarm-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "target_health" {
  alarm_name          = "ha-web-app-target-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors healthy target count"
  alarm_actions       = [aws_sns_topic.scaling_notifications.arn]
  dimensions = {
    TargetGroup  = aws_lb_target_group.web_servers.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  tags = {
    Name        = "ha-web-app-target-health-alarm-${var.environment}"
    Environment = var.environment
  }
}

# Outputs for SNS and alarms
output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.scaling_notifications.arn
}
########################
# Launch Template, Auto Scaling Group, and Load Balancer
########################

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for SSH access"
  type        = string
  default     = "prod-bastion-key-acd1"
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

resource "aws_launch_template" "web_server" {
  name_prefix   = "ha-web-app-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  key_name      = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.web_servers.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Web Server $(hostname -f)</h1>" > /var/www/html/index.html
              echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
              echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
              echo "<p>Health Status: OK</p>" >> /var/www/html/index.html
              echo "OK" > /var/www/html/health
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "ha-web-app-server-${var.environment}"
      Environment = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb" "main" {
  name               = "ha-web-app-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.elb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  enable_deletion_protection = false
  tags = {
    Name        = "ha-web-app-alb-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "web_servers" {
  name     = "ha-web-app-tg-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  tags = {
    Name        = "ha-web-app-tg-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_servers.arn
  }
}

resource "aws_autoscaling_group" "web_servers" {
  name                = "ha-web-app-asg-${var.environment}"
  vpc_zone_identifier = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  target_group_arns   = [aws_lb_target_group.web_servers.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 120
  min_size         = 2
  max_size         = 6
  desired_capacity = 2
  launch_template {
    id      = aws_launch_template.web_server.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "ha-web-app-asg-instance-${var.environment}"
    propagate_at_launch = true
  }
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Outputs for ALB and ASG
output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web_servers.name
}
########################
# Security Groups
########################

# ELB Security Group - allows HTTP/HTTPS from anywhere
resource "aws_security_group" "elb" {
  name        = "ha-web-app-elb-sg-${var.environment}"
  description = "Security group for Elastic Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ha-web-app-elb-sg-${var.environment}"
    Environment = var.environment
  }
}

# EC2 Security Group - only allows traffic from ELB
resource "aws_security_group" "web_servers" {
  name        = "ha-web-app-servers-sg-${var.environment}"
  description = "Security group for web servers - only accessible through ELB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ELB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.elb.id]
  }

  # No SSH access from anywhere or VPC (addresses MODEL_FAILURE)

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ha-web-app-servers-sg-${var.environment}"
    Environment = var.environment
  }
}

# Outputs for security group IDs
output "elb_security_group_id" {
  description = "ID of the ELB security group"
  value       = aws_security_group.elb.id
}

output "web_servers_security_group_id" {
  description = "ID of the web servers security group"
  value       = aws_security_group.web_servers.id
}
########################
# VPC and Subnets (High Availability)
########################

data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = ["us-west-2"]
  }
}

locals {
  azs = length(data.aws_availability_zones.available.names) >= 2 ? data.aws_availability_zones.available.names : ["us-east-1a", "us-east-1b"]
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "ha-web-app-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ha-web-app-igw-${var.environment}"
  }
}

# Public subnets in two AZs
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = local.azs[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "ha-web-app-public-subnet-1-${var.environment}"
    Type = "Public"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = local.azs[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "ha-web-app-public-subnet-2-${var.environment}"
    Type = "Public"
    Environment = var.environment
  }
}

# Private subnets in two AZs
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = local.azs[0]

  tags = {
    Name = "ha-web-app-private-subnet-1-${var.environment}"
    Type = "Private"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = local.azs[1]

  tags = {
    Name = "ha-web-app-private-subnet-2-${var.environment}"
    Type = "Private"
    Environment = var.environment
  }
}

# Output VPC and subnet IDs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "availability_zones" {
  description = "Availability zones used"
  value       = [local.azs[0], local.azs[1]]
}

########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket-dev"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# S3 Bucket
########################

/*
resource \"aws_s3_bucket\" \"this\" {
  bucket = var.bucket_name
  tags   = var.bucket_tags
}

resource \"aws_s3_bucket_public_access_block\" \"this\" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource \"aws_s3_bucket_versioning\" \"this\" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = \"Enabled\"
  }
}

########################
# Outputs
########################

output \"bucket_name\" {
  value = aws_s3_bucket.this.bucket
}

output \"bucket_tags\" {
  value = aws_s3_bucket.this.tags
}
*/
```
