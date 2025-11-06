# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using terraform with hcl**
> 
> Platform: **terraform**  
> Language: **hcl**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Terraform configuration to deploy identical infrastructure across development, staging, and production environments using workspace-based configuration. The configuration must: 1. Define a VPC module that creates non-overlapping CIDR blocks (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod). 2. Deploy an ECS Fargate cluster with environment-appropriate resource allocations. 3. Create RDS Aurora PostgreSQL clusters with automated backups enabled for all environments. 4. Configure ALB with path-based routing to ECS services. 5. Set up S3 buckets with versioning and lifecycle policies for audit logs. 6. Use tfvars files for each workspace to manage environment-specific configurations. 7. Implement consistent resource naming using ${terraform.workspace}-${resource_type}-${name} pattern. 8. Configure remote state backend with workspace-aware state file paths. 9. Create outputs that display environment-specific endpoints and resource identifiers. 10. Use count or for_each to create environment-appropriate number of ECS tasks (1 for dev, 2 for staging, 3 for prod). Expected output: A modular Terraform configuration with main.tf, variables.tf, outputs.tf, and separate tfvars files for each environment. The configuration should allow seamless switching between environments using terraform workspace select commands while maintaining complete infrastructure parity with only size and scale differences.

---

## Additional Context

### Background
A fintech startup needs to maintain identical infrastructure across development, staging, and production environments for their payment processing platform. They've experienced configuration drift between environments causing testing failures and production incidents.

### Constraints and Requirements
- [Use Terraform workspaces to manage the three environments, All environment-specific values must use workspace-aware variables, RDS instance classes must differ by environment (t3.micro for dev, t3.small for staging, t3.medium for prod), Use consistent naming conventions with environment prefixes for all resources, Implement remote state storage with environment-specific state files, VPC CIDR blocks must not overlap between environments, Apply identical security group rules across all environments, Use data sources to reference existing Route53 hosted zones, Tag all resources with Environment, ManagedBy, and Project tags, ALB target group health check intervals must scale with environment criticality]

### Environment Setup
Multi-environment AWS infrastructure spanning three separate but architecturally identical environments in us-east-1. Each environment consists of a VPC with public and private subnets across 2 AZs, Application Load Balancer, ECS Fargate cluster running containerized payment processing services, RDS Aurora PostgreSQL for transaction data, and S3 buckets for audit logs. Requires Terraform 1.5+ with HCL, AWS provider 5.x, configured AWS credentials with permissions for VPC, ECS, RDS, ALB, and S3. Remote state backend using S3 with DynamoDB table for state locking.

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
All resources should be deployed to: **ap-southeast-1**
