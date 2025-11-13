# PostgreSQL to Aurora Migration Infrastructure

Hey team,

We need to migrate our legacy on-premises PostgreSQL database to AWS Aurora. This database currently serves a multi-tenant SaaS application with strict data isolation requirements. The business is asking for a zero-downtime cutover while maintaining all existing connection configurations. The migration complexity is high because we need to keep the system running while replicating terabytes of data with ongoing changes.

The current setup has been running on-premises for years, and we've accumulated significant data. We need to ensure audit compliance is maintained throughout the migration, which means we need full logging. The business also needs read replicas in multiple availability zones to handle reporting workloads without impacting the production database.

We've chosen Aurora PostgreSQL because it offers better performance, automatic backups, and read scaling compared to our current setup. The migration needs to be bulletproof with proper monitoring at every step.

## What we need to build

Create a complete database migration infrastructure using **Pulumi with Python** that handles the entire migration from on-premises PostgreSQL to AWS Aurora.

### Core Requirements

1. **Aurora PostgreSQL Cluster**
   - One writer instance and two reader instances
   - PostgreSQL version 15.4 compatibility
   - Deploy across multiple availability zones for high availability

2. **Database Configuration**
   - Custom DB parameter group with log_statement='all' for audit compliance
   - Point-in-time recovery enabled
   - 7-day backup retention period
   - Preferred backup window of 03:00-04:00 UTC

3. **Database Migration Service (DMS)**
   - Replication instance with at least 8 GB memory
   - Source endpoint for on-premises PostgreSQL with SSL encryption
   - Target endpoint for Aurora with SSL encryption
   - Migration task supporting full load plus CDC (change data capture)

4. **Security and Credentials**
   - Store database master credentials in AWS Secrets Manager
   - Automatic rotation disabled during migration phase
   - SSL encryption enabled for all database connections

5. **Monitoring and Alerting**
   - CloudWatch alarm for Aurora CPU utilization (threshold: 80%)
   - CloudWatch alarm for DMS replication lag (threshold: 300 seconds)
   - Performance Insights enabled with 7-day retention

6. **Stack Outputs**
   - Aurora cluster endpoint
   - Aurora reader endpoint
   - DMS task ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS RDS Aurora** for the database cluster
- Use **AWS Database Migration Service (DMS)** for replication
- Use **AWS Secrets Manager** for credential storage
- Use **AWS CloudWatch** for monitoring and alarms
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be tagged with Environment and MigrationPhase

### Constraints

- Use AWS Database Migration Service (DMS) for the migration process
- Implement separate parameter groups for source compatibility and target optimization
- Configure read replicas in at least two availability zones
- Enable point-in-time recovery with 7-day retention
- Use AWS Secrets Manager for all database credentials
- Implement CloudWatch alarms for replication lag monitoring
- Tag all resources with Environment and MigrationPhase tags
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- **Functionality**: All 10 requirements fully implemented and working
- **High Availability**: Aurora cluster with multi-AZ reader instances
- **Security**: All credentials in Secrets Manager, SSL encryption enabled
- **Monitoring**: CloudWatch alarms properly configured and triggering
- **Migration Ready**: DMS task can perform full load and CDC
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Aurora PostgreSQL cluster with custom parameter group
- DMS replication instance, endpoints, and migration task
- Secrets Manager secret for database credentials
- CloudWatch alarms for monitoring
- Performance Insights configuration
- Comprehensive unit tests
- Documentation and deployment instructions
