# main.tf - Terraform CI/CD Pipeline Infrastructure

# KMS Key for Pipeline Artifact Encryption
resource "aws_kms_key" "pipeline" {
  description             = "KMS key for CodePipeline artifact encryption ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "codepipeline-kms-${var.environment_suffix}"
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
    Name = "terraform-pipeline-artifacts-${var.environment_suffix}"
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
    Name = "terraform-state-${var.environment_suffix}"
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
    Name = "terraform-state-locks-${var.environment_suffix}"
  }
}

# SNS Topic for Pipeline Notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name              = "terraform-pipeline-notifications-${var.environment_suffix}"
  display_name      = "Terraform Pipeline Notifications"
  kms_master_key_id = aws_kms_key.pipeline.id

  tags = {
    Name = "terraform-pipeline-notifications-${var.environment_suffix}"
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
    Name = "codebuild-terraform-plan-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "codebuild_apply" {
  name              = "/aws/codebuild/terraform-apply-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "codebuild-terraform-apply-${var.environment_suffix}"
  }
}

# CodeCommit Repository
resource "aws_codecommit_repository" "terraform_repo" {
  repository_name = "terraform-infrastructure-${var.environment_suffix}"
  description     = "Terraform infrastructure repository"

  tags = {
    Name = "terraform-infrastructure-${var.environment_suffix}"
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
    Name = "terraform-codepipeline-role-${var.environment_suffix}"
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
    Name = "terraform-codebuild-role-${var.environment_suffix}"
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
    Name = "terraform-plan-${var.environment_suffix}"
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
    Name = "terraform-apply-${var.environment_suffix}"
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
    Name = "terraform-pipeline-${var.environment_suffix}"
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
    Name = "terraform-pipeline-state-change-${var.environment_suffix}"
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
      event          = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.terraform_repo.repository_name]
      referenceName  = [var.repository_branch]
    }
  })

  tags = {
    Name = "terraform-codecommit-change-${var.environment_suffix}"
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
    Name = "terraform-eventbridge-pipeline-role-${var.environment_suffix}"
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
