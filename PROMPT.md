# Environment Migration

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with typescript**
> 
> Platform: **pulumi**
> Language: **typescript**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to migrate an existing development environment from one AWS account to another with enhanced security configurations. The configuration must: 1. Create a new VPC with CIDR 10.0.0.0/16 in the target account with private and public subnets across 2 availability zones. 2. Set up RDS MySQL 8.0 instance in private subnets with automated backups enabled and 7-day retention. 3. Import existing database snapshot from source account S3 bucket and restore to new RDS instance. 4. Deploy two t3.medium EC2 instances in private subnets with Amazon Linux 2 AMI. 5. Configure security groups allowing MySQL traffic (3306) from EC2 instances to RDS only. 6. Create an S3 bucket with versioning enabled and configure cross-account replication from source bucket. 7. Set up VPC endpoints for S3 to avoid internet gateway traffic for bucket access. 8. Configure EC2 instance profiles with minimal IAM permissions for S3 bucket access. 9. Tag all resources with Environment=dev and MigrationDate=current date. 10. Output the new RDS endpoint, EC2 private IPs, and S3 bucket name. Expected output: The program should create all infrastructure components in the target account, successfully migrate data from the source environment, and return connection details for the migrated resources. All resources should be properly tagged and secured according to AWS best practices.

---

## Additional Context

### Background
A financial services company needs to migrate their legacy development environment to a new AWS account with improved security and network isolation. The existing environment consists of a single RDS MySQL database, two EC2 application servers, and an S3 bucket for static assets. They require a migration approach that minimizes downtime and preserves all data integrity.

### Constraints and Requirements
- [Must use AWS provider version 5.x or higher for Pulumi, RDS instance must use encrypted storage with AWS managed keys, EC2 instances must not have public IP addresses assigned, S3 bucket must have server-side encryption enabled with AES256, All inter-resource communications must stay within the VPC, Database migration must use snapshot method, not direct connection]

### Environment Setup
AWS migration scenario deployed in us-east-1 region. Requires two AWS accounts - source account with existing RDS MySQL database, EC2 instances, and S3 bucket containing application data. Target account needs Pulumi 3.x with TypeScript, AWS CLI configured with cross-account assume role permissions. Infrastructure includes VPC with 2 AZs, private subnets for RDS and EC2, public subnets for NAT gateways. Migration involves database snapshot transfer and S3 cross-account replication setup.

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
