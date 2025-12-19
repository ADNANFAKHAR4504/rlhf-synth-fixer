# Amazon EKS

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **tf**
> Language: **hcl**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Terraform configuration to deploy a production-ready EKS cluster for payment processing workloads.

## Background

Infrastructure as Code implementation task for deploying a production-grade Amazon EKS cluster optimized for payment processing workloads. This requires careful consideration of security, availability, and compliance requirements typical of financial transaction systems.

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately
- Consider PCI-DSS compliance requirements for payment processing

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${var.environment_suffix}` for Terraform
- Examples:
  - EKS Cluster: `payment-eks-${var.environment_suffix}`
  - VPC: `payment-vpc-${var.environment_suffix}`
  - Security Group: `payment-sg-${var.environment_suffix}`
- **Validation**: Every resource with a `name` or similar property MUST include environment_suffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `prevent_destroy = true` lifecycle blocks
  - Protection settings that block deletion
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### EKS Cluster Configuration
- Use appropriate Kubernetes version (latest stable)
- Enable control plane logging (audit, authenticator, API server, controller manager, scheduler)
- Configure private endpoint access for enhanced security
- Enable public endpoint access for CI/CD purposes
- Use managed node groups for easier lifecycle management

#### VPC and Networking
- Create dedicated VPC with appropriate CIDR ranges
- Configure public and private subnets across multiple AZs for high availability
- **NAT Gateway**: Create only 1 NAT Gateway (not per AZ) for cost optimization
- Enable VPC Flow Logs for security monitoring
- Tag subnets appropriately for EKS auto-discovery:
  - `kubernetes.io/cluster/${cluster_name} = shared`
  - `kubernetes.io/role/elb = 1` for public subnets
  - `kubernetes.io/role/internal-elb = 1` for private subnets

#### IAM Roles and Policies
- Create EKS cluster service role with required AWS managed policies:
  - `AmazonEKSClusterPolicy`
  - `AmazonEKSVPCResourceController`
- Create node group IAM role with required policies:
  - `AmazonEKSWorkerNodePolicy`
  - `AmazonEKS_CNI_Policy`
  - `AmazonEC2ContainerRegistryReadOnly`
- Follow principle of least privilege

#### Security Groups
- Configure cluster security group with appropriate ingress/egress rules
- Allow node-to-node communication
- Allow control plane to node communication on required ports
- Restrict access appropriately for payment processing security

#### Node Groups
- Use managed node groups for simplified operations
- Configure appropriate instance types (t3.medium or larger for production)
- Set desired_size, min_size, max_size appropriately (consider 2-4 nodes for test environment)
- Enable auto-scaling for production workloads
- Configure disk size appropriately (minimum 20GB)

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Use `var.region` or data sources instead of hardcoded `us-east-1`
- **USE**: Variables, data sources, or locals instead

### Cross-Resource References
- Ensure all resource references use proper attributes or data sources
- Verify dependencies are explicit (use `depends_on` when necessary)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Terraform)
```hcl
resource "aws_eks_cluster" "main" {
  name     = "payment-eks-${var.environment_suffix}"  # ✅ CORRECT
  role_arn = aws_iam_role.eks_cluster.arn
  # ...
}

# ❌ WRONG:
# name = "payment-eks-prod"  # Hardcoded, will fail
```

### Correct Lifecycle Configuration (Terraform)
```hcl
resource "aws_eks_cluster" "main" {
  name     = "payment-eks-${var.environment_suffix}"
  # DO NOT add prevent_destroy = true
  # ✅ CORRECT: No lifecycle block or skip_final_snapshot = true for RDS
}
```

### VPC Configuration Example
```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                           = "payment-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/payment-eks-${var.environment_suffix}" = "shared"
  }
}
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- EKS cluster deploys successfully with proper networking configuration
- All security and compliance constraints are met for payment processing
- Control plane logging is enabled
- IAM roles follow least privilege principle
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Node groups can successfully join the cluster
- VPC and subnets are properly configured with correct tags for EKS
