# Launch Template for System Node Group
resource "aws_launch_template" "system" {
  name_prefix = "eks-system-node-${var.environment_suffix}-"
  description = "Launch template for EKS system node group"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name      = "eks-system-node-${var.environment_suffix}"
      NodeGroup = "system"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=normal,workload=system'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# System Node Group
resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_system[*].id

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 2
  }

  instance_types = ["t3.medium"]

  launch_template {
    id      = aws_launch_template.system.id
    version = aws_launch_template.system.latest_version
  }

  labels = {
    workload = "system"
  }

  taint {
    key    = "workload"
    value  = "system"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                              = "eks-system-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                               = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "system"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

# Launch Template for Application Node Group
resource "aws_launch_template" "application" {
  name_prefix = "eks-application-node-${var.environment_suffix}-"
  description = "Launch template for EKS application node group"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name      = "eks-application-node-${var.environment_suffix}"
      NodeGroup = "application"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=normal,workload=application'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Application Node Group
resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_application[*].id

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  instance_types = ["m5.large"]

  launch_template {
    id      = aws_launch_template.application.id
    version = aws_launch_template.application.latest_version
  }

  labels = {
    workload = "application"
  }

  taint {
    key    = "workload"
    value  = "application"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                              = "eks-application-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                               = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "application"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

# Launch Template for Spot Instance Node Group
resource "aws_launch_template" "spot" {
  name_prefix = "eks-spot-node-${var.environment_suffix}-"
  description = "Launch template for EKS spot instance node group"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name      = "eks-spot-node-${var.environment_suffix}"
      NodeGroup = "spot"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=spot,workload=batch'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Spot Instance Node Group
resource "aws_eks_node_group" "spot" {
  count = var.enable_spot_instances ? 1 : 0

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_spot[*].id

  scaling_config {
    desired_size = 2
    max_size     = 10
    min_size     = 0
  }

  instance_types = ["m5.large"]
  capacity_type  = "SPOT"

  launch_template {
    id      = aws_launch_template.spot.id
    version = aws_launch_template.spot.latest_version
  }

  labels = {
    workload = "batch"
  }

  taint {
    key    = "workload"
    value  = "batch"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                              = "eks-spot-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                               = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "batch"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}
