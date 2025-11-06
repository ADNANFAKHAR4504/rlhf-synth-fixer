# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **Terraform (tf)**
> Language: **HCL**
> Region: **us-east-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Terraform configuration to deploy a production-grade Amazon EKS cluster with managed node groups. The configuration must: 1. Define an EKS cluster with Kubernetes 1.28 in us-east-2 with private endpoint access enabled and public endpoint restricted to specific CIDR blocks. 2. Create a managed node group using only t4g.medium instances (Graviton2 ARM) with a minimum of 3 nodes and maximum of 15 nodes. 3. Configure the EKS OIDC provider and create an IAM role for the cluster autoscaler with the correct trust policy. 4. Enable VPC CNI prefix delegation by setting ENABLE_PREFIX_DELEGATION=true in the aws-node DaemonSet. 5. Set up control plane logging for 'api' and 'audit' log types only, storing them in CloudWatch Logs. 6. Ensure node groups are distributed evenly across exactly 3 availability zones using launch template user data. 7. Configure node group instances with gp3 EBS root volumes of 100 GB with 3000 IOPS and 125 MiB/s throughput. 8. Create the aws-auth ConfigMap to map IAM roles to Kubernetes RBAC groups for cluster access. 9. Tag all resources with Environment=production and ManagedBy=terraform tags. 10. Output the cluster endpoint, OIDC provider URL, and kubectl configuration command. Expected output: A complete Terraform configuration that creates an EKS cluster with Graviton2-based managed node groups, proper IAM integration, optimized networking with prefix delegation, selective logging, and automated scaling capabilities. The configuration should be modular with separate files for EKS, IAM, and outputs.

---

## Additional Context

### Background
Your company is transitioning from on-premises Kubernetes to AWS EKS. The DevOps team needs a production-ready EKS cluster with proper node management, networking, and security controls to support microservices workloads.

### Constraints and Requirements
- [EKS cluster must use Kubernetes version 1.28 or higher, Node groups must use only Graviton2 (ARM) instance types for cost optimization, All worker nodes must use Amazon Linux 2 EKS-optimized AMIs, Cluster autoscaler must scale between 3 and 15 nodes based on CPU/memory metrics, OIDC provider must be configured for IRSA (IAM Roles for Service Accounts), VPC CNI plugin must use prefix delegation mode for increased pod density, Control plane logging must capture only api and audit logs to CloudWatch, Node groups must span exactly 3 availability zones with even distribution, All node group instances must use gp3 EBS volumes with 100 GB storage, Kubernetes RBAC must integrate with AWS IAM using aws-auth ConfigMap]

### Environment Setup
Production EKS cluster deployment in us-east-2 region using Terraform HCL. Infrastructure includes VPC with 3 public and 3 private subnets across 3 AZs, NAT gateways for outbound connectivity, EKS control plane with managed node groups using Graviton2 instances. Requires Terraform 1.5+, AWS provider 5.x, kubectl, and AWS CLI configured with appropriate permissions. Integration with CloudWatch for logging and Container Insights for monitoring.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-2**
