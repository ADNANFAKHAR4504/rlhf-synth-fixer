# Multi-Environment Consistency & Replication

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Python**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company operates identical payment processing systems across development, staging, and production environments. Recent incidents where staging configurations differed from production led to failed deployments and customer impact. The team needs infrastructure templates that guarantee identical configurations across all environments while allowing only specific, controlled variations.

## Problem Statement
Create a Pulumi program (in Python) to deploy consistent infrastructure across development, staging, and production environments. The configuration must:

1. Accept an Environment parameter (dev/staging/prod) that controls resource sizing
2. Deploy RDS PostgreSQL instances with t3.micro for dev, t3.small for staging, and t3.medium for production
3. Create Auto Scaling Groups with min/max instances of 1/2 for dev, 2/4 for staging, and 3/6 for production
4. Configure Application Load Balancers with identical listener rules across all environments
5. Set up S3 buckets with versioning enabled and lifecycle policies (7 days for dev, 30 days for staging, 90 days for production)
6. Implement security groups that allow HTTPS (443) from anywhere and database access only from application subnets
7. Use configuration/mappings to handle AMI IDs for Amazon Linux 2 across three regions (us-east-1, us-west-2, eu-west-1)
8. Apply consistent tagging including Environment, CostCenter (FinTech), and DeploymentDate parameters
9. Create CloudWatch Alarms for CPU utilization with environment-appropriate thresholds (80% for dev/staging, 70% for prod)
10. Export stack outputs for the ALB DNS name, RDS endpoint, and S3 bucket name for each environment

**Expected output**: A Pulumi Python program that can be deployed to create identical infrastructure across multiple environments and regions, with controlled variations based on the environment configuration while maintaining security and operational consistency.

## Constraints and Requirements
- Use Pulumi configuration to handle environment-specific variations
- Implement configuration validation for environment names (dev/staging/prod)
- Database instance types must be smaller in non-production environments
- Use dictionaries/mappings for region-specific AMI IDs across us-east-1, us-west-2, and eu-west-1
- All security groups must have identical rules across environments
- Support multi-region deployment capability
- Implement Pulumi stack outputs that expose environment-specific endpoints
- Tags must include Environment, CostCenter, and DeploymentDate across all resources
- Use explicit resource dependencies to ensure proper resource creation order

## Environment Setup
Multi-environment AWS infrastructure spanning three regions (us-east-1, us-west-2, eu-west-1) for a payment processing application. Each environment (dev, staging, prod) requires:
- RDS PostgreSQL 13.7
- EC2 instances in Auto Scaling Groups
- Application Load Balancers
- S3 buckets for transaction logs
- VPC configuration includes public subnets for ALBs and private subnets for application servers and databases
- All environments must maintain identical security configurations while allowing controlled variations in instance sizing
- Requires AWS CLI configured with appropriate IAM permissions and Pulumi CLI installed

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `f"myresource-{environment_suffix}"` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using protect=True unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-1**

## Pulumi-Specific Guidelines
- Use Pulumi configuration (Pulumi.yaml and Pulumi.<stack>.yaml) for environment-specific settings
- Leverage Pulumi's dependency tracking instead of explicit DependsOn where possible
- Use Pulumi outputs to expose resource endpoints
- Structure code with clear separation of concerns (networking, compute, database, storage)
- Include proper error handling and validation
