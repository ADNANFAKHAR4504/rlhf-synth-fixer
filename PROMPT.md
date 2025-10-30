# Cloud Environment Setup

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-northeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a foundational AWS environment for a new production workload. The configuration must: 1. Create a VPC with CIDR block 10.0.0.0/16 spanning two availability zones. 2. Configure public subnets (10.0.1.0/24, 10.0.2.0/24) and private subnets (10.0.11.0/24, 10.0.12.0/24). 3. Set up an Internet Gateway and NAT Gateways (one per AZ) with appropriate route tables. 4. Deploy an Application Load Balancer in the public subnets with HTTP listener on port 80. 5. Create an Auto Scaling Group with t3.micro instances in private subnets (min: 2, max: 4). 6. Configure RDS PostgreSQL 14.x instance (db.t3.micro) in private subnets with automated backups. 7. Create an S3 bucket for application assets with versioning enabled and lifecycle policy. 8. Set up CloudWatch Log Groups for application and infrastructure logs with 7-day retention. 9. Configure security groups allowing only necessary traffic between components. 10. Create IAM roles for EC2 instances with permissions to access S3 bucket and CloudWatch Logs. Expected output: A fully functional AWS environment with isolated networking, auto-scaling compute resources, managed database, and object storage. All resources should be tagged with Environment: production and ManagedBy: pulumi tags.

---

## Additional Context

### Background
A startup needs to establish their first production environment on AWS. They require a standardized infrastructure setup that can be replicated for future environments. The setup should include networking, compute, storage, and database resources with proper security controls.

### Constraints and Requirements
- [Use Pulumi's AWS Classic provider (@pulumi/aws) version 6.x or higher, All resources must be created in ap-northeast-1 region, RDS instance must have encryption at rest enabled using AWS managed keys, S3 bucket must block all public access and use server-side encryption, EC2 instances must use Amazon Linux 2023 AMI, Auto Scaling Group must use launch template instead of launch configuration, All subnet route tables must be explicitly defined (no default associations), Security groups must follow least privilege principle with explicit egress rules, Use Pulumi stack outputs to export VPC ID, ALB DNS name, and S3 bucket name, Resource names must follow pattern: {resourceType}-{projectName}-{environment}]

### Environment Setup
AWS

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
All resources should be deployed to: **ap-northeast-1**
