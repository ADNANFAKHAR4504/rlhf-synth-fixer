# Multi-Environment Infrastructure Consistency Framework

## Platform and Language
**CRITICAL CONSTRAINT**: This infrastructure MUST be implemented using **Terraform with HCL**.

## Background
A financial services company needs to maintain identical infrastructure configurations across development, staging, and production environments. They require automated drift detection and remediation to ensure compliance and reduce configuration inconsistencies that have led to production incidents.

## Task Description
Create a Terraform configuration to implement a multi-environment infrastructure consistency framework.

## MANDATORY REQUIREMENTS (Must complete)

1. Define reusable Terraform modules for a three-tier application with ALB, ECS Fargate, and RDS Aurora PostgreSQL (CORE: ECS, RDS)
2. Implement workspace-based environment separation for dev, staging, and prod
3. Create S3 backend configuration with state locking via DynamoDB (CORE: S3, DynamoDB)
4. Configure remote state data sources to share outputs between environments
5. Implement validation rules using precondition blocks to enforce naming conventions
6. Create variable definitions with environment-specific overrides using .tfvars files
7. Configure provider aliases for cross-region resource replication
8. Implement resource tagging strategy with mandatory environment and cost-center tags

## OPTIONAL ENHANCEMENTS (If time permits)

- Add CodeCommit repository for centralized module versioning (OPTIONAL: CodeCommit) - improves module governance
- Implement EventBridge rules for state change notifications (OPTIONAL: EventBridge) - enables real-time drift alerts
- Create Step Functions workflow for automated remediation (OPTIONAL: Step Functions) - automates consistency enforcement

## Expected Output
A Terraform configuration with workspace-based multi-environment setup, reusable modules, and state management that ensures infrastructure consistency across all environments.

## Constraints

1. All resources must use consistent naming convention: {environment}-{service}-{resource-type}
2. State files must be encrypted at rest using S3 bucket encryption with AWS-managed keys
3. Each module must have input validation to prevent invalid configurations
4. Provider configurations must use assume_role for cross-account access where applicable
5. All data-tier resources must have automated backup configurations with environment-specific retention
6. Network ACLs and security groups must be defined as code with no hardcoded IP addresses
7. Module outputs must be explicitly defined for all resources that other modules depend on
8. Terraform version constraints must be specified in all modules using required_version

## Environment

Multi-environment AWS deployment across us-east-1 (prod), us-west-2 (staging), and eu-west-1 (dev). Each environment requires VPC with 3 availability zones, public and private subnets, NAT gateways, and internet gateways. Infrastructure includes Application Load Balancer, ECS Fargate cluster running containerized services, and RDS Aurora PostgreSQL Multi-AZ cluster. S3 backend for Terraform state with DynamoDB table for state locking. Requires Terraform 1.5+ with AWS provider 5.x. Each environment must maintain identical resource configurations with only size and replica count variations.

## Critical Requirements

### Resource Naming (MANDATORY)
ALL named resources MUST include the environmentSuffix variable:
```hcl
resource "aws_s3_bucket" "example" {
  bucket = "${var.resource_prefix}-${var.environment_suffix}"
}
```

### Destroyability (MANDATORY)
- NO resources with deletion protection
- NO retain policies
- All resources must be easily destroyable for testing
- S3 buckets should allow force destroy

### AWS Service Considerations
- GuardDuty: Do not create detector (account-level limitation)
- AWS Config: Use correct IAM policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- Lambda: Ensure Node.js 18+ compatibility if using Lambda
- RDS: Set skip_final_snapshot = true for destroyability

## Complexity
expert
