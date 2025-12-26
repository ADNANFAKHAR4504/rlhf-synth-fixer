# EKS Fargate Cluster - Terraform Implementation

This implementation provides a complete, production-ready EKS cluster using only Fargate compute profiles for a containerized trading platform.

## Architecture Overview

- VPC with public and private subnets across 2 availability zones
- EKS cluster with Fargate-only compute
- Fargate profiles for kube-system and application workloads
- IAM roles for cluster and pod execution
- Security groups for cluster control plane
- NAT gateways for private subnet internet access

## File: variables.tf

```hcl
variable "environmentSuffix" {
  description = "Unique suffix to ensure resource name uniqueness across deployments"
  type        = string
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
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

variable "app_namespace" {
  description = "Namespace for application workloads"
  type        = string
  default     = "trading-app"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "trading-platform"
    ManagedBy   = "terraform"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}
```

## File: vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-trading-${var.environmentSuffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-trading-${var.environmentSuffix}"
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                = "subnet-public-${count.index + 1}-${var.environmentSuffix}"
    "kubernetes.io/role/elb"                            = "1"
    "kubernetes.io/cluster/eks-cluster-${var.environmentSuffix}" = "shared"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                = "subnet-private-${count.index + 1}-${var.environmentSuffix}"
    "kubernetes.io/role/internal-elb"                   = "1"
    "kubernetes.io/cluster/eks-cluster-${var.environmentSuffix}" = "shared"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environmentSuffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environmentSuffix}"
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
    Name = "rt-public-${var.environmentSuffix}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "rt-private-${count.index + 1}-${var.environmentSuffix}"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: iam.tf

```hcl
# EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "eks-cluster-role-${var.environmentSuffix}"

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

  tags = {
    Name = "eks-cluster-role-${var.environmentSuffix}"
  }
}

# Attach required policies to cluster role
resource "aws_iam_role_policy_attachment" "cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

# Fargate Pod Execution IAM Role
resource "aws_iam_role" "fargate_pod_execution" {
  name = "eks-fargate-pod-execution-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks-fargate-pods.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "eks-fargate-pod-execution-role-${var.environmentSuffix}"
  }
}

# Attach required policy to Fargate pod execution role
resource "aws_iam_role_policy_attachment" "fargate_pod_execution_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_pod_execution.name
}
```

## File: security_groups.tf

```hcl
# Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "eks-cluster-sg-${var.environmentSuffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "eks-cluster-sg-${var.environmentSuffix}"
  }
}

# Allow cluster to communicate with worker nodes
resource "aws_security_group_rule" "cluster_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
  description       = "Allow cluster to communicate with pods"
}

# Allow pods to communicate with cluster API
resource "aws_security_group_rule" "cluster_ingress_pods" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr]
  security_group_id = aws_security_group.cluster.id
  description       = "Allow pods to communicate with cluster API"
}
```

## File: eks_cluster.tf

```hcl
# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eks-cluster-${var.environmentSuffix}"
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name = "eks-cluster-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.cluster_vpc_resource_controller,
  ]
}

# Fargate Profile for kube-system namespace
resource "aws_eks_fargate_profile" "kube_system" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "fargate-profile-kube-system-${var.environmentSuffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = "kube-system"
  }

  tags = {
    Name = "fargate-profile-kube-system-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}

# Fargate Profile for application namespace
resource "aws_eks_fargate_profile" "application" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "fargate-profile-app-${var.environmentSuffix}"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id

  selector {
    namespace = var.app_namespace
  }

  selector {
    namespace = "default"
  }

  tags = {
    Name = "fargate-profile-app-${var.environmentSuffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.fargate_pod_execution_policy,
  ]
}
```

## File: outputs.tf

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
  value       = aws_security_group.cluster.id
}

output "cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = aws_eks_cluster.main.arn
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
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "fargate_profile_kube_system_id" {
  description = "Fargate profile ID for kube-system"
  value       = aws_eks_fargate_profile.kube_system.id
}

output "fargate_profile_application_id" {
  description = "Fargate profile ID for application workloads"
  value       = aws_eks_fargate_profile.application.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.cluster.arn
}

output "fargate_pod_execution_role_arn" {
  description = "IAM role ARN for Fargate pod execution"
  value       = aws_iam_role.fargate_pod_execution.arn
}
```

## File: README.md

```markdown
# EKS Fargate Cluster - Trading Platform

Production-ready EKS cluster infrastructure using only Fargate compute profiles for containerized trading platform workloads.

## Architecture

This Terraform configuration deploys:

- **VPC**: Custom VPC with DNS support and hostnames enabled
- **Subnets**: 2 public and 2 private subnets across 2 availability zones
- **NAT Gateways**: One per availability zone for private subnet internet access
- **EKS Cluster**: Production-ready cluster with logging enabled
- **Fargate Profiles**: Separate profiles for kube-system and application workloads
- **IAM Roles**: Least-privilege roles for cluster and pod execution
- **Security Groups**: Properly configured for pod-to-control-plane communication

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- kubectl (for post-deployment configuration)

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review the Plan

```bash
terraform plan -var="environmentSuffix=prod-001"
```

### 3. Deploy Infrastructure

```bash
terraform apply -var="environmentSuffix=prod-001"
```

### 4. Configure kubectl

```bash
aws eks update-kubeconfig --name eks-cluster-prod-001 --region us-east-1
```

### 5. Verify Cluster

```bash
kubectl get nodes
kubectl get pods -n kube-system
```

## Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| environmentSuffix | Unique suffix for resource names | - | Yes |
| region | AWS region | us-east-1 | No |
| vpc_cidr | VPC CIDR block | 10.0.0.0/16 | No |
| cluster_version | Kubernetes version | 1.28 | No |
| app_namespace | Application namespace | trading-app | No |
| tags | Common resource tags | See variables.tf | No |

## Outputs

- `cluster_endpoint`: EKS cluster API endpoint
- `cluster_name`: EKS cluster name
- `vpc_id`: VPC identifier
- `private_subnet_ids`: Private subnet identifiers
- `fargate_profile_*_id`: Fargate profile identifiers

## Post-Deployment

### Create Application Namespace

```bash
kubectl create namespace trading-app
```

### Deploy Sample Application

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: trading-app-test
  namespace: trading-app
spec:
  containers:
  - name: app
    image: nginx:latest
    ports:
    - containerPort: 80
EOF
```

### Verify Pod is Running on Fargate

```bash
kubectl get pod trading-app-test -n trading-app -o wide
```

## Important Notes

### Fargate-Only Cluster

This cluster uses ONLY Fargate compute profiles. There are no EC2 node groups. All pods will run on Fargate.

### CoreDNS on Fargate

After cluster creation, you may need to patch CoreDNS to run on Fargate:

```bash
kubectl patch deployment coredns \
  -n kube-system \
  --type json \
  -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]'
```

### Namespace Selectors

Fargate profiles are configured for:
- `kube-system` namespace (system pods)
- `trading-app` namespace (application workloads)
- `default` namespace (for testing)

To run pods in other namespaces, create additional Fargate profiles.

### Cost Considerations

Fargate pricing is based on vCPU and memory resources allocated to pods. Monitor your usage to optimize costs.

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environmentSuffix=prod-001"
```

Note: Ensure no workloads are running before destroying the cluster.

## Security

- All IAM roles follow the principle of least privilege
- Cluster logging is enabled for audit purposes
- Private subnets are used for pod networking
- Security groups restrict traffic appropriately

## Troubleshooting

### Pods Not Scheduling

If pods aren't scheduling, verify:
1. The namespace has a matching Fargate profile
2. CoreDNS patch was applied successfully
3. Fargate pod execution role has correct permissions

### CoreDNS Issues

If CoreDNS pods are pending:
```bash
kubectl patch deployment coredns \
  -n kube-system \
  --type json \
  -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]'
```

## Support

For issues or questions, refer to:
- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [EKS Fargate Documentation](https://docs.aws.amazon.com/eks/latest/userguide/fargate.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and adjust values as needed

environmentSuffix = "prod-001"
region            = "us-east-1"
vpc_cidr          = "10.0.0.0/16"
cluster_version   = "1.28"
app_namespace     = "trading-app"

tags = {
  Environment = "production"
  Project     = "trading-platform"
  ManagedBy   = "terraform"
  Team        = "platform-engineering"
  CostCenter  = "trading-ops"
}
```

## Deployment Instructions

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and set your `environmentSuffix`
2. Run `terraform init` to initialize providers
3. Run `terraform plan` to review changes
4. Run `terraform apply` to create infrastructure
5. Configure kubectl: `aws eks update-kubeconfig --name eks-cluster-<suffix> --region us-east-1`
6. Verify: `kubectl get nodes` and `kubectl get pods -n kube-system`

All resources include the environmentSuffix variable for deployment uniqueness and are fully destroyable.
