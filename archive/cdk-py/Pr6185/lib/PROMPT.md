# Payment Processing Infrastructure Migration

Hey team,

We need to build a comprehensive migration solution for our payment processing infrastructure. The business has mandated that we create a robust system that can safely migrate our payment processing workloads while maintaining zero downtime and data consistency. This is a critical project involving database replication, service migration, and traffic routing across infrastructure environments.

The current payment processing system handles thousands of transactions daily, and we cannot afford any data loss or service interruptions during migration. We need infrastructure that supports continuous replication, health monitoring, and the ability to roll back quickly if issues arise. The solution must include database migration with AWS DMS, cross-region S3 replication for transaction logs and audit trails, containerized service deployment with ECS Fargate, and intelligent traffic routing via Route 53.

This migration follows our standard cloud practices for environment consistency and multi-environment replication patterns. The infrastructure needs to be fully automated, secure, and provide comprehensive observability into the migration progress.

## What we need to build

Create a migration infrastructure using **AWS CDK with Python** for payment processing workload migration. The solution must orchestrate database replication, service deployment, storage replication, and traffic routing with comprehensive monitoring.

### Core Requirements

1. **Single-Stack Architecture**
   - Define all infrastructure resources in a single CDK stack
   - Include source and target database instances in the same stack
   - Create all DMS replication resources within the main stack
   - Consolidate Route53 traffic management in the main stack
   - Enable efficient resource management and deployment

2. **Database Layer**
   - Deploy source and target RDS PostgreSQL instances within the same stack
   - Instance type: db.r5.large with 100GB storage
   - Enable encryption at rest for both instances
   - Configure automated backups and point-in-time recovery
   - Use AWS Secrets Manager for database credentials (no hardcoded passwords)
   - Apply security groups with least privilege access
   - Configure logical replication parameters for DMS support

3. **Data Replication with AWS DMS**
   - Create DMS prerequisite IAM roles (dms-vpc-role, dms-cloudwatch-logs-role) in the main stack
   - Create DMS replication instance for continuous data sync within the stack
   - Configure source and target endpoints using Secrets Manager integration
   - Set up replication tasks with full load and CDC (Change Data Capture)
   - Implement table mappings for payment-related tables
   - Enable CloudWatch logging for replication monitoring
   - CRITICAL: Use postgre_sql_settings property with secrets_manager_secret_id parameter
   - Use CompositePrincipal with both regional and global DMS service principals

4. **Storage Layer**
   - Deploy source and target S3 buckets in the same stack for transaction logs
   - Configure S3 replication between source and target buckets
   - Enable versioning and encryption on all buckets
   - Set lifecycle policies for cost optimization (Glacier after 90 days)
   - Implement bucket policies for secure access
   - Create IAM role for S3 replication with appropriate permissions

5. **Application Services**
   - Deploy ECS Fargate cluster within the main stack
   - Configure Application Load Balancer for service access
   - Use nginx:latest container image for demo purposes
   - Implement auto-scaling based on CPU (70%) and memory (80%) metrics
   - Configure health checks on path "/" with proper timeouts
   - Container port, target group port, and security group rules must all use port 80
   - Use task-level IAM roles with access to Secrets Manager and S3

6. **Traffic Management**
   - Create Route 53 hosted zone within the main stack using .internal domain
   - Configure HTTP health checks for the ALB on port 80, path "/"
   - Create A records pointing to the ALB DNS name
   - Health checks should monitor ALB availability every 30 seconds
   - Set failure threshold to 3 for health check failures
   - Provide commands in CloudFormation outputs for traffic management

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

- All infrastructure defined using **AWS CDK with Python** in a **single stack**
- Stack name format: `TapStack{environmentSuffix}` (e.g., TapStackpr6185)
- Use **RDS PostgreSQL 14** for relational database with encryption
- Use **AWS DMS 3.5.4** for continuous database replication with Secrets Manager
- Use **S3** with replication between source and target buckets
- Use **ECS Fargate** and **ALB** for containerized application services (nginx:latest)
- Use **Route 53** for DNS health checks and A records
- Use **CloudWatch** for metrics, logs, dashboards, and alarms
- Use **AWS Secrets Manager** for credential management (password generation)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{source|target}-environmentSuffix
- Deploy to **us-east-1** region (configurable via CDK_DEFAULT_REGION)
- Single TapStack class in lib/tap_stack.py containing all resources
- Implement proper VPC networking with public and private subnets (2 AZs)
- DMS IAM roles must use CompositePrincipal (regional + global service principals)

### Constraints

- DO NOT use hardcoded passwords anywhere in the code
- ALL database credentials must use AWS Secrets Manager integration
- DMS endpoints must use `postgre_sql_settings` property (NOT top-level parameters)
- DMS endpoints must use `secrets_manager_secret_id` and `secrets_manager_access_role_arn`
- All resources must be fully destroyable (RemovalPolicy.DESTROY for dev/test)
- Implement encryption for all data at rest (RDS, S3) and in transit
- Apply resource tagging: Environment, MigrationPhase, CostCenter
- Use CDK Aspects (EncryptionAspect) to enforce S3 bucket encryption
- CloudWatch alarms must trigger for DMS replication lag greater than 60 seconds
- S3 buckets must have versioning enabled for replication to work
- ECS tasks must use task-level IAM roles with least privilege (S3, Secrets Manager access)
- Security groups must follow principle of least privilege (separate groups for RDS, DMS, ECS, ALB)
- Container port (80), target group port (80), and security group rules (80) must align
- Health check path must be "/" for nginx:latest container
- Import aws_route53_targets as separate module (NOT route53.targets)
- Code must be production-ready and deployment-tested
- Must create approximately 85-90 resources in the single stack

## Success Criteria

- **Functionality**: Complete migration infrastructure deploys successfully in a single stack (~85 resources)
- **Security**: All credentials stored in Secrets Manager, no hardcoded passwords, encryption enabled
- **Replication**: DMS successfully replicates data between source and target databases
- **Observability**: CloudWatch dashboard displays all critical metrics with proper alarms
- **Resource Naming**: All resources include environmentSuffix in their names
- **Destroyability**: All resources can be deleted without manual intervention
- **Code Quality**: Clean Python code following CDK best practices, well-documented, deployable
- **Stack Architecture**: Single TapStack{environmentSuffix} containing all infrastructure resources
- **Resource Count**: Approximately 85-90 CloudFormation resources in deployed stack

## What to deliver

- Complete AWS CDK Python implementation in a **single stack** with proper project structure
- app.py file creating one TapStack instance with environment suffix
- lib/tap_stack.py containing all infrastructure resources in TapStack class
- Source and target RDS PostgreSQL 14 instances with Secrets Manager integration
- DMS IAM roles (dms-vpc-role, dms-cloudwatch-logs-role) with CompositePrincipal
- AWS DMS replication infrastructure (replication instance, endpoints, tasks)
- Source and target S3 buckets with replication configuration
- ECS Fargate cluster and service behind Application Load Balancer
- Route 53 hosted zone with health checks and A records
- CloudWatch dashboard with 6 widgets (DMS lag, DB metrics, ECS, ALB)
- CloudWatch alarms for DMS lag, database CPU, and ECS health
- 33+ CloudFormation outputs for operational management
- Proper VPC networking (2 AZs) with 4 security groups and IAM roles
- EncryptionAspect to enforce S3 encryption
- Unit tests (69+ tests) covering all infrastructure components
- Integration tests (21+ tests) validating deployed AWS resources
