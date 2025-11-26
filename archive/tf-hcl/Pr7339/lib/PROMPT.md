# Multi-Region Disaster Recovery for PostgreSQL Database

Hey team,

We have a critical requirement from a financial services client who needs disaster recovery for their transaction database. Their business can't tolerate more than a minute of data loss or more than five minutes of downtime. They've asked us to build this using **Terraform with HCL** to implement automated failover across AWS regions.

The client currently runs their operations in us-east-1, but they need a fully replicated environment in us-west-2 for disaster recovery. When things go wrong in the primary region, they need automatic failover with minimal manual intervention. The system should detect failures, switch DNS routing, and ensure their applications can continue processing transactions with the secondary database cluster.

This is a production financial system, so we need to be extra careful about data integrity, security, and compliance. All database credentials need proper rotation, encryption has to be enforced everywhere, and we need comprehensive monitoring to catch issues before they become problems.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Terraform with HCL** for a PostgreSQL database system. The solution must provide automated failover capabilities with cross-region replication and health monitoring.

### Core Requirements

1. **RDS Aurora PostgreSQL Clusters**
   - Deploy Aurora PostgreSQL cluster in us-east-1 as the primary region
   - Deploy Aurora PostgreSQL cluster in us-west-2 as the secondary region
   - Configure cross-region replication between clusters using Aurora Global Database
   - Use db.r6g.large instance class for all database instances
   - Enable encryption at rest using AWS KMS
   - Create at least 2 read replicas in each cluster distributed across different availability zones
   - RPO must be less than 1 minute, RTO must be less than 5 minutes

2. **Route 53 Health Checks and Failover Routing**
   - Configure Route 53 health checks to verify database connectivity
   - Health checks must also monitor replication lag (must be less than 60 seconds)
   - Set up failover routing policy to automatically switch between regions
   - Ensure DNS updates happen quickly when primary region fails

3. **Automated Backup Configuration**
   - Enable automated backups in both regions
   - Configure point-in-time recovery capability
   - Set appropriate backup retention periods for compliance

4. **S3 Backup Storage**
   - Create S3 bucket for storing manual database exports
   - Configure cross-region replication from us-east-1 to us-west-2
   - Enable versioning on both buckets
   - Implement lifecycle policies to transition old exports to Glacier after 30 days

5. **High Availability Configuration**
   - Ensure read replicas are distributed across multiple availability zones
   - Configure automatic failover within each cluster
   - Parameter groups must have pg_stat_statements enabled for monitoring

6. **Database Event Notifications**
   - Create SNS topics in both us-east-1 and us-west-2
   - Configure topics for database event notifications
   - Set up dead letter queues with maximum receive count of 3

7. **Resource Tagging**
   - Tag all resources with Environment=production
   - Tag all resources with DR-Tier=critical

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS RDS Aurora for the database clusters
- Use AWS Route 53 for DNS and health checks
- Use AWS S3 for backup storage with cross-region replication
- Use AWS KMS for encryption key management
- Use AWS Secrets Manager for database credentials with automatic rotation
- Use AWS SNS for event notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environmentSuffix`
- Deploy to **us-east-1** (primary) and **us-west-2** (secondary) regions
- All resources must be destroyable (no Retain policies)

### Constraints

- Aurora clusters must use db.r6g.large instances with encryption at rest using AWS KMS
- Route 53 health checks must verify both database connectivity and replication lag less than 60 seconds
- S3 buckets must have versioning enabled and lifecycle policies to transition old exports to Glacier after 30 days
- All database passwords must be stored in AWS Secrets Manager with automatic rotation enabled
- VPC security groups must restrict database access to application subnets only with explicit CIDR blocks
- Terraform state must be stored in S3 with DynamoDB locking and versioning enabled
- Each Aurora cluster must have at least 2 read replicas distributed across different AZs
- SNS topics must have dead letter queues configured with maximum receive count of 3
- All resources must support destruction for testing purposes (FORBIDDEN: RemovalPolicy RETAIN)

## Deployment Requirements (CRITICAL)

- All resource names MUST include the **environmentSuffix** parameter for uniqueness
- Use naming pattern: `{resource-type}-{environmentSuffix}` for all resources
- All resources must be fully destroyable with no deletion protection
- No RemovalPolicy RETAIN or DeletionPolicy Retain on any resource
- Database deletion protection must be disabled to allow clean teardown
- Enable proper cleanup of snapshots and backups on destroy

## Success Criteria

- **Functionality**: Aurora Global Database successfully replicates between us-east-1 and us-west-2 with replication lag under 60 seconds
- **Failover**: Route 53 health checks detect failures and automatically redirect traffic to healthy region
- **Backup**: Automated backups and point-in-time recovery functional in both regions
- **Storage**: S3 cross-region replication working with lifecycle policies moving old data to Glacier
- **High Availability**: Read replicas operational across multiple AZs in each region
- **Security**: All credentials stored in Secrets Manager with rotation enabled, encryption enabled everywhere
- **Monitoring**: SNS notifications working for database events with DLQ configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Well-structured HCL code with proper variable definitions and outputs

## What to deliver

- Complete Terraform HCL implementation
- VPC infrastructure in both us-east-1 and us-west-2 regions
- Aurora PostgreSQL Global Database with primary and secondary clusters
- Route 53 hosted zone with health checks and failover routing policies
- S3 buckets with cross-region replication and lifecycle policies
- KMS keys for encryption in both regions
- Secrets Manager secrets for database credentials with rotation
- SNS topics with dead letter queues in both regions
- Security groups restricting database access to application subnets
- Parameter groups with pg_stat_statements enabled
- Proper variable definitions for environmentSuffix and configuration
- Output values for connection endpoints and resource identifiers
- README documentation with deployment instructions
