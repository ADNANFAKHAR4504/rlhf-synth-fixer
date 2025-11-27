# Blue-Green Migration Infrastructure

Hey team,

We need to build a complete blue-green deployment infrastructure for migrating our database and containerized workloads to a new environment. The business wants zero-downtime migrations with full rollback capability and comprehensive monitoring throughout the migration process.

I've been asked to create this using **AWS CDK with Python**. We need to support migrating an Aurora PostgreSQL database with read replicas across multiple availability zones, along with containerized applications running on ECS. The migration needs to be safe, automated, and reversible at any point.

The key challenge here is coordinating database schema migrations with application deployments. We need to validate schema compatibility before promoting traffic, ensure credentials are rotated securely, and maintain high availability throughout the entire process. The team also wants comprehensive observability so we can monitor the health of both blue and green environments during the transition.

## What we need to build

Create a blue-green migration infrastructure using **AWS CDK with Python** that supports zero-downtime migrations for both databases and containerized workloads with full rollback capability.

### Core Requirements

1. **Database Infrastructure**
   - Deploy Aurora PostgreSQL cluster with read replicas across 3 availability zones
   - Enable automated backups with 7-day retention period
   - Enable point-in-time recovery for the database
   - Configure deletion protection on production database resources
   - Use environment-based toggles for deletion protection

2. **Container Orchestration**
   - Create ECS service with rolling deployment configuration
   - Configure Application Load Balancer with health checks
   - Implement SSL termination at the load balancer
   - Support blue-green traffic switching capability

3. **Security and Credentials**
   - Implement Secrets Manager for database credentials storage
   - Document manual rotation process for database credentials
   - Implement least-privilege IAM roles with session-based credentials
   - Use proper service principals for all IAM trust policies

4. **Migration Validation**
   - Create Lambda function to validate database schema compatibility before migration
   - Lambda should check schema differences between blue and green environments
   - Include error handling and detailed logging

5. **Monitoring and Observability**
   - Set up CloudWatch alarms for CPU utilization
   - Set up CloudWatch alarms for memory utilization
   - Set up CloudWatch alarms for database connection count
   - Create alarms for both blue and green environments

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- Configure custom VPC with isolated subnets for database and application tiers
- Use NAT Gateway for outbound connectivity from private subnets
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be destroyable (use RemovalPolicy.DESTROY, no RemovalPolicy.RETAIN)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources MUST accept and use an `environment_suffix` parameter
- **Destroyability**: All resources MUST use `RemovalPolicy.DESTROY` - no `RemovalPolicy.RETAIN` policies allowed
- **VPC Endpoints**: DO NOT create any VPC endpoints (account quota reached) - use NAT Gateway instead
- **CloudWatch Logs KMS**: DO NOT set kms_key_id on CloudWatch log groups - use default encryption
- **KMS Usage**: Only use KMS for Aurora database, Secrets Manager, and S3 - not for CloudWatch Logs
- **IAM Trust Policies**: ECS task roles must use `iam.ServicePrincipal("ecs-tasks.amazonaws.com")`
- **Secrets Manager Rotation**: Do not configure automatic rotation with Lambda - document manual rotation process

### Constraints

- Multi-AZ deployment required for high availability
- Database must be in isolated private subnets with no internet access
- ECS tasks must be in private subnets with NAT Gateway for outbound access
- All sensitive data encrypted at rest using KMS
- All data encrypted in transit using TLS
- Implement proper tagging for cost allocation and resource management
- Follow AWS Well-Architected Framework best practices
- Include proper error handling and logging throughout
- No VPC endpoints due to account limitations - use NAT Gateway for AWS service access
- CloudWatch Logs must use default encryption only

## Success Criteria

- **Functionality**: Complete infrastructure supports blue-green database and container migrations
- **Performance**: Multi-AZ deployment ensures sub-second failover for databases
- **Reliability**: Automated backups and point-in-time recovery protect against data loss
- **Security**: All credentials in Secrets Manager, least-privilege IAM roles, encryption at rest and in transit
- **Observability**: CloudWatch alarms provide visibility into system health during migrations
- **Resource Naming**: All resources include environmentSuffix for uniqueness and multi-environment support
- **Deployment**: All resources can be successfully deployed and destroyed without manual intervention
- **Code Quality**: Python code with proper type hints, documentation, and error handling

## What to deliver

- Complete AWS CDK Python implementation
- Aurora PostgreSQL cluster with multi-AZ read replicas
- ECS service with Application Load Balancer and health checks
- Secrets Manager secret for database credentials
- Lambda function for schema validation with proper IAM permissions
- Custom VPC with public, private, and isolated subnets across 3 AZs
- NAT Gateway for private subnet internet access
- CloudWatch alarms for monitoring (CPU, memory, database connections)
- IAM roles with least-privilege permissions
- KMS keys for Aurora, Secrets Manager, and S3 encryption
- Comprehensive Python documentation with deployment instructions
- README with architecture overview and operational procedures
