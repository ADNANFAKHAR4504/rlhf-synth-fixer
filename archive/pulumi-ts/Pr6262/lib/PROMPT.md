# Payment Processing Application Infrastructure

Hey team,

We need to build infrastructure for a payment processing web application for a fintech startup. This is a production system that needs to handle 10,000 concurrent users during peak hours with sub-second response times. The company has strict compliance requirements around data isolation and audit logging, so everything needs to be locked down properly.

I've been asked to create this using **Pulumi with TypeScript** targeting the ap-southeast-1 region. The business is very particular about high availability and zero-downtime deployments since this handles financial transactions. They also need to retain logs for exactly 7 years for compliance purposes.

The architecture needs to span three availability zones with proper network isolation. All compute resources must run in private subnets with no direct internet access. We're using ECS Fargate for the containerized application, Aurora PostgreSQL Serverless v2 for the database, and an Application Load Balancer with AWS WAF to handle incoming traffic.

## What we need to build

Create a highly available payment processing infrastructure using **Pulumi with TypeScript** that handles real-time transaction processing across multiple availability zones.

### Core Requirements

1. **Network Architecture**
   - VPC with 3 public subnets across different availability zones
   - 3 private subnets for application workloads
   - 3 database subnets isolated from application tier
   - NAT Gateways for outbound internet access from private resources
   - Separate security groups for each tier with minimal permissions

2. **Database Tier**
   - Aurora PostgreSQL Serverless v2 cluster
   - Automatic scaling between 0.5 and 2 ACUs
   - Encrypted with customer-managed KMS key
   - SSL/TLS encryption required for all connections with certificate validation
   - Database backups encrypted at rest using customer-managed KMS keys

3. **Application Tier**
   - ECS cluster running Fargate tasks
   - Containerized application deployed from ECR
   - All containers run in private subnets only
   - Auto-scaling triggers when CPU exceeds 70% OR memory exceeds 80%
   - Blue-green deployment capability for zero-downtime updates
   - Target groups with weighted routing support

4. **Load Balancing and Security**
   - Application Load Balancer in public subnets
   - AWS WAF enabled with custom rules
   - SQL injection prevention rules blocking SQL keywords in query parameters
   - XSS prevention rules configured
   - Request tracing with correlation IDs across all services

5. **API Management**
   - API Gateway with usage plans configured
   - API keys for authentication and rate limiting
   - Rate limit of 1000 requests per minute per API key
   - Rate limiting configured on each API endpoint

6. **Observability and Monitoring**
   - CloudWatch Log Groups with exactly 7-year retention for compliance
   - Export application logs to S3 for long-term storage
   - X-Ray tracing enabled for all services with 10% sampling rate
   - CloudWatch dashboards displaying real-time metrics
   - Dashboard metrics include response times, error rates, and transaction volumes

7. **Backup Verification**
   - Lambda functions to verify database backup integrity
   - Scheduled to run daily
   - Alert on backup verification failures

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **ap-southeast-1** region
- Use **Aurora PostgreSQL Serverless v2** for database
- Use **ECS Fargate** for containerized workloads
- Use **Application Load Balancer** with WAF integration
- Use **API Gateway** for API management
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Use **Lambda** for backup verification automation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Pulumi 3.x compatibility required

### Constraints

- All compute resources must run in private subnets with no direct internet access
- Database connections must enforce SSL/TLS encryption with certificate validation
- Application logs must be retained for exactly 7 years for regulatory compliance
- Implement separate security groups for web, app, and database tiers
- Follow principle of least privilege for all IAM roles
- Each API endpoint must have rate limiting configured
- Auto-scaling must be based on both CPU and memory metrics with custom thresholds
- Database backups must be encrypted at rest using customer-managed KMS keys
- Blue-green deployment capability required for zero-downtime updates
- All resources must be destroyable with no Retain policies
- Request tracing must use correlation IDs across all services
- Use AWS Secrets Manager for credential management where applicable

## Success Criteria

- Functionality: Handles 10,000 concurrent users with sub-second response times
- Performance: Auto-scales based on CPU and memory thresholds
- Reliability: Spans 3 availability zones with blue-green deployment support
- Security: All compute in private subnets, WAF enabled, SSL/TLS enforced, separate security groups per tier
- Compliance: Logs retained for exactly 7 years, encrypted backups, audit trails
- Resource Naming: All resources include environmentSuffix variable
- Monitoring: CloudWatch dashboards showing real-time metrics, X-Ray tracing with 10% sampling
- Code Quality: TypeScript, well-tested, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with public, private, and database subnets across 3 AZs
- Aurora PostgreSQL Serverless v2 cluster with encryption
- ECS Fargate cluster with auto-scaling
- Application Load Balancer with AWS WAF
- API Gateway with rate limiting and usage plans
- Lambda functions for backup verification
- CloudWatch Log Groups with 7-year retention
- X-Ray tracing configuration
- CloudWatch dashboards for monitoring
- Security groups for each tier
- NAT Gateways for outbound connectivity
- Customer-managed KMS keys for encryption
- Export outputs: ALB DNS name, API Gateway URL, CloudWatch dashboard URL
- Deployment instructions and documentation
