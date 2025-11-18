# Loan Processing Application Infrastructure

Hey team,

We have a fintech startup client that needs to deploy their loan processing web application with some pretty strict compliance requirements. They're dealing with sensitive financial data, so data residency and audit logging are non-negotiable. The business wants high availability across multiple availability zones and detailed access logs for regulatory audits.

This is a production deployment that needs to handle real customer loan applications, so we're looking at a robust setup with ECS Fargate for the containerized application, RDS Aurora PostgreSQL for the database layer, and proper logging infrastructure. The compliance team has given us specific requirements around encryption, IAM authentication, and log retention that we need to follow exactly.

The application processes sensitive financial data, so we need to ensure everything is locked down properly with least-privilege IAM policies, encrypted storage, and comprehensive audit trails. We'll be deploying in us-east-1 across three availability zones to ensure high availability and disaster recovery capabilities.

## What we need to build

Create a loan processing web application infrastructure using **CDK with TypeScript** for AWS deployment.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public subnets and 3 private subnets across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - NAT gateways in each availability zone for outbound connectivity from private subnets
   - Proper routing tables for public and private subnet traffic

2. **Application Layer**
   - ECS Fargate cluster for containerized application deployment
   - Auto-scaling configuration based on CPU utilization (scale between 2-10 tasks)
   - Application Load Balancer in public subnets for incoming traffic
   - ALB access logs enabled and stored in dedicated S3 bucket with lifecycle policies

3. **Database Layer**
   - RDS Aurora PostgreSQL cluster with 1 writer and 2 reader instances
   - Multi-AZ deployment across the three availability zones
   - IAM database authentication instead of password-based authentication
   - Encryption using customer-managed KMS keys
   - Database backups encrypted and retained for exactly 35 days

4. **Storage and Content Delivery**
   - S3 bucket for static assets with CloudFront distribution
   - S3 bucket for application logs with appropriate lifecycle rules
   - All S3 buckets must have versioning enabled
   - Block public access at the bucket policy level for all S3 buckets

5. **Logging and Monitoring**
   - CloudWatch log groups for ECS tasks with 90-day retention
   - CloudWatch log groups for Lambda functions with 90-day retention
   - Subscription filters to export logs to S3 daily
   - Application logs streamed to CloudWatch Logs

6. **Lambda Functions**
   - Lambda functions for async processing tasks
   - Least-privilege IAM roles for Lambda execution
   - Reserved concurrent executions set for Lambda functions

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **EC2 VPC** for network infrastructure with 3 AZs
- Use **ECS Fargate** for containerized application hosting
- Use **Application Load Balancer** for load balancing
- Use **RDS Aurora PostgreSQL** for database with Multi-AZ
- Use **S3** for static assets and logs storage
- Use **CloudFront** for content delivery
- Use **CloudWatch Logs** for centralized logging
- Use **Lambda** for async processing
- Use **KMS** for customer-managed encryption keys
- Use **IAM** for access management and database authentication
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region spanning three availability zones
- CDK version 2.x with TypeScript and Node.js 18+

### Deployment Requirements (CRITICAL)

- All resources must be destroyable without manual intervention
- No Retain deletion policies allowed on any resources
- No DeletionProtection enabled on databases or other resources
- All resource names must include environmentSuffix string parameter for stack uniqueness
- Infrastructure must be completely teardown-able for testing and development cycles

### Constraints

- All S3 buckets must have versioning enabled and block public access at bucket policy level
- RDS instances must use IAM database authentication, not password-based authentication
- ALB access logs must be enabled and stored in dedicated S3 bucket with lifecycle policies
- All database backups must be encrypted with customer-managed KMS keys
- Database backups must be retained for exactly 35 days (not more, not less)
- Lambda functions must run with least-privilege IAM roles
- Lambda functions must have reserved concurrent executions configured
- Application logs must be streamed to CloudWatch Logs with 90-day retention
- CloudWatch logs must be exported to S3 daily using subscription filters
- All resources must support full destruction (no Retain policies anywhere)

## Success Criteria

- **Functionality**: Complete loan processing infrastructure deployed and operational across three AZs
- **High Availability**: Application auto-scales between 2-10 tasks based on CPU utilization
- **Database**: Aurora PostgreSQL cluster with 1 writer and 2 readers, IAM authentication enabled
- **Security**: All data encrypted at rest with customer-managed KMS keys, least-privilege IAM policies
- **Compliance**: All logs retained per requirements (CloudWatch 90 days, backups 35 days)
- **Logging**: Comprehensive audit trail with ALB logs, ECS logs, and Lambda logs all flowing to S3
- **Resource Naming**: All resources include environmentSuffix for stack uniqueness
- **Destroyability**: All resources can be fully destroyed without manual intervention
- **Code Quality**: TypeScript with proper types, well-structured CDK constructs, clear documentation

## What to deliver

- Complete CDK TypeScript implementation in lib/tap-stack.ts
- VPC with 3 public and 3 private subnets across us-east-1a, us-east-1b, us-east-1c
- NAT gateways for each availability zone
- Application Load Balancer with access logging enabled
- ECS Fargate cluster with auto-scaling (2-10 tasks)
- RDS Aurora PostgreSQL cluster (1 writer, 2 readers) with IAM authentication
- KMS keys for database encryption
- S3 buckets for static assets (with CloudFront) and logs (with lifecycle policies)
- CloudWatch log groups with 90-day retention and S3 export
- Lambda functions with least-privilege IAM roles and reserved concurrency
- IAM roles and policies for all services
- Complete documentation in lib/README.md
- All resources properly tagged and named with environmentSuffix
