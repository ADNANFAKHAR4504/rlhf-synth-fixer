# Payment Processing Infrastructure Migration

Hey team,

We need to build a production-grade multi-region payment processing infrastructure for a fintech startup migrating their real-time payment service from Zurich (eu-central-2) to Ireland (eu-west-1). I've been asked to create this infrastructure using **CDKTF with Python**. This is a critical system that handles financial transactions, so we need to meet PCI-DSS compliance requirements with proper encryption, logging, and access controls.

The application architecture consists of a serverless backend using AWS Lambda for payment processing, API Gateway for HTTP endpoints, RDS PostgreSQL for transaction records, and DynamoDB for high-throughput transaction data. The business has strict requirements around security, availability, multi-region redundancy, and compliance given the sensitive nature of payment data.

We're deploying across two regions (eu-central-2 and eu-west-1) with VPC peering for cross-region connectivity and S3 cross-region replication for data redundancy. The infrastructure must be fully monitored with CloudWatch dashboards and alarms so the operations team can track system health and respond quickly to issues.

## What we need to build

Create a complete multi-region payment processing infrastructure using **CDKTF with Python** deployed across eu-central-2 (source) and eu-west-1 (target) regions. This infrastructure must support serverless payment processing, API endpoints, multi-region data storage, and comprehensive monitoring.

### Core Requirements

1. **Multi-Region Network Infrastructure**
   - VPC in eu-central-2 (10.0.0.0/16) with public and private subnets across 2 availability zones
   - VPC in eu-west-1 (10.1.0.0/16) with public and private subnets across 2 availability zones
   - Public subnets for NAT Gateways and internet connectivity
   - Private subnets for Lambda functions and RDS database
   - VPC peering connection between eu-central-2 and eu-west-1 for cross-region communication
   - Proper routing tables and security groups for each tier
   - Internet Gateways for public subnet access
   - NAT Gateways for private subnet outbound connectivity

2. **Database Layer**
   - RDS PostgreSQL 17.4 instance deployed in private subnets in eu-west-1
   - Multi-AZ configuration for high availability
   - Automated backups with 7-day retention
   - Encryption at rest enabled using KMS customer-managed keys
   - DB subnet group spanning multiple availability zones
   - Security groups restricting database access to Lambda functions only

3. **DynamoDB Tables**
   - DynamoDB table for transaction records in eu-west-1
   - Pay-per-request billing mode for cost optimization
   - Point-in-time recovery enabled for data protection
   - Global secondary indexes for customer and status queries
   - Partition key: transactionId, Sort key: timestamp

4. **Serverless Compute**
   - Lambda function in eu-west-1 for payment processing
   - Python 3.11 runtime
   - VPC configuration for database access
   - Reserved concurrent executions for consistent performance
   - Environment variables for DynamoDB table and RDS endpoint
   - IAM role with least privilege access to DynamoDB and RDS
   - CloudWatch Logs integration with 30-day retention

5. **API Gateway**
   - API Gateway HTTP API in eu-west-1
   - Lambda proxy integration for payment processing endpoint
   - POST /payment route for transaction submission
   - Production stage with auto-deploy enabled
   - CloudWatch logging enabled with 30-day retention

6. **Storage and Replication**
   - S3 bucket in eu-central-2 for payment data
   - S3 bucket in eu-west-1 for replicated data
   - Server-side encryption (AES256) enabled on all buckets
   - Versioning enabled for data integrity
   - Cross-region replication from eu-central-2 to eu-west-1
   - IAM role for S3 replication with least privilege

7. **Monitoring and Observability**
   - CloudWatch dashboard showing key metrics:
     - Lambda invocations, errors, and duration
     - RDS CPU utilization and database connections
     - DynamoDB read and write capacity consumption
   - CloudWatch alarms for Lambda errors exceeding threshold
   - CloudWatch alarms for RDS CPU exceeding 80%
   - All application logs centralized in CloudWatch Logs
   - 30-day log retention policy for Lambda and API Gateway

8. **Encryption and Security**
   - All data encrypted at rest using KMS customer-managed keys for RDS
   - S3 server-side encryption (AES256) for all buckets
   - KMS key rotation enabled for enhanced security
   - Security groups following least privilege principle
   - IAM policies with explicit deny rules for destructive actions

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** for multi-region network isolation with proper subnet segmentation
- Use **RDS PostgreSQL 17.4** for transactional database
- Use **DynamoDB** for high-throughput transaction records
- Use **AWS Lambda** with Python 3.11 for serverless payment processing
- Use **API Gateway HTTP API** for REST endpoints
- Use **S3** with cross-region replication for data redundancy
- Use **VPC Peering** for secure cross-region connectivity
- Use **CloudWatch** for logs, metrics, dashboards, and alarms
- Use **KMS** for encryption key management with automatic rotation
- Resource names must include **environment_suffix** for uniqueness across deployments
- Follow naming convention: `payment-{resource-type}-{environment_suffix}-{suffix}`
- Primary region: **eu-central-2** (Milan)
- Target region: **eu-west-1** (Ireland)
- Lambda runtime: Python 3.11
- Reserved concurrency: 10 for Lambda functions

### Security Constraints

- IAM roles must follow least privilege principle
- Explicit deny rules for destructive actions (DeleteTable, DeleteItem, DeleteBucket)
- API endpoints accessible through API Gateway in eu-west-1
- Lambda functions deployed in private subnets with VPC configuration
- Database only accessible from Lambda security group
- RDS encryption at rest using KMS customer-managed keys
- S3 server-side encryption (AES256) enabled on all buckets
- Security groups configured with minimum required access
- VPC peering for secure cross-region communication
- No hardcoded credentials in Lambda code

### Operational Constraints

- All resources must be destroyable after testing (skip_final_snapshot enabled for RDS)
- Application logs centralized in CloudWatch with 30-day retention
- Lambda timeout: 30 seconds
- Lambda memory: 256 MB
- RDS automated backups with 7-day retention period
- RDS Multi-AZ enabled for high availability
- DynamoDB point-in-time recovery enabled
- S3 versioning enabled for data protection
- Cross-region S3 replication for disaster recovery

## Success Criteria

- **Functionality**: Complete multi-region architecture with VPCs, Lambda, API Gateway, RDS, DynamoDB, and S3
- **Security**: Encryption at rest using KMS and AES256, least privilege IAM policies
- **High Availability**: Multi-AZ RDS deployment, VPC peering for cross-region connectivity
- **Multi-Region**: VPCs in both eu-central-2 and eu-west-1 with proper networking
- **Data Replication**: S3 cross-region replication from eu-central-2 to eu-west-1
- **Monitoring**: CloudWatch dashboard with Lambda, RDS, and DynamoDB metrics
- **Alerting**: CloudWatch alarms for Lambda errors and RDS CPU utilization
- **Serverless**: Lambda-based payment processing with reserved concurrency
- **Compliance**: PCI-DSS aligned with encryption, logging, and access controls
- **Resource Naming**: All resources include environment_suffix for parallel deployments
- **Code Quality**: Python with CDKTF best practices, well-tested, and documented

## What to deliver

- Complete CDKTF Python implementation in lib/ directory
- Multi-region VPC architecture with public and private subnets across 2 availability zones in each region
- VPC peering connection between eu-central-2 and eu-west-1
- RDS PostgreSQL 17.4 with Multi-AZ, encryption, and automated backups
- DynamoDB table with point-in-time recovery and global secondary indexes
- Lambda function with VPC configuration and reserved concurrency
- API Gateway HTTP API with Lambda integration
- S3 buckets with cross-region replication, versioning, and encryption
- CloudWatch dashboard with Lambda, RDS, and DynamoDB metrics
- CloudWatch alarms for Lambda errors and RDS CPU utilization
- KMS keys for RDS encryption with automatic rotation
- IAM roles and policies following least privilege principle
- Security groups for Lambda and RDS with minimum required access
- Unit tests covering all infrastructure components
- Integration tests validating deployed resources using boto3
- All code following Python best practices with proper typing