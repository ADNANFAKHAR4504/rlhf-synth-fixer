Hey team,

We've got an urgent requirement from a financial services company running a critical trading platform. They recently had a regional AWS outage that cost them millions in lost trades, and leadership is demanding we build a proper multi-region disaster recovery solution. The business requirement is clear: 99.99% uptime with automatic failover within 60 seconds.

I need to build this using **CDKTF with TypeScript**. The infrastructure needs to span two regions - us-east-1 as primary and us-east-2 as secondary - with full automation for failover and recovery.

The trading platform processes thousands of orders per second, so we can't afford any data loss or extended downtime. We need global database replication, cross-region session management, and automated health monitoring that can trigger failover without human intervention.

## What we need to build

Create a multi-region disaster recovery solution using **CDKTF with TypeScript** that automatically fails over between us-east-1 and us-east-2 within 60 seconds.

### Core Requirements

1. **DNS and Health Monitoring**
   - Route 53 hosted zone with health checks for endpoints in both regions
   - Automatic DNS failover based on endpoint health
   - Health checks monitoring application availability

2. **Database Infrastructure**
   - Aurora PostgreSQL global database with writer in us-east-1
   - Read replica in us-east-2 for automatic promotion during failover
   - Cross-region replication for zero data loss

3. **Compute Layer**
   - Lambda functions in both regions processing trade orders from SQS queues
   - Identical deployment packages in each region
   - Support for cross-region invocation

4. **Session Management**
   - DynamoDB global tables replicating user session data across regions
   - Point-in-time recovery enabled for data protection
   - Automatic synchronization between regions

5. **Storage and Replication**
   - S3 buckets with cross-region replication for application configurations
   - Separate buckets for audit logs with replication
   - Versioning enabled on all buckets

6. **Monitoring and Alerting**
   - CloudWatch alarms monitoring RDS replication lag
   - Lambda error rate monitoring in both regions
   - API Gateway latency tracking
   - Cross-region alarm aggregation

7. **Failover Orchestration**
   - Step Functions state machine coordinating the failover process
   - Automated RDS Aurora cluster promotion in secondary region
   - Route 53 health check updates to redirect traffic
   - EventBridge integration for failover triggers

8. **API Layer**
   - API Gateway REST APIs deployed in both us-east-1 and us-east-2
   - Custom domain names with Route 53 integration
   - Regional API endpoints with health checks

9. **Event Management**
   - EventBridge rules forwarding critical events between regions
   - Cross-region event bus for disaster recovery coordination
   - Event replay capability for recovery scenarios

10. **Automated Testing**
    - Lambda function validating failover readiness every hour
    - Automated checks for resource synchronization
    - Health status reporting to CloudWatch

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **Route 53** for DNS failover with health checks
- Use **Aurora PostgreSQL Global Database** for data persistence
- Use **Lambda** functions for compute in both regions
- Use **DynamoDB** global tables for session state
- Use **S3** with cross-region replication for storage
- Use **CloudWatch** for monitoring and alarms
- Use **Step Functions** for failover orchestration
- Use **API Gateway** REST APIs in both regions
- Use **EventBridge** for cross-region event forwarding
- Use **SQS** queues for order processing
- Use **VPC** infrastructure in both regions with private subnets
- Use **VPC Peering** for cross-region communication
- Use **Systems Manager Parameter Store** for region-specific configs
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** (primary) and **us-east-2** (secondary) regions

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (RemovalPolicy.DESTROY, no RETAIN policies)
- Resource names must include **environmentSuffix** parameter for test environment isolation
- Multi-region support with separate stacks for primary and secondary regions
- Shared constructs for cross-region resources like Route 53 and Aurora Global Database
- IAM roles must support cross-region assume role capabilities
- Lambda deployment packages must be identical across regions

### Infrastructure Architecture

The solution requires VPCs in both regions with private subnets, VPC peering connections for cross-region communication, and proper security groups. The Aurora Global Database provides the primary data store with automatic replication. DynamoDB global tables handle session state with active-active replication.

Route 53 health checks monitor application endpoints and automatically update DNS records during failover. The Step Functions state machine orchestrates the entire failover process including promoting the Aurora read replica, updating Route 53 records, and draining connections from the failed region.

### Constraints

- Must achieve 99.99% uptime SLA
- Failover must complete within 60 seconds (RTO)
- Zero data loss requirement (RPO of 0)
- Support for automated failback after primary region recovery
- All cross-region traffic must be encrypted
- Proper error handling and logging at all layers
- Cost-optimized using serverless where possible

## Success Criteria

- **Functionality**: All 10 requirements fully implemented
- **Performance**: Failover completes within 60 seconds
- **Reliability**: Automated failover without manual intervention
- **Security**: Cross-region IAM roles, encrypted replication
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-tested, documented
- **Multi-Region**: Separate stacks for primary and secondary regions
- **Testing**: Automated validation of failover readiness

## What to deliver

- Complete CDKTF TypeScript implementation with separate stacks
- Primary region stack (us-east-1) with all infrastructure
- Secondary region stack (us-east-2) with replicated infrastructure
- Shared constructs for cross-region resources
- Lambda functions for trade processing and failover validation
- Step Functions state machine for failover orchestration
- Configuration files for region-specific settings
- Integration tests validating failover scenarios
- Cross-region validation tests
- Deployment scripts ensuring region synchronization
- Documentation and deployment instructions
