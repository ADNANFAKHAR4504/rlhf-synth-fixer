# Payment Processing System Migration to AWS

Hey team,

We need to migrate a legacy on-premises payment processing system to AWS. The current system processes about 50,000 transactions daily and we're dealing with strict PCI DSS compliance requirements. The business wants this migration done in phases to keep downtime minimal during the transition.

This is a critical migration for a financial services company. The existing infrastructure has been running on-premises for years, and moving to AWS will give us better scalability and disaster recovery capabilities. We need to maintain the same security posture while taking advantage of cloud-native services. The architecture needs to support the current transaction volume with room to scale as the business grows.

## What we need to build

Create a complete payment processing infrastructure using **CloudFormation with JSON** for a phased migration approach. The solution must maintain PCI DSS compliance throughout the migration process.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR 10.0.0.0/16 across 3 availability zones in us-east-1
   - Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for load balancers
   - Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for application servers
   - Database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24) for RDS
   - NAT Gateways in each availability zone for outbound connectivity
   - Internet Gateway for public subnet access

2. **Application Tier**
   - Application Load Balancer in public subnets with SSL termination (TLS 1.2 minimum)
   - EC2 instances (t3.large) in private subnets behind the ALB (no Auto Scaling group)
   - EC2 instances must have no direct internet access (private subnet only)
   - Instances use gp3 EBS volumes (100GB, 3000 IOPS)

3. **Database Layer**
   - RDS Aurora MySQL cluster in database subnets
   - One writer instance and one reader instance
   - Encryption at rest using customer-managed KMS keys
   - Point-in-time recovery enabled with 7-day backup retention period
   - Database connections limited to 100 (CloudWatch alarm threshold)

4. **Security Configuration**
   - Security groups with least privilege access:
     - HTTPS (443) from internet to Application Load Balancer
     - HTTP (80) from ALB to EC2 instances
     - MySQL (3306) from EC2 instances to RDS Aurora
   - AWS WAF attached to ALB with rate limiting rules (2000 requests per 5-minute window)
   - IAM roles for EC2 instances with permissions to access Parameter Store and S3
   - All sensitive configuration values stored in AWS Systems Manager Parameter Store
   - VPC Flow Logs enabled to S3 with 90-day lifecycle policy

5. **Storage and Artifacts**
   - S3 bucket for application artifacts with versioning enabled
   - S3 bucket encryption using default SSE-S3
   - Proper IAM policies for EC2 instances to access the bucket

6. **Monitoring and Logging**
   - CloudWatch Log Groups for application logs with 30-day retention period
   - CloudWatch alarms for CPU utilization > 80%
   - CloudWatch alarms for database connections > 100
   - Centralized logging for troubleshooting and compliance

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON format**
- Use **Application Load Balancer** for traffic distribution with SSL termination
-- Use **EC2 instances** (t3.large) in private subnets (no Auto Scaling Group)
- Use **RDS Aurora MySQL** cluster with one writer and one reader
- Use **KMS** customer-managed keys for database encryption
- Use **AWS WAF** with rate limiting for DDoS protection
- Use **Systems Manager Parameter Store** for configuration management
- Use **S3** for application artifacts with versioning
- Use **CloudWatch** for logging and monitoring
- Use **VPC Flow Logs** for network traffic analysis
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resourceType-environment-suffix`
- All resources must be destroyable (no Retain policies or deletion protection)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: Template must accept an environmentSuffix parameter and all named resources must include it for uniqueness
- **Destroyability**: All resources must use RemovalPolicy: Delete (CloudFormation default) - no Retain policies
- **RDS Deletion**: Set DeletionPolicy to Delete and SkipFinalSnapshot to true for Aurora cluster
- **S3 Deletion**: Buckets should allow deletion (no retention policies that block cleanup)
- **KMS Keys**: Use DeletionPolicy: Delete with PendingWindowInDays set to 7 days minimum
- **No GuardDuty**: Do not create GuardDuty detector (account-level resource, one per account)

### Constraints

- PCI DSS compliance required - encryption at rest and in transit
- EC2 instances must be in private subnets with no direct internet access
- All database connections must be encrypted using SSL/TLS
- Rate limiting to prevent DDoS attacks (2000 requests per 5 minutes)
- NAT Gateways required for outbound connectivity from private subnets
- All resources must be properly tagged with Environment, CostCenter, and MigrationPhase
- CloudWatch alarms for proactive monitoring of CPU and database connections
- 7-day backup retention for point-in-time recovery
- All resources must be destroyable for cleanup after testing

## Success Criteria

-- **Functionality**: Complete multi-tier architecture with ALB and RDS Aurora
-- **Performance**: Appropriate instance sizing and ALB configuration keep CPU within acceptable limits under load
- **Reliability**: Multi-AZ deployment across 3 availability zones for high availability
- **Security**: PCI DSS compliant with encryption, WAF protection, least privilege IAM, and security groups
- **Resource Naming**: All resources include environmentSuffix for parallel deployment support
- **Monitoring**: CloudWatch logs and alarms provide visibility into system health
- **Code Quality**: Well-structured CloudFormation JSON template with proper dependencies and parameters

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with public, private, and database subnet tiers across 3 AZs
- Application Load Balancer with SSL termination and WAF protection
 - EC2 instances (t3.large) configured via Launch Template; scaling handled outside this template
- RDS Aurora MySQL cluster with encryption and backup configuration
- Security groups implementing least privilege access
- IAM roles with policies for Parameter Store and S3 access
- CloudWatch Log Groups with 30-day retention
- S3 bucket for artifacts with versioning enabled
- CloudWatch alarms for CPU and database monitoring
- VPC Flow Logs to S3 with lifecycle policy
- KMS customer-managed keys for database encryption
- Template parameters for environmentSuffix and environment-specific values
- Template outputs for ALB DNS name and key resource identifiers
- Comprehensive documentation explaining the architecture and deployment process
