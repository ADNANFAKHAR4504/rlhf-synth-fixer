# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Python**
>
> Platform: **cdk**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDK Python program to deploy a payment processing system that maintains consistency across development, staging, and production environments. The configuration must:

1. Define a base stack class that accepts environment-specific parameters through CDK context
2. Create reusable constructs for API Gateway with Lambda integration, DynamoDB tables, and S3 buckets
3. Implement environment-specific configurations where DynamoDB uses on-demand billing for dev/staging but provisioned capacity (5 RCU, 5 WCU) for production
4. Configure S3 buckets with versioning and lifecycle rules that transition objects to Glacier after 90 days in production, 30 days in staging/dev
5. Set up Lambda functions with 512MB memory and 30-second timeout consistently across all environments
6. Configure API Gateway with throttling of 100 requests/second for dev, 1000 for staging, and 10000 for production
7. Create environment-specific KMS keys for encrypting DynamoDB tables and S3 buckets
8. Deploy CloudWatch alarms for Lambda errors and API Gateway 4xx/5xx rates only in staging and production
9. Implement CDK aspects to enforce mandatory tags: Environment, CostCenter, Owner, and DataClassification
10. Use a single app.py file that can deploy to any environment based on CDK context values
11. Ensure all IAM roles follow least-privilege principles with environment-specific resource ARNs
12. Configure SQS dead-letter queues with different retention periods: 3 days for dev, 7 days for staging, 14 days for production

Expected output: A complete CDK application with app.py, base stack class, custom constructs, and CDK aspects that can be deployed to any environment using context flags like 'cdk deploy -c env=production'. The solution should prevent configuration drift by centralizing all environment-specific values in a context configuration structure.

---

## Background

A financial services company needs to ensure their payment processing infrastructure is identical across development, staging, and production environments. They've experienced issues where configurations drift between environments, leading to failed deployments and security audit findings.

---

## Environment Setup

Multi-environment AWS deployment across us-east-1 (production), us-east-2 (staging), and us-east-1 (development). Each environment requires isolated VPCs with 3 availability zones, private subnets for compute resources, and public subnets for load balancers. Infrastructure includes API Gateway, Lambda functions for payment processing, DynamoDB for transaction storage, S3 for audit logs, and SQS for asynchronous processing. Requires Python 3.9+, AWS CDK 2.x, and AWS CLI configured with appropriate credentials for all three accounts.

---

## Constraints and Requirements

- Each environment must have its own KMS key for encryption
- Use CDK aspects to validate that all resources follow the company's tagging standards
- DynamoDB tables must use on-demand billing in dev/staging but provisioned capacity in production
- Implement a custom CDK construct for reusable payment processing components
- Lambda functions must have identical memory and timeout settings across all environments
- All S3 buckets must have versioning enabled and lifecycle policies
- Use CDK context values to parameterize environment-specific configurations
- API Gateway stages must use identical throttling rules except for rate limits
- CloudWatch alarms must be created only for staging and production environments

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in Python
- Follow CDK best practices for resource organization
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

---

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

---

## Code Examples (Reference)

### Correct Resource Naming (CDK Python)
```python
from aws_cdk import aws_s3 as s3, RemovalPolicy

bucket = s3.Bucket(self, "DataBucket",
    bucket_name=f"data-bucket-{environment_suffix}",  # ✅ CORRECT
    removal_policy=RemovalPolicy.DESTROY
)

# ❌ WRONG:
# bucket_name="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDK Python)
```python
from aws_cdk import RemovalPolicy

bucket = s3.Bucket(self, "DataBucket",
    removal_policy=RemovalPolicy.DESTROY,  # ✅ CORRECT
)

# ❌ WRONG:
# removal_policy=RemovalPolicy.RETAIN  # Will block cleanup
```

### Correct AWS Config IAM Role (CDK Python)
```python
from aws_cdk import aws_iam as iam

config_role = iam.Role(self, "ConfigRole",
    assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AWS_ConfigRole"  # ✅ CORRECT
        )
    ]
)

# ❌ WRONG:
# "service-role/ConfigRole"  # Policy doesn't exist
# "AWS_ConfigRole"  # Missing service-role/ prefix
```

---

## Target Region

All resources should be deployed to: **us-east-1**

---

## Success Criteria

- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Environment-specific configurations work correctly (dev, staging, production)
- CDK aspects validate all resources follow tagging standards
- No configuration drift between environments
