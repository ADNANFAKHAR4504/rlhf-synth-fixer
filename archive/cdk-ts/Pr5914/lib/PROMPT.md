Hey team,

We need to build a database migration solution for a fintech company that's moving their PostgreSQL database from on-premises to AWS RDS Aurora. This is a production migration that needs to maintain data integrity while minimizing downtime. I've been asked to create this using **AWS CDK with TypeScript** and deploy it to the us-east-1 region.

The business has strict requirements around security and performance, and they need continuous data replication during the migration to ensure we can cut over with minimal impact. The existing on-premises setup has specific performance characteristics we need to match, particularly around connection handling with their current max_connections configuration.

This is a high-stakes migration for a production fintech environment, so everything needs to be properly secured, monitored, and tagged for compliance tracking. The migration is part of their 2024Q1 cloud initiative, and they need full visibility into the migration progress through CloudWatch monitoring.

## What we need to build

Create a database migration infrastructure using **AWS CDK with TypeScript** that enables migration from an on-premises PostgreSQL database to AWS RDS Aurora with minimal downtime and continuous data replication.

### Core Requirements

1. **RDS Aurora PostgreSQL Cluster**
   - Use PostgreSQL version 14.13 compatibility
   - Deploy one writer instance and two reader instances
   - Place all instances in private subnets across multiple availability zones
   - Configure for high availability and read scalability

2. **Database Security and Access**
   - Store all database credentials in AWS Secrets Manager
   - Disable automatic rotation for Secrets Manager secrets
   - Create security groups allowing inbound traffic only on port 5432
   - Restrict database access to only application subnets
   - Ensure all connections are properly secured

3. **Database Configuration**
   - Apply a custom DB parameter group with max_connections set to 1000
   - Configure automated backups with exactly 7-day retention period
   - Enable encryption at rest for all database storage
   - Configure appropriate CloudWatch logging and monitoring

4. **AWS DMS Migration Infrastructure**
   - Create a DMS replication instance using r5.large instance type
   - Configure appropriate DMS subnet group for the replication instance
   - Create DMS source endpoint for the on-premises PostgreSQL database
   - Create DMS target endpoint for the Aurora PostgreSQL cluster
   - Ensure proper networking and connectivity for DMS

5. **DMS Migration Task Configuration**
   - Configure migration task with full load plus CDC (Change Data Capture)
   - Enable continuous data replication for zero-downtime cutover
   - Set up proper task settings for PostgreSQL to PostgreSQL migration
   - Configure CloudWatch logging for migration monitoring
   - Handle migration task dependencies correctly

6. **Resource Dependencies**
   - Ensure DMS components are created only after Aurora cluster is available
   - Configure proper dependency chain: VPC → Aurora → Secrets → DMS instance → DMS endpoints → DMS task
   - Handle CloudFormation resource creation order correctly
   - Ensure all resources can be cleanly destroyed (no Retain policies)

7. **Resource Naming and Tagging**
   - All resource names must include **environmentSuffix** for uniqueness
   - Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
   - Tag all resources with Environment=production
   - Tag all resources with MigrationProject=2024Q1
   - Ensure consistent naming across all migration components

8. **Outputs and Monitoring**
   - Output the DMS task ARN for monitoring and automation
   - Output the Aurora cluster endpoint for application configuration
   - Output the Aurora reader endpoint for read-only workloads
   - Provide all necessary connection information for applications

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Deploy to **us-east-1** region
- Use **RDS Aurora PostgreSQL** for the database cluster
- Use **AWS Secrets Manager** for credential storage
- Use **AWS DMS** for replication instance, endpoints, and migration tasks
- Use **VPC** with private subnets across multiple availability zones
- Use **Security Groups** for network access control
- Use **CloudWatch** for monitoring and logging
- Use **IAM** roles and policies for service permissions
- Resource names must include **environmentSuffix** for uniqueness
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- The RDS Aurora cluster MUST use PostgreSQL 14.13 compatibility
- Database credentials MUST be stored in AWS Secrets Manager with rotation disabled
- The migration MUST use AWS DMS with CDC enabled for minimal downtime
- All database connections MUST go through security groups allowing only port 5432
- The Aurora cluster MUST have exactly one writer and two reader instances
- Automated backups MUST retain snapshots for exactly 7 days (not more, not less)
- The DMS replication instance MUST be r5.large instance type
- Database parameter group MUST set max_connections to exactly 1000
- All resources MUST be tagged with Environment=production and MigrationProject=2024Q1
- DMS components MUST be created after the Aurora cluster is fully available
- All resources must support clean destruction without retention policies
- Proper error handling and logging must be configured throughout

## Success Criteria

- **Functionality**: Complete migration infrastructure provisioned with all components working together
- **Database Cluster**: Aurora PostgreSQL 14.13 cluster with 1 writer and 2 readers in private subnets
- **Security**: Credentials in Secrets Manager, security groups properly configured for port 5432 only
- **Migration Path**: DMS replication instance, endpoints, and task configured for full load + CDC
- **Performance**: Parameter group with max_connections=1000, proper instance sizing
- **Reliability**: 7-day backup retention, high availability across availability zones
- **Compliance**: All resources tagged with Environment=production and MigrationProject=2024Q1
- **Monitoring**: CloudWatch logging enabled, DMS task ARN and Aurora endpoints exposed
- **Dependencies**: Proper resource creation order ensuring DMS created after Aurora
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: TypeScript, well-structured CDK constructs, comprehensive tests with 90%+ coverage

## What to deliver

- Complete **AWS CDK with TypeScript** implementation in the lib/ directory
- Modular construct-based architecture (not multiple Stack classes)
- TapStack as the main orchestrator in bin/tap.ts
- RDS Aurora PostgreSQL cluster with custom parameter group
- AWS Secrets Manager secret for database credentials
- AWS DMS replication instance with r5.large size
- DMS source and target endpoints properly configured
- DMS migration task with full load and CDC enabled
- Security groups restricting access to port 5432 only
- Proper IAM roles and policies for all services
- CloudWatch logging and monitoring configuration
- Stack outputs for DMS task ARN and Aurora endpoints
- Unit tests with 90%+ coverage targeting all constructs
- Integration tests validating the deployed infrastructure
- Proper error handling and dependency management
- Documentation in README.md with deployment instructions
