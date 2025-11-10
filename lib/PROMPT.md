# Payment Processing Infrastructure Migration

Hey team,

We need to build a comprehensive migration solution for our payment processing infrastructure. The business has mandated that we create a robust system that can safely migrate our payment processing workloads while maintaining zero downtime and data consistency. This is a critical project involving database replication, service migration, and traffic routing across infrastructure environments.

The current payment processing system handles thousands of transactions daily, and we cannot afford any data loss or service interruptions during migration. We need infrastructure that supports continuous replication, health monitoring, and the ability to roll back quickly if issues arise. The solution must include database migration with AWS DMS, cross-region S3 replication for transaction logs and audit trails, containerized service deployment with ECS Fargate, and intelligent traffic routing via Route 53.

This migration follows our standard cloud practices for environment consistency and multi-environment replication patterns. The infrastructure needs to be fully automated, secure, and provide comprehensive observability into the migration progress.

## What we need to build

Create a migration infrastructure using **AWS CDK with Python** for payment processing workload migration. The solution must orchestrate database replication, service deployment, storage replication, and traffic routing with comprehensive monitoring.

### Core Requirements

1. **Multi-Stack Architecture**
   - Define separate CDK stacks for source and target environments
   - Use CDK multi-stack patterns for cross-stack references
   - Enable independent deployment and rollback capabilities
   - Share resources securely between stacks (VPC, security groups, secrets)

2. **Database Layer**
   - Deploy RDS PostgreSQL instances in both environments
   - Instance type: db.r5.large with 100GB storage
   - Enable encryption at rest for both instances
   - Configure automated backups and point-in-time recovery
   - Use AWS Secrets Manager for database credentials (no hardcoded passwords)
   - Apply security groups with least privilege access

3. **Data Replication with AWS DMS**
   - Create DMS replication instance for continuous data sync
   - Configure source and target endpoints using Secrets Manager integration
   - Set up replication tasks with full load and CDC (Change Data Capture)
   - Implement table mappings for payment-related tables
   - Enable CloudWatch logging for replication monitoring
   - CRITICAL: Use secrets_manager_secret_id parameter for endpoint authentication

4. **Storage Layer**
   - Deploy S3 buckets in both environments for transaction logs
   - Configure cross-region replication for audit trail consistency
   - Enable versioning and encryption on all buckets
   - Set lifecycle policies for cost optimization
   - Implement bucket policies for secure access

5. **Application Services**
   - Deploy ECS Fargate clusters in both environments
   - Configure Application Load Balancers for service access
   - Use container images from ECR with proper tagging
   - Implement auto-scaling based on CPU and memory metrics
   - Configure health checks and target group routing

6. **Traffic Management**
   - Create Route 53 hosted zone with weighted routing policy
   - Initial configuration: 100% traffic to source environment
   - Enable health checks for automatic failover capability
   - Support gradual traffic shifting during migration
   - Configure TTL for rapid DNS propagation

7. **Observability and Monitoring**
   - Create CloudWatch dashboard with key migration metrics
   - Monitor DMS replication lag (alert if exceeds 60 seconds)
   - Track database performance metrics (connections, CPU, IOPS)
   - Monitor ECS service health and task counts
   - Display ALB request counts and error rates
   - Configure SNS alerts for critical thresholds

8. **Migration Runbook**
   - Export migration steps as CloudFormation outputs
   - Include DMS task ARNs and replication status endpoints
   - Provide Route 53 commands for traffic shifting
   - Document rollback procedures
   - Output health check endpoints for validation

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **RDS PostgreSQL** for relational database with encryption
- Use **AWS DMS** for continuous database replication with Secrets Manager
- Use **S3** with cross-region replication for storage layer
- Use **ECS Fargate** and **ALB** for containerized application services
- Use **Route 53** for DNS-based traffic management
- Use **CloudWatch** for metrics, logs, and dashboards
- Use **AWS Secrets Manager** for credential management with 30-day rotation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Use CDK Constructs pattern (not Stack classes in lib/)
- Implement proper VPC networking with public and private subnets

### Constraints

- DO NOT use hardcoded passwords anywhere in the code
- ALL database credentials must use AWS Secrets Manager integration
- DMS endpoints must use secrets_manager_secret_id parameter
- All resources must be fully destroyable (no Retain deletion policies)
- Implement encryption for all data at rest and in transit
- Apply resource tagging: Environment, MigrationPhase, CostCenter
- Use CDK Aspects to enforce encryption across all resources
- CloudWatch alarms must trigger for DMS replication lag greater than 60 seconds
- S3 buckets must have versioning enabled before cross-region replication
- ECS tasks must use task-level IAM roles with least privilege
- Security groups must follow principle of least privilege
- Include proper error handling and logging throughout
- Code must be production-ready and deployment-tested

## Success Criteria

- **Functionality**: Complete migration infrastructure deploys successfully in both environments
- **Security**: All credentials stored in Secrets Manager, no hardcoded passwords, encryption enabled
- **Replication**: DMS successfully replicates data with lag under 60 seconds
- **Observability**: CloudWatch dashboard displays all critical metrics in real-time
- **Resource Naming**: All resources include environmentSuffix in their names
- **Destroyability**: All resources can be deleted without manual intervention
- **Code Quality**: Clean Python code following CDK best practices, well-documented, deployable

## What to deliver

- Complete AWS CDK Python implementation with proper project structure
- RDS PostgreSQL instances in both environments with Secrets Manager integration
- AWS DMS replication infrastructure with continuous sync capability
- S3 buckets with cross-region replication configured
- ECS Fargate services behind Application Load Balancers
- Route 53 weighted routing configuration for traffic management
- CloudWatch dashboard with replication lag, database, and service metrics
- Migration runbook exported as CloudFormation stack outputs
- Proper VPC networking with security groups and IAM roles
- Unit tests and deployment documentation
