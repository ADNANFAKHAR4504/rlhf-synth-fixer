terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== VPC ====================
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true
  enable_dns_support   = true

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    "kubernetes.io/role/elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ==================== EKS ====================
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "eks_node" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_node" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  ])

  role       = aws_iam_role.eks_node.name
  policy_arn = each.value
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  lifecycle {
    prevent_destroy = false
  }
}

# OIDC provider for EKS
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== RDS Aurora ====================
resource "aws_db_subnet_group" "main" {
  name       = "${var.db_cluster_identifier}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = var.db_cluster_identifier
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  skip_final_snapshot             = true
  deletion_protection             = false

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.db_cluster_identifier}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.small"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "rds" {
  name   = "${var.db_cluster_identifier}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ElastiCache ====================
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cache_cluster_id}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = var.cache_cluster_id
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.cache.id]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "cache" {
  name   = "${var.cache_cluster_id}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== Cognito ====================
resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.cognito_user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ECR ====================
resource "aws_ecr_repository" "services" {
  for_each = toset(var.ecr_repository_names)

  name = each.value

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== IAM Roles for CircleCI OIDC ====================
resource "aws_iam_role" "circleci_dev" {
  name = "circleci-dev-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "https://github.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/dev"
          }
        }
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_dev" {
  role       = aws_iam_role.circleci_dev.name
  policy_arn = aws_iam_policy.circleci_dev.arn
}

resource "aws_iam_policy" "circleci_dev" {
  name = "circleci-dev-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Similar for staging and prod, with different branch conditions

resource "aws_iam_role" "circleci_staging" {
  name = "circleci-staging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "https://github.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/staging"
          }
        }
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_staging" {
  role       = aws_iam_role.circleci_staging.name
  policy_arn = aws_iam_policy.circleci_staging.arn
}

resource "aws_iam_policy" "circleci_staging" {
  name = "circleci-staging-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:*",
          "ecr:*",
          "rds:*",
          "elasticache:*",
          "route53:*"
        ]
        Resource = "*"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "circleci_prod" {
  name = "circleci-prod-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "https://github.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_prod" {
  role       = aws_iam_role.circleci_prod.name
  policy_arn = aws_iam_policy.circleci_prod.arn
}

resource "aws_iam_policy" "circleci_prod" {
  name = "circleci-prod-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:*",
          "ecr:*",
          "rds:*",
          "elasticache:*",
          "route53:*",
          "cloudformation:*"
        ]
        Resource = "*"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}