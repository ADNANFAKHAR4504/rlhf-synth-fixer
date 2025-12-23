output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "URL of the OIDC Provider for EKS"
  value       = local.oidc_provider_url
}

output "vpc_id" {
  description = "VPC ID where EKS cluster is deployed"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "node_group_frontend_id" {
  description = "Frontend node group ID"
  value       = aws_eks_node_group.frontend.id
}

output "node_group_backend_id" {
  description = "Backend node group ID"
  value       = aws_eks_node_group.backend.id
}

output "node_group_data_processing_id" {
  description = "Data processing node group ID"
  value       = aws_eks_node_group.data_processing.id
}

output "node_group_frontend_arn" {
  description = "Amazon Resource Name (ARN) of the Frontend Node Group"
  value       = aws_eks_node_group.frontend.arn
}

output "node_group_backend_arn" {
  description = "Amazon Resource Name (ARN) of the Backend Node Group"
  value       = aws_eks_node_group.backend.arn
}

output "node_group_data_processing_arn" {
  description = "Amazon Resource Name (ARN) of the Data Processing Node Group"
  value       = aws_eks_node_group.data_processing.arn
}

output "fargate_profile_coredns_id" {
  description = "Fargate Profile ID for CoreDNS"
  value       = aws_eks_fargate_profile.coredns.id
}

output "fargate_profile_alb_controller_id" {
  description = "Fargate Profile ID for ALB Controller"
  value       = aws_eks_fargate_profile.alb_controller.id
}

output "alb_controller_role_arn" {
  description = "ARN of IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.alb_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of IAM role for Cluster Autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "secrets_manager_role_arn" {
  description = "ARN of IAM role for Secrets Manager access"
  value       = aws_iam_role.secrets_manager.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of CloudWatch log group for Container Insights"
  value       = aws_cloudwatch_log_group.container_insights.name
}

output "ecr_repository_url" {
  description = "URL of ECR repository for microservices"
  value       = aws_ecr_repository.microservices.repository_url
}

output "secrets_manager_secret_arn" {
  description = "ARN of Secrets Manager secret for application"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

output "cluster_info" {
  description = "Comprehensive cluster information"
  value = {
    cluster_name    = aws_eks_cluster.main.name
    cluster_version = aws_eks_cluster.main.version
    region          = var.aws_region
    vpc_id          = aws_vpc.main.id
    node_groups = {
      frontend = {
        name          = aws_eks_node_group.frontend.node_group_name
        instance_type = var.frontend_instance_type
        min_size      = var.node_group_min_size
        max_size      = var.node_group_max_size
      }
      backend = {
        name          = aws_eks_node_group.backend.node_group_name
        instance_type = var.backend_instance_type
        min_size      = var.node_group_min_size
        max_size      = var.node_group_max_size
      }
      data_processing = {
        name          = aws_eks_node_group.data_processing.node_group_name
        instance_type = var.data_processing_instance_type
        min_size      = var.node_group_min_size
        max_size      = var.node_group_max_size
      }
    }
    fargate_profiles = {
      coredns        = aws_eks_fargate_profile.coredns.fargate_profile_name
      alb_controller = aws_eks_fargate_profile.alb_controller.fargate_profile_name
    }
  }
}
