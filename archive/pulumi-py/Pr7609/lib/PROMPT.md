Hey team,

We need to build a real-time transaction monitoring system for JapanCart, an e-commerce platform operating in Japan. The business is facing regulatory compliance requirements and needs to detect suspicious transaction patterns to prevent fraud. The system needs to handle approximately 1000 transactions per minute during peak shopping hours while maintaining a complete audit trail for financial compliance.

The business wants us to build this using **Pulumi with Python** to manage all infrastructure components. They need a streaming architecture that can ingest transactions in real-time, cache recent transaction history for pattern matching, and permanently store all transactions for regulatory reporting. The compliance team specifically requested 24-hour transaction history in the cache for fraud detection algorithms.

The operations team has emphasized that all infrastructure must be highly available since transaction processing downtime directly impacts revenue. They also need comprehensive monitoring to quickly identify and respond to any issues with the transaction pipeline.

## What we need to build

Create a real-time transaction monitoring infrastructure using **Pulumi with Python** for JapanCart's e-commerce platform.

### Core Requirements

1. **Real-time Transaction Ingestion**
   - Kinesis Data Stream configured for 1000 transactions per minute throughput
   - Appropriate shard count based on peak load calculations
   - Data retention suitable for transaction monitoring use cases
   - Encryption at rest enabled for compliance

2. **Transaction History Cache**
   - ElastiCache Redis cluster for high-performance transaction lookups
   - Must maintain 24-hour transaction history with automatic TTL expiration
   - Multi-AZ deployment for high availability requirements
   - Node type appropriate for caching workload and memory requirements
   - Encryption in-transit and at-rest enabled

3. **Permanent Transaction Storage**
   - RDS PostgreSQL database for long-term transaction records
   - Multi-AZ deployment for business continuity
   - Automated backup configuration for disaster recovery
   - Instance size appropriate for transaction volume
   - Encryption at rest for regulatory compliance
   - Security groups configured with least privilege access

4. **Credential Management**
   - AWS Secrets Manager for secure database credential storage
   - Automatic rotation capability where possible
   - IAM permissions following least privilege principle

5. **Monitoring and Observability**
   - CloudWatch metrics for Kinesis stream health monitoring
   - CloudWatch alarms for critical performance thresholds
   - RDS Enhanced Monitoring enabled
   - Redis CloudWatch metrics configuration

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Kinesis** for real-time stream ingestion
- Use **AWS ElastiCache** (Redis) for 24-hour transaction cache
- Use **AWS RDS** (PostgreSQL) for permanent storage
- Use **AWS Secrets Manager** for credential management
- Use **AWS CloudWatch** for monitoring and alerting
- Use **AWS EC2** resources (VPC, security groups, subnets)
- Use **AWS IAM** for access control policies
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable with no retention policies preventing deletion

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resource names MUST include an environmentSuffix parameter to ensure uniqueness across multiple deployments. This allows the same infrastructure to be deployed multiple times for testing, staging, and production environments without naming conflicts.

- **Destroyability**: All resources must be fully destroyable without manual intervention. Do NOT use retention policies, RETAIN deletion policies, or any configuration that would prevent complete cleanup. This is critical for automated testing environments.

- **Security Configuration**: While resources must be destroyable, they still need proper security configurations including encryption, security groups, and IAM policies during operation.

### Constraints

- Multi-AZ configuration required for ElastiCache and RDS
- Redis cache TTL must be set to 24 hours
- All data stores must have encryption at rest enabled
- Encryption in transit required where applicable
- Security groups must follow least privilege access patterns
- IAM policies must follow least privilege principle
- No NAT Gateways or slow-provisioning resources to optimize costs
- Prefer serverless or fast-provisioning services where possible
- All resource naming must support multiple concurrent deployments

### Security Requirements

- Enable encryption at rest for Kinesis, ElastiCache, and RDS
- Enable encryption in transit for ElastiCache connections
- Store all credentials in AWS Secrets Manager
- Configure security groups with minimal required access rules
- Implement least privilege IAM policies for all resource access
- Enable CloudWatch logging for security monitoring

## Success Criteria

- **Functionality**: System successfully ingests 1000 transactions/minute via Kinesis
- **Caching**: Redis maintains 24-hour transaction history with automatic expiration
- **Storage**: RDS PostgreSQL stores all transactions with automated backups
- **Availability**: Multi-AZ deployments for both ElastiCache and RDS
- **Security**: All encryption requirements met, credentials in Secrets Manager
- **Monitoring**: CloudWatch metrics and alarms configured for all critical components
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: Complete infrastructure can be torn down cleanly without manual steps
- **Code Quality**: Clean Python code, comprehensive tests, full documentation

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- Kinesis Data Stream with appropriate shard configuration
- ElastiCache Redis cluster with 24-hour TTL configuration
- RDS PostgreSQL instance with Multi-AZ and automated backups
- AWS Secrets Manager secret for RDS credentials
- VPC, subnets, and security groups for network isolation
- CloudWatch metrics and alarms for monitoring
- IAM roles and policies for resource access
- Stack exports for all critical resource identifiers (stream ARN, Redis endpoint, RDS endpoint, secret ARN)
- Unit tests with 100% code coverage
- Integration tests validating resource creation
- README with deployment instructions and architecture documentation
