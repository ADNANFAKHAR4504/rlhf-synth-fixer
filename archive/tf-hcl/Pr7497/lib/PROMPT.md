# Infrastructure as Code Task

## Platform and Language
**CRITICAL REQUIREMENT**: Use **Terraform with HCL** for this implementation. This is NON-NEGOTIABLE.

## Background
A fintech startup needs to establish a production-grade Kubernetes environment for their microservices architecture. The platform must support blue-green deployments and comply with financial industry security standards.

## Problem Statement
Create a Terraform configuration to deploy a production EKS cluster with advanced networking and autoscaling capabilities.

MANDATORY REQUIREMENTS (Must complete):
1. Create VPC with 3 private subnets across different AZs, each with /24 CIDR blocks (CORE: VPC)
2. Deploy EKS cluster version 1.28+ with OIDC provider enabled (CORE: EKS)
3. Configure managed node group with t4g.medium instances, min 2, max 6 nodes
4. Enable VPC CNI addon with network policy support for pod-level security
5. Create IRSA roles for Karpenter and AWS Load Balancer Controller
6. Deploy Karpenter using Helm provider with proper IAM permissions
7. Configure EKS control plane logging for audit, authenticator, and controllerManager
8. Implement NAT instances (not NAT Gateway) for cost optimization
9. Create necessary security groups with strict ingress/egress rules
10. Tag all resources with Environment=production and ManagedBy=terraform

OPTIONAL ENHANCEMENTS (If time permits):
 Add AWS Load Balancer Controller for native ALB/NLB integration (OPTIONAL: EC2) - enables Kubernetes Ingress
 Implement Secrets Manager CSI driver for secure secret management (OPTIONAL: Secrets Manager) - improves security posture
 Add CloudWatch Container Insights for cluster monitoring (OPTIONAL: CloudWatch) - provides deep observability

Expected output: Complete Terraform configuration that provisions a production-ready EKS cluster with Karpenter autoscaling, private networking, and IRSA authentication. The cluster should be immediately usable for deploying containerized workloads with kubectl.

## Constraints
1. EKS cluster must use Kubernetes version 1.28 or higher
2. All worker nodes must use Graviton3-based instances (t4g family)
3. Implement pod-to-pod encryption using AWS VPC CNI network policies
4. Configure IRSA (IAM Roles for Service Accounts) for all workload identities
5. Enable EKS control plane logging for audit, authenticator, and controllerManager
6. Use only private subnets for worker nodes with no direct internet access
7. Implement Karpenter for node autoscaling instead of traditional ASGs

## Environment Details
Production Kubernetes infrastructure deployed in eu-central-1 across 3 availability zones. Core services include EKS 1.28 cluster with managed node groups, VPC with private subnets only, NAT instances for egress traffic, and Application Load Balancer for ingress. Requires Terraform 1.5+, kubectl 1.28+, and AWS CLI v2 configured with appropriate permissions. The VPC spans 10.0.0.0/16 with /24 subnets per AZ. EKS cluster uses OIDC provider for IRSA integration and Karpenter v0.31+ for intelligent node provisioning.

## Infrastructure Requirements

### Naming Convention
ALL resources MUST include environmentSuffix for uniqueness:
- Format: `{resource-type}-${var.environment_suffix}`
- Example: `eks-cluster-${var.environment_suffix}`

### Destroyability
ALL resources must be destroyable:
- No retention policies
- No deletion protection
- Enable force destroy where applicable

### Region
- Default: us-east-1 (unless specified otherwise in Environment Details)
- Check lib/AWS_REGION file for region override

### Tags
Apply these tags to ALL resources:
- Environment: production
- ManagedBy: terraform
- Team: synth
- TaskID: 101912832
