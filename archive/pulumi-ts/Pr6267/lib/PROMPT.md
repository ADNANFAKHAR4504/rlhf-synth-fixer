# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **eu-central-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a payment processing web application infrastructure. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across different availability zones. 2. Deploy an ECS cluster with Fargate launch type and a task definition for the payment service container. 3. Set up an RDS Aurora MySQL cluster with multi-AZ deployment and encryption at rest. 4. Configure an Application Load Balancer with HTTPS listener and target group for ECS tasks. 5. Implement CloudWatch Log Groups with 7-year retention for ECS tasks and RDS slow query logs. 6. Create S3 buckets for VPC flow logs with lifecycle rules to transition to Glacier after 90 days. 7. Set up IAM roles for ECS task execution and task role with specific permissions for S3 and Secrets Manager. 8. Configure security groups allowing only HTTPS traffic to ALB and database connections from ECS tasks. 9. Enable VPC flow logs and route them to the S3 bucket with proper access policies. 10. Apply consistent tagging scheme across all resources with Environment, Application, and CostCenter tags. 11. Output the ALB DNS name, RDS cluster endpoint, and S3 bucket names for flow logs. 12. Ensure all passwords and sensitive data use Pulumi secrets or AWS Secrets Manager. Expected output: A complete Pulumi TypeScript program that creates all infrastructure components with proper security configurations, exports critical endpoints and resource identifiers, and maintains compliance with financial industry requirements for audit trails and data protection.

---

## Additional Context

### Background
A fintech startup needs to deploy their payment processing web application with strict compliance requirements for data isolation and audit logging. The application processes sensitive financial transactions and must maintain PCI DSS compliance with complete infrastructure traceability.

### Constraints and Requirements
- [VPC flow logs must be enabled and stored in S3 with lifecycle policies, All security groups must explicitly deny all traffic except required ports, All RDS instances must use encrypted storage with customer-managed KMS keys, Application Load Balancer must terminate SSL with ACM certificates, ECS task definitions must use specific CPU and memory limits, IAM roles must follow principle of least privilege with no wildcard permissions, ECS tasks must run in private subnets with no direct internet access, All resources must be tagged with Environment, Application, and CostCenter, RDS automated backups must be retained for 35 days minimum, CloudWatch Logs retention must be set to 7 years for compliance]

### Environment Setup
Production-grade infrastructure in eu-central-2 region for payment processing application. Uses ECS Fargate for containerized services, RDS Aurora MySQL for transaction data, Application Load Balancer for traffic distribution, and CloudWatch for monitoring. Requires Node.js 18+, Pulumi 3.x CLI, AWS CLI configured with appropriate credentials. Multi-AZ VPC setup with 3 public subnets for ALB and 3 private subnets for ECS tasks and RDS. Single NAT Gateway for outbound connectivity (to avoid EIP account limits in non-production environments). S3 buckets for VPC flow logs and application artifacts.

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
All resources should be deployed to: **eu-central-2**
