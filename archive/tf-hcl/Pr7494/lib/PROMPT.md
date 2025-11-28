# Database Migration Infrastructure

Hey team,

We've been tasked with migrating our legacy on-premises inventory management system to AWS. The current setup is a monolithic architecture running PostgreSQL 13.x with about 500GB of data, plus roughly 2TB of product images stored on local file systems. The business needs a phased migration approach that lets us minimize downtime and provides a clear rollback path if things go sideways.

The migration window is tight - we have 4 hours to execute, and we need to preserve all existing database schemas, indexes, and stored procedures. The application team is already preparing container-based deployments on ECS Fargate, so our infrastructure needs to support that target architecture while handling the migration from the legacy system.

This is a production migration in us-east-1, and we're using a blue-green deployment pattern to enable zero-downtime cutover. The source database is on-premises PostgreSQL 13.x, and we're targeting RDS Aurora PostgreSQL on the AWS side. All data must be encrypted at rest using customer-managed KMS keys, and we need continuous replication set up through DMS to keep the databases in sync during the migration.

## What we need to build

Create infrastructure for migrating an on-premises inventory system to AWS using **Terraform with HCL**. The solution must support phased cutover with continuous replication, comprehensive monitoring, and rollback capabilities.

### Core Requirements

1. **Database Infrastructure**
   - RDS Aurora PostgreSQL cluster with Multi-AZ deployment for high availability
   - Automated backups with appropriate retention policies
   - Parameter groups and option groups matching source database configuration
   - DB subnet group across multiple availability zones

2. **Migration Service Configuration**
   - AWS Database Migration Service (DMS) replication instance
   - DMS source endpoint for on-premises PostgreSQL
   - DMS target endpoint for Aurora PostgreSQL
   - DMS replication task with full load plus CDC for continuous replication
   - Proper task settings for PostgreSQL schema/index/stored procedure preservation

3. **Storage Infrastructure**
   - S3 bucket with versioning enabled for file migration
   - Lifecycle policies for cost optimization (transition to IA, Glacier)
   - Bucket policy and encryption configuration

4. **Network Security**
   - VPC with 3 availability zones, public and private subnets
   - Security groups restricting traffic between DMS, source, and target
   - Security group for RDS allowing only necessary application and DMS access
   - Security group for DMS replication instance

5. **Monitoring and Alerting**
   - CloudWatch dashboard showing replication lag, error rates, and cutover readiness
   - CloudWatch alarms for DMS replication lag thresholds
   - CloudWatch alarms for Aurora metrics (CPU, connections, storage)
   - SNS topic for migration event notifications
   - SNS subscriptions for alert delivery

6. **Security and Encryption**
   - KMS customer-managed keys for RDS encryption
   - KMS customer-managed keys for S3 encryption
   - IAM roles with least privilege for DMS replication instance
   - IAM policies for DMS to access source and target endpoints

7. **Tagging and Organization**
   - All resources tagged with Environment, MigrationPhase, and CostCenter
   - Consistent naming convention with environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora PostgreSQL** for target database with Multi-AZ
- Use **AWS Database Migration Service (DMS)** for data replication with CDC
- Use **S3** with versioning and lifecycle policies for file storage
- Use **CloudWatch** for dashboard, metrics, and alarms
- Use **SNS** for notification delivery
- Use **IAM** for service roles and policies with least privilege
- Use **KMS** for customer-managed encryption keys
- Use **VPC** with security groups for network isolation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{suffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (use DESTROY removal policy, no RETAIN)

### Constraints

- All data must be encrypted at rest using AWS KMS customer-managed keys
- Support blue-green deployment patterns for zero-downtime cutover
- Database migration must preserve all existing schemas, indexes, and stored procedures
- File storage migration must maintain the same directory structure and access patterns
- Security groups must allow only necessary traffic between DMS, source, and target
- Migration window is 4 hours with rollback capability
- All resources must be tagged with Environment, MigrationPhase, and CostCenter

## Success Criteria

- **Functionality**: DMS successfully replicates data from on-premises to Aurora with CDC
- **Performance**: Replication lag stays below acceptable thresholds
- **Reliability**: Multi-AZ Aurora cluster with automated backups
- **Security**: All data encrypted at rest with KMS, least privilege IAM roles
- **Monitoring**: CloudWatch dashboard and alarms provide visibility into migration status
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean HCL code, well-tested, comprehensive documentation
- **Destroyability**: All resources can be safely destroyed without manual cleanup

## What to deliver

- Complete **Terraform HCL** implementation in lib/ directory
- Main infrastructure file (main.tf) with all AWS resources
- Variables file (variables.tf) with configurable parameters
- Outputs file (outputs.tf) exposing key resource attributes
- Provider configuration (provider.tf) for AWS and required providers
- VPC module or resources with networking configuration
- RDS Aurora cluster configuration with Multi-AZ
- DMS replication instance, endpoints, and tasks
- S3 bucket with versioning and lifecycle policies
- CloudWatch dashboard definition (JSON)
- CloudWatch alarms for critical metrics
- SNS topic and subscriptions for notifications
- KMS keys for encryption
- Security groups with proper ingress/egress rules
- IAM roles and policies for DMS
- Unit tests for all Terraform modules (test/ directory)
- Documentation files:
  - state-migration.md with Terraform state management guidance
  - runbook.md with migration execution procedures
  - README.md with deployment and usage instructions
- Comprehensive test coverage (100% target)

## Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resources MUST include a string suffix parameter for uniqueness (e.g., `aurora-cluster-${var.environment_suffix}`)
- **Destroyability**: Resources MUST NOT use RETAIN deletion policies - use DESTROY to allow clean teardown
- **Service-Specific Notes**:
  - DMS replication instance sizing should match workload (500GB database)
  - Aurora parameter group must match PostgreSQL 13.x source settings
  - S3 lifecycle policies should optimize for 2TB of image storage
  - CloudWatch dashboard must show replication lag as primary metric
