# Main Terraform configuration - Orchestrates all modules for EKS infrastructure

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment_suffix
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment_suffix = var.environment_suffix
  tags               = local.common_tags
}

# EKS Cluster Module (first pass - creates cluster and OIDC provider)
module "eks" {
  source = "./modules/eks"

  environment_suffix       = var.environment_suffix
  eks_version              = var.eks_version
  cluster_role_arn         = module.iam.eks_cluster_role_arn
  vpc_id                   = module.vpc.vpc_id
  vpc_cidr                 = module.vpc.vpc_cidr
  private_subnet_ids       = module.vpc.private_subnet_ids
  public_subnet_ids        = module.vpc.public_subnet_ids
  vpc_cni_version          = var.vpc_cni_version
  kube_proxy_version       = var.kube_proxy_version
  coredns_version          = var.coredns_version
  ebs_csi_driver_version   = var.ebs_csi_driver_version
  ebs_csi_driver_role_arn  = module.iam.ebs_csi_driver_role_arn
  tags                     = local.common_tags

  depends_on = [module.vpc]
}

# IAM Module (depends on EKS for OIDC provider)
module "iam" {
  source = "./modules/iam"

  environment_suffix = var.environment_suffix
  oidc_provider_arn  = module.eks.oidc_provider_arn
  oidc_provider_id   = module.eks.oidc_provider_id
  tags               = local.common_tags

  depends_on = [module.eks]
}

# Node Groups Module
module "node_groups" {
  source = "./modules/node-groups"

  cluster_name                 = module.eks.cluster_name
  eks_version                  = var.eks_version
  node_role_arn                = module.iam.eks_node_group_role_arn
  private_subnet_ids           = module.vpc.private_subnet_ids
  environment_suffix           = var.environment_suffix
  frontend_instance_type       = var.frontend_instance_type
  backend_instance_type        = var.backend_instance_type
  data_processing_instance_type = var.data_processing_instance_type
  min_nodes                    = var.min_nodes
  max_nodes                    = var.max_nodes
  desired_nodes                = var.desired_nodes
  tags                         = local.common_tags

  depends_on = [module.eks, module.iam]
}

# Kubernetes and Helm provider configuration
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name

  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name

  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# ALB Controller Module
module "alb_controller" {
  source = "./modules/alb-controller"

  cluster_name                  = module.eks.cluster_name
  alb_controller_role_arn       = module.iam.alb_controller_role_arn
  vpc_id                        = module.vpc.vpc_id
  aws_region                    = var.aws_region
  alb_controller_chart_version  = var.alb_controller_chart_version

  depends_on = [module.node_groups]
}

# Cluster Autoscaler Module
module "cluster_autoscaler" {
  source = "./modules/cluster-autoscaler"

  cluster_name                      = module.eks.cluster_name
  cluster_autoscaler_role_arn       = module.iam.cluster_autoscaler_role_arn
  aws_region                        = var.aws_region
  cluster_autoscaler_chart_version  = var.cluster_autoscaler_chart_version

  depends_on = [module.node_groups]
}

# Istio Service Mesh Module
module "istio" {
  source = "./modules/istio"

  istio_version = var.istio_version

  depends_on = [module.node_groups]
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  environment_suffix = var.environment_suffix
  tags               = local.common_tags
}

# Secrets Manager Module
module "secrets_manager" {
  source = "./modules/secrets-manager"

  environment_suffix = var.environment_suffix
  tags               = local.common_tags
}
