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

# IAM Module - Creates all IAM roles including IRSA roles
# Note: This must be created after EKS module to get OIDC provider
# However, EKS needs the cluster role, so we use a two-step approach:
# 1. Create IAM resources separately (moved to separate module)
# 2. Create EKS cluster
# 3. Create IRSA roles with OIDC provider

# For now, we'll create basic IAM roles inline to break the circular dependency
resource "aws_iam_role" "eks_cluster" {
  name = "eks-cluster-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "eks-cluster-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_node_group" {
  name = "eks-node-group-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "eks-node-group-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_ssm_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Cluster Module - Creates cluster and OIDC provider
module "eks" {
  source = "./modules/eks"

  environment_suffix     = var.environment_suffix
  eks_version            = var.eks_version
  cluster_role_arn       = aws_iam_role.eks_cluster.arn
  vpc_id                 = module.vpc.vpc_id
  vpc_cidr               = module.vpc.vpc_cidr
  private_subnet_ids     = module.vpc.private_subnet_ids
  public_subnet_ids      = module.vpc.public_subnet_ids
  vpc_cni_version        = var.vpc_cni_version
  kube_proxy_version     = var.kube_proxy_version
  coredns_version        = var.coredns_version
  ebs_csi_driver_version = var.ebs_csi_driver_version
  # Don't set EBS CSI role yet - addon will be created without it
  ebs_csi_driver_role_arn = ""
  tags                    = local.common_tags

  depends_on = [
    module.vpc,
    aws_iam_role.eks_cluster,
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller
  ]
}

# Data sources for Kubernetes and Helm provider configuration
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

# Configure Kubernetes provider
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# IAM Module - Create IRSA roles after OIDC provider exists
module "iam_irsa" {
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

  cluster_name                  = module.eks.cluster_name
  eks_version                   = var.eks_version
  node_role_arn                 = aws_iam_role.eks_node_group.arn
  private_subnet_ids            = module.vpc.private_subnet_ids
  environment_suffix            = var.environment_suffix
  frontend_instance_type        = var.frontend_instance_type
  backend_instance_type         = var.backend_instance_type
  data_processing_instance_type = var.data_processing_instance_type
  min_nodes                     = var.min_nodes
  max_nodes                     = var.max_nodes
  desired_nodes                 = var.desired_nodes
  tags                          = local.common_tags

  depends_on = [
    module.eks,
    aws_iam_role.eks_node_group,
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_ssm_policy
  ]
}

# Kubernetes and Helm provider configuration
# Note: Providers are configured in provider.tf to avoid circular dependencies
# The providers will use AWS CLI for authentication which works after EKS is created

# ALB Controller Module
module "alb_controller" {
  source = "./modules/alb-controller"

  cluster_name                 = module.eks.cluster_name
  alb_controller_role_arn      = module.iam_irsa.alb_controller_role_arn
  vpc_id                       = module.vpc.vpc_id
  aws_region                   = var.aws_region
  alb_controller_chart_version = var.alb_controller_chart_version

  depends_on = [module.node_groups, module.iam_irsa]
}

# Cluster Autoscaler Module
module "cluster_autoscaler" {
  source = "./modules/cluster-autoscaler"

  cluster_name                     = module.eks.cluster_name
  cluster_autoscaler_role_arn      = module.iam_irsa.cluster_autoscaler_role_arn
  aws_region                       = var.aws_region
  cluster_autoscaler_chart_version = var.cluster_autoscaler_chart_version

  depends_on = [module.node_groups, module.iam_irsa]
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
