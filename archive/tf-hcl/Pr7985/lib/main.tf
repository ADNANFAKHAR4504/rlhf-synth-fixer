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

    filter {
      prefix = ""
    }

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

    filter {
      prefix = ""
    }

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
      event          = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.infrastructure_code.repository_name]
      referenceName  = ["main"]
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
