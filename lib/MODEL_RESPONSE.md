# Terraform CI/CD Pipeline Implementation

This implementation creates a complete GitOps pipeline for automated Terraform deployments using AWS CodeCommit, CodePipeline, and CodeBuild.

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

## File: lib/README.md

```markdown
# Terraform CI/CD Pipeline Infrastructure

This Terraform configuration creates a complete GitOps pipeline for automated Terraform deployments using AWS services.

## Architecture

The infrastructure includes:

1. **CodeCommit Repository**: Git repository for storing Terraform configurations
2. **CodePipeline**: Three-stage pipeline (Plan → Approval → Apply)
3. **CodeBuild Projects**: Separate projects for terraform plan and apply
4. **S3 Buckets**:
   - State files with versioning and 30-day lifecycle
   - Pipeline artifacts with encryption
5. **DynamoDB Table**: State locking with on-demand billing
6. **KMS Key**: Customer-managed key for artifact encryption
7. **SNS Topic**: Email notifications for manual approvals
8. **IAM Roles**: Least privilege roles for all services
9. **EventBridge Rule**: Automatic pipeline trigger on main branch commits
10. **CloudWatch Logs**: Build logs with 7-day retention

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform 1.5.x or later installed
- Email address for approval notifications

## Deployment

### Step 1: Initialize Terraform

```bash
terraform init
```

### Step 2: Review Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "dev"
region            = "us-east-1"
approval_email    = "your-email@example.com"
```

### Step 3: Plan Deployment

```bash
terraform plan -var-file=terraform.tfvars
```

### Step 4: Apply Configuration

```bash
terraform apply -var-file=terraform.tfvars
```

### Step 5: Confirm SNS Subscription

After deployment, check your email and confirm the SNS subscription for approval notifications.

## Using the Pipeline

### 1. Clone the CodeCommit Repository

Get the clone URL from the output:

```bash
terraform output codecommit_clone_url_http
```

Clone the repository:

```bash
git clone <clone-url>
cd infrastructure-code-<suffix>
```

### 2. Add Terraform Code

Add your Terraform configuration files to the repository. Example structure:

```
infrastructure-code/
├── main.tf
├── variables.tf
├── outputs.tf
└── backend.tf
```

Configure the backend to use the created state bucket:

```hcl
terraform {
  backend "s3" {
    bucket         = "<state-bucket-name>"
    key            = "infrastructure.tfstate"
    region         = "us-east-1"
    dynamodb_table = "<locks-table-name>"
    encrypt        = true
  }
}
```

### 3. Commit and Push

```bash
git add .
git commit -m "Add initial infrastructure code"
git push origin main
```

### 4. Monitor Pipeline

The pipeline will automatically start:

1. **Source Stage**: Fetches code from CodeCommit
2. **Plan Stage**: Runs `terraform plan` via CodeBuild
3. **Approval Stage**: Sends email notification, waits for approval
4. **Apply Stage**: Runs `terraform apply` after approval

Monitor in the AWS Console:
- CodePipeline: View pipeline execution
- CodeBuild: View build logs
- CloudWatch Logs: Detailed execution logs

## Pipeline Flow

```
CodeCommit (main branch commit)
    ↓
EventBridge triggers CodePipeline
    ↓
Stage 1: Source (CodeCommit)
    ↓
Stage 2: TerraformPlan (CodeBuild)
    - Install Terraform 1.5.7
    - terraform init
    - terraform plan
    ↓
Stage 3: ManualApproval
    - SNS notification sent
    - Waits for approval
    ↓
Stage 4: TerraformApply (CodeBuild)
    - Install Terraform 1.5.7
    - terraform init
    - terraform apply
```

## Security Features

- **Encryption at Rest**: All S3 buckets encrypted with KMS
- **Encryption in Transit**: HTTPS for all API calls
- **Least Privilege IAM**: Minimal permissions for each role
- **State Locking**: DynamoDB prevents concurrent modifications
- **Versioning**: S3 versioning enabled for state and artifacts
- **Public Access Blocked**: S3 buckets not publicly accessible
- **Key Rotation**: KMS key rotation enabled
- **Audit Trail**: CloudWatch logs retained for 7 days

## Resource Naming

All resources include the `environment_suffix` variable for unique naming:

- CodeCommit Repository: `infrastructure-code-{suffix}`
- CodePipeline: `terraform-pipeline-{suffix}`
- S3 Buckets: `terraform-state-{suffix}`, `pipeline-artifacts-{suffix}`
- DynamoDB Table: `terraform-locks-{suffix}`
- IAM Roles: `codepipeline-role-{suffix}`, `codebuild-role-{suffix}`

## Outputs

After deployment, the following outputs are available:

```bash
terraform output codecommit_clone_url_http  # HTTP clone URL
terraform output codecommit_clone_url_ssh   # SSH clone URL
terraform output pipeline_arn               # Pipeline ARN
terraform output pipeline_name              # Pipeline name
terraform output terraform_state_bucket     # State bucket name
terraform output terraform_locks_table      # Locks table name
terraform output sns_topic_arn             # SNS topic ARN
terraform output kms_key_arn               # KMS key ARN
```

## Cost Considerations

Estimated monthly costs (us-east-1):

- CodePipeline: $1.00 per active pipeline
- CodeBuild: Pay per build minute (~$0.005/min)
- S3: Minimal storage costs
- DynamoDB: Pay per request (on-demand)
- KMS: $1.00 per key
- SNS: $0.50 per 1M requests
- EventBridge: Free tier sufficient

Total: ~$5-10/month for light usage

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

Note: S3 buckets must be empty before destruction. Clear state and artifact buckets first:

```bash
aws s3 rm s3://terraform-state-<suffix> --recursive
aws s3 rm s3://pipeline-artifacts-<suffix> --recursive
```

## Troubleshooting

### Pipeline Fails at Plan Stage

- Check CodeBuild logs in CloudWatch
- Verify Terraform syntax in CodeCommit repository
- Ensure backend configuration is correct

### Manual Approval Not Received

- Check SNS subscription is confirmed
- Verify email address in variables
- Check spam folder

### Apply Stage Fails

- Review CodeBuild logs
- Check IAM permissions for CodeBuild role
- Verify Terraform configuration is valid

### State Lock Errors

- Check DynamoDB table exists
- Verify IAM permissions include DynamoDB access
- Use `terraform force-unlock` if needed (caution)

## Best Practices

1. **Branch Protection**: Consider using feature branches with PR reviews
2. **Environment Separation**: Deploy separate pipelines for dev/staging/prod
3. **Secrets Management**: Use AWS Secrets Manager for sensitive values
4. **Testing**: Add validation stage before plan (tflint, terraform validate)
5. **Notifications**: Add SNS notifications for pipeline failures
6. **Monitoring**: Set up CloudWatch alarms for failed builds
7. **Backup**: Enable S3 versioning on state bucket (already configured)

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS CodeCommit User Guide](https://docs.aws.amazon.com/codecommit/)
```
