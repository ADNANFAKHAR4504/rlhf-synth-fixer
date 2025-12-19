# HIPAA-Compliant Healthcare Data Processing Pipeline

Hey team,

We need to build a real-time healthcare data processing system for MedTech Solutions. They have 50+ clinics sending patient monitoring data - vital signs, medication schedules, and patient alerts - that all needs to be processed in real-time while maintaining strict HIPAA compliance. The healthcare providers need immediate access to this data through a secure API, and we need to ensure 99.99% availability because we're dealing with patient care.

The challenge here is balancing real-time performance with security and compliance. We need to encrypt everything at rest and in transit, implement comprehensive audit logging, and make sure the system can handle the data volume from multiple clinics simultaneously. The business has been clear that HIPAA compliance is non-negotiable - any data breach could shut them down.

## What we need to build

Create a HIPAA-compliant real-time healthcare data processing pipeline using **Pulumi with Go** for MedTech Solutions clinic network.

### Core Requirements

1. **Real-Time Data Ingestion**
   - Use Kinesis Data Streams to ingest patient monitoring data from 50+ clinics
   - Configure appropriate shard capacity for high-throughput real-time data
   - Enable server-side encryption using KMS for data at rest

2. **Data Processing Layer**
   - Deploy ECS Fargate cluster for stateless data processing tasks
   - Configure auto-scaling for processing containers based on Kinesis metrics
   - Implement secure container networking with VPC configuration
   - Use EFS for shared storage between ECS tasks when needed

3. **Secure Data Storage**
   - Set up RDS Aurora PostgreSQL with encryption at rest using KMS
   - Enable Multi-AZ deployment for high availability (99.99% target)
   - Configure automated backups with point-in-time recovery
   - Store processed patient records with proper encryption

4. **Real-Time Data Access**
   - Implement ElastiCache Redis cluster for caching real-time patient data
   - Enable cluster mode for high availability and automatic failover
   - Configure encryption in transit and at rest using KMS
   - Use for low-latency access to frequently accessed patient metrics

5. **Secure API Layer**
   - Deploy API Gateway with OAuth2 authentication for healthcare providers
   - Configure REST API endpoints for patient data queries
   - Implement request throttling and rate limiting
   - Enable CloudWatch logging for all API access

6. **Shared Storage for ECS**
   - Create EFS file system for shared data between ECS tasks
   - Enable encryption at rest using KMS
   - Configure mount targets in multiple availability zones
   - Set up proper security groups for ECS task access

7. **Secrets Management**
   - Use AWS Secrets Manager for database credentials and API keys
   - Enable automatic rotation for database passwords
   - Configure KMS encryption for all secrets
   - Grant least privilege access to secrets for services

### Technical Requirements

- All infrastructure defined using **Pulumi with Go**
- Use **Kinesis Data Streams** for real-time data ingestion
- Use **ECS Fargate** clusters for serverless container processing
- Use **RDS Aurora PostgreSQL** with Multi-AZ for patient records
- Use **ElastiCache Redis** cluster for real-time caching
- Use **API Gateway** with OAuth2 authentication
- Use **EFS** for shared storage between ECS tasks
- Use **AWS Secrets Manager** for credential management
- Use **KMS** with automatic key rotation for all encryption
- Resource names must include a **string suffix** (environmentSuffix) for uniqueness
- Follow naming convention: `{service}-{purpose}-${environmentSuffix}`
- Deploy to **us-west-2** region across multiple availability zones
- All resources must be tagged appropriately

### Encryption and Key Management

- Create customer-managed KMS key with automatic rotation enabled
- Encrypt all data at rest: RDS Aurora, ElastiCache, Kinesis, EFS, Secrets Manager
- Encrypt all data in transit using TLS 1.2 or higher
- Configure KMS key policies allowing required AWS services
- No public access to any data storage resources

### High Availability Requirements

- Multi-AZ deployment for RDS Aurora (primary + replica across AZs)
- ElastiCache cluster mode with automatic failover
- ECS Fargate tasks distributed across multiple availability zones
- EFS mount targets in multiple availability zones
- Target availability: 99.99%

### Compliance and Audit Requirements

- Enable CloudWatch Logs for all services with 30-day retention
- Configure CloudWatch log groups for: Kinesis, ECS tasks, API Gateway, RDS
- Create CloudWatch alarms for security events and failures
- Enable VPC Flow Logs for network traffic audit
- Implement comprehensive access logging for all data access
- All IAM policies must follow least privilege principle

### Constraints

- All data must be encrypted at rest using KMS with automatic key rotation
- All data must be encrypted in transit using TLS 1.2+
- System must maintain 99.99% availability with Multi-AZ deployment
- All resources must be fully destroyable (no Retain policies)
- No hardcoded credentials or sensitive values in code
- Include proper error handling and validation
- Do NOT create new secrets in Secrets Manager (reference existing if needed)
- All IAM roles must implement least privilege access

## Success Criteria

- **Functionality**: Real-time data ingestion, processing, storage, and API access working end-to-end
- **Performance**: Low-latency data processing with ElastiCache sub-millisecond reads
- **Reliability**: 99.99% availability achieved through Multi-AZ deployment and auto-scaling
- **Security**: All encryption requirements met (at rest and in transit), OAuth2 authentication working
- **Compliance**: Comprehensive audit logging enabled, access controls implemented per HIPAA requirements
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Production-ready Pulumi Go code, well-structured, properly documented
- **Destroyability**: All infrastructure can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi Go implementation in tap_stack.go
- Kinesis Data Streams with KMS encryption
- ECS Fargate cluster with auto-scaling and VPC networking
- RDS Aurora PostgreSQL with Multi-AZ and KMS encryption
- ElastiCache Redis cluster with encryption and high availability
- API Gateway with OAuth2 authentication
- EFS file system with encryption and multi-AZ mount targets
- AWS Secrets Manager integration for credentials
- KMS customer-managed key with automatic rotation
- IAM roles and policies with least privilege
- CloudWatch logging and monitoring for all components
- VPC configuration with proper security groups
- Comprehensive exports for testing and integration

## Architecture Notes

The system should follow this data flow:
1. Clinics send patient data to Kinesis Data Streams
2. ECS Fargate tasks consume and process stream data
3. Processed records stored in RDS Aurora PostgreSQL
4. Real-time metrics cached in ElastiCache Redis
5. Healthcare providers access data via API Gateway
6. EFS provides shared storage for ECS tasks when needed
7. All credentials managed through Secrets Manager
8. All activity logged to CloudWatch for audit trail
