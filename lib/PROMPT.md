# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts**
> 
> Platform: **cdktf**  
> Language: **ts**  
> Region: **eu-west-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF program to migrate an existing RDS PostgreSQL instance from development to production environment. The configuration must: 1. Create a new RDS PostgreSQL instance in the production VPC with Multi-AZ deployment enabled. 2. Configure the instance with db.t3.large instance type and 100GB of encrypted storage. 3. Set up automated backups with a 7-day retention period and enable deletion protection. 4. Store database credentials in AWS Secrets Manager with automatic rotation every 30 days. 5. Configure CloudWatch alarms for CPU utilization (>80%), storage space (<10GB free), and connection count (>90% of max). 6. Create an SNS topic for database alerts and subscribe ops@company.com to receive notifications. 7. Enable enhanced monitoring with 60-second granularity. 8. Configure security groups to allow access only from application subnets (10.0.4.0/24 and 10.0.5.0/24). 9. Add tags for Environment='production', Team='platform', and CostCenter='engineering'. 10. Create a parameter group based on PostgreSQL 14 with shared_preload_libraries='pg_stat_statements'. Expected output: A CDKTF stack that provisions the production RDS instance with all security, monitoring, and compliance configurations applied, ready for data migration from the development database.

---

## Additional Context

### Background
A financial services company needs to migrate their PostgreSQL database from a development environment to production. The migration must maintain data integrity while implementing production-grade security and monitoring configurations.

### Constraints and Requirements
- [The RDS instance must be deployed in private subnets without public accessibility, Database credentials must never be hardcoded and should use Secrets Manager for storage, All CloudWatch alarms must use existing SNS topic for notifications, The solution must use CDK L2 constructs where available, avoiding L1 constructs, Security group rules must be defined using CIDR blocks, not security group references]

### Environment Setup
Production environment in eu-west-2 with existing VPC (vpc-prod-123456) containing private subnets for RDS deployment across 2 availability zones. Requires CDK 2.x with TypeScript, Node.js 16+, and AWS CLI configured with production credentials. The stack will integrate with existing CloudWatch dashboards and SNS topics for centralized monitoring.

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
All resources should be deployed to: **eu-west-2**
