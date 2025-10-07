### Reasoning Trace
---

Alright, I'm tasked with creating a complete and deployable Terraform script  for a financial firm's batch processing system. This script needs to be self-contained and include all the necessary components like variable declarations, existing values, Terraform logic, and outputs. The script should reference an `aws_region` variable that is passed from an existing `provider.tf`.

The architecture requires several AWS components:
1. AWS Batch for processing 1M transactions within a 4-hour window
2. Lambda functions for orchestration
3. S3 buckets for input data and output reports
4. DynamoDB for job status tracking
5. CloudWatch for monitoring
6. SNS for notifications
7. IAM roles with least privilege
8. Security & compliance features (encryption, logging, GuardDuty, VPC Endpoints, Security Groups)
9. Resource tagging

Let's start by organizing the Terraform script, beginning with variables, then resources, and ending with outputs.

```terraform
# Variables
variable "aws_region" {
  description = "The AWS region to deploy to (from provider.tf)"
  type        = string
}

variable "environment" {
  description = "Environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Finance Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Transaction Batch Processing"
}

variable "vpc_id" {
  description = "The VPC ID where resources will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the AWS Batch compute environment"
  type        = list(string)
}

variable "transactions_per_job" {
  description = "Number of transactions to process per batch job"
  type        = number
  default     = 10000  # This would mean 100 jobs for 1M transactions
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "finance-alerts@example.com"
}

variable "max_vcpus" {
  description = "Maximum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 256  # Adjust based on transaction processing requirements
}

variable "min_vcpus" {
  description = "Minimum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0  # Start with 0 to save costs when idle
}

variable "desired_vcpus" {
  description = "Desired vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0  # Start with 0 and scale up as needed
}

variable "compute_type" {
  description = "Type of compute environment (EC2 or FARGATE)"
  type        = string
  default     = "EC2"
  validation {
    condition     = contains(["EC2", "FARGATE"], var.compute_type)
    error_message = "Compute type must be either EC2 or FARGATE."
  }
}

variable "instance_types" {
  description = "List of instance types for AWS Batch compute environment"
  type        = list(string)
  default     = ["c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge"]  # Compute-optimized instances
}

variable "job_timeout_seconds" {
  description = "Timeout for batch jobs in seconds (should allow for completion within 4 hour window)"
  type        = number
  default     = 14400  # 4 hours in seconds
}

variable "retry_attempts" {
  description = "Number of retry attempts for failed jobs"
  type        = number
  default     = 3
}

# Now, let's create the resources

# KMS Keys for encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "kms:*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:CallerAccount": "${data.aws_caller_identity.current.account_id}"
        }
      }
    }
  ]
}
EOF
}

resource "aws_kms_key" "sns_key" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "kms:*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:CallerAccount": "${data.aws_caller_identity.current.account_id}"
        }
      }
    }
  ]
}
EOF
}

resource "aws_kms_key" "dynamo_key" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "kms:*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:CallerAccount": "${data.aws_caller_identity.current.account_id}"
        }
      }
    }
  ]
}
EOF
}

# KMS Key Aliases
resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/s3-encryption-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_alias" "sns_key_alias" {
  name          = "alias/sns-encryption-key"
  target_key_id = aws_kms_key.sns_key.key_id
}

resource "aws_kms_alias" "dynamo_key_alias" {
  name          = "alias/dynamo-encryption-key"
  target_key_id = aws_kms_key.dynamo_key.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "input_bucket" {
  bucket = "financial-batch-input-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "input_bucket_access" {
  bucket = aws_s3_bucket.input_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "output_bucket" {
  bucket = "financial-batch-output-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "output_bucket_access" {
  bucket = aws_s3_bucket.output_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for tracking job status
resource "aws_dynamodb_table" "job_status" {
  name         = "BatchJobStatus"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "JobId"
  
  attribute {
    name = "JobId"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamo_key.arn
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "job_notifications" {
  name              = "BatchJobNotifications"
  kms_master_key_id = aws_kms_key.sns_key.id
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.job_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# IAM Roles

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "BatchOrchestratorLambdaRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name        = "BatchOrchestratorLambdaPolicy"
  description = "Policy for Lambda to orchestrate Batch jobs"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "batch:SubmitJob",
        "batch:DescribeJobs",
        "batch:ListJobs",
        "batch:TerminateJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "${aws_dynamodb_table.job_status.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "${aws_s3_bucket.input_bucket.arn}",
        "${aws_s3_bucket.input_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.output_bucket.arn}",
        "${aws_s3_bucket.output_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "${aws_sns_topic.job_notifications.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": [
        "${aws_kms_key.s3_key.arn}",
        "${aws_kms_key.dynamo_key.arn}",
        "${aws_kms_key.sns_key.arn}"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IAM Role for AWS Batch
resource "aws_iam_role" "batch_service_role" {
  name = "BatchServiceRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "batch.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_service_role_attachment" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

# IAM Role for Batch Instances
resource "aws_iam_role" "batch_instance_role" {
  name = "BatchInstanceRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_instance_role_attachment" {
  role       = aws_iam_role.batch_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Policy for Batch Jobs
resource "aws_iam_policy" "batch_job_policy" {
  name        = "BatchJobPolicy"
  description = "Policy for Batch jobs to access required resources"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "${aws_s3_bucket.input_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.output_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": "${aws_dynamodb_table.job_status.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": [
        "${aws_kms_key.s3_key.arn}",
        "${aws_kms_key.dynamo_key.arn}"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "batch_job_policy_attachment" {
  role       = aws_iam_role.batch_instance_role.name
  policy_arn = aws_iam_policy.batch_job_policy.arn
}

# Instance Profile for Batch EC2 instances
resource "aws_iam_instance_profile" "batch_instance_profile" {
  name = "BatchInstanceProfile"
  role = aws_iam_role.batch_instance_role.name
}

# Security Group for Batch Compute Environment
resource "aws_security_group" "batch_sg" {
  name        = "batch-compute-sg"
  description = "Security group for Batch compute environment"
  vpc_id      = var.vpc_id
  
  # Outbound internet access for downloading container images etc.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Batch Compute Environment
resource "aws_batch_compute_environment" "compute_env" {
  compute_environment_name = "financial-batch-compute-env"
  
  compute_resources {
    type                = var.compute_type
    max_vcpus           = var.max_vcpus
    min_vcpus           = var.min_vcpus
    desired_vcpus       = var.desired_vcpus
    instance_types      = var.instance_types
    subnets             = var.subnet_ids
    security_group_ids  = [aws_security_group.batch_sg.id]
    instance_role       = aws_iam_instance_profile.batch_instance_profile.arn
    
    tags = {
      Environment = var.environment
      Owner       = var.owner
      Project     = var.project
    }
  }
  
  service_role = aws_iam_role.batch_service_role.arn
  type         = "MANAGED"
  state        = "ENABLED"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.batch_service_role_attachment
  ]
}

# AWS Batch Job Queue
resource "aws_batch_job_queue" "job_queue" {
  name                 = "financial-batch-job-queue"
  state                = "ENABLED"
  priority             = 1
  compute_environments = [aws_batch_compute_environment.compute_env.arn]
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Batch Job Definition
resource "aws_batch_job_definition" "job_definition" {
  name                  = "financial-transaction-processor"
  type                  = "container"
  container_properties  = jsonencode({
    image = "amazon/amazon-ecs-sample"  # Replace with your container image
    resourceRequirements = [
      {
        type  = "VCPU"
        value = "2"
      },
      {
        type  = "MEMORY"
        value = "4096"
      }
    ]
    environment = [
      {
        name  = "INPUT_BUCKET"
        value = aws_s3_bucket.input_bucket.bucket
      },
      {
        name  = "OUTPUT_BUCKET"
        value = aws_s3_bucket.output_bucket.bucket
      },
      {
        name  = "DYNAMODB_TABLE"
        value = aws_dynamodb_table.job_status.name
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]
    jobRoleArn = aws_iam_role.batch_instance_role.arn
    executionRoleArn = aws_iam_role.batch_instance_role.arn
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group" = "/aws/batch/financial-transaction-processor"
        "awslogs-region" = var.aws_region
        "awslogs-stream-prefix" = "batch"
      }
    }
  })
  
  retry_strategy {
    attempts = var.retry_attempts
  }
  
  timeout {
    attempt_duration_seconds = var.job_timeout_seconds
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda Function for Orchestration
resource "aws_lambda_function" "orchestrator" {
  function_name    = "BatchJobOrchestrator"
  filename         = "lambda_function.zip"  # Replace with your packaged Lambda code
  source_code_hash = filebase64sha256("lambda_function.zip")
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 300  # 5 minutes
  memory_size      = 256  # MB
  
  environment {
    variables = {
      JOB_QUEUE       = aws_batch_job_queue.job_queue.name
      JOB_DEFINITION  = aws_batch_job_definition.job_definition.name
      DYNAMODB_TABLE  = aws_dynamodb_table.job_status.name
      SNS_TOPIC       = aws_sns_topic.job_notifications.arn
      INPUT_BUCKET    = aws_s3_bucket.input_bucket.bucket
      TRANSACTIONS_PER_JOB = var.transactions_per_job
    }
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.orchestrator.function_name}"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Log Group for Batch Jobs
resource "aws_cloudwatch_log_group" "batch_log_group" {
  name              = "/aws/batch/financial-transaction-processor"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Alarm for Job Failures
resource "aws_cloudwatch_metric_alarm" "job_failures" {
  alarm_name          = "BatchJobFailures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedJobsCount"
  namespace           = "AWS/Batch"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This metric monitors batch job failures"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]
  
  dimensions = {
    JobQueue = aws_batch_job_queue.job_queue.name
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Alarm for Job Timeouts
resource "aws_cloudwatch_metric_alarm" "job_timeouts" {
  alarm_name          = "BatchJobTimeouts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "JobDuration"
  namespace           = "Custom/Batch"  # Would need to be populated by Lambda
  period              = 300
  statistic           = "Maximum"
  threshold           = var.job_timeout_seconds
  alarm_description   = "This metric monitors batch job durations"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3_endpoint" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  
  route_table_ids = []  # Add your route table IDs here
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb_endpoint" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  
  route_table_ids = []  # Add your route table IDs here
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Enable AWS GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Outputs
output "batch_compute_environment_arn" {
  description = "ARN of the AWS Batch compute environment"
  value       = aws_batch_compute_environment.compute_env.arn
}

output "batch_job_queue_arn" {
  description = "ARN of the AWS Batch job queue"
  value       = aws_batch_job_queue.job_queue.arn
}

output "batch_job_definition_arn" {
  description = "ARN of the AWS Batch job definition"
  value       = aws_batch_job_definition.job_definition.arn
}

output "lambda_function_arn" {
  description = "ARN of the orchestrator Lambda function"
  value       = aws_lambda_function.orchestrator.arn
}

output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input_bucket.bucket
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output_bucket.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB job status table"
  value       = aws_dynamodb_table.job_status.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.job_notifications.arn
}

output "kms_s3_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_key.arn
}

output "kms_sns_key_arn" {
  description = "ARN of the KMS key used for SNS encryption"
  value       = aws_kms_key.sns_key.arn
}

output "kms_dynamo_key_arn" {
  description = "ARN of the KMS key used for DynamoDB encryption"
  value       = aws_kms_key.dynamo_key.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}
```

However, I notice that there's a problem with this code. I'm using `data.aws_caller_identity.current.account_id` but I haven't defined that data source. Let me fix that and make a few other improvements before finalizing the code.

I'll need to add:
1. The `aws_caller_identity` data source
2. Make sure the Lambda function configuration is more detailed (including the dummy file)
3. Add an EventBridge rule to trigger the Lambda periodically for orchestration
4. Ensure proper integration between components

Let's refine the code:

```terraform
# Get the current AWS account ID
data "aws_caller_identity" "current" {}

# Variables
variable "aws_region" {
  description = "The AWS region to deploy to (from provider.tf)"
  type        = string
}

variable "environment" {
  description = "Environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Finance Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Transaction Batch Processing"
}

variable "vpc_id" {
  description = "The VPC ID where resources will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the AWS Batch compute environment"
  type        = list(string)
}

variable "transactions_per_job" {
  description = "Number of transactions to process per batch job"
  type        = number
  default     = 10000  # This would mean 100 jobs for 1M transactions
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "finance-alerts@example.com"
}

variable "max_vcpus" {
  description = "Maximum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 256  # Adjust based on transaction processing requirements
}

variable "min_vcpus" {
  description = "Minimum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0  # Start with 0 to save costs when idle
}

variable "desired_vcpus" {
  description = "Desired vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0  # Start with 0 and scale up as needed
}

variable "compute_type" {
  description = "Type of compute environment (EC2 or FARGATE)"
  type        = string
  default     = "EC2"
  validation {
    condition     = contains(["EC2", "FARGATE"], var.compute_type)
    error_message = "Compute type must be either EC2 or FARGATE."
  }
}

variable "instance_types" {
  description = "List of instance types for AWS Batch compute environment"
  type        = list(string)
  default     = ["c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge"]  # Compute-optimized instances
}

variable "job_timeout_seconds" {
  description = "Timeout for batch jobs in seconds (should allow for completion within 4 hour window)"
  type        = number
  default     = 14400  # 4 hours in seconds
}

variable "retry_attempts" {
  description = "Number of retry attempts for failed jobs"
  type        = number
  default     = 3
}

variable "schedule_expression" {
  description = "Schedule expression for triggering the batch processing"
  type        = string
  default     = "cron(0 0 * * ? *)"  # Run daily at midnight UTC
}

# Local variables for dummy Lambda code
locals {
  lambda_code = <<EOT
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // This is placeholder code - replace with your actual Lambda function logic
  // that would trigger AWS Batch jobs, monitor progress, and update DynamoDB
  
  return {
    statusCode: 200,
    body: JSON.stringify('Batch orchestration started'),
  };
};
EOT
}

# Create a temporary file for Lambda code
resource "local_file" "lambda_code" {
  content  = local.lambda_code
  filename = "${path.module}/lambda_function.js"
}

# Create a ZIP file for Lambda deployment
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda_function.zip"
}

# KMS Keys for encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_kms_key" "sns_key" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_kms_key" "dynamo_key" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
EOF
}

# KMS Key Aliases
resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/s3-encryption-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_alias" "sns_key_alias" {
  name          = "alias/sns-encryption-key"
  target_key_id = aws_kms_key.sns_key.key_id
}

resource "aws_kms_alias" "dynamo_key_alias" {
  name          = "alias/dynamo-encryption-key"
  target_key_id = aws_kms_key.dynamo_key.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "input_bucket" {
  bucket = "financial-batch-input-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "input_bucket_access" {
  bucket = aws_s3_bucket.input_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "output_bucket" {
  bucket = "financial-batch-output-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "output_bucket_access" {
  bucket = aws_s3_bucket.output_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for tracking job status
resource "aws_dynamodb_table" "job_status" {
  name         = "BatchJobStatus"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "JobId"
  
  attribute {
    name = "JobId"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamo_key.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "job_notifications" {
  name              = "BatchJobNotifications"
  kms_master_key_id = aws_kms_key.sns_key.id
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.job_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# IAM Roles

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "BatchOrchestratorLambdaRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name        = "BatchOrchestratorLambdaPolicy"
  description = "Policy for Lambda to orchestrate Batch jobs"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "batch:SubmitJob",
        "batch:DescribeJobs",
        "batch:ListJobs",
        "batch:TerminateJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "${aws_dynamodb_table.job_status.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "${aws_s3_bucket.input_bucket.arn}",
        "${aws_s3_bucket.input_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.output_bucket.arn}",
        "${aws_s3_bucket.output_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "${aws_sns_topic.job_notifications.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": [
        "${aws_kms_key.s3_key.arn}",
        "${aws_kms_key.dynamo_key.arn}",
        "${aws_kms_key.sns_key.arn}"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IAM Role for AWS Batch
resource "aws_iam_role" "batch_service_role" {
  name = "BatchServiceRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "batch.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_service_role_attachment" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

# IAM Role for Batch Instances
resource "aws_iam_role" "batch_instance_role" {
  name = "BatchInstanceRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_instance_role_attachment" {
  role       = aws_iam_role.batch_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Policy for Batch Jobs
resource "aws_iam_policy" "batch_job_policy" {
  name        = "BatchJobPolicy"
  description = "Policy for Batch jobs to access required resources"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "${aws_s3_bucket.input_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.output_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": "${aws_dynamodb_table.job_status.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": [
        "${aws_kms_key.s3_key.arn}",
        "${aws_kms_key.dynamo_key.arn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "batch_job_policy_attachment" {
  role       = aws_iam_role.batch_instance_role.name
  policy_arn = aws_iam_policy.batch_job_policy.arn
}

# Instance Profile for Batch EC2 instances
resource "aws_iam_instance_profile" "batch_instance_profile" {
  name = "BatchInstanceProfile"
  role = aws_iam_role.batch_instance_role.name
}

# Security Group for Batch Compute Environment
resource "aws_security_group" "batch_sg" {
  name        = "batch-compute-sg"
  description = "Security group for Batch compute environment"
  vpc_id      = var.vpc_id
  
  # Outbound access for container images etc.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Batch Compute Environment
resource "aws_batch_compute_environment" "compute_env" {
  compute_environment_name = "financial-batch-compute-env"
  
  compute_resources {
    type                = var.compute_type
    max_vcpus           = var.max_vcpus
    min_vcpus           = var.min_vcpus
    desired_vcpus       = var.desired_vcpus
    instance_types      = var.instance_types
    subnets             = var.subnet_ids
    security_group_ids  = [aws_security_group.batch_sg.id]
    instance_role       = aws_iam_instance_profile.batch_instance_profile.arn
    
    tags = {
      Environment = var.environment
      Owner       = var.owner
      Project     = var.project
    }
  }
  
  service_role = aws_iam_role.batch_service_role.arn
  type         = "MANAGED"
  state        = "ENABLED"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.batch_service_role_attachment
  ]
}

# AWS Batch Job Queue
resource "aws_batch_job_queue" "job_queue" {
  name                 = "financial-batch-job-queue"
  state                = "ENABLED"
  priority             = 1
  compute_environments = [aws_batch_compute_environment.compute_env.arn]
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Batch Job Definition
resource "aws_batch_job_definition" "job_definition" {
  name                  = "financial-transaction-processor"
  type                  = "container"
  container_properties  = jsonencode({
    image = "amazon/amazon-ecs-sample"  # Replace with your container image
    resourceRequirements = [
      {
        type  = "VCPU"
        value = "2"
      },
      {
        type  = "MEMORY"
        value = "4096"
      }
    ]
    environment = [
      {
        name  = "INPUT_BUCKET"
        value = aws_s3_bucket.input_bucket.bucket
      },
      {
        name  = "OUTPUT_BUCKET"
        value = aws_s3_bucket.output_bucket.bucket
      },
      {
        name  = "DYNAMODB_TABLE"
        value = aws_dynamodb_table.job_status.name
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]
    jobRoleArn = aws_iam_role.batch_instance_role.arn
    executionRoleArn = aws_iam_role.batch_instance_role.arn
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group" = aws_cloudwatch_log_group.batch_log_group.name
        "awslogs-region" = var.aws_region
        "awslogs-stream-prefix" = "batch"
      }
    }
  })
  
  retry_strategy {
    attempts = var.retry_attempts
  }
  
  timeout {
    attempt_duration_seconds = var.job_timeout_seconds
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda Function for Orchestration
resource "aws_lambda_function" "orchestrator" {
  function_name    = "BatchJobOrchestrator"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs14.x"
  handler          = "lambda_function.handler"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 300  # 5 minutes
  memory_size      = 256  # MB
  
  environment {
    variables = {
      JOB_QUEUE       = aws_batch_job_queue.job_queue.name
      JOB_DEFINITION  = aws_batch_job_definition.job_definition.name
      DYNAMODB_TABLE  = aws_dynamodb_table.job_status.name
      SNS_TOPIC       = aws_sns_topic.job_notifications.arn
      INPUT_BUCKET    = aws_s3_bucket.input_bucket.bucket
      TRANSACTIONS_PER_JOB = tostring(var.transactions_per_job)
    }
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    local_file.lambda_code
  ]
}

# EventBridge Rule to trigger Lambda
resource "aws_cloudwatch_event_rule" "batch_trigger" {
  name                = "trigger-batch-processing"
  description         = "Trigger batch processing at scheduled time"
  schedule_expression = var.schedule_expression
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.batch_trigger.name
  target_id = "InvokeLambda"
  arn       = aws_lambda_function.orchestrator.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.batch_trigger.arn
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.orchestrator.function_name}"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "batch_log_group" {
  name              = "/aws/batch/financial-transaction-processor"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "job_failures" {
  alarm_name          = "BatchJobFailures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedJobsCount"
  namespace           = "AWS/Batch"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This metric monitors batch job failures"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]
  
  dimensions = {
    JobQueue = aws_batch_job_queue.job_queue.name
  }
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "batch_dashboard" {
  dashboard_name = "FinancialBatchProcessing"
  
  dashboard_body = <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Batch", "JobsSucceeded", "JobQueue", "${aws_batch_job_queue.job_queue.name}" ],
          [ "AWS/Batch", "JobsFailed", "JobQueue", "${aws_batch_job_queue.job_queue.name}" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "${var.aws_region}",
        "title": "Batch Jobs Status"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Batch", "vCPUUtilization", "ComputeEnvironment", "${aws_batch_compute_environment.compute_env.compute_environment_name}" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "${var.aws_region}",
        "title": "Compute Environment CPU Utilization"
      }
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3_endpoint" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_vpc_endpoint" "dynamodb_endpoint" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Enable AWS GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Config Rule for S3 encryption
resource "aws_config_config_rule" "s3_encryption_enabled" {
  name = "s3-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_guardduty_detector.main]
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# AWS Config Rule for DynamoDB encryption
resource "aws_config_config_rule" "dynamodb_encryption_enabled" {
  name = "dynamodb-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_guardduty_detector.main]
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Outputs
output "batch_compute_environment_arn" {
  description = "ARN of the AWS Batch compute environment"
  value       = aws_batch_compute_environment.compute_env.arn
}

output "batch_job_queue_arn" {
  description = "ARN of the AWS Batch job queue"
  value       = aws_batch_job_queue.job_queue.arn
}

output "batch_job_definition_arn" {
  description = "ARN of the AWS Batch job definition"
  value       = aws_batch_job_definition.job_definition.arn
}

output "lambda_function_arn" {
  description = "ARN of the orchestrator Lambda function"
  value       = aws_lambda_function.orchestrator.arn
}

output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input_bucket.bucket
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output_bucket.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB job status table"
  value       = aws_dynamodb_table.job_status.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.job_notifications.arn
}

output "kms_s3_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_key.arn
}

output "kms_sns_key_arn" {
  description = "ARN of the KMS key used for SNS encryption"
  value       = aws_kms_key.sns_key.arn
}

output "kms_dynamo_key_arn" {
  description = "ARN of the KMS key used for DynamoDB encryption"
  value       = aws_kms_key.dynamo_key.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.batch_dashboard.dashboard_name
}
### Answer 
---

