# Production EKS Cluster Infrastructure

Hey team,

We've got a fintech startup that needs a production-ready Kubernetes environment for their microservices architecture. They're processing financial data and need strict security compliance, automated deployments, and the ability to handle varying traffic loads. This is a production system, so everything needs to be solid from day one.

I've been asked to build this using **CloudFormation with JSON**. The business wants a managed EKS cluster that's secure, scalable, and fully observable. They're particular about keeping the API endpoint private and want comprehensive logging for compliance purposes.

The infrastructure needs to support their microservices deployment pipeline and integrate with their existing IAM setup. They're planning to use IRSA (IAM Roles for Service Accounts) for pod-level permissions, so we need to set up the OIDC provider from the start.

## What we need to build

Create a production-ready EKS cluster infrastructure using **CloudFormation with JSON** that provides a secure, scalable Kubernetes environment for financial services microservices.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Configure private API endpoint access only (no public exposure)
   - Enable all control plane logging types (api, audit, authenticator, controllerManager, scheduler)
   - Set CloudWatch Logs retention to 30 days for all log groups
   - Create and associate OIDC identity provider for service account integration

2. **Managed Node Group**
   - Deploy t3.large instances across exactly 3 availability zones
   - Configure auto-scaling: minimum 2 nodes, maximum 10 nodes, desired 4 nodes
   - Use Amazon Linux 2 AMI type
   - Ensure nodes span multiple AZs for high availability

3. **IAM Configuration**
   - Create EKS service role with required AWS managed policies
   - Create worker node IAM role with policies for EKS operations
   - Configure OIDC provider for IAM Roles for Service Accounts (IRSA)

4. **Resource Management**
   - Apply consistent tagging across all resources (Environment, Owner, CostCenter)
   - All resource names must include **environmentSuffix** parameter for uniqueness
   - Follow naming convention: resource-type-environment-suffix

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **EKS** for managed Kubernetes cluster
- Use **IAM** for service and node authentication
- Use **CloudWatch** for control plane logging with 30-day retention
- Use **EC2** for managed node groups
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- EKS cluster must use managed node groups with t3.large instances only
- Node groups must span exactly 3 availability zones with auto-scaling between 2-10 nodes
- Control plane logging must be enabled for all log types with 30-day retention
- OIDC provider must be configured for IRSA (IAM Roles for Service Accounts)
- Private endpoint access only - no public API endpoint exposure
- All resources must use consistent tagging: Environment, Owner, CostCenter
- CloudFormation stack must complete deployment within 25 minutes
- Include proper error handling and resource dependencies

### Deployment Requirements (CRITICAL)

- All resources must include the **environmentSuffix** parameter in their names
- Use CloudFormation Parameters for environmentSuffix, VPC subnets, and tags
- All resources must have RemovalPolicy equivalent (DeletionPolicy: Delete)
- FORBIDDEN: DeletionPolicy: Retain on any resource
- Stack must be fully destroyable without manual intervention
- Ensure proper DependsOn attributes for resource creation order

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with managed nodes running
- **Security**: Private endpoint only, proper IAM roles, OIDC configured
- **Observability**: All control plane logs flowing to CloudWatch with 30-day retention
- **Scalability**: Auto-scaling configured and functional (2-10 nodes)
- **High Availability**: Nodes distributed across 3 availability zones
- **Resource Naming**: All resources include environmentSuffix parameter
- **Compliance**: Consistent tagging across all resources
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete **CloudFormation JSON** template with all resources
- EKS cluster version 1.28 with private endpoint
- Managed node group with t3.large instances
- IAM roles for EKS service and worker nodes
- OIDC identity provider configuration
- CloudWatch log groups with 30-day retention
- Parameters for environmentSuffix, VPC subnets, and tags
- Outputs for cluster endpoint, OIDC issuer URL, and node group ARN
- CloudFormation template documentation and deployment instructions
