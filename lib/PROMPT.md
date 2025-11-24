# Production EKS Cluster with Advanced Networking and Autoscaling

Hey team,

We've got a request from the financial services division to build out a production-grade Kubernetes platform for their trading applications. They're currently running some legacy systems on EC2, but they want to modernize with containers while maintaining strict security and reliability requirements. The business needs this to handle variable workloads throughout trading hours, with automatic scaling and cost optimization through spot instances.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The architecture team has specified that we need a fully featured EKS cluster with custom networking, multiple node groups for workload separation, and proper IAM integration for service accounts. They want private API endpoints only for security, and we need to deploy across three availability zones for high availability.

The trading platform will have both system-level services like monitoring and logging, as well as application workloads that need to scale rapidly during market hours. We're targeting cost optimization by using Graviton3-based spot instances across multiple instance types. The cluster needs to integrate with their existing CloudWatch monitoring setup and support automatic scaling based on demand.

## What we need to build

Create a production-ready EKS cluster infrastructure using **Pulumi with TypeScript** for a financial services trading application platform.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Configure private API endpoint access only (no public access)
   - Enable all control plane logging types (api, audit, authenticator, controllerManager, scheduler)
   - Set up OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Create CloudWatch log groups with 7-day retention for all control plane logs

2. **Custom VPC and Networking**
   - Create dedicated VPC with CIDR 10.0.0.0/16
   - Configure 3 private subnets for EKS nodes across availability zones us-east-1a, us-east-1b, us-east-1c
   - Add secondary CIDR block 100.64.0.0/16 for pod networking
   - Create 3 additional private subnets from secondary CIDR for pods
   - Install and configure VPC CNI addon with custom environment variables to use secondary CIDR for pod IPs
   - Use VPC endpoints instead of NAT Gateway for cost optimization

3. **Node Groups with Spot Instances**
   - Deploy system workloads node group (2-4 nodes) using Graviton3 instances (t4g family)
   - Deploy application workloads node group (3-10 nodes) using Graviton3 instances (c7g family)
   - Both node groups must use spot instances with at least 3 different instance types for availability
   - Each node group must span exactly 3 availability zones
   - Configure launch templates with custom user data for monitoring agents
   - Tag nodes appropriately for node selector placement

4. **Cluster Autoscaler**
   - Deploy cluster autoscaler using Helm chart version 9.x
   - Create IAM role for cluster autoscaler with proper policies
   - Configure autoscaler to use IRSA (IAM Roles for Service Accounts)
   - Set specific resource limits (CPU and memory requests/limits)
   - Use node selector to place autoscaler on system node group
   - Configure autoscaler to manage both node groups

5. **IAM Integration and Access Control**
   - Set up OIDC provider for IRSA
   - Create IAM roles for cluster autoscaler service account
   - Create IAM roles for AWS Load Balancer Controller service account
   - Configure aws-auth ConfigMap to allow specific IAM roles for developers
   - Configure aws-auth ConfigMap to allow IAM roles for CI/CD pipelines
   - Use proper IAM policies following least privilege principle

6. **Outputs and Access**
   - Export cluster endpoint URL
   - Export OIDC issuer URL for service account integration
   - Export kubeconfig for cluster access
   - Export cluster security group ID
   - Export node group ARNs

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **EKS** for Kubernetes cluster management
- Use **EC2** Graviton3 instances for cost-effective compute
- Use **VPC** with custom networking including secondary CIDR for pods
- Use **IAM** for roles, policies, and IRSA configuration
- Use **CloudWatch** for control plane logging and monitoring
- Use **Auto Scaling** for node group scaling
- Use **Systems Manager** for secure node access instead of SSH
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region across zones us-east-1a, us-east-1b, us-east-1c

### Deployment Requirements (CRITICAL)

- All resources must be destroyable without manual intervention
- No resources with RemovalPolicy: RETAIN or DeletionPolicy: Retain
- All resources must include environmentSuffix in their names for uniqueness
- Use local Pulumi backend (no Pulumi Cloud deployment required)
- Cluster must be functional and ready for workload deployment
- All IAM roles and policies must follow least privilege principle

### Constraints

- EKS cluster must use Kubernetes version 1.28 or higher
- All node groups must use spot instances with at least 3 different instance types for high availability
- Worker nodes must use Graviton3-based instances (t4g or c7g family) for ARM64 architecture
- Each node group must span exactly 3 availability zones
- Cluster autoscaler must be deployed using Helm with specific resource limits
- OIDC provider must be configured for IRSA (IAM Roles for Service Accounts)
- VPC CNI addon must be installed with custom configuration to use secondary CIDR for pod networking
- Node groups must use launch templates with custom user data for monitoring agents
- Private API endpoint access only (no public endpoint)
- Use VPC endpoints instead of NAT Gateway to optimize costs
- CloudWatch log retention set to 7 days for cost management
- Include proper error handling and validation in infrastructure code

## Success Criteria

- **Functionality**: EKS cluster deployed and accessible via kubectl with proper authentication
- **Networking**: Custom VPC with secondary CIDR for pods, nodes and pods in separate subnets
- **Autoscaling**: Cluster autoscaler deployed and functional, able to scale node groups based on demand
- **IAM Integration**: IRSA configured with working service accounts for cluster autoscaler and load balancer controller
- **High Availability**: Resources distributed across 3 availability zones
- **Cost Optimization**: Spot instances used for all node groups with multiple instance types
- **Security**: Private API endpoint only, proper IAM roles and policies, no SSH access to nodes
- **Monitoring**: CloudWatch logs enabled for all control plane components
- **Resource Naming**: All resources include environmentSuffix parameter in names
- **Code Quality**: TypeScript with proper typing, well-structured, includes error handling

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- EKS cluster with version 1.28+ and private endpoint
- Custom VPC with primary CIDR 10.0.0.0/16 and secondary CIDR 100.64.0.0/16
- Two node groups (system and application) using Graviton3 spot instances
- VPC CNI addon configured for secondary CIDR pod networking
- OIDC provider and IAM roles for service accounts
- Cluster autoscaler deployed via Helm chart
- CloudWatch log groups with 7-day retention
- aws-auth ConfigMap for developer and CI/CD access
- Outputs for cluster endpoint, OIDC issuer, and kubeconfig
- Proper TypeScript types and interfaces
- Error handling and validation logic