Hey team,

We need to build a PCI-DSS compliant infrastructure for a FinTech SaaS startup that processes credit card transactions in real-time. The system needs to handle transaction processing with strict security and compliance requirements, including data encryption at rest and in transit, comprehensive audit logging, and automatic scaling based on transaction volume.

The business has been very clear about compliance - this needs to meet PCI-DSS standards, which means we need proper encryption, key management, audit trails, and network isolation. They also want high availability with automatic failover across multiple Availability Zones, and the infrastructure needs to support blue-green deployments with maximum 30 second failover time and zero data loss guarantee.

I've been asked to create this infrastructure using **CloudFormation with YAML** for the eu-west-1 region. The architecture needs to process transactions through multiple stages using real-time data streaming, with session management for API clients, and proper credential management for all services.

## What we need to build

Create a highly available, secure financial data processing API infrastructure using **CloudFormation YAML** that processes real-time transaction data through multiple stages with strict compliance requirements.

### Core Requirements

1. **API Gateway and Application Layer**
   - REST API endpoints for transaction processing
   - ECS Fargate clusters for running transaction processing services
   - Shared file storage using EFS for application data

2. **Data Storage and Caching**
   - RDS Aurora cluster for transaction storage with encryption
   - ElastiCache Redis for session management and caching
   - Database must support automatic failover

3. **Data Processing Pipeline**
   - Kinesis Data Streams for real-time transaction data processing
   - Multi-stage processing architecture

4. **Security and Secrets Management**
   - AWS Secrets Manager for storing database credentials and API keys
   - KMS encryption keys with automatic rotation
   - All data encrypted at rest and in transit

5. **Network Infrastructure**
   - VPC with proper subnet segmentation
   - NAT Gateway for private subnet connectivity
   - Must span minimum 3 Availability Zones in eu-west-1
   - Network isolation for PCI-DSS compliance

### Technical Requirements

- All infrastructure defined using **CloudFormation YAML**
- Deploy to **eu-west-1** region
- Use **API Gateway** for REST API endpoints
- Use **ECS Fargate** for containerized transaction processing
- Use **RDS Aurora** for transactional database with encryption
- Use **ElastiCache Redis** for session management
- Use **Kinesis Data Streams** for real-time data processing
- Use **AWS Secrets Manager** for credential management
- Use **EFS** for shared storage between containers
- Use **NAT Gateway** for private subnet internet access
- Use **KMS** for encryption key management with automatic rotation
- Use **VPC** with minimum 3 Availability Zones
- Resource names must include a **string suffix** for uniqueness using Parameters
- Follow naming convention: `{resource-type}-{purpose}-{suffix}`
- All resources must support automatic failover
- Support blue-green deployments with maximum 30 second failover time
- Ensure zero data loss during failover scenarios

### Constraints

- Must be PCI-DSS compliant with proper encryption and audit logging
- All data must be encrypted at rest using KMS
- All data must be encrypted in transit using TLS
- Database encryption must use AWS KMS with automatic key rotation
- Infrastructure must be deployed across minimum 3 Availability Zones in eu-west-1
- Must support automatic failover with maximum 30 second failover time
- Must guarantee zero data loss during failover
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch logging
- Network isolation between public and private subnets
- Private subnets for database and application layers
- Public subnets only for load balancers and NAT Gateway

## Success Criteria

- **Functionality**: Complete transaction processing API with real-time data streaming and session management
- **Performance**: Automatic scaling based on transaction volume with sub-30 second failover time
- **Reliability**: High availability across 3+ AZs with automatic failover and zero data loss guarantee
- **Security**: PCI-DSS compliant with encryption at rest and in transit, proper key rotation, and audit logging
- **Resource Naming**: All resources include environmentSuffix parameter for uniqueness
- **Compliance**: Audit logging enabled for all critical services and network isolation implemented
- **Code Quality**: Clean CloudFormation YAML, properly parameterized, well-documented

## What to deliver

- Complete CloudFormation YAML implementation in TapStack.yml
- VPC with 3+ Availability Zones, public and private subnets, NAT Gateway
- API Gateway with REST endpoints
- ECS Fargate cluster with task definitions
- RDS Aurora cluster with multi-AZ deployment and encryption
- ElastiCache Redis cluster with automatic failover
- Kinesis Data Streams for real-time processing
- KMS keys for encryption with automatic rotation
- Secrets Manager secrets for credentials
- EFS file system for shared storage
- Security groups with proper ingress/egress rules
- IAM roles and policies with least privilege access
- CloudWatch log groups for audit logging
- Parameters for customization including environmentSuffix
- Outputs for critical resource identifiers
