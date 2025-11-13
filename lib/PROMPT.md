Hey team,

We have a critical requirement from the business to implement a production-grade disaster recovery solution for our infrastructure. The goal is to achieve an automated active-passive failover setup across two AWS regions with clearly defined Recovery Point Objective (RPO) of 15 minutes and Recovery Time Objective (RTO) of 30 minutes. The business needs this to ensure we can maintain operations even during catastrophic regional failures.

I've been asked to build this using **AWS CDK with TypeScript** and deploy it across us-east-1 as the primary region and us-east-2 as the secondary region. The architecture needs to be comprehensive, covering our database layer, application tier, storage, and all the orchestration needed to handle failover automatically.

The leadership team is particularly concerned about data loss during failover scenarios, so we need automated backups, cross-region replication for all critical data stores, and health monitoring that can detect failures quickly. They also want visibility into the system's health through dashboards and immediate alerting when issues arise.

## What we need to build

Create a disaster recovery solution using **AWS CDK with TypeScript** that implements active-passive failover with automated orchestration across us-east-1 and us-east-2 regions.

### Core Requirements

1. **DNS and Traffic Management**
   - Configure Route 53 with failover routing policy for primary and secondary endpoints
   - Implement health checks with 30-second intervals and 3 consecutive failures threshold
   - Automate DNS failover when primary region becomes unavailable
   - Do NOT create a new HostedZone (assume existing or work with health checks only)

2. **Database Layer**
   - Deploy RDS Aurora PostgreSQL clusters in both regions with VER_15_5 engine version
   - Configure cross-region read replicas from primary to secondary
   - Enable automated backups with AWS Backup and 7-day retention
   - Use KMS CMK for encryption of snapshots and data at rest
   - Ensure all database resources are configured for automatic failover

3. **Data Storage and Replication**
   - Create S3 buckets in both regions with cross-region replication
   - Replication must include object metadata and tags
   - Enable versioning and encryption on all buckets
   - Configure DynamoDB global tables for session management
   - Use on-demand billing for DynamoDB with point-in-time recovery enabled
   - Enable contributor insights for DynamoDB in both regions

4. **Application Infrastructure**
   - Deploy Application Load Balancers in both regions with proper target groups
   - Use AWS Certificate Manager certificates for ALBs in both regions
   - Configure ECS Fargate services as targets for the load balancers
   - Implement proper VPC configuration with public and private subnets
   - Set up security groups following least privilege principles

5. **Health Monitoring and Orchestration**
   - Create Lambda functions to perform health checks every 60 seconds
   - Configure dead letter queues for all Lambda functions
   - Set up EventBridge rules to orchestrate failover procedures
   - Use 5-minute retry intervals for EventBridge failover coordination
   - Deploy SNS topics for alerting with multiple email endpoints

6. **Observability and Metrics**
   - Configure CloudWatch dashboards displaying RTO and RPO metrics
   - Create CloudWatch alarms that trigger SNS notifications
   - Set up CloudWatch Logs groups with 30-day retention
   - Monitor key metrics: database replication lag, health check status, failover events
   - Track application availability and response times

7. **Backup and Recovery**
   - Implement AWS Backup plans for RDS Aurora and DynamoDB
   - Configure 7-day retention period for all backups
   - Ensure backup plans cover both primary and secondary regions
   - Tag backup resources appropriately for cost tracking

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **RDS Aurora PostgreSQL VER_15_5** (not VER_15_3 which is unavailable)
- Deploy to **us-east-1** as primary and **us-east-2** as secondary regions
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All Lambda functions written in Node.js or Python with proper error handling
- IAM roles follow least privilege with explicit deny statements for unused regions
- All resources must be destroyable (no DeletionPolicy.RETAIN or deletion protection)

### Constraints and Compliance

- RDS clusters must use encrypted snapshots with KMS Customer Managed Keys
- All IAM roles require explicit deny for regions outside us-east-1 and us-east-2
- CloudWatch alarms must trigger SNS to multiple email endpoints
- S3 replication must preserve all metadata and tags
- ALB must use ACM certificates in both regions (assume certificates exist)
- Route 53 health checks monitor both primary and secondary with 30-second intervals
- EventBridge coordination uses 5-minute retry intervals
- DynamoDB global tables have contributor insights enabled in both regions
- Lambda health monitoring functions must have DLQ configured
- All encryption uses AWS managed or customer managed KMS keys
- Proper tagging for cost allocation and resource management

### Cost Optimization

- Prefer serverless options: Aurora Serverless v2, Lambda, Fargate
- Use on-demand billing for DynamoDB to optimize for variable workloads
- Implement lifecycle policies for S3 and backup retention
- Avoid NAT Gateways where possible (use VPC endpoints)
- Minimize always-on resources in secondary region

## Success Criteria

- **Functionality**: Complete multi-region DR solution with automated failover
- **Performance**: Achieve 15-minute RPO and 30-minute RTO targets
- **Reliability**: Health checks detect failures within 90 seconds (3 x 30-second interval)
- **Security**: All data encrypted at rest and in transit, IAM follows least privilege
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Observability**: CloudWatch dashboards show real-time RTO/RPO metrics
- **Automation**: EventBridge orchestrates failover without manual intervention
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete **AWS CDK TypeScript** implementation across lib/ directory
- Separate stack classes for each logical component (network, database, compute, monitoring)
- Multi-region deployment pattern with proper cross-region resource references
- Lambda functions for health checking in lib/lambda/ or lib/functions/
- Comprehensive unit tests for all stacks in test/ directory
- README.md with deployment instructions and architecture overview
- All AWS services properly integrated: Route 53, Aurora, DynamoDB, S3, Lambda, ALB, ECS Fargate, EventBridge, CloudWatch, SNS, AWS Backup, KMS, IAM, VPC, ACM
- Clear documentation of RTO/RPO measurement and monitoring approach
