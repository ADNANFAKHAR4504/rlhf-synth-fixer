# Active-Passive Disaster Recovery Infrastructure

Hey team,

We need to build a complete disaster recovery solution for our payment processing system. Last quarter, we had a 4-hour outage in our primary region that resulted in significant revenue loss and customer impact. The business has made it clear that we need automated failover capabilities and real-time data replication between regions.

I've been asked to implement this using **Pulumi with Python**. The requirements are pretty comprehensive - we need active-passive DR spanning us-east-1 as the primary region and us-east-2 as the disaster recovery region. The business has set strict recovery objectives: RPO under 1 minute and RTO under 5 minutes.

The financial services regulatory environment means we need to be careful about compliance, but the immediate priority is getting the infrastructure automated and tested. We had some manual processes before, but they proved unreliable during the actual outage.

## What we need to build

Create a complete disaster recovery infrastructure using **Pulumi with Python** that spans two AWS regions (us-east-1 as primary, us-east-2 as DR) for a payment processing system with automated failover capabilities.

### Core Requirements

1. **Database Tier - Aurora PostgreSQL Global Database**
   - Primary cluster in us-east-1 with read replicas
   - Secondary cluster in us-east-2 (read-only in active-passive mode)
   - Automated backups with 7-day retention
   - Cross-region replication must support RPO under 1 minute
   - Resource names must include environmentSuffix for uniqueness

2. **Compute Tier - Lambda Functions**
   - Deploy identical payment processing Lambda functions in both regions
   - Configure IAM roles with cross-region assume permissions
   - Functions should be ready to handle traffic in both regions
   - Proper error handling and retry logic

3. **API Layer - API Gateway REST APIs**
   - Configure REST APIs in both us-east-1 and us-east-2
   - Custom domain names for each regional API endpoint
   - APIs should be identical in configuration

4. **DNS and Failover - Route 53**
   - Create hosted zone with failover routing policy
   - Primary record set pointing to us-east-1 API Gateway
   - Secondary record set pointing to us-east-2 API Gateway
   - Health checks monitoring the primary region endpoint
   - Automatic DNS failover on health check failure

5. **Object Storage - S3 Cross-Region Replication**
   - S3 buckets in both us-east-1 and us-east-2
   - Cross-region replication including delete markers
   - Encryption at rest enabled
   - Versioning enabled for both buckets

6. **Session State - DynamoDB Global Tables**
   - Global table for session state management
   - Replicas in both us-east-1 and us-east-2
   - Support for both regions to read/write during failover

7. **Monitoring and Alerting**
   - CloudWatch dashboard aggregating metrics from both regions
   - SNS topics in both regions for failover event notifications
   - Alarms for health check failures and replication lag

8. **Networking**
   - VPCs in both regions with private subnets for databases
   - VPC configuration for Lambda functions
   - Security groups and network ACLs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use Pulumi's ComponentResource pattern to organize regional deployments
- Primary region: us-east-1
- DR region: us-east-2
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must support recovery objectives: RPO < 1 minute, RTO < 5 minutes
- Proper error handling for multi-region operations

### AWS Services Required

- Amazon Aurora PostgreSQL (Global Database)
- AWS Lambda
- Amazon API Gateway
- Amazon Route 53
- Amazon S3
- Amazon DynamoDB (Global Tables)
- Amazon CloudWatch
- Amazon SNS
- AWS IAM
- Amazon VPC

### Constraints

- Total monthly cost must not exceed $5000 for DR infrastructure
- RPO (Recovery Point Objective) must be under 1 minute
- RTO (Recovery Time Objective) must be under 5 minutes
- Primary region must be us-east-1, DR region must be us-east-2
- Use Aurora Global Database for cross-region database replication
- S3 buckets must use cross-region replication with delete markers
- All Lambda functions must be replicated to both regions
- CloudWatch must aggregate metrics from both regions
- All resources must be destroyable (no Retain policies or deletion protection)
- Tag all resources with Environment=DR, CostCenter=Operations, and Criticality=High

## Success Criteria

- Functionality: Complete active-passive DR setup with all components deployed in both regions
- Failover: Route 53 health checks detect primary region failure and automatically update DNS
- Data Replication: Aurora Global Database and S3 replication working with RPO under 1 minute
- Session Management: DynamoDB global tables replicate session state across regions
- Monitoring: CloudWatch dashboard shows metrics from both regions, SNS alerts on failover
- Security: Encryption enabled for data at rest, IAM roles follow least privilege
- Resource Naming: All resources include environmentSuffix for deployment isolation
- Compliance: Resources tagged with Environment=DR, CostCenter=Operations, Criticality=High
- Cost: Infrastructure stays within $5000/month budget
- Code Quality: Python code, well-tested, documented, using ComponentResource pattern

## What to deliver

- Complete Pulumi Python program organized with ComponentResource pattern
- Primary region component with Aurora primary cluster, Lambda functions, API Gateway, S3 bucket
- DR region component with Aurora secondary cluster, Lambda functions, API Gateway, S3 bucket
- Route 53 configuration with health checks and failover routing policy
- DynamoDB global table configuration
- CloudWatch dashboards and SNS topics for both regions
- IAM roles with proper cross-region permissions
- VPC and networking configuration for both regions
- Unit tests for all components
- Documentation with deployment instructions and failover testing procedures
