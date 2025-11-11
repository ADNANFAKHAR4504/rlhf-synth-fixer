# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with py**
> 
> Platform: **cdk**  
> Language: **py**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK Python program to deploy a payment processing API infrastructure. The configuration must: 1. Set up a VPC with 3 availability zones, each containing public, private, and database subnets with appropriate route tables and NAT instances. 2. Deploy an ALB in public subnets with AWS WAF integration and custom rule groups for OWASP Top 10 protection. 3. Configure ECS Fargate service running containerized API with auto-scaling based on target tracking (CPU 70%, Memory 80%). 4. Create RDS Aurora PostgreSQL cluster with one writer and two reader instances, encrypted with customer-managed KMS keys. 5. Implement API Gateway with mutual TLS authentication, request throttling (1000 req/sec), and usage plans. 6. Deploy Lambda functions for async payment processing with SQS dead letter queues and error handling. 7. Configure S3 buckets for document storage with lifecycle policies, versioning, and cross-region replication. 8. Set up Secrets Manager for database credentials and API keys with automatic rotation Lambda functions. 9. Create CloudWatch dashboards with custom metrics for transaction processing time and success rates. 10. Implement VPC endpoints for S3, DynamoDB, ECR, and Secrets Manager to avoid internet traffic. Expected output: A fully functional CDK application that deploys the entire infrastructure stack with proper security configurations, monitoring, and compliance controls. The stack should output the ALB DNS name, API Gateway endpoint, and CloudWatch dashboard URL.

---

## Additional Context

### Background
A fintech startup needs to deploy their payment processing API with strict compliance requirements. The application must handle sensitive financial data with end-to-end encryption and maintain PCI DSS compliance while supporting 10,000+ concurrent transactions.

### Constraints and Requirements
- VPC endpoints must be used for all AWS service communications to avoid internet routing
- RDS instances must use IAM database authentication instead of passwords
- All data at rest must use customer-managed KMS keys with automatic rotation
- API Gateway must enforce mutual TLS authentication for all endpoints
- ALB must use AWS WAF with custom rule groups for SQL injection and XSS protection
- Lambda functions must have execution roles with least-privilege permissions
- Secrets Manager must store all database credentials with automatic rotation every 30 days
- CloudWatch Logs must retain audit logs for exactly 7 years
- S3 buckets must block all public access and use SSE-KMS encryption
- ECS tasks must run in private subnets with no direct internet access

### Environment Setup
Production-grade infrastructure deployed in us-east-1 with multi-AZ configuration for high availability. Core services include ECS Fargate for containerized API services, RDS Aurora PostgreSQL with read replicas, API Gateway for external access, Lambda for async processing, S3 for encrypted document storage. VPC spans 3 availability zones with public subnets for ALB, private subnets for compute resources, and database subnets for RDS. Requires Python 3.9+, AWS CDK 2.100+, Docker for container builds. NAT instances in each AZ for outbound connectivity. VPC endpoints configured for S3, DynamoDB, and ECR to minimize data transfer costs.

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
