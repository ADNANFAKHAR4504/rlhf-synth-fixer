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
        ConnectionArn        = aws_codestarconnections_connection.github.arn
        FullRepositoryId     = "${var.github_repository_owner}/${var.github_repository_name}"
        BranchName           = var.github_branch
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
