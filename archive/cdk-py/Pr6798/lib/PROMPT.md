# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using cdk with py**
>
> Platform: **cdk**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company operates multiple AWS accounts for different business units. They need to establish secure network connectivity between their trading platform VPC and data analytics VPC while maintaining strict network isolation and compliance requirements.

## Problem Statement
Create a CDK Python program to establish secure VPC peering between a trading platform VPC and a data analytics VPC across different AWS accounts. The configuration must: 1. Create VPC peering connection between account A (trading) and account B (analytics) 2. Configure route tables in both VPCs to enable communication through the peering connection 3. Set up security groups that allow HTTPS (443) and PostgreSQL (5432) traffic only from specific CIDR blocks 4. Enable VPC Flow Logs with S3 storage and 5-minute capture intervals 5. Configure DNS resolution options for the peering connection 6. Implement Network ACLs that restrict traffic to only required subnets 7. Create IAM roles for cross-account peering acceptance 8. Set up CloudWatch alarms for unusual network traffic patterns 9. Configure VPC endpoints for S3 and DynamoDB to avoid internet routing 10. Enable AWS Config rules to monitor VPC peering compliance 11. Tag all resources with mandatory compliance tags 12. Output the peering connection ID and status for verification. Expected output: A fully deployed cross-account VPC peering setup with bidirectional connectivity between private subnets, comprehensive security controls, and monitoring. The stack should output the peering connection ID, route table IDs, and CloudWatch dashboard URL for network monitoring.

## Constraints and Requirements
- All resources must be tagged with CostCenter and Environment tags
- All traffic between VPCs must be encrypted using AWS PrivateLink where applicable
- Security groups must follow a whitelist approach with no 0.0.0.0/0 rules
- Route tables must be configured with least-privilege routing rules
- VPC Flow Logs must be enabled for all network interfaces
- Network traffic must not traverse the public internet
- Network ACLs must explicitly allow only required ports between specific subnets
- VPC peering connections must use non-overlapping CIDR blocks
- DNS resolution must work bidirectionally between peered VPCs
- The solution must support cross-account VPC peering

## Environment Setup
Multi-account AWS infrastructure deployed across us-east-1 and us-east-2 regions. Primary VPC hosts trading applications on ECS Fargate with RDS Aurora PostgreSQL backend. Secondary VPC contains data analytics workloads using EMR and S3. Both VPCs use private subnets across 3 availability zones with NAT gateways for outbound connectivity. Requires CDK 2.x with Python 3.9+, AWS CLI configured with appropriate cross-account assume role permissions. VPC CIDR ranges: 10.0.0.0/16 (trading) and 10.1.0.0/16 (analytics).

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in py
- Follow cdk best practices for resource organization
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
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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

### Correct Resource Naming (CDK Python)
```python
bucket = s3.Bucket(self, "DataBucket",
    bucket_name=f"data-bucket-{environment_suffix}",  # CORRECT
    # ...
)

# WRONG:
# bucket_name='data-bucket-prod'  # Hardcoded, will fail
```

### Correct Removal Policy (CDK Python)
```python
bucket = s3.Bucket(self, "DataBucket",
    removal_policy=RemovalPolicy.DESTROY,  # CORRECT
    # ...
)

# WRONG:
# removal_policy=RemovalPolicy.RETAIN  # Will block cleanup
```

### Correct AWS Config IAM Role (CDK Python)
```python
config_role = iam.Role(self, "ConfigRole",
    assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AWS_ConfigRole"  # CORRECT
        )
    ]
)

# WRONG:
# "service-role/ConfigRole"  # Policy doesn't exist
# "AWS_ConfigRole"  # Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
