# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${terraform.workspace}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw-${terraform.workspace}"
  }
}

resource "aws_subnet" "public" {
  count                   = length(local.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${terraform.workspace}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(local.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${terraform.workspace}"
    Type = "private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${terraform.workspace}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway for private subnets
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${terraform.workspace}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.project_name}-nat-gw-${terraform.workspace}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${terraform.workspace}"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "web_public" {
  name_prefix = "${var.project_name}-web-public-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id

  # SSH access (restricted CIDR)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-public-sg-${terraform.workspace}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "backend" {
  name_prefix = "${var.project_name}-backend-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from web servers
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.web_public.id]
  }

  # Allow SSH from web security group
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.web_public.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-backend-sg-${terraform.workspace}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-database-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id

  # MySQL/PostgreSQL access from backend only
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  tags = {
    Name = "${var.project_name}-database-sg-${terraform.workspace}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name_prefix = "${var.project_name}-ec2-role-${terraform.workspace}-"

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
    Name = "${var.project_name}-ec2-role-${terraform.workspace}"
  }
}

resource "aws_iam_policy" "ec2_cloudwatch_policy" {
  name_prefix = "${var.project_name}-ec2-cloudwatch-${terraform.workspace}-"
  description = "CloudWatch permissions for EC2 instances"

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
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_cloudwatch_policy.arn
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "${var.project_name}-ec2-profile-${terraform.workspace}-"
  role        = aws_iam_role.ec2_role.name
}

# MFA Policy and IAM User
resource "aws_iam_policy" "mfa_required" {
  name_prefix = "${var.project_name}-mfa-required-${terraform.workspace}-"
  description = "Deny all actions when MFA is not present"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptUsersToManageTheirOwnMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_iam_group" "mfa_required" {
  name = "${var.project_name}-mfa-required-${terraform.workspace}"
}

resource "aws_iam_group_policy_attachment" "mfa_required" {
  group      = aws_iam_group.mfa_required.name
  policy_arn = aws_iam_policy.mfa_required.arn
}

resource "aws_iam_user" "example_user" {
  name = "${var.project_name}-example-user-${terraform.workspace}"
}

resource "aws_iam_user_group_membership" "example_user_mfa" {
  user   = aws_iam_user.example_user.name
  groups = [aws_iam_group.mfa_required.name]
}

# S3 bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-website-${terraform.workspace}-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# EC2 Instances
resource "aws_instance" "web" {
  count                  = terraform.workspace == "production" ? 2 : 1
  ami                    = local.amazon_linux_ami_id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public[count.index % length(aws_subnet.public)].id
  vpc_security_group_ids = [aws_security_group.web_public.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.project_name} - ${terraform.workspace} - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Create CloudWatch config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "/aws/ec2/${var.project_name}/${terraform.workspace}/httpd/access",
                "log_stream_name": "{instance_id}"
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "/aws/ec2/${var.project_name}/${terraform.workspace}/httpd/error",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      }
    }
    EOL
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tags = {
    Name = "${var.project_name}-web-${count.index + 1}-${terraform.workspace}"
    Type = "web-server"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "backend" {
  count                  = 1
  ami                    = local.amazon_linux_ami_id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd mysql
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Backend Server - ${var.project_name} - ${terraform.workspace}</h1>" > /var/www/html/index.html
  EOF
  )

  tags = {
    Name = "${var.project_name}-backend-${count.index + 1}-${terraform.workspace}"
    Type = "backend-server"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group-${terraform.workspace}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group-${terraform.workspace}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier            = "${var.project_name}-database-${terraform.workspace}"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = terraform.workspace == "production" ? "db.t3.small" : "db.t3.micro"
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password
  port     = 3306

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = terraform.workspace == "production" ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = terraform.workspace != "production"
  deletion_protection = terraform.workspace == "production"

  performance_insights_enabled = terraform.workspace == "production"

  tags = {
    Name = "${var.project_name}-database-${terraform.workspace}"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${terraform.workspace}"

  tags = {
    Name = "${var.project_name}-alerts-${terraform.workspace}"
  }
}

resource "aws_sns_topic_subscription" "alerts_https" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.sns_https_endpoint
}

# Lambda function for EC2 shutdown
resource "aws_iam_role" "lambda_shutdown_role" {
  name_prefix = "${substr(var.project_name, 0, 10)}-lambda-${terraform.workspace}-"

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
}

resource "aws_iam_policy" "lambda_shutdown_policy" {
  name_prefix = "${substr(var.project_name, 0, 10)}-lambda-policy-${terraform.workspace}-"

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
          "ec2:DescribeInstances",
          "ec2:StopInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = var.project_name
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_shutdown" {
  role       = aws_iam_role.lambda_shutdown_role.name
  policy_arn = aws_iam_policy.lambda_shutdown_policy.arn
}

resource "aws_lambda_function" "ec2_shutdown" {
  filename      = "lambda_shutdown.zip"
  function_name = "${var.project_name}-ec2-shutdown-${terraform.workspace}"
  role          = aws_iam_role.lambda_shutdown_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 60

  source_code_hash = data.archive_file.lambda_shutdown.output_base64sha256

  environment {
    variables = {
      PROJECT_TAG = var.project_name
    }
  }

  tags = {
    Name = "${var.project_name}-ec2-shutdown-${terraform.workspace}"
  }
}

# Create the Lambda function code
resource "local_file" "lambda_shutdown_code" {
  filename = "lambda_function.py"
  content  = <<EOF
import json
import boto3
import os

def lambda_handler(event, context):
    """
    Lambda function to stop EC2 instances tagged with Project = X at 8 PM IST daily
    Cron schedule: cron(30 14 * * ? *) = 20:00 Asia/Kolkata = 14:30 UTC
    """
    
    ec2 = boto3.client('ec2')
    project_tag = os.environ.get('PROJECT_TAG', 'X')
    
    try:
        # Find instances with the specified project tag
        response = ec2.describe_instances(
            Filters=[
                {
                    'Name': 'tag:Project',
                    'Values': [project_tag]
                },
                {
                    'Name': 'instance-state-name',
                    'Values': ['running']
                }
            ]
        )
        
        instances_to_stop = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instances_to_stop.append(instance['InstanceId'])
        
        if instances_to_stop:
            # Stop the instances
            ec2.stop_instances(InstanceIds=instances_to_stop)
            print(f"Successfully stopped instances: {instances_to_stop}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully stopped {len(instances_to_stop)} instances',
                    'instances': instances_to_stop
                })
            }
        else:
            print("No running instances found with the specified project tag")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No running instances found to stop'
                })
            }
            
    except Exception as e:
        print(f"Error stopping instances: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Error stopping instances: {str(e)}'
            })
        }
EOF
}

data "archive_file" "lambda_shutdown" {
  type        = "zip"
  source_file = local_file.lambda_shutdown_code.filename
  output_path = "lambda_shutdown.zip"

  depends_on = [local_file.lambda_shutdown_code]
}

# EventBridge rule for Lambda scheduling
resource "aws_cloudwatch_event_rule" "lambda_shutdown_schedule" {
  name                = "${var.project_name}-lambda-shutdown-schedule-${terraform.workspace}"
  description         = "Trigger Lambda to stop EC2 instances at 8 PM IST daily"
  schedule_expression = var.lambda_shutdown_schedule

  tags = {
    Name = "${var.project_name}-lambda-shutdown-schedule-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_event_target" "lambda_shutdown_target" {
  rule      = aws_cloudwatch_event_rule.lambda_shutdown_schedule.name
  target_id = "LambdaShutdownTarget"
  arn       = aws_lambda_function.ec2_shutdown.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_shutdown.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_shutdown_schedule.arn
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend_app" {
  name              = "/aws/ec2/${var.project_name}/${terraform.workspace}/httpd/access"
  retention_in_days = terraform.workspace == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-backend-app-logs-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_log_group" "backend_error" {
  name              = "/aws/ec2/${var.project_name}/${terraform.workspace}/httpd/error"
  retention_in_days = terraform.workspace == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-backend-error-logs-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.ec2_shutdown.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-lambda-logs-${terraform.workspace}"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  count               = length(aws_instance.web)
  alarm_name          = "${var.project_name}-web-${count.index + 1}-cpu-high-${terraform.workspace}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web[count.index].id
  }

  tags = {
    Name = "${var.project_name}-web-${count.index + 1}-cpu-alarm-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check" {
  count               = length(aws_instance.web)
  alarm_name          = "${var.project_name}-web-${count.index + 1}-status-check-${terraform.workspace}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 status check"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web[count.index].id
  }

  tags = {
    Name = "${var.project_name}-web-${count.index + 1}-status-alarm-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high-${terraform.workspace}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-rds-cpu-alarm-${terraform.workspace}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "${var.project_name}-rds-free-storage-low-${terraform.workspace}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-rds-storage-alarm-${terraform.workspace}"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "website_bucket_name" {
  description = "Name of the S3 website bucket"
  value       = aws_s3_bucket.website.id
}

output "website_url" {
  description = "URL of the static website"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "web_instance_ids" {
  description = "IDs of the web server instances"
  value       = aws_instance.web[*].id
}

output "web_public_ips" {
  description = "Public IP addresses of web servers"
  value       = aws_instance.web[*].public_ip
}

output "backend_instance_id" {
  description = "ID of the backend server instance"
  value       = aws_instance.backend[0].id
}

output "backend_private_ip" {
  description = "Private IP address of backend server"
  value       = aws_instance.backend[0].private_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda shutdown function"
  value       = aws_lambda_function.ec2_shutdown.function_name
}