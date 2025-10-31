# Multi-Environment Consistency & Replication

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with yaml**
> 
> Platform: **cfn**
> Language: **yaml**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

```json
{background: A fintech startup needs to maintain identical infrastructure across development, staging, and production environments for their payment processing application. They require automated environment replication to ensure consistency and reduce configuration drift between environments., constraints: {count: 5, items: [All environments must use identical resource configurations except for instance sizes and capacity, Parameter names must follow the pattern {EnvironmentName}-{ResourceType}-{Property}, Each environment must have its own isolated VPC with non-overlapping CIDR ranges, Database snapshots from production must be automatically copied to lower environments weekly, All S3 buckets must include the environment name as a prefix to prevent naming conflicts]}, environment: AWS multi-environment deployment spanning us-east-1 for production, us-east-2 for staging, and us-west-2 for development. Infrastructure includes VPCs with public/private subnets across 2 AZs per environment, RDS Aurora MySQL for data persistence, ECS Fargate for containerized services, Application Load Balancers, and S3 for static assets. Each environment requires isolated networking with VPC peering for secure cross-environment communication. CloudFormation stack sets used for consistent deployment across regions., problem: Create a CloudFormation template to deploy a payment processing infrastructure that can be replicated across three environments (dev, staging, prod) with consistent configurations. The configuration must: 1. Define a master template that accepts an Environment parameter (dev/staging/prod) to control resource sizing and naming. 2. Create a VPC with environment-specific CIDR ranges (10.0.0.0/16 for prod, 10.1.0.0/16 for staging, 10.2.0.0/16 for dev). 3. Deploy an RDS Aurora MySQL cluster with environment-appropriate instance classes (db.r5.large for prod, db.t3.medium for staging/dev). 4. Set up an ECS cluster with Fargate services running a payment API container, with capacity based on environment. 5. Configure an Application Load Balancer with SSL certificates for each environment's domain. 6. Create S3 buckets for transaction logs with cross-region replication from prod to other environments. 7. Implement CloudWatch alarms with environment-specific thresholds for CPU, memory, and database connections. 8. Set up automated RDS snapshots with different retention periods per environment (30 days for prod, 7 days for others). 9. Configure security groups that allow inter-environment communication only through specific ports. 10. Output the ALB DNS names, database endpoints, and S3 bucket names for each deployed environment. Expected output: A single CloudFormation YAML template that uses parameters and conditions to deploy consistent infrastructure across all three environments, with appropriate resource sizing and naming conventions that clearly identify each environment while maintaining architectural parity., input_file: null}
```

---

## Additional Context

### Background
A fintech startup needs to maintain identical infrastructure across development, staging, and production environments for their payment processing application. They require automated environment replication to ensure consistency and reduce configuration drift between environments.

### Constraints and Requirements
- 1. All environments must use identical resource configurations except for instance sizes and capacity

### Environment Setup
AWS multi-environment deployment spanning us-east-1 for production, us-east-2 for staging, and us-west-2 for development. Infrastructure includes VPCs with public/private subnets across 2 AZs per environment, RDS Aurora MySQL for data persistence, ECS Fargate for containerized services, Application Load Balancers, and S3 for static assets. Each environment requires isolated networking with VPC peering for secure cross-environment communication. CloudFormation stack sets used for consistent deployment across regions.

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
