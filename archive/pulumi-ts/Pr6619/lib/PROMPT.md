# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy consistent payment processing infrastructure across three environments (dev, staging, prod). The configuration must: 1. Define a reusable component that accepts environment-specific parameters while enforcing consistency. 2. Create VPCs with 10.0.0.0/16 CIDR in each environment with 3 private subnets. 3. Deploy RDS PostgreSQL instances with encryption using environment-specific KMS keys. 4. Set up Lambda functions with 512MB memory and environment-based reserved concurrency (dev: 10, staging: 50, prod: 200). 5. Configure API Gateway with custom domains and AWS WAF integration for prod only. 6. Create DynamoDB tables for transaction logs with on-demand billing and PITR enabled. 7. Establish S3 buckets for audit trails with versioning and lifecycle policies based on environment. 8. Implement IAM roles and policies ensuring least-privilege access with environment prefixes. 9. Configure CloudWatch log groups with environment-specific retention periods. 10. Set up CloudWatch alarms for RDS CPU usage with different thresholds per environment. 11. Export all resource ARNs and endpoints as stack outputs for cross-stack references. Expected output: A Pulumi program with an index.ts file containing reusable components and three separate stack configurations (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml) that demonstrate infrastructure consistency while allowing environment-specific variations in scaling, retention, and monitoring parameters.

---

## Additional Context

### Background
A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their payment processing system. They require strict consistency in security configurations, resource naming, and networking setup across all environments while allowing for environment-specific scaling parameters.

### Constraints and Requirements
- [All IAM roles must be prefixed with the environment name for clear identification, All environments must use identical VPC CIDR blocks with non-overlapping subnet ranges, CloudWatch log retention must be 7 days for dev, 30 days for staging, and 90 days for production, RDS instances must use encrypted storage with environment-specific KMS keys, API Gateway must use custom domain names following the pattern api-{env}.payments.internal, Lambda functions must have identical memory allocations but environment-based concurrency limits, S3 buckets must follow the naming convention payments-{env}-{purpose}-{random-suffix}, DynamoDB tables must have point-in-time recovery enabled in all environments]

### Environment Setup
Multi-environment AWS deployment spanning us-east-1 (production), us-east-2 (staging), and us-east-2 (development). Each environment requires a VPC with 3 availability zones, private subnets for RDS PostgreSQL instances, Lambda functions for payment processing, API Gateway for REST endpoints, DynamoDB for transaction logs, and S3 for audit trails. Infrastructure managed through Pulumi with TypeScript, requiring Node.js 18+ and AWS CLI configured with appropriate credentials for each environment. Each environment has dedicated AWS accounts with cross-account IAM roles for deployment.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-1**
