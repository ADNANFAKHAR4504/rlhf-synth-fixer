# IAM Role for Fargate Pod Execution
resource "aws_iam_role" "fargate_pod_execution" {
  name = "eks-fargate-pod-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks-fargate-pods.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "fargate_pod_execution_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_pod_execution.name
}

# Fargate Profile for coredns system workload
resource "aws_eks_fargate_profile" "coredns" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "coredns-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "kube-system"
    labels = {
      "k8s-app" = "kube-dns"
    }
  }

  tags = {
    Name = "eks-fargate-coredns-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}

# Fargate Profile for aws-load-balancer-controller system workload
resource "aws_eks_fargate_profile" "alb_controller" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "alb-controller-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "kube-system"
    labels = {
      "app.kubernetes.io/name" = "aws-load-balancer-controller"
    }
  }

  tags = {
    Name = "eks-fargate-alb-controller-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}

# Patch CoreDNS to run on Fargate
resource "null_resource" "patch_coredns" {
  provisioner "local-exec" {
    command = <<-EOT
      aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}
      kubectl patch deployment coredns \
        -n kube-system \
        --type json \
        -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]' || true
    EOT
  }

  depends_on = [
    aws_eks_fargate_profile.coredns,
    aws_eks_addon.coredns,
  ]
}
