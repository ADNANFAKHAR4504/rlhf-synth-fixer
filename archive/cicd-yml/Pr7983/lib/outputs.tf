# outputs.tf

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "repository_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_http
}

output "repository_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.terraform_repo.clone_url_ssh
}

output "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for pipeline notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "kms_key_id" {
  description = "KMS key ID for artifact encryption"
  value       = aws_kms_key.pipeline.id
}

output "codebuild_plan_project_name" {
  description = "Name of the CodeBuild project for Terraform plan"
  value       = aws_codebuild_project.terraform_plan.name
}

output "codebuild_apply_project_name" {
  description = "Name of the CodeBuild project for Terraform apply"
  value       = aws_codebuild_project.terraform_apply.name
}

output "codebuild_role_arn" {
  description = "IAM role ARN for CodeBuild projects"
  value       = aws_iam_role.codebuild.arn
}
