### Reasoning Trace
---

Let me break down what we need to create a comprehensive `tap_stack.tf` file for the IoT monitoring system:

1. Variable declarations - for configuration flexibility
2. Resource definitions for all required AWS services
3. Outputs for important resource information
4. Follow AWS best practices with security, tagging, etc.

Let's start by structuring our Terraform file with variables:

```terraform
# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "iot-agriculture"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Team or individual owner of this infrastructure"
  type        = string
  default     = "AgriTech Team"
}

variable "cost_center" {
  description = "Cost center for billing purposes"
  type        = string
  default     = "IOT-123"
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "kinesis_shard_count" {
  description = "Number of shards for the Kinesis Data Stream"
  type        = number
  default     = 25  # Adjusted for 50,000 sensors (200 sensors per shard)
}

variable "dynamodb_read_capacity" {
  description = "Read capacity units for DynamoDB"
  type        = number
  default     = 100
}

variable "dynamodb_write_capacity" {
  description = "Write capacity units for DynamoDB"
  type        = number
  default     = 100
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
  default     = "alerts@example.com"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}
```

Now, let's define common tags that will be applied to all resources:

```terraform
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Application = var.project_name
    ManagedBy   = "terraform"
  }
}
```

Next, let's create the KMS key for encryption:

```terraform
resource "aws_kms_key" "iot_key" {
  description             = "KMS key for IoT data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = local.common_tags
}

resource "aws_kms_alias" "iot_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.iot_key.key_id
}
```

Now, let's create a VPC for our secure networking:

```terraform
# VPC and Networking
resource "aws_vpc" "iot_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-1"
  })
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-2"
  })
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 3)
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-1"
  })
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 4)
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-2"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.iot_vpc.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip_1" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-1"
  })
}

resource "aws_eip" "nat_eip_2" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-2"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "nat_gw_1" {
  allocation_id = aws_eip.nat_eip_1.id
  subnet_id     = aws_subnet.public_subnet_1.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gw-1"
  })
}

resource "aws_nat_gateway" "nat_gw_2" {
  allocation_id = aws_eip.nat_eip_2.id
  subnet_id     = aws_subnet.public_subnet_2.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gw-2"
  })
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table" "private_rt_1" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw_1.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-1"
  })
}

resource "aws_route_table" "private_rt_2" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw_2.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-2"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt_2.id
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.iot_vpc.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private_rt_1.id, aws_route_table.private_rt_2.id]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-dynamodb-endpoint"
  })
}

# Security Groups
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.iot_vpc.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lambda-sg"
  })
}
```

Now, let's create the IAM roles and policies:

```terraform
# IAM Roles and Policies
resource "aws_iam_role" "iot_role" {
  name = "${var.project_name}-iot-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "iot_policy" {
  name        = "${var.project_name}-iot-policy"
  description = "Policy for IoT services"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Effect   = "Allow"
        Resource = aws_kinesis_stream.iot_stream.arn
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.iot_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "iot_policy_attachment" {
  role       = aws_iam_role.iot_role.name
  policy_arn = aws_iam_policy.iot_policy.arn
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  
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

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListShards"
        ]
        Effect   = "Allow"
        Resource = aws_kinesis_stream.iot_stream.arn
      },
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.iot_data.arn
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.iot_key.arn
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.iot_alerts.arn
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}
```

Now, let's create the IoT Core resources:

```terraform
# IoT Core Setup
resource "aws_iot_thing_type" "sensor_type" {
  name = "${var.project_name}-sensor-type"
  
  properties {
    description = "Agriculture IoT sensor"
  }
}

resource "aws_iot_policy" "sensor_policy" {
  name = "${var.project_name}-sensor-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["iot:Connect"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:client/${aws_iot_thing_type.sensor_type.name}-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Publish"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topic/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Subscribe"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topicfilter/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Receive"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topic/sensors/*"]
      }
    ]
  })
}

resource "aws_iot_topic_rule" "sensor_data_rule" {
  name        = "${replace(var.project_name, "-", "_")}_sensor_data_rule"
  description = "Rule for processing sensor data"
  enabled     = true
  sql         = "SELECT * FROM 'sensors/data'"
  sql_version = "2016-03-23"
  
  kinesis {
    role_arn      = aws_iam_role.iot_role.arn
    stream_name   = aws_kinesis_stream.iot_stream.name
    partition_key = "$${topic()}"
  }
  
  tags = local.common_tags
}
```

Now, let's create the Kinesis Data Stream:

```terraform
# Kinesis Data Stream
resource "aws_kinesis_stream" "iot_stream" {
  name             = "${var.project_name}-data-stream"
  shard_count      = var.kinesis_shard_count
  retention_period = 24
  
  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.iot_key.arn
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  tags = local.common_tags
}

# CloudWatch Log Group for Kinesis
resource "aws_cloudwatch_log_group" "kinesis_logs" {
  name              = "/aws/kinesis/${aws_kinesis_stream.iot_stream.name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}
```

Next, let's create the DynamoDB table:

```terraform
# DynamoDB Table
resource "aws_dynamodb_table" "iot_data" {
  name           = "${var.project_name}-data-table"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
  hash_key       = "device_id"
  range_key      = "timestamp"
  
  attribute {
    name = "device_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.iot_key.arn
  }
  
  tags = local.common_tags
}
```

Now, let's create the Lambda functions:

```terraform
# Lambda Functions
resource "aws_lambda_function" "data_processor" {
  function_name = "${var.project_name}-data-processor"
  description   = "Processes IoT sensor data from Kinesis stream"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 60
  memory_size   = 256
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  # This is placeholder code - in a real scenario, you would either
  # use a deployment package or store the code in S3
  filename         = "dummy.zip"
  source_code_hash = filebase64sha256("dummy.zip")
  
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  tags = local.common_tags
}

# Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "kinesis_lambda_mapping" {
  event_source_arn  = aws_kinesis_stream.iot_stream.arn
  function_name     = aws_lambda_function.data_processor.arn
  starting_position = "LATEST"
  batch_size        = 100
  enabled           = true
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.data_processor.function_name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}

# Lambda Dead Letter Queue
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${var.project_name}-lambda-dlq"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 0
  
  kms_master_key_id                 = aws_kms_key.iot_key.id
  kms_data_key_reuse_period_seconds = 300
  
  tags = local.common_tags
}

# Anomaly detection function
resource "aws_lambda_function" "anomaly_detector" {
  function_name = "${var.project_name}-anomaly-detector"
  description   = "Detects anomalies in sensor data"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60
  memory_size   = 512
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  # This is placeholder code - in a real scenario, you would either
  # use a deployment package or store the code in S3
  filename         = "dummy.zip"
  source_code_hash = filebase64sha256("dummy.zip")
  
  tags = local.common_tags
}

# CloudWatch Log Group for Anomaly Detector Lambda
resource "aws_cloudwatch_log_group" "anomaly_detector_logs" {
  name              = "/aws/lambda/${aws_lambda_function.anomaly_detector.function_name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}
```

Now, let's create the EventBridge rule and SNS topic:

```terraform
# EventBridge Rule
resource "aws_cloudwatch_event_rule" "anomaly_detection_schedule" {
  name                = "${var.project_name}-anomaly-detection-schedule"
  description         = "Triggers anomaly detection every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "anomaly_detection_target" {
  rule      = aws_cloudwatch_event_rule.anomaly_detection_schedule.name
  target_id = "anomaly-detector"
  arn       = aws_lambda_function.anomaly_detector.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.anomaly_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.anomaly_detection_schedule.arn
}

# SNS Topic for Alerts
resource "aws_sns_topic" "iot_alerts" {
  name              = "${var.project_name}-alerts"
  kms_master_key_id = aws_kms_key.iot_key.id
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.iot_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

Now, let's create CloudWatch alarms:

```terraform
# CloudWatch Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "kinesis_throttled_records" {
  alarm_name          = "${var.project_name}-kinesis-throttled-records"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteProvisionedThroughputExceeded"
  namespace           = "AWS/Kinesis"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors Kinesis throttled records"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  
  dimensions = {
    StreamName = aws_kinesis_stream.iot_stream.name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.data_processor.function_name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "${var.project_name}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors DynamoDB throttled requests"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  
  dimensions = {
    TableName = aws_dynamodb_table.iot_data.name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "iot_dashboard" {
  dashboard_name = "${var.project_name}-monitoring-dashboard"
  
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
            ["AWS/Kinesis", "IncomingRecords", "StreamName", aws_kinesis_stream.iot_stream.name],
            ["AWS/Kinesis", "WriteProvisionedThroughputExceeded", "StreamName", aws_kinesis_stream.iot_stream.name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Kinesis Stream Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.data_processor.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.data_processor.function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.data_processor.function_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Processor Metrics"
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
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.iot_data.name],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.iot_data.name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity Consumption"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SNS", "NumberOfNotificationsDelivered", "TopicName", "${split(":", aws_sns_topic.iot_alerts.arn)[5]}"],
            ["AWS/SNS", "NumberOfNotificationsFailed", "TopicName", "${split(":", aws_sns_topic.iot_alerts.arn)[5]}"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "SNS Alert Metrics"
        }
      }
    ]
  })
}
```

For QuickSight, we can't fully set it up with Terraform as it requires additional resources and manual setup, but we can create the IAM role for QuickSight:

```terraform
# QuickSight IAM Role
resource "aws_iam_role" "quicksight_role" {
  name = "${var.project_name}-quicksight-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "quicksight.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "quicksight_policy" {
  name        = "${var.project_name}-quicksight-policy"
  description = "Policy for QuickSight to access DynamoDB data"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.iot_data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.iot_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "quicksight_policy_attachment" {
  role       = aws_iam_role.quicksight_role.name
  policy_arn = aws_iam_policy.quicksight_policy.arn
}
```

Finally, let's add the outputs:

```terraform
# Outputs
output "iot_endpoint" {
  description = "IoT Core endpoint"
  value       = "data.aws_iot_endpoint.endpoint.endpoint_address"
}

output "kinesis_stream_name" {
  description = "Name of the Kinesis Data Stream"
  value       = aws_kinesis_stream.iot_stream.name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.iot_data.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.iot_alerts.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch Dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.iot_dashboard.dashboard_name}"
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    data_processor   = aws_lambda_function.data_processor.function_name
    anomaly_detector = aws_lambda_function.anomaly_detector.function_name
  }
}
```

Let's compile all of this into a single file, ensuring we've covered all requirements from the prompt.

Let me make a quick review of our Terraform code to see if there's anything missing:

1. IoT Core for secure device connectivity - Done
2. IAM Roles and Policies - Done
3. Kinesis Data Stream - Done
4. Lambda Functions for processing - Done
5. DynamoDB Table - Done
6. EventBridge Rule - Done
7. SNS Topic for alerts - Done
8. CloudWatch Metrics and Alarms - Done
9. QuickSight (IAM Role for access) - Done (partial, due to Terraform limitations)
10. KMS Key for encryption - Done
11. VPC - Done

I believe we've covered all the requirements. Let me combine all sections into one complete `tap_stack.tf` file.

I need to fix a small issue with the IoT endpoint output. Instead of referring to an undefined data source, I should use the actual endpoint API:

```terraform
data "aws_iot_endpoint" "endpoint" {
  endpoint_type = "iot:Data-ATS"
}
```

Let me combine all the code segments into one comprehensive file.
### Answer 
---

# IoT Monitoring System Deployment with Terraform

I'll create a comprehensive `tap_stack.tf` file for a secure, highly available IoT monitoring system that can handle 50,000 IoT sensors for an agriculture firm.

```terraform
# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "agri-iot-monitor"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Team or individual owner of this infrastructure"
  type        = string
  default     = "AgriTech Team"
}

variable "cost_center" {
  description = "Cost center for billing purposes"
  type        = string
  default     = "AGRI-123"
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "kinesis_shard_count" {
  description = "Number of shards for the Kinesis Data Stream"
  type        = number
  default     = 25  # Configured for 50,000 sensors (approximately 200 sensors per shard)
}

variable "dynamodb_read_capacity" {
  description = "Read capacity units for DynamoDB"
  type        = number
  default     = 100
}

variable "dynamodb_write_capacity" {
  description = "Write capacity units for DynamoDB"
  type        = number
  default     = 100
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
  default     = "alerts@agriculture-company.com"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "sensor_data_ttl_days" {
  description = "Time to live for sensor data in DynamoDB (days)"
  type        = number
  default     = 90
}

# Common tags for all resources
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Application = var.project_name
    ManagedBy   = "terraform"
  }
}

# Data source to get the IoT endpoint
data "aws_iot_endpoint" "endpoint" {
  endpoint_type = "iot:Data-ATS"
}

# KMS key for encryption
resource "aws_kms_key" "iot_key" {
  description             = "KMS key for IoT data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = local.common_tags
}

resource "aws_kms_alias" "iot_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.iot_key.key_id
}

# VPC and Networking
resource "aws_vpc" "iot_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-1"
  })
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-2"
  })
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 3)
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-1"
  })
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.iot_vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 4)
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-2"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.iot_vpc.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip_1" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-1"
  })
}

resource "aws_eip" "nat_eip_2" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-2"
  })
}

# NAT Gateway for private subnets
resource "aws_nat_gateway" "nat_gw_1" {
  allocation_id = aws_eip.nat_eip_1.id
  subnet_id     = aws_subnet.public_subnet_1.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gw-1"
  })
}

resource "aws_nat_gateway" "nat_gw_2" {
  allocation_id = aws_eip.nat_eip_2.id
  subnet_id     = aws_subnet.public_subnet_2.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gw-2"
  })
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table" "private_rt_1" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw_1.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-1"
  })
}

resource "aws_route_table" "private_rt_2" {
  vpc_id = aws_vpc.iot_vpc.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw_2.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-2"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt_2.id
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.iot_vpc.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private_rt_1.id, aws_route_table.private_rt_2.id]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-dynamodb-endpoint"
  })
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.iot_vpc.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lambda-sg"
  })
}

# IAM Roles and Policies
resource "aws_iam_role" "iot_role" {
  name = "${var.project_name}-iot-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "iot_policy" {
  name        = "${var.project_name}-iot-policy"
  description = "Policy for IoT services"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Effect   = "Allow"
        Resource = aws_kinesis_stream.iot_stream.arn
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.iot_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "iot_policy_attachment" {
  role       = aws_iam_role.iot_role.name
  policy_arn = aws_iam_policy.iot_policy.arn
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  
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

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListShards"
        ]
        Effect   = "Allow"
        Resource = aws_kinesis_stream.iot_stream.arn
      },
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.iot_data.arn
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.iot_key.arn
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.iot_alerts.arn
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IoT Core Setup
resource "aws_iot_thing_type" "sensor_type" {
  name = "${var.project_name}-sensor-type"
  
  properties {
    description = "Agriculture IoT sensor"
  }
}

resource "aws_iot_policy" "sensor_policy" {
  name = "${var.project_name}-sensor-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["iot:Connect"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:client/${aws_iot_thing_type.sensor_type.name}-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Publish"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topic/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Subscribe"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topicfilter/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Receive"]
        Resource = ["arn:aws:iot:${var.aws_region}:*:topic/sensors/*"]
      }
    ]
  })
}

resource "aws_iot_topic_rule" "sensor_data_rule" {
  name        = "${replace(var.project_name, "-", "_")}_sensor_data_rule"
  description = "Rule for processing sensor data"
  enabled     = true
  sql         = "SELECT * FROM 'sensors/data'"
  sql_version = "2016-03-23"
  
  kinesis {
    role_arn      = aws_iam_role.iot_role.arn
    stream_name   = aws_kinesis_stream.iot_stream.name
    partition_key = "$${topic()}"
  }
  
  tags = local.common_tags
}

# Kinesis Data Stream
resource "aws_kinesis_stream" "iot_stream" {
  name             = "${var.project_name}-data-stream"
  shard_count      = var.kinesis_shard_count
  retention_period = 24  # Hours
  
  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.iot_key.arn
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  tags = local.common_tags
}

# CloudWatch Log Group for Kinesis
resource "aws_cloudwatch_log_group" "kinesis_logs" {
  name              = "/aws/kinesis/${aws_kinesis_stream.iot_stream.name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}

# DynamoDB Table
resource "aws_dynamodb_table" "iot_data" {
  name           = "${var.project_name}-data-table"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
  hash_key       = "device_id"
  range_key      = "timestamp"
  
  attribute {
    name = "device_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "sensor_type"
    type = "S"
  }
  
  attribute {
    name = "location_id"
    type = "S"
  }
  
  global_secondary_index {
    name               = "SensorTypeIndex"
    hash_key           = "sensor_type"
    range_key          = "timestamp"
    write_capacity     = 20
    read_capacity      = 20
    projection_type    = "INCLUDE"
    non_key_attributes = ["device_id", "value", "status"]
  }
  
  global_secondary_index {
    name               = "LocationIndex"
    hash_key           = "location_id"
    range_key          = "timestamp"
    write_capacity     = 20
    read_capacity      = 20
    projection_type    = "INCLUDE"
    non_key_attributes = ["device_id", "sensor_type", "value", "status"]
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.iot_key.arn
  }
  
  tags = local.common_tags
}

# Lambda Functions
resource "aws_lambda_function" "data_processor" {
  function_name = "${var.project_name}-data-processor"
  description   = "Processes IoT sensor data from Kinesis stream"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 60
  memory_size   = 256
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
      TTL_DAYS       = var.sensor_data_ttl_days
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  # This is placeholder code - in a real scenario, you would use actual code
  filename         = "lambda_function.zip"
  source_code_hash = filebase64sha256("lambda_function.zip")
  
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  tags = local.common_tags
}

# Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "kinesis_lambda_mapping" {
  event_source_arn  = aws_kinesis_stream.iot_stream.arn
  function_name     = aws_lambda_function.data_processor.arn
  starting_position = "LATEST"
  batch_size        = 100
  maximum_retry_attempts = 3
  enabled           = true
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.data_processor.function_name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}

# Lambda Dead Letter Queue
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${var.project_name}-lambda-dlq"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 0
  
  kms_master_key_id                 = aws_kms_key.iot_key.id
  kms_data_key_reuse_period_seconds = 300
  
  tags = local.common_tags
}

# Anomaly detection function
resource "aws_lambda_function" "anomaly_detector" {
  function_name = "${var.project_name}-anomaly-detector"
  description   = "Detects anomalies in sensor data"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60
  memory_size   = 512
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  # This is placeholder code - in a real scenario, you would use actual code
  filename         = "anomaly_detector.zip"
  source_code_hash = filebase64sha256("anomaly_detector.zip")
  
  tags = local.common_tags
}

# CloudWatch Log Group for Anomaly Detector Lambda
resource "aws_cloudwatch_log_group" "anomaly_detector_logs" {
  name              = "/aws/lambda/${aws_lambda_function.anomaly_detector.function_name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn
  
  tags = local.common_tags
}

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "anomaly_detection_schedule" {
  name                = "${var.project_name}-anomaly-detection-schedule"
  description         = "Triggers anomaly detection every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "anomaly_detection_target" {
  rule      = aws_cloudwatch_event_rule.anomaly_detection_schedule.name
  target_id = "anomaly-detector"
  arn       = aws_lambda_function.anomaly_detector.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.anomaly_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.anomaly_detection_schedule.arn
}

# SNS Topic for Alerts
resource "aws_sns_topic" "iot_alerts" {
  name              = "${var.project_name}-alerts"
  kms_master_key_id = aws_kms_key.iot_key.id
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.iot_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "kinesis_throttled_records" {
  alarm_name          = "${var.project_name}-kinesis-throttled-records"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteProvisionedThroughputExceeded"
  namespace           = "AWS/Kinesis"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors Kinesis throttled records"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  
  dimensions = {
    StreamName = aws_kinesis_stream.iot_stream.name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.data_processor.function_name
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "${var.project_name}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10