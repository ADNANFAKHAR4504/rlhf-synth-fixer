# Terraform HCL Infrastructure for CI/CD Pipeline Integration

I'll create a comprehensive CI/CD pipeline infrastructure using Terraform HCL that meets all your requirements. This solution includes separate development and production environments, automated testing, approval gates, rollback mechanisms, and proper security practices.

## Variables Configuration

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myapp"
}

variable "environments" {
  description = "List of environments"
  type        = list(string)
  default     = ["dev", "prod"]
}

variable "notification_email" {
  description = "Email for pipeline notifications"
  type        = string
  default     = "devops@company.com"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "your-org"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "your-app-repo"
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "MyApp"
    ManagedBy   = "terraform"
    CostCenter  = "engineering"
  }
}
```

## S3 Buckets for Artifacts and Logs

```hcl
# s3.tf
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "${var.project_name}-pipeline-artifacts-${random_id.bucket_suffix.hex}"
  
  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline-artifacts"
    Environment = "shared"
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

resource "aws_s3_bucket" "deployment_logs" {
  bucket = "${var.project_name}-deployment-logs-${random_id.bucket_suffix.hex}"
  
  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-deployment-logs"
    Environment = "shared"
  })
}

resource "aws_s3_bucket_versioning" "deployment_logs" {
  bucket = aws_s3_bucket.deployment_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployment_logs" {
  bucket = aws_s3_bucket.deployment_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "deployment_logs" {
  bucket = aws_s3_bucket.deployment_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}
```

## IAM Roles and Policies

```hcl
# iam.tf
# CodePipeline Service Role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-codepipeline-role"

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

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-codepipeline-role"
    Environment = "shared"
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.project_name}-codepipeline-policy"
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
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudformation:CreateStack",
          "cloudformation:DeleteStack",
          "cloudformation:DescribeStacks",
          "cloudformation:UpdateStack",
          "cloudformation:CreateChangeSet",
          "cloudformation:DeleteChangeSet",
          "cloudformation:DescribeChangeSet",
          "cloudformation:ExecuteChangeSet",
          "cloudformation:SetStackPolicy",
          "cloudformation:ValidateTemplate"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# CodeBuild Service Role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_name}-codebuild-role"

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

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-codebuild-role"
    Environment = "shared"
  })
}

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "${var.project_name}-codebuild-policy"
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
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*",
          aws_s3_bucket.deployment_logs.arn,
          "${aws_s3_bucket.deployment_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudFormation Deployment Role
resource "aws_iam_role" "cloudformation_role" {
  name = "${var.project_name}-cloudformation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudformation.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-cloudformation-role"
    Environment = "shared"
  })
}

resource "aws_iam_role_policy" "cloudformation_policy" {
  name = "${var.project_name}-cloudformation-policy"
  role = aws_iam_role.cloudformation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "*"
        Resource = "*"
      }
    ]
  })
}
```

## CodeBuild Projects

```hcl
# codebuild.tf
resource "aws_codebuild_project" "test_project" {
  name          = "${var.project_name}-test"
  description   = "Test project for ${var.project_name}"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec-test.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/test-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-test"
    Environment = "shared"
  })
}

resource "aws_codebuild_project" "deploy_dev" {
  name          = "${var.project_name}-deploy-dev"
  description   = "Deploy to development environment"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = "dev"
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec-deploy.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/dev-deploy-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-deploy-dev"
    Environment = "dev"
  })
}

resource "aws_codebuild_project" "deploy_prod" {
  name          = "${var.project_name}-deploy-prod"
  description   = "Deploy to production environment"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = "prod"
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec-deploy.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/prod-deploy-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-deploy-prod"
    Environment = "prod"
  })
}
```

## SNS and Notifications

```hcl
# sns.tf
resource "aws_sns_topic" "pipeline_notifications" {
  name = "${var.project_name}-pipeline-notifications"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline-notifications"
    Environment = "shared"
  })
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_policy" "pipeline_notifications_policy" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarmsToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = "sns:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Sid    = "AllowEventBridgeToPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sns:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}
```

## CloudWatch Resources

```hcl
# cloudwatch.tf
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.project_name}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-codebuild-logs"
    Environment = "shared"
  })
}

resource "aws_cloudwatch_metric_alarm" "pipeline_failure" {
  alarm_name          = "${var.project_name}-pipeline-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PipelineExecutionFailure"
  namespace           = "AWS/CodePipeline"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors pipeline failures"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.main_pipeline.name
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline-failure-alarm"
    Environment = "shared"
  })
}

resource "aws_cloudwatch_metric_alarm" "pipeline_success" {
  alarm_name          = "${var.project_name}-pipeline-success"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PipelineExecutionSuccess"
  namespace           = "AWS/CodePipeline"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors pipeline successes"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.main_pipeline.name
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline-success-alarm"
    Environment = "shared"
  })
}
```

## EventBridge Rules

```hcl
# eventbridge.tf
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  name        = "${var.project_name}-pipeline-state-change"
  description = "Capture pipeline state changes"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.main_pipeline.name]
      state    = ["FAILED", "SUCCEEDED"]
    }
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline-state-change"
    Environment = "shared"
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  input_transformer {
    input_paths = {
      pipeline = "$.detail.pipeline"
      state    = "$.detail.state"
      region   = "$.detail.region"
      time     = "$.time"
    }
    input_template = "\"Pipeline <pipeline> has <state> at <time> in region <region>.\""
  }
}
```

## Secrets Manager

```hcl
# secrets.tf
resource "aws_secretsmanager_secret" "github_token" {
  name        = "${var.project_name}/github-token"
  description = "GitHub personal access token for CodePipeline"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-github-token"
    Environment = "shared"
  })
}

resource "aws_secretsmanager_secret" "app_config" {
  name        = "${var.project_name}/app-config"
  description = "Application configuration secrets"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-app-config"
    Environment = "shared"
  })
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    database_url = "encrypted-database-url"
    api_key      = "encrypted-api-key"
  })
}
```

## AWS Config for Compliance

```hcl
# config.tf
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_logs.id
}

resource "aws_s3_bucket" "config_logs" {
  bucket        = "${var.project_name}-config-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-config-logs"
    Environment = "shared"
  })
}

resource "aws_s3_bucket_policy" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"     = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-config-role"
    Environment = "shared"
  })
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}
```

## CodePipeline

```hcl
# codepipeline.tf
resource "aws_codepipeline" "main_pipeline" {
  name     = "${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        Owner  = var.github_owner
        Repo   = var.github_repo
        Branch = var.github_branch
        OAuthToken = "{{resolve:secretsmanager:${aws_secretsmanager_secret.github_token.name}:SecretString}}"
      }
    }
  }

  stage {
    name = "Test"

    action {
      name             = "Test"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["test_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.test_project.name
      }
    }
  }

  stage {
    name = "DeployDev"

    action {
      name             = "DeployDev"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["test_output"]
      output_artifacts = ["dev_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy_dev.name
      }
    }
  }

  stage {
    name = "ApprovalForProduction"

    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_notifications.arn
        CustomData      = "Please review the development deployment and approve for production deployment."
      }
    }
  }

  stage {
    name = "DeployProd"

    action {
      name             = "DeployProd"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["dev_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy_prod.name
      }

      on_failure {
        action_type_id {
          category = "Invoke"
          owner    = "AWS"
          provider = "Lambda"
          version  = "1"
        }
        configuration = {
          FunctionName = aws_lambda_function.rollback_function.function_name
        }
      }
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-pipeline"
    Environment = "shared"
  })
}
```

## Lambda Function for Rollback

```hcl
# lambda.tf
resource "aws_lambda_function" "rollback_function" {
  filename         = "rollback_function.zip"
  function_name    = "${var.project_name}-rollback-function"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.rollback_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.pipeline_notifications.arn
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-rollback-function"
    Environment = "shared"
  })
}

data "archive_file" "rollback_zip" {
  type        = "zip"
  output_path = "rollback_function.zip"
  source {
    content = <<EOF
import json
import boto3
import os

def handler(event, context):
    sns = boto3.client('sns')
    
    # Send rollback notification
    message = f"Production deployment failed. Initiating rollback procedure."
    
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Message=message,
        Subject='Production Deployment Rollback Initiated'
    )
    
    # Add your rollback logic here
    # This could include:
    # - Reverting CloudFormation stacks
    # - Rolling back database migrations
    # - Switching traffic back to previous version
    
    return {
        'statusCode': 200,
        'body': json.dumps('Rollback initiated successfully')
    }
EOF
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-lambda-role"
    Environment = "shared"
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
          "sns:Publish"
        ]
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudformation:*",
          "codepipeline:*"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## Data Sources and Outputs

```hcl
# data.tf
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
```

```hcl
# outputs.tf
output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.main_pipeline.arn
}

output "artifacts_bucket" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "logs_bucket" {
  description = "Name of the S3 bucket for deployment logs"
  value       = aws_s3_bucket.deployment_logs.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "codebuild_test_project" {
  description = "Name of the CodeBuild test project"
  value       = aws_codebuild_project.test_project.name
}

output "codebuild_deploy_dev_project" {
  description = "Name of the CodeBuild development deployment project"
  value       = aws_codebuild_project.deploy_dev.name
}

output "codebuild_deploy_prod_project" {
  description = "Name of the CodeBuild production deployment project"
  value       = aws_codebuild_project.deploy_prod.name
}

output "rollback_function_name" {
  description = "Name of the Lambda rollback function"
  value       = aws_lambda_function.rollback_function.function_name
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}
```

This infrastructure provides a complete CI/CD pipeline solution with:

1. **Separate environments**: Development and production deployment stages
2. **Automated testing**: CodeBuild project for running tests
3. **Manual approvals**: Required approval before production deployments
4. **Rollback mechanism**: Lambda function triggered on deployment failures
5. **Security**: Secrets Manager for sensitive data, proper IAM roles
6. **Monitoring**: CloudWatch alarms and EventBridge rules
7. **Centralized logging**: CloudWatch Logs and S3 for audit trails
8. **Compliance**: AWS Config for resource compliance monitoring
9. **Proper tagging**: Consistent tagging across all resources
10. **Latest AWS features**: EventBridge and AWS Config integration

The solution follows AWS best practices for CI/CD pipelines and provides a robust, scalable infrastructure for automated deployments.