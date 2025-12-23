# IAM Role for EKS Node Groups
resource "aws_iam_role" "eks_node_group" {
  name = "eks-node-group-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
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

resource "aws_iam_role_policy_attachment" "eks_ssm_managed_instance_core" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_node_group.name
}

# Security Group for Node Groups
resource "aws_security_group" "eks_nodes" {
  name        = "eks-nodes-sg-${var.environment_suffix}"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                                                                  = "eks-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "owned"
  }
}

resource "aws_security_group_rule" "nodes_ingress_self" {
  description              = "Allow nodes to communicate with each other"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_nodes.id
}

resource "aws_security_group_rule" "nodes_ingress_cluster" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_cluster.id
  security_group_id        = aws_security_group.eks_nodes.id
}

resource "aws_security_group_rule" "cluster_ingress_nodes_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_cluster.id
}

# Launch Template for Node Groups (for enhanced configuration)
resource "aws_launch_template" "eks_node_group" {
  name_prefix = "eks-node-group-${var.environment_suffix}-"
  description = "Launch template for EKS node groups"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
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

    tags = merge(
      var.tags,
      {
        Name              = "eks-node-${var.environment_suffix}"
        EnvironmentSuffix = var.environment_suffix
      }
    )
  }
}

# Frontend Node Group (t3.large)
# NOTE: Only one node group enabled for LocalStack compatibility
resource "aws_eks_node_group" "frontend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "frontend-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.frontend_instance_type]

  scaling_config {
    desired_size = var.node_group_desired_size
    max_size     = var.node_group_max_size
    min_size     = var.node_group_min_size
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.eks_node_group.id
    version = "$Latest"
  }

  labels = {
    role        = "frontend"
    environment = var.environment_suffix
  }

  tags = {
    Name                                                                      = "eks-frontend-nodegroup-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"                                       = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# NOTE: Backend and data_processing node groups disabled for LocalStack compatibility
# LocalStack has limitations with multiple EKS node groups
# Backend Node Group (m5.xlarge)
# resource "aws_eks_node_group" "backend" {
#   cluster_name    = aws_eks_cluster.main.name
#   node_group_name = "backend-${var.environment_suffix}"
#   node_role_arn   = aws_iam_role.eks_node_group.arn
#   subnet_ids      = aws_subnet.private[*].id
#   instance_types  = [var.backend_instance_type]
#
#   scaling_config {
#     desired_size = var.node_group_desired_size
#     max_size     = var.node_group_max_size
#     min_size     = var.node_group_min_size
#   }
#
#   update_config {
#     max_unavailable = 1
#   }
#
#   launch_template {
#     id      = aws_launch_template.eks_node_group.id
#     version = "$Latest"
#   }
#
#   labels = {
#     role        = "backend"
#     environment = var.environment_suffix
#   }
#
#   tags = {
#     Name                                                                      = "eks-backend-nodegroup-${var.environment_suffix}"
#     "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = "owned"
#     "k8s.io/cluster-autoscaler/enabled"                                       = "true"
#   }
#
#   depends_on = [
#     aws_iam_role_policy_attachment.eks_worker_node_policy,
#     aws_iam_role_policy_attachment.eks_cni_policy,
#     aws_iam_role_policy_attachment.eks_container_registry_policy,
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }

# Data Processing Node Group (c5.2xlarge)
# resource "aws_eks_node_group" "data_processing" {
#   cluster_name    = aws_eks_cluster.main.name
#   node_group_name = "data-processing-${var.environment_suffix}"
#   node_role_arn   = aws_iam_role.eks_node_group.arn
#   subnet_ids      = aws_subnet.private[*].id
#   instance_types  = [var.data_processing_instance_type]
#
#   scaling_config {
#     desired_size = var.node_group_desired_size
#     max_size     = var.node_group_max_size
#     min_size     = var.node_group_min_size
#   }
#
#   update_config {
#     max_unavailable = 1
#   }
#
#   launch_template {
#     id      = aws_launch_template.eks_node_group.id
#     version = "$Latest"
#   }
#
#   labels = {
#     role        = "data-processing"
#     environment = var.environment_suffix
#   }
#
#   tags = {
#     Name                                                                      = "eks-data-processing-nodegroup-${var.environment_suffix}"
#     "k8s.io/cluster-autoscaler/${var.cluster_name}-${var.environment_suffix}" = "owned"
#     "k8s.io/cluster-autoscaler/enabled"                                       = "true"
#   }
#
#   depends_on = [
#     aws_iam_role_policy_attachment.eks_worker_node_policy,
#     aws_iam_role_policy_attachment.eks_cni_policy,
#     aws_iam_role_policy_attachment.eks_container_registry_policy,
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }
