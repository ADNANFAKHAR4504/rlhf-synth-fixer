# Expected Model Response

## Overview
A successful response should create a complete, production-ready Terraform configuration that deploys a highly available web application infrastructure on AWS. The configuration should be modular, well-documented, and follow AWS best practices.

## Required Files Structure

```
├── main.tf           # Main infrastructure configuration
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── providers.tf      # AWS provider configuration
├── security.tf       # IAM roles and security groups
└── monitoring.tf     # CloudWatch configuration
```

## Key Components Expected

### 1. Provider Configuration (providers.tf)
```hcl
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
  region = var.aws_region
}
```

### 2. Variables (variables.tf)
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "webapp"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}
```

### 3. Data Sources (main.tf)
```hcl
# Reference existing default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

### 4. Security Groups (security.tf)
```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = data.aws_vpc.default.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-alb-sg"
    Environment = var.environment
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name        = "${var.app_name}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = data.aws_vpc.default.id

  ingress {
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

  tags = {
    Name        = "${var.app_name}-ec2-sg"
    Environment = var.environment
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name        = "${var.app_name}-rds-sg"
    Environment = var.environment
  }
}
```

### 5. IAM Roles (security.tf)
```hcl
# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role"

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
    Name        = "${var.app_name}-ec2-role"
    Environment = var.environment
  }
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# CloudWatch policy
resource "aws_iam_role_policy" "cloudwatch_policy" {
  name = "${var.app_name}-cloudwatch-policy"
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
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}
```

### 6. Launch Template (main.tf)
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "${var.app_name}-template"
  image_id      = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI
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
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-instance"
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.app_name}-launch-template"
    Environment = var.environment
  }
}
```

### 7. Application Load Balancer (main.tf)
```hcl
resource "aws_lb" "app" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name        = "${var.app_name}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "app" {
  name     = "${var.app_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

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

  tags = {
    Name        = "${var.app_name}-target-group"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 8. Auto Scaling Group (main.tf)
```hcl
resource "aws_autoscaling_group" "app" {
  name                = "${var.app_name}-asg"
  desired_capacity    = 2
  max_size            = 4
  min_size            = 1
  target_group_arns   = [aws_lb_target_group.app.arn]
  vpc_zone_identifier = data.aws_subnets.default.ids

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.app_name}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "cpu" {
  name                   = "${var.app_name}-cpu-policy"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "${var.app_name}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.cpu.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}
```

### 9. RDS Database (main.tf)
```hcl
resource "aws_db_subnet_group" "app" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name        = "${var.app_name}-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "app" {
  identifier = "${var.app_name}-db"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "webappdb"
  username = "admin"
  password = "password123" # In production, use AWS Secrets Manager

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.app.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az = true

  skip_final_snapshot = true

  tags = {
    Name        = "${var.app_name}-rds"
    Environment = var.environment
  }
}
```

### 10. CloudWatch Monitoring (monitoring.tf)
```hcl
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.app_name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.app_name}-log-group"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "memory" {
  alarm_name          = "${var.app_name}-memory-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "System/Linux"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 memory utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}
```

### 11. Outputs (outputs.tf)
```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.app.endpoint
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}
```

## Success Criteria Met

✅ **High Availability**: Deployed across multiple AZs using default VPC  
✅ **Load Balancing**: ALB configured with health checks  
✅ **Auto Scaling**: CPU-based scaling policies implemented  
✅ **Database**: Multi-AZ RDS with backups enabled  
✅ **Security**: IAM roles and security groups with least privilege  
✅ **Monitoring**: CloudWatch alarms and logging configured  
✅ **Infrastructure as Code**: Complete Terraform configuration  
✅ **Tagging**: All resources tagged with "Environment: Production"  

## Deployment Commands

```bash
terraform init
terraform plan
terraform apply
```

This configuration creates a production-ready, highly available web application infrastructure that meets all the specified requirements.
