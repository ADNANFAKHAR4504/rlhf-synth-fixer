# Automated Multi-Region Disaster Recovery System

Hey team,

We need to build a comprehensive disaster recovery solution for a financial services company running a critical trading platform. I've been asked to create this using **Pulumi with TypeScript**. The business wants automatic failover capability that can detect regional outages and switch traffic to a secondary region within 5 minutes while maintaining data consistency for transaction records.

The current situation is that the trading platform operates in a single region, which creates significant risk. Any regional AWS outage would mean complete service disruption, potentially causing millions in lost trading volume. The business stakeholders have made it clear that we need a solution that automatically handles failover without manual intervention.

This is an expert-level infrastructure challenge because we're dealing with multi-region coordination, data replication, automated health monitoring, and DNS-based traffic management. Everything needs to work together seamlessly so that when the primary region fails, the secondary region takes over automatically.

## What we need to build

Create a multi-region disaster recovery system using **Pulumi with TypeScript** that automatically detects failures and switches traffic between regions.

### Core Requirements

1. **Global Data Layer**
   - DynamoDB global tables spanning us-east-1 and us-west-2
   - On-demand billing mode for cost optimization
   - Point-in-time recovery enabled for data protection
   - Automatic replication between regions

2. **Cross-Region Storage**
   - S3 buckets in both regions with versioning enabled
   - Cross-region replication with RTC for faster replication
   - Proper IAM roles for replication
   - Bucket policies following least-privilege

3. **Compute Layer**
   - Lambda functions deployed identically in both regions
   - Node.js 18 runtime with 512MB memory allocation
   - Reserved concurrency of exactly 100 units per function
   - Identical code and configuration across regions

4. **DNS and Traffic Management**
   - Route53 hosted zone with failover routing policy
   - Primary and secondary record sets pointing to regional endpoints
   - Health checks monitoring ALB endpoints in primary region
   - 30-second health check intervals for fast detection
   - 60-second TTL for quick DNS propagation

5. **Health Monitoring**
   - Route53 health checks targeting Application Load Balancer endpoints
   - CloudWatch alarms triggering on health check failures
   - Proper alarm thresholds for accurate failure detection

6. **Configuration Management**
   - SSM Parameter Store in both regions
   - SecureString type for sensitive configuration
   - Region-specific endpoint storage
   - Proper IAM permissions for parameter access

7. **Notification System**
   - SNS topics in both regions for failover events
   - Proper subscriptions for alerting
   - Integration with CloudWatch alarms

8. **Network Infrastructure**
   - VPC setup in both regions for ALB deployment
   - Multi-AZ configuration for high availability
   - Application Load Balancers in each region

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **DynamoDB** for global tables with PITR
- Use **S3** with cross-region replication and RTC
- Use **Lambda** with Node.js 18 runtime and reserved concurrency
- Use **Route53** for hosted zone, health checks, and failover routing
- Use **Application Load Balancer** for health check endpoints
- Use **Systems Manager Parameter Store** with SecureString encryption
- Use **CloudWatch** for alarms on health check failures
- Use **SNS** for notification topics in both regions
- Use **IAM** with least-privilege roles and no wildcard permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{service}-{region}-{environment}-{purpose}`
- Primary region: **us-east-1**
- Secondary region: **us-west-2**

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with no Retain policies
- Lambda functions must include aws-sdk explicitly for Node.js 18 runtime
- DynamoDB global tables require careful replica management
- S3 replication requires IAM role creation before bucket policy
- Route53 health checks must be created before record sets
- All resources must include **environmentSuffix** parameter
- IAM roles must follow least-privilege with NO wildcard permissions

### Constraints

- Route53 health checks with 30-second intervals for primary monitoring
- DynamoDB global tables must have point-in-time recovery enabled
- Lambda reserved concurrency must be exactly 100 units
- S3 cross-region replication must use RTC for faster sync
- Resource naming format: `{service}-{region}-{environment}-{purpose}`
- Route53 failover routing policy with 60-second TTL
- Systems Manager Parameter Store for region-specific config
- Identical infrastructure stacks in both regions
- No wildcard permissions in IAM policies
- All resources tagged: Environment=production, DR-Role=primary/secondary
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete multi-region infrastructure with automated failover
- **Performance**: Failover completes within 5 minutes of primary region failure
- **Reliability**: Health checks detect failures within 30 seconds
- **Security**: All IAM roles follow least-privilege, no wildcard permissions
- **Data Consistency**: DynamoDB global tables maintain transaction records
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly destroyed
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- DynamoDB global tables with PITR across regions
- S3 buckets with cross-region replication and RTC
- Lambda functions with reserved concurrency in both regions
- Route53 hosted zone with health checks and failover routing
- Application Load Balancers for health check endpoints
- Systems Manager Parameter Store with SecureString
- CloudWatch alarms for health check failures
- SNS topics in both regions
- IAM roles with least-privilege permissions
- Proper VPC and networking setup
- Unit tests for all components
- Documentation and deployment instructions
