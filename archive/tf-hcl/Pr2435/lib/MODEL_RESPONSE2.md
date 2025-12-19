```hcl
# S3 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# =============================================================================
# LAUNCH TEMPLATES
# =============================================================================

# User data script for EC2 instances
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Configure log forwarding to S3
    yum install -y aws-cli
    echo "*/5 * * * * root aws s3 sync /var/log/ s3://${aws_s3_bucket.logs.bucket}/$(hostname)/ --exclude '*' --include '*.log'" >> /etc/crontab
  EOF
  )
}

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.primary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.primary_prefix}-instance"
      Region = var.primary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-launch-template"
    Region = var.primary_region
  })
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.secondary_prefix}-launch-template"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.secondary_prefix}-instance"
      Region = var.secondary_region
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-launch-template"
    Region = var.secondary_region
  })
}

# =============================================================================
# APPLICATION LOAD BALANCERS
# =============================================================================

# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = [aws_subnet.primary_public_1.id, aws_subnet.primary_public_2.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-alb"
    Region = var.primary_region
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

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

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-tg"
    Region = var.primary_region
  })
}

# Load Balancer Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-listener"
    Region = var.primary_region
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = [aws_subnet.secondary_public_1.id, aws_subnet.secondary_public_2.id]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-alb"
    Region = var.secondary_region
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

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

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-tg"
    Region = var.secondary_region
  })
}

# Load Balancer Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-listener"
    Region = var.secondary_region
  })
}

# =============================================================================
# AUTO SCALING GROUPS
# =============================================================================

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.primary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.primary_prefix}-asg-instance"
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

  tag {
    key                 = "Region"
    value               = var.primary_region
    propagate_at_launch = true
  }
}

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.secondary_prefix}-asg"
  vpc_zone_identifier = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.secondary_prefix}-asg-instance"
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

  tag {
    key                 = "Region"
    value               = var.secondary_region
    propagate_at_launch = true
  }
}

# =============================================================================
# RDS DATABASE
# =============================================================================

# DB Subnet Group - Primary Region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.primary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-db-subnet-group"
    Region = var.primary_region
  })
}

# DB Subnet Group - Secondary Region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.secondary_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-db-subnet-group"
    Region = var.secondary_region
  })
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2

  identifier     = "${local.primary_prefix}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "appdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.primary_prefix}-database"
    Region = var.primary_region
  })
}

# Read Replica in Secondary Region
resource "aws_db_instance" "secondary_replica" {
  provider = aws.us_west_1

  identifier                = "${local.secondary_prefix}-database-replica"
  replicate_source_db       = aws_db_instance.primary.arn
  instance_class            = var.db_instance_class
  auto_minor_version_upgrade = false

  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.secondary_prefix}-database-replica"
    Region = var.secondary_region
  })
}

# =============================================================================
# ROUTE 53
# =============================================================================

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = local.common_tags
}

# Route 53 Health Check - Primary ALB
resource "aws_route53_health_check" "primary_alb" {
  fqdn                            = aws_lb.primary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.primary_region
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name
  insufficient_data_health_status = "Failure"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-health-check"
  })
}

# Route 53 Health Check - Secondary ALB
resource "aws_route53_health_check" "secondary_alb" {
  fqdn                            = aws_lb.secondary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.secondary_region
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.secondary_alb_health.alarm_name
  insufficient_data_health_status = "Failure"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-health-check"
  })
}

# Route 53 Record - Primary (Weighted Routing)
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "primary"
  weighted_routing_policy {
    weight = 100
  }

  health_check_id = aws_route53_health_check.primary_alb.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record - Secondary (Weighted Routing)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"
  weighted_routing_policy {
    weight = 0
  }

  health_check_id = aws_route53_health_check.secondary_alb.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# =============================================================================
# CLOUDWATCH MONITORING AND ALARMS
# =============================================================================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  provider          = aws.us_east_2
  name              = "/aws/ec2/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary ALB Health
resource "aws_cloudwatch_metric_alarm" "primary_alb_health" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors primary ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary ALB Health
resource "aws_cloudwatch_metric_alarm" "secondary_alb_health" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors secondary ALB healthy host count"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary RDS CPU
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors primary RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

# SNS Topic for Alerts - Primary Region
resource "aws_sns_topic" "alerts" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-alerts"

  tags = local.common_tags
}

# SNS Topic for Alerts - Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-alerts"

  tags = local.common_tags
}

# =============================================================================
# AUTO SCALING POLICIES
# =============================================================================

# Auto Scaling Policy - Scale Up Primary
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Auto Scaling Policy - Scale Down Primary
resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Auto Scaling Policy - Scale Up Secondary
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# Auto Scaling Policy - Scale Down Secondary
resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_1
  name               = "${local.secondary_prefix}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# CloudWatch Metric Alarm - Primary CPU High
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors primary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Primary CPU Low
resource "aws_cloudwatch_metric_alarm" "primary_cpu_low" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors primary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary CPU High
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors secondary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# CloudWatch Metric Alarm - Secondary CPU Low
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_low" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors secondary region EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = [aws_subnet.primary_public_1.id, aws_subnet.primary_public_2.id]
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = [aws_subnet.secondary_public_1.id, aws_subnet.secondary_public_2.id]
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = [aws_subnet.secondary_private_1.id, aws_subnet.secondary_private_2.id]
}

# Load Balancer Outputs
output "primary_alb_dns_name" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "primary_launch_template_arn" {
  description = "ARN of the primary launch template"
  value       = aws_launch_template.primary.arn
}

output "secondary_launch_template_arn" {
  description = "ARN of the secondary launch template"
  value       = aws_launch_template.secondary.arn
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "ID of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "primary_ami_name" {
  description = "Name of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "Name of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary database"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary read replica"
  value       = aws_db_instance.secondary_replica.endpoint
}

output "primary_rds_identifier" {
  description = "RDS instance identifier for primary database"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_identifier" {
  description = "RDS instance identifier for secondary read replica"
  value       = aws_db_instance.secondary_replica.id
}

output "primary_rds_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary.arn
}

output "secondary_rds_arn" {
  description = "ARN of the secondary RDS read replica"
  value       = aws_db_instance.secondary_replica.arn
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.primary.db_name
}

output "rds_username" {
  description = "Master username for the database"
  value       = aws_db_instance.primary.username
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.logs.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.logs.bucket_regional_domain_name
}
