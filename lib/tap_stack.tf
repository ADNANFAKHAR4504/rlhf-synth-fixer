# ======================================================================================
# TERRAFORM CI/CD PIPELINE INFRASTRUCTURE
# ======================================================================================
# This file creates a complete CI/CD pipeline for deploying Terraform infrastructure
# including CodeCommit, CodePipeline, CodeBuild, S3, DynamoDB, ECR, IAM, SNS resources
# ======================================================================================

# ======================================================================================
# VARIABLES
# ======================================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.aws_region))
    error_message = "AWS region must be in the format: us-east-1, eu-west-1, etc."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "terraform-infrastructure"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "repository_name" {
  description = "Name of the CodeCommit repository"
  type        = string
  default     = "terraform-infrastructure"

  validation {
    condition     = can(regex("^[a-zA-Z0-9-_]+$", var.repository_name))
    error_message = "Repository name must contain only letters, numbers, hyphens, and underscores."
  }
}

variable "environments" {
  description = "List of environments to create pipelines for"
  type        = list(string)
  default     = ["dev", "staging", "prod"]

  validation {
    condition     = length(var.environments) > 0
    error_message = "At least one environment must be specified."
  }
}

variable "approval_email" {
  description = "Email address for production approval notifications"
  type        = string
  default     = "devops-approvals@example.com"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.approval_email))
    error_message = "Must be a valid email address."
  }
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
  default     = "devops-notifications@example.com"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address."
  }
}

variable "vpc_id" {
  description = "VPC ID for CodeBuild projects (optional for VPC isolation)"
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for CodeBuild projects (optional)"
  type        = list(string)
  default     = []
}

variable "docker_image_tag" {
  description = "Tag for the Terraform runner Docker image"
  type        = string
  default     = "latest"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple deployments"
  type        = string
  default     = ""

  validation {
    condition     = var.environment_suffix == "" || can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "application" {
  description = "Application name for tagging"
  type        = string
  default     = "terraform-cicd-pipeline"
}

variable "enable_vpc_config" {
  description = "Enable VPC configuration for CodeBuild projects"
  type        = bool
  default     = false
}

variable "codebuild_timeout" {
  description = "Timeout for CodeBuild projects in minutes"
  type        = number
  default     = 30

  validation {
    condition     = var.codebuild_timeout >= 5 && var.codebuild_timeout <= 480
    error_message = "CodeBuild timeout must be between 5 and 480 minutes."
  }
}

variable "state_retention_days" {
  description = "Number of days to retain old state file versions"
  type        = number
  default     = 90

  validation {
    condition     = var.state_retention_days >= 1
    error_message = "State retention days must be at least 1."
  }
}

variable "artifact_retention_days" {
  description = "Number of days to retain pipeline artifacts"
  type        = number
  default     = 30

  validation {
    condition     = var.artifact_retention_days >= 1
    error_message = "Artifact retention days must be at least 1."
  }
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring with detailed CloudWatch logs"
  type        = bool
  default     = true
}

variable "enable_notifications" {
  description = "Enable SNS notifications for pipeline events"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention value."
  }
}

variable "enable_codecommit" {
  description = "Enable CodeCommit repository creation (disable if account doesn't have CodeCommit enabled)"
  type        = bool
  default     = false
}

# ======================================================================================
# DATA SOURCES
# ======================================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ======================================================================================
# RANDOM RESOURCES FOR UNIQUE NAMING
# ======================================================================================

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ======================================================================================
# LOCALS
# ======================================================================================

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result
  account_id = data.aws_caller_identity.current.account_id
  partition  = data.aws_partition.current.partition

  common_tags = {
    Environment = "shared"
    Application = var.application
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }

  state_bucket_name     = "terraform-state-${local.account_id}-${var.aws_region}-${local.env_suffix}"
  artifacts_bucket_name = "terraform-pipeline-artifacts-${local.account_id}-${var.aws_region}-${local.env_suffix}"
}

# ======================================================================================
# CODECOMMIT REPOSITORY
# ======================================================================================

# Note: CodeCommit repository creation is optional
# If your AWS account doesn't have CodeCommit enabled, comment out this resource
# and use an external Git provider (GitHub, GitLab, Bitbucket)
resource "aws_codecommit_repository" "terraform_repo" {
  count = var.enable_codecommit ? 1 : 0

  repository_name = "${var.repository_name}-${local.env_suffix}"
  description     = "Terraform infrastructure code repository for automated CI/CD deployments"
  default_branch  = "main"

  tags = merge(local.common_tags, {
    Name = "${var.repository_name}-${local.env_suffix}"
  })
}

# ======================================================================================
# S3 BUCKETS
# ======================================================================================

# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = local.state_bucket_name

  tags = merge(local.common_tags, {
    Name    = local.state_bucket_name
    Purpose = "Terraform State Storage"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.state_retention_days
    }
  }
}

# S3 bucket for CodePipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = local.artifacts_bucket_name

  tags = merge(local.common_tags, {
    Name    = local.artifacts_bucket_name
    Purpose = "Pipeline Artifacts Storage"
  })
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

resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    id     = "delete-old-artifacts"
    status = "Enabled"

    expiration {
      days = var.artifact_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# ======================================================================================
# DYNAMODB TABLE FOR STATE LOCKING
# ======================================================================================

resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${local.env_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name    = "terraform-state-lock-${local.env_suffix}"
    Purpose = "Terraform State Locking"
  })
}

# ======================================================================================
# ECR REPOSITORY FOR DOCKER IMAGES
# ======================================================================================

resource "aws_ecr_repository" "terraform_runner" {
  name                 = "terraform-runner-${local.env_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "terraform-runner-${local.env_suffix}"
    Purpose = "Terraform Runner Docker Image"
  })
}

resource "aws_ecr_lifecycle_policy" "terraform_runner" {
  repository = aws_ecr_repository.terraform_runner.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ======================================================================================
# CLOUDWATCH LOG GROUPS
# ======================================================================================

resource "aws_cloudwatch_log_group" "codebuild_plan" {
  for_each = toset(var.environments)

  name              = "/aws/codebuild/terraform-plan-${each.key}-${local.env_suffix}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name        = "/aws/codebuild/terraform-plan-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

resource "aws_cloudwatch_log_group" "codebuild_apply" {
  for_each = toset(var.environments)

  name              = "/aws/codebuild/terraform-apply-${each.key}-${local.env_suffix}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name        = "/aws/codebuild/terraform-apply-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

# ======================================================================================
# IAM ROLES
# ======================================================================================

# CodePipeline service role
resource "aws_iam_role" "codepipeline_role" {
  name = "terraform-codepipeline-role-${local.env_suffix}"

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

  tags = merge(local.common_tags, {
    Name = "terraform-codepipeline-role-${local.env_suffix}"
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "terraform-codepipeline-policy-${local.env_suffix}"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus",
          "codecommit:CancelUploadArchive"
        ]
        Resource = var.enable_codecommit ? aws_codecommit_repository.terraform_repo[0].arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = concat(
          [for env in var.environments : aws_codebuild_project.terraform_plan[env].arn],
          [for env in var.environments : aws_codebuild_project.terraform_apply[env].arn]
        )
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.pipeline_notifications.arn,
          aws_sns_topic.approval.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:*"
      }
    ]
  })
}

# CodeBuild service roles - plan
resource "aws_iam_role" "codebuild_plan_role" {
  for_each = toset(var.environments)

  name = "terraform-codebuild-plan-role-${each.key}-${local.env_suffix}"

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

  tags = merge(local.common_tags, {
    Name        = "terraform-codebuild-plan-role-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

resource "aws_iam_role_policy" "codebuild_plan_policy" {
  for_each = toset(var.environments)

  name = "terraform-codebuild-plan-policy-${each.key}-${local.env_suffix}"
  role = aws_iam_role.codebuild_plan_role[each.key].id

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
        Resource = [
          aws_cloudwatch_log_group.codebuild_plan[each.key].arn,
          "${aws_cloudwatch_log_group.codebuild_plan[each.key].arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.pipeline_artifacts.arn}/*",
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          aws_s3_bucket.pipeline_artifacts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.terraform_state_lock.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "elasticloadbalancing:Describe*",
          "autoscaling:Describe*",
          "cloudwatch:List*",
          "cloudwatch:Get*",
          "cloudwatch:Describe*",
          "rds:Describe*",
          "iam:Get*",
          "iam:List*",
          "lambda:Get*",
          "lambda:List*",
          "s3:List*",
          "s3:Get*",
          "sns:List*",
          "sns:Get*",
          "sqs:List*",
          "sqs:Get*",
          "route53:List*",
          "route53:Get*",
          "cloudfront:List*",
          "cloudfront:Get*",
          "codecommit:Get*",
          "codecommit:List*",
          "codebuild:List*",
          "codebuild:BatchGet*",
          "codepipeline:List*",
          "codepipeline:Get*"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC permissions if using VPC
resource "aws_iam_role_policy" "codebuild_plan_vpc_policy" {
  for_each = var.enable_vpc_config ? toset(var.environments) : toset([])

  name = "terraform-codebuild-plan-vpc-policy-${each.key}-${local.env_suffix}"
  role = aws_iam_role.codebuild_plan_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeDhcpOptions",
          "ec2:DescribeVpcs",
          "ec2:CreateNetworkInterfacePermission"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodeBuild service roles - apply
resource "aws_iam_role" "codebuild_apply_role" {
  for_each = toset(var.environments)

  name = "terraform-codebuild-apply-role-${each.key}-${local.env_suffix}"

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

  tags = merge(local.common_tags, {
    Name        = "terraform-codebuild-apply-role-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

resource "aws_iam_role_policy" "codebuild_apply_policy" {
  for_each = toset(var.environments)

  name = "terraform-codebuild-apply-policy-${each.key}-${local.env_suffix}"
  role = aws_iam_role.codebuild_apply_role[each.key].id

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
        Resource = [
          aws_cloudwatch_log_group.codebuild_apply[each.key].arn,
          "${aws_cloudwatch_log_group.codebuild_apply[each.key].arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.pipeline_artifacts.arn}/*",
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          aws_s3_bucket.pipeline_artifacts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.terraform_state_lock.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" : var.aws_region
          }
        }
      }
    ]
  })
}

# CloudWatch Events role
resource "aws_iam_role" "cloudwatch_events_role" {
  name = "terraform-cloudwatch-events-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "terraform-cloudwatch-events-role-${local.env_suffix}"
  })
}

resource "aws_iam_role_policy" "cloudwatch_events_policy" {
  name = "terraform-cloudwatch-events-policy-${local.env_suffix}"
  role = aws_iam_role.cloudwatch_events_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codepipeline:StartPipelineExecution"
        ]
        Resource = [for env in var.environments : aws_codepipeline.terraform_pipeline[env].arn]
      }
    ]
  })
}

# ======================================================================================
# SECURITY GROUP (Optional for VPC)
# ======================================================================================

resource "aws_security_group" "codebuild" {
  count = var.enable_vpc_config ? 1 : 0

  name        = "codebuild-terraform-sg-${local.env_suffix}"
  description = "Security group for CodeBuild Terraform projects"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "codebuild-terraform-sg-${local.env_suffix}"
  })
}

# ======================================================================================
# CODEBUILD PROJECTS
# ======================================================================================

# CodeBuild projects for Terraform plan
resource "aws_codebuild_project" "terraform_plan" {
  for_each = toset(var.environments)

  name          = "terraform-plan-${each.key}-${local.env_suffix}"
  description   = "Terraform plan for ${each.key} environment"
  service_role  = aws_iam_role.codebuild_plan_role[each.key].arn
  build_timeout = var.codebuild_timeout

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.terraform_runner.repository_url}:${var.docker_image_tag}"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
    privileged_mode             = false

    environment_variable {
      name  = "ENVIRONMENT"
      value = each.key
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "TF_STATE_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_state_lock.id
    }

    environment_variable {
      name  = "TF_IN_AUTOMATION"
      value = "true"
    }
  }

  dynamic "vpc_config" {
    for_each = var.enable_vpc_config ? [1] : []
    content {
      vpc_id             = var.vpc_id
      subnets            = var.private_subnet_ids
      security_group_ids = [aws_security_group.codebuild[0].id]
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspecs/buildspec-plan.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_plan[each.key].name
      stream_name = "build-logs"
    }
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-plan-${each.key}-${local.env_suffix}"
    Environment = each.key
  })

  depends_on = [aws_cloudwatch_log_group.codebuild_plan]
}

# CodeBuild projects for Terraform apply
resource "aws_codebuild_project" "terraform_apply" {
  for_each = toset(var.environments)

  name          = "terraform-apply-${each.key}-${local.env_suffix}"
  description   = "Terraform apply for ${each.key} environment"
  service_role  = aws_iam_role.codebuild_apply_role[each.key].arn
  build_timeout = var.codebuild_timeout

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = each.key == "prod" ? "BUILD_GENERAL1_MEDIUM" : "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.terraform_runner.repository_url}:${var.docker_image_tag}"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
    privileged_mode             = false

    environment_variable {
      name  = "ENVIRONMENT"
      value = each.key
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "TF_STATE_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_state_lock.id
    }

    environment_variable {
      name  = "TF_IN_AUTOMATION"
      value = "true"
    }
  }

  dynamic "vpc_config" {
    for_each = var.enable_vpc_config ? [1] : []
    content {
      vpc_id             = var.vpc_id
      subnets            = var.private_subnet_ids
      security_group_ids = [aws_security_group.codebuild[0].id]
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspecs/buildspec-apply.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_apply[each.key].name
      stream_name = "build-logs"
    }
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-apply-${each.key}-${local.env_suffix}"
    Environment = each.key
  })

  depends_on = [aws_cloudwatch_log_group.codebuild_apply]
}

# ======================================================================================
# SNS TOPICS
# ======================================================================================

# SNS topic for pipeline notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name              = "terraform-pipeline-notifications-${local.env_suffix}"
  display_name      = "Terraform Pipeline Notifications"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name = "terraform-pipeline-notifications-${local.env_suffix}"
  })
}

resource "aws_sns_topic_subscription" "pipeline_notifications_email" {
  count = var.enable_notifications ? 1 : 0

  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS topic for production approval
resource "aws_sns_topic" "approval" {
  name              = "terraform-approval-notifications-${local.env_suffix}"
  display_name      = "Terraform Approval Notifications"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name        = "terraform-approval-notifications-${local.env_suffix}"
    Environment = "prod"
  })
}

resource "aws_sns_topic_subscription" "approval_email" {
  count = var.enable_notifications ? 1 : 0

  topic_arn = aws_sns_topic.approval.arn
  protocol  = "email"
  endpoint  = var.approval_email
}

# SNS topic policy for CloudWatch Events
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchEventsPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Sid    = "AllowCodePipelinePublish"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# ======================================================================================
# CODEPIPELINE
# ======================================================================================

resource "aws_codepipeline" "terraform_pipeline" {
  for_each = toset(var.environments)

  name     = "terraform-pipeline-${each.key}-${local.env_suffix}"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    type     = "S3"
    location = aws_s3_bucket.pipeline_artifacts.bucket
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["SourceOutput"]

      configuration = {
        RepositoryName       = var.enable_codecommit ? aws_codecommit_repository.terraform_repo[0].repository_name : var.repository_name
        BranchName           = each.key == "prod" ? "main" : each.key
        PollForSourceChanges = false
      }
    }
  }

  stage {
    name = "Plan"

    action {
      name             = "TerraformPlan"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["SourceOutput"]
      output_artifacts = ["PlanOutput"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_plan[each.key].name
      }
    }
  }

  dynamic "stage" {
    for_each = each.key == "prod" ? [1] : []

    content {
      name = "Approval"

      action {
        name     = "ManualApproval"
        category = "Approval"
        owner    = "AWS"
        provider = "Manual"
        version  = "1"

        configuration = {
          NotificationArn = aws_sns_topic.approval.arn
          CustomData      = "Please review the Terraform plan output in the CodeBuild logs before approving this production deployment."
        }
      }
    }
  }

  stage {
    name = "Apply"

    action {
      name             = "TerraformApply"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["PlanOutput"]
      output_artifacts = ["ApplyOutput"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_apply[each.key].name
      }
    }
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-pipeline-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

# ======================================================================================
# CLOUDWATCH EVENTS
# ======================================================================================

# CloudWatch Event to trigger pipeline on code changes
resource "aws_cloudwatch_event_rule" "codecommit_trigger" {
  for_each = var.enable_codecommit ? toset(var.environments) : []

  name        = "terraform-pipeline-trigger-${each.key}-${local.env_suffix}"
  description = "Trigger Terraform pipeline on CodeCommit changes for ${each.key} environment"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    resources   = [aws_codecommit_repository.terraform_repo[0].arn]
    detail = {
      event         = ["referenceCreated", "referenceUpdated"]
      referenceType = ["branch"]
      referenceName = [each.key == "prod" ? "main" : each.key]
    }
  })

  tags = merge(local.common_tags, {
    Name        = "terraform-pipeline-trigger-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

resource "aws_cloudwatch_event_target" "pipeline_trigger" {
  for_each = var.enable_codecommit ? toset(var.environments) : []

  rule      = aws_cloudwatch_event_rule.codecommit_trigger[each.key].name
  target_id = "TriggerPipeline"
  arn       = aws_codepipeline.terraform_pipeline[each.key].arn
  role_arn  = aws_iam_role.cloudwatch_events_role.arn
}

# Pipeline state change notifications
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  for_each = var.enable_notifications ? toset(var.environments) : toset([])

  name        = "terraform-pipeline-state-${each.key}-${local.env_suffix}"
  description = "Capture pipeline state changes for ${each.key} environment"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.terraform_pipeline[each.key].name]
      state    = ["STARTED", "SUCCEEDED", "FAILED"]
    }
  })

  tags = merge(local.common_tags, {
    Name        = "terraform-pipeline-state-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

resource "aws_cloudwatch_event_target" "sns_notification" {
  for_each = var.enable_notifications ? toset(var.environments) : toset([])

  rule      = aws_cloudwatch_event_rule.pipeline_state_change[each.key].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  input_transformer {
    input_paths = {
      pipeline     = "$.detail.pipeline"
      state        = "$.detail.state"
      execution_id = "$.detail.execution-id"
      region       = "$.region"
    }
    input_template = "\"Pipeline <pipeline> in region <region> is now <state>. Execution ID: <execution_id>\""
  }
}

# ======================================================================================
# CLOUDWATCH ALARMS (Optional Enhanced Monitoring)
# ======================================================================================

resource "aws_cloudwatch_metric_alarm" "pipeline_failures" {
  for_each = var.enable_enhanced_monitoring ? toset(var.environments) : toset([])

  alarm_name          = "terraform-pipeline-failures-${each.key}-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PipelineExecutionFailure"
  namespace           = "AWS/CodePipeline"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when Terraform pipeline ${each.key} fails"
  treat_missing_data  = "notBreaching"

  dimensions = {
    PipelineName = aws_codepipeline.terraform_pipeline[each.key].name
  }

  alarm_actions = [aws_sns_topic.pipeline_notifications.arn]

  tags = merge(local.common_tags, {
    Name        = "terraform-pipeline-failures-${each.key}-${local.env_suffix}"
    Environment = each.key
  })
}

# ======================================================================================
# OUTPUTS
# ======================================================================================

output "repository_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = var.enable_codecommit ? aws_codecommit_repository.terraform_repo[0].clone_url_http : null
}

output "repository_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = var.enable_codecommit ? aws_codecommit_repository.terraform_repo[0].clone_url_ssh : null
}

output "repository_arn" {
  description = "ARN of the CodeCommit repository"
  value       = var.enable_codecommit ? aws_codecommit_repository.terraform_repo[0].arn : null
}

output "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "artifacts_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "state_lock_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for Docker images"
  value       = aws_ecr_repository.terraform_runner.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.terraform_runner.arn
}

output "pipeline_names" {
  description = "Names of the created pipelines"
  value       = { for env in var.environments : env => aws_codepipeline.terraform_pipeline[env].name }
}

output "pipeline_arns" {
  description = "ARNs of the created pipelines"
  value       = { for env in var.environments : env => aws_codepipeline.terraform_pipeline[env].arn }
}

output "pipeline_urls" {
  description = "Console URLs for the pipelines"
  value = {
    for env in var.environments :
    env => "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.terraform_pipeline[env].name}/view?region=${var.aws_region}"
  }
}

output "codebuild_plan_project_names" {
  description = "Names of the CodeBuild plan projects"
  value       = { for env in var.environments : env => aws_codebuild_project.terraform_plan[env].name }
}

output "codebuild_apply_project_names" {
  description = "Names of the CodeBuild apply projects"
  value       = { for env in var.environments : env => aws_codebuild_project.terraform_apply[env].name }
}

output "notification_topic_arn" {
  description = "ARN of the SNS topic for pipeline notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "approval_topic_arn" {
  description = "ARN of the SNS topic for approval notifications"
  value       = aws_sns_topic.approval.arn
}

output "env_suffix" {
  description = "The environment suffix used for resource naming"
  value       = local.env_suffix
}
