Hey team,

We need to migrate our RDS MySQL database from the development environment to production. The dev database has been running successfully, and now we need to replicate it in production with enhanced security, monitoring, and validation mechanisms. I've been asked to create this infrastructure using **CDKTF with Python** for the ap-southeast-1 region.

The business wants this migration handled carefully with proper safeguards. We're starting from a snapshot of the development database (snapshot ID: dev-db-snapshot-20240115) and building out a complete production environment with all the security and reliability features we need for a production workload.

The key challenge here is ensuring that the migration is not just a copy-paste operation. We need to add production-grade features like automatic credential rotation, post-migration validation, and event-driven automation to catch any issues early. The database needs to be completely isolated in private subnets with no public access, and all credentials must be managed through AWS Secrets Manager with automatic rotation.

## What we need to build

Create a production RDS MySQL infrastructure using **CDKTF with Python** that restores from a development snapshot and adds production-grade features for security, monitoring, and validation.

### Core Requirements

1. **VPC and Network Infrastructure**
   - Production VPC with private subnets across 2 availability zones
   - Private subnets must span exactly 2 AZs for the RDS instance
   - No public subnets or internet gateways required
   - Security groups configured for application-to-database access only

2. **RDS MySQL Instance**
   - Restore from development snapshot: dev-db-snapshot-20240115
   - Deploy as Multi-AZ for high availability
   - Use MySQL 8.0 engine
   - Must be deployed in private subnets with no public IP address
   - Automated backups with 7-day retention period
   - Preferred backup window: 3:00-4:00 AM UTC

3. **Secrets Management**
   - Store database credentials in AWS Secrets Manager
   - Enable automatic rotation every 30 days
   - Never hardcode credentials in the infrastructure code
   - Secrets must be referenced, not created (fetch from existing entries)

4. **Post-Migration Validation**
   - Lambda function to validate successful data migration
   - Function should check for successful restoration by querying specific tables
   - Lambda must run in private subnets with VPC endpoints for AWS service access
   - Proper error handling and logging for validation results

5. **Event-Driven Automation**
   - EventBridge rules to trigger validation Lambda after RDS events
   - Monitor RDS state changes and trigger validation automatically
   - Capture and log all validation results to CloudWatch

6. **Security Configuration**
   - Security group rules allowing access only from application subnet CIDR: 10.0.1.0/24
   - Encryption at rest for RDS instance
   - Encryption in transit enforced
   - All inter-service communication through VPC endpoints (no internet transit)
   - Least privilege IAM roles for Lambda execution

7. **Resource Tagging**
   - Tag all resources with Environment=production
   - Tag all resources with MigrationDate set to current date
   - All resource names must include environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS MySQL 8.0** for the database instance
- Use **AWS Secrets Manager** for credential management with rotation
- Use **Lambda** for validation function (Python runtime recommended)
- Use **EventBridge** rules for event-driven automation
- Use **VPC Endpoints** to avoid internet transit for AWS service calls
- Resource naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **ap-southeast-1** region
- Follow Python best practices with type hints and comprehensive comments

### Constraints

- The RDS instance must be deployed in private subnets with no public IP address
- Database credentials must never be hardcoded and must rotate automatically every 30 days
- The validation Lambda must check for successful data migration by querying specific tables
- All inter-service communication must use VPC endpoints to avoid internet transit
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and logging for all components
- Lambda functions must have appropriate timeouts and memory configuration
- Use existing secrets from Secrets Manager, do not create new secrets in this stack

## Success Criteria

- **Functionality**: Complete RDS instance restored from snapshot with Multi-AZ deployment
- **Security**: All credentials in Secrets Manager with rotation, no public access to RDS
- **Validation**: Lambda function successfully validates database restoration
- **Automation**: EventBridge triggers validation automatically on RDS events
- **Network Isolation**: All resources in private subnets with VPC endpoints
- **Resource Naming**: All resources include environmentSuffix for multi-PR support
- **Destroyability**: All infrastructure can be fully destroyed for CI/CD testing
- **Code Quality**: Well-structured Python code with type hints, comprehensive comments, and documentation

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- Lambda validation function code in lib/lambda/ directory
- VPC with private subnets across 2 availability zones
- RDS MySQL 8.0 instance with Multi-AZ deployment
- AWS Secrets Manager integration with rotation configuration
- Lambda function for post-migration validation
- EventBridge rules for automated validation triggers
- Security Groups with proper access controls
- VPC Endpoints for AWS service communication
- Comprehensive unit and integration tests
- Documentation including deployment instructions

The infrastructure should be production-ready with proper security, monitoring, and validation mechanisms in place. All resources should be properly tagged and follow naming conventions for multi-environment support.