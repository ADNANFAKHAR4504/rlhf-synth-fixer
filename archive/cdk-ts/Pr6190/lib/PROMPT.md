# Database Migration Infrastructure

Hey team,

We need to build infrastructure to migrate our development RDS MySQL database to a production Aurora MySQL cluster with minimal downtime. This is for our multi-tenant SaaS platform that needs to scale better in production while maintaining data integrity throughout the migration. I've been asked to create this using TypeScript with AWS CDK. The business wants a smooth transition with continuous data replication and built-in validation.

Our current development environment runs on a standard RDS MySQL 8.0.35 instance, but production needs the scalability and performance of Aurora MySQL. We already have VPC peering configured between development and production environments, with private subnets set up in two availability zones. The migration needs to happen without taking the application offline, so we'll use DMS for full load plus CDC to keep everything in sync.

The tricky part is making sure we don't lose any data during the transition and that we can roll back if something goes wrong. We also need comprehensive monitoring to catch any issues early, especially replication lag or migration failures.

## What we need to build

Create a database migration infrastructure using **AWS CDK with TypeScript** that handles the complete migration from RDS MySQL to Aurora MySQL with zero downtime.

### Core Requirements

1. **Aurora MySQL Cluster Setup**
   - Create Aurora MySQL 8.0 cluster in production VPC
   - Configure one writer instance and one reader instance
   - Span across two availability zones for high availability
   - Configure automated backups with 7-day retention period

2. **DMS Replication Infrastructure**
   - Set up DMS replication instance in private subnet
   - Create appropriate IAM roles for DMS operations
   - Configure source endpoint pointing to development RDS MySQL instance
   - Configure target endpoint pointing to production Aurora cluster
   - Set up migration task with full load and CDC enabled

3. **Security and Secrets Management**
   - Implement Secrets Manager for source and target database credentials
   - Enable secrets rotation for production credentials
   - Create security groups allowing DMS to connect to both databases
   - Configure separate security groups for development and production databases
   - Use KMS customer-managed keys for encryption at rest
   - Enable encryption in transit for all database connections

4. **Monitoring and Alerting**
   - Create CloudWatch alarms for DMS task failures
   - Configure alerts for Aurora replication lag exceeding 30 seconds
   - Enable Aurora Performance Insights for query monitoring
   - Set up appropriate logging for DMS tasks and Aurora cluster

5. **Data Validation**
   - Create Lambda function to validate data consistency post-migration
   - Implement automated validation checks
   - Ensure validation can compare source and target databases

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Amazon Aurora MySQL** for production database cluster
- Use **AWS DMS** for database migration and replication
- Use **AWS Secrets Manager** for credential management
- Use **AWS KMS** for encryption key management
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **AWS Lambda** for validation functions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{suffix}`
- Deploy to **eu-west-2** region
- CDK version 2.x with TypeScript
- Node.js 18 or higher

### Existing Environment Details

- Development VPC with existing subnets:
  - subnet-dev-1a, subnet-dev-1b, subnet-dev-1c
- Production VPC with existing subnets:
  - subnet-prod-1a, subnet-prod-1b, subnet-prod-1c
- VPC peering already configured with proper routing
- Source RDS MySQL 8.0.35 running in development VPC
- Database credentials already stored in Secrets Manager

### Constraints

- Secrets should reference existing Secrets Manager entries, not create new ones
- All resources must be destroyable (no Retain deletion policies unless absolutely necessary)
- Follow principle of least privilege for all IAM roles
- Configure parameter groups to match source MySQL configuration
- Enable appropriate CloudWatch logging for troubleshooting
- Implement proper error handling in Lambda validation function
- Integration tests must load outputs from cfn-outputs/flat-outputs.json

## Success Criteria

- **Migration Capability**: DMS successfully replicates full database load and CDC changes
- **High Availability**: Aurora cluster spans two AZs with writer and reader instances
- **Security**: All credentials managed by Secrets Manager with rotation enabled
- **Encryption**: Data encrypted at rest using KMS and in transit using SSL/TLS
- **Monitoring**: CloudWatch alarms configured for failures and replication lag over 30 seconds
- **Validation**: Lambda function can verify data consistency between source and target
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript implementation, well-structured, follows CDK best practices

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/ directory
- Aurora MySQL cluster with one writer and one reader instance
- DMS replication instance with source and target endpoints
- DMS migration task configured for full load and CDC
- Security groups for database connectivity
- Secrets Manager integration for database credentials
- KMS customer-managed keys for encryption
- CloudWatch alarms for task failures and replication lag
- Lambda function for post-migration data validation
- Stack outputs including Aurora cluster endpoint and DMS task ARN
- Unit tests for infrastructure components
- Documentation of deployment process
