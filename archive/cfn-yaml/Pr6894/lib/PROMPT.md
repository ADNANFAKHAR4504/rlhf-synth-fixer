# Loan Processing Web Application Infrastructure

Hey team,

We need to build infrastructure for a customer-facing loan processing web application for a financial services company. The business has been asking for a production-grade deployment that meets PCI-DSS compliance standards for handling sensitive financial information. I've been tasked to create this infrastructure using **CloudFormation with YAML**.

The application will serve customers applying for loans, so availability and security are critical. We're talking about handling sensitive financial data, storing loan documents, and processing applications in real-time. The business has also specified we need disaster recovery capabilities and must be able to scale during high-traffic periods.

The architecture needs to be distributed across multiple availability zones for fault tolerance, with load balancing, auto-scaling containers, a replicated database cluster, and secure document storage. We're also expected to deliver static assets quickly through a CDN and monitor everything with CloudWatch.

## What we need to build

Create a fault-tolerant web application infrastructure using **CloudFormation with YAML** for loan processing in the financial services domain.

### Core Infrastructure Requirements

1. **Container Platform**
   - ECS Fargate cluster for running the loan processing application
   - Auto-scaling policies based on CloudWatch metrics (CPU and database connections)
   - Task definitions with proper resource limits and health checks

2. **Database Layer**
   - Aurora MySQL cluster with one writer and two reader instances
   - Multi-AZ deployment across 3 availability zones
   - SSL/TLS encryption for all database connections with certificate validation
   - Encrypted storage using customer-managed KMS keys
   - Automated backups with cross-region replication

3. **Load Balancing and Routing**
   - Application Load Balancer with path-based routing
   - Health checks configured for ECS targets
   - Deploy in public subnets with proper security groups

4. **Storage Infrastructure**
   - S3 buckets for document storage with encryption at rest
   - Versioning enabled on all buckets
   - Lifecycle policies to transition objects to Glacier after 180 days
   - Separate buckets for documents and static assets

5. **Content Delivery**
   - CloudFront distribution for static assets
   - Origin Access Identity for secure S3 access
   - HTTPS-only access with TLS 1.2 minimum

6. **Networking**
   - VPC spanning 3 availability zones in us-east-1
   - Public subnets for ALB deployment
   - Private subnets for ECS tasks and RDS instances
   - NAT Gateways in each AZ for outbound connectivity from private subnets
   - Network ACLs and route tables properly configured

7. **Security and Access Control**
   - IAM roles with least-privilege permissions for all services
   - Security groups with minimal required ports open
   - KMS keys for encryption with proper key policies
   - CloudTrail logging for audit compliance

8. **Monitoring and Alerting**
   - CloudWatch alarms for CPU utilization (threshold: 70%)
   - CloudWatch alarms for memory utilization
   - CloudWatch alarms for database connection count (threshold: 80%)
   - Application logs encrypted at rest
   - Log retention set to exactly 90 days for compliance

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Amazon ECS Fargate** for container orchestration
- Use **Amazon RDS Aurora MySQL** for database with multi-AZ
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon S3** with encryption and versioning
- Use **Amazon CloudFront** for content delivery
- Use **AWS KMS** for encryption key management
- Use **Amazon CloudWatch** for monitoring and logging
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region
- All resources must support disaster recovery in us-west-2

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- Use DeletionPolicy: Delete for all resources
- Include RemovalPolicy configuration where applicable
- Auto-scaling must trigger on CPU utilization at 70% threshold
- Auto-scaling must trigger on active database connections at 80% threshold
- Database connections MUST use SSL/TLS with certificate validation
- Application logs MUST be encrypted at rest
- Log retention MUST be exactly 90 days
- S3 lifecycle policies MUST transition to Glacier after exactly 180 days

### Constraints

- All database connections must use SSL/TLS encryption with certificate validation enabled
- Application logs must be encrypted at rest and retained for exactly 90 days for compliance
- Auto-scaling must trigger based on both CPU utilization (70%) and active database connections (80%)
- All S3 buckets must have versioning enabled and lifecycle policies to transition objects to Glacier after 180 days
- RDS instances must use encrypted storage with customer-managed KMS keys and automated backups to a separate region
- Security groups must follow least-privilege principle
- All data at rest must be encrypted
- Deletion protection should be configurable via parameter
- Infrastructure must support PCI-DSS compliance requirements

## Success Criteria

- **Functionality**: Complete infrastructure deploys successfully with all components
- **High Availability**: Application remains available if any single AZ fails
- **Performance**: Auto-scaling responds within 5 minutes to load changes
- **Security**: All security best practices implemented (encryption, IAM, security groups)
- **Compliance**: Infrastructure meets PCI-DSS requirements for data handling
- **Monitoring**: All critical metrics have CloudWatch alarms configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Clean YAML, well-structured, follows CloudFormation best practices
- **Disaster Recovery**: Database backups replicate to us-west-2

## What to deliver

- Complete CloudFormation YAML template in lib/ directory
- Parameter definitions for environmentSuffix and deletion protection
- VPC with 3 availability zones, public and private subnets
- NAT Gateways for private subnet internet access
- ECS Fargate cluster with auto-scaling task definitions
- Application Load Balancer with target groups and listeners
- Aurora MySQL cluster with writer and reader instances
- S3 buckets with encryption, versioning, and lifecycle policies
- CloudFront distribution with Origin Access Identity
- IAM roles for ECS tasks, RDS enhanced monitoring, and CloudFormation
- KMS keys for encryption with proper key policies
- Security groups for ALB, ECS, and RDS with minimal access
- CloudWatch log groups with 90-day retention and encryption
- CloudWatch alarms for CPU, memory, and database metrics
- Stack outputs for ALB DNS, database endpoint, S3 bucket names, and CloudFront URL
- Documentation in lib/README.md with deployment instructions
