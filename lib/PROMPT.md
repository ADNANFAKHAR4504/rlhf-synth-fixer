Hey team,

We need to build a disaster recovery solution for a financial services company's critical transaction database. They're running PostgreSQL and need automated failover capabilities with an RTO under 5 minutes. The system must maintain a hot standby that can be promoted automatically when the primary database has issues.

**Implementation Note:** Due to CDK single-stack architecture constraints, this implementation deploys both primary and replica in the same region (us-east-1). True multi-region disaster recovery between us-east-1 and eu-west-1 would require a multi-stack CDK approach with separate stacks for each region.

The current setup has their transaction database in a single region, which doesn't meet their strict availability requirements. We've been asked to implement this using **AWS CDK with Python** to provision the infrastructure. The business needs this to ensure minimal downtime during database failures while maintaining data consistency.

This is a production-critical system handling financial transactions, so we need to be careful about data integrity, audit compliance, and automated monitoring. The failover process needs to be reliable and fast.

## What we need to build

Create a PostgreSQL disaster recovery system using **AWS CDK with Python** that provides automated failover with read replica capability.

### Core Requirements

1. **Primary Database Configuration (us-east-1)**
   - RDS PostgreSQL 15.x primary instance with Multi-AZ enabled
   - Instance class: db.r6g.large minimum
   - Backup retention: 7 days
   - Encryption at rest using AWS managed keys
   - Private subnet deployment

2. **Read Replica Configuration**
   - RDS read replica configured for promotion to primary
   - Deployed in same region as primary due to single-stack architecture
   - Must have automated backups enabled independently
   - Same encryption and instance class as primary
   - Ready for promotion without data loss

3. **Automated Failover Mechanism**
   - Lambda function to handle failover automation
   - Promotes replica to standalone instance
   - Updates Route53 routing weights automatically
   - Must complete execution within 300 seconds

4. **Health Monitoring and Routing**
   - Route53 weighted routing for database endpoints
   - Weighted routing policy: 100% primary, 0% secondary initially
   - Private hosted zone configuration
   - Lambda-based health monitoring for failover triggers

5. **Replication Monitoring**
   - CloudWatch alarms for replication lag exceeding 60 seconds
   - CloudWatch logs with /aws/rds/ prefix for all log groups
   - Comprehensive monitoring for failover triggers

6. **Security and Compliance**
   - Database passwords stored in AWS Secrets Manager
   - Parameter groups configured with log_statement='all' for audit compliance
   - Parameter groups must disable force_ssl for legacy application compatibility
   - VPC configuration with private subnets
   - Separate VPCs for network isolation

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **RDS PostgreSQL** for database instances
- Use **Route53** for DNS and health checks
- Use **Lambda** for automated failover logic
- Use **CloudWatch** for monitoring and alarms
- Use **Secrets Manager** for credential management
- Use **VPC** for network isolation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy all resources in **us-east-1** region (single-stack architecture)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable for testing (deletion_protection=False for all resources)
- No RemovalPolicy.RETAIN on any resources
- RDS instances must have skip_final_snapshot=True for destroyability
- Stack must output database endpoints and the Route53 CNAME
- All named resources (buckets, functions, databases, etc.) MUST include environmentSuffix
- Use backup_retention_period = 7 days as specified (not minimum)

### Constraints

- RDS instances must use db.r6g.large instance class minimum (as specified)
- Lambda failover function must complete within 300 seconds timeout
- All resources must have deletion_protection=False for testing purposes
- Read replica must have automated backups enabled independently of primary
- Parameter groups must disable force_ssl to support legacy applications
- CloudWatch logs must use /aws/rds/ prefix for consistency
- Include proper error handling and logging in Lambda function
- VPCs must be configured with private subnets for RDS instances
- Both primary and replica deployed in same region due to single-stack architecture

## Success Criteria

- **Functionality**: Primary database and read replica deployed, automated failover capability
- **Performance**: RTO under 5 minutes, replication lag monitoring under 60 seconds
- **Reliability**: Multi-AZ for primary, automated promotion working
- **Security**: Encryption at rest, Secrets Manager integration, audit logging enabled
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Destroyability**: All resources can be deleted cleanly without manual intervention
- **Code Quality**: Clean Python code, well-tested, documented, follows CDK best practices
- **Architecture**: Single-stack deployment with both instances in same region

## What to deliver

- Complete AWS CDK Python implementation
- RDS PostgreSQL primary instance with Multi-AZ
- RDS read replica (same region as primary)
- Route53 weighted routing for database endpoints
- Lambda function for automated failover
- CloudWatch monitoring and alarms
- Secrets Manager integration for credentials
- VPC configuration with network isolation
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs for database endpoints and Route53 CNAME
