Hey team,

We've been asked to build a PCI-DSS compliant transaction processing infrastructure for FinTech Corp, one of our financial services clients. They're processing credit card transactions at massive scale - we're talking 100,000 transactions per minute - and they need to maintain strict security and compliance standards while ensuring the system stays up 99.99% of the time.

The challenge here is real: they need sub-second response times on every transaction, complete encryption of all data (both at rest and in transit), and automated credential rotation every 30 days to meet PCI-DSS requirements. Their current setup can't handle the load, and they're worried about compliance audits. We need to design something that's both highly available and secure from the ground up.

I've been asked to implement this using **CDKTF with Python** for the us-west-2 region. The business has specific requirements around encryption, automated failover, and audit logging that we need to get right.

## What we need to build

Create a secure, PCI-DSS compliant database and transaction processing infrastructure using **CDKTF with Python** that handles high-volume financial transactions with guaranteed availability and security.

### Core Requirements

1. **High-Availability Database Layer**
   - RDS Aurora PostgreSQL cluster with Multi-AZ configuration
   - Read replicas for load distribution and 99.99% availability
   - Automated failover within 30 seconds
   - Encrypted storage using customer-managed KMS keys
   - Automated backup configuration for disaster recovery

2. **Secure File Storage**
   - Amazon EFS with encryption at rest using AWS KMS
   - Mount targets in multiple availability zones
   - Encrypted data transfer using TLS
   - Proper security group configuration

3. **Credential Management**
   - AWS Secrets Manager for database credentials
   - Automatic credential rotation every 30 days
   - Audit logging enabled for all secret access
   - Fetch secrets from EXISTING Secrets Manager entries (do not create new secrets)
   - Integration with RDS for seamless rotation

4. **High-Performance Caching**
   - ElastiCache Redis cluster for real-time transaction caching
   - Multi-AZ replication for high availability
   - Encryption at rest and in transit
   - Automatic failover capability

5. **API Layer**
   - API Gateway for transaction endpoints
   - Integration with backend services
   - Request/response logging
   - Throttling and rate limiting

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS Aurora PostgreSQL** for the primary database with read replicas
- Use **Amazon EFS** with KMS encryption for file storage
- Use **AWS Secrets Manager** with automatic 30-day rotation and audit logging
- Use **ElastiCache Redis** for transaction caching layer
- Use **API Gateway** for transaction API endpoints
- Resource names must include the **environmentSuffix** variable for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-west-2** region
- Implement VPC with public and private subnets across multiple availability zones
- Configure security groups following least privilege principle
- Enable CloudWatch logging and monitoring for all services
- All encryption must use customer-managed KMS keys

### Constraints

- ALL data must be encrypted at rest using AWS KMS with customer-managed keys
- ALL data must be encrypted in transit using TLS/SSL certificates
- Database infrastructure must maintain 99.99% availability
- Automated failover must complete within 30 seconds
- All credentials must rotate automatically every 30 days via Secrets Manager
- Secrets Manager must have audit logging enabled for compliance
- Must be PCI-DSS compliant
- System must handle 100,000 transactions per minute with sub-second response times
- All resources must be fully destroyable (no Retain deletion policies)
- Follow principle of least privilege for all IAM roles and policies
- Proper CloudWatch alarms for monitoring critical metrics

## Success Criteria

- **Functionality**: All 5 AWS services (RDS Aurora, EFS, Secrets Manager, ElastiCache, API Gateway) properly configured and integrated
- **Availability**: 99.99% uptime architecture with automated failover within 30 seconds
- **Security**: All data encrypted at rest (KMS) and in transit (TLS/SSL)
- **Compliance**: PCI-DSS requirements met, including 30-day credential rotation and audit logging
- **Performance**: Infrastructure capable of handling 100,000 transactions/minute with sub-second response
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, properly documented
- **Destroyability**: Infrastructure can be fully torn down without manual intervention

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with multi-AZ subnet configuration
- RDS Aurora PostgreSQL cluster with read replicas and KMS encryption
- Amazon EFS with KMS encryption and multi-AZ mount targets
- AWS Secrets Manager integration with automatic rotation
- ElastiCache Redis cluster with multi-AZ replication
- API Gateway with proper endpoint configuration
- Security groups with least privilege access rules
- IAM roles and policies following best practices
- CloudWatch logging and monitoring configuration
- Unit tests for all infrastructure components
- Clear documentation of the architecture and deployment process
