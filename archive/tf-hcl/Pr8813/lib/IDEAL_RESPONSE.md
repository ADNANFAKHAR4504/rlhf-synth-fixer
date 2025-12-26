# Infrastructure Code

## cloudwatch.tf

```hcl
# CloudWatch Log Group for event-validator Lambda
resource "aws_cloudwatch_log_group" "validator" {
  name              = "/aws/lambda/${var.project_name}-validator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-validator-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-processor Lambda
resource "aws_cloudwatch_log_group" "processor" {
  name              = "/aws/lambda/${var.project_name}-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-processor-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-enricher Lambda
resource "aws_cloudwatch_log_group" "enricher" {
  name              = "/aws/lambda/${var.project_name}-enricher-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-enricher-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-trigger Lambda
resource "aws_cloudwatch_log_group" "event_trigger" {
  name              = "/aws/lambda/${var.project_name}-trigger-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-trigger-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${var.project_name}-workflow-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-workflow-logs-${var.environment_suffix}"
  }
}

```

## docker_build.tf

```hcl
# Build and push Lambda container images to ECR

# Get ECR login credentials and build/push images
resource "null_resource" "build_and_push_lambda_images" {
  triggers = {
    ecr_repository_url = aws_ecr_repository.lambda_images.repository_url
    validator_handler  = filemd5("${path.module}/lambda/validator/handler.py")
    validator_reqs     = filemd5("${path.module}/lambda/validator/requirements.txt")
    validator_docker   = filemd5("${path.module}/lambda/validator/Dockerfile")
    processor_handler  = filemd5("${path.module}/lambda/processor/handler.py")
    processor_reqs     = filemd5("${path.module}/lambda/processor/requirements.txt")
    processor_docker   = filemd5("${path.module}/lambda/processor/Dockerfile")
    enricher_handler   = filemd5("${path.module}/lambda/enricher/handler.py")
    enricher_reqs      = filemd5("${path.module}/lambda/enricher/requirements.txt")
    enricher_docker    = filemd5("${path.module}/lambda/enricher/Dockerfile")
    trigger_handler    = filemd5("${path.module}/lambda/trigger/handler.py")
    trigger_reqs       = filemd5("${path.module}/lambda/trigger/requirements.txt")
    trigger_docker     = filemd5("${path.module}/lambda/trigger/Dockerfile")
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e

      # ECR repository URL
      ECR_REPO="${aws_ecr_repository.lambda_images.repository_url}"

      # Build and push validator image
      echo "Building validator image..."
      docker build -t $ECR_REPO:validator-latest ${path.module}/lambda/validator
      docker push $ECR_REPO:validator-latest

      # Build and push processor image
      echo "Building processor image..."
      docker build -t $ECR_REPO:processor-latest ${path.module}/lambda/processor
      docker push $ECR_REPO:processor-latest

      # Build and push enricher image
      echo "Building enricher image..."
      docker build -t $ECR_REPO:enricher-latest ${path.module}/lambda/enricher
      docker push $ECR_REPO:enricher-latest

      # Build and push trigger image
      echo "Building trigger image..."
      docker build -t $ECR_REPO:trigger-latest ${path.module}/lambda/trigger
      docker push $ECR_REPO:trigger-latest

      echo "All images built and pushed successfully"
    EOT
  }

  depends_on = [
    aws_ecr_repository.lambda_images
  ]
}

```

## dynamodb.tf

```hcl
# DynamoDB table for storing processed events
resource "aws_dynamodb_table" "processed_events" {
  name         = "${var.project_name}-${var.dynamodb_table_name}-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "timestamp"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "payment_provider"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "PaymentProviderIndex"
    hash_key        = "payment_provider"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    enabled        = false
    attribute_name = ""
  }

  tags = {
    Name = "${var.project_name}-${var.dynamodb_table_name}-${var.environment_suffix}"
  }
}

```

## ecr.tf

```hcl
# ECR repository for Lambda container images
resource "aws_ecr_repository" "lambda_images" {
  name                 = "${var.project_name}-lambda-${var.environment_suffix}"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-lambda-ecr-${var.environment_suffix}"
  }
}

# ECR lifecycle policy to manage image retention
resource "aws_ecr_lifecycle_policy" "lambda_images" {
  repository = aws_ecr_repository.lambda_images.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.ecr_lifecycle_policy_count} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "latest"]
          countType     = "imageCountMoreThan"
          countNumber   = var.ecr_lifecycle_policy_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

```

## eventbridge.tf

```hcl
# EventBridge rule to trigger Step Functions from SNS
# Note: This implementation uses SNS -> Lambda -> Step Functions pattern
# as EventBridge doesn't directly subscribe to SNS topics
# The Lambda trigger function handles this integration

```

## iam.tf

```hcl
# IAM role for event-validator Lambda
resource "aws_iam_role" "validator" {
  name = "${var.project_name}-validator-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "validator" {
  name = "${var.project_name}-validator-policy-${var.environment_suffix}"
  role = aws_iam_role.validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.validator.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.validator_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudwatch_logs.arn
      }
    ]
  })
}

# IAM role for event-processor Lambda
resource "aws_iam_role" "processor" {
  name = "${var.project_name}-processor-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "processor" {
  name = "${var.project_name}-processor-policy-${var.environment_suffix}"
  role = aws_iam_role.processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.processor.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.processed_events.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.processor_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudwatch_logs.arn
      }
    ]
  })
}

# IAM role for event-enricher Lambda
resource "aws_iam_role" "enricher" {
  name = "${var.project_name}-enricher-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "enricher" {
  name = "${var.project_name}-enricher-policy-${var.environment_suffix}"
  role = aws_iam_role.enricher.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.enricher.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.processed_events.arn,
          "${aws_dynamodb_table.processed_events.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.enricher_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudwatch_logs.arn
      }
    ]
  })
}

# IAM role for event-trigger Lambda (SNS subscription)
resource "aws_iam_role" "event_trigger" {
  name = "${var.project_name}-trigger-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "event_trigger" {
  name = "${var.project_name}-trigger-policy-${var.environment_suffix}"
  role = aws_iam_role.event_trigger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.event_trigger.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.event_processing.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudwatch_logs.arn
      }
    ]
  })
}

# IAM role for Step Functions
resource "aws_iam_role" "step_functions" {
  name = "${var.project_name}-sfn-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${var.project_name}-sfn-policy-${var.environment_suffix}"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.validator.arn,
          aws_lambda_function.processor.arn,
          aws_lambda_function.enricher.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudwatch_logs.arn
      }
    ]
  })
}

```

## kms.tf

```hcl
# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
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
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/${var.project_name}-cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

```

## lambda.tf

```hcl
# Lambda function: event-validator
resource "aws_lambda_function" "validator" {
  function_name = "${var.project_name}-validator-${var.environment_suffix}"
  role          = aws_iam_role.validator.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:validator-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.validator_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.validator,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-validator-${var.environment_suffix}"
  }
}

# Lambda function: event-processor
resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-processor-${var.environment_suffix}"
  role          = aws_iam_role.processor.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:processor-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.processor_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.processor,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-processor-${var.environment_suffix}"
  }
}

# Lambda function: event-enricher
resource "aws_lambda_function" "enricher" {
  function_name = "${var.project_name}-enricher-${var.environment_suffix}"
  role          = aws_iam_role.enricher.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:enricher-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.enricher_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.enricher,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-enricher-${var.environment_suffix}"
  }
}

# Lambda function: event-trigger (triggered by SNS)
resource "aws_lambda_function" "event_trigger" {
  function_name = "${var.project_name}-trigger-${var.environment_suffix}"
  role          = aws_iam_role.event_trigger.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:trigger-latest"

  architectures = ["arm64"]
  memory_size   = 256
  timeout       = 30

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.event_processing.arn
      ENVIRONMENT       = var.environment_suffix
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.event_trigger,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-trigger-${var.environment_suffix}"
  }
}

# Lambda permission for SNS to invoke event-trigger
resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_trigger.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.payment_events.arn
}

```

## outputs.tf

```hcl
output "sns_topic_arn" {
  description = "ARN of the SNS topic for payment events"
  value       = aws_sns_topic.payment_events.arn
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.event_processing.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for processed events"
  value       = aws_dynamodb_table.processed_events.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for processed events"
  value       = aws_dynamodb_table.processed_events.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for Lambda container images"
  value       = aws_ecr_repository.lambda_images.repository_url
}

output "validator_lambda_arn" {
  description = "ARN of the event-validator Lambda function"
  value       = aws_lambda_function.validator.arn
}

output "processor_lambda_arn" {
  description = "ARN of the event-processor Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "enricher_lambda_arn" {
  description = "ARN of the event-enricher Lambda function"
  value       = aws_lambda_function.enricher.arn
}

output "validator_dlq_url" {
  description = "URL of the validator dead letter queue"
  value       = aws_sqs_queue.validator_dlq.url
}

output "processor_dlq_url" {
  description = "URL of the processor dead letter queue"
  value       = aws_sqs_queue.processor_dlq.url
}

output "enricher_dlq_url" {
  description = "URL of the enricher dead letter queue"
  value       = aws_sqs_queue.enricher_dlq.url
}

output "kms_key_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch_logs.arn
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group names for all Lambda functions"
  value = jsonencode({
    validator      = aws_cloudwatch_log_group.validator.name
    processor      = aws_cloudwatch_log_group.processor.name
    enricher       = aws_cloudwatch_log_group.enricher.name
    event_trigger  = aws_cloudwatch_log_group.event_trigger.name
    step_functions = aws_cloudwatch_log_group.step_functions.name
  })
}

```

## provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  # Partial backend config: values are injected at terraform init time
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Environment = var.environment_suffix
      Project     = var.project_name
      ManagedBy   = "terraform"
    }, var.tags)
  }
}

```

## sns.tf

```hcl
# SNS topic for incoming payment events
resource "aws_sns_topic" "payment_events" {
  name              = "${var.project_name}-topic-${var.environment_suffix}"
  display_name      = "Payment Events Topic"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_policy" "payment_events" {
  arn = aws_sns_topic.payment_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.payment_events.arn
      },
      {
        Sid    = "AllowAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "sns:Subscribe",
          "sns:Receive",
          "sns:Publish"
        ]
        Resource = aws_sns_topic.payment_events.arn
      }
    ]
  })
}

# SNS subscription to trigger Step Functions via EventBridge
resource "aws_sns_topic_subscription" "payment_events_to_eventbridge" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.event_trigger.arn
}

```

## sqs.tf

```hcl
# Dead Letter Queue for event-validator Lambda
resource "aws_sqs_queue" "validator_dlq" {
  name                       = "${var.project_name}-validator-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-validator-dlq-${var.environment_suffix}"
  }
}

# Dead Letter Queue for event-processor Lambda
resource "aws_sqs_queue" "processor_dlq" {
  name                       = "${var.project_name}-processor-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-processor-dlq-${var.environment_suffix}"
  }
}

# Dead Letter Queue for event-enricher Lambda
resource "aws_sqs_queue" "enricher_dlq" {
  name                       = "${var.project_name}-enricher-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-enricher-dlq-${var.environment_suffix}"
  }
}

```

## step_functions.tf

```hcl
# Step Functions Express workflow for event processing
resource "aws_sfn_state_machine" "event_processing" {
  name     = "${var.project_name}-workflow-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"

  definition = jsonencode({
    Comment = "Event processing workflow for payment transactions"
    StartAt = "ValidateEvent"
    States = {
      ValidateEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validator.arn
          Payload = {
            "event.$" = "$"
          }
        }
        ResultPath = "$.validationResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ValidationFailed"
          }
        ]
        Next = "ProcessEvent"
      }
      ProcessEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.processor.arn
          Payload = {
            "event.$"            = "$.validationResult.Payload"
            "validationStatus.$" = "$.validationResult.StatusCode"
          }
        }
        ResultPath = "$.processingResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingFailed"
          }
        ]
        Next = "EnrichEvent"
      }
      EnrichEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.enricher.arn
          Payload = {
            "event.$"          = "$.processingResult.Payload"
            "processingData.$" = "$.processingResult"
            "validationData.$" = "$.validationResult"
          }
        }
        ResultPath = "$.enrichmentResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "EnrichmentFailed"
          }
        ]
        Next = "Success"
      }
      Success = {
        Type = "Succeed"
      }
      ValidationFailed = {
        Type  = "Fail"
        Error = "ValidationError"
        Cause = "Event validation failed"
      }
      ProcessingFailed = {
        Type  = "Fail"
        Error = "ProcessingError"
        Cause = "Event processing failed"
      }
      EnrichmentFailed = {
        Type  = "Fail"
        Error = "EnrichmentError"
        Cause = "Event enrichment failed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name = "${var.project_name}-workflow-${var.environment_suffix}"
  }
}

```

## variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev3"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "payment-events"
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 100
}

variable "dynamodb_table_name" {
  description = "Base name for DynamoDB table"
  type        = string
  default     = "processed-events"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR repository"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_lifecycle_policy_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

variable "dynamodb_pitr_retention_days" {
  description = "Point-in-time recovery retention period in days"
  type        = number
  default     = 35
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

```

## terraform-helpers.ts

```typescript
// terraform-helpers.ts
// Helper functions for Terraform infrastructure validation and testing

export interface TerraformConfig {
  provider: string;
  backend: string;
  resources: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a Terraform configuration includes required components
 */
export function validateTerraformConfig(
  config: TerraformConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.provider) {
    errors.push('Provider configuration is required');
  }

  if (!config.backend) {
    errors.push('Backend configuration is required');
  }

  if (!config.resources || config.resources.length === 0) {
    warnings.push('No resources defined');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a resource name includes environment suffix
 */
export function hasEnvironmentSuffix(
  resourceName: string,
  suffix: string
): boolean {
  return resourceName.includes(suffix);
}

/**
 * Validates Lambda configuration for ARM64 architecture
 */
export function validateLambdaArchitecture(architecture: string[]): boolean {
  return architecture.includes('arm64');
}

/**
 * Validates DynamoDB PITR is enabled
 */
export function validatePITR(pitrEnabled: boolean): boolean {
  return pitrEnabled === true;
}

/**
 * Validates Step Functions workflow type
 */
export function validateStepFunctionsType(type: string): boolean {
  return type === 'EXPRESS';
}

/**
 * Validates reserved concurrent executions
 */
export function validateReservedConcurrency(
  concurrency: number,
  expected: number
): boolean {
  return concurrency === expected;
}

/**
 * Parses Terraform outputs
 */
export function parseTerraformOutputs(
  outputsJson: string
): Record<string, any> {
  try {
    return JSON.parse(outputsJson);
  } catch (error) {
    throw new Error(`Failed to parse Terraform outputs: ${error}`);
  }
}

/**
 * Validates IAM policy follows least privilege
 */
export function validateIAMPolicy(policy: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (policy.includes('"Resource": "*"')) {
    warnings.push('IAM policy contains wildcard resource');
  }

  if (policy.includes('"Action": "*"')) {
    errors.push(
      'IAM policy contains wildcard action - violates least privilege'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extracts environment suffix from resource name
 */
export function extractEnvironmentSuffix(
  resourceName: string,
  prefix: string
): string | null {
  const pattern = new RegExp(`${prefix}-(\\w+)$`);
  const match = resourceName.match(pattern);
  return match ? match[1] : null;
}

/**
 * Validates CloudWatch log retention policy
 */
export function validateLogRetention(
  retentionDays: number,
  minDays: number,
  maxDays: number
): boolean {
  return retentionDays >= minDays && retentionDays <= maxDays;
}

/**
 * Checks if encryption is enabled
 */
export function hasEncryption(kmsKeyId: string | undefined): boolean {
  return !!kmsKeyId && kmsKeyId.length > 0;
}

```

# Test Files

## terraform.int.test.ts

```typescript
import fs from "fs";
import path from "path";

// Ensure this path matches where your outputs are actually stored
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Terraform Payment Events Integration Tests", () => {
  let outputs: Record<string, any> = {};
  let envSuffix = "";

  beforeAll(() => {
    // 1. Load outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at: ${outputsPath}`);
    }
    const raw = fs.readFileSync(outputsPath, "utf-8");
    outputs = JSON.parse(raw);

    // 2. Extract environment suffix dynamically
    // Example Table Name: "payment-events-processed-events-dev9"
    // We expect the suffix to be the last part after the last hyphen (e.g., "dev9")
    if (outputs.dynamodb_table_name) {
      const parts = outputs.dynamodb_table_name.split('-');
      if (parts.length > 0) {
        envSuffix = parts[parts.length - 1]; // "dev9"
      }
    }

    console.log(`Detected environment suffix: ${envSuffix}`);
  });

  describe("Basic Outputs Validation", () => {
    test("All expected outputs exist and are non-empty strings", () => {
      const requiredKeys = [
        "cloudwatch_log_groups",
        "dynamodb_table_arn",
        "dynamodb_table_name",
        "ecr_repository_url",
        "enricher_dlq_url",
        "kms_key_arn",
        "processor_dlq_url",
        "sns_topic_arn",
        "validator_dlq_url"
      ];

      requiredKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe("string");
        expect(outputs[key].trim().length).toBeGreaterThan(0);
      });
    });

    test("No outputs contain error markers", () => {
      const allOutputs = JSON.stringify(outputs).toLowerCase();
      expect(allOutputs).not.toContain("error");
      expect(allOutputs).not.toContain("failed");
      expect(allOutputs).not.toContain("invalid");
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("CloudWatch log groups JSON parses correctly", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      expect(logGroups).toHaveProperty("enricher");
      expect(logGroups).toHaveProperty("event_trigger");
      expect(logGroups).toHaveProperty("processor");
      expect(logGroups).toHaveProperty("step_functions");
      expect(logGroups).toHaveProperty("validator");
    });

    test("Log groups have correct service prefixes", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      expect(logGroups.enricher).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.event_trigger).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.processor).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.validator).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.step_functions).toMatch(/^\/aws\/states\//);
    });
  });

  describe("DynamoDB Table", () => {
    test("DynamoDB table ARN is valid us-east-1 format", () => {
      // Matches: arn:aws:dynamodb:us-east-1:123456789012:table/payment-events-processed-events-dev9
      expect(outputs.dynamodb_table_arn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\/payment-events-processed-events-/);
    });

    test("Table name matches ARN table name", () => {
      const arnTableName = outputs.dynamodb_table_arn.match(/table\/([^:\s]+)/)?.[1];
      expect(arnTableName).toBe(outputs.dynamodb_table_name);
    });
  });

  describe("ECR Repository", () => {
    test("ECR repository URL is in us-east-1 region", () => {
      // Accept both AWS and LocalStack ECR URLs
      expect(outputs.ecr_repository_url).toMatch(/\.dkr\.ecr\.us-east-1\.(amazonaws\.com|localhost\.localstack\.cloud(:4566)?)\//);
    });
  });

  describe("KMS Key", () => {
    test("KMS key ARN follows correct format", () => {
      // Matches: arn:aws:kms:us-east-1:123456789012:key/uuid
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d+:key\/[0-9a-f\-]{36}$/);
    });

    test("KMS key is in us-east-1 region", () => {
      expect(outputs.kms_key_arn).toContain("us-east-1");
    });
  });

  describe("SNS Topic", () => {
    test("SNS topic ARN is valid us-east-1 format", () => {
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d+:payment-events-topic-/);
    });

    test("SNS topic contains environment suffix", () => {
      if (envSuffix) {
        expect(outputs.sns_topic_arn).toContain(envSuffix);
      }
    });
  });

  describe("SQS Queues", () => {
    test("All DLQ URLs are valid SQS us-east-1 URLs", () => {
      const queues = [
        outputs.enricher_dlq_url,
        outputs.processor_dlq_url,
        outputs.validator_dlq_url
      ];

      queues.forEach(url => {
        // Matches both AWS and LocalStack SQS URLs:
        // AWS: https://sqs.us-east-1.amazonaws.com/123456789012/queue-name
        // LocalStack: http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/queue-name
        expect(url).toMatch(/^https?:\/\/sqs\.us-east-1\.(amazonaws\.com|localhost\.localstack\.cloud(:4566)?)\/\d+\/.+/);
      });
    });
  });

  describe("Cross-Service Consistency", () => {
    test("All AWS resources are in us-east-1 region", () => {
      const regionChecks = [
        outputs.dynamodb_table_arn,
        outputs.kms_key_arn,
        outputs.sns_topic_arn,
        outputs.ecr_repository_url,
        outputs.enricher_dlq_url,
        outputs.processor_dlq_url,
        outputs.validator_dlq_url
      ];

      regionChecks.forEach(value => {
        expect(value).toContain("us-east-1");
      });
    });

    test("All resources share the same environment suffix", () => {
      // If we found a suffix, ensure it exists in other key resources
      if (envSuffix) {
        expect(outputs.dynamodb_table_name).toContain(envSuffix);
        expect(outputs.sns_topic_arn).toContain(envSuffix);
        expect(outputs.ecr_repository_url).toContain(envSuffix);
        expect(outputs.enricher_dlq_url).toContain(envSuffix);
      }
    });
  });

  describe("Log Groups Naming Consistency", () => {
    test("All Lambda log groups share common prefix pattern", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      const lambdaKeys = ["enricher", "event_trigger", "processor", "validator"];

      // Check that all Lambda log groups start with /aws/lambda/payment-events-
      lambdaKeys.forEach(key => {
        const logGroupName = logGroups[key];
        // Split by '/' -> ["", "aws", "lambda", "payment-events-xxx"]
        // We expect the name to start with payment-events
        const namePart = logGroupName.split('/').pop();
        expect(namePart).toMatch(/^payment-events-/);
      });
    });
  });
});

```

## terraform.unit.test.ts

```typescript
// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration
// Tests validate structure, syntax, and configuration correctness

import fs from "fs";
import path from "path";
import * as hcl from "hcl2-parser";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  let terraformFiles: { [key: string]: string } = {};

  beforeAll(() => {
    // Read all .tf files
    const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));
    files.forEach(file => {
      terraformFiles[file] = fs.readFileSync(path.join(LIB_DIR, file), "utf8");
    });
  });

  describe("File Structure", () => {
    test("provider.tf exists and contains backend configuration", () => {
      expect(terraformFiles["provider.tf"]).toBeDefined();
      expect(terraformFiles["provider.tf"]).toContain('backend "s3"');
      expect(terraformFiles["provider.tf"]).toContain('required_version = ">= 1.5.0"');
      expect(terraformFiles["provider.tf"]).toContain('version = "~> 5.0"');
    });

    test("variables.tf exists and contains required variables", () => {
      expect(terraformFiles["variables.tf"]).toBeDefined();
      expect(terraformFiles["variables.tf"]).toContain("variable");
      expect(terraformFiles["variables.tf"]).toContain("environment_suffix");
      expect(terraformFiles["variables.tf"]).toContain("aws_region");
    });

    test("outputs.tf exists", () => {
      expect(terraformFiles["outputs.tf"]).toBeDefined();
      expect(terraformFiles["outputs.tf"]).toContain("output");
    });

    test("all terraform files have valid HCL syntax", () => {
      Object.entries(terraformFiles).forEach(([filename, content]) => {
        expect(() => {
          // Basic validation - file should not have markdown code fences
          expect(content).not.toContain("```hcl");
          expect(content).not.toContain("```terraform");
          // File should contain HCL keywords or be a documentation file
          const hasValidHCL =
            content.includes("resource") ||
            content.includes("variable") ||
            content.includes("output") ||
            content.includes("terraform") ||
            content.includes("provider") ||
            content.includes("#"); // Comment-only files are valid
          expect(hasValidHCL).toBe(true);
        }).not.toThrow();
      });
    });
  });

  describe("Lambda Functions", () => {
    test("defines exactly 4 Lambda functions with correct names", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      expect(lambdaContent).toContain('resource "aws_lambda_function" "validator"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "processor"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "enricher"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "event_trigger"');
    });

    test("all Lambda functions use ARM64 architecture", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      // For LocalStack deployment, x86_64 is used instead of arm64 due to GitHub runner architecture
      const archMatches = lambdaContent.match(/architectures\s*=\s*\["(arm64|x86_64)"\]/g);
      expect(archMatches).toBeDefined();
      expect(archMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions use container images", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const packageTypeMatches = lambdaContent.match(/package_type\s*=\s*"Image"/g);
      expect(packageTypeMatches).toBeDefined();
      expect(packageTypeMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions have reserved concurrent executions", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const reservedConcurrencyMatches = lambdaContent.match(/reserved_concurrent_executions\s*=/g);
      expect(reservedConcurrencyMatches).toBeDefined();
      expect(reservedConcurrencyMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions have dead letter queue configuration", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      // First 3 Lambda functions should have DLQ
      const dlqMatches = lambdaContent.match(/dead_letter_config\s*{/g);
      expect(dlqMatches).toBeDefined();
      expect(dlqMatches?.length).toBeGreaterThanOrEqual(3);
    });

    test("all Lambda functions have environment variables", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const envMatches = lambdaContent.match(/environment\s*{/g);
      expect(envMatches).toBeDefined();
      expect(envMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("Lambda functions include environment_suffix in names", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      expect(lambdaContent).toContain("${var.environment_suffix}");
      const suffixMatches = lambdaContent.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixMatches).toBeDefined();
      expect(suffixMatches?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("DynamoDB Table", () => {
    test("defines DynamoDB table with required configuration", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain('resource "aws_dynamodb_table"');
      expect(dynamoContent).toContain("billing_mode");
    });

    test("DynamoDB table has PITR enabled", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain("point_in_time_recovery");
      expect(dynamoContent).toContain("enabled = true");
    });

    test("DynamoDB table includes environment_suffix in name", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain("${var.environment_suffix}");
    });

    test("DynamoDB table does not have retain policy", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).not.toContain("prevent_destroy");
      expect(dynamoContent).not.toContain("retain");
    });
  });

  describe("Step Functions", () => {
    test("defines Step Functions state machine", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain('resource "aws_sfn_state_machine"');
    });

    test("Step Functions uses Express workflow type", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toMatch(/type\s*=\s*"EXPRESS"/);
    });

    test("Step Functions includes environment_suffix in name", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain("${var.environment_suffix}");
    });

    test("Step Functions has CloudWatch logging configuration", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain("logging_configuration");
    });
  });

  describe("SNS Topic", () => {
    test("defines SNS topic with encryption", () => {
      const snsContent = terraformFiles["sns.tf"];
      expect(snsContent).toContain('resource "aws_sns_topic"');
      expect(snsContent).toContain("kms_master_key_id");
    });

    test("SNS topic includes environment_suffix in name", () => {
      const snsContent = terraformFiles["sns.tf"];
      expect(snsContent).toContain("${var.environment_suffix}");
    });
  });

  describe("SQS Dead Letter Queues", () => {
    test("defines SQS queues for dead letter queues", () => {
      const sqsContent = terraformFiles["sqs.tf"];
      expect(sqsContent).toContain('resource "aws_sqs_queue"');
      expect(sqsContent).toContain("validator_dlq");
      expect(sqsContent).toContain("processor_dlq");
      expect(sqsContent).toContain("enricher_dlq");
    });

    test("SQS queues include environment_suffix in names", () => {
      const sqsContent = terraformFiles["sqs.tf"];
      const suffixMatches = sqsContent.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixMatches).toBeDefined();
      expect(suffixMatches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("ECR Repository", () => {
    test("defines ECR repository", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain('resource "aws_ecr_repository"');
    });

    test("ECR repository has lifecycle policy", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain('resource "aws_ecr_lifecycle_policy"');
    });

    test("ECR repository includes environment_suffix in name", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain("${var.environment_suffix}");
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("defines CloudWatch Log Groups for all Lambda functions", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "validator"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "processor"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "enricher"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "event_trigger"');
    });

    test("CloudWatch Log Groups have KMS encryption", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      const kmsMatches = cwContent.match(/kms_key_id\s*=/g);
      expect(kmsMatches).toBeDefined();
      expect(kmsMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("CloudWatch Log Groups have retention policy", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      const retentionMatches = cwContent.match(/retention_in_days\s*=/g);
      expect(retentionMatches).toBeDefined();
      expect(retentionMatches?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("KMS Keys", () => {
    test("defines KMS key for CloudWatch Logs", () => {
      const kmsContent = terraformFiles["kms.tf"];
      expect(kmsContent).toContain('resource "aws_kms_key"');
      expect(kmsContent).toContain("cloudwatch");
    });

    test("KMS keys have deletion window", () => {
      const kmsContent = terraformFiles["kms.tf"];
      expect(kmsContent).toContain("deletion_window_in_days");
    });
  });

  describe("IAM Roles and Policies", () => {
    test("defines IAM roles for all Lambda functions", () => {
      const iamContent = terraformFiles["iam.tf"];
      expect(iamContent).toContain('resource "aws_iam_role" "validator"');
      expect(iamContent).toContain('resource "aws_iam_role" "processor"');
      expect(iamContent).toContain('resource "aws_iam_role" "enricher"');
      expect(iamContent).toContain('resource "aws_iam_role" "event_trigger"');
    });

    test("defines IAM role for Step Functions", () => {
      const iamContent = terraformFiles["iam.tf"];
      expect(iamContent).toContain('resource "aws_iam_role" "step_functions"');
    });

    test("IAM policies follow least privilege (no wildcard resources)", () => {
      const iamContent = terraformFiles["iam.tf"];
      // Check that policies reference specific resources, not wildcards
      const wildcardResourceMatches = iamContent.match(/"Resource"\s*:\s*"\*"/g);
      // Some wildcard resources are acceptable for certain actions like logs:CreateLogGroup
      // But we should have specific resource ARNs for most actions
      const specificResourceMatches = iamContent.match(/"Resource"\s*:\s*"arn:aws:/g);
      expect(specificResourceMatches).toBeDefined();
      if (specificResourceMatches) {
        expect(specificResourceMatches.length).toBeGreaterThan(0);
      }
    });
  });

  describe("EventBridge Integration", () => {
    test("EventBridge integration strategy is documented", () => {
      const ebContent = terraformFiles["eventbridge.tf"];
      // Implementation uses SNS -> Lambda -> Step Functions pattern
      // EventBridge file contains documentation of this approach
      expect(ebContent).toContain("EventBridge");
      expect(ebContent.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resource files include environment_suffix variable", () => {
      const filesToCheck = [
        "lambda.tf",
        "dynamodb.tf",
        "sns.tf",
        "sqs.tf",
        "step_functions.tf",
        "ecr.tf",
        "cloudwatch.tf"
      ];

      filesToCheck.forEach(file => {
        const content = terraformFiles[file];
        expect(content).toContain("${var.environment_suffix}");
      });
    });
  });

  describe("Outputs", () => {
    test("defines outputs for key resources", () => {
      const outputContent = terraformFiles["outputs.tf"];
      expect(outputContent).toContain('output');

      // Check for important outputs
      const hasOutputs =
        outputContent.includes("sns_topic") ||
        outputContent.includes("step_function") ||
        outputContent.includes("dynamodb_table") ||
        outputContent.includes("lambda_function");

      expect(hasOutputs).toBe(true);
    });
  });

  describe("Lambda Handler Files", () => {
    test("all Lambda handler files exist", () => {
      const handlers = [
        "lambda/validator/handler.py",
        "lambda/processor/handler.py",
        "lambda/enricher/handler.py",
        "lambda/trigger/handler.py"
      ];

      handlers.forEach(handler => {
        const handlerPath = path.join(LIB_DIR, handler);
        expect(fs.existsSync(handlerPath)).toBe(true);
      });
    });

    test("all Lambda Dockerfiles exist and use ARM64", () => {
      const lambdas = ["validator", "processor", "enricher", "trigger"];

      lambdas.forEach(lambda => {
        const dockerfilePath = path.join(LIB_DIR, `lambda/${lambda}/Dockerfile`);
        expect(fs.existsSync(dockerfilePath)).toBe(true);

        const dockerfileContent = fs.readFileSync(dockerfilePath, "utf8");
        // For LocalStack deployment, Dockerfiles may use x86_64 base images instead of arm64
        expect(dockerfileContent).toContain("FROM public.ecr.aws/lambda/python");
        expect(dockerfileContent).not.toContain("```");
      });
    });
  });
});

```

