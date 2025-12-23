# Production EKS Infrastructure - Terraform Implementation

This implementation provides a complete production-grade EKS cluster with enhanced security controls for fintech workloads.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for EKS cluster"
  type        = string
  default     = "us-east-2"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
  default     = "t3.large"
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 15
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones for the cluster"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "production_namespace_pod_quota" {
  description = "Maximum pods allowed in production namespace"
  type        = number
  default     = 100
}

variable "production_namespace_storage_quota" {
  description = "Maximum storage in production namespace"
  type        = string
  default     = "200Gi"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "terraform"
      Purpose     = "fintech-payment-processing"
    }
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = aws_eks_cluster.main.name
}

provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}
```

## File: lib/vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "eks-vpc-${var.environment_suffix}"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = {
    Name                                                        = "eks-private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/role/internal-elb"                           = "1"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "eks-igw-${var.environment_suffix}"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eks-nat-eip-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.private[0].id

  tags = {
    Name = "eks-nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "eks-private-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

## File: lib/vpc_endpoints.tf

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "s3-endpoint-${var.environment_suffix}"
  }
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "eks-vpc-endpoints-${var.environment_suffix}"
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
    description = "Allow all outbound"
  }

  tags = {
    Name = "vpc-endpoints-sg-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name = "ecr-api-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name = "ecr-dkr-endpoint-${var.environment_suffix}"
  }
}
```

## File: lib/iam_cluster.tf

```hcl
data "aws_iam_policy_document" "eks_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "eks_cluster" {
  name_prefix        = "eks-cluster-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.eks_assume_role.json

  tags = {
    Name = "eks-cluster-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}
```

## File: lib/iam_node_group.tf

```hcl
data "aws_iam_policy_document" "node_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "eks_node_group" {
  name_prefix        = "eks-node-group-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.node_assume_role.json

  tags = {
    Name = "eks-node-group-role-${var.environment_suffix}"
  }
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
```

## File: lib/iam_autoscaler.tf

```hcl
data "tls_certificate" "cluster" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "eks-oidc-provider-${var.environment_suffix}"
  }
}

data "aws_iam_policy_document" "cluster_autoscaler_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.cluster.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:cluster-autoscaler"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster_autoscaler" {
  name_prefix        = "eks-autoscaler-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cluster_autoscaler_assume_role.json

  tags = {
    Name = "cluster-autoscaler-role-${var.environment_suffix}"
  }
}

data "aws_iam_policy_document" "cluster_autoscaler" {
  statement {
    effect = "Allow"

    actions = [
      "autoscaling:DescribeAutoScalingGroups",
      "autoscaling:DescribeAutoScalingInstances",
      "autoscaling:DescribeLaunchConfigurations",
      "autoscaling:DescribeScalingActivities",
      "autoscaling:DescribeTags",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeLaunchTemplateVersions"
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "autoscaling:SetDesiredCapacity",
      "autoscaling:TerminateInstanceInAutoScalingGroup",
      "ec2:DescribeImages",
      "ec2:GetInstanceTypesFromInstanceRequirements",
      "eks:DescribeNodegroup"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name_prefix = "eks-autoscaler-policy-${var.environment_suffix}"
  description = "Policy for cluster autoscaler"
  policy      = data.aws_iam_policy_document.cluster_autoscaler.json

  tags = {
    Name = "cluster-autoscaler-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}
```

## File: lib/iam_alb_controller.tf

```hcl
data "aws_iam_policy_document" "alb_controller_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.cluster.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "alb_controller" {
  name_prefix        = "eks-alb-controller-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.alb_controller_assume_role.json

  tags = {
    Name = "alb-controller-role-${var.environment_suffix}"
  }
}

resource "aws_iam_policy" "alb_controller" {
  name_prefix = "eks-alb-controller-policy-${var.environment_suffix}"
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
      }
    ]
  })

  tags = {
    Name = "alb-controller-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "alb_controller" {
  policy_arn = aws_iam_policy.alb_controller.arn
  role       = aws_iam_role.alb_controller.name
}
```

## File: lib/iam_ebs_csi.tf

```hcl
data "aws_iam_policy_document" "ebs_csi_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.cluster.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ebs_csi" {
  name_prefix        = "eks-ebs-csi-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume_role.json

  tags = {
    Name = "ebs-csi-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi.name
}
```

## File: lib/eks_cluster.tf

```hcl
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/eks-cluster-${var.environment_suffix}/cluster"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "eks-cluster-logs-${var.environment_suffix}"
  }
}

resource "aws_security_group" "eks_cluster" {
  name_prefix = "eks-cluster-sg-${var.environment_suffix}"
  description = "Security group for EKS cluster"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "eks-cluster-sg-${var.environment_suffix}"
  }
}

resource "aws_security_group_rule" "cluster_ingress_node" {
  description              = "Allow worker nodes to communicate with cluster API"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
  type                     = "ingress"
}

resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = {
    Name = "eks-cluster-${var.environment_suffix}"
  }
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_create = "OVERWRITE"

  configuration_values = jsonencode({
    env = {
      ENABLE_POD_ENI                    = "true"
      ENABLE_PREFIX_DELEGATION          = "true"
      POD_SECURITY_GROUP_ENFORCING_MODE = "standard"
      AWS_VPC_K8S_CNI_EXTERNALSNAT      = "false"
      ENABLE_NETWORK_POLICY             = "true"
    }
  })

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi.arn
  resolve_conflicts_on_create = "OVERWRITE"

  configuration_values = jsonencode({
    controller = {
      extraVolumeTags = {
        Environment = var.environment_suffix
      }
      defaultFsType = "ext4"
    }
    storageClasses = [
      {
        name       = "ebs-gp3-encrypted"
        parameters = {
          type      = "gp3"
          encrypted = "true"
        }
        volumeBindingMode = "WaitForFirstConsumer"
      }
    ]
  })

  tags = {
    Name = "ebs-csi-addon-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }
}
```

## File: lib/eks_node_group.tf

```hcl
resource "aws_security_group" "eks_nodes" {
  name_prefix = "eks-nodes-sg-${var.environment_suffix}"
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
    Name                                                        = "eks-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
  }
}

resource "aws_security_group_rule" "nodes_internal" {
  description              = "Allow nodes to communicate with each other"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_nodes.id
  type                     = "ingress"
}

resource "aws_security_group_rule" "nodes_cluster_ingress" {
  description              = "Allow worker Kubelets and pods to receive communication from cluster control plane"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
  type                     = "ingress"
}

data "aws_ssm_parameter" "bottlerocket_ami" {
  name = "/aws/service/bottlerocket/aws-k8s-${var.cluster_version}/x86_64/latest/image_id"
}

resource "aws_launch_template" "eks_nodes" {
  name_prefix = "eks-nodes-${var.environment_suffix}"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami.value

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  block_device_mappings {
    device_name = "/dev/xvdb"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "eks-node-${var.environment_suffix}"
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/bottlerocket-userdata.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  tags = {
    Name = "eks-node-launch-template-${var.environment_suffix}"
  }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "bottlerocket-nodes-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  instance_types = [var.node_instance_type]
  capacity_type  = "ON_DEMAND"

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name = "bottlerocket-node-group-${var.environment_suffix}"
  }
}
```

## File: lib/helm_releases.tf

```hcl
resource "helm_release" "alb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.6.2"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.alb_controller.arn
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = aws_vpc.main.id
  }

  depends_on = [aws_eks_node_group.main]
}

resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = "9.29.3"

  set {
    name  = "autoDiscovery.clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "awsRegion"
    value = var.aws_region
  }

  set {
    name  = "rbac.serviceAccount.create"
    value = "true"
  }

  set {
    name  = "rbac.serviceAccount.name"
    value = "cluster-autoscaler"
  }

  set {
    name  = "rbac.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.cluster_autoscaler.arn
  }

  set {
    name  = "extraArgs.scale-down-enabled"
    value = "true"
  }

  set {
    name  = "extraArgs.balance-similar-node-groups"
    value = "true"
  }

  set {
    name  = "extraArgs.skip-nodes-with-system-pods"
    value = "false"
  }

  set {
    name  = "extraArgs.expander"
    value = "least-waste"
  }

  depends_on = [aws_eks_node_group.main]
}
```

## File: lib/kubernetes_resources.tf

```hcl
resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"

    labels = {
      name              = "production"
      environment       = var.environment_suffix
      "elbv2.k8s.aws/pod-readiness-gate-inject" = "enabled"
    }
  }

  depends_on = [aws_eks_node_group.main]
}

resource "kubernetes_resource_quota" "production" {
  metadata {
    name      = "production-quota"
    namespace = kubernetes_namespace.production.metadata[0].name
  }

  spec {
    hard = {
      pods                                   = var.production_namespace_pod_quota
      "requests.storage"                     = var.production_namespace_storage_quota
      "persistentvolumeclaims"               = "50"
      "requests.cpu"                         = "100"
      "requests.memory"                      = "200Gi"
      "limits.cpu"                           = "200"
      "limits.memory"                        = "400Gi"
    }
  }

  depends_on = [kubernetes_namespace.production]
}

resource "kubernetes_limit_range" "production" {
  metadata {
    name      = "production-limit-range"
    namespace = kubernetes_namespace.production.metadata[0].name
  }

  spec {
    limit {
      type = "Pod"
      max = {
        cpu    = "4"
        memory = "8Gi"
      }
      min = {
        cpu    = "50m"
        memory = "128Mi"
      }
    }

    limit {
      type = "Container"
      default = {
        cpu    = "500m"
        memory = "512Mi"
      }
      default_request = {
        cpu    = "100m"
        memory = "256Mi"
      }
      max = {
        cpu    = "2"
        memory = "4Gi"
      }
      min = {
        cpu    = "50m"
        memory = "128Mi"
      }
    }
  }

  depends_on = [kubernetes_namespace.production]
}
```

## File: lib/cloudwatch.tf

```hcl
resource "aws_iam_role" "cloudwatch_agent" {
  name_prefix = "eks-cloudwatch-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.cluster.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub" = "system:serviceaccount:amazon-cloudwatch:cloudwatch-agent"
            "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cloudwatch-agent-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role       = aws_iam_role.cloudwatch_agent.name
}

resource "helm_release" "cloudwatch_observability" {
  name       = "amazon-cloudwatch-observability"
  repository = "https://aws-observability.github.io/aws-observability-helm-charts"
  chart      = "amazon-cloudwatch-observability"
  namespace  = "amazon-cloudwatch"
  version    = "0.1.8"

  create_namespace = true

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "cloudwatch-agent"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.cloudwatch_agent.arn
  }

  depends_on = [aws_eks_node_group.main]
}
```

## File: lib/templates/bottlerocket-userdata.toml

```toml
[settings]
[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
"bottlerocket.aws/updater-interface-version" = "2.0.0"

[settings.kubernetes.node-taints]

[settings.updates]
metadata-time-to-refresh = "12h"
targets-request-timeout = "60s"
ignore-waves = false
```

## File: lib/outputs.tf

```hcl
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = try(aws_eks_cluster.main.identity[0].oidc[0].issuer, null)
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "node_group_id" {
  description = "EKS node group ID"
  value       = aws_eks_node_group.main.id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "s3_vpc_endpoint_id" {
  description = "S3 VPC Endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "ecr_api_vpc_endpoint_id" {
  description = "ECR API VPC Endpoint ID"
  value       = aws_vpc_endpoint.ecr_api.id
}

output "ecr_dkr_vpc_endpoint_id" {
  description = "ECR Docker VPC Endpoint ID"
  value       = aws_vpc_endpoint.ecr_dkr.id
}

output "kubeconfig_update_command" {
  description = "Command to update kubeconfig for kubectl access"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

output "cluster_autoscaler_role_arn" {
  description = "IAM role ARN for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "alb_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.alb_controller.arn
}

output "ebs_csi_role_arn" {
  description = "IAM role ARN for EBS CSI driver"
  value       = aws_iam_role.ebs_csi.arn
}
```

## File: lib/README.md

```markdown
# Production EKS Infrastructure for Fintech Payment Processing

This Terraform configuration deploys a production-grade Amazon EKS cluster with enhanced security controls suitable for PCI DSS compliance requirements.

## Architecture Overview

The infrastructure includes:

- **EKS Cluster**: Version 1.28 with private-only API endpoint
- **Worker Nodes**: Bottlerocket AMI on t3.large instances across 3 AZs
- **Autoscaling**: Cluster Autoscaler with IRSA (3-15 nodes based on CPU)
- **Networking**: VPC with private subnets, VPC endpoints for S3/ECR
- **Security**: Pod security groups, network policies, encrypted storage
- **Monitoring**: CloudWatch Container Insights with 30-day retention
- **Controllers**: AWS Load Balancer Controller, EBS CSI Driver

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl 1.28+
- Appropriate AWS credentials with EKS permissions

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Set Required Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "prod-001"
aws_region         = "us-east-2"
cluster_version    = "1.28"
node_instance_type = "t3.large"
node_min_size      = 3
node_max_size      = 15
node_desired_size  = 3
```

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

After deployment, update your kubeconfig:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-<environment-suffix>
```

Verify connectivity:

```bash
kubectl get nodes
kubectl get pods -A
```

## Key Features

### Security

- **Private API Endpoint**: No public internet exposure
- **Bottlerocket OS**: Minimal attack surface, immutable infrastructure
- **IRSA**: IAM roles for service accounts (no node-level credentials)
- **Network Policies**: Pod-to-pod encryption via VPC CNI
- **Encrypted Storage**: All EBS volumes encrypted at rest

### Cost Optimization

- **VPC Endpoints**: S3 and ECR endpoints eliminate NAT Gateway data charges
- **Bottlerocket**: Reduced node resource overhead
- **Cluster Autoscaler**: Scale down during low usage

### High Availability

- **Multi-AZ**: Resources distributed across 3 availability zones
- **Managed Node Groups**: Automated node replacement and updates
- **Load Balancing**: AWS ALB Controller for application traffic

### Monitoring

- **Container Insights**: Cluster and pod-level metrics
- **Control Plane Logs**: API, audit, authenticator logs
- **30-Day Retention**: Compliance-ready log retention

## Production Namespace

A pre-configured `production` namespace is created with:

- **Pod Quota**: Maximum 100 pods
- **Storage Quota**: Maximum 200Gi
- **Resource Limits**: CPU and memory constraints
- **Resource Requests**: Default values for containers

Deploy applications:

```bash
kubectl apply -f your-app.yaml -n production
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete the EKS cluster and all associated resources.

## Scaling

The cluster autoscaler automatically scales based on CPU utilization:

- **Minimum**: 3 nodes
- **Maximum**: 15 nodes
- **Trigger**: Pod scheduling failures or CPU pressure

Manual scaling:

```bash
kubectl scale deployment your-app --replicas=10 -n production
```

## Troubleshooting

### Nodes Not Ready

```bash
kubectl get nodes
kubectl describe node <node-name>
```

Check node group status:

```bash
aws eks describe-nodegroup --cluster-name eks-cluster-<suffix> --nodegroup-name bottlerocket-nodes-<suffix>
```

### Pod Scheduling Issues

Check resource quotas:

```bash
kubectl describe resourcequota -n production
kubectl top pods -n production
```

### ALB Controller Issues

Check controller logs:

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Cluster Autoscaler Not Scaling

Check autoscaler logs:

```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

Verify IAM role:

```bash
kubectl describe sa cluster-autoscaler -n kube-system
```

## Security Compliance

This configuration supports PCI DSS compliance through:

- Private-only API endpoint (no public exposure)
- Encrypted storage (EBS volumes)
- Network segmentation (security groups, network policies)
- Audit logging (control plane logs to CloudWatch)
- IRSA for least-privilege access
- Immutable infrastructure (Bottlerocket)

## Additional Resources

- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Bottlerocket Documentation](https://bottlerocket.dev/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)

## Support

For issues or questions, refer to:
- AWS EKS documentation
- Terraform AWS provider documentation
- Kubernetes documentation
```
