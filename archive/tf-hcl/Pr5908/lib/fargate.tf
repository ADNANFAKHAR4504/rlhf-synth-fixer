# IAM Role for Fargate Pod Execution
resource "aws_iam_role" "fargate_pod_execution" {
  name = "eks-fargate-pod-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks-fargate-pods.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "fargate-pod-execution-role-${var.environment_suffix}"
  }
}

# Attach required policy for Fargate Pod Execution
resource "aws_iam_role_policy_attachment" "fargate_pod_execution_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_pod_execution.name
}

# Additional policy for CloudWatch Logs
resource "aws_iam_role_policy" "fargate_cloudwatch_logs" {
  name = "fargate-cloudwatch-logs-${var.environment_suffix}"
  role = aws_iam_role.fargate_pod_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:CreateLogGroup",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/aws/eks/${local.cluster_name}/*"
      }
    ]
  })
}

# Additional policy for ECR access
resource "aws_iam_role_policy" "fargate_ecr_access" {
  name = "fargate-ecr-access-${var.environment_suffix}"
  role = aws_iam_role.fargate_pod_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Fargate Profile for kube-system namespace
resource "aws_eks_fargate_profile" "kube_system" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "kube-system-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "kube-system"
  }

  tags = {
    Name = "kube-system-fargate-profile-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy
  ]
}

# Fargate Profile for application namespace
resource "aws_eks_fargate_profile" "application" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "application-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "application"
  }

  tags = {
    Name = "application-fargate-profile-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy
  ]
}

# Fargate Profile for dev namespace
resource "aws_eks_fargate_profile" "dev" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "dev-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "dev"
    labels = {
      environment = "dev"
    }
  }

  tags = {
    Name = "dev-fargate-profile-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy
  ]
}

# Fargate Profile for prod namespace
resource "aws_eks_fargate_profile" "prod" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "prod-${var.environment_suffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "prod"
    labels = {
      environment = "prod"
    }
  }

  tags = {
    Name = "prod-fargate-profile-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy
  ]
}
