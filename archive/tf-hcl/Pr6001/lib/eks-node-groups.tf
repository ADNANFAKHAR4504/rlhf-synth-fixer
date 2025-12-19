data "aws_ssm_parameter" "bottlerocket_ami" {
  name = "/aws/service/bottlerocket/aws-k8s-${var.kubernetes_version}/x86_64/latest/image_id"
}

data "aws_ssm_parameter" "bottlerocket_ami_gpu" {
  name = "/aws/service/bottlerocket/aws-k8s-${var.kubernetes_version}-nvidia/x86_64/latest/image_id"
}

resource "aws_launch_template" "system" {
  name_prefix = "eks-system-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami.value

  user_data = base64encode(templatefile("${path.module}/userdata/system-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

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
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-system-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-system-lt-${var.environment_suffix}"
  }
}

resource "aws_launch_template" "application" {
  name_prefix = "eks-app-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami.value

  user_data = base64encode(templatefile("${path.module}/userdata/app-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-app-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-app-lt-${var.environment_suffix}"
  }
}

resource "aws_launch_template" "gpu" {
  name_prefix = "eks-gpu-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami_gpu.value

  user_data = base64encode(templatefile("${path.module}/userdata/gpu-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-gpu-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-gpu-lt-${var.environment_suffix}"
  }
}

resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.system_node_group_desired_size
    max_size     = var.system_node_group_max_size
    min_size     = var.system_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.system.id
    version = "$Latest"
  }

  capacity_type  = "ON_DEMAND"
  instance_types = var.system_node_group_instance_types

  labels = {
    role = "system"
  }

  tags = {
    Name                                                     = "eks-system-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"                      = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.app_node_group_desired_size
    max_size     = var.app_node_group_max_size
    min_size     = var.app_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.application.id
    version = "$Latest"
  }

  capacity_type  = "SPOT"
  instance_types = var.app_node_group_instance_types

  labels = {
    role = "application"
  }

  tags = {
    Name                                                     = "eks-app-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"                      = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_eks_node_group" "gpu" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "gpu-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.gpu_node_group_desired_size
    max_size     = var.gpu_node_group_max_size
    min_size     = var.gpu_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.gpu.id
    version = "$Latest"
  }

  capacity_type  = "ON_DEMAND"
  instance_types = var.gpu_node_group_instance_types

  labels = {
    role                            = "gpu"
    "nvidia.com/gpu"                = "true"
    "k8s.amazonaws.com/accelerator" = "nvidia-tesla-t4"
  }

  taint {
    key    = "nvidia.com/gpu"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  tags = {
    Name                                                     = "eks-gpu-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"                      = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}
