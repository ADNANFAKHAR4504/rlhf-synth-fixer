# Provisioning of Infrastructure Environments

> ** CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **eu-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Python program to orchestrate a zero-downtime migration of a payment processing system from on-premises to AWS. The configuration must: 1. Set up dual VPCs (production and migration) with Transit Gateway connectivity 2. Deploy RDS Aurora PostgreSQL clusters with read replicas in both regions 3. Configure DMS replication instances with full-load and CDC for database migration 4. Create API Gateway endpoints that can route traffic between old and new systems 5. Implement Lambda functions to validate data consistency during migration 6. Set up Step Functions state machines to control the migration phases 7. Configure S3 buckets to store migration checkpoints and rollback states 8. Deploy CloudWatch dashboards to monitor replication lag and error rates 9. Create SNS topics and subscriptions for alerting the operations team 10. Implement automated rollback mechanisms using Lambda and Step Functions 11. Configure Secrets Manager with automatic rotation for all credentials 12. Set up Parameter Store hierarchies for environment-specific configurations. Expected output: A complete Pulumi program that creates all infrastructure components with proper dependencies, outputs the migration state machine ARN, API Gateway endpoints, and monitoring dashboard URL. The program should support both forward migration and rollback operations through configuration flags.

---

## Additional Context

### Background
A financial services company needs to migrate their payment processing infrastructure from their legacy on-premises data center to AWS. The existing system handles millions of transactions daily and requires strict compliance with PCI-DSS standards. The migration must be performed with zero downtime and full rollback capabilities.

### Constraints and Requirements
- [Use Step Functions to orchestrate the migration workflow, Use AWS Transit Gateway for network connectivity between migrated and legacy components, Implement AWS Database Migration Service (DMS) for real-time database replication, Configure AWS Secrets Manager rotation for all database credentials, Implement CloudWatch Logs with metric filters for migration monitoring, Implement SNS topics for migration status notifications, Deploy Lambda functions for data validation between old and new systems, Deploy API Gateway with custom authorizers for authentication during transition, Use Parameter Store for environment-specific configuration values, Configure S3 buckets with versioning for migration state backups]

### Environment Setup
Production-ready infrastructure deployed across eu-central-1 and eu-central-2 for the migration process. The setup includes VPCs in both regions with Transit Gateway connecting to on-premises networks via VPN. Core services include RDS Aurora PostgreSQL clusters, API Gateway, Lambda functions for validation, DMS replication instances, and Step Functions for orchestration. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate IAM permissions. The infrastructure spans multiple availability zones with private subnets for databases and compute resources, public subnets for NAT gateways, and dedicated subnets for DMS replication instances.

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
All resources should be deployed to: **eu-central-1**
