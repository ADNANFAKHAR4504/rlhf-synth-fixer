# EKS Production Cluster - Terraform Implementation

Complete Terraform implementation for a production-ready Amazon EKS cluster with multiple node groups, IRSA roles, and comprehensive monitoring.

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
      ManagedBy   = "Terraform"
      Project     = "EKS-Production-Cluster"
    }
  }
}

provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
}

data "aws_eks_cluster_auth" "main" {
  name = aws_eks_cluster.main.name
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming and uniqueness"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "eks-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "system_node_group_instance_types" {
  description = "Instance types for system node group"
  type        = list(string)
  default     = ["m5.large"]
}

variable "system_node_group_desired_size" {
  description = "Desired number of nodes in system node group"
  type        = number
  default     = 2
}

variable "system_node_group_min_size" {
  description = "Minimum number of nodes in system node group"
  type        = number
  default     = 2
}

variable "system_node_group_max_size" {
  description = "Maximum number of nodes in system node group"
  type        = number
  default     = 4
}

variable "app_node_group_instance_types" {
  description = "Instance types for application node group"
  type        = list(string)
  default     = ["t3.large", "t3a.large", "t2.large"]
}

variable "app_node_group_desired_size" {
  description = "Desired number of nodes in application node group"
  type        = number
  default     = 3
}

variable "app_node_group_min_size" {
  description = "Minimum number of nodes in application node group"
  type        = number
  default     = 2
}

variable "app_node_group_max_size" {
  description = "Maximum number of nodes in application node group"
  type        = number
  default     = 10
}

variable "gpu_node_group_instance_types" {
  description = "Instance types for GPU node group"
  type        = list(string)
  default     = ["g4dn.xlarge"]
}

variable "gpu_node_group_desired_size" {
  description = "Desired number of nodes in GPU node group"
  type        = number
  default     = 0
}

variable "gpu_node_group_min_size" {
  description = "Minimum number of nodes in GPU node group"
  type        = number
  default     = 0
}

variable "gpu_node_group_max_size" {
  description = "Maximum number of nodes in GPU node group"
  type        = number
  default     = 3
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler IAM role"
  type        = bool
  default     = true
}

variable "enable_alb_controller" {
  description = "Enable AWS Load Balancer Controller IAM role"
  type        = bool
  default     = true
}

variable "enable_external_secrets" {
  description = "Enable External Secrets Operator IAM role"
  type        = bool
  default     = true
}

variable "enable_ebs_csi_driver" {
  description = "Enable EBS CSI Driver IAM role"
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access" {
  description = "Enable public access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Enable private access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_cluster_encryption" {
  description = "Enable encryption for EKS secrets"
  type        = bool
  default     = true
}

variable "namespaces" {
  description = "Kubernetes namespaces to create"
  type        = list(string)
  default     = ["dev", "staging", "production"]
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = aws_eks_cluster.main.arn
}

output "eks_cluster_certificate_authority" {
  description = "Certificate authority data for the EKS cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "eks_cluster_security_group_id" {
  description = "Security group ID of the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "eks_oidc_provider_url" {
  description = "URL of the OIDC provider for the EKS cluster"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "system_node_group_id" {
  description = "ID of the system node group"
  value       = aws_eks_node_group.system.id
}

output "system_node_group_arn" {
  description = "ARN of the system node group"
  value       = aws_eks_node_group.system.arn
}

output "app_node_group_id" {
  description = "ID of the application node group"
  value       = aws_eks_node_group.application.id
}

output "app_node_group_arn" {
  description = "ARN of the application node group"
  value       = aws_eks_node_group.application.arn
}

output "gpu_node_group_id" {
  description = "ID of the GPU node group"
  value       = aws_eks_node_group.gpu.id
}

output "gpu_node_group_arn" {
  description = "ARN of the GPU node group"
  value       = aws_eks_node_group.gpu.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  value       = var.enable_cluster_autoscaler ? aws_iam_role.cluster_autoscaler[0].arn : null
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role"
  value       = var.enable_alb_controller ? aws_iam_role.alb_controller[0].arn : null
}

output "external_secrets_role_arn" {
  description = "ARN of the external secrets IAM role"
  value       = var.enable_external_secrets ? aws_iam_role.external_secrets[0].arn : null
}

output "ebs_csi_driver_role_arn" {
  description = "ARN of the EBS CSI driver IAM role"
  value       = var.enable_ebs_csi_driver ? aws_iam_role.ebs_csi_driver[0].arn : null
}

output "kms_key_id" {
  description = "ID of the KMS key for EKS encryption"
  value       = var.enable_cluster_encryption ? aws_kms_key.eks[0].id : null
}

output "kms_key_arn" {
  description = "ARN of the KMS key for EKS encryption"
  value       = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : null
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for EKS cluster"
  value       = aws_cloudwatch_log_group.eks.name
}

output "cluster_autoscaler_service_account" {
  description = "Kubernetes service account name for cluster autoscaler"
  value       = "cluster-autoscaler"
}

output "alb_controller_service_account" {
  description = "Kubernetes service account name for ALB controller"
  value       = "aws-load-balancer-controller"
}

output "external_secrets_service_account" {
  description = "Kubernetes service account name for external secrets"
  value       = "external-secrets"
}

output "ebs_csi_driver_service_account" {
  description = "Kubernetes service account name for EBS CSI driver"
  value       = "ebs-csi-controller-sa"
}

output "configure_kubectl_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
```

## File: lib/vpc.tf

```hcl
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = {
    Name                                                        = "vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
  }
}

resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                        = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/elb"                                    = "1"
  }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = local.azs[count.index]

  tags = {
    Name                                                        = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                           = "1"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

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

resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : length(local.azs)
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
    }
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = {
    Name = "s3-endpoint-${var.environment_suffix}"
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
    Name = "ecr-api-endpoint-${var.environment_suffix}"
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
    Name = "ecr-dkr-endpoint-${var.environment_suffix}"
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
    Name = "ec2-endpoint-${var.environment_suffix}"
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
    Name = "logs-endpoint-${var.environment_suffix}"
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
    Name = "sts-endpoint-${var.environment_suffix}"
  }
}
```

## File: lib/security-groups.tf

```hcl
resource "aws_security_group" "cluster" {
  name        = "eks-cluster-sg-${var.environment_suffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "eks-cluster-sg-${var.environment_suffix}"
  }
}

resource "aws_security_group_rule" "cluster_ingress_workstation_https" {
  description       = "Allow workstation to communicate with the cluster API Server"
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
}

resource "aws_security_group_rule" "cluster_egress_all" {
  description       = "Allow cluster to communicate with all resources"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
}

resource "aws_security_group" "node" {
  name        = "eks-node-sg-${var.environment_suffix}"
  description = "Security group for all nodes in the cluster"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name                                                        = "eks-node-sg-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "owned"
  }
}

resource "aws_security_group_rule" "node_ingress_self" {
  description              = "Allow nodes to communicate with each other"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_ingress_cluster" {
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.cluster.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_ingress_cluster_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.cluster.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_egress_all" {
  description       = "Allow nodes to communicate with all resources"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.node.id
}

resource "aws_security_group_rule" "cluster_ingress_node_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.cluster.id
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "vpc-endpoints-sg-${var.environment_suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "vpc-endpoints-sg-${var.environment_suffix}"
  }
}
```

## File: lib/iam-eks-cluster.tf

```hcl
resource "aws_iam_role" "cluster" {
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

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSVPCResourceController" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy" "cluster_encryption" {
  name = "eks-cluster-encryption-${var.environment_suffix}"
  role = aws_iam_role.cluster.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ListGrants",
        "kms:DescribeKey"
      ]
      Resource = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : "*"
    }]
  })
}

resource "aws_kms_key" "eks" {
  count                   = var.enable_cluster_encryption ? 1 : 0
  description             = "KMS key for EKS cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "eks-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "eks" {
  count         = var.enable_cluster_encryption ? 1 : 0
  name          = "alias/eks-${var.environment_suffix}"
  target_key_id = aws_kms_key.eks[0].key_id
}
```

## File: lib/eks-cluster.tf

```hcl
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.cluster_name}-${var.environment_suffix}/cluster"
  retention_in_days = var.cluster_log_retention_days

  tags = {
    Name = "eks-cluster-logs-${var.environment_suffix}"
  }
}

resource "aws_eks_cluster" "main" {
  name     = "${var.cluster_name}-${var.environment_suffix}"
  version  = var.kubernetes_version
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = var.cluster_endpoint_private_access
    endpoint_public_access  = var.cluster_endpoint_public_access
    security_group_ids      = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  dynamic "encryption_config" {
    for_each = var.enable_cluster_encryption ? [1] : []
    content {
      provider {
        key_arn = aws_kms_key.eks[0].arn
      }
      resources = ["secrets"]
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
    aws_cloudwatch_log_group.eks
  ]

  tags = {
    Name = "${var.cluster_name}-${var.environment_suffix}"
  }
}

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

## File: lib/iam-node-groups.tf

```hcl
resource "aws_iam_role" "node" {
  name = "eks-node-group-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "eks-node-group-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonSSMManagedInstanceCore" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy" "node_cloudwatch" {
  name = "eks-node-cloudwatch-${var.environment_suffix}"
  role = aws_iam_role.node.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cloudwatch:PutMetricData",
        "ec2:DescribeVolumes",
        "ec2:DescribeTags",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups",
        "logs:CreateLogStream",
        "logs:CreateLogGroup"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "node_autoscaling" {
  name = "eks-node-autoscaling-${var.environment_suffix}"
  role = aws_iam_role.node.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions"
      ]
      Resource = "*"
    }]
  })
}
```

## File: lib/eks-node-groups.tf

```hcl
data "aws_ssm_parameter" "bottlerocket_ami" {
  name = "/aws/service/bottlerocket/aws-k8s-${var.kubernetes_version}/x86_64/latest/image_id"
}

data "aws_ssm_parameter" "bottlerocket_ami_gpu" {
  name = "/aws/service/bottlerocket/aws-k8s-${var.kubernetes_version}-nvidia/x86_64/latest/image_id"
}

resource "aws_launch_template" "system" {
  name_prefix = "eks-system-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami.value

  user_data = base64encode(templatefile("${path.module}/userdata/system-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-system-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-system-lt-${var.environment_suffix}"
  }
}

resource "aws_launch_template" "application" {
  name_prefix = "eks-app-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami.value

  user_data = base64encode(templatefile("${path.module}/userdata/app-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-app-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-app-lt-${var.environment_suffix}"
  }
}

resource "aws_launch_template" "gpu" {
  name_prefix = "eks-gpu-${var.environment_suffix}-"
  image_id    = data.aws_ssm_parameter.bottlerocket_ami_gpu.value

  user_data = base64encode(templatefile("${path.module}/userdata/gpu-node.toml", {
    cluster_name     = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-gpu-node-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "eks-gpu-lt-${var.environment_suffix}"
  }
}

resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.system_node_group_desired_size
    max_size     = var.system_node_group_max_size
    min_size     = var.system_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.system.id
    version = "$Latest"
  }

  capacity_type  = "ON_DEMAND"
  instance_types = var.system_node_group_instance_types

  labels = {
    role = "system"
  }

  tags = {
    Name                                                        = "eks-system-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}"   = "owned"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_eks_node_group" "application" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "application-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.app_node_group_desired_size
    max_size     = var.app_node_group_max_size
    min_size     = var.app_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.application.id
    version = "$Latest"
  }

  capacity_type  = "SPOT"
  instance_types = var.app_node_group_instance_types

  labels = {
    role = "application"
  }

  tags = {
    Name                                                        = "eks-app-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}"   = "owned"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_eks_node_group" "gpu" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "gpu-${var.environment_suffix}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.gpu_node_group_desired_size
    max_size     = var.gpu_node_group_max_size
    min_size     = var.gpu_node_group_min_size
  }

  launch_template {
    id      = aws_launch_template.gpu.id
    version = "$Latest"
  }

  capacity_type  = "ON_DEMAND"
  instance_types = var.gpu_node_group_instance_types

  labels = {
    role                       = "gpu"
    "nvidia.com/gpu"           = "true"
    "k8s.amazonaws.com/accelerator" = "nvidia-tesla-t4"
  }

  taints {
    key    = "nvidia.com/gpu"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  tags = {
    Name                                                        = "eks-gpu-ng-${var.environment_suffix}"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}"   = "owned"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}
```

## File: lib/eks-addons.tf

```hcl
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.15.1-eksbuild.1"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-vpc-cni-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.2-eksbuild.2"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-kube-proxy-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "coredns" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.6"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-coredns-${var.environment_suffix}"
  }

  depends_on = [aws_eks_node_group.system]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = var.enable_ebs_csi_driver ? aws_iam_role.ebs_csi_driver[0].arn : null
  resolve_conflicts_on_update = "OVERWRITE"

  tags = {
    Name = "eks-addon-ebs-csi-${var.environment_suffix}"
  }

  depends_on = [
    aws_eks_node_group.system,
    aws_iam_role.ebs_csi_driver
  ]
}
```

## File: lib/iam-irsa.tf

```hcl
locals {
  oidc_provider_arn = aws_iam_openid_connect_provider.eks.arn
  oidc_provider_id  = replace(aws_iam_openid_connect_provider.eks.url, "https://", "")
}

# Cluster Autoscaler IAM Role
resource "aws_iam_role" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  name  = "eks-cluster-autoscaler-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = local.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_provider_id}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${local.oidc_provider_id}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "eks-cluster-autoscaler-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  name  = "cluster-autoscaler-policy"
  role  = aws_iam_role.cluster_autoscaler[0].name

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

# ALB Controller IAM Role
resource "aws_iam_role" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0
  name  = "eks-alb-controller-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = local.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_provider_id}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${local.oidc_provider_id}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "eks-alb-controller-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0
  name  = "alb-controller-policy"
  role  = aws_iam_role.alb_controller[0].name

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

# External Secrets IAM Role
resource "aws_iam_role" "external_secrets" {
  count = var.enable_external_secrets ? 1 : 0
  name  = "eks-external-secrets-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = local.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_provider_id}:sub" = "system:serviceaccount:kube-system:external-secrets"
          "${local.oidc_provider_id}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "eks-external-secrets-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "external_secrets" {
  count = var.enable_external_secrets ? 1 : 0
  name  = "external-secrets-policy"
  role  = aws_iam_role.external_secrets[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecretVersionIds"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:ListSecrets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# EBS CSI Driver IAM Role
resource "aws_iam_role" "ebs_csi_driver" {
  count = var.enable_ebs_csi_driver ? 1 : 0
  name  = "eks-ebs-csi-driver-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = local.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_provider_id}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${local.oidc_provider_id}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name = "eks-ebs-csi-driver-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  count      = var.enable_ebs_csi_driver ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_driver[0].name
}
```

## File: lib/cloudwatch.tf

```hcl
resource "kubernetes_namespace" "amazon_cloudwatch" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name = "amazon-cloudwatch"
    labels = {
      name = "amazon-cloudwatch"
    }
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_service_account" "cloudwatch_agent" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name      = "cloudwatch-agent"
    namespace = kubernetes_namespace.amazon_cloudwatch[0].metadata[0].name
  }

  depends_on = [kubernetes_namespace.amazon_cloudwatch]
}

resource "kubernetes_cluster_role" "cloudwatch_agent" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name = "cloudwatch-agent-role"
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "nodes", "endpoints"]
    verbs      = ["list", "watch"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["replicasets"]
    verbs      = ["list", "watch"]
  }

  rule {
    api_groups = ["batch"]
    resources  = ["jobs"]
    verbs      = ["list", "watch"]
  }

  rule {
    api_groups = [""]
    resources  = ["nodes/proxy"]
    verbs      = ["get"]
  }

  rule {
    api_groups = [""]
    resources  = ["nodes/stats", "configmaps", "events"]
    verbs      = ["create", "get", "list", "watch"]
  }

  rule {
    api_groups     = [""]
    resources      = ["configmaps"]
    resource_names = ["cwagent-clusterleader"]
    verbs          = ["get", "update"]
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_cluster_role_binding" "cloudwatch_agent" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name = "cloudwatch-agent-role-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.cloudwatch_agent[0].metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.cloudwatch_agent[0].metadata[0].name
    namespace = kubernetes_namespace.amazon_cloudwatch[0].metadata[0].name
  }

  depends_on = [
    kubernetes_cluster_role.cloudwatch_agent,
    kubernetes_service_account.cloudwatch_agent
  ]
}

resource "kubernetes_config_map" "cwagentconfig" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name      = "cwagentconfig"
    namespace = kubernetes_namespace.amazon_cloudwatch[0].metadata[0].name
  }

  data = {
    "cwagentconfig.json" = jsonencode({
      logs = {
        metrics_collected = {
          kubernetes = {
            cluster_name = aws_eks_cluster.main.name
            metrics_collection_interval = 60
          }
        }
        force_flush_interval = 5
      }
    })
  }

  depends_on = [kubernetes_namespace.amazon_cloudwatch]
}

resource "kubernetes_daemonset" "cloudwatch_agent" {
  count = var.enable_container_insights ? 1 : 0

  metadata {
    name      = "cloudwatch-agent"
    namespace = kubernetes_namespace.amazon_cloudwatch[0].metadata[0].name
  }

  spec {
    selector {
      match_labels = {
        name = "cloudwatch-agent"
      }
    }

    template {
      metadata {
        labels = {
          name = "cloudwatch-agent"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.cloudwatch_agent[0].metadata[0].name

        container {
          name  = "cloudwatch-agent"
          image = "public.ecr.aws/cloudwatch-agent/cloudwatch-agent:latest"

          resources {
            limits = {
              cpu    = "200m"
              memory = "200Mi"
            }
            requests = {
              cpu    = "200m"
              memory = "200Mi"
            }
          }

          env {
            name = "HOST_IP"
            value_from {
              field_ref {
                field_path = "status.hostIP"
              }
            }
          }

          env {
            name = "HOST_NAME"
            value_from {
              field_ref {
                field_path = "spec.nodeName"
              }
            }
          }

          env {
            name = "K8S_NAMESPACE"
            value_from {
              field_ref {
                field_path = "metadata.namespace"
              }
            }
          }

          env {
            name  = "CI_VERSION"
            value = "k8s/1.3.13"
          }

          volume_mount {
            name       = "cwagentconfig"
            mount_path = "/etc/cwagentconfig"
          }

          volume_mount {
            name       = "rootfs"
            mount_path = "/rootfs"
            read_only  = true
          }

          volume_mount {
            name       = "dockersock"
            mount_path = "/var/run/docker.sock"
            read_only  = true
          }

          volume_mount {
            name       = "varlibdocker"
            mount_path = "/var/lib/docker"
            read_only  = true
          }

          volume_mount {
            name       = "sys"
            mount_path = "/sys"
            read_only  = true
          }

          volume_mount {
            name       = "devdisk"
            mount_path = "/dev/disk"
            read_only  = true
          }
        }

        volume {
          name = "cwagentconfig"
          config_map {
            name = kubernetes_config_map.cwagentconfig[0].metadata[0].name
          }
        }

        volume {
          name = "rootfs"
          host_path {
            path = "/"
          }
        }

        volume {
          name = "dockersock"
          host_path {
            path = "/var/run/docker.sock"
          }
        }

        volume {
          name = "varlibdocker"
          host_path {
            path = "/var/lib/docker"
          }
        }

        volume {
          name = "sys"
          host_path {
            path = "/sys"
          }
        }

        volume {
          name = "devdisk"
          host_path {
            path = "/dev/disk"
          }
        }

        termination_grace_period_seconds = 60
      }
    }
  }

  depends_on = [
    kubernetes_cluster_role_binding.cloudwatch_agent,
    kubernetes_config_map.cwagentconfig
  ]
}
```

## File: lib/terraform.tfvars

```hcl
aws_region         = "ap-southeast-1"
environment_suffix = "prod"
cluster_name       = "eks-cluster"
kubernetes_version = "1.28"

vpc_cidr           = "10.0.0.0/16"
enable_nat_gateway = true
single_nat_gateway = false

system_node_group_instance_types = ["m5.large"]
system_node_group_desired_size   = 2
system_node_group_min_size       = 2
system_node_group_max_size       = 4

app_node_group_instance_types = ["t3.large", "t3a.large", "t2.large"]
app_node_group_desired_size   = 3
app_node_group_min_size       = 2
app_node_group_max_size       = 10

gpu_node_group_instance_types = ["g4dn.xlarge"]
gpu_node_group_desired_size   = 0
gpu_node_group_min_size       = 0
gpu_node_group_max_size       = 3

enable_cluster_autoscaler  = true
enable_alb_controller      = true
enable_external_secrets    = true
enable_ebs_csi_driver      = true
enable_container_insights  = true

cluster_endpoint_public_access  = true
cluster_endpoint_private_access = true
cluster_log_retention_days      = 7
enable_cluster_encryption       = true

namespaces = ["dev", "staging", "production"]
```

## File: lib/userdata/system-node.toml

```toml
[settings]
[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
role = "system"

[settings.kubernetes.node-taints]
# No taints for system nodes
```

## File: lib/userdata/app-node.toml

```toml
[settings]
[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
role = "application"

[settings.kubernetes.node-taints]
# No taints for application nodes
```

## File: lib/userdata/gpu-node.toml

```toml
[settings]
[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
role = "gpu"
"nvidia.com/gpu" = "true"
"k8s.amazonaws.com/accelerator" = "nvidia-tesla-t4"

[settings.kubernetes.node-taints]
nvidia.com/gpu = "true:NoSchedule"
```

## File: lib/kubernetes-manifests/namespaces.yaml

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: dev
  labels:
    name: dev
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
  labels:
    name: staging
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    name: production
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## File: lib/kubernetes-manifests/rbac-dev.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-user
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: dev-role
  namespace: dev
rules:
  - apiGroups: ["", "apps", "batch", "extensions"]
    resources: ["*"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-role-binding
  namespace: dev
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: dev-role
subjects:
  - kind: ServiceAccount
    name: dev-user
    namespace: dev
```

## File: lib/kubernetes-manifests/rbac-staging.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: staging-user
  namespace: staging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: staging-role
  namespace: staging
rules:
  - apiGroups: ["", "apps", "batch", "extensions"]
    resources: ["*"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: staging-role-binding
  namespace: staging
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: staging-role
subjects:
  - kind: ServiceAccount
    name: staging-user
    namespace: staging
```

## File: lib/kubernetes-manifests/rbac-production.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: production-user
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: production-role
  namespace: production
rules:
  - apiGroups: ["", "apps", "batch", "extensions"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: production-role-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: production-role
subjects:
  - kind: ServiceAccount
    name: production-user
    namespace: production
```

## File: lib/kubernetes-manifests/cluster-autoscaler-sa.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: ${cluster_autoscaler_role_arn}
```

## File: lib/kubernetes-manifests/alb-controller-sa.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aws-load-balancer-controller
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: ${alb_controller_role_arn}
```

## File: lib/kubernetes-manifests/external-secrets-sa.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: ${external_secrets_role_arn}
```

## File: lib/README.md

```markdown
# Production-Ready Amazon EKS Cluster

This Terraform configuration deploys a production-grade Amazon EKS cluster with multiple node groups, comprehensive IAM roles, EKS add-ons, and CloudWatch monitoring.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **EKS Cluster**: Kubernetes 1.28 cluster with OIDC provider and KMS encryption
- **Node Groups**:
  - System nodes: m5.large instances for core Kubernetes components (on-demand)
  - Application nodes: Mixed instance types with spot instances for cost optimization
  - GPU nodes: g4dn.xlarge instances for ML workloads (on-demand)
- **IAM Roles for Service Accounts (IRSA)**:
  - Cluster Autoscaler
  - AWS Load Balancer Controller
  - External Secrets Operator
  - EBS CSI Driver
- **EKS Add-ons**:
  - VPC CNI
  - kube-proxy
  - CoreDNS
  - EBS CSI Driver
- **Monitoring**: CloudWatch Container Insights
- **Security**: Pod Security Standards, RBAC, security groups

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- kubectl installed for cluster access

## Deployment Instructions

### 1. Configure Variables

Edit `terraform.tfvars` to set your desired configuration:

```hcl
aws_region         = "ap-southeast-1"
environment_suffix = "prod"  # Change this for different environments
cluster_name       = "eks-cluster"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Planned Changes

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Configure kubectl

After successful deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-cluster-prod
```

### 6. Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 7. Apply Kubernetes Manifests

Apply the RBAC and namespace configurations:

```bash
kubectl apply -f kubernetes-manifests/namespaces.yaml
kubectl apply -f kubernetes-manifests/rbac-dev.yaml
kubectl apply -f kubernetes-manifests/rbac-staging.yaml
kubectl apply -f kubernetes-manifests/rbac-production.yaml
```

Create service accounts for IRSA (replace role ARNs from Terraform outputs):

```bash
# Get role ARNs from Terraform outputs
export CLUSTER_AUTOSCALER_ROLE=$(terraform output -raw cluster_autoscaler_role_arn)
export ALB_CONTROLLER_ROLE=$(terraform output -raw alb_controller_role_arn)
export EXTERNAL_SECRETS_ROLE=$(terraform output -raw external_secrets_role_arn)

# Update service account manifests with role ARNs
sed "s|\${cluster_autoscaler_role_arn}|$CLUSTER_AUTOSCALER_ROLE|g" kubernetes-manifests/cluster-autoscaler-sa.yaml | kubectl apply -f -
sed "s|\${alb_controller_role_arn}|$ALB_CONTROLLER_ROLE|g" kubernetes-manifests/alb-controller-sa.yaml | kubectl apply -f -
sed "s|\${external_secrets_role_arn}|$EXTERNAL_SECRETS_ROLE|g" kubernetes-manifests/external-secrets-sa.yaml | kubectl apply -f -
```

## Node Groups

### System Node Group
- **Purpose**: Core Kubernetes components (CoreDNS, kube-proxy, etc.)
- **Instance Type**: m5.large
- **Capacity**: 2-4 nodes (on-demand)
- **AMI**: Bottlerocket

### Application Node Group
- **Purpose**: Application workloads
- **Instance Types**: t3.large, t3a.large, t2.large (mixed)
- **Capacity**: 2-10 nodes (spot instances)
- **AMI**: Bottlerocket

### GPU Node Group
- **Purpose**: ML/AI workloads requiring GPU acceleration
- **Instance Type**: g4dn.xlarge
- **Capacity**: 0-3 nodes (on-demand, starts at 0)
- **AMI**: Bottlerocket with NVIDIA drivers
- **Taints**: nvidia.com/gpu=true:NoSchedule

## IAM Roles for Service Accounts (IRSA)

The following IRSA roles are configured:

1. **Cluster Autoscaler**: Automatically scales node groups based on pod demands
2. **AWS Load Balancer Controller**: Manages ALB/NLB for Kubernetes services
3. **External Secrets Operator**: Syncs secrets from AWS Secrets Manager
4. **EBS CSI Driver**: Manages EBS volumes for persistent storage

## Security Features

- **Encryption**: EKS secrets encrypted with KMS
- **Pod Security Standards**: Enforced at namespace level
  - Dev/Staging: Baseline enforcement
  - Production: Restricted enforcement
- **Network Security**: Security groups for cluster and node communication
- **RBAC**: Role-based access control for each namespace
- **VPC Endpoints**: Private connectivity to AWS services (S3, ECR, EC2, CloudWatch, STS)

## Monitoring

CloudWatch Container Insights is enabled for:
- Cluster-level metrics
- Node-level metrics
- Pod-level metrics
- Application logs

Access metrics in CloudWatch console under Container Insights.

## Cost Optimization

- **Spot Instances**: Application node group uses spot instances (up to 90% cost savings)
- **VPC Endpoints**: Reduces NAT Gateway data transfer costs
- **Right-sizing**: Mixed instance types for optimal cost-performance
- **Auto-scaling**: Automatic scaling based on actual demand

## Scaling

### Manual Scaling

Scale node groups manually:

```bash
# Scale application node group
aws eks update-nodegroup-config \
  --cluster-name eks-cluster-prod \
  --nodegroup-name application-prod \
  --scaling-config desiredSize=5
```

### Automatic Scaling

Cluster Autoscaler automatically adjusts node group sizes based on pod resource requests.

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

**Warning**: This will delete all resources including the EKS cluster and VPC.

## Troubleshooting

### Node Not Ready

Check node status:
```bash
kubectl describe node <node-name>
```

### Pod Scheduling Issues

Check pod events:
```bash
kubectl describe pod <pod-name> -n <namespace>
```

### IRSA Not Working

Verify service account annotations:
```bash
kubectl get sa <service-account-name> -n <namespace> -o yaml
```

## Outputs

Key outputs from this Terraform configuration:

- `eks_cluster_endpoint`: EKS cluster API endpoint
- `eks_cluster_name`: Name of the EKS cluster
- `configure_kubectl_command`: Command to configure kubectl
- `cluster_autoscaler_role_arn`: IAM role ARN for cluster autoscaler
- `alb_controller_role_arn`: IAM role ARN for ALB controller
- `external_secrets_role_arn`: IAM role ARN for external secrets
- `ebs_csi_driver_role_arn`: IAM role ARN for EBS CSI driver

View all outputs:
```bash
terraform output
```

## Additional Resources

- [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Bottlerocket OS](https://github.com/bottlerocket-os/bottlerocket)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
