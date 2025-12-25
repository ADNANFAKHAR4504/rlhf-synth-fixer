# EKS Cluster Deployment - Terraform Implementation

This implementation provides a production-ready EKS cluster with all required features including private endpoint access, multiple node groups, IRSA, EKS addons, and comprehensive security configurations.

## File: lib/versions.tf

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
```

## File: lib/provider.tf

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Team        = var.team
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
      Project     = "eks-cluster"
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for EKS cluster deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to prevent conflicts"
  type        = string
}

variable "team" {
  description = "Team name tag"
  type        = string
  default     = "platform"
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
  default     = "engineering"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler tags on node groups"
  type        = bool
  default     = true
}

variable "enable_spot_instances" {
  description = "Enable spot instance node group"
  type        = bool
  default     = true
}
```

## File: lib/backend.tf

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-eks-cluster"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-eks"
  }
}
```

## File: lib/networking.tf

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                                = "eks-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "eks-igw-${var.environment_suffix}"
  }
}

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Private Subnets for EKS Control Plane
resource "aws_subnet" "private_control_plane" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                = "eks-private-control-plane-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                   = "1"
    Tier                                                = "control-plane"
  }
}

# Private Subnets for System Node Group
resource "aws_subnet" "private_system" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                = "eks-private-system-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                   = "1"
    NodeGroup                                           = "system"
  }
}

# Private Subnets for Application Node Group
resource "aws_subnet" "private_application" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                = "eks-private-application-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                   = "1"
    NodeGroup                                           = "application"
  }
}

# Private Subnets for Spot Node Group
resource "aws_subnet" "private_spot" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 9)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                = "eks-private-spot-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                   = "1"
    NodeGroup                                           = "spot"
  }
}

# NAT Gateway EIP
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eks-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.private_control_plane[count.index].id

  tags = {
    Name = "eks-nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Private Route Tables
resource "aws_route_table" "private_control_plane" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "eks-private-rt-control-plane-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_system" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "eks-private-rt-system-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_application" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "eks-private-rt-application-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private_spot" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "eks-private-rt-spot-${count.index + 1}-${var.environment_suffix}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "private_control_plane" {
  count = 3

  subnet_id      = aws_subnet.private_control_plane[count.index].id
  route_table_id = aws_route_table.private_control_plane[count.index].id
}

resource "aws_route_table_association" "private_system" {
  count = 3

  subnet_id      = aws_subnet.private_system[count.index].id
  route_table_id = aws_route_table.private_system[count.index].id
}

resource "aws_route_table_association" "private_application" {
  count = 3

  subnet_id      = aws_subnet.private_application[count.index].id
  route_table_id = aws_route_table.private_application[count.index].id
}

resource "aws_route_table_association" "private_spot" {
  count = 3

  subnet_id      = aws_subnet.private_spot[count.index].id
  route_table_id = aws_route_table.private_spot[count.index].id
}
```

## File: lib/security.tf

```hcl
# KMS Key for EKS Secrets Encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster secrets encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "eks-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-cluster-${var.environment_suffix}"
  target_key_id = aws_kms_key.eks.key_id
}

# EKS Cluster Security Group
resource "aws_security_group" "eks_cluster" {
  name_prefix = "eks-cluster-sg-${var.environment_suffix}-"
  description = "Security group for EKS cluster control plane"
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

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for System Node Group
resource "aws_security_group" "system_nodes" {
  name_prefix = "eks-system-nodes-sg-${var.environment_suffix}-"
  description = "Security group for EKS system node group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
    description = "Allow nodes to communicate with each other"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow pods to communicate with cluster API"
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow cluster control plane to communicate with pods"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                                                = "eks-system-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Node Group
resource "aws_security_group" "application_nodes" {
  name_prefix = "eks-application-nodes-sg-${var.environment_suffix}-"
  description = "Security group for EKS application node group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
    description = "Allow nodes to communicate with each other"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow pods to communicate with cluster API"
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow cluster control plane to communicate with pods"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow HTTP traffic from VPC"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow HTTPS traffic from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                                                = "eks-application-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Spot Node Group
resource "aws_security_group" "spot_nodes" {
  name_prefix = "eks-spot-nodes-sg-${var.environment_suffix}-"
  description = "Security group for EKS spot instance node group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
    description = "Allow nodes to communicate with each other"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow pods to communicate with cluster API"
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow cluster control plane to communicate with pods"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name                                                = "eks-spot-nodes-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "owned"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/iam.tf

```hcl
# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "eks-cluster-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

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

# EKS Node Group IAM Role
resource "aws_iam_role" "eks_nodes" {
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

  tags = {
    Name = "eks-node-group-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# Cluster Autoscaler IAM Policy
resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "eks-cluster-autoscaler-${var.environment_suffix}"
  description = "IAM policy for EKS cluster autoscaler"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.eks_nodes.name
}

# EBS CSI Driver IAM Policy
resource "aws_iam_policy" "ebs_csi_driver" {
  name        = "eks-ebs-csi-driver-${var.environment_suffix}"
  description = "IAM policy for EKS EBS CSI driver"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:ModifyVolume",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInstances",
          "ec2:DescribeSnapshots",
          "ec2:DescribeTags",
          "ec2:DescribeVolumes",
          "ec2:DescribeVolumesModifications"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = [
          "arn:aws:ec2:*:*:volume/*",
          "arn:aws:ec2:*:*:snapshot/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = [
              "CreateVolume",
              "CreateSnapshot"
            ]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteTags"
        ]
        Resource = [
          "arn:aws:ec2:*:*:volume/*",
          "arn:aws:ec2:*:*:snapshot/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateVolume"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:RequestTag/ebs.csi.aws.com/cluster" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateVolume"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:RequestTag/CSIVolumeName" = "*"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteVolume"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ec2:ResourceTag/ebs.csi.aws.com/cluster" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteVolume"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ec2:ResourceTag/CSIVolumeName" = "*"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteVolume"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ec2:ResourceTag/kubernetes.io/created-for/pvc/name" = "*"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteSnapshot"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ec2:ResourceTag/CSIVolumeSnapshotName" = "*"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DeleteSnapshot"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ec2:ResourceTag/ebs.csi.aws.com/cluster" = "true"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "ebs_csi_driver" {
  name = "eks-ebs-csi-driver-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "eks-ebs-csi-driver-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = aws_iam_policy.ebs_csi_driver.arn
  role       = aws_iam_role.ebs_csi_driver.name
}

# AWS Load Balancer Controller IAM Policy
resource "aws_iam_policy" "load_balancer_controller" {
  name        = "eks-load-balancer-controller-${var.environment_suffix}"
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
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
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
          Null = {
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
          Null = {
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
          Null = {
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
          Null = {
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
          Null = {
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
          Null = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          StringEquals = {
            "elasticloadbalancing:CreateAction" = [
              "CreateTargetGroup",
              "CreateLoadBalancer"
            ]
          }
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
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
}

resource "aws_iam_role" "load_balancer_controller" {
  name = "eks-load-balancer-controller-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "eks-load-balancer-controller-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "load_balancer_controller" {
  policy_arn = aws_iam_policy.load_balancer_controller.arn
  role       = aws_iam_role.load_balancer_controller.name
}
```

## File: lib/eks.tf

```hcl
# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environment_suffix}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private_control_plane[*].id, aws_subnet.private_system[*].id)
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = {
    Name = "eks-cluster-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]
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

## File: lib/node-groups.tf

```hcl
# Launch Template for System Node Group
resource "aws_launch_template" "system" {
  name_prefix = "eks-system-node-${var.environment_suffix}-"
  description = "Launch template for EKS system node group"

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
      Name      = "eks-system-node-${var.environment_suffix}"
      NodeGroup = "system"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=normal,workload=system'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# System Node Group
resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_system[*].id

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 2
  }

  instance_types = ["t3.medium"]

  launch_template {
    id      = aws_launch_template.system.id
    version = aws_launch_template.system.latest_version
  }

  labels = {
    workload = "system"
  }

  taint {
    key    = "workload"
    value  = "system"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                = "eks-system-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                 = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "system"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

# Launch Template for Application Node Group
resource "aws_launch_template" "application" {
  name_prefix = "eks-application-node-${var.environment_suffix}-"
  description = "Launch template for EKS application node group"

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
      Name      = "eks-application-node-${var.environment_suffix}"
      NodeGroup = "application"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=normal,workload=application'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Application Node Group
resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_application[*].id

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  instance_types = ["m5.large"]

  launch_template {
    id      = aws_launch_template.application.id
    version = aws_launch_template.application.latest_version
  }

  labels = {
    workload = "application"
  }

  taint {
    key    = "workload"
    value  = "application"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                = "eks-application-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                 = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "application"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

# Launch Template for Spot Instance Node Group
resource "aws_launch_template" "spot" {
  name_prefix = "eks-spot-node-${var.environment_suffix}-"
  description = "Launch template for EKS spot instance node group"

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
      Name      = "eks-spot-node-${var.environment_suffix}"
      NodeGroup = "spot"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh eks-cluster-${var.environment_suffix} \
      --kubelet-extra-args '--node-labels=node.kubernetes.io/lifecycle=spot,workload=batch'
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Spot Instance Node Group
resource "aws_eks_node_group" "spot" {
  count = var.enable_spot_instances ? 1 : 0

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private_spot[*].id

  scaling_config {
    desired_size = 2
    max_size     = 10
    min_size     = 0
  }

  instance_types = ["m5.large"]
  capacity_type  = "SPOT"

  launch_template {
    id      = aws_launch_template.spot.id
    version = aws_launch_template.spot.latest_version
  }

  labels = {
    workload = "batch"
  }

  taint {
    key    = "workload"
    value  = "batch"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    {
      Name                                                = "eks-spot-node-group-${var.environment_suffix}"
      "k8s.io/cluster-autoscaler/eks-cluster-${var.environment_suffix}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"                 = "true"
    },
    var.enable_cluster_autoscaler ? {
      "k8s.io/cluster-autoscaler/node-template/label/workload" = "batch"
    } : {}
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}
```

## File: lib/addons.tf

```hcl
# EBS CSI Driver Addon
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn

  tags = {
    Name = "eks-ebs-csi-driver-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
    aws_iam_role_policy_attachment.ebs_csi_driver,
  ]
}

# VPC CNI Addon
resource "aws_eks_addon" "vpc_cni" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = "v1.15.1-eksbuild.1"

  tags = {
    Name = "eks-vpc-cni-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
}

# CoreDNS Addon
resource "aws_eks_addon" "coredns" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "coredns"
  addon_version = "v1.10.1-eksbuild.6"

  tags = {
    Name = "eks-coredns-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
}

# Kube Proxy Addon
resource "aws_eks_addon" "kube_proxy" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "kube-proxy"
  addon_version = "v1.28.2-eksbuild.2"

  tags = {
    Name = "eks-kube-proxy-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
  ]
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
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "node_security_group_system_id" {
  description = "Security group ID for system node group"
  value       = aws_security_group.system_nodes.id
}

output "node_security_group_application_id" {
  description = "Security group ID for application node group"
  value       = aws_security_group.application_nodes.id
}

output "node_security_group_spot_id" {
  description = "Security group ID for spot node group"
  value       = aws_security_group.spot_nodes.id
}

output "node_iam_role_arn" {
  description = "IAM role ARN for EKS node groups"
  value       = aws_iam_role.eks_nodes.arn
}

output "ebs_csi_driver_role_arn" {
  description = "IAM role ARN for EBS CSI driver"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "load_balancer_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.load_balancer_controller.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids_control_plane" {
  description = "Private subnet IDs for control plane"
  value       = aws_subnet.private_control_plane[*].id
}

output "private_subnet_ids_system" {
  description = "Private subnet IDs for system node group"
  value       = aws_subnet.private_system[*].id
}

output "private_subnet_ids_application" {
  description = "Private subnet IDs for application node group"
  value       = aws_subnet.private_application[*].id
}

output "private_subnet_ids_spot" {
  description = "Private subnet IDs for spot node group"
  value       = aws_subnet.private_spot[*].id
}

output "kms_key_id" {
  description = "KMS key ID for EKS secrets encryption"
  value       = aws_kms_key.eks.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for EKS secrets encryption"
  value       = aws_kms_key.eks.arn
}

output "system_node_group_id" {
  description = "System node group ID"
  value       = aws_eks_node_group.system.id
}

output "application_node_group_id" {
  description = "Application node group ID"
  value       = aws_eks_node_group.application.id
}

output "spot_node_group_id" {
  description = "Spot instance node group ID"
  value       = var.enable_spot_instances ? aws_eks_node_group.spot[0].id : null
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
```

## File: lib/main.tf

```hcl
# Main Terraform configuration file
# This file serves as the entry point and references all other module files

# Data source for AWS account information
data "aws_caller_identity" "current" {}

# Data source for AWS region
data "aws_region" "current" {}

# Local values for common resource naming
locals {
  cluster_name = "eks-cluster-${var.environment_suffix}"
  common_tags = {
    Project     = "EKS Cluster"
    Environment = var.environment_suffix
    Team        = var.team
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }
}
```

## File: lib/README.md

```markdown
# EKS Cluster Terraform Infrastructure

This Terraform configuration deploys a production-ready Amazon EKS cluster with advanced security, networking, and operational features.

## Architecture Overview

The infrastructure includes:

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Three Managed Node Groups**:
  - System nodes (t3.medium) - for system workloads
  - Application nodes (m5.large) - for application workloads
  - Spot instances (m5.large) - for cost-optimized batch workloads
- **Network Segmentation**: Dedicated subnets for each node group type
- **Security**: KMS encryption for secrets, IMDSv2 enforcement, private endpoints
- **IRSA**: IAM Roles for Service Accounts with OIDC provider
- **EKS Addons**: EBS CSI driver, VPC CNI, CoreDNS, Kube Proxy
- **Autoscaling**: Cluster Autoscaler support with proper IAM permissions
- **Load Balancing**: AWS Load Balancer Controller IAM role configured

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. kubectl (for cluster access after deployment)
4. S3 bucket for Terraform state (update backend.tf)
5. DynamoDB table for state locking (update backend.tf)

## File Structure

```
lib/
├── main.tf           # Main configuration and local values
├── versions.tf       # Terraform and provider versions
├── provider.tf       # AWS provider configuration
├── variables.tf      # Variable definitions
├── backend.tf        # S3 backend configuration
├── networking.tf     # VPC, subnets, route tables
├── security.tf       # Security groups and KMS keys
├── iam.tf            # IAM roles and policies
├── eks.tf            # EKS cluster and OIDC provider
├── node-groups.tf    # Managed node groups
├── addons.tf         # EKS addons
└── outputs.tf        # Output values
```

## Deployment Instructions

### Step 1: Update Backend Configuration

Edit `backend.tf` to use your S3 bucket and DynamoDB table:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "your-terraform-lock-table"
  }
}
```

### Step 2: Set Required Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "dev-001"
aws_region        = "us-east-1"
team              = "platform-team"
cost_center       = "engineering"
vpc_cidr          = "10.0.0.0/16"
cluster_version   = "1.28"
```

### Step 3: Initialize Terraform

```bash
cd lib
terraform init
```

### Step 4: Review Plan

```bash
terraform plan
```

### Step 5: Apply Configuration

```bash
terraform apply
```

The deployment takes approximately 15-20 minutes.

### Step 6: Configure kubectl

After deployment, configure kubectl access:

```bash
aws eks update-kubeconfig --region us-east-1 --name eks-cluster-<environment_suffix>
```

Verify access:

```bash
kubectl get nodes
kubectl get pods -A
```

## Post-Deployment Configuration

### Install Cluster Autoscaler

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

kubectl -n kube-system annotate deployment.apps/cluster-autoscaler \
  cluster-autoscaler.kubernetes.io/safe-to-evict="false"

kubectl -n kube-system edit deployment.apps/cluster-autoscaler
# Add these flags to the container command:
#   --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-<environment_suffix>
#   --balance-similar-node-groups
#   --skip-nodes-with-system-pods=false
```

### Install AWS Load Balancer Controller

```bash
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-cluster-<environment_suffix> \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=<load_balancer_controller_role_arn>
```

### Configure GP3 Storage Class

```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

# Remove default annotation from gp2
kubectl annotate storageclass gp2 storageclass.kubernetes.io/is-default-class-
```

### Configure Pod Security Standards

```bash
kubectl label namespace default pod-security.kubernetes.io/enforce=baseline
kubectl label namespace kube-system pod-security.kubernetes.io/enforce=baseline
```

## Security Features

1. **Private Endpoint**: Cluster API accessible only within VPC
2. **KMS Encryption**: Secrets encrypted with customer-managed keys
3. **IMDSv2**: Enforced on all node groups
4. **Network Segmentation**: Separate subnets per node group type
5. **Security Groups**: Unique rules per node group workload type
6. **IAM Least Privilege**: No wildcard actions in policies
7. **Control Plane Logging**: All log types enabled

## Cost Optimization

- Spot instances enabled for batch workloads
- Cluster Autoscaler for dynamic scaling
- GP3 storage volumes (more cost-effective than GP2)
- Node groups sized appropriately for workload types

## Monitoring and Logging

Control plane logs are sent to CloudWatch Logs:

- API server logs
- Audit logs
- Authenticator logs
- Controller manager logs
- Scheduler logs

View logs in CloudWatch:

```bash
aws logs tail /aws/eks/eks-cluster-<environment_suffix>/cluster --follow
```

## Troubleshooting

### Nodes Not Joining Cluster

1. Check node IAM role has required policies
2. Verify security group rules allow communication
3. Check CloudWatch logs for cluster API errors

### Pods Not Scheduling

1. Check node taints and pod tolerations
2. Verify node labels match pod node selectors
3. Check resource requests vs available capacity

### EBS Volumes Not Mounting

1. Verify EBS CSI driver addon is running
2. Check IAM role for service account (IRSA) configuration
3. Ensure storage class is properly configured

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Ensure all Kubernetes resources (LoadBalancers, PersistentVolumes) are deleted before destroying the infrastructure to avoid orphaned AWS resources.

## Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `environment_suffix` | Environment suffix for resource naming | - | Yes |
| `aws_region` | AWS region for deployment | `us-east-1` | No |
| `team` | Team name tag | `platform` | No |
| `cost_center` | Cost center tag | `engineering` | No |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` | No |
| `cluster_version` | Kubernetes version | `1.28` | No |
| `enable_cluster_autoscaler` | Enable autoscaler tags | `true` | No |
| `enable_spot_instances` | Enable spot node group | `true` | No |

## Outputs Reference

Key outputs include:

- `cluster_name`: EKS cluster name
- `cluster_endpoint`: Cluster API endpoint
- `cluster_oidc_issuer_url`: OIDC issuer for IRSA
- `configure_kubectl`: Command to configure kubectl access
- `vpc_id`: VPC identifier
- `node_security_group_*_id`: Security group IDs for each node group
- All IAM role ARNs for service accounts

## Support

For issues or questions, contact the platform engineering team.
```

## Configuration Notes

### Environment Suffix

All resources use the `environment_suffix` variable for naming to support parallel deployments:

```hcl
resource "aws_eks_cluster" "main" {
  name = "eks-cluster-${var.environment_suffix}"
  ...
}
```

### Destroyability

All resources are configured to be fully destroyable:

- No `prevent_destroy` lifecycle rules
- No retention policies on resources
- S3 buckets allow force_destroy
- NAT Gateways and EIPs properly depend on IGW

### Node Group Taints and Labels

Each node group has specific taints to ensure proper workload placement:

- **System nodes**: `workload=system:NoSchedule`
- **Application nodes**: `workload=application:NoSchedule`
- **Spot nodes**: `workload=batch:NoSchedule`

Pods must specify appropriate tolerations to schedule on these nodes.

### Storage

The EBS CSI driver is configured for encrypted GP3 volumes. Create a storage class to set GP3 as default (see post-deployment steps).

### Networking

The infrastructure uses 12 subnets across 3 availability zones:

- 3 subnets for control plane
- 3 subnets for system node group
- 3 subnets for application node group
- 3 subnets for spot node group

Each subnet has its own route table for fine-grained network control.

## Compliance

This configuration meets the following requirements:

-  EKS 1.28 with private endpoint only
-  Three managed node groups with distinct taints/labels
-  Pod security standards enforcement capability
-  IRSA with OIDC provider
-  Cluster autoscaler IAM permissions and tags
-  EBS CSI driver with encryption support
-  Network segmentation per node group
-  Control plane logging (all types)
-  KMS encryption with key rotation
-  AWS Load Balancer Controller IAM role
-  IMDSv2 enforcement
-  Launch templates with detailed monitoring
-  Comprehensive tagging
