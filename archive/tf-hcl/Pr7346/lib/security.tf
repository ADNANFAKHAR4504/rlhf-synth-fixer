# ECR Repository for container images with vulnerability scanning
resource "aws_ecr_repository" "microservices" {
  name                 = "microservices-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }

  tags = {
    Name = "microservices-ecr-${var.environment_suffix}"
  }
}

# KMS key for ECR encryption
resource "aws_kms_key" "ecr" {
  description             = "KMS key for ECR encryption for ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "ecr-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/ecr-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecr.key_id
}

# ECR Lifecycle Policy to manage images
resource "aws_ecr_lifecycle_policy" "microservices" {
  repository = aws_ecr_repository.microservices.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Secrets Manager secret for application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "eks-app-secrets-${var.environment_suffix}"
  description             = "Application secrets for EKS microservices"
  recovery_window_in_days = 0

  tags = {
    Name = "eks-app-secrets-${var.environment_suffix}"
  }
}

# Example secret value (should be replaced with actual secrets)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = "changeme-use-real-secrets"
    api_key           = "changeme-use-real-secrets"
  })
}

# Network Policy ConfigMap for zero-trust communication
resource "kubernetes_config_map" "network_policy" {
  metadata {
    name      = "network-policy-config"
    namespace = "kube-system"
  }

  data = {
    "default-deny.yaml" = <<-EOT
      apiVersion: networking.k8s.io/v1
      kind: NetworkPolicy
      metadata:
        name: default-deny-all
        namespace: default
      spec:
        podSelector: {}
        policyTypes:
        - Ingress
        - Egress
    EOT

    "allow-dns.yaml" = <<-EOT
      apiVersion: networking.k8s.io/v1
      kind: NetworkPolicy
      metadata:
        name: allow-dns-access
        namespace: default
      spec:
        podSelector: {}
        policyTypes:
        - Egress
        egress:
        - to:
          - namespaceSelector:
              matchLabels:
                name: kube-system
          ports:
          - protocol: UDP
            port: 53
    EOT

    "allow-same-namespace.yaml" = <<-EOT
      apiVersion: networking.k8s.io/v1
      kind: NetworkPolicy
      metadata:
        name: allow-same-namespace
        namespace: default
      spec:
        podSelector: {}
        policyTypes:
        - Ingress
        ingress:
        - from:
          - podSelector: {}
    EOT
  }

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.frontend,
  ]
}

# Security group rules for pod-to-pod encryption
resource "aws_security_group_rule" "nodes_ingress_istio" {
  description              = "Allow Istio sidecar traffic between nodes"
  type                     = "ingress"
  from_port                = 15017
  to_port                  = 15017
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_nodes.id
}

# Optional: GuardDuty configuration (if enabled via variable)
resource "aws_guardduty_detector" "eks" {
  count = var.enable_guardduty ? 1 : 0

  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name = "eks-guardduty-${var.environment_suffix}"
  }
}

# IAM Policy for EKS Pod Identity Agent (for enhanced IRSA)
resource "aws_iam_policy" "pod_identity_agent" {
  name        = "eks-pod-identity-agent-policy-${var.environment_suffix}"
  description = "IAM policy for EKS Pod Identity Agent"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster"
        ]
        Resource = aws_eks_cluster.main.arn
      }
    ]
  })
}

# Additional security - VPC Endpoints to reduce NAT Gateway usage and improve security
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = {
    Name = "eks-s3-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "eks-ecr-api-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "eks-ecr-dkr-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "ec2" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "eks-ec2-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "eks-logs-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "sts" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sts"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "eks-sts-endpoint-${var.environment_suffix}"
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "eks-vpc-endpoints-sg-${var.environment_suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "eks-vpc-endpoints-sg-${var.environment_suffix}"
  }
}
