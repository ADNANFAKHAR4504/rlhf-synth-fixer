# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
> 
> Platform: **cdk**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK TypeScript program to deploy an EKS cluster with comprehensive observability features for a financial services workload. The configuration must: 1. Create an EKS cluster version 1.28 with three managed node groups spread across availability zones. 2. Enable all EKS control plane logging types (api, audit, authenticator, controllerManager, scheduler) to CloudWatch Logs. 3. Deploy CloudWatch Container Insights as an add-on for cluster and node-level metrics. 4. Install Fluent Bit as a DaemonSet using the official AWS container image for log forwarding. 5. Configure IRSA for Fluent Bit with permissions to write to CloudWatch Logs. 6. Create a KMS key for EKS secrets encryption with automatic rotation enabled. 7. Deploy metrics-server using Helm chart for pod autoscaling capabilities. 8. Configure pod security standards at the cluster level with 'restricted' as the baseline. 9. Create three namespaces (dev, staging, prod) with resource quotas limiting CPU to 100 cores and memory to 200Gi per namespace. 10. Store Fluent Bit configuration in AWS Systems Manager Parameter Store as a SecureString. 11. Tag all resources with Environment=Production and CostCenter=FinTech. 12. Output the cluster endpoint, OIDC provider ARN, and kubectl configuration command. Expected output: A fully functional EKS cluster with integrated observability stack including Container Insights dashboards, centralized logging via Fluent Bit to CloudWatch Logs, and metrics-server for autoscaling. The cluster should have proper security controls with pod security standards and encrypted secrets.

---

## Additional Context

### Background
A fintech company needs to deploy a production-grade EKS cluster with enhanced observability for their microservices platform. The cluster will host payment processing services that require strict monitoring and alerting capabilities to ensure compliance with financial regulations.

### Constraints and Requirements
- [Use EKS version 1.28 or higher with managed node groups, Deploy Fluent Bit as a DaemonSet for log collection, Configure CloudWatch Container Insights for metrics collection, Enable EKS control plane logging for all log types, Use AWS Systems Manager Parameter Store for sensitive configuration, Implement pod security standards with restricted baseline, Configure IRSA (IAM Roles for Service Accounts) for Fluent Bit, Use AWS KMS for envelope encryption of Kubernetes secrets, Deploy metrics-server for horizontal pod autoscaling support, Set resource quotas per namespace with CPU and memory limits]

### Environment Setup
Production EKS infrastructure deployed in us-east-1 across 3 availability zones. Uses Amazon EKS 1.28 with managed node groups (m5.large instances), CloudWatch Container Insights for monitoring, Fluent Bit for log aggregation, and AWS Systems Manager for configuration management. Requires CDK 2.x with TypeScript, kubectl 1.28+, and AWS CLI v2 configured. VPC with private subnets for worker nodes and public subnets for load balancers. NAT Gateways in each AZ for outbound internet access. Integration with CloudWatch Logs and CloudWatch Metrics for centralized observability.

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
