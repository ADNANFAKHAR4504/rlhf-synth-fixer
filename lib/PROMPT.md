Hey team,

We need to build a multi-region disaster recovery solution for a financial services company's critical transaction database. They're running PostgreSQL and need automated failover capabilities between us-east-1 and eu-west-1 with an RTO under 5 minutes. The system must maintain a hot standby in the secondary region that can be promoted automatically when the primary region has issues.

The current setup has their transaction database in a single region, which doesn't meet their strict availability requirements. We've been asked to implement this using **AWS CDK with Python** to provision the infrastructure. The business needs this to ensure minimal downtime during regional outages while maintaining data consistency across regions.

This is a production-critical system handling financial transactions, so we need to be careful about data integrity, audit compliance, and automated monitoring. The failover process needs to be reliable and fast.

## What we need to build

Create a multi-region PostgreSQL disaster recovery system using **AWS CDK with Python** that provides automated failover between us-east-1 and eu-west-1.

### Core Requirements

1. **Primary Database Configuration (us-east-1)**
   - RDS PostgreSQL 15.x primary instance with Multi-AZ enabled
   - Instance class: db.r6g.large minimum
   - Backup retention: 7 days
   - Encryption at rest using AWS managed keys
   - Private subnet deployment

2. **Read Replica Configuration (eu-west-1)**
   - RDS read replica in eu-west-1 configured for promotion to primary
   - Must have automated backups enabled independently
   - Same encryption and instance class as primary
   - Ready for promotion without data loss

3. **Automated Failover Mechanism**
   - Lambda function to handle failover automation
   - Promotes replica to standalone instance
   - Updates Route53 routing weights automatically
   - Must complete execution within 300 seconds

4. **Health Monitoring and Routing**
   - Route53 health checks monitoring primary database endpoint availability
   - Must use HTTPS protocol on port 5432
   - Weighted routing policy: 100% primary, 0% secondary initially
   - Private hosted zone configuration

5. **Replication Monitoring**
   - CloudWatch alarms for replication lag exceeding 60 seconds
   - CloudWatch logs with /aws/rds/ prefix for all log groups
   - Comprehensive monitoring for failover triggers

6. **Security and Compliance**
   - Database passwords stored in AWS Secrets Manager
   - Parameter groups configured with log_statement='all' for audit compliance
   - Parameter groups must disable force_ssl for legacy application compatibility
   - VPC configuration with private subnets in both regions
   - VPC peering connection between regions established

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **RDS PostgreSQL** for database instances
- Use **Route53** for DNS and health checks
- Use **Lambda** for automated failover logic
- Use **CloudWatch** for monitoring and alarms
- Use **Secrets Manager** for credential management
- Use **VPC** for network isolation in both regions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy primary to **us-east-1** region and replica to **eu-west-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable for testing (deletion_protection=False for all resources)
- No RemovalPolicy.RETAIN on any resources
- RDS instances must have skip_final_snapshot=True for destroyability
- Stack must output both regional endpoints and the Route53 CNAME
- All named resources (buckets, functions, databases, etc.) MUST include environmentSuffix
- Use backup_retention_period = 7 days as specified (not minimum)

### Constraints

- RDS instances must use db.r6g.large instance class minimum (as specified)
- Lambda failover function must complete within 300 seconds timeout
- Route53 health checks must use HTTPS protocol on port 5432
- All resources must have deletion_protection=False for testing purposes
- Read replica must have automated backups enabled independently of primary
- Parameter groups must disable force_ssl to support legacy applications
- CloudWatch logs must use /aws/rds/ prefix for consistency
- Include proper error handling and logging in Lambda function
- VPCs must be configured with private subnets for RDS instances

## Success Criteria

- **Functionality**: Primary database in us-east-1, read replica in eu-west-1, automated failover capability
- **Performance**: RTO under 5 minutes, replication lag monitoring under 60 seconds
- **Reliability**: Multi-AZ for primary, health checks functional, automated promotion working
- **Security**: Encryption at rest, Secrets Manager integration, audit logging enabled
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Destroyability**: All resources can be deleted cleanly without manual intervention
- **Code Quality**: Clean Python code, well-tested, documented, follows CDK best practices

## What to deliver

- Complete AWS CDK Python implementation
- RDS PostgreSQL primary instance with Multi-AZ
- RDS read replica in secondary region
- Route53 health checks and weighted routing
- Lambda function for automated failover
- CloudWatch monitoring and alarms
- Secrets Manager integration for credentials
- VPC configuration in both regions
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs for both regional endpoints and Route53 CNAME
