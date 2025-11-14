# Payment Processing Infrastructure Migration

Hey team,

We need to build infrastructure for a financial services company that is migrating their payment processing system from an on-premises data center to AWS. This is a critical migration project where we need to replicate their existing three-tier architecture while maintaining strict PCI DSS compliance requirements and ensuring zero downtime during the migration phase.

The current on-premises setup processes thousands of payment transactions daily, and we need to ensure the AWS infrastructure can handle this load while providing better scalability and reliability. The business is particularly concerned about security, compliance, and making sure we can run both systems in parallel during the migration.

I have been asked to create this infrastructure using **Pulumi with Python**. The company has standardized on Pulumi for infrastructure as code, and the team is experienced with Python, so this combination makes sense for them.

## What we need to build

Create a complete three-tier web application infrastructure using **Pulumi with Python** for migrating a payment processing system from on-premises to AWS in the us-east-1 region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across two availability zones
   - Proper network isolation for security and compliance
   - Support for parallel operation with on-premises systems during migration

2. **Load Balancing**
   - Application Load Balancer in public subnets
   - HTTPS listeners with SSL certificates from ACM
   - Target group with proper health checks
   - Handle production payment traffic with high availability

3. **Compute Layer**
   - Auto Scaling Group with EC2 instances in private subnets
   - Minimum 2 instances for high availability
   - Maximum 6 instances to handle peak loads
   - Spread instances across both availability zones
   - Support gradual traffic migration from on-premises

4. **Database Layer**
   - RDS MySQL with Multi-AZ deployment in private subnets
   - Encrypted storage using customer-managed KMS keys
   - Automatic backups and point-in-time recovery
   - Production-grade performance and reliability

5. **Storage**
   - S3 bucket for application logs with versioning enabled
   - S3 bucket for static content with versioning enabled
   - Proper lifecycle policies and access controls

6. **Security Configuration**
   - Security groups following principle of least privilege
   - HTTPS traffic from internet to ALB
   - HTTP traffic from ALB to EC2 instances
   - MySQL traffic from EC2 to RDS
   - No 0.0.0.0/0 inbound rules for compliance
   - Customer-managed KMS keys for encryption

7. **IAM and Access Management**
   - IAM roles for EC2 instances
   - Policies for accessing S3 buckets
   - Least privilege access controls

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation across two availability zones
- Use **Application Load Balancer** for distributing traffic
- Use **Auto Scaling Group** with EC2 instances (min 2, max 6)
- Use **RDS MySQL Multi-AZ** for database high availability
- Use **S3** buckets for logs and static content
- Use **KMS** customer-managed keys for encryption
- Use **ACM** for SSL certificate management
- Use **Security Groups** for network access control
- Use **IAM** roles and policies for permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- RDS instance must use encrypted storage with customer-managed KMS keys
- EC2 instances must be spread across at least two availability zones
- Application Load Balancer must use HTTPS listeners with SSL certificates from ACM
- Security groups must follow principle of least privilege with no 0.0.0.0/0 inbound rules
- All resources must be tagged with Environment, CostCenter, and MigrationPhase tags
- All resources must be destroyable after testing (no Retain policies)
- Use Pulumi configuration values for environment-specific settings (instance types, database credentials, environment name)
- Include proper error handling and logging
- S3 buckets must have versioning enabled

## Success Criteria

- **Functionality**: Complete three-tier architecture supporting payment processing migration
- **High Availability**: Multi-AZ deployment for database and compute resources
- **Security**: Encrypted storage, HTTPS communication, least privilege access
- **Scalability**: Auto Scaling Group handles variable load (2-6 instances)
- **Compliance**: PCI DSS requirements met (encryption, network isolation, no public database access)
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Configuration Management**: Use Pulumi config for instance types, credentials, and environment settings
- **Code Quality**: Well-structured Python code, properly documented, follows Pulumi best practices

## What to deliver

- Complete Pulumi Python implementation in __main__.py
- VPC with public and private subnets across 2 AZs
- Application Load Balancer with HTTPS listeners and target groups
- Auto Scaling Group with launch configuration for EC2 instances
- RDS MySQL Multi-AZ instance with KMS encryption
- S3 buckets for application logs and static content
- Security groups for ALB, EC2, and RDS with proper ingress/egress rules
- KMS customer-managed keys for RDS encryption
- IAM roles and policies for EC2 instances
- Stack exports for ALB DNS name, RDS endpoint, and S3 bucket names
- Proper resource tagging for all components
- Configuration using Pulumi config for environment-specific values
