# IAM Module Outputs

output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_group_role_arn" {
  description = "ARN of the EKS node group IAM role"
  value       = aws_iam_role.eks_node_group.arn
}

output "eks_node_group_role_name" {
  description = "Name of the EKS node group IAM role"
  value       = aws_iam_role.eks_node_group.name
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role"
  value       = length(aws_iam_role.alb_controller) > 0 ? aws_iam_role.alb_controller[0].arn : ""
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  value       = length(aws_iam_role.cluster_autoscaler) > 0 ? aws_iam_role.cluster_autoscaler[0].arn : ""
}

output "ebs_csi_driver_role_arn" {
  description = "ARN of the EBS CSI driver IAM role"
  value       = length(aws_iam_role.ebs_csi_driver) > 0 ? aws_iam_role.ebs_csi_driver[0].arn : ""
}
