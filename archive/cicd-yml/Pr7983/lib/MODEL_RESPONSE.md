# Terraform CI/CD Pipeline Implementation

This implementation creates a comprehensive AWS CodePipeline for automated Terraform deployments across multiple accounts.

## File: main.tf

```hcl
# KMS Key for Pipeline Artifact Encryption
resource "aws_kms_key" "pipeline" {
  description             = "KMS key for CodePipeline artifact encryption ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "codepipeline-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_kms_alias" "pipeline" {
  name          = "alias/codepipeline-${var.environment_suffix}"
  target_key_id = aws_kms_key.pipeline.key_id
}

# S3 Bucket for Pipeline Artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "terraform-pipeline-artifacts-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "terraform-pipeline-artifacts-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
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
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.pipeline.arn
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

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "terraform-state-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "terraform-state-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
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

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "terraform-state-locks-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS Topic for Pipeline Notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name              = "terraform-pipeline-notifications-${var.environment_suffix}"
  display_name      = "Terraform Pipeline Notifications"
  kms_master_key_id = aws_kms_key.pipeline.id

  tags = {
    Name        = "terraform-pipeline-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "pipeline_email" {
  count     = length(var.notification_emails)
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_emails[count.index]
}

# CloudWatch Log Groups for CodeBuild
resource "aws_cloudwatch_log_group" "codebuild_plan" {
  name              = "/aws/codebuild/terraform-plan-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "codebuild-terraform-plan-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_log_group" "codebuild_apply" {
  name              = "/aws/codebuild/terraform-apply-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "codebuild-terraform-apply-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CodeCommit Repository
resource "aws_codecommit_repository" "terraform_repo" {
  repository_name = "terraform-infrastructure-${var.environment_suffix}"
  description     = "Terraform infrastructure repository"

  tags = {
    Name        = "terraform-infrastructure-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline" {
  name = "terraform-codepipeline-role-${var.environment_suffix}"

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
    Name        = "terraform-codepipeline-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "terraform-codepipeline-policy-${var.environment_suffix}"
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
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus",
          "codecommit:CancelUploadArchive"
        ]
        Resource = aws_codecommit_repository.terraform_repo.arn
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
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.pipeline.arn
      }
    ]
  })
}

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild" {
  name = "terraform-codebuild-role-${var.environment_suffix}"

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
    Name        = "terraform-codebuild-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "codebuild" {
  name = "terraform-codebuild-policy-${var.environment_suffix}"
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
          aws_cloudwatch_log_group.codebuild_plan.arn,
          "${aws_cloudwatch_log_group.codebuild_plan.arn}:*",
          aws_cloudwatch_log_group.codebuild_apply.arn,
          "${aws_cloudwatch_log_group.codebuild_apply.arn}:*"
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
          "sts:AssumeRole"
        ]
        Resource = [
          "arn:aws:iam::${var.dev_account_id}:role/${var.cross_account_role_name}",
          "arn:aws:iam::${var.staging_account_id}:role/${var.cross_account_role_name}",
          "arn:aws:iam::${var.prod_account_id}:role/${var.cross_account_role_name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.pipeline.arn
      }
    ]
  })
}

# CodeBuild Project for Terraform Plan
resource "aws_codebuild_project" "terraform_plan" {
  name          = "terraform-plan-${var.environment_suffix}"
  description   = "Terraform plan execution"
  build_timeout = 10
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "hashicorp/terraform:1.5-alpine"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "DEV_ACCOUNT_ID"
      value = var.dev_account_id
    }

    environment_variable {
      name  = "STAGING_ACCOUNT_ID"
      value = var.staging_account_id
    }

    environment_variable {
      name  = "PROD_ACCOUNT_ID"
      value = var.prod_account_id
    }

    environment_variable {
      name  = "CROSS_ACCOUNT_ROLE_NAME"
      value = var.cross_account_role_name
    }

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "TF_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_locks.id
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
        pre_build:
          commands:
            - echo "Initializing Terraform..."
            - terraform init -backend-config="bucket=$TF_STATE_BUCKET" -backend-config="key=terraform.tfstate" -backend-config="region=${var.aws_region}" -backend-config="dynamodb_table=$TF_LOCK_TABLE"
        build:
          commands:
            - echo "Running Terraform plan..."
            - terraform plan -out=tfplan -var-file=environments/dev.tfvars
            - terraform show -json tfplan > plan.json
        post_build:
          commands:
            - echo "Terraform plan completed"
      artifacts:
        files:
          - tfplan
          - plan.json
          - '**/*'
    EOT
  }

  tags = {
    Name        = "terraform-plan-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CodeBuild Project for Terraform Apply
resource "aws_codebuild_project" "terraform_apply" {
  name          = "terraform-apply-${var.environment_suffix}"
  description   = "Terraform apply execution"
  build_timeout = 10
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "hashicorp/terraform:1.5-alpine"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "DEV_ACCOUNT_ID"
      value = var.dev_account_id
    }

    environment_variable {
      name  = "STAGING_ACCOUNT_ID"
      value = var.staging_account_id
    }

    environment_variable {
      name  = "PROD_ACCOUNT_ID"
      value = var.prod_account_id
    }

    environment_variable {
      name  = "CROSS_ACCOUNT_ROLE_NAME"
      value = var.cross_account_role_name
    }

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "TF_LOCK_TABLE"
      value = aws_dynamodb_table.terraform_locks.id
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
        pre_build:
          commands:
            - echo "Initializing Terraform..."
            - terraform init -backend-config="bucket=$TF_STATE_BUCKET" -backend-config="key=terraform.tfstate" -backend-config="region=${var.aws_region}" -backend-config="dynamodb_table=$TF_LOCK_TABLE"
        build:
          commands:
            - echo "Applying Terraform changes..."
            - terraform apply -auto-approve tfplan
        post_build:
          commands:
            - echo "Terraform apply completed"
            - terraform output -json > outputs.json
      artifacts:
        files:
          - outputs.json
    EOT
  }

  tags = {
    Name        = "terraform-apply-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CodePipeline
resource "aws_codepipeline" "terraform_pipeline" {
  name     = "terraform-pipeline-${var.environment_suffix}"
  role_arn = aws_iam_role.codepipeline.arn

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
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName       = aws_codecommit_repository.terraform_repo.repository_name
        BranchName           = var.repository_branch
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
      input_artifacts  = ["source_output"]
      output_artifacts = ["plan_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_plan.name
      }
    }
  }

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
        CustomData      = "Please review the Terraform plan and approve to proceed with deployment to production"
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
      input_artifacts  = ["plan_output"]
      output_artifacts = ["apply_output"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_apply.name
      }
    }
  }

  tags = {
    Name        = "terraform-pipeline-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# EventBridge Rule for Pipeline State Changes
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  name        = "terraform-pipeline-state-change-${var.environment_suffix}"
  description = "Capture pipeline state changes"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.terraform_pipeline.name]
    }
  })

  tags = {
    Name        = "terraform-pipeline-state-change-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "pipeline_sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}

resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# EventBridge Rule for Repository State Changes
resource "aws_cloudwatch_event_rule" "codecommit_change" {
  name        = "terraform-codecommit-change-${var.environment_suffix}"
  description = "Trigger pipeline on repository changes"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    detail = {
      event         = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.terraform_repo.repository_name]
      referenceName  = [var.repository_branch]
    }
  })

  tags = {
    Name        = "terraform-codecommit-change-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "codecommit_pipeline" {
  rule      = aws_cloudwatch_event_rule.codecommit_change.name
  target_id = "StartPipeline"
  arn       = aws_codepipeline.terraform_pipeline.arn
  role_arn  = aws_iam_role.eventbridge_pipeline.arn
}

# IAM Role for EventBridge to trigger CodePipeline
resource "aws_iam_role" "eventbridge_pipeline" {
  name = "terraform-eventbridge-pipeline-role-${var.environment_suffix}"

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
    Name        = "terraform-eventbridge-pipeline-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "eventbridge_pipeline" {
  name = "terraform-eventbridge-pipeline-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge_pipeline.id

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

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "dev_account_id" {
  description = "AWS account ID for dev environment"
  type        = string
  default     = "123456789012"
}

variable "staging_account_id" {
  description = "AWS account ID for staging environment"
  type        = string
  default     = "234567890123"
}

variable "prod_account_id" {
  description = "AWS account ID for production environment"
  type        = string
  default     = "345678901234"
}

variable "cross_account_role_name" {
  description = "Name of the IAM role in target accounts that CodeBuild will assume"
  type        = string
  default     = "TerraformDeploymentRole"
}

variable "notification_emails" {
  description = "Email addresses for pipeline notifications"
  type        = list(string)
  default     = []
}

variable "repository_branch" {
  description = "CodeCommit repository branch to monitor"
  type        = string
  default     = "main"
}
```

## File: outputs.tf

```hcl
output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "repository_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_http
}

output "repository_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_ssh
}

output "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for pipeline notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "kms_key_id" {
  description = "KMS key ID for artifact encryption"
  value       = aws_kms_key.pipeline.id
}

output "codebuild_plan_project_name" {
  description = "Name of the CodeBuild project for Terraform plan"
  value       = aws_codebuild_project.terraform_plan.name
}

output "codebuild_apply_project_name" {
  description = "Name of the CodeBuild project for Terraform apply"
  value       = aws_codebuild_project.terraform_apply.name
}

output "codebuild_role_arn" {
  description = "IAM role ARN for CodeBuild projects"
  value       = aws_iam_role.codebuild.arn
}
```

## File: provider.tf

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
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment_suffix
      Project     = "TerraformCICD"
    }
  }
}
```

## File: terraform.tfvars.example

```hcl
# Example tfvars file - copy to terraform.tfvars and customize

environment_suffix = "dev"
aws_region         = "us-east-1"

dev_account_id     = "123456789012"
staging_account_id = "234567890123"
prod_account_id    = "345678901234"

cross_account_role_name = "TerraformDeploymentRole"

notification_emails = [
  "devops-team@example.com"
]

repository_branch = "main"
```

## File: README.md

```markdown
# Terraform CI/CD Pipeline for Multi-Account Deployments

This Terraform configuration deploys a complete CI/CD pipeline using AWS CodePipeline for automated Terraform deployments across multiple AWS accounts.

## Architecture

The pipeline consists of four stages:

1. **Source**: Monitors a CodeCommit repository for changes
2. **Plan**: Executes `terraform plan` using CodeBuild
3. **Approval**: Manual approval gate before production deployment
4. **Apply**: Executes `terraform apply` using CodeBuild

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Access to the pipeline account and target accounts (dev, staging, production)
- Email addresses for pipeline notifications

## Cross-Account Setup

Before deploying this pipeline, you must create IAM roles in the target accounts (dev, staging, prod) that allow the CodeBuild role to assume them.

### Target Account IAM Role

Create this role in each target account (dev, staging, prod):

```hcl
resource "aws_iam_role" "terraform_deployment" {
  name = "TerraformDeploymentRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::<PIPELINE_ACCOUNT_ID>:role/terraform-codebuild-role-<ENVIRONMENT_SUFFIX>"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "terraform_deployment" {
  role       = aws_iam_role.terraform_deployment.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

## Deployment

1. **Clone the repository and navigate to the directory**:
   ```bash
   git clone <repository-url>
   cd terraform-cicd-pipeline
   ```

2. **Create a tfvars file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit terraform.tfvars with your values**:
   - Set `environment_suffix` to a unique value
   - Update account IDs for dev, staging, and prod
   - Add notification email addresses
   - Customize other variables as needed

4. **Initialize Terraform**:
   ```bash
   terraform init
   ```

5. **Review the plan**:
   ```bash
   terraform plan
   ```

6. **Apply the configuration**:
   ```bash
   terraform apply
   ```

7. **Confirm the email subscriptions**:
   Check your email for SNS subscription confirmation messages and click the confirmation links.

## Using the Pipeline

1. **Clone the CodeCommit repository**:
   ```bash
   aws codecommit get-repository --repository-name terraform-infrastructure-<ENVIRONMENT_SUFFIX>
   git clone <clone-url-http>
   ```

2. **Add your Terraform configurations**:
   Place your Terraform files in the repository with the following structure:
   ```
   .
   ├── main.tf
   ├── variables.tf
   ├── outputs.tf
   └── environments/
       ├── dev.tfvars
       ├── staging.tfvars
       └── prod.tfvars
   ```

3. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Add infrastructure configuration"
   git push origin main
   ```

4. **Pipeline execution**:
   - The pipeline automatically triggers on commits to the repository
   - The Plan stage executes and displays the Terraform plan
   - The Approval stage sends an SNS notification and waits for manual approval
   - After approval, the Apply stage executes and deploys the changes

## State Management

This pipeline configures Terraform to use:

- **S3 backend**: Stores state files in `terraform-state-<ENVIRONMENT_SUFFIX>`
- **DynamoDB locking**: Prevents concurrent state modifications using `terraform-state-locks-<ENVIRONMENT_SUFFIX>`

## Monitoring

- **CloudWatch Logs**: Build logs are stored in:
  - `/aws/codebuild/terraform-plan-<ENVIRONMENT_SUFFIX>`
  - `/aws/codebuild/terraform-apply-<ENVIRONMENT_SUFFIX>`
- **SNS Notifications**: Pipeline state changes trigger SNS notifications
- **EventBridge**: Monitors repository and pipeline events

## Security Features

- KMS encryption for pipeline artifacts
- KMS encryption for SNS notifications
- S3 bucket versioning for state files
- Public access blocked on all S3 buckets
- Least privilege IAM policies
- Cross-account role assumptions for deployments

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: Ensure the S3 buckets are empty before destroying, or set `force_destroy = true` in the configuration.

## Customization

- Modify CodeBuild buildspec files in `main.tf` to customize build steps
- Adjust timeout values for longer-running Terraform operations
- Add additional pipeline stages for multi-environment deployments
- Configure branch-specific pipelines for different environments

## Troubleshooting

### Pipeline fails at Plan stage
- Check CloudWatch Logs for Terraform errors
- Verify IAM permissions for CodeBuild role
- Ensure cross-account roles exist in target accounts

### Manual approval not received
- Check email spam folder for SNS subscription confirmation
- Verify SNS topic subscriptions are confirmed
- Check EventBridge rule configuration

### State locking errors
- Verify DynamoDB table exists and is accessible
- Check for stale locks in the DynamoDB table
- Ensure proper IAM permissions for DynamoDB operations
```
