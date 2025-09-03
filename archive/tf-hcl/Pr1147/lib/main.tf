########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
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

########################
# Random Suffix Generation
########################

# Generate a random suffix to ensure unique resource names
resource "random_id" "suffix" {
  byte_length = 4
  keepers = {
    # Change this to regenerate suffix when needed
    timestamp = "2024"
  }
}

########################
# VPC Resources
########################

resource "aws_vpc" "prod_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "prod-vpc${local.env_suffix}"
    }
  )
}

resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = merge(
    local.common_tags,
    {
      Name = "prod-igw${local.env_suffix}"
    }
  )
}

########################
# Subnets
########################

resource "aws_subnet" "prod_public_subnets" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "prod-public-subnet-${count.index + 1}${local.env_suffix}"
      Type = "Public"
    }
  )
}

resource "aws_subnet" "prod_private_subnets" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "prod-private-subnet-${count.index + 1}${local.env_suffix}"
      Type = "Private"
    }
  )
}

########################
# NAT Gateway Resources
########################

resource "aws_eip" "prod_nat_eips" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  depends_on = [aws_internet_gateway.prod_igw]

  tags = merge(
    local.common_tags,
    {
      Name = "prod-nat-eip-${count.index + 1}${local.env_suffix}"
    }
  )
}

resource "aws_nat_gateway" "prod_nat_gateways" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.prod_nat_eips[count.index].id
  subnet_id     = aws_subnet.prod_public_subnets[count.index].id

  depends_on = [aws_internet_gateway.prod_igw]

  tags = merge(
    local.common_tags,
    {
      Name = "prod-nat-gateway-${count.index + 1}${local.env_suffix}"
    }
  )
}

########################
# Route Tables
########################

resource "aws_route_table" "prod_public_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-public-rt${local.env_suffix}"
    }
  )
}

resource "aws_route_table" "prod_private_rt" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.prod_nat_gateways[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-private-rt-${count.index + 1}${local.env_suffix}"
    }
  )
}

resource "aws_route_table_association" "prod_public_rta" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.prod_public_subnets[count.index].id
  route_table_id = aws_route_table.prod_public_rt.id
}

resource "aws_route_table_association" "prod_private_rta" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.prod_private_subnets[count.index].id
  route_table_id = aws_route_table.prod_private_rt[count.index].id
}

########################
# Security Groups
########################

resource "aws_security_group" "prod_alb_sg" {
  name        = "prod-alb-sg${local.env_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    description = "HTTP"
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

  tags = merge(
    local.common_tags,
    {
      Name = "prod-alb-sg${local.env_suffix}"
    }
  )
}

resource "aws_security_group" "prod_ec2_sg" {
  name        = "prod-ec2-sg${local.env_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_alb_sg.id]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-ec2-sg${local.env_suffix}"
    }
  )
}

########################
# Launch Template
########################

resource "aws_launch_template" "prod_launch_template" {
  name_prefix   = "prod-launch-template${local.env_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  # Enforce IMDSv2 for enhanced security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Production Server${local.env_suffix} - $(hostname -f)</h1>" > /var/www/html/index.html
    echo "<p>Environment: ${var.environment}</p>" >> /var/www/html/index.html
    echo "<p>Instance ID: $(ec2-metadata --instance-id | cut -d ' ' -f 2)</p>" >> /var/www/html/index.html
    echo "<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d ' ' -f 2)</p>" >> /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name = "prod-web-server${local.env_suffix}"
      }
    )
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-launch-template${local.env_suffix}"
    }
  )
}

########################
# Application Load Balancer
########################

resource "aws_lb" "prod_alb" {
  name               = "prod-alb${local.env_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.prod_alb_sg.id]
  subnets            = aws_subnet.prod_public_subnets[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(
    local.common_tags,
    {
      Name = "prod-alb${local.env_suffix}"
    }
  )
}

resource "aws_lb_target_group" "prod_tg" {
  name     = "prod-tg${local.env_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.prod_vpc.id

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

  tags = merge(
    local.common_tags,
    {
      Name = "prod-tg${local.env_suffix}"
    }
  )
}

resource "aws_lb_listener" "prod_alb_listener_http" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_tg.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-alb-listener-http${local.env_suffix}"
    }
  )
}

# Certificate and HTTPS removed for test environment
# In production, you would configure ACM certificate with proper domain validation

########################
# Auto Scaling Group
########################

resource "aws_autoscaling_group" "prod_asg" {
  name                      = "prod-asg${local.env_suffix}"
  vpc_zone_identifier       = aws_subnet.prod_private_subnets[*].id
  target_group_arns         = [aws_lb_target_group.prod_tg.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.prod_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "prod-asg-instance${local.env_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

########################
# S3 Buckets
########################

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "prod_data_bucket" {
  bucket = "prod-app-data${local.env_suffix}-${random_string.bucket_suffix.result}"

  tags = merge(
    local.common_tags,
    {
      Name = "prod-app-data-bucket${local.env_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "prod_data_bucket_versioning" {
  bucket = aws_s3_bucket.prod_data_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "prod_data_bucket_pab" {
  bucket = aws_s3_bucket.prod_data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prod_data_bucket_encryption" {
  bucket = aws_s3_bucket.prod_data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "prod_data_bucket_lifecycle" {
  bucket = aws_s3_bucket.prod_data_bucket.id

  rule {
    id     = "prod_data_lifecycle"
    status = "Enabled"

    filter {}

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

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 730
    }
  }
}

resource "aws_s3_bucket" "prod_logs_bucket" {
  bucket = "prod-logs${local.env_suffix}-${random_string.bucket_suffix.result}"

  tags = merge(
    local.common_tags,
    {
      Name = "prod-logs-bucket${local.env_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "prod_logs_bucket_versioning" {
  bucket = aws_s3_bucket.prod_logs_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "prod_logs_bucket_pab" {
  bucket = aws_s3_bucket.prod_logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prod_logs_bucket_encryption" {
  bucket = aws_s3_bucket.prod_logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "prod_logs_bucket_lifecycle" {
  bucket = aws_s3_bucket.prod_logs_bucket.id

  rule {
    id     = "prod_logs_lifecycle"
    status = "Enabled"

    filter {}

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

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }

    expiration {
      days = 2555 # ~7 years retention for logs
    }
  }
}

########################
# CloudWatch Alarms for Monitoring
########################

# ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_target_health" {
  alarm_name          = "prod-alb-target-health${local.env_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB healthy target count"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.prod_alb.arn_suffix
    TargetGroup  = aws_lb_target_group.prod_tg.arn_suffix
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-alb-target-health-alarm${local.env_suffix}"
    }
  )
}

# ASG Instances Alarm
resource "aws_cloudwatch_metric_alarm" "asg_instance_health" {
  alarm_name          = "prod-asg-instance-health${local.env_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GroupInServiceInstances"
  namespace           = "AWS/AutoScaling"
  period              = "60"
  statistic           = "Average"
  threshold           = var.min_size
  alarm_description   = "This metric monitors ASG healthy instance count"
  alarm_actions       = []

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.prod_asg.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-asg-instance-health-alarm${local.env_suffix}"
    }
  )
}

# ALB Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "prod-alb-response-time${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.prod_alb.arn_suffix
  }

  tags = merge(
    local.common_tags,
    {
      Name = "prod-alb-response-time-alarm${local.env_suffix}"
    }
  )
}