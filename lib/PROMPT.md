# Production EKS Cluster Deployment

Hey team,

We need to build a production-grade Amazon EKS cluster infrastructure for a fintech company that's migrating their microservices architecture from self-managed Kubernetes. They need strict security controls, cost optimization through mixed instance types, and integration with their existing monitoring stack.

The business is looking for a robust solution that balances security with cost efficiency. They want to leverage Graviton2 instances for better price-performance, use spot instances where appropriate for non-critical workloads, and maintain enterprise-grade security with envelope encryption and private endpoints.

I've been asked to create this infrastructure using **CDKTF with Python**. The cluster needs to run EKS version 1.28 with private API endpoints, managed node groups with mixed capacity types, and full integration with AWS services like KMS for secrets encryption and CloudWatch for logging.

## What we need to build

Create a production-ready Amazon EKS cluster infrastructure using **CDKTF with Python** that provides secure, cost-optimized Kubernetes orchestration for microservices workloads.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Configure private API endpoint accessible only from within VPC
   - Enable cluster endpoint private access
   - Deploy in existing VPC (10.0.0.0/16) with private subnets

2. **Managed Node Groups**
   - Critical workloads node group: on-demand t4g.large instances (min: 2, max: 6)
   - Non-critical workloads node group: spot t4g.medium instances (min: 1, max: 10)
   - Both groups using Graviton2 (ARM-based) instances for cost optimization
   - Configure across 3 availability zones: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24

3. **AWS EKS Add-ons**
   - VPC CNI plugin version 1.14.x for pod networking
   - CoreDNS version 1.10.x for service discovery
   - kube-proxy version 1.28.x for network proxy

4. **OIDC Identity Provider**
   - Create and associate OIDC provider with cluster
   - Configure proper thumbprint for IRSA (IAM Roles for Service Accounts) functionality
   - Enable workload identity integration

5. **Security and Encryption**
   - Implement KMS key with automatic rotation for envelope encryption of Kubernetes secrets
   - Configure cluster security group with ingress rules allowing only 10.0.0.0/16 CIDR on port 443
   - Enforce IMDSv2 for all node instances
   - Enable EBS encryption for node volumes

6. **IAM Configuration**
   - Set up IAM roles and policies for cluster autoscaler
   - Configure node group auto-discovery tags for autoscaling
   - Implement least privilege access patterns
   - Create service roles for EKS cluster and node groups

7. **Logging and Monitoring**
   - Enable EKS control plane logging for 'api' and 'authenticator' logs only
   - Send logs to CloudWatch Logs
   - Enable detailed monitoring for node instances
   - Configure log retention policies

8. **Launch Templates**
   - Create launch templates enforcing IMDSv2
   - Enable EBS encryption
   - Configure monitoring settings
   - Apply to all node group instances

9. **Outputs**
   - Cluster endpoint URL
   - OIDC issuer URL
   - Kubeconfig authentication command
   - Node group names and ARNs

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **VPC** with private subnets for network isolation
- Use **EC2** t4g.large and t4g.medium (Graviton2) instances for nodes
- Use **IAM** for access control and service roles
- Use **KMS** for secrets encryption with automatic key rotation
- Use **CloudWatch Logs** for control plane logging
- Use **OIDC** identity provider for IRSA functionality
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Deploy to **us-east-1** region

### Constraints

- Must use private API endpoint only (no public access)
- Security groups must restrict ingress to 10.0.0.0/16 CIDR block on port 443
- Must use EKS version 1.28 specifically
- Must deploy in existing VPC structure with specified subnets
- All resources must be destroyable (no Retain deletion policies)
- Must enforce IMDSv2 on all EC2 instances
- Must enable EBS encryption on all volumes
- Include proper error handling and logging
- Control plane logs limited to 'api' and 'authenticator' only

## Success Criteria

- **Functionality**: Complete EKS cluster with managed node groups, add-ons, and OIDC provider
- **Performance**: Node groups scale appropriately with configured min/max sizes
- **Reliability**: Multi-AZ deployment across three availability zones
- **Security**: Private endpoints, KMS encryption, IMDSv2, restricted security groups
- **Cost Optimization**: Graviton2 instances, mixed on-demand and spot capacity
- **Resource Naming**: All resources include environmentSuffix for isolation
- **Code Quality**: CDKTF Python code, well-tested, documented
- **Outputs**: Cluster endpoint, OIDC issuer, and kubeconfig command available

## What to deliver

- Complete CDKTF Python implementation with modular structure
- Separate files for EKS cluster configuration
- Separate files for managed node groups
- Separate files for IAM roles and policies
- Separate files for EKS add-ons configuration
- Launch template configurations for node groups
- KMS key setup with automatic rotation
- OIDC provider integration
- Security group rules and network configuration
- CloudWatch logging configuration
- Unit tests for all components with 100% coverage target
- Integration tests using deployed resources
- Documentation and deployment instructions
