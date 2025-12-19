Hey team,

We need to build a production-grade Kubernetes infrastructure for our new containerized trading platform. The business has decided to go with AWS EKS using Fargate for compute to avoid managing EC2 instances. I've been asked to create this infrastructure using **Terraform with HCL** to keep everything as code and repeatable.

The trading platform needs to be highly available and secure, with proper network isolation and IAM controls. Since this is a trading platform, we need to ensure low latency, proper security boundaries, and the ability to scale pods independently without worrying about underlying compute capacity. The team wants to use Fargate exclusively because it eliminates node management overhead and provides better pod-level isolation.

This is going to be our production environment, so everything needs to follow AWS and Terraform best practices. We need proper networking with public and private subnets across multiple availability zones, appropriate security groups, and IAM roles that follow the principle of least privilege.

## What we need to build

Create a complete EKS cluster infrastructure using **Terraform with HCL** for a containerized trading platform that uses only Fargate compute profiles.

### Core Requirements

1. **EKS Cluster**
   - Deploy a production-ready EKS cluster in us-east-1 region
   - Configure cluster with appropriate logging and security settings
   - Use only Fargate compute profiles (no EC2 node groups)
   - Enable necessary EKS add-ons for cluster functionality

2. **Fargate Profiles**
   - Create Fargate profile for kube-system namespace (system pods)
   - Create Fargate profile for application workloads (default or custom namespace)
   - Configure appropriate pod execution role with necessary permissions
   - Define selectors for pod scheduling to Fargate

3. **Networking Infrastructure**
   - Create VPC with appropriate CIDR range for the cluster
   - Deploy public and private subnets across at least 2 availability zones
   - Configure internet gateway for public subnet connectivity
   - Set up NAT gateways for private subnet outbound access
   - Create route tables with proper routing rules

4. **Security and IAM**
   - Create EKS cluster IAM role with required AWS managed policies
   - Create Fargate pod execution IAM role with necessary permissions
   - Configure security groups for cluster control plane
   - Implement proper security group rules for pod-to-pod and external communication
   - Follow principle of least privilege for all IAM roles

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS EKS** for Kubernetes cluster management
- Use **AWS Fargate** exclusively for compute (no EC2 nodes)
- Use **VPC** with proper subnet architecture across availability zones
- Use **IAM** roles and policies following least privilege principle
- Resource names must include **environmentSuffix** variable for uniqueness across deployments
- Follow naming convention: `{resource-type}-{purpose}-${var.environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- Must use ONLY Fargate compute profiles - no EC2 node groups allowed
- Fargate profiles required for both kube-system and application namespaces
- Private subnets must have NAT gateway access for pulling container images
- VPC must have DNS support and DNS hostnames enabled for EKS
- Cluster must have appropriate tags for cost tracking and management
- Security groups must allow necessary communication between pods and control plane
- IAM roles must use AWS managed policies where appropriate
- All resources must be destroyable without Retain policies
- Include proper error handling and validation in Terraform code

### Deployment Requirements (CRITICAL)

- All resource names MUST include the **environmentSuffix** parameter for uniqueness
- Use format: `{resource-type}-{purpose}-${var.environmentSuffix}`
- Example: `eks-cluster-${var.environmentSuffix}`, `vpc-trading-${var.environmentSuffix}`
- NO resources should have Retain or Snapshot deletion policies - everything must be cleanly destroyable
- Fargate is serverless - no instance types or node group configurations needed
- Ensure proper IAM policies are attached: EKS cluster role needs AmazonEKSClusterPolicy, Fargate pod execution role needs AmazonEKSFargatePodExecutionRolePolicy

## Success Criteria

- **Functionality**: Complete EKS cluster deployable via Terraform that can run containerized workloads on Fargate
- **Fargate-Only**: No EC2 node groups or instances - exclusively Fargate compute profiles
- **Networking**: Proper VPC with public/private subnets, internet gateway, NAT gateways, and route tables
- **Security**: Appropriate IAM roles, security groups, and network isolation for trading platform workloads
- **Resource Naming**: All resources include environmentSuffix variable for deployment uniqueness
- **Destroyability**: All resources can be cleanly destroyed without Retain policies
- **Code Quality**: Well-structured HCL code with proper variable definitions, outputs, and documentation
- **Best Practices**: Follows Terraform and AWS EKS best practices for production deployments

## What to deliver

- Complete **Terraform** **HCL** implementation with all necessary files
- **VPC** with public and private subnets, internet gateway, NAT gateways
- **EKS cluster** resource with appropriate configuration
- **Fargate profiles** for kube-system and application namespaces
- **IAM roles** and policies for EKS cluster and Fargate pod execution
- **Security groups** with proper ingress and egress rules
- Variable definitions including environmentSuffix for resource naming
- Outputs for cluster endpoint, security group IDs, and other important values
- Unit tests for all Terraform modules
- Documentation with deployment instructions and architecture overview.
