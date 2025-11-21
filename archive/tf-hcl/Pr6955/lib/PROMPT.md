Hey team,

We have a critical migration project coming up. One of our financial services clients needs to move their payment processing application from their on-premises data center to AWS. This isn't just a lift-and-shift situation - we need to ensure zero downtime during the migration and maintain strict PCI-DSS compliance throughout. The application currently handles payment processing APIs, so any disruption would be catastrophic for their business.

The technical challenge here is interesting. We're migrating from an Oracle database to Aurora PostgreSQL while the application continues to run. The client wants a blue-green deployment strategy so they can switch traffic between environments without risk. We also need to ensure that every aspect of the infrastructure meets PCI-DSS requirements, which means encryption everywhere, strict network isolation, and comprehensive audit logging.

I've been asked to create the infrastructure code in **Terraform with HCL** for this migration. The business has been very clear about their requirements and constraints - they need multi-AZ deployment across three availability zones, all sensitive data encrypted with customer-managed KMS keys, and absolutely no downtime during the cutover.

## What we need to build

Create a complete AWS migration infrastructure using **Terraform with HCL** for a payment processing application. This will support a blue-green deployment strategy with continuous database replication from on-premises Oracle to Aurora PostgreSQL.

### Core Requirements

1. **VPC Configuration**
   - VPC spanning 3 availability zones in us-east-1 region
   - Each AZ must have both public and private subnets
   - Public subnets for Application Load Balancers and NAT Gateways
   - Private subnets for ECS Fargate containers and RDS Aurora cluster
   - Proper route tables to ensure private resources use NAT Gateways for outbound connectivity

2. **ECS Fargate Service**
   - Deploy containerized payment processing application using ECS Fargate
   - Containers must run in private subnets only
   - Service must support blue and green environments for zero-downtime deployment
   - Task definitions with appropriate CPU and memory allocations
   - Integration with Application Load Balancer target groups

3. **RDS Aurora PostgreSQL Cluster**
   - Multi-AZ Aurora PostgreSQL cluster for high availability
   - Deploy across all three availability zones
   - Automated backups with 7-day retention period
   - All data encrypted at rest using AWS KMS customer-managed keys
   - Database subnet group spanning private subnets in all AZs

4. **Application Load Balancer**
   - ALB deployed in public subnets across all three AZs
   - Two target groups: one for blue environment, one for green environment
   - SSL/TLS termination using AWS Certificate Manager certificates
   - Health checks configured for each target group
   - Listener rules to route traffic to active environment

5. **AWS Database Migration Service**
   - DMS replication instance for Oracle to Aurora migration
   - Replication instance in private subnet with appropriate security groups
   - Continuous replication enabled for ongoing data sync
   - Source endpoint for on-premises Oracle database
   - Target endpoint for Aurora PostgreSQL cluster
   - Migration task configured for full load and ongoing replication

6. **IAM Roles and Policies**
   - ECS task execution role with permissions to pull container images and write logs
   - ECS task role with least privilege access to required AWS services
   - DMS service role with permissions to access source and target databases
   - All roles following principle of least privilege

7. **CloudWatch Log Groups**
   - Separate log groups for ECS container logs, ALB access logs, and DMS task logs
   - All log groups configured with exactly 90-day retention for compliance
   - Log streams organized by service and environment

8. **Resource Tagging**
   - All resources must include Environment tag
   - CostCenter tag for cost allocation tracking
   - MigrationPhase tag to identify blue vs green resources
   - Resource names must include **environmentSuffix** variable for uniqueness

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Terraform 1.5 or later with AWS provider version 5.x
- Deploy to **us-east-1** region
- Use **VPC** with proper subnet segmentation across 3 availability zones
- Use **ECS Fargate** for containerized application hosting in private subnets
- Use **RDS Aurora PostgreSQL** with Multi-AZ for database layer
- Use **Application Load Balancer** with target groups for blue-green deployment
- Use **AWS DMS** for continuous database replication from Oracle to Aurora
- Use **KMS** customer-managed keys for all encryption at rest
- Use **AWS Certificate Manager** for SSL/TLS certificates on ALB
- Use **NAT Gateways** for outbound internet access from private subnets
- Use **IAM** roles with least privilege permissions
- Use **CloudWatch** Log Groups with 90-day retention
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix

### Mandatory Constraints

- All data must be encrypted at rest using AWS KMS customer-managed keys (RDS, EBS volumes)
- Network traffic between application tiers must traverse private subnets only (no direct internet access)
- Database migration must use AWS DMS with continuous replication enabled
- Application logs must be retained for exactly 90 days for PCI-DSS compliance
- Each environment must have identical resource tagging: Environment, CostCenter, MigrationPhase
- RDS instances must have automated backups with 7-day retention period
- ALB must use SSL/TLS certificates from AWS Certificate Manager
- Security groups must follow principle of least privilege with no 0.0.0.0/0 ingress rules
- All resources must be destroyable with no Retain policies (for testing purposes)
- NAT Gateways required for private subnet outbound internet access
- ECS tasks must only run in private subnets with no public IP assignment

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** variable in their names for uniqueness
- Example naming: vpc-dev, alb-dev, ecs-service-dev, aurora-cluster-dev
- Resource RemovalPolicy/DeletionPolicy must allow destruction (no RETAIN policies)
- All IAM roles must have unique names using environmentSuffix
- KMS key aliases must include environmentSuffix to avoid conflicts

## Success Criteria

- **Functionality**: Complete infrastructure supporting blue-green deployment with database migration
- **High Availability**: Multi-AZ deployment across 3 availability zones for fault tolerance
- **Security**: All data encrypted at rest, all network traffic in private subnets, no public 0.0.0.0/0 ingress
- **Compliance**: 90-day log retention, proper tagging, automated backups with 7-day retention
- **Zero Downtime**: Blue-green architecture allowing traffic switching without downtime
- **Database Migration**: DMS continuous replication from Oracle to Aurora PostgreSQL
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean HCL code, well-organized modules, comprehensive documentation

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with 3 AZs, public and private subnets, NAT Gateways
- ECS Fargate cluster and service for blue and green environments
- RDS Aurora PostgreSQL Multi-AZ cluster with KMS encryption
- Application Load Balancer with target groups and ACM certificate integration
- AWS DMS replication instance, endpoints, and migration task
- IAM roles and policies with least privilege
- CloudWatch Log Groups with 90-day retention
- KMS customer-managed keys for encryption
- Security groups following least privilege principle
- All resources tagged with Environment, CostCenter, MigrationPhase
- README.md with deployment instructions and architecture overview
