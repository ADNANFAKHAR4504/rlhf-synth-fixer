# Healthcare Data Processing Pipeline

Hey team,

We've been tasked with modernizing a healthcare provider's patient record management system. They're dealing with legacy systems that can't handle real-time updates, and they need to move to a cloud-based solution that maintains HIPAA compliance while processing patient data as it comes in. The business is looking for a robust pipeline that can ingest health records in real-time, process them securely, and store everything in a way that meets all regulatory requirements.

The leadership team wants this built in the EU, specifically in the London region, to stay close to their European operations. They've emphasized that HIPAA compliance is non-negotiable - every piece of data needs to be encrypted, every access needs to be logged, and the database must be locked down tight. They're also concerned about the security of credentials and want a proper secrets management solution in place.

This is a medium-complexity project that touches on several areas: we need to set up the CI/CD pipeline for deployment, implement comprehensive monitoring and analysis, and bake security into every layer of the infrastructure. The goal is to create a reference architecture that they can build on as they expand their digital health platform.

## What we need to build

Create a HIPAA-compliant healthcare data processing pipeline using **AWS CDK with Python** that handles real-time patient record ingestion, processing, and storage.

### Core Requirements

1. **Real-time Data Ingestion**
   - Use Amazon Kinesis Data Streams to capture incoming patient health records
   - Support high-throughput data ingestion with proper stream configuration
   - Handle streaming data with appropriate shard configuration

2. **Secure Data Processing**
   - Deploy Amazon ECS containers for processing patient data
   - Implement containerized workloads that can scale based on demand
   - Ensure processing containers have proper IAM roles and permissions

3. **HIPAA-Compliant Storage**
   - Use Amazon RDS PostgreSQL with encryption enabled
   - Configure database in private subnets only (no public access)
   - Enable encryption at rest using AWS KMS
   - Set up automated backups with appropriate retention

4. **Credential Management**
   - Implement AWS Secrets Manager for database credentials
   - Store all sensitive information securely
   - Enable automatic rotation where applicable

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon Kinesis Data Streams** for real-time data ingestion
- Use **Amazon ECS** for containerized data processing
- Use **Amazon RDS (PostgreSQL)** with encryption for data storage
- Use **AWS Secrets Manager** for credential management
- Deploy to **eu-west-2** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- All data encrypted at rest using AWS KMS customer managed keys
- All data encrypted in transit using TLS
- Database must be in private subnets only (no internet access)

### Constraints

- All resources must be deployed in eu-west-2 region
- All data must be encrypted at rest and in transit using KMS keys
- Database access must be restricted to private subnets only
- Implementation must include audit logging for all data access events
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch logging
- Follow HIPAA compliance best practices for all AWS services

### Architecture Considerations

- Set up VPC with public and private subnets across multiple availability zones
- Configure security groups with least-privilege access
- Implement CloudWatch log groups for all services
- Use AWS KMS for encryption key management
- Enable CloudTrail logging for API audit trails
- Configure IAM roles following least-privilege principle

## Success Criteria

- **Functionality**: Complete pipeline that ingests, processes, and stores patient data
- **Performance**: Real-time processing capability with Kinesis and ECS
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: Full encryption at rest and in transit, private database access only
- **Compliance**: HIPAA-compliant architecture with comprehensive audit logging
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean Python code, well-tested, properly documented
- **Monitoring**: CloudWatch logs and metrics for all critical components

## What to deliver

- Complete AWS CDK Python implementation
- VPC with public and private subnets
- Amazon Kinesis Data Stream configured for patient data ingestion
- Amazon ECS cluster with task definitions for data processing
- Amazon RDS PostgreSQL instance with encryption and private subnet deployment
- AWS Secrets Manager secrets for database credentials
- AWS KMS keys for encryption
- IAM roles and policies following least-privilege
- Security groups configured for proper network isolation
- CloudWatch log groups for monitoring and audit trails
- Unit tests for all CDK constructs
- Documentation with deployment instructions
