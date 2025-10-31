# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to implement an automated backup verification and recovery system for RDS PostgreSQL instances. The configuration must: 1. Deploy a primary RDS PostgreSQL instance with automated backups enabled every 6 hours. 2. Configure point-in-time recovery with a 7-day retention window. 3. Create an S3 bucket with lifecycle policies to store manual snapshots for 30 days. 4. Implement a Lambda function that tests backup integrity by creating temporary restored instances weekly. 5. Set up CloudWatch alarms for backup failures and recovery time violations (RTO > 4 hours). 6. Configure SNS notifications for backup events and recovery test results. 7. Enable cross-region snapshot copying to ap-northeast-1 for disaster recovery. 8. Tag all resources with Environment, Owner, and CostCenter tags. 9. Implement IAM roles with least privilege for Lambda and RDS operations. 10. Create CloudWatch dashboard showing backup status, recovery test results, and storage costs. Expected output: A fully automated backup verification system that performs weekly recovery drills, maintains multiple recovery points across regions, and alerts operations team of any backup or recovery issues within 15 minutes of detection.

---

## Additional Context

### Background
A financial services company needs automated database backup verification and recovery testing for their critical PostgreSQL databases. The system must perform regular backup integrity checks and maintain multiple recovery points to meet compliance requirements.

### Constraints and Requirements
- [RDS instances must use db.t3.medium or smaller to minimize costs, Lambda functions must complete backup tests within 15-minute timeout, All data must be encrypted at rest using AWS KMS customer-managed keys, Network traffic between Lambda and RDS must stay within VPC, Backup retention must comply with 7-day point-in-time and 30-day snapshot requirements, Recovery tests must not impact production database performance]

### Environment Setup
Multi-region AWS deployment with primary infrastructure in ap-northeast-1 and DR replication to ap-northeast-1. Uses RDS PostgreSQL 15.x with automated backups, Lambda for backup testing automation, S3 for long-term snapshot storage, and CloudWatch/SNS for monitoring and alerting. Requires Pulumi 3.x with TypeScript, AWS CLI configured with appropriate permissions. VPC setup with private subnets for RDS instances and Lambda functions with VPC endpoints for AWS services.

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
