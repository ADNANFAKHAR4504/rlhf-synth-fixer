# Note: Provider configuration is in provider.tf

########################
# Variables
########################

# Environment and project configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-app"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = contains(["us-east-1", "us-west-2"], var.aws_region)
    error_message = "AWS region must be either us-east-1 or us-west-2."
  }
}

# Source S3 configuration (now managed by infrastructure)
variable "source_s3_key" {
  description = "S3 object key for source code (e.g., source.zip)"
  type        = string
  default     = "source.zip"
}

# Lambda function configuration
variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "api-handler"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.9"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

# Environment suffix for resource naming to avoid conflicts
variable "environment_suffix" {
  description = "Environment suffix to avoid conflicts between deployments (e.g., pr123 for PR #123, or leave empty for random suffix)"
  type        = string
  default     = ""
  validation {
    condition     = can(regex("^$|^pr[0-9]+$", var.environment_suffix))
    error_message = "Environment suffix must be empty or follow pattern 'pr{number}' (e.g., pr123)."
  }
}

########################
# Locals for Dynamic Naming
########################

locals {
  # Use provided environment_suffix or generate a unique one with 'u' prefix
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "u${random_string.unique_suffix.result}"
}

########################
# Data Sources
########################

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

########################
# S3 Bucket for CodePipeline Artifacts
########################

resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "${var.environment}-${var.project_name}${local.environment_suffix}-pipeline-artifacts-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_string" "unique_suffix" {
  length  = 6
  special = false
  upper   = false
}

########################
# S3 Bucket for Source Code
########################

resource "aws_s3_bucket" "source_code" {
  bucket = "${var.environment}-${var.project_name}${local.environment_suffix}-source-code-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_versioning" "source_code" {
  bucket = aws_s3_bucket.source_code.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "source_code" {
  bucket = aws_s3_bucket.source_code.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "source_code" {
  bucket = aws_s3_bucket.source_code.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create source code archive for upload
data "archive_file" "source_code" {
  type        = "zip"
  source_dir  = "${path.module}/sample-app"
  output_path = "${path.module}/source.zip"
}

# Upload source code to S3
resource "aws_s3_object" "source_code" {
  bucket = aws_s3_bucket.source_code.id
  key    = "source.zip"
  source = data.archive_file.source_code.output_path
  etag   = data.archive_file.source_code.output_md5
}

########################
# Lambda Function
########################

# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-${var.project_name}${local.environment_suffix}-${var.lambda_function_name}-role"

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

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Lambda function
resource "aws_lambda_function" "main" {
  function_name = "${var.environment}-${var.project_name}${local.environment_suffix}-${var.lambda_function_name}"
  role          = aws_iam_role.lambda_role.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  # Initial dummy code - will be replaced by pipeline
  filename         = "${path.module}/dummy.zip"
  source_code_hash = data.archive_file.dummy.output_base64sha256

  # Enable versioning for rollback capability
  publish = true

  # Tags for resource management
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Purpose     = "ci-cd-pipeline"
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }
}

# Create dummy zip file for initial deployment
data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/dummy.zip"
  source {
    content  = "def handler(event, context): return {'statusCode': 200, 'body': 'Hello World'}"
    filename = "index.py"
  }
}

# Lambda alias for blue/green deployments
resource "aws_lambda_alias" "main" {
  name             = "live${local.environment_suffix}"
  description      = "Live alias for ${aws_lambda_function.main.function_name}"
  function_name    = aws_lambda_function.main.function_name
  function_version = aws_lambda_function.main.version
}

########################
# CodeBuild Projects
########################

# CodeBuild service role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.environment}-${var.project_name}${local.environment_suffix}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

# CodeBuild policy for basic operations
resource "aws_iam_role_policy" "codebuild_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${aws_s3_bucket.pipeline_artifacts.bucket}",
          "arn:aws:s3:::${aws_s3_bucket.pipeline_artifacts.bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "arn:aws:s3:::${aws_s3_bucket.source_code.bucket}/${var.source_s3_key}"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:PublishVersion",
          "lambda:UpdateAlias",
          "lambda:GetAlias"
        ]
        Resource = "arn:aws:lambda:*:*:function:${aws_lambda_function.main.function_name}*"
      }
    ]
  })
}

# Build project for packaging Lambda code
resource "aws_codebuild_project" "build" {
  name         = "${var.environment}-${var.project_name}${local.environment_suffix}-build"
  description  = "Build project for packaging Lambda code"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-build.yml"
  }
}

# Test project for running automated tests
resource "aws_codebuild_project" "test" {
  name         = "${var.environment}-${var.project_name}${local.environment_suffix}-test"
  description  = "Test project for running automated tests"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-test.yml"
  }
}

# Deploy project for Lambda deployment with rollback
resource "aws_codebuild_project" "deploy" {
  name         = "${var.environment}-${var.project_name}${local.environment_suffix}-deploy"
  description  = "Deploy project for Lambda deployment with rollback"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
    type         = "LINUX_CONTAINER"

    environment_variable {
      name  = "LAMBDA_FUNCTION_NAME"
      value = aws_lambda_function.main.function_name
    }

    environment_variable {
      name  = "LAMBDA_ALIAS_NAME"
      value = aws_lambda_alias.main.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec/buildspec-deploy.yml"
  }
}

########################
# CodePipeline
########################

# CodePipeline service role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.environment}-${var.project_name}${local.environment_suffix}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

# CodePipeline policy
resource "aws_iam_role_policy" "codepipeline_policy" {
  role = aws_iam_role.codepipeline_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${aws_s3_bucket.pipeline_artifacts.bucket}",
          "arn:aws:s3:::${aws_s3_bucket.pipeline_artifacts.bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = [
          "arn:aws:codebuild:*:*:project/${aws_codebuild_project.build.name}",
          "arn:aws:codebuild:*:*:project/${aws_codebuild_project.test.name}",
          "arn:aws:codebuild:*:*:project/${aws_codebuild_project.deploy.name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "arn:aws:s3:::${aws_s3_bucket.source_code.bucket}/${var.source_s3_key}"
      }
    ]
  })
}

# CodePipeline
resource "aws_codepipeline" "main" {
  name     = "${var.environment}-${var.project_name}${local.environment_suffix}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  # Source stage
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "S3"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        S3Bucket    = aws_s3_bucket.source_code.bucket
        S3ObjectKey = var.source_s3_key
      }
    }
  }

  # Build stage
  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.build.name
      }
    }
  }

  # Test stage
  stage {
    name = "Test"

    action {
      name             = "Test"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["build_output"]
      output_artifacts = ["test_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.test.name
      }
    }
  }

  # Deploy stage
  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      input_artifacts = ["test_output"]
      version         = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy.name
      }
    }
  }
}

########################
# Outputs
########################

# Pipeline outputs
output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.main.arn
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main.name
}

# Build project outputs
output "build_project_arn" {
  description = "ARN of the CodeBuild build project"
  value       = aws_codebuild_project.build.arn
}

output "test_project_arn" {
  description = "ARN of the CodeBuild test project"
  value       = aws_codebuild_project.test.arn
}

output "deploy_project_arn" {
  description = "ARN of the CodeBuild deploy project"
  value       = aws_codebuild_project.deploy.arn
}

# Lambda function outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_alias_arn" {
  description = "ARN of the Lambda alias"
  value       = aws_lambda_alias.main.arn
}

# Deployment status and configuration
output "deployment_status" {
  description = "Deployment configuration status"
  value = {
    environment = var.environment
    region      = var.aws_region
    pipeline    = aws_codepipeline.main.name
    lambda      = aws_lambda_function.main.function_name
  }
}

# S3 artifacts bucket
output "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.bucket
}

# Source configuration outputs
output "source_s3_configuration" {
  description = "Source S3 bucket configuration"
  value = {
    bucket = aws_s3_bucket.source_code.bucket
    key    = var.source_s3_key
  }
}

output "source_s3_bucket_name" {
  description = "Name of the source S3 bucket"
  value       = aws_s3_bucket.source_code.bucket
}
