terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

# Get current AWS account ID for resource scoping
data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  # Bucket naming pattern for S3 replication
  s3_bucket_pattern = "app-data-${var.environment_suffix}"
}

# S3 Replication Role
resource "aws_iam_role" "s3_replication" {
  name = "transaction-s3-replication-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "s3_replication" {
  name = "transaction-s3-replication-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReplicationSource"
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.primary_region}",
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.dr_region}"
        ]
      },
      {
        Sid    = "S3ReplicationGetObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.primary_region}/*",
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.dr_region}/*"
        ]
      },
      {
        Sid    = "S3ReplicationDestination"
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.primary_region}/*",
          "arn:aws:s3:::${local.s3_bucket_pattern}-${var.dr_region}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "transaction-lambda-execution-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_execution" {
  name = "transaction-lambda-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.primary_region}:${local.account_id}:log-group:/aws/lambda/*${var.environment_suffix}*",
          "arn:aws:logs:${var.primary_region}:${local.account_id}:log-group:/aws/lambda/*${var.environment_suffix}*:*",
          "arn:aws:logs:${var.dr_region}:${local.account_id}:log-group:/aws/lambda/*${var.environment_suffix}*",
          "arn:aws:logs:${var.dr_region}:${local.account_id}:log-group:/aws/lambda/*${var.environment_suffix}*:*"
        ]
      },
      {
        Sid    = "VPCNetworkInterface"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = [
          "arn:aws:ec2:${var.primary_region}:${local.account_id}:network-interface/*",
          "arn:aws:ec2:${var.dr_region}:${local.account_id}:network-interface/*",
          "arn:aws:ec2:${var.primary_region}:${local.account_id}:subnet/*",
          "arn:aws:ec2:${var.dr_region}:${local.account_id}:subnet/*",
          "arn:aws:ec2:${var.primary_region}:${local.account_id}:security-group/*",
          "arn:aws:ec2:${var.dr_region}:${local.account_id}:security-group/*"
        ]
      },
      {
        Sid    = "EC2DescribePermissions"
        Effect = "Allow"
        Action = [
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = [var.primary_region, var.dr_region]
          }
        }
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.primary_region}:${local.account_id}:table/session-store-${var.environment_suffix}",
          "arn:aws:dynamodb:${var.dr_region}:${local.account_id}:table/session-store-${var.environment_suffix}"
        ]
      },
      {
        Sid    = "RDSDescribe"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = [
          "arn:aws:rds:${var.primary_region}:${local.account_id}:cluster:*${var.environment_suffix}*",
          "arn:aws:rds:${var.dr_region}:${local.account_id}:cluster:*${var.environment_suffix}*",
          "arn:aws:rds:${var.primary_region}:${local.account_id}:db:*${var.environment_suffix}*",
          "arn:aws:rds:${var.dr_region}:${local.account_id}:db:*${var.environment_suffix}*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
}

# Cross-Region Access Role
resource "aws_iam_role" "cross_region_access" {
  name = "transaction-cross-region-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = [
          "lambda.amazonaws.com",
          "rds.amazonaws.com"
        ]
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "cross_region_access" {
  name = "transaction-cross-region-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RDSFailover"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:FailoverDBCluster"
        ]
        Resource = [
          "arn:aws:rds:${var.primary_region}:${local.account_id}:cluster:*${var.environment_suffix}*",
          "arn:aws:rds:${var.dr_region}:${local.account_id}:cluster:*${var.environment_suffix}*",
          "arn:aws:rds::${local.account_id}:global-cluster:transaction-db-${var.environment_suffix}"
        ]
      },
      {
        Sid    = "Route53HealthCheck"
        Effect = "Allow"
        Action = [
          "route53:GetHealthCheck",
          "route53:GetHealthCheckStatus",
          "route53:UpdateHealthCheck"
        ]
        Resource = "arn:aws:route53:::healthcheck/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cross_region_access" {
  role       = aws_iam_role.cross_region_access.name
  policy_arn = aws_iam_policy.cross_region_access.arn
}

output "s3_replication_role_arn" { value = aws_iam_role.s3_replication.arn }
output "lambda_execution_role_arn" { value = aws_iam_role.lambda_execution.arn }
output "cross_region_role_arn" { value = aws_iam_role.cross_region_access.arn }
