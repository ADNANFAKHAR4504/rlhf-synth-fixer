# Amazon EKS Cluster Infrastructure

Hey team,

We're building the infrastructure for a payment processing platform that needs Kubernetes. The business wants us to use Amazon EKS for this because they need a managed solution that minimizes operational overhead while meeting strict PCI compliance requirements. I've been asked to create this using **CloudFormation with YAML** for our fintech startup client.

The payment team needs a production-grade EKS cluster running version 1.28 with managed node groups. They're particularly concerned about cost optimization, so we'll be using Spot instances for the worker nodes. Security is paramount here since we're dealing with payment data, so the cluster needs to use private endpoints only, enable full control plane logging, and encrypt all EBS volumes.

One interesting requirement is workload isolation through node taints. The payment workloads will be isolated on dedicated nodes using NoSchedule taints, which means only pods with matching tolerations can run on these nodes. This gives them the segregation they need for compliance.

## What we need to build

Create an **Amazon EKS cluster infrastructure using CloudFormation with YAML** for a payment processing platform.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Configure private API endpoint access only (no public access)
   - Enable OIDC identity provider for IRSA support
   - Add deletion protection using DeletionPolicy: Retain

2. **Managed Node Groups**
   - Configure node group with 2-6 t3.medium Spot instances
   - Use Amazon Linux 2 EKS-optimized AMIs
   - Set up taints for workload isolation: Key=workload, Value=payment, Effect=NoSchedule
   - Implement update policy with MaxUnavailable=1

3. **Control Plane Logging**
   - Enable all log types: api, audit, authenticator, controllerManager, scheduler
   - Configure CloudWatch log group with 30-day retention
   - Ensure logs are exported to CloudWatch for compliance

4. **IAM Configuration**
   - Create IAM roles for cluster with minimal required permissions
   - Create IAM roles for node groups with least privilege
   - Configure OIDC identity provider for the cluster
   - No wildcard resource permissions allowed

5. **Security and Encryption**
   - Enable EBS volume encryption using AWS-managed KMS keys
   - Ensure encryption at rest for all worker nodes
   - Private subnets with NAT gateways for outbound traffic

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **Amazon EC2** with Spot instances for cost optimization
- Use **AWS IAM** for roles and OIDC provider configuration
- Use **Amazon CloudWatch** for control plane logging
- Use **AWS KMS** for EBS volume encryption
- Use **Amazon VPC** with private subnets
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- EKS cluster must use private endpoint access only
- Worker nodes must use Amazon Linux 2 EKS-optimized AMIs exclusively
- All node groups must have encryption at rest enabled
- Cluster logging must export all log types to CloudWatch with 30-day retention
- Node groups must use Spot instances with at least 2 instance types
- OIDC provider must be configured for IRSA
- All IAM roles must follow least privilege with no wildcard resource permissions
- All resources must be destroyable except cluster (which has Retain policy)
- Include proper error handling and parameter validation

### Optional Enhancements

- AWS Load Balancer Controller IRSA role for native ALB/NLB integration
- VPC CNI plugin IRSA role for improved pod networking
- Container Insights for enhanced monitoring

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with all required configurations
- **Performance**: Node groups scale between 2-6 instances based on workload
- **Reliability**: Update policy ensures zero-downtime node group updates
- **Security**: Private endpoints, encryption enabled, least privilege IAM roles
- **Resource Naming**: All resources include environmentSuffix parameter
- **Compliance**: All 10 mandatory requirements implemented
- **Code Quality**: Valid CloudFormation YAML, well-structured, documented

## What to deliver

- Complete CloudFormation YAML implementation
- EKS cluster version 1.28 with private endpoints
- Managed node groups with Spot instances and taints
- IAM roles for cluster and node groups
- OIDC provider configuration
- CloudWatch logging with 30-day retention
- KMS encryption for EBS volumes
- Parameter definitions for environmentSuffix and VPC/subnet configuration
- Outputs for cluster name, endpoint, and OIDC provider ARN
- Documentation and deployment instructions