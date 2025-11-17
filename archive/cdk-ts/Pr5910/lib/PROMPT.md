# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
> 
> Platform: **cdk**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK TypeScript program to deploy an EKS cluster with managed node groups. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across 3 availability zones. 2. Deploy an EKS cluster version 1.28 with all control plane logging enabled. 3. Configure an OIDC provider for the cluster to enable IRSA. 4. Create a managed node group using only t4g.medium instances (Graviton/ARM64). 5. Set the node group to auto-scale between 3 and 9 instances. 6. Install the EBS CSI driver as an EKS add-on with an IRSA role. 7. Create an IRSA role for the AWS Load Balancer Controller with required policies. 8. Configure launch templates to enforce IMDSv2 and disable SSH access. 9. Tag all resources with Environment=production and ManagedBy=CDK. 10. Output the cluster name, OIDC provider ARN, and kubectl configuration command. Expected output: A complete CDK stack that creates the EKS infrastructure with all specified configurations. The stack should generate CloudFormation outputs for cluster endpoint, OIDC provider ARN, and a command to update kubeconfig.

---

## Additional Context

### Background
Your organization needs to deploy a production-grade Kubernetes cluster on AWS to host microservices. The cluster must support auto-scaling, monitoring, and secure node group management. You need to implement this infrastructure using AWS CDK with TypeScript.

### Constraints and Requirements
- [Use EKS version 1.28 or higher, Node groups must use only Graviton (ARM64) instances for cost optimization, Implement IRSA (IAM Roles for Service Accounts) for pod-level AWS permissions, Enable EKS control plane logging for all log types, Use managed node groups with launch templates for custom configurations, Implement pod disruption budgets for critical system components, Configure OIDC provider for the cluster, Set up EBS CSI driver as an EKS add-on, Enforce IMDSv2 on all EC2 instances in node groups, Use AWS Systems Manager Session Manager for node access (no SSH keys)]

### Environment Setup
Production EKS cluster deployment in us-east-1 region spanning 3 availability zones. Infrastructure includes EKS control plane v1.28, managed node groups with t4g.medium instances, VPC with private subnets for nodes and public subnets for load balancers. Requires AWS CDK 2.x with TypeScript, kubectl 1.28+, and AWS CLI v2 configured. The cluster will use AWS Load Balancer Controller for ingress and EBS CSI driver for persistent storage. Node groups auto-scale between 3-9 instances based on CPU/memory metrics.

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
