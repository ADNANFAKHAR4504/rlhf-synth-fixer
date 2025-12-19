# ECR Module Outputs

output "frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "frontend_repository_arn" {
  description = "ARN of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.arn
}

output "backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_repository_arn" {
  description = "ARN of the backend ECR repository"
  value       = aws_ecr_repository.backend.arn
}

output "data_processing_repository_url" {
  description = "URL of the data processing ECR repository"
  value       = aws_ecr_repository.data_processing.repository_url
}

output "data_processing_repository_arn" {
  description = "ARN of the data processing ECR repository"
  value       = aws_ecr_repository.data_processing.arn
}
