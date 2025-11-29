output "cluster_id" {
  description = "The name/id of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the cluster"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "The Kubernetes server version for the cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = try(aws_eks_cluster.main.identity[0].oidc[0].issuer, "")
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "system_private_subnet_ids" {
  description = "List of IDs of system private subnets"
  value       = aws_subnet.system_private[*].id
}

output "application_private_subnet_ids" {
  description = "List of IDs of application private subnets"
  value       = aws_subnet.application_private[*].id
}

output "spot_private_subnet_ids" {
  description = "List of IDs of spot private subnets"
  value       = aws_subnet.spot_private[*].id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "system_node_group_id" {
  description = "System node group ID"
  value       = aws_eks_node_group.system.id
}

output "system_node_group_name" {
  description = "System node group name"
  value       = aws_eks_node_group.system.node_group_name
}

output "application_node_group_id" {
  description = "Application node group ID"
  value       = aws_eks_node_group.application.id
}

output "application_node_group_name" {
  description = "Application node group name"
  value       = aws_eks_node_group.application.node_group_name
}

output "spot_node_group_id" {
  description = "Spot node group ID"
  value       = aws_eks_node_group.spot.id
}

output "spot_node_group_name" {
  description = "Spot node group name"
  value       = aws_eks_node_group.spot.node_group_name
}

output "kms_key_id" {
  description = "The ID of the KMS key used for EKS encryption"
  value       = aws_kms_key.eks.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for EKS encryption"
  value       = aws_kms_key.eks.arn
}

output "ebs_csi_driver_role_arn" {
  description = "ARN of IAM role for EBS CSI driver"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "ebs_csi_driver_role_name" {
  description = "Name of IAM role for EBS CSI driver"
  value       = aws_iam_role.ebs_csi_driver.name
}

output "ebs_csi_driver_enabled" {
  description = "Whether EBS CSI driver addon is enabled"
  value       = var.enable_ebs_csi_driver
}

output "aws_load_balancer_controller_role_arn" {
  description = "ARN of IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "aws_load_balancer_controller_role_name" {
  description = "Name of IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.name
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of IAM role for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "cluster_autoscaler_role_name" {
  description = "Name of IAM role for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.name
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
