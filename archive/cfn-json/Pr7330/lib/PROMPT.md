# Multi-Region Disaster Recovery Infrastructure

## Platform & Language
**MANDATORY CONSTRAINT**: Use **CloudFormation with JSON** format exclusively.

## Business Context
A financial services company needs to implement a disaster recovery solution for their critical transaction processing system. The primary region experienced a 6-hour outage last quarter, resulting in significant revenue loss. They require an active-passive multi-region setup with automated failover capabilities.

## Infrastructure Requirements

### Multi-Region Architecture
Multi-region disaster recovery infrastructure spanning **us-east-1 (primary)** and **us-west-2 (secondary)**. Utilizes DynamoDB Global Tables for transaction data, S3 with cross-region replication for document storage, Lambda functions for transaction processing, and Route 53 for DNS failover. Requires AWS CLI 2.x configured with appropriate IAM permissions for multi-region deployments. VPCs in both regions with private subnets and VPC peering connection. KMS keys in each region for encryption. CloudWatch cross-region monitoring with centralized dashboard. Total infrastructure supports 10,000 TPS with sub-second latency requirements.

## MANDATORY REQUIREMENTS (Must Complete All)

### 1. DynamoDB Global Tables (CORE: DynamoDB)
- Configure DynamoDB Global Tables with on-demand billing mode
- Enable point-in-time recovery
- Tables must be replicated between us-east-1 and us-west-2
- Table name MUST include environmentSuffix: `transactions-table-${environmentSuffix}`

### 2. S3 Cross-Region Replication (CORE: S3)
- Set up S3 buckets in both regions
- Enable cross-region replication from us-east-1 to us-west-2
- Enable versioning on both buckets
- Enable S3 Transfer Acceleration for cross-region replication
- Bucket names MUST include environmentSuffix: `documents-${environmentSuffix}`
- Enable SSE-S3 encryption on all buckets

### 3. Route 53 Failover Routing (CORE: Route 53)
- Implement Route 53 hosted zone with failover routing policy
- Configure health checks to monitor both regions continuously
- Primary endpoint in us-east-1, secondary in us-west-2
- Health check interval: 30 seconds
- Health check failure threshold: 3

### 4. Lambda Functions (CORE: Lambda)
- Create Lambda functions in both regions for transaction processing
- Configure environment variables for region-specific configuration
- Use reserved concurrency of at least 100
- Runtime: Node.js 18.x or Python 3.11
- Functions MUST include environmentSuffix in names: `transaction-processor-${environmentSuffix}`
- Grant necessary IAM permissions for DynamoDB, S3, and KMS access

### 5. KMS Encryption (CORE: KMS)
- Configure KMS keys in each region
- Create key alias: `alias/transaction-encryption-${environmentSuffix}`
- Enable automatic key rotation
- Grant Lambda functions permission to use keys for encryption/decryption
- All data at rest must be encrypted using these CMKs

### 6. CloudWatch Alarms (CORE: CloudWatch)
- Set up CloudWatch alarms for:
  - DynamoDB throttling (ReadThrottleEvents, WriteThrottleEvents)
  - S3 replication lag (ReplicationLatency)
  - Lambda errors (Errors, Throttles)
- Alarms MUST trigger notifications for any failover events
- Configure cross-region log group subscriptions

### 7. SNS Topics (CORE: SNS)
- Create SNS topics in both regions for operational alerts
- Topic names MUST include environmentSuffix: `dr-alerts-${environmentSuffix}`
- Subscribe CloudWatch alarms to these topics

### 8. IAM Cross-Region Roles (CORE: IAM)
- Implement IAM roles with cross-region assume role permissions
- Least privilege access for Lambda functions
- Separate roles for:
  - Lambda execution
  - S3 replication
  - DynamoDB Global Table management

### 9. CloudWatch Logs Cross-Region (CORE: CloudWatch Logs)
- Configure CloudWatch Logs with cross-region log group subscriptions
- Log retention: 7 days
- Log groups MUST include environmentSuffix

### 10. Stack Outputs
- Primary region endpoints (DynamoDB table name, S3 bucket, Lambda ARN, Route 53 zone ID)
- Secondary region endpoints (DynamoDB table name, S3 bucket, Lambda ARN)
- KMS key IDs for both regions
- SNS topic ARNs for both regions
- VPC IDs and subnet IDs for both regions

## OPTIONAL ENHANCEMENTS (If Time Permits)

### AWS Backup (OPTIONAL)
- Add AWS Backup for automated cross-region backups
- Provides additional data protection layer
- Backup plan with daily snapshots, 7-day retention

### EventBridge Rules (OPTIONAL)
- Implement EventBridge rules for automated failover triggers
- Enables event-driven DR automation
- Monitor health check failures and trigger automated failover

### Systems Manager Parameter Store (OPTIONAL)
- Add SSM Parameter Store for configuration management
- Centralizes multi-region configuration
- Store region-specific parameters

## Technical Constraints

### Template Format
- **JSON format exclusively** for the CloudFormation template
- Use nested stacks or StackSets for multi-region deployment coordination

### Regions
- **Primary region**: us-east-1
- **Failover region**: us-west-2

### Performance Requirements
- RTO (Recovery Time Objective): under 15 minutes
- RPO (Recovery Point Objective): under 5 minutes
- Support 10,000 TPS (transactions per second)
- Sub-second latency requirements

### Security Requirements
- All data must be encrypted at rest using CMKs
- All data in transit must use TLS 1.2+
- IAM least privilege access
- No public access to S3 buckets

### Destroyability Requirements (CRITICAL)
**IMPORTANT**: Despite the original task requirement, DO NOT set DeletionPolicy to Retain. All resources MUST be destroyable for cleanup purposes. This is a synthetic task requirement that overrides production-like settings.

- **No DeletionPolicy: Retain** on any resources
- **No DeletionProtection: true** on RDS/DynamoDB
- S3 buckets must be empty-able and deletable
- All resources must be fully destroyable via stack deletion

### Naming Convention
- **ALL resource names MUST include environmentSuffix parameter**
- Pattern: `resource-name-${environmentSuffix}` or `ResourceName${EnvironmentSuffix}`
- This enables parallel deployments without naming conflicts

### VPC Architecture
- VPCs in both regions with private subnets
- VPC CIDR blocks must not overlap:
  - us-east-1: 10.0.0.0/16
  - us-west-2: 10.1.0.0/16
- VPC peering connection between regions
- Security groups allowing cross-region traffic

### Lambda Configuration
- Reserved concurrency: at least 100
- Timeout: 60 seconds
- Memory: 512 MB minimum
- Environment variables for region awareness

## Expected Output

A single CloudFormation JSON template that:
1. Deploys all resources in both regions with proper cross-region references
2. Implements automated health monitoring
3. Provides failover capabilities
4. Uses nested stacks or StackSets for multi-region coordination
5. Includes all required stack outputs
6. Follows AWS best practices for disaster recovery
7. All resource names include environmentSuffix for uniqueness

## Validation Requirements

Before considering this task complete:
1. Template must synthesize without errors
2. All mandatory AWS services must be present
3. environmentSuffix must be used in all resource names
4. No DeletionPolicy: Retain or deletion protection settings
5. Cross-region replication must be properly configured
6. Health checks must monitor both regions
7. IAM roles must have least privilege permissions
8. All data must be encrypted using KMS CMKs

## Notes

- This is an **expert-level multi-region task** with high complexity
- Code generation may produce deployment blockers (see lessons_learnt.md Section 0.2)
- Focus on correctness over completeness if time is limited
- Multi-region CloudFormation requires careful handling of cross-stack references
- Consider using CloudFormation StackSets for true multi-region deployment
