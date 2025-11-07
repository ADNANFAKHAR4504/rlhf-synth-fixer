# Production EKS Cluster with Graviton2 Node Groups

Hey team,

We need to build a production-grade Amazon EKS cluster that can handle our microservices workloads as we transition from on-premises Kubernetes to AWS. The DevOps team has requested a fully managed cluster with proper node management, networking optimizations, and security controls. I've been asked to create this using Terraform with HCL.

Our company is moving away from managing our own Kubernetes infrastructure and wants to leverage AWS EKS for better reliability and reduced operational overhead. The cluster needs to support autoscaling, use cost-effective ARM-based instances, and integrate properly with AWS IAM for access control. We also need selective logging to CloudWatch to keep costs down while maintaining visibility into critical operations.

The business wants this deployed in us-east-2 with proper high availability across multiple zones. They've also emphasized using Graviton2 instances to optimize costs without sacrificing performance, and they want the cluster to scale dynamically based on workload demands.

## What we need to build

Create a production-ready EKS cluster using **Terraform with HCL** that deploys managed node groups with Graviton2 ARM instances, proper IAM integration, optimized networking, and automated scaling capabilities.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Enable private endpoint access for secure communication
   - Restrict public endpoint access to specific CIDR blocks
   - Deploy in us-east-2 region
   - Distribute across exactly 3 availability zones

2. **Managed Node Groups**
   - Use t4g.medium instances (Graviton2 ARM architecture)
   - Configure minimum of 3 nodes and maximum of 15 nodes
   - Use Amazon Linux 2 EKS-optimized AMIs
   - Distribute nodes evenly across 3 availability zones
   - Configure launch template with custom user data

3. **Storage Configuration**
   - Configure gp3 EBS root volumes of 100 GB
   - Set 3000 IOPS for optimal performance
   - Set 125 MiB/s throughput
   - Enable encryption at rest

4. **IAM and Security**
   - Configure EKS OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Create IAM role for cluster autoscaler with correct trust policy
   - Create aws-auth ConfigMap to map IAM roles to Kubernetes RBAC groups
   - Follow principle of least privilege for all IAM roles

5. **Networking Optimization**
   - Enable VPC CNI prefix delegation by setting ENABLE_PREFIX_DELEGATION=true
   - Configure aws-node DaemonSet for increased pod density
   - Ensure proper VPC setup with public and private subnets
   - Configure NAT gateways for outbound connectivity

6. **Logging and Monitoring**
   - Enable control plane logging for 'api' and 'audit' log types only
   - Store logs in CloudWatch Logs
   - Prepare infrastructure for Container Insights integration

7. **Cluster Autoscaler Integration**
   - Configure autoscaling between 3 and 15 nodes
   - Base scaling on CPU and memory metrics
   - Ensure proper IAM permissions for autoscaler

8. **Access Control**
   - Create aws-auth ConfigMap for IAM to RBAC mapping
   - Enable proper cluster access for administrators
   - Configure service account permissions

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon EKS** for managed Kubernetes cluster
- Use **EC2 t4g.medium instances** (Graviton2 ARM) for worker nodes
- Use **VPC** with 3 public and 3 private subnets across 3 AZs
- Use **IAM** with OIDC provider for service account integration
- Use **CloudWatch Logs** for control plane logging
- Use **EBS gp3 volumes** for node storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-environment-suffix
- Deploy to **us-east-2** region
- Requires Terraform 1.5+ and AWS provider 5.x

### Constraints

- EKS cluster must use Kubernetes version 1.28 or higher
- Node groups must use only Graviton2 (ARM) instance types
- All worker nodes must use Amazon Linux 2 EKS-optimized AMIs
- OIDC provider must be configured for IRSA
- VPC CNI must use prefix delegation mode
- Control plane logging must capture only api and audit logs
- Node groups must span exactly 3 availability zones
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation
- Enable encryption at rest and in transit
- All resources must be tagged with Environment=production and ManagedBy=terraform

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with managed node groups running
- **Performance**: Nodes can scale from 3 to 15 based on workload demands
- **Reliability**: Cluster spans 3 AZs with even node distribution
- **Security**: OIDC provider configured, IAM roles follow least privilege, endpoints properly restricted
- **Networking**: VPC CNI prefix delegation enabled for high pod density
- **Logging**: Control plane logs flowing to CloudWatch for api and audit types
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: Modular Terraform HCL code, well-documented, with proper outputs

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Separate files for EKS cluster, IAM roles, networking, and outputs
- VPC with 3 public and 3 private subnets across 3 AZs
- EKS cluster with Kubernetes 1.28+ and proper endpoint configuration
- Managed node group with t4g.medium Graviton2 instances
- OIDC provider and cluster autoscaler IAM role
- VPC CNI configuration with prefix delegation
- CloudWatch log group for control plane logs
- aws-auth ConfigMap for IAM-RBAC integration
- Outputs for cluster endpoint, OIDC provider URL, and kubectl config command
- Documentation with deployment instructions
- Variables file with environmentSuffix parameter