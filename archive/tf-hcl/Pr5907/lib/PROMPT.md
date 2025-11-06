# Payment Processing Application Migration to AWS

Hey team,

We've got an important project on our hands. A financial services company needs to migrate their payment processing application from their legacy on-premises environment to AWS. This is a critical system that handles real payment transactions, so we need to be extremely careful about maintaining compliance and minimizing downtime during the migration.

The business has been running this application on physical servers with a PostgreSQL database for years, and they're ready to modernize their infrastructure. They need us to create a robust AWS environment that maintains their PCI DSS compliance requirements while giving them the scalability and reliability benefits of cloud infrastructure. The migration needs to be executed carefully with a proper blue-green deployment strategy so they can switch over with zero downtime.

I've been asked to create this infrastructure using **Terraform with HCL**. The company wants to leverage AWS's managed services where possible to reduce operational overhead, but they also need fine-grained control over security and networking to meet their compliance requirements.

## What we need to build

Create a production-grade infrastructure using **Terraform with HCL** for migrating a payment processing application to AWS with zero-downtime migration capabilities.

### Core Requirements

1. **Networking Infrastructure**
   - VPC with 2 public subnets and 4 private subnets across 2 availability zones
   - NAT Gateways for outbound internet access from private subnets
   - Internet Gateway for public subnet connectivity
   - Proper route tables and subnet associations

2. **Database Migration**
   - RDS PostgreSQL instance (db.r6g.large) with Multi-AZ deployment
   - Automated backups with 7-day retention period
   - Encryption at rest using KMS
   - AWS DMS replication instance for database migration from on-premises
   - DMS source and target endpoints configured for PostgreSQL

3. **Compute Layer**
   - Auto Scaling Group with launch template using Amazon Linux 2023 AMI
   - EC2 instances deployed in private subnets
   - Blue-green deployment tags on Auto Scaling Group for traffic shifting
   - IAM instance profile with necessary permissions

4. **Load Balancing**
   - Application Load Balancer in public subnets
   - Target group with health checks configured
   - Listener rules for routing traffic to application

5. **Security Controls**
   - AWS WAF rules attached to Application Load Balancer
   - Rate limiting of 2000 requests per 5 minutes per IP address
   - Separate security groups for web tier, application tier, and database tier
   - All data encrypted in transit and at rest

6. **Secrets and Configuration Management**
   - AWS Secrets Manager for database credentials
   - Automatic secret rotation configured for 30-day cycle
   - Systems Manager Parameter Store for application configuration values
   - Proper IAM permissions for applications to retrieve secrets

7. **Monitoring and Logging**
   - CloudWatch Log Groups for application logs with 30-day retention
   - CloudWatch alarms for key metrics
   - Proper log aggregation from EC2 instances

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation and multi-tier architecture
- Use **RDS PostgreSQL** for managed relational database with Multi-AZ
- Use **AWS DMS** for zero-downtime database migration
- Use **Auto Scaling Groups** for application layer with blue-green deployment capability
- Use **Application Load Balancer** for distributing traffic
- Use **AWS WAF** for web application firewall protection
- Use **Secrets Manager** for credential management
- Use **Systems Manager** for configuration management
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environment_suffix** for uniqueness across environments
- Follow naming convention: `payment-{resource-type}-${var.environment_suffix}`
- Deploy to **ap-southeast-1** region

### Constraints

- Must maintain PCI DSS compliance throughout migration
- All database connections must use encryption in transit
- Database credentials cannot be hardcoded or stored in plain text
- Must use separate security groups with least privilege access
- All resources must be destroyable without Retain policies for testing
- Blue-green deployment pattern required for zero-downtime cutover
- Automated backups enabled for disaster recovery
- Multi-AZ deployment for high availability
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: Complete working infrastructure that can host payment processing application
- **Migration Ready**: DMS configured and ready to replicate database from on-premises
- **High Availability**: Multi-AZ deployment across 2 availability zones
- **Security**: All data encrypted, secrets managed properly, WAF rules active
- **Compliance**: Architecture supports PCI DSS requirements
- **Zero Downtime**: Blue-green deployment tags enable traffic shifting without downtime
- **Resource Naming**: All resources include environment_suffix variable
- **Monitoring**: CloudWatch logs and alarms configured for observability
- **Code Quality**: Clean HCL code, well-organized, properly documented

## What to deliver

- Complete Terraform HCL implementation with proper file organization
- VPC with public and private subnets, NAT Gateways, routing
- RDS PostgreSQL Multi-AZ instance with encryption
- AWS DMS replication instance and endpoints
- Auto Scaling Group with launch template
- Application Load Balancer with target groups
- AWS WAF with rate limiting rules
- Secrets Manager with rotation configuration
- Systems Manager Parameter Store resources
- CloudWatch Log Groups with retention policies
- Security groups for each tier (web, app, database)
- IAM roles and policies with least privilege
- Unit tests for infrastructure validation
- Documentation and deployment instructions
