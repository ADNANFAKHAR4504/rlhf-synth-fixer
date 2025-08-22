I'll create a comprehensive Terraform configuration for your high availability AWS infrastructure. This will be a production-ready setup with all the components you've specified.

```hcl
# main.tf

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "zone-name"
    values = ["us-east-2a", "us-east-2b", "us-east-2c"]
  }
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Local values for common tags
locals {
  common_tags = {
    environment = "production"
    purpose     = "high-availability"
    managed_by  = "terraform"
  }
}

# VPC
resource "aws_vpc" "prod_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "prod-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = merge(local.common_tags, {
    Name = "prod-igw"
  })
}

# Public Subnets
resource "aws_subnet" "prod_public_subnets" {
  count                   = 3
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "prod-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "prod_private_subnets" {
  count             = 3
  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "prod-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "prod_nat_eips" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "prod-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.prod_igw]
}

# NAT Gateways
resource "aws_nat_gateway" "prod_nat_gateways" {
  count         = 3
  allocation_id = aws_eip.prod_nat_eips[count.index].id
  subnet_id     = aws_subnet.prod_public_subnets[count.index].id

  tags = merge(local.common_tags, {
    Name = "prod-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.prod_igw]
}

# Route Table for Public Subnets
resource "aws_route_table" "prod_public_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "prod-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "prod_private_rt" {
  count  = 3
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.prod_nat_gateways[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "prod-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "prod_public_rta" {
  count          = 3
  subnet_id      = aws_subnet.prod_public_subnets[count.index].id
  route_table_id = aws_route_table.prod_public_rt.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "prod_private_rta" {
  count          = 3
  subnet_id      = aws_subnet.prod_private_subnets[count.index].id
  route_table_id = aws_route_table.prod_private_rt[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "prod_alb_sg" {
  name        = "prod-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.prod_vpc.id

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

  tags = merge(local.common_tags, {
    Name = "prod-alb-sg"
  })
}

# Security Group for EC2 instances
resource "aws_security_group" "prod_ec2_sg" {
  name        = "prod-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "prod-ec2-sg"
  })
}

# Security Group for RDS
resource "aws_security_group" "prod_rds_sg" {
  name        = "prod-rds-sg"
  description = "Security group for RDS MySQL"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "prod-rds-sg"
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "prod_ec2_role" {
  name = "prod-ec2-role"

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

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "prod_ec2_policy" {
  name = "prod-ec2-policy"
  role = aws_iam_role.prod_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.prod_s3_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand"
        ]
        Resource = "*"
      },
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

# IAM Instance Profile
resource "aws_iam_instance_profile" "prod_ec2_profile" {
  name = "prod-ec2-profile"
  role = aws_iam_role.prod_ec2_role.name

  tags = local.common_tags
}

# Launch Template
resource "aws_launch_template" "prod_launch_template" {
  name_prefix   = "prod-launch-template-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"

  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.prod_ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Production Server - $(hostname -f)</h1>" > /var/www/html/index.html
              # Install CloudWatch agent
              yum install -y amazon-cloudwatch-agent
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "prod-web-server"
    })
  }

  tags = merge(local.common_tags, {
    Name = "prod-launch-template"
  })
}

# Application Load Balancer
resource "aws_lb" "prod_alb" {
  name               = "prod-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.prod_alb_sg.id]
  subnets            = aws_subnet.prod_public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "prod-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "prod_tg" {
  name     = "prod-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.prod_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "prod-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "prod_listener" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_tg.arn
  }

  tags = local.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "prod_asg" {
  name                = "prod-asg"
  vpc_zone_identifier = aws_subnet.prod_private_subnets[*].id
  target_group_arns   = [aws_lb_target_group.prod_tg.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 6
  desired_capacity = 3

  launch_template {
    id      = aws_launch_template.prod_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "prod-asg-instance"
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

# Auto Scaling Policies
resource "aws_autoscaling_policy" "prod_scale_up" {
  name                   = "prod-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.prod_asg.name

  tags = local.common_tags
}

resource "aws_autoscaling_policy" "prod_scale_down" {
  name                   = "prod-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.prod_asg.name

  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "prod_cpu_high" {
  alarm_name          = "prod-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.prod_scale_up.arn, aws_sns_topic.prod_alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.prod_asg.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "prod_cpu_low" {
  alarm_name          = "prod-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.prod_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.prod_asg.name
  }

  tags = local.common_tags
}

# RDS Subnet Group
resource "aws_db_subnet_group" "prod_db_subnet_group" {
  name       = "prod-db-subnet-group"
  subnet_ids = aws_subnet.prod_private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "prod-db-subnet-group"
  })
}

# RDS MySQL Instance
resource "aws_db_instance" "prod_mysql" {
  identifier             = "prod-mysql"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = "proddb"
  username               = "admin"
  password               = "changeme123!" # In production, use AWS Secrets Manager
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.prod_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.prod_rds_sg.id]

  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "prod-mysql"
  })
}

# S3 Bucket for primary region
resource "aws_s3_bucket" "prod_s3_bucket" {
  bucket = "prod-ha-bucket-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "prod-s3-bucket"
  })
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "prod_s3_versioning" {
  bucket = aws_s3_bucket.prod_s3_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket for replication (us-east-1)
resource "aws_s3_bucket" "prod_s3_replica" {
  provider = aws.replica
  bucket   = "prod-ha-replica-bucket-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "prod-s3-replica-bucket"
  })
}

# S3 Bucket Versioning for replica
resource "aws_s3_bucket_versioning" "prod_s3_replica_versioning" {
  provider = aws.replica
  bucket   = aws_s3_bucket.prod_s3_replica.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "prod_s3_replication_role" {
  name = "prod-s3-replication-role"

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

# IAM Policy for S3 Replication
resource "aws_iam_role_policy" "prod_s3_replication_policy" {
  name = "prod-s3-replication-policy"
  role = aws_iam_role.prod_s3_replication_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.prod_s3_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.prod_s3_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.prod_s3_replica.arn}/*"
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "prod_s3_replication" {
  role   = aws_iam_role.prod_s3_replication_role.arn
  bucket = aws_s3_bucket.prod_s3_bucket.id

  rule {
    id     = "prod-replication-rule"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.prod_s3_replica.arn
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.prod_s3_versioning]
}

# SNS Topic for Alerts
resource "aws_sns_topic" "prod_alerts" {
  name = "prod-alerts"

  tags = merge(local.common_tags, {
    Name = "prod-alerts"
  })
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "prod_cloudtrail_bucket" {
  bucket        = "prod-cloudtrail-bucket-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "prod-cloudtrail-bucket"
  })
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "prod_cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.prod_cloudtrail_bucket.id

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
        Resource = aws_s3_bucket.prod_cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.prod_cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "prod_cloudtrail" {
  name           = "prod-cloudtrail"
  s3_bucket_name = aws_s3_bucket.prod_cloudtrail_bucket.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.prod_s3_bucket.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "prod-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.prod_cloudtrail_bucket_policy]
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "prod_config_recorder" {
  name     = "prod-config-recorder"
  role_arn = aws_iam_role.prod_config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  tags = local.common_tags
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "prod_config_delivery_channel" {
  name           = "prod-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.prod_config_bucket.bucket

  tags = local.common_tags
}

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "prod_config_bucket" {
  bucket        = "prod-config-bucket-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "prod-config-bucket"
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "prod_config_role" {
  name = "prod-config-role"

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

  tags = local.common_tags
}

# IAM Role Policy Attachment for AWS Config
resource "aws_iam_role_policy_attachment" "prod_config_policy" {
  role       = aws_iam_role.prod_config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# IAM Role for Lambda
resource "aws_iam_role" "prod_lambda_role" {
  name = "prod-lambda-role"

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

# IAM Policy for Lambda
resource "aws_iam_role_policy" "prod_lambda_policy" {
  name = "prod-lambda-policy"
  role = aws_iam_role.prod_lambda_role.id

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
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:SetDesiredCapacity",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function for Auto-response
resource "aws_lambda_function" "prod_auto_response" {
  filename         = "lambda_function.zip"
  function_name    = "prod-auto-response"
  role            = aws_iam_role.prod_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"

  tags = merge(local.common_tags, {
    Name = "prod-auto-response"
  })
}

# Archive file for Lambda
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content = <<EOF
import json
import boto3

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Auto-response logic here
    sns = boto3.client('sns')
    
    message = f"Auto-response triggered: {event}"
    
    response = sns.publish(
        TopicArn='${aws_sns_topic.prod_alerts.arn}',
        Message=message,
        Subject='Production Auto-Response Alert'
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Auto-response executed successfully')
    }
EOF
    filename = "index.py"
  }
}

# Route 53 Health Check
resource "aws_route53_health_check" "prod_health_check" {
  fqdn                            = aws_lb.prod_alb.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30
  cloudwatch_alarm_region         = "us-east-2"
  cloudwatch_alarm_name           = "prod-health-check-alarm"
  insufficient_data_health_status = "Failure"

  tags = merge(local.common_tags, {
    Name = "prod-health-check"
  })
}

# Systems Manager Parameter
resource "aws_ssm_parameter" "prod_db_endpoint" {
  name  = "/prod/database/endpoint"
  type  = "String"
  value = aws_db_instance.prod_mysql.endpoint

  tags = merge(local.common_tags, {
    Name = "prod-db-endpoint"
  })
}

# Provider configuration for replica region (add this to your provider.tf if not already present)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
      configuration_aliases = [aws.replica]
    }
  }
}

# Output values
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.prod_alb.dns_name
}

output "rds_endpoint" {
  description = "RDS MySQL endpoint"
  value       = aws_db_instance.prod_mysql.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.prod_s3_bucket.bucket
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.prod_alerts.arn
}
```

You'll also need to add this provider configuration to your `provider.tf` file for the cross-region replication:

```hcl
# Add this to your provider.tf file
provider "aws" {
  alias  = "replica"
  region = "us-east-1"
}
```

## Key Features Implemented

### **High Availability Architecture**
- **Multi-AZ deployment** across us-east-2a, us-east-2b, and us-east-2c
- **Auto Scaling Group** with health checks and automatic scaling policies
- **Application Load Balancer** distributing traffic across multiple AZs
- **RDS Multi-AZ** for database high availability
- **NAT Gateways** in each AZ for redundant internet access

### **Security & Compliance**
- **IAM roles** with least privilege access for EC2, Lambda, Config, and S3 replication
- **Security groups** with restricted access between tiers
- **CloudTrail** logging all API calls to S3
- **AWS Config** for compliance monitoring and configuration drift detection
- **Systems Manager**