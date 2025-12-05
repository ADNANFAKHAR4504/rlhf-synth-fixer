# CI/CD Pipeline Integration

> WARNING CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL
>
> Platform: **Terraform (tf)**
> Language: **HCL**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A software development team needs to automate their infrastructure deployments using GitOps principles. They want Terraform configurations stored in CodeCommit to automatically trigger infrastructure updates through CodePipeline, with proper state management and approval gates for production changes.

## Problem Statement
Create a Terraform configuration to deploy a CI/CD pipeline that automatically applies Terraform configurations stored in AWS CodeCommit. The configuration must:

1. Create a CodeCommit repository named 'infrastructure-code' to store Terraform configurations.
2. Set up an S3 bucket for Terraform state files with versioning and a 30-day lifecycle policy for non-current versions.
3. Configure a DynamoDB table for state locking with on-demand billing mode.
4. Deploy a CodePipeline with three stages: terraform-plan, manual-approval, and terraform-apply.
5. Create CodeBuild projects for running terraform plan and terraform apply commands with Terraform 1.5.x.
6. Configure IAM roles for CodePipeline and CodeBuild with minimal required permissions.
7. Set up a customer-managed KMS key for encrypting pipeline artifacts.
8. Create an SNS topic for approval notifications with email subscription.
9. Configure CodePipeline to trigger on commits to the main branch of CodeCommit.
10. Add environment variables to CodeBuild for Terraform backend configuration.
11. Ensure all resources are tagged with Environment=Production and ManagedBy=Terraform.
12. Output the CodeCommit clone URL and pipeline ARN.

Expected output: A complete Terraform configuration that creates a GitOps pipeline where developers can push Terraform code to CodeCommit, which triggers an automated plan stage, waits for manual approval via SNS notification, then applies the changes. The pipeline should handle Terraform state management securely with locking.

## Constraints and Requirements

### Mandatory Constraints
- All S3 buckets must have versioning enabled and lifecycle policies
- CodeBuild projects must use specific Terraform version 1.5.x
- IAM roles must follow least privilege principle with explicit service assumptions

### Optional Requirements
- CodePipeline must have separate stages for plan, manual approval, and apply
- Use S3 backend with DynamoDB table for Terraform state locking
- Pipeline artifacts must be encrypted using customer-managed KMS keys
- CodeBuild environment must use Linux containers with standard 5.0 image
- Manual approval stage must send notifications to SNS topic

## Environment Setup
AWS infrastructure in us-east-1 region for CI/CD pipeline automation using CodePipeline, CodeBuild, and CodeCommit. Requires Terraform 1.5.x with HCL syntax. S3 backend configuration with DynamoDB for state locking. IAM roles for service integrations between CodePipeline, CodeBuild, and other AWS services. KMS encryption for artifacts. SNS topic for approval notifications. No VPC requirements as CodeBuild runs in AWS-managed infrastructure.

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environment_suffix` variable for naming

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
- **MANDATORY**: All named resources MUST include `environment_suffix` in their names
- Pattern: `{resource-name}-${var.environment_suffix}`
- Examples:
  - S3 Bucket: `my-bucket-${var.environment_suffix}`
  - Lambda Function: `my-function-${var.environment_suffix}`
  - DynamoDB Table: `my-table-${var.environment_suffix}`
- **Validation**: Every resource with a `name`, `bucket`, `function_name`, `table_name`, `role_name`, `queue_name`, `topic_name`, `stream_name`, `cluster_name`, or `db_instance_identifier` property MUST include environment_suffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `prevent_destroy = true` in lifecycle blocks
  - `deletion_protection = true` (RDS, DynamoDB)
  - `skip_final_snapshot = false` (RDS) → Use `skip_final_snapshot = true`
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
- **Reserved Concurrency**: Avoid setting `reserved_concurrent_executions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: `runtime_version = "syn-nodejs-puppeteer-7.0"`
  - WRONG: `runtime_version = "syn-nodejs-puppeteer-5.1"` (deprecated)

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
- Verify dependencies are explicit (use `depends_on` in Terraform)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Terraform HCL)
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"  # CORRECT
}

# WRONG:
# bucket = "data-bucket-prod"  # Hardcoded, will fail
```

### Correct Lifecycle Configuration (Terraform HCL)
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"

  # Allow destruction for CI/CD cleanup
  lifecycle {
    prevent_destroy = false  # CORRECT
  }
}

# WRONG:
# lifecycle { prevent_destroy = true }  # Will block cleanup
```

### Correct AWS Config IAM Role (Terraform HCL)
```hcl
resource "aws_iam_role" "config_role" {
  name = "config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  # CORRECT
}

# WRONG:
# policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"  # Policy doesn't exist
# policy_arn = "arn:aws:iam::aws:policy/AWS_ConfigRole"  # Missing service-role/ prefix
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environment_suffix
- Infrastructure can be cleanly destroyed
