Hey team,

We've got an exciting but critical migration project ahead. Our fintech startup has been running their payment processing infrastructure in development for the past 6 months, and it's time to move to production. The dev environment has proven stable with RDS MySQL and Lambda functions handling transaction processing, but now we need to rebuild this infrastructure in a production-ready configuration with significantly enhanced security and reliability.

The business is really concerned about minimizing downtime and ensuring we maintain data integrity throughout this migration. They've also made it clear that production needs to be completely isolated from development, with no resource overlap or network conflicts. We're talking about a production payment system here, so security and compliance are non-negotiable.

I've been asked to create this infrastructure using **Pulumi with TypeScript** for the eu-west-2 region. The team wants everything defined as code so we can version control the entire infrastructure and replicate it if needed. They're also asking for comprehensive disaster recovery capabilities with tight recovery objectives.

## What we need to build

Create a production migration infrastructure using **Pulumi with TypeScript** that provisions a secure, highly available environment for payment processing in AWS eu-west-2 region.

### Core Infrastructure Requirements

1. **Networking and Isolation**
   - Create a new production VPC spanning 2 availability zones with private subnets
   - VPC CIDR must not overlap with development environment (which uses 10.0.0.0/16)
   - All inter-service communication must occur within the VPC using security groups
   - Deploy AWS Network Firewall for advanced network protection in the migrated infrastructure

2. **Database Layer**
   - Deploy RDS MySQL 8.0 instance in Multi-AZ configuration for high availability
   - Use db.t3.medium instance class with 100GB allocated storage
   - Enable encrypted storage for data at rest
   - Enable automated backups with 7-day retention period
   - Database passwords must be at least 16 characters with special characters

3. **Application Layer**
   - Migrate existing Lambda functions to production with updated environment variables
   - Lambda functions must use Node.js 18.x runtime with 512MB memory allocation
   - Configure Lambda functions with reserved concurrent executions of 50
   - Lambda functions must run in private subnets for security
   - Lambda environment variables must be encrypted using AWS-managed KMS keys

4. **Secrets Management and Rotation**
   - Configure database credentials using AWS Secrets Manager
   - Implement automatic credential rotation with 30-day rotation schedule
   - All secrets must use automatic rotation with zero-downtime updates

5. **Monitoring and Alerting**
   - Set up SNS topic for production alerts with email subscription
   - Configure comprehensive CloudWatch logging for all components

6. **Migration Services**
   - Deploy AWS Server Migration Service (SMS) for incremental server replication
   - Configure AWS Transfer Family for secure file transfer during migration

7. **High Availability and Disaster Recovery**
   - Implement Amazon Route 53 Application Recovery Controller for multi-region failover
   - Set up AWS Fault Injection Simulator for chaos engineering and resilience testing
   - Deploy resources across multiple regions for high availability and disaster recovery
   - All resources must support disaster recovery with RTO less than 1 hour and RPO less than 15 minutes

8. **Container and Application Deployment**
   - Implement AWS App Runner for simplified container deployment in target environment

9. **Feature Management**
   - Deploy Amazon CloudWatch Evidently for feature flags and A/B testing during migration

10. **Resource Sharing**
    - Configure AWS Resource Access Manager for cross-account resource sharing

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Primary region: eu-west-2
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and comprehensive logging
- Use AWS-managed KMS keys for encryption where applicable

### Security and Compliance Constraints

- RDS instance must use encrypted storage
- Lambda environment variables must be encrypted
- All inter-service communication within VPC
- Database passwords minimum 16 characters with special characters
- No public access to database resources
- Security groups must follow least privilege principle
- Implement automated security scanning in CI/CD pipeline before deployment

### Resource Tagging and Cost Management

- Tag all resources with Environment='production' and Project='payment-processing'
- Implement cost allocation tags and AWS Cost Explorer integration for budget tracking
- Include infrastructure drift detection with automated remediation

### Testing and Documentation

- Implement infrastructure as code testing using Pulumi's testing framework
- Include comprehensive documentation with architecture diagrams exported as code
- All infrastructure must be testable and reproducible

## Success Criteria

- **Functionality**: Fully functional production environment isolated from development with all Lambda functions connected to new RDS instance through secure VPC endpoints
- **Security**: Encrypted data at rest and in transit, automated credential rotation active, all resources in private subnets with proper security groups
- **Reliability**: Multi-AZ database deployment, automated backups configured, monitoring alerts operational
- **Performance**: Lambda functions with reserved concurrency, proper memory allocation, optimized database configuration
- **Disaster Recovery**: RTO less than 1 hour, RPO less than 15 minutes, multi-region failover capabilities
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Cost Management**: All resources tagged appropriately, cost tracking enabled
- **Destroyability**: Infrastructure can be torn down completely for testing cycles

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- VPC with multi-AZ private subnets and AWS Network Firewall
- RDS MySQL Multi-AZ instance with encryption and automated backups
- Lambda functions in private subnets with encrypted environment variables
- AWS Secrets Manager with 30-day credential rotation
- SNS topic with email subscription for alerts
- AWS Server Migration Service configuration
- AWS Transfer Family setup
- Route 53 Application Recovery Controller for failover
- AWS Fault Injection Simulator setup
- AWS Resource Access Manager configuration
- CloudWatch Evidently for feature flags
- AWS App Runner deployment configuration
- Security groups and IAM roles with least privilege
- Unit tests for all Pulumi components in test/ directory
- Comprehensive documentation and deployment instructions
- All resources properly tagged and named with environmentSuffix