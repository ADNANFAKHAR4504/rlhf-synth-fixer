resource "aws_codebuild_project" "build_and_test" {
  name         = "${var.project_name}-${var.environment_suffix}-build-test"
  service_role = aws_iam_role.codebuild.arn

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
      name  = "ARTIFACTS_BUCKET"
      value = aws_s3_bucket.artifacts.bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-build-test"
    Environment = var.environment
  }
}

resource "aws_codebuild_project" "deploy" {
  name         = "${var.project_name}-${var.environment_suffix}-deploy"
  service_role = aws_iam_role.codebuild.arn

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
      name  = "SNS_TOPIC_ARN"
      value = aws_sns_topic.deployment_notifications.arn
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "deployspec.yml"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-deploy"
    Environment = var.environment
  }
}