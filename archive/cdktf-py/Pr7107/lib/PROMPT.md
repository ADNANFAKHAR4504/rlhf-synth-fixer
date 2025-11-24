# Production EKS Cluster for Microservices Platform

Hey team,

We need to set up a production-grade Kubernetes infrastructure for our containerized microservices platform. The business is moving away from monolithic architecture and wants a scalable, cost-efficient container orchestration solution that can handle variable workloads while maintaining high availability.

I've been asked to create this infrastructure using **CDKTF with Python** to define everything as code. The platform team needs a robust EKS cluster that can automatically scale based on demand, with proper logging and monitoring capabilities built in from day one.

The current manual deployment process is error-prone and doesn't give us the reliability we need for production workloads. We also need better cost optimization through a mix of On-Demand and Spot instances, plus the ability to track all our infrastructure through proper tagging.

## What we need to build

Create a production-ready Amazon EKS cluster infrastructure using **CDKTF with Python** for our containerized microservices platform.

### Core Requirements

1. **VPC and Networking Infrastructure**
   - Create new VPC with CIDR 10.0.0.0/16
   - Enable DNS hostnames and DNS support
   - Deploy two public subnets across multiple availability zones (10.0.1.0/24, 10.0.2.0/24)
   - Configure Internet Gateway for public connectivity
   - Set up route tables with routes to Internet Gateway
   - Tag subnets appropriately for EKS load balancer integration (kubernetes.io/role/elb)

2. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.29 or higher
   - Place cluster in public subnets for accessibility
   - Enable both public and private endpoint access
   - Enable all 5 types of control plane logging (api, audit, authenticator, controllerManager, scheduler)
   - Configure 30-day retention for CloudWatch logs

3. **IAM Roles and OIDC Provider**
   - Create IAM role for EKS cluster with proper assume role policy
   - Attach AmazonEKSClusterPolicy and AmazonEKSVPCResourceController policies
   - Create IAM role for node groups with EC2 assume role policy
   - Attach AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, and AmazonEC2ContainerRegistryReadOnly policies
   - Configure OIDC identity provider for IRSA (IAM Roles for Service Accounts)
   - Use correct Terraform interpolation syntax for OIDC issuer URL

4. **Node Groups and Scaling**
   - Create On-Demand managed node group: minimum 2 nodes, maximum 5 nodes, desired 2 nodes
   - Create Spot managed node group: minimum 3 nodes, maximum 10 nodes, desired 3 nodes
   - Both node groups should use t3.medium instance types
   - Configure proper dependencies (node groups depend on EKS cluster)

5. **VPC CNI Addon Configuration**
   - Install VPC CNI addon with version v1.18.1-eksbuild.3 (compatible with EKS 1.29)
   - Enable prefix delegation (ENABLE_PREFIX_DELEGATION=true)
   - Configure warm prefix target (WARM_PREFIX_TARGET=1)
   - Set conflict resolution to OVERWRITE for both create and update

6. **Resource Naming Convention (v1)**
   - All resources must include **v1** suffix and **environmentSuffix** parameter for uniqueness
   - VPC: `eks-vpc-v1-{environmentSuffix}`
   - Subnets: `eks-public-subnet-1-v1-{environmentSuffix}`, `eks-public-subnet-2-v1-{environmentSuffix}`
   - Internet Gateway: `eks-igw-v1-{environmentSuffix}`
   - Route Table: `eks-public-rt-v1-{environmentSuffix}`
   - EKS Cluster: `eks-cluster-v1-{environmentSuffix}`
   - CloudWatch Log Group: `/aws/eks/eks-cluster-v1-{environmentSuffix}`
   - IAM Roles: `eks-cluster-role-v1-{environmentSuffix}`, `eks-node-role-v1-{environmentSuffix}`
   - Node Groups: `node-group-od-v1-{environmentSuffix}`, `node-group-spot-v1-{environmentSuffix}`

7. **Resource Tagging**
   - Tag all resources with: Environment=Production, ManagedBy=CDKTF
   - Include resource-specific Name tags
   - Support additional tags via default_tags parameter

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon EKS** for Kubernetes orchestration (version 1.29)
- Use **CloudWatch** for logging and monitoring (30-day retention)
- Use **IAM** for authentication and authorization
- Use **EC2** for node group compute resources
- Resource names must include **v1 suffix** and **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region (configurable via aws_region parameter)
- Use **S3Backend** for Terraform state management (configurable bucket and region)

### State Management

- Use S3Backend with the following configuration:
  - Bucket: Passed via `state_bucket` parameter
  - Key: `{stack_id}/{environment_suffix}/terraform.tfstate`
  - Region: Passed via `state_bucket_region` parameter
  - Encryption: Enabled (encrypt=True)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use S3Backend for remote state management (not LocalBackend)
- Include proper error handling and logging
- Ensure clean teardown capability for testing environments
- OIDC provider URL must use correct Terraform interpolation: `${aws_eks_cluster.<resource_id>.identity[0].oidc[0].issuer}`
- VPC CNI addon must use version compatible with EKS 1.29: v1.18.1-eksbuild.3

### Constraints

- Must create new VPC and networking infrastructure (not use existing VPC)
- Subnets must be public with map_public_ip_on_launch enabled
- Node groups must support both On-Demand and Spot purchasing options
- All IAM roles must follow least privilege principle
- Control plane logs must be enabled for compliance requirements
- Resource tagging is mandatory for cost allocation
- All resources must use v1 naming convention
- All resources must be destroyable without manual intervention

## Success Criteria

- **VPC Infrastructure**: VPC, subnets, IGW, and route tables successfully created
- **Functionality**: EKS cluster successfully deploys with Kubernetes version 1.29
- **Scalability**: Both node groups operational with correct min/max/desired counts
- **Logging**: All control plane logs flowing to CloudWatch with 30-day retention
- **Networking**: VPC CNI addon v1.18.1-eksbuild.3 installed with prefix delegation enabled
- **Resource Naming**: All resources follow v1-{environmentSuffix} naming convention
- **Security**: OIDC provider properly configured with correct Terraform interpolation
- **IAM**: All roles and policy attachments correctly configured
- **Tagging**: All resources properly tagged with Environment and ManagedBy
- **State Management**: S3 backend properly configured for remote state storage
- **Code Quality**: Clean Python code, well-structured, documented
- **Outputs**: Cluster endpoint, cluster name, OIDC provider ARN, OIDC issuer URL, kubectl command, node group names

## What to deliver

- Complete CDKTF Python implementation with S3Backend configuration
- VPC with two public subnets, IGW, and route tables
- EKS cluster with Kubernetes 1.29
- Two managed node groups (On-Demand and Spot)
- VPC CNI addon v1.18.1-eksbuild.3 with prefix delegation
- CloudWatch logging configuration with 30-day retention
- IAM roles and policies for cluster and node groups
- OIDC provider with correct Terraform interpolation
- Resource tagging implementation following v1 naming convention
- Output values for cluster endpoint, cluster name, OIDC provider ARN, OIDC issuer URL, kubectl command, and node group names
- Comprehensive unit tests (100% code coverage with mocks)
- Integration tests (validating synthesized config and deployment outputs)
