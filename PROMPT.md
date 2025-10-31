# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to implement an automated disaster recovery solution for a PostgreSQL RDS instance. The configuration must: 1. Deploy a primary RDS PostgreSQL instance in ap-southeast-2 with automated backups enabled. 2. Create a read replica in ap-southeast-2 for disaster recovery purposes. 3. Configure S3 buckets in both regions for storing database backup snapshots with versioning enabled. 4. Implement Lambda functions to monitor database health and trigger failover procedures. 5. Set up SNS topics for alerting on database failures and recovery events. 6. Create Route 53 health checks to monitor the primary database endpoint. 7. Configure automated snapshot copying between regions with a 7-day retention policy. 8. Implement a Lambda-based failover mechanism that promotes the read replica when health checks fail. 9. Set up CloudWatch alarms for monitoring replication lag and database performance metrics. 10. Configure IAM roles and policies for Lambda functions to manage RDS operations. Expected output: A fully functional Pulumi program that deploys a multi-region PostgreSQL database with automated failover capabilities, health monitoring, and alerting mechanisms that can recover from regional failures within 15 minutes.

---

## Additional Context

### Background
A financial services company needs to implement automated disaster recovery for their critical PostgreSQL database. The system must ensure minimal data loss and quick recovery time objectives (RTO) while maintaining cost efficiency.

### Constraints and Requirements
- [RDS instances must be encrypted at rest using AWS KMS keys, Read replica must have a maximum replication lag of 60 seconds, Lambda functions must complete failover operations within 5 minutes, S3 buckets must use cross-region replication for backup redundancy, All resources must be tagged with Environment, Owner, and DR-Role tags]

### Environment Setup
Multi-region AWS deployment spanning ap-southeast-2 (primary) and ap-southeast-2 (DR) regions. Uses RDS PostgreSQL 14.x with db.t3.medium instances, S3 for backup storage, Lambda for automation logic, and Route 53 for DNS failover. Requires Pulumi 3.x with TypeScript, AWS CLI configured with appropriate credentials. VPC setup with private subnets for RDS instances in both regions, security groups allowing replication traffic between regions.

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
