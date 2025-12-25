Hey team,

We've got an exciting challenge ahead. A financial services company is migrating their legacy on-premises trading application to AWS. This is a production environment migration that needs to be bulletproof - we're talking about a system with a web frontend, REST API backend, and PostgreSQL database that handles trading operations. They need us to orchestrate the entire migration while maintaining data integrity and minimizing downtime.

The business requirements are clear: they want a blue-green deployment strategy for zero-downtime migration, continuous database replication using AWS DMS, and the ability to roll back instantly if anything goes wrong. They're also concerned about costs, so we need to use Graviton2 instances and serverless options where possible.

This migration needs to support gradual traffic cutover using Route 53 weighted routing, starting at 0% and allowing them to increase traffic to AWS incrementally. They also want comprehensive monitoring throughout the migration process, with alerts and dashboards showing replication lag, application metrics, and migration progress.

## What we need to build

Create a production-ready migration infrastructure using **Terraform with HCL** for a financial services trading application moving from on-premises to AWS.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 availability zones for high availability
   - Public and private subnets in each AZ
   - NAT Gateways for outbound traffic from private subnets
   - Proper security groups and network ACLs

2. **Database Migration and Replication**
   - RDS Aurora PostgreSQL cluster with Multi-AZ deployment
   - Read replicas for improved performance
   - AWS DMS replication instance for continuous database synchronization
   - DMS tasks configured for ongoing replication from on-premises
   - Database credentials stored in AWS Secrets Manager

3. **Application Deployment**
   - ECS Fargate for containerized web frontend and API backend
   - Auto-scaling based on CPU and memory metrics
   - Use Graviton2 instances, specifically ARM64, for cost optimization
   - Application configuration migrated to AWS SSM Parameter Store

4. **Load Balancing and Traffic Management**
   - Application Load Balancer with health checks
   - SSL termination using ACM certificates
   - Route 53 hosted zone with weighted routing for gradual traffic migration
   - Initial routing: 0% to AWS with all traffic on-premises, gradually increase

5. **Monitoring and Alerting**
   - CloudWatch dashboards showing migration progress
   - CloudWatch metrics for replication lag
   - CloudWatch alarms for critical migration events
   - SNS topics for migration alerts and status notifications
   - CloudWatch Logs for application and infrastructure logging

6. **Backup and Recovery**
   - AWS Backup plans for automated daily snapshots
   - 30-day retention period for backups
   - Backup plans for both RDS and ECS configuration

7. **Rollback Mechanism**
   - Lambda functions to automatically revert Route 53 traffic if migration fails
   - CloudWatch alarms trigger rollback based on error rates or latency
   - SNS notifications for rollback events

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** with 3 availability zones, public and private subnets
- Use **ECS Fargate** with auto-scaling using Graviton2 instances
- Use **RDS Aurora PostgreSQL** Multi-AZ with read replicas
- Use **Application Load Balancer** for SSL termination and health checks
- Use **Route 53** for weighted routing to enable gradual traffic migration
- Use **AWS DMS** for continuous database replication
- Use **CloudWatch** for dashboards, alarms, and logs
- Use **SNS** for migration alerts and notifications
- Use **AWS Backup** for daily snapshots with 30-day retention
- Use **AWS Secrets Manager** for database credentials and API keys
- Use **AWS SSM Parameter Store** for application configuration
- Use **Lambda** for rollback automation
- Use **NAT Gateway** for private subnet outbound connectivity
- All infrastructure names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable without Retain policies
- Implement proper IAM roles with least privilege
- Enable encryption at rest and in transit

### Constraints

- Must use blue-green deployment strategy for zero-downtime migration
- Database migration must use AWS DMS for continuous replication
- All resources must be tagged with Environment, Project, and MigrationPhase
- Database credentials must be stored in AWS Secrets Manager
- Application configuration must use SSM Parameter Store
- CloudWatch alarms must monitor migration status
- Route 53 weighted routing starts at 0% to AWS environment
- AWS Backup must be configured for post-migration protection
- All compute resources must use Graviton2 instances
- No hardcoded credentials or configuration values
- All security groups must follow least privilege principle

## Success Criteria

- **Functionality**: Complete migration infrastructure with all components working together
- **Zero Downtime**: Blue-green deployment enables seamless cutover
- **Data Integrity**: AWS DMS ensures continuous replication with minimal lag
- **Monitoring**: Comprehensive dashboards and alerts for migration visibility
- **Rollback Capability**: Automated rollback on failure detection
- **Security**: All credentials in Secrets Manager, encrypted data at rest and in transit
- **Cost Optimization**: Graviton2 instances and serverless options where appropriate
- **Naming Convention**: All infrastructure includes environment_suffix for uniqueness
- **Destroyability**: All resources can be cleanly torn down
- **Code Quality**: Well-structured HCL, properly modularized, comprehensive tests

## What to deliver

- Complete Terraform HCL implementation with modules
- VPC with 3 AZs, public and private subnets, NAT Gateways
- RDS Aurora PostgreSQL Multi-AZ cluster with read replicas
- AWS DMS replication instance and tasks
- ECS Fargate services with auto-scaling using Graviton2
- Application Load Balancer with SSL termination
- Route 53 hosted zone with weighted routing policies
- CloudWatch dashboards, alarms, and log groups
- SNS topics for notifications
- AWS Backup plans with 30-day retention
- AWS Secrets Manager secrets for credentials
- SSM Parameter Store parameters for configuration
- Lambda functions for rollback automation
- IAM roles and policies with least privilege
- Comprehensive unit tests with 90%+ coverage
- Documentation and deployment instructions
