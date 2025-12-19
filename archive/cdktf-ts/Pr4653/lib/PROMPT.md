Hey team,

We need to build a highly available, PCI-DSS compliant database infrastructure for FinTech Corp's financial trading platform. They're processing credit card transactions at scale - roughly 10,000 transactions per minute during peak trading hours - and need a secure, compliant solution that meets all regulatory requirements.

The business is dealing with sensitive payment card data, so security and compliance are non-negotiable. They need automatic failover, disaster recovery, and comprehensive monitoring. The platform has to maintain 99.99% availability because any downtime directly impacts trading operations and revenue.

This is a complex infrastructure challenge that requires careful orchestration of multiple AWS services. We need to ensure everything is encrypted, credentials are automatically rotated, and the entire system can recover from failures without manual intervention.

## What we need to build

Create a PCI-DSS compliant financial trading infrastructure using **CDKTF with TypeScript** for secure transaction processing at scale.

### Core Requirements

1. **Database Layer**
   - Multi-AZ RDS Aurora cluster with encryption at rest using KMS
   - Automatic failover capability for high availability
   - Support for 10,000 transactions per minute during peak hours
   - Encryption at rest with AES-256

2. **Caching and Session Management**
   - ElastiCache Redis cluster for session management
   - Multi-AZ deployment for redundancy
   - Encryption in transit and at rest

3. **Audit and Compliance**
   - EFS file system for audit log storage
   - Encrypted storage for compliance requirements
   - Proper backup and retention policies

4. **Security and Secrets Management**
   - Secrets Manager for database credential storage
   - Automatic credential rotation every 30 days
   - KMS encryption for all secrets
   - Proper IAM roles and policies

5. **API Access Layer**
   - API Gateway with mutual TLS authentication
   - Secure endpoints for transaction processing
   - Integration with backend services
   - Request throttling and monitoring

6. **Real-time Processing**
   - Kinesis Data Streams for real-time transaction processing
   - Proper sharding configuration for high throughput
   - Stream encryption using KMS

7. **Encryption and Key Management**
   - KMS keys for encryption across all services
   - Separate keys for different data classifications
   - Key rotation policies enabled

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **RDS Aurora** for the primary database with Multi-AZ deployment
- Use **ElastiCache Redis** for session caching
- Use **EFS** for audit log storage with encryption
- Use **Secrets Manager** with automatic 30-day rotation for credentials
- Use **API Gateway** with mutual TLS for secure API access
- Use **Kinesis Data Streams** for real-time transaction processing
- Use **KMS** for encryption key management with AES-256
- Resource names must include a **string suffix** (environmentSuffix) for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **ca-central-1** region
- All data encrypted at rest and in transit using AES-256
- Proper security groups with least privilege access
- IAM roles following principle of least privilege

### Constraints

- Must meet PCI-DSS compliance requirements
- Database must maintain 99.99% availability
- All database credentials must be rotated automatically every 30 days
- All secrets must be stored with KMS encryption
- All API endpoints must use mutual TLS authentication
- Multi-AZ deployment required for high availability
- All data at rest and in transit must be encrypted using AES-256
- Must handle approximately 10,000 transactions per minute during peak hours
- All resources must be destroyable (no Retain policies)
- Automatic failover capability required
- Disaster recovery capabilities required
- Deploy only to ca-central-1 region

### Monitoring and Logging

- CloudWatch metrics for all services
- CloudWatch Logs for application and audit logs
- Alarms for critical metrics (database performance, API errors, etc.)
- Enable detailed monitoring for RDS and ElastiCache

## Success Criteria

- **Functionality**: All 7 AWS services properly configured and integrated
- **Performance**: System handles 10,000 transactions per minute with sub-second latency
- **Reliability**: 99.99% availability with automatic failover working correctly
- **Security**: All PCI-DSS requirements met, encryption everywhere, credentials auto-rotate every 30 days
- **Compliance**: Audit logs properly stored and encrypted, mutual TLS on all API endpoints
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript with proper types, well-tested, properly documented
- **Disaster Recovery**: Backup and restore capabilities functional

## What to deliver

- Complete CDKTF TypeScript implementation
- RDS Aurora cluster (Multi-AZ, encrypted, automatic failover)
- ElastiCache Redis cluster (Multi-AZ, encrypted)
- EFS file system (encrypted, for audit logs)
- Secrets Manager secrets with automatic 30-day rotation
- API Gateway with mutual TLS configuration
- Kinesis Data Streams for real-time processing
- KMS keys for encryption across all services
- Proper IAM roles and policies
- Security groups with least privilege
- CloudWatch monitoring and alarms
- Unit tests for all components
- Documentation and deployment instructions
