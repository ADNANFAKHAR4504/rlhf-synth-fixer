output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "fraud_detection_service_name" {
  description = "Name of the fraud detection service"
  value       = aws_ecs_service.fraud_detection.name
}

output "transaction_processor_service_name" {
  description = "Name of the transaction processor service"
  value       = aws_ecs_service.transaction_processor.name
}

output "fraud_detection_ecr_url" {
  description = "URL of fraud detection ECR repository"
  value       = aws_ecr_repository.fraud_detection.repository_url
}

output "transaction_processor_ecr_url" {
  description = "URL of transaction processor ECR repository"
  value       = aws_ecr_repository.transaction_processor.repository_url
}

output "service_discovery_namespace" {
  description = "Service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "fraud_detection_endpoint" {
  description = "Fraud detection service endpoint via ALB"
  value       = "http://${aws_lb.main.dns_name}/fraud-detection/"
}

output "transaction_processor_endpoint" {
  description = "Transaction processor service endpoint via ALB"
  value       = "http://${aws_lb.main.dns_name}/transaction-processor/"
}
