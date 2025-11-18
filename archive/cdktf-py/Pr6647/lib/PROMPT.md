Hey team,

We need to build a migration system for our payment processing infrastructure. I've been asked to create this using CDKTF with Python. The business wants to move from our current single-region deployment to a multi-region architecture without any downtime, and we need to maintain PCI compliance throughout the entire migration process.

This is a complex migration for a financial services company's payment processing system. The current setup is all in one region, and we need to expand to two regions while keeping everything running. We're dealing with workspace-based environments for legacy, migration, and production phases, so we can roll back at any stage if needed.

The architecture needs to span us-east-1 as our primary region and us-east-2 as secondary. We'll need VPCs with private subnets across multiple availability zones, Aurora PostgreSQL as a global database, ECS Fargate services with blue-green deployments, and S3 buckets with cross-region replication for transaction logs and audit trails.

## What we need to build

Create a multi-region payment processing migration system using **CDKTF with Python** that allows incremental migration with zero downtime.

### Core Requirements

1. **Workspace Configuration**
   - Define workspace configurations for 'legacy', 'migration', and 'production' environments
   - Support conditional resource creation based on migration phase variables
   - Allow incremental migration with rollback capability at any phase

2. **Network Infrastructure**
   - Create VPCs in both us-east-1 and us-east-2 with non-overlapping CIDR blocks
   - Set up private subnets across 3 availability zones per region
   - Configure VPC peering with Transit Gateway for inter-region connectivity
   - Use data sources to import existing security groups and subnet IDs from legacy infrastructure

3. **Database Layer**
   - Set up Aurora PostgreSQL global database spanning both regions
   - Configure automated backups and point-in-time recovery
   - Implement customer-managed KMS keys for encryption at rest
   - Ensure encryption in transit for all database connections

4. **Compute Services**
   - Configure ECS Fargate services in both regions
   - Implement blue-green deployment capability using target group switching
   - Set up Application Load Balancers for traffic distribution
   - Configure auto-scaling policies for handling variable loads

5. **Storage and Replication**
   - Implement S3 buckets with cross-region replication for transaction logs
   - Set up separate buckets for audit trails with replication
   - Configure customer-managed KMS keys for S3 encryption
   - Implement versioning and lifecycle policies

6. **Security and Access Management**
   - Define IAM roles and policies following principle of least privilege
   - Create service-specific roles for ECS, Lambda, and other services
   - Implement customer-managed KMS keys for all encryption needs
   - Configure encryption in transit and at rest for all data

7. **Traffic Management**
   - Configure Route 53 with weighted routing policies
   - Support gradual traffic shifting between regions
   - Implement health checks for automated failover

8. **Monitoring and Alerting**
   - Set up CloudWatch alarms for key metrics in both regions
   - Configure SNS notifications for critical events
   - Monitor database replication lag, ECS service health, and S3 replication status
   - Track migration phase metrics

9. **State Management**
   - Implement DynamoDB table for Terraform state locking
   - Use S3 backend for state storage with versioning enabled
   - Prevent concurrent modifications during migration
   - Use remote state data sources to reference existing infrastructure

10. **Migration Controls**
    - Tag all resources with migration phase and cutover timestamp
    - Use lifecycle rules to prevent accidental destruction of critical resources
    - Implement conditional resource creation based on phase variables
    - Support workspace-based environment separation

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** for network isolation in both us-east-1 and us-east-2
- Use **Aurora PostgreSQL Global Database** for database layer
- Use **ECS Fargate** for containerized workloads
- Use **S3** with cross-region replication for storage
- Use **Application Load Balancer** for traffic distribution
- Use **Route 53** for DNS and traffic routing
- Use **KMS** for customer-managed encryption keys
- Use **IAM** for access control and service permissions
- Use **CloudWatch** and **SNS** for monitoring and notifications
- Use **DynamoDB** for Terraform state locking
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `payment-{resource-type}-{environment}-{suffix}`
- Deploy to **us-east-1** (primary) and **us-east-2** (secondary) regions
- Terraform version 1.5+ with AWS provider 5.x required

### Constraints

- Tag all resources with migration phase and cutover timestamp for tracking
- Implement conditional resource creation based on migration phase variables
- Use remote state data sources to reference existing infrastructure during migration
- Implement state file locking with DynamoDB to prevent concurrent modifications
- Use lifecycle rules to prevent accidental destruction of critical resources during migration
- Use workspace-based environment separation for staging the migration
- All data must be encrypted in transit and at rest using customer-managed KMS keys
- All resources must be destroyable without Retain policies for testing purposes
- Follow principle of least privilege for all IAM roles and policies
- Maintain PCI compliance requirements throughout the migration
- Network CIDR blocks must not overlap between regions
- Support zero downtime during migration phases
- Include proper error handling and logging for all components

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** parameter in their names
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- All resources must be fully destroyable for testing environments
- Resource naming pattern: `payment-{resource-type}-{environment}-{suffix}`
- Example: `payment-vpc-production-abc123`, `payment-db-cluster-migration-xyz789`

## Success Criteria

- **Functionality**: Complete multi-region architecture with all services deployed
- **Migration Support**: Incremental migration with rollback capability at any phase
- **Performance**: Database replication lag under 100ms, API response times under 200ms
- **Reliability**: 99.99% uptime during migration, automated failover between regions
- **Security**: All data encrypted with customer-managed KMS keys, least privilege IAM policies
- **Compliance**: PCI compliant throughout migration, audit trails for all changes
- **State Management**: DynamoDB locking prevents concurrent modifications
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch alarms for all critical metrics with SNS notifications
- **Code Quality**: Python, well-tested, modular design, comprehensive documentation

## What to deliver

- Complete CDKTF Python implementation with modular structure
- VPCs in us-east-1 and us-east-2 with Transit Gateway peering
- Aurora PostgreSQL global database with automated backups
- ECS Fargate services with blue-green deployment support
- Application Load Balancers with target group configuration
- S3 buckets with cross-region replication for logs and audit trails
- IAM roles and policies with least privilege access
- KMS customer-managed keys for all encryption needs
- CloudWatch alarms and SNS topics for monitoring
- Route 53 hosted zone with weighted routing policies
- DynamoDB table for state locking
- Variables file defining migration phases (legacy, migration, production)
- Example configuration file showing migration stage setup
- Unit tests for all stack components with comprehensive coverage
- Integration tests validating cross-region functionality
- Documentation and deployment instructions for each migration phase