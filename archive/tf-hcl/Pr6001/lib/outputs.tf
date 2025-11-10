output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = aws_eks_cluster.main.arn
}

output "eks_cluster_certificate_authority" {
  description = "Certificate authority data for the EKS cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "eks_cluster_security_group_id" {
  description = "Security group ID of the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "eks_oidc_provider_url" {
  description = "URL of the OIDC provider for the EKS cluster"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "system_node_group_id" {
  description = "ID of the system node group"
  value       = aws_eks_node_group.system.id
}

output "system_node_group_arn" {
  description = "ARN of the system node group"
  value       = aws_eks_node_group.system.arn
}

output "app_node_group_id" {
  description = "ID of the application node group"
  value       = aws_eks_node_group.application.id
}

output "app_node_group_arn" {
  description = "ARN of the application node group"
  value       = aws_eks_node_group.application.arn
}

output "gpu_node_group_id" {
  description = "ID of the GPU node group"
  value       = aws_eks_node_group.gpu.id
}

output "gpu_node_group_arn" {
  description = "ARN of the GPU node group"
  value       = aws_eks_node_group.gpu.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  value       = var.enable_cluster_autoscaler ? aws_iam_role.cluster_autoscaler[0].arn : null
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role"
  value       = var.enable_alb_controller ? aws_iam_role.alb_controller[0].arn : null
}

output "external_secrets_role_arn" {
  description = "ARN of the external secrets IAM role"
  value       = var.enable_external_secrets ? aws_iam_role.external_secrets[0].arn : null
}

output "ebs_csi_driver_role_arn" {
  description = "ARN of the EBS CSI driver IAM role"
  value       = var.enable_ebs_csi_driver ? aws_iam_role.ebs_csi_driver[0].arn : null
}

output "kms_key_id" {
  description = "ID of the KMS key for EKS encryption"
  value       = var.enable_cluster_encryption ? aws_kms_key.eks[0].id : null
}

output "kms_key_arn" {
  description = "ARN of the KMS key for EKS encryption"
  value       = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : null
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for EKS cluster"
  value       = aws_cloudwatch_log_group.eks.name
}

output "cluster_autoscaler_service_account" {
  description = "Kubernetes service account name for cluster autoscaler"
  value       = "cluster-autoscaler"
}

output "alb_controller_service_account" {
  description = "Kubernetes service account name for ALB controller"
  value       = "aws-load-balancer-controller"
}

output "external_secrets_service_account" {
  description = "Kubernetes service account name for external secrets"
  value       = "external-secrets"
}

output "ebs_csi_driver_service_account" {
  description = "Kubernetes service account name for EBS CSI driver"
  value       = "ebs-csi-controller-sa"
}

output "configure_kubectl_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
