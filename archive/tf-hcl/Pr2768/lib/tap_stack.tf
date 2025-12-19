# ================================
# VARIABLES
# ================================

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8"

  validation {
    condition     = can(cidrhost(var.allowed_ssh_cidr, 0))
    error_message = "The allowed_ssh_cidr must be a valid CIDR block."
  }
}

variable "sns_https_endpoint" {
  description = "HTTPS endpoint for SNS notifications"
  type        = string
  default     = "https://example.com/webhook"

  validation {
    condition     = can(regex("^https://", var.sns_https_endpoint))
    error_message = "SNS endpoint must start with https://."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"

  validation {
    condition     = var.instance_type == "t2.micro"
    error_message = "Only t2.micro instance type is allowed."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "changeme123!"
  sensitive   = true
}

# ================================
# DATA SOURCES
# ================================

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

data "aws_caller_identity" "current" {}

# ================================
# NETWORKING
# ================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${terraform.workspace}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${terraform.workspace}-igw"
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${terraform.workspace}-public-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${terraform.workspace}-private-${count.index + 1}"
    Type = "Private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${terraform.workspace}-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${terraform.workspace}-private-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ================================
# SECURITY GROUPS
# ================================

resource "aws_security_group" "web" {
  name_prefix = "${terraform.workspace}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access from allowed CIDR"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${terraform.workspace}-web-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${terraform.workspace}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL access from web servers"
  }

  tags = {
    Name = "${terraform.workspace}-db-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ================================
# IAM ROLES AND POLICIES
# ================================

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name_prefix = "${terraform.workspace}-ec2-"

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
    Name = "${terraform.workspace}-ec2-role"
  }
}

resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name_prefix = "${terraform.workspace}-ec2-cloudwatch-"
  role        = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "${terraform.workspace}-ec2-"
  role        = aws_iam_role.ec2_role.name

  tags = {
    Name = "${terraform.workspace}-ec2-profile"
  }
}

# MFA enforcement policy and group
resource "aws_iam_policy" "mfa_required" {
  name_prefix = "${terraform.workspace}-mfa-required-"
  description = "Policy that enforces MFA for all actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptUsersWhoSignedInWithMFA"
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

  tags = {
    Name = "${terraform.workspace}-mfa-required-policy"
  }
}

resource "aws_iam_group" "mfa_required" {
  name = "${terraform.workspace}-mfa-required-group"
}

resource "aws_iam_group_policy_attachment" "mfa_required" {
  group      = aws_iam_group.mfa_required.name
  policy_arn = aws_iam_policy.mfa_required.arn
}

# Example IAM user
resource "aws_iam_user" "example_user" {
  name = "${terraform.workspace}-example-user"

  tags = {
    Name = "${terraform.workspace}-example-user"
  }
}

resource "aws_iam_group_membership" "mfa_required" {
  name = "${terraform.workspace}-mfa-required-membership"

  users = [
    aws_iam_user.example_user.name
  ]

  group = aws_iam_group.mfa_required.name
}

# Lambda execution role
resource "aws_iam_role" "lambda_shutdown_role" {
  name_prefix = "${terraform.workspace}-lambda-shutdown-"

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
    Name = "${terraform.workspace}-lambda-shutdown-role"
  }
}

resource "aws_iam_role_policy" "lambda_shutdown_policy" {
  name_prefix = "${terraform.workspace}-lambda-shutdown-"
  role        = aws_iam_role.lambda_shutdown_role.id

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
        Resource = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:*"
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
            "ec2:ResourceTag/Project" = "X"
          }
        }
      }
    ]
  })
}

# ================================
# STORAGE (S3)
# ================================

resource "aws_s3_bucket" "frontend" {
  bucket_prefix = "${terraform.workspace}-frontend-"

  tags = {
    Name = "${terraform.workspace}-frontend-bucket"
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Note: S3 bucket policy removed due to organization-level public access restrictions
# Frontend content can be served via CloudFront or other CDN solutions

# Sample index.html
resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "index.html"
  content      = "<html><body><h1>Hello from ${terraform.workspace}!</h1></body></html>"
  content_type = "text/html"

  tags = {
    Name = "${terraform.workspace}-index-html"
  }
}

# ================================
# COMPUTE (EC2)
# ================================

resource "aws_key_pair" "main" {
  key_name_prefix = "${terraform.workspace}-key-"
  public_key      = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC4SgM2RvDwNeiQl/rC6BNBIoRzLLBX49Yoirt0mEqt/cL7JJPsj75V8Qwh2iJ6AyjaA9NcOx5r3E9J2uCHbvYzPGElQvQxeLLuYTLX69mMorIgEbk7begw7/rv5IWpyoUjHeJMaICVW+UwC+POMQmPC0KrqjJP++GNgmOEaERKW5cfMT50w9KERT+s6sB+DZ+npTpOOqIyJduk3yCPEGiTrel5oE0p1UqnIRzF2P90rtOgi5gAjtHMLWxR8tla6qf5uKgm1ND1csprXqt0SS8cMw99oevHIIWfwzvw0LK78ElQfXX9OWsQL7sTgHqkzgHYAkLHc+mNS6BGJ6GvfDEZ terraform@example.com"

  tags = {
    Name = "${terraform.workspace}-keypair"
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true

    tags = {
      Name = "${terraform.workspace}-web-root-volume"
    }
  }

  user_data_base64 = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server - ${terraform.workspace}</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch logs
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "/aws/ec2/${terraform.workspace}/httpd/access",
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
    Name = "${terraform.workspace}-web-server"
  }
}

# ================================
# DATABASE (RDS)
# ================================

resource "aws_db_subnet_group" "main" {
  name       = "${terraform.workspace}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${terraform.workspace}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${terraform.workspace}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "webapp"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
  deletion_protection = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  tags = {
    Name = "${terraform.workspace}-database"
  }
}

# ================================
# MONITORING (CloudWatch)
# ================================

# Log Groups
resource "aws_cloudwatch_log_group" "ec2_httpd_access" {
  name              = "/aws/ec2/${terraform.workspace}/httpd/access"
  retention_in_days = 14

  tags = {
    Name = "${terraform.workspace}-httpd-access-logs"
  }
}

resource "aws_cloudwatch_log_group" "lambda_shutdown" {
  name              = "/aws/lambda/${terraform.workspace}-shutdown"
  retention_in_days = 14

  tags = {
    Name = "${terraform.workspace}-lambda-shutdown-logs"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${terraform.workspace}-alerts"

  tags = {
    Name = "${terraform.workspace}-alerts-topic"
  }
}

resource "aws_sns_topic_subscription" "https_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.sns_https_endpoint

  depends_on = [aws_sns_topic.alerts]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${terraform.workspace}-ec2-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name = "${terraform.workspace}-ec2-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check" {
  alarm_name          = "${terraform.workspace}-ec2-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors ec2 status check"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name = "${terraform.workspace}-ec2-status-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${terraform.workspace}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${terraform.workspace}-rds-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "${terraform.workspace}-rds-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${terraform.workspace}-rds-storage-alarm"
  }
}

# ================================
# LAMBDA SHUTDOWN JOB
# ================================

resource "aws_lambda_function" "shutdown" {
  filename         = "shutdown.zip"
  function_name    = "${terraform.workspace}-ec2-shutdown"
  role             = aws_iam_role.lambda_shutdown_role.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.shutdown_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = 60

  tags = {
    Name = "${terraform.workspace}-shutdown-lambda"
  }

  depends_on = [
    aws_iam_role_policy.lambda_shutdown_policy,
    aws_cloudwatch_log_group.lambda_shutdown
  ]
}

data "archive_file" "shutdown_lambda" {
  type        = "zip"
  output_path = "shutdown.zip"

  source {
    content  = <<EOF
import boto3
import json
from datetime import datetime

def lambda_handler(event, context):
    """
    Stop EC2 instances tagged with Project = 'X'
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    
    try:
        # Get instances with Project = 'X' tag that are running
        response = ec2.describe_instances(
            Filters=[
                {
                    'Name': 'tag:Project',
                    'Values': ['X']
                },
                {
                    'Name': 'instance-state-name',
                    'Values': ['running']
                }
            ]
        )
        
        instance_ids = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_ids.append(instance['InstanceId'])
        
        if instance_ids:
            # Stop the instances
            ec2.stop_instances(InstanceIds=instance_ids)
            print(f"Stopped instances: {instance_ids}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully stopped {len(instance_ids)} instances',
                    'instances': instance_ids
                })
            }
        else:
            print("No running instances found with Project = 'X' tag")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No running instances found to stop'
                })
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
EOF
    filename = "index.py"
  }
}

# EventBridge rule for 8 PM IST (2:30 PM UTC)
resource "aws_cloudwatch_event_rule" "shutdown_schedule" {
  name                = "${terraform.workspace}-shutdown-schedule"
  description         = "Trigger Lambda to stop EC2 instances at 8 PM IST daily"
  schedule_expression = "cron(30 14 * * ? *)" # 8 PM IST = 2:30 PM UTC

  tags = {
    Name = "${terraform.workspace}-shutdown-schedule"
  }
}

resource "aws_cloudwatch_event_target" "shutdown_lambda" {
  rule      = aws_cloudwatch_event_rule.shutdown_schedule.name
  target_id = "ShutdownLambdaTarget"
  arn       = aws_lambda_function.shutdown.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shutdown.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.shutdown_schedule.arn
}

# ================================
# OUTPUTS
# ================================

output "website_url" {
  description = "URL of the static website"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "web_server_public_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_function_name" {
  description = "Name of the shutdown Lambda function"
  value       = aws_lambda_function.shutdown.function_name
}