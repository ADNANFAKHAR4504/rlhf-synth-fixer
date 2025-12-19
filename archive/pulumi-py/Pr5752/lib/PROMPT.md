# Payment Processing System Migration to Staging

Hey team,

We've got an important migration ahead of us. Our fintech startup has been running their payment processing infrastructure in a development environment, and now it's time to move everything to a proper staging environment with enhanced security and monitoring. The development setup has been working fine for testing, but it's using basic configurations that need to be hardened before we can confidently move toward production.

The business is taking security and compliance seriously here, which makes sense given we're handling payment processing. They want proper network isolation, encrypted databases, comprehensive monitoring, and the ability to trace every transaction through the system. This migration isn't just about copying resources, it's about establishing the patterns and safeguards we'll need for production.

I've been asked to build this using **Pulumi with Python**. The infrastructure needs to be production-ready from a security standpoint, but we also need to keep costs reasonable since this is still a staging environment. That means being smart about resource sizing and leveraging serverless where it makes sense.

## What we need to build

Create a complete payment processing infrastructure using **Pulumi with Python** that migrates the system from development to a hardened staging environment in the us-east-1 region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 availability zones for high availability
   - Public and private subnets in each AZ
   - NAT Gateways in each availability zone for Lambda internet access
   - Proper routing tables and security groups

2. **Database Layer**
   - RDS PostgreSQL 14.x instance deployed in private subnets
   - Multi-AZ enabled for automatic failover
   - Automated backups configured
   - Storage encryption using customer-managed KMS keys
   - Proper subnet groups across all three AZs

3. **Application Layer**
   - Lambda functions for payment validation logic
   - Environment variables pointing to staging-specific resources
   - AWS X-Ray tracing enabled for distributed tracing
   - Proper IAM roles with least privilege access

4. **API Layer**
   - API Gateway configured with staging-specific endpoints
   - Request validation enabled
   - Request throttling and usage plans implemented
   - X-Ray tracing enabled for API calls

5. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Distribute traffic to Lambda functions
   - Proper health checks configured

6. **Storage and Audit**
   - S3 buckets for payment audit logs
   - Versioning enabled on all buckets
   - Lifecycle policies with 90-day retention
   - Encryption at rest

7. **Monitoring and Logging**
   - CloudWatch Log Groups for all services with 30-day retention
   - CloudWatch alarms for RDS CPU usage threshold breaches
   - CloudWatch alarms for Lambda error rates
   - CloudWatch alarms for API Gateway 4xx and 5xx error rates
   - Proper alarm actions configured

8. **Security and Compliance**
   - KMS keys for encryption with proper key policies
   - IAM roles with staging-specific permissions for each service
   - All compute and database resources in private subnets
   - Only ALB exposed in public subnets

9. **Resource Organization**
   - All resources tagged with Environment=staging
   - All resources tagged with MigrationDate
   - Resource names must include environmentSuffix for uniqueness
   - Follow naming convention: resource-type-environment-suffix

10. **Observability**
    - X-Ray tracing for Lambda functions
    - X-Ray tracing for API Gateway
    - Service map visibility across the entire stack

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use AWS VPC for network isolation across 3 availability zones
- Use AWS RDS PostgreSQL for transaction database with Multi-AZ
- Use AWS Lambda for serverless payment validation
- Use AWS API Gateway for REST API endpoints
- Use AWS S3 for audit log storage
- Use AWS Application Load Balancer for traffic distribution
- Use AWS CloudWatch for logging and monitoring
- Use AWS IAM for role-based access control
- Use AWS X-Ray for distributed tracing
- Use AWS KMS for encryption key management
- Deploy to us-east-1 region
- Resource names must include environmentSuffix parameter for uniqueness
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- All resources must be tagged with Environment=staging and MigrationDate tags
- RDS instances must use encrypted storage with customer-managed KMS keys
- Lambda functions must use environment-specific IAM roles with least privilege principle
- API Gateway must implement request throttling with appropriate limits
- API Gateway must have usage plans configured
- CloudWatch alarms must be created for all critical metrics (RDS CPU, Lambda errors, API Gateway errors)
- S3 buckets must have versioning enabled
- S3 buckets must have lifecycle policies for 90-day retention
- All compute and database resources must be deployed in private subnets
- Only the Application Load Balancer should be in public subnets
- NAT Gateways required in each AZ for Lambda outbound connectivity
- No resources should use Retain deletion policies

## Success Criteria

- **Functionality**: Complete VPC with 3 AZs, RDS Multi-AZ database, Lambda functions with API Gateway integration, ALB traffic distribution, S3 audit logging, comprehensive CloudWatch monitoring
- **Security**: All database and compute in private subnets, KMS encryption for RDS, IAM roles with least privilege, proper security groups and NACLs
- **Reliability**: Multi-AZ RDS for automatic failover, NAT Gateways in each AZ, automated backups, CloudWatch alarms for critical metrics
- **Observability**: X-Ray tracing enabled on Lambda and API Gateway, CloudWatch logs with 30-day retention, alarms for CPU, errors, and API rates
- **Compliance**: All resources tagged appropriately, versioning enabled on S3, lifecycle policies configured, encryption at rest
- **Resource Naming**: All resources include environmentSuffix parameter in their names for environment isolation
- **Code Quality**: Clean Python code, well-structured Pulumi resources, comprehensive test coverage, clear documentation

## What to deliver

- Complete Pulumi Python implementation with all resources
- VPC, subnets, route tables, NAT Gateways, and Internet Gateway
- RDS PostgreSQL instance with Multi-AZ, encrypted storage, and automated backups
- Lambda functions with payment validation logic and proper IAM roles
- API Gateway with staging endpoints, throttling, and usage plans
- Application Load Balancer with target groups and listeners
- S3 buckets with versioning, lifecycle policies, and encryption
- CloudWatch Log Groups for all services with appropriate retention
- CloudWatch alarms for RDS CPU, Lambda errors, and API Gateway errors
- KMS keys with proper key policies for RDS encryption
- IAM roles and policies for Lambda, RDS, API Gateway, and other services
- X-Ray tracing configuration for Lambda and API Gateway
- Proper tagging with Environment and MigrationDate on all resources
- Unit tests for all infrastructure components
- Integration tests validating end-to-end functionality
- Documentation with deployment instructions and architecture overview
