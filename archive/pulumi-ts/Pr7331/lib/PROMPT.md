# Payment Processing Web Application Infrastructure

Hey team,

We need to build infrastructure for a payment processing web application for a fintech startup. They handle sensitive financial data and need a highly available system with zero downtime deployments. The business is requiring strict compliance and automated failover capabilities.

I've been asked to create this using **Pulumi with TypeScript**. This is a production deployment that needs to support both staging and production environments with proper separation. The application will be running on EC2 instances with blue-green deployment capability, using Aurora PostgreSQL for the database backend.

The infrastructure needs to span multiple VPCs with proper networking isolation, handle secrets rotation automatically, and provide comprehensive monitoring. Everything needs to be built with security and compliance as top priorities since we're dealing with financial transactions.

## What we need to build

Create a highly available payment processing web application infrastructure using **Pulumi with TypeScript** for deployment to AWS us-east-1 region (with disaster recovery consideration for us-west-2).

### Core Requirements

1. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster with encryption at rest enabled
   - Automatic backups configured
   - Database credentials managed through AWS Secrets Manager with 30-day rotation
   - SSL/TLS connections required with certificate validation

2. **Application Load Balancing**
   - Application Load Balancer (ALB) with SSL/TLS termination
   - ALB access logs stored in S3 with server-side encryption
   - Integration with target groups for blue-green deployment
   - Automated SSL certificate management using ACM with DNS validation
   - Configure automated certificate renewal

3. **Compute and Deployment**
   - EC2 instances for running the web application
   - Blue-green deployment configurations for zero downtime deployments
   - Container insights and tracing enabled for all EC2 tasks
   - Deploy monitoring and observability for application performance

4. **Network Architecture**
   - Separate VPCs for production and staging environments
   - VPC peering connection for secure communication between environments
   - Private subnets for all internal resources (database, compute)
   - Network traffic must traverse private subnets only, no direct internet routing
   - Proper security groups configured with least privilege access

5. **Security and Compliance**
   - Least-privilege IAM roles with session tags for temporary access
   - All S3 buckets with versioning enabled and lifecycle policies for 90-day retention
   - CloudWatch log groups with encryption using customer-managed KMS keys
   - Secrets rotation for database credentials using AWS Secrets Manager
   - All resources must be tagged with Environment, Application, and CostCenter tags

6. **Monitoring and Observability**
   - CloudWatch dashboards with custom metrics for transaction processing latency
   - CloudWatch alarms for 5XX errors, database connections, and EC2 task failures
   - Centralized logging for all components
   - Container insights and distributed tracing enabled

### Optional Enhancements

If time permits and to provide additional training value, consider adding:
- API Gateway with request throttling for public API access (provides rate limiting and API management)
- SQS queues for asynchronous payment processing (decouples payment processing from web tier)
- ElastiCache Redis for session management (improves application performance)

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Aurora PostgreSQL Serverless v2** for database (prefer serverless for cost optimization)
- Use **Application Load Balancer (ALB)** for load balancing with SSL termination
- Use **EC2 instances** for compute with blue-green deployment capability
- Use **VPC** for network isolation (separate production and staging)
- Use **AWS Secrets Manager** for credentials management with rotation
- Use **CloudWatch** for monitoring, metrics, and logging
- Use **IAM** for access control with least privilege
- Use **ACM** for SSL certificate management
- Deploy to **us-east-1** region (primary) with us-west-2 (disaster recovery consideration)
- Use Pulumi configuration for environment-specific values
- Separate AWS accounts or proper tagging for environment separation

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All named resources MUST include environmentSuffix for uniqueness
  - Pattern: `{resource-type}-${environmentSuffix}` in TypeScript
  - Example: `bucket-name-${environmentSuffix}`, `database-cluster-${environmentSuffix}`
  - At least 80% of named resources must include the suffix

- **Destroyability**: All resources must be destroyable after testing
  - Do NOT use retain policies on any resources
  - Do NOT enable deletion protection on RDS or other resources
  - All resources should clean up completely when stack is destroyed

- **Lambda Functions** (if used in optional enhancements):
  - Must specify exact container image tags, no 'latest' tags allowed
  - For Node.js 18+, use AWS SDK v3 (@aws-sdk/client-*) instead of aws-sdk
  - Lambda environment variables with secrets must use KMS encryption

- **Stack Policies**: Implement protection against accidental deletion of critical resources during updates, but allow full stack destruction

### Constraints

- Database connections must use SSL/TLS with certificate validation enabled
- All S3 buckets must have versioning enabled and lifecycle policies for 90-day retention
- CloudWatch log groups must have encryption with customer-managed keys
- Network traffic between services must traverse private subnets only, no direct internet routing
- Use Pulumi configuration secrets for all sensitive values, no hardcoded credentials
- ALB access logs must be stored in S3 with server-side encryption
- All resources tagged with Environment, Application, and CostCenter tags for compliance tracking
- No NAT Gateways unless absolutely necessary (cost optimization)
- Prefer serverless options where available (Aurora Serverless, Lambda)
- All resources must be destroyable (no Retain policies or deletion protection)

## Success Criteria

- **Functionality**: Complete deployment of payment processing infrastructure with all core requirements
- **High Availability**: Multi-AZ deployment for database and compute, blue-green deployment capability
- **Security**: Encryption at rest and in transit, secrets rotation, least privilege IAM, proper network isolation
- **Monitoring**: CloudWatch dashboards, custom metrics, alarms for critical failures
- **Compliance**: All required tags present, proper logging, audit trail capability
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Complete stack teardown without manual intervention
- **Code Quality**: TypeScript with proper types, well-tested, documented
- **Performance**: Transaction processing latency metrics tracked, optimized for low latency

## What to deliver

- Complete Pulumi TypeScript implementation in the lib/ directory
- Pulumi.yaml configuration file for stack management
- Separate stack configurations for staging and production environments
- Aurora PostgreSQL Serverless v2 with encryption and backups
- Application Load Balancer with SSL/TLS termination
- EC2 instances with blue-green deployment configurations
- VPC architecture with production/staging separation and peering
- AWS Secrets Manager with 30-day credential rotation
- CloudWatch dashboards and alarms for monitoring
- IAM roles with least privilege and session tags
- ACM certificate with automated renewal
- All resources properly tagged and named with environmentSuffix
- Unit tests for all infrastructure components
- Integration tests that verify resource connectivity
- Documentation in lib/README.md explaining the architecture and deployment process
- Stack exports for critical endpoints, connection strings, and resource identifiers
