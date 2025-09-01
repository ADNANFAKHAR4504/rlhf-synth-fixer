```hcl
# Continuing from where we left off...

# S3 bucket lifecycle configuration for secondary bucket
resource "aws_s3_bucket_lifecycle_configuration" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id

  rule {
    id     = "log_archiving"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }

  depends_on = [aws_s3_bucket_versioning.secondary]
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  provider = aws.us_east_2
  name     = "${local.project_name}-s3-replication-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-s3-replication-role"
  })
}

# IAM policy for S3 replication
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.us_east_2
  name     = "${local.project_name}-s3-replication-policy"
  role     = aws_iam_role.s3_replication.id

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

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  role       = aws_iam_role.s3_replication.arn
  bucket     = aws_s3_bucket.primary.id
  depends_on = [aws_s3_bucket_versioning.primary]

  rule {
    id     = "replicate_to_secondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

# ============================================================================
# LAUNCH TEMPLATES
# ============================================================================

# Launch template for primary region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.project_name}-primary-lt"
  description   = "Launch template for primary region instances"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = var.primary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-primary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-lt"
  })
}

# Launch template for secondary region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.project_name}-secondary-lt"
  description   = "Launch template for secondary region instances"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = var.secondary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-secondary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-lt"
  })
}

# ============================================================================
# APPLICATION LOAD BALANCERS
# ============================================================================

# ALB for primary region
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-alb"
  })
}

# ALB for secondary region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-alb"
  })
}

# Target group for primary region
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.project_name}-primary-tg"
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
    Name = "${local.project_name}-primary-tg"
  })
}

# Target group for secondary region
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.project_name}-secondary-tg"
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
    Name = "${local.project_name}-secondary-tg"
  })
}

# ALB listener for primary region
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
    Name = "${local.project_name}-primary-listener"
  })
}

# ALB listener for secondary region
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
    Name = "${local.project_name}-secondary-listener"
  })
}

# ============================================================================
# AUTO SCALING GROUPS
# ============================================================================

# Auto Scaling Group for primary region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.project_name}-primary-asg"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
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
    value               = "${local.project_name}-primary-asg-instance"
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

  depends_on = [aws_lb_target_group.primary]
}

# Auto Scaling Group for secondary region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.project_name}-secondary-asg"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
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
    value               = "${local.project_name}-secondary-asg-instance"
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

  depends_on = [aws_lb_target_group.secondary]
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# CloudWatch alarm for primary ASG CPU utilization
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.us_east_2
  alarm_name          = "${local.project_name}-primary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization in primary region"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-cpu-high-alarm"
  })
}

# CloudWatch alarm for secondary ASG CPU utilization
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.us_west_1
  alarm_name          = "${local.project_name}-secondary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization in secondary region"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-cpu-high-alarm"
  })
}

# CloudWatch alarm for primary RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.project_name}-primary-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization in primary region"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-rds-cpu-alarm"
  })
}

# CloudWatch alarm for secondary RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.project_name}-secondary-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization in secondary region"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-rds-cpu-alarm"
  })
}

# ============================================================================
# AUTO SCALING POLICIES
# ============================================================================

# Scale up policy for primary ASG
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Scale down policy for primary ASG
resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Scale up policy for secondary ASG
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# Scale down policy for secondary ASG
resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# ============================================================================
# AWS CONFIG
# ============================================================================

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "${local.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-role"
  })
}

# Attach AWS managed policy to Config role
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket for Config in primary region
resource "aws_s3_bucket" "config_primary" {
  provider      = aws.us_east_2
  bucket        = "${local.project_name}-config-primary-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-primary-bucket"
  })
}

# S3 bucket for Config in secondary region
resource "aws_s3_bucket" "config_secondary" {
  provider      = aws.us_west_1
  bucket        = "${local.project_name}-config-secondary-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-secondary-bucket"
  })
}

# S3 bucket policy for Config primary
resource "aws_s3_bucket_policy" "config_primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.config_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_primary.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_primary.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_primary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# S3 bucket policy for Config secondary
resource "aws_s3_bucket_policy" "config_secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.config_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_secondary.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_secondary.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_secondary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# AWS Config delivery channel for primary region
resource "aws_config_delivery_channel" "primary" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_primary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }

  depends_on = [aws_config_configuration_recorder.primary]
}

# AWS Config delivery channel for secondary region
resource "aws_config_delivery_channel" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_secondary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }

  depends_on = [aws_config_configuration_recorder.secondary]
}

# AWS Config configuration recorder for primary region
resource "aws_config_configuration_recorder" "primary" {
  provider = aws.us_east_2
  name     = "${local.project_name}-primary-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config configuration recorder for secondary region
resource "aws_config_configuration_recorder" "secondary" {
  provider = aws.us_west_1
  name     = "${local.project_name}-secondary-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = false
  }
}

# AWS Config configuration recorder status for primary region
resource "aws_config_configuration_recorder_status" "primary" {
  provider   = aws.us_east_2
  name       = aws_config_configuration_recorder.primary.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.primary]
}

# AWS Config configuration recorder status for secondary region
resource "aws_config_configuration_recorder_status" "secondary" {
  provider   = aws.us_west_1
  name       = aws_config_configuration_recorder.secondary.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.secondary]
}

# ============================================================================
# OUTPUTS
# ============================================================================

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
  description = "IDs of the primary region public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary region private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary region public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary region private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary region internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary region internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary region NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary region NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary region EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary region EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "primary_alb_security_group_id" {
  description = "ID of the primary region ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary region ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary region RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary region RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary region"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary region"
  value       = aws_db_instance.secondary.endpoint
}

output "primary_rds_instance_id" {
  description = "RDS instance ID for primary region"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_instance_id" {
  description = "RDS instance ID for secondary region"
  value       = aws_db_instance.secondary.id
}

output "primary_db_subnet_group_name" {
  description = "Name of the primary region DB subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary region DB subnet group"
  value       = aws_db_subnet_group.secondary.name
}

# S3 Bucket Outputs
output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "config_primary_s3_bucket_name" {
  description = "Name of the primary Config S3 bucket"
  value       = aws_s3_bucket.config_primary.bucket
}

output "config_secondary_s3_bucket_name" {
  description = "Name of the secondary Config S3 bucket"
  value       = aws_s3_bucket.config_secondary.bucket
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "primary_ami_name" {
  description = "AMI name used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "AMI name used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# IAM Role Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "config_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config_role.arn
}
```
