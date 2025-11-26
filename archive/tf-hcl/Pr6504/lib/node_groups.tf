# AWS-managed EBS encryption key
data "aws_kms_alias" "ebs" {
  name = "alias/aws/ebs"
}

# Frontend Node Group
resource "aws_eks_node_group" "frontend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = local.frontend_node_group_name
  node_role_arn   = aws_iam_role.frontend_nodes.arn
  subnet_ids      = local.private_subnet_ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = 2
    max_size     = 6
    min_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }

  labels = {
    app  = "frontend"
    tier = "web"
  }

  taint {
    key    = "app"
    value  = "frontend"
    effect = "NO_SCHEDULE"
  }

  tags = merge(local.common_tags, {
    Name                                              = local.frontend_node_group_name
    "k8s.io/cluster-autoscaler/enabled"               = "true"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
  })

  lifecycle {
    prevent_destroy = false
    # If node groups exist from a previous failed deployment, import them:
    # terraform import aws_eks_node_group.frontend <cluster-name>:<node-group-name>
    # Or delete them manually via AWS CLI: aws eks delete-nodegroup --cluster-name <cluster> --nodegroup-name <name>
  }

  depends_on = [
    aws_iam_role.frontend_nodes,
    aws_iam_role_policy_attachment.frontend_worker_node_policy,
    aws_iam_role_policy_attachment.frontend_cni_policy,
    aws_iam_role_policy_attachment.frontend_ecr_ro,
    aws_iam_role_policy_attachment.frontend_node_ecr_access,
    aws_cloudwatch_log_group.eks
  ]
}

# Backend Node Group
resource "aws_eks_node_group" "backend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = local.backend_node_group_name
  node_role_arn   = aws_iam_role.backend_nodes.arn
  subnet_ids      = local.private_subnet_ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  labels = {
    app  = "backend"
    tier = "api"
  }

  taint {
    key    = "app"
    value  = "backend"
    effect = "NO_SCHEDULE"
  }

  tags = merge(local.common_tags, {
    Name                                              = local.backend_node_group_name
    "k8s.io/cluster-autoscaler/enabled"               = "true"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
  })

  lifecycle {
    prevent_destroy = false
    # If node groups exist from a previous failed deployment, import them:
    # terraform import aws_eks_node_group.backend <cluster-name>:<node-group-name>
    # Or delete them manually via AWS CLI: aws eks delete-nodegroup --cluster-name <cluster> --nodegroup-name <name>
  }

  depends_on = [
    aws_iam_role.backend_nodes,
    aws_iam_role_policy_attachment.backend_worker_node_policy,
    aws_iam_role_policy_attachment.backend_cni_policy,
    aws_iam_role_policy_attachment.backend_ecr_ro,
    aws_iam_role_policy_attachment.backend_node_ecr_access,
    aws_cloudwatch_log_group.eks
  ]
}

# Frontend Launch Template
resource "aws_launch_template" "frontend" {
  name_prefix = "${local.frontend_launch_template}-"

  instance_type = "t3.medium"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = data.aws_kms_alias.ebs.target_key_id # Use AWS-managed EBS key
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    security_groups             = [aws_security_group.eks_nodes.id]
    delete_on_termination       = true
    associate_public_ip_address = false
  }

  # Note: EKS managed node groups automatically handle bootstrap, so user_data is not needed
  # Labels and taints are configured in the aws_eks_node_group resource

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-frontend-node"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-frontend-node-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name = local.frontend_launch_template
  })
}

# Backend Launch Template
resource "aws_launch_template" "backend" {
  name_prefix = "${local.backend_launch_template}-"

  instance_type = "t3.large"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = data.aws_kms_alias.ebs.target_key_id # Use AWS-managed EBS key
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    security_groups             = [aws_security_group.eks_nodes.id]
    delete_on_termination       = true
    associate_public_ip_address = false
  }

  # Note: EKS managed node groups automatically handle bootstrap, so user_data is not needed
  # Labels and taints are configured in the aws_eks_node_group resource

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-backend-node"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-backend-node-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name = local.backend_launch_template
  })
}