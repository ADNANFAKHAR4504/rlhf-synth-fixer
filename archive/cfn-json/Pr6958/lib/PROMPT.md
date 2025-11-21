# Multi-Region Disaster Recovery Solution for Payment Processing System

## Platform Requirements
**MANDATORY**: This task MUST be implemented using **CloudFormation with JSON**.
- Platform: CloudFormation
- Language: JSON
- DO NOT use any other IaC tool (CDK, Terraform, Pulumi, etc.)
- DO NOT use YAML format

## Task Overview
Create a CloudFormation template to implement a multi-region disaster recovery solution for a payment processing system.

## Business Context
A financial services company requires a disaster recovery solution for their critical payment processing application. The primary region hosts the production workload, while a secondary region must maintain a warm standby configuration that can be activated within minutes during an outage. The solution must replicate data continuously and allow for automated failover testing.

## Architecture Overview
Multi-region disaster recovery deployment spanning us-east-1 (primary) and us-west-2 (secondary). Architecture includes Lambda functions for payment processing, DynamoDB global tables for transaction data, S3 buckets with cross-region replication for audit logs. Route 53 manages DNS failover between regions with health checks monitoring application endpoints. CloudFormation stacks deployed independently in each region with parameter-based configuration. VPCs not required as all services are managed. Requires AWS CLI configured with appropriate IAM permissions for multi-region deployments.

## MANDATORY REQUIREMENTS (Must complete)

1. Create Lambda functions in both regions with identical code but region-specific environment variables (CORE: Lambda)
2. Set up DynamoDB global tables with on-demand billing and point-in-time recovery (CORE: DynamoDB)
3. Configure S3 buckets in both regions with versioning and cross-region replication
4. Implement Route 53 hosted zone with weighted routing policy and health checks
5. Deploy secrets with cross-region replication for API keys
6. Create CloudWatch alarms monitoring Lambda errors and DynamoDB throttling
7. Configure SNS topics for failover notifications with email subscriptions
8. Set Lambda reserved concurrent executions to 100 per function
9. Export critical resource ARNs as stack outputs for cross-stack references

## OPTIONAL ENHANCEMENTS (If time permits)

- Add AWS Backup for automated DynamoDB table backups (OPTIONAL: AWS Backup) - provides additional data protection
- Implement EventBridge rules for automated failover triggers (OPTIONAL: EventBridge) - enables event-driven DR workflows
- Add CloudWatch Synthetics canaries for endpoint monitoring (OPTIONAL: CloudWatch Synthetics) - improves health check accuracy

## Technical Constraints

- Use AWS Lambda functions with environment-specific configurations in both regions
- Implement cross-region replication for S3 buckets storing transaction logs
- Configure Route 53 health checks with automatic DNS failover
- Set up DynamoDB global tables with point-in-time recovery enabled
- Use with automatic cross-region replication
- Implement CloudWatch alarms with SNS notifications for failover events
- Ensure all Lambda functions use Python 3.11 runtime
- Configure Lambda reserved concurrent executions to prevent throttling
- Use stack exports for cross-stack references within each region

## Expected Output

A CloudFormation template in JSON format that deploys the complete disaster recovery infrastructure. The template should use parameters for region-specific configurations and include conditions for primary vs secondary region deployments. All resources must be tagged with Environment and Region tags.

## Critical Implementation Notes

1. **Resource Naming**: ALL named resources MUST include `EnvironmentSuffix` parameter to avoid conflicts:
   - Example: `PaymentProcessor-${EnvironmentSuffix}`
   - Use `Fn::Sub` intrinsic function for string substitution

2. **Destroyability**: ALL resources MUST be destroyable:
   - S3 buckets: No special retention policies needed (cleanup handled post-review)
   - DynamoDB: Set `DeletionPolicy: Delete` (default)
   - Lambda: No retention policies
   - DO NOT use `DeletionPolicy: Retain`

3. **Multi-Region Deployment**:
   - Deploy separate stacks in us-east-1 and us-west-2
   - Use parameters to distinguish primary vs secondary region
   - Implement conditions for region-specific resource configurations
   - WARNING: Verify regions are DIFFERENT (not same region twice)

4. **Lambda Functions**:
   - Runtime: Python 3.11
   - Reserved concurrent executions: 100
   - Include placeholder code or reference to separate Lambda code packages
   - Environment variables should differentiate between regions

5. **DynamoDB Global Tables**:
   - Use AWS::DynamoDB::GlobalTable resource (not individual tables)
   - Configure replicas for both us-east-1 and us-west-2
   - Enable point-in-time recovery
   - Use on-demand billing mode

6. **S3 Cross-Region Replication**:
   - Create source bucket in primary region
   - Create destination bucket in secondary region
   - Configure replication rules with IAM role for replication
   - Enable versioning on both buckets (required for CRR)

7. **Route 53 Health Checks and Failover**:
   - Create health checks for application endpoints in both regions
   - Configure weighted routing policy or failover routing
   - Set appropriate health check thresholds

8. **Secrets Manager Cross-Region Replication**:
   - Create primary secret in us-east-1
   - Configure replica in us-west-2
   - Use for API keys and sensitive configuration

9. **CloudWatch Monitoring**:
   - Create alarms for Lambda errors and invocation counts
   - Create alarms for DynamoDB throttling events
   - Link alarms to SNS topics for notifications

10. **SNS Topics**:
    - Create topic in each region for failover notifications
    - Configure email subscriptions (use parameter for email address)

11. **Cost Optimization**:
    - Use Lambda for compute (serverless)
    - DynamoDB on-demand billing
    - No NAT Gateways required (all managed services)
    - Consider using VPC endpoints if Lambda needs VPC access

12. **Known Issues to Avoid**:
    - DO NOT create GuardDuty detectors (account-level resource conflict)
    - DO NOT use incorrect AWS Config IAM policy names
    - Ensure Lambda has proper IAM permissions for cross-service access
    - Test CloudFormation template validation before deployment

## Testing and Validation

After implementation:
1. Validate CloudFormation template syntax
2. Deploy to us-east-1 (primary)
3. Deploy to us-west-2 (secondary)
4. Verify DynamoDB replication between regions
5. Test S3 cross-region replication
6. Verify Route 53 health checks are functioning
7. Test failover scenario by stopping resources in primary region
8. Validate CloudWatch alarms trigger appropriately
