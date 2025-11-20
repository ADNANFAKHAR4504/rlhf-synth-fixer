# Multi-Region Disaster Recovery for Payment Processing

Hey there,

We have a financial services client who runs a critical payment processing application in us-east-1, and they need a proper disaster recovery solution. The business requirements are strict - they need near-zero downtime with an RPO of 15 minutes and RTO of 30 minutes. Right now, if us-east-1 goes down, their entire payment processing stops, which is unacceptable for a financial services company.

I have been tasked with building this disaster recovery architecture, and it needs to be done using **CDKTF with Python**. The business has standardized on CDKTF for infrastructure automation, and Python is the language of choice for our operations team.

The challenge here is implementing a true multi-region active-passive disaster recovery setup. The primary region will be us-east-1, with us-east-2 serving as the secondary failover region. During normal operations, all traffic goes to us-east-1, but if health checks detect issues with the primary region, traffic should automatically failover to us-east-2 within 30 minutes.

## What we need to build

Create a multi-region disaster recovery architecture using **CDKTF with Python** for a payment processing system that can automatically failover between us-east-1 and us-east-2.

### Core Requirements

1. **Database Layer - Aurora Global Database**
   - Primary Aurora PostgreSQL 14.x cluster in us-east-1
   - Secondary Aurora cluster in us-east-2 with automatic replication
   - Ability to promote secondary cluster to primary during failover
   - VPC configuration with private subnets across 3 availability zones in each region

2. **Session Management - DynamoDB Global Tables**
   - Global table for session data that replicates across both regions
   - Point-in-time recovery enabled
   - Encryption at rest using KMS

3. **Application Logic - Lambda Functions**
   - Identical payment processing Lambda functions deployed in both regions
   - Python 3.11 runtime preferred
   - VPC-attached for secure database access
   - Environment variables pointing to region-specific endpoints

4. **API Layer - API Gateway with Custom Domain**
   - REST API Gateway deployed in both regions
   - Custom domain name with Route 53 failover routing
   - Regional API endpoints to avoid cross-region latency

5. **Data Storage - S3 Cross-Region Replication**
   - Source S3 bucket in us-east-1
   - Destination bucket in us-east-2 with cross-region replication
   - Replication Time Control enabled for predictable replication
   - Versioning enabled on both buckets

6. **Health Monitoring - Route 53 Health Checks**
   - Health checks monitoring primary region API Gateway endpoint
   - Automated failover to secondary region on health check failure
   - Health check alarms integrated with CloudWatch

7. **Observability - CloudWatch Cross-Region Dashboard**
   - Single dashboard aggregating metrics from both regions
   - Aurora database performance metrics
   - Lambda invocation and error rates
   - API Gateway request metrics and latency
   - S3 replication lag and status

8. **Alerting - SNS Topics**
   - SNS topics in both regions for failover notifications
   - Cross-region subscriptions where needed
   - Integration with CloudWatch alarms

9. **Networking - VPC Peering**
   - VPCs in both regions with non-overlapping CIDR blocks
   - VPC peering connection for inter-region communication
   - Security groups allowing necessary cross-region traffic

10. **IAM Permissions - Cross-Region Roles**
    - IAM roles with cross-region assume permissions
    - S3 replication role
    - Lambda execution roles with database access
    - RDS enhanced monitoring role

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Aurora PostgreSQL 14.x** for the global database
- Use **DynamoDB** global tables for session data
- Use **Lambda** with Python 3.11 runtime for payment processing
- Use **API Gateway** REST API with custom domain
- Use **S3** with cross-region replication and RTC enabled
- Use **Route 53** for DNS failover routing with health checks
- Use **CloudWatch** for cross-region monitoring and dashboards
- Use **SNS** for notifications
- Use **VPC** with 3 AZs in each region and VPC peering
- Use **KMS** for encryption at rest
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environment_suffix}`
- Deploy primary infrastructure to **us-east-1** region
- Deploy secondary infrastructure to **us-east-2** region

### Constraints

- Follow AWS Well-Architected Framework best practices
- Enable encryption at rest for all data stores using KMS
- Enable encryption in transit using TLS 1.2 or higher
- Implement IAM least privilege for all roles and policies
- Enable CloudWatch logging for all services
- All resources must be destroyable - no DeletionPolicy Retain or deletion protection
- Aurora clusters should have skip_final_snapshot set to true for testing
- Include proper error handling and retry logic
- Tag all resources appropriately with environment and purpose tags

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix variable in their names
- Pattern: `payment-processing-resource-${environment_suffix}`
- Aurora must use Aurora Serverless v2 or set backup_retention_period to 1 for faster provisioning
- Lambda functions should NOT set reservedConcurrentExecutions unless required
- RDS deletion protection must be set to false for destroyability
- S3 buckets must be configured for automatic deletion on stack destroy
- VPC CIDR blocks: us-east-1 should use 10.0.0.0/16, us-east-2 should use 10.1.0.0/16
- Do NOT create GuardDuty detectors - they are account-level resources

## Success Criteria

- **Functionality**: Complete multi-region DR architecture with automatic failover capability
- **Performance**: Sub-15 minute RPO for data replication, sub-30 minute RTO for failover
- **Reliability**: Route 53 health checks properly detect primary region failures and trigger failover
- **Security**: All data encrypted at rest and in transit, IAM least privilege enforced
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: Python code follows PEP 8, well-tested with unit and integration tests, properly documented
- **Observability**: CloudWatch dashboard provides visibility into both regions

## What to deliver

- Complete **CDKTF Python** implementation in lib/ directory
- Aurora Global Database with primary in us-east-1 and secondary in us-east-2
- DynamoDB global table for session management
- Lambda functions for payment processing in both regions
- API Gateway with custom domain and Route 53 failover routing
- S3 buckets with cross-region replication and RTC enabled
- Route 53 health checks and failover routing policy
- CloudWatch dashboard with cross-region metrics
- SNS topics for notifications
- VPC configuration with peering between regions
- IAM roles for cross-region access
- Unit tests for all infrastructure components
- Integration tests validating disaster recovery scenarios
- Documentation explaining architecture and deployment process
