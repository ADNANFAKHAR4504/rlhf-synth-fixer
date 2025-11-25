Hey team,

We need to build a production-grade EKS cluster for our fintech startup's payment processing platform. I've been asked to create this infrastructure using Terraform with HCL. The business wants a hardened Kubernetes environment that can support both Java-based transaction processors and Python ML fraud detection services while maintaining strict PCI DSS compliance.

The current challenge is that our payment processing microservices need a secure, scalable container orchestration platform. We're dealing with sensitive financial data, so security is paramount - we need private-only API access, encrypted pod communication, and proper IAM controls. The platform needs to handle variable loads efficiently while staying cost-effective.

Our operations team has been running into issues with public cluster endpoints and inadequate security controls in development environments. We need to fix this for production by implementing proper network isolation, using hardened container operating systems, and ensuring all communications are encrypted. The infrastructure must support both stateful and stateless workloads with proper persistent storage and auto-scaling capabilities.

## What we need to build

Create a production-ready EKS cluster using **Terraform with HCL** for a fintech payment processing platform with enhanced security controls.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28 in us-east-2 region
   - Configure private API endpoint only with no public access
   - Enable OIDC provider for IRSA support
   - Resource names must include environmentSuffix for uniqueness

2. **Worker Node Infrastructure**
   - Deploy managed node group using Bottlerocket AMI exclusively
   - Use t3.large instances for worker nodes
   - Distribute nodes across exactly 3 availability zones
   - Configure cluster autoscaler to scale between 3-15 nodes based on CPU metrics
   - Set up IRSA role for cluster autoscaler permissions

3. **Networking and Security**
   - Configure AWS VPC CNI with network policy support enabled
   - Enable pod security groups for fine-grained network controls
   - Create VPC endpoints for S3 and ECR to avoid NAT Gateway charges
   - Ensure all pod-to-pod communication is encrypted

4. **Storage and Controllers**
   - Deploy EBS CSI driver addon with encryption enabled for persistent volumes
   - Install AWS Load Balancer Controller using Helm
   - Configure proper IRSA permissions for Load Balancer Controller

5. **Monitoring and Logging**
   - Set up CloudWatch Container Insights for cluster monitoring
   - Configure 30-day log retention for all cluster logs

6. **Namespace and Resource Management**
   - Create production namespace with resource quotas
   - Limit namespace to 100 pods maximum
   - Limit namespace to 200Gi storage maximum

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EKS** for Kubernetes cluster orchestration
- Use **EC2** for worker node instances with Bottlerocket AMI
- Use **IAM** roles for service account authentication (IRSA)
- Use **VPC** endpoints for S3 and ECR private connectivity
- Use **CloudWatch** for cluster monitoring and logging
- Use **EBS CSI driver** for persistent volume support
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-2** region
- Requires Terraform 1.5 or higher
- All resources must be destroyable with no Retain policies

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in names for multi-environment support
- Use RemovalPolicy DESTROY or DeletionPolicy Delete for all resources
- FORBIDDEN: RemovalPolicy RETAIN or DeletionPolicy Retain on any resource
- All infrastructure must be fully destroyable via terraform destroy
- Helm releases must be properly managed within Terraform lifecycle
- Use Bottlerocket AMI only - do not use Amazon Linux 2 or other AMIs

### Constraints

- EKS cluster must use only private endpoint access with no public API exposure
- Node groups must use only Bottlerocket AMI for enhanced container security
- All worker nodes must be spread across exactly 3 availability zones with no single-AZ deployments
- Pod-to-pod communication must be encrypted using AWS VPC CNI network policies
- Cluster autoscaler must scale between 3-15 nodes based on CPU utilization only
- VPC with 3 private subnets across 3 AZs must exist (assume it's provided)
- NAT Gateway available for egress traffic
- All IAM roles must follow principle of least privilege
- Include proper error handling and validation
- Use data sources for existing VPC resources

## Success Criteria

- **Functionality**: EKS 1.28 cluster operational with private-only access, working autoscaler, Load Balancer Controller, and EBS CSI driver
- **Performance**: Cluster scales automatically between 3-15 nodes based on CPU metrics
- **Reliability**: Nodes distributed across 3 AZs, proper health checks configured
- **Security**: Private endpoints only, IRSA enabled, pod security groups active, VPC endpoints configured, network policies enforced
- **Storage**: EBS CSI driver functional with encryption enabled for persistent volumes
- **Monitoring**: Container Insights active with 30-day retention
- **Resource Management**: Production namespace created with quota limits enforced
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Clean HCL code, properly structured, includes validation and outputs

## What to deliver

- Complete Terraform HCL implementation
- EKS cluster configuration with OIDC provider
- Managed node group with Bottlerocket AMI
- IAM roles for IRSA (cluster autoscaler and Load Balancer Controller)
- VPC endpoints for S3 and ECR
- Helm provider configuration for Load Balancer Controller
- EBS CSI driver addon configuration
- CloudWatch Container Insights setup
- Production namespace with resource quotas
- Kubernetes provider configuration using EKS cluster auth
- Output values for cluster endpoint, OIDC issuer URL, and kubeconfig command
- Clear documentation in README with deployment instructions
