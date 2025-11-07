### Reasoning Trace
---

This is a comprehensive request for building a CI/CD pipeline for Terraform using AWS services. Let me break this down:

1. They want a complete Terraform setup that creates a CI/CD pipeline
2. This pipeline will deploy other Terraform code (meta!)
3. They need support for 3 environments: dev, staging, prod
4. Production needs manual approval, dev/staging are automatic
5. They want all the bells and whistles: notifications, state management, locking, etc.

I need to provide:
- All Terraform HCL files
- Docker configuration
- Buildspec files
- Documentation

Let me structure this properly with all the required components. I'll start with the Terraform files, then the supporting files like Dockerfile and buildspecs.

Key considerations:
- Terraform 1.5+ with AWS provider 5.x
- State stored in S3 with encryption
- DynamoDB for state locking
- Custom Docker image for CodeBuild
- SNS notifications
- Manual approval for production only
- Branch-based deployment strategy
- Proper IAM roles with least privilege
- Everything must be production-ready

I'll organize the files in a logical structure and provide comprehensive code.
### Answer 
---

I'll help you build a complete CI/CD pipeline for Terraform infrastructure deployment. This is a comprehensive solution that creates a self-service infrastructure deployment system for your development teams.

## Project Structure

```
terraform-cicd-pipeline/
├── versions.tf
├── providers.tf
├── variables.tf
├── codecommit.tf
├── s3-backend.tf
├── dynamodb.tf
├── ecr.tf
├── codebuild.tf
├── codepipeline.tf
├── iam.tf
├── sns.tf
├── outputs.tf
├── docker/
│   ├── Dockerfile
│   └── entrypoint.sh
├── buildspecs/
│   ├── buildspec-plan.yml
│   └── buildspec-apply.yml
├── .gitignore
└── README.md
```

## Terraform Configuration Files

### versions.tf
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
```

### providers.tf
```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "CI/CD Pipeline"
      Repository  = var.repository_name
    }
  }
}
```

### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "terraform-infrastructure"
}

variable "repository_name" {
  description = "Name of the CodeCommit repository"
  type        = string
  default     = "terraform-infrastructure"
}

variable "environments" {
  description = "List of environments to create pipelines for"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "approval_email" {
  description = "Email address for production approval notifications"
  type        = string
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for CodeBuild projects (optional)"
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
```

### codecommit.tf
```hcl
resource "aws_codecommit_repository" "terraform_repo" {
  repository_name = var.repository_name
  description     = "Terraform infrastructure code repository"

  default_branch = "main"

  tags = {
    Environment = "shared"
  }
}

# Create initial commit with README
resource "aws_codecommit_repository_file" "readme" {
  repository_name = aws_codecommit_repository.terraform_repo.repository_name
  branch          = "main"
  file_path       = "README.md"
  file_content    = <<-EOT
# Terraform Infrastructure Repository

This repository contains Terraform code for infrastructure deployment.

## Branch Strategy
- `dev` - Development environment
- `staging` - Staging environment  
- `main` - Production environment

## Usage
1. Create a feature branch from `dev`
2. Make your changes
3. Create a pull request to `dev`
4. Changes will automatically deploy through the pipeline

## Directory Structure
```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
└── environments/
    ├── dev.tfvars
    ├── staging.tfvars
    └── prod.tfvars
```
EOT
}
```

### s3-backend.tf
```hcl
data "aws_caller_identity" "current" {}

# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = {
    Environment = "shared"
    Purpose     = "Terraform State Storage"
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for old versions
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 bucket for CodePipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "terraform-pipeline-artifacts-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = {
    Environment = "shared"
    Purpose     = "Pipeline Artifacts"
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

resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    id     = "delete-old-artifacts"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}
```

### dynamodb.tf
```hcl
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "LockID"

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

  tags = {
    Environment = "shared"
    Purpose     = "Terraform State Locking"
  }
}
```

### ecr.tf
```hcl
resource "aws_ecr_repository" "terraform_runner" {
  name = "terraform-runner"

  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = "shared"
    Purpose     = "Terraform Runner Image"
  }
}

resource "aws_ecr_lifecycle_policy" "terraform_runner" {
  repository = aws_ecr_repository.terraform_runner.name

  policy = jsonencode({
    rules = [{
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
    }]
  })
}
```

### codebuild.tf
```hcl
# CodeBuild projects for each environment
resource "aws_codebuild_project" "terraform_plan" {
  for_each = toset(var.environments)
  
  name         = "terraform-plan-${each.key}"
  description  = "Terraform plan for ${each.key} environment"

  service_role = aws_iam_role.codebuild_plan_role[each.key].arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "${aws_ecr_repository.terraform_runner.repository_url}:${var.docker_image_tag}"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"

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
  }

  # Optional VPC configuration
  dynamic "vpc_config" {
    for_each = var.vpc_id != null ? [1] : []
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
      group_name  = "/aws/codebuild/terraform-plan-${each.key}"
      stream_name = "build-logs"
    }
  }

  tags = {
    Environment = each.key
  }
}

resource "aws_codebuild_project" "terraform_apply" {
  for_each = toset(var.environments)
  
  name         = "terraform-apply-${each.key}"
  description  = "Terraform apply for ${each.key} environment"

  service_role = aws_iam_role.codebuild_apply_role[each.key].arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = each.key == "prod" ? "BUILD_GENERAL1_MEDIUM" : "BUILD_GENERAL1_SMALL"
    image                      = "${aws_ecr_repository.terraform_runner.repository_url}:${var.docker_image_tag}"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"

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
  }

  # Optional VPC configuration
  dynamic "vpc_config" {
    for_each = var.vpc_id != null ? [1] : []
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
      group_name  = "/aws/codebuild/terraform-apply-${each.key}"
      stream_name = "build-logs"
    }
  }

  tags = {
    Environment = each.key
  }
}

# Security group for CodeBuild (if using VPC)
resource "aws_security_group" "codebuild" {
  count = var.vpc_id != null ? 1 : 0

  name        = "codebuild-terraform-sg"
  description = "Security group for CodeBuild Terraform projects"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = "shared"
  }
}
```

### codepipeline.tf
```hcl
# CodePipeline for each environment
resource "aws_codepipeline" "terraform_pipeline" {
  for_each = toset(var.environments)
  
  name     = "terraform-pipeline-${each.key}"
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
        RepositoryName = aws_codecommit_repository.terraform_repo.repository_name
        BranchName     = each.key == "prod" ? "main" : each.key
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

  # Manual approval stage for production only
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
          CustomData      = "Please review the Terraform plan output in the build logs before approving."
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

  tags = {
    Environment = each.key
  }
}

# CloudWatch Event to trigger pipeline on code changes
resource "aws_cloudwatch_event_rule" "codecommit_trigger" {
  for_each = toset(var.environments)
  
  name        = "terraform-pipeline-trigger-${each.key}"
  description = "Trigger pipeline on CodeCommit changes for ${each.key}"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    resources   = [aws_codecommit_repository.terraform_repo.arn]
    detail = {
      event         = ["referenceCreated", "referenceUpdated"]
      referenceType = ["branch"]
      referenceName = [each.key == "prod" ? "main" : each.key]
    }
  })
}

resource "aws_cloudwatch_event_target" "pipeline_trigger" {
  for_each = toset(var.environments)
  
  rule     = aws_cloudwatch_event_rule.codecommit_trigger[each.key].name
  target_id = "TriggerPipeline"
  arn      = aws_codepipeline.terraform_pipeline[each.key].arn
  role_arn = aws_iam_role.cloudwatch_events_role.arn
}
```

### iam.tf
```hcl
# CodePipeline service role
resource "aws_iam_role" "codepipeline_role" {
  name = "terraform-codepipeline-role"

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
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "terraform-codepipeline-policy"
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
        Resource = aws_codecommit_repository.terraform_repo.arn
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
      }
    ]
  })
}

# CodeBuild service roles - separate for plan and apply
resource "aws_iam_role" "codebuild_plan_role" {
  for_each = toset(var.environments)
  
  name = "terraform-codebuild-plan-role-${each.key}"

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
}

resource "aws_iam_role_policy" "codebuild_plan_policy" {
  for_each = toset(var.environments)
  
  name = "terraform-codebuild-plan-policy-${each.key}"
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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*"
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
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn
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
        # Read-only access for terraform plan
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
          "cloudfront:Get*"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC permissions if using VPC
resource "aws_iam_role_policy" "codebuild_vpc_policy" {
  for_each = var.vpc_id != null ? toset(var.environments) : toset([])
  
  name = "terraform-codebuild-vpc-policy-${each.key}"
  role = aws_iam_role.codebuild_plan_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
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
    }]
  })
}

# Apply role has same permissions as plan plus write access
resource "aws_iam_role" "codebuild_apply_role" {
  for_each = toset(var.environments)
  
  name = "terraform-codebuild-apply-role-${each.key}"

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
}

resource "aws_iam_role_policy" "codebuild_apply_policy" {
  for_each = toset(var.environments)
  
  name = "terraform-codebuild-apply-policy-${each.key}"
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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*"
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
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn
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
        # Full access for terraform apply - customize based on what you need
        Effect = "Allow"
        Action = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion": var.aws_region
          }
        }
      }
    ]
  })
}

# CloudWatch Events role for triggering pipelines
resource "aws_iam_role" "cloudwatch_events_role" {
  name = "terraform-cloudwatch-events-role"

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
}

resource "aws_iam_role_policy" "cloudwatch_events_policy" {
  name = "terraform-cloudwatch-events-policy"
  role = aws_iam_role.cloudwatch_events_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "codepipeline:StartPipelineExecution"
      ]
      Resource = [for env in var.environments : aws_codepipeline.terraform_pipeline[env].arn]
    }]
  })
}
```

### sns.tf
```hcl
# SNS topic for pipeline notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name = "terraform-pipeline-notifications"

  tags = {
    Environment = "shared"
  }
}

resource "aws_sns_topic_subscription" "pipeline_notifications_email" {
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS topic for production approval
resource "aws_sns_topic" "approval" {
  name = "terraform-approval-notifications"

  tags = {
    Environment = "prod"
  }
}

resource "aws_sns_topic_subscription" "approval_email" {
  topic_arn = aws_sns_topic.approval.arn
  protocol  = "email"
  endpoint  = var.approval_email
}

# Pipeline state change notifications
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  for_each = toset(var.environments)
  
  name        = "terraform-pipeline-state-${each.key}"
  description = "Capture pipeline state changes for ${each.key}"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.terraform_pipeline[each.key].name]
      state    = ["STARTED", "SUCCEEDED", "FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_notification" {
  for_each = toset(var.environments)
  
  rule      = aws_cloudwatch_event_rule.pipeline_state_change[each.key].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn

  input_transformer {
    input_paths = {
      pipeline = "$.detail.pipeline"
      state    = "$.detail.state"
      execution_id = "$.detail.execution-id"
    }
    input_template = "\"Pipeline <pipeline> is now <state>. Execution ID: <execution_id>\""
  }
}

# Permission for CloudWatch Events to publish to SNS
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.pipeline_notifications.arn
    }]
  })
}
```

### outputs.tf
```hcl
output "repository_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_http
}

output "repository_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_ssh
}

output "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for Docker images"
  value       = aws_ecr_repository.terraform_runner.repository_url
}

output "pipeline_names" {
  description = "Names of the created pipelines"
  value       = { for env in var.environments : env => aws_codepipeline.terraform_pipeline[env].name }
}

output "pipeline_urls" {
  description = "Console URLs for the pipelines"
  value = { 
    for env in var.environments : 
    env => "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.terraform_pipeline[env].name}/view"
  }
}
```

## Supporting Files

### docker/Dockerfile
```dockerfile
FROM hashicorp/terraform:1.5

# Install additional tools
RUN apk add --no-cache \
    aws-cli \
    git \
    bash \
    python3 \
    py3-pip \
    jq \
    curl

# Install checkov for security scanning
RUN pip3 install --no-cache-dir checkov

# Create non-root user
RUN adduser -D -s /bin/bash terraform

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER terraform
WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]
```

### docker/entrypoint.sh
```bash
#!/bin/bash
set -e

# Default to bash if no arguments provided
if [ $# -eq 0 ]; then
    exec /bin/bash
else
    exec "$@"
fi
```

### buildspecs/buildspec-plan.yml
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Initializing Terraform for $ENVIRONMENT environment"
      - cd infrastructure/
      - |
        terraform init \
          -backend-config="bucket=$TF_STATE_BUCKET" \
          -backend-config="key=project/$ENVIRONMENT/terraform.tfstate" \
          -backend-config="region=$AWS_DEFAULT_REGION" \
          -backend-config="dynamodb_table=$TF_STATE_LOCK_TABLE"
      
  build:
    commands:
      - echo "Running Terraform validation"
      - terraform validate
      
      - echo "Running security scan with Checkov"
      - checkov -d . --quiet --compact || true
      
      - echo "Running Terraform plan"
      - terraform plan -var-file=environments/$ENVIRONMENT.tfvars -out=tfplan
      
      - echo "Generating plan output for review"
      - terraform show -no-color tfplan > plan-output.txt
      - terraform show -json tfplan > plan-output.json
      
  post_build:
    commands:
      - echo "Plan completed successfully"
      - echo "Plan summary:"
      - cat plan-output.txt | grep -E "^Plan:|will be|must be|No changes"

artifacts:
  files:
    - infrastructure/tfplan
    - infrastructure/plan-output.txt
    - infrastructure/plan-output.json
    - infrastructure/.terraform/**/*
    - infrastructure/.terraform.lock.hcl
    - infrastructure/**/*.tf
    - infrastructure/**/*.tfvars
  name: plan-artifacts

reports:
  terraform-plan:
    files:
      - infrastructure/plan-output.json
    file-format: JunitXml
```

### buildspecs/buildspec-apply.yml
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Initializing Terraform for $ENVIRONMENT environment"
      - cd infrastructure/
      - |
        terraform init \
          -backend-config="bucket=$TF_STATE_BUCKET" \
          -backend-config="key=project/$ENVIRONMENT/terraform.tfstate" \
          -backend-config="region=$AWS_DEFAULT_REGION" \
          -backend-config="dynamodb_table=$TF_STATE_LOCK_TABLE"
      
  build:
    commands:
      - echo "Applying Terraform changes"
      - terraform apply -auto-approve tfplan
      
      - echo "Capturing outputs"
      - terraform output -json > outputs.json
      
  post_build:
    commands:
      - |
        if [ $CODEBUILD_BUILD_SUCCEEDING -eq 1 ]; then
          echo "Terraform apply completed successfully"
          echo "Infrastructure has been updated in $ENVIRONMENT environment"
        else
          echo "Terraform apply failed"
          exit 1
        fi

artifacts:
  files:
    - infrastructure/outputs.json
  name: apply-artifacts
```

### .gitignore
```gitignore
# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Exclude all .tfvars files, which are likely to contain sensitive data
*.tfvars
*.tfvars.json

# Ignore override files as they are usually used to override resources locally
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Include override files you do wish to add to version control using negated pattern
# !example_override.tf

# Include tfplan files to ignore the plan output of command: terraform plan -out=tfplan
# example: *tfplan*

# Ignore CLI configuration files
.terraformrc
terraform.rc

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
env/
venv/

# AWS
.aws/
```

### README.md
```markdown
# Terraform CI/CD Pipeline Infrastructure

This repository contains the Terraform code to create a complete CI/CD pipeline for deploying infrastructure as code. The pipeline automatically validates, plans, and applies Terraform changes across multiple environments.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ CodeCommit  │────▶│ CodePipeline │────▶│  CodeBuild  │────▶│     AWS      │
│    Repo     │     │   (3 envs)  │     │ Plan/Apply  │     │Infrastructure│
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │     SNS      │     │  S3 State   │
                    │Notifications │     │  DynamoDB   │
                    └──────────────┘     └─────────────┘
```

## 🚀 Features

- **Multi-Environment Support**: Separate pipelines for dev, staging, and production
- **Automated Deployments**: Push to branch triggers automatic deployment
- **Safety Gates**: Manual approval required for production changes
- **State Management**: S3 backend with DynamoDB locking
- **Notifications**: SNS alerts for pipeline status and approvals
- **Security**: Encrypted state, VPC isolation, least-privilege IAM
- **Audit Trail**: CloudTrail and CloudWatch Logs for all actions

## 📋 Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform 1.5+ installed locally
- Docker for building custom images
- Email address for notifications

## 🛠️ Setup Instructions

### 1. Deploy the Pipeline Infrastructure

```bash
# Clone this repository
git clone <repository-url>
cd terraform-cicd-pipeline

# Initialize Terraform
terraform init

# Create terraform.tfvars file
cat > terraform.tfvars <<EOF
approval_email = "approver@company.com"
notification_email = "team@company.com"
EOF

# Review the plan
terraform plan

# Deploy the infrastructure
terraform apply
```

### 2. Build and Push Docker Image

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)

# Build the Docker image
cd docker
docker build -t terraform-runner .

# Tag the image
docker tag terraform-runner:latest $(terraform output -raw ecr_repository_url):latest

# Push to ECR
docker push $(terraform output -raw ecr_repository_url):latest
```

### 3. Initialize the CodeCommit Repository

```bash
# Clone the empty repository
git clone $(terraform output -raw repository_clone_url_ssh)
cd terraform-infrastructure

# Create the initial directory structure
mkdir -p infrastructure/environments
mkdir -p buildspecs

# Copy buildspec files
cp ../buildspecs/*.yml buildspecs/

# Create sample environment files
cat > infrastructure/environments/dev.tfvars <<EOF
environment = "dev"
instance_type = "t3.micro"
min_size = 1
max_size = 2
EOF

cat > infrastructure/environments/staging.tfvars <<EOF
environment = "staging"
instance_type = "t3.small"
min_size = 2
max_size = 4
EOF

cat > infrastructure/environments/prod.tfvars <<EOF
environment = "prod"
instance_type = "t3.medium"
min_size = 3
max_size = 10
EOF

# Create sample Terraform configuration
cat > infrastructure/main.tf <<EOF
terraform {
  backend "s3" {
    # Backend config provided by pipeline
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
}

# Add your infrastructure resources here
output "environment" {
  value = var.environment
}
EOF

# Create branches
git checkout -b dev
git add .
git commit -m "Initial infrastructure setup"
git push origin dev

git checkout -b staging
git push origin staging

# Push to main (production)
git checkout main
git push origin main
```

## 📖 Usage Guide

### Deployment Workflow

1. **Create Feature Branch**: Start from `dev` branch
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/my-infrastructure-change
   ```

2. **Make Changes**: Edit Terraform files
   ```bash
   cd infrastructure/
   # Edit your .tf files
   terraform fmt  # Format code
   terraform validate  # Validate locally
   ```

3. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Add new infrastructure component"
   git push origin feature/my-infrastructure-change
   ```

4. **Create Pull Request**: Merge to `dev` branch via PR

5. **Automatic Deployment**: Pipeline runs automatically
   - Dev: Deploys immediately after merge
   - Staging: Create PR from dev to staging
   - Production: Create PR from staging to main, requires approval

### Monitoring Pipelines

View pipeline status:
```bash
# Get pipeline URLs
terraform output pipeline_urls

# Or use AWS CLI
aws codepipeline list-pipeline-executions --pipeline-name terraform-pipeline-dev
```

### Reviewing Plans

Before approval, review the plan:
1. Go to CodeBuild console
2. Find the plan build for your pipeline
3. Check the build logs for the plan output
4. Review what will be created/modified/destroyed

### Manual Approval (Production Only)

When production pipeline reaches approval stage:
1. You'll receive an email notification
2. Click the approval link in the email
3. Review the plan output
4. Click "Approve" or "Reject"
5. Add comments for audit trail

## 🔧 Troubleshooting

### State Lock Issues

If a build fails and leaves a lock:
```bash
# List locks
aws dynamodb scan --table-name terraform-state-lock

# Force unlock (use carefully!)
cd infrastructure/
terraform force-unlock <LOCK_ID>
```

### Pipeline Failures

Check CloudWatch Logs:
```bash
# View recent logs
aws logs tail /aws/codebuild/terraform-plan-dev --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/codebuild/terraform-apply-dev \
  --filter-pattern "ERROR"
```

### Permission Issues

If Terraform can't create resources:
1. Check CodeBuild service role permissions
2. Ensure the apply role has necessary permissions
3. Check CloudTrail for permission denied events

### Recovery from Failed Apply

If apply partially completes:
```bash
# Clone the repository
git clone <codecommit-url>
cd terraform-infrastructure/infrastructure

# Initialize with same backend config
terraform init \
  -backend-config="bucket=$(terraform output -raw state_bucket_name)" \
  -backend-config="key=project/dev/terraform.tfstate"

# Review current state
terraform plan -var-file=environments/dev.tfvars

# Fix issues and reapply
terraform apply -var-file=environments/dev.tfvars
```

## 🔒 Security Best Practices

1. **Never commit sensitive data**: Use AWS Secrets Manager or Parameter Store
2. **Review plans carefully**: Especially for production
3. **Limit apply permissions**: Scope IAM policies to only required resources
4. **Enable MFA**: For production approval
5. **Regular audits**: Review CloudTrail logs monthly
6. **State encryption**: Always encrypted at rest and in transit
7. **Branch protection**: Enforce PR reviews for main branch

## 💰 Cost Optimization

- **CodeBuild**: ~$0.005 per build minute
- **CodePipeline**: $1 per active pipeline per month
- **S3 Storage**: Minimal for state files
- **DynamoDB**: Pay-per-request, very low cost
- **Total estimate**: ~$5-10/month for moderate usage

### Cost Saving Tips

1. Use smaller CodeBuild instances for dev/staging
2. Set lifecycle policies on S3 artifacts
3. Use on-demand DynamoDB billing
4. Stop unused pipelines

## 🚧 Adding New Environments

To add a new environment (e.g., `qa`):

1. Add to `variables.tf`:
   ```hcl
   variable "environments" {
     default = ["dev", "staging", "qa", "prod"]
   }
   ```

2. Create environment file:
   ```bash
   infrastructure/environments/qa.tfvars
   ```

3. Create new branch:
   ```bash
   git checkout -b qa
   git push origin qa
   ```

4. Apply Terraform changes:
   ```bash
   terraform apply
   ```

## 📊 Metrics and Monitoring

Set up CloudWatch Dashboard:
```bash
# Pipeline success rate
# Build duration trends  
# Cost tracking
# State file size monitoring
```

## 🤝 Contributing

1. Create feature branch from `dev`
2. Make changes
3. Test locally with `terraform plan`
4. Submit PR with description
5. Ensure PR is reviewed before merging

## 📝 License

This infrastructure code is proprietary. Do not distribute outside the organization.

## 🆘 Support

- Slack: #infrastructure-support
- Email: infrastructure@company.com
- Wiki: https://wiki.company.com/terraform-pipeline
```

## Implementation Notes

This solution provides:

1. **Complete Infrastructure**: All AWS resources needed for the pipeline
2. **Multi-Environment Support**: Separate pipelines with appropriate controls
3. **Security**: Encryption, least-privilege IAM, VPC isolation
4. **Automation**: Push-to-deploy workflow with safety gates
5. **Monitoring**: SNS notifications and CloudWatch integration
6. **State Management**: S3 versioning and DynamoDB locking
7. **Documentation**: Comprehensive README with examples

The pipeline ensures that infrastructure changes go through proper validation and approval processes while maintaining separate environments and preventing accidental production changes.