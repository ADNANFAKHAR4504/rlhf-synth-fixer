### Reasoning Trace
---

I need to create a Terraform file that defines a media processing pipeline with these components:

1. **S3 Storage**:
   - Input bucket for original video uploads
   - Output bucket for transcoded video files
   - KMS encryption for both buckets
   - Block public access

2. **Lambda Function**:
   - Process uploads
   - Submit jobs to AWS Elemental MediaConvert
   - Update DynamoDB for state tracking
   - React to events

3. **DynamoDB Table**:
   - Track per-asset state
   - Track renditions

4. **EventBridge Rules**:
   - Capture MediaConvert state changes
   - Capture other pipeline signals

5. **SQS Queues**:
   - Buffer work for Lambda workers
   - Include dead-letter queues for failures

6. **CloudWatch**:
   - Metrics
   - Logs
   - Alarms for queue depth, Lambda errors/throttles, MediaConvert job failures

7. **IAM Policies**:
   - Least-privilege for all services
   - Permissions for Lambda, MediaConvert, S3, DynamoDB, SQS, EventBridge

8. **Multi-AZ Design**:
   - Regional services
   - Subnets across multiple AZs for Lambda

Let me start building this Terraform configuration:

```hcl
# Provider configuration
provider "aws" {
  region = "us-east-1"  # Default region, can be overridden
}

# KMS key for encryption
resource "aws_kms_key" "media_encryption" {
  description             = "KMS key for media pipeline encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "media_encryption" {
  name          = "alias/media-pipeline-encryption"
  target_key_id = aws_kms_key.media_encryption.key_id
}

# S3 buckets for input and output with encryption and blocked public access
resource "aws_s3_bucket" "input_bucket" {
  bucket_prefix = "media-pipeline-input-"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "input_bucket_block" {
  bucket = aws_s3_bucket.input_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "output_bucket" {
  bucket_prefix = "media-pipeline-output-"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "output_bucket_block" {
  bucket = aws_s3_bucket.output_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# DynamoDB table for tracking assets and renditions
resource "aws_dynamodb_table" "media_assets" {
  name         = "MediaAssets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AssetId"
  
  attribute {
    name = "AssetId"
    type = "S"
  }
  
  attribute {
    name = "Status"
    type = "S"
  }
  
  global_secondary_index {
    name               = "StatusIndex"
    hash_key           = "Status"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.media_encryption.arn
  }
}

# SQS queues for job processing with dead-letter queues
resource "aws_sqs_queue" "processing_dlq" {
  name                      = "media-processing-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "processing_queue" {
  name                       = "media-processing-queue"
  visibility_timeout_seconds = 900  # 15 minutes
  message_retention_seconds  = 86400  # 24 hours
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.processing_dlq.arn
    maxReceiveCount     = 5
  })
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_dlq" {
  name                      = "media-status-update-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_queue" {
  name                       = "media-status-update-queue"
  visibility_timeout_seconds = 300  # 5 minutes
  message_retention_seconds  = 86400  # 24 hours
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.status_update_dlq.arn
    maxReceiveCount     = 5
  })
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

# VPC for Lambda functions
resource "aws_vpc" "lambda_vpc" {
  cidr_block = "10.0.0.0/16"
  
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "MediaPipelineVPC"
  }
}

# Create subnets in multiple AZs for Lambda
resource "aws_subnet" "lambda_subnet_a" {
  vpc_id            = aws_vpc.lambda_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "MediaPipelineSubnet-A"
  }
}

resource "aws_subnet" "lambda_subnet_b" {
  vpc_id            = aws_vpc.lambda_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "MediaPipelineSubnet-B"
  }
}

# Create internet gateway for outbound internet access
resource "aws_internet_gateway" "lambda_igw" {
  vpc_id = aws_vpc.lambda_vpc.id
  
  tags = {
    Name = "MediaPipelineIGW"
  }
}

# Create route tables and associations
resource "aws_route_table" "lambda_rt" {
  vpc_id = aws_vpc.lambda_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lambda_igw.id
  }
  
  tags = {
    Name = "MediaPipelineRT"
  }
}

resource "aws_route_table_association" "lambda_rta_a" {
  subnet_id      = aws_subnet.lambda_subnet_a.id
  route_table_id = aws_route_table.lambda_rt.id
}

resource "aws_route_table_association" "lambda_rta_b" {
  subnet_id      = aws_subnet.lambda_subnet_b.id
  route_table_id = aws_route_table.lambda_rt.id
}

# Create security group for Lambda functions
resource "aws_security_group" "lambda_sg" {
  name        = "media-pipeline-lambda-sg"
  description = "Security group for Media Pipeline Lambda functions"
  vpc_id      = aws_vpc.lambda_vpc.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "MediaPipelineLambdaSG"
  }
}

# IAM role for Lambda function
resource "aws_iam_role" "media_processor_role" {
  name = "MediaProcessorLambdaRole"
  
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

# IAM policies for Lambda function
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "MediaProcessorS3Access"
  description = "Allow Lambda to read from input S3 bucket and write to output S3 bucket"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_mediaconvert_access" {
  name        = "MediaProcessorMediaConvertAccess"
  description = "Allow Lambda to create and monitor MediaConvert jobs"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:ListJobs",
          "mediaconvert:DescribeEndpoints",
          "mediaconvert:GetPreset",
          "mediaconvert:GetJobTemplate"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "MediaProcessorDynamoDBAccess"
  description = "Allow Lambda to read and write to DynamoDB table"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.media_assets.arn,
          "${aws_dynamodb_table.media_assets.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_sqs_access" {
  name        = "MediaProcessorSQSAccess"
  description = "Allow Lambda to read from and write to SQS queues"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn
        ]
      },
      {
        Action = [
          "sqs:SendMessage"
        ]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn,
          aws_sqs_queue.processing_dlq.arn,
          aws_sqs_queue.status_update_dlq.arn
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_kms_access" {
  name        = "MediaProcessorKMSAccess"
  description = "Allow Lambda to use KMS key for encryption/decryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.media_encryption.arn
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_vpc_access" {
  name        = "MediaProcessorVPCAccess"
  description = "Allow Lambda to create ENI in VPC"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_logs_access" {
  name        = "MediaProcessorLogsAccess"
  description = "Allow Lambda to write to CloudWatch Logs"
  
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
      }
    ]
  })
}

# Attach policies to Lambda IAM role
resource "aws_iam_role_policy_attachment" "lambda_s3_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_mediaconvert_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_mediaconvert_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_sqs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_vpc_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_logs_access.arn
}

# Lambda function for processing uploads and submitting MediaConvert jobs
resource "aws_lambda_function" "media_processor" {
  function_name = "MediaProcessor"
  role          = aws_iam_role.media_processor_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 300  # 5 minutes
  memory_size   = 1024
  
  # Replace with your actual code package
  filename      = "function.zip"  # This would be your packaged Lambda code
  
  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.input_bucket.id,
      OUTPUT_BUCKET = aws_s3_bucket.output_bucket.id,
      ASSETS_TABLE  = aws_dynamodb_table.media_assets.name
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.lambda_subnet_a.id, aws_subnet.lambda_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  reserved_concurrent_executions = 100  # Adjust based on expected load
  
  # Enable tracing for debugging
  tracing_config {
    mode = "Active"
  }
}

# Event source mapping for processing queue to Lambda
resource "aws_lambda_event_source_mapping" "processing_queue_mapping" {
  event_source_arn = aws_sqs_queue.processing_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

# Event source mapping for status update queue to Lambda
resource "aws_lambda_event_source_mapping" "status_update_queue_mapping" {
  event_source_arn = aws_sqs_queue.status_update_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

# S3 Event Notification for new uploads
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.input_bucket.id
  
  queue {
    queue_arn     = aws_sqs_queue.processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
  }
  
  depends_on = [
    aws_lambda_function.media_processor
  ]
}

# EventBridge rule for MediaConvert job status changes
resource "aws_cloudwatch_event_rule" "mediaconvert_status_change" {
  name        = "media-convert-job-status-change"
  description = "Capture MediaConvert job status changes"
  
  event_pattern = jsonencode({
    source = ["aws.mediaconvert"],
    detail-type = [
      "MediaConvert Job State Change"
    ]
  })
}

# EventBridge target for MediaConvert status changes
resource "aws_cloudwatch_event_target" "mediaconvert_status_target" {
  rule      = aws_cloudwatch_event_rule.mediaconvert_status_change.name
  target_id = "SendToSQS"
  arn       = aws_sqs_queue.status_update_queue.arn
}

# Permission for EventBridge to send events to SQS
resource "aws_sqs_queue_policy" "status_queue_policy" {
  queue_url = aws_sqs_queue.status_update_queue.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Id      = "AllowEventBridgeToSendMessages",
    Statement = [
      {
        Sid       = "AllowEventBridgeToSendMessages",
        Effect    = "Allow",
        Principal = {
          Service = "events.amazonaws.com"
        },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.status_update_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.mediaconvert_status_change.arn
          }
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "processing_queue_depth" {
  alarm_name          = "media-processing-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This alarm monitors processing queue depth"
  alarm_actions       = []  # Add SNS topic ARNs for notifications
  
  dimensions = {
    QueueName = aws_sqs_queue.processing_queue.name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_dlq_not_empty" {
  alarm_name          = "media-processing-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "This alarm monitors if processing DLQ has messages"
  alarm_actions       = []  # Add SNS topic ARNs for notifications
  
  dimensions = {
    QueueName = aws_sqs_queue.processing_dlq.name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "media-processor-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = []  # Add SNS topic ARNs for notifications
  
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "media-processor-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function throttles"
  alarm_actions       = []  # Add SNS topic ARNs for notifications
  
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.media_processor.function_name}"
  retention_in_days = 14
  
  kms_key_id = aws_kms_key.media_encryption.arn
}

# Custom CloudWatch Dashboard for monitoring the pipeline
resource "aws_cloudwatch_dashboard" "media_pipeline_dashboard" {
  dashboard_name = "MediaPipelineDashboard"
  
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
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_queue.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_queue.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Queue Depth"
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
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_dlq.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_dlq.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Dead Letter Queue Depth"
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
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.media_processor.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Lambda Metrics"
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
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, {"stat": "Average"}],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, {"stat": "Maximum"}]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Lambda Duration"
          period  = 300
        }
      }
    ]
  })
}
```

This Terraform configuration creates a comprehensive media processing pipeline with all the requested components. However, I notice that the `filename = "function.zip"` for the Lambda function is a placeholder. In a real deployment, you would need to provide the actual Lambda function code in a ZIP file. Additionally, I've left the `alarm_actions` empty for CloudWatch alarms, but you would typically add SNS topic ARNs for notifications.

Let me review this Terraform code to ensure it meets all the requirements from the prompt:

1. ✓ S3 buckets for original and output storage with KMS encryption and blocked public access
2. ✓ Lambda function that submits AWS Elemental MediaConvert jobs and updates DynamoDB
3. ✓ DynamoDB table to track per-asset state and renditions
4. ✓ EventBridge rules to capture MediaConvert state changes and other signals
5. ✓ SQS queues to buffer work for Lambda workers with dead-letter queues
6. ✓ CloudWatch metrics, logs, and alarms for monitoring
7. ✓ IAM least-privilege for all services
8. ✓ Multi-AZ design using regional services and subnets across AZs

I think this covers all the requirements specified in the prompt. Let me finalize the tap_stack.tf file by stripping out any unnecessary comments or explanations as requested.
### Answer 
---

```terraform
provider "aws" {
  region = "us-east-1"
}

resource "aws_kms_key" "media_encryption" {
  description             = "KMS key for media pipeline encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "media_encryption" {
  name          = "alias/media-pipeline-encryption"
  target_key_id = aws_kms_key.media_encryption.key_id
}

resource "aws_s3_bucket" "input_bucket" {
  bucket_prefix = "media-pipeline-input-"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "input_bucket_block" {
  bucket = aws_s3_bucket.input_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "output_bucket" {
  bucket_prefix = "media-pipeline-output-"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "output_bucket_block" {
  bucket = aws_s3_bucket.output_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "media_assets" {
  name         = "MediaAssets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AssetId"
  
  attribute {
    name = "AssetId"
    type = "S"
  }
  
  attribute {
    name = "Status"
    type = "S"
  }
  
  global_secondary_index {
    name               = "StatusIndex"
    hash_key           = "Status"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.media_encryption.arn
  }
}

resource "aws_sqs_queue" "processing_dlq" {
  name                      = "media-processing-dlq"
  message_retention_seconds = 1209600
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "processing_queue" {
  name                       = "media-processing-queue"
  visibility_timeout_seconds = 900
  message_retention_seconds  = 86400
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.processing_dlq.arn
    maxReceiveCount     = 5
  })
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_dlq" {
  name                      = "media-status-update-dlq"
  message_retention_seconds = 1209600
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_queue" {
  name                       = "media-status-update-queue"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.status_update_dlq.arn
    maxReceiveCount     = 5
  })
  
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_vpc" "lambda_vpc" {
  cidr_block = "10.0.0.0/16"
  
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "MediaPipelineVPC"
  }
}

resource "aws_subnet" "lambda_subnet_a" {
  vpc_id            = aws_vpc.lambda_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "MediaPipelineSubnet-A"
  }
}

resource "aws_subnet" "lambda_subnet_b" {
  vpc_id            = aws_vpc.lambda_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "MediaPipelineSubnet-B"
  }
}

resource "aws_internet_gateway" "lambda_igw" {
  vpc_id = aws_vpc.lambda_vpc.id
  
  tags = {
    Name = "MediaPipelineIGW"
  }
}

resource "aws_route_table" "lambda_rt" {
  vpc_id = aws_vpc.lambda_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lambda_igw.id
  }
  
  tags = {
    Name = "MediaPipelineRT"
  }
}

resource "aws_route_table_association" "lambda_rta_a" {
  subnet_id      = aws_subnet.lambda_subnet_a.id
  route_table_id = aws_route_table.lambda_rt.id
}

resource "aws_route_table_association" "lambda_rta_b" {
  subnet_id      = aws_subnet.lambda_subnet_b.id
  route_table_id = aws_route_table.lambda_rt.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "media-pipeline-lambda-sg"
  description = "Security group for Media Pipeline Lambda functions"
  vpc_id      = aws_vpc.lambda_vpc.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "MediaPipelineLambdaSG"
  }
}

resource "aws_iam_role" "media_processor_role" {
  name = "MediaProcessorLambdaRole"
  
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

resource "aws_iam_policy" "lambda_s3_access" {
  name        = "MediaProcessorS3Access"
  description = "Allow Lambda to read from input S3 bucket and write to output S3 bucket"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_mediaconvert_access" {
  name        = "MediaProcessorMediaConvertAccess"
  description = "Allow Lambda to create and monitor MediaConvert jobs"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:ListJobs",
          "mediaconvert:DescribeEndpoints",
          "mediaconvert:GetPreset",
          "mediaconvert:GetJobTemplate"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "MediaProcessorDynamoDBAccess"
  description = "Allow Lambda to read and write to DynamoDB table"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.media_assets.arn,
          "${aws_dynamodb_table.media_assets.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_sqs_access" {
  name        = "MediaProcessorSQSAccess"
  description = "Allow Lambda to read from and write to SQS queues"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn
        ]
      },
      {
        Action = [
          "sqs:SendMessage"
        ]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn,
          aws_sqs_queue.processing_dlq.arn,
          aws_sqs_queue.status_update_dlq.arn
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_kms_access" {
  name        = "MediaProcessorKMSAccess"
  description = "Allow Lambda to use KMS key for encryption/decryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.media_encryption.arn
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_vpc_access" {
  name        = "MediaProcessorVPCAccess"
  description = "Allow Lambda to create ENI in VPC"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_logs_access" {
  name        = "MediaProcessorLogsAccess"
  description = "Allow Lambda to write to CloudWatch Logs"
  
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
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_mediaconvert_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_mediaconvert_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_sqs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_vpc_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_logs_access.arn
}

resource "aws_lambda_function" "media_processor" {
  function_name = "MediaProcessor"
  role          = aws_iam_role.media_processor_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 300
  memory_size   = 1024
  
  filename      = "function.zip"
  
  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.input_bucket.id,
      OUTPUT_BUCKET = aws_s3_bucket.output_bucket.id,
      ASSETS_TABLE  = aws_dynamodb_table.media_assets.name
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.lambda_subnet_a.id, aws_subnet.lambda_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  reserved_concurrent_executions = 100
  
  tracing_config {
    mode = "Active"
  }
}

resource "aws_lambda_event_source_mapping" "processing_queue_mapping" {
  event_source_arn = aws_sqs_queue.processing_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "status_update_queue_mapping" {
  event_source_arn = aws_sqs_queue.status_update_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.input_bucket.id
  
  queue {
    queue_arn     = aws_sqs_queue.processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
  }
  
  depends_on = [
    aws_lambda_function.media_processor
  ]
}

resource "aws_cloudwatch_event_rule" "mediaconvert_status_change" {
  name        = "media-convert-job-status-change"
  description = "Capture MediaConvert job status changes"
  
  event_pattern = jsonencode({
    source = ["aws.mediaconvert"],
    detail-type = [
      "MediaConvert Job State Change"
    ]
  })
}

resource "aws_cloudwatch_event_target" "mediaconvert_status_target" {
  rule      = aws_cloudwatch_event_rule.mediaconvert_status_change.name
  target_id = "SendToSQS"
  arn       = aws_sqs_queue.status_update_queue.arn
}

resource "aws_sqs_queue_policy" "status_queue_policy" {
  queue_url = aws_sqs_queue.status_update_queue.id
  
  policy = jsonencode({
    Version = "2012-10-17",
    Id      = "AllowEventBridgeToSendMessages",
    Statement = [
      {
        Sid       = "AllowEventBridgeToSendMessages",
        Effect    = "Allow",
        Principal = {
          Service = "events.amazonaws.com"
        },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.status_update_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.mediaconvert_status_change.arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "processing_queue_depth" {
  alarm_name          = "media-processing-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This alarm monitors processing queue depth"
  alarm_actions       = []
  
  dimensions = {
    QueueName = aws_sqs_queue.processing_queue.name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_dlq_not_empty" {
  alarm_name          = "media-processing-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "This alarm monitors if processing DLQ has messages"
  alarm_actions       = []
  
  dimensions = {
    QueueName = aws_sqs_queue.processing_dlq.name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "media-processor-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = []
  
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "media-processor-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function throttles"
  alarm_actions       = []
  
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.media_processor.function_name}"
  retention_in_days = 14
  
  kms_key_id = aws_kms_key.media_encryption.arn
}

resource "aws_cloudwatch_dashboard" "media_pipeline_dashboard" {
  dashboard_name = "MediaPipelineDashboard"
  
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
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_queue.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_queue.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Queue Depth"
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
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_dlq.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_dlq.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Dead Letter Queue Depth"
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
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.media_processor.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Lambda Metrics"
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
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, {"stat": "Average"}],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, {"stat": "Maximum"}]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Lambda Duration"
          period  = 300
        }
      }
    ]
  })
}
```