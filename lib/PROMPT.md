# Multi-Region Disaster Recovery Architecture for PostgreSQL Database

Hey team,

We have a critical requirement from a financial services client who processes payment transactions through a PostgreSQL database. They need a robust disaster recovery solution that can withstand regional failures while maintaining strict recovery time and recovery point objectives. The business has specified an RPO of under 1 hour and an RTO of under 4 hours, which means we need automated failover capabilities and continuous data replication between their primary region in us-east-1 and their DR region in us-east-2.

The current setup has no disaster recovery capability, and given the critical nature of payment processing, any prolonged outage would result in significant financial losses and regulatory compliance issues. The client has experienced AWS regional issues in the past and wants to ensure business continuity even if an entire AWS region becomes unavailable.

We've been asked to build this solution using **AWS CDK with TypeScript** to leverage infrastructure as code best practices and enable repeatable deployments. The architecture needs to handle automated monitoring, alerting, and failover orchestration to minimize manual intervention during disaster scenarios.

## What we need to build

Create a comprehensive multi-region disaster recovery system using **AWS CDK with TypeScript** that provides automated failover capabilities for a PostgreSQL database between us-east-1 (primary) and us-east-2 (disaster recovery).

### Core Requirements

1. **Database Infrastructure**
   - Deploy RDS PostgreSQL 14 instances with Multi-AZ configuration in both regions
   - Use db.r6g.xlarge instance class for production workloads
   - Configure cross-region read replicas from us-east-1 to us-east-2
   - Enable encryption at rest using customer-managed KMS keys in each region
   - All database instances must be destroyable (no deletion protection, skip final snapshots)

2. **Backup and Replication Strategy**
   - Enable automated backups with point-in-time recovery in both regions
   - Create S3 buckets with versioning enabled for backup storage
   - Configure cross-region S3 replication from us-east-1 to us-east-2
   - S3 replication must complete within 15 minutes for objects under 5GB
   - Enable S3 replication metrics and event notifications
   - All S3 buckets must use RemovalPolicy DESTROY (no Retain policies)

3. **High Availability Monitoring**
   - Deploy Lambda functions to continuously monitor RDS replication lag
   - Implement Route53 health checks that verify database connectivity and replication status
   - Configure Route53 failover routing policies for automatic DNS failover
   - Create SNS topics for alert notifications
   - Trigger alerts when replication lag exceeds 300 seconds (5 minutes)
   - Lambda functions must use AWS SDK v3 (not v2) for Node.js 18+ compatibility

4. **Automated Failover Orchestration**
   - Use EventBridge rules to coordinate automated failover procedures
   - Configure CloudWatch alarms for database availability, replication lag, and health check failures
   - Implement composite alarms that consider multiple failure scenarios before triggering failover
   - Create Lambda function to execute failover procedures when triggered by EventBridge
   - Failover Lambda must use AWS SDK v3

5. **Networking and Connectivity**
   - Create VPCs in both us-east-1 and us-east-2 with private subnets
   - Deploy database instances in private subnets only
   - Establish VPC peering between regions for cross-region communication
   - Deploy NAT gateways for Lambda functions to access AWS services
   - Place Lambda functions in private subnets with VPC endpoints for AWS service access
   - All inter-region traffic must use AWS PrivateLink or VPC peering
   - Enable encryption in transit for all data movement

6. **Security and Access Control**
   - Implement IAM roles with least-privilege access for disaster recovery operations
   - Create separate KMS keys in each region for regional data encryption
   - Enable encryption in transit for all database connections
   - Configure security groups to restrict access to only necessary ports and sources
   - Lambda execution roles must have minimum required permissions

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CDK 2.x with Node.js 18 or later
- Deploy to **us-east-1** (primary) and **us-east-2** (DR) regions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be destroyable: RemovalPolicy.DESTROY, deletionProtection: false, skipFinalSnapshot: true
- Lambda runtime: Node.js 18.x or later with AWS SDK v3
- Use cross-stack references to share resources between stacks (no hardcoded ARNs)
- Include proper error handling and CloudWatch logging for all Lambda functions

### Deployment Requirements (CRITICAL)

**S3 Replication Configuration:**
- S3 replication MUST be configured in the PRIMARY stack (source bucket's stack)
- DR stack should ONLY create the destination bucket
- Primary stack receives the DR bucket ARN via cross-stack reference
- Primary stack configures replication role and replication configuration

**Multi-Stack Architecture:**
- DRRegionStack: Creates DR region resources including destination S3 bucket (no replication config)
- PrimaryRegionStack: Creates primary resources AND configures S3 replication using DR bucket ARN
- Route53FailoverStack: Creates Route53 health checks and failover routing policies
- Stacks must be instantiated in correct order with proper dependencies

**Resource Naming:**
- All resources must include environmentSuffix for uniqueness
- environmentSuffix must be a stack property passed to all stacks
- Format: `{service}-{purpose}-{environmentSuffix}`

**Destroyability:**
- All resources must be fully destroyable without manual intervention
- RDS: deletionProtection: false, skipFinalSnapshot: true
- S3: RemovalPolicy.DESTROY, autoDeleteObjects: true
- KMS: RemovalPolicy.DESTROY, enableKeyRotation: false for testing
- No resources should have Retain policies

### Constraints

- RPO requirement: Under 1 hour (achieved through continuous replication)
- RTO requirement: Under 4 hours (achieved through automated failover)
- Replication lag threshold: Alert at 300 seconds (5 minutes)
- S3 replication SLA: 15 minutes for objects under 5GB
- All Lambda functions must use private subnets with VPC endpoints
- No public database endpoints allowed
- All inter-region traffic must be encrypted in transit
- Follow AWS Well-Architected Framework security best practices

## Success Criteria

- **Functionality**: Complete multi-region deployment with automated failover capability
- **Monitoring**: Real-time visibility into replication status and health checks
- **Alerting**: SNS notifications for replication lag and health check failures
- **Failover**: Automated failover triggered by composite alarms
- **Recovery**: Meet RPO under 1 hour and RTO under 4 hours requirements
- **Security**: All data encrypted at rest and in transit, least-privilege IAM
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: TypeScript with proper types, well-structured, documented

## What to deliver

- Complete AWS CDK TypeScript implementation with three stacks
- DRRegionStack for DR region resources (us-east-2)
- PrimaryRegionStack for primary region resources with S3 replication config (us-east-1)
- Route53FailoverStack for health checks and DNS failover
- Lambda function code for replication lag monitoring (AWS SDK v3)
- Lambda function code for failover orchestration (AWS SDK v3)
- Updated bin/tap.ts to instantiate stacks with cross-stack references
- Comprehensive documentation in README.md with deployment instructions
- All code must be production-ready with proper error handling
