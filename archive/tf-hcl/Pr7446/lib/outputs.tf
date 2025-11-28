output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "node_security_group_system_id" {
  description = "Security group ID for system node group"
  value       = aws_security_group.system_nodes.id
}

output "node_security_group_application_id" {
  description = "Security group ID for application node group"
  value       = aws_security_group.application_nodes.id
}

output "node_security_group_spot_id" {
  description = "Security group ID for spot node group"
  value       = aws_security_group.spot_nodes.id
}

output "node_iam_role_arn" {
  description = "IAM role ARN for EKS node groups"
  value       = aws_iam_role.eks_nodes.arn
}

output "ebs_csi_driver_role_arn" {
  description = "IAM role ARN for EBS CSI driver"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "load_balancer_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.load_balancer_controller.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids_control_plane" {
  description = "Private subnet IDs for control plane"
  value       = aws_subnet.private_control_plane[*].id
}

output "private_subnet_ids_system" {
  description = "Private subnet IDs for system node group"
  value       = aws_subnet.private_system[*].id
}

output "private_subnet_ids_application" {
  description = "Private subnet IDs for application node group"
  value       = aws_subnet.private_application[*].id
}

output "private_subnet_ids_spot" {
  description = "Private subnet IDs for spot node group"
  value       = aws_subnet.private_spot[*].id
}

output "kms_key_id" {
  description = "KMS key ID for EKS secrets encryption"
  value       = aws_kms_key.eks.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for EKS secrets encryption"
  value       = aws_kms_key.eks.arn
}

output "system_node_group_id" {
  description = "System node group ID"
  value       = aws_eks_node_group.system.id
}

output "application_node_group_id" {
  description = "Application node group ID"
  value       = aws_eks_node_group.application.id
}

output "spot_node_group_id" {
  description = "Spot instance node group ID"
  value       = var.enable_spot_instances ? aws_eks_node_group.spot[0].id : null
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
