output "codecommit_clone_url_http" {
  description = "HTTP clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.infrastructure_code.clone_url_http
}

output "codecommit_clone_url_ssh" {
  description = "SSH clone URL for the CodeCommit repository"
  value       = aws_codecommit_repository.infrastructure_code.clone_url_ssh
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.arn
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.terraform_pipeline.name
}

output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state files"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for pipeline approvals"
  value       = aws_sns_topic.pipeline_approvals.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key for pipeline artifacts"
  value       = aws_kms_key.pipeline_artifacts.arn
}
