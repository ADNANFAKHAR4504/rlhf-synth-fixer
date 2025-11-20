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
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
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
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
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
            - wget https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
            - unzip terraform_$${TERRAFORM_VERSION}_linux_amd64.zip
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
