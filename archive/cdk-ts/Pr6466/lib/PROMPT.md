# Multi-Region Disaster Recovery for Payment Processing

We need to build a disaster recovery solution for our payment processing application. The system needs to maintain high availability across two AWS regions with automatic failover capabilities.

## Business Requirements

Our payment processing application handles critical financial transactions and must maintain 99.99% availability. If the primary region goes down, we need to automatically failover to a secondary region within 5 minutes. All data needs to be replicated in real-time between regions.

## Technical Requirements

The solution should use AWS CDK v2 with TypeScript. We're deploying to two regions:
- Primary: us-east-1
- Secondary: us-west-2

### Infrastructure Components

**Database Layer:**
- Aurora PostgreSQL clusters in both regions
- Use Aurora PostgreSQL 15.12
- Instance type: db.t3.medium
- Deploy in private subnets with proper security groups
- Set up CloudWatch alarms for database health monitoring

**Application Layer:**
- Lambda functions for payment processing logic in both regions
- Functions need VPC access to reach the database
- Expose Lambda functions via Function URLs for HTTP access
- Configure CloudWatch log groups with 7-day retention
- Monitor Lambda errors with alarms

**Data Storage:**
- DynamoDB global tables for session state management
- Enable point-in-time recovery
- Use on-demand billing mode
- Replicate to both regions automatically

**Static Assets:**
- S3 buckets in both regions with versioning enabled
- Set up cross-region replication roles (full CRR configuration handled separately)

**Monitoring and Alerts:**
- CloudWatch alarms for:
  - Aurora database connection health
  - Lambda function errors
  - DynamoDB throttling events
- SNS topics in both regions with email subscriptions for alerts

**Backup Strategy:**
- AWS Backup plan with 7-day retention
- Cross-region backup copies to secondary region vault
- Backup Aurora clusters daily

**Networking:**
- VPCs in both regions with private subnets across 3 availability zones
- Security groups for database and Lambda functions
- NAT gateways for outbound internet access

**Tagging:**
- All resources must be tagged with:
  - Environment: Production
  - DR-Tier: Critical
  - ManagedBy: CDK
  - Application: PaymentProcessor

## Implementation Details

Create two separate CDK stacks:
1. `PrimaryStack` for us-east-1 region
2. `SecondaryStack` for us-west-2 region

The entrypoint file (`bin/tap.ts`) should:
- Accept environment suffix from context or environment variables
- Allow region configuration via context or environment variables
- Create both stacks with shared configuration
- Set up cross-stack dependencies (secondary depends on primary)
- Export outputs from primary stack for cross-stack references

Stack outputs needed:
- VPC ID and CIDR block (for cross-stack references)
- Aurora cluster identifier
- Lambda Function URL
- S3 bucket ARN

## Security Considerations

- Use least privilege IAM policies for all resources
- Deploy databases and Lambda functions in private subnets
- Restrict security group rules to only necessary traffic
- Enable encryption at rest for all data stores

## Code Organization

The solution should be split into:
- `bin/tap.ts` - CDK app entrypoint with stack instantiation
- `lib/tap-stack.ts` - Stack implementations with PrimaryStack and SecondaryStack classes

Use clear code comments to organize sections (VPC, Aurora, Lambda, DynamoDB, S3, SNS, CloudWatch, Backup, Outputs).
