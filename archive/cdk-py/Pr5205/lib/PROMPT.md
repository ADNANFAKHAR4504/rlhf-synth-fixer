# Disaster Recovery Solution for Government Database

Hey team,

We've been tasked with building a critical disaster recovery infrastructure for a Japanese government agency that manages sensitive citizen data. This system needs to be rock-solid with high availability guarantees and must meet strict FedRAMP Moderate compliance requirements. The business has made it clear that any downtime could impact citizen services, so we need RPO under 1 hour and RTO under 15 minutes.

The current challenge is that they don't have proper failover capabilities, and their database credentials are managed manually, which is both a security risk and operationally inefficient. We need to architect this using **AWS CDK with Python** to provision a fully automated disaster recovery solution in the eu-central-2 region.

This isn't just about spinning up some RDS instances. We need proper encryption everywhere, automated credential rotation, cross-AZ failover, and transaction log storage that can help with point-in-time recovery. Everything needs to be infrastructure-as-code so we can replicate this setup and ensure consistency across environments.

## What we need to build

Create a disaster recovery infrastructure using **AWS CDK with Python** for a government database system that handles sensitive citizen information with automated failover and comprehensive security controls.

### Core Requirements

1. **Database High Availability**
   - Deploy RDS with Multi-AZ configuration for automatic failover
   - Primary and standby instances across different availability zones
   - Automated failover mechanism with minimal downtime
   - Database encryption at rest using customer-managed KMS keys

2. **Credential Management**
   - Store all database credentials in AWS Secrets Manager
   - Enable automatic credential rotation every 30 days
   - No hardcoded credentials anywhere in the code
   - Proper IAM roles for secret access

3. **Transaction Log Storage**
   - Amazon EFS file system for storing transaction logs
   - Mount targets in multiple availability zones
   - Encrypted at rest and in transit
   - Used for point-in-time recovery scenarios

4. **Network Infrastructure**
   - VPC with proper subnet architecture across multiple AZs
   - Private subnets for database instances
   - Security groups with least privilege access
   - VPC endpoints where needed for AWS service communication

5. **Monitoring and Alerting**
   - CloudWatch alarms for database health metrics
   - Automated notifications for failover events
   - Performance monitoring and logging
   - Audit trails for compliance

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon RDS** for the database with Multi-AZ deployment
- Use **AWS Secrets Manager** for credential management with rotation
- Use **AWS KMS** for encryption key management
- Use **Amazon EFS** for transaction log storage
- Use **CloudWatch** for monitoring and alerting
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **eu-central-2** region

### Constraints

- All database credentials managed through Secrets Manager with 30-day rotation
- RDS must use Multi-AZ deployment with KMS encryption enabled
- Meet FedRAMP Moderate security controls
- RPO must be less than 1 hour
- RTO must be less than 15 minutes
- All resources must be fully destroyable for CI/CD workflows
- Follow principle of least privilege for all IAM policies
- Enable encryption in transit using TLS/SSL for all connections

## Success Criteria

- **Functionality**: Database failover works automatically with minimal downtime
- **Performance**: RPO under 1 hour, RTO under 15 minutes achieved
- **Reliability**: Multi-AZ deployment with automated health checks
- **Security**: All data encrypted at rest and in transit, credentials rotated automatically
- **Compliance**: Meets FedRAMP Moderate requirements
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: Production-ready Python code, well-tested, fully documented
- **Destroyability**: All resources can be cleanly torn down without manual intervention

## What to deliver

- Complete AWS CDK Python implementation organized as nested stacks
- VPC with multi-AZ subnet configuration
- KMS key for database encryption
- Secrets Manager secret with 30-day automatic rotation
- EFS file system with multi-AZ mount targets
- RDS Multi-AZ database instance with automated failover
- CloudWatch alarms and monitoring dashboards
- Security groups and IAM roles following least privilege
- Comprehensive unit tests with at least 90% code coverage
- Integration tests validating deployed infrastructure
- CloudFormation outputs for key resource identifiers
- Documentation covering architecture and deployment procedures
