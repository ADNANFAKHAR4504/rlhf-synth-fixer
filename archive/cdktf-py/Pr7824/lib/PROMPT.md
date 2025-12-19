# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using CDKTF for Terraform with Python.

---

## Background
A fintech startup needs to maintain identical infrastructure across development, staging, and production environments to ensure consistent testing and deployment workflows. They require automated infrastructure replication with environment-specific configurations while maintaining strict compliance with PCI-DSS standards for their payment processing systems.

## Problem Statement
Create a CDKTF Python program to deploy identical infrastructure across three AWS environments (dev, staging, prod) with environment-specific configurations. The configuration must:

1. Define a base component that creates API Gateway, Lambda functions, RDS PostgreSQL instance, DynamoDB table, and S3 bucket.
2. Use CDKTF construct class to encapsulate the shared infrastructure pattern.
3. Deploy Lambda functions with 256MB memory in dev, 512MB in staging, and 1024MB in production.
4. Configure RDS backup retention to 1 day (dev), 7 days (staging), and 30 days (production).
5. Set DynamoDB to on-demand billing for dev/staging and provisioned capacity (5 RCU, 5 WCU) for production.
6. Enable S3 versioning and lifecycle policies only in production environment.
7. Configure CloudWatch Logs retention periods based on environment requirements.
8. Use stack references to share VPC and subnet information between stacks.
9. Implement proper IAM roles with environment-specific permissions.
10. Apply consistent tagging scheme across all resources.
11. Use Secrets Manager for database passwords with automatic rotation enabled.
12. Output API Gateway URLs and database endpoints for each environment.

Expected output: Three separate CDKTF stacks (dev, staging, prod) with identical infrastructure topology but environment-specific configurations, demonstrating consistent resource naming, proper secret management, and clear separation of concerns between environments.

## Environment Setup
Multi-environment AWS infrastructure spanning three separate accounts (dev, staging, production) in us-east-1 region. Each environment contains API Gateway, Lambda functions for payment processing, RDS PostgreSQL 14.x databases, DynamoDB tables for session management, and S3 buckets for transaction logs.

**NOTE**: The original requirements mention Pulumi, but this MUST be implemented using CDKTF with Python. Adapt all Pulumi-specific concepts to CDKTF equivalents:
- Use CDKTF stack configuration instead of Pulumi config files
- Use CDKTF remote state data sources instead of Pulumi stack references
- Follow CDKTF patterns for multi-environment deployment

VPCs in each environment use 10.0.0.0/16, 10.1.0.0/16, and 10.2.0.0/16 CIDR blocks respectively, with private subnets for RDS and Lambda functions connected via VPC endpoints.

## Constraints and Requirements
- Implement environment-specific configuration using CDKTF context or variables (NOT Pulumi config files)
- All database passwords must be stored in AWS Secrets Manager
- RDS instances must have automated backups with environment-specific retention periods
- CloudWatch log retention must vary by environment (7 days dev, 30 days staging, 90 days prod)
- Lambda functions must use environment-specific memory allocations
- API Gateway stages must match environment names exactly
- Use CDKTF data sources or remote state to share common resources between environments (NOT Pulumi stack references)
- DynamoDB tables must use on-demand billing in dev/staging but provisioned capacity in production
- All resources must be tagged with Environment, CostCenter, and ManagedBy tags
- S3 buckets must have versioning enabled only in production

---

## Implementation Guidelines

### Platform Requirements
- Use CDKTF as the IaC framework
- All code must be written in Python
- Follow CDKTF best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming
- Create reusable constructs for shared infrastructure patterns

### Multi-Environment Strategy
For CDKTF multi-environment deployments, you have several options:

1. **Single Stack with Environment Parameter**: Use CDKTF variables or context to parameterize a single stack
2. **Multiple Stack Definitions**: Create separate stack classes for each environment
3. **Shared Constructs**: Build reusable Python classes that accept environment-specific config

Recommended approach: Create a base construct class that encapsulates the infrastructure pattern, then instantiate it for each environment with different configurations.

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
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) - Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) - Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) - Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) - Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost approximately $32/month each
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
- Verify dependencies are explicit
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.s3 import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",  # CORRECT
    # ...
)

# WRONG:
# bucket="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDKTF Python)
```python
from cdktf_cdktf_provider_aws.s3 import S3Bucket

bucket = S3Bucket(self, "DataBucket",
    bucket=f"data-bucket-{environment_suffix}",
    force_destroy=True,  # CORRECT - allows cleanup
    # ...
)

# WRONG:
# force_destroy=False  # Will block cleanup
```

### Environment-Specific Configuration (CDKTF Python)
```python
from constructs import Construct
from cdktf import TerraformStack

class EnvironmentStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment: str):
        super().__init__(scope, id)

        # Environment-specific config
        config = {
            "dev": {"lambda_memory": 256, "rds_retention": 1},
            "staging": {"lambda_memory": 512, "rds_retention": 7},
            "prod": {"lambda_memory": 1024, "rds_retention": 30}
        }

        env_config = config[environment]
        # Use env_config for resource properties
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully across all three environments
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Demonstrates proper CDKTF construct reuse pattern
- Environment-specific configurations are clearly separated
