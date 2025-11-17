# RDS PostgreSQL Database Migration to Staging Environment

Hey team,

We've got an important database migration project for our payment processing system. The development team has been running a PostgreSQL database in the dev environment, and now we need to get this properly set up in staging with all the production-grade configurations. This is for a financial services company, so we need to make sure everything is locked down and highly available.

The current setup is running in the dev VPC at 10.0.0.0/16, and we need to move it to staging VPC at 10.1.0.0/16. The staging environment has different networking and much tighter security requirements that we need to implement properly. We're talking deletion protection, multi-AZ deployment, enhanced monitoring, and proper secrets management.

This migration needs to happen with zero downtime, and we need to ensure all the staging-specific configurations are applied correctly. The business is counting on this for their payment processing operations, so reliability and security are non-negotiable.

## What we need to build

Create an RDS PostgreSQL migration solution using **AWS CDK with Python** that moves the database from development to staging with enhanced configurations.

### Core Requirements

1. **Database Instance Migration**
   - Copy existing RDS PostgreSQL 13.7 instance from dev VPC to staging VPC
   - Use db.t3.medium instance class
   - Configure Multi-AZ deployment for high availability
   - Enable deletion protection to prevent accidental removal
   - Set up automated backups with 7-day retention period

2. **Network Configuration**
   - Migrate from dev VPC (10.0.0.0/16) to staging VPC (10.1.0.0/16)
   - Deploy across 3 availability zones using private database subnets
   - Create security groups allowing access only from staging application subnets
   - Ensure database endpoint is accessible only from private subnets

3. **Database Parameters and Settings**
   - Create new parameter group with staging-specific settings
   - Configure max_connections=200
   - Configure shared_buffers=256MB
   - Enable automatic minor version upgrades
   - Set maintenance window to Sunday 3-5 AM EST

4. **Security and Compliance**
   - Migrate database credentials to AWS Secrets Manager
   - Enable automatic secret rotation
   - Enable encryption at rest using AWS managed KMS keys
   - Implement least privilege IAM policies for all resources
   - Apply required tags: Environment=staging, CostCenter=engineering

5. **Monitoring and Observability**
   - Enable enhanced monitoring with 60-second granularity
   - Create CloudWatch alarm for CPU utilization above 80%
   - Create CloudWatch alarm for storage space below 10GB
   - Configure CloudWatch metrics and dashboards

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python** (CDK 2.x with Python 3.8+)
- Use **Amazon RDS** for PostgreSQL database instance
- Use **Amazon VPC** for networking, security groups, and subnets
- Use **AWS Secrets Manager** for credential management with rotation
- Use **AWS KMS** for encryption key management
- Use **Amazon CloudWatch** for alarms, metrics, and monitoring
- Use CDK L2 constructs for RDS resources
- Use CDK context variables for environment-specific values
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Must use CDK L2 constructs for RDS resources
- Database endpoint accessible only from private subnets
- Implement least privilege IAM policies for all resources
- Enable encryption at rest using AWS managed KMS keys
- Configure automatic minor version upgrades for PostgreSQL
- Set maintenance window to Sunday 3-5 AM EST
- Use CDK aspects to validate all resources have required tags
- Implement stack-level CloudFormation outputs for connection details
- All resources must be destroyable (no Retain policies unless explicitly required)
- Include proper error handling and logging
- Zero downtime during migration

## Success Criteria

- **Functionality**: Complete RDS PostgreSQL instance in staging VPC with all configurations
- **High Availability**: Multi-AZ deployment with automated backups and 7-day retention
- **Security**: Secrets Manager integration, KMS encryption, security groups, least privilege IAM
- **Monitoring**: Enhanced monitoring enabled, CloudWatch alarms for CPU and storage
- **Network Isolation**: Database accessible only from private subnets in staging VPC
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Zero Downtime**: Migration strategy ensures continuous availability
- **Code Quality**: Clean Python code, well-tested, properly documented
- **Outputs**: Database endpoint and connection details available via CloudFormation outputs

## What to deliver

- Complete AWS CDK Python implementation with proper stack structure
- RDS PostgreSQL instance with Multi-AZ, deletion protection, automated backups
- Parameter group with max_connections=200 and shared_buffers=256MB
- Security groups restricting access to staging application subnets only
- Secrets Manager secret with automatic rotation enabled
- KMS key for encryption at rest
- CloudWatch alarms for CPU utilization (>80%) and storage (<10GB)
- Enhanced monitoring with 60-second granularity
- Proper tagging with Environment=staging and CostCenter=engineering
- CloudFormation outputs for database endpoint and connection details
- Unit tests for stack validation
- Documentation covering deployment process and migration strategy
