# Single-Region Payment Processing Infrastructure

Hey team,

We need to build a robust payment processing infrastructure for a financial services client. The system processes critical payment transactions and needs to be highly available within a single region (us-east-1) with strong monitoring, security, and compliance capabilities.

The business requirements focus on building a scalable, secure payment processing system with comprehensive audit trails and monitoring. The client's compliance team requires strict controls around data access, encryption, and operational visibility. The payment processing system needs to handle high transaction volumes while maintaining low latency.

The architecture leverages AWS best practices for high availability within a single region, utilizing multiple availability zones for redundancy. All stateful components like Aurora databases, DynamoDB tables, and S3 buckets are configured for optimal performance and durability within us-east-1.

## What we need to build

Create a single-region payment processing infrastructure using **CDK with Python** that deploys in us-east-1 with high availability across multiple availability zones.

### Core Requirements

1. **Database Layer**
   - Aurora PostgreSQL cluster in us-east-1 with Multi-AZ deployment for high availability
   - DynamoDB table for session data with on-demand billing and point-in-time recovery enabled
   - Automated backups for Aurora with 7-day retention
   - Database encryption at rest and in transit

2. **Compute Layer**
   - Three Lambda functions in us-east-1: payment validation, transaction processing, and notification services
   - API Gateway REST API with custom domain name
   - Request validation and throttling limits of 10,000 requests per second on API Gateway
   - VPC configuration in us-east-1 with 3 availability zones for high availability

3. **Storage**
   - S3 bucket in us-east-1 with versioning enabled
   - Lifecycle policies to archive data to Glacier after 90 days
   - Server-side encryption with AWS managed keys
   - Access logging enabled for audit trails

4. **Monitoring and Alerting**
   - CloudWatch alarms for RDS CPU utilization and connections (threshold: 80%)
   - CloudWatch alarms for Lambda errors (threshold: 5% error rate)
   - CloudWatch alarms for API Gateway 5XX errors (threshold: 1%)
   - SNS topics for alarm notifications
   - CloudWatch dashboard showing unified metrics for all services

5. **Configuration Management**
   - Systems Manager Parameter Store for database endpoints, API URLs, and feature flags
   - Secure string parameters for sensitive configuration
   - Centralized configuration management for all services

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **Aurora PostgreSQL** for transactional database with Multi-AZ deployment
- Use **DynamoDB** for session management with on-demand billing
- Use **Lambda** for compute (payment validation, transaction processing, notifications)
- Use **API Gateway** REST API with regional endpoint
- Use **S3** with versioning and lifecycle policies
- Use **CloudWatch** for monitoring with comprehensive dashboards
- Use **SNS** for notifications
- Use **Systems Manager Parameter Store** for configuration
- Use **VPC** with private and public subnets across 3 AZs in us-east-1
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region only

### Constraints

- All resources must be tagged appropriately with Environment and Project tags
- CloudWatch dashboards must aggregate metrics from all services
- API Gateway must use regional endpoint with throttling enabled
- Lambda functions must be deployed in VPC with proper security groups
- Aurora Database must be Multi-AZ for high availability
- All resources must be destroyable (no Retain policies)
- VPC must have public subnets for NAT gateways and private subnets for databases
- RDS Aurora must be in private subnets with no public access
- Lambda functions must have proper IAM roles with least privilege access
- All data must be encrypted at rest and in transit

## Success Criteria

- Functionality: Complete single-region deployment with all services operational in us-east-1
- Performance: API Gateway handles 10,000 requests per second, database response time under 100ms
- Reliability: Multi-AZ deployment for high availability, automated backups with 7-day retention
- Security: All database resources in private subnets, encrypted at rest and in transit, no public endpoints
- Resource Naming: All resources include environmentSuffix for multi-environment deployment
- Code Quality: Python code following PEP 8 standards, comprehensive unit tests, inline documentation
- Monitoring: CloudWatch dashboard showing all critical metrics, alarms trigger notifications

## What to deliver

- Complete CDK Python implementation for single-region deployment in us-east-1
- Aurora PostgreSQL cluster with Multi-AZ deployment for high availability
- DynamoDB table with on-demand billing and point-in-time recovery
- Three Lambda functions (payment validation, transaction processing, notifications) in us-east-1
- API Gateway REST API with regional endpoint
- S3 bucket with versioning and lifecycle policies
- CloudWatch alarms and comprehensive dashboard
- SNS topics for notifications
- Systems Manager parameters for configuration
- VPC infrastructure in us-east-1 with proper subnet configuration across 3 AZs
- IAM roles and policies for all services with least privilege access
- Unit tests for all stack components
- Integration tests validating end-to-end functionality
- Documentation covering deployment and monitoring procedures
