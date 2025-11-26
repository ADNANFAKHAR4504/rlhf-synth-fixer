Hey team,

We have a critical migration project coming up for one of our financial services clients. They're running a legacy on-premises payment processing system that handles about 50,000 transactions every day, and they need to move everything to AWS. The catch is that they have strict data residency requirements for GDPR compliance and absolutely cannot afford any downtime during the migration. We're talking about a live payment system here, so any disruption could cost them millions and damage their reputation severely.

The client's current infrastructure is aging and they're ready to modernize, but they're understandably nervous about the migration. They've asked us to implement a blue-green deployment strategy so they can run both environments in parallel, gradually shift traffic, and have the ability to instantly roll back if anything goes wrong. This isn't just a lift-and-shift migration, we need to build a sophisticated orchestration layer that can handle continuous data synchronization, real-time traffic shifting, and automatic health monitoring.

Their compliance team is particularly concerned about data residency since they operate under strict European financial regulations. Everything needs to stay in the Frankfurt region (eu-central-1), and we need comprehensive audit trails for all cross-account access. They also want detailed visibility into the migration progress with real-time metrics and automated alerting if anything starts to degrade.

## What we need to build

Create a comprehensive migration infrastructure using **Terraform with HCL** for orchestrating a zero-downtime blue-green deployment from on-premises to AWS.

### Core Requirements

1. **Database Infrastructure**
   - Aurora PostgreSQL cluster (version 14.6) with separate writer and reader endpoints
   - Deploy in private subnets across multiple availability zones
   - Enable SSL/TLS encryption for all database connections with certificate validation
   - Configure automated backups with 35-day point-in-time recovery
   - Set up continuous data replication from on-premises using DMS

2. **Data Migration Pipeline**
   - DMS replication instances for continuous data synchronization from on-premises database
   - Lambda functions for real-time data transformation during migration (1GB memory allocation)
   - Configure reserved concurrency for Lambda to guarantee performance during peak migration
   - S3 buckets for migration logs with 90-day retention and server-side encryption
   - Enable versioning and lifecycle policies on all S3 buckets for cost optimization

3. **Traffic Management**
   - Application Load Balancer with weighted target groups for gradual traffic shifting
   - Deploy ALB in public subnets across availability zones
   - Route53 health checks with automatic failback to on-premises if error rate exceeds 5%
   - Configure health check intervals and thresholds for rapid detection

4. **Session State Management**
   - DynamoDB tables with on-demand billing mode to handle variable migration loads
   - Configure for session state management during traffic transitions
   - Implement proper encryption at rest and in transit

5. **Monitoring and Observability**
   - CloudWatch dashboards displaying migration progress metrics and error rates
   - CloudWatch alarms triggering SNS notifications for migration failures or performance degradation
   - Track key metrics: transaction throughput, replication lag, error rates, latency

6. **Security and Compliance**
   - IAM roles with session tags for auditable cross-account access between blue and green environments
   - VPC endpoints for all AWS service communications to avoid internet gateway charges
   - Implement least-privilege access patterns throughout

7. **Network Infrastructure**
   - VPC with 3 availability zones spanning eu-central-1
   - Private subnets for compute and data tiers
   - Public subnets for ALB only
   - Transit Gateway connecting to on-premises datacenter via Direct Connect
   - Proper security groups and network ACLs

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Aurora PostgreSQL 14.6** for transactional database
- Use **DMS** for continuous data replication
- Use **Lambda** (1GB memory) for data transformation
- Use **Application Load Balancer** for traffic distribution
- Use **Route53** for health checks and DNS management
- Use **CloudWatch** for monitoring and alerting
- Use **S3** for log storage with encryption
- Use **IAM** for cross-account access with session tags
- Use **DynamoDB** with on-demand billing for session state
- Use **Transit Gateway** for on-premises connectivity
- Deploy to **eu-central-1** region
- Terraform version 1.5 or higher required
- AWS provider version 5.x required
- Resource names must include **environmentSuffix** for uniqueness across blue and green environments
- Follow naming convention: resource-type-environment-suffix

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies on any resources)
- FORBIDDEN: RemovalPolicy.RETAIN, DeletionPolicy: Retain, or prevent_destroy = true
- Blue and green environments must be completely independent and parallel
- Support for automated rollback capabilities
- Include terraform.tfvars.example showing environment-specific values

### Constraints

- SSL/TLS encryption mandatory for all database connections with certificate validation
- Automated backups with 35-day point-in-time recovery for RDS
- Reserved concurrency configured for all Lambda functions
- DynamoDB must use on-demand billing mode only
- S3 buckets must have versioning enabled and lifecycle policies
- VPC endpoints required for all AWS service communications
- CloudWatch alarms must trigger SNS notifications for failures
- All infrastructure must remain within eu-central-1 region
- Separate AWS accounts for blue and green environments with cross-account IAM roles

## Success Criteria

- **Functionality**: All 8 core requirements implemented and functional
- **Zero Downtime**: Traffic can shift between environments without service interruption
- **Automatic Failback**: Route53 health checks trigger failback if errors exceed 5%
- **Data Consistency**: DMS replication maintains data synchronization with minimal lag
- **Observability**: CloudWatch dashboards show real-time migration metrics
- **Security**: All constraints enforced including encryption, backups, and access controls
- **Resource Naming**: All resources include environmentSuffix for blue/green isolation
- **Code Quality**: Clean HCL code, well-tested, modular design, comprehensive documentation
- **Compliance**: GDPR-compliant data residency in eu-central-1

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Separate modules for blue and green environments
- Network infrastructure (VPC, subnets, Transit Gateway, VPC endpoints)
- Aurora PostgreSQL cluster with replication configuration
- DMS replication instances and tasks
- Lambda functions for data transformation
- Application Load Balancer with weighted target groups
- Route53 health checks and DNS configuration
- CloudWatch dashboards and alarms with SNS integration
- DynamoDB tables for session state
- S3 buckets for migration logs
- IAM roles and policies for cross-account access with session tags
- terraform.tfvars.example with all configurable parameters
- README.md with deployment instructions and architecture overview
- Unit tests for Terraform configuration validation
