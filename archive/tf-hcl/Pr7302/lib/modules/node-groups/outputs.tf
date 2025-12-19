# Node Groups Module Outputs

output "frontend_node_group_id" {
  description = "ID of the frontend node group"
  value       = aws_eks_node_group.frontend.id
}

output "frontend_node_group_arn" {
  description = "ARN of the frontend node group"
  value       = aws_eks_node_group.frontend.arn
}

output "backend_node_group_id" {
  description = "ID of the backend node group"
  value       = aws_eks_node_group.backend.id
}

output "backend_node_group_arn" {
  description = "ARN of the backend node group"
  value       = aws_eks_node_group.backend.arn
}

output "data_processing_node_group_id" {
  description = "ID of the data processing node group"
  value       = aws_eks_node_group.data_processing.id
}

output "data_processing_node_group_arn" {
  description = "ARN of the data processing node group"
  value       = aws_eks_node_group.data_processing.arn
}
