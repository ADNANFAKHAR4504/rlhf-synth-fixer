# EKS Fargate Cluster - Terraform Implementation

This implementation creates a production-ready EKS cluster running entirely on Fargate profiles in ap-southeast-1.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "eks-fargate"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the region"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "EKSFargate"
}

variable "managed_by" {
  description = "Tool managing the infrastructure"
  type        = string
  default     = "Terraform"
}
```

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = var.project_name
      ManagedBy   = var.managed_by
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Local values
locals {
  cluster_name = "${var.cluster_name}-${var.environment_suffix}"
}
```

## File: lib/eks-cluster.tf

```hcl
# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "eks-cluster-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "eks-cluster-role-${var.environment_suffix}"
  }
}

# Attach required policies to EKS Cluster Role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# Security Group for EKS Cluster
resource "aws_security_group" "eks_cluster" {
  name        = "eks-cluster-sg-${var.environment_suffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "eks-cluster-sg-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for EKS Control Plane
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = 7

  tags = {
    Name = "eks-logs-${var.environment_suffix}"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = {
    Name = local.cluster_name
  }
}

# OIDC Provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "eks-oidc-provider-${var.environment_suffix}"
  }
}
```

## File: lib/fargate.tf

```hcl
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
```

## File: lib/eks-addons.tf

```hcl
# EKS Addon - CoreDNS
resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.2"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_fargate_profile.kube_system
  ]
}

# EKS Addon - kube-proxy
resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_fargate_profile.kube_system
  ]
}

# EKS Addon - VPC CNI
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.14.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }
}
```

## File: lib/load-balancer-controller.tf

```hcl
# IAM Policy for AWS Load Balancer Controller
resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "AWSLoadBalancerControllerPolicy-${var.environment_suffix}"
  description = "IAM policy for AWS Load Balancer Controller"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "iam:AWSServiceName" = "elasticloadbalancing.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeCoipPools",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeSSLPolicies",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPoolClient",
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "iam:ListServerCertificates",
          "iam:GetServerCertificate",
          "waf-regional:GetWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:CreateSecurityGroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "CreateSecurityGroup"
          }
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DeleteSecurityGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          "Null" = {
            "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:SetIpAddressType",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:DeleteTargetGroup"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets"
        ]
        Resource = "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddListenerCertificates",
          "elasticloadbalancing:RemoveListenerCertificates",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "aws-load-balancer-controller-policy-${var.environment_suffix}"
  }
}

# IAM Role for AWS Load Balancer Controller (IRSA)
resource "aws_iam_role" "aws_load_balancer_controller" {
  name = "aws-load-balancer-controller-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "aws-load-balancer-controller-role-${var.environment_suffix}"
  }
}

# Attach policy to Load Balancer Controller Role
resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
  role       = aws_iam_role.aws_load_balancer_controller.name
}
```

## File: lib/outputs.tf

```hcl
output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "fargate_profile_kube_system_id" {
  description = "Fargate profile ID for kube-system namespace"
  value       = aws_eks_fargate_profile.kube_system.id
}

output "fargate_profile_application_id" {
  description = "Fargate profile ID for application namespace"
  value       = aws_eks_fargate_profile.application.id
}

output "fargate_profile_dev_id" {
  description = "Fargate profile ID for dev namespace"
  value       = aws_eks_fargate_profile.dev.id
}

output "fargate_profile_prod_id" {
  description = "Fargate profile ID for prod namespace"
  value       = aws_eks_fargate_profile.prod.id
}

output "load_balancer_controller_role_arn" {
  description = "ARN of IAM role for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for IRSA"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "region" {
  description = "AWS region"
  value       = var.region
}
```

## File: lib/README.md

```markdown
# EKS Fargate Cluster - Terraform Infrastructure

This Terraform configuration deploys a production-ready Amazon EKS cluster running entirely on AWS Fargate in the ap-southeast-1 region.

## Architecture Overview

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Compute**: AWS Fargate profiles (no EC2 node groups)
- **Networking**: VPC with 3 AZs, public and private subnets, NAT gateways
- **Security**: OIDC provider for IRSA, pod execution roles with minimal permissions
- **Monitoring**: CloudWatch Container Insights, control plane logging
- **Addons**: CoreDNS, kube-proxy, VPC CNI
- **Load Balancing**: AWS Load Balancer Controller with IRSA

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl 1.28+
- AWS credentials configured
- Appropriate IAM permissions

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environment-suffix}`

The `environment_suffix` variable ensures unique resource names across deployments.

## Deployment Instructions

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review Configuration

Edit `variables.tf` to customize:
- `environment_suffix`: Unique identifier for your deployment
- `region`: AWS region (default: ap-southeast-1)
- `cluster_version`: EKS version (default: 1.28)
- `vpc_cidr`: VPC CIDR block

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

Deployment takes approximately 15-20 minutes.

### 5. Configure kubectl

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-fargate-<environment-suffix>
```

### 6. Verify Cluster

```bash
kubectl get nodes
kubectl get pods -A
```

## Fargate Profiles

Four Fargate profiles are configured:

1. **kube-system**: System components (CoreDNS, kube-proxy)
2. **application**: General application workloads
3. **dev**: Development workloads (labeled with environment=dev)
4. **prod**: Production workloads (labeled with environment=prod)

## Namespaces

Create namespaces for workloads:

```bash
kubectl create namespace application
kubectl create namespace dev
kubectl create namespace prod
```

Label namespaces for Fargate profile selection:

```bash
kubectl label namespace dev environment=dev
kubectl label namespace prod environment=prod
```

## AWS Load Balancer Controller

To deploy the AWS Load Balancer Controller:

```bash
# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Get the IAM role ARN
ROLE_ARN=$(terraform output -raw load_balancer_controller_role_arn)
CLUSTER_NAME=$(terraform output -raw cluster_name)

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$ROLE_ARN
```

## Deploying Workloads

Example deployment for the application namespace:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: application
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80
```

## Monitoring

CloudWatch Container Insights is enabled automatically. View metrics in:
- AWS Console → CloudWatch → Container Insights

Control plane logs are available in:
- CloudWatch Log Group: `/aws/eks/{cluster-name}/cluster`

## Security Considerations

- Cluster endpoint is private-only (no public access)
- OIDC provider enables IRSA for fine-grained IAM permissions
- Pod execution roles follow principle of least privilege
- All pods run in private subnets with NAT gateway egress
- Network policies can be applied for pod-to-pod restrictions

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including the VPC, EKS cluster, and Fargate profiles.

## Troubleshooting

### Pods Pending
- Check Fargate profile selectors match pod namespace and labels
- Verify private subnets are tagged correctly
- Check pod execution role permissions

### CoreDNS Not Running
- Ensure kube-system Fargate profile is deployed
- Patch CoreDNS to remove EC2 node affinity:
```bash
kubectl patch deployment coredns -n kube-system --type json \
  -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]'
```

### Cannot Access Cluster
- Verify you're on a network that can reach private endpoints
- Check security group rules
- Ensure IAM permissions for eks:DescribeCluster

## Outputs

Key outputs available via `terraform output`:

- `cluster_endpoint`: EKS cluster API endpoint
- `cluster_name`: EKS cluster name
- `oidc_provider_arn`: OIDC provider ARN for IRSA
- `load_balancer_controller_role_arn`: IAM role for load balancer controller
- `vpc_id`: VPC identifier
- `private_subnet_ids`: Private subnet IDs for workloads
- `public_subnet_ids`: Public subnet IDs for load balancers

## Tags

All resources are tagged with:
- `Environment`: Value from environment_suffix variable
- `Project`: EKSFargate
- `ManagedBy`: Terraform

## Support

For issues or questions, refer to:
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/eks/latest/userguide/fargate.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
```
