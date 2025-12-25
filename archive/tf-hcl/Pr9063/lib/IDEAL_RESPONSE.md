# High Availability Web Application - Terraform Configuration

## Overview

This document provides the complete Terraform configuration for deploying a highly available web application infrastructure on AWS. The solution creates a production-ready environment with load balancing, auto-scaling, database, and comprehensive monitoring.

## Architecture

The infrastructure includes:
- VPC with multiple availability zones
- Application Load Balancer for traffic distribution
- Auto Scaling Group with EC2 instances
- RDS MySQL database with Multi-AZ deployment
- Security groups following least privilege principles
- IAM roles for EC2 instances
- CloudWatch monitoring and alarms
- Secrets Manager for database credentials

## Complete Terraform Configuration

### File: lib/tap_stack.tf

```hcl
# Terraform configuration for High Availability Web Application
# This configuration creates a production-ready infrastructure on AWS
# LocalStack-compatible version - some resources are conditionally created

########################
# Variables
########################
variable "aws_region" {
  description = "AWS region for the infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name for resource naming"
  type        = string
  default     = "webapp"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class for database"
  type        = string
  default     = "db.t3.micro"
}

variable "localstack_mode" {
  description = "Set to true when deploying to LocalStack (skips unsupported resources)"
  type        = bool
  default     = true
}

########################
# Data Sources
########################
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Locals
########################
locals {
  common_tags = {
    Name        = "${var.app_name}-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "terraform"
  }

  # Use first 2 available subnets
  subnet_ids = slice(data.aws_subnets.default.ids, 0, min(2, length(data.aws_subnets.default.ids)))
}

########################
# Security Groups
########################
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-${var.environment_suffix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-alb-sg"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "ec2" {
  name        = "${var.app_name}-${var.environment_suffix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-ec2-sg"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-${var.environment_suffix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "Allow MySQL access from EC2 instances"
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-rds-sg"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

########################
# IAM Roles and Policies
########################
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-${var.environment_suffix}-ec2-role"

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

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-ec2-role"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-${var.environment_suffix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role_policy" "cloudwatch_policy" {
  name = "${var.app_name}-${var.environment_suffix}-cloudwatch-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
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

########################
# Launch Template
########################
resource "aws_launch_template" "app" {
  name_prefix   = "${var.app_name}-${var.environment_suffix}-template-"
  image_id      = "ami-0c02fb55956c7d316"
  instance_type = var.instance_type

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2.id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -x
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              cat > /var/www/html/index.html << 'HTML_EOF'
              <!DOCTYPE html>
              <html>
              <head>
                  <title>Web Application</title>
                  <style>
                      body { font-family: Arial, sans-serif; margin: 40px; }
                      .container { max-width: 800px; margin: 0 auto; }
                      .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
                      .info { margin: 20px 0; }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>High Availability Web Application</h1>
                          <p>Successfully deployed with Terraform</p>
                      </div>
                      <div class="info">
                          <h2>Instance Information</h2>
                          <p><strong>Hostname:</strong> $(hostname -f)</p>
                          <p><strong>Launch Time:</strong> $(date)</p>
                      </div>
                  </div>
              </body>
              </html>
              HTML_EOF
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              cat > /var/www/html/health << 'HEALTH_EOF'
              OK
              HEALTH_EOF
              systemctl status httpd
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment_suffix}-instance"
      Environment = "Production"
      ManagedBy   = "terraform"
    }
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-launch-template"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

########################
# Application Load Balancer (AWS only - not supported in LocalStack Community)
########################
resource "aws_lb" "app" {
  count = var.localstack_mode ? 0 : 1

  name               = "${var.app_name}-${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.subnet_ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-alb"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_target_group" "app" {
  count = var.localstack_mode ? 0 : 1

  name     = "${var.app_name}-${var.environment_suffix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-target-group"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "app" {
  count = var.localstack_mode ? 0 : 1

  load_balancer_arn = aws_lb.app[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }
}

########################
# Auto Scaling Group (AWS only - not fully supported in LocalStack Community)
########################
resource "aws_autoscaling_group" "app" {
  count = var.localstack_mode ? 0 : 1

  name                      = "${var.app_name}-${var.environment_suffix}-asg"
  desired_capacity          = 1
  max_size                  = 4
  min_size                  = 1
  target_group_arns         = [aws_lb_target_group.app[0].arn]
  vpc_zone_identifier       = local.subnet_ids
  health_check_grace_period = 600
  health_check_type         = "ELB"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.app_name}-${var.environment_suffix}-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Production"
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "terraform"
    propagate_at_launch = true
  }
}

########################
# Auto Scaling Policies (AWS only)
########################
resource "aws_autoscaling_policy" "scale_up" {
  count = var.localstack_mode ? 0 : 1

  name                   = "${var.app_name}-${var.environment_suffix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app[0].name
}

resource "aws_autoscaling_policy" "scale_down" {
  count = var.localstack_mode ? 0 : 1

  name                   = "${var.app_name}-${var.environment_suffix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app[0].name
}

########################
# CloudWatch Alarms (AWS only for ASG-linked alarms)
########################
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.localstack_mode ? 0 : 1

  alarm_name          = "${var.app_name}-${var.environment_suffix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Scale up if CPU > 80% for 4 minutes"
  alarm_actions       = [aws_autoscaling_policy.scale_up[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app[0].name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.localstack_mode ? 0 : 1

  alarm_name          = "${var.app_name}-${var.environment_suffix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "Scale down if CPU < 20% for 4 minutes"
  alarm_actions       = [aws_autoscaling_policy.scale_down[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app[0].name
  }
}

# General CloudWatch alarms that work in LocalStack
resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${var.app_name}-${var.environment_suffix}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "System/Linux"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Memory utilization is high"

  dimensions = {
    InstanceName = "${var.app_name}-${var.environment_suffix}"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = var.localstack_mode ? 0 : 1

  alarm_name          = "${var.app_name}-${var.environment_suffix}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "ALB 5XX errors are high"

  dimensions = {
    LoadBalancer = aws_lb.app[0].arn_suffix
  }
}

########################
# RDS Database (AWS only - not supported in LocalStack Community)
########################
resource "aws_db_subnet_group" "app" {
  count = var.localstack_mode ? 0 : 1

  name       = "${var.app_name}-${var.environment_suffix}-db-subnet-group"
  subnet_ids = local.subnet_ids

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-db-subnet-group"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_db_instance" "app" {
  count = var.localstack_mode ? 0 : 1

  identifier = "${var.app_name}-${var.environment_suffix}-db"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "webappdb"
  username = "admin"
  password = aws_secretsmanager_secret_version.db_password.secret_string

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.app[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az            = true
  publicly_accessible = false

  skip_final_snapshot = true

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-db"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

########################
# AWS Secrets Manager (supported in LocalStack)
########################
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.app_name}-${var.environment_suffix}-db-password"
  description = "Database password for ${var.app_name} application"

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-db-password"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

########################
# CloudWatch Logs (supported in LocalStack)
########################
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.app_name}-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-log-group"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

########################
# Outputs
########################
output "aws_region" {
  description = "AWS region used for the infrastructure"
  value       = var.aws_region
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = var.localstack_mode ? "localstack-mode-no-alb" : aws_lb.app[0].dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = var.localstack_mode ? "localstack-mode-no-alb" : aws_lb.app[0].zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = var.localstack_mode ? "localstack-mode-no-rds" : aws_db_instance.app[0].endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = var.localstack_mode ? 3306 : aws_db_instance.app[0].port
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = var.localstack_mode ? "localstack-mode-no-asg" : aws_autoscaling_group.app[0].name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = var.localstack_mode ? "localstack-mode-no-asg" : aws_autoscaling_group.app[0].arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = data.aws_subnets.default.ids
}

output "security_group_alb_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "security_group_ec2_id" {
  description = "EC2 Security Group ID"
  value       = aws_security_group.ec2.id
}

output "security_group_rds_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds.id
}

output "iam_role_arn" {
  description = "EC2 IAM Role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.app.id
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager Secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.app.name
}

output "localstack_mode" {
  description = "Whether LocalStack mode is enabled"
  value       = var.localstack_mode
}
```

### File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

### File: lib/terraform.tfvars

```hcl
aws_region         = "us-east-1"
environment        = "production"
app_name           = "webapp"
instance_type      = "t3.micro"
db_instance_class  = "db.t3.micro"
environment_suffix = "ls"
localstack_mode    = true
```

## Deployment Instructions

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Plan the deployment:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

4. Verify the deployment:
   ```bash
   terraform output
   ```

## Security Considerations

- All resources are properly tagged for cost tracking and management
- Security groups follow the principle of least privilege
- Database password is stored securely in AWS Secrets Manager
- RDS instance is encrypted and not publicly accessible
- IAM roles have minimal required permissions

## High Availability Features

- Multi-AZ deployment using default VPC subnets
- Application Load Balancer distributes traffic across instances
- Auto Scaling Group maintains desired capacity
- RDS database configured with Multi-AZ for failover
- Health checks ensure only healthy instances receive traffic

## LocalStack Compatibility

The configuration includes a `localstack_mode` variable that conditionally creates resources:
- When `localstack_mode = true`: Skips ALB, RDS, and ASG resources (not supported in LocalStack Community)
- When `localstack_mode = false`: Creates full production infrastructure on AWS

Resources always created in both modes:
- Security Groups
- IAM Roles and Policies
- Launch Template
- Secrets Manager
- CloudWatch Log Groups
- CloudWatch Alarms (memory alarm)

## Outputs

| Output | Description |
|--------|-------------|
| aws_region | AWS region used for deployment |
| alb_dns_name | DNS name of the Application Load Balancer |
| rds_endpoint | RDS database endpoint |
| asg_name | Auto Scaling Group name |
| vpc_id | VPC ID |
| subnet_ids | List of subnet IDs |
| security_group_alb_id | ALB Security Group ID |
| security_group_ec2_id | EC2 Security Group ID |
| security_group_rds_id | RDS Security Group ID |
| iam_role_arn | EC2 IAM Role ARN |
| launch_template_id | Launch Template ID |
| secrets_manager_secret_arn | Secrets Manager Secret ARN |
| cloudwatch_log_group_name | CloudWatch Log Group name |
| localstack_mode | Whether LocalStack mode is enabled |
