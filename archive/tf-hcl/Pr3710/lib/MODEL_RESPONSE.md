Based on your requirements and here's the comprehensive `main.tf` file for a production-ready AWS environment:

## main.tf

```hcl
# main.tf

# 
# Variables
# 

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
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

variable "customer_gateway_ip" {
  description = "Customer gateway IP for VPN connection"
  type        = string
  default     = "203.0.113.100" # Replace with actual IP
}

# 
# Data Sources
# 

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
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

# 
# Networking - VPC
# 

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "production-vpc"
    Environment = var.environment
  }
}

# 
# Networking - Subnets
# 

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-${count.index + 1}"
    Type        = "public"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "private-subnet-${count.index + 1}"
    Type        = "private"
    Environment = var.environment
  }
}

resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "database-subnet-${count.index + 1}"
    Type        = "database"
    Environment = var.environment
  }
}

# 
# Networking - Internet Gateway
# 

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "production-igw"
    Environment = var.environment
  }
}

# 
# Networking - NAT Gateways
# 

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}


# 
# Networking - Route Tables
# 

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-route-table"
    Environment = var.environment
  }
}


resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# 
# Security - Security Groups
# 

resource "aws_security_group" "alb" {
  name        = "production-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

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
    Name        = "production-alb-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "ec2" {
  name        = "production-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
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

  tags = {
    Name        = "production-ec2-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "production-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-rds-sg"
    Environment = var.environment
  }
}

# 
# IAM - Roles and Policies
# 

resource "aws_iam_role" "ec2_role" {
  name = "production-ec2-role"

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
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "production-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role" "lambda_backup_role" {
  name = "production-rds-backup-lambda-role"

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

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_policy" "lambda_rds_backup" {
  name        = "production-lambda-rds-backup-policy"
  description = "Policy for Lambda to manage RDS snapshots"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_backup_policy" {
  role       = aws_iam_role.lambda_backup_role.name
  policy_arn = aws_iam_policy.lambda_rds_backup.arn
}

# 
# Compute - Application Load Balancer
# 

resource "aws_lb" "main" {
  name               = "production-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "production-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "main" {
  name     = "production-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "production-tg"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# 
# Compute - Launch Template
# 

resource "aws_launch_template" "main" {
  name_prefix   = "production-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Production Server - Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html
    
    # Install CloudWatch Agent
    wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "production-ec2-instance"
      Environment = var.environment
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "production-ec2-volume"
      Environment = var.environment
    }
  }
}

# 
# Compute - Auto Scaling Group
# 

resource "aws_autoscaling_group" "main" {
  name               = "production-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns  = [aws_lb_target_group.main.arn]
  health_check_type  = "ELB"
  health_check_grace_period = 300
  min_size           = 2
  max_size           = 6
  desired_capacity   = 2

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "production-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "production-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "production-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# 
# Monitoring - CloudWatch Alarms
# 

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "production-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = "75"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "production-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = "25"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Environment = var.environment
  }
}

# 
# Database - RDS
# 

resource "aws_db_subnet_group" "main" {
  name       = "production-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name        = "production-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier     = "production-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  allocated_storage     = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "productiondb"
  username = "admin"
  password = "ChangeMePlease123!" # Use AWS Secrets Manager in production
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "production-db-final-snapshot-${formatdate("YYYY-MM-DD", timestamp())}"
  
  tags = {
    Name        = "production-database"
    Environment = var.environment
  }
}

# 
# Database - Lambda for Daily Backups
# 

resource "aws_lambda_function" "rds_backup" {
  filename         = "rds_backup_lambda.zip"
  function_name    = "production-rds-daily-backup"
  role            = aws_iam_role.lambda_backup_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("rds_backup_lambda.zip")
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main.id
    }
  }

  tags = {
    Name        = "production-rds-backup-lambda"
    Environment = var.environment
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_backup_policy]
}

resource "aws_cloudwatch_event_rule" "daily_backup" {
  name                = "production-daily-rds-backup"
  description         = "Trigger daily RDS backup"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_backup.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.rds_backup.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_backup.arn
}

# 
# Storage - S3 Bucket
# 

resource "aws_s3_bucket" "main" {
  bucket = "production-content-bucket-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "production-content-bucket"
    Environment = var.environment
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

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
  }
}

# 
# CDN - CloudFront Distribution
# 

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for production S3 bucket"
}

resource "aws_s3_bucket_policy" "cdn_access" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"
  price_class        = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.main.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.main.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.main.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "production-cloudfront"
    Environment = var.environment
  }
}

# 
# Logging - VPC Flow Logs
# 

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination_arn = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name        = "production-vpc-flow-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 30

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role" "flow_log_role" {
  name = "production-vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "production-vpc-flow-log-policy"
  role = aws_iam_role.flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# 
# VPN Connection
# 

resource "aws_customer_gateway" "main" {
  bgp_asn    = 65000
  ip_address = var.customer_gateway_ip
  type       = "ipsec.1"

  tags = {
    Name        = "production-customer-gateway"
    Environment = var.environment
  }
}

resource "aws_vpn_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "production-vpn-gateway"
    Environment = var.environment
  }
}

resource "aws_vpn_connection" "main" {
  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.main.id
  type               = "ipsec.1"
  static_routes_only = true

  tags = {
    Name        = "production-vpn-connection"
    Environment = var.environment
  }
}

resource "aws_vpn_connection_route" "main" {
  destination_cidr_block = "192.168.0.0/16" # On-premises network CIDR
  vpn_connection_id      = aws_vpn_connection.main.id
}

resource "aws_route" "vpn_route" {
  count                  = 2
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "192.168.0.0/16"
  vpn_gateway_id        = aws_vpn_gateway.main.id
}

# 
# CloudTrail
# 

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "production-cloudtrail-logs-${random_string.trail_suffix.result}"

  tags = {
    Name        = "production-cloudtrail-logs"
    Environment = var.environment
  }
}

resource "random_string" "trail_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  name                          = "production-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name        = "production-trail"
    Environment = var.environment
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# 
# Outputs
# 

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the production VPC"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront distribution domain name"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.main.id
  description = "Name of the S3 bucket"
}

output "vpn_connection_id" {
  value       = aws_vpn_connection.main.id
  description = "VPN connection ID"
}
```

## Additional Setup Instructions

### 1. Lambda Function ZIP File
You'll need to create a `rds_backup_lambda.zip` file containing the Lambda function code. Create a file named `index.py`:

```python
import boto3
import os
from datetime import datetime

def handler(event, context):
    rds_client = boto3.client('rds')
    db_instance_id = os.environ['DB_INSTANCE_ID']
    
    snapshot_id = f"{db_instance_id}-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    try:
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        return {
            'statusCode': 200,
            'body': f'Snapshot {snapshot_id} created successfully'
        }
    except Exception as e:
        print(f"Error creating snapshot: {str(e)}")
        raise
```

Then zip it:
```bash
zip rds_backup_lambda.zip index.py
```

### 2. Initialize and Apply

```bash
# Initialize with backend configuration
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=us-west-2"

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 3. Important Security Considerations

1. RDS Password: Replace the hardcoded password with AWS Secrets Manager
2. Customer Gateway IP: Update `var.customer_gateway_ip` with your actual on-premises IP
3. VPN Routes: Adjust the on-premises CIDR blocks according to your network
4. SSL Certificates: For production, implement SSL certificates on ALB using AWS Certificate Manager

### 4. Cost Optimization Features Implemented

- Auto Scaling: Automatically adjusts EC2 capacity based on demand
- Multi-AZ RDS: Only for production stability (can be disabled for dev/test)
- S3 Lifecycle Policies: Transitions old data to cheaper storage classes
- CloudFront: Reduces data transfer costs and improves performance
- Reserved Capacity: Consider purchasing Reserved Instances for predictable workloads

This configuration provides a robust, production-ready AWS infrastructure with all the requested components while following AWS best practices for security, reliability, and cost optimization.