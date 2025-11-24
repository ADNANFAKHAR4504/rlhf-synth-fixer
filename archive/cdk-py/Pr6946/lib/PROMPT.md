# Migration Orchestration Infrastructure

Hey team,

We have a financial services company that needs to move their legacy monolithic application from their on-premises datacenter to AWS. This is a big migration involving a web tier, API services, and a PostgreSQL database with about 500GB of data, plus 12 application servers and 2TB of file storage. The stakes are high here - they need minimal downtime, and they want the ability to roll back if anything goes wrong during the migration.

I need to build the infrastructure to orchestrate this phased migration using **CDK with Python**. The business is asking for a comprehensive migration solution that covers database replication, server migration, hybrid connectivity, and automated monitoring throughout the process.

Their datacenter is in Virginia, and we are targeting AWS us-east-1 region. The on-premises network uses 192.168.0.0/16 addressing, and we will be setting up a VPC with 10.0.0.0/16 CIDR across 3 availability zones. They want Site-to-Site VPN with BGP routing and a Direct Connect virtual interface as backup for hybrid connectivity.

The key challenge here is coordinating multiple migration tools and services while maintaining visibility into the migration progress and having fallback mechanisms if things go south. They want to do a blue-green deployment strategy with Route 53 weighted routing so they can gradually shift traffic and roll back if needed.

## What we need to build

Create a migration orchestration platform using **CDK with Python** that coordinates database migration, server replication, hybrid connectivity, and monitoring for a phased on-premises-to-AWS migration.

### Core Requirements

1. **Database Migration**
   - Create DMS replication instance with multi-AZ deployment for continuous data replication
   - Support PostgreSQL 13 database migration (500GB)
   - Configure appropriate subnet groups and security groups

2. **Server Replication**
   - Set up CloudEndure replication servers with proper IAM roles
   - Support replication for 12 application server instances
   - Configure appropriate IAM permissions for CloudEndure service

3. **Hybrid Connectivity**
   - Configure Site-to-Site VPN with customer gateway for secure hybrid connectivity
   - Set up BGP routing between on-premises (192.168.0.0/16) and AWS VPC (10.0.0.0/16)
   - Support Direct Connect as backup connectivity option

4. **DNS Management**
   - Implement Route 53 private hosted zone for gradual DNS cutover
   - Support blue-green deployment with weighted routing policies
   - Enable gradual traffic shifting from on-premises to AWS

5. **Migration Tracking**
   - Create DynamoDB table for tracking migration status and progress
   - Store migration phase, server status, database replication lag, and timestamps
   - Support queries for real-time status monitoring

6. **Notifications**
   - Set up SNS topic for migration status notifications
   - Notify on migration phase transitions, errors, and completion
   - Support email and other notification endpoints

7. **Post-Migration Validation**
   - Configure Systems Manager documents for automated post-migration validation
   - Verify application health, database connectivity, and service availability
   - Support automated configuration management

8. **Rollback Mechanism**
   - Implement Lambda functions for automated rollback if migration issues detected
   - Monitor CloudWatch metrics and trigger rollback on threshold violations
   - Support Route 53 weighted routing updates for traffic shifting

9. **Monitoring Dashboard**
   - Create CloudWatch dashboard for migration metrics visualization
   - Display DMS replication lag, server status, VPN connection health
   - Show migration progress and current phase

### Optional Enhancements

If appropriate, consider adding:
- Application Migration Service (MGN) for block-level server replication
- DataSync tasks for incremental file system transfers to S3 or EFS (2TB storage)
- Migration Hub for centralized progress tracking across all migration tools

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **AWS DMS** for database replication
- Use **CloudEndure** service with appropriate IAM roles
- Use **Site-to-Site VPN** for hybrid connectivity
- Use **Route 53** for DNS management and traffic shifting
- Use **DynamoDB** for migration state tracking
- Use **SNS** for notifications
- Use **Systems Manager** for post-migration validation
- Use **Lambda** for rollback automation
- Use **CloudWatch** for metrics and dashboards
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-{environmentSuffix}`
- Deploy to **us-east-1** region
- VPC with 10.0.0.0/16 CIDR across 3 availability zones
- Public and private subnets in each availability zone

### Constraints

- All resources must be destroyable (no Retain policies or deletion protection)
- Use RemovalPolicy.DESTROY for all resources
- Implement encryption at rest using AWS KMS for all data stores
- Enable encryption in transit using TLS/SSL
- Follow principle of least privilege for IAM roles and policies
- Enable CloudWatch logging for all services
- Tag all resources appropriately
- Support both Site-to-Site VPN and Direct Connect for hybrid connectivity
- PostgreSQL 13 database (500GB data)
- 12 application server instances to migrate
- 2TB of file storage to migrate
- Blue-green deployment strategy with Route 53 weighted routing
- Automated rollback capability based on CloudWatch metrics
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete migration orchestration infrastructure with DMS, CloudEndure, VPN, Route 53, DynamoDB tracking, SNS notifications, Systems Manager validation, Lambda rollback, and CloudWatch dashboard
- **Hybrid Connectivity**: Site-to-Site VPN with BGP routing between on-premises (192.168.0.0/16) and AWS VPC (10.0.0.0/16)
- **Monitoring**: Real-time visibility into migration progress, replication lag, and system health
- **Rollback**: Automated rollback mechanism triggered by CloudWatch metric violations
- **Security**: Encryption at rest and in transit, least privilege IAM policies, VPN connectivity
- **Resource Naming**: All resources include environmentSuffix in names
- **Destroyability**: All resources can be cleanly destroyed (RemovalPolicy.DESTROY)
- **Code Quality**: Python code, well-tested, properly documented

## What to deliver

- Complete CDK Python implementation
- VPC with 10.0.0.0/16 CIDR spanning 3 availability zones
- DMS replication instance with multi-AZ deployment
- CloudEndure replication servers with IAM roles
- Site-to-Site VPN with customer gateway and BGP routing
- Route 53 private hosted zone with weighted routing
- DynamoDB table for migration tracking
- SNS topic for notifications
- Systems Manager documents for post-migration validation
- Lambda functions for automated rollback
- CloudWatch dashboard for migration metrics
- Appropriate IAM roles and security groups
- Unit tests for all components
- Documentation and deployment instructions
