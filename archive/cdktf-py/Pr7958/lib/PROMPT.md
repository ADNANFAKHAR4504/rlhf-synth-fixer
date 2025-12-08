# Regional Failover Infrastructure for Trading Platform

Hey team,

We need to build automated regional failover infrastructure for a high-availability trading platform. A financial services company requires 99.99% uptime with their trading platform automatically failing over between AWS regions when issues are detected. They need failure detection within 30 seconds and complete failover within 2 minutes.

The infrastructure needs to span two regions - us-east-1 as primary and us-east-2 as secondary. When the primary region experiences issues, Route 53 health checks should detect it quickly and automatically route traffic to the secondary region. The platform needs to handle session state, database replication, and file synchronization across regions without data loss.

I've been asked to create this using **CDKTF with Python** to orchestrate all the AWS resources needed for this multi-region deployment.

## What we need to build

Create automated regional failover infrastructure using **CDKTF with Python** for a high-availability trading platform.

### Core Requirements

1. **Multi-Region Database Infrastructure**
   - RDS Aurora clusters deployed in both us-east-1 and us-east-2
   - Automated backups enabled on both clusters
   - Cross-region read replicas or Aurora Global Database for replication
   - Database credentials stored securely

2. **Traffic Management and Health Monitoring**
   - Route 53 hosted zone with failover routing policy
   - Health checks monitoring primary region endpoints every 30 seconds
   - Automatic DNS failover to secondary region on health check failure
   - Health check monitoring for both ALB endpoints

3. **Compute Infrastructure in Both Regions**
   - Auto Scaling groups in us-east-1 and us-east-2
   - Application Load Balancers in both regions
   - EC2 launch templates with proper IAM roles
   - Target groups configured for health checks
   - Cross-region traffic distribution

4. **Session State Management**
   - DynamoDB global tables for session state
   - Configured for both us-east-1 and us-east-2 regions
   - Automatic replication between regions
   - Consistent read/write capabilities

5. **Cross-Region File Synchronization**
   - S3 buckets in both regions
   - Cross-region replication rules configured
   - Versioning enabled for data protection
   - Lifecycle policies for cost optimization

6. **Failover Orchestration**
   - Lambda functions for automated failover coordination
   - Functions to promote secondary region resources
   - Health check validation logic
   - Notification triggers on failover events

7. **Monitoring and Alerting**
   - CloudWatch alarms for critical metrics
   - SNS topics for notifications
   - Alarms for database lag, health check failures, ASG capacity
   - Email notifications for operations team

8. **Network Connectivity**
   - VPC configuration in both regions
   - VPC peering connection between us-east-1 and us-east-2
   - Route tables configured for cross-region traffic
   - Security groups allowing necessary traffic

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS Aurora** for multi-region database replication
- Use **Route 53** with failover routing and health checks
- Use **EC2 Auto Scaling** groups with Application Load Balancers
- Use **DynamoDB Global Tables** for session state
- Use **S3** with cross-region replication
- Use **Lambda** for failover orchestration
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for notifications
- Use **VPC** with peering between regions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy primary resources to **us-east-1** region
- Deploy secondary resources to **us-east-2** region
- Health checks must run every 30 seconds
- Failover must complete within 2 minutes

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy.DESTROY, no RETAIN policies)
- Every resource name must include the environmentSuffix parameter for uniqueness
- No hardcoded values - use parameters and variables
- Lambda functions must be in lib/lambda/ directory
- All code must be Python (no TypeScript, JavaScript, or other languages)
- Use CDKTF constructs, NOT standard Terraform or AWS CDK

### Constraints

- Target uptime: 99.99% (less than 53 minutes downtime per year)
- Failure detection must occur within 30 seconds
- Complete failover must finish within 2 minutes
- Multi-region deployment across us-east-1 and us-east-2
- Production-grade security with proper IAM roles
- All resources must support automated deployment and teardown
- No manual intervention required for failover
- Database replication lag must be monitored
- Cross-region network latency must be acceptable

## Success Criteria

- **Functionality**: Traffic automatically fails over from us-east-1 to us-east-2 on primary region failure
- **Performance**: Failure detection within 30 seconds, complete failover within 2 minutes
- **Reliability**: 99.99% uptime with automated recovery
- **Security**: Proper IAM roles, security groups, and encrypted data at rest and in transit
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Python with CDKTF, well-tested, fully documented
- **Multi-Region**: Resources properly replicated and synchronized across both regions
- **Monitoring**: Complete visibility into health status and failover events

## What to deliver

- Complete CDKTF Python implementation
- RDS Aurora clusters with cross-region replication
- Route 53 failover routing with health checks
- Auto Scaling groups and ALBs in both regions
- DynamoDB global tables
- S3 cross-region replication
- Lambda functions for failover orchestration
- CloudWatch monitoring and SNS notifications
- VPC peering configuration
- Unit tests for all components
- Integration tests for failover scenarios
- Documentation and deployment instructions
