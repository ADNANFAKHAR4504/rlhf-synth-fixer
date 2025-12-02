Hey team,

We need to build a database migration solution for a financial services company that's moving from on-premises MySQL to AWS RDS Aurora. The business needs to minimize downtime and maintain data integrity during the cutover. I've been asked to create this using JSON with CloudFormation, targeting the us-east-1 region.

The company processes financial transactions in production and needs a highly available, encrypted database cluster. They're deploying across three availability zones with Multi-AZ configuration. The VPC has three private database subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) with no internet access for security isolation.

## What we need to build

Create an RDS Aurora MySQL infrastructure using **CloudFormation with JSON** for database migration from on-premises.

### Core Requirements

1. **Aurora DB Cluster Configuration**
   - MySQL 8.0 engine compatibility mode
   - One writer instance and two reader instances
   - Instance class: db.r5.large for all instances
   - Deployed in private subnets only

2. **Security and Encryption**
   - Customer-managed KMS key for encryption at rest
   - Proper KMS key policy for RDS access
   - Security group allowing MySQL traffic (port 3306) only from application subnet CIDR blocks
   - Deletion protection enabled to prevent accidental removal

3. **Backup and Retention**
   - 30-day automated backup retention
   - Preferred backup window: 03:00-04:00 UTC
   - Performance Insights enabled with 7-day retention period

4. **Database Configuration**
   - DB cluster parameter group with UTF8MB4 character set
   - DB subnet group using three private subnet IDs (provided as parameters)

5. **Outputs and Integration**
   - Cluster endpoint for write operations
   - Reader endpoint for read operations
   - KMS key ARN for application configuration

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS** for Aurora MySQL cluster
- Use **KMS** for encryption key management
- Use **EC2** security groups for network access control
- Use **VPC** subnet groups for database placement
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region
- Use parameters for subnet IDs and application CIDR blocks for reusability

### Constraints

- RDS Aurora cluster must use MySQL 8.0 compatibility mode
- Database encryption at rest must use AWS KMS with customer-managed key
- Cluster must have exactly one writer and two reader instances
- Automated backups must retain snapshots for 30 days
- Database must be deployed in private subnets only
- Performance Insights must be enabled with 7-day retention
- All resources must be destroyable (no Retain deletion policies)
- Include proper parameter validation and descriptions

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names
- Use RemovalPolicy: Delete or DeletionPolicy: Delete (no Retain policies)
- Resources must be fully destroyable for testing and cleanup
- Parameter-driven design for cross-environment reusability

## Success Criteria

- Functionality: All 10 requirements from problem statement implemented
- Security: KMS encryption, isolated security groups, private subnets
- Reliability: Multi-AZ deployment, 30-day backups, deletion protection
- Performance: Performance Insights enabled, proper instance sizing
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: JSON, well-structured, parameterized, documented

## What to deliver

- Complete CloudFormation JSON template
- KMS key with proper key policy
- RDS Aurora MySQL cluster (MySQL 8.0 compatible)
- Three DB instances (1 writer, 2 readers) of db.r5.large class
- DB subnet group spanning three availability zones
- Security group with MySQL port access rules
- DB cluster parameter group with UTF8MB4 character set
- CloudFormation outputs for endpoints and KMS key ARN
- Parameters for subnet IDs and application CIDR blocks
