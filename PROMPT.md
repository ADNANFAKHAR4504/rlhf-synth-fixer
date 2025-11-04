# Multi-Environment Consistency & Replication

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **terraform**
> Language: **hcl**
> Region: **us-east-1**

---

## Background
Your company operates a SaaS platform that requires identical infrastructure across development, staging, and production environments. Recent deployment inconsistencies have caused production incidents when features worked in staging but failed in production due to configuration drift.

## Problem Statement

Create a Terraform configuration to deploy consistent infrastructure across three environments (development, staging, production) with controlled variations.

The configuration must:

1. Define a reusable module structure that accepts environment-specific parameters
2. Implement VPC creation with environment-specific CIDR blocks following the 10.X.0.0/16 pattern
3. Deploy an ECS Fargate service with environment-appropriate task definitions and resource allocations
4. Provision RDS PostgreSQL instances with environment-specific instance classes and backup retention periods
5. Create S3 buckets with consistent naming conventions and environment-specific KMS encryption keys
6. Configure ALB with proper target groups and health check settings for each environment
7. Set up CloudWatch log groups with environment-specific retention periods (7 days for dev, 30 for staging, 90 for production)
8. Implement proper tagging strategy with Environment, Project, and ManagedBy tags
9. Use data sources to reference existing Route53 hosted zones for each environment
10. Configure security groups that allow only necessary traffic between components

**Expected output:** A modular Terraform configuration with a main module and environment-specific tfvars files that ensure infrastructure consistency while allowing controlled variations. The configuration should prevent drift between environments and make it easy to promote changes from development through to production.

## Constraints and Requirements

1. Use Terraform workspaces to manage environment separation
2. All environment-specific values must be defined in separate tfvars files
3. Resource naming must include the environment prefix (dev-, stg-, prod-)
4. S3 buckets must use versioning and encryption with environment-specific KMS keys
5. RDS instances must use different instance classes per environment (t3.micro for dev, t3.small for staging, t3.medium for production)
6. Each environment must have its own VPC with identical CIDR block patterns (10.X.0.0/16 where X is 1 for dev, 2 for staging, 3 for production)

## Environment Setup

Three separate AWS environments (dev, staging, prod) deployed in us-east-1 region. Each environment contains:
- VPC with public and private subnets across 2 AZs
- Application Load Balancer
- ECS Fargate service running a containerized web application
- RDS PostgreSQL database in private subnets
- S3 bucket for static assets
- CloudWatch log groups
- Infrastructure managed through Terraform 1.5+ with remote state stored in S3
- Each environment uses dedicated AWS accounts with cross-account IAM roles for deployment
- Network architecture includes NAT gateways for outbound connectivity from private subnets

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for module structure and resource organization
- Ensure all resources use the `environment_suffix` variable for naming to support parallel deployments

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

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
