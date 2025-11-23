Hey team,

We have an urgent requirement from a federal government agency that needs a comprehensive disaster recovery solution for their sensitive citizen data. They're currently running their primary database in eu-west-1, and we've been tasked to build out a complete DR infrastructure that meets FedRAMP High compliance standards. The stakes are high here - we're talking about sensitive government data, so security and reliability are paramount.

The business requirements are pretty clear: they need an RPO of 1 hour and an RTO of 4 hours. That means if something goes wrong, they can't lose more than an hour of data, and they need to be back online within 4 hours. This is a non-negotiable requirement for FedRAMP compliance, and the agency has made it clear that this is a critical project.

I've been asked to implement this using **AWS CDK with Python** targeting the **eu-west-2 region**. The architecture needs to handle database replication, file system backups, secure credential management, and session state management across potential regional failures.

## What we need to build

Create a FedRAMP-compliant disaster recovery solution using **AWS CDK with Python** that provides automated failover capabilities for a government database system. All infrastructure must be deployed in the **eu-west-2 region**.

### Core Requirements

1. **Database Disaster Recovery**
   - Amazon RDS Multi-AZ deployment for high availability
   - Cross-region read replica for disaster recovery
   - Automated backup with point-in-time recovery
   - Support for RPO of 1 hour maximum

2. **File System Backup**
   - Amazon EFS for shared file storage
   - Automated backup solution with hourly frequency
   - Cross-region backup replication
   - Fast restore capabilities to meet 4-hour RTO

3. **Credential Management**
   - AWS Secrets Manager for all database credentials
   - Automatic credential rotation enabled
   - Secure access patterns for applications
   - Compliance with FIPS 140-2 encryption standards

4. **Session Management**
   - ElastiCache cluster for distributed session state
   - Multi-AZ deployment for high availability
   - Automatic failover capability
   - Secure in-transit encryption

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon RDS** with Multi-AZ deployment and cross-region read replica
- Use **Amazon EFS** with AWS Backup for automated backup solution
- Use **AWS Secrets Manager** for credential storage with automatic rotation
- Use **ElastiCache Redis** for session management
- Deploy all resources to **eu-west-2 region**
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resourcetype-environment-suffix
- All data encrypted at rest using FIPS 140-2 validated encryption
- All data encrypted in transit using TLS 1.2 or higher

### Constraints

- All resources must be deployed in eu-west-2 region
- Must comply with FedRAMP High security controls
- Database credentials must never be hardcoded or stored in plain text
- All resources must be destroyable without data retention policies
- RPO must not exceed 1 hour
- RTO must not exceed 4 hours
- All encryption must use FIPS 140-2 validated cryptographic modules
- Implement proper IAM least privilege access controls
- Enable CloudWatch logging and monitoring for all components

## Success Criteria

- **Functionality**: Complete disaster recovery solution with automated backups and cross-region replication
- **Performance**: Achieves RPO of 1 hour and RTO of 4 hours
- **Reliability**: Multi-AZ deployment with automatic failover for all critical components
- **Security**: FIPS 140-2 compliant encryption, Secrets Manager integration, IAM least privilege
- **Compliance**: Meets FedRAMP High requirements for data protection and disaster recovery
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean Python code, well-documented, follows CDK best practices
- **Monitoring**: CloudWatch alarms and logging enabled for all components

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- Database stack with RDS Multi-AZ and cross-region read replica
- EFS file system with AWS Backup configuration
- Secrets Manager secrets with automatic rotation
- ElastiCache cluster with Multi-AZ deployment
- VPC with proper subnet configuration for Multi-AZ
- Security groups with least privilege access
- IAM roles with appropriate permissions
- CloudWatch alarms for monitoring critical metrics
- Unit tests for all infrastructure components
- Documentation explaining the DR architecture and failover procedures
