Hey team,

We need to migrate our payment processing database from on-premises to AWS. The business is moving from their existing staging PostgreSQL setup to a production-ready Aurora cluster in AWS. This is a critical migration for our fintech operations, and we need to minimize downtime while ensuring data integrity throughout the transition.

The current on-premises setup is running PostgreSQL and handles all our payment transactions. We need to replicate this in AWS with better availability, automated backups, and enhanced security. The business has mandated strict compliance requirements including encryption, credential rotation, and comprehensive monitoring.

I've been asked to create the infrastructure using Go with AWS CDK. The target deployment is in us-east-1, and we need to make sure everything follows our naming standards with environment suffixes for multi-environment deployments.

## What we need to build

Create a production-ready RDS Aurora PostgreSQL cluster migration infrastructure using **AWS CDK with Go** for our payment processing database.

### Core Requirements

1. **Network Infrastructure**
   - New VPC spanning 3 availability zones for high availability
   - Public and private subnets in each AZ
   - Database instances must be in private subnets only with no internet access
   - Proper routing and network isolation

2. **Aurora PostgreSQL Database**
   - Aurora PostgreSQL version 15.4 cluster
   - One writer instance and two reader instances for load distribution
   - Multi-AZ deployment across at least 2 availability zones
   - Private subnet placement with no public accessibility

3. **Security and Credentials**
   - Master credentials stored in AWS Secrets Manager
   - Automatic credential rotation every 30 days
   - Customer-managed KMS key for encryption at rest
   - Parameter groups configured to enforce SSL connections
   - Optimized for payment transaction workloads

4. **Backup and Recovery**
   - Automated daily backups at 3 AM UTC
   - 7-day backup retention period
   - Point-in-time recovery enabled
   - 7-day retention for point-in-time restore

5. **Monitoring and Alerting**
   - CloudWatch alarm for CPU utilization above 80 percent threshold
   - CloudWatch alarm for storage space above 85 percent threshold
   - Performance Insights enabled with 7-day data retention
   - Query performance analysis capabilities

6. **Infrastructure Outputs**
   - Cluster writer endpoint for application configuration
   - Reader endpoint for read-only queries
   - Secrets Manager ARN for credential retrieval

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go**
- Deploy to **us-east-1** region
- Use **VPC** with 3 availability zones, public and private subnets, NAT Gateways
- Use **RDS Aurora PostgreSQL** version 15.4 engine
- Use **Secrets Manager** for database credentials with rotation
- Use **KMS** for encryption at rest with customer-managed keys
- Use **CloudWatch** for alarms and Performance Insights
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `payment-db-resource-type-environment-suffix`
- All database instances must be in private subnets
- Configure parameter groups for SSL and payment workload optimization
- Enable Performance Insights for query analysis

### Constraints

- Database must use Aurora PostgreSQL 15.4 engine specifically
- Enable point-in-time recovery with 7-day retention
- Automated backups must run at 3 AM UTC daily
- Database instances in private subnets only with no public access
- Master credentials in AWS Secrets Manager with 30-day rotation
- Encryption at rest using AWS KMS customer-managed key
- Read replicas in at least 2 different availability zones
- CloudWatch alarm for CPU above 80 percent
- CloudWatch alarm for storage above 85 percent
- Parameter groups must enforce SSL connections
- All resources must be destroyable for testing (no DeletionProtection or Retain policies)
- Include proper error handling and resource dependencies

## Success Criteria

- **Functionality**: Aurora cluster deployed with 1 writer and 2 readers
- **Availability**: Multi-AZ deployment across at least 2 zones
- **Security**: Encryption enabled, credentials in Secrets Manager, SSL enforced
- **Backup**: Daily backups at 3 AM UTC, 7-day retention, point-in-time recovery
- **Monitoring**: CPU and storage alarms configured, Performance Insights enabled
- **Network**: VPC with 3 AZs, private subnets for database, proper isolation
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Go code, well-structured, documented

## What to deliver

- Complete AWS CDK Go implementation
- VPC with 3 availability zones and public/private subnets
- Aurora PostgreSQL 15.4 cluster with 1 writer and 2 readers
- Secrets Manager secret with 30-day rotation for database credentials
- KMS customer-managed key for encryption
- CloudWatch alarms for CPU and storage thresholds
- Performance Insights configuration
- Parameter groups with SSL enforcement and payment workload optimization
- Stack outputs for cluster endpoints and Secrets Manager ARN
- Proper IAM roles and security groups
