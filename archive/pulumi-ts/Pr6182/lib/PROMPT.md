# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Task Description

Create a Pulumi TypeScript program to deploy a payment processing infrastructure that maintains consistency across development, staging, and production environments. 

The configuration must:

1. Define a base infrastructure component class that can be instantiated for each environment
2. Create VPCs with identical CIDR patterns (10.{env}.0.0/16 where env=1 for dev, 2 for staging, 3 for prod)
3. Deploy an ECS Fargate service running a containerized API with environment-specific task counts (dev: 1, staging: 2, prod: 4)
4. Set up RDS PostgreSQL instances with environment-appropriate sizes (dev: db.t3.micro, staging: db.t3.small, prod: db.t3.medium)
5. Configure Application Load Balancers with SSL certificates from ACM for staging and production only
6. Create S3 buckets with lifecycle rules (dev: 7 days, staging: 30 days, prod: 90 days retention)
7. Implement CloudWatch alarms for CPU and memory metrics on ECS tasks (staging/prod only)
8. Use Pulumi config to manage all environment-specific values without hardcoding
9. Generate outputs for ALB URLs, RDS endpoints, and S3 bucket names for each environment
10. Ensure all resources are tagged with Environment and ManagedBy tags

**Expected output**: A Pulumi program that can be deployed to three different stacks (dev, staging, prod) using `pulumi up -s <environment>`, creating identical infrastructure topology with environment-appropriate configurations. The program should demonstrate proper separation of concerns between shared infrastructure code and environment-specific settings.

---

## Background

A fintech startup needs to maintain identical infrastructure across development, staging, and production environments for their payment processing platform. They've chosen Pulumi to ensure consistent deployments while allowing environment-specific configurations through stack configuration files.

---

## Environment Setup

Multi-environment AWS infrastructure spanning three separate accounts (dev, staging, prod) in **us-east-1 region**. Each environment requires its own VPC with public and private subnets across 2 availability zones. 

Core services include:
- Application Load Balancer
- ECS Fargate for containerized services
- RDS PostgreSQL for data persistence
- S3 for object storage
- CloudWatch for monitoring

Requirements:
- Pulumi 3.x with TypeScript
- AWS CLI configured with appropriate credentials for each environment
- Stack configuration files manage environment-specific parameters like instance sizes, retention periods, and feature flags

---

## Constraints and Requirements

- All three environments must share the same core infrastructure components but with different sizing
- Environment-specific configurations must be managed through Pulumi config files, not hardcoded
- Database passwords must be stored in AWS Secrets Manager and referenced dynamically
- Each environment must have its own isolated VPC with identical CIDR block patterns
- Resource naming must follow the pattern: {environment}-{service}-{resource-type}
- Production must use multi-AZ RDS deployment while dev/staging use single-AZ
- All S3 buckets must have versioning enabled and lifecycle policies that vary by environment
- CloudWatch alarms must be created only for staging and production environments

---

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
