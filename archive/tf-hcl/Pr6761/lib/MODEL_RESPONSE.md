# Terraform AWS CodePipeline Infrastructure Implementation

This implementation creates a complete CI/CD pipeline using AWS CodePipeline with GitHub integration via CodeStar Connections. The pipeline automates Terraform infrastructure deployments with validation, planning, and apply stages.

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment     = var.environment_suffix
      ManagedBy       = "Terraform"
      Project         = "CodePipeline-Infrastructure"
      DeploymentDate  = timestamp()
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to enable multiple deployments"
  type        = string

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "environment_suffix must be between 1 and 20 characters"
  }
}

variable "github_repository_owner" {
  description = "GitHub repository owner (organization or user)"
  type        = string
  default     = "owner"
}

variable "github_repository_name" {
  description = "GitHub repository name"
  type        = string
  default     = "infrastructure-repo"
}

variable "github_branch" {
  description = "GitHub branch to monitor"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_pipeline_alarms" {
  description = "Enable CloudWatch alarms for pipeline failures"
  type        = bool
  default     = false
}

variable "codebuild_compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "codebuild_image" {
  description = "CodeBuild container image"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}
```

## File: lib/main.tf

```hcl
# CodeStar Connection for GitHub
resource "aws_codestarconnections_connection" "github" {
  name          = "github-connection-${var.environment_suffix}"
  provider_type = "GitHub"

  tags = {
    Name = "github-connection-${var.environment_suffix}"
  }
}

# CodePipeline
resource "aws_codepipeline" "terraform_pipeline" {
  name     = "terraform-pipeline-${var.environment_suffix}"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  # Stage 1: Source from GitHub
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
        FullRepositoryId = "${var.github_repository_owner}/${var.github_repository_name}"
        BranchName       = var.github_branch
        OutputArtifactFormat = "CODE_ZIP"
      }
    }
  }

  # Stage 2: Validate Terraform
  stage {
    name = "Validate"

    action {
      name             = "Validate"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["validate_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_validate.name
      }
    }
  }

  # Stage 3: Plan Terraform
  stage {
    name = "Plan"

    action {
      name             = "Plan"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["plan_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_plan.name
      }
    }
  }

  # Stage 4: Manual Approval
  stage {
    name = "Approval"

    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_notifications.arn
        CustomData      = "Please review the Terraform plan and approve to apply changes."
      }
    }
  }

  # Stage 5: Apply Terraform
  stage {
    name = "Apply"

    action {
      name             = "Apply"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["apply_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_apply.name
      }
    }
  }

  tags = {
    Name = "terraform-pipeline-${var.environment_suffix}"
  }
}

# CodeBuild Project for Terraform Validate
resource "aws_codebuild_project" "terraform_validate" {
  name          = "terraform-validate-${var.environment_suffix}"
  description   = "Validates Terraform configuration syntax"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 10

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.codebuild_compute_type
    image                       = var.codebuild_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    environment_variable {
      name  = "ENVIRONMENT_SUFFIX"
      value = var.environment_suffix
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo "Installing Terraform..."
            - terraform version
        build:
          commands:
            - echo "Initializing Terraform..."
            - terraform init -backend=false
            - echo "Validating Terraform configuration..."
            - terraform validate
        post_build:
          commands:
            - echo "Terraform validation completed successfully"
      artifacts:
        files:
          - '**/*'
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.terraform_validate.name
    }
  }

  tags = {
    Name = "terraform-validate-${var.environment_suffix}"
  }
}

# CodeBuild Project for Terraform Plan
resource "aws_codebuild_project" "terraform_plan" {
  name          = "terraform-plan-${var.environment_suffix}"
  description   = "Creates Terraform execution plan"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 20

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.codebuild_compute_type
    image                       = var.codebuild_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    environment_variable {
      name  = "ENVIRONMENT_SUFFIX"
      value = var.environment_suffix
    }

    environment_variable {
      name  = "ARTIFACT_BUCKET"
      value = aws_s3_bucket.pipeline_artifacts.bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo "Initializing Terraform..."
            - terraform init
        build:
          commands:
            - echo "Creating Terraform plan..."
            - terraform plan -out=tfplan -input=false
            - echo "Terraform plan created successfully"
            - terraform show tfplan
        post_build:
          commands:
            - echo "Review the plan output above"
      artifacts:
        files:
          - '**/*'
          - tfplan
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.terraform_plan.name
    }
  }

  tags = {
    Name = "terraform-plan-${var.environment_suffix}"
  }
}

# CodeBuild Project for Terraform Apply
resource "aws_codebuild_project" "terraform_apply" {
  name          = "terraform-apply-${var.environment_suffix}"
  description   = "Applies Terraform configuration"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 30

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.codebuild_compute_type
    image                       = var.codebuild_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    environment_variable {
      name  = "ENVIRONMENT_SUFFIX"
      value = var.environment_suffix
    }

    environment_variable {
      name  = "ARTIFACT_BUCKET"
      value = aws_s3_bucket.pipeline_artifacts.bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        pre_build:
          commands:
            - echo "Initializing Terraform..."
            - terraform init
        build:
          commands:
            - echo "Applying Terraform configuration..."
            - terraform apply -auto-approve
        post_build:
          commands:
            - echo "Terraform apply completed successfully"
            - terraform output
      artifacts:
        files:
          - '**/*'
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.terraform_apply.name
    }
  }

  tags = {
    Name = "terraform-apply-${var.environment_suffix}"
  }
}
```

## File: lib/s3.tf

```hcl
# S3 Bucket for Pipeline Artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "pipeline-artifacts-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name = "pipeline-artifacts-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Rule
resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    id     = "cleanup-old-artifacts"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
```

## File: lib/iam.tf

```hcl
# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline" {
  name = "codepipeline-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "codepipeline-role-${var.environment_suffix}"
  }
}

# IAM Policy for CodePipeline
resource "aws_iam_role_policy" "codepipeline" {
  name = "codepipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.codepipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
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
        Resource = [
          aws_codebuild_project.terraform_validate.arn,
          aws_codebuild_project.terraform_plan.arn,
          aws_codebuild_project.terraform_apply.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = aws_codestarconnections_connection.github.arn
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

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild" {
  name = "codebuild-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "codebuild-role-${var.environment_suffix}"
  }
}

# IAM Policy for CodeBuild
resource "aws_iam_role_policy" "codebuild" {
  name = "codebuild-policy-${var.environment_suffix}"
  role = aws_iam_role.codebuild.id

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
          aws_cloudwatch_log_group.terraform_validate.arn,
          "${aws_cloudwatch_log_group.terraform_validate.arn}:*",
          aws_cloudwatch_log_group.terraform_plan.arn,
          "${aws_cloudwatch_log_group.terraform_plan.arn}:*",
          aws_cloudwatch_log_group.terraform_apply.arn,
          "${aws_cloudwatch_log_group.terraform_apply.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "iam:*",
          "lambda:*",
          "dynamodb:*",
          "cloudwatch:*",
          "logs:*",
          "sns:*",
          "sqs:*",
          "events:*",
          "cloudformation:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })
}
```

## File: lib/sns.tf

```hcl
# SNS Topic for Pipeline Notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name         = "pipeline-notifications-${var.environment_suffix}"
  display_name = "CodePipeline Notifications - ${var.environment_suffix}"

  tags = {
    Name = "pipeline-notifications-${var.environment_suffix}"
  }
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# SNS Email Subscription (optional)
resource "aws_sns_topic_subscription" "pipeline_email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Log Group for Terraform Validate
resource "aws_cloudwatch_log_group" "terraform_validate" {
  name              = "/aws/codebuild/terraform-validate-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-validate-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Terraform Plan
resource "aws_cloudwatch_log_group" "terraform_plan" {
  name              = "/aws/codebuild/terraform-plan-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-plan-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Terraform Apply
resource "aws_cloudwatch_log_group" "terraform_apply" {
  name              = "/aws/codebuild/terraform-apply-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "terraform-apply-logs-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Pipeline Failures (optional)
resource "aws_cloudwatch_metric_alarm" "pipeline_failed" {
  count               = var.enable_pipeline_alarms ? 1 : 0
  alarm_name          = "pipeline-failed-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "PipelineExecutionFailure"
  namespace           = "AWS/CodePipeline"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when pipeline execution fails"
  alarm_actions       = [aws_sns_topic.pipeline_notifications.arn]

  dimensions = {
    PipelineName = aws_codepipeline.terraform_pipeline.name
  }

  tags = {
    Name = "pipeline-failed-alarm-${var.environment_suffix}"
  }
}
```

## File: lib/eventbridge.tf

```hcl
# EventBridge Rule for Pipeline Triggers
resource "aws_cloudwatch_event_rule" "pipeline_trigger" {
  name        = "pipeline-trigger-${var.environment_suffix}"
  description = "Trigger CodePipeline on GitHub repository changes"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
  })

  tags = {
    Name = "pipeline-trigger-${var.environment_suffix}"
  }
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "pipeline" {
  rule      = aws_cloudwatch_event_rule.pipeline_trigger.name
  target_id = "CodePipeline"
  arn       = aws_codepipeline.terraform_pipeline.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name = "eventbridge-pipeline-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "eventbridge-pipeline-role-${var.environment_suffix}"
  }
}

# IAM Policy for EventBridge
resource "aws_iam_role_policy" "eventbridge" {
  name = "eventbridge-pipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codepipeline:StartPipelineExecution"
        ]
        Resource = aws_codepipeline.terraform_pipeline.arn
      }
    ]
  })
}
```

## File: lib/outputs.tf

```hcl
output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "pipeline_url" {
  description = "Console URL for the CodePipeline"
  value       = "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.terraform_pipeline.name}/view?region=${var.aws_region}"
}

output "codestar_connection_arn" {
  description = "ARN of the CodeStar Connection to GitHub - MUST be authorized in AWS Console"
  value       = aws_codestarconnections_connection.github.arn
}

output "codestar_connection_status" {
  description = "Status of the CodeStar Connection"
  value       = aws_codestarconnections_connection.github.connection_status
}

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.bucket
}

output "artifact_bucket_arn" {
  description = "ARN of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.arn
}

output "notification_topic_arn" {
  description = "ARN of the SNS topic for pipeline notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "validate_project_name" {
  description = "Name of the CodeBuild validation project"
  value       = aws_codebuild_project.terraform_validate.name
}

output "plan_project_name" {
  description = "Name of the CodeBuild plan project"
  value       = aws_codebuild_project.terraform_plan.name
}

output "apply_project_name" {
  description = "Name of the CodeBuild apply project"
  value       = aws_codebuild_project.terraform_apply.name
}

output "setup_instructions" {
  description = "Next steps to complete the setup"
  value       = <<-EOT
    IMPORTANT: Complete these steps to activate the pipeline:

    1. Authorize the GitHub Connection:
       - Go to AWS Console → CodePipeline → Settings → Connections
       - Find connection: ${aws_codestarconnections_connection.github.name}
       - Click "Update pending connection" and authorize with GitHub

    2. Configure GitHub Repository:
       - Update terraform.tfvars with your actual repository:
         github_repository_owner = "your-github-org"
         github_repository_name  = "your-repo-name"
       - Run: terraform apply

    3. Configure Email Notifications (optional):
       - Add your email to terraform.tfvars:
         notification_email = "team@example.com"
       - Run: terraform apply
       - Confirm the subscription email from AWS SNS

    4. View Pipeline:
       ${self.pipeline_url}

    The pipeline will automatically trigger when changes are pushed to ${var.github_branch} branch.
  EOT
}
```

## File: lib/terraform.tfvars.example

```hcl
# AWS Configuration
aws_region = "us-east-1"

# Unique suffix for resource names (required)
# Must be unique across deployments to avoid conflicts
environment_suffix = "dev-001"

# GitHub Repository Configuration
# Update these values with your actual repository details
github_repository_owner = "your-github-org"
github_repository_name  = "infrastructure-repo"
github_branch          = "main"

# Notification Configuration (optional)
# Provide email to receive pipeline status notifications
notification_email = "devops-team@example.com"

# CloudWatch Configuration
log_retention_days     = 7
enable_pipeline_alarms = true

# CodeBuild Configuration
codebuild_compute_type = "BUILD_GENERAL1_SMALL"
codebuild_image        = "aws/codebuild/standard:7.0"
```

## File: lib/README.md

```markdown
# AWS CodePipeline Terraform Infrastructure

This Terraform configuration creates a complete CI/CD pipeline for automating Terraform infrastructure deployments using AWS CodePipeline with GitHub integration.

## Architecture Overview

The pipeline implements a secure, automated workflow for Terraform deployments:

1. **Source Stage**: Monitors GitHub repository via CodeStar Connections
2. **Validate Stage**: Runs `terraform validate` to catch syntax errors
3. **Plan Stage**: Runs `terraform plan` to preview changes
4. **Approval Stage**: Manual approval gate before applying changes
5. **Apply Stage**: Runs `terraform apply` to deploy infrastructure

## Critical Information: CodeCommit Deprecation

**IMPORTANT**: AWS CodeCommit has been deprecated and is no longer available for new AWS accounts. This implementation uses GitHub as the source repository via AWS CodeStar Connections instead.

The CodeStar Connection requires manual authorization in the AWS Console before the pipeline will function. See Setup Instructions below.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- GitHub repository with Terraform infrastructure code
- AWS account with permissions to create:
  - CodePipeline
  - CodeBuild
  - CodeStar Connections
  - S3 buckets
  - IAM roles and policies
  - SNS topics
  - CloudWatch log groups
  - EventBridge rules

## Resources Created

- **CodePipeline**: Main orchestration pipeline
- **CodeStar Connection**: GitHub integration (requires manual authorization)
- **CodeBuild Projects**: 3 projects (validate, plan, apply)
- **S3 Bucket**: Pipeline artifacts with encryption and versioning
- **IAM Roles**: Separate roles for CodePipeline, CodeBuild, and EventBridge
- **SNS Topic**: Pipeline notifications
- **CloudWatch Log Groups**: Build logs with 7-day retention
- **EventBridge Rule**: Automated pipeline triggers (optional)
- **CloudWatch Alarms**: Pipeline failure alerts (optional)

## Quick Start

### 1. Configure Variables

Copy the example file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix      = "prod-001"
github_repository_owner = "your-github-org"
github_repository_name  = "your-infrastructure-repo"
notification_email      = "team@example.com"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

### 5. Authorize GitHub Connection (CRITICAL)

After deployment, you **MUST** authorize the GitHub connection:

1. Go to AWS Console → Developer Tools → CodePipeline → Settings → Connections
2. Find connection: `github-connection-{your-environment-suffix}`
3. Status will show "Pending"
4. Click "Update pending connection"
5. Click "Install a new app" or "Use existing app"
6. Authorize AWS CodeStar to access your GitHub repository
7. Connection status will change to "Available"

**The pipeline will not work until this step is completed.**

### 6. Configure Email Notifications (Optional)

If you provided an email address:

1. Check your inbox for "AWS Notification - Subscription Confirmation"
2. Click "Confirm subscription"
3. You will now receive pipeline status notifications

### 7. Verify Pipeline

```bash
# Get pipeline details
terraform output pipeline_url

# Check connection status
terraform output codestar_connection_status
```

Visit the pipeline URL to see the pipeline dashboard.

## Usage

### Triggering the Pipeline

The pipeline automatically triggers when:
- Changes are pushed to the configured GitHub branch (default: main)
- You manually start the pipeline from AWS Console
- EventBridge detects repository changes (if configured)

### Manual Pipeline Execution

```bash
aws codepipeline start-pipeline-execution \
  --name $(terraform output -raw pipeline_name)
```

### Viewing Build Logs

```bash
# View validate logs
aws logs tail /aws/codebuild/terraform-validate-{environment-suffix} --follow

# View plan logs
aws logs tail /aws/codebuild/terraform-plan-{environment-suffix} --follow

# View apply logs
aws logs tail /aws/codebuild/terraform-apply-{environment-suffix} --follow
```

### Approving Changes

When the pipeline reaches the Approval stage:

1. Review the Terraform plan output in the Plan stage logs
2. Go to AWS Console → CodePipeline → Your Pipeline
3. Click "Review" on the Approval stage
4. Add comments (optional)
5. Click "Approve" or "Reject"

## Configuration Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment_suffix` | Unique suffix for resource names | `"prod-001"` |
| `github_repository_owner` | GitHub organization or user | `"my-org"` |
| `github_repository_name` | Repository name | `"infrastructure"` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS deployment region | `"us-east-1"` |
| `github_branch` | Branch to monitor | `"main"` |
| `notification_email` | Email for alerts | `""` (disabled) |
| `log_retention_days` | CloudWatch log retention | `7` |
| `enable_pipeline_alarms` | Enable failure alarms | `false` |
| `codebuild_compute_type` | CodeBuild compute size | `"BUILD_GENERAL1_SMALL"` |
| `codebuild_image` | CodeBuild container image | `"aws/codebuild/standard:7.0"` |

## Outputs

Key outputs from the deployment:

```bash
# Pipeline details
terraform output pipeline_name
terraform output pipeline_url

# GitHub connection (must authorize)
terraform output codestar_connection_arn
terraform output codestar_connection_status

# S3 artifact bucket
terraform output artifact_bucket_name

# SNS notification topic
terraform output notification_topic_arn

# Setup instructions
terraform output setup_instructions
```

## Security Considerations

### IAM Permissions

The CodeBuild role has broad permissions to deploy infrastructure. In production:

1. Review `iam.tf` and restrict permissions based on your needs
2. Use least-privilege access for specific AWS services
3. Consider using IAM permission boundaries
4. Regularly audit IAM policies

### S3 Bucket Security

The artifact bucket includes:
- Server-side encryption (AES256)
- Versioning enabled
- Public access blocked
- Lifecycle policies for artifact cleanup

### CodeStar Connection Security

- Connection requires manual authorization
- Uses OAuth for GitHub authentication
- Scoped to specific repositories
- Can be revoked from GitHub settings

## Cost Optimization

Estimated monthly costs (us-east-1):

- **CodePipeline**: ~$1/month (1 active pipeline)
- **CodeBuild**: ~$0.005/minute (BUILD_GENERAL1_SMALL)
- **S3**: ~$0.023/GB storage + requests
- **CloudWatch Logs**: ~$0.50/GB ingested
- **SNS**: Minimal (first 1,000 notifications free)

**Total estimated cost**: $5-15/month depending on usage

### Cost Reduction Tips

1. Use BUILD_GENERAL1_SMALL compute type (smallest)
2. Set short log retention (7 days default)
3. Enable S3 lifecycle policies (90 days default)
4. Disable alarms if not needed
5. Clean up old pipeline executions

## Troubleshooting

### Pipeline Fails at Source Stage

**Error**: "Could not access the CodeStar Connection"

**Solution**: Authorize the GitHub connection in AWS Console (see Setup step 5)

### Pipeline Fails at Validate Stage

**Error**: "terraform: command not found"

**Solution**: Ensure CodeBuild image includes Terraform (aws/codebuild/standard:7.0 includes it)

### Pipeline Fails at Plan Stage

**Error**: "Error: Failed to get existing workspaces"

**Solution**: Configure Terraform backend in your repository's Terraform code

### Pipeline Fails at Apply Stage

**Error**: "Error: Insufficient permissions"

**Solution**: Review and update the CodeBuild IAM role permissions in `iam.tf`

### Connection Status Shows "Pending"

**Solution**: You must manually authorize the connection in AWS Console → Connections

### No Email Notifications

**Solutions**:
1. Verify you confirmed the SNS subscription email
2. Check spam folder for AWS notification emails
3. Verify `notification_email` variable is set

## Cleanup

To destroy all resources:

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy
```

**Note**: The S3 bucket is configured with `force_destroy = true`, so it will be deleted along with all artifacts.

## Important Notes

1. **GitHub Connection**: Must be manually authorized before pipeline works
2. **Repository Configuration**: Update `terraform.tfvars` with your actual GitHub repository
3. **Manual Approval**: Plan stage output should be reviewed before approving
4. **State Management**: Configure Terraform backend in your infrastructure repository
5. **Permissions**: CodeBuild role has broad permissions - customize for production
6. **Cost Monitoring**: Monitor CodeBuild minutes and S3 storage usage

## Support and Contribution

For issues or questions:
1. Review the troubleshooting section above
2. Check AWS CodePipeline and CodeBuild documentation
3. Verify GitHub CodeStar Connection authorization
4. Review CloudWatch logs for detailed error messages

## References

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodeStar Connections](https://docs.aws.amazon.com/codestar-connections/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CodeCommit Deprecation Notice](https://aws.amazon.com/codecommit/)
```
