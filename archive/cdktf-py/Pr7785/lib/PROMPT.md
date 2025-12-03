Hey team,

We've got a critical migration project coming up. Our financial services client needs to move their payment processing system from their on-premises data center to AWS without any downtime. This system handles millions of transactions every day and has strict PCI-DSS compliance requirements, so we need to get this right.

The migration strategy involves running both systems in parallel during the transition period, with real-time database replication and the ability to route traffic between the old and new environments. We also need automated rollback capabilities in case anything goes wrong. The infrastructure needs to span multiple regions for the migration process, with comprehensive monitoring and alerting throughout.

## What we need to build

Create a zero-downtime migration orchestration platform using **CDKTF with Python** for migrating a payment processing system from on-premises to AWS.

### Core Requirements

1. **Network Infrastructure**
   - Dual VPCs (production and migration environments) with proper subnet segmentation
   - Transit Gateway to connect VPCs and provide connectivity back to on-premises
   - Private subnets for databases and compute, public subnets for NAT gateways
   - Dedicated subnets for DMS replication instances

2. **Database Infrastructure**
   - RDS Aurora PostgreSQL clusters in us-east-1 with read replicas in us-east-2
   - DMS replication instances configured for both full-load and CDC (Change Data Capture)
   - Database credentials stored in Secrets Manager with automatic rotation enabled

3. **Migration Orchestration**
   - Step Functions state machines to control the migration phases (initialize, replicate, validate, cutover, rollback)
   - Lambda functions to validate data consistency between source and target databases
   - S3 buckets with versioning to store migration checkpoints and rollback states

4. **API and Traffic Management**
   - API Gateway endpoints with custom authorizers for authentication
   - Routing capabilities to direct traffic between old and new systems during transition

5. **Monitoring and Alerting**
   - CloudWatch dashboards monitoring replication lag, error rates, and migration progress
   - CloudWatch Logs with metric filters for migration event tracking
   - SNS topics and subscriptions for alerting the operations team

6. **Configuration Management**
   - Parameter Store hierarchies for environment-specific configurations
   - Secrets Manager for all database credentials with rotation policies

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to **us-east-1** region (with read replicas in us-east-2 for Aurora)
- Use **VPC** for network isolation and segmentation
- Use **Transit Gateway** for connectivity between VPCs and on-premises
- Use **RDS Aurora PostgreSQL** for the database layer
- Use **DMS** for real-time database replication with CDC
- Use **Lambda** for data validation functions
- Use **Step Functions** to orchestrate the migration workflow
- Use **API Gateway** with custom authorizers for authentication during transition
- Use **S3** with versioning for migration state backups
- Use **CloudWatch** for monitoring and logging with metric filters
- Use **SNS** for migration status notifications
- Use **Secrets Manager** with rotation for all database credentials
- Use **Parameter Store** for environment-specific configuration values
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix in their names for multi-environment support
- All resources MUST use DESTROY removal policy (no RETAIN policies allowed)
- Lambda functions MUST be in lib/lambda/ directory
- All code must be production-ready and deployable without modification
- Implement proper error handling and input validation
- Include comprehensive CloudWatch monitoring for all critical components

### Constraints

- Must achieve zero-downtime during migration
- Must maintain data consistency throughout the migration process
- Must support automated rollback if validation fails
- Must comply with PCI-DSS security standards (encryption at rest and in transit)
- Must handle millions of transactions daily during migration
- All database credentials must be stored securely and rotated automatically
- Replication lag must be monitored and alerted when exceeding thresholds

## Success Criteria

- **Functionality**: Complete migration infrastructure that can orchestrate a database migration with zero downtime
- **Performance**: Low replication lag (under 5 seconds) and ability to handle high transaction volumes
- **Reliability**: Automated rollback mechanisms that can restore to previous state if issues detected
- **Security**: All credentials in Secrets Manager, encryption enabled, proper IAM roles and policies
- **Monitoring**: Comprehensive dashboards showing replication status, error rates, and migration progress
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: CDKTF Python code that is well-structured, properly typed, and follows best practices

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC infrastructure with Transit Gateway connectivity
- RDS Aurora PostgreSQL clusters with cross-region read replicas
- DMS replication instances configured for CDC
- Lambda functions for data validation (in lib/lambda/)
- Step Functions state machines for migration orchestration
- API Gateway with custom authorizers
- S3 buckets for migration state management
- CloudWatch dashboards and alarms
- SNS topics for notifications
- Secrets Manager and Parameter Store configurations
- Proper IAM roles and policies for all services
- Production-ready code that can deploy successfully
