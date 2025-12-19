```hcl
# Continuing from where left off...

# ===== IAM ROLES AND POLICIES =====

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = local.common_tags
}

# EC2 Instance Policy for CloudWatch and S3 access
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Lambda Policy for RDS backup operations
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts.arn
        ]
      }
    ]
  })
}

# ===== S3 BUCKETS =====

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_2
  bucket   = "${local.name_prefix}-static-content-primary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-primary"
  })
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_1
  bucket   = "${local.name_prefix}-static-content-secondary-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-secondary"
  })
}

# Random suffix for S3 bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Cross-Region Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "ReplicateToSecondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

# S3 Replication Role
resource "aws_iam_role" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# S3 Replication Policy
resource "aws_iam_role_policy" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# ===== LAUNCH TEMPLATES =====

# Primary Launch Template
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name_prefix   = "${local.name_prefix}-lt-primary-"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = local.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-primary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-primary"
  })
}

# Secondary Launch Template
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name_prefix   = "${local.name_prefix}-lt-secondary-"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = local.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-secondary"
  })
}

# ===== APPLICATION LOAD BALANCERS =====

# Primary ALB
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.name_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-primary"
  })
}

# Secondary ALB
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.name_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-secondary"
  })
}

# Primary ALB Target Group
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.name_prefix}-tg-primary"
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
    Name = "${local.name_prefix}-tg-primary"
  })
}

# Secondary ALB Target Group
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.name_prefix}-tg-secondary"
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
    Name = "${local.name_prefix}-tg-secondary"
  })
}

# Primary ALB Listener
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = local.common_tags
}

# Secondary ALB Listener
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = local.common_tags
}

# ===== AUTO SCALING GROUPS =====

# Primary Auto Scaling Group
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.name_prefix}-asg-primary"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = local.min_size
  max_size         = local.max_size
  desired_capacity = local.desired_size

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-primary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# Secondary Auto Scaling Group
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.name_prefix}-asg-secondary"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = local.min_size
  max_size         = local.max_size
  desired_capacity = local.desired_size

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-secondary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# ===== RDS SUBNET GROUPS =====

# Primary RDS Subnet Group
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.name_prefix}-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-primary"
  })
}

# Secondary RDS Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.name_prefix}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-secondary"
  })
}

# ===== RDS INSTANCES =====

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2
  
  identifier = "${local.name_prefix}-db-primary"
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "tapdb"
  username = "admin${random_string.db_username.result}"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-primary"
  })
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1
  
  identifier = "${local.name_prefix}-db-secondary"
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "tapdb"
  username = "admin${random_string.db_username.result}"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-secondary"
  })
}

# ===== SNS TOPIC =====

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  provider = aws.us_east_2
  name     = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts"
  })
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email_alerts" {
  provider  = aws.us_east_2
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ===== LAMBDA FUNCTIONS =====

# Primary Lambda Function for RDS Backup
resource "aws_lambda_function" "primary_backup" {
  provider         = aws.us_east_2
  filename         = "backup_lambda.zip"
  function_name    = "${local.name_prefix}-rds-backup-primary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DB_IDENTIFIER = aws_db_instance.primary.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-backup-primary"
  })
}

# Secondary Lambda Function for RDS Backup
resource "aws_lambda_function" "secondary_backup" {
  provider         = aws.us_west_1
  filename         = "backup_lambda.zip"
  function_name    = "${local.name_prefix}-rds-backup-secondary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DB_IDENTIFIER = aws_db_instance.secondary.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-backup-secondary"
  })
}

# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "backup_lambda.zip"
  source {
    content = <<EOF
import boto3
import json
import os
from datetime import datetime

def handler(event, context):
    rds = boto3.client('rds')
    sns = boto3.client('sns')
    
    db_identifier = os.environ['DB_IDENTIFIER']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    
    try:
        # Create snapshot
        snapshot_id = f"{db_identifier}-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}"
        
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_identifier
        )
        
        # Send success notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f'RDS Backup Success - {db_identifier}',
            Message=f'Successfully created snapshot {snapshot_id} for {db_identifier}'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Snapshot {snapshot_id} created successfully')
        }
        
    except Exception as e:
        # Send failure notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f'RDS Backup Failed - {db_identifier}',
            Message=f'Failed to create snapshot for {db_identifier}: {str(e)}'
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

# ===== CLOUDWATCH ALARMS =====

# Primary CPU Alarm
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.name_prefix}-cpu-alarm-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# Secondary CPU Alarm
resource "aws_cloudwatch_metric_alarm" "secondary_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.name_prefix}-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# Primary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.name_prefix}-rds-cpu-alarm-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

# Secondary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.name_prefix}-rds-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }

  tags = local.common_tags
}

# ===== ROUTE 53 =====

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_east_2
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-hosted-zone"
  })
}

# Route 53 Health Check for Primary ALB
resource "aws_route53_health_check" "primary" {
  provider                        = aws.us_east_2
  fqdn                           = aws_lb.primary.dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = "/"
  failure_threshold              = "5"
  request_interval               = "30"
  cloudwatch_alarm_region        = var.primary_region
  cloudwatch_alarm_name          = aws_cloudwatch_metric_alarm.primary_cpu.alarm_name
  insufficient_data_health_status = "Failure"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-check-primary"
  })
}

# Route 53 Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary" {
  provider                        = aws.us_east_2
  fqdn                           = aws_lb.secondary.dns_name
  port                           = 80
  type                           = "HTTP"
  resource_path                  = "/"
  failure_threshold              = "5"
  request_interval               = "30"
  cloudwatch_alarm_region        = var.secondary_region
  cloudwatch_alarm_name          = aws_cloudwatch_metric_alarm.secondary_cpu.alarm_name
  insufficient_data_health_status = "Failure"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-check-secondary"
  })
}

# Route 53 Record for Primary (Failover Primary)
resource "aws_route53_record" "primary" {
  provider = aws.us_east_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record for Secondary (Failover Secondary)
resource "aws_route53_record" "secondary" {
  provider = aws.us_east_2
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# ===== OUTPUTS =====

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
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

# Security Group Outputs
output "primary_ec2_security_i
```
