# Multi-Region Database Disaster Recovery Infrastructure

Hey team,

We need to build a disaster recovery solution for a financial services company that runs critical transaction databases. Their main concern is ensuring business continuity if their primary region goes down. They've set a strict RTO requirement of under 5 minutes, which means we need a hot standby that can be promoted automatically when things go wrong.

The business wants us to set up a PostgreSQL database in us-east-1 as the primary, with a read replica in eu-west-1 that can be promoted to primary if needed. The key requirement here is automated failover - they don't want manual intervention when every second counts during an outage. We also need to meet their audit compliance requirements around logging and data retention.

I've been asked to build this using **AWS CDK with Python** since that's what their infrastructure team is most comfortable with. The solution needs to handle everything from setting up the databases to monitoring replication health and executing failover when necessary.

## What We Need to Build

Create a multi-region disaster recovery system using **AWS CDK with Python** for PostgreSQL databases with automated failover capabilities.

### Core Database Requirements

1. **Primary Database Infrastructure**
   - Deploy RDS PostgreSQL instance in us-east-1 region
   - Enable Multi-AZ deployment for high availability within the region
   - Use db.r6g.large instance class minimum for performance requirements
   - Configure 7-day backup retention for point-in-time recovery
   - Enable encryption at rest using AWS managed keys for data security
   - Store database credentials in AWS Secrets Manager (never hardcoded)

2. **Disaster Recovery Replica**
   - Create cross-region read replica in eu-west-1 region
   - Configure replica to support promotion to standalone primary
   - Enable automated backups independently on the replica (not just inherit from primary)
   - Set 7-day backup retention on replica for independent recovery capability
   - Ensure replica can handle read traffic during normal operations

3. **Database Configuration and Compliance**
   - Create custom parameter groups with log_statement='all' for audit compliance
   - Disable force_ssl in parameter group for legacy application compatibility
   - Configure CloudWatch Logs with /aws/rds/ prefix for all database log groups
   - Use PostgreSQL 15.x engine version

### Automated Failover System

1. **Health Monitoring**
   - Implement Route53 health checks monitoring primary database endpoint availability
   - Health checks must verify actual database connectivity (not just port checks)
   - Configure weighted routing policy: 100% to primary, 0% to secondary initially
   - Create private hosted zone for database endpoint resolution

2. **Failover Automation**
   - Deploy Lambda function to orchestrate failover process
   - Lambda must promote eu-west-1 replica to standalone primary
   - Lambda must update Route53 weighted routing: 0% primary, 100% secondary
   - Function timeout: 300 seconds to handle long-running promotion operation
   - Include proper error handling and logging for troubleshooting

3. **Replication Monitoring**
   - Create CloudWatch alarm for replication lag exceeding 60 seconds
   - Alert on replica connectivity issues
   - Monitor replica disk space and performance metrics

### Networking and Security

1. **Multi-Region Networking**
   - Deploy VPCs in both us-east-1 and eu-west-1 regions
   - Configure private subnets for database instances
   - Set up appropriate security groups with least-privilege access
   - Ensure cross-region connectivity for replication traffic

2. **IAM and Permissions**
   - Lambda execution role with permissions to promote RDS replicas
   - Lambda permissions to update Route53 record weights
   - IAM role for RDS monitoring and CloudWatch Logs
   - Cross-region replication permissions

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **RDS PostgreSQL** for database engine
- Use **Route53** for DNS and health checks
- Use **Lambda** for failover automation
- Use **Secrets Manager** for credential storage
- Use **CloudWatch** for monitoring and alarms
- Resource names must include **environmentSuffix** for unique naming across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy primary database to **us-east-1** region
- Deploy replica database to **eu-west-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, deletion_protection=False)
- No RemovalPolicy.RETAIN or DeletionPolicy: Retain anywhere in code
- RDS instances must have skip_final_snapshot=True for destroyability
- All named resources (databases, security groups, functions) must include environmentSuffix
- Stack must output both regional database endpoints and Route53 CNAME for applications

### Constraints

- RDS instances must use minimum db.r6g.large instance class
- Database passwords stored in Secrets Manager (never in code or outputs)
- Lambda failover function must complete within 300 seconds timeout
- Route53 health checks must verify database connectivity
- All resources must have deletion_protection=False for testing and cleanup
- Read replica must have automated backups enabled independently
- Parameter groups must disable force_ssl for legacy compatibility
- CloudWatch logs must use /aws/rds/ prefix
- All resources must be tagged appropriately for cost tracking

## Success Criteria

- **Functionality**: Complete disaster recovery setup with automated failover capability
- **Performance**: RTO under 5 minutes from failure detection to replica promotion
- **Reliability**: Multi-AZ primary with cross-region replica for maximum availability
- **Security**: Encryption at rest, credentials in Secrets Manager, least-privilege IAM
- **Monitoring**: CloudWatch alarms for replication lag and health check failures
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: Complete stack teardown without manual intervention
- **Compliance**: Audit logging enabled, 7-day retention on all databases
- **Code Quality**: Python CDK code, well-tested, properly documented

## What to Deliver

- Complete AWS CDK Python implementation with TapStack orchestrator
- RDS PostgreSQL primary in us-east-1 with Multi-AZ
- RDS PostgreSQL read replica in eu-west-1
- Route53 private hosted zone with health checks and weighted routing
- Lambda function for automated failover promotion and DNS updates
- CloudWatch alarms for replication lag and health monitoring
- Secrets Manager for database credentials
- Unit tests with 100% coverage
- Integration tests using deployed resources
- Documentation explaining architecture and failover process
