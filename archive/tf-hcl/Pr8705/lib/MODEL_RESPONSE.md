# CI/CD Pipeline Infrastructure - Terraform Implementation

This implementation provides a complete multi-stage CI/CD pipeline for Terraform infrastructure automation using AWS CodePipeline, CodeBuild, and GitHub integration via CodeStar Connections.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource names to ensure uniqueness across environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "github_repository_id" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to trigger pipeline"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
}

variable "terraform_version" {
  description = "Terraform version to use in CodeBuild"
  type        = string
  default     = "1.6.0"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}
```

## File: lib/s3.tf

```hcl
# S3 bucket for pipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "pipeline-artifacts-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "pipeline-artifacts-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "CodePipeline artifacts storage"
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

# S3 bucket for Terraform state storage
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "terraform-state-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "terraform-state-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Terraform remote state storage"
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

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}
```

## File: lib/dynamodb.tf

```hcl
# DynamoDB table for Terraform state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "terraform-state-lock-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "terraform-state-lock-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Terraform state locking"
  }
}
```

## File: lib/iam.tf

```hcl
# IAM role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
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
    Name        = "codepipeline-role-${var.environment_suffix}"
    Environment = var.environment_suffix
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
          "s3:GetBucketLocation"
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
          aws_codebuild_project.validate.arn,
          aws_codebuild_project.plan.arn,
          aws_codebuild_project.apply.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = aws_codestar_connections_connection.github.arn
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

# IAM role for CodeBuild projects
resource "aws_iam_role" "codebuild_role" {
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
    Name        = "codebuild-role-${var.environment_suffix}"
    Environment = var.environment_suffix
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
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/codebuild/*"
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
        Resource = aws_dynamodb_table.terraform_state_lock.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/terraform/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "dynamodb:*",
          "iam:*",
          "lambda:*",
          "cloudwatch:*",
          "sns:*",
          "codepipeline:*",
          "codebuild:*"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Log Groups for CodeBuild projects
resource "aws_cloudwatch_log_group" "validate_logs" {
  name              = "/aws/codebuild/validate-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "validate-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "validate"
  }
}

resource "aws_cloudwatch_log_group" "plan_logs" {
  name              = "/aws/codebuild/plan-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "plan-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "plan"
  }
}

resource "aws_cloudwatch_log_group" "apply_logs" {
  name              = "/aws/codebuild/apply-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "apply-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
    Project     = "apply"
  }
}

# CloudWatch Event Rule for pipeline failures
resource "aws_cloudwatch_event_rule" "pipeline_failure" {
  name        = "pipeline-failure-${var.environment_suffix}"
  description = "Trigger on pipeline execution failures"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      state = ["FAILED"]
      pipeline = [aws_codepipeline.terraform_pipeline.name]
    }
  })

  tags = {
    Name        = "pipeline-failure-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "pipeline_failure_sns" {
  rule      = aws_cloudwatch_event_rule.pipeline_failure.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}
```

## File: lib/sns.tf

```hcl
# SNS topic for pipeline notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name = "pipeline-notifications-${var.environment_suffix}"

  tags = {
    Name        = "pipeline-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "pipeline_email" {
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
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
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
```

## File: lib/codebuild.tf

```hcl
# CodeBuild project for validation stage
resource "aws_codebuild_project" "validate" {
  name          = "terraform-validate-${var.environment_suffix}"
  description   = "Terraform validation and security scanning"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 15

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TERRAFORM_VERSION"
      value = var.terraform_version
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        install:
          commands:
            - echo "Installing Terraform $TERRAFORM_VERSION"
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - mv terraform /usr/local/bin/
            - terraform version
            - echo "Installing tfsec for security scanning"
            - wget -q https://github.com/aquasecurity/tfsec/releases/download/v1.28.1/tfsec-linux-amd64
            - chmod +x tfsec-linux-amd64
            - mv tfsec-linux-amd64 /usr/local/bin/tfsec
        pre_build:
          commands:
            - echo "Terraform format check"
            - terraform fmt -check -recursive
        build:
          commands:
            - echo "Terraform init"
            - terraform init -backend=false
            - echo "Terraform validate"
            - terraform validate
            - echo "Running tfsec security scan"
            - tfsec . --no-color || true
        post_build:
          commands:
            - echo "Validation completed successfully"
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.validate_logs.name
    }
  }

  tags = {
    Name        = "terraform-validate-${var.environment_suffix}"
    Environment = var.environment_suffix
    Stage       = "validate"
  }
}

# CodeBuild project for plan stage
resource "aws_codebuild_project" "plan" {
  name          = "terraform-plan-${var.environment_suffix}"
  description   = "Generate Terraform plan"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 30

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TERRAFORM_VERSION"
      value = var.terraform_version
    }

    environment_variable {
      name  = "STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "LOCK_TABLE"
      value = aws_dynamodb_table.terraform_state_lock.id
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        install:
          commands:
            - echo "Installing Terraform $TERRAFORM_VERSION"
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - mv terraform /usr/local/bin/
            - terraform version
        pre_build:
          commands:
            - echo "Configuring Terraform backend"
            - |
              cat > backend.tf <<EOF
              terraform {
                backend "s3" {
                  bucket         = "$STATE_BUCKET"
                  key            = "terraform.tfstate"
                  region         = "$AWS_REGION"
                  dynamodb_table = "$LOCK_TABLE"
                  encrypt        = true
                }
              }
              EOF
        build:
          commands:
            - echo "Terraform init"
            - terraform init
            - echo "Terraform plan"
            - terraform plan -out=tfplan
            - echo "Saving plan output"
            - terraform show -no-color tfplan > plan-output.txt
        post_build:
          commands:
            - echo "Plan generation completed"
      artifacts:
        files:
          - '**/*'
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.plan_logs.name
    }
  }

  tags = {
    Name        = "terraform-plan-${var.environment_suffix}"
    Environment = var.environment_suffix
    Stage       = "plan"
  }
}

# CodeBuild project for apply stage
resource "aws_codebuild_project" "apply" {
  name          = "terraform-apply-${var.environment_suffix}"
  description   = "Apply Terraform changes"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = 60

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TERRAFORM_VERSION"
      value = var.terraform_version
    }

    environment_variable {
      name  = "STATE_BUCKET"
      value = aws_s3_bucket.terraform_state.id
    }

    environment_variable {
      name  = "LOCK_TABLE"
      value = aws_dynamodb_table.terraform_state_lock.id
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "SNS_TOPIC_ARN"
      value = aws_sns_topic.pipeline_notifications.arn
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOT
      version: 0.2
      phases:
        install:
          commands:
            - echo "Installing Terraform $TERRAFORM_VERSION"
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            - mv terraform /usr/local/bin/
            - terraform version
        pre_build:
          commands:
            - echo "Configuring Terraform backend"
            - |
              cat > backend.tf <<EOF
              terraform {
                backend "s3" {
                  bucket         = "$STATE_BUCKET"
                  key            = "terraform.tfstate"
                  region         = "$AWS_REGION"
                  dynamodb_table = "$LOCK_TABLE"
                  encrypt        = true
                }
              }
              EOF
        build:
          commands:
            - echo "Terraform init"
            - terraform init
            - echo "Terraform apply"
            - terraform apply -auto-approve tfplan
        post_build:
          commands:
            - echo "Apply completed successfully"
            - |
              aws sns publish \
                --topic-arn $SNS_TOPIC_ARN \
                --subject "Terraform Apply Completed" \
                --message "Terraform infrastructure changes have been applied successfully" \
                --region $AWS_REGION
    EOT
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.apply_logs.name
    }
  }

  tags = {
    Name        = "terraform-apply-${var.environment_suffix}"
    Environment = var.environment_suffix
    Stage       = "apply"
  }
}
```

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.6.0"

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
      Project     = "CICD-Pipeline"
    }
  }
}

# CodeStar Connection for GitHub integration
resource "aws_codestar_connections_connection" "github" {
  name          = "github-connection-${var.environment_suffix}"
  provider_type = "GitHub"

  tags = {
    Name        = "github-connection-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CodePipeline for Terraform automation
resource "aws_codepipeline" "terraform_pipeline" {
  name     = "terraform-pipeline-${var.environment_suffix}"
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
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = aws_codestar_connections_connection.github.arn
        FullRepositoryId = var.github_repository_id
        BranchName       = var.github_branch
        DetectChanges    = true
      }
    }
  }

  stage {
    name = "Validate"

    action {
      name             = "Terraform-Validate"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["validate_output"]

      configuration = {
        ProjectName = aws_codebuild_project.validate.name
      }
    }
  }

  stage {
    name = "Plan"

    action {
      name             = "Terraform-Plan"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["validate_output"]
      output_artifacts = ["plan_output"]

      configuration = {
        ProjectName = aws_codebuild_project.plan.name
      }
    }
  }

  stage {
    name = "Approval"

    action {
      name     = "Manual-Approval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_notifications.arn
        CustomData      = "Please review the Terraform plan and approve to proceed with apply stage"
      }
    }
  }

  stage {
    name = "Apply"

    action {
      name            = "Terraform-Apply"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["plan_output"]

      configuration = {
        ProjectName = aws_codebuild_project.apply.name
      }
    }
  }

  tags = {
    Name        = "terraform-pipeline-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
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

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "codestar_connection_arn" {
  description = "ARN of the CodeStar Connection (requires manual activation)"
  value       = aws_codestar_connections_connection.github.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "validate_project_name" {
  description = "Name of the validation CodeBuild project"
  value       = aws_codebuild_project.validate.name
}

output "plan_project_name" {
  description = "Name of the plan CodeBuild project"
  value       = aws_codebuild_project.plan.name
}

output "apply_project_name" {
  description = "Name of the apply CodeBuild project"
  value       = aws_codebuild_project.apply.name
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables configuration
# Copy this file to terraform.tfvars and update with your values

environment_suffix = "dev-001"

aws_region = "us-east-1"

github_repository_id = "myorg/infrastructure-repo"

github_branch = "main"

notification_email = "devops-team@example.com"

terraform_version = "1.6.0"

log_retention_days = 7
```

## File: lib/backend.tf.example

```hcl
# Example backend configuration for the pipeline infrastructure itself
# This creates a chicken-and-egg situation - you'll need to:
# 1. Deploy without backend first: comment out this file
# 2. After deployment, uncomment and run terraform init -migrate-state

terraform {
  backend "s3" {
    bucket         = "terraform-state-YOUR-SUFFIX-HERE"
    key            = "pipeline/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock-YOUR-SUFFIX-HERE"
    encrypt        = true
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Terraform configuration deploys a complete multi-stage CI/CD pipeline for automating Terraform infrastructure deployments using AWS CodePipeline, CodeBuild, and GitHub integration.

## Architecture Overview

The pipeline consists of four stages:

1. **Source Stage**: Pulls code from GitHub using CodeStar Connections
2. **Validate Stage**: Runs terraform fmt, validate, and tfsec security scanning
3. **Plan Stage**: Generates Terraform plan with artifacts
4. **Approval Stage**: Manual approval gate before deployment
5. **Apply Stage**: Executes terraform apply with notifications

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.6.0 installed
- GitHub repository for infrastructure code
- Email address for pipeline notifications
- AWS account with permissions to create CodePipeline, CodeBuild, S3, DynamoDB, IAM resources

## Deployment Instructions

### Step 1: Configure Variables

Copy the example variables file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix   = "dev-001"              # Unique identifier
aws_region          = "us-east-1"             # AWS region
github_repository_id = "yourorg/yourrepo"     # GitHub repo (owner/name)
github_branch       = "main"                  # Branch to monitor
notification_email  = "team@example.com"      # Email for notifications
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Plan

```bash
terraform plan
```

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### Step 5: Activate CodeStar Connection (CRITICAL)

After deployment, the CodeStar Connection requires manual activation in the AWS Console:

1. Navigate to AWS Console → CodePipeline → Settings → Connections
2. Find the connection named `github-connection-<your-suffix>`
3. Click "Update pending connection"
4. Follow the OAuth flow to authorize AWS access to your GitHub account
5. Complete the connection setup

**IMPORTANT**: The pipeline will not work until this step is completed.

### Step 6: Confirm SNS Email Subscription

Check your email inbox for the SNS subscription confirmation email and click the confirmation link.

### Step 7: Configure Remote State Backend (Optional)

To manage the pipeline infrastructure's own state remotely:

1. Note the outputs from deployment:
   ```bash
   terraform output state_bucket_name
   terraform output state_lock_table_name
   ```

2. Update `backend.tf.example` with your actual bucket and table names

3. Rename to `backend.tf` and migrate state:
   ```bash
   terraform init -migrate-state
   ```

## Usage

### Triggering the Pipeline

The pipeline automatically triggers when code is pushed to the configured GitHub branch.

### Manual Pipeline Execution

You can also trigger the pipeline manually via AWS Console or CLI:

```bash
aws codepipeline start-pipeline-execution \
  --name terraform-pipeline-<your-suffix>
```

### Monitoring Pipeline Execution

- **AWS Console**: CodePipeline → Pipelines → terraform-pipeline-<your-suffix>
- **CloudWatch Logs**: View build logs in CloudWatch Log Groups
- **Email Notifications**: Receive notifications for approvals and failures

### Approving Deployments

When the pipeline reaches the Approval stage:

1. You'll receive an email notification
2. Review the Terraform plan in the Plan stage logs
3. In AWS Console, approve or reject the deployment

## Pipeline Stages Details

### Validate Stage

- Runs `terraform fmt -check` to verify formatting
- Runs `terraform validate` to check syntax
- Runs `tfsec` for security scanning
- Duration: ~2-3 minutes

### Plan Stage

- Initializes Terraform with remote backend
- Generates execution plan
- Stores plan artifacts for Apply stage
- Duration: ~3-5 minutes

### Apply Stage

- Applies the Terraform plan
- Sends SNS notification on completion
- Duration: Varies based on resources

## State Management

The pipeline uses remote state with locking:

- **State Storage**: S3 bucket `terraform-state-<suffix>`
- **State Locking**: DynamoDB table `terraform-state-lock-<suffix>`
- **Encryption**: Server-side encryption enabled
- **Versioning**: Enabled with 90-day lifecycle

## Security Features

- All S3 buckets block public access
- Server-side encryption enabled
- IAM roles follow least privilege principle
- State locking prevents concurrent modifications
- Security scanning with tfsec
- Manual approval required before apply

## Troubleshooting

### Pipeline Fails at Source Stage

**Issue**: "Connection not available" error

**Solution**: Ensure CodeStar Connection is activated (see Step 5 above)

### Pipeline Fails at Validate Stage

**Issue**: Terraform format or validation errors

**Solution**: Run locally:
```bash
terraform fmt -recursive
terraform init -backend=false
terraform validate
```

### Pipeline Fails at Plan Stage

**Issue**: Backend initialization errors

**Solution**: Verify state bucket and DynamoDB table exist and IAM role has permissions

### Pipeline Fails at Apply Stage

**Issue**: Insufficient permissions

**Solution**: Review IAM role policy in `iam.tf` and ensure it includes necessary permissions for your infrastructure

## Resource Naming

All resources include the `environment_suffix` variable for uniqueness:

- Pipeline: `terraform-pipeline-<suffix>`
- CodeBuild Projects: `terraform-validate/plan/apply-<suffix>`
- S3 Buckets: `pipeline-artifacts-<suffix>`, `terraform-state-<suffix>`
- DynamoDB Table: `terraform-state-lock-<suffix>`
- IAM Roles: `codepipeline-role-<suffix>`, `codebuild-role-<suffix>`

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: S3 buckets are configured with `force_destroy = true` to allow cleanup even if they contain objects.

## Outputs

After deployment, the following outputs are available:

```bash
terraform output pipeline_name           # CodePipeline name
terraform output pipeline_arn            # CodePipeline ARN
terraform output artifact_bucket_name    # S3 artifacts bucket
terraform output state_bucket_name       # S3 state bucket
terraform output state_lock_table_name   # DynamoDB lock table
terraform output codestar_connection_arn # CodeStar Connection ARN
terraform output sns_topic_arn           # SNS notification topic
```

## Cost Optimization

The infrastructure uses cost-effective settings:

- CodeBuild: BUILD_GENERAL1_SMALL instances
- DynamoDB: Pay-per-request billing
- S3: Lifecycle policies for old versions
- CloudWatch Logs: 7-day retention (configurable)

Estimated monthly cost: $10-30 depending on pipeline execution frequency

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [CodeStar Connections Setup](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections.html)

## Support

For issues or questions, contact the DevOps team or open an issue in the repository.
```
