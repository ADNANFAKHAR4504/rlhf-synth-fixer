# Multi-Region Disaster Recovery for PostgreSQL Database

Hey team,

We have a critical requirement from a financial services client who needs disaster recovery for their transaction database. Their business can't tolerate more than a minute of data loss or more than five minutes of downtime. They've asked us to build this using Terraform with HCL to implement automated failover across AWS regions.

The client currently runs their operations in us-east-1, but they need a fully replicated environment in us-west-2 for disaster recovery. When things go wrong in the primary region, they need automatic failover with minimal manual intervention. The system should detect failures, switch DNS routing, and ensure their applications can continue processing transactions with the secondary database cluster.

This is a production financial system, so we need to be extra careful about data integrity, security, and compliance. All database credentials need proper rotation, encryption has to be enforced everywhere, and we need comprehensive monitoring to catch issues before they become problems.

## What we need to build

Create a multi-region disaster recovery infrastructure using Terraform with HCL for a PostgreSQL database system. The solution must provide automated failover capabilities with cross-region replication and health monitoring.

### Core Requirements

1. RDS Aurora PostgreSQL Clusters
   - Deploy Aurora PostgreSQL cluster in us-east-1 as the primary region
   - Deploy Aurora PostgreSQL cluster in us-west-2 as the secondary region
   - Aurora primary cluster in us-east-1 continuously streams transaction data to Aurora secondary cluster in us-west-2 using Aurora Global Database replication
   - Use db.r6g.large instance class for all database instances
   - Enable encryption at rest using AWS KMS keys that are replicated across regions
   - Create at least 2 read replicas in each cluster distributed across different availability zones
   - RPO must be less than 1 minute, RTO must be less than 5 minutes

2. Route 53 Health Checks and Failover Routing
   - Route 53 health checks monitor Aurora endpoints in both regions and verify database connectivity through TCP connections
   - Health checks also monitor replication lag metrics from CloudWatch to ensure lag stays below 60 seconds
   - Route 53 failover routing policy automatically redirects DNS traffic from primary Aurora endpoint to secondary Aurora endpoint when health checks detect failures
   - DNS updates propagate within 60 seconds when primary region becomes unhealthy

3. Automated Backup Configuration
   - Enable automated backups in both regions
   - Configure point-in-time recovery capability
   - Set appropriate backup retention periods for compliance

4. S3 Backup Storage
   - Create S3 bucket in us-east-1 for storing manual database exports
   - S3 cross-region replication automatically copies backup objects from us-east-1 bucket to us-west-2 bucket to ensure backup availability during regional failures
   - Enable versioning on both buckets to protect against accidental deletions
   - S3 lifecycle policies automatically transition backup objects older than 30 days to Glacier storage class to reduce costs

5. High Availability Configuration
   - Ensure read replicas are distributed across multiple availability zones
   - Configure automatic failover within each cluster
   - Parameter groups must have pg_stat_statements enabled for monitoring

6. Database Event Notifications
   - Create SNS topics in both us-east-1 and us-west-2 to receive database event notifications
   - RDS Aurora sends event notifications to SNS topics when cluster state changes, failovers occur, or maintenance windows start
   - SNS topics deliver notifications to subscriber applications and monitoring systems
   - Configure SQS dead letter queues attached to SNS subscriptions to capture failed message deliveries with maximum receive count of 3

7. Resource Tagging
   - Tag all resources with Environment=production
   - Tag all resources with DR-Tier=critical

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use AWS RDS Aurora for the database clusters
- Use AWS Route 53 for DNS and health checks
- Use AWS S3 for backup storage with cross-region replication
- Use AWS KMS for encryption key management
- Use AWS Secrets Manager for database credentials with automatic rotation
- Use AWS SNS for event notifications
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention where resource names combine the resource type with the environmentSuffix
- Deploy to us-east-1 primary region and us-west-2 secondary region
- All resources must be destroyable without Retain policies

### Constraints

- Aurora clusters must use db.r6g.large instances with encryption at rest using AWS KMS
- Route 53 health checks must verify both database connectivity and replication lag less than 60 seconds
- S3 buckets must have versioning enabled and lifecycle policies to transition old exports to Glacier after 30 days
- All database passwords must be stored in AWS Secrets Manager with automatic rotation enabled
- VPC security groups control network access by allowing inbound PostgreSQL connections only from application subnet CIDR blocks to Aurora cluster endpoints
- Terraform state must be stored in S3 with DynamoDB locking and versioning enabled
- Each Aurora cluster must have at least 2 read replicas distributed across different AZs
- SNS topics must have dead letter queues configured with maximum receive count of 3
- All resources must support destruction for testing purposes - FORBIDDEN: RemovalPolicy RETAIN

## Critical Deployment Requirements

- All resource names MUST include the environmentSuffix parameter for uniqueness
- Use naming pattern where resource names combine the resource type with environmentSuffix for all resources
- All resources must be fully destroyable with no deletion protection
- No RemovalPolicy RETAIN or DeletionPolicy Retain on any resource
- Database deletion protection must be disabled to allow clean teardown
- Enable proper cleanup of snapshots and backups on destroy

## Success Criteria

- Functionality: Aurora primary cluster streams database transactions to secondary cluster with replication lag consistently under 60 seconds as measured by CloudWatch metrics
- Failover: Route 53 health checks monitor Aurora endpoints and automatically update DNS records to redirect application traffic from failed primary region to healthy secondary region
- Backup: Aurora automated backup system captures snapshots in both regions and enables point-in-time recovery through transaction log replay
- Storage: S3 replication service copies backup files from primary bucket to secondary bucket and lifecycle policies transition aged objects to Glacier storage
- High Availability: Aurora read replicas process read queries across multiple availability zones while primary instance handles write operations
- Security: Applications retrieve database credentials from Secrets Manager which automatically rotates passwords and updates Aurora cluster authentication, with KMS encrypting all data at rest
- Monitoring: Aurora publishes events to SNS topics which fan out notifications to monitoring applications, with SQS dead letter queues capturing undeliverable messages
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be cleanly destroyed without manual intervention
- Code Quality: Well-structured HCL code with proper variable definitions and outputs

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
