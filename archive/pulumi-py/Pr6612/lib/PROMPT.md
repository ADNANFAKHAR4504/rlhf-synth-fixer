# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Python program to deploy a payment processing web application with blue-green deployment support. The configuration must: 1. Set up a VPC with 3 availability zones, each containing public and private subnets 2. Deploy an RDS PostgreSQL instance (db.t3.medium) in Multi-AZ configuration with automated backups every 6 hours 3. Create an ECS Fargate cluster with a service running the FastAPI backend container 4. Configure an Application Load Balancer with path-based routing and health checks 5. Set up CloudFront distribution pointing to both the ALB (for /api/*) and S3 bucket (for static assets) 6. Implement blue-green deployment using ECS service with target group switching 7. Store database credentials and API keys in Secrets Manager with 30-day automatic rotation 8. Configure CloudWatch log groups with 90-day retention for ECS tasks and ALB access logs 9. Create S3 buckets for frontend hosting with CloudFront OAI and versioning enabled 10. Set up security groups that only allow traffic from CloudFront to ALB, and from ECS to RDS 11. Enable VPC flow logs and store them in a dedicated S3 bucket with lifecycle policies 12. Tag all resources with Environment, Application, and CostCenter tags. Expected output: A fully functional payment processing infrastructure with automated blue-green deployments, where updates can be rolled out with zero downtime by switching ALB target groups between blue and green ECS services. The system should handle 1000 concurrent users with sub-second API response times and maintain 99.9% uptime.

---

## Additional Context

### Background
A fintech startup needs to deploy their payment processing web application with strict compliance requirements for PCI DSS. The application consists of a React frontend, Python FastAPI backend, and PostgreSQL database. They require complete infrastructure auditability and blue-green deployment capabilities to minimize downtime during updates.

### Constraints and Requirements
- [Backend API must only accept traffic from the CloudFront distribution, All S3 buckets must have versioning enabled and lifecycle policies configured, Database backups must occur every 6 hours with point-in-time recovery enabled, Deployment must support zero-downtime updates using ECS blue-green deployment, All secrets must be stored in AWS Secrets Manager with automatic rotation, ECS tasks must run in private subnets with no direct internet access, All database connections must use SSL/TLS encryption with certificate validation, Application logs must be retained for exactly 90 days for compliance auditing]

### Environment Setup
Production payment processing infrastructure deployed in us-east-1 region using ECS Fargate for containerized FastAPI backend, RDS PostgreSQL Multi-AZ for database tier, CloudFront for global content delivery, and S3 for static React frontend hosting. Requires Python 3.9+, Pulumi CLI 3.x, AWS CLI configured with appropriate permissions. VPC spans 3 availability zones with public subnets for ALB and NAT gateways, private subnets for ECS tasks and RDS instances. Application Load Balancer handles SSL termination with ACM certificates.

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
All resources should be deployed to: **us-east-1**
