# Outputs - Important information about deployed infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

# EKS Cluster Outputs
output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_version" {
  description = "Version of the EKS cluster"
  value       = module.eks.cluster_version
}

output "eks_cluster_security_group_id" {
  description = "Security group ID of the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider"
  value       = module.eks.oidc_provider_arn
}

# Configure kubectl command
output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

# Node Groups Outputs
output "frontend_node_group_id" {
  description = "ID of the frontend node group"
  value       = module.node_groups.frontend_node_group_id
}

output "backend_node_group_id" {
  description = "ID of the backend node group"
  value       = module.node_groups.backend_node_group_id
}

output "data_processing_node_group_id" {
  description = "ID of the data processing node group"
  value       = module.node_groups.data_processing_node_group_id
}

# IAM Outputs
output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_group_role_arn" {
  description = "ARN of the EKS node group IAM role"
  value       = aws_iam_role.eks_node_group.arn
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role"
  value       = module.iam_irsa.alb_controller_role_arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  value       = module.iam_irsa.cluster_autoscaler_role_arn
}

# ALB Controller Outputs
output "alb_controller_status" {
  description = "Status of the ALB controller Helm release"
  value       = module.alb_controller.helm_release_status
}

# Cluster Autoscaler Outputs
output "cluster_autoscaler_status" {
  description = "Status of the cluster autoscaler Helm release"
  value       = module.cluster_autoscaler.helm_release_status
}

# Istio Outputs
output "istio_version" {
  description = "Version of Istio deployed"
  value       = module.istio.istiod_version
}

output "istio_namespaces" {
  description = "Namespaces created for microservices with Istio injection"
  value = {
    frontend        = module.istio.frontend_namespace
    backend         = module.istio.backend_namespace
    data_processing = module.istio.data_processing_namespace
  }
}

# ECR Outputs
output "ecr_repositories" {
  description = "URLs of ECR repositories"
  value = {
    frontend        = module.ecr.frontend_repository_url
    backend         = module.ecr.backend_repository_url
    data_processing = module.ecr.data_processing_repository_url
  }
}

# Secrets Manager Outputs
output "secrets_manager_secrets" {
  description = "Names of Secrets Manager secrets"
  value = {
    frontend        = module.secrets_manager.frontend_secret_name
    backend         = module.secrets_manager.backend_secret_name
    data_processing = module.secrets_manager.data_processing_secret_name
  }
}

# Deployment Summary
output "deployment_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    region             = var.aws_region
    environment        = var.environment_suffix
    eks_version        = var.eks_version
    vpc_cidr           = var.vpc_cidr
    availability_zones = var.availability_zones
    node_groups = {
      frontend = {
        instance_type = var.frontend_instance_type
        min_nodes     = var.min_nodes
        max_nodes     = var.max_nodes
      }
      backend = {
        instance_type = var.backend_instance_type
        min_nodes     = var.min_nodes
        max_nodes     = var.max_nodes
      }
      data_processing = {
        instance_type = var.data_processing_instance_type
        min_nodes     = var.min_nodes
        max_nodes     = var.max_nodes
      }
    }
  }
}
