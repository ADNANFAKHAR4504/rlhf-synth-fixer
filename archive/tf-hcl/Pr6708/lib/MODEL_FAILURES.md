# Error 1: KMS Key Policy - CloudWatch Logs Access Denied

**Category:** Configuration

**Description:**
CloudWatch Logs log group creation failed with AccessDeniedException when attempting to use KMS encryption. The error indicated that the specified KMS key does not exist or is not allowed to be used with the log group ARN.

**Root Cause:**
KMS key policies were missing explicit permissions for the CloudWatch Logs service principal (`logs.amazonaws.com`). The initial policies only included service principals for S3, SQS, SNS, DynamoDB, and CloudTrail, but did not grant CloudWatch Logs the necessary `kms:GenerateDataKey*`, `kms:Decrypt`, and `kms:DescribeKey` permissions required to encrypt log groups.

**Impact:**
- **Operational:** Complete deployment failure - VPC Flow Logs, CloudTrail, and Lambda function log groups could not be created
- **Compliance:** Audit logging pipeline blocked, preventing PCI-DSS compliance requirements for log encryption
- **Security:** Inability to encrypt logs at rest with customer-managed KMS keys

**Fix Applied:**
```hcl
resource "aws_kms_key_policy" "dynamodb" {
  key_id = aws_kms_key.dynamodb.id
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
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow DynamoDB"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action   = ["kms:Decrypt", "kms:DescribeKey", "kms:CreateGrant"]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "dynamodb.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}
```

**Prevention Strategy:**
1. **Service Principal Mapping:** Create a reference matrix mapping each AWS service to its required KMS permissions and service principals during architecture design phase
2. **Policy Templates:** Develop reusable KMS policy templates for common service combinations (e.g., "logging-services", "database-services", "messaging-services")
3. **Automated Testing:** Implement pre-deployment validation that checks KMS key policies against intended resource usage
4. **Documentation:** Maintain living documentation of all service-to-KMS permission requirements in architecture decision records (ADRs)

***

## Error 2: S3 Bucket Policy - Malformed Condition Blocks

**Category:** Configuration

**Description:**
S3 bucket policy creation failed due to malformed condition blocks. The policy attempted to combine multiple service principals (CloudTrail and VPC Flow Logs) with incompatible condition statements, causing validation errors.

**Root Cause:**
The initial bucket policy incorrectly applied the same condition block (`s3:x-amz-acl: bucket-owner-full-control`) to both CloudTrail and VPC Flow Logs service principals. However, VPC Flow Logs does not support or require this ACL condition, and the combined policy structure created invalid IAM policy syntax.

**Impact:**
- **Operational:** VPC Flow Logs and CloudTrail could not deliver logs to the S3 audit bucket
- **Compliance:** Breaks audit trail integrity required for financial services compliance
- **Security:** Prevents centralized log storage for security incident investigation

**Fix Applied:**
```hcl
resource "aws_s3_bucket_policy" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs.arn}/vpc-flow-logs/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.audit_logs.arn
      },
      {
        Sid    = "AllowCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs.arn
      },
      {
        Sid    = "AllowCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}
```

**Prevention Strategy:**
1. **Service-Specific Policies:** Create separate policy statements for each AWS service with distinct permission requirements
2. **Policy Linting:** Use IAM policy simulators and tools like `checkov` or `tfsec` to validate policy syntax before deployment
3. **AWS Documentation Review:** Always verify service-specific S3 permission requirements in AWS documentation during design
4. **Prefix-Based Organization:** Use distinct S3 key prefixes for different log types (e.g., `/vpc-flow-logs/`, `/cloudtrail/`) to enable granular permission scoping

***

## Error 3: VPC Flow Logs - Invalid IAM Role Parameter

**Category:** Configuration

**Description:**
VPC Flow Logs creation failed with error "DeliverLogsPermissionArn is not applicable for s3 delivery" when attempting to specify an IAM role for S3 destination delivery.

**Root Cause:**
The `aws_flow_log` resource incorrectly included the `iam_role_arn` parameter, which is only valid when `log_destination_type` is "cloud-watch-logs". When delivering directly to S3, VPC Flow Logs uses S3 bucket policies for authorization, not IAM role assumption.

**Impact:**
- **Operational:** VPC Flow Logs resource creation blocked, preventing network traffic auditing
- **Security:** Loss of network visibility for payment processing VPC, impacting threat detection capabilities
- **Compliance:** Inability to meet network monitoring requirements for PCI-DSS compliance

**Fix Applied:**
```hcl
resource "aws_flow_log" "main" {
  log_destination          = "${aws_s3_bucket.audit_logs.arn}/vpc-flow-logs/"
  log_destination_type     = "s3"
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  destination_options {
    file_format        = "plain-text"
    per_hour_partition = false
  }

  tags = {
    Name = "flow-log-${var.environment}"
  }

  depends_on = [
    aws_s3_bucket_policy.audit_logs
  ]
}
```

**Prevention Strategy:**
1. **Resource Documentation Review:** Always review Terraform provider documentation for resource-specific parameter applicability
2. **Conditional Logic:** Use dynamic blocks or conditional expressions when a resource supports multiple destination types
3. **Testing Matrix:** Create test cases covering all supported destination types (S3, CloudWatch Logs) during module development
4. **Provider Version Pinning:** Maintain compatibility matrices showing which parameters are valid for specific provider versions

***

## Error 4: Lambda Reserved Concurrency - Account Limit Exceeded

**Category:** Configuration

**Description:**
Lambda function deployment failed with error indicating that specified reserved concurrency decreases account's unreserved concurrency below minimum value of 10.

**Root Cause:**
The payment processor Lambda was configured with `reserved_concurrent_executions = 50`, which exceeded the available unreserved concurrency quota in the AWS account. AWS requires maintaining a minimum of 10 unreserved concurrent executions across all functions.

**Impact:**
- **Operational:** Lambda function deployment blocked, preventing payment processing capability
- **Cost:** No direct cost impact, but delays time-to-market for payment processing feature
- **Performance:** Unable to control Lambda scaling behavior for fraud detection API protection

**Fix Applied:**
```hcl
resource "aws_lambda_function" "payment_processor" {
  function_name = "lambda-payment-processor-${var.environment}"
  role          = aws_iam_role.payment_processor.arn
  handler       = "lambda_payment_processor.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory
  timeout       = 60

  filename         = data.archive_file.payment_processor.output_path
  source_code_hash = data.archive_file.payment_processor.output_base64sha256

  # Removed reserved_concurrent_executions to use unreserved concurrency
  # For production, set to 5 or lower based on account limits

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_status.name
      SQS_QUEUE_URL  = aws_sqs_queue.payment_processing.url
      FRAUD_API_URL  = "https://api.fraud-detection.internal/validate"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_functions.id]
  }

  tags = {
    Name = "lambda-payment-processor-${var.environment}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.payment_processor,
    aws_cloudwatch_log_group.payment_processor
  ]
}
```

**Prevention Strategy:**
1. **Account Quota Analysis:** Document and track AWS account-level service quotas (Lambda, VPC, IAM) before architecture design
2. **Dynamic Concurrency:** Use Terraform variables for reserved concurrency with validation rules checking against account limits
3. **Multi-Account Strategy:** Implement service quota monitoring and alerts; consider dedicated accounts for high-concurrency workloads
4. **Load Testing:** Perform load testing in development accounts to determine actual concurrency requirements vs. theoretical maximums

***

## Error 5: CloudWatch Dashboard - Metrics Array Validation

**Category:** Syntax

**Description:**
CloudWatch dashboard creation failed with validation error "Should NOT have more than 2 items" in metrics array, indicating malformed metric widget configuration.

**Root Cause:**
The dashboard widget configuration included metric arrays with more than 2 elements per metric specification. CloudWatch dashboards require metrics to be specified as `[namespace, metric_name]` or `[namespace, metric_name, dimension_key, dimension_value]` format, but the configuration included additional elements causing validation failure.

**Impact:**
- **Operational:** Monitoring dashboard creation blocked, reducing observability of payment processing pipeline
- **Operational:** Inability to visualize SQS queue depth, Lambda metrics, and DynamoDB capacity in unified view
- **Maintenance:** Engineers must use AWS Console for monitoring instead of centralized dashboard

**Fix Applied:**
```hcl
resource "aws_cloudwatch_dashboard" "monitoring" {
  dashboard_name = "payment-processing-monitoring-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", "payment-processing.fifo", { "stat": "Sum" }],
            [".", "NumberOfMessagesReceived", ".", ".", { "stat": "Sum" }],
            [".", "ApproximateNumberOfMessagesVisible", ".", ".", { "stat": "Average" }]
          ]
          view = "timeSeries"
          stacked = false
          region = data.aws_region.current.name
          title = "SQS Main Queue"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "payment-processing-dlq.fifo", { "stat": "Average" }]
          ]
          view = "timeSeries"
          stacked = false
          region = data.aws_region.current.name
          title = "Dead Letter Queue"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "lambda-payment-processor-${var.environment}", { "stat": "Sum" }],
            [".", "Errors", ".", ".", { "stat": "Sum" }],
            [".", "Duration", ".", ".", { "stat": "Average" }]
          ]
          view = "timeSeries"
          stacked = false
          region = data.aws_region.current.name
          title = "Lambda Payment Processor"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "payment-status-${var.environment}", { "stat": "Sum" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { "stat": "Sum" }]
          ]
          view = "timeSeries"
          stacked = false
          region = data.aws_region.current.name
          title = "DynamoDB Capacity"
          period = 300
        }
      }
    ]
  })
}
```

**Prevention Strategy:**
1. **Schema Validation:** Use CloudWatch dashboard schema validators or Terraform plan previews to catch metric syntax errors
2. **Modular Widgets:** Create reusable dashboard widget modules with validated metric structures
3. **Documentation Reference:** Maintain internal documentation of valid CloudWatch metric array formats with examples
4. **IDE Integration:** Use Terraform language server in VS Code for real-time syntax validation during development

***

## Error 6: Lambda Event Source Mapping - FIFO Queue Batching Window

**Category:** Configuration

**Description:**
Lambda event source mapping creation failed with error indicating that `maximum_batching_window_in_seconds` is not supported for FIFO SQS queues.

**Root Cause:**
The event source mapping configuration included `maximum_batching_window_in_seconds = 5`, which is incompatible with FIFO queues. FIFO queues maintain strict message ordering and do not support batching windows that wait for additional messages before invoking Lambda.

**Impact:**
- **Operational:** Event source mapping creation blocked, preventing Lambda from processing payment messages from SQS
- **Functional:** Payment processing pipeline non-functional, unable to handle transaction validation workflow
- **Performance:** Without event source mapping, manual polling or alternative integration patterns required

**Fix Applied:**
```hcl
resource "aws_lambda_event_source_mapping" "payment_processor" {
  event_source_arn = aws_sqs_queue.payment_processing.arn
  function_name    = aws_lambda_function.payment_processor.arn

  batch_size = 10
  # maximum_batching_window_in_seconds removed - not supported for FIFO queues

  function_response_types = ["ReportBatchItemFailures"]

  depends_on = [
    aws_lambda_function.payment_processor
  ]
}
```