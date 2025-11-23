# Launch Template for EKS Nodes
resource "aws_launch_template" "nodes" {
  name_prefix = "eks-node-${var.environment_suffix}-"
  description = "Launch template for EKS managed node group"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = var.node_disk_size
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      local.tags,
      {
        Name = "eks-node-${var.environment_suffix}"
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

# EKS Managed Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.node_instance_type]
  ami_type        = "AL2_ARM_64"

  scaling_config {
    min_size     = var.node_min_size
    max_size     = var.node_max_size
    desired_size = var.node_desired_size
  }

  update_config {
    max_unavailable_percentage = 33
  }

  launch_template {
    id      = aws_launch_template.nodes.id
    version = "$Latest"
  }

  labels = {
    role        = "worker"
    environment = var.environment_suffix
  }

  tags = {
    Name                                              = "eks-node-group-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"               = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_policy,
    aws_iam_role_policy_attachment.node_cni_policy,
    aws_iam_role_policy_attachment.node_container_registry,
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}
