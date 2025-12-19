# Multi-Region Disaster Recovery for Payment Processing

Hey team,

We need to build a multi-region disaster recovery solution for our payment processing system. After that regional outage that cost us significant revenue, the business is demanding 99.99% uptime with automatic failover. I've been asked to create this using CDKTF with Python. The key requirement is that we need to automatically failover within 60 seconds while preserving all transaction data.

The architecture needs to span us-east-1 (primary) and us-west-2 (secondary). We're talking full replication - database, session state, compute, everything. The business is particularly nervous about data loss, so we need zero RPO for critical payment data.

I need to make sure this is production-ready from day one. That means proper encryption, automated credential rotation, health checks, monitoring, and automated backup verification. We can't have any manual intervention required during a failover event.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CDKTF with Python** for a payment processing system.

### Core Requirements

1. **Route 53 DNS Failover**
   - Primary and secondary record sets with health checks
   - Failover must trigger within 60 seconds of primary region failure
   - Health checks need to monitor actual application endpoints

2. **Aurora Global Database**
   - PostgreSQL 15.x in both us-east-1 (primary) and us-west-2 (secondary)
   - Encrypted storage enabled
   - Configure as global database for cross-region replication
   - Zero RPO requirement for payment data

3. **DynamoDB Global Tables**
   - Session state management across both regions
   - Eventual consistency acceptable for session data
   - Automatic replication between regions

4. **Lambda Functions**
   - Payment processing functions in both regions
   - Must use ARM Graviton2 processors for cost optimization
   - Identical deployments across regions

5. **VPC Networking**
   - VPC peering connection between us-east-1 and us-west-2
   - Private subnets in 3 availability zones per region
   - All inter-region data transfer through VPC peering or PrivateLink

6. **Secrets Manager**
   - Store all database credentials
   - Automatic rotation every 30 days
   - Replicate secrets to secondary region

7. **CloudWatch Monitoring**
   - Alarms that trigger on failover events
   - Cross-region dashboard for visibility
   - SNS notifications for critical alerts

8. **Automated Backup Verification**
   - Lambda function that runs daily
   - Tests restore capability automatically
   - Reports failures via CloudWatch/SNS

### Optional Enhancements (If Time Permits)

- **API Gateway**: Custom domains in both regions for unified endpoint management
- **Step Functions**: Orchestrate complex failover workflows
- **AWS Backup**: Additional protection with cross-region copies

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Primary region: **us-east-1**
- Secondary region: **us-west-2**
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be destroyable (no Retain policies, no deletion protection)
- RDS: Must use PostgreSQL 15.x engine version
- Lambda: Must use arm64 architecture (Graviton2)
- Encryption: Enabled for all data at rest

### Constraints

- Route 53 health checks must complete within 60 seconds to meet RTO
- Aurora Global Database requires proper primary-secondary configuration
- DynamoDB global tables maintain eventual consistency
- All secrets must rotate every 30 days
- VPC peering must be properly configured for cross-region communication
- Lambda functions need appropriate IAM roles for cross-region operations
- CloudWatch alarms must notify on any failover events
- Backup verification must run daily via scheduled Lambda

### Deployment Requirements (CRITICAL)

**environmentSuffix Requirement**:
- ALL named resources must include environmentSuffix parameter
- Pattern: `f"{resource_name}-{environment_suffix}"`
- This is MANDATORY to prevent resource conflicts in CI/CD

**Destroyability Requirement**:
- NO RemovalPolicy.RETAIN allowed
- NO deletion_protection=True allowed
- All resources must be fully destroyable
- RDS: Set `skip_final_snapshot=True`
- S3: Use `force_destroy=True` (if needed)

**Service-Specific Requirements**:
- Lambda Node.js 18+: Use AWS SDK v3 or extract data from event object
- Aurora Global Database: Requires explicit primary/secondary cluster configuration
- DynamoDB Global Tables: Use proper replica configuration
- VPC Peering: Requires proper route table configuration in both VPCs

## Success Criteria

- **Functionality**: Automatic failover within 60 seconds from us-east-1 to us-west-2
- **Data Integrity**: Zero RPO for payment data (Aurora Global Database)
- **Reliability**: 99.99% uptime through multi-region active-passive architecture
- **Security**: Encryption at rest, automated secret rotation, least privilege IAM
- **Resource Naming**: All resources include environmentSuffix parameter
- **Monitoring**: CloudWatch alarms notify on failover events
- **Code Quality**: CDKTF Python, well-structured, documented, deployable

## What to deliver

- Complete CDKTF Python implementation with all stacks
- Route 53 health checks and DNS failover configuration
- Aurora Global Database (PostgreSQL 15.x) spanning both regions
- DynamoDB global tables for session management
- Lambda functions with Graviton2 processors
- VPC peering with proper networking setup
- Secrets Manager with automatic rotation
- CloudWatch monitoring and alerting
- Automated backup verification Lambda
- Unit tests for all infrastructure components
- Deployment instructions and architecture documentation
