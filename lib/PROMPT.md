Hey team,

We need to build a disaster recovery system for our payment processing infrastructure. The business is concerned about regional outages and wants a multi-region setup that can failover automatically if our primary region goes down. I've been asked to create this using Python with CDKTF (CDK for Terraform). The payment processing team needs high availability guarantees since downtime directly impacts revenue.

The current payment system processes thousands of transactions per hour and any extended outage could cost the company millions. We've had a couple of close calls where regional AWS issues almost took us offline, so leadership wants a proper DR strategy in place. This needs to work across multiple AWS regions with automated failover capabilities.

We're looking at a setup where we have a primary region handling all traffic, with a secondary region that can take over if needed. The business wants near-zero data loss and minimal downtime during failover scenarios. They also need the ability to test failover procedures without impacting production traffic.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CDKTF with Python** for a payment processing system.

### Core Requirements

1. **Multi-Region Architecture**
   - Deploy infrastructure across primary and secondary AWS regions
   - Primary region (us-east-1) handles active traffic
   - Secondary region (us-west-2) serves as failover target
   - Resources must be synchronized between regions

2. **Data Replication and Persistence**
   - Set up cross-region database replication for payment data
   - Use DynamoDB global tables for transaction records
   - Configure S3 cross-region replication for audit logs and receipts
   - Ensure data consistency across regions

3. **Compute Layer with Auto-Failover**
   - Deploy Lambda functions in both regions for payment processing
   - Configure health checks and monitoring
   - Set up automatic failover routing based on health status
   - Ensure Lambda functions can access replicated data

4. **Traffic Management and Routing**
   - Implement Route53 health checks on primary region endpoints
   - Configure failover routing policy to secondary region
   - Set up CloudWatch alarms for health check failures
   - Define appropriate health check intervals and thresholds

5. **Monitoring and Alerting**
   - Create CloudWatch dashboards for both regions
   - Set up SNS topics for failover notifications
   - Configure alarms for replication lag and service health
   - Monitor Route53 health check status

6. **Security and Access Control**
   - Configure IAM roles with least privilege access
   - Enable encryption at rest for all data stores
   - Secure cross-region replication with appropriate permissions
   - Set up KMS keys in both regions

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **DynamoDB Global Tables** for cross-region data replication
- Use **S3 with Cross-Region Replication** for audit logs
- Use **Lambda** for payment processing logic
- Use **Route53** for DNS-based failover routing
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- Primary region: us-east-1
- Secondary region: us-west-2

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in their names
- All resources MUST be destroyable - use deletion_protection=False for databases
- NO resources with DeletionPolicy: Retain or similar retention policies
- All stacks must be fully removable without manual intervention
- Lambda functions should use Python 3.11 or 3.12 runtime
- Ensure all IAM roles have proper trust policies

### Constraints

- Payment data must never be lost during failover
- Replication lag should be monitored and kept minimal
- Failover should be automatic based on health checks
- System must support testing failover without production impact
- All resources must support complete teardown
- No manual cleanup steps should be required
- Follow AWS Well-Architected Framework for reliability

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in both regions
- **Data Replication**: DynamoDB global table replicates within seconds
- **Failover**: Route53 automatically routes to secondary when primary fails
- **Monitoring**: CloudWatch dashboards show health of both regions
- **Resource Naming**: All resources include environmentSuffix in names
- **Destroyability**: Complete stack can be destroyed without errors
- **Code Quality**: Clean Python code, well-tested, fully documented
- **Security**: Proper IAM roles, encryption enabled, secure replication

## What to deliver

- Complete CDKTF Python implementation
- DynamoDB Global Table configuration
- S3 buckets with cross-region replication
- Lambda functions for payment processing
- Route53 failover routing configuration
- CloudWatch monitoring and alarms
- SNS notification setup
- Unit tests for all components
- Integration tests for failover scenarios
- Documentation with deployment instructions
- Clear instructions for testing failover