Hey team,

We need to migrate a payment processing system from on-premises to AWS while maintaining continuous operation. This is a fintech company with strict PCI compliance requirements and they cannot afford any downtime during the migration. I've been asked to create this using **CDKTF with Python**.

The current payment system handles sensitive financial transactions and needs to be moved to AWS with a blue-green deployment strategy to ensure zero downtime. We need multi-AZ redundancy, encrypted storage, automated backups, and comprehensive monitoring to maintain the high availability and security standards required for payment processing.

## What we need to build

Create a payment processing infrastructure using **CDKTF with Python** that supports zero-downtime migration from on-premises to AWS.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 availability zones
   - Public subnets for load balancers
   - Private subnets for application servers
   - Database subnets isolated from application tier
   - Resource names must include environmentSuffix for uniqueness

2. **Database Layer**
   - RDS Aurora PostgreSQL cluster with automated backups
   - Read replicas for scalability
   - Encrypted storage using AWS KMS customer-managed keys
   - DynamoDB tables for transaction records
   - Global secondary indexes for query optimization
   - Point-in-time recovery enabled on DynamoDB

3. **Compute and Application**
   - Lambda functions for payment validation
   - Lambda functions for fraud detection
   - Lambda functions for transaction processing
   - VPC connectivity for Lambda functions
   - Reserved concurrency to prevent cold starts

4. **API and Load Balancing**
   - API Gateway with request validation
   - VPC Link connecting API Gateway to private ALB
   - Application Load Balancer in private subnets
   - Blue-green deployment using two target groups
   - Weighted routing for gradual traffic migration

5. **Storage and Compliance**
   - S3 buckets for audit logs
   - Versioning enabled on all S3 buckets
   - 90-day retention with lifecycle policies
   - Compliance archival to Glacier

6. **Monitoring and Alerting**
   - CloudWatch dashboards for API response times
   - CloudWatch dashboards for error rates
   - CloudWatch dashboards for database performance metrics
   - CloudWatch alarms monitoring API latency with 99th percentile
   - SNS topics for alerting on failed transactions
   - SNS topics for system errors

7. **Security and Secrets**
   - AWS Secrets Manager for database credentials
   - Lambda rotation function for automatic credential rotation
   - AWS Systems Manager Parameter Store for configuration values
   - All databases use encrypted storage with KMS customer-managed keys

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use RDS Aurora PostgreSQL for transactional database
- Use DynamoDB for transaction records with GSIs
- Use Lambda for serverless compute with VPC connectivity
- Use API Gateway with VPC Link to private ALB
- Use CloudWatch for comprehensive monitoring
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to us-east-1 region
- Use Python 3.9 or higher for Lambda functions

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use RemovalPolicy.DESTROY for all resources
- Blue-green deployment strategy with weighted routing
- Multi-AZ deployment for high availability
- Automated backups with encryption
- Include proper error handling and logging

### PCI Compliance Requirements

- All data at rest must be encrypted with KMS customer-managed keys
- All S3 buckets must have versioning enabled
- DynamoDB tables must have point-in-time recovery
- Audit logs must be retained for 90 days minimum
- Database credentials must rotate automatically
- All configuration values stored in Parameter Store

### Constraints

- Zero downtime during migration (blue-green deployment)
- PCI compliance mandatory
- All databases encrypted at rest
- Multi-AZ failover required
- Lambda reserved concurrency required
- API Gateway must use VPC Link (not public endpoints)
- CloudWatch alarms must track 99th percentile latency
- All resources must be destroyable for testing

## Success Criteria

- Functionality: Complete payment processing pipeline with validation, fraud detection, and transaction processing
- Performance: API latency monitored with 99th percentile metrics
- Reliability: Multi-AZ deployment with automated backups and read replicas
- Security: All data encrypted at rest and in transit, credentials rotated automatically
- Compliance: PCI compliance requirements met (encryption, audit logs, retention)
- Deployment: Blue-green deployment strategy enables zero-downtime migration
- Resource Naming: All resources include environmentSuffix
- Code Quality: Python code, well-tested, documented, production-ready

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with 3 AZs (public, private, database subnets)
- RDS Aurora PostgreSQL cluster with read replicas and encryption
- DynamoDB tables with GSIs and point-in-time recovery
- Lambda functions (payment validation, fraud detection, transaction processing)
- API Gateway with VPC Link to private ALB
- Application Load Balancer with blue-green target groups
- S3 buckets for audit logs with versioning and lifecycle policies
- CloudWatch dashboards and alarms
- SNS topics for alerting
- Secrets Manager with Lambda rotation function
- KMS customer-managed keys for encryption
- Systems Manager Parameter Store for configuration
- Unit tests for all components
- Documentation and deployment instructions
