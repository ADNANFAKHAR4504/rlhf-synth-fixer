### Reasoning Trace
---

The user wants a complete Terraform configuration for a production-ready EKS setup. Let me break down the requirements:

1. EKS cluster named `prod-eks-cluster` using Kubernetes 1.28
2. Two managed node groups with Bottlerocket:
   - `critical`: 3-10 nodes, m5.large, with taint `dedicated=critical:NoSchedule`
   - `general`: 2-20 nodes, mixed m5.large/m5.xlarge
3. IRSA with OIDC provider
4. EKS add-ons: vpc-cni (1.14.0+), coredns, kube-proxy
5. vpc-cni configuration with prefix delegation
6. IAM role for cluster autoscaler
7. Use existing VPC and subnets
8. Security group rules for node-to-node communication
9. Control plane logging
10. Node group labels
11. Outputs for cluster endpoint, CA data, and OIDC URL
12. Modular with variables
13. Standard tags

I'll structure this with:
- `variables.tf` - all input variables
- `main.tf` - main EKS cluster configuration
- `node_groups.tf` - managed node groups
- `iam.tf` - IAM roles and policies
- `addons.tf` - EKS add-ons
- `outputs.tf` - outputs
- `versions.tf` - provider requirements

Let me create a comprehensive configuration.
### Answer 
---

I'll create a complete, production-ready EKS Terraform configuration that meets all your requirements. The configuration is modular and structured for easy maintenance.

## Terraform Configuration Structure

### `versions.tf`
```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  default_tags {
    tags = var.common_tags
  }
}
```

### `variables.tf`
```hcl
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "prod-eks-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_id" {
  description = "ID of the existing VPC"
  type        = string
  default     = "vpc-12345"
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the EKS cluster"
  type        = list(string)
  default     = ["subnet-abc123", "subnet-def456", "subnet-ghi789"]
}

variable "critical_node_group_config" {
  description = "Configuration for critical node group"
  type = object({
    min_size       = number
    max_size       = number
    desired_size   = number
    instance_types = list(string)
  })
  default = {
    min_size       = 3
    max_size       = 10
    desired_size   = 3
    instance_types = ["m5.large"]
  }
}

variable "general_node_group_config" {
  description = "Configuration for general node group"
  type = object({
    min_size       = number
    max_size       = number
    desired_size   = number
    instance_types = list(string)
  })
  default = {
    min_size       = 2
    max_size       = 20
    desired_size   = 2
    instance_types = ["m5.large", "m5.xlarge"]
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Team        = "platform"
    CostCenter  = "engineering"
  }
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler IAM role and policy"
  type        = bool
  default     = true
}
```

### `main.tf`
```hcl
# Data sources for existing resources
data "aws_vpc" "existing" {
  id = var.vpc_id
}

data "aws_subnets" "private" {
  filter {
    name   = "subnet-id"
    values = var.private_subnet_ids
  }
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

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

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-cluster-role"
    }
  )
}

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
  name        = "${var.cluster_name}-cluster-sg"
  description = "Security group for EKS cluster control plane"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-cluster-sg"
    }
  )
}

# Security Group for Node Groups
resource "aws_security_group" "eks_nodes" {
  name        = "${var.cluster_name}-nodes-sg"
  description = "Security group for EKS node groups"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name                                        = "${var.cluster_name}-nodes-sg"
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    }
  )
}

# Allow node-to-node communication on all ports
resource "aws_security_group_rule" "node_to_node_all" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_nodes.id
  description              = "Allow node to node communication on all ports"
}

# Allow cluster to node communication
resource "aws_security_group_rule" "cluster_to_nodes" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_cluster.id
  security_group_id        = aws_security_group.eks_nodes.id
  description              = "Allow cluster control plane to communicate with nodes"
}

# Allow nodes to cluster API
resource "aws_security_group_rule" "nodes_to_cluster" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_cluster.id
  description              = "Allow nodes to communicate with cluster API"
}

# CloudWatch Log Group for EKS Control Plane Logs
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-logs"
    }
  )
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = merge(
    var.common_tags,
    {
      Name = var.cluster_name
    }
  )
}

# OIDC Provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-oidc-provider"
    }
  )
}
```

### `node_groups.tf`
```hcl
# IAM Role for Node Groups
resource "aws_iam_role" "eks_nodes" {
  name = "${var.cluster_name}-node-role"

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

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-node-role"
    }
  )
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

resource "aws_iam_role_policy_attachment" "eks_ssm_managed_instance_core" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_nodes.name
}

# Launch Template for Critical Node Group
resource "aws_launch_template" "critical" {
  name_prefix = "${var.cluster_name}-critical-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(templatefile("${path.module}/bottlerocket-userdata.toml", {
    cluster_name     = var.cluster_name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
    node_labels = {
      "nodegroup-type" = "critical"
    }
    node_taints = {
      "dedicated" = "critical:NoSchedule"
    }
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.common_tags,
      {
        Name = "${var.cluster_name}-critical-node"
      }
    )
  }
}

# Launch Template for General Node Group
resource "aws_launch_template" "general" {
  name_prefix = "${var.cluster_name}-general-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(templatefile("${path.module}/bottlerocket-userdata.toml", {
    cluster_name     = var.cluster_name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    cluster_ca       = aws_eks_cluster.main.certificate_authority[0].data
    node_labels = {
      "nodegroup-type" = "general"
    }
    node_taints = {}
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.common_tags,
      {
        Name = "${var.cluster_name}-general-node"
      }
    )
  }
}

# Critical Node Group
resource "aws_eks_node_group" "critical" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "critical"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.critical_node_group_config.desired_size
    max_size     = var.critical_node_group_config.max_size
    min_size     = var.critical_node_group_config.min_size
  }

  instance_types = var.critical_node_group_config.instance_types
  ami_type       = "BOTTLEROCKET_x86_64"
  
  launch_template {
    id      = aws_launch_template.critical.id
    version = "$Latest"
  }

  labels = {
    "nodegroup-type" = "critical"
  }

  taint {
    key    = "dedicated"
    value  = "critical"
    effect = "NO_SCHEDULE"
  }

  update_config {
    max_unavailable_percentage = 33
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_ssm_managed_instance_core
  ]

  tags = merge(
    var.common_tags,
    {
      Name                     = "${var.cluster_name}-critical"
      "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"             = "true"
    }
  )
}

# General Node Group
resource "aws_eks_node_group" "general" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "general"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.general_node_group_config.desired_size
    max_size     = var.general_node_group_config.max_size
    min_size     = var.general_node_group_config.min_size
  }

  instance_types = var.general_node_group_config.instance_types
  ami_type       = "BOTTLEROCKET_x86_64"

  launch_template {
    id      = aws_launch_template.general.id
    version = "$Latest"
  }

  labels = {
    "nodegroup-type" = "general"
  }

  update_config {
    max_unavailable_percentage = 33
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_ssm_managed_instance_core
  ]

  tags = merge(
    var.common_tags,
    {
      Name                     = "${var.cluster_name}-general"
      "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
      "k8s.io/cluster-autoscaler/enabled"             = "true"
    }
  )
}
```

### `bottlerocket-userdata.toml`
```toml
[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
%{ for key, value in node_labels ~}
"${key}" = "${value}"
%{ endfor ~}

%{ if length(node_taints) > 0 ~}
[settings.kubernetes.node-taints]
%{ for key, value in node_taints ~}
"${key}" = "${value}"
%{ endfor ~}
%{ endif ~}
```

### `addons.tf`
```hcl
# IAM Role for VPC CNI
resource "aws_iam_role" "vpc_cni" {
  name = "${var.cluster_name}-vpc-cni-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-node"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-vpc-cni-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "vpc_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.vpc_cni.name
}

# VPC CNI Add-on
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = "v1.14.0-eksbuild.3"
  service_account_role_arn = aws_iam_role.vpc_cni.arn

  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true"
      WARM_PREFIX_TARGET      = "1"
    }
  })

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-vpc-cni"
    }
  )
}

# CoreDNS Add-on
resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"
  
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-coredns"
    }
  )
}

# Kube-proxy Add-on
resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"
  
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.critical,
    aws_eks_node_group.general
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-kube-proxy"
    }
  )
}
```

### `iam.tf`
```hcl
# Cluster Autoscaler IAM Role
resource "aws_iam_role" "cluster_autoscaler" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  name  = "${var.cluster_name}-cluster-autoscaler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-cluster-autoscaler-role"
    }
  )
}

# Cluster Autoscaler IAM Policy
resource "aws_iam_policy" "cluster_autoscaler" {
  count       = var.enable_cluster_autoscaler ? 1 : 0
  name        = "${var.cluster_name}-cluster-autoscaler-policy"
  description = "IAM policy for Cluster Autoscaler"

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
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
          }
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.cluster_name}-cluster-autoscaler-policy"
    }
  )
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  count      = var.enable_cluster_autoscaler ? 1 : 0
  policy_arn = aws_iam_policy.cluster_autoscaler[0].arn
  role       = aws_iam_role.cluster_autoscaler[0].name
}
```

### `outputs.tf`
```hcl
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster's OIDC identity provider"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "cluster_id" {
  description = "The name/id of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the cluster"
  value       = aws_eks_cluster.main.arn
}

output "cluster_version" {
  description = "The Kubernetes server version for the cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.eks_nodes.id
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for IRSA"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the IAM role for cluster autoscaler"
  value       = var.enable_cluster_autoscaler ? aws_iam_role.cluster_autoscaler[0].arn : null
}

output "node_groups" {
  description = "Details of the EKS node groups"
  value = {
    critical = {
      id            = aws_eks_node_group.critical.id
      arn           = aws_eks_node_group.critical.arn
      status        = aws_eks_node_group.critical.status
      capacity_type = aws_eks_node_group.critical.capacity_type
    }
    general = {
      id            = aws_eks_node_group.general.id
      arn           = aws_eks_node_group.general.arn
      status        = aws_eks_node_group.general.status
      capacity_type = aws_eks_node_group.general.capacity_type
    }
  }
}

output "kubeconfig_command" {
  description = "AWS CLI command to update kubeconfig"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name}"
}
```

## Usage Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Customize Variables (optional):**
Create a `terraform.tfvars` file:
```hcl
vpc_id             = "vpc-your-actual-id"
private_subnet_ids = ["subnet-real1", "subnet-real2", "subnet-real3"]

common_tags = {
  Environment = "production"
  Team        = "your-team"
  CostCenter  = "your-cost-center"
}
```

3. **Plan and Apply:**
```bash
terraform plan
terraform apply
```

4. **Configure kubectl:**
```bash
aws eks update-kubeconfig --name prod-eks-cluster
```

5. **Deploy Cluster Autoscaler (optional):**
After the cluster is created, you can deploy the cluster autoscaler using the IAM role ARN from the output.

## Key Features

- **Production-Ready**: Includes security best practices, proper IAM roles, and network isolation
- **Modular Design**: Easy to integrate with existing infrastructure
- **IRSA Enabled**: Supports pod-level IAM roles via OIDC
- **Bottlerocket AMI**: Uses AWS's container-optimized OS for better security and performance
- **Autoscaling Ready**: Pre-configured IAM roles and tags for cluster autoscaler
- **Comprehensive Logging**: All control plane logs enabled
- **Prefix Delegation**: VPC CNI configured for improved IP address utilization

This configuration provides a solid foundation for running production workloads on EKS while maintaining flexibility for customization based on specific requirements.