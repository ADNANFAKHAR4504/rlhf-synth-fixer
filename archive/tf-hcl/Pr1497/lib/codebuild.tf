resource "aws_codebuild_project" "test_project" {
  name         = "${var.environment_suffix}-${var.project_name}-test"
  description  = "Test project for ${var.environment_suffix}-${var.project_name}"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec-test.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/test-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-test"
    Environment = var.environment_suffix
  })
}

resource "aws_codebuild_project" "deploy_dev" {
  name         = "${var.environment_suffix}-${var.project_name}-deploy-dev"
  description  = "Deploy to development environment for ${var.environment_suffix}"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = "dev"
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec-deploy.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/dev-deploy-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-deploy-dev"
    Environment = "dev"
  })
}

resource "aws_codebuild_project" "deploy_prod" {
  name         = "${var.environment_suffix}-${var.project_name}-deploy-prod"
  description  = "Deploy to production environment for ${var.environment_suffix}"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = "prod"
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "DEPLOYMENT_LOGS_BUCKET"
      value = aws_s3_bucket.deployment_logs.id
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec-deploy.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild_logs.name
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.deployment_logs.id}/prod-deploy-logs"
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-deploy-prod"
    Environment = "prod"
  })
}