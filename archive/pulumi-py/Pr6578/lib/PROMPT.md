# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Python program to deploy a production-ready EKS cluster with advanced security and multi-tenancy features. The configuration must: 1. Create an EKS cluster version 1.28 with private endpoint access and enabled control plane logging for all log types. 2. Deploy a VPC with 3 private subnets across different AZs and appropriate tagging for EKS. 3. Configure managed node groups using Bottlerocket AMI with min=3, max=10, desired=5 instances of t3.large. 4. Implement IRSA by creating an OIDC provider and linking it to the cluster. 5. Deploy the Cluster Autoscaler with proper IAM role and service account configuration. 6. Create three tenant namespaces (tenant-a, tenant-b, tenant-c) with Pod Security Standards set to 'restricted'. 7. Configure NetworkPolicies to deny all inter-namespace traffic by default. 8. Create IAM roles for each tenant namespace with policies limiting access only to their specific S3 bucket prefix. 9. Deploy AWS Load Balancer Controller with required IAM permissions. 10. Configure CloudWatch Container Insights for cluster monitoring. 11. Enable envelope encryption for Kubernetes secrets using AWS KMS. 12. Output the cluster endpoint, OIDC issuer URL, and kubeconfig command. Expected output: A fully functional EKS cluster with multi-tenant isolation, where each tenant can only access their designated AWS resources through IRSA, network traffic is isolated between namespaces, and the cluster can automatically scale nodes based on pod requirements while maintaining security best practices.

---

## Additional Context

### Background
A financial services company needs to deploy a production-grade Kubernetes cluster on AWS EKS to host their microservices platform. The cluster must support multi-tenancy with strict security boundaries, automated node scaling based on workload demands, and integration with existing AWS services for logging and monitoring.

### Constraints and Requirements
- [Network policies must isolate tenant namespaces from each other, All control plane logs must be enabled and sent to CloudWatch, Node groups must span at least 3 availability zones for high availability, The cluster must use IRSA (IAM Roles for Service Accounts) for AWS service access, Pod Security Standards must be enforced at the namespace level, Each tenant namespace must have its own IAM service account with minimal permissions, The EKS cluster must use Kubernetes version 1.28 or higher, Node groups must use Bottlerocket AMI for enhanced security, Cluster autoscaler must be configured with proper RBAC permissions]

### Environment Setup
Production EKS cluster deployment in us-east-1 region using Pulumi Python. Requires AWS CLI configured with appropriate permissions, Python 3.9+, and Pulumi 3.x installed. The infrastructure includes EKS control plane with managed node groups using Bottlerocket AMI, VPC with private subnets across 3 AZs, NAT gateways for outbound traffic, and integration with CloudWatch for logging. The cluster will host multi-tenant workloads with namespace isolation and RBAC controls.

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
All resources should be deployed to: **ap-southeast-1**
