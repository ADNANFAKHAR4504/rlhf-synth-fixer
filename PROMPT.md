# Multi-Environment Consistency & Replication

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json**
> 
> Platform: **cfn**  
> Language: **json**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

```json
{background: A financial services company needs to maintain identical infrastructure configurations across their development, staging, and production environments. They've experienced configuration drift issues where manual changes in one environment weren't replicated to others, causing deployment failures and security vulnerabilities., constraints: {count: 7, items: [Use CloudFormation StackSets to deploy across multiple AWS accounts, All environment-specific values must be parameterized, RDS database instances must have automated backups enabled with 7-day retention, Each environment must use a separate VPC with identical CIDR block patterns, Application Load Balancers must use AWS Certificate Manager for SSL/TLS, All S3 buckets must have versioning enabled and lifecycle policies configured, CloudWatch alarms must monitor CPU utilization and send notifications to environment-specific SNS topics]}, environment: Multi-account AWS setup with three environments (dev, staging, prod) deployed across us-east-1 region. Each environment uses a dedicated AWS account within an AWS Organization. Infrastructure includes VPC with public/private subnets across 2 AZs, Application Load Balancer, Auto Scaling Group with EC2 instances, RDS MySQL database in private subnet, S3 buckets for static assets. Requires AWS CLI configured with StackSets permissions, CloudFormation service role with cross-account access. Each environment VPC uses /16 CIDR blocks (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod)., problem: Create a CloudFormation template to deploy a web application infrastructure that maintains consistency across development, staging, and production environments. The configuration must: 1. Define parameters for environment name, instance type, database size, and CIDR blocks. 2. Create a VPC with two public and two private subnets across different availability zones. 3. Deploy an Application Load Balancer in public subnets with HTTPS listener using ACM certificate. 4. Set up an Auto Scaling Group with EC2 instances in private subnets, using environment-appropriate instance types. 5. Create an RDS MySQL instance in private subnets with Multi-AZ deployment for production only. 6. Configure S3 buckets with environment-prefixed names for application logs and static content. 7. Implement CloudWatch alarms for high CPU usage (>80%) on EC2 instances. 8. Create SNS topics for alarm notifications with environment-specific email endpoints. 9. Use Conditions to enable/disable features based on environment (e.g., Multi-AZ for prod only). 10. Output the ALB DNS name, RDS endpoint, and S3 bucket names for application configuration. Expected output: A single CloudFormation JSON template that can be deployed via StackSets to create identical infrastructure across multiple AWS accounts, with environment-specific configurations controlled through parameters and conditions., input_file: null}
```

---

## Additional Context

### Background
A financial services company needs to maintain identical infrastructure configurations across their development, staging, and production environments. They've experienced configuration drift issues where manual changes in one environment weren't replicated to others, causing deployment failures and security vulnerabilities.

### Constraints and Requirements
- 1. Use CloudFormation StackSets to deploy across multiple AWS accounts

### Environment Setup
Multi-account AWS setup with three environments (dev, staging, prod) deployed across us-east-1 region. Each environment uses a dedicated AWS account within an AWS Organization. Infrastructure includes VPC with public/private subnets across 2 AZs, Application Load Balancer, Auto Scaling Group with EC2 instances, RDS MySQL database in private subnet, S3 buckets for static assets. Requires AWS CLI configured with StackSets permissions, CloudFormation service role with cross-account access. Each environment VPC uses /16 CIDR blocks (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod).

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
