# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDKTF Python program to implement automated security compliance monitoring and remediation.

### MANDATORY REQUIREMENTS (Must complete):

1. Deploy AWS Config with an aggregator in us-east-1 that collects data from us-east-1, us-west-2, and eu-west-1 (CORE: Config)
2. Create custom Config rules that check S3 bucket encryption and versioning status (CORE: Config)
3. Implement Lambda-based auto-remediation that enables versioning and KMS encryption on non-compliant buckets
4. Configure AWS Security Hub with CIS AWS Foundations Benchmark enabled
5. Set up GuardDuty in all three regions with findings exported to Security Hub
6. Create IAM account password policy with specified complexity requirements
7. Implement CloudWatch log group for all remediation actions with 90-day retention
8. Apply mandatory tags to all resources using CDKTF aspects
9. Create SNS topic for critical compliance violations
10. Ensure all Lambda functions use ARM64 architecture and Python 3.9 runtime

### OPTIONAL ENHANCEMENTS (If time permits):

- Add AWS Systems Manager automation documents for complex remediation workflows (OPTIONAL: SSM) - enables multi-step remediation
- Implement EventBridge rules to trigger custom actions on specific findings (OPTIONAL: EventBridge) - improves response automation
- Add AWS Organizations SCPs for preventive controls (OPTIONAL: Organizations) - prevents policy violations

Expected output: CDKTF Python code that deploys a complete security compliance framework with automated monitoring, detection, and remediation capabilities across multiple AWS regions.

---

## Background

A financial services company requires automated security compliance for their AWS infrastructure. They need to implement detective controls that identify non-compliant resources and enforce security policies through automated remediation. The solution must track configuration changes and maintain an audit trail for regulatory compliance.

---

## Environment Setup

Production security compliance infrastructure deployed in us-east-1 as the aggregator region, with Config and Security Hub enabled across us-east-1, us-west-2, and eu-west-1. Uses AWS Config for continuous monitoring, Systems Manager for automated remediation, Lambda for custom compliance checks, and Security Hub for centralized findings. Requires CDKTF 0.20+ with Python 3.9+, AWS CLI configured with appropriate permissions. Infrastructure includes Config aggregator, custom Config rules with remediation, GuardDuty detectors, and Security Hub standards subscriptions. CloudWatch Logs for audit trails with 90-day retention.

---

## Constraints and Requirements

- All S3 buckets must have versioning enabled and server-side encryption with AWS KMS
- IAM password policy must enforce minimum 14 characters, uppercase, lowercase, numbers, and symbols
- Security Hub must aggregate findings from GuardDuty and Config across all regions
- Config rules must automatically remediate non-compliant resources within 5 minutes
- All remediation actions must be logged to a centralized CloudWatch log group
- Lambda functions for remediation must use ARM64 architecture for cost optimization
- All resources must be tagged with CostCenter, Environment, and ComplianceLevel tags

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
from cdktf import TerraformStack, TerraformVariable
from imports.aws.s3_bucket import S3Bucket

class MyStack(TerraformStack):
    def __init__(self, scope, id, environment_suffix):
        super().__init__(scope, id)

        # ✅ CORRECT
        bucket = S3Bucket(self, "DataBucket",
            bucket=f"data-bucket-{environment_suffix}"
        )

        # ❌ WRONG:
        # bucket = S3Bucket(self, "DataBucket",
        #     bucket="data-bucket-prod"  # Hardcoded, will fail
        # )
```

### Correct Removal Policy (CDKTF Python)
```python
from imports.aws.s3_bucket import S3Bucket

# ✅ CORRECT - CDKTF resources are auto-deleted unless force_destroy is set
bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",
    force_destroy=True  # Allows deletion with objects inside
)

# ❌ WRONG: lifecycle prevent_destroy
# lifecycle = {
#     "prevent_destroy": True  # Will block cleanup
# }
```

### Correct AWS Config IAM Role (CDKTF Python)
```python
from imports.aws.iam_role import IamRole
from imports.aws.iam_role_policy_attachment import IamRolePolicyAttachment

config_role = IamRole(self, "ConfigRole",
    name=f"config-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "config.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)

# ✅ CORRECT
IamRolePolicyAttachment(self, "ConfigRolePolicy",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
)

# ❌ WRONG:
# policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole"  # Policy doesn't exist
# policy_arn="arn:aws:iam::aws:policy/AWS_ConfigRole"  # Missing service-role/ prefix
```

## Target Region
All resources should be deployed to: **us-east-1** (aggregator region), with Config and GuardDuty in us-east-1, us-west-2, and eu-west-1

## Success Criteria
- Infrastructure deploys successfully across all three regions
- All security and compliance constraints are met
- Config aggregator properly collects data from all regions
- Security Hub aggregates findings from GuardDuty and Config
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
