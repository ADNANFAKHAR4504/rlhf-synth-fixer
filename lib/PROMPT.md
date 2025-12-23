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
Create a Pulumi program in Python to deploy consistent infrastructure across development, staging, and production environments. The configuration must:

1. Accept an Environment parameter with values dev, staging, or prod that controls resource sizing
2. Deploy RDS PostgreSQL instances with t3.micro for dev, t3.small for staging, and t3.medium for production, accessible only from application subnets through database security groups
3. Create Auto Scaling Groups with min/max instances of 1 to 2 for dev, 2 to 4 for staging, and 3 to 6 for production, connected to Application Load Balancers
4. Configure Application Load Balancers that route HTTPS traffic to EC2 instances in the Auto Scaling Groups with identical listener rules across all environments
5. Set up S3 buckets that receive transaction logs from the application servers with versioning enabled and lifecycle policies of 7 days for dev, 30 days for staging, 90 days for production
6. Implement security groups that allow HTTPS on port 443 from anywhere and database access only from application subnets
7. Use configuration mappings to handle AMI IDs for Amazon Linux 2 across three regions: us-east-1, us-west-2, eu-west-1
8. Apply consistent tagging including Environment, CostCenter with value FinTech, and DeploymentDate parameters
9. Create CloudWatch Alarms connected to EC2 instances for CPU utilization with environment-appropriate thresholds of 80% for dev and staging, 70% for prod
10. Export stack outputs for the ALB DNS name, RDS endpoint, and S3 bucket name for each environment

**Expected output**: A Pulumi Python program that can be deployed to create identical infrastructure across multiple environments and regions, with controlled variations based on the environment configuration while maintaining security and operational consistency.

## Constraints and Requirements
- Use Pulumi configuration to handle environment-specific variations
- Implement configuration validation for environment names: dev, staging, or prod
- Database instance types must be smaller in non-production environments
- Use dictionaries and mappings for region-specific AMI IDs across us-east-1, us-west-2, and eu-west-1
- All security groups must have identical rules across environments
- Support multi-region deployment capability
- Implement Pulumi stack outputs that expose environment-specific endpoints
- Tags must include Environment, CostCenter, and DeploymentDate across all resources
- Use explicit resource dependencies to ensure proper resource creation order
- Security groups should specify exact port numbers and CIDR ranges instead of wildcard access
- IAM roles should follow least privilege principle with specific actions rather than full access policies

## Environment Setup
Multi-environment AWS infrastructure spanning three regions: us-east-1, us-west-2, and eu-west-1 for a payment processing application. Each environment with values dev, staging, or prod requires:
- RDS PostgreSQL 13.7 that connects to application servers via private subnets
- EC2 instances in Auto Scaling Groups that send traffic through Application Load Balancers
- Application Load Balancers that distribute incoming HTTPS requests to backend EC2 instances
- S3 buckets that store transaction logs sent from application servers
- VPC configuration includes public subnets for ALBs and private subnets for application servers and databases
- CloudWatch that monitors EC2 CPU metrics and triggers alarms
- All environments must maintain identical security configurations while allowing controlled variations in instance sizing
- Requires AWS CLI configured with appropriate IAM permissions and Pulumi CLI installed

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the environmentSuffix variable in their names to support multiple PR environments
- Example: f-string formatting like myresource-{environment_suffix} or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Exception: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using protect=True unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All infrastructure should be deployed to the us-east-1 region

## Pulumi-Specific Guidelines
- Use Pulumi configuration files like Pulumi.yaml and per-stack yaml files for environment-specific settings
- Leverage Pulumi's dependency tracking instead of explicit DependsOn where possible
- Use Pulumi outputs to expose resource endpoints
- Structure code with clear separation of concerns: networking, compute, database, storage
- Include proper error handling and validation
