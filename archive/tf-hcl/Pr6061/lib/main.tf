# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = false
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/kms-rds-production"
  target_key_id = aws_kms_key.rds.key_id
}

# Secrets Manager for database password
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "secret-db-password-production"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-ecommerce-production"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-ecommerce-production"
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-1-production"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-2-production"
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "subnet-private-1-production"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "subnet-private-2-production"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rtb-public-production"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rtb-private-production"
  }
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "alb-production"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-alb-production"
  }
}

resource "aws_security_group" "ec2" {
  name        = "ec2-production"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-ec2-production"
  }
}

resource "aws_security_group" "rds" {
  name        = "rds-production"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-rds-production"
  }
}

# Security Group Rules
resource "aws_security_group_rule" "alb_ingress" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_egress" {
  type                     = "egress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ec2.id
  security_group_id        = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ec2_ingress" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "ec2_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ec2.id
  security_group_id        = aws_security_group.rds.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "dbsubnetgroup-ecommerce-production"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "dbsubnetgroup-ecommerce-production"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "rds-ecommerce-production"
  engine         = "postgres"
  engine_version = "14"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = "ecommerce"
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "rds-ecommerce-production"
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_cloudwatch" {
  name = "role-ec2-cloudwatch-production"

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
    Name = "role-ec2-cloudwatch-production"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "instanceprofile-ec2-production"
  role = aws_iam_role.ec2_cloudwatch.name

  tags = {
    Name = "instanceprofile-ec2-production"
  }
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# EC2 Instances
resource "aws_instance" "web_1" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public_1.id

  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true
  monitoring                  = true
  disable_api_termination     = false

  tags = {
    Name = "ec2-web-1-production"
  }
}

resource "aws_instance" "web_2" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public_2.id

  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true
  monitoring                  = true
  disable_api_termination     = false

  tags = {
    Name = "ec2-web-2-production"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-ecommerce-production"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "alb-ecommerce-production"
  }
}

resource "aws_lb_target_group" "main" {
  name     = "targetgroup-ecommerce-production"
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

  deregistration_delay = 30

  tags = {
    Name = "targetgroup-ecommerce-production"
  }
}

resource "aws_lb_target_group_attachment" "web_1" {
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.web_1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "web_2" {
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.web_2.id
  port             = 80
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecommerce/application"
  retention_in_days = 30

  tags = {
    Name = "log-group-application-production"
  }
}

resource "aws_cloudwatch_log_group" "error" {
  name              = "/aws/ecommerce/error"
  retention_in_days = 30

  tags = {
    Name = "log-group-error-production"
  }
}

resource "aws_cloudwatch_log_group" "audit" {
  name              = "/aws/ecommerce/audit"
  retention_in_days = 30

  tags = {
    Name = "log-group-audit-production"
  }
}

# Metric Filter for Failed Logins
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "metricfilter-failed-logins-production"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "?failed ?login ?authentication"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "Production/ECommerce"
    value     = "1"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "sns-alerts-production"
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name = "sns-alerts-production"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_1" {
  alarm_name          = "alarm-ec2-cpu-1-production"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when EC2 instance 1 CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web_1.id
  }

  tags = {
    Name = "alarm-ec2-cpu-1-production"
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_2" {
  alarm_name          = "alarm-ec2-cpu-2-production"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when EC2 instance 2 CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web_2.id
  }

  tags = {
    Name = "alarm-ec2-cpu-2-production"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "alarm-rds-connections-production"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 150
  alarm_description   = "Alarm when RDS connections reach 150"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "alarm-rds-connections-production"
  }
}

# Lambda function for custom metrics
resource "aws_iam_role" "lambda_metrics" {
  name = "role-lambda-metrics-production"

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
    Name = "role-lambda-metrics-production"
  }
}

resource "aws_iam_role_policy" "lambda_metrics" {
  name = "policy-lambda-metrics-production"
  role = aws_iam_role.lambda_metrics.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "Production/ECommerce"
          }
        }
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

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_metrics.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

resource "aws_lambda_function" "metrics" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "lambda-metrics-production"
  role             = aws_iam_role.lambda_metrics.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 256
  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      NAMESPACE = "Production/ECommerce"
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_metrics,
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "lambda-metrics-production"
  }
}

# EventBridge Rule for Lambda
resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name                = "eventbridge-lambda-schedule-production"
  description         = "Trigger Lambda function every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name = "eventbridge-lambda-schedule-production"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "LambdaFunction"
  arn       = aws_lambda_function.metrics.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metrics.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}

# Lambda Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "alarm-lambda-errors-production"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  alarm_description   = "Alarm when Lambda error rate exceeds 5%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  metric_query {
    id          = "e1"
    return_data = true
    expression  = "(m1/m2)*100"
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.metrics.function_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.metrics.function_name
      }
    }
  }

  tags = {
    Name = "alarm-lambda-errors-production"
  }
}

# Failed Login Attempts Alarm
resource "aws_cloudwatch_metric_alarm" "failed_logins" {
  alarm_name          = "alarm-failed-logins-production"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedLoginAttempts"
  namespace           = "Production/ECommerce"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alarm when failed login attempts exceed 10 in 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "alarm-failed-logins-production"
  }
}

# ALB Healthy Host Count Alarm
resource "aws_cloudwatch_metric_alarm" "alb_health" {
  alarm_name          = "alarm-alb-health-production"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 2
  alarm_description   = "Alarm when healthy host count drops below 2"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alarm-alb-health-production"
  }
}

# Composite Alarm
resource "aws_cloudwatch_composite_alarm" "infrastructure" {
  alarm_name        = "composite-infrastructure-production"
  alarm_description = "Composite alarm for multiple infrastructure failures"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alerts.arn]

  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.ec2_cpu_1.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.ec2_cpu_2.alarm_name})) AND ALARM(${aws_cloudwatch_metric_alarm.rds_connections.alarm_name})"

  depends_on = [
    aws_cloudwatch_metric_alarm.ec2_cpu_1,
    aws_cloudwatch_metric_alarm.ec2_cpu_2,
    aws_cloudwatch_metric_alarm.rds_connections
  ]

  tags = {
    Name = "composite-infrastructure-production"
  }
}


# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dashboard-ecommerce-production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.web_1.id, { stat = "Average", label = "EC2 Instance 1" }],
            ["...", aws_instance.web_2.id, { stat = "Average", label = "EC2 Instance 2" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "EC2 CPU Utilization"
          start  = "-PT24H"
          annotations = {
            horizontal = [
              {
                label = "Alarm Threshold"
                value = 80
              }
            ]
          }
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.id]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Database Connections"
          start  = "-PT24H"
          annotations = {
            horizontal = [
              {
                label = "Alarm Threshold"
                value = 150
              }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.metrics.function_name, { stat = "Sum", label = "Invocations" }],
            [".", "Errors", ".", ".", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", ".", ".", { stat = "Sum", label = "Throttles" }]
          ]
          view    = "timeSeries"
          stacked = true
          period  = 300
          stat    = "Sum"
          region  = "us-east-1"
          title   = "Lambda Metrics"
          start   = "-PT24H"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Production/ECommerce", "OrderProcessingTime"]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Order Processing Time"
          start  = "-PT24H"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 3
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", aws_lb_target_group.main.arn_suffix, "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "UnHealthyHostCount", ".", ".", ".", "."]
          ]
          view   = "singleValue"
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "ALB Target Health"
          start  = "-PT1H"
        }
      }
    ]
  })
}


# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

output "sg_alb_id" {
  description = "Security group ID for ALB"
  value       = aws_security_group.alb.id
}

output "sg_ec2_id" {
  description = "Security group ID for EC2"
  value       = aws_security_group.ec2.id
}

output "sg_rds_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "ec2_instance_1_id" {
  description = "ID of EC2 instance 1"
  value       = aws_instance.web_1.id
}

output "ec2_instance_2_id" {
  description = "ID of EC2 instance 2"
  value       = aws_instance.web_2.id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = [aws_instance.web_1.id, aws_instance.web_2.id]
}

output "ec2_instance_1_public_ip" {
  description = "Public IP of EC2 instance 1"
  value       = aws_instance.web_1.public_ip
}

output "ec2_instance_2_public_ip" {
  description = "Public IP of EC2 instance 2"
  value       = aws_instance.web_2.public_ip
}

output "ec2_public_ips" {
  description = "List of EC2 public IPs"
  value       = [aws_instance.web_1.public_ip, aws_instance.web_2.public_ip]
}

output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_cloudwatch.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_listener_arn" {
  description = "ARN of the ALB listener"
  value       = aws_lb_listener.main.arn
}

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_db_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.rds.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.rds.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.rds.name
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "log_group_application_name" {
  description = "Name of the application log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "log_group_application_arn" {
  description = "ARN of the application log group"
  value       = aws_cloudwatch_log_group.application.arn
}

output "log_group_error_name" {
  description = "Name of the error log group"
  value       = aws_cloudwatch_log_group.error.name
}

output "log_group_error_arn" {
  description = "ARN of the error log group"
  value       = aws_cloudwatch_log_group.error.arn
}

output "log_group_audit_name" {
  description = "Name of the audit log group"
  value       = aws_cloudwatch_log_group.audit.name
}

output "log_group_audit_arn" {
  description = "ARN of the audit log group"
  value       = aws_cloudwatch_log_group.audit.arn
}

output "metric_filter_name" {
  description = "Name of the metric filter for failed logins"
  value       = aws_cloudwatch_log_metric_filter.failed_logins.name
}

output "alarm_ec2_cpu_1_name" {
  description = "Name of EC2 CPU alarm 1"
  value       = aws_cloudwatch_metric_alarm.ec2_cpu_1.alarm_name
}

output "alarm_ec2_cpu_1_arn" {
  description = "ARN of EC2 CPU alarm 1"
  value       = aws_cloudwatch_metric_alarm.ec2_cpu_1.arn
}

output "alarm_ec2_cpu_2_name" {
  description = "Name of EC2 CPU alarm 2"
  value       = aws_cloudwatch_metric_alarm.ec2_cpu_2.alarm_name
}

output "alarm_ec2_cpu_2_arn" {
  description = "ARN of EC2 CPU alarm 2"
  value       = aws_cloudwatch_metric_alarm.ec2_cpu_2.arn
}

output "alarm_rds_connections_name" {
  description = "Name of RDS connections alarm"
  value       = aws_cloudwatch_metric_alarm.rds_connections.alarm_name
}

output "alarm_rds_connections_arn" {
  description = "ARN of RDS connections alarm"
  value       = aws_cloudwatch_metric_alarm.rds_connections.arn
}

output "alarm_lambda_errors_name" {
  description = "Name of Lambda errors alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
}

output "alarm_lambda_errors_arn" {
  description = "ARN of Lambda errors alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "alarm_failed_logins_name" {
  description = "Name of failed logins alarm"
  value       = aws_cloudwatch_metric_alarm.failed_logins.alarm_name
}

output "alarm_failed_logins_arn" {
  description = "ARN of failed logins alarm"
  value       = aws_cloudwatch_metric_alarm.failed_logins.arn
}

output "alarm_alb_health_name" {
  description = "Name of ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.alb_health.alarm_name
}

output "alarm_alb_health_arn" {
  description = "ARN of ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.alb_health.arn
}

output "composite_alarm_name" {
  description = "Name of the composite alarm"
  value       = aws_cloudwatch_composite_alarm.infrastructure.alarm_name
}

output "composite_alarm_arn" {
  description = "ARN of the composite alarm"
  value       = aws_cloudwatch_composite_alarm.infrastructure.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.alerts.name
}

output "sns_subscription_arn" {
  description = "ARN of the SNS email subscription"
  value       = aws_sns_topic_subscription.email.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.metrics.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.metrics.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_metrics.arn
}

output "lambda_log_group_name" {
  description = "CloudWatch log group for Lambda function"
  value       = "/aws/lambda/${aws_lambda_function.metrics.function_name}"
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.lambda_schedule.name
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.lambda_schedule.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "custom_metric_namespace" {
  description = "Namespace for custom metrics"
  value       = "Production/ECommerce"
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}