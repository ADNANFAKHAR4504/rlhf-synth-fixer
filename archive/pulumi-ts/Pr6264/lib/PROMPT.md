Hey team,

We need to build a multi-region disaster recovery infrastructure for a financial trading platform that's processing millions of transactions daily. After a recent $2.3M outage, the business wants an active-passive DR solution that can automatically failover between eu-central-1 (primary) and eu-west-2 (DR region) with recovery time under 5 minutes.

The trading platform runs on ECS Fargate behind an Application Load Balancer, stores transactional data in Aurora PostgreSQL, and manages session state through DynamoDB. When primary region health checks fail, Route 53 should automatically redirect traffic to the DR region while Lambda functions orchestrate database promotion and service scaling. The entire failover process must complete without manual intervention and maintain data consistency with less than 1 minute of potential data loss.

This needs to be implemented using **Pulumi with TypeScript** to deploy infrastructure across both regions with automated health monitoring, cross-region replication, and intelligent failover orchestration.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Pulumi with TypeScript** that automatically fails over a financial trading platform from eu-central-1 to eu-west-2 when primary region health checks fail.

### Core Requirements

1. **Primary Infrastructure (eu-central-1)**
   - Aurora PostgreSQL cluster with automated backups
   - DynamoDB table for session management
   - ECS Fargate service running trading application
   - Application Load Balancer with health checks
   - S3 bucket for application artifacts with versioning enabled

2. **Disaster Recovery Infrastructure (eu-west-2)**
   - Aurora read replica promoted to cluster on failover
   - DynamoDB global table replica for session replication
   - ECS Fargate service configured to scale on demand
   - Application Load Balancer in DR region
   - S3 bucket with cross-region replication from primary

3. **DNS Failover and Traffic Management**
   - Route 53 hosted zone with health check associations
   - Primary record set pointing to eu-central-1 ALB
   - Secondary record set pointing to eu-west-2 ALB
   - Health checks monitoring primary ALB endpoint health
   - Automatic DNS weight adjustment on failover

4. **Automated Failover Orchestration**
   - Lambda function in eu-west-2 to promote Aurora read replica to standalone cluster
   - Lambda function to update Route 53 record weights for traffic shift
   - Lambda function to scale ECS services in DR region
   - EventBridge rules triggering failover based on health check status
   - State machine coordinating multi-step failover process

5. **Cross-Region Replication**
   - S3 cross-region replication from eu-central-1 to eu-west-2
   - DynamoDB global table spanning both regions
   - Aurora Global Database with continuous replication
   - Replication lag monitoring under 1 minute

6. **Health Monitoring and Alerting**
   - CloudWatch alarms in eu-central-1 for RDS replication lag
   - CloudWatch alarms for ECS service health in both regions
   - CloudWatch alarms for ALB target health in both regions
   - SNS topics in each region for alert distribution
   - Cross-region SNS subscriptions for alert forwarding
   - CloudWatch dashboard showing replication lag and system health

7. **IAM and Security**
   - IAM roles with cross-region assume role policies
   - Lambda execution roles with permissions for RDS promotion and Route 53 updates
   - ECS task roles with access to DynamoDB and S3
   - KMS keys in both regions for encryption at rest
   - Security groups allowing cross-region communication where needed

8. **Observability**
   - CloudWatch log groups for Lambda functions in both regions
   - CloudWatch metrics for replication lag tracking
   - X-Ray tracing for distributed request tracking
   - Custom metrics for failover success rate

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Aurora PostgreSQL** for transactional database with Global Database
- Use **DynamoDB** with global tables for session state
- Use **ECS Fargate** for containerized application deployment
- Use **Application Load Balancer** in both regions for traffic distribution
- Use **Route 53** for DNS-based failover with health checks
- Use **S3** with cross-region replication for artifact storage
- Use **Lambda** for automated failover orchestration
- Use **CloudWatch** for monitoring and alerting across regions
- Use **SNS** for notification delivery in both regions
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-${environmentSuffix}`
- Deploy primary resources to **eu-central-1** region
- Deploy DR resources to **eu-west-2** region

### Constraints

- RTO (Recovery Time Objective) must be under 5 minutes from failure detection to DR operational
- RPO (Recovery Point Objective) must be under 1 minute for data loss tolerance
- All resources must be tagged with Environment, Region, and DR-Role tags
- No retention policies or deletion protection - all resources must be fully destroyable
- Use Aurora Serverless v2 for faster provisioning and cost optimization
- Minimize NAT Gateway usage - prefer VPC endpoints where possible
- Include proper error handling in Lambda functions with retry logic
- Lambda functions must handle idempotency for safe retry operations
- Route 53 health checks must have appropriate failure thresholds

## Success Criteria

- **Functionality**: Complete automated failover from eu-central-1 to eu-west-2 without manual intervention
- **Performance**: Failover completes within 5 minutes of primary region failure detection
- **Data Integrity**: RPO under 1 minute with Aurora Global Database replication lag monitoring
- **Reliability**: Health checks correctly detect failures and trigger automated failover
- **Security**: Cross-region IAM roles with least privilege, encryption at rest with KMS
- **Resource Naming**: All resources include environmentSuffix parameter in names
- **Observability**: CloudWatch dashboards show real-time system health across both regions
- **Code Quality**: TypeScript with proper typing, well-tested, comprehensive documentation

## What to deliver

- Complete **Pulumi with TypeScript** implementation in index.ts
- Aurora PostgreSQL Global Database spanning eu-central-1 and eu-west-2
- DynamoDB global table with replicas in both regions
- ECS Fargate services behind ALBs in both regions
- Route 53 hosted zone with primary and secondary record sets
- S3 buckets in both regions with cross-region replication configured
- Lambda functions for failover orchestration (promote Aurora, update Route 53, scale ECS)
- CloudWatch alarms monitoring RDS lag, ECS health, and ALB target health
- SNS topics in both regions with cross-region subscriptions
- IAM roles with cross-region assume role policies
- CloudWatch dashboard showing replication lag and system health
- Unit tests for all infrastructure components
- Integration tests verifying failover functionality
- Documentation covering deployment process and failover procedures
- Exported outputs: primary endpoint URL, DR endpoint URL, health check IDs, failover Lambda ARNs