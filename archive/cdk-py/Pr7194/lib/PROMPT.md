# PostgreSQL Database Infrastructure

Hey team,

We need to build a robust database solution for a financial services company that runs critical transaction databases. They require a highly available PostgreSQL database with comprehensive monitoring and audit logging to meet their compliance requirements.

The business wants us to set up a PostgreSQL database in us-east-1 with Multi-AZ deployment for high availability within the region. They need to meet their audit compliance requirements around logging and data retention, and want proper monitoring in place to track database health and performance.

I've been asked to build this using **AWS CDK with Python** since that's what their infrastructure team is most comfortable with. The solution needs to handle everything from setting up the database to monitoring its health and performance.

## What We Need to Build

Create a single-region database infrastructure using **AWS CDK with Python** for PostgreSQL databases with comprehensive monitoring.

### Core Database Requirements

1. **Database Infrastructure**
   - Deploy RDS PostgreSQL instance in us-east-1 region
   - Enable Multi-AZ deployment for high availability within the region
   - Use db.r6g.large instance class minimum for performance requirements
   - Configure 7-day backup retention for point-in-time recovery
   - Enable encryption at rest using AWS managed keys for data security
   - Store database credentials in AWS Secrets Manager (never hardcoded)

2. **Database Configuration and Compliance**
   - Create custom parameter groups with log_statement='all' for audit compliance
   - Disable force_ssl in parameter group for legacy application compatibility
   - Configure CloudWatch Logs with /aws/rds/ prefix for all database log groups
   - Use PostgreSQL 15.x engine version

### Monitoring System

1. **Performance Monitoring**
   - Create CloudWatch alarms for CPU utilization (threshold: 80%)
   - Monitor free storage space (alert when below 10 GB)
   - Configure SNS topic for alarm notifications
   - Export PostgreSQL logs to CloudWatch for analysis

2. **Metrics Collection**
   - Monitor database connections
   - Track storage utilization
   - CPU and memory metrics
   - Database performance insights

### Networking and Security

1. **Networking**
   - Deploy VPC in us-east-1 region
   - Configure private subnets for database instances
   - Set up appropriate security groups with least-privilege access
   - NAT gateway for outbound connectivity

2. **IAM and Permissions**
   - IAM role for RDS monitoring and CloudWatch Logs
   - Least-privilege security group rules
   - Encrypted storage with AWS managed keys

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **RDS PostgreSQL** for database engine
- Use **Secrets Manager** for credential storage
- Use **CloudWatch** for monitoring and alarms
- Resource names must include **environmentSuffix** for unique naming across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy database to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, deletion_protection=False)
- No RemovalPolicy.RETAIN or DeletionPolicy: Retain anywhere in code
- RDS instances must have skip_final_snapshot=True for destroyability
- All named resources (databases, security groups, functions) must include environmentSuffix
- Stack must output database endpoint for application connection

### Constraints

- RDS instances must use minimum db.r6g.large instance class
- Database passwords stored in Secrets Manager (never in code or outputs)
- All resources must have deletion_protection=False for testing and cleanup
- Parameter groups must disable force_ssl for legacy compatibility
- CloudWatch logs must use /aws/rds/ prefix
- All resources must be tagged appropriately for cost tracking

## Success Criteria

- **Functionality**: Complete database setup with comprehensive monitoring
- **Reliability**: Multi-AZ deployment for high availability within region
- **Security**: Encryption at rest, credentials in Secrets Manager, least-privilege IAM
- **Monitoring**: CloudWatch alarms for CPU, storage, and performance metrics
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: Complete stack teardown without manual intervention
- **Compliance**: Audit logging enabled, 7-day retention on database
- **Code Quality**: Python CDK code, well-tested, properly documented

## What to Deliver

- Complete AWS CDK Python implementation with TapStack orchestrator
- RDS PostgreSQL in us-east-1 with Multi-AZ
- CloudWatch alarms for performance and storage monitoring
- Secrets Manager for database credentials
- Unit tests with 100% coverage
- Integration tests using deployed resources
- Documentation explaining architecture and monitoring setup
