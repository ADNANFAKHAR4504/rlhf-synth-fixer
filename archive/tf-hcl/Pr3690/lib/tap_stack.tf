# tap_stack.tf - Complete IoT Monitoring System for Agriculture

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
  default     = "AGRI-IOT-001"
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "kinesis_shard_count" {
  description = "Number of shards for the Kinesis Data Stream"
  type        = number
  default     = 50 # For 50,000 sensors (1,000 sensors per shard)
}

variable "dynamodb_read_capacity" {
  description = "Read capacity units for DynamoDB"
  type        = number
  default     = 500
}

variable "dynamodb_write_capacity" {
  description = "Write capacity units for DynamoDB"
  type        = number
  default     = 500
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
  default     = "alerts@agriculture-company.com"
}

variable "sensor_data_ttl_days" {
  description = "Time to live for sensor data in DynamoDB (days)"
  type        = number
  default     = 90
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
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

# Data source for current account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Create Lambda function code as temporary files and zip them
resource "local_file" "data_processor_code" {
  content  = <<EOF
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    const tableName = process.env.DYNAMODB_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    const ttlDays = parseInt(process.env.TTL_DAYS || '90');
    
    const records = event.Records || [];
    const processedRecords = [];
    
    for (const record of records) {
        try {
            // Decode Kinesis data
            const payload = JSON.parse(
                Buffer.from(record.kinesis.data, 'base64').toString('utf-8')
            );
            
            // Add metadata
            const item = {
                ...payload,
                device_id: payload.device_id || record.kinesis.partitionKey,
                timestamp: Date.now(),
                expires_at: Math.floor(Date.now() / 1000) + (ttlDays * 24 * 60 * 60),
                processed_at: new Date().toISOString()
            };
            
            // Store in DynamoDB
            await dynamodb.put({
                TableName: tableName,
                Item: item
            }).promise();
            
            // Check for anomalies
            if (payload.temperature > 40 || payload.humidity > 95) {
                await sns.publish({
                    TopicArn: snsTopicArn,
                    Subject: 'IoT Sensor Anomaly Detected',
                    Message: JSON.stringify({
                        device_id: item.device_id,
                        anomaly_type: 'threshold_exceeded',
                        values: {
                            temperature: payload.temperature,
                            humidity: payload.humidity
                        }
                    })
                }).promise();
            }
            
            processedRecords.push(item);
        } catch (error) {
            console.error('Error processing record:', error);
            throw error;
        }
    }
    
    return {
        statusCode: 200,
        batchItemFailures: [],
        processedRecords: processedRecords.length
    };
};
EOF
  filename = "${path.module}/data_processor.js"
}

resource "local_file" "anomaly_detector_code" {
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    table_name = os.environ['DYNAMODB_TABLE']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    
    table = dynamodb.Table(table_name)
    
    # Calculate time range for analysis (last 5 minutes)
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=5)
    
    # Query recent sensor data
    try:
        # Scan for recent data (in production, use GSI for better performance)
        response = table.scan(
            FilterExpression='#ts > :start_time',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':start_time': int(start_time.timestamp() * 1000)}
        )
        
        items = response.get('Items', [])
        
        # Analyze data for anomalies
        anomalies = []
        metrics = {
            'temperature': [],
            'humidity': [],
            'soil_moisture': []
        }
        
        for item in items:
            # Collect metrics
            if 'temperature' in item:
                metrics['temperature'].append(float(item['temperature']))
            if 'humidity' in item:
                metrics['humidity'].append(float(item['humidity']))
            if 'soil_moisture' in item:
                metrics['soil_moisture'].append(float(item['soil_moisture']))
            
            # Check for anomalies
            if 'temperature' in item and (float(item['temperature']) > 45 or float(item['temperature']) < -10):
                anomalies.append({
                    'device_id': item['device_id'],
                    'type': 'extreme_temperature',
                    'value': float(item['temperature']),
                    'timestamp': item['timestamp']
                })
            
            if 'humidity' in item and float(item['humidity']) > 98:
                anomalies.append({
                    'device_id': item['device_id'],
                    'type': 'extreme_humidity',
                    'value': float(item['humidity']),
                    'timestamp': item['timestamp']
                })
        
        # Send CloudWatch metrics
        if metrics['temperature']:
            cloudwatch.put_metric_data(
                Namespace='IoTMonitoring',
                MetricData=[
                    {
                        'MetricName': 'AverageTemperature',
                        'Value': sum(metrics['temperature']) / len(metrics['temperature']),
                        'Unit': 'None'
                    }
                ]
            )
        
        # Send alerts for anomalies
        if anomalies:
            message = {
                'anomalies_detected': len(anomalies),
                'time_range': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat()
                },
                'anomalies': anomalies[:10]  # Limit to first 10
            }
            
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='IoT Anomaly Detection Alert',
                Message=json.dumps(message, default=str)
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'analyzed_records': len(items),
                'anomalies_found': len(anomalies)
            })
        }
        
    except Exception as e:
        print(f"Error in anomaly detection: {str(e)}")
        raise e
EOF
  filename = "${path.module}/anomaly_detector.py"
}

# Create ZIP files for Lambda functions
data "archive_file" "data_processor_zip" {
  type        = "zip"
  source_file = local_file.data_processor_code.filename
  output_path = "${path.module}/data_processor.zip"
  depends_on  = [local_file.data_processor_code]
}

data "archive_file" "anomaly_detector_zip" {
  type        = "zip"
  source_file = local_file.anomaly_detector_code.filename
  output_path = "${path.module}/anomaly_detector.zip"
  depends_on  = [local_file.anomaly_detector_code]
}

# KMS key for encryption
resource "aws_kms_key" "iot_key" {
  description             = "KMS key for IoT data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = [
              "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/iot/${var.project_name}/errors",
              "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/kinesis/${var.project_name}-data-stream",
              "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-data-processor",
              "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-anomaly-detector"
            ]
          }
        }
      },
      {
        Sid    = "Allow Kinesis"
        Effect = "Allow"
        Principal = {
          Service = "kinesis.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "iot_key_alias" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.iot_key.key_id
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
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
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
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.iot_data.arn,
          "${aws_dynamodb_table.iot_data.arn}/*"
        ]
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

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
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
        Resource = ["arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:client/$${iot:ClientId}"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Publish"]
        Resource = ["arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Subscribe"]
        Resource = ["arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topicfilter/sensors/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["iot:Receive"]
        Resource = ["arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/sensors/*"]
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

  error_action {
    cloudwatch_logs {
      role_arn       = aws_iam_role.iot_role.arn
      log_group_name = aws_cloudwatch_log_group.iot_errors.name
    }
  }

  tags = local.common_tags
}

# CloudWatch Log Group for IoT errors
resource "aws_cloudwatch_log_group" "iot_errors" {
  name              = "/aws/iot/${var.project_name}/errors"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn

  tags = local.common_tags
}

# Kinesis Data Stream
resource "aws_kinesis_stream" "iot_stream" {
  name             = "${var.project_name}-data-stream"
  shard_count      = var.kinesis_shard_count
  retention_period = 24 # Hours

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
    name            = "SensorTypeIndex"
    hash_key        = "sensor_type"
    range_key       = "timestamp"
    write_capacity  = 50
    read_capacity   = 50
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "LocationIndex"
    hash_key        = "location_id"
    range_key       = "timestamp"
    write_capacity  = 50
    read_capacity   = 50
    projection_type = "ALL"
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
  function_name    = "${var.project_name}-data-processor"
  description      = "Processes IoT sensor data from Kinesis stream"
  role             = aws_iam_role.lambda_role.arn
  handler          = "data_processor.handler"
  runtime          = "nodejs18.x"
  timeout          = 60
  memory_size      = 512
  filename         = data.archive_file.data_processor_zip.output_path
  source_code_hash = data.archive_file.data_processor_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
      TTL_DAYS       = var.sensor_data_ttl_days
    }
  }

  tags = local.common_tags
}

# Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "kinesis_lambda_mapping" {
  event_source_arn                   = aws_kinesis_stream.iot_stream.arn
  function_name                      = aws_lambda_function.data_processor.arn
  starting_position                  = "LATEST"
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  maximum_retry_attempts             = 3
  parallelization_factor             = 10
  enabled                            = true
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.data_processor.function_name}"
  retention_in_days = var.retention_days
  kms_key_id        = aws_kms_key.iot_key.arn

  tags = local.common_tags
}

# Anomaly detection function
resource "aws_lambda_function" "anomaly_detector" {
  function_name    = "${var.project_name}-anomaly-detector"
  description      = "Detects anomalies in sensor data"
  role             = aws_iam_role.lambda_role.arn
  handler          = "anomaly_detector.handler"
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 1024
  filename         = data.archive_file.anomaly_detector_zip.output_path
  source_code_hash = data.archive_file.anomaly_detector_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.iot_data.name
      SNS_TOPIC_ARN  = aws_sns_topic.iot_alerts.arn
    }
  }

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
  evaluation_periods  = 2
  metric_name         = "WriteProvisionedThroughputExceeded"
  namespace           = "AWS/Kinesis"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors Kinesis throttled records"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    StreamName = aws_kinesis_stream.iot_stream.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.data_processor.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "${var.project_name}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors DynamoDB throttled requests"
  alarm_actions       = [aws_sns_topic.iot_alerts.arn]
  treat_missing_data  = "notBreaching"

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
            ["AWS/Kinesis", "IncomingRecords", "StreamName", aws_kinesis_stream.iot_stream.name, { stat = "Sum" }],
            [".", "WriteProvisionedThroughputExceeded", ".", ".", { stat = "Sum", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Kinesis Stream Metrics"
          period  = 300
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
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.data_processor.function_name, { stat = "Sum" }],
            [".", "Errors", ".", ".", { stat = "Sum", yAxis = "right" }],
            [".", "Duration", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Processor Metrics"
          period  = 300
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
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.iot_data.name, { stat = "Sum" }],
            [".", "ConsumedReadCapacityUnits", ".", ".", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Capacity Consumption"
          period  = 300
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
            ["IoTMonitoring", "AverageTemperature", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Average Temperature from Sensors"
          period  = 300
        }
      }
    ]
  })
}

# QuickSight Resources - Simplified to avoid complex syntax issues
# Note: QuickSight resources have complex syntax requirements and may need manual configuration

# IAM Role for QuickSight to access DynamoDB
resource "aws_iam_role" "quicksight_service_role" {
  name = "${var.project_name}-quicksight-service-role"

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

resource "aws_iam_policy" "quicksight_dynamodb_access" {
  name        = "${var.project_name}-quicksight-dynamodb-access"
  description = "Policy for QuickSight to access DynamoDB IoT data"

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
          "dynamodb:Scan",
          "dynamodb:ListTables"
        ]
        Resource = [
          aws_dynamodb_table.iot_data.arn,
          "${aws_dynamodb_table.iot_data.arn}/*",
          "${aws_dynamodb_table.iot_data.arn}/index/*"
        ]
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

resource "aws_iam_role_policy_attachment" "quicksight_dynamodb_attachment" {
  role       = aws_iam_role.quicksight_service_role.name
  policy_arn = aws_iam_policy.quicksight_dynamodb_access.arn
}


# Outputs
output "iot_endpoint" {
  description = "IoT Core endpoint for device connections"
  value       = data.aws_iot_endpoint.endpoint.endpoint_address
}

output "kinesis_stream_name" {
  description = "Name of the Kinesis Data Stream"
  value       = aws_kinesis_stream.iot_stream.name
}

output "kinesis_stream_arn" {
  description = "ARN of the Kinesis Data Stream"
  value       = aws_kinesis_stream.iot_stream.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.iot_data.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.iot_data.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.iot_alerts.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch Dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.iot_dashboard.dashboard_name}"
}

output "quicksight_dashboard_url" {
  description = "URL of the QuickSight Dashboard (manual setup required)"
  value       = "https://quicksight.aws.amazon.com/sn/start/data-sets"
}

output "quicksight_service_role_arn" {
  description = "ARN of the QuickSight service role for DynamoDB access"
  value       = aws_iam_role.quicksight_service_role.arn
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value = {
    data_processor   = aws_lambda_function.data_processor.arn
    anomaly_detector = aws_lambda_function.anomaly_detector.arn
  }
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    data_processor   = aws_lambda_function.data_processor.function_name
    anomaly_detector = aws_lambda_function.anomaly_detector.function_name
  }
}

output "iam_role_arns" {
  description = "ARNs of IAM roles"
  value = {
    iot_role        = aws_iam_role.iot_role.arn
    lambda_role     = aws_iam_role.lambda_role.arn
    quicksight_role = aws_iam_role.quicksight_service_role.arn
  }
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.iot_key.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.iot_key.key_id
}

output "iot_thing_type" {
  description = "Name of the IoT thing type"
  value       = aws_iot_thing_type.sensor_type.name
}

output "iot_policy_name" {
  description = "Name of the IoT policy for devices"
  value       = aws_iot_policy.sensor_policy.name
}

output "iot_topic_rule_name" {
  description = "Name of the IoT topic rule"
  value       = aws_iot_topic_rule.sensor_data_rule.name
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    kinesis_logs          = aws_cloudwatch_log_group.kinesis_logs.name
    lambda_processor_logs = aws_cloudwatch_log_group.lambda_logs.name
    anomaly_detector_logs = aws_cloudwatch_log_group.anomaly_detector_logs.name
    iot_errors            = aws_cloudwatch_log_group.iot_errors.name
  }
}
