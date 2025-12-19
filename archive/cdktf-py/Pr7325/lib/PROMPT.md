# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with py**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company requires a disaster recovery solution for their critical payment processing system. The primary region experienced a 4-hour outage last quarter, resulting in significant revenue loss. They need an automated failover mechanism that can switch traffic to a secondary region within minutes while maintaining data consistency.

## Problem Statement
Create a CDKTF Python program to implement a multi-region disaster recovery architecture for a payment processing system.

### MANDATORY REQUIREMENTS (Must complete):
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

### OPTIONAL ENHANCEMENTS (If time permits):
- Add Step Functions for orchestrating complex failover workflows (OPTIONAL: Step Functions) - improves failover coordination
- Implement AWS Config rules for compliance checking (OPTIONAL: Config) - ensures DR readiness
- Add X-Ray tracing across regions (OPTIONAL: X-Ray) - enhances troubleshooting during incidents

Expected output: CDKTF Python code that deploys a production-ready multi-region disaster recovery infrastructure with automated failover capabilities, meeting specified RPO/RTO requirements.

## Constraints and Requirements
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

## Environment Setup
Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary) regions. Utilizes Aurora Global Database for transactional data, DynamoDB Global Tables for session management, Lambda functions for payment processing logic, and EventBridge for event-driven workflows. Requires CDKTF 0.20+ with Python 3.9+, AWS CDK constructs library, and boto3 SDK. VPCs in both regions with private subnets across 3 AZs, VPC peering for cross-region communication, and NAT gateways for outbound traffic. Route 53 hosted zone for DNS failover management.

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - ✅ CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - ❌ WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `DependsOn` in CloudFormation, `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",  # ✅ CORRECT
    # ...
)

# ❌ WRONG:
# bucket="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",
    force_destroy=True,  # ✅ CORRECT - allows bucket deletion
    # ...
)

# ❌ WRONG:
# force_destroy=False  # Will block cleanup
```

### Correct AWS Config IAM Role (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment

config_role = IamRole(self, "ConfigRole",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "config.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)

IamRolePolicyAttachment(self, "ConfigRolePolicy",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  # ✅ CORRECT
)

# ❌ WRONG:
# policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole"  # Policy doesn't exist
# policy_arn="arn:aws:iam::aws:policy/AWS_ConfigRole"  # Missing service-role/ prefix
```

## Target Region
Primary resources should be deployed to: **us-east-1**
Secondary resources should be deployed to: **us-west-2**

## Success Criteria
- Infrastructure deploys successfully in both regions
- Aurora Global Database is operational with replication between regions
- DynamoDB global tables are configured and replicating
- Lambda functions are deployed in both regions
- Route 53 failover routing is configured with health checks
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
