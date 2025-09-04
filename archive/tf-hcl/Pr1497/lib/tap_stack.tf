# CodePipeline
resource "aws_codepipeline" "main_pipeline" {
  name     = "${var.environment_suffix}-${var.project_name}-pipeline"
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
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        Owner      = var.github_owner
        Repo       = var.github_repo
        Branch     = var.github_branch
        OAuthToken = "{{resolve:secretsmanager:${aws_secretsmanager_secret.github_token.name}:SecretString}}"
      }
    }
  }

  stage {
    name = "Test"

    action {
      name             = "Test"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["test_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.test_project.name
      }
    }
  }

  stage {
    name = "DeployDev"

    action {
      name             = "DeployDev"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["test_output"]
      output_artifacts = ["dev_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy_dev.name
      }
    }
  }

  stage {
    name = "ApprovalForProduction"

    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.pipeline_notifications.arn
        CustomData      = "Please review the development deployment and approve for production deployment."
      }
    }
  }

  stage {
    name = "DeployProd"

    action {
      name            = "DeployProd"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      input_artifacts = ["dev_output"]
      version         = "1"

      configuration = {
        ProjectName = aws_codebuild_project.deploy_prod.name
      }
    }
  }

  stage {
    name = "RollbackOnFailure"

    action {
      name      = "TriggerRollback"
      category  = "Invoke"
      owner     = "AWS"
      provider  = "Lambda"
      version   = "1"
      run_order = 1

      configuration = {
        FunctionName = aws_lambda_function.rollback_function.function_name
      }
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-pipeline"
    Environment = var.environment_suffix
  })
}
