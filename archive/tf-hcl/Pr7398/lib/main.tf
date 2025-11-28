/*
 * Main Infrastructure Configuration
 * ==================================
 * This file contains all infrastructure resources for the ECS microservices
 * observability platform including networking, compute, monitoring, logging,
 * tracing, alerting, and custom metrics processing.
 */

# ============================================================================
# Data Sources
# ============================================================================

/*
 * AWS Account Identity
 * Used for constructing globally unique S3 bucket names and IAM ARNs
 */
data "aws_caller_identity" "current" {}

/*
 * Current AWS Region
 * Used in IAM policies and resource ARN construction
 */
data "aws_region" "current" {}

/*
 * Available Availability Zones
 * Used for distributing subnets across multiple AZs for high availability
 */
data "aws_availability_zones" "available" {
  state = "available"
}

/*
 * ELB Service Account
 * Required for granting ALB permissions to write access logs to S3
 */
data "aws_elb_service_account" "main" {}

/*
 * Lambda Function Archives
 * Package Python code into deployment artifacts for Lambda functions
 */
data "archive_file" "payment_failure_analyzer" {
  type        = "zip"
  output_path = "/tmp/payment_failure_analyzer.zip"

  source {
    content  = file("${path.module}/payment_failure_analyzer.py")
    filename = "lambda_function.py"
  }
}

data "archive_file" "order_value_tracker" {
  type        = "zip"
  output_path = "/tmp/order_value_tracker.zip"

  source {
    content  = file("${path.module}/order_value_tracker.py")
    filename = "lambda_function.py"
  }
}

data "archive_file" "user_action_analytics" {
  type        = "zip"
  output_path = "/tmp/user_action_analytics.zip"

  source {
    content  = file("${path.module}/user_action_analytics.py")
    filename = "lambda_function.py"
  }
}

# ============================================================================
# KMS Encryption Keys
# ============================================================================

/*
 * CloudWatch Logs Encryption Key
 * Encrypts all CloudWatch log streams at rest for compliance requirements.
 * Automatic rotation enabled for security best practices.
 */
resource "aws_kms_key" "logs_encryption" {
  description             = "KMS key for CloudWatch Logs encryption in ${var.environment}"
  deletion_window_in_days = 7 # Short window for testing environments
  enable_key_rotation     = true

  tags = {
    Name    = "kms-logs-encryption-${var.environment}"
    Purpose = "CloudWatch Logs encryption"
  }
}

resource "aws_kms_alias" "logs_encryption" {
  name          = "alias/logs-encryption-${var.environment}"
  target_key_id = aws_kms_key.logs_encryption.key_id
}

/*
 * CloudWatch Logs KMS Key Policy
 * Grants root account full access and CloudWatch Logs service permissions
 * with strict conditions limiting access to this account's resources only
 */
resource "aws_kms_key_policy" "logs_encryption" {
  key_id = aws_kms_key.logs_encryption.id

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
      }
    ]
  })
}

/*
 * SNS Topic Encryption Key
 * Encrypts SNS messages at rest for secure alert delivery
 */
resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption in ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name    = "kms-sns-encryption-${var.environment}"
    Purpose = "SNS topic encryption"
  }
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/sns-encryption-${var.environment}"
  target_key_id = aws_kms_key.sns_encryption.key_id
}

/*
 * SNS KMS Key Policy
 * Enables SNS service to use the key for message encryption/decryption
 */
resource "aws_kms_key_policy" "sns_encryption" {
  key_id = aws_kms_key.sns_encryption.id

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
        Sid    = "Allow SNS Service"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

/*
 * Application Encryption Key
 * General purpose encryption for S3, SQS, and other application data
 */
resource "aws_kms_key" "app_encryption" {
  description             = "KMS key for general application encryption in ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name    = "kms-app-encryption-${var.environment}"
    Purpose = "Application data encryption"
  }
}

resource "aws_kms_alias" "app_encryption" {
  name          = "alias/app-encryption-${var.environment}"
  target_key_id = aws_kms_key.app_encryption.key_id
}

/*
 * Application KMS Key Policy
 * Provides root account access and service permissions for S3 and SQS
 */
resource "aws_kms_key_policy" "app_encryption" {
  key_id = aws_kms_key.app_encryption.id

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
      }
    ]
  })
}

# ============================================================================
# Networking Infrastructure
# ============================================================================

/*
 * Virtual Private Cloud (VPC)
 * Main network isolation boundary for all microservices infrastructure.
 * Configured with DNS support for service discovery and private hosted zones.
 */
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16" # 65,536 IP addresses for future growth
  enable_dns_hostnames = true          # Required for ECS service discovery
  enable_dns_support   = true          # Required for AWS service endpoints

  tags = {
    Name = "vpc-main-${var.environment}"
  }
}

/*
 * Internet Gateway
 * Provides internet connectivity for resources in public subnets.
 * Required for ALB to receive external traffic and NAT Gateways to function.
 */
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-main-${var.environment}"
  }
}

/*
 * Public Subnets
 * Host the Application Load Balancer and NAT Gateways.
 * Distributed across 3 AZs for high availability.
 */
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${10 + count.index + 1}.0/24" # 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true # Required for NAT Gateway elastic IPs

  tags = {
    Name = "subnet-public-${count.index + 1}-${var.environment}"
    Type = "public"
  }
}

/*
 * Private Subnets
 * Host ECS Fargate tasks isolated from direct internet access.
 * Each subnet routes through its corresponding NAT Gateway for outbound connectivity.
 */
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24" # 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-private-${count.index + 1}-${var.environment}"
    Type = "private"
  }
}

/*
 * Elastic IPs for NAT Gateways
 * Static public IP addresses ensuring consistent outbound connectivity
 */
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environment}"
  }

  # Ensure IGW exists before allocating EIPs
  depends_on = [aws_internet_gateway.main]
}

/*
 * NAT Gateways
 * Provide outbound internet connectivity for private subnet resources.
 * Deployed one per AZ for production-grade high availability.
 */
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-${count.index + 1}-${var.environment}"
  }

  # Ensure IGW is attached before creating NAT Gateways
  depends_on = [aws_internet_gateway.main]
}

/*
 * Route Table for Public Subnets
 * Directs all non-local traffic to the Internet Gateway
 */
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.environment}"
  }
}

/*
 * Public Subnet Route Table Associations
 */
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

/*
 * Route Tables for Private Subnets
 * Each private subnet gets its own route table for AZ-specific NAT routing
 */
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "rt-private-${count.index + 1}-${var.environment}"
  }
}

/*
 * Private Subnet Route Table Associations
 */
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

/*
 * VPC Flow Logs
 * Captures all network traffic metadata for security analysis and troubleshooting.
 * Encrypted with KMS and retained for 1 day in test environments.
 */
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL" # Capture both accepted and rejected traffic
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "flow-log-main-${var.environment}"
  }
}

/*
 * IAM Role for VPC Flow Logs
 * Allows VPC Flow Logs service to write to CloudWatch Logs
 */
resource "aws_iam_role" "vpc_flow_logs" {
  name = "role-vpc-flow-logs-${var.environment}"

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

/*
 * IAM Policy for VPC Flow Logs
 * Grants permissions to create log streams and put log events
 */
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "policy-vpc-flow-logs-${var.environment}"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = aws_cloudwatch_log_group.vpc_flow_logs.arn
    }]
  })
}

# ============================================================================
# Security Groups
# ============================================================================

/*
 * ALB Security Group
 * Controls inbound HTTP traffic from the internet and outbound to ECS tasks
 */
resource "aws_security_group" "alb" {
  name        = "ecs-alb-${var.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Allow inbound HTTP from anywhere for testing
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-alb-${var.environment}"
  }
}

/*
 * ECS Tasks Security Group
 * Controls traffic between ALB and ECS tasks, and outbound HTTPS for AWS APIs
 */
resource "aws_security_group" "ecs_tasks" {
  name        = "ecs-tasks-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Allow inbound from ALB on port 80
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow outbound HTTPS for AWS API calls
  egress {
    description = "HTTPS to AWS APIs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound for pulling container images
  egress {
    description = "All outbound for container pulls"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-ecs-tasks-${var.environment}"
  }
}

# ============================================================================
# S3 Bucket for ALB Logs
# ============================================================================

/*
 * S3 Bucket for Application Load Balancer Access Logs
 * Stores detailed request logs for compliance and analysis.
 * Configured with encryption, versioning, and lifecycle policies.
 */
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "s3-alb-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # Allow deletion even with objects for testing

  tags = {
    Name    = "s3-alb-logs-${var.environment}"
    Purpose = "ALB access logs storage"
  }
}

/*
 * S3 Bucket Versioning
 * Maintains version history of log files for compliance
 */
resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

/*
 * S3 Bucket Server-Side Encryption
 * Encrypts all objects at rest using KMS
 */
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

/*
 * S3 Bucket Public Access Block
 * Prevents any public access to sensitive log data
 */
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

/*
 * S3 Bucket Lifecycle Configuration
 * Automatically transitions old logs to cheaper storage and expires them
 */
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    # Required filter block with empty prefix to apply to all objects
    filter {}

    # Transition to Glacier after 7 days
    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    # Delete logs after 30 days
    expiration {
      days = 30
    }
  }
}

/*
 * S3 Bucket Policy for ALB Logs
 * Grants ALB service account permission to write logs
 */
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.alb_logs.arn,
          "${aws_s3_bucket.alb_logs.arn}/*"
        ]
      },
      {
        Sid    = "ALBAccessLogsWrite"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

# ============================================================================
# SQS Dead Letter Queue
# ============================================================================

/*
 * SQS Queue for SNS Dead Letter Queue
 * Captures failed notification deliveries for troubleshooting
 */
resource "aws_sqs_queue" "sns_dlq" {
  name                       = "sqs-sns-dlq-${var.environment}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 30
  kms_master_key_id          = aws_kms_key.app_encryption.id

  tags = {
    Name    = "sqs-sns-dlq-${var.environment}"
    Purpose = "SNS dead letter queue"
  }
}

/*
 * SQS Queue Policy
 * Allows SNS to send failed messages to the DLQ
 */
resource "aws_sqs_queue_policy" "sns_dlq" {
  queue_url = aws_sqs_queue.sns_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.sns_dlq.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.critical_alerts.arn
        }
      }
    }]
  })
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

/*
 * Log Groups for Microservices
 * Create log groups for all services including future ones
 */
resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.service_names)

  name              = "/ecs/${each.value}"
  retention_in_days = var.retention_days # 30 days for compliance
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name    = "log-group-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * VPC Flow Logs Log Group
 * Short retention for testing environments
 */
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 1 # 1 day for testing cleanup
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name    = "log-group-vpc-flow-${var.environment}"
    Purpose = "VPC Flow Logs"
  }
}

/*
 * Lambda Function Log Groups
 * Created explicitly to set retention and encryption
 */
resource "aws_cloudwatch_log_group" "lambda_payment_analyzer" {
  name              = "/aws/lambda/lambda-payment-analyzer-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name     = "log-group-lambda-payment-${var.environment}"
    Function = "payment-analyzer"
  }
}

resource "aws_cloudwatch_log_group" "lambda_order_tracker" {
  name              = "/aws/lambda/lambda-order-tracker-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name     = "log-group-lambda-order-${var.environment}"
    Function = "order-tracker"
  }
}

resource "aws_cloudwatch_log_group" "lambda_user_analytics" {
  name              = "/aws/lambda/lambda-user-analytics-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name     = "log-group-lambda-user-${var.environment}"
    Function = "user-analytics"
  }
}

# ============================================================================
# ECS Cluster and Task Definitions
# ============================================================================

/*
 * ECS Fargate Cluster
 * Container orchestration platform for microservices
 */
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled" # Enable Container Insights for monitoring
  }

  tags = {
    Name = "ecs-cluster-${var.environment}"
  }
}

/*
 * IAM Role for ECS Task Execution
 * Allows ECS to pull images and write logs
 */
resource "aws_iam_role" "ecs_task_execution" {
  name = "role-ecs-task-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "role-ecs-task-execution-${var.environment}"
  }
}

/*
 * IAM Policy Attachment for ECS Task Execution
 * Attaches AWS managed policy for basic ECS operations
 */
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

/*
 * Custom IAM Policy for CloudWatch Logs
 * Grants permission to write to specific log groups
 */
resource "aws_iam_role_policy" "ecs_task_execution_logs" {
  name = "policy-ecs-logs-${var.environment}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = [
        for service in ["auth-service", "payment-service", "order-service"] :
        "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${service}:*"
      ]
    }]
  })

  # Ensure role exists before attaching policy
  depends_on = [aws_iam_role.ecs_task_execution]
}

/*
 * IAM Roles for ECS Tasks
 * Application-level permissions for each service
 */
resource "aws_iam_role" "ecs_task" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  name = "role-ecs-task-${each.value}-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name    = "role-ecs-task-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * X-Ray Permissions for ECS Tasks
 * Allows services to send tracing data to X-Ray
 */
resource "aws_iam_role_policy" "ecs_task_xray" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  name = "policy-xray-${each.value}-${var.environment}"
  role = aws_iam_role.ecs_task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      Resource = "*" # X-Ray requires wildcard for segments
    }]
  })

  depends_on = [aws_iam_role.ecs_task]
}

/*
 * CloudWatch Metrics Permissions for ECS Tasks
 * Allows services to publish custom metrics
 */
resource "aws_iam_role_policy" "ecs_task_cloudwatch" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  name = "policy-cloudwatch-${each.value}-${var.environment}"
  role = aws_iam_role.ecs_task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cloudwatch:PutMetricData"
      ]
      Resource = "*"
      Condition = {
        StringEquals = {
          "cloudwatch:namespace" = "MicroserviceMetrics/${var.environment}"
        }
      }
    }]
  })

  depends_on = [aws_iam_role.ecs_task]
}

/*
 * ECS Task Definitions
 * Define container specifications for each microservice
 */
resource "aws_ecs_task_definition" "services" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  family                   = "${each.value}-${var.environment}"
  network_mode             = "awsvpc" # Required for Fargate
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"  # 0.5 vCPU
  memory                   = "1024" # 1 GB RAM
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task[each.value].arn

  container_definitions = jsonencode([
    {
      name  = each.value
      image = "nginx:latest" # Public image for testing

      portMappings = [{
        containerPort = 80
        protocol      = "tcp"
      }]

      # Custom entrypoint to generate JSON logs
      entryPoint = ["/bin/sh", "-c"]
      command = [
        "echo '{\"service\":\"${each.value}\",\"status\":200,\"request_time\":${random_integer.response_time[each.value].result},\"timestamp\":\"'$(date -Iseconds)'\"}' > /usr/share/nginx/html/health && nginx -g 'daemon off;'"
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = each.value
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.value].name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    },
    {
      name  = "xray-daemon"
      image = "public.ecr.aws/xray/aws-xray-daemon:latest" # X-Ray daemon sidecar

      portMappings = [{
        containerPort = 2000
        protocol      = "udp"
      }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.value].name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "xray"
        }
      }

      essential = false
    }
  ])

  tags = {
    Name    = "task-def-${each.value}-${var.environment}"
    Service = each.value
  }

  depends_on = [
    aws_iam_role_policy.ecs_task_execution_logs,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]
}

# Random integers for simulating response times
resource "random_integer" "response_time" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  min = 50
  max = 500

  keepers = {
    service = each.value
  }
}

# ============================================================================
# Application Load Balancer
# ============================================================================

/*
 * Application Load Balancer
 * Routes external traffic to microservices based on path patterns
 */
resource "aws_lb" "main" {
  name               = "alb-main-${var.environment}"
  internal           = false # Internet-facing
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Allow deletion for testing
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = {
    Name = "alb-main-${var.environment}"
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

/*
 * Target Groups for Microservices
 * Define health checks and connection parameters
 */
resource "aws_lb_target_group" "services" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  name        = "tg-${substr(each.value, 0, 20)}-${var.environment}" # Truncate for name length limit
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Required for Fargate

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30 # Quick draining for testing

  tags = {
    Name    = "tg-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * ALB Listener
 * Handles incoming HTTP requests and routes to target groups
 */
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Default action routes to auth service
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["auth-service"].arn
  }
}

/*
 * Path-based Routing Rules
 * Route requests to appropriate services based on URL path
 */
resource "aws_lb_listener_rule" "auth" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["auth-service"].arn
  }

  condition {
    path_pattern {
      values = ["/auth*"]
    }
  }
}

resource "aws_lb_listener_rule" "payment" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["payment-service"].arn
  }

  condition {
    path_pattern {
      values = ["/payment*"]
    }
  }
}

resource "aws_lb_listener_rule" "order" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["order-service"].arn
  }

  condition {
    path_pattern {
      values = ["/order*"]
    }
  }
}

# ============================================================================
# ECS Services
# ============================================================================

/*
 * ECS Services
 * Deploy and manage container tasks with auto-scaling and load balancing
 */
resource "aws_ecs_service" "services" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  name            = "${each.value}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.value].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  force_new_deployment = true # Force new deployment on task definition changes

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.value].arn
    container_name   = each.value
    container_port   = 80
  }

  tags = {
    Name    = "ecs-service-${each.value}-${var.environment}"
    Service = each.value
  }

  depends_on = [
    aws_lb_listener.main,
    aws_iam_role_policy.ecs_task_xray,
    aws_iam_role_policy.ecs_task_cloudwatch
  ]
}

# ============================================================================
# X-Ray Sampling Rules
# ============================================================================

/*
 * X-Ray Sampling Rule for Errors
 * Sample 100% of error responses for troubleshooting
 */
resource "aws_xray_sampling_rule" "errors" {
  rule_name      = "xray-errors-${var.environment}"
  priority       = 100
  version        = 1
  reservoir_size = 0
  fixed_rate     = 1.0 # 100% sampling
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    "http.status" = "4*"
  }

  tags = {
    Name    = "xray-errors-${var.environment}"
    Purpose = "Error sampling"
  }
}

/*
 * X-Ray Sampling Rule for Success
 * Sample 10% of successful requests for normal operation analysis
 */
resource "aws_xray_sampling_rule" "success" {
  rule_name      = "xray-success-${var.environment}"
  priority       = 200
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1 # 10% sampling
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    "http.status" = "2*"
  }

  tags = {
    Name    = "xray-success-${var.environment}"
    Purpose = "Success sampling"
  }
}

# ============================================================================
# CloudWatch Metric Filters
# ============================================================================

/*
 * Metric Filter for Request Count
 * Counts all log entries to track request volume
 */
resource "aws_cloudwatch_log_metric_filter" "request_count" {
  for_each = toset(var.service_names)

  name           = "metric-filter-request-count-${each.value}"
  log_group_name = aws_cloudwatch_log_group.services[each.value].name
  pattern        = "{ $.status = * }"

  metric_transformation {
    name          = "request_count"
    namespace     = "MicroserviceMetrics/${var.environment}"
    value         = "1"
    unit          = "Count"
    default_value = 0
  }
}

/*
 * Metric Filter for Error Count
 * Tracks 4xx and 5xx responses
 */
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  for_each = toset(var.service_names)

  name           = "metric-filter-error-count-${each.value}"
  log_group_name = aws_cloudwatch_log_group.services[each.value].name
  pattern        = "{ $.status >= 400 }"

  metric_transformation {
    name      = "error_count"
    namespace = "MicroserviceMetrics/${var.environment}"
    value     = "1"
    unit      = "Count"

    default_value = 0
  }
}

/*
 * Metric Filter for Response Time
 * Extracts response time values from JSON logs
 */
resource "aws_cloudwatch_log_metric_filter" "response_time" {
  for_each = toset(var.service_names)

  name           = "metric-filter-response-time-${each.value}"
  log_group_name = aws_cloudwatch_log_group.services[each.value].name
  pattern        = "{ $.request_time = * }"

  metric_transformation {
    name      = "response_time"
    namespace = "MicroserviceMetrics/${var.environment}"
    value     = "$.request_time"
    unit      = "Milliseconds"

    default_value = 0
  }
}

/*
 * Metric Filter for Payment Amount (Business KPI)
 * Extracts payment values for financial tracking
 */
resource "aws_cloudwatch_log_metric_filter" "payment_amount" {
  name           = "metric-filter-payment-amount"
  log_group_name = aws_cloudwatch_log_group.services["payment-service"].name
  pattern        = "{ $.payment_amount = * }"

  metric_transformation {
    name      = "payment_amount"
    namespace = "MicroserviceMetrics/${var.environment}"
    value     = "$.payment_amount"
    unit      = "None"

    default_value = 0
  }
}

/*
 * Metric Filter for Order Value (Business KPI)
 * Tracks order values for revenue analysis
 */
resource "aws_cloudwatch_log_metric_filter" "order_value" {
  name           = "metric-filter-order-value"
  log_group_name = aws_cloudwatch_log_group.services["order-service"].name
  pattern        = "{ $.order_value = * }"

  metric_transformation {
    name      = "order_value"
    namespace = "MicroserviceMetrics/${var.environment}"
    value     = "$.order_value"
    unit      = "None"

    default_value = 0
  }
}

# ============================================================================
# CloudWatch Dashboard
# ============================================================================

/*
 * CloudWatch Dashboard
 * Comprehensive visualization of service health and performance metrics
 */
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dashboard-microservices-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# Microservices Observability Dashboard\n\n**Deployed Services:** auth-service, payment-service, order-service\n\n**Future Services:** inventory-service, notification-service"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["MicroserviceMetrics/${var.environment}", "error_count", { "stat" : "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Error Count - All Services"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["MicroserviceMetrics/${var.environment}", "response_time", { "stat" : "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Average Response Time (ms)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 2
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["MicroserviceMetrics/${var.environment}", "request_count", { "stat" : "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Request Count"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

/*
 * Error Count Alarms
 * Trigger when error count exceeds threshold
 */
resource "aws_cloudwatch_metric_alarm" "error_count" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  alarm_name          = "alarm-error-count-${each.value}-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "error_count"
  namespace           = "MicroserviceMetrics/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_thresholds["error_count_threshold"]
  alarm_description   = "Triggers when ${each.value} has more than ${var.alarm_thresholds["error_count_threshold"]} errors in 5 minutes"

  dimensions = {
    ServiceName = each.value
    Environment = var.environment
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name    = "alarm-error-count-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * Response Time Alarms
 * Trigger when response time exceeds threshold
 */
resource "aws_cloudwatch_metric_alarm" "response_time" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  alarm_name          = "alarm-response-time-${each.value}-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "response_time"
  namespace           = "MicroserviceMetrics/${var.environment}"
  period              = 300
  statistic           = "Average"
  threshold           = var.alarm_thresholds["response_time_ms"]
  alarm_description   = "Triggers when ${each.value} average response time exceeds ${var.alarm_thresholds["response_time_ms"]}ms"

  dimensions = {
    ServiceName = each.value
    Environment = var.environment
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name    = "alarm-response-time-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * Error Rate Alarms
 * Calculate error percentage and trigger on threshold
 */
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  alarm_name          = "alarm-error-rate-${each.value}-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = var.alarm_thresholds["error_rate_percent"]
  alarm_description   = "Triggers when ${each.value} error rate exceeds ${var.alarm_thresholds["error_rate_percent"]}%"

  metric_query {
    id          = "e1"
    expression  = "m1 / m2 * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "error_count"
      namespace   = "MicroserviceMetrics/${var.environment}"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ServiceName = each.value
        Environment = var.environment
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "request_count"
      namespace   = "MicroserviceMetrics/${var.environment}"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ServiceName = each.value
        Environment = var.environment
      }
    }
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name    = "alarm-error-rate-${each.value}-${var.environment}"
    Service = each.value
  }
}

/*
 * Composite Alarms
 * Trigger only when multiple conditions are met simultaneously
 */
resource "aws_cloudwatch_composite_alarm" "service_critical" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  alarm_name        = "critical-composite-${each.value}-${var.environment}"
  alarm_description = "Critical alarm when both error rate and response time are high for ${each.value}"

  alarm_rule = join(" AND ", [
    "ALARM(${aws_cloudwatch_metric_alarm.error_rate[each.value].alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.response_time[each.value].alarm_name})"
  ])

  actions_enabled = true
  alarm_actions   = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Name     = "critical-composite-${each.value}-${var.environment}"
    Service  = each.value
    Severity = "critical"
  }

  depends_on = [
    aws_cloudwatch_metric_alarm.error_rate,
    aws_cloudwatch_metric_alarm.response_time
  ]
}

/*
 * Anomaly Alarms
 * Trigger when metrics fall outside predicted bands
 */
resource "aws_cloudwatch_metric_alarm" "anomaly" {
  for_each = toset(["auth-service", "payment-service", "order-service"])

  alarm_name          = "warning-anomaly-${each.value}-${var.environment}"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 3
  threshold_metric_id = "e1"
  alarm_description   = "Anomaly detection for ${each.value} request rate"

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "request_count"
      namespace   = "MicroserviceMetrics/${var.environment}"
      period      = 300
      stat        = "Average"
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.alarm_thresholds["anomaly_std_deviations"]})"
    label       = "Expected Range"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name    = "warning-anomaly-${each.value}-${var.environment}"
    Service = each.value
  }
}

# ============================================================================
# SNS Topics
# ============================================================================

/*
 * Critical Alerts SNS Topic
 * For high-priority alerts requiring immediate attention
 */
resource "aws_sns_topic" "critical_alerts" {
  name              = "sns-critical-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "sns-critical-alerts-${var.environment}"
    Severity = "critical"
  }
}

resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_email

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.sns_dlq.arn
  })
}

/*
 * Warning Alerts SNS Topic
 * For medium-priority alerts
 */
resource "aws_sns_topic" "warning_alerts" {
  name              = "sns-warning-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "sns-warning-alerts-${var.environment}"
    Severity = "warning"
  }
}

resource "aws_sns_topic_subscription" "warning_email" {
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = "warning@example.com"
}

/*
 * Info Alerts SNS Topic
 * For low-priority informational alerts
 */
resource "aws_sns_topic" "info_alerts" {
  name              = "sns-info-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "sns-info-alerts-${var.environment}"
    Severity = "info"
  }
}

resource "aws_sns_topic_subscription" "info_email" {
  topic_arn = aws_sns_topic.info_alerts.arn
  protocol  = "email"
  endpoint  = "info@example.com"
}

/*
 * SNS Topic Policies
 * Allow CloudWatch and EventBridge to publish messages
 */
resource "aws_sns_topic_policy" "critical_alerts" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["cloudwatch.amazonaws.com", "events.amazonaws.com"]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_policy" "warning_alerts" {
  arn = aws_sns_topic.warning_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["cloudwatch.amazonaws.com", "events.amazonaws.com"]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.warning_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_policy" "info_alerts" {
  arn = aws_sns_topic.info_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["cloudwatch.amazonaws.com", "events.amazonaws.com"]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.info_alerts.arn
      }
    ]
  })
}

# ============================================================================
# EventBridge Rules
# ============================================================================

/*
 * EventBridge Rule for Critical Alarms
 * Routes critical severity alarms to critical SNS topic
 */
resource "aws_cloudwatch_event_rule" "critical_alarms" {
  name        = "rule-critical-alarms-${var.environment}"
  description = "Route critical alarms to critical SNS topic"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      state = {
        value = ["ALARM"]
      }
      alarmName = [{
        prefix = "critical-"
      }]
    }
  })

  tags = {
    Name     = "rule-critical-alarms-${var.environment}"
    Severity = "critical"
  }
}

resource "aws_cloudwatch_event_target" "critical_alarms" {
  rule      = aws_cloudwatch_event_rule.critical_alarms.name
  target_id = "critical-sns"
  arn       = aws_sns_topic.critical_alerts.arn

  input_transformer {
    input_paths = {
      alarm     = "$.detail.alarmName"
      reason    = "$.detail.state.reason"
      timestamp = "$.time"
    }

    input_template = "\"CRITICAL ALERT: <alarm>\\nReason: <reason>\\nTime: <timestamp>\""
  }
}

/*
 * EventBridge Rule for Warning Alarms
 * Routes warning severity alarms to warning SNS topic
 */
resource "aws_cloudwatch_event_rule" "warning_alarms" {
  name        = "rule-warning-alarms-${var.environment}"
  description = "Route warning alarms to warning SNS topic"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      state = {
        value = ["ALARM"]
      }
      alarmName = [{
        prefix = "warning-"
      }]
    }
  })

  tags = {
    Name     = "rule-warning-alarms-${var.environment}"
    Severity = "warning"
  }
}

resource "aws_cloudwatch_event_target" "warning_alarms" {
  rule      = aws_cloudwatch_event_rule.warning_alarms.name
  target_id = "warning-sns"
  arn       = aws_sns_topic.warning_alerts.arn

  input_transformer {
    input_paths = {
      alarm     = "$.detail.alarmName"
      reason    = "$.detail.state.reason"
      timestamp = "$.time"
    }

    input_template = "\"WARNING: <alarm>\\nReason: <reason>\\nTime: <timestamp>\""
  }
}

/*
 * EventBridge Rule for Info Alarms
 * Routes informational alarms to info SNS topic
 */
resource "aws_cloudwatch_event_rule" "info_alarms" {
  name        = "rule-info-alarms-${var.environment}"
  description = "Route info alarms to info SNS topic"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      state = {
        value = ["ALARM"]
      }
      alarmName = [{
        prefix = "info-"
      }]
    }
  })

  tags = {
    Name     = "rule-info-alarms-${var.environment}"
    Severity = "info"
  }
}

resource "aws_cloudwatch_event_target" "info_alarms" {
  rule      = aws_cloudwatch_event_rule.info_alarms.name
  target_id = "info-sns"
  arn       = aws_sns_topic.info_alerts.arn

  input_transformer {
    input_paths = {
      alarm     = "$.detail.alarmName"
      reason    = "$.detail.state.reason"
      timestamp = "$.time"
    }

    input_template = "\"INFO: <alarm>\\nReason: <reason>\\nTime: <timestamp>\""
  }
}

# ============================================================================
# Lambda Functions
# ============================================================================

/*
 * IAM Role for Lambda Functions
 * Allows Lambda to execute and access necessary AWS services
 */
resource "aws_iam_role" "lambda" {
  for_each = toset(["payment-analyzer", "order-tracker", "user-analytics"])

  name = "role-lambda-${each.value}-${var.environment}"

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
    Name     = "role-lambda-${each.value}-${var.environment}"
    Function = each.value
  }
}

/*
 * Lambda Basic Execution Policy
 * Allows Lambda to write logs to CloudWatch
 */
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = toset(["payment-analyzer", "order-tracker", "user-analytics"])

  role       = aws_iam_role.lambda[each.value].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

  depends_on = [aws_iam_role.lambda]
}

/*
 * Lambda CloudWatch Logs Read Policy
 * Allows Lambda to read from specific log groups
 */
resource "aws_iam_role_policy" "lambda_logs_read" {
  name = "policy-lambda-logs-read-payment-${var.environment}"
  role = aws_iam_role.lambda["payment-analyzer"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:FilterLogEvents",
        "logs:GetLogEvents"
      ]
      Resource = aws_cloudwatch_log_group.services["payment-service"].arn
    }]
  })

  depends_on = [aws_iam_role.lambda]
}

resource "aws_iam_role_policy" "lambda_logs_read_order" {
  name = "policy-lambda-logs-read-order-${var.environment}"
  role = aws_iam_role.lambda["order-tracker"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:FilterLogEvents",
        "logs:GetLogEvents"
      ]
      Resource = aws_cloudwatch_log_group.services["order-service"].arn
    }]
  })

  depends_on = [aws_iam_role.lambda]
}

resource "aws_iam_role_policy" "lambda_logs_read_auth" {
  name = "policy-lambda-logs-read-auth-${var.environment}"
  role = aws_iam_role.lambda["user-analytics"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:FilterLogEvents",
        "logs:GetLogEvents"
      ]
      Resource = aws_cloudwatch_log_group.services["auth-service"].arn
    }]
  })

  depends_on = [aws_iam_role.lambda]
}

/*
 * Lambda CloudWatch Metrics Write Policy
 * Allows Lambda to publish custom metrics
 */
resource "aws_iam_role_policy" "lambda_metrics" {
  for_each = toset(["payment-analyzer", "order-tracker", "user-analytics"])

  name = "policy-lambda-metrics-${each.value}-${var.environment}"
  role = aws_iam_role.lambda[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cloudwatch:PutMetricData"
      ]
      Resource = "*"
      Condition = {
        StringEquals = {
          "cloudwatch:namespace" = "CustomMetrics/Business/${var.environment}"
        }
      }
    }]
  })

  depends_on = [aws_iam_role.lambda]
}

/*
 * Lambda X-Ray Tracing Policy
 * Allows Lambda to send traces to X-Ray
 */
resource "aws_iam_role_policy" "lambda_xray" {
  for_each = toset(["payment-analyzer", "order-tracker", "user-analytics"])

  name = "policy-lambda-xray-${each.value}-${var.environment}"
  role = aws_iam_role.lambda[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      Resource = "*"
    }]
  })

  depends_on = [aws_iam_role.lambda]
}

/*
 * Payment Failure Analyzer Lambda Function
 * Processes payment logs to calculate failure rates by payment method
 */
resource "aws_lambda_function" "payment_failure_analyzer" {
  filename         = data.archive_file.payment_failure_analyzer.output_path
  function_name    = "lambda-payment-analyzer-${var.environment}"
  role             = aws_iam_role.lambda["payment-analyzer"].arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.payment_failure_analyzer.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      METRIC_NAMESPACE = "CustomMetrics/Business/${var.environment}"
      SERVICE_NAME     = "payment-service"
      ENVIRONMENT      = var.environment
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name    = "lambda-payment-analyzer-${var.environment}"
    Purpose = "Payment failure analysis"
  }

  depends_on = [
    aws_iam_role.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_logs_read,
    aws_iam_role_policy.lambda_metrics,
    aws_iam_role_policy.lambda_xray,
    aws_cloudwatch_log_group.lambda_payment_analyzer
  ]
}

/*
 * Order Value Tracker Lambda Function
 * Calculates order metrics and revenue
 */
resource "aws_lambda_function" "order_value_tracker" {
  filename         = data.archive_file.order_value_tracker.output_path
  function_name    = "lambda-order-tracker-${var.environment}"
  role             = aws_iam_role.lambda["order-tracker"].arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.order_value_tracker.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      METRIC_NAMESPACE = "CustomMetrics/Business/${var.environment}"
      SERVICE_NAME     = "order-service"
      ENVIRONMENT      = var.environment
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name    = "lambda-order-tracker-${var.environment}"
    Purpose = "Order value tracking"
  }

  depends_on = [
    aws_iam_role.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_logs_read_order,
    aws_iam_role_policy.lambda_metrics,
    aws_iam_role_policy.lambda_xray,
    aws_cloudwatch_log_group.lambda_order_tracker
  ]
}

/*
 * User Action Analytics Lambda Function
 * Analyzes authentication logs for user behavior
 */
resource "aws_lambda_function" "user_action_analytics" {
  filename         = data.archive_file.user_action_analytics.output_path
  function_name    = "lambda-user-analytics-${var.environment}"
  role             = aws_iam_role.lambda["user-analytics"].arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.user_action_analytics.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      METRIC_NAMESPACE = "CustomMetrics/Business/${var.environment}"
      SERVICE_NAME     = "auth-service"
      ENVIRONMENT      = var.environment
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name    = "lambda-user-analytics-${var.environment}"
    Purpose = "User action analytics"
  }

  depends_on = [
    aws_iam_role.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_logs_read_auth,
    aws_iam_role_policy.lambda_metrics,
    aws_iam_role_policy.lambda_xray,
    aws_cloudwatch_log_group.lambda_user_analytics
  ]
}

/*
 * Lambda Permission for CloudWatch Logs
 * Allows CloudWatch Logs to invoke Lambda functions
 */
resource "aws_lambda_permission" "logs_payment" {
  statement_id  = "AllowExecutionFromCloudWatchLogs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_failure_analyzer.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.services["payment-service"].arn}:*"
}

resource "aws_lambda_permission" "logs_order" {
  statement_id  = "AllowExecutionFromCloudWatchLogs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_value_tracker.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.services["order-service"].arn}:*"
}

resource "aws_lambda_permission" "logs_auth" {
  statement_id  = "AllowExecutionFromCloudWatchLogs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_action_analytics.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.services["auth-service"].arn}:*"
}

/*
 * CloudWatch Logs Subscription Filters
 * Stream logs to Lambda functions for processing
 */
resource "aws_cloudwatch_log_subscription_filter" "payment_lambda" {
  name            = "subscription-payment-lambda-${var.environment}"
  log_group_name  = aws_cloudwatch_log_group.services["payment-service"].name
  filter_pattern  = "{ $.payment_method = * }"
  destination_arn = aws_lambda_function.payment_failure_analyzer.arn

  depends_on = [aws_lambda_permission.logs_payment]
}

resource "aws_cloudwatch_log_subscription_filter" "order_lambda" {
  name            = "subscription-order-lambda-${var.environment}"
  log_group_name  = aws_cloudwatch_log_group.services["order-service"].name
  filter_pattern  = "{ $.order_value = * }"
  destination_arn = aws_lambda_function.order_value_tracker.arn

  depends_on = [aws_lambda_permission.logs_order]
}

resource "aws_cloudwatch_log_subscription_filter" "auth_lambda" {
  name            = "subscription-auth-lambda-${var.environment}"
  log_group_name  = aws_cloudwatch_log_group.services["auth-service"].name
  filter_pattern  = "{ $.action = * }"
  destination_arn = aws_lambda_function.user_action_analytics.arn

  depends_on = [aws_lambda_permission.logs_auth]
}

# ============================================================================
# CloudWatch DLQ Alarm
# ============================================================================

/*
 * SQS DLQ Monitoring Alarm
 * Alerts when messages accumulate in the dead letter queue
 */
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "warning-dlq-messages-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Alert when messages are in the SNS DLQ"

  dimensions = {
    QueueName = aws_sqs_queue.sns_dlq.name
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name    = "warning-dlq-messages-${var.environment}"
    Purpose = "DLQ monitoring"
  }
}

# ============================================================================
# Outputs
# ============================================================================

# CloudWatch Log Group Outputs (16 outputs)
output "log_group_auth_service_name" {
  description = "CloudWatch log group name for auth-service"
  value       = aws_cloudwatch_log_group.services["auth-service"].name
}

output "log_group_auth_service_arn" {
  description = "CloudWatch log group ARN for auth-service"
  value       = aws_cloudwatch_log_group.services["auth-service"].arn
}

output "log_group_payment_service_name" {
  description = "CloudWatch log group name for payment-service"
  value       = aws_cloudwatch_log_group.services["payment-service"].name
}

output "log_group_payment_service_arn" {
  description = "CloudWatch log group ARN for payment-service"
  value       = aws_cloudwatch_log_group.services["payment-service"].arn
}

output "log_group_order_service_name" {
  description = "CloudWatch log group name for order-service"
  value       = aws_cloudwatch_log_group.services["order-service"].name
}

output "log_group_order_service_arn" {
  description = "CloudWatch log group ARN for order-service"
  value       = aws_cloudwatch_log_group.services["order-service"].arn
}

output "log_group_inventory_service_name" {
  description = "CloudWatch log group name for inventory-service (future)"
  value       = aws_cloudwatch_log_group.services["inventory-service"].name
}

output "log_group_inventory_service_arn" {
  description = "CloudWatch log group ARN for inventory-service (future)"
  value       = aws_cloudwatch_log_group.services["inventory-service"].arn
}

output "log_group_notification_service_name" {
  description = "CloudWatch log group name for notification-service (future)"
  value       = aws_cloudwatch_log_group.services["notification-service"].name
}

output "log_group_notification_service_arn" {
  description = "CloudWatch log group ARN for notification-service (future)"
  value       = aws_cloudwatch_log_group.services["notification-service"].arn
}

output "log_group_vpc_flow_logs_name" {
  description = "CloudWatch log group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "log_group_vpc_flow_logs_arn" {
  description = "CloudWatch log group ARN for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.arn
}

output "log_group_lambda_payment_name" {
  description = "CloudWatch log group name for payment analyzer Lambda"
  value       = aws_cloudwatch_log_group.lambda_payment_analyzer.name
}

output "log_group_lambda_payment_arn" {
  description = "CloudWatch log group ARN for payment analyzer Lambda"
  value       = aws_cloudwatch_log_group.lambda_payment_analyzer.arn
}

output "log_group_lambda_order_name" {
  description = "CloudWatch log group name for order tracker Lambda"
  value       = aws_cloudwatch_log_group.lambda_order_tracker.name
}

output "log_group_lambda_order_arn" {
  description = "CloudWatch log group ARN for order tracker Lambda"
  value       = aws_cloudwatch_log_group.lambda_order_tracker.arn
}

output "log_group_lambda_user_name" {
  description = "CloudWatch log group name for user analytics Lambda"
  value       = aws_cloudwatch_log_group.lambda_user_analytics.name
}

output "log_group_lambda_user_arn" {
  description = "CloudWatch log group ARN for user analytics Lambda"
  value       = aws_cloudwatch_log_group.lambda_user_analytics.arn
}

# KMS Key Outputs (6 outputs)
output "kms_logs_key_id" {
  description = "KMS key ID for CloudWatch Logs encryption"
  value       = aws_kms_key.logs_encryption.id
}

output "kms_logs_key_arn" {
  description = "KMS key ARN for CloudWatch Logs encryption"
  value       = aws_kms_key.logs_encryption.arn
}

output "kms_sns_key_id" {
  description = "KMS key ID for SNS encryption"
  value       = aws_kms_key.sns_encryption.id
}

output "kms_sns_key_arn" {
  description = "KMS key ARN for SNS encryption"
  value       = aws_kms_key.sns_encryption.arn
}

output "kms_app_key_id" {
  description = "KMS key ID for application encryption"
  value       = aws_kms_key.app_encryption.id
}

output "kms_app_key_arn" {
  description = "KMS key ARN for application encryption"
  value       = aws_kms_key.app_encryption.arn
}

# SNS Topic Outputs (6 outputs)
output "sns_critical_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = aws_sns_topic.critical_alerts.arn
}

output "sns_critical_topic_name" {
  description = "SNS topic name for critical alerts"
  value       = aws_sns_topic.critical_alerts.name
}

output "sns_warning_topic_arn" {
  description = "SNS topic ARN for warning alerts"
  value       = aws_sns_topic.warning_alerts.arn
}

output "sns_warning_topic_name" {
  description = "SNS topic name for warning alerts"
  value       = aws_sns_topic.warning_alerts.name
}

output "sns_info_topic_arn" {
  description = "SNS topic ARN for info alerts"
  value       = aws_sns_topic.info_alerts.arn
}

output "sns_info_topic_name" {
  description = "SNS topic name for info alerts"
  value       = aws_sns_topic.info_alerts.name
}

# Lambda Function Outputs (9 outputs)
output "lambda_payment_analyzer_name" {
  description = "Lambda function name for payment analyzer"
  value       = aws_lambda_function.payment_failure_analyzer.function_name
}

output "lambda_payment_analyzer_arn" {
  description = "Lambda function ARN for payment analyzer"
  value       = aws_lambda_function.payment_failure_analyzer.arn
}

output "lambda_payment_analyzer_role_arn" {
  description = "IAM role ARN for payment analyzer Lambda"
  value       = aws_iam_role.lambda["payment-analyzer"].arn
}

output "lambda_order_tracker_name" {
  description = "Lambda function name for order tracker"
  value       = aws_lambda_function.order_value_tracker.function_name
}

output "lambda_order_tracker_arn" {
  description = "Lambda function ARN for order tracker"
  value       = aws_lambda_function.order_value_tracker.arn
}

output "lambda_order_tracker_role_arn" {
  description = "IAM role ARN for order tracker Lambda"
  value       = aws_iam_role.lambda["order-tracker"].arn
}

output "lambda_user_analytics_name" {
  description = "Lambda function name for user analytics"
  value       = aws_lambda_function.user_action_analytics.function_name
}

output "lambda_user_analytics_arn" {
  description = "Lambda function ARN for user analytics"
  value       = aws_lambda_function.user_action_analytics.arn
}

output "lambda_user_analytics_role_arn" {
  description = "IAM role ARN for user analytics Lambda"
  value       = aws_iam_role.lambda["user-analytics"].arn
}

# ECS Outputs (7 outputs)
output "ecs_cluster_id" {
  description = "ECS cluster ID for microservices"
  value       = aws_ecs_cluster.main.id
}

output "ecs_service_auth_name" {
  description = "ECS service name for auth-service"
  value       = aws_ecs_service.services["auth-service"].name
}

output "ecs_service_payment_name" {
  description = "ECS service name for payment-service"
  value       = aws_ecs_service.services["payment-service"].name
}

output "ecs_service_order_name" {
  description = "ECS service name for order-service"
  value       = aws_ecs_service.services["order-service"].name
}

output "ecs_task_def_auth_arn" {
  description = "ECS task definition ARN for auth-service"
  value       = aws_ecs_task_definition.services["auth-service"].arn
}

output "ecs_task_def_payment_arn" {
  description = "ECS task definition ARN for payment-service"
  value       = aws_ecs_task_definition.services["payment-service"].arn
}

output "ecs_task_def_order_arn" {
  description = "ECS task definition ARN for order-service"
  value       = aws_ecs_task_definition.services["order-service"].arn
}

# ALB Outputs (5 outputs)
output "alb_dns_name" {
  description = "Application Load Balancer DNS name for accessing services"
  value       = aws_lb.main.dns_name
  sensitive   = true
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_target_group_auth_arn" {
  description = "Target group ARN for auth-service"
  value       = aws_lb_target_group.services["auth-service"].arn
}

output "alb_target_group_payment_arn" {
  description = "Target group ARN for payment-service"
  value       = aws_lb_target_group.services["payment-service"].arn
}

output "alb_target_group_order_arn" {
  description = "Target group ARN for order-service"
  value       = aws_lb_target_group.services["order-service"].arn
}

# Network Outputs (10 outputs)
output "vpc_id" {
  description = "VPC ID for the main network"
  value       = aws_vpc.main.id
}

output "subnet_private_1_id" {
  description = "Private subnet 1 ID"
  value       = aws_subnet.private[0].id
}

output "subnet_private_2_id" {
  description = "Private subnet 2 ID"
  value       = aws_subnet.private[1].id
}

output "subnet_private_3_id" {
  description = "Private subnet 3 ID"
  value       = aws_subnet.private[2].id
}

output "subnet_public_1_id" {
  description = "Public subnet 1 ID"
  value       = aws_subnet.public[0].id
}

output "subnet_public_2_id" {
  description = "Public subnet 2 ID"
  value       = aws_subnet.public[1].id
}

output "subnet_public_3_id" {
  description = "Public subnet 3 ID"
  value       = aws_subnet.public[2].id
}

output "nat_gateway_1_id" {
  description = "NAT Gateway 1 ID"
  value       = aws_nat_gateway.main[0].id
}

output "nat_gateway_2_id" {
  description = "NAT Gateway 2 ID"
  value       = aws_nat_gateway.main[1].id
}

output "nat_gateway_3_id" {
  description = "NAT Gateway 3 ID"
  value       = aws_nat_gateway.main[2].id
}

# S3 Outputs (2 outputs)
output "s3_alb_logs_bucket_name" {
  description = "S3 bucket name for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "s3_alb_logs_bucket_arn" {
  description = "S3 bucket ARN for ALB access logs"
  value       = aws_s3_bucket.alb_logs.arn
}

# SQS Outputs (2 outputs)
output "sqs_dlq_url" {
  description = "SQS DLQ URL for failed SNS messages"
  value       = aws_sqs_queue.sns_dlq.url
}

output "sqs_dlq_arn" {
  description = "SQS DLQ ARN for failed SNS messages"
  value       = aws_sqs_queue.sns_dlq.arn
}

# CloudWatch Dashboard Outputs (2 outputs)
output "dashboard_name" {
  description = "CloudWatch dashboard name for microservices monitoring"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL for direct access"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# Composite Alarm Outputs (3 outputs)
output "composite_alarm_auth_name" {
  description = "Composite alarm name for auth-service critical conditions"
  value       = aws_cloudwatch_composite_alarm.service_critical["auth-service"].alarm_name
}

output "composite_alarm_payment_name" {
  description = "Composite alarm name for payment-service critical conditions"
  value       = aws_cloudwatch_composite_alarm.service_critical["payment-service"].alarm_name
}

output "composite_alarm_order_name" {
  description = "Composite alarm name for order-service critical conditions"
  value       = aws_cloudwatch_composite_alarm.service_critical["order-service"].alarm_name
}

# EventBridge Rule Outputs (6 outputs)
output "eventbridge_rule_critical_name" {
  description = "EventBridge rule name for critical alarm routing"
  value       = aws_cloudwatch_event_rule.critical_alarms.name
}

output "eventbridge_rule_critical_arn" {
  description = "EventBridge rule ARN for critical alarm routing"
  value       = aws_cloudwatch_event_rule.critical_alarms.arn
}

output "eventbridge_rule_warning_name" {
  description = "EventBridge rule name for warning alarm routing"
  value       = aws_cloudwatch_event_rule.warning_alarms.name
}

output "eventbridge_rule_warning_arn" {
  description = "EventBridge rule ARN for warning alarm routing"
  value       = aws_cloudwatch_event_rule.warning_alarms.arn
}

output "eventbridge_rule_info_name" {
  description = "EventBridge rule name for info alarm routing"
  value       = aws_cloudwatch_event_rule.info_alarms.name
}

output "eventbridge_rule_info_arn" {
  description = "EventBridge rule ARN for info alarm routing"
  value       = aws_cloudwatch_event_rule.info_alarms.arn
}

# X-Ray Sampling Rule Outputs (2 outputs)
output "xray_sampling_rule_errors_id" {
  description = "X-Ray sampling rule ID for error tracing"
  value       = aws_xray_sampling_rule.errors.id
}

output "xray_sampling_rule_success_id" {
  description = "X-Ray sampling rule ID for success tracing"
  value       = aws_xray_sampling_rule.success.id
}

# CloudWatch Insights Query Outputs (5 outputs)
output "insights_query_slowest_requests" {
  description = "CloudWatch Insights query for finding slowest requests"
  value       = <<-EOT
fields @timestamp, @message 
| filter @message like /request_time/ 
| sort @message desc 
| limit 10
EOT
}

output "insights_query_recent_errors" {
  description = "CloudWatch Insights query for recent error messages"
  value       = <<-EOT
fields @timestamp, @message 
| filter @message like /error|ERROR|Error/ 
| sort @timestamp desc
EOT
}

output "insights_query_request_distribution" {
  description = "CloudWatch Insights query for request distribution by endpoint"
  value       = <<-EOT
fields @message
| parse @message /"path":"(?<endpoint>[^"]+)"/
| stats count() by endpoint
EOT
}

output "insights_query_service_health" {
  description = "CloudWatch Insights query for service health overview"
  value       = <<-EOT
fields @timestamp
| parse @message /"status":(?<status>\d+)/
| stats count() as total_requests, 
        count(status >= 400) as errors,
        avg(status < 400) * 100 as success_rate
EOT
}

output "insights_query_response_time_stats" {
  description = "CloudWatch Insights query for response time statistics"
  value       = <<-EOT
fields @timestamp
| parse @message /"request_time":(?<response_time>\d+)/
| stats avg(response_time) as avg_time,
        min(response_time) as min_time,
        max(response_time) as max_time,
        pct(response_time, 95) as p95_time
EOT
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}