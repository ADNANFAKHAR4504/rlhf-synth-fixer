# Multi-Region Disaster Recovery Architecture

Hey, we need to build a multi-region active-passive disaster recovery architecture for a transaction processing system. This is for a financial services company that requires 99.99% uptime with automated failover capabilities.

Create this infrastructure using **CDKTF with Python**.

## Background

A financial services company requires their transaction processing system to maintain 99.99% uptime with automated failover capabilities. The system must handle regional outages gracefully and ensure data consistency across regions. Recent AWS region outages have highlighted the need for true multi-region resilience.

## Infrastructure Requirements

### Mandatory Requirements (Must Complete)

1. **RDS Aurora Global Database** - Deploy Aurora Global Database with:
   - Primary cluster in us-east-1
   - Secondary cluster in us-west-2
   - Serverless v2 instances with minimum 0.5 ACUs to optimize costs during low traffic
   - Cross-region replication with RPO < 1 second using Aurora native replication
   - Deletion protection enabled on production resources with override mechanism

2. **Route53 Health Checks and Failover** - Configure:
   - Health checks that evaluate both database connectivity and replication lag before triggering failover
   - Automatic DNS failover between regions
   - Active-passive configuration

3. **Lambda Monitoring Functions** - Create Lambda functions in both regions to:
   - Monitor database health
   - Trigger failover when needed
   - Be idempotent and handle partial failures during regional outages
   - Support promotion of secondary region to primary within 60 seconds of failure detection

4. **Automated Backups** - Configure:
   - Point-in-time recovery enabled for 7 days
   - Backup retention for 7 days

5. **CloudWatch Monitoring** - Set up:
   - CloudWatch alarms for replication lag exceeding 500ms
   - SNS topics in both regions for failover notifications

6. **IAM Roles** - Implement:
   - Cross-region assume permissions for failover orchestration
   - Least privilege access

7. **Network Configuration** - Configure:
   - VPCs in both regions with private subnets across 3 AZs each
   - VPC peering between regions with appropriate security groups
   - All inter-region traffic encrypted in transit using AWS-managed certificates

### Optional Enhancements (If Time Permits)

- **DynamoDB Global Tables** - For session state replication to maintain user sessions during failover
- **Step Functions** - For orchestrated failover workflow providing visibility into failover process
- **AWS Backup** - For centralized backup management simplifying compliance reporting

## Environment and Technology

Multi-region AWS deployment spanning:
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2

Technologies:
- Python 3.8+
- CDKTF 0.15+
- AWS CDK constructs v10+

## Architecture Constraints

1. Aurora Global Database must use serverless v2 instances with minimum 0.5 ACUs to optimize costs during low traffic
2. Route53 health checks must evaluate both database connectivity and replication lag before triggering failover
3. Lambda functions must be idempotent and handle partial failures during regional outages
4. All inter-region traffic must be encrypted in transit using AWS-managed certificates
5. The solution must support promotion of secondary region to primary within 60 seconds of failure detection

## Deployment Requirements

- AWS credentials with permissions for multi-region resource creation including RDS, Route53, Lambda, VPC, and IAM services
- All resource names must include `environmentSuffix` variable for unique naming across deployments
- Resources must be destroyable (no retain policies except where required for production safety)

## Expected Output

CDKTF Python code that deploys a fully automated multi-region DR solution with:
- Sub-minute RTO (Recovery Time Objective)
- Near-zero RPO (Recovery Point Objective)
- Health monitoring
- Automatic failover capabilities

The infrastructure should be production-ready with proper security, monitoring, and compliance configurations.
