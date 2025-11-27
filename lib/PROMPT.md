# Provisioning of Infrastructure Environments

> ** CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup is migrating their payment processing infrastructure from a legacy on-premises setup to AWS. The existing system processes credit card transactions through webhooks and stores transaction history in PostgreSQL. The migration must maintain zero downtime and preserve all historical data while transitioning to cloud-native services.

## Problem Statement
Create a CDKTF Python program to orchestrate database migration from on-premises PostgreSQL to AWS Aurora. The configuration must:

1. Create Aurora PostgreSQL cluster with 2 reader instances in different AZs.
2. Set up DMS replication instance with source endpoint for on-premises database.
3. Configure DMS target endpoint pointing to Aurora cluster.
4. Create DMS migration task with full-load-and-cdc option.
5. Implement Route 53 hosted zone with weighted routing (100% to on-premises initially).
6. Store migration checkpoints in Parameter Store with versioning enabled.
7. Configure EventBridge rules to capture DMS task state changes.
8. Create Lambda function to update Route 53 weights during cutover.
9. Set up CloudWatch dashboard showing replication lag and database connections.
10. Implement rollback mechanism using Aurora backtrack feature.

Expected output: A CDKTF Python application that deploys complete migration infrastructure with automated cutover capabilities, monitoring dashboards, and rollback procedures to ensure zero-downtime database migration.

## Constraints and Requirements
- Use AWS DMS for database migration from on-premises PostgreSQL to RDS Aurora
- Implement blue-green deployment strategy with Route 53 weighted routing
- Configure DMS replication instance with at least 2 vCPUs and 8GB RAM
- Set up VPC peering between migration VPC and production VPC
- Enable Point-in-Time Recovery for Aurora with 7-day retention
- Use Parameter Store for storing migration state
- Configure CloudWatch alarms for DMS replication lag exceeding 60 seconds
- Implement AWS Backup for post-migration Aurora snapshots
- Use EventBridge to trigger Lambda notifications on migration events
- Set all resources with deletion_protection=False for rollback capability

## Environment Setup
Migration infrastructure deployed in us-east-1 with AWS Database Migration Service (DMS) for PostgreSQL to Aurora migration, Route 53 for DNS failover, and EventBridge for migration orchestration. Requires CDKTF 0.20+, Python 3.8+, AWS CLI configured with appropriate permissions. VPC setup includes migration subnet group, security groups for DMS replication, and VPC peering to production environment. Migration process monitors replication lag and automates cutover using Lambda functions triggered by EventBridge rules.

---

## Implementation Guidelines

### Platform Requirements
- Use CDKTF as the IaC framework
- All code must be written in Python
- Follow CDKTF best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

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
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  -  Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  -  Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  -  CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  -  WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
from cdktf_cdktf_provider_aws.s3 import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",  #  CORRECT
    # ...
)

#  WRONG:
# bucket="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.s3 import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    force_destroy=True,  #  CORRECT - allows resource deletion
    # ...
)

# WRONG: Not setting force_destroy will block cleanup
```

### Correct AWS Config IAM Role (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.iam import IamRole, IamRolePolicyAttachment

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

# WRONG:
# policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole"  # Policy doesn't exist
# policy_arn="arn:aws:iam::aws:policy/AWS_ConfigRole"  # Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
