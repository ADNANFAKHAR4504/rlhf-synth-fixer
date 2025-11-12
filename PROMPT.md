# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
> 
> Platform: **cdk**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK TypeScript program to deploy a payment processing web application infrastructure. The configuration must: 1. Set up a VPC with public, private, and isolated subnets across 3 AZs. 2. Deploy an RDS Aurora PostgreSQL cluster in isolated subnets with automated backups and encryption. 3. Configure ECS Fargate service running Node.js API containers with ALB in public subnets. 4. Implement autoscaling for ECS tasks based on 70% CPU threshold. 5. Create S3 bucket for React frontend with CloudFront distribution and OAI. 6. Store database credentials in Secrets Manager with automatic rotation every 30 days. 7. Configure WAF rules on CloudFront to block common attack patterns. 8. Set up CloudWatch dashboards monitoring API latency, error rates, and database connections. 9. Implement blue-green deployment capability for the ECS service. 10. Create SNS topic for alerting on application errors exceeding 1% threshold. Expected output: A complete CDK TypeScript application with stack definitions for networking, compute, storage, and monitoring components. The code should include proper error handling, environment-specific configurations, and deployment scripts for staging and production environments.

---

## Additional Context

### Background
A fintech startup needs to deploy their real-time payment processing web application on AWS. The application consists of a React frontend, Node.js API backend, and PostgreSQL database for transaction records. They require zero-downtime deployments and strict compliance with PCI-DSS standards.

### Constraints and Requirements
- [All IAM roles must follow least privilege principle with explicit deny for unnecessary actions, API endpoints must be accessible only through CloudFront distribution, Frontend assets must be served from S3 with CloudFront caching, All resources must be deployed within a single VPC with proper subnet isolation, Load balancer must perform health checks every 30 seconds with 2 consecutive failures triggering replacement, Backend API must run on ECS Fargate with autoscaling based on CPU utilization, Application logs must be centralized in CloudWatch Logs with 90-day retention, Database credentials must be stored in AWS Secrets Manager and rotated automatically, All data at rest must be encrypted using AWS KMS customer-managed keys]

### Environment Setup
Production infrastructure deployed in us-east-1 across 3 availability zones using ECS Fargate for containerized Node.js API, RDS Aurora PostgreSQL for transaction storage, S3 and CloudFront for React frontend hosting. Requires AWS CDK 2.x with TypeScript, Node.js 18+, Docker installed for container builds. VPC configured with public subnets for ALB, private subnets for ECS tasks and RDS, isolated subnets for database. NAT Gateways in each AZ for outbound connectivity. AWS Systems Manager Session Manager for secure instance access without SSH keys.

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
