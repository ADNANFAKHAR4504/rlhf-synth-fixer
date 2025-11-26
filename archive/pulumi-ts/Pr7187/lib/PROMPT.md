# Production EKS Cluster with Advanced Networking

Hey team,

We've got a request from the financial services division to build out a production-grade Kubernetes platform for their trading applications. They're currently running some legacy systems on EC2, but they want to modernize with containers while maintaining strict security and reliability requirements.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The architecture team has specified that we need a fully featured EKS cluster with custom networking and proper IAM integration for service accounts. They want private API endpoints only for security, and we need to deploy across three availability zones for high availability.

The cluster needs to integrate with their existing CloudWatch monitoring setup and use VPC endpoints for cost optimization instead of NAT Gateways.

## What we need to build

Create a production-ready EKS cluster infrastructure with advanced networking using **Pulumi with TypeScript** for a financial services trading application platform.

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
   - Install and configure VPC CNI addon with custom environment variables
   - Use VPC endpoints instead of NAT Gateway for cost optimization

3. **IAM Integration and Access Control**
   - Set up OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Create IAM roles for cluster autoscaler service account (for future use)
   - Create IAM roles for AWS Load Balancer Controller service account (for future use)
   - Configure proper IAM role for node group access
   - Use proper IAM policies following least privilege principle

4. **Outputs and Access**
   - Export cluster endpoint URL
   - Export OIDC issuer URL for service account integration
   - Export kubeconfig for cluster access
   - Export cluster security group ID
   - Export node security group ID
   - Export VPC and subnet IDs

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **EKS** for Kubernetes cluster management
- Use **VPC** with custom networking including secondary CIDR for pods
- Use **IAM** for roles, policies, and IRSA configuration
- Use **CloudWatch** for control plane logging and monitoring
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
- OIDC provider must be configured for IRSA (IAM Roles for Service Accounts)
- VPC CNI addon must be installed with custom configuration
- Private API endpoint access only (no public endpoint)
- Use VPC endpoints instead of NAT Gateway to optimize costs
- CloudWatch log retention set to 7 days for cost management
- Include proper error handling and validation in infrastructure code

## Success Criteria

- **Functionality**: EKS cluster deployed with proper authentication
- **Networking**: Custom VPC with secondary CIDR for pods, nodes and pods in separate subnets
- **IAM Integration**: IRSA configured with OIDC provider for future service account use
- **High Availability**: Resources distributed across 3 availability zones
- **Cost Optimization**: VPC endpoints used instead of NAT Gateway
- **Security**: Private API endpoint only, proper IAM roles and policies
- **Monitoring**: CloudWatch logs enabled for all control plane components
- **Resource Naming**: All resources include environmentSuffix parameter in names
- **Code Quality**: TypeScript with proper typing, well-structured, includes error handling

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- EKS cluster with version 1.28+ and private endpoint
- Custom VPC with primary CIDR 10.0.0.0/16 and secondary CIDR 100.64.0.0/16
- VPC CNI addon configured with custom environment variables
- OIDC provider and IAM roles for service accounts
- CloudWatch log groups with 7-day retention
- VPC endpoints for S3, EC2, ECR, CloudWatch Logs, and STS
- Outputs for cluster endpoint, OIDC issuer, kubeconfig, and network resources
- Proper TypeScript types and interfaces
- Error handling and validation logic