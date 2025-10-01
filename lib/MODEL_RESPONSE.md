# E-Learning Quiz Processing System Infrastructure

Here's the complete Terraform infrastructure code for the asynchronous quiz processing system in AWS us-west-1 region.

## main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# SQS FIFO Queue for quiz submissions
resource "aws_sqs_queue" "quiz_submissions_fifo" {
  name                        = "quiz-submissions.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "queue"
  fifo_throughput_limit       = "perQueue"
  message_retention_seconds   = 345600 # 4 days
  visibility_timeout_seconds  = 70     # Lambda timeout + buffer
  receive_wait_time_seconds   = 20     # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.quiz_submissions_dlq.arn
    maxReceiveCount     = 3
  })

  tags = var.tags
}

# Dead Letter Queue for failed submissions
resource "aws_sqs_queue" "quiz_submissions_dlq" {
  name                      = "quiz-submissions-dlq.fifo"
  fifo_queue                = true
  message_retention_seconds = 1209600 # 14 days

  tags = var.tags
}

# DynamoDB table for quiz results
resource "aws_dynamodb_table" "quiz_results" {
  name           = "quiz-results"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "student_id"
  range_key      = "submission_timestamp"

  attribute {
    name = "student_id"
    type = "S"
  }

  attribute {
    name = "submission_timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_execution_role" {
  name = "quiz-processor-lambda-role"

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

  tags = var.tags
}

# IAM policy for Lambda function
resource "aws_iam_policy" "lambda_policy" {
  name = "quiz-processor-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.quiz_submissions_fifo.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.quiz_results.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda function for quiz processing
resource "aws_lambda_function" "quiz_processor" {
  filename         = "lambda_function.zip"
  function_name    = "quiz-processor"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "quiz_processor.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.quiz_results.name
      AWS_XRAY_TRACING_NAME = "quiz-processor"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

# Archive Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "quiz_processor.py"
  output_path = "lambda_function.zip"
}

# SQS to Lambda event source mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn                   = aws_sqs_queue.quiz_submissions_fifo.arn
  function_name                      = aws_lambda_function.quiz_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 5
  }
}

# CloudWatch alarm for queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth_alarm" {
  alarm_name          = "quiz-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Triggers when quiz queue depth exceeds 100 messages"

  dimensions = {
    QueueName = aws_sqs_queue.quiz_submissions_fifo.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "quiz-processing-alerts"

  tags = var.tags
}

# IAM role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "quiz-health-check-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for EventBridge Scheduler
resource "aws_iam_policy" "scheduler_policy" {
  name = "quiz-health-check-scheduler-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.health_check.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler_policy_attachment" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.scheduler_policy.arn
}

# Lambda function for health checks
resource "aws_lambda_function" "health_check" {
  filename         = "health_check.zip"
  function_name    = "quiz-queue-health-check"
  role            = aws_iam_role.health_check_role.arn
  handler         = "health_check.lambda_handler"
  source_code_hash = data.archive_file.health_check_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.quiz_submissions_fifo.id
      DLQ_URL   = aws_sqs_queue.quiz_submissions_dlq.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

# Archive health check Lambda function code
data "archive_file" "health_check_zip" {
  type        = "zip"
  source_file = "health_check.py"
  output_path = "health_check.zip"
}

# IAM role for health check Lambda
resource "aws_iam_role" "health_check_role" {
  name = "quiz-health-check-lambda-role"

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

  tags = var.tags
}

# IAM policy for health check Lambda
resource "aws_iam_policy" "health_check_policy" {
  name = "quiz-health-check-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.quiz_submissions_fifo.arn,
          aws_sqs_queue.quiz_submissions_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "health_check_policy_attachment" {
  role       = aws_iam_role.health_check_role.name
  policy_arn = aws_iam_policy.health_check_policy.arn
}

# EventBridge Scheduler for periodic health checks
resource "aws_scheduler_schedule" "health_check_schedule" {
  name       = "quiz-queue-health-check-schedule"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.health_check.arn
    role_arn = aws_iam_role.scheduler_role.arn

    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }
  }
}
```

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-1"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Application = "quiz-processor"
    ManagedBy   = "terraform"
  }
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = ""
}
```

## outputs.tf

```hcl
output "sqs_queue_url" {
  description = "URL of the SQS FIFO queue"
  value       = aws_sqs_queue.quiz_submissions_fifo.id
}

output "sqs_queue_arn" {
  description = "ARN of the SQS FIFO queue"
  value       = aws_sqs_queue.quiz_submissions_fifo.arn
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.quiz_submissions_dlq.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.quiz_results.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.quiz_results.arn
}

output "lambda_function_arn" {
  description = "ARN of the quiz processor Lambda function"
  value       = aws_lambda_function.quiz_processor.arn
}

output "health_check_lambda_arn" {
  description = "ARN of the health check Lambda function"
  value       = aws_lambda_function.health_check.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.queue_depth_alarm.alarm_name
}
```

## quiz_processor.py

```python
import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('process_quiz')
def process_quiz(quiz_data):
    """Process a single quiz submission"""
    try:
        # Extract quiz information
        student_id = quiz_data['student_id']
        quiz_id = quiz_data['quiz_id']
        answers = quiz_data['answers']
        correct_answers = quiz_data.get('correct_answers', {})

        # Calculate score
        score = calculate_score(answers, correct_answers)

        # Prepare result item
        timestamp = datetime.utcnow().isoformat()
        result_item = {
            'student_id': student_id,
            'submission_timestamp': timestamp,
            'quiz_id': quiz_id,
            'score': score,
            'total_questions': len(correct_answers),
            'answers': answers,
            'processing_timestamp': timestamp,
            'status': 'completed'
        }

        # Store in DynamoDB
        table.put_item(Item=result_item)

        logger.info(f"Successfully processed quiz for student {student_id}, score: {score}")
        return result_item

    except Exception as e:
        logger.error(f"Error processing quiz: {str(e)}")
        raise

def calculate_score(student_answers, correct_answers):
    """Calculate quiz score based on answers"""
    if not correct_answers:
        return 0

    correct_count = 0
    for question_id, student_answer in student_answers.items():
        if question_id in correct_answers and student_answer == correct_answers[question_id]:
            correct_count += 1

    score = (correct_count / len(correct_answers)) * 100
    return round(score, 2)

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """Main Lambda handler for processing SQS messages"""
    processed_count = 0
    failed_count = 0

    try:
        # Process each message in the batch
        for record in event['Records']:
            try:
                # Parse message body
                message_body = json.loads(record['body'])

                # Process quiz submission
                process_quiz(message_body)
                processed_count += 1

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {str(e)}")
                failed_count += 1
                # Message will be retried or sent to DLQ
                raise
            except Exception as e:
                logger.error(f"Failed to process message: {str(e)}")
                failed_count += 1
                # Re-raise to trigger retry/DLQ
                raise

        logger.info(f"Batch processing complete. Processed: {processed_count}, Failed: {failed_count}")

        # Return success if all messages processed
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch processed successfully',
                'processed': processed_count,
                'failed': failed_count
            })
        }

    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        # Partial batch failure - failed messages will be retried
        raise
```

## health_check.py

```python
import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sqs = boto3.client('sqs')
sns = boto3.client('sns')

# Environment variables
QUEUE_URL = os.environ['QUEUE_URL']
DLQ_URL = os.environ['DLQ_URL']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

@xray_recorder.capture('check_queue_health')
def check_queue_health(queue_url, queue_name):
    """Check health metrics for a queue"""
    try:
        # Get queue attributes
        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Extract key metrics
        metrics = {
            'queue_name': queue_name,
            'messages_available': int(attributes.get('ApproximateNumberOfMessages', 0)),
            'messages_in_flight': int(attributes.get('ApproximateNumberOfMessagesNotVisible', 0)),
            'messages_delayed': int(attributes.get('ApproximateNumberOfMessagesDelayed', 0))
        }

        logger.info(f"Queue {queue_name} metrics: {json.dumps(metrics)}")

        return metrics

    except Exception as e:
        logger.error(f"Error checking queue health for {queue_name}: {str(e)}")
        raise

def send_alert(message, subject="Queue Health Check Alert"):
    """Send alert via SNS"""
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        logger.info(f"Alert sent: {subject}")
    except Exception as e:
        logger.error(f"Failed to send alert: {str(e)}")

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """Main Lambda handler for health checks"""
    try:
        # Check main queue health
        main_queue_metrics = check_queue_health(QUEUE_URL, "quiz-submissions")

        # Check DLQ health
        dlq_metrics = check_queue_health(DLQ_URL, "quiz-submissions-dlq")

        # Check for issues
        alerts = []

        # Alert if too many messages in DLQ
        if dlq_metrics['messages_available'] > 10:
            alerts.append(f"WARNING: {dlq_metrics['messages_available']} messages in Dead Letter Queue")

        # Alert if main queue is backing up
        total_messages = main_queue_metrics['messages_available'] + main_queue_metrics['messages_in_flight']
        if total_messages > 500:
            alerts.append(f"WARNING: High message count in main queue: {total_messages}")

        # Send consolidated alert if issues found
        if alerts:
            alert_message = "Queue Health Issues Detected:\n\n" + "\n".join(alerts)
            alert_message += f"\n\nMain Queue Metrics: {json.dumps(main_queue_metrics, indent=2)}"
            alert_message += f"\n\nDLQ Metrics: {json.dumps(dlq_metrics, indent=2)}"
            send_alert(alert_message)

        # Return health check results
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Health check completed',
                'main_queue': main_queue_metrics,
                'dlq': dlq_metrics,
                'alerts_sent': len(alerts)
            })
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        # Send critical alert
        send_alert(f"CRITICAL: Health check Lambda failed with error: {str(e)}", "Critical Health Check Failure")
        raise
```