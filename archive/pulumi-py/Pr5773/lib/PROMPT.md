Hey team,

We need to build a database migration infrastructure for a financial services company that's moving their payment processing database from on-premises to AWS. I've been asked to create this in Python using Pulumi. The business wants zero downtime during migration and continuous data synchronization between the old and new environments during the transition period.

This is a critical migration handling 5000 transactions per minute. We're dealing with a PostgreSQL 12.x database on-premises that needs to be migrated to PostgreSQL 15.3 on AWS RDS. The migration needs to be seamless with full CDC (Change Data Capture) to keep both databases in sync until cutover.

We already have the VPC infrastructure in place with private subnets across two availability zones in us-east-1. The application servers are already deployed and have their own security group. Our job is to set up the target RDS infrastructure and configure AWS DMS to handle the continuous replication.

## What we need to build

Create a database migration infrastructure using **Pulumi with Python** for migrating an on-premises PostgreSQL database to AWS RDS with zero downtime.

### Core Requirements

1. RDS PostgreSQL Infrastructure
   - PostgreSQL 15.3 instance with Multi-AZ deployment in existing private subnets
   - Use db.r5.xlarge instance class with 100GB GP3 storage
   - Configure DB subnet group using provided private subnet IDs
   - Enable automated backups with 7-day retention period
   - No public accessibility - private subnets only

2. Security Configuration
   - Security group allowing inbound PostgreSQL traffic on port 5432 only from application security group
   - Encryption at rest using new KMS customer-managed key specifically for RDS
   - Store master database credentials in AWS Secrets Manager with automatic rotation disabled initially

3. Database Migration Service Setup
   - DMS replication instance in the same VPC for data migration
   - DMS source endpoint pointing to on-premises database at 10.0.1.50:5432
   - DMS target endpoint for the new RDS instance using credentials from Secrets Manager
   - DMS migration task with full load and CDC enabled for continuous replication

4. Monitoring and Alerting
   - CloudWatch alarms for RDS CPU utilization threshold above 80%
   - CloudWatch alarm for free storage space below 10GB
   - CloudWatch alarms for read and write latency exceeding 200ms

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use AWS RDS for PostgreSQL 15.3 database
- Use AWS Database Migration Service for continuous data replication
- Use AWS KMS for encryption key management
- Use AWS Secrets Manager for credential storage
- Use AWS CloudWatch for monitoring and alerting
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- RDS instance must use db.r5.xlarge instance class with 100GB GP3 storage
- Multi-AZ deployment required for high availability
- RDS instance must be in private subnets with no public accessibility
- Enable encryption at rest using AWS KMS customer-managed keys
- Automated backups with 7-day retention period
- DMS must support both full load and CDC for continuous replication
- Security group must only allow traffic from application security group
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging

### Environment Details

- Production environment in us-east-1 region
- Existing VPC: vpc-0123456789abcdef
- Private subnets: subnet-private-1a, subnet-private-1b (across two AZs)
- Application security group: sg-app-servers
- On-premises database: 10.0.1.50:5432 (PostgreSQL 12.x)
- Target: PostgreSQL 15.3 on AWS RDS
- Current load: 5000 transactions per minute

## Success Criteria

- Functionality: Complete RDS PostgreSQL 15.3 instance with Multi-AZ deployment
- Functionality: DMS replication instance configured with source and target endpoints
- Functionality: DMS migration task with full load and CDC enabled
- Security: Encryption at rest with KMS, credentials in Secrets Manager
- Security: Network isolation with security groups restricting access
- Monitoring: CloudWatch alarms for CPU, storage, and latency metrics
- Performance: db.r5.xlarge instance with 100GB GP3 storage
- Reliability: Multi-AZ deployment with 7-day backup retention
- Resource Naming: All resources include environmentSuffix
- Code Quality: Python with proper error handling, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation
- RDS PostgreSQL 15.3 with Multi-AZ and encryption
- AWS Database Migration Service with replication instance, endpoints, and migration task
- AWS KMS key for RDS encryption
- AWS Secrets Manager secret for database credentials
- Security groups and DB subnet group configuration
- CloudWatch alarms for monitoring
- Unit tests for all components
- Documentation and deployment instructions
- Outputs: RDS endpoint, DMS replication instance ARN, Secrets Manager secret ARN
