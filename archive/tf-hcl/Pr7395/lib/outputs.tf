# outputs.tf - EKS Cluster Outputs

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "oidc_provider_url" {
  description = "URL of the OIDC provider for IRSA"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the IAM role for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "critical_node_group_id" {
  description = "ID of the critical node group"
  value       = aws_eks_node_group.critical.id
}

output "general_node_group_id" {
  description = "ID of the general node group"
  value       = aws_eks_node_group.general.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for EBS encryption"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for EBS encryption"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.main.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}

output "cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_status" {
  description = "Status of the EKS cluster"
  value       = aws_eks_cluster.main.status
}

output "cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = aws_eks_cluster.main.arn
}

output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_role_arn" {
  description = "ARN of the EKS node IAM role"
  value       = aws_iam_role.eks_nodes.arn
}

output "hello_world_namespace" {
  description = "Name of the hello-world Kubernetes namespace"
  value       = kubernetes_namespace.hello_world.metadata[0].name
}

output "hello_world_deployment_name" {
  description = "Name of the hello-world Kubernetes deployment"
  value       = kubernetes_deployment.hello_world.metadata[0].name
}

output "hello_world_service_name" {
  description = "Name of the hello-world Kubernetes service"
  value       = kubernetes_service.hello_world.metadata[0].name
}

output "hello_world_service_namespace" {
  description = "Namespace of the hello-world Kubernetes service"
  value       = kubernetes_service.hello_world.metadata[0].namespace
}
