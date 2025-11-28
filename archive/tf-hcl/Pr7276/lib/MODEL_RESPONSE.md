### Reasoning Trace
---

The user is asking for a production-grade EKS cluster infrastructure using Terraform with HCL. This is a comprehensive request with very specific requirements. Let me break down what needs to be created:

1. **Provider Configuration** - Terraform 1.5+, AWS provider 5.x, TLS and random providers
2. **VPC Network Architecture** - VPC with 6 subnets (3 private, 3 public), NAT Gateways, Internet Gateway, route tables, VPC Flow Logs
3. **KMS Encryption Keys** - 3 keys for EKS logs, VPC Flow Logs, and EBS volumes
4. **S3 Bucket** - For VPC Flow Logs storage
5. **EKS Cluster** - Private/public endpoints, control plane logging, security groups
6. **OIDC Provider** - For IRSA (IAM Roles for Service Accounts)
7. **Node Groups** - Both on-demand and spot instance node groups
8. **EKS Add-ons** - VPC CNI, EBS CSI Driver, CoreDNS
9. **CloudWatch Logging** - Log groups for EKS and VPC Flow Logs
10. **Comprehensive outputs** - 40-45 outputs for testing

The user wants detailed comments throughout the code explaining each section. Let me structure this as two files:
- `lib/provider.tf` - Provider configuration and variables
- `lib/main.tf` - All resources

Let me start writing the code with comprehensive comments as requested.
### Answer 
---

I'll create a comprehensive production-grade EKS cluster infrastructure with Terraform. This will include detailed documentation and all the requested components for a secure, cost-optimized Kubernetes environment.

## lib/provider.tf

```hcl
# =============================================================================
# Terraform and Provider Configuration
# =============================================================================
# This file defines the Terraform version constraints, provider configurations,
# and all input variables for the EKS cluster infrastructure. The providers
# include AWS for infrastructure resources, TLS for OIDC thumbprint extraction,
# and random for any unique naming requirements.
# =============================================================================

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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# =============================================================================
# AWS Provider Configuration
# =============================================================================
# Configure the AWS provider with default tags that will be applied to all
# resources. This ensures consistent tagging for cost tracking, compliance,
# and resource management across the entire infrastructure.
# =============================================================================

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment        = "production"
      ManagedBy         = "terraform"
      Project           = "fintech-microservices"
      CostCenter        = "engineering"
      DataClassification = "confidential"
    }
  }
}

# TLS provider for extracting OIDC thumbprint
provider "tls" {}

# Random provider for unique naming if needed
provider "random" {}

# =============================================================================
# Input Variables
# =============================================================================
# These variables allow customization of the infrastructure deployment while
# maintaining secure defaults. Each variable includes type constraints and
# descriptions for clarity.
# =============================================================================

variable "environment" {
  type        = string
  description = "Environment name for resource naming and tagging"
  default     = "dev"
}

variable "cluster_name" {
  type        = string
  description = "Base name for the EKS cluster, will be suffixed with environment"
  default     = "eks-production-cluster"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version for the EKS cluster"
  default     = "1.28"
}

variable "admin_access_cidr" {
  type        = string
  description = "CIDR block for administrative access to the EKS API endpoint"
  default     = "203.0.113.0/24"
}
```

## lib/main.tf

```hcl
# =============================================================================
# Data Sources
# =============================================================================
# These data sources retrieve information about the AWS environment that will
# be used throughout the infrastructure configuration. They provide account
# context, region information, and availability zones for multi-AZ deployment.
# =============================================================================

# Get current AWS account ID for unique naming
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

# Get available AZs in the current region
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# KMS Encryption Keys for EKS and VPC Flow Logs
# =============================================================================
# Create customer-managed KMS keys for encrypting sensitive data at rest.
# These keys provide additional security beyond default AWS encryption and
# enable compliance with data protection requirements. Each key has automatic
# rotation enabled and specific service permissions.
# =============================================================================

# KMS key for EKS control plane logs encryption
# This key encrypts all EKS control plane logs stored in CloudWatch Logs,
# ensuring audit trail security and compliance with data protection standards
resource "aws_kms_key" "eks_logs" {
  description             = "KMS key for EKS control plane logs encryption"
  deletion_window_in_days = 7  # Short deletion window for testing
  enable_key_rotation     = true # Annual automatic rotation for security

  tags = {
    Name = "kms-eks-logs-${var.environment}"
  }
}

resource "aws_kms_alias" "eks_logs" {
  name          = "alias/eks-logs-encryption-${var.environment}"
  target_key_id = aws_kms_key.eks_logs.key_id
}

# KMS key for VPC Flow Logs encryption in S3
# This key encrypts network traffic logs stored in S3, providing
# security for network monitoring and compliance data
resource "aws_kms_key" "vpc_flow_logs" {
  description             = "KMS key for VPC Flow Logs encryption in S3"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-vpc-flowlogs-${var.environment}"
  }
}

resource "aws_kms_alias" "vpc_flow_logs" {
  name          = "alias/vpc-flowlogs-encryption-${var.environment}"
  target_key_id = aws_kms_key.vpc_flow_logs.key_id
}

# KMS key for EBS volume encryption via CSI driver
# This key encrypts all persistent volumes created by the EBS CSI driver,
# ensuring data at rest encryption for stateful workloads
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-ebs-encryption-${var.environment}"
  }
}

resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/ebs-encryption-${var.environment}"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}

# =============================================================================
# VPC Networking Resources
# =============================================================================
# Create a dedicated VPC with public and private subnets across three
# availability zones for high availability. This network architecture
# provides isolation, security, and resilience for the EKS cluster.
# =============================================================================

# Main VPC for EKS cluster
# CIDR 10.0.0.0/16 provides 65,536 IP addresses for future growth
# DNS support and hostnames are required for EKS service discovery
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true  # Required for EKS
  enable_dns_support   = true  # Required for EKS

  tags = {
    Name                                           = "vpc-eks-${var.environment}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment}" = "shared"
  }
}

# Private subnets for EKS worker nodes (one per AZ)
# These subnets host the EKS worker nodes and are isolated from direct
# internet access, routing through NAT Gateways for outbound connectivity
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"  # 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                           = "subnet-private-${data.aws_availability_zones.available.names[count.index]}-${var.environment}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"  # Tag for internal load balancers
  }
}

# Public subnets for load balancers and NAT Gateways (one per AZ)
# These subnets host public-facing resources like Application Load Balancers
# and NAT Gateways, providing controlled internet access points
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 101}.0/24"  # 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true  # Auto-assign public IPs for resources

  tags = {
    Name                                           = "subnet-public-${data.aws_availability_zones.available.names[count.index]}-${var.environment}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment}" = "shared"
    "kubernetes.io/role/elb"                      = "1"  # Tag for external load balancers
  }
}

# Internet Gateway for public subnet connectivity
# Provides internet access for resources in public subnets
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-eks-${var.environment}"
  }
}

# Elastic IPs for NAT Gateways (one per AZ)
# Static IP addresses for consistent outbound connectivity
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = {
    Name = "eip-nat-${data.aws_availability_zones.available.names[count.index]}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet outbound connectivity (one per AZ)
# Production-grade high availability with one NAT Gateway per AZ
# ensures zone-independent failures don't impact other zones
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-${data.aws_availability_zones.available.names[count.index]}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
# Routes internet-bound traffic through the Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.environment}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route tables for private subnets (one per AZ for zone isolation)
# Each private subnet gets its own route table pointing to its AZ's NAT Gateway
# This ensures zone-independent routing and fault isolation
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "rt-private-${data.aws_availability_zones.available.names[count.index]}-${var.environment}"
  }
}

# Associate private subnets with their respective route tables
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs for network security monitoring
# Captures all accepted and rejected traffic for security analysis
# and compliance requirements
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination_arn = aws_s3_bucket.vpc_flow_logs.arn
  log_destination_type = "s3"
  traffic_type    = "ALL"  # Capture both ACCEPT and REJECT traffic
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "flowlog-vpc-${var.environment}"
  }
}

# IAM role for VPC Flow Logs to write to S3
resource "aws_iam_role" "vpc_flow_logs" {
  name = "iam-role-vpc-flow-logs-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "iam-role-vpc-flow-logs-${var.environment}"
  }
}

# IAM policy for VPC Flow Logs S3 permissions
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.vpc_flow_logs.arn,
          "${aws_s3_bucket.vpc_flow_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.vpc_flow_logs.arn
      }
    ]
  })
}

# =============================================================================
# S3 Bucket for VPC Flow Logs Storage
# =============================================================================
# S3 bucket with encryption and lifecycle policies for cost-effective
# long-term storage of network traffic logs. Includes versioning and
# lifecycle transitions to reduce storage costs over time.
# =============================================================================

resource "aws_s3_bucket" "vpc_flow_logs" {
  bucket        = "s3-vpc-flowlogs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true  # Allow bucket deletion even with objects for testing

  tags = {
    Name = "s3-vpc-flowlogs-${var.environment}"
  }
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.vpc_flow_logs.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block all public access for security
resource "aws_s3_bucket_public_access_block" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for cost optimization
# Transition to Glacier after 30 days and expire after 90 days
resource "aws_s3_bucket_lifecycle_configuration" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  rule {
    id     = "flow-logs-lifecycle"
    status = "Enabled"

    filter {
      prefix = "AWSLogs/"
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

# Bucket policy for VPC Flow Logs service access
resource "aws_s3_bucket_policy" "vpc_flow_logs" {
  bucket = aws_s3_bucket.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.vpc_flow_logs.arn,
          "${aws_s3_bucket.vpc_flow_logs.arn}/*"
        ]
      },
      {
        Sid    = "VPCFlowLogsWrite"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.vpc_flow_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "VPCFlowLogsAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.vpc_flow_logs.arn
      }
    ]
  })
}

# =============================================================================
# EKS Cluster IAM Roles and Security Groups
# =============================================================================
# IAM roles and security groups that define the permissions and network
# access controls for the EKS cluster control plane. These ensure secure
# communication between control plane and worker nodes.
# =============================================================================

# IAM role for EKS cluster control plane
# This role allows the EKS service to manage AWS resources on behalf of the cluster
resource "aws_iam_role" "eks_cluster" {
  name = "iam-role-eks-cluster-${var.environment}"

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
    Name = "iam-role-eks-cluster-${var.environment}"
  }
}

# Attach required managed policies to cluster role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# Security group for EKS cluster control plane
# Controls network access to the Kubernetes API server
resource "aws_security_group" "eks_cluster" {
  name        = "sg-eks-cluster-${var.environment}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "sg-eks-cluster-${var.environment}"
  }
}

# =============================================================================
# EKS Cluster Resource
# =============================================================================
# The main EKS cluster resource with private endpoint access and restricted
# public access for administrative purposes. Includes comprehensive logging
# for audit and compliance requirements.
# =============================================================================

resource "aws_eks_cluster" "main" {
  name     = "${var.cluster_name}-${var.environment}"
  version  = var.kubernetes_version
  role_arn = aws_iam_role.eks_cluster.arn

  # VPC configuration for high availability across multiple AZs
  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true                        # Enable private API access
    endpoint_public_access  = true                        # Enable restricted public access
    public_access_cidrs    = [var.admin_access_cidr]     # Restrict to admin CIDR only
    security_group_ids     = [aws_security_group.eks_cluster.id]
  }

  # Enable all control plane logging types for comprehensive auditing
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  # Encryption configuration for secrets at rest
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_logs.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = {
    Name = "${var.cluster_name}-${var.environment}"
  }
}

# =============================================================================
# OIDC Provider for IRSA (IAM Roles for Service Accounts)
# =============================================================================
# OpenID Connect provider enables fine-grained IAM permissions for
# Kubernetes service accounts, following the principle of least privilege.
# =============================================================================

# Extract OIDC provider thumbprint
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Create OIDC provider for the EKS cluster
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "oidc-eks-${var.environment}"
  }
}

# =============================================================================
# Cluster Autoscaler IAM Role with IRSA
# =============================================================================
# IAM role for the Kubernetes cluster autoscaler with trust relationship
# to the OIDC provider. Enables automatic scaling of node groups based on
# pod resource requirements.
# =============================================================================

# Local variable for OIDC provider ARN parsing
locals {
  oidc_provider_arn = aws_iam_openid_connect_provider.eks.arn
  oidc_provider_id  = element(split("/", aws_iam_openid_connect_provider.eks.arn), length(split("/", aws_iam_openid_connect_provider.eks.arn)) - 1)
}

# IAM role for cluster autoscaler service account
resource "aws_iam_role" "cluster_autoscaler" {
  name = "iam-role-eks-cluster-autoscaler-${var.environment}"

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
            "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
            "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "iam-role-eks-cluster-autoscaler-${var.environment}"
  }
}

# IAM policy for cluster autoscaler permissions
resource "aws_iam_policy" "cluster_autoscaler" {
  name = "iam-policy-eks-cluster-autoscaler-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}

# =============================================================================
# Node Group IAM Roles
# =============================================================================
# IAM roles for EKS managed node groups with required permissions for
# node operations, container registry access, and Systems Manager connectivity.
# =============================================================================

# IAM role for on-demand node group
resource "aws_iam_role" "node_group_ondemand" {
  name = "iam-role-eks-node-ondemand-${var.environment}"

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
    Name = "iam-role-eks-node-ondemand-${var.environment}"
  }
}

# Attach required policies to on-demand node group role
resource "aws_iam_role_policy_attachment" "node_group_ondemand_eks_worker" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group_ondemand.name
}

resource "aws_iam_role_policy_attachment" "node_group_ondemand_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group_ondemand.name
}

resource "aws_iam_role_policy_attachment" "node_group_ondemand_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group_ondemand.name
}

resource "aws_iam_role_policy_attachment" "node_group_ondemand_ssm" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.node_group_ondemand.name
}

# IAM role for spot node group
resource "aws_iam_role" "node_group_spot" {
  name = "iam-role-eks-node-spot-${var.environment}"

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
    Name = "iam-role-eks-node-spot-${var.environment}"
  }
}

# Attach required policies to spot node group role
resource "aws_iam_role_policy_attachment" "node_group_spot_eks_worker" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group_spot.name
}

resource "aws_iam_role_policy_attachment" "node_group_spot_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group_spot.name
}

resource "aws_iam_role_policy_attachment" "node_group_spot_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group_spot.name
}

resource "aws_iam_role_policy_attachment" "node_group_spot_ssm" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.node_group_spot.name
}

# =============================================================================
# Launch Templates for Node Groups
# =============================================================================
# Custom launch templates enforce security configurations including
# IMDSv2 requirement and metadata hop limits for enhanced security.
# =============================================================================

# Launch template for on-demand nodes
resource "aws_launch_template" "node_group_ondemand" {
  name_prefix = "lt-eks-ondemand-${var.environment}-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                = "required"  # Enforce IMDSv2
    http_put_response_hop_limit = 1         # Limit metadata access to instance only
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true  # Enable detailed monitoring for production workloads
  }

  tags = {
    Name = "lt-eks-ondemand-${var.environment}"
  }
}

# Launch template for spot nodes
resource "aws_launch_template" "node_group_spot" {
  name_prefix = "lt-eks-spot-${var.environment}-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                = "required"  # Enforce IMDSv2
    http_put_response_hop_limit = 1         # Limit metadata access to instance only
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tags = {
    Name = "lt-eks-spot-${var.environment}"
  }
}

# =============================================================================
# EKS Managed Node Groups - On-Demand and Spot Configurations
# =============================================================================
# Managed node groups provide automated node lifecycle management with
# mixed instance policies for cost optimization through spot instances.
# =============================================================================

# On-demand node group for baseline capacity
# Provides stable, always-available compute capacity for critical workloads
resource "aws_eks_node_group" "ondemand" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "eks-nodegroup-ondemand-${var.environment}"
  node_role_arn   = aws_iam_role.node_group_ondemand.arn
  subnet_ids      = aws_subnet.private[*].id

  capacity_type = "ON_DEMAND"
  instance_types = ["t3.large"]

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  launch_template {
    id      = aws_launch_template.node_group_ondemand.id
    version = "$Latest"
  }

  labels = {
    "node.kubernetes.io/lifecycle" = "normal"
    "workload-type"                = "general"
  }

  tags = {
    Name                                              = "eks-nodegroup-ondemand-${var.environment}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"              = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_ondemand_eks_worker,
    aws_iam_role_policy_attachment.node_group_ondemand_cni,
    aws_iam_role_policy_attachment.node_group_ondemand_registry,
    aws_iam_role_policy_attachment.node_group_ondemand_ssm
  ]
}

# Spot instance node group for cost optimization
# Provides cost-effective compute capacity for batch and non-critical workloads
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "eks-nodegroup-spot-${var.environment}"
  node_role_arn   = aws_iam_role.node_group_spot.arn
  subnet_ids      = aws_subnet.private[*].id

  capacity_type = "SPOT"
  instance_types = ["t3.medium", "t3a.medium"]  # Multiple types for better availability

  scaling_config {
    desired_size = 5
    max_size     = 10
    min_size     = 3
  }

  launch_template {
    id      = aws_launch_template.node_group_spot.id
    version = "$Latest"
  }

  labels = {
    "node.kubernetes.io/lifecycle" = "spot"
    "workload-type"                = "batch"
  }

  tags = {
    Name                                              = "eks-nodegroup-spot-${var.environment}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"              = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_spot_eks_worker,
    aws_iam_role_policy_attachment.node_group_spot_cni,
    aws_iam_role_policy_attachment.node_group_spot_registry,
    aws_iam_role_policy_attachment.node_group_spot_ssm
  ]
}

# =============================================================================
# Node Security Group
# =============================================================================
# Security group for worker nodes controlling inter-node communication,
# control plane access, and administrative SSH access.
# =============================================================================

resource "aws_security_group" "nodes" {
  name        = "sg-eks-nodes-${var.environment}"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-eks-nodes-${var.environment}"
  }
}

# Allow inbound HTTPS from cluster control plane
resource "aws_security_group_rule" "nodes_from_cluster" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_cluster.id
  security_group_id        = aws_security_group.nodes.id
  description              = "Allow HTTPS from EKS control plane"
}

# Allow all traffic between worker nodes for pod-to-pod communication
resource "aws_security_group_rule" "nodes_internal" {
  type              = "ingress"
  from_port         = 0
  to_port           = 65535
  protocol          = "-1"
  self              = true
  security_group_id = aws_security_group.nodes.id
  description       = "Allow all traffic between worker nodes"
}

# Allow SSH access from private network only
resource "aws_security_group_rule" "nodes_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
  security_group_id = aws_security_group.nodes.id
  description       = "Allow SSH from private network"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "nodes_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.nodes.id
  description       = "Allow all outbound traffic"
}

# Allow cluster control plane to communicate with worker nodes
resource "aws_security_group_rule" "cluster_to_nodes" {
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.nodes.id
  security_group_id        = aws_security_group.eks_cluster.id
  description              = "Allow worker nodes to communicate with cluster API"
}

# =============================================================================
# EKS Add-ons Configuration
# =============================================================================
# Critical EKS add-ons for networking (VPC CNI), storage (EBS CSI), and
# DNS resolution (CoreDNS). These are managed by EKS for easier updates.
# =============================================================================

# VPC CNI Add-on for pod networking
# Enables pods to have VPC IP addresses for native AWS networking
resource "aws_eks_addon" "vpc_cni" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = "v1.15.1-eksbuild.1"  # Latest stable version

  configuration_values = jsonencode({
    enableNetworkPolicy = "true"
    enablePrefixDelegation = "true"
    env = {
      AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG = "true"
      ENABLE_PREFIX_DELEGATION = "true"
    }
  })

  depends_on = [
    aws_iam_openid_connect_provider.eks,
    aws_eks_node_group.ondemand
  ]

  tags = {
    Name = "addon-vpc-cni-${var.environment}"
  }
}

# IAM role for EBS CSI driver service account
resource "aws_iam_role" "ebs_csi_driver" {
  name = "iam-role-eks-ebs-csi-driver-${var.environment}"

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
            "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
            "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "iam-role-eks-ebs-csi-driver-${var.environment}"
  }
}

# IAM policy for EBS CSI driver
resource "aws_iam_policy" "ebs_csi_driver" {
  name = "iam-policy-eks-ebs-csi-driver-${var.environment}"

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
      },
      {
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = aws_kms_key.ebs_encryption.arn
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.ebs_encryption.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = aws_iam_policy.ebs_csi_driver.arn
  role       = aws_iam_role.ebs_csi_driver.name
}

# EBS CSI Driver Add-on for persistent volume support
# Enables dynamic provisioning of EBS volumes for stateful workloads
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn

  configuration_values = jsonencode({
    defaultStorageClass = {
      enabled = true
    }
    storageClasses = [{
      name = "gp3-encrypted"
      parameters = {
        encrypted = "true"
        kmsKeyId  = aws_kms_key.ebs_encryption.arn
        type      = "gp3"
      }
    }]
  })

  depends_on = [
    aws_iam_openid_connect_provider.eks,
    aws_iam_role_policy_attachment.ebs_csi_driver,
    aws_eks_node_group.ondemand
  ]

  tags = {
    Name = "addon-ebs-csi-driver-${var.environment}"
  }
}

# CoreDNS Add-on for cluster DNS resolution
# Provides DNS-based service discovery within the cluster
resource "aws_eks_addon" "coredns" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "coredns"
  addon_version = "v1.10.1-eksbuild.6"

  configuration_values = jsonencode({
    replicaCount = 2
    resources = {
      limits = {
        cpu    = "100m"
        memory = "128Mi"
      }
      requests = {
        cpu    = "100m"
        memory = "70Mi"
      }
    }
    affinity = {
      podAntiAffinity = {
        preferredDuringSchedulingIgnoredDuringExecution = [{
          weight = 100
          podAffinityTerm = {
            labelSelector = {
              matchExpressions = [{
                key      = "k8s-app"
                operator = "In"
                values   = ["kube-dns"]
              }]
            }
            topologyKey = "kubernetes.io/hostname"
          }
        }]
      }
    }
  })

  depends_on = [
    aws_iam_openid_connect_provider.eks,
    aws_eks_node_group.ondemand
  ]

  tags = {
    Name = "addon-coredns-${var.environment}"
  }
}

# =============================================================================
# CloudWatch Log Groups
# =============================================================================
# Dedicated log groups for EKS control plane logs and VPC Flow Logs with
# KMS encryption and retention policies for compliance and cost optimization.
# =============================================================================

# Log group for EKS control plane logs
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${aws_eks_cluster.main.name}/cluster"
  retention_in_days = 7  # Short retention for cost optimization
  kms_key_id        = aws_kms_key.eks_logs.arn

  tags = {
    Name = "log-group-eks-cluster-${var.environment}"
  }
}

# Log group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.environment}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.vpc_flow_logs.arn

  tags = {
    Name = "log-group-vpc-flowlogs-${var.environment}"
  }
}

# =============================================================================
# Outputs for Integration Testing
# =============================================================================
# Comprehensive outputs for all created resources to enable validation
# testing and provide necessary information for cluster access and management.
# =============================================================================

# KMS Key Outputs (6 outputs)
output "kms_eks_logs_key_id" {
  value       = aws_kms_key.eks_logs.id
  description = "KMS key ID for EKS logs encryption"
}

output "kms_eks_logs_key_arn" {
  value       = aws_kms_key.eks_logs.arn
  description = "KMS key ARN for EKS logs encryption"
}

output "kms_vpc_flow_logs_key_id" {
  value       = aws_kms_key.vpc_flow_logs.id
  description = "KMS key ID for VPC Flow Logs encryption"
}

output "kms_vpc_flow_logs_key_arn" {
  value       = aws_kms_key.vpc_flow_logs.arn
  description = "KMS key ARN for VPC Flow Logs encryption"
}

output "kms_ebs_key_id" {
  value       = aws_kms_key.ebs_encryption.id
  description = "KMS key ID for EBS volume encryption"
}

output "kms_ebs_key_arn" {
  value       = aws_kms_key.ebs_encryption.arn
  description = "KMS key ARN for EBS volume encryption"
}

# VPC and Networking Outputs (8 outputs)
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "nat_gateway_ids" {
  value       = aws_nat_gateway.main[*].id
  description = "List of NAT Gateway IDs"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.main.id
  description = "Internet Gateway ID"
}

output "vpc_cidr_block" {
  value       = aws_vpc.main.cidr_block
  description = "VPC CIDR block"
}

output "elastic_ip_addresses" {
  value       = aws_eip.nat[*].public_ip
  description = "Elastic IP addresses for NAT Gateways"
}

output "flow_log_id" {
  value       = aws_flow_log.main.id
  description = "VPC Flow Log ID"
}

# S3 Bucket Outputs (2 outputs)
output "s3_bucket_name" {
  value       = aws_s3_bucket.vpc_flow_logs.id
  description = "S3 bucket name for VPC Flow Logs"
}

output "s3_bucket_arn" {
  value       = aws_s3_bucket.vpc_flow_logs.arn
  description = "S3 bucket ARN for VPC Flow Logs"
}

# EKS Cluster Outputs (8 outputs)
output "eks_cluster_id" {
  value       = aws_eks_cluster.main.id
  description = "EKS cluster ID"
}

output "eks_cluster_arn" {
  value       = aws_eks_cluster.main.arn
  description = "EKS cluster ARN"
}

output "eks_cluster_endpoint" {
  value       = aws_eks_cluster.main.endpoint
  sensitive   = true
  description = "EKS cluster API endpoint"
}

output "eks_cluster_certificate_authority_data" {
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
  description = "EKS cluster certificate authority data"
}

output "eks_cluster_oidc_issuer_url" {
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
  description = "EKS cluster OIDC issuer URL"
}

output "eks_oidc_provider_arn" {
  value       = aws_iam_openid_connect_provider.eks.arn
  description = "OIDC provider ARN"
}

output "eks_cluster_security_group_id" {
  value       = aws_security_group.eks_cluster.id
  description = "EKS cluster security group ID"
}

output "eks_cluster_version" {
  value       = aws_eks_cluster.main.version
  description = "EKS cluster Kubernetes version"
}

# Cluster Autoscaler Output (1 output)
output "cluster_autoscaler_iam_role_arn" {
  value       = aws_iam_role.cluster_autoscaler.arn
  description = "IAM role ARN for cluster autoscaler"
}

# On-Demand Node Group Outputs (4 outputs)
output "node_group_ondemand_id" {
  value       = aws_eks_node_group.ondemand.id
  description = "On-demand node group ID"
}

output "node_group_ondemand_arn" {
  value       = aws_eks_node_group.ondemand.arn
  description = "On-demand node group ARN"
}

output "node_group_ondemand_status" {
  value       = aws_eks_node_group.ondemand.status
  description = "On-demand node group status"
}

output "node_group_ondemand_iam_role_arn" {
  value       = aws_iam_role.node_group_ondemand.arn
  description = "On-demand node group IAM role ARN"
}

# Spot Node Group Outputs (4 outputs)
output "node_group_spot_id" {
  value       = aws_eks_node_group.spot.id
  description = "Spot node group ID"
}

output "node_group_spot_arn" {
  value       = aws_eks_node_group.spot.arn
  description = "Spot node group ARN"
}

output "node_group_spot_status" {
  value       = aws_eks_node_group.spot.status
  description = "Spot node group status"
}

output "node_group_spot_iam_role_arn" {
  value       = aws_iam_role.node_group_spot.arn
  description = "Spot node group IAM role ARN"
}

# Node Security Group Output (1 output)
output "node_security_group_id" {
  value       = aws_security_group.nodes.id
  description = "Worker nodes security group ID"
}

# EKS Add-on Outputs (6 outputs)
output "vpc_cni_addon_arn" {
  value       = aws_eks_addon.vpc_cni.arn
  description = "VPC CNI add-on ARN"
}

output "vpc_cni_addon_version" {
  value       = aws_eks_addon.vpc_cni.addon_version
  description = "VPC CNI add-on version"
}

output "ebs_csi_driver_addon_arn" {
  value       = aws_eks_addon.ebs_csi_driver.arn
  description = "EBS CSI driver add-on ARN"
}

output "ebs_csi_driver_addon_version" {
  value       = aws_eks_addon.ebs_csi_driver.addon_version
  description = "EBS CSI driver add-on version"
}

output "coredns_addon_arn" {
  value       = aws_eks_addon.coredns.arn
  description = "CoreDNS add-on ARN"
}

output "coredns_addon_version" {
  value       = aws_eks_addon.coredns.addon_version
  description = "CoreDNS add-on version"
}

# CloudWatch Log Group Outputs (2 outputs)
output "cloudwatch_log_group_eks_cluster" {
  value       = aws_cloudwatch_log_group.eks_cluster.name
  description = "CloudWatch log group name for EKS cluster logs"
}

output "cloudwatch_log_group_vpc_flow_logs" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
  description = "CloudWatch log group name for VPC Flow Logs"
}

# IAM Role ARNs for debugging (3 outputs)
output "eks_cluster_iam_role_arn" {
  value       = aws_iam_role.eks_cluster.arn
  description = "EKS cluster IAM role ARN"
}

output "ebs_csi_driver_iam_role_arn" {
  value       = aws_iam_role.ebs_csi_driver.arn
  description = "EBS CSI driver IAM role ARN for IRSA"
}

output "vpc_flow_logs_iam_role_arn" {
  value       = aws_iam_role.vpc_flow_logs.arn
  description = "VPC Flow Logs IAM role ARN"
}
```

## Summary

This Terraform configuration creates a production-grade EKS cluster with:

### Key Features
- **High Availability**: Deployed across 3 availability zones with redundant NAT Gateways
- **Security**: Private subnets, IMDSv2 enforcement, KMS encryption for all data at rest
- **Cost Optimization**: Mixed on-demand and spot instance node groups
- **Observability**: Comprehensive logging with CloudWatch and VPC Flow Logs
- **Automation**: Cluster autoscaler with IRSA for dynamic scaling
- **Storage**: EBS CSI driver with encrypted persistent volumes
- **Networking**: VPC CNI with prefix delegation for increased pod density

### Resource Count
- **3 KMS Keys** for encryption
- **1 VPC** with 6 subnets (3 private, 3 public)
- **3 NAT Gateways** for HA
- **1 EKS Cluster** with private/public endpoints
- **2 Managed Node Groups** (on-demand and spot)
- **3 EKS Add-ons** (VPC CNI, EBS CSI, CoreDNS)
- **45 Outputs** for comprehensive testing validation

The configuration follows all specified naming conventions, includes detailed documentation, and is ready for automated testing with proper cleanup behavior.