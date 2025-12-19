Hey team,

We need to deploy a secure payment processing web application for a fintech startup that handles sensitive financial data. The business is launching their payment platform and needs infrastructure that meets PCI DSS compliance standards while maintaining high availability across multiple regions. I've been asked to create this infrastructure using **Pulumi with ts** and deploy it to the us-west-2 region.

The application processes payments for customers and needs to be highly available, secure, and compliant with strict financial regulations. The team wants us to ensure that all data is encrypted at rest and in transit, credentials are automatically rotated, and we have comprehensive audit trails for compliance purposes. They're looking for a production-grade setup that can handle the demands of a payment processing system.

This is a critical system that will be processing real financial transactions, so security and reliability are paramount. We need to make sure the database is protected with encryption, the application runs in isolated private subnets, and all access is properly controlled through security groups and IAM policies. The business also requires detailed logging for audit purposes with long retention periods.

## What we need to build

Create a secure payment processing infrastructure using **Pulumi with ts** for a fintech application in the us-west-2 region.

### Core Requirements

1. **Networking Infrastructure**
   - VPC with 3 public subnets across 3 availability zones
   - VPC with 3 private subnets across 3 availability zones
   - NAT gateways in each availability zone for outbound connectivity from private subnets
   - VPC Flow Logs capturing all traffic and sending logs to a dedicated S3 bucket

2. **Load Balancing**
   - Application Load Balancer with HTTP listeners
   - Route traffic to ECS services in private subnets
   - Note: For production, upgrade to HTTPS with ACM certificates

3. **Container Application Platform**
   - ECS Fargate cluster for running the payment application
   - Container images pulled from Amazon ECR
   - ECS tasks running in private subnets with no direct internet access
   - ECS task definitions using specific image tags, not 'latest'
   - Auto-scaling for ECS services based on CPU utilization

4. **Database Layer**
   - RDS Aurora PostgreSQL with Multi-AZ deployment
   - Encrypted storage using customer-managed KMS keys
   - Database credentials stored in AWS Secrets Manager with automatic 30-day rotation
   - Database accessible only from ECS tasks through security groups

5. **Static Content Delivery**
   - S3 buckets for static assets with versioning enabled
   - CloudFront distribution for content delivery
   - S3 lifecycle policies for compliance requirements

6. **Security and Secrets Management**
   - AWS Secrets Manager for database credentials with 30-day automatic rotation
   - Customer-managed KMS keys for RDS encryption
   - IAM roles with minimal permissions for ECS tasks and RDS access
   - Security groups implementing least-privilege with explicit port allowlists
   - HTTP access from internet to ALB (use HTTPS for production)
   - Database access restricted to ECS tasks only

7. **Monitoring and Compliance**
   - CloudWatch Log Groups with 2557-day retention (approximately 7 years) for audit trails
   - CloudWatch Alarms for high CPU usage on ECS tasks
   - CloudWatch Alarms for memory usage on ECS tasks
   - CloudWatch Alarms for failed health checks on ALB targets

8. **Resource Tagging**
   - All resources tagged with Environment, Project, and CostCenter tags

### Technical Requirements

- All infrastructure defined using **Pulumi with ts**
- Use Amazon VPC for networking isolation
- Use Application Load Balancer for HTTP traffic routing (HTTPS for production)
- Use Amazon ECS Fargate for container orchestration
- Use Amazon ECR as container registry
- Use RDS Aurora PostgreSQL for database with Multi-AZ deployment
- Use Amazon S3 for static assets with CloudFront
- Use AWS Secrets Manager for credential management with rotation
- Use customer-managed KMS keys for RDS encryption
- Use CloudWatch for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-west-2** region
- Node.js 18+ and ts 5.x for development
- Pulumi CLI 3.x for deployment

### Constraints

- All S3 buckets must have versioning enabled
- All S3 buckets must have lifecycle policies configured for compliance
- Security groups must implement least-privilege access with explicit port allowlists
- VPC flow logs must be enabled and sent to a dedicated S3 bucket
- All RDS instances must use encrypted storage with customer-managed KMS keys
- Database credentials must be stored in AWS Secrets Manager with automatic rotation every 30 days
- ECS tasks must run in private subnets with no direct internet access
- Application Load Balancer configured for HTTP (use HTTPS with ACM certificates for production)
- CloudWatch Logs must have 2557-day retention (approximately 7 years) for audit trails
- ALB and Target Group names auto-generated by AWS to avoid naming conflicts
- All resources must be tagged with Environment, Project, and CostCenter tags
- ECS task definitions must use specific image tags, not 'latest'
- All resources must be fully destroyable (no Retain deletion policies)
- Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack

### Success Criteria

- **Functionality**: Complete payment processing infrastructure deployed and operational
- **Performance**: Auto-scaling configured for ECS services based on CPU utilization
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: Encryption at rest and in transit, IAM least privilege, credentials rotated automatically
- **Compliance**: VPC Flow Logs enabled, CloudWatch Logs with 7-year retention, all resources properly tagged
- **Resource Naming**: All resources include environmentSuffix variable for uniqueness
- **Code Quality**: ts with strong typing, proper error handling, well-documented

## What to deliver

- Complete Pulumi ts implementation with proper project structure
- VPC with 3 public and 3 private subnets across 3 availability zones
- Application Load Balancer with HTTP listeners (upgrade to HTTPS for production)
- ECS Fargate cluster with auto-scaling configuration
- RDS Aurora PostgreSQL Multi-AZ with customer-managed KMS encryption
- S3 buckets with versioning and lifecycle policies for static assets
- CloudFront distribution for content delivery
- AWS Secrets Manager integration for credential rotation
- IAM roles with least-privilege permissions for ECS and RDS
- Security groups with explicit port allowlists
- VPC Flow Logs to dedicated S3 bucket
- CloudWatch Log Groups with 2557-day retention (approximately 7 years)
- CloudWatch Alarms for CPU, memory, and health check monitoring
- Comprehensive resource tagging with Environment, Project, CostCenter
- Unit tests for all infrastructure components
- Documentation with deployment instructions and architecture overview
- Exports of key resource ARNs and endpoints for integration
