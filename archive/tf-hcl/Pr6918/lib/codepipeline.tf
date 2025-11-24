resource "aws_codepipeline" "app" {
  name     = "payment-gateway-pipeline-v1-${var.environment_suffix}"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.artifacts.arn
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
        RepositoryName       = aws_codecommit_repository.app.repository_name
        BranchName           = var.codecommit_branch
        PollForSourceChanges = false
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.app.name
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
        NotificationArn = aws_sns_topic.pipeline_approval.arn
        CustomData      = "Please review and approve deployment to ${var.environment_suffix}"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      version         = "1"
      input_artifacts = ["build_output"]

      configuration = {
        ClusterName = aws_ecs_cluster.main.name
        ServiceName = aws_ecs_service.app.name
        FileName    = "imagedefinitions.json"
      }
    }
  }

  tags = {
    Name = "codepipeline-v1-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_rule" "codecommit_change" {
  name        = "codecommit-change-v1-${var.environment_suffix}"
  description = "Trigger pipeline on CodeCommit changes"

  event_pattern = jsonencode({
    source      = ["aws.codecommit"]
    detail-type = ["CodeCommit Repository State Change"]
    detail = {
      event          = ["referenceCreated", "referenceUpdated"]
      repositoryName = [aws_codecommit_repository.app.repository_name]
      referenceName  = [var.codecommit_branch]
    }
  })

  tags = {
    Name = "codecommit-event-v1-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "pipeline" {
  rule     = aws_cloudwatch_event_rule.codecommit_change.name
  arn      = aws_codepipeline.app.arn
  role_arn = aws_iam_role.events.arn
}

resource "aws_iam_role" "events" {
  name = "events-role-v1-${var.environment_suffix}"

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
    Name = "events-role-v1-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "events" {
  name = "events-policy-v1-${var.environment_suffix}"
  role = aws_iam_role.events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codepipeline:StartPipelineExecution"
        ]
        Resource = [
          aws_codepipeline.app.arn
        ]
      }
    ]
  })
}
