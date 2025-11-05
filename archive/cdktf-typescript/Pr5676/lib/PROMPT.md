# Provisioning of Infrastructure Environments

We need to set up a new PostgreSQL database for our production environment. I've been working on this migration for a while and wanted to document the requirements.

This needs to be implemented using cdktf with TypeScript in the eu-west-2 region. Please don't change the platform or language - we're standardized on this stack across all our teams.

Here's what I need to get done:

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

The goal is a production-ready RDS instance with all security, monitoring, and compliance configs in place, ready for data migration from our dev environment.

## Additional Context

We're a financial services company migrating our PostgreSQL database from dev to production. Data integrity is absolutely critical for us, and we need proper security and monitoring in place before we can go live.

Some constraints I need to keep in mind:
- Deploy the RDS instance in private subnets only (no public access)
- Never hardcode database credentials - use Secrets Manager
- All CloudWatch alarms should use the existing SNS topic
- Use CDK L2 constructs where possible, avoid L1 constructs
- Define security group rules using CIDR blocks, not security group references

We're running in eu-west-2 with an existing production VPC (vpc-prod-123456). The VPC has private subnets for RDS across 2 availability zones.

Tech-wise, we're running CDK 2.x with TypeScript, Node.js 16+, and AWS CLI configured with production credentials. This stack needs to integrate with our existing CloudWatch dashboards and SNS topics.

## Project-Specific Conventions

For resource naming, I need to make sure all resources use the `environmentSuffix` variable in their names to support multiple PR environments. Something like `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix should work.

For testing, integration tests should load stack outputs from `cfn-outputs/flat-outputs.json` and validate actual deployed resources.

One thing to keep in mind - infrastructure should be fully destroyable for CI/CD workflows. The only exception is secrets - those should be fetched from existing AWS Secrets Manager entries rather than created by the stack. Try to avoid using DeletionPolicy: Retain unless it's absolutely necessary.

Security wise, I need to implement encryption at rest and in transit, follow principle of least privilege for IAM roles, use AWS Secrets Manager for credential management where applicable, and enable appropriate logging and monitoring.

All resources should be deployed to eu-west-2.
