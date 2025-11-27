# Multi-Region Disaster Recovery for PostgreSQL Database

Hey team,

We have a financial services company that needs a robust disaster recovery solution for their critical transaction database. They're processing thousands of financial transactions daily and cannot afford extended downtime. The business requirements are clear: they need automated failover capabilities with minimal data loss (RPO less than 1 minute) and quick recovery time (RTO less than 5 minutes). I've been asked to create this infrastructure using **Terraform with HCL**.

The current situation is that they're running a single-region database setup which creates a significant business risk. If the primary region goes down, they could lose critical transaction data and face regulatory penalties. The compliance team has mandated that we implement a multi-region disaster recovery strategy with automated failover, comprehensive monitoring, and regular backup testing.

Their infrastructure team has already set up the networking foundation with VPCs in both us-east-1 and us-west-2, each with private subnets across three availability zones, VPC peering for replication traffic, and NAT gateways for outbound connectivity. Now we need to build the database disaster recovery solution on top of this foundation.

## What we need to build

Create a multi-region disaster recovery system using **Terraform with HCL** for a PostgreSQL database with automated failover capabilities.

### Core Requirements

1. **Primary Database Infrastructure (us-east-1)**
   - Deploy RDS Aurora PostgreSQL cluster with Global Database capability
   - Use db.r6g.large instances with encryption at rest using AWS KMS
   - Configure at least 2 read replicas distributed across different availability zones
   - Enable automated backups with point-in-time recovery
   - Configure parameter groups with pg_stat_statements enabled for monitoring

2. **Secondary Database Infrastructure (us-west-2)**
   - Deploy RDS Aurora PostgreSQL cluster as global database secondary
   - Configure cross-region replication from primary cluster
   - Use db.r6g.large instances with encryption at rest using AWS KMS
   - Configure at least 2 read replicas distributed across different availability zones
   - Enable automated backups with point-in-time recovery

3. **Health Monitoring and Failover**
   - Configure Route 53 health checks to verify database connectivity
   - Health checks must also verify replication lag is less than 60 seconds
   - Set up failover routing between regions with automatic DNS failover
   - Implement health check endpoints for both database clusters

4. **Backup and Export Storage**
   - Create S3 bucket in us-east-1 for storing manual database exports
   - Enable versioning on S3 buckets
   - Configure cross-region replication to us-west-2
   - Set up lifecycle policies to transition old exports to Glacier after 30 days

5. **Secrets Management**
   - Store all database passwords in AWS Secrets Manager
   - Enable automatic rotation for database credentials
   - Configure separate secrets for each region

6. **Event Notifications**
   - Set up SNS topics in both regions for database event notifications
   - Configure dead letter queues with maximum receive count of 3
   - Subscribe to critical database events (failover, backup failures, replication issues)

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora PostgreSQL Global Database** for cross-region replication
- Use **Route 53** for health checks and failover routing
- Use **S3** for backup storage with cross-region replication
- Use **AWS KMS** for encryption at rest
- Use **AWS Secrets Manager** for credential management
- Use **SNS** for event notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy primary region to **us-east-1** and secondary region to **us-west-2**
- VPC security groups must restrict database access to application subnets only with explicit CIDR blocks

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use deletion_protection = false for RDS, no RETAIN policies)
- Terraform state must be stored in S3 with DynamoDB locking and versioning enabled
- Each resource must include proper tags: Environment=production and DR-Tier=critical
- Include proper error handling and logging for all components
- All Lambda functions (if created) must use Node.js 18+ compatible code with AWS SDK v3

### Constraints

- Aurora clusters must support automatic failover with minimum configuration
- Route 53 health checks must support both HTTP/HTTPS endpoint checks and CloudWatch metric-based checks
- S3 buckets must enforce encryption in transit and at rest
- Database passwords must be auto-generated with minimum 16 characters including special characters
- VPC security groups must follow principle of least privilege
- Cross-region replication must be asynchronous but with lag monitoring
- SNS topics must have encryption enabled using AWS KMS
- All KMS keys must have proper key policies allowing necessary AWS services

### Service-Specific Warnings

- **RDS Aurora Global Database**: Only one global database cluster can exist per AWS account per region pair. Do not create multiple global database clusters with same primary-secondary region combination.
- **Route 53 Health Checks**: Health checks that monitor CloudWatch alarms require proper IAM permissions for Route 53 to read CloudWatch metrics.
- **AWS Secrets Manager**: Automatic rotation requires Lambda functions with proper VPC connectivity to reach database endpoints.

## Success Criteria

- **Functionality**: Database replication working with RPO less than 1 minute, automated failover tested
- **Performance**: Read replicas distribute load, replication lag consistently under 60 seconds
- **Reliability**: Health checks detect failures within 30 seconds, failover completes within 5 minutes
- **Security**: All data encrypted at rest and in transit, credentials rotated automatically, network access restricted
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: Well-structured HCL code, properly parameterized, includes comprehensive comments

## What to deliver

- Complete **Terraform HCL** implementation with all configuration files
- RDS Aurora PostgreSQL Global Database spanning us-east-1 and us-west-2
- Route 53 health checks and failover routing configuration
- S3 buckets with cross-region replication for backup storage
- AWS Secrets Manager secrets with automatic rotation setup
- SNS topics with dead letter queues in both regions
- KMS keys for encryption in both regions
- VPC security groups restricting database access
- Variable definitions allowing easy customization via environmentSuffix
- Provider configuration for multi-region deployment
- Proper tagging strategy (Environment=production, DR-Tier=critical)
- Backend configuration for state management
- Documentation explaining the disaster recovery architecture and failover procedures
