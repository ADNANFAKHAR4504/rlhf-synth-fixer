Hey team,

We've been tasked with building out a production-grade Kubernetes platform for a financial services company. They're moving away from their legacy EC2-based architecture to containers, and need a robust, multi-tenant EKS environment that can handle different workload types while maintaining strict security and compliance standards. The infrastructure folks have asked us to create this using **CDKTF with Python** since they've standardized on that combination for their IaC pipelines.

The business context here is interesting. They're running microservices that process financial transactions, batch jobs for reconciliation, and various API services. Different teams will be deploying to this cluster, so we need solid multi-tenancy with network isolation. They're also under PCI compliance requirements, which means encryption everywhere, tight access controls, and comprehensive audit logging.

The tricky part is they want to optimize costs without sacrificing reliability. That means mixing spot and on-demand instances intelligently, using cluster autoscaler to handle variable workloads, and making sure we're not routing traffic through expensive NAT gateways when we don't need to. They specifically want Calico CNI instead of the AWS VPC CNI because their security team needs more sophisticated network policy controls.

## What we need to build

Create an EKS cluster infrastructure using **CDKTF with Python** that supports multi-tenant workloads with advanced security features and cost optimization. This needs to be production-ready for a financial services environment with PCI compliance requirements.

## Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS version 1.28 in us-east-2 region
   - Configure private API endpoint for internal access only
   - Restrict public access to specific CIDR blocks provided at deployment time
   - Enable control plane logging for audit, authenticator, and scheduler components
   - Configure CloudWatch log groups with KMS encryption and 90-day retention
   - Set up OIDC provider for service account federation

2. **Multi-Tenant Node Groups**
   - Critical workloads node group: on-demand m5.large instances with appropriate labels and taints
   - General workloads node group: mixed spot and on-demand t3.medium instances for standard services
   - Batch processing node group: spot-only c5.large instances for cost-sensitive batch jobs
   - All node groups must use Bottlerocket OS AMI for enhanced security
   - Configure proper taints and labels for workload segregation across node groups
   - Implement cluster autoscaler with priority expander preferring spot instances

3. **Networking and CNI**
   - Deploy Calico CNI as Kubernetes addon using Terraform's kubernetes provider
   - Enable network policy enforcement by default for pod-to-pod traffic control
   - Configure VPC with private subnets across 3 availability zones
   - Set up dedicated pod subnets (100.64.0.0/16) separate from node subnets
   - Create VPC endpoints for ECR, S3, and EC2 to avoid NAT gateway traffic
   - Include NAT gateways for outbound internet access where required

4. **Security and Encryption**
   - Create KMS key with automatic rotation enabled for EKS secrets encryption
   - Configure separate KMS keys for each tenant namespace
   - Enable envelope encryption for Kubernetes secrets at rest
   - Implement pod security standards at namespace level with restricted policy as default
   - Set baseline policy for system namespaces
   - Configure admission controllers for pod security enforcement

5. **IAM and Access Control**
   - Set up IRSA (IAM Roles for Service Accounts) with fine-grained policies
   - Create IAM roles and policies for cluster-autoscaler
   - Create IAM roles and policies for aws-load-balancer-controller
   - Create IAM roles and policies for external-dns
   - Configure OIDC provider integration with Azure AD for developer authentication
   - Implement group-based RBAC mapping from Azure AD groups to Kubernetes roles

6. **EKS Managed Addons**
   - Install CoreDNS with custom configuration overrides
   - Install kube-proxy with custom configuration overrides
   - Install EBS CSI driver with custom configuration overrides
   - Ensure all addons are deployed as EKS managed addons for easier updates

7. **Secrets Management**
   - Integrate AWS Secrets Manager with external secrets operator
   - Configure cross-account access capabilities for secrets retrieval
   - Set up proper IAM policies for secrets access from pods

8. **Monitoring and Operations**
   - Enable CloudWatch Container Insights for cluster monitoring
   - Configure Systems Manager for secure node access without SSH
   - Set up CloudWatch alarms for cluster health metrics
   - Enable audit logging with 90-day retention requirement

9. **Cost Optimization**
   - Configure cluster autoscaler with appropriate scaling policies
   - Use spot instances for at least 50% of non-critical workload capacity
   - Implement priority-based node group selection favoring cost-effective options
   - Tag all resources appropriately for cost allocation

## Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to us-east-2 region across 3 availability zones
- Use EKS version 1.28
- Use Bottlerocket OS for all node groups
- Resource names must include environment_suffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and validation in the code

## AWS Services to Implement

The implementation must include all of these AWS services:
- EKS (Elastic Kubernetes Service) - cluster and managed node groups
- VPC (Virtual Private Cloud) - networking foundation
- EC2 - for node groups and VPC endpoints
- KMS (Key Management Service) - encryption keys with rotation
- IAM (Identity and Access Management) - roles and policies for IRSA
- CloudWatch - logs, Container Insights, and alarms
- Secrets Manager - external secrets integration
- Systems Manager - secure node access
- VPC Endpoints - for ECR, S3, and EC2 services

## Constraints and Compliance

- PCI compliance standards must be met
- Enable audit logging with 90-day retention in CloudWatch
- Implement OIDC authentication with Azure AD integration
- Use only managed node groups (no self-managed)
- Configure IRSA for all workload pods requiring AWS access
- Implement pod security standards with admission controllers
- Enable envelope encryption using AWS KMS for Kubernetes secrets
- Use Calico CNI instead of default AWS VPC CNI
- All secrets must be stored in AWS Secrets Manager, not in code

## Success Criteria

- Functionality: EKS cluster deploys successfully with all node groups operational
- Security: All encryption enabled, IRSA configured, pod security policies enforced
- Networking: Calico CNI operational with network policies, VPC endpoints working
- Compliance: Audit logs enabled, 90-day retention configured, PCI requirements met
- Cost: Spot instances used for appropriate workloads, autoscaler configured
- Monitoring: CloudWatch Container Insights enabled, logs flowing correctly
- Resource Naming: All resources include environment_suffix parameter
- Code Quality: Python code follows best practices, well-structured, documented

## What to deliver

- Complete CDKTF Python implementation with proper project structure
- EKS cluster with version 1.28 and private endpoint configuration
- Three managed node groups (critical, general, batch) with appropriate instance types and taints
- Calico CNI addon installed and configured
- KMS keys for secrets encryption with automatic rotation
- IRSA setup for cluster-autoscaler, aws-load-balancer-controller, and external-dns
- VPC with private subnets, NAT gateways, and VPC endpoints
- CloudWatch log groups with encryption and 90-day retention
- Pod security standards implementation
- AWS Secrets Manager integration
- Systems Manager configuration for node access
- Unit tests covering all infrastructure components
- Documentation explaining the architecture and deployment process