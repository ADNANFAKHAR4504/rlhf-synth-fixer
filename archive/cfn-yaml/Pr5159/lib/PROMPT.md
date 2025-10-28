# Student Records Database Infrastructure

Hey team,

We've got an interesting project from a large university that's modernizing their student records management system. They're dealing with sensitive educational data under FERPA regulations, so security and compliance are non-negotiable. The system needs to handle thousands of students across multiple campus locations, especially during those crazy peak registration periods when everyone's trying to sign up for classes at once.

Right now, their legacy system can't handle the load and doesn't meet modern security standards. They need something that's highly available, can recover quickly from failures, and keeps student data encrypted and secure. We're talking about Multi-AZ deployments, automated credential rotation, and proper disaster recovery capabilities.

I've been asked to create this infrastructure using **CloudFormation with YAML** for AWS deployment in the ca-central-1 region.

## What we need to build

Create a highly available database infrastructure using **CloudFormation with YAML** for a university student records management system that handles sensitive educational data with proper encryption, backup, and disaster recovery mechanisms.

### Core Requirements

1. **Database Infrastructure**
   - Multi-AZ RDS PostgreSQL database cluster for high availability
   - Automated failover capability to handle regional failures
   - Performance optimization for concurrent access from multiple campus locations
   - Proper backup and retention policies

2. **Caching and Session Management**
   - ElastiCache Redis cluster for managing user sessions
   - Must handle high concurrent access during peak registration periods
   - Proper cluster configuration for performance and reliability

3. **Security and Compliance**
   - Database credentials stored in AWS Secrets Manager
   - Automatic credential rotation every 30 days
   - All data encrypted at rest using AWS KMS
   - All data encrypted in transit using TLS/SSL
   - FERPA compliance for educational data privacy
   - Proper security groups and network isolation

4. **Monitoring and Operations**
   - CloudWatch monitoring for database and cache metrics
   - Logging enabled for audit and troubleshooting
   - Proper tagging for resource management

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Amazon RDS PostgreSQL** with Multi-AZ deployment
- Use **Amazon ElastiCache Redis** for session caching
- Use **AWS Secrets Manager** with automatic rotation configuration
- Use **AWS KMS** for encryption key management
- Deploy to **ca-central-1** region
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-name}-${EnvironmentSuffix}`
- Ensure at least 80% of named resources include the suffix
- Use VPC security groups for network security
- Enable CloudWatch logging and monitoring

### Constraints

- Must deploy to ca-central-1 region
- FERPA compliance required for educational data
- Automated credential rotation every 30 days mandatory
- Multi-AZ deployment for high availability
- All resources must be destroyable (no DeletionPolicy: Retain)
- Encryption at rest and in transit required for all data stores
- Must handle concurrent access from multiple locations
- Performance must be maintained during peak registration periods

## Success Criteria

- **Functionality**: Complete RDS Multi-AZ cluster with automatic failover
- **Functionality**: ElastiCache Redis cluster properly configured
- **Security**: All credentials in Secrets Manager with 30-day rotation
- **Security**: All data encrypted at rest with KMS keys
- **Security**: All connections use TLS/SSL encryption in transit
- **Compliance**: FERPA-compliant configuration with proper access controls
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Operations**: CloudWatch monitoring and logging enabled
- **Reliability**: Automated backups configured with proper retention
- **Destroyability**: All resources can be cleanly deleted (no Retain policies)

## What to deliver

- Complete CloudFormation YAML template (TapStack.yml)
- Multi-AZ RDS PostgreSQL database with encryption
- ElastiCache Redis cluster configuration
- AWS Secrets Manager secret with rotation Lambda
- KMS encryption keys for RDS and ElastiCache
- Security groups with least privilege access
- VPC configuration (or use default VPC appropriately)
- CloudWatch monitoring configuration
- Proper parameters including EnvironmentSuffix
- Stack outputs for database endpoints and resource identifiers
- All resources properly tagged and named
