# Multi-Environment Data Analytics Platform

Hey team,

We need to build a comprehensive multi-environment infrastructure setup for a data analytics platform. The business is expanding rapidly and we need proper environment separation across dev, staging, and production with proper resource isolation, security controls, and cost optimization. I've been asked to create this using TypeScript with AWS CDK.

The challenge is managing environment-specific configurations while maintaining consistency in infrastructure patterns. Each environment has different requirements for resource sizing, retention policies, and security controls. Dev needs to be cost-effective with minimal retention, staging needs to mirror production but at smaller scale, and production needs full redundancy with extended retention.

We need to ensure all infrastructure is properly tagged for cost tracking, follows security best practices with encryption at rest, and maintains VPC isolation for database resources. The platform will process data through Lambda functions that need access to both S3 and RDS PostgreSQL databases.

## What we need to build

Create a multi-environment infrastructure platform using **AWS CDK with TypeScript** for a data analytics system with environment-specific configurations and proper resource isolation.

### Core Requirements

1. **VPC Networking**
   - VPC with 2 public and 2 private subnets across 2 availability zones
   - Environment-specific CIDR blocks (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod)
   - Internet Gateway for public subnet access
   - NAT Gateways for private subnet internet access
   - Security groups with progressive restrictions based on environment

2. **Database Layer**
   - RDS PostgreSQL database with encryption enabled
   - Environment-specific instance sizing (t3.micro for dev, t3.small for staging, r5.large for prod)
   - Deployed in private subnets for security
   - Automated backups with environment-specific retention (7/14/30 days)
   - Multi-AZ for production, single-AZ for dev/staging
   - PostgreSQL engine version 14.15

3. **Compute Layer**
   - Lambda functions for data processing with VPC access
   - Environment-specific memory allocation (512MB dev, 1024MB staging, 2048MB prod)
   - CloudWatch log groups with retention policies (7/30/90 days)
   - IAM roles with least privilege access
   - Integration with RDS and S3

4. **Storage Layer**
   - S3 buckets for data storage
   - Versioning enabled for staging and production
   - Server-side encryption enabled
   - Bucket policies for access control

5. **State Management**
   - DynamoDB tables with environment-specific billing modes
   - On-demand billing for dev, provisioned for production
   - Encryption at rest enabled
   - Point-in-time recovery for production

6. **Configuration Management**
   - SSM Parameter Store for runtime configuration
   - Parameters organized by environment path: /{env}/{service}/{param}
   - Secure string type for sensitive values
   - Integration with Lambda functions

7. **Monitoring and Logging**
   - CloudWatch log groups for all Lambda functions
   - Environment-specific retention periods
   - Structured logging with request correlation
   - Resource-level CloudWatch metrics

8. **Security and Access Control**
   - IAM roles with environment-specific naming
   - Security groups with least privilege access
   - Encryption at rest for all storage resources
   - Encryption in transit using TLS

9. **Resource Organization**
   - Stack tags for cost allocation (Environment, CostCenter, ManagedBy)
   - Resource naming with environmentSuffix for uniqueness
   - Consistent naming convention: {resource-type}-{environment-suffix}
   - Logical grouping using CDK constructs

10. **Environment Configuration**
    - Centralized configuration management
    - Environment validation to prevent misconfiguration
    - Type-safe configuration interface
    - Easy addition of new environments

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS VPC for network isolation
- Use Amazon RDS PostgreSQL for relational database with storage encryption
- Use AWS Lambda for serverless compute
- Use Amazon S3 for object storage
- Use Amazon DynamoDB for NoSQL state management
- Use AWS SSM Parameter Store for configuration
- Use CloudWatch for logging and monitoring
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-environmentSuffix`
- All resources must be destroyable (RemovalPolicy.DESTROY, no Retain policies)

### Constraints

- No hardcoded values - all configuration from environment config
- RDS must be encrypted at rest
- RDS instance type must be parsed from configuration string format (db.t3.micro)
- Lambda log retention must use CloudWatch RetentionDays enum
- Environment validation must check against valid values (dev, staging, prod)
- All resources must support clean deletion for CI/CD testing
- Security groups must allow database access from Lambda functions only
- Lambda functions must be deployed in VPC private subnets
- S3 buckets must have encryption enabled
- DynamoDB tables must have encryption enabled

### Success Criteria

- **Functionality**: Successfully deploys all resources in specified environment
- **Environment Isolation**: Each environment has separate VPC, database, and resources
- **Security**: RDS encrypted at rest, Lambda in private subnets, proper IAM roles
- **Configuration**: Environment-specific sizing, retention, and feature toggles work correctly
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly deleted via CDK destroy
- **Code Quality**: TypeScript with proper types, organized constructs, comprehensive documentation

## What to deliver

- Complete AWS CDK TypeScript implementation with proper project structure
- Environment configuration module with validation
- VPC construct with subnets, NAT gateways, and security groups
- RDS construct with PostgreSQL database and encryption
- Lambda construct with VPC integration and log groups
- S3 buckets with conditional versioning
- DynamoDB tables with environment-specific billing
- SSM parameters with hierarchical organization
- Stack implementation with all constructs integrated
- Unit tests for all custom constructs
- README with deployment instructions and architecture overview
- All code following CDK best practices and TypeScript conventions