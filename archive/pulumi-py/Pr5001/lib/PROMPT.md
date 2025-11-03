Hey team,

We need to build a secure student data processing system for a large university that needs to modernize their student records infrastructure. This needs to be FERPA-compliant with strict security controls and high availability. I've been asked to set this up using Pulumi with Python for the infrastructure code.

The university currently has multiple campus systems that need to access student records through APIs, and they need real-time processing capabilities with good performance. The system needs to handle frequent data access efficiently while maintaining complete audit trails for compliance.

## What we need to build

Create a FERPA-compliant student data processing system using **Pulumi with Python** that provides secure API access to student records with real-time processing capabilities.

### Core Requirements

1. **API Gateway Setup**
   - Multiple REST API endpoints for different student data operations
   - Endpoints for student record retrieval, updates, and queries
   - Authentication and authorization for campus systems
   - Request throttling to prevent abuse

2. **Container-based API Processing**
   - ECS Fargate clusters to run the API processing services
   - Auto-scaling based on request load
   - Health checks and automated recovery
   - Multi-AZ deployment for reliability

3. **Student Records Database**
   - RDS Aurora PostgreSQL Serverless v2 for student records storage
   - Multi-AZ configuration for 99.99% availability
   - Automated backups with point-in-time recovery
   - Read replicas for query performance

4. **Caching Layer**
   - ElastiCache Redis cluster for session management
   - Cache frequently accessed student data to meet 200ms response time
   - Multi-node cluster with automatic failover
   - Cache invalidation strategies

5. **Real-time Data Processing**
   - Kinesis Data Streams for processing student record updates
   - Stream records to various downstream consumers
   - Handle grade updates, enrollment changes, and attendance records
   - Maintain ordered processing of related events

6. **Shared File Storage**
   - EFS file system for shared storage across ECS tasks
   - Store configuration files and shared assets
   - Automatic scaling and high durability
   - Mount targets in multiple availability zones

7. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Store API keys and third-party integration credentials
   - Automatic rotation of database passwords
   - Fine-grained access control using IAM

8. **Encryption Key Management**
   - AWS KMS customer-managed keys for encryption
   - Separate keys for different data classifications
   - Key rotation policies
   - Audit trail of key usage

### Security and Compliance Requirements

- All data must be encrypted at rest using AWS KMS customer-managed keys
- All data must be encrypted in transit using TLS 1.2 or higher
- Database connections must use SSL/TLS
- ElastiCache must use encryption in transit and at rest
- Kinesis streams must be encrypted using KMS
- EFS must be encrypted at rest
- All Secrets Manager secrets must be encrypted with KMS

### High Availability Requirements

- System must maintain 99.99% availability
- RDS Aurora must be deployed across multiple availability zones
- ElastiCache Redis must have Multi-AZ with automatic failover enabled
- ECS Fargate tasks must be distributed across multiple AZs
- EFS must have mount targets in multiple availability zones
- API Gateway must be highly available by default

### Performance Requirements

- API responses from cache must not exceed 200ms
- Database query responses must not exceed 1 second
- ElastiCache cluster should be sized appropriately for sub-millisecond latency
- Use RDS Proxy if needed to manage database connections efficiently
- Kinesis should handle real-time streaming with minimal lag

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** for REST API endpoints
- Use **ECS Fargate** for containerized API services
- Use **RDS Aurora PostgreSQL Serverless v2** for the database
- Use **ElastiCache Redis** with Multi-AZ for caching
- Use **Kinesis Data Streams** for real-time processing
- Use **EFS** for shared file storage
- Use **Secrets Manager** for credential storage
- Use **KMS** for encryption key management
- Resource names must include the **environment suffix** for uniqueness
- All resources must be properly tagged for cost tracking and compliance

### FERPA Compliance

- Implement proper access controls using IAM policies
- Enable CloudTrail logging for audit trails
- Enable VPC Flow Logs for network monitoring
- Implement encryption at rest and in transit
- Ensure proper data retention and deletion policies
- Tag all resources with compliance-related metadata

### Constraints

- No hardcoded credentials or sensitive data
- All database credentials stored in Secrets Manager
- VPC with private subnets for database and cache
- Security groups with least privilege access
- Use IAM roles for service-to-service authentication
- Include proper error handling and logging throughout
- All resources should be deployed in us-east-1 region

## Success Criteria

- All 8 required AWS services are deployed and integrated
- API Gateway successfully routes requests to ECS services
- ECS Fargate tasks can connect to RDS, ElastiCache, and EFS
- Database credentials are retrieved from Secrets Manager
- All data is encrypted using KMS customer-managed keys
- Multi-AZ deployment for all critical components
- System achieves target response times (200ms cached, 1s database)
- FERPA compliance requirements are met
- Proper tagging and naming conventions applied
- Infrastructure code follows Pulumi Python best practices

## What to deliver

- Complete Pulumi Python implementation in tap_stack.py
- VPC configuration with public and private subnets
- API Gateway with REST API configuration
- ECS Fargate cluster and task definitions
- RDS Aurora PostgreSQL Serverless v2 cluster
- ElastiCache Redis Multi-AZ cluster
- Kinesis Data Stream configuration
- EFS file system with mount targets
- Secrets Manager secrets for credentials
- KMS keys for encryption
- Security groups and IAM roles
- All resources using environment_suffix in names
- Proper resource dependencies and outputs