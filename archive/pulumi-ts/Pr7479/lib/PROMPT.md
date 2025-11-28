# EC2 Auto Scaling Groups with Managed Node Groups

Hey team,

We've been tasked with setting up a production-grade EC2 cluster for our microservices platform. The operations team needs a solid foundation that can handle both general application workloads and more compute-intensive batch processing jobs. Management wants this done right with proper network isolation, auto-scaling capabilities, and all the security features enabled.

The infrastructure team has asked me to build this using **Pulumi with TypeScript** for our AWS environment. They want everything reproducible and version-controlled, so we can spin up identical environments for staging and production.

This is a critical piece of infrastructure that needs to handle production traffic from day one, so we need to make sure we get the networking, security, and scaling configuration right. The team has been pretty specific about using Bottlerocket AMI for the worker nodes and ensuring everything is encrypted at rest.

## What we need to build

Create a production-ready EC2 cluster using **Pulumi with TypeScript** that supports both general workloads and compute-intensive tasks with proper auto-scaling and network isolation.

### Core Requirements

1. **Network Infrastructure**
   - Custom VPC with 6 subnets across 3 availability zones
   - 3 public subnets for load balancers and internet-facing resources
   - 3 private subnets for worker nodes and internal services
   - Must use availability zones: us-east-1a, us-east-1b, us-east-1c

2. **EC2 Cluster Configuration**
   - Deploy EC2 cluster version 1.28 or higher
   - Private endpoint access only (no public endpoint)
   - Enable OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Control plane logging for all components: api, audit, authenticator, controllerManager, scheduler

3. **Managed Node Groups**
   - General workload node group: 2-10 nodes with auto-scaling
   - Compute-intensive node group: 1-5 nodes using m5.xlarge instances
   - Both groups must use Bottlerocket AMI
   - Node groups must span all 3 availability zones
   - Encryption at rest using AWS-managed KMS keys

4. **EC2 Add-ons**
   - VPC CNI with latest compatible version
   - CoreDNS with latest compatible version
   - kube-proxy with latest compatible version

5. **IAM Configuration**
   - IAM role for AWS Load Balancer Controller with proper trust policy
   - Proper trust relationships using OIDC provider

6. **Fargate Profiles**
   - Fargate profile for system workloads (kube-system namespace)

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation
- Use **EC2** service for cluster management
- Use **Auto Scaling** for managed node groups
- Use **IAM** for service accounts and role-based access
- Use **OIDC** provider for trust relationships
- Use **KMS** for encryption at rest (AWS-managed keys)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Tag all resources with: Environment=production, ManagedBy=pulumi

### Constraints

- EC2 version must be 1.28 or higher
- Worker nodes must use Bottlerocket AMI for enhanced security
- All node groups must have encryption at rest enabled
- Cluster endpoint access must be private-only (no public access)
- Node groups must span exactly 3 availability zones
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- No RemovalPolicy RETAIN or DeletionProtection allowed
- Resources must be fully destroyable for testing
- Use AWS-managed KMS keys (do not create custom KMS keys)

## Success Criteria

- **Functionality**: Complete EC2 cluster with working node groups and Fargate profile
- **Networking**: Proper VPC isolation with public/private subnet separation
- **Scaling**: Auto-scaling configured and functional for both node groups
- **Security**: Private endpoint, encryption at rest, Bottlerocket AMI, IRSA enabled
- **Integration**: Load Balancer Controller IAM role configured properly
- **Resource Naming**: All resources include environmentSuffix
- **Observability**: Control plane logging enabled for all components
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with 6 subnets across 3 AZs
- EC2 cluster (version 1.28+) with private endpoint
- Two managed node groups (general and compute-intensive)
- Fargate profile for system workloads
- EC2 add-ons: VPC CNI, CoreDNS, kube-proxy
- OIDC provider configuration
- IAM role for AWS Load Balancer Controller
- Stack outputs: cluster endpoint, certificate authority, kubeconfig
- All resources properly tagged
- Documentation and deployment instructions
