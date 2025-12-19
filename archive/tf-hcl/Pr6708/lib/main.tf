# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

data "archive_file" "payment_processor" {
  type        = "zip"
  source_file = "${path.module}/lambda_payment_processor.py"
  output_path = "${path.module}/payment_processor.zip"
}

data "archive_file" "dlq_processor" {
  type        = "zip"
  source_file = "${path.module}/lambda_dlq_processor.py"
  output_path = "${path.module}/dlq_processor.zip"
}

# VPC Network Architecture
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-payment-processing-${var.environment}"
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-private-${count.index + 1}-${var.environment}"
    Type = "Private"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-private-${var.environment}"
  }
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# KMS Keys
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 and CloudTrail encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-s3-${var.environment}"
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/payment-s3-${var.environment}"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_kms_key" "sqs" {
  description             = "KMS key for SQS and SNS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-sqs-${var.environment}"
  }
}

resource "aws_kms_alias" "sqs" {
  name          = "alias/payment-sqs-${var.environment}"
  target_key_id = aws_kms_key.sqs.key_id
}

resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for DynamoDB and CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-dynamodb-${var.environment}"
  }
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/payment-dynamodb-${var.environment}"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# KMS Key Policies
# KMS Key Policies - FIXED
resource "aws_kms_key_policy" "s3" {
  key_id = aws_kms_key.s3.id
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
        Sid    = "Allow S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = ["kms:GenerateDataKey", "kms:Decrypt"]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = ["kms:GenerateDataKey*", "kms:Decrypt", "kms:DescribeKey"]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key_policy" "sqs" {
  key_id = aws_kms_key.sqs.id
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
        Sid    = "Allow SQS"
        Effect = "Allow"
        Principal = {
          Service = "sqs.amazonaws.com"
        }
        Action   = ["kms:GenerateDataKey", "kms:Decrypt"]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = ["kms:GenerateDataKey*", "kms:Decrypt"]
        Resource = "*"
      }
    ]
  })
}

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

# S3 Bucket for Audit Logs
resource "aws_s3_bucket" "audit_logs" {
  bucket        = "s3-audit-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-audit-logs-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "transition-flow-logs-${var.environment}"
    status = "Enabled"

    filter {
      prefix = "vpc-flow-logs/"
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

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
        Action   = "s3:PutObject"
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
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs.arn
      },
      {
        Sid    = "AllowCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
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

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.dynamodb.arn
  tags = {
    Name = "log-group-vpc-flow-logs-${var.environment}"
  }

  depends_on = [aws_kms_key_policy.dynamodb]
}

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

# CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/payment-processing-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.s3.arn
  tags = {
    Name = "log-group-cloudtrail-${var.environment}"
  }

  depends_on = [aws_kms_key_policy.s3]
}


resource "aws_cloudtrail" "main" {
  name                          = "cloudtrail-payment-processing-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.s3.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = {
    Name = "cloudtrail-${var.environment}"
  }

  depends_on = [
    aws_s3_bucket_policy.audit_logs,
    aws_iam_role_policy_attachment.cloudtrail
  ]
}

# Security Groups
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-vpc-endpoints-${var.environment}"
  }
}

resource "aws_security_group_rule" "vpc_endpoints_ingress" {
  type              = "ingress"
  security_group_id = aws_security_group.vpc_endpoints.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["10.0.0.0/16"]
  description       = "Allow HTTPS from VPC"
}

resource "aws_security_group_rule" "vpc_endpoints_egress" {
  type              = "egress"
  security_group_id = aws_security_group.vpc_endpoints.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["10.0.0.0/16"]
  description       = "Allow HTTPS to VPC"
}

resource "aws_security_group" "lambda_functions" {
  name_prefix = "lambda-functions-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-lambda-functions-${var.environment}"
  }
}

resource "aws_security_group_rule" "lambda_egress" {
  type              = "egress"
  security_group_id = aws_security_group.lambda_functions.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["10.0.0.0/16"]
  description       = "Allow HTTPS to VPC endpoints"
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "vpce-dynamodb-${var.environment}"
  }
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-sqs-${var.environment}"
  }
}

resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-lambda-${var.environment}"
  }
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-logs-${var.environment}"
  }
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-sns-${var.environment}"
  }
}

# SQS FIFO Queues
resource "aws_sqs_queue" "payment_processing" {
  name                              = "payment-processing.fifo"
  fifo_queue                        = true
  content_based_deduplication       = false
  deduplication_scope               = "messageGroup"
  fifo_throughput_limit             = "perMessageGroupId"
  visibility_timeout_seconds        = var.sqs_visibility_timeout
  message_retention_seconds         = 345600
  kms_master_key_id                 = aws_kms_key.sqs.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_processing_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "sqs-payment-processing-${var.environment}"
  }
}

resource "aws_sqs_queue" "payment_processing_dlq" {
  name                              = "payment-processing-dlq.fifo"
  fifo_queue                        = true
  content_based_deduplication       = false
  deduplication_scope               = "messageGroup"
  fifo_throughput_limit             = "perMessageGroupId"
  message_retention_seconds         = var.dlq_retention_days * 86400
  kms_master_key_id                 = aws_kms_key.sqs.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name = "sqs-payment-processing-dlq-${var.environment}"
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "payment_status" {
  name         = "payment-status-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "payment_status"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "status-timestamp-index"
    hash_key        = "payment_status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  deletion_protection_enabled = false

  tags = {
    Name = "dynamodb-payment-status-${var.environment}"
  }
}

# IAM Roles and Policies
resource "aws_iam_role" "payment_processor" {
  name = "lambda-payment-processor-${var.environment}"

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

  tags = {
    Name = "role-lambda-payment-processor-${var.environment}"
  }
}

resource "aws_iam_policy" "payment_processor" {
  name        = "lambda-payment-processor-policy-${var.environment}"
  description = "Policy for payment processor Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSPermissions"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_processing.arn
      },
      {
        Sid    = "DynamoDBPermissions"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.payment_status.arn
      },
      {
        Sid    = "KMSPermissions"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.sqs.arn,
          aws_kms_key.dynamodb.arn
        ]
      },
      {
        Sid    = "CloudWatchLogsPermissions"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.payment_processor.arn}:*"
      },
      {
        Sid    = "VPCNetworkPermissions"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "payment_processor" {
  role       = aws_iam_role.payment_processor.name
  policy_arn = aws_iam_policy.payment_processor.arn
}

resource "aws_iam_role" "dlq_processor" {
  name = "lambda-dlq-processor-${var.environment}"

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

  tags = {
    Name = "role-lambda-dlq-processor-${var.environment}"
  }
}

resource "aws_iam_policy" "dlq_processor" {
  name        = "lambda-dlq-processor-policy-${var.environment}"
  description = "Policy for DLQ processor Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSPermissions"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_processing_dlq.arn
      },
      {
        Sid    = "DynamoDBPermissions"
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.payment_status.arn,
          "${aws_dynamodb_table.payment_status.arn}/*"
        ]
      },
      {
        Sid    = "KMSPermissions"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.sqs.arn,
          aws_kms_key.dynamodb.arn
        ]
      },
      {
        Sid    = "CloudWatchLogsPermissions"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.dlq_processor.arn}:*"
      },
      {
        Sid    = "VPCNetworkPermissions"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dlq_processor" {
  role       = aws_iam_role.dlq_processor.name
  policy_arn = aws_iam_policy.dlq_processor.arn
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "role-vpc-flow-logs-${var.environment}"
  }
}

resource "aws_iam_policy" "vpc_flow_logs" {
  name        = "vpc-flow-logs-policy-${var.environment}"
  description = "Policy for VPC Flow Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups"
        ]
        Resource = "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "vpc_flow_logs" {
  role       = aws_iam_role.vpc_flow_logs.name
  policy_arn = aws_iam_policy.vpc_flow_logs.arn
}

resource "aws_iam_role" "cloudtrail" {
  name = "cloudtrail-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "role-cloudtrail-${var.environment}"
  }
}

resource "aws_iam_policy" "cloudtrail" {
  name        = "cloudtrail-policy-${var.environment}"
  description = "Policy for CloudTrail"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudtrail" {
  role       = aws_iam_role.cloudtrail.name
  policy_arn = aws_iam_policy.cloudtrail.arn
}

# Lambda Functions
resource "aws_cloudwatch_log_group" "payment_processor" {
  name              = "/aws/lambda/lambda-payment-processor-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.dynamodb.arn
  tags = {
    Name = "log-group-payment-processor-${var.environment}"
  }

  depends_on = [aws_kms_key_policy.dynamodb]
}

resource "aws_lambda_function" "payment_processor" {
  function_name = "lambda-payment-processor-${var.environment}"
  role          = aws_iam_role.payment_processor.arn
  handler       = "lambda_payment_processor.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory
  timeout       = 60

  filename         = data.archive_file.payment_processor.output_path
  source_code_hash = data.archive_file.payment_processor.output_base64sha256

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

resource "aws_cloudwatch_log_group" "dlq_processor" {
  name              = "/aws/lambda/lambda-dlq-processor-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.dynamodb.arn
  tags = {
    Name = "log-group-dlq-processor-${var.environment}"
  }

  depends_on = [aws_kms_key_policy.dynamodb]
}

resource "aws_lambda_function" "dlq_processor" {
  function_name = "lambda-dlq-processor-${var.environment}"
  role          = aws_iam_role.dlq_processor.arn
  handler       = "lambda_dlq_processor.handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory
  timeout       = 120

  filename         = data.archive_file.dlq_processor.output_path
  source_code_hash = data.archive_file.dlq_processor.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_status.name
      DLQ_URL        = aws_sqs_queue.payment_processing_dlq.url
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_functions.id]
  }

  tags = {
    Name = "lambda-dlq-processor-${var.environment}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dlq_processor,
    aws_cloudwatch_log_group.dlq_processor
  ]
}

# Lambda Event Source Mapping - FIXED FOR FIFO
resource "aws_lambda_event_source_mapping" "payment_processor" {
  event_source_arn = aws_sqs_queue.payment_processing.arn
  function_name    = aws_lambda_function.payment_processor.arn

  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]

  depends_on = [
    aws_lambda_function.payment_processor
  ]
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "sns-payment-alerts-${var.environment}"
  display_name      = "Payment Processing Alerts"
  kms_master_key_id = aws_kms_key.sqs.id

  tags = {
    Name = "sns-payment-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  alarm_name          = "alarm-sqs-queue-depth-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Alarm when SQS queue depth exceeds 1000"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.payment_processing.name
  }

  tags = {
    Name = "alarm-sqs-queue-depth-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "alarm-lambda-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_description   = "Alarm when Lambda error rate exceeds 1%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  metric_query {
    id          = "error_rate"
    expression  = "(m1/m2)*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.payment_processor.function_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.payment_processor.function_name
      }
    }
  }

  tags = {
    Name = "alarm-lambda-error-rate-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "alarm-dlq-messages-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alarm when messages appear in DLQ"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.payment_processing_dlq.name
  }

  tags = {
    Name = "alarm-dlq-messages-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "alarm-lambda-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when Lambda function experiences throttling"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor.function_name
  }

  tags = {
    Name = "alarm-lambda-throttles-${var.environment}"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "monitoring" {
  dashboard_name = "payment-processing-monitoring-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.payment_processing.name, { "stat" : "Sum", "label" : "Messages Sent" }],
            [".", "NumberOfMessagesReceived", ".", ".", { "stat" : "Sum", "label" : "Messages Received" }],
            [".", "ApproximateNumberOfMessagesVisible", ".", ".", { "stat" : "Average", "label" : "Queue Depth" }],
            [".", "ApproximateAgeOfOldestMessage", ".", ".", { "stat" : "Maximum", "label" : "Oldest Message Age" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "SQS Main Queue Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.payment_processing_dlq.name, { "stat" : "Average", "label" : "DLQ Messages" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Dead Letter Queue"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.payment_processor.function_name, { "stat" : "Sum" }],
            [".", "Errors", ".", ".", { "stat" : "Sum" }],
            [".", "Duration", ".", ".", { "stat" : "Average" }],
            [".", "ConcurrentExecutions", ".", ".", { "stat" : "Maximum" }],
            [".", "Throttles", ".", ".", { "stat" : "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda Function Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.payment_status.name, { "stat" : "Sum" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { "stat" : "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "DynamoDB Capacity"
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "IDs of private subnets"
}

output "private_subnet_availability_zones" {
  value       = aws_subnet.private[*].availability_zone
  description = "Availability zones of private subnets"
}

output "vpc_endpoint_dynamodb_id" {
  value       = aws_vpc_endpoint.dynamodb.id
  description = "ID of DynamoDB VPC endpoint"
}

output "vpc_endpoint_sqs_id" {
  value       = aws_vpc_endpoint.sqs.id
  description = "ID of SQS VPC endpoint"
}

output "vpc_endpoint_sqs_dns_name" {
  value       = aws_vpc_endpoint.sqs.dns_entry[0].dns_name
  description = "DNS name of SQS VPC endpoint"
}

output "vpc_endpoint_lambda_id" {
  value       = aws_vpc_endpoint.lambda.id
  description = "ID of Lambda VPC endpoint"
}

output "vpc_endpoint_lambda_dns_name" {
  value       = aws_vpc_endpoint.lambda.dns_entry[0].dns_name
  description = "DNS name of Lambda VPC endpoint"
}

output "vpc_endpoint_logs_id" {
  value       = aws_vpc_endpoint.logs.id
  description = "ID of CloudWatch Logs VPC endpoint"
}

output "vpc_endpoint_logs_dns_name" {
  value       = aws_vpc_endpoint.logs.dns_entry[0].dns_name
  description = "DNS name of CloudWatch Logs VPC endpoint"
}

output "vpc_endpoint_sns_id" {
  value       = aws_vpc_endpoint.sns.id
  description = "ID of SNS VPC endpoint"
}

output "vpc_endpoint_sns_dns_name" {
  value       = aws_vpc_endpoint.sns.dns_entry[0].dns_name
  description = "DNS name of SNS VPC endpoint"
}

output "kms_key_s3_id" {
  value       = aws_kms_key.s3.id
  description = "ID of S3 KMS key"
}

output "kms_key_s3_arn" {
  value       = aws_kms_key.s3.arn
  description = "ARN of S3 KMS key"
}

output "kms_key_s3_alias" {
  value       = aws_kms_alias.s3.name
  description = "Alias of S3 KMS key"
}

output "kms_key_sqs_id" {
  value       = aws_kms_key.sqs.id
  description = "ID of SQS KMS key"
}

output "kms_key_sqs_arn" {
  value       = aws_kms_key.sqs.arn
  description = "ARN of SQS KMS key"
}

output "kms_key_sqs_alias" {
  value       = aws_kms_alias.sqs.name
  description = "Alias of SQS KMS key"
}

output "kms_key_dynamodb_id" {
  value       = aws_kms_key.dynamodb.id
  description = "ID of DynamoDB KMS key"
}

output "kms_key_dynamodb_arn" {
  value       = aws_kms_key.dynamodb.arn
  description = "ARN of DynamoDB KMS key"
}

output "kms_key_dynamodb_alias" {
  value       = aws_kms_alias.dynamodb.name
  description = "Alias of DynamoDB KMS key"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.audit_logs.id
  description = "Name of S3 audit logs bucket"
}

output "s3_bucket_arn" {
  value       = aws_s3_bucket.audit_logs.arn
  description = "ARN of S3 audit logs bucket"
}

output "vpc_flow_logs_id" {
  value       = aws_flow_log.main.id
  description = "ID of VPC Flow Logs"
}

output "vpc_flow_logs_log_group_name" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
  description = "Name of VPC Flow Logs log group"
}

output "cloudtrail_arn" {
  value       = aws_cloudtrail.main.arn
  description = "ARN of CloudTrail"
}

output "cloudtrail_log_group_name" {
  value       = aws_cloudwatch_log_group.cloudtrail.name
  description = "Name of CloudTrail log group"
}

output "sqs_queue_url" {
  value       = aws_sqs_queue.payment_processing.url
  description = "URL of main SQS queue"
  sensitive   = true
}

output "sqs_queue_arn" {
  value       = aws_sqs_queue.payment_processing.arn
  description = "ARN of main SQS queue"
}

output "sqs_dlq_url" {
  value       = aws_sqs_queue.payment_processing_dlq.url
  description = "URL of SQS dead letter queue"
  sensitive   = true
}

output "sqs_dlq_arn" {
  value       = aws_sqs_queue.payment_processing_dlq.arn
  description = "ARN of SQS dead letter queue"
}

output "lambda_payment_processor_name" {
  value       = aws_lambda_function.payment_processor.function_name
  description = "Name of payment processor Lambda"
}

output "lambda_payment_processor_arn" {
  value       = aws_lambda_function.payment_processor.arn
  description = "ARN of payment processor Lambda"
}

output "lambda_dlq_processor_name" {
  value       = aws_lambda_function.dlq_processor.function_name
  description = "Name of DLQ processor Lambda"
}

output "lambda_dlq_processor_arn" {
  value       = aws_lambda_function.dlq_processor.arn
  description = "ARN of DLQ processor Lambda"
}

output "lambda_payment_processor_log_group_name" {
  value       = aws_cloudwatch_log_group.payment_processor.name
  description = "Name of payment processor Lambda log group"
}

output "lambda_payment_processor_log_group_arn" {
  value       = aws_cloudwatch_log_group.payment_processor.arn
  description = "ARN of payment processor Lambda log group"
}

output "lambda_dlq_processor_log_group_name" {
  value       = aws_cloudwatch_log_group.dlq_processor.name
  description = "Name of DLQ processor Lambda log group"
}

output "lambda_dlq_processor_log_group_arn" {
  value       = aws_cloudwatch_log_group.dlq_processor.arn
  description = "ARN of DLQ processor Lambda log group"
}

output "lambda_security_group_id" {
  value       = aws_security_group.lambda_functions.id
  description = "ID of Lambda security group"
}

output "vpc_endpoint_security_group_id" {
  value       = aws_security_group.vpc_endpoints.id
  description = "ID of VPC endpoint security group"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.payment_status.name
  description = "Name of DynamoDB table"
  sensitive   = true
}

output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.payment_status.arn
  description = "ARN of DynamoDB table"
}

output "dynamodb_gsi_name" {
  value       = "status-timestamp-index"
  description = "Name of DynamoDB GSI"
}

output "cloudwatch_alarm_sqs_queue_depth_name" {
  value       = aws_cloudwatch_metric_alarm.sqs_queue_depth.alarm_name
  description = "Name of SQS queue depth alarm"
}

output "cloudwatch_alarm_sqs_queue_depth_arn" {
  value       = aws_cloudwatch_metric_alarm.sqs_queue_depth.arn
  description = "ARN of SQS queue depth alarm"
}

output "cloudwatch_alarm_lambda_error_rate_name" {
  value       = aws_cloudwatch_metric_alarm.lambda_error_rate.alarm_name
  description = "Name of Lambda error rate alarm"
}

output "cloudwatch_alarm_lambda_error_rate_arn" {
  value       = aws_cloudwatch_metric_alarm.lambda_error_rate.arn
  description = "ARN of Lambda error rate alarm"
}

output "cloudwatch_alarm_dlq_messages_name" {
  value       = aws_cloudwatch_metric_alarm.dlq_messages.alarm_name
  description = "Name of DLQ messages alarm"
}

output "cloudwatch_alarm_dlq_messages_arn" {
  value       = aws_cloudwatch_metric_alarm.dlq_messages.arn
  description = "ARN of DLQ messages alarm"
}

output "cloudwatch_alarm_lambda_throttles_name" {
  value       = aws_cloudwatch_metric_alarm.lambda_throttles.alarm_name
  description = "Name of Lambda throttles alarm"
}

output "cloudwatch_alarm_lambda_throttles_arn" {
  value       = aws_cloudwatch_metric_alarm.lambda_throttles.arn
  description = "ARN of Lambda throttles alarm"
}

output "cloudwatch_dashboard_name" {
  value       = aws_cloudwatch_dashboard.monitoring.dashboard_name
  description = "Name of CloudWatch dashboard"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "ARN of SNS alerting topic"
}

output "sns_subscription_arn" {
  value       = aws_sns_topic_subscription.email.arn
  description = "ARN of SNS email subscription"
}

output "iam_role_payment_processor_name" {
  value       = aws_iam_role.payment_processor.name
  description = "Name of payment processor IAM role"
}

output "iam_role_payment_processor_arn" {
  value       = aws_iam_role.payment_processor.arn
  description = "ARN of payment processor IAM role"
}

output "iam_role_dlq_processor_name" {
  value       = aws_iam_role.dlq_processor.name
  description = "Name of DLQ processor IAM role"
}

output "iam_role_dlq_processor_arn" {
  value       = aws_iam_role.dlq_processor.arn
  description = "ARN of DLQ processor IAM role"
}

output "iam_role_vpc_flow_logs_name" {
  value       = aws_iam_role.vpc_flow_logs.name
  description = "Name of VPC Flow Logs IAM role"
}

output "iam_role_vpc_flow_logs_arn" {
  value       = aws_iam_role.vpc_flow_logs.arn
  description = "ARN of VPC Flow Logs IAM role"
}

output "iam_role_cloudtrail_name" {
  value       = aws_iam_role.cloudtrail.name
  description = "Name of CloudTrail IAM role"
}

output "iam_role_cloudtrail_arn" {
  value       = aws_iam_role.cloudtrail.arn
  description = "ARN of CloudTrail IAM role"
}

output "region" {
  value       = data.aws_region.current.name
  description = "AWS region where resources are deployed"
}

output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account ID where resources are deployed"
}