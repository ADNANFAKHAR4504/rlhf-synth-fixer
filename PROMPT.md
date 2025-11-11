# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts**
>
> Platform: **cdktf**
> Language: **ts**
> Region: **ap-southeast-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Terraform configuration to deploy consistent payment processing infrastructure across three environments. The configuration must: 1. Define a reusable module structure for VPC, RDS, S3, and EC2 resources. 2. Configure workspace-specific variable files (dev.tfvars, staging.tfvars, prod.tfvars). 3. Create VPCs with environment-appropriate CIDR blocks and 2 public/private subnet pairs. 4. Deploy RDS PostgreSQL instances with environment-specific sizing and backup retention. 5. Configure S3 buckets with consistent naming and environment-specific lifecycle rules. 6. Set up EC2 instances with consistent security groups but environment-specific instance types. 7. Implement a tagging module that applies standard tags to all resources. 8. Use data sources to reference existing Route53 hosted zones for each environment. 9. Configure RDS subnet groups and parameter groups consistently across environments. 10. Ensure all security groups follow least-privilege principles with environment-specific adjustments. Expected output: A modular Terraform configuration with separate directories for modules and environment configurations, workspace-aware resource definitions, and tfvars files that control environment-specific parameters while maintaining structural consistency.

---

## Additional Context

### Background
A fintech startup needs to ensure their payment processing infrastructure is identical across development, staging, and production environments. Recent deployment issues have highlighted inconsistencies in resource configurations between environments, leading to production failures.

### Constraints and Requirements
- [Use Terraform workspaces to manage the three environments (dev, staging, prod), All environment-specific values must be defined in separate tfvars files, RDS instances must use different instance classes based on environment (db.t3.micro for dev, db.t3.small for staging, db.r5.large for prod), Each environment must have its own VPC with identical CIDR blocks but different IP ranges, Use consistent resource naming with environment prefixes (e.g., dev-payment-api, staging-payment-api), Implement resource tagging strategy that includes Environment, Application, and CostCenter tags, All S3 buckets must have versioning enabled and lifecycle policies that vary by environment, Use Terraform modules to ensure consistent resource definitions across environments]

### Environment Setup
Multi-environment AWS infrastructure spanning three separate workspaces (dev, staging, prod) deployed in us-east-1. Each environment includes VPC with public/private subnets across 2 AZs, RDS PostgreSQL instances, S3 buckets for application data, and EC2 instances running payment processing applications. Requires Terraform 1.5+, AWS provider 5.x. Each environment has isolated VPCs with CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16). Network architecture includes NAT gateways for private subnet outbound traffic and VPC endpoints for S3 access.

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
All resources should be deployed to: **ap-southeast-2**
