# Payment Processing System Migration to AWS

Hey team,

We have a critical migration project for a financial services company that's moving their payment processing application from on-premises infrastructure to AWS. They're currently running on physical servers with a MySQL database and need to transition to a cloud-native architecture while maintaining PCI compliance. The business requirement is zero downtime during the migration, which means we need to be very careful about how we architect this.

The current setup is pretty straightforward but outdated - they have application servers talking to a MySQL database, all running on physical hardware in their data center. We need to modernize this to take advantage of AWS services while ensuring we meet their strict compliance requirements. The payment processing nature of this application means security and reliability are absolutely critical.

They want to use this migration as an opportunity to improve their architecture with proper high availability across multiple availability zones, better monitoring, and automated backups. The database migration needs to happen with zero downtime using AWS Database Migration Service, so we can replicate from their on-premises MySQL to AWS RDS while the application continues to run.

## What we need to build

Create a complete infrastructure migration solution using **CloudFormation with YAML** for a payment processing system moving from on-premises to AWS.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 3 availability zones for high availability
   - 3 public subnets for Application Load Balancer and NAT Gateways
   - 3 private subnets for application and database tiers
   - Internet Gateway for public subnet internet access
   - NAT Gateways in each AZ for private subnet outbound connectivity
   - Route tables configured appropriately for public and private subnets

2. **Database Migration**
   - RDS MySQL Multi-AZ instance with encryption enabled using KMS
   - Automated backups configured with appropriate retention
   - DMS replication instance for zero-downtime database migration
   - DMS source endpoint for on-premises MySQL database
   - DMS target endpoint for RDS MySQL instance
   - DB subnet group spanning the 3 private subnets
   - Database credentials stored securely in Secrets Manager with automatic rotation disabled initially

3. **Application Infrastructure**
   - Application Load Balancer in public subnets with HTTPS listener
   - Target group for EC2 instances running payment application
   - EC2 Auto Scaling group configuration for application servers
   - Launch template or configuration for EC2 instances

4. **Security Configuration**
   - Security group for ALB allowing HTTPS (443) traffic from internet
   - Security group for application servers allowing traffic only from ALB
   - Security group for RDS allowing MySQL (3306) traffic only from application servers
   - Security group for DMS replication instance with appropriate access
   - All security groups must follow least privilege principle
   - KMS key for RDS encryption at rest

5. **Monitoring and Alarms**
   - CloudWatch alarm for RDS CPU utilization above 80 percent
   - CloudWatch alarm for RDS free storage space below 10GB
   - SNS topic for alarm notifications

6. **IAM Roles and Policies**
   - IAM role for DMS with necessary permissions for replication
   - IAM role for EC2 instances with necessary application permissions
   - Appropriate trust policies and permissions boundaries

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** for network isolation with 3 availability zones
- Use **RDS MySQL Multi-AZ** for database with encryption and automated backups
- Use **AWS Database Migration Service (DMS)** for zero-downtime database migration
- Use **Application Load Balancer** for traffic distribution
- Use **EC2 Auto Scaling** for application tier elasticity
- Use **KMS** for encryption key management
- Use **Secrets Manager** for database credential storage
- Use **CloudWatch** for monitoring and alarms
- Use **NAT Gateways** for private subnet internet access
- Use **Security Groups** for network security controls
- Use **IAM** for access management
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `payment-processing-{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Apply consistent tagging with Environment, Project, and CostCenter tags across all resources

### Constraints

- Must use AWS Database Migration Service (DMS) for database migration
- RDS instances must be encrypted at rest using AWS KMS
- All resources must be tagged with Environment, Project, and CostCenter tags for cost tracking and compliance
- Database credentials must be stored in AWS Secrets Manager
- Secrets Manager automatic rotation must be disabled initially
- VPC must have separate subnets for web, application, and database tiers
- Security groups must follow least privilege principle with documented ingress rules
- Must include CloudWatch alarms for RDS CPU utilization above 80 percent and storage below 10GB
- All resources must be destroyable with no Retain deletion policies
- RDS Multi-AZ deployment will take 20-30 minutes to provision
- Consider Aurora Serverless v2 as alternative for faster provisioning if appropriate
- Security groups must only allow HTTPS traffic from internet to ALB
- Security groups must only allow MySQL traffic between application servers and RDS

## Success Criteria

- **Functionality**: Complete VPC networking with multi-AZ architecture, operational RDS MySQL database, functional DMS replication setup, working ALB with target groups
- **Performance**: RDS Multi-AZ for high availability, proper subnet sizing, efficient routing tables
- **Reliability**: Multi-AZ deployment across 3 availability zones, automated RDS backups, CloudWatch alarms for critical metrics
- **Security**: Encryption at rest with KMS, secure credential storage in Secrets Manager, least privilege security groups, PCI compliance ready architecture
- **Resource Naming**: All resources include environmentSuffix parameter following consistent naming pattern
- **Monitoring**: CloudWatch alarms configured for RDS CPU above 80 percent and storage below 10GB with SNS notifications
- **Tagging**: All resources tagged with Environment, Project, and CostCenter for compliance and cost tracking
- **Code Quality**: Clean CloudFormation YAML, well-documented parameters and outputs, proper resource dependencies

## What to deliver

- Complete CloudFormation template in YAML format
- VPC with Internet Gateway, NAT Gateways, route tables, and 6 subnets (3 public, 3 private) across 3 AZs
- RDS MySQL Multi-AZ instance with encryption, automated backups, and DB subnet group
- DMS replication instance with source and target endpoints configured
- Application Load Balancer with target group and HTTPS listener
- EC2 Auto Scaling group configuration with launch template
- Security groups for ALB, application servers, RDS, and DMS with least privilege rules
- KMS key for RDS encryption
- Secrets Manager secret for database credentials with rotation disabled
- CloudWatch alarms for RDS CPU and storage metrics with SNS topic
- IAM roles and policies for DMS and EC2 instances
- Comprehensive CloudFormation outputs including VPC ID, subnet IDs, RDS endpoint, ALB DNS name, security group IDs
- All resources with Environment, Project, and CostCenter tags
- Parameters including environmentSuffix, database credentials, instance types, and CIDR blocks
