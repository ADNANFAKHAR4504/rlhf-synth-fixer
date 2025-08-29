# CI/CD Pipeline Infrastructure - Production Ready
# This file contains all resources for the CI/CD pipeline including
# CodePipeline, CodeBuild, Elastic Beanstalk, KMS, Secrets Manager, and monitoring

# Data sources for existing resources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get default VPC for Elastic Beanstalk
data "aws_vpc" "default" {
  default = true
}

# Get default subnets in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "IaC-AWS-Nova-Model-Breaking"
}

variable "project_prefix" {
  description = "Prefix for resource naming"
  type        = string
  default     = "ci-pipeline"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "your-github-username"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "your-repo-name"
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "application_name" {
  description = "Elastic Beanstalk application name"
  type        = string
  default     = "my-web-app"
}

variable "solution_stack_name" {
  description = "Elastic Beanstalk solution stack"
  type        = string  
  default     = "64bit Amazon Linux 2023 v6.6.4 running Node.js 22"
}

variable "instance_type" {
  description = "EC2 instance type for Beanstalk"
  type        = string
  default     = "t3.small"
}

variable "notification_email" {
  description = "Email for pipeline notifications"
  type        = string
  default     = "your-team@company.com"
}

variable "enable_manual_approval" {
  description = "Enable manual approval before production deployment"
  type        = bool
  default     = true
}

# Random strings for unique resource naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_string" "resource_suffix" {
  length  = 6
  special = false
  upper   = false
}

# KMS Key for encryption - simplified policy
resource "aws_kms_key" "pipeline" {
  description             = "KMS key for ${var.project_prefix} pipeline encryption"
  deletion_window_in_days = 7

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
        Sid    = "Allow AWS Services"
        Effect = "Allow"
        Principal = {
          Service = [
            "codepipeline.amazonaws.com",
            "codebuild.amazonaws.com",
            "logs.amazonaws.com",
            "cloudtrail.amazonaws.com",
            "s3.amazonaws.com",
            "secretsmanager.amazonaws.com",
            "sns.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS Alias with unique suffix
resource "aws_kms_alias" "pipeline" {
  name          = "alias/${var.project_prefix}-pipeline-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.pipeline.key_id
}

# S3 bucket for CodePipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "${var.project_prefix}-artifacts-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
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
      kms_master_key_id = aws_kms_key.pipeline.arn
      sse_algorithm     = "aws:kms"
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

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.project_prefix}-cloudtrail-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_prefix}/app-secrets"
  description             = "Application secrets for ${var.project_name}"
  kms_key_id              = aws_kms_key.pipeline.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = "change-me-in-console"
    api_key           = "change-me-in-console"
    jwt_secret        = "change-me-in-console"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Parameter Store for non-sensitive configuration with unique paths
resource "aws_ssm_parameter" "app_config" {
  for_each = {
    database_host = "your-db-host.amazonaws.com"
    database_name = "your-app-db"
    redis_host    = "your-redis-host.amazonaws.com"
    app_port      = "3000"
  }

  name      = "/${var.project_prefix}/config/${each.key}-${random_string.resource_suffix.result}"
  type      = "String"
  value     = each.value
  overwrite = true # Allow overwriting existing parameters

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name              = "${var.project_prefix}-notifications"
  kms_master_key_id = aws_kms_key.pipeline.arn
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "codepipeline.amazonaws.com"
          ]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# CloudWatch Log Group for CodeBuild
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.project_prefix}-build"
  retention_in_days = 30
}

# IAM Role for CodePipeline with unique suffix
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_prefix}-codepipeline-role-${random_string.resource_suffix.result}"

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

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.project_prefix}-codepipeline-policy-${random_string.resource_suffix.result}"
  role = aws_iam_role.codepipeline_role.id

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
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = aws_codebuild_project.build_project.arn
      },
      {
        Effect = "Allow"
        Action = [
          "elasticbeanstalk:CreateApplicationVersion",
          "elasticbeanstalk:DescribeApplicationVersions",
          "elasticbeanstalk:DescribeApplications",
          "elasticbeanstalk:DescribeEnvironments",
          "elasticbeanstalk:UpdateEnvironment"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.pipeline.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = aws_codestarconnections_connection.github.arn
      }
    ]
  })
}

# IAM Role for CodeBuild with unique suffix
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_prefix}-codebuild-role-${random_string.resource_suffix.result}"

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

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "${var.project_prefix}-codebuild-policy-${random_string.resource_suffix.result}"
  role = aws_iam_role.codebuild_role.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_prefix}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.pipeline.arn
      }
    ]
  })
}

# IAM Role for Elastic Beanstalk Service with unique suffix
resource "aws_iam_role" "beanstalk_service_role" {
  name = "${var.project_prefix}-beanstalk-service-role-${random_string.resource_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "beanstalk_service_policy" {
  role       = aws_iam_role.beanstalk_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
}

# IAM Role for Elastic Beanstalk EC2 instances with unique suffix
resource "aws_iam_role" "beanstalk_ec2_role" {
  name = "${var.project_prefix}-beanstalk-ec2-role-${random_string.resource_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "beanstalk_web_tier" {
  role       = aws_iam_role.beanstalk_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "beanstalk_worker_tier" {
  role       = aws_iam_role.beanstalk_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_instance_profile" "beanstalk_ec2_profile" {
  name = "${var.project_prefix}-beanstalk-ec2-profile-${random_string.resource_suffix.result}"
  role = aws_iam_role.beanstalk_ec2_role.name
}

# GitHub connection
resource "aws_codestarconnections_connection" "github" {
  name          = "${var.project_prefix}-github-connection"
  provider_type = "GitHub"
}

# CodeBuild project with unique suffix
resource "aws_codebuild_project" "build_project" {
  name         = "${var.project_prefix}-build-${random_string.resource_suffix.result}"
  description  = "Build and test project for ${var.application_name}"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "PROJECT_PREFIX"
      value = var.project_prefix
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

  logs_config {
    cloudwatch_logs {
      status     = "ENABLED"
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }
  }
}

# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "app" {
  name        = var.application_name
  description = "Application for ${var.project_name}"

  appversion_lifecycle {
    service_role          = aws_iam_role.beanstalk_service_role.arn
    max_count             = 10
    delete_source_from_s3 = false
  }
}

# Elastic Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "production" {
  name                = "beanstalk-env-${var.application_name}-prod"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = var.solution_stack_name

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.beanstalk_ec2_profile.name
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.instance_type
  }


  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"
  }

  # Use default VPC to ensure internet gateway is available
  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = data.aws_vpc.default.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", data.aws_subnets.default.ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "enhanced"
  }

  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "HealthCheckSuccessThreshold"
    value     = "Ok"
  }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "DeploymentPolicy"
    value     = "Rolling"
  }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSizeType"
    value     = "Percentage"
  }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSize"
    value     = "50"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = "production"
  }


  setting {
    namespace = "aws:elasticbeanstalk:managedactions"
    name      = "ManagedActionsEnabled"
    value     = "false"
  }
}

# CodePipeline with unique suffix
resource "aws_codepipeline" "main_pipeline" {
  name     = "${var.project_prefix}-pipeline-${random_string.resource_suffix.result}"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.pipeline.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github.arn
        FullRepositoryId = "${var.github_owner}/${var.github_repo}"
        BranchName       = var.github_branch
      }
    }
  }

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
        ProjectName = aws_codebuild_project.build_project.name
      }
    }
  }

  dynamic "stage" {
    for_each = var.enable_manual_approval ? [1] : []
    content {
      name = "Approval"

      action {
        name     = "Manual_Approval"
        category = "Approval"
        owner    = "AWS"
        provider = "Manual"
        version  = "1"

        configuration = {
          NotificationArn = aws_sns_topic.pipeline_notifications.arn
          CustomData      = "Please review the build and approve deployment to production"
        }
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ElasticBeanstalk"
      input_artifacts = ["build_output"]
      version         = "1"

      configuration = {
        ApplicationName = aws_elastic_beanstalk_application.app.name
        EnvironmentName = aws_elastic_beanstalk_environment.production.name
      }
    }
  }
}

# CloudWatch Event Rules for monitoring with unique suffix
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  name        = "${var.project_prefix}-pipeline-state-change-${random_string.resource_suffix.result}"
  description = "Capture pipeline state changes"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.main_pipeline.name]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}

resource "aws_cloudwatch_event_rule" "build_state_change" {
  name        = "${var.project_prefix}-build-state-change-${random_string.resource_suffix.result}"
  description = "Capture build failures"

  event_pattern = jsonencode({
    source      = ["aws.codebuild"]
    detail-type = ["CodeBuild Build State Change"]
    detail = {
      build-status = ["FAILED", "STOPPED"]
      project-name = [aws_codebuild_project.build_project.name]
    }
  })
}

resource "aws_cloudwatch_event_target" "build_sns" {
  rule      = aws_cloudwatch_event_rule.build_state_change.name
  target_id = "SendBuildFailureToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}

# CloudTrail for audit logging with unique suffix
resource "aws_cloudtrail" "pipeline_trail" {
  name                          = "${var.project_prefix}-trail-${random_string.resource_suffix.result}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.pipeline_artifacts.arn}/*"]
    }
  }
}

# CloudWatch Dashboard with unique suffix
resource "aws_cloudwatch_dashboard" "pipeline_dashboard" {
  dashboard_name = "${var.project_prefix}-dashboard-${random_string.resource_suffix.result}"

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
            ["AWS/CodeBuild", "Builds", "ProjectName", aws_codebuild_project.build_project.name],
            [".", "FailedBuilds", ".", "."],
            [".", "SucceededBuilds", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CodeBuild Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main_pipeline.name
}

output "resource_suffix" {
  description = "Random suffix used for resource naming"
  value       = random_string.resource_suffix.result
}

output "pipeline_url" {
  description = "URL to the CodePipeline in AWS Console"
  value       = "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.main_pipeline.name}/view"
}

output "beanstalk_environment_url" {
  description = "URL of the Elastic Beanstalk environment"
  value       = "http://${aws_elastic_beanstalk_environment.production.cname}"
}

output "beanstalk_environment_name" {
  description = "Name of the Elastic Beanstalk environment"
  value       = aws_elastic_beanstalk_environment.production.name
}

output "github_connection_arn" {
  description = "ARN of the GitHub connection (needs to be activated in console)"
  value       = aws_codestarconnections_connection.github.arn
}

output "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.bucket
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.pipeline_dashboard.dashboard_name}"
}

output "kms_key_id" {
  description = "KMS key ID for pipeline encryption"
  value       = aws_kms_key.pipeline.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for pipeline encryption"
  value       = aws_kms_key.pipeline.arn
}

output "secrets_manager_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "codebuild_project_name" {
  description = "CodeBuild project name"
  value       = aws_codebuild_project.build_project.name
}

output "iam_roles" {
  description = "IAM role names with suffixes"
  value = {
    codepipeline_role      = aws_iam_role.codepipeline_role.name
    codebuild_role         = aws_iam_role.codebuild_role.name
    beanstalk_service_role = aws_iam_role.beanstalk_service_role.name
    beanstalk_ec2_role     = aws_iam_role.beanstalk_ec2_role.name
  }
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}
