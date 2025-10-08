# Serverless Feedback Processing System with Sentiment Analysis

This infrastructure implements a complete serverless feedback processing pipeline on AWS using Terraform. The solution captures customer feedback via API Gateway, processes it through Lambda with AWS Comprehend sentiment analysis, stores data in DynamoDB and S3, and enables analytics through Glue and Athena.

## Infrastructure Overview

The system consists of the following components:

- **API Gateway**: REST API endpoint for feedback submission
- **Lambda Function**: Python 3.11 function for processing feedback and sentiment analysis
- **DynamoDB**: NoSQL database for real-time feedback storage with point-in-time recovery
- **S3 Data Lake**: Partitioned storage (year/month/day) for long-term analytics
- **AWS Comprehend**: Sentiment analysis service
- **Glue Crawler**: Automated schema discovery running daily at midnight UTC
- **Athena**: SQL-based analytics with encrypted results
- **CloudWatch**: Monitoring, logging, and custom metrics
- **IAM**: Least-privilege security roles and policies

## Key Architecture Features

- Cross-region support for AWS Comprehend (us-west-2) while maintaining primary resources in us-west-1
- Environment isolation using configurable suffix for resource naming
- S3 versioning and lifecycle policies
- DynamoDB point-in-time recovery
- Automated Glue crawler scheduling
- CloudWatch alarms for Lambda errors and DynamoDB throttling
- Encrypted Athena query results with SSE-S3
- Comprehensive tagging strategy

## Terraform Configuration Files

### provider.tf

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
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "feedback-system"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "athena_query_result_retention_days" {
  description = "Days to retain Athena query results"
  type        = number
  default     = 30
}

variable "environment_suffix" {
  description = "Suffix to append to all resource names for isolation (e.g., synth51682039 or pr123)"
  type        = string
  default     = "synth51682039"
}
```

### main.tf

```hcl
# S3 Buckets for Data Lake and Athena Results
resource "aws_s3_bucket" "feedback_data_lake" {
  bucket        = "feedback-data-lake-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name        = "Feedback Data Lake"
    Environment = "production"
    Purpose     = "Customer feedback storage"
  }
}

resource "aws_s3_bucket_versioning" "feedback_data_lake" {
  bucket = aws_s3_bucket.feedback_data_lake.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "athena_results" {
  bucket = "feedback-athena-results-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "Athena Query Results"
    Environment = "production"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "delete-old-results"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

# DynamoDB Table for Feedback Storage
resource "aws_dynamodb_table" "feedback" {
  name         = "customer-feedback-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"
  range_key    = "timestamp"

  attribute {
    name = "feedbackId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Customer Feedback Table"
    Environment = "production"
  }
}

# IAM Role for Lambda Function
resource "aws_iam_role" "lambda_feedback_processor" {
  name = "lambda-feedback-processor-role-${var.environment_suffix}"

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
    Name = "Lambda Feedback Processor Role"
  }
}

# IAM Policy for Lambda Function
resource "aws_iam_role_policy" "lambda_feedback_processor" {
  name = "lambda-feedback-processor-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_feedback_processor.id

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
        Resource = "arn:aws:logs:us-west-1:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectSentiment"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.feedback.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.feedback_data_lake.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "feedback_processor" {
  filename         = "lambda_function.zip"
  function_name    = "feedback-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_feedback_processor.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512
  source_code_hash = filebase64sha256("lambda_function.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.feedback.name
      S3_BUCKET      = aws_s3_bucket.feedback_data_lake.id
    }
  }

  tags = {
    Name        = "Feedback Processor"
    Environment = "production"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "feedback_processor" {
  name              = "/aws/lambda/${aws_lambda_function.feedback_processor.function_name}"
  retention_in_days = 14

  tags = {
    Name = "Feedback Processor Logs"
  }
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "feedback_api" {
  name        = "feedback-submission-api-${var.environment_suffix}"
  description = "API for customer feedback submission"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "Feedback API"
    Environment = "production"
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.feedback_api.id
  parent_id   = aws_api_gateway_rest_api.feedback_api.root_resource_id
  path_part   = "feedback"
}

# API Gateway Method
resource "aws_api_gateway_method" "feedback_post" {
  rest_api_id   = aws_api_gateway_rest_api.feedback_api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "feedback_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.feedback_api.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.feedback_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_processor.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "feedback_api" {
  rest_api_id = aws_api_gateway_rest_api.feedback_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.feedback.id,
      aws_api_gateway_method.feedback_post.id,
      aws_api_gateway_integration.feedback_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.feedback_post,
    aws_api_gateway_integration.feedback_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.feedback_api.id
  rest_api_id   = aws_api_gateway_rest_api.feedback_api.id
  stage_name    = "prod"

  tags = {
    Name        = "Production Stage"
    Environment = "production"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.feedback_api.execution_arn}/*/*"
}

# Glue Database
resource "aws_glue_catalog_database" "feedback_db" {
  name = "feedback_database_${var.environment_suffix}"

  tags = {
    Name        = "Feedback Database"
    Environment = "production"
  }
}

# IAM Role for Glue Crawler
resource "aws_iam_role" "glue_crawler" {
  name = "glue-crawler-feedback-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "Glue Crawler Role"
  }
}

# IAM Policy for Glue Crawler
resource "aws_iam_role_policy" "glue_crawler" {
  name = "glue-crawler-policy-${var.environment_suffix}"
  role = aws_iam_role.glue_crawler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.feedback_data_lake.arn,
          "${aws_s3_bucket.feedback_data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:*"
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
        Resource = "arn:aws:logs:*:*:/aws-glue/*"
      }
    ]
  })
}

# Glue Crawler
resource "aws_glue_crawler" "feedback_crawler" {
  name          = "feedback-crawler-${var.environment_suffix}"
  role          = aws_iam_role.glue_crawler.arn
  database_name = aws_glue_catalog_database.feedback_db.name

  schedule = "cron(0 0 * * ? *)"

  s3_target {
    path = "s3://${aws_s3_bucket.feedback_data_lake.id}/feedback/"
  }

  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }

  tags = {
    Name        = "Feedback Crawler"
    Environment = "production"
  }
}

# Athena Workgroup
resource "aws_athena_workgroup" "feedback_analytics" {
  name = "feedback-analytics-${var.environment_suffix}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }

  tags = {
    Name        = "Feedback Analytics Workgroup"
    Environment = "production"
  }
}

# CloudWatch Metric Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "feedback-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.feedback_processor.function_name
  }

  tags = {
    Name = "Lambda Error Alarm"
  }
}

# CloudWatch Metric Alarm for DynamoDB Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "feedback-table-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttling"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.feedback.name
  }

  tags = {
    Name = "DynamoDB Throttle Alarm"
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
```

### outputs.tf

```hcl
output "api_endpoint" {
  description = "API Gateway endpoint URL for feedback submission"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/feedback"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.feedback_api.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.feedback_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.feedback_processor.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.feedback.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.feedback.arn
}

output "s3_data_lake_bucket" {
  description = "S3 bucket for data lake"
  value       = aws_s3_bucket.feedback_data_lake.id
}

output "s3_data_lake_arn" {
  description = "S3 data lake bucket ARN"
  value       = aws_s3_bucket.feedback_data_lake.arn
}

output "s3_athena_results_bucket" {
  description = "S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.id
}

output "glue_database_name" {
  description = "Glue catalog database name"
  value       = aws_glue_catalog_database.feedback_db.name
}

output "glue_crawler_name" {
  description = "Glue crawler name"
  value       = aws_glue_crawler.feedback_crawler.name
}

output "athena_workgroup_name" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.feedback_analytics.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.feedback_processor.name
}
```

### lambda_function.py

```python
import json
import boto3
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
# Note: Comprehend is not available in us-west-1, using us-west-2 instead
comprehend = boto3.client('comprehend', region_name='us-west-2')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
s3 = boto3.client('s3', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

# Get environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        feedback_text = body.get('feedback', '')
        customer_id = body.get('customer_id', 'anonymous')

        if not feedback_text:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Feedback text is required'})
            }

        # Generate unique feedback ID
        feedback_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Analyze sentiment using AWS Comprehend
        sentiment_response = comprehend.detect_sentiment(
            Text=feedback_text,
            LanguageCode='en'
        )

        sentiment = sentiment_response['Sentiment']
        sentiment_scores = sentiment_response['SentimentScore']

        # Prepare feedback data
        feedback_data = {
            'feedbackId': feedback_id,
            'timestamp': timestamp,
            'customerId': customer_id,
            'feedbackText': feedback_text,
            'sentiment': sentiment,
            'sentimentScores': {
                'positive': Decimal(str(sentiment_scores['Positive'])),
                'negative': Decimal(str(sentiment_scores['Negative'])),
                'neutral': Decimal(str(sentiment_scores['Neutral'])),
                'mixed': Decimal(str(sentiment_scores['Mixed']))
            }
        }

        # Store in DynamoDB
        table.put_item(Item=feedback_data)

        # Export to S3 with year/month/day partitioning
        dt = datetime.utcnow()
        s3_key = f"feedback/year={dt.year}/month={dt.month:02d}/day={dt.day:02d}/{feedback_id}.json"

        # Convert Decimal to float for JSON serialization
        s3_data = {
            'feedbackId': feedback_id,
            'timestamp': timestamp,
            'customerId': customer_id,
            'feedbackText': feedback_text,
            'sentiment': sentiment,
            'sentimentScores': {
                'positive': float(sentiment_scores['Positive']),
                'negative': float(sentiment_scores['Negative']),
                'neutral': float(sentiment_scores['Neutral']),
                'mixed': float(sentiment_scores['Mixed'])
            }
        }

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(s3_data),
            ContentType='application/json'
        )

        # Publish custom CloudWatch metric
        cloudwatch.put_metric_data(
            Namespace='FeedbackProcessing',
            MetricData=[
                {
                    'MetricName': 'FeedbackProcessed',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Sentiment',
                            'Value': sentiment
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Feedback processed successfully',
                'feedbackId': feedback_id,
                'sentiment': sentiment
            })
        }

    except Exception as e:
        # Log error and publish error metric
        print(f"Error processing feedback: {str(e)}")

        cloudwatch.put_metric_data(
            Namespace='FeedbackProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to process feedback'})
        }
```

## Summary

This infrastructure provides a production-ready serverless feedback processing system with the following capabilities:

- Real-time sentiment analysis on customer feedback
- Dual storage strategy (DynamoDB for immediate access, S3 for long-term analytics)
- Automated data cataloging and partitioning
- SQL-based analytics through Athena
- Comprehensive monitoring and alerting
- Environment isolation for safe deployments
- Cross-region service orchestration
