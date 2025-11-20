# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Python**
>
> Platform: **CDK**
> Language: **Python**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services startup needs to deploy their transaction processing web application with strict compliance requirements. The application requires high availability, automated database failover, and granular access controls for their development team.

## Problem Statement
Create a CDK Python program to deploy a containerized web application with blue-green deployment capabilities.

### MANDATORY REQUIREMENTS (Must complete):
1. Deploy ECS Fargate service with task definition using 2 vCPU and 4GB memory (CORE: ECS)
2. Create RDS Aurora PostgreSQL cluster with 2 instances across different AZs (CORE: RDS)
3. Configure Application Load Balancer with target group health checks every 30 seconds (CORE: ALB)
4. Implement weighted target groups for blue-green deployments (80/20 traffic split)
5. Set up VPC with 3 private subnets and 3 public subnets across 3 AZs
6. Create custom CloudWatch dashboard showing ECS task count and RDS connections
7. Configure automatic RDS snapshots with 7-day retention period
8. Output ALB DNS name and database endpoint for application configuration

### OPTIONAL ENHANCEMENTS (If time permits):
- Add custom domain with health checks (OPTIONAL) - provides branded URL and DNS failover
- Implement for database credentials (OPTIONAL) - improves credential security
- Add CloudFront distribution for static assets (OPTIONAL: CloudFront) - reduces latency globally

Expected output: Complete CDK Python stack that provisions production-ready web application infrastructure with blue-green deployment support and automated database backups.

## Constraints and Requirements
- All resources must use removal_policy=RemovalPolicy.DESTROY for easy cleanup
- ECS tasks must use awslogs driver with log group retention of 3 days
- RDS cluster must have deletion_protection=False for testing environments
- Security groups must follow least privilege with explicit port definitions
- All IAM roles must avoid wildcard permissions except for CloudWatch Logs
- Stack must include CfnOutput for all connection endpoints
- Database subnet group must span exactly 3 availability zones
- ALB must use internet-facing scheme with IPv4 addressing only

## Environment Setup
Production-grade web application infrastructure in us-east-1 using ECS Fargate for containers, RDS Aurora PostgreSQL for persistent storage, and Application Load Balancer for traffic distribution. Requires AWS CDK 2.x with Python 3.9+, Docker installed for container builds. Multi-AZ VPC setup with 6 subnets (3 public, 3 private) spanning availability zones us-east-1a, us-east-1b, and us-east-1c. NAT Gateways in each AZ for high availability. Production AWS account with appropriate IAM permissions for ECS, RDS, EC2, and CloudWatch services.

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
from aws_cdk import aws_s3 as s3, RemovalPolicy

bucket = s3.Bucket(self, "DataBucket",
    bucket_name=f"data-bucket-{environment_suffix}",  # CORRECT
    removal_policy=RemovalPolicy.DESTROY
)

# WRONG:
# bucket_name="data-bucket-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDK Python)
```python
from aws_cdk import RemovalPolicy

bucket = s3.Bucket(self, "DataBucket",
    removal_policy=RemovalPolicy.DESTROY,  # CORRECT
)

# WRONG:
# removal_policy=RemovalPolicy.RETAIN  # Will block cleanup
```

### Correct AWS Config IAM Role (CDK Python)
```python
from aws_cdk import aws_iam as iam

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
