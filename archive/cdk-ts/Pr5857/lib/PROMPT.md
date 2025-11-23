# Migration Infrastructure Setup

Hey team,

We've got a challenging but exciting project ahead. A financial services company needs to migrate their legacy monolithic application from on-premises to AWS, and they need it done right. The application is currently running a Java backend API with PostgreSQL database and Redis cache layer. The business has made it clear that downtime is not an option, and we need to maintain complete data consistency throughout the migration.

The migration strategy needs to be phased across three environments - development first, then staging, and finally production. Each phase needs to be independently deployable and testable, with proper rollback capabilities. We're talking about a blue-green deployment approach where we can shift traffic gradually and roll back instantly if anything goes wrong.

I've been asked to create this infrastructure using **AWS CDK with TypeScript**. The architecture needs to support continuous data replication from their on-premises databases to AWS while the migration is in progress, and we need comprehensive monitoring to track every aspect of the migration process.

## What we need to build

Create a complete infrastructure orchestration solution using **AWS CDK with TypeScript** that enables a phased migration of a monolithic application from on-premises to AWS cloud infrastructure.

### Core Requirements

1. **Multi-Environment Stack Architecture**
   - Define separate CDK stacks for dev, staging, and production environments
   - Implement shared base constructs to ensure consistency across environments
   - Support sequential deployment with environment-specific configurations

2. **Network Infrastructure**
   - Create VPCs with private and public subnets across 3 availability zones for each environment
   - Set up VPC peering connections for secure cross-environment communication during migration
   - Deploy NAT Gateways for outbound internet access from private subnets

3. **Database Layer**
   - Set up RDS PostgreSQL Multi-AZ instances with automated failover capabilities
   - Configure read replicas for improved performance and disaster recovery
   - Implement AWS Backup with 7-day retention policy for automated database backups

4. **Data Migration Pipeline**
   - Configure AWS DMS replication instances to sync data from on-premises databases to AWS RDS
   - Support continuous replication during the migration cutover period
   - Monitor replication lag and error rates through CloudWatch

5. **Application Hosting**
   - Deploy ECS Fargate services to run Java Spring Boot containers
   - Implement auto-scaling based on CPU and memory metrics
   - Configure Application Load Balancers with path-based routing and health checks

6. **Caching Layer**
   - Set up ElastiCache Redis clusters for each environment
   - Ensure proper security groups and subnet configurations

7. **Traffic Management**
   - Configure Route 53 weighted routing policies for gradual traffic shifting
   - Implement blue-green deployment strategy for zero-downtime migration
   - Support rollback procedures through weighted routing adjustments

8. **Monitoring and Observability**
   - Create CloudWatch dashboards to monitor migration progress and application health
   - Set up CloudWatch alarms for critical metrics including replication lag and error rates
   - Track migration success metrics across all environments

9. **Alerting System**
   - Set up SNS topics for alerting on migration failures or performance degradation
   - Configure email notifications for manual approval gates
   - Alert on threshold breaches for critical migration metrics

10. **Migration Validation**
    - Define Lambda functions for pre-migration validation checks
    - Implement post-migration validation to verify data consistency
    - Create rollback procedures using CDK custom resources

11. **Artifact Storage**
    - Implement S3 buckets for storing migration artifacts and logs
    - Configure lifecycle policies for cost optimization
    - Enable versioning and encryption for compliance

12. **Security and Access Control**
    - Create IAM roles with least-privilege access for all services
    - Use AWS Secrets Manager for all database credentials and API keys
    - Implement encryption at rest and in transit for all data stores

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CDK v2 with Node.js 18+ runtime
- Deploy to **ap-southeast-1** region
- Use AWS DMS for database migration and continuous replication
- Implement blue-green deployment strategy
- Use Docker containers for ECS Fargate deployments
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`

### Constraints

- Database migration must use AWS DMS for continuous replication during cutover
- Maintain separate VPCs for each environment with peering connections
- All resources must be tagged with Environment, MigrationPhase, and CostCenter tags
- Use AWS Secrets Manager for all database credentials and API keys - fetch from existing secrets, do not create new ones
- Implement CloudWatch alarms for migration success metrics
- Create rollback procedures using CDK custom resources
- Use AWS Backup for automated database backups with 7-day retention
- Deploy infrastructure changes through AWS CodePipeline with manual approval gates
- All resources must be fully destroyable for CI/CD workflows (avoid DeletionPolicy: Retain)
- Follow principle of least privilege for all IAM roles
- Enable appropriate logging and monitoring for security compliance

### Resource Tagging

All resources must include these tags:
- Environment: dev/staging/prod
- MigrationPhase: preparation/migration/cutover/complete
- CostCenter: finance-app-migration
- EnvironmentSuffix: value of environmentSuffix variable

## Success Criteria

- **Functionality**: All 12 core requirements implemented and working across all three environments
- **Zero Downtime**: Blue-green deployment strategy enables migration without service interruption
- **Data Consistency**: DMS replication maintains data integrity with minimal lag during migration
- **Security**: All credentials in Secrets Manager, encryption enabled, least-privilege IAM roles
- **Monitoring**: Comprehensive CloudWatch dashboards and alarms track migration progress
- **Rollback Capability**: Custom resources enable instant rollback to on-premises infrastructure
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Infrastructure can be fully torn down and recreated for testing
- **Code Quality**: Well-structured TypeScript code with proper error handling and documentation

## What to deliver

- Complete AWS CDK TypeScript application with multiple stacks (dev, staging, prod)
- Separate stack files or stack instantiation for each environment
- VPC infrastructure with subnets, NAT gateways, and peering connections
- RDS PostgreSQL instances with Multi-AZ and read replicas
- AWS DMS replication instances and tasks
- ECS Fargate services with Application Load Balancers
- ElastiCache Redis clusters
- CloudWatch dashboards, alarms, and SNS topics
- Lambda functions for pre/post migration validation
- Route 53 hosted zones with weighted routing policies
- S3 buckets with lifecycle policies
- IAM roles, policies, and Secrets Manager integration
- AWS Backup plans and vault configuration
- CodePipeline with manual approval stages
- Unit tests for all CDK constructs (test/tap-stack.unit.test.ts)
- Integration tests validating deployed resources (test/tap-stack.int.test.ts)
- Comprehensive documentation including deployment instructions and migration runbook
- Environment-specific configuration files
- Deployment scripts for sequential environment provisioning
