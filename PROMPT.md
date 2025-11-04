# Multi-Environment Consistency & Replication

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
> 
> Platform: **Terraform**  
> Language: **HCL**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using Terraform with HCL syntax.

---

## Background

Your company's e-commerce platform needs identical infrastructure across development, staging, and production environments. The DevOps team requires a single Terraform configuration that can deploy consistent infrastructure while allowing environment-specific variations like instance sizes and resource naming.

## Problem Statement

Create a Terraform configuration to deploy identical infrastructure across three environments (dev, staging, prod). The configuration must:

1. Define a reusable module structure that accepts environment-specific variables
2. Create VPCs with consistent CIDR blocks (10.0.0.0/16) but different AZ mappings per environment
3. Deploy an ALB in public subnets with target groups pointing to EC2 instances
4. Configure Auto Scaling Groups with environment-appropriate instance types (t3.micro for dev/staging, t3.large for prod)
5. Set up RDS MySQL instances with different sizes (db.t3.micro for dev/staging, db.t3.large for prod)
6. Create S3 buckets with environment-prefixed names for static content
7. Implement consistent security groups allowing HTTP/HTTPS from internet and MySQL from app tier
8. Use Terraform workspaces to manage state separation between environments
9. Define outputs that display ALB DNS names and RDS endpoints for each environment

Expected output: A modular Terraform configuration with main.tf, variables.tf, outputs.tf, and separate .tfvars files for each environment that ensures infrastructure consistency while allowing controlled variations.

## Constraints and Requirements

- All environments must share the same base infrastructure components
- Resource names must include the environment prefix (dev-, stg-, prod-)
- Production must use larger instance sizes than dev/staging
- Each environment requires its own state file stored in S3
- Variables must be organized in separate .tfvars files per environment
- All environments must use the same VPC CIDR blocks but different availability zones
- Tags must include Environment and ManagedBy keys for all resources

## Environment Setup

AWS multi-environment deployment across us-east-1 region using separate VPCs for dev, staging, and production. Each environment consists of Application Load Balancer, Auto Scaling Group with EC2 instances, RDS MySQL database, and S3 buckets for static assets. Terraform 1.5+ required with AWS provider 5.x. State files stored in S3 with DynamoDB locking. Each VPC spans 2 availability zones with public and private subnets.

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- **CRITICAL**: Ensure all resources use the `environment_suffix` variable for naming (NOT environmentSuffix)
- Note: For this synthetic task, use a single unified environment instead of separate dev/staging/prod deployments

### Multi-Environment Implementation Note
**IMPORTANT**: While the task describes dev/staging/prod environments, for this synthetic infrastructure task:
- Implement a SINGLE deployment using the `environment_suffix` variable
- The `environment_suffix` will be provided by the CI/CD system (e.g., "-pr123")
- Do NOT create multiple workspace configurations or .tfvars files for dev/staging/prod
- Focus on making the infrastructure reusable through variables rather than multiple deployments

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
- Avoid deletion protection or retain policies unless absolutely required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environment_suffix
- Infrastructure can be cleanly destroyed
