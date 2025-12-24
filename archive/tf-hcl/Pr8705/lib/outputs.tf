output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "codestar_connection_arn" {
  description = "ARN of the CodeStar Connection (requires manual activation)"
  value       = aws_codestarconnections_connection.github.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "validate_project_name" {
  description = "Name of the validation CodeBuild project"
  value       = aws_codebuild_project.validate.name
}

output "plan_project_name" {
  description = "Name of the plan CodeBuild project"
  value       = aws_codebuild_project.plan.name
}

output "apply_project_name" {
  description = "Name of the apply CodeBuild project"
  value       = aws_codebuild_project.apply.name
}
