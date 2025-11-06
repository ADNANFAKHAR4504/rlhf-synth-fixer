# Production-Ready Amazon EKS Cluster Infrastructure

Hey team,

We need to build a production-grade Kubernetes platform on AWS EKS for our organization's container workloads. This is going to be the foundation for running multiple applications across different environments (dev, staging, production). The infrastructure needs to support different workload types - regular application containers, system components, and even GPU-accelerated workloads for our machine learning team.

The business wants this built in **Terraform with HCL** so we can version control everything and make it reproducible across regions. We're targeting the ap-southeast-1 region initially, but the design should be flexible enough to deploy anywhere.

This is a critical piece of infrastructure that needs to be secure, scalable, and cost-efficient. We need proper RBAC, security controls, monitoring, and the ability to automatically scale based on demand. The platform team will use this to deploy and manage hundreds of services.

## What we need to build

Create a production-ready Amazon EKS cluster infrastructure using **Terraform with HCL** that provides a secure, scalable Kubernetes platform with multiple node groups, comprehensive IAM roles, EKS add-ons, and monitoring capabilities.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 3 availability zones for high availability
   - NAT Gateways for private subnet internet access
   - VPC endpoints for S3 and ECR to reduce data transfer costs
   - Appropriate route tables and network ACLs

2. **EKS Cluster**
   - EKS cluster running Kubernetes version 1.28 or later
   - OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Cluster endpoint access configuration (public and private)
   - Cluster encryption using KMS for secrets at rest

3. **Node Groups**
   - System node group: m5.large instances for core Kubernetes components
   - Application node group: Mixed instance types with spot instances for cost optimization
   - GPU node group: g4dn.xlarge instances for ML workloads
   - All nodes must use Bottlerocket AMI for security and minimal footprint
   - Auto-scaling configuration for each node group

4. **IAM Roles for Service Accounts**
   - Cluster Autoscaler role with appropriate EC2 and Auto Scaling permissions
   - AWS Load Balancer Controller role for managing ALB/NLB
   - External Secrets Operator role for secrets management
   - EBS CSI Driver role for persistent volume management

5. **EKS Add-ons**
   - VPC CNI for pod networking
   - kube-proxy for service networking
   - CoreDNS for service discovery
   - EBS CSI Driver for persistent storage

6. **Monitoring and Logging**
   - CloudWatch Container Insights for cluster and application monitoring
   - Log aggregation for control plane logs
   - Metrics collection for node and pod performance

7. **Security and RBAC**
   - Kubernetes RBAC with separate namespaces for dev, staging, and production
   - Pod Security Standards enforcement
   - Security groups for node-to-node and node-to-control-plane communication
   - IAM roles following least privilege principle

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon EKS** for managed Kubernetes control plane
- Use **Amazon VPC** for network isolation
- Use **Amazon EC2** for worker nodes
- Use **AWS IAM** for authentication and authorization
- Use **Amazon CloudWatch** for monitoring and logging
- Use **AWS KMS** for encryption
- Resource names must include **environment_suffix** variable for uniqueness and multi-environment deployment
- Follow naming convention: resourcetype-environment-suffix for all AWS resources
- Deploy to **ap-southeast-1** region by default
- All resources must support tagging for cost allocation and resource management

### Constraints

- All resources must be destroyable without retention policies for testing and cleanup
- No hardcoded credentials or secrets in code
- Use latest stable Bottlerocket AMI for all node groups
- EKS version must be 1.28 or higher
- All node groups must have proper monitoring and logging enabled
- Security groups must follow least privilege access
- Cost optimization through spot instances and right-sizing where appropriate
- Include proper error handling and validation in Terraform code

## Success Criteria

- **Functionality**: EKS cluster successfully deploys and can run containerized workloads across all node groups
- **Performance**: Cluster autoscaler responds to load within 2 minutes, nodes provision within 5 minutes
- **Reliability**: High availability across 3 AZs, automatic node recovery, cluster survives AZ failure
- **Security**: IRSA working for all service accounts, pod security standards enforced, encrypted secrets
- **Resource Naming**: All AWS resources include environment_suffix in their names for uniqueness
- **Monitoring**: CloudWatch Container Insights active, all logs flowing to CloudWatch
- **Cost Efficiency**: Spot instances working for application workloads, VPC endpoints reducing NAT costs
- **Code Quality**: Clean HCL code, modular structure, comprehensive variable definitions, proper outputs

## What to deliver

- Complete Terraform HCL implementation with modular file structure
- VPC module with subnets, NAT gateways, and VPC endpoints
- EKS cluster with OIDC provider and encryption
- Three node groups with Bottlerocket AMI and auto-scaling
- Four IRSA roles for cluster autoscaler, ALB controller, external secrets, and EBS CSI driver
- Four EKS add-ons with latest compatible versions
- CloudWatch Container Insights configuration
- Security groups for cluster and node communication
- Kubernetes manifests for RBAC, namespaces, and pod security standards
- Bottlerocket user data configurations for all node groups
- Terraform variables file with environment_suffix and region settings
- Comprehensive README with deployment instructions and architecture overview
- All code must be production-ready, well-documented, and follow Terraform best practices
