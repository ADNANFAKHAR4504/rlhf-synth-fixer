output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main_pipeline.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.main_pipeline.arn
}

output "artifacts_bucket" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "logs_bucket" {
  description = "Name of the S3 bucket for deployment logs"
  value       = aws_s3_bucket.deployment_logs.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "codebuild_test_project" {
  description = "Name of the CodeBuild test project"
  value       = aws_codebuild_project.test_project.name
}

output "codebuild_deploy_dev_project" {
  description = "Name of the CodeBuild development deployment project"
  value       = aws_codebuild_project.deploy_dev.name
}

output "codebuild_deploy_prod_project" {
  description = "Name of the CodeBuild production deployment project"
  value       = aws_codebuild_project.deploy_prod.name
}

output "rollback_function_name" {
  description = "Name of the Lambda rollback function"
  value       = aws_lambda_function.rollback_function.function_name
}

# output "config_recorder_name" {
#   description = "Name of the AWS Config recorder"
#   value       = aws_config_configuration_recorder.main.name
# }