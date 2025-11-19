Hey team,

We need to build a multi-region disaster recovery solution for a critical trading platform that handles millions of transactions daily. A financial services company recently experienced a regional outage that cost them significant revenue, and they need a robust DR solution that can failover automatically within 60 seconds to maintain their 99.99% uptime SLA.

The business requirement is clear: build this using **AWS CDK with TypeScript** to provision infrastructure across two AWS regions - us-east-1 as primary and us-east-2 as secondary. The system must handle automatic failover, data replication, and maintain session state across regions without manual intervention.

This is a complex distributed system that needs to coordinate multiple AWS services across regions while ensuring data consistency, minimal failover time, and automated recovery procedures. The trading platform processes real-time orders, so any downtime directly impacts revenue and customer trust.

## What we need to build

Create a multi-region disaster recovery infrastructure using **AWS CDK with TypeScript** that implements automated failover capabilities for a high-availability trading platform spanning us-east-1 and us-east-2 regions.

### Core Requirements

1. **DNS and Health Monitoring**
   - Set up Route 53 hosted zone with health checks monitoring endpoints in both regions
   - Configure failover routing policy for automatic DNS updates during regional failures
   - Implement health check endpoints that validate application availability

2. **Database Layer with Global Replication**
   - Deploy Aurora PostgreSQL global database with writer in us-east-1
   - Configure read replica in us-east-2 for failover readiness
   - Monitor replication lag across regions
   - Enable automated promotion of secondary to writer during failover

3. **Compute Layer with Regional Redundancy**
   - Create Lambda functions in both regions for processing trade orders
   - Configure SQS queues in each region feeding Lambda processors
   - Deploy identical Lambda deployment packages across regions
   - Implement cross-region event processing capabilities

4. **Session State Management**
   - Configure DynamoDB global tables for user session data
   - Enable point-in-time recovery on all DynamoDB tables
   - Ensure session state replication with minimal lag between regions

5. **Storage with Cross-Region Replication**
   - Implement S3 buckets with cross-region replication for application configurations
   - Set up separate buckets for audit logs with replication
   - Configure versioning and lifecycle policies on all buckets

6. **Monitoring and Alerting**
   - Set up CloudWatch alarms monitoring RDS replication lag
   - Create alarms for Lambda error rates and invocation failures
   - Monitor API Gateway latency and error rates
   - Configure SNS notifications for critical alerts
   - Implement cross-region monitoring dashboards

7. **Automated Failover Orchestration**
   - Create Step Functions state machine orchestrating the failover process
   - Include RDS promotion from read replica to writer
   - Automate Route 53 DNS record updates
   - Implement automated failback procedures
   - Add validation steps to ensure failover success

8. **API Layer with Custom Domains**
   - Deploy API Gateway REST APIs in both regions
   - Configure custom domain names with regional endpoints
   - Implement identical API configurations across regions
   - Set up API Gateway logging and monitoring

9. **Cross-Region Event Distribution**
   - Configure EventBridge rules forwarding critical events between regions
   - Implement event filtering and routing logic
   - Ensure reliable event delivery across regions

10. **Continuous Failover Testing**
    - Implement automated testing Lambda function
    - Validate failover readiness every hour
    - Test health check endpoints, database connectivity, and API availability
    - Alert on any failover readiness issues

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Route 53** for DNS management and health-based routing
- Use **Aurora PostgreSQL Global Database** for cross-region data persistence
- Use **Lambda** for serverless compute in both regions
- Use **SQS** for decoupled message processing
- Use **DynamoDB Global Tables** for session state with point-in-time recovery
- Use **S3** with cross-region replication for static assets
- Use **CloudWatch** for comprehensive monitoring and alarming
- Use **Step Functions** for orchestrating complex failover workflows
- Use **API Gateway** for REST API endpoints with custom domains
- Use **EventBridge** for cross-region event distribution
- Use **Systems Manager Parameter Store** for region-specific configurations
- Use **VPC** with private subnets and VPC peering for cross-region communication
- Use **IAM** roles supporting cross-region assume role capabilities
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{purpose}-environment-suffix`
- Deploy to **us-east-1** (primary) and **us-east-2** (secondary) regions
- Use CDK 2.x with TypeScript
- Implement proper VPC networking with private subnets

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names for uniqueness
- All resources must be destroyable - NO RemovalPolicy.RETAIN allowed
- NO DeletionProtection enabled on databases or other resources
- Lambda functions must use identical deployment packages across regions
- Aurora Global Database must support automated promotion without manual intervention
- DynamoDB global tables must have point-in-time recovery enabled
- S3 buckets must have versioning enabled for replication
- All IAM roles must support cross-region assume role capabilities
- Step Functions must validate each failover step before proceeding
- Health checks must monitor actual application endpoints, not just infrastructure
- Use Node.js 18.x or higher for Lambda runtimes (includes AWS SDK v3)

### Constraints

- Implement 60-second maximum failover time requirement
- Ensure all cross-region replication has minimal lag (sub-second where possible)
- Support automatic failback when primary region recovers
- Maintain session state consistency during and after failover
- Ensure zero data loss during failover for committed transactions
- All resources must be fully automated with no manual failover steps
- Support deployment and teardown without leaving orphaned resources
- Include proper error handling and retry logic in all Lambda functions
- Implement exponential backoff for all AWS service API calls
- Use CloudWatch Logs for centralized logging across regions
- Tag all resources with environment and region identifiers

## Success Criteria

- **Functionality**: Complete multi-region DR solution with automated failover
- **Performance**: Failover completes within 60 seconds with Route 53 updates
- **Reliability**: System maintains 99.99% uptime during regional failures
- **Data Consistency**: Zero data loss for committed transactions during failover
- **Monitoring**: Comprehensive CloudWatch dashboards and alarms for all critical metrics
- **Automation**: Hourly failover readiness testing with automated alerting
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: TypeScript with strong typing, comprehensive error handling, well-documented

## What to deliver

- Complete **AWS CDK with TypeScript** implementation organized as CDK Constructs
- Primary region stack (us-east-1) with all services
- Secondary region stack (us-east-2) with replica services
- Shared constructs for cross-region resources (Route 53, IAM)
- Lambda functions for trade order processing (Node.js 18.x)
- Lambda function for automated failover testing
- Step Functions state machine for failover orchestration
- CloudWatch alarms and monitoring dashboards
- Documentation explaining the DR architecture and failover procedures
- Deployment instructions for both regions
- Testing procedures to validate failover readiness
