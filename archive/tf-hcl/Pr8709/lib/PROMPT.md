# Payment Processing Migration to AWS

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
   - Private subnets connect to ECS Fargate containers and RDS Aurora cluster
   - Route tables configured so private resources route traffic through NAT Gateways for outbound connectivity

2. **ECS Fargate Service**
   - Deploy containerized payment processing application using ECS Fargate
   - Containers must run in private subnets and connect through security groups
   - Service integrates with Application Load Balancer target groups for traffic routing
   - Support blue and green environments connected to separate ALB target groups for zero-downtime deployment
   - Task definitions with appropriate CPU and memory allocations

3. **RDS Aurora PostgreSQL Cluster**
   - Multi-AZ Aurora PostgreSQL cluster connected across all three availability zones
   - Automated backups with 7-day retention period
   - All data encrypted at rest using KMS customer-managed keys integrated with the cluster
   - Database subnet group associated with private subnets in all AZs
   - DMS connects to this cluster as the target endpoint for migration

4. **Application Load Balancer**
   - ALB deployed in public subnets and listening on ports 80 and 443
   - Two target groups: one routing to blue environment, one routing to green environment
   - SSL/TLS termination using certificates integrated from AWS Certificate Manager
   - Health checks configured to monitor each target group
   - Listener rules route incoming traffic to the active environment based on rules

5. **AWS Database Migration Service**
   - DMS replication instance connects to both source Oracle and target Aurora endpoints
   - Replication instance in private subnet communicates through security groups
   - Continuous replication enabled to sync data from Oracle to Aurora PostgreSQL
   - Source endpoint connects to on-premises Oracle database
   - Target endpoint connects to Aurora PostgreSQL cluster
   - Migration task configured for full load and ongoing replication

6. **IAM Roles and Policies**
   - ECS task execution role allows pulling container images from ECR and writing logs to CloudWatch
   - ECS task role provides access to required AWS services like Secrets Manager and S3
   - DMS service role connects to both source and target databases
   - All roles follow principle of least privilege with specific actions and resources defined

7. **CloudWatch Log Groups**
   - Separate log groups connected to ECS containers, ALB access logs, and DMS task logs
   - All log groups configured with exactly 90-day retention for compliance tracking
   - Log streams organized by service and environment

8. **Tagging Strategy**
   - All infrastructure components include Environment tag
   - CostCenter tag for cost allocation tracking
   - MigrationPhase tag to identify blue vs green resources
   - Names for all infrastructure components include the environmentSuffix variable for uniqueness

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Terraform 1.5 or later with AWS provider version 5.x
- Deploy to **us-east-1** region
- **VPC** with proper subnet segmentation connects resources across 3 availability zones
- **ECS Fargate** hosts containerized application in private subnets and integrates with ALB
- **RDS Aurora PostgreSQL** with Multi-AZ connects through private subnet group
- **Application Load Balancer** routes traffic to ECS target groups
- **AWS DMS** replicates data from Oracle source to Aurora target continuously
- **KMS** customer-managed keys encrypt all data at rest
- **AWS Certificate Manager** provides SSL/TLS certificates attached to ALB listeners
- **NAT Gateways** allow private subnets to access internet for outbound traffic
- **IAM** roles grant least privilege permissions with explicit actions
- **CloudWatch** Log Groups store logs with 90-day retention
- Names for all resources include the environmentSuffix variable for uniqueness
- Follow naming convention: resource-type-environmentSuffix

### Mandatory Constraints

- All data encrypted at rest using KMS customer-managed keys integrated with RDS and EBS volumes
- Network traffic between application tiers flows through private subnets only with no direct internet access
- Database migration uses AWS DMS with continuous replication streaming data from Oracle to Aurora
- Application logs retained for exactly 90 days in CloudWatch for PCI-DSS compliance
- Each environment tagged identically: Environment, CostCenter, MigrationPhase
- RDS instances configured with automated backups storing 7-day retention period
- ALB listeners attach SSL/TLS certificates from AWS Certificate Manager
- Security groups configured with least privilege rules allowing only necessary traffic between specific sources
- All resources destroyable with no Retain policies for testing purposes
- NAT Gateways provide outbound internet access for private subnet resources
- ECS tasks run only in private subnets with no public IP assignment

### Deployment Requirements - CRITICAL

- All infrastructure components must include the environmentSuffix variable in their names for uniqueness
- Example naming: vpc-dev, alb-dev, ecs-service-dev, aurora-cluster-dev
- RemovalPolicy and DeletionPolicy must be configured to allow destruction with no RETAIN policies
- All IAM roles use unique names with environmentSuffix appended
- KMS key aliases include environmentSuffix to avoid naming conflicts

## Success Criteria

- **Functionality**: Complete infrastructure supporting blue-green deployment with database migration working end-to-end
- **High Availability**: Multi-AZ deployment across 3 availability zones providing fault tolerance
- **Security**: All data encrypted at rest with KMS, all network traffic in private subnets, security groups limiting traffic
- **Compliance**: 90-day log retention tracking audit trail, proper tagging for cost allocation, automated backups with 7-day retention
- **Zero Downtime**: Blue-green architecture allowing traffic switching without downtime using ALB listener rules
- **Database Migration**: DMS continuous replication streaming from Oracle to Aurora PostgreSQL
- **Naming Convention**: All infrastructure components include environmentSuffix for uniqueness in shared environments
- **Code Quality**: Clean HCL code, well-organized modules, comprehensive documentation

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with 3 AZs, public and private subnets connected through route tables, NAT Gateways for outbound access
- ECS Fargate cluster and service integrated with ALB for blue and green environments
- RDS Aurora PostgreSQL Multi-AZ cluster encrypted with KMS, accessible through security groups
- Application Load Balancer with target groups routing traffic to ECS services and ACM certificate integration
- AWS DMS replication instance connecting source Oracle to target Aurora endpoints with continuous data sync
- IAM roles and policies granting least privilege access with explicit permissions
- CloudWatch Log Groups collecting logs with 90-day retention enforced
- KMS customer-managed keys encrypting data at rest for RDS and EBS
- Security groups controlling traffic flow between services with least privilege rules
- All resources tagged with Environment, CostCenter, MigrationPhase for tracking and cost allocation
- README with deployment instructions and architecture overview explaining service connectivity
