Hey team,

We recently had a rough incident where one of our primary AWS regions went down for about 4 hours, taking our transaction processing system offline. The business is understandably concerned and wants us to implement a comprehensive disaster recovery solution. This is a financial services workload, so we need to ensure data consistency and maintain compliance even during regional failures.

I've been tasked to build out a multi-region disaster recovery architecture using **CDKTF with TypeScript**. The requirements came from senior leadership after the outage, and they want us to achieve failover within 15 minutes with a recovery point objective under 5 minutes. Pretty ambitious, but doable.

The architecture needs to span us-east-1 as our primary region and us-east-2 as our secondary region. We'll need to set up automated failover mechanisms so the system can recover with minimal manual intervention. The business wants to avoid another 4-hour outage at all costs.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CDKTF with TypeScript** for a financial services transaction processing system spanning us-east-1 (primary) and us-east-2 (secondary) regions.

### Core Requirements

1. **Multi-Region Data Replication**
   - DynamoDB global tables with point-in-time recovery for transaction data
   - Aurora Global Database with writer cluster in us-east-1 and reader cluster in us-east-2
   - S3 buckets with cross-region replication and RTC for objects under 128MB
   - Systems Manager Parameter Store with cross-region replication for configuration

2. **Automated Failover Mechanisms**
   - Route 53 health checks monitoring both regions
   - Failover routing policies to automatically redirect traffic
   - EventBridge global endpoints routing events to active region
   - Lambda functions deployed identically in both regions

3. **Workflow Consistency**
   - Step Functions state machines in both regions for order processing
   - Ensure consistent state machine definitions across regions
   - Handle cross-region workflow orchestration

4. **Cross-Region Backup and Recovery**
   - AWS Backup plans for daily EBS snapshots
   - Automated cross-region backup copy to secondary region
   - Ensure backups are accessible during regional failures

5. **Monitoring and Observability**
   - CloudWatch dashboards showing metrics from both regions
   - Cross-region visibility in single pane of glass
   - Health check alarms and notifications

### Technical Requirements

All infrastructure must be defined using **CDKTF with TypeScript**. Here are the specific technical details:

- **Route 53 Health Checks**: Configure health checks with failover routing policies for automatic DNS failover between regions
- **Aurora Global Database**: One primary cluster in us-east-1 (writer), one secondary cluster in us-east-2 (reader), using db.r5.large instances
- **EventBridge Global Endpoints**: Route events to the active region automatically during failover
- **CloudWatch Cross-Region Dashboards**: Monitor both regions from a single dashboard for unified observability
- **Systems Manager Parameter Store**: Cross-region replication for configuration data used by applications
- **S3 Bucket Replication**: Enable RTC (Replication Time Control) for objects under 128 MB to meet RPO requirements
- **DynamoDB Global Tables**: Multi-region replication with on-demand billing and point-in-time recovery enabled
- **Step Functions Cross-Region**: Deploy state machines in both regions with identical workflow definitions for consistency
- **AWS Backup Cross-Region**: Daily EBS snapshots with automated cross-region copy to secondary region
- **Lambda Multi-Region**: Deploy functions in both regions with 512MB memory, 30-second timeout, identical configurations and environment variables

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `resource-type-${environmentSuffix}`
- All resources must be destroyable (no Retain policies, no deletion protection)
- Deploy primary resources to **us-east-1** region
- Deploy secondary resources to **us-east-2** region
- Include proper error handling and logging for all components
- Use on-demand or serverless options where possible to minimize costs

### Architecture Constraints

- RPO (Recovery Point Objective) must be under 5 minutes
- RTO (Recovery Time Objective) must be under 15 minutes
- Data consistency must be maintained across regions
- System must handle regional failures gracefully
- No manual intervention required for failover
- All configuration changes must replicate automatically
- Backups must be accessible from either region

### Service-Specific Requirements

**Aurora Global Database**:
- Use Aurora PostgreSQL for consistency
- Primary cluster: db.r5.large, Multi-AZ disabled (global redundancy provided)
- Secondary cluster: db.r5.large, read replica
- Enable automated backups with 7-day retention
- Set skip_final_snapshot = true for destroyability
- Set deletion_protection = false for destroyability

**Lambda Functions**:
- Use Node.js 18.x or Python 3.11 runtime
- If using Node.js 18+, avoid AWS SDK v2 (not included by default)
- Extract data from event objects instead of requiring SDK
- Deploy identical function code to both regions
- Include environment variables for region-aware behavior

**DynamoDB Global Tables**:
- Use on-demand billing mode
- Enable point-in-time recovery
- Configure streams for replication
- Define hash key and sort key appropriately for transaction data

**S3 Cross-Region Replication**:
- Enable versioning on all buckets (required for replication)
- Configure RTC for objects under 128MB
- Use separate IAM role for replication
- Enable SSE-S3 encryption

**Step Functions**:
- Deploy identical state machine definitions to both regions
- Use region-aware resource ARNs
- Handle cross-region service calls appropriately
- Include error handling and retry logic

**AWS Backup**:
- Target EBS volumes attached to any EC2 instances
- Daily backup schedule
- Cross-region copy to secondary region
- 7-day retention for backups

### Constraints

- Financial services compliance requirements (encryption at rest and in transit)
- All data must be encrypted using AWS managed keys (SSE-S3 or default encryption)
- IAM roles must follow least privilege principle
- Security groups must be restrictive (no 0.0.0.0/0 ingress unless necessary)
- All resources must support rapid failover without data loss
- Avoid resources that are slow to provision (NAT Gateways, large RDS instances)
- Cost-optimize where possible (prefer serverless, on-demand billing)

## Success Criteria

- **Functionality**: Complete multi-region DR architecture with automated failover
- **Performance**: RPO under 5 minutes, RTO under 15 minutes
- **Reliability**: System handles regional failures without data loss
- **Security**: All data encrypted, IAM roles properly scoped, compliant with financial services requirements
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-tested (100% coverage), comprehensive documentation
- **Destroyability**: All resources can be destroyed without manual cleanup
- **Monitoring**: Comprehensive visibility across both regions

## What to deliver

- Complete CDKTF TypeScript implementation with separate constructs for each component
- DynamoDB global table configuration
- Aurora Global Database with primary and secondary clusters
- Lambda functions deployed to both regions
- S3 buckets with cross-region replication and RTC
- Route 53 health checks and failover routing
- EventBridge global endpoints
- AWS Backup plans with cross-region copy
- CloudWatch dashboards showing metrics from both regions
- Systems Manager Parameter Store with cross-region replication
- Step Functions state machines in both regions
- Unit tests for all components (100% coverage)
- Integration tests validating cross-region functionality
- Documentation explaining the DR architecture and failover process
- Deployment instructions with validation steps
