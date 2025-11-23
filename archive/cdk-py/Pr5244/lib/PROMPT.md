Hey team,

We need to build a HIPAA-compliant medical imaging processing pipeline for MedTech Brazil. They're processing thousands of DICOM medical scans daily across multiple hospitals in São Paulo and need infrastructure that meets both HIPAA and Brazilian healthcare data protection requirements. This is a critical healthcare application where security and compliance are non-negotiable.

The business context is that MedTech handles large medical imaging files that need to be ingested securely, processed through a pipeline, and stored with full audit trails. We're talking about sensitive patient data here, so everything needs encryption at rest and in transit, plus we need to maintain multi-AZ high availability since downtime could impact patient care.

I've been asked to implement this using **AWS CDK with Python** for the infrastructure. The team specifically chose CDK Python because of our existing Python expertise and CDK's ability to handle complex infrastructure patterns with strong typing.

## What we need to build

Create a secure medical imaging processing system using **AWS CDK with Python** for MedTech Brazil's healthcare infrastructure. This system will handle DICOM format medical images through a complete ingestion, processing, and storage pipeline while maintaining strict HIPAA compliance.

### Core Requirements

1. **Secure Data Ingestion**
   - API Gateway configured with mutual TLS authentication for secure file uploads
   - Must support large medical imaging files in DICOM format
   - Proper request validation and throttling

2. **Metadata Storage**
   - RDS Aurora PostgreSQL cluster for storing medical image metadata
   - Must be encrypted at rest with KMS
   - Multi-AZ deployment for high availability
   - Automated backups enabled

3. **Temporary File Storage**
   - EFS (Elastic File System) for temporary DICOM file storage during processing
   - Encrypted at rest and in transit
   - Mounted to processing containers

4. **Image Processing Infrastructure**
   - ECS Fargate cluster for running image processing workloads
   - Containerized processing with proper IAM roles
   - Auto-scaling based on processing queue depth
   - Secure access to EFS and RDS

5. **Queue Management**
   - ElastiCache Redis cluster for managing processing queue
   - Multi-AZ configuration with automatic failover
   - Encrypted in transit

6. **Event Streaming**
   - Kinesis Data Streams for real-time processing event tracking
   - Capture all processing lifecycle events
   - Enable monitoring and audit trails

7. **Secrets Management**
   - AWS Secrets Manager for database credentials and service secrets
   - Automatic rotation where applicable
   - Fine-grained IAM access controls

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **sa-east-1** region
- Use **KMS keys with automatic rotation** for encryption at rest
- All data encrypted in transit using TLS 1.2 or higher
- Multi-AZ configuration for high availability components
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- VPC with public and private subnets across multiple availability zones
- Security groups configured with least privilege access
- IAM roles and policies following least privilege principle
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- HIPAA compliance mandatory - all PHI data must be encrypted
- Brazilian healthcare data protection laws compliance required
- System must handle peak loads of thousands of scans daily
- Multi-AZ deployment required for 99.9% uptime SLA
- All infrastructure components must support clean teardown for CI/CD
- Proper error handling and logging for all components
- CloudWatch logging and monitoring for all services
- Resource tagging for cost allocation and compliance tracking

## Success Criteria

- **Functionality**: All AWS services properly integrated and communicating
- **Security**: Encryption at rest and in transit for all data paths
- **Compliance**: HIPAA-compliant configuration with audit logging
- **Reliability**: Multi-AZ deployment with automatic failover
- **Performance**: System handles specified load with proper auto-scaling
- **Resource Naming**: All resources include environmentSuffix for isolation
- **Code Quality**: Python code following PEP 8, proper typing, comprehensive tests
- **Monitoring**: CloudWatch dashboards and alarms for key metrics
- **Destroyability**: Complete infrastructure teardown without manual intervention

## What to deliver

- Complete AWS CDK Python implementation in lib/ directory
- VPC with multi-AZ subnet configuration
- API Gateway with mutual TLS and proper integration
- RDS Aurora PostgreSQL cluster with KMS encryption
- EFS file system with encryption
- ECS Fargate cluster with task definitions and services
- ElastiCache Redis cluster with multi-AZ failover
- Kinesis Data Stream for event tracking
- AWS Secrets Manager integration for credentials
- KMS keys with automatic rotation enabled
- Security groups with least privilege rules
- IAM roles and policies for service access
- CloudWatch log groups and metric alarms
- Unit tests for all stack constructs with 90%+ coverage
- Integration tests using deployed resource outputs
- Documentation covering deployment and architecture
