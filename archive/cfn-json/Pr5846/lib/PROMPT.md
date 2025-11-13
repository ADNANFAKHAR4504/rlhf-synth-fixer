# RDS PostgreSQL Database Migration

Hey team,

We need to build infrastructure for migrating our legacy on-premises PostgreSQL database to AWS RDS. The current database serves about 500 concurrent users during peak hours, and management is adamant about zero data loss and minimal downtime during the migration. I've been asked to create this using **CloudFormation with JSON** to define all the infrastructure we need.

The business wants this done right - Multi-AZ for high availability, proper security with credentials stored in Secrets Manager, and full monitoring so we can catch issues before they become problems. We're talking about a production database here, so there's no room for cutting corners.

This is a fairly standard database migration pattern, but we need to be thorough with the configuration. The application team needs specific connection details and the security team wants everything encrypted and properly isolated in private subnets.

## What we need to build

Create an AWS RDS PostgreSQL infrastructure using **CloudFormation with JSON** for migrating a production database from on-premises to the cloud.

### Core Requirements

1. **RDS Database Instance**
   - PostgreSQL version 14 engine
   - Multi-AZ deployment for high availability
   - Instance type: db.r6g.xlarge
   - 100GB gp3 storage with encryption enabled
   - Deploy in existing private subnets only

2. **Network Configuration**
   - DB subnet group using existing subnet IDs: subnet-1a2b3c4d, subnet-2a3b4c5d, subnet-3a4b5c6d
   - Security group allowing PostgreSQL traffic (port 5432) only from application subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - Must use existing VPC: vpc-0a1b2c3d4e5f

3. **Security and Credentials**
   - Store database credentials in AWS Secrets Manager
   - Automatic rotation disabled initially for migration phase
   - Enable encryption at rest using AWS KMS
   - All traffic restricted to private subnets

4. **Database Configuration**
   - Custom parameter group with UTF8 encoding (client_encoding and server_encoding)
   - Set max_connections to 1000 to handle peak load
   - Automated backups with 7-day retention period
   - Backup window: 03:00-04:00 UTC

5. **Monitoring and Performance**
   - Enable Performance Insights with 7-day free tier retention
   - CloudWatch alarm for CPU utilization above 80%
   - CloudWatch alarm for free storage space below 10GB
   - Proper alarm actions for notification

6. **Outputs and Integration**
   - Database endpoint address
   - Database port
   - Secrets Manager ARN for credential retrieval
   - All connection details needed by application team

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** format
- Use **Amazon RDS** for PostgreSQL 14 database
- Use **AWS Secrets Manager** for credential storage
- Use **AWS KMS** for encryption keys
- Use **Amazon VPC** for security groups and networking
- Use **Amazon CloudWatch** for alarms and monitoring
- Use **RDS Performance Insights** for query analysis
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: ResourceName${EnvironmentSuffix}
- Deploy to **us-east-1** region

### Constraints

- Must use RDS PostgreSQL version 14 with Multi-AZ deployment
- Database instance type must be db.r6g.xlarge (no alternatives)
- Storage must be 100GB gp3 with encryption enabled
- Deploy only in private subnets (no public accessibility)
- Security group must restrict access to application subnets only
- Backup retention must be exactly 7 days
- Parameter group must configure UTF8 encoding
- Max connections must be set to 1000
- Performance Insights retention must be 7 days (free tier)
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation
- Use parameters for reusability (VPC ID, subnet IDs, CIDR blocks)

## Success Criteria

- **Functionality**: Complete RDS PostgreSQL 14 instance with Multi-AZ, proper networking, and security
- **Performance**: Performance Insights enabled, parameter group optimized for 1000 connections
- **Reliability**: Automated backups configured, Multi-AZ deployment for failover
- **Security**: Encryption at rest, credentials in Secrets Manager, private subnet deployment only
- **Monitoring**: CloudWatch alarms for CPU and storage with proper thresholds
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: JSON format, well-structured, parameterized, properly tagged

## What to deliver

- Complete CloudFormation JSON template implementation
- RDS PostgreSQL 14 instance with Multi-AZ deployment
- DB subnet group and security group configuration
- Secrets Manager secret for database credentials
- KMS key for encryption
- Custom RDS parameter group with UTF8 encoding
- CloudWatch alarms for CPU and storage monitoring
- Performance Insights enabled
- All outputs for application integration
- Proper tagging: Environment: Production, Purpose: DatabaseMigration
- Parameter-driven design for reusability
- Clear documentation of all resources and dependencies
