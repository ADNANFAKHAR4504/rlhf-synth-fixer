# Real-Time Transaction Monitoring System

Hey team,

We're building a transaction monitoring system for JapanCart, an e-commerce platform operating in Japan. They need to comply with financial regulations and detect suspicious activities in real-time. During peak hours, they're processing about 1000 transactions per minute, so we need something that can handle that load reliably.

The business is asking for a system that can catch fraud patterns as transactions happen, not hours later. They want to maintain a 24-hour history of recent transactions for pattern matching, while keeping everything permanently stored for compliance. This needs to be production-ready and deployed in their Tokyo region.

I've been asked to build this using **Pulumi with Python**. They're already standardized on Pulumi for infrastructure management, and the team is comfortable with Python.

## What we need to build

Create a real-time transaction monitoring system using **Pulumi with Python** that processes transaction streams and detects potential fraud patterns using a caching layer for recent transaction history.

### Core Requirements

1. **Real-Time Transaction Processing**
   - Ingest approximately 1000 transactions per minute during peak hours
   - Process transaction streams in real-time
   - Support detection of fraud patterns

2. **Transaction History Management**
   - Maintain 24-hour rolling history of transactions
   - Automatic expiration of old data using TTL
   - Fast lookup for pattern matching

3. **Permanent Storage**
   - Store all transactions permanently for compliance
   - Support for regulatory audit requirements

4. **Security and Compliance**
   - Encryption at rest for all data stores
   - Encryption in transit using TLS/SSL
   - Secure credential management
   - Comprehensive logging and monitoring

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Amazon Kinesis Data Stream** for real-time transaction ingestion (1000 transactions/minute capacity)
- Use **Amazon ElastiCache Redis** for maintaining 24-hour transaction history with automatic expiration (TTL)
- Use **Amazon RDS PostgreSQL** for permanent transaction storage
- Use **AWS Secrets Manager** for database credentials management (FETCH existing secrets, do NOT create new ones)
- Use **AWS KMS** for encryption at rest for all data stores
- Use **Amazon CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **ap-northeast-1** region (Tokyo, Japan)
- Multi-AZ configuration required where applicable

### Constraints

- All resources MUST be deployed in ap-northeast-1 region
- Multi-AZ configuration where applicable for high availability
- Secrets should be fetched from existing Secrets Manager entries, not created in code
- All resources must be destroyable (no Retain policies or DeletionProtection flags)
- Principle of least privilege for IAM roles and policies
- Enable CloudWatch logging and monitoring for all services
- Include proper error handling and logging

## Success Criteria

- **Functionality**: System processes 1000 transactions/minute, maintains 24-hour cache with TTL, stores permanently in PostgreSQL
- **Performance**: Real-time processing with minimal latency, fast cache lookups
- **Reliability**: Multi-AZ deployment, fault-tolerant design
- **Security**: Encryption at rest and in transit, secure credential management, proper IAM policies
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: Python, well-structured, production-ready

## What to deliver

- Complete Pulumi Python implementation
- Amazon Kinesis Data Stream for transaction ingestion
- Amazon ElastiCache Redis cluster with 24-hour TTL
- Amazon RDS PostgreSQL instance with Multi-AZ
- AWS KMS keys for encryption
- IAM roles with least privilege access
- CloudWatch logging and monitoring configuration
- Proper resource naming with environmentSuffix
- Infrastructure that can be cleanly destroyed for CI/CD workflows
