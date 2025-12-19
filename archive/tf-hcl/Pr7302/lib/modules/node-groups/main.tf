# Node Groups Module - Managed node groups for different workload types

# Frontend Node Group
resource "aws_eks_node_group" "frontend" {
  cluster_name    = var.cluster_name
  node_group_name = "frontend-${var.environment_suffix}"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  version         = var.eks_version

  scaling_config {
    desired_size = var.desired_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  instance_types = [var.frontend_instance_type]
  capacity_type  = "ON_DEMAND"
  disk_size      = 50

  labels = {
    workload = "frontend"
    role     = "frontend"
  }

  tags = merge(var.tags, {
    Name                                            = "frontend-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"             = "true"
  })

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

# Backend Node Group
resource "aws_eks_node_group" "backend" {
  cluster_name    = var.cluster_name
  node_group_name = "backend-${var.environment_suffix}"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  version         = var.eks_version

  scaling_config {
    desired_size = var.desired_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  instance_types = [var.backend_instance_type]
  capacity_type  = "ON_DEMAND"
  disk_size      = 100

  labels = {
    workload = "backend"
    role     = "backend"
  }

  tags = merge(var.tags, {
    Name                                            = "backend-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"             = "true"
  })

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

# Data Processing Node Group
resource "aws_eks_node_group" "data_processing" {
  cluster_name    = var.cluster_name
  node_group_name = "data-processing-${var.environment_suffix}"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  version         = var.eks_version

  scaling_config {
    desired_size = var.desired_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  instance_types = [var.data_processing_instance_type]
  capacity_type  = "ON_DEMAND"
  disk_size      = 100

  labels = {
    workload = "data-processing"
    role     = "data-processing"
  }

  tags = merge(var.tags, {
    Name                                            = "data-processing-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"             = "true"
  })

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}
