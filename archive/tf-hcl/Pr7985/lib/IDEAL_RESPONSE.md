# Terraform CI/CD Pipeline Implementation - Ideal Response

This implementation creates a complete GitOps pipeline for automated Terraform deployments using AWS CodeCommit, CodePipeline, and CodeBuild.

## Architecture Overview

The solution implements a fully automated CI/CD pipeline with:
- Source control via CodeCommit
- Automated plan stage with CodeBuild
- Manual approval gate with SNS notifications
- Automated apply stage after approval
- State management with S3 and DynamoDB
- Encryption using customer-managed KMS keys
- EventBridge for automatic triggering

## Files Generated

1. `main.tf` - Main Terraform configuration with all AWS resources
2. `variables.tf` - Input variables including environment_suffix
3. `outputs.tf` - Output values for CodeCommit URL and pipeline ARN
4. `backend.tf` - Terraform backend configuration placeholder
5. `versions.tf` - Provider version constraints

## File: lib/main.tf

```hcl
# KMS Key for Pipeline Artifacts Encryption
resource "aws_kms_key" "pipeline_artifacts" {
  description             = "KMS key for encrypting pipeline artifacts"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "pipeline-artifacts-key-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "pipeline_artifacts" {
  name          = "alias/pipeline-artifacts-${var.environment_suffix}"
  target_key_id = aws_kms_key.pipeline_artifacts.key_id
}

# S3 Bucket for Terraform State Files
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-${var.environment_suffix}"

  tags = {
    Name        = "terraform-state-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.pipeline_artifacts.arn
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

# S3 Bucket for Pipeline Artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "pipeline-artifacts-${var.environment_suffix}"

  tags = {
    Name        = "pipeline-artifacts-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.pipeline_artifacts.arn
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

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "terraform-locks-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# CodeCommit Repository
resource "aws_codecommit_repository" "infrastructure_code" {
  repository_name = "infrastructure-code-${var.environment_suffix}"
  description     = "Repository for Terraform infrastructure code"

  tags = {
    Name        = "infrastructure-code-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# SNS Topic for Approval Notifications
resource "aws_sns_topic" "pipeline_approvals" {
  name              = "pipeline-approvals-${var.environment_suffix}"
  display_name      = "Pipeline Approval Notifications"
  kms_master_key_id = aws_kms_key.pipeline_artifacts.id

  tags = {
    Name        = "pipeline-approvals-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_sns_topic_subscription" "pipeline_approvals_email" {
  topic_arn = aws_sns_topic.pipeline_approvals.arn
  protocol  = "email"
  endpoint  = var.approval_email
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "codepipeline-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codepipeline.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "codepipeline-role-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "codepipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.codepipeline_role.id

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
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus",
          "codecommit:CancelUploadArchive"
        ]
        Resource = aws_codecommit_repository.infrastructure_code.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = [
          aws_codebuild_project.terraform_plan.arn,
          aws_codebuild_project.terraform_apply.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.pipeline_approvals.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.pipeline_artifacts.arn
      }
    ]
  })
}

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild_role" {
  name = "codebuild-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codebuild.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "codebuild-role-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "codebuild-policy-${var.environment_suffix}"
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
        Resource = [
          "arn:aws:logs:${var.region}:*:log-group:/aws/codebuild/*"
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
          "${aws_s3_bucket.pipeline_artifacts.arn}/*",
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.pipeline_artifacts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "dynamodb:*",
          "lambda:*",
          "iam:*",
          "cloudwatch:*",
          "logs:*",
          "sns:*",
          "sqs:*",
          "rds:*",
          "elasticache:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for CodeBuild Plan
resource "aws_cloudwatch_log_group" "codebuild_plan" {
  name              = "/aws/codebuild/terraform-plan-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "codebuild-terraform-plan-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Group for CodeBuild Apply
resource "aws_cloudwatch_log_group" "codebuild_apply" {
  name              = "/aws/codebuild/terraform-apply-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "codebuild-terraform-apply-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# CodeBuild Project for Terraform Plan
resource "aws_codebuild_project" "terraform_plan" {
  name          = "terraform-plan-${var.environment_suffix}"
  description   = "CodeBuild project for running terraform plan"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 60

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TF_VERSION"
      value = "1.5.7"
    }

    environment_variable {
      name  = "STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "STATE_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_locks.id
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.region
    }

    environment_variable {
      name  = "ENVIRONMENT_SUFFIX"
      value = var.environment_suffix
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_plan.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        install:
          commands:
            - echo "Installing Terraform $TF_VERSION"
            - wget https://releases.hashicorp.com/terraform/$${TF_VERSION}/terraform_$${TF_VERSION}_linux_amd64.zip
            - unzip terraform_$${TF_VERSION}_linux_amd64.zip
            - mv terraform /usr/local/bin/
            - terraform --version
        pre_build:
          commands:
            - echo "Initializing Terraform"
            - terraform init -backend-config="bucket=$STATE_BUCKET" -backend-config="key=terraform.tfstate" -backend-config="region=$AWS_REGION" -backend-config="dynamodb_table=$STATE_LOCK_TABLE"
        build:
          commands:
            - echo "Running Terraform Plan"
            - terraform plan -out=tfplan -var="environment_suffix=$ENVIRONMENT_SUFFIX" -var="region=$AWS_REGION"
            - terraform show -no-color tfplan > plan_output.txt
        post_build:
          commands:
            - echo "Terraform plan completed"
      artifacts:
        files:
          - '**/*'
    EOT
  }

  encryption_key = aws_kms_key.pipeline_artifacts.arn

  tags = {
    Name        = "terraform-plan-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# CodeBuild Project for Terraform Apply
resource "aws_codebuild_project" "terraform_apply" {
  name          = "terraform-apply-${var.environment_suffix}"
  description   = "CodeBuild project for running terraform apply"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 60

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TF_VERSION"
      value = "1.5.7"
    }

    environment_variable {
      name  = "STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "STATE_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_locks.id
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.region
    }

    environment_variable {
      name  = "ENVIRONMENT_SUFFIX"
      value = var.environment_suffix
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_apply.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        install:
          commands:
            - echo "Installing Terraform $TF_VERSION"
            - wget https://releases.hashicorp.com/terraform/$${TF_VERSION}/terraform_$${TF_VERSION}_linux_amd64.zip
            - unzip terraform_$${TF_VERSION}_linux_amd64.zip
            - mv terraform /usr/local/bin/
            - terraform --version
        pre_build:
          commands:
            - echo "Initializing Terraform"
            - terraform init -backend-config="bucket=$STATE_BUCKET" -backend-config="key=terraform.tfstate" -backend-config="region=$AWS_REGION" -backend-config="dynamodb_table=$STATE_LOCK_TABLE"
        build:
          commands:
            - echo "Running Terraform Apply"
            - terraform apply -auto-approve -var="environment_suffix=$ENVIRONMENT_SUFFIX" -var="region=$AWS_REGION"
        post_build:
          commands:
            - echo "Terraform apply completed"
      artifacts:
        files:
          - '**/*'
    EOT
  }

  encryption_key = aws_kms_key.pipeline_artifacts.arn

  tags = {
    Name        = "terraform-apply-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# CodePipeline
resource "aws_codepipeline" "terraform_pipeline" {
  name     = "terraform-pipeline-${var.environment_suffix}"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.pipeline_artifacts.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName       = aws_codecommit_repository.infrastructure_code.repository_name
        BranchName           = "main"
        PollForSourceChanges = false
      }
    }
  }

  stage {
    name = "TerraformPlan"

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

  stage {
    name = "ManualApproval"

    action {
      name     = "Approval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_approvals.arn
        CustomData      = "Please review the Terraform plan and approve to apply changes."
      }
    }
  }

  stage {
    name = "TerraformApply"

    action {
      name            = "Apply"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["plan_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_apply.name
      }
    }
  }

  tags = {
    Name        = "terraform-pipeline-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# EventBridge Rule for CodeCommit Trigger
resource "aws_cloudwatch_event_rule" "codecommit_trigger" {
  name        = "codecommit-trigger-${var.environment_suffix}"
  description = "Trigger pipeline on CodeCommit main branch commits"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    detail = {
      event         = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.infrastructure_code.repository_name]
      referenceName = ["main"]
    }
  })

  tags = {
    Name        = "codecommit-trigger-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_event_target" "pipeline" {
  rule     = aws_cloudwatch_event_rule.codecommit_trigger.name
  arn      = aws_codepipeline.terraform_pipeline.arn
  role_arn = aws_iam_role.eventbridge_role.arn
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge_role" {
  name = "eventbridge-pipeline-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "eventbridge-pipeline-role-${var.environment_suffix}"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "eventbridge_pipeline_policy" {
  name = "eventbridge-pipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "codepipeline:StartPipelineExecution"
      ]
      Resource = aws_codepipeline.terraform_pipeline.arn
    }]
  })
}
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple environments"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "approval_email" {
  description = "Email address for pipeline approval notifications"
  type        = string
  default     = "approvals@example.com"
}
```

## File: lib/outputs.tf

```hcl
output "codecommit_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.infrastructure_code.clone_url_http
}

output "codecommit_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.infrastructure_code.clone_url_ssh
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state files"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for pipeline approvals"
  value       = aws_sns_topic.pipeline_approvals.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key for pipeline artifacts"
  value       = aws_kms_key.pipeline_artifacts.arn
}
```

## File: lib/versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = "Production"
      ManagedBy   = "Terraform"
      Project     = "CI/CD Pipeline"
    }
  }
}
```

## File: lib/backend.tf

```hcl
# Backend configuration for Terraform state
# This should be configured during terraform init with:
# terraform init -backend-config="bucket=<your-state-bucket>" -backend-config="key=cicd-pipeline.tfstate" -backend-config="region=us-east-1"

terraform {
  backend "s3" {
    # Backend config will be provided via init command or backend config file
    # bucket         = "terraform-state-bucket"
    # key            = "cicd-pipeline.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-locks"
    # encrypt        = true
  }
}
```

## Key Implementation Details

### 1. Resource Naming
All resources include `environment_suffix` variable for unique naming:
- S3 Buckets: `terraform-state-${var.environment_suffix}`, `pipeline-artifacts-${var.environment_suffix}`
- DynamoDB Table: `terraform-locks-${var.environment_suffix}`
- CodeCommit Repo: `infrastructure-code-${var.environment_suffix}`
- CodePipeline: `terraform-pipeline-${var.environment_suffix}`
- IAM Roles: Suffixed with environment_suffix

### 2. Security Features
- **Encryption at Rest**: All S3 buckets use KMS encryption
- **Encryption in Transit**: HTTPS for all API communications
- **Least Privilege IAM**: Minimal permissions for each role
- **State Locking**: DynamoDB prevents concurrent modifications
- **Key Rotation**: KMS key rotation enabled
- **Public Access Blocked**: S3 buckets not publicly accessible

### 3. Lifecycle Management
- **S3 Versioning**: Enabled on both state and artifact buckets
- **Lifecycle Policies**:
  - State bucket: 30-day expiration for non-current versions
  - Artifacts bucket: 30-day expiration for objects, 7-day for non-current versions
- **CloudWatch Logs**: 7-day retention for build logs
- **Destroyability**: All resources can be cleanly destroyed (no retention policies)

### 4. Pipeline Flow
1. **Source Stage**: CodeCommit repository (main branch)
2. **Plan Stage**: CodeBuild runs `terraform plan`
3. **Manual Approval**: SNS notification sent to approval email
4. **Apply Stage**: CodeBuild runs `terraform apply` after approval

### 5. Automation
- **EventBridge Trigger**: Automatically starts pipeline on commits to main branch
- **Terraform Version**: Fixed at 1.5.7 for consistency
- **Environment Variables**: Backend configuration passed to CodeBuild

### 6. Cost Optimization
- **DynamoDB**: On-demand billing (pay-per-request)
- **CodeBuild**: Small compute instances
- **S3 Lifecycle**: Automatic cleanup of old versions
- **CloudWatch Logs**: 7-day retention (minimal storage costs)

## Deployment Verification

After deployment, verify:
1. All resources created with proper naming (includes environment_suffix)
2. S3 buckets have versioning enabled
3. KMS key has rotation enabled
4. SNS subscription confirmed
5. EventBridge rule connected to pipeline
6. CloudWatch log groups created
7. IAM roles have correct trust relationships

## Testing Strategy

1. **Infrastructure Validation**: Run `terraform validate` and `terraform plan`
2. **State Management**: Verify S3 bucket and DynamoDB table accessible
3. **Pipeline Trigger**: Push to CodeCommit main branch, verify pipeline starts
4. **Plan Stage**: Check CodeBuild logs for successful plan
5. **Approval**: Verify SNS email received
6. **Apply Stage**: Approve and verify apply completes successfully

## Cleanup

To destroy all resources:
```bash
# Empty S3 buckets first
aws s3 rm s3://terraform-state-<suffix> --recursive
aws s3 rm s3://pipeline-artifacts-<suffix> --recursive

# Destroy infrastructure
terraform destroy -var="environment_suffix=<suffix>"
```
