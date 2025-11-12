# Event-Driven Payment Processing Pipeline - Error Tracking and Resolution

**Project**: Event-Driven Payment Processing Pipeline with SQS FIFO Queues  
**Date**: November 12, 2025  
**Environment**: Development (us-east-1)  
**Total Errors Resolved**: 5

***

## Error 1: Archive File Invalid Attribute Combination

**Category**: Configuration Error  
**Severity**: Critical

### Description
Terraform validation failed when attempting to create Lambda deployment packages using the `archive_file` data source. The error occurred for all three Lambda functions (transaction_validator, fraud_detector, notification_dispatcher).

### Root Cause
The `archive_file` data source does not support the `excludes` attribute when using `source_file`. The `excludes` parameter is only valid when using `source_dir` to archive an entire directory. Since we were packaging individual Python files, the excludes parameter was invalid.

### Impact
- **Operational**: Blocked initial terraform plan execution
- **Cost**: No cost impact
- **Security**: No security impact
- **Compliance**: No compliance impact

### Fix Applied

```hcl
# BEFORE (Incorrect)
data "archive_file" "transaction_validator_zip" {
  type        = "zip"
  source_file = "${path.module}/transaction_validator.py"
  output_path = "${path.module}/transaction_validator.zip"
  excludes    = ["__pycache__", "*.pyc"]  # INVALID with source_file
}

# AFTER (Correct)
data "archive_file" "transaction_validator_zip" {
  type        = "zip"
  source_file = "${path.module}/transaction_validator.py"
  output_path = "${path.module}/transaction_validator.zip"
}
```

### Prevention Strategy
When using the archive provider for Lambda functions, use `source_file` for single-file packages without excludes, or use `source_dir` with excludes when packaging multiple files or directories. Always validate archive provider documentation before implementing.

***

## Error 2: DynamoDB Deletion Protection Attribute Not Supported

**Category**: Configuration Error  
**Severity**: Medium

### Description
Terraform validation failed when attempting to create the DynamoDB table with the `deletion_protection` attribute set to false.

### Root Cause
The AWS provider version 5.x does not support the `deletion_protection` attribute for `aws_dynamodb_table` resources. This attribute exists in the AWS API but is not exposed in the Terraform AWS provider. DynamoDB tables are deletable by default in Terraform without this setting.

### Impact
- **Operational**: Blocked initial terraform plan execution
- **Cost**: No cost impact
- **Security**: No security impact (tables remain deletable via terraform destroy)
- **Compliance**: Testing requirements met without explicit attribute

### Fix Applied

```hcl
# BEFORE (Incorrect)
resource "aws_dynamodb_table" "payment_transactions" {
  name           = "payment-transactions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"
  
  # ... other configuration ...
  
  deletion_protection = false  # NOT SUPPORTED
  
  tags = {
    TablePurpose = "PaymentTransactions"
  }
}

# AFTER (Correct)
resource "aws_dynamodb_table" "payment_transactions" {
  name           = "payment-transactions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"
  
  # ... other configuration ...
  
  # deletion_protection attribute removed
  
  tags = {
    TablePurpose = "PaymentTransactions"
  }
}
```

### Prevention Strategy
Always verify Terraform resource attributes against the specific AWS provider version documentation. Do not assume AWS API attributes are automatically available in Terraform. For testing environments, default deletion behavior is acceptable.

***

## Error 3: EventBridge Pipes Missing Target Parameters

**Category**: Configuration Error  
**Severity**: Critical

### Description
EventBridge Pipes creation failed during terraform apply with validation error indicating missing required target parameter `TargetParameters.SqsQueueParameters`. This occurred for both pipes (validation-to-fraud and fraud-to-notification).

### Root Cause
When EventBridge Pipes uses SQS as a target, the `target_parameters` block with `sqs_queue_parameters` is mandatory to define how messages should be sent to the target queue. For FIFO queues, the message group ID must be specified to maintain ordering guarantees.

### Impact
- **Operational**: Blocked infrastructure deployment until fixed
- **Cost**: No cost impact (resources not created)
- **Security**: No security impact
- **Compliance**: Would have violated FIFO ordering requirements if deployed incorrectly

### Fix Applied

```hcl
# BEFORE (Incorrect)
resource "aws_pipes_pipe" "validation_to_fraud" {
  name       = "validation-to-fraud"
  role_arn   = aws_iam_role.validation_to_fraud_pipe_role.arn
  source     = aws_sqs_queue.transaction_validation.arn
  target     = aws_sqs_queue.fraud_detection.arn
  
  source_parameters {
    sqs_queue_parameters {
      batch_size                         = 1
      maximum_batching_window_in_seconds = 0
    }
  }
  
  # MISSING: target_parameters block
}

# AFTER (Correct)
resource "aws_pipes_pipe" "validation_to_fraud" {
  name       = "validation-to-fraud"
  role_arn   = aws_iam_role.validation_to_fraud_pipe_role.arn
  source     = aws_sqs_queue.transaction_validation.arn
  target     = aws_sqs_queue.fraud_detection.arn
  
  source_parameters {
    sqs_queue_parameters {
      batch_size                         = 1
      maximum_batching_window_in_seconds = 0
    }
  }
  
  target_parameters {
    sqs_queue_parameters {
      message_group_id = "$.messageGroupId"
    }
  }
}
```

### Prevention Strategy
When using EventBridge Pipes with SQS targets, always include the `target_parameters` block with appropriate SQS queue parameters. For FIFO queues, explicitly define message_group_id preservation using JSONPath expressions. Consult AWS EventBridge Pipes documentation for target-specific parameter requirements.

***

## Error 4: EventBridge Pipes IAM Role Missing GetQueueAttributes Permission

**Category**: Security/IAM Error  
**Severity**: Critical

### Description
EventBridge Pipes entered CREATE_FAILED state with error message indicating the provided IAM role lacks permission to call GetQueueAttributes on the source SQS queue. This occurred for both pipes during deployment.

### Root Cause
The IAM policies attached to EventBridge Pipes execution roles only granted ReceiveMessage and DeleteMessage permissions on source queues. However, EventBridge Pipes requires GetQueueAttributes permission to retrieve queue metadata such as message count, visibility timeout, and queue configuration during initialization and operation.

### Impact
- **Operational**: Complete deployment failure, pipes unable to function
- **Cost**: Resources created but non-functional until fixed
- **Security**: Principle of least privilege properly enforced, required explicit permission grant
- **Compliance**: IAM best practices followed by requiring explicit permissions

### Fix Applied

```hcl
# BEFORE (Incorrect)
resource "aws_iam_role_policy" "validation_to_fraud_pipe_policy" {
  name = "validation-to-fraud-pipe-policy"
  role = aws_iam_role.validation_to_fraud_pipe_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
          # MISSING: sqs:GetQueueAttributes
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Effect = "Allow"
        Action = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })
}

# AFTER (Correct)
resource "aws_iam_role_policy" "validation_to_fraud_pipe_policy" {
  name = "validation-to-fraud-pipe-policy"
  role = aws_iam_role.validation_to_fraud_pipe_role.id
  
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
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Effect = "Allow"
        Action = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })
}
```

Additionally, SQS queue policies were updated to grant GetQueueAttributes to pipe roles:

```hcl
resource "aws_sqs_queue_policy" "transaction_validation_policy" {
  queue_url = aws_sqs_queue.transaction_validation.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.validation_to_fraud_pipe_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      }
    ]
  })
}
```

### Prevention Strategy
When creating IAM policies for EventBridge Pipes accessing SQS queues, always include the following permissions on source queues: ReceiveMessage, DeleteMessage, and GetQueueAttributes. Ensure both the IAM role policy and the SQS queue resource policy grant these permissions. Test EventBridge Pipes integrations in non-production environments before production deployment.

***

## Error 5: SNS Topic Policy Missing Unique Statement IDs

**Category**: Configuration Error  
**Severity**: Medium

### Description
SNS topic policy creation failed with error message indicating that every policy statement must have a unique ID (Sid). The policy contained multiple statements without explicit Sid values, causing AWS to reject the policy.

### Root Cause
AWS SNS topic policies require each statement within the policy to have a unique Statement ID (Sid). When Sid is omitted, AWS attempts to auto-generate them, but this can fail when multiple statements are created simultaneously or when AWS cannot guarantee uniqueness.

### Impact
- **Operational**: Blocked deployment of notification functionality
- **Cost**: No cost impact
- **Security**: Policy not applied, default deny behavior prevented notifications
- **Compliance**: Access control not properly configured until fixed

### Fix Applied

```hcl
# BEFORE (Incorrect)
resource "aws_sns_topic_policy" "payment_notifications_policy" {
  arn = aws_sns_topic.payment_notifications.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # MISSING: Sid
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:GetTopicAttributes",
          "SNS:SetTopicAttributes",
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.payment_notifications.arn
      },
      {
        # MISSING: Sid (duplicate would cause conflict)
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.notification_dispatcher_role.arn
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.payment_notifications.arn
      }
    ]
  })
}

# AFTER (Correct)
resource "aws_sns_topic_policy" "payment_notifications_policy" {
  arn = aws_sns_topic.payment_notifications.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:GetTopicAttributes",
          "SNS:SetTopicAttributes",
          "SNS:AddPermission",
          "SNS:RemovePermission",
          "SNS:DeleteTopic",
          "SNS:Subscribe",
          "SNS:ListSubscriptionsByTopic",
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.payment_notifications.arn
      },
      {
        Sid    = "LambdaPublishAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.notification_dispatcher_role.arn
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.payment_notifications.arn
      }
    ]
  })
}
```

### Prevention Strategy
Always include explicit Sid values for all statements in AWS resource policies (SNS, SQS, S3, etc.). Use descriptive Sid names that indicate the purpose of each statement (e.g., "RootAccess", "LambdaPublishAccess"). This improves readability and prevents AWS auto-generation conflicts. Additionally, apply the same pattern to SQS queue policies for consistency.

***

## Summary Statistics

**Total Errors**: 5  
**Critical**: 3  
**Medium**: 2  
**Categories**: Configuration (4), Security/IAM (1)

**Resolution Time**: All errors resolved during initial deployment phase  
**Final Deployment Status**: Success - 43 resources created

**Key Lessons Learned**:
1. Verify Terraform provider documentation for attribute support across versions
2. EventBridge Pipes requires comprehensive IAM permissions including GetQueueAttributes
3. Always specify target_parameters when using EventBridge Pipes with SQS targets
4. Include explicit Sid values in all AWS resource policies
5. Archive provider behavior differs between source_file and source_dir modes

***