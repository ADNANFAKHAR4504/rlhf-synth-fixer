# Single-Region Multi-AZ Disaster Recovery Infrastructure

Hey team,

We need to build a comprehensive disaster recovery solution for our critical production workloads. The business has asked us to implement this using **CDK with Python** to ensure infrastructure as code best practices. This is a single-region architecture focused on high availability through Multi-AZ deployment in us-east-1, providing rapid recovery capabilities for our database and application layers.

The key challenge we're solving is ensuring business continuity with minimal data loss and downtime. We need to meet a 1-hour Recovery Point Objective (RPO) and 4-hour Recovery Time Objective (RTO) through automated backups, Multi-AZ deployments, and comprehensive monitoring. The infrastructure must support both our serverless Lambda functions and database workloads with proper encryption, backup automation, and alerting.

This solution replaces our previous multi-region approach with a more cost-effective single-region design that still provides excellent availability through AWS's Multi-AZ capabilities. We're deploying everything in us-east-1 across three availability zones to ensure resilience against zone-level failures.

## What we need to build

Create a single-region, multi-AZ disaster recovery infrastructure using **CDK with Python** for production workloads in us-east-1.

### Core Requirements

1. **Aurora PostgreSQL Multi-AZ Database**
   - Multi-AZ deployment across availability zones in us-east-1
   - Automated backups with Point-in-Time Recovery enabled
   - Encryption at rest using AWS KMS customer-managed keys
   - Automatic backups retained for 7 days
   - Delete protection disabled for testing environments

2. **DynamoDB Table with PITR**
   - Point-in-time recovery enabled for data protection
   - On-demand billing mode for cost optimization
   - Encryption using AWS managed keys
   - No global tables (single region only)

3. **Lambda Functions**
   - Deploy in us-east-1 with Multi-AZ support
   - VPC-enabled for secure database access
   - Python 3.11 runtime minimum
   - Environment variables for database connections
   - Proper IAM roles with least privilege access

4. **S3 Buckets with Versioning**
   - Versioning enabled for data recovery
   - No cross-region replication (single region)
   - Server-side encryption with KMS
   - Lifecycle policies for old versions
   - Block public access enabled

5. **AWS Backup Configuration**
   - Hourly backup schedule for 1-hour RPO
   - 7-day retention period for backups
   - Backup vault in us-east-1 (no cross-region copy)
   - Backup Aurora database, DynamoDB table, and Lambda functions
   - Backup completion notifications via EventBridge

6. **VPC Infrastructure**
   - Single VPC in us-east-1
   - Multi-AZ subnets across 3 availability zones
   - Private subnets for Lambda and database resources
   - Public subnets for future load balancers if needed
   - VPC endpoints for S3 and DynamoDB (no internet traffic)
   - Security groups with proper ingress/egress rules

7. **KMS Encryption Keys**
   - Customer-managed keys for Aurora encryption
   - Customer-managed keys for S3 bucket encryption
   - Automatic key rotation enabled
   - Proper key policies for service access

8. **CloudWatch Monitoring**
   - Dashboard with key metrics for databases and Lambda
   - Alarms for backup job failures
   - Alarms for Aurora database health metrics
   - Alarms for DynamoDB throttling
   - SNS topic for alarm notifications

9. **EventBridge Rules**
   - Monitor AWS Backup job status changes
   - Alert on backup failures
   - Alert on backup completion
   - Target SNS topic for notifications

10. **IAM Roles and Policies**
    - Lambda execution role with VPC and database access
    - AWS Backup service role
    - Least privilege access for all services
    - No wildcard permissions

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **Aurora PostgreSQL** for relational database with Multi-AZ
- Use **DynamoDB** for NoSQL data with PITR
- Use **Lambda** for serverless compute in VPC
- Use **S3** for object storage with versioning
- Use **AWS Backup** for automated backup orchestration
- Use **VPC** for network isolation and security
- Use **KMS** for encryption key management
- Use **CloudWatch** for monitoring and alerting
- Use **EventBridge** for event-driven notifications
- Use **IAM** for access control
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region only (no cross-region resources)
- All resources in the same region across multiple availability zones

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with RemovalPolicy.DESTROY (no RemovalPolicy.RETAIN)
- This includes Aurora clusters, DynamoDB tables, S3 buckets, KMS keys, and backup vaults
- Database deletion protection must be set to False
- S3 buckets must have auto_delete_objects=True
- KMS keys must be deletable (no retention periods that block deletion)
- All resources must accept and use the environmentSuffix parameter in their names
- The environmentSuffix must be passed to all resources to ensure unique naming
- Lambda functions should be placed in lib/lambda/ or lib/functions/ directory
- For Lambda Node.js 18+: AWS SDK v3 must be explicitly installed in dependencies

### Constraints

- Single region deployment (us-east-1 only) - no cross-region resources
- Multi-AZ deployment within us-east-1 for high availability
- Must meet 1-hour RPO through hourly backups
- Must meet 4-hour RTO through Multi-AZ and automated recovery
- All data encrypted at rest and in transit
- No public internet access for database resources
- Lambda functions must run in private subnets with VPC endpoints
- Backup retention of 7 days minimum
- Cost-optimized with serverless and on-demand services
- All resources must be fully destroyable for testing environments

## Success Criteria

- **Functionality**: All services deployed and functional in us-east-1
- **High Availability**: Multi-AZ deployment across 3 availability zones
- **Data Protection**: Hourly backups with 7-day retention
- **Recovery Capability**: PITR enabled for Aurora and DynamoDB
- **Security**: Encryption at rest with KMS, VPC isolation, least privilege IAM
- **Monitoring**: CloudWatch dashboards and alarms configured
- **Notifications**: EventBridge rules alerting on backup status
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Stack can be fully deleted without manual intervention
- **Code Quality**: Python code following CDK best practices, well-documented

## What to deliver

- Complete CDK Python implementation in lib/ directory
- Aurora PostgreSQL Multi-AZ cluster with encryption and backups
- DynamoDB table with PITR enabled
- Lambda functions deployed in VPC with proper roles
- S3 buckets with versioning and encryption
- AWS Backup plan with hourly schedule
- VPC with Multi-AZ subnets and VPC endpoints
- KMS keys with automatic rotation
- CloudWatch dashboards and alarms
- EventBridge rules for backup monitoring
- IAM roles and policies with least privilege
- All resources parameterized with environmentSuffix
- CDK app.py entry point in bin/ directory
- Stack class in lib/ following tap_stack.py pattern
- Documentation in README.md with deployment instructions
