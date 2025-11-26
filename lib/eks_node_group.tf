# Launch template for node group
resource "aws_launch_template" "nodes" {
  name_prefix = "eks-nodes-${local.environment_suffix}-"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

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
      Name = "eks-node-${local.environment_suffix}"
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.toml.tpl", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "managed-nodes-${local.environment_suffix}"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = [for s in aws_subnet.private : s.id]

  ami_type       = "BOTTLEROCKET_x86_64"
  capacity_type  = "ON_DEMAND"
  instance_types = [var.node_instance_type]

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.nodes.id
    version = "$Latest"
  }

  tags = {
    Name                                              = "eks-node-group-${local.environment_suffix}"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"               = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_worker,
    aws_iam_role_policy_attachment.node_group_cni,
    aws_iam_role_policy_attachment.node_group_ecr,
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}
