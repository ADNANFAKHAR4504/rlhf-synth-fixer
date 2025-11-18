# Multi-Region Payment Processing DR System

Hey team,

We've got a critical project from one of our financial services clients who processes payments at scale. They're handling 50,000 transactions per minute during peak times and need bulletproof disaster recovery. Right now, they're running in a single region and losing sleep over what happens if that region goes down. The business requirement is clear: 99.99% uptime with automatic failover to a secondary region within 60 seconds of any failure.

I've been tasked to build this using **Pulumi with Python**. The architecture team has mapped out a comprehensive multi-region active-passive setup that needs to span us-east-1 as primary and us-east-2 as the failover region.

The challenge here is making sure everything stays in sync between regions while keeping the secondary region ready to take over at a moment's notice. We're talking about payment processing here, so data consistency and zero transaction loss are non-negotiable. The system needs to handle both planned failovers for maintenance and unplanned outages without dropping a single transaction.

## What we need to build

Create a disaster recovery infrastructure using **Pulumi with Python** that implements active-passive failover across two AWS regions. The system must maintain complete infrastructure parity between regions and automatically route traffic to the healthy region.

### Core Infrastructure Requirements

1. **Multi-Region Setup**
   - Deploy identical stacks in us-east-1 (primary) and us-east-2 (secondary)
   - Tag all resources with Environment, Region-Role (Primary/Secondary), and DR-Tier
   - Ensure resource names include environmentSuffix for uniqueness across environments

2. **API Layer**
   - REST APIs using API Gateway in both regions
   - Custom domain names with ACM certificates for professional endpoints
   - Lambda functions handling payment processing logic deployed identically in both regions

3. **Data Layer**
   - DynamoDB global tables for transaction data with automatic replication
   - Point-in-time recovery enabled for all tables
   - S3 buckets with cross-region replication and replication time control enabled
   - SQS queues in both regions with Lambda-based message replication

4. **Failover Management**
   - Route 53 health checks monitoring primary region API Gateway
   - Failover routing policy to automatically switch DNS to secondary region
   - CloudWatch alarms for API latency, Lambda errors, and DynamoDB throttling
   - SNS topics for operations team notifications when failover occurs

5. **Monitoring and Visibility**
   - CloudWatch dashboard showing health metrics from both regions
   - Cross-region alarm configuration to trigger failover procedures
   - Centralized logging with proper retention policies

6. **Network Setup**
   - VPCs in each region with private subnets for Lambda functions
   - Proper security groups and network ACLs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Python 3.9+ runtime for Lambda functions
- Use Pulumi 3.x APIs and best practices
- Deploy to us-east-1 (primary) and us-east-2 (secondary)
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix

### Deployment Requirements (CRITICAL)

These requirements are essential for the synthetic testing environment:

1. **Resource Naming**: All resources MUST include environmentSuffix in their names. This ensures uniqueness across multiple concurrent deployments. Example: `payment-api-${environment_suffix}` or `transactions-table-${environment_suffix}`.

2. **Destroyability**: All resources must be fully destroyable with no retention policies or deletion protection. This is required for automated testing:
   - DynamoDB tables: No deletion protection
   - S3 buckets: Enable force destroy
   - Lambda functions: No reserved concurrency that could block deletion
   - CloudWatch log groups: Set retention period (7-14 days)
   - RDS instances (if used): skip_final_snapshot must be true

3. **Service-Specific Constraints**:
   - DO NOT create GuardDuty detectors - these are account-level resources that conflict in testing
   - CloudWatch log groups MUST have retention policies set (recommended 7-14 days)
   - For Python Lambda functions, use Python 3.9+ runtime

4. **ACM Certificate Caveat**: Custom domain names require ACM certificate validation via DNS records. In the testing environment, automatic validation may not be possible. Consider using default API Gateway endpoints for testing, or document the manual validation steps required.

5. **Multi-Region Coordination**: Ensure proper resource dependencies to avoid race conditions. Global tables and cross-region replication must be set up in the correct order.

### Constraints

- Multi-region deployment adds complexity - ensure proper resource ordering
- Certificate validation requires external DNS validation (may need manual steps)
- Global tables require DynamoDB streams - configure automatically
- Cross-region replication requires proper IAM permissions between regions
- Health checks need time to stabilize - set appropriate evaluation periods
- All resources must be tagged for cost allocation and disaster recovery tier identification

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in both regions with all services operational
- **Data Replication**: DynamoDB global tables replicate within seconds, S3 replication completes within 15 minutes
- **Failover**: Route 53 health checks detect failures and switch DNS within 60 seconds
- **Monitoring**: CloudWatch dashboard shows real-time health metrics from both regions
- **Notifications**: SNS alerts trigger when failover occurs or health checks fail
- **Resource Naming**: All resources include environmentSuffix and follow naming conventions
- **Destroyability**: Stack can be completely destroyed without manual intervention
- **Code Quality**: Clean Python code, well-structured, properly documented

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Lambda function code for payment processing (in lib/lambda/ or lib/functions/)
- Lambda function code for SQS message replication
- Multi-region provider configuration
- Infrastructure outputs including:
  - Route 53 hosted zone ID
  - Primary API Gateway endpoint URL
  - Secondary API Gateway endpoint URL
  - CloudWatch dashboard URL
  - DynamoDB global table name
  - S3 bucket names with replication configured
- Proper error handling and logging throughout
- Documentation of the architecture and failover process
