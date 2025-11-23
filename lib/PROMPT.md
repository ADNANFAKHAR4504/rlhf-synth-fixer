# Multi-Region Disaster Recovery Architecture for Payment Processing System

## Task ID: v8o3w5

## Platform and Language
**MANDATORY**: Use **CDKTF with Python** for all infrastructure code.

## Task Overview
Create a CDKTF Python program to implement a multi-region disaster recovery architecture for a payment processing system.

## Business Context
A financial services company requires a disaster recovery solution for their critical payment processing system. The primary region experienced a 4-hour outage last quarter, resulting in significant revenue loss. They need an automated failover mechanism that can switch traffic to a secondary region within minutes while maintaining data consistency.

## Architecture Details
Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary) regions. Utilizes Aurora Global Database for transactional data, DynamoDB Global Tables for session management, Lambda functions for payment processing logic, and EventBridge for event-driven workflows. Requires CDKTF 0.20+ with Python 3.9+, AWS CDK constructs library, and boto3 SDK. VPCs in both regions with private subnets across 3 AZs, VPC peering for cross-region communication, and NAT gateways for outbound traffic. Route 53 hosted zone for DNS failover management.

## Mandatory Requirements (Must Complete)

1. Create Aurora Global Database cluster with writer in us-east-1 and reader in us-west-2, using db.r5.large instances (CORE: Aurora)
2. Configure DynamoDB global tables for session data with on-demand billing and point-in-time recovery (CORE: DynamoDB)
3. Deploy identical Lambda functions in both regions for payment processing with 1GB memory allocation (CORE: Lambda)
4. Implement Route 53 failover routing with health checks pointing to primary region by default
5. Set up EventBridge rules in both regions to replicate critical events cross-region
6. Configure AWS Backup plans with cross-region copy for Aurora snapshots (daily backups, 7-day retention)
7. Create CloudWatch dashboards in both regions showing RDS metrics, Lambda invocations, and DynamoDB consumed capacity
8. Implement IAM roles with cross-region assume role permissions for disaster recovery automation
9. Use Systems Manager Parameter Store to manage database endpoints and API keys consistently across regions
10. Configure CloudWatch alarms for database replication lag exceeding 60 seconds

## Optional Enhancements (If Time Permits)

- Add Step Functions for orchestrating complex failover workflows (OPTIONAL: Step Functions) - improves failover coordination
- Implement AWS Config rules for compliance checking (OPTIONAL: Config) - ensures DR readiness
- Add X-Ray tracing across regions (OPTIONAL: X-Ray) - enhances troubleshooting during incidents

## Implementation Hints

- Use Route 53 health checks with failover routing policy for automatic DNS failover
- Implement DynamoDB global tables with point-in-time recovery enabled
- Configure Aurora Global Database with automated backtracking to 72 hours
- Deploy Lambda functions in both regions with identical configurations and environment variables
- Use EventBridge global endpoints for cross-region event replication
- Implement AWS Backup with cross-region copy for all stateful resources
- Configure CloudWatch cross-region dashboards for unified monitoring
- Use Systems Manager Parameter Store with secure string parameters for secrets
- Set RPO (Recovery Point Objective) of 5 minutes and RTO (Recovery Time Objective) of 15 minutes
- Implement automated failover testing using Systems Manager Automation documents

## Expected Output
CDKTF Python code that deploys a production-ready multi-region disaster recovery infrastructure with automated failover capabilities, meeting specified RPO/RTO requirements.

## Complexity Level
Expert

## Subtask Category
Failure Recovery and High Availability > Failure Recovery Automation

## Critical Requirements

### Resource Naming
- ALL named resources MUST include `environment_suffix` variable
- Example: `f"payment-processor-{environment_suffix}"`

### Destroyability
- NO Retain deletion policies
- Set `skip_final_snapshot=True` for RDS resources
- Ensure all resources can be cleanly destroyed

### Multi-Region Considerations
- Verify regions us-east-1 and us-west-2 are different (required for disaster recovery)
- Cross-region references require explicit ARNs or exports
- Test cross-region connectivity and replication
