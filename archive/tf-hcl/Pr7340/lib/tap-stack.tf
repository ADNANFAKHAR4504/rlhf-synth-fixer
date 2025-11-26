# tap-stack.tf

# Local variables for dynamic naming
locals {
  # Use PR number for unique naming if available, otherwise use environment_suffix
  # GitHub Actions exports TF_VAR_pr_number, so we use that for parallel deployments
  # PR deployments: pr123, pr456 | Manual/dev deployments: dev
  name_suffix = var.pr_number != "unknown" ? "pr${var.pr_number}" : var.environment_suffix
}

# KMS keys for encryption
resource "aws_kms_key" "lambda_key" {
  description             = "KMS key for Lambda environment variable encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "fraud-detection-lambda-key-${local.name_suffix}"
  }
}

resource "aws_kms_key" "dynamodb_key" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "fraud-detection-dynamodb-key-${local.name_suffix}"
  }
}

resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "fraud-detection-s3-key-${local.name_suffix}"
  }
}

resource "aws_kms_key" "sqs_key" {
  description             = "KMS key for SQS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "fraud-detection-sqs-key-${local.name_suffix}"
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}

# VPC for secure networking
resource "aws_vpc" "fraud_detection_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "fraud-detection-vpc-${local.name_suffix}"
  }
}

# Private subnets
resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.fraud_detection_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "fraud-detection-private-a-${local.name_suffix}"
  }
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.fraud_detection_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "fraud-detection-private-b-${local.name_suffix}"
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.fraud_detection_vpc.id

  tags = {
    Name = "fraud-detection-private-rt-${local.name_suffix}"
  }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_subnet_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_subnet_b.id
  route_table_id = aws_route_table.private.id
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "fraud-detection-vpc-endpoints-sg-${local.name_suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.fraud_detection_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.fraud_detection_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fraud-detection-vpc-endpoints-sg-${local.name_suffix}"
  }
}

# VPC endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.fraud_detection_vpc.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "fraud-detection-s3-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.fraud_detection_vpc.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "fraud-detection-dynamodb-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.fraud_detection_vpc.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "fraud-detection-sqs-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "cloudwatch" {
  vpc_id              = aws_vpc.fraud_detection_vpc.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "fraud-detection-cloudwatch-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.fraud_detection_vpc.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "fraud-detection-sns-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "events" {
  vpc_id              = aws_vpc.fraud_detection_vpc.id
  service_name        = "com.amazonaws.${var.aws_region}.events"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "fraud-detection-events-endpoint-${local.name_suffix}"
  }
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.fraud_detection_vpc.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "fraud-detection-kms-endpoint-${local.name_suffix}"
  }
}

# DynamoDB table
resource "aws_dynamodb_table" "transactions" {
  name         = "fraud-detection-transactions-${local.name_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_key.arn
  }

  tags = {
    Name = "fraud-detection-transactions-${local.name_suffix}"
  }
}

# S3 bucket for archiving
resource "aws_s3_bucket" "transaction_archive" {
  bucket = "fraud-detection-archive-${data.aws_caller_identity.current.account_id}-${var.aws_region}-${local.name_suffix}"

  tags = {
    Name = "fraud-detection-archive-${local.name_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "transaction_archive" {
  bucket = aws_s3_bucket.transaction_archive.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_archive" {
  bucket = aws_s3_bucket.transaction_archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_archive" {
  bucket = aws_s3_bucket.transaction_archive.id

  rule {
    id     = "archive-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 bucket policy to enforce secure transport
resource "aws_s3_bucket_policy" "transaction_archive_secure_transport" {
  bucket = aws_s3_bucket.transaction_archive.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.transaction_archive.arn,
          "${aws_s3_bucket.transaction_archive.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = false
          }
        }
      }
    ]
  })
}

# SQS queues
resource "aws_sqs_queue" "notification_dlq" {
  name                       = "fraud-detection-notification-dlq-${local.name_suffix}"
  kms_master_key_id          = aws_kms_key.sqs_key.key_id
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 60

  tags = {
    Name = "fraud-detection-notification-dlq-${local.name_suffix}"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name                       = "fraud-detection-notification-queue-${local.name_suffix}"
  kms_master_key_id          = aws_kms_key.sqs_key.key_id
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "fraud-detection-notification-queue-${local.name_suffix}"
  }
}

# CloudWatch log groups
resource "aws_cloudwatch_log_group" "validation_lambda_logs" {
  name              = "/aws/lambda/fraud-detection-transaction-validation-${local.name_suffix}"
  retention_in_days = 30

  tags = {
    Name = "fraud-detection-validation-lambda-logs-${local.name_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "fraud_scoring_lambda_logs" {
  name              = "/aws/lambda/fraud-detection-scoring-${local.name_suffix}"
  retention_in_days = 30

  tags = {
    Name = "fraud-detection-scoring-lambda-logs-${local.name_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "notification_lambda_logs" {
  name              = "/aws/lambda/fraud-detection-notification-${local.name_suffix}"
  retention_in_days = 30

  tags = {
    Name = "fraud-detection-notification-lambda-logs-${local.name_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "authorizer_lambda_logs" {
  name              = "/aws/lambda/fraud-detection-token-authorizer-${local.name_suffix}"
  retention_in_days = 30

  tags = {
    Name = "fraud-detection-authorizer-lambda-logs-${local.name_suffix}"
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "fraud-detection-lambda-role-${local.name_suffix}"

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
    Name = "fraud-detection-lambda-role-${local.name_suffix}"
  }
}

# Inline policy for Lambda role (using separate resource)
resource "aws_iam_role_policy" "lambda_inline_policy" {
  name = "fraud-detection-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
          "${aws_cloudwatch_log_group.validation_lambda_logs.arn}:*",
          "${aws_cloudwatch_log_group.fraud_scoring_lambda_logs.arn}:*",
          "${aws_cloudwatch_log_group.notification_lambda_logs.arn}:*",
          "${aws_cloudwatch_log_group.authorizer_lambda_logs.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.transaction_archive.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.lambda_key.arn,
          aws_kms_key.dynamodb_key.arn,
          aws_kms_key.s3_key.arn,
          aws_kms_key.sqs_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.notification_queue.arn
      },
      {
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alarm_notification.arn
      },
      {
        Effect   = "Allow"
        Action   = "events:PutEvents"
        Resource = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/default"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# Security group for Lambda functions
resource "aws_security_group" "lambda_sg" {
  name        = "fraud-detection-lambda-sg-${local.name_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.fraud_detection_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fraud-detection-lambda-sg-${local.name_suffix}"
  }
}

# Lambda functions
resource "aws_lambda_function" "token_authorizer" {
  filename                       = "lambda/authorizer.zip"
  function_name                  = "fraud-detection-token-authorizer-${local.name_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "authorizer.lambda_handler"
  runtime                        = "python3.11"
  timeout                        = 10
  memory_size                    = 128
  reserved_concurrent_executions = var.authorizer_reserved_concurrency

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      EXPECTED_TOKEN = "test-token-123"
      LOG_LEVEL      = "INFO"
    }
  }

  kms_key_arn = aws_kms_key.lambda_key.arn

  tags = {
    Name = "fraud-detection-token-authorizer-${local.name_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.authorizer_lambda_logs,
    aws_iam_role_policy.lambda_inline_policy
  ]
}

resource "aws_lambda_function" "transaction_validation" {
  filename                       = "lambda/validation.zip"
  function_name                  = "fraud-detection-transaction-validation-${local.name_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "validation.lambda_handler"
  runtime                        = "python3.11"
  timeout                        = 30
  memory_size                    = 256
  reserved_concurrent_executions = var.transaction_validation_reserved_concurrency

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      S3_BUCKET      = aws_s3_bucket.transaction_archive.id
      KMS_KEY_ID     = aws_kms_key.dynamodb_key.id
      LOG_LEVEL      = "INFO"
    }
  }

  kms_key_arn = aws_kms_key.lambda_key.arn

  tags = {
    Name = "fraud-detection-transaction-validation-${local.name_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.validation_lambda_logs,
    aws_iam_role_policy.lambda_inline_policy
  ]
}

resource "aws_lambda_function" "fraud_scoring" {
  filename                       = "lambda/fraud_scoring.zip"
  function_name                  = "fraud-detection-scoring-${local.name_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "fraud_scoring.lambda_handler"
  runtime                        = "python3.11"
  timeout                        = 60
  memory_size                    = 512
  reserved_concurrent_executions = var.fraud_scoring_reserved_concurrency

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE  = aws_dynamodb_table.transactions.name
      S3_BUCKET       = aws_s3_bucket.transaction_archive.bucket
      EVENTBRIDGE_BUS = "default"
      LOG_LEVEL       = "INFO"
    }
  }

  kms_key_arn = aws_kms_key.lambda_key.arn

  tags = {
    Name = "fraud-detection-scoring-${local.name_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.fraud_scoring_lambda_logs,
    aws_iam_role_policy.lambda_inline_policy
  ]
}

resource "aws_lambda_function" "notification_processing" {
  filename                       = "lambda/notification.zip"
  function_name                  = "fraud-detection-notification-${local.name_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "notification.lambda_handler"
  runtime                        = "python3.11"
  timeout                        = 30
  memory_size                    = 256
  reserved_concurrent_executions = var.notification_reserved_concurrency

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN  = aws_sns_topic.alarm_notification.arn
      LOG_LEVEL      = "INFO"
    }
  }

  kms_key_arn = aws_kms_key.lambda_key.arn

  tags = {
    Name = "fraud-detection-notification-${local.name_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.notification_lambda_logs,
    aws_iam_role_policy.lambda_inline_policy
  ]
}

# API Gateway
resource "aws_api_gateway_rest_api" "fraud_detection_api" {
  name        = "fraud-detection-api-${local.name_suffix}"
  description = "Fraud Detection API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "token_authorizer" {
  name                             = "token-authorizer-${local.name_suffix}"
  rest_api_id                      = aws_api_gateway_rest_api.fraud_detection_api.id
  authorizer_uri                   = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.token_authorizer.arn}/invocations"
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer_role.arn
  type                             = "TOKEN"
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 0 # Disable caching for testing
}

# IAM role for API Gateway to invoke authorizer
resource "aws_iam_role" "api_gateway_authorizer_role" {
  name = "api-gateway-authorizer-role-${local.name_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

# Policy for API Gateway to invoke Lambda
resource "aws_iam_policy" "lambda_invoke_policy" {
  name        = "lambda-invoke-policy-${local.name_suffix}"
  description = "Policy to allow API Gateway to invoke Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "lambda:InvokeFunction"
        Effect = "Allow"
        Resource = [
          aws_lambda_function.token_authorizer.arn,
          aws_lambda_function.transaction_validation.arn,
          aws_lambda_function.fraud_scoring.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_lambda_invoke" {
  role       = aws_iam_role.api_gateway_authorizer_role.name
  policy_arn = aws_iam_policy.lambda_invoke_policy.arn
}

# API Gateway resources and methods
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  parent_id   = aws_api_gateway_rest_api.fraud_detection_api.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_resource" "transaction_id" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  parent_id   = aws_api_gateway_resource.transactions.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "post_transaction" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.token_authorizer.id
}

resource "aws_api_gateway_integration" "post_transaction" {
  rest_api_id             = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id             = aws_api_gateway_resource.transactions.id
  http_method             = aws_api_gateway_method.post_transaction.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.transaction_validation.arn}/invocations"
}

resource "aws_api_gateway_method" "get_transaction" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id   = aws_api_gateway_resource.transaction_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.token_authorizer.id
  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "get_transaction" {
  rest_api_id             = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id             = aws_api_gateway_resource.transaction_id.id
  http_method             = aws_api_gateway_method.get_transaction.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.transaction_validation.arn}/invocations"
}

# API Gateway deployment and stage
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.post_transaction,
    aws_api_gateway_integration.get_transaction
  ]

  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id

  # Force redeployment when Lambda authorizer or backend functions change
  triggers = {
    redeployment = sha256(jsonencode([
      aws_lambda_function.token_authorizer.source_code_hash,
      aws_lambda_function.transaction_validation.source_code_hash,
      aws_lambda_function.fraud_scoring.source_code_hash,
      aws_api_gateway_integration.post_transaction.id,
      aws_api_gateway_integration.get_transaction.id,
      aws_api_gateway_authorizer.token_authorizer.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  stage_name    = "prod"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_validation" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection_api.execution_arn}/*"
}

resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.token_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection_api.execution_arn}/*"
}

# EventBridge rule for high-risk transactions
resource "aws_cloudwatch_event_rule" "high_risk_transaction" {
  name        = "high-risk-transaction-${local.name_suffix}"
  description = "Trigger when a high-risk transaction is detected"

  event_pattern = jsonencode({
    source      = ["fraud-detection"]
    detail_type = ["High Risk Transaction Detected"]
  })
}

resource "aws_cloudwatch_event_target" "notification_lambda" {
  rule      = aws_cloudwatch_event_rule.high_risk_transaction.name
  target_id = "NotificationLambda"
  arn       = aws_lambda_function.notification_processing.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification_processing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.high_risk_transaction.arn
}

# SQS trigger for notification Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.notification_processing.arn
  batch_size       = 10
  enabled          = true
}

# SNS topic for alarms
resource "aws_sns_topic" "alarm_notification" {
  name              = "fraud-detection-alarms-${local.name_suffix}"
  kms_master_key_id = aws_kms_key.lambda_key.key_id

  tags = {
    Name = "fraud-detection-alarms-${local.name_suffix}"
  }
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "validation_lambda_errors" {
  alarm_name          = "validation-lambda-errors-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This alarm monitors transaction validation Lambda errors"
  alarm_actions       = [aws_sns_topic.alarm_notification.arn]

  dimensions = {
    FunctionName = aws_lambda_function.transaction_validation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_scoring_lambda_errors" {
  alarm_name          = "fraud-scoring-lambda-errors-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This alarm monitors fraud scoring Lambda errors"
  alarm_actions       = [aws_sns_topic.alarm_notification.arn]

  dimensions = {
    FunctionName = aws_lambda_function.fraud_scoring.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_lambda_errors" {
  alarm_name          = "notification-lambda-errors-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This alarm monitors notification Lambda errors"
  alarm_actions       = [aws_sns_topic.alarm_notification.arn]

  dimensions = {
    FunctionName = aws_lambda_function.notification_processing.function_name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "fraud_detection" {
  dashboard_name = "FraudDetectionDashboard-${local.name_suffix}"

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
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.transaction_validation.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.fraud_scoring.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.notification_processing.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Invocations"
          region  = var.aws_region
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
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.transaction_validation.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.fraud_scoring.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.notification_processing.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Lambda Errors"
          region  = var.aws_region
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
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.fraud_detection_api.name, "Stage", aws_api_gateway_stage.prod.stage_name, "Resource", "/transactions", "Method", "POST"],
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.fraud_detection_api.name, "Stage", aws_api_gateway_stage.prod.stage_name, "Resource", "/transactions/{id}", "Method", "GET"]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "API Gateway Requests"
          region  = var.aws_region
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
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.transactions.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.transactions.name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "DynamoDB Capacity"
          region  = var.aws_region
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.notification_queue.name],
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", aws_sqs_queue.notification_queue.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.notification_queue.name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "SQS Messages"
          region  = var.aws_region
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "api_gateway_url" {
  value       = "${aws_api_gateway_stage.prod.invoke_url}/transactions"
  description = "URL of the API Gateway endpoint"
}

output "cloudwatch_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.fraud_detection.dashboard_name}"
  description = "URL of the CloudWatch dashboard"
}
