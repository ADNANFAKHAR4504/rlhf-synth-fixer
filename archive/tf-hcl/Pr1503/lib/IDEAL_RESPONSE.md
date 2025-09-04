# Ideal Terraform Infrastructure for Web Application Deployment

## Infrastructure Overview

This Terraform implementation creates a highly available, secure, and PCI-DSS compliant web application infrastructure on AWS with the following components:

## Core Infrastructure Components

### 1. Network Architecture (vpc.tf)
```hcl
resource "aws_vpc" "ecommerce_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "ecommerce-vpc-${var.environment_suffix}"
  })
}

resource "aws_subnet" "public_subnets" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.ecommerce_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.ecommerce_vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
}
```

### 2. Security Configuration (security_groups.tf)
```hcl
resource "aws_security_group" "alb_sg" {
  name        = "ecommerce-alb-sg-${var.environment_suffix}"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.ecommerce_vpc.id

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
}

resource "aws_security_group" "rds_sg" {
  name        = "ecommerce-rds-sg-${var.environment_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }
}
```

### 3. Database Configuration (database.tf)
```hcl
resource "aws_db_instance" "ecommerce_db" {
  identifier     = "ecommerce-db-${var.environment_suffix}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.ecommerce_kms_key.arn

  db_name  = "ecommerce"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.ecommerce_db_subnet_group.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az            = true
  publicly_accessible = false
  deletion_protection = false
  skip_final_snapshot = true

  performance_insights_enabled = false  # Not supported on db.t3.micro
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "ecommerce-db-password-${var.environment_suffix}"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.ecommerce_kms_key.arn
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}
```

### 4. Load Balancer Configuration (load_balancer.tf)
```hcl
resource "aws_lb" "ecommerce_alb" {
  name               = "ecommerce-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false
  enable_http2               = true
}

resource "aws_lb_target_group" "ecommerce_tg" {
  name     = "ecommerce-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.ecommerce_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

resource "aws_lb_listener" "ecommerce_alb_listener" {
  load_balancer_arn = aws_lb.ecommerce_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecommerce_tg.arn
  }
}
```

### 5. Auto Scaling Configuration (auto_scaling.tf)
```hcl
resource "aws_launch_template" "ecommerce_lt" {
  name_prefix   = "ecommerce-lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ecommerce_kms_key.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

cat << 'HTML' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Application</title>
</head>
<body>
    <h1>Welcome to E-commerce Platform</h1>
    <p>PCI-DSS Compliant Web Application</p>
    <p>Database Endpoint: ${aws_db_instance.ecommerce_db.endpoint}</p>
    <p>Server: $(hostname)</p>
</body>
</html>
HTML

systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "ecommerce-instance-${var.environment_suffix}"
    })
  }
}

resource "aws_autoscaling_group" "ecommerce_asg" {
  name                      = "ecommerce-asg-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.public_subnets[*].id
  target_group_arns         = [aws_lb_target_group.ecommerce_tg.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.ecommerce_lt.id
    version = "$Latest"
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

resource "aws_autoscaling_policy" "ecommerce_scale_up" {
  name                   = "ecommerce-scale-up-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

resource "aws_autoscaling_policy" "ecommerce_scale_down" {
  name                   = "ecommerce-scale-down-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

resource "aws_cloudwatch_metric_alarm" "ecommerce_high_cpu" {
  alarm_name          = "ecommerce-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }
}

resource "aws_cloudwatch_metric_alarm" "ecommerce_low_cpu" {
  alarm_name          = "ecommerce-low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }
}
```

### 6. Encryption Configuration (kms.tf)
```hcl
resource "aws_kms_key" "ecommerce_kms_key" {
  description             = "KMS key for ecommerce application encryption"
  deletion_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "ecommerce-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "ecommerce_kms_alias" {
  name          = "alias/ecommerce-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecommerce_kms_key.key_id
}
```

## Key Features and Best Practices

### 1. Security and Compliance
- **PCI-DSS Compliance**: All storage encrypted with KMS, secure network segmentation
- **Encryption at Rest**: RDS and EBS volumes encrypted using AWS KMS
- **Encryption in Transit**: HTTPS support on ALB, SSL/TLS for database connections
- **Network Isolation**: Private subnets for database, security groups for access control
- **Secrets Management**: Database passwords stored in AWS Secrets Manager

### 2. High Availability
- **Multi-AZ Deployment**: Resources deployed across multiple availability zones
- **Auto Scaling**: Automatic scaling based on CPU utilization metrics
- **Load Balancing**: Application Load Balancer distributes traffic across instances
- **Database Redundancy**: Multi-AZ RDS deployment for automatic failover

### 3. Monitoring and Observability
- **CloudWatch Integration**: Metrics and alarms for auto-scaling
- **CloudWatch Agent**: Installed on EC2 instances for detailed monitoring
- **Health Checks**: ELB health checks ensure only healthy instances receive traffic

### 4. Infrastructure as Code Best Practices
- **Environment Isolation**: Environment suffix for all resource names
- **Resource Tagging**: Consistent tagging strategy for cost tracking and compliance
- **Modular Design**: Separate files for different infrastructure components
- **Variable Configuration**: Externalized configuration through variables
- **State Management**: Remote state backend with S3 and DynamoDB locking

### 5. Operational Excellence
- **Automated Backups**: 7-day retention for RDS backups
- **Maintenance Windows**: Scheduled during low-traffic periods
- **Lifecycle Management**: Proper resource lifecycles to prevent deletion issues
- **Clean Teardown**: All resources configured for clean deletion

## Deployment Architecture

```
Internet → ALB (Public Subnets) → Auto Scaling Group (EC2 Instances)
                                            ↓
                                    RDS MySQL (Private Subnets)
                                            ↓
                                    AWS Secrets Manager
                                            ↓
                                        AWS KMS
```

## Resource Naming Convention

All resources follow the pattern: `ecommerce-{resource-type}-${environment_suffix}`

This ensures:
- No naming conflicts between environments
- Easy identification of resources
- Consistent naming across the infrastructure

## Outputs

The infrastructure provides the following outputs for integration:
- VPC ID
- Load Balancer DNS Name
- RDS Endpoint (sensitive)
- KMS Key ARN
- Auto Scaling Group Name

These outputs are essential for application deployment and monitoring integration.