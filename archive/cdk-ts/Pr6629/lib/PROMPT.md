# High Availability PostgreSQL Database Infrastructure

Hey team,

We have a requirement from a financial services client who processes payment transactions through a PostgreSQL database. They need a robust high availability solution within a single AWS region (us-east-1) that can withstand availability zone failures while maintaining strict uptime requirements.

The current setup needs to be deployed in us-east-1 with Multi-AZ capabilities to ensure high availability. Given the critical nature of payment processing, any prolonged outage would result in significant financial losses and regulatory compliance issues.

We've been asked to build this solution using **AWS CDK with TypeScript** to leverage infrastructure as code best practices and enable repeatable deployments. The architecture needs to handle automated monitoring and alerting to ensure operational visibility.

## What we need to build

Create a high availability database infrastructure using **AWS CDK with TypeScript** deployed in **us-east-1** only.

### Core Requirements

1. **Database Infrastructure**
   - Deploy RDS PostgreSQL 14 instance with Multi-AZ configuration in us-east-1
   - Use db.r6g.xlarge instance class for production workloads
   - Enable encryption at rest using customer-managed KMS key
   - Database instance must be destroyable (no deletion protection, skip final snapshots)

2. **Backup Strategy**
   - Enable automated backups with point-in-time recovery
   - Create S3 bucket with versioning enabled for backup storage
   - S3 bucket must use RemovalPolicy DESTROY (no Retain policies)

3. **Monitoring and Alerting**
   - Configure CloudWatch alarms for database CPU utilization and connections
   - Create SNS topic for alert notifications
   - Monitor database performance metrics

4. **Networking and Connectivity**
   - Create VPC in us-east-1 with private and public subnets
   - Deploy database instance in private subnets only
   - Deploy NAT gateway for outbound connectivity
   - Create VPC endpoints for AWS services (RDS, SNS, CloudWatch Logs, EventBridge)
   - Enable encryption in transit for all database connections

5. **Security and Access Control**
   - Implement IAM roles with least-privilege access
   - Create KMS key for data encryption
   - Enable encryption in transit for all database connections
   - Configure security groups to restrict access to only necessary ports and sources

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CDK 2.x with Node.js 18 or later
- Deploy to **us-east-1** region only
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be destroyable: RemovalPolicy.DESTROY, deletionProtection: false, skipFinalSnapshot: true
- Include proper error handling and CloudWatch logging

### Deployment Requirements (CRITICAL)

**Single-Stack Architecture:**
- TapStack: Creates all resources in us-east-1 including VPC, RDS, S3, KMS, monitoring

**Resource Naming:**
- All resources must include environmentSuffix for uniqueness
- environmentSuffix must be a stack property passed to the stack
- Format: `{resource-type}-{environmentSuffix}`

**Destroyability:**
- All resources must be fully destroyable without manual intervention
- RDS: deletionProtection: false, skipFinalSnapshot: true
- S3: RemovalPolicy.DESTROY, autoDeleteObjects: true
- KMS: RemovalPolicy.DESTROY, enableKeyRotation: false for testing
- No resources should have Retain policies

### Constraints

- Multi-AZ RDS deployment for high availability within us-east-1
- No public database endpoints allowed
- All traffic must be encrypted in transit
- Follow AWS Well-Architected Framework security best practices

## Success Criteria

- **Functionality**: Complete single-region deployment with high availability
- **Monitoring**: CloudWatch alarms for database CPU and connections
- **Alerting**: SNS notifications for alarm triggers
- **High Availability**: Multi-AZ RDS deployment for failover within us-east-1
- **Security**: All data encrypted at rest and in transit, least-privilege IAM
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: TypeScript with proper types, well-structured, documented

## What to deliver

- Complete AWS CDK TypeScript implementation with single stack (TapStack)
- VPC with public and private subnets in us-east-1
- Multi-AZ RDS PostgreSQL 14 instance
- S3 bucket for backups
- KMS key for encryption
- CloudWatch alarms and SNS topic for monitoring
- Updated bin/tap.ts to instantiate the stack
- Comprehensive documentation in README.md with deployment instructions
- All code must be production-ready with proper error handling
