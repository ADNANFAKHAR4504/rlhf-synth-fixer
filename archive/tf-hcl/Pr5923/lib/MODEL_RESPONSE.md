# Production EKS Cluster with Graviton2 Node Groups - Complete Implementation

This implementation creates a production-grade Amazon EKS cluster with managed node groups using Graviton2 ARM instances, proper IAM integration with OIDC, VPC CNI prefix delegation, selective logging, and automated scaling capabilities.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region for EKS cluster deployment"
  type        = string
  default     = "us-east-2"
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

variable "node_instance_type" {
  description = "EC2 instance type for EKS nodes (Graviton2 ARM)"
  type        = string
  default     = "t4g.medium"
}

variable "node_min_size" {
  description = "Minimum number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of nodes in the node group"
  type        = number
  default     = 15
}

variable "node_desired_size" {
  description = "Desired number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_disk_size" {
  description = "Root volume size for EKS nodes in GB"
  type        = number
  default     = 100
}

variable "authorized_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS public endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_prefix_delegation" {
  description = "Enable VPC CNI prefix delegation for increased pod density"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

## File: main.tf

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
    tags = var.common_tags
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "zone-name"
    values = ["${var.region}a", "${var.region}b", "${var.region}c"]
  }
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  cluster_name = "eks-cluster-${var.environment_suffix}"
  azs          = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = merge(
    var.common_tags,
    {
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
}
```

## File: vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.tags,
    {
      Name = "vpc-${var.environment_suffix}"
    }
  )
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
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.tags,
    {
      Name                                           = "public-subnet-${count.index + 1}-${var.environment_suffix}"
      "kubernetes.io/role/elb"                       = "1"
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.tags,
    {
      Name                                           = "private-subnet-${count.index + 1}-${var.environment_suffix}"
      "kubernetes.io/role/internal-elb"              = "1"
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
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
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
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

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
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

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: eks-cluster.tf

```hcl
# CloudWatch Log Group for EKS Control Plane
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = 7

  tags = {
    Name = "eks-logs-${var.environment_suffix}"
  }
}

# EKS Cluster Security Group
resource "aws_security_group" "cluster" {
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

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.authorized_cidr_blocks
    security_group_ids      = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.cluster_vpc_resource_controller,
    aws_cloudwatch_log_group.eks
  ]

  tags = {
    Name = local.cluster_name
  }
}

# KMS Key for EKS Encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "eks-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${var.environment_suffix}"
  target_key_id = aws_kms_key.eks.key_id
}

# OIDC Provider for EKS
data "tls_certificate" "cluster" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "eks-oidc-${var.environment_suffix}"
  }
}
```

## File: eks-node-group.tf

```hcl
# Launch Template for EKS Nodes
resource "aws_launch_template" "nodes" {
  name_prefix = "eks-node-${var.environment_suffix}-"
  description = "Launch template for EKS managed node group"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = var.node_disk_size
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      local.tags,
      {
        Name = "eks-node-${var.environment_suffix}"
      }
    )
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    cluster_name            = local.cluster_name
    cluster_endpoint        = aws_eks_cluster.main.endpoint
    cluster_ca              = aws_eks_cluster.main.certificate_authority[0].data
    enable_prefix_delegation = var.enable_prefix_delegation
  }))

  lifecycle {
    create_before_destroy = true
  }
}

# EKS Managed Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "node-group-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.node_instance_type]
  ami_type        = "AL2_ARM_64"

  scaling_config {
    min_size     = var.node_min_size
    max_size     = var.node_max_size
    desired_size = var.node_desired_size
  }

  update_config {
    max_unavailable_percentage = 33
  }

  launch_template {
    id      = aws_launch_template.nodes.id
    version = "$Latest"
  }

  labels = {
    role        = "worker"
    environment = var.environment_suffix
  }

  tags = {
    Name                                           = "eks-node-group-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"            = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_policy,
    aws_iam_role_policy_attachment.node_cni_policy,
    aws_iam_role_policy_attachment.node_container_registry,
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}
```

## File: user-data.sh

```bash
#!/bin/bash
set -e

# Bootstrap script for EKS nodes with VPC CNI prefix delegation
CLUSTER_NAME="${cluster_name}"
B64_CLUSTER_CA="${cluster_ca}"
API_SERVER_URL="${cluster_endpoint}"
ENABLE_PREFIX_DELEGATION="${enable_prefix_delegation}"

# Configure kubelet
/etc/eks/bootstrap.sh "$CLUSTER_NAME" \
  --b64-cluster-ca "$B64_CLUSTER_CA" \
  --apiserver-endpoint "$API_SERVER_URL" \
  --kubelet-extra-args "--node-labels=nodegroup=managed"

# Enable VPC CNI prefix delegation if requested
if [ "$ENABLE_PREFIX_DELEGATION" = "true" ]; then
  kubectl set env daemonset aws-node \
    -n kube-system \
    ENABLE_PREFIX_DELEGATION=true \
    WARM_PREFIX_TARGET=1
fi
```

## File: iam-cluster.tf

```hcl
# EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name_prefix = "eks-cluster-role-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name = "eks-cluster-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

# Additional policy for CloudWatch Logs
resource "aws_iam_role_policy" "cluster_cloudwatch" {
  name_prefix = "eks-cluster-cloudwatch-"
  role        = aws_iam_role.cluster.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = [
        "${aws_cloudwatch_log_group.eks.arn}:*"
      ]
    }]
  })
}
```

## File: iam-nodes.tf

```hcl
# EKS Node IAM Role
resource "aws_iam_role" "node" {
  name_prefix = "eks-node-role-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name = "eks-node-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_container_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node.name
}

# Additional policy for VPC CNI prefix delegation
resource "aws_iam_role_policy" "node_vpc_cni_prefix" {
  name_prefix = "eks-node-vpc-cni-prefix-"
  role        = aws_iam_role.node.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:AssignPrivateIpAddresses",
        "ec2:AttachNetworkInterface",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeInstances",
        "ec2:DescribeTags",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeInstanceTypes",
        "ec2:DetachNetworkInterface",
        "ec2:ModifyNetworkInterfaceAttribute",
        "ec2:UnassignPrivateIpAddresses"
      ]
      Resource = "*"
    }]
  })
}
```

## File: iam-autoscaler.tf

```hcl
# Cluster Autoscaler IAM Role for Service Account (IRSA)
resource "aws_iam_role" "cluster_autoscaler" {
  name_prefix = "eks-cluster-autoscaler-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.cluster.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "eks-cluster-autoscaler-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "cluster_autoscaler" {
  name_prefix = "eks-cluster-autoscaler-policy-"
  role        = aws_iam_role.cluster_autoscaler.id

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
```

## File: kubernetes-config.tf

```hcl
# Data source to generate kubeconfig
data "aws_eks_cluster_auth" "cluster" {
  name = aws_eks_cluster.main.name
}

# Local file for kubeconfig (optional, for local testing)
resource "local_file" "kubeconfig" {
  content = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
    region           = var.region
  })
  filename = "${path.module}/kubeconfig-${var.environment_suffix}.yaml"

  depends_on = [aws_eks_cluster.main]
}
```

## File: kubeconfig.tpl

```yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: ${cluster_endpoint}
    certificate-authority-data: ${cluster_ca}
  name: ${cluster_name}
contexts:
- context:
    cluster: ${cluster_name}
    user: ${cluster_name}
  name: ${cluster_name}
current-context: ${cluster_name}
users:
- name: ${cluster_name}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
        - eks
        - get-token
        - --cluster-name
        - ${cluster_name}
        - --region
        - ${region}
```

## File: vpc-cni-addon.tf

```hcl
# VPC CNI Add-on with prefix delegation
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.18.0-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true"
      WARM_PREFIX_TARGET       = "1"
      ENABLE_POD_ENI           = "false"
    }
  })

  depends_on = [aws_eks_node_group.main]

  tags = {
    Name = "vpc-cni-addon-${var.environment_suffix}"
  }
}

# CoreDNS Add-on
resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.11.1-eksbuild.4"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [aws_eks_node_group.main]

  tags = {
    Name = "coredns-addon-${var.environment_suffix}"
  }
}

# kube-proxy Add-on
resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [aws_eks_node_group.main]

  tags = {
    Name = "kube-proxy-addon-${var.environment_suffix}"
  }
}
```

## File: aws-auth-configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapRoles: |
    - rolearn: ${node_role_arn}
      username: system:node:{{EC2PrivateDNSName}}
      groups:
        - system:bootstrappers
        - system:nodes
    - rolearn: ${cluster_autoscaler_role_arn}
      username: cluster-autoscaler
      groups:
        - system:masters
  mapUsers: |
    - userarn: ${admin_user_arn}
      username: admin
      groups:
        - system:masters
```

## File: outputs.tf

```hcl
output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint URL"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "OIDC provider URL for the EKS cluster"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  value       = aws_iam_openid_connect_provider.cluster.arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for cluster authentication"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_autoscaler_role_arn" {
  description = "IAM role ARN for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "node_group_id" {
  description = "EKS managed node group ID"
  value       = aws_eks_node_group.main.id
}

output "node_group_status" {
  description = "Status of the EKS node group"
  value       = aws_eks_node_group.main.status
}

output "node_role_arn" {
  description = "IAM role ARN for EKS nodes"
  value       = aws_iam_role.node.arn
}

output "vpc_id" {
  description = "VPC ID where EKS cluster is deployed"
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

output "kubectl_config_command" {
  description = "Command to configure kubectl for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${aws_eks_cluster.main.name}"
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for EKS control plane logs"
  value       = aws_cloudwatch_log_group.eks.name
}
```

## File: README.md

```markdown
# Production EKS Cluster with Graviton2 Node Groups

This Terraform configuration deploys a production-ready Amazon EKS cluster with managed node groups using Graviton2 ARM instances in the us-east-2 region.

## Features

- **EKS Cluster**: Kubernetes 1.28 with private and public endpoint access
- **Graviton2 Nodes**: Cost-optimized t4g.medium ARM instances
- **Auto Scaling**: Managed node group scaling from 3 to 15 nodes
- **High Availability**: Distributed across 3 availability zones
- **VPC CNI Prefix Delegation**: Enhanced pod density per node
- **OIDC Provider**: Configured for IAM Roles for Service Accounts (IRSA)
- **Cluster Autoscaler**: IAM role with proper trust policy
- **Selective Logging**: API and audit logs to CloudWatch
- **Encryption**: EBS volumes and Kubernetes secrets encrypted with KMS
- **Optimized Storage**: gp3 volumes with 3000 IOPS and 125 MiB/s throughput

## Architecture

```
VPC (10.0.0.0/16)
├── 3 Public Subnets (with NAT Gateways)
├── 3 Private Subnets (EKS nodes)
├── Internet Gateway
└── 3 NAT Gateways (one per AZ)

EKS Cluster
├── Control Plane (managed by AWS)
├── OIDC Provider (for IRSA)
├── Managed Node Group
│   ├── t4g.medium instances (Graviton2 ARM)
│   ├── Amazon Linux 2 EKS-optimized AMI
│   ├── gp3 100GB encrypted root volumes
│   └── Auto scaling: 3-15 nodes
└── Add-ons
    ├── VPC CNI (with prefix delegation)
    ├── CoreDNS
    └── kube-proxy
```

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- kubectl (for cluster management)
- Permissions to create EKS clusters, VPCs, IAM roles, and related resources

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review and Customize Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix       = "prod"
region                   = "us-east-2"
cluster_version          = "1.28"
node_instance_type       = "t4g.medium"
node_min_size            = 3
node_max_size            = 15
node_desired_size        = 3
authorized_cidr_blocks   = ["10.0.0.0/8", "172.16.0.0/12"]

common_tags = {
  Environment = "production"
  ManagedBy   = "terraform"
  Project     = "eks-cluster"
}
```

### 3. Plan the Deployment

```bash
terraform plan
```

### 4. Deploy the Infrastructure

```bash
terraform apply
```

### 5. Configure kubectl

After deployment completes, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-prod
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

### 6. Deploy Cluster Autoscaler

Create a Kubernetes ServiceAccount and Deployment for the cluster autoscaler:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: $(terraform output -raw cluster_autoscaler_role_arn)
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-prod
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
EOF
```

## VPC CNI Prefix Delegation

This configuration enables VPC CNI prefix delegation for increased pod density. To verify it's enabled:

```bash
kubectl get daemonset aws-node -n kube-system -o yaml | grep ENABLE_PREFIX_DELEGATION
```

Expected output:
```
- name: ENABLE_PREFIX_DELEGATION
  value: "true"
```

## Monitoring and Logging

### View Control Plane Logs

```bash
aws logs tail /aws/eks/eks-cluster-prod/cluster --follow --region us-east-2
```

### Check Node Status

```bash
kubectl get nodes -o wide
kubectl top nodes
```

### View Cluster Autoscaler Logs

```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

## Cost Optimization

This configuration uses several cost-optimization strategies:

1. **Graviton2 instances**: t4g.medium provides ~20% cost savings vs x86
2. **Managed node groups**: No additional cost for EKS-managed infrastructure
3. **Selective logging**: Only api and audit logs to minimize CloudWatch costs
4. **Auto scaling**: Scales down to minimum 3 nodes during low usage
5. **Spot instances**: Can be added by modifying the node group configuration

## Security Features

- Private subnets for all worker nodes
- Encrypted EBS volumes using KMS
- Encrypted Kubernetes secrets using KMS
- IMDSv2 required on all instances
- Security group restrictions on cluster access
- OIDC provider for fine-grained IAM permissions
- Principle of least privilege for all IAM roles

## Maintenance

### Update Cluster Version

```bash
# Update variable
terraform apply -var="cluster_version=1.29"
```

### Scale Node Group

```bash
# Update variables
terraform apply -var="node_desired_size=5"
```

### Rotate Nodes

```bash
# Update launch template, then force node replacement
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
kubectl delete node <node-name>
```

## Troubleshooting

### Nodes Not Joining Cluster

Check node IAM role and security groups:

```bash
kubectl get nodes
aws eks describe-cluster --name eks-cluster-prod --region us-east-2
```

### VPC CNI Issues

Restart the VPC CNI DaemonSet:

```bash
kubectl rollout restart daemonset aws-node -n kube-system
```

### Autoscaler Not Scaling

Check autoscaler logs and IAM permissions:

```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

## Cleanup

To destroy all resources:

```bash
# Delete all Kubernetes resources first
kubectl delete all --all --all-namespaces

# Destroy Terraform-managed resources
terraform destroy
```

**Note**: Ensure all LoadBalancer services and PersistentVolumes are deleted before running `terraform destroy` to avoid orphaned AWS resources.

## Outputs

After successful deployment, the following outputs are available:

- `cluster_name`: EKS cluster name
- `cluster_endpoint`: EKS API server endpoint
- `cluster_oidc_issuer_url`: OIDC provider URL for IRSA
- `kubectl_config_command`: Command to configure kubectl
- `cluster_autoscaler_role_arn`: IAM role ARN for cluster autoscaler
- `vpc_id`: VPC ID
- `private_subnet_ids`: Private subnet IDs
- `public_subnet_ids`: Public subnet IDs

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [VPC CNI Plugin](https://github.com/aws/amazon-vpc-cni-k8s)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
```
