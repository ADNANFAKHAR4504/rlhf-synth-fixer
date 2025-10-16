# CloudWatch Analytics System - Complete Infrastructure Solution

This solution provides a production-ready CloudWatch monitoring system that deploys and monitors API Gateway, Lambda functions, and RDS database for handling 100k+ daily interactions.

## Provider Configuration

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## Variables Configuration

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cw-analytics"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alert_email_addresses" {
  description = "Email addresses to receive CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "api_latency_threshold" {
  description = "API latency threshold in milliseconds"
  type        = number
  default     = 1000
}

variable "api_error_rate_threshold" {
  description = "API error rate threshold percentage"
  type        = number
  default     = 5
}

variable "lambda_error_threshold" {
  description = "Lambda error count threshold"
  type        = number
  default     = 10
}

variable "lambda_duration_threshold" {
  description = "Lambda duration threshold in milliseconds"
  type        = number
  default     = 3000
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "rds_connection_threshold" {
  description = "RDS database connection threshold"
  type        = number
  default     = 100
}

variable "aggregation_interval_minutes" {
  description = "Interval for metric aggregation in minutes"
  type        = number
  default     = 5
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR"
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "CloudWatch Analytics"
    ManagedBy  = "Terraform"
    CostCenter = "Engineering"
  }
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  default     = "ChangeMe123456!"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}
```

## Main Infrastructure

The main.tf file contains the complete infrastructure including VPC, API Gateway, Lambda functions, RDS database, and supporting resources. Due to length, key sections are shown:

```hcl
# main.tf

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for Encryption
resource "aws_kms_key" "monitoring" {
  description             = "KMS key for ${var.project_name}-${var.environment_suffix} monitoring resources"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-monitoring-key"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "cloudwatch_alerts" {
  name              = "${var.project_name}-${var.environment_suffix}-alerts"
  kms_master_key_id = aws_kms_key.monitoring.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-alerts"
  })
}

# DynamoDB Table for Aggregated Logs
resource "aws_dynamodb_table" "aggregated_logs" {
  name             = "${var.project_name}-${var.environment_suffix}-logs"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "metricId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.monitoring.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-logs"
  })
}

# VPC with public and private subnets
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-vpc"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment_suffix}-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.monitoring.arn

  db_name  = "analytics"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 7
  deletion_protection     = false
  skip_final_snapshot     = true

  performance_insights_enabled = var.db_instance_class != "db.t3.micro"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-db"
  })
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment_suffix}-api"
  description = "CloudWatch Analytics API"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api"
  })
}

# Lambda Functions
resource "aws_lambda_function" "api_handler" {
  filename      = data.archive_file.api_handler.output_path
  function_name = "${var.project_name}-${var.environment_suffix}-api-handler"
  role          = aws_iam_role.lambda_api_handler.arn
  handler       = "index.handler"
  runtime       = "python3.12"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler"
  })
}

resource "aws_lambda_function" "metric_aggregator" {
  filename      = data.archive_file.metric_aggregator.output_path
  function_name = "${var.project_name}-${var.environment_suffix}-aggregator"
  role          = aws_iam_role.metric_aggregator.arn
  handler       = "index.handler"
  runtime       = "python3.12"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregator"
  })
}

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "metric_aggregation" {
  name                = "${var.project_name}-${var.environment_suffix}-aggregation"
  schedule_expression = "rate(${var.aggregation_interval_minutes} minutes)"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregation-rule"
  })
}
```

## IAM Configuration

```hcl
# iam.tf

resource "aws_iam_role" "lambda_api_handler" {
  name = "${var.project_name}-${var.environment_suffix}-api-handler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler-role"
  })
}

resource "aws_iam_policy" "lambda_api_handler" {
  name = "${var.project_name}-${var.environment_suffix}-api-handler-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.lambda_api_handler.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.aggregated_logs.arn,
          "${aws_dynamodb_table.aggregated_logs.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.monitoring.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler-policy"
  })
}

resource "aws_iam_role" "metric_aggregator" {
  name = "${var.project_name}-${var.environment_suffix}-aggregator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregator-role"
  })
}

resource "aws_sns_topic_policy" "cloudwatch_alerts" {
  arn = aws_sns_topic.cloudwatch_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudwatch.amazonaws.com"
      }
      Action   = ["SNS:Publish"]
      Resource = aws_sns_topic.cloudwatch_alerts.arn
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })
}
```

## Monitoring Configuration

```hcl
# monitoring.tf

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { 
              stat = "Sum", 
              dimensions = { ApiName = aws_api_gateway_rest_api.main.name }
            }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway Requests"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.api_latency_threshold
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}
```

## Outputs

```hcl
# outputs.tf

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.aggregated_logs.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.cloudwatch_alerts.arn
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "lambda_api_handler_name" {
  description = "API handler Lambda name"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_aggregator_name" {
  description = "Metric aggregator Lambda name"
  value       = aws_lambda_function.metric_aggregator.function_name
}
```

## Lambda Functions

### API Handler

```python
# lambda/api_handler.py

import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    path = event.get('path', '')
    http_method = event.get('httpMethod', '')
    
    try:
        if path == '/health' and http_method == 'GET':
            return handle_health_check(event, context)
        elif path == '/metrics' and http_method == 'GET':
            return handle_metrics_request(event, context)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not Found'})
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal Server Error'})
        }

def handle_health_check(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'cloudwatch-analytics-api'
        })
    }

def handle_metrics_request(event, context):
    import boto3
    from decimal import Decimal
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    
    response = table.scan(Limit=10)
    
    def decimal_default(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        raise TypeError
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'metrics': response.get('Items', []),
            'count': len(response.get('Items', []))
        }, default=decimal_default)
    }
```

### Metric Aggregator

```python
# lambda/metric_aggregator.py

import json
import boto3
import os
import logging
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    logger.info("Starting metric aggregation")
    
    table_name = os.environ['DYNAMODB_TABLE_NAME']
    table = dynamodb.Table(table_name)
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)
    
    metrics_aggregated = 0
    
    metrics_to_aggregate = [
        {
            'namespace': 'AWS/ApiGateway',
            'metric_name': 'Count',
            'dimensions': [{'Name': 'ApiName', 'Value': os.environ['API_GATEWAY_NAME']}],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/Lambda',
            'metric_name': 'Invocations',
            'dimensions': [{'Name': 'FunctionName', 'Value': os.environ['LAMBDA_FUNCTION_NAME']}],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/RDS',
            'metric_name': 'CPUUtilization',
            'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': os.environ['RDS_INSTANCE_ID']}],
            'stat': 'Average'
        }
    ]
    
    for metric_config in metrics_to_aggregate:
        try:
            response = cloudwatch.get_metric_statistics(
                Namespace=metric_config['namespace'],
                MetricName=metric_config['metric_name'],
                Dimensions=metric_config['dimensions'],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=[metric_config['stat']]
            )
            
            for datapoint in response.get('Datapoints', []):
                metric_id = f"{metric_config['namespace']}/{metric_config['metric_name']}"
                
                table.put_item(Item={
                    'metricId': metric_id,
                    'timestamp': int(datapoint['Timestamp'].timestamp()),
                    'dateHour': datapoint['Timestamp'].strftime('%Y-%m-%d-%H'),
                    'value': Decimal(str(datapoint[metric_config['stat']])),
                    'stat': metric_config['stat']
                })
                
                metrics_aggregated += 1
                
        except Exception as e:
            logger.error(f"Error: {str(e)}", exc_info=True)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'metrics_aggregated': metrics_aggregated,
            'timestamp': end_time.isoformat()
        })
    }
```

## Deployment

Deploy the infrastructure using Terraform commands:

```bash
cd lib
terraform init
terraform plan
terraform apply
```

The system will create all resources and output the necessary endpoints and identifiers for accessing the monitoring system.
