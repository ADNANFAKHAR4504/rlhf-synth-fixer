# IAM role for EKS node groups
resource "aws_iam_role" "eks_nodes" {
  name = "eks-nodes-role-${local.environment_suffix}"

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

  tags = merge(
    var.tags,
    {
      Name        = "eks-nodes-role-${local.environment_suffix}"
      Environment = var.environment
    }
  )
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# System node group - for core cluster services
resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${local.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.system_private[*].id
  instance_types  = var.system_node_group_config.instance_types
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = var.system_node_group_config.desired_size
    max_size     = var.system_node_group_config.max_size
    min_size     = var.system_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "system"
    environment = var.environment
    nodegroup   = "system"
  }

  taint {
    key    = "dedicated"
    value  = "system"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                     = "eks-system-nodegroup-${local.environment_suffix}"
      Environment                                              = var.environment
      NodeGroup                                                = "system"
      "k8s.io/cluster-autoscaler/${local.cluster_name_unique}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                      = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Application node group - for application workloads
resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${local.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.application_private[*].id
  instance_types  = var.application_node_group_config.instance_types
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = var.application_node_group_config.desired_size
    max_size     = var.application_node_group_config.max_size
    min_size     = var.application_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "application"
    environment = var.environment
    nodegroup   = "application"
  }

  taint {
    key    = "dedicated"
    value  = "application"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                     = "eks-application-nodegroup-${local.environment_suffix}"
      Environment                                              = var.environment
      NodeGroup                                                = "application"
      "k8s.io/cluster-autoscaler/${local.cluster_name_unique}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                      = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}

# Spot node group - for batch processing and cost optimization
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-${local.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.spot_private[*].id
  instance_types  = var.spot_node_group_config.instance_types
  capacity_type   = "SPOT"

  scaling_config {
    desired_size = var.spot_node_group_config.desired_size
    max_size     = var.spot_node_group_config.max_size
    min_size     = var.spot_node_group_config.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "batch"
    environment = var.environment
    nodegroup   = "spot"
    capacity    = "spot"
  }

  taint {
    key    = "dedicated"
    value  = "spot"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name                                                     = "eks-spot-nodegroup-${local.environment_suffix}"
      Environment                                              = var.environment
      NodeGroup                                                = "spot"
      "k8s.io/cluster-autoscaler/${local.cluster_name_unique}" = var.enable_cluster_autoscaler ? "owned" : ""
      "k8s.io/cluster-autoscaler/enabled"                      = var.enable_cluster_autoscaler ? "true" : "false"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
}
