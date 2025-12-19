# Automated Disaster Recovery for PostgreSQL Database

Hey team,

We've got a critical requirement from one of our financial services clients. They need an automated disaster recovery solution for their PostgreSQL database that can handle regional failures without manual intervention. The business is really concerned about downtime - they're operating in a highly regulated space where every minute of outage could mean significant financial and compliance issues.

The current setup has a single RDS instance, and they've had a couple of close calls where AWS service degradations in their region caused them serious anxiety. The CTO wants a solution that can automatically detect failures and failover to a healthy instance within 15 minutes, with minimal data loss. They're particularly worried about meeting their RTO and RPO commitments to regulators.

I've been asked to build this using **Pulumi with TypeScript** since that's what our infrastructure team has standardized on. The architecture needs to be robust but also cost-effective - they don't want to pay for a full active-active setup, but they need confidence that disaster recovery actually works when needed.

## What we need to build

Create an automated disaster recovery system using **Pulumi with TypeScript** for a mission-critical PostgreSQL database with health monitoring, automated failover, and cross-region backup capabilities.

### Core Requirements

1. **Primary Database Infrastructure**
   - Deploy RDS PostgreSQL instance in ap-southeast-2 with automated backups enabled
   - Enable encryption at rest using AWS KMS keys
   - Configure in private subnets with appropriate security groups
   - Use db.t3.medium instance size for cost efficiency

2. **Disaster Recovery Setup**
   - Create read replica in ap-southeast-2 for DR purposes
   - Ensure maximum replication lag stays under 60 seconds
   - Configure automated snapshot copying between regions with 7-day retention
   - Set up S3 buckets in both regions for backup snapshots with versioning enabled

3. **Health Monitoring and Alerting**
   - Create Route 53 health checks to monitor primary database endpoint
   - Set up CloudWatch alarms for replication lag and database performance metrics
   - Configure SNS topics for alerting on database failures and recovery events
   - Monitor key metrics: CPU, connections, replication lag, storage

4. **Automated Failover**
   - Implement Lambda functions to monitor database health continuously
   - Create Lambda-based failover mechanism that promotes read replica when health checks fail
   - Ensure failover completes within 5 minutes from detection
   - Include proper error handling and rollback capabilities

5. **Cross-Region Backup Strategy**
   - Configure S3 buckets with cross-region replication for backup redundancy
   - Enable versioning on all backup buckets
   - Implement lifecycle policies for cost optimization
   - Ensure backups are encrypted

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **RDS PostgreSQL** for database (version 14.x)
- Use **S3** for backup storage with cross-region replication
- Use **Lambda** for health monitoring and failover automation
- Use **SNS** for alerting and notifications
- Use **Route 53** for health checks and DNS management
- Use **CloudWatch** for metrics and alarms
- Use **IAM** for least-privilege access policies
- Use **KMS** for encryption key management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy stack to **ap-southeast-1** region
- Deploy database resources to **ap-southeast-2** region

### Constraints

- RDS instances must be encrypted at rest using AWS KMS keys
- Read replica must have maximum replication lag of 60 seconds
- Lambda functions must complete failover within 5 minutes
- S3 buckets must use cross-region replication for backup redundancy
- All resources must be tagged with Environment, Owner, and DR-Role tags
- VPC setup with private subnets for RDS instances
- Security groups must allow replication traffic between regions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging in Lambda functions
- Follow principle of least privilege for IAM roles

## Success Criteria

- **Functionality**: Complete disaster recovery system that automatically detects and recovers from failures
- **Performance**: Failover completes within 15 minutes, replication lag under 60 seconds
- **Reliability**: Health checks accurately detect failures, automated failover works consistently
- **Security**: All data encrypted at rest and in transit, least-privilege IAM policies
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Monitoring**: CloudWatch alarms and SNS notifications for all critical events
- **Backup**: Automated cross-region snapshot copying with 7-day retention
- **Code Quality**: TypeScript implementation with proper types, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- RDS PostgreSQL primary instance with automated backups
- RDS read replica for disaster recovery
- S3 buckets with cross-region replication and versioning
- Lambda functions for health monitoring and failover automation
- IAM roles and policies for Lambda RDS operations
- Route 53 health checks for database endpoint monitoring
- CloudWatch alarms for replication lag and performance metrics
- SNS topics for failure and recovery alerting
- Proper tagging strategy (Environment, Owner, DR-Role)
- Lambda function code in lib/lambda/ directory
- Documentation of failover process and recovery procedures
