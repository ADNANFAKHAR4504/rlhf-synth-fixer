# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL: Use cdktf with TypeScript**
>
> Platform: **cdktf**
> Language: **ts**
> Region: **eu-west-2**
>
> Don't change the platform or language - stick with what's specified above.

---

We need to migrate an existing RDS PostgreSQL instance from dev to production. Here's what needs to happen:

1. Create a new RDS PostgreSQL instance in the production VPC with Multi-AZ deployment
2. Use db.t3.large instance type with 100GB encrypted storage
3. Set up automated backups (7-day retention) and enable deletion protection
4. Store database credentials in Secrets Manager with auto-rotation every 30 days
5. Configure CloudWatch alarms for:
   - CPU utilization over 80%
   - Storage space under 10GB free
   - Connection count over 90% of max
6. Create an SNS topic for database alerts and subscribe ops@company.com
7. Enable enhanced monitoring with 60-second granularity
8. Configure security groups to allow access only from application subnets (10.0.4.0/24 and 10.0.5.0/24)
9. Tag everything: Environment='production', Team='platform', CostCenter='engineering'
10. Create a parameter group for PostgreSQL 14 with shared_preload_libraries='pg_stat_statements'

The goal is a production-ready RDS instance with all security, monitoring, and compliance configs in place, ready for data migration from dev.

---

## Additional Context

### Background
We're a financial services company migrating our PostgreSQL database from dev to production. Data integrity is critical, and we need production-grade security and monitoring.

### Constraints and Requirements
- Deploy the RDS instance in private subnets only (no public access)
- Never hardcode database credentials - use Secrets Manager
- All CloudWatch alarms should use the existing SNS topic
- Use CDK L2 constructs where possible, avoid L1 constructs
- Define security group rules using CIDR blocks, not security group references

### Environment Setup
We're running in eu-west-2 with an existing production VPC (vpc-prod-123456). The VPC has private subnets for RDS across 2 availability zones.

Tech requirements: CDK 2.x with TypeScript, Node.js 16+, and AWS CLI configured with production credentials. This stack will integrate with our existing CloudWatch dashboards and SNS topics.

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
