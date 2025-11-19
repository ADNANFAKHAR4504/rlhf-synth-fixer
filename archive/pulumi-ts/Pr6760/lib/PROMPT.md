# Production-Ready EKS Cluster Infrastructure

Hey team,

We need to build a production-grade Kubernetes infrastructure for a financial services company that's migrating their microservices architecture to AWS. They currently run multiple services that need to scale dynamically based on load, with some batch processing workloads that can tolerate interruptions. The company has strict compliance requirements around audit logging, data isolation, and security controls.

The business is looking for a fully managed Kubernetes solution that can handle both steady-state workloads and burst capacity for their batch processing jobs. They want to optimize costs where possible, particularly for non-critical workloads, while maintaining high availability and security standards. The infrastructure needs to support automatic scaling, integrated monitoring, and secure ingress management right out of the gate.

I've been tasked with creating this infrastructure using **Pulumi with TypeScript**. The team wants everything defined as code so we can version control the entire infrastructure and replicate it across different environments. The current priority is getting the core EKS cluster up and running with all the essential add-ons and security configurations in place.

## What we need to build

Create a production-ready Amazon EKS cluster infrastructure using **Pulumi with TypeScript** for hosting microservices with automatic scaling and integrated monitoring capabilities.

### Core Infrastructure Requirements

1. **Network Foundation**
   - Create a VPC with 3 public subnets and 3 private subnets
   - Distribute subnets across different availability zones for high availability
   - All worker nodes must be deployed in private subnets only
   - Configure proper routing and NAT gateways for private subnet internet access

2. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Enable all control plane logging types to CloudWatch for audit compliance
   - Configure OIDC provider for the cluster to enable IRSA (IAM Roles for Service Accounts)
   - Export cluster endpoint, OIDC issuer URL, and kubeconfig for downstream consumption

3. **Node Groups and Compute**
   - Create two managed node groups for different workload types
   - General workload node group: c7g.large Graviton3 instances for steady-state workloads
   - Batch processing node group: c7g.xlarge spot instances for cost optimization
   - Configure cluster autoscaler with IRSA permissions to scale node groups between 2-10 nodes

4. **Security and Pod Management**
   - Implement Kubernetes pod security standards with 'restricted' enforcement as default
   - Create dedicated IAM roles for different service accounts following least privilege
   - Configure network policies to isolate workloads between namespaces
   - Encryption at rest and in transit for all sensitive data

5. **Essential Add-ons and Controllers**
   - Install and configure AWS Load Balancer Controller using IRSA for permissions
   - Deploy Amazon EBS CSI driver addon with appropriate IAM roles
   - Set up CloudWatch Container Insights for comprehensive cluster monitoring
   - Ensure all add-ons use IRSA for AWS API access

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon EKS** for managed Kubernetes control plane
- Use **Amazon VPC** for network isolation and segmentation
- Use **Amazon EC2** for node groups with Graviton3-based instances (c7g family)
- Use **AWS IAM** for roles, policies, and OIDC provider configuration
- Use **AWS CloudWatch** for logs and Container Insights monitoring
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `resource-type-${environmentSuffix}`
- All resources must be destroyable (no Retain policies, no deletion protection)

### Deployment Requirements (CRITICAL)

- Every resource name or identifier MUST include the environmentSuffix parameter
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- NO deletionProtection: true on any resource
- All resources must be cleanable for CI/CD pipeline automation
- Use managed node groups (not self-managed) for simplified operations
- Spot instances must have appropriate interruption handling
- IAM roles should use assumeRolePolicy with OIDC provider conditions

### Constraints

- Worker nodes restricted to private subnets for security isolation
- Kubernetes version must be 1.28 or higher for latest features and security patches
- Pod security standards with restricted baseline must be default enforcement level
- Control plane logging for all log types is mandatory for compliance
- Use only Graviton3-based c7g instance family for cost and performance optimization
- All AWS service integration must use IRSA pattern (no static credentials)
- Network policies must prevent cross-namespace communication by default

## Success Criteria

- **Functionality**: EKS cluster operational with both node groups scaling automatically
- **Security**: OIDC provider configured, IRSA working for all service accounts, pod security standards enforced
- **Monitoring**: CloudWatch Container Insights active, control plane logs streaming to CloudWatch
- **Networking**: Load Balancer Controller functional, network policies isolating namespaces
- **Storage**: EBS CSI driver operational for persistent volume claims
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: TypeScript with proper typing, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- VPC with properly configured public and private subnets
- EKS cluster with version 1.28+ and all control plane logging enabled
- Two managed node groups (c7g.large on-demand, c7g.xlarge spot)
- OIDC provider configuration for IRSA functionality
- AWS Load Balancer Controller with IRSA
- Amazon EBS CSI driver addon with IAM roles
- Cluster autoscaler configuration with scaling policies
- Pod security standards implementation
- CloudWatch Container Insights setup
- Network policy configurations
- Comprehensive integration tests in tests/ directory
- Documentation with deployment instructions in lib/README.md
- All outputs exported (cluster endpoint, OIDC issuer, kubeconfig)
