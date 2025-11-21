output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "pipeline_url" {
  description = "Console URL for the CodePipeline"
  value       = "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.terraform_pipeline.name}/view?region=${var.aws_region}"
}

output "codestar_connection_arn" {
  description = "ARN of the CodeStar Connection to GitHub - MUST be authorized in AWS Console"
  value       = aws_codestarconnections_connection.github.arn
}

output "codestar_connection_status" {
  description = "Status of the CodeStar Connection"
  value       = aws_codestarconnections_connection.github.connection_status
}

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.bucket
}

output "artifact_bucket_arn" {
  description = "ARN of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.arn
}

output "notification_topic_arn" {
  description = "ARN of the SNS topic for pipeline notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "validate_project_name" {
  description = "Name of the CodeBuild validation project"
  value       = aws_codebuild_project.terraform_validate.name
}

output "plan_project_name" {
  description = "Name of the CodeBuild plan project"
  value       = aws_codebuild_project.terraform_plan.name
}

output "apply_project_name" {
  description = "Name of the CodeBuild apply project"
  value       = aws_codebuild_project.terraform_apply.name
}

output "setup_instructions" {
  description = "Next steps to complete the setup"
  value       = <<-EOT
    IMPORTANT: Complete these steps to activate the pipeline:

    1. Authorize the GitHub Connection:
       - Go to AWS Console → CodePipeline → Settings → Connections
       - Find connection: ${aws_codestarconnections_connection.github.name}
       - Click "Update pending connection" and authorize with GitHub

    2. Configure GitHub Repository:
       - Update terraform.tfvars with your actual repository:
         github_repository_owner = "your-github-org"
         github_repository_name  = "your-repo-name"
       - Run: terraform apply

    3. Configure Email Notifications (optional):
       - Add your email to terraform.tfvars:
         notification_email = "team@example.com"
       - Run: terraform apply
       - Confirm the subscription email from AWS SNS

    4. View Pipeline:
       https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.terraform_pipeline.name}/view?region=${var.aws_region}

    The pipeline will automatically trigger when changes are pushed to ${var.github_branch} branch.
  EOT
}
