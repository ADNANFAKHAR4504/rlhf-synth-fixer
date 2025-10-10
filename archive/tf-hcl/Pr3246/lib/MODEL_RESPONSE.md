### Reasoning Trace
---

Alright, let me break down the requirements:

1. **SQS Queues**:
   - Main standard queue for tasks
   - DLQ with redrive policy (maxReceiveCount variable, default 5)
   - Visibility timeout (variable, default ≥ 30s, coordinate with Lambda timeout)
   - SSE with SQS-managed KMS key
   - Long polling, message retention

2. **Lambda (Node.js 18)**:
   - Processes SQS messages
   - Writes to DynamoDB
   - SQS event source mapping with batch_size and maximum_batching_window_in_seconds
   - Timeout 15-30s default
   - CloudWatch Logs retention (default 14 days)
   - Code using archive_file

3. **DynamoDB**:
   - Table for task status tracking
   - Partition key: task_id (String)
   - On-demand billing
   - Optional TTL

4. **IAM**:
   - Least privilege
   - Read/delete from SQS
   - Put/update DynamoDB
   - CloudWatch Logs
   - Read queue attributes

5. **Monitoring & Alarms**:
   - ApproximateAgeOfOldestMessage
   - ApproximateNumberOfMessagesVisible
   - Lambda Errors and Throttles
   - DLQ message count > 0

6. **Outputs**:
   - Queue URL/ARN
   - DLQ URL/ARN
   - Lambda ARN
   - Event Source Mapping UUID
   - DynamoDB table name/ARN
   - Key alarm ARNs

7. **Tagging**:
   - Apply tags map to all resources

Let me create the variables.tf file first:
### Answer 
---

```hcl
# variables.tf
variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "tap"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "TAP"
    Environment = "production"
    Owner      = "platform-team"
    CostCenter = "logistics"
  }
}

# SQS Configuration
variable "sqs_visibility_timeout_seconds" {
  description = "SQS visibility timeout in seconds. Must be greater than Lambda timeout"
  type        = number
  default     = 60
}

variable "sqs_message_retention_seconds" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 345600 # 4 days
}

variable "sqs_receive_wait_time_seconds" {
  description = "SQS long polling wait time in seconds"
  type        = number
  default     = 20
}

variable "sqs_max_receive_count" {
  description = "Maximum number of receives before sending to DLQ"
  type        = number
  default     = 5
}

variable "sqs_kms_master_key_id" {
  description = "KMS key ID for SQS encryption. If null, uses AWS managed key"
  type        = string
  default     = null
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds. Must be less than SQS visibility timeout"
  type        = number
  default     = 20
}

variable "lambda_batch_size" {
  description = "Number of SQS messages to batch for Lambda"
  type        = number
  default     = 10
}

variable "lambda_maximum_batching_window_in_seconds" {
  description = "Maximum time to wait for batch collection"
  type        = number
  default     = 2
}

variable "lambda_log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 14
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda. -1 for unreserved"
  type        = number
  default     = -1
}

# DynamoDB Configuration
variable "dynamodb_ttl_enabled" {
  description = "Enable TTL on DynamoDB table"
  type        = bool
  default     = false
}

variable "dynamodb_ttl_attribute_name" {
  description = "Name of the TTL attribute in DynamoDB"
  type        = string
  default     = "expires_at"
}

# Alarm Configuration
variable "alarm_age_of_oldest_message_threshold" {
  description = "Threshold in seconds for oldest message age alarm"
  type        = number
  default     = 300 # 5 minutes
}

variable "alarm_messages_visible_threshold" {
  description = "Threshold for number of visible messages alarm"
  type        = number
  default     = 1000
}
```

```hcl
# tap_stack.tf

# SQS Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                       = "${var.project_prefix}-dlq"
  message_retention_seconds  = var.sqs_message_retention_seconds
  visibility_timeout_seconds = 30 # Standard for DLQ, no processing expected
  receive_wait_time_seconds  = var.sqs_receive_wait_time_seconds

  # SSE configuration - uses AWS managed key by default
  sqs_managed_sse_enabled = var.sqs_kms_master_key_id == null ? true : false
  kms_master_key_id      = var.sqs_kms_master_key_id

  tags = var.tags
}

# SQS Main Queue with redrive policy to DLQ
resource "aws_sqs_queue" "main" {
  name                       = "${var.project_prefix}-queue"
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  message_retention_seconds  = var.sqs_message_retention_seconds
  receive_wait_time_seconds  = var.sqs_receive_wait_time_seconds # Long polling for efficiency

  # Redrive policy - messages go to DLQ after maxReceiveCount failures
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  # SSE configuration
  sqs_managed_sse_enabled = var.sqs_kms_master_key_id == null ? true : false
  kms_master_key_id      = var.sqs_kms_master_key_id

  tags = var.tags
}

# DynamoDB table for task status tracking
resource "aws_dynamodb_table" "task_status" {
  name         = "${var.project_prefix}-task-status"
  billing_mode = "PAY_PER_REQUEST" # On-demand billing for unpredictable workload
  hash_key     = "task_id"

  attribute {
    name = "task_id"
    type = "S"
  }

  # Optional TTL configuration for auto-expiring old records
  dynamic "ttl" {
    for_each = var.dynamodb_ttl_enabled ? [1] : []
    content {
      attribute_name = var.dynamodb_ttl_attribute_name
      enabled        = true
    }
  }

  tags = var.tags
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_prefix}-lambda-execution-role"

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

# IAM policy for Lambda - least privilege access
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.project_prefix}-lambda-permissions"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # SQS permissions - receive, delete, and get attributes
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.main.arn
      },
      {
        # DynamoDB permissions - write only
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.task_status.arn
      },
      {
        # CloudWatch Logs permissions
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

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_prefix}-processor"
  retention_in_days = var.lambda_log_retention_days

  tags = var.tags
}

# Lambda function code archive
data "archive_file" "lambda_code" {
  type        = "zip"
  output_path = "/tmp/${var.project_prefix}-lambda.zip"

  source {
    content  = <<-EOT
      const AWS = require('aws-sdk');
      const dynamodb = new AWS.DynamoDB.DocumentClient();
      
      exports.handler = async (event) => {
        console.log('Processing batch of', event.Records.length, 'messages');
        
        // Process each message in the batch
        const promises = event.Records.map(async (record) => {
          try {
            const body = JSON.parse(record.body);
            const taskId = body.task_id || record.messageId;
            
            // Write status to DynamoDB
            await dynamodb.put({
              TableName: process.env.DYNAMODB_TABLE_NAME,
              Item: {
                task_id: taskId,
                status: 'processed',
                processed_at: new Date().toISOString(),
                message_body: body,
                ${var.dynamodb_ttl_enabled ? "expires_at: Math.floor(Date.now() / 1000) + 86400 * 30," : ""}
              }
            }).promise();
            
            console.log('Successfully processed task:', taskId);
          } catch (error) {
            console.error('Error processing message:', error);
            throw error; // Rethrow to trigger retry/DLQ
          }
        });
        
        // Wait for all messages to be processed
        await Promise.all(promises);
        
        return { statusCode: 200 };
      };
    EOT
    filename = "index.js"
  }
}

# Lambda function
resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "${var.project_prefix}-processor"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
  
  # Timeout must be less than SQS visibility timeout to prevent duplicate processing
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  # Optional reserved concurrent executions
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.task_status.name
    }
  }

  tags = var.tags
}

# SQS event source mapping for Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.main.arn
  function_name    = aws_lambda_function.processor.arn
  
  # Batching configuration for efficiency
  batch_size                         = var.lambda_batch_size
  maximum_batching_window_in_seconds = var.lambda_maximum_batching_window_in_seconds
  
  # Enable the trigger
  enabled = true
}

# CloudWatch Alarms

# Alarm for old messages (processing delay)
resource "aws_cloudwatch_metric_alarm" "queue_old_messages" {
  alarm_name          = "${var.project_prefix}-queue-old-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ApproximateAgeOfOldestMessage"
  namespace          = "AWS/SQS"
  period             = "300" # 5 minutes
  statistic          = "Average"
  threshold          = var.alarm_age_of_oldest_message_threshold
  alarm_description  = "Queue has messages older than ${var.alarm_age_of_oldest_message_threshold} seconds"
  treat_missing_data = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  tags = var.tags
}

# Alarm for queue backlog
resource "aws_cloudwatch_metric_alarm" "queue_backlog" {
  alarm_name          = "${var.project_prefix}-queue-backlog"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.alarm_messages_visible_threshold
  alarm_description  = "Queue has more than ${var.alarm_messages_visible_threshold} visible messages"
  treat_missing_data = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  tags = var.tags
}

# Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "Lambda function error rate is high"
  treat_missing_data = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  tags = var.tags
}

# Alarm for Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${var.project_prefix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Throttles"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "Lambda function is being throttled"
  treat_missing_data = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  tags = var.tags
}

# Alarm for DLQ messages (immediate action required)
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "60"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "Messages in DLQ require immediate attention"
  treat_missing_data = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = var.tags
}

# Outputs
output "main_queue_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.main.url
}

output "main_queue_arn" {
  description = "ARN of the main SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "event_source_mapping_uuid" {
  description = "UUID of the SQS event source mapping"
  value       = aws_lambda_event_source_mapping.sqs_trigger.uuid
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.task_status.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.task_status.arn
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = {
    queue_old_messages = aws_cloudwatch_metric_alarm.queue_old_messages.arn
    queue_backlog      = aws_cloudwatch_metric_alarm.queue_backlog.arn
    lambda_errors      = aws_cloudwatch_metric_alarm.lambda_errors.arn
    lambda_throttles   = aws_cloudwatch_metric_alarm.lambda_throttles.arn
    dlq_messages       = aws_cloudwatch_metric_alarm.dlq_messages.arn
  }
}

# Validation: Lambda timeout must be less than SQS visibility timeout
resource "null_resource" "validate_timeouts" {
  lifecycle {
    precondition {
      condition     = var.lambda_timeout < var.sqs_visibility_timeout_seconds
      error_message = "Lambda timeout (${var.lambda_timeout}s) must be less than SQS visibility timeout (${var.sqs_visibility_timeout_seconds}s)"
    }
  }
}

/*
OPERATIONAL NOTES:
1. Visibility Timeout vs Lambda Timeout: SQS visibility timeout (60s default) > Lambda timeout (20s default)
   This prevents messages from becoming visible again while still being processed.

2. Batch Processing: Lambda processes up to 10 messages (default) with 2s batching window.
   Adjust based on message volume and processing time requirements.

3. DLQ Strategy: Messages are retried up to 5 times (maxReceiveCount) before going to DLQ.
   Monitor DLQ alarm for immediate action on failed messages.

4. Cost Optimization:
   - DynamoDB on-demand billing for variable workload
   - SQS long polling (20s) reduces API calls
   - Optional TTL on DynamoDB to auto-expire old records
   - Lambda batching reduces invocations

5. Scaling: Lambda auto-scales with SQS. Adjust batch_size and reserved concurrency if needed.
*/
```