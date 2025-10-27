Hey team,

We're building a HIPAA-compliant healthcare data processing infrastructure for MediTech Solutions. They're launching a new patient records management system that needs to handle sensitive healthcare data with strict security and compliance requirements. This is a mission-critical system where security, encryption, and audit trails are non-negotiable.

The challenge here is creating a multi-tier, highly available architecture that processes patient records through a secure, containerized application while maintaining HIPAA compliance at every layer. We need encrypted data storage, comprehensive audit logging, and strict network segmentation with no direct public access to sensitive components.

I've been asked to create this using **CloudFormation with YAML** for the eu-central-1 region. This needs to be production-grade infrastructure that can handle healthcare workloads with enterprise-level security and reliability.

## What we need to build

Create a HIPAA-compliant healthcare data processing infrastructure using **CloudFormation with YAML** that processes sensitive patient records through a secure, containerized application architecture with encrypted data storage and comprehensive audit logging.

### Core Requirements

1. **Container Platform**
   - ECS Fargate cluster for containerized applications
   - Automatic scaling based on demand
   - Private subnet deployment with no direct internet access

2. **Database Layer**
   - RDS Aurora cluster with encryption at rest
   - Automated backups with point-in-time recovery
   - Multi-AZ deployment for high availability

3. **Shared Storage**
   - EFS file system with encryption at rest
   - Shared access across multiple containers
   - Automatic backups enabled

4. **Session Management**
   - ElastiCache Redis cluster for session data
   - Encryption in transit enabled
   - Multi-AZ deployment

5. **API Gateway and Security**
   - API Gateway for RESTful endpoints
   - WAF integration for request filtering and DDoS protection
   - Rate limiting and throttling controls

6. **Secrets Management**
   - Fetch existing secrets from Secrets Manager (do not create new secrets)
   - Use secrets for database credentials and API keys
   - Secure credential rotation support

7. **Network Architecture**
   - VPC with public and private subnets across multiple AZs
   - NAT Gateway for outbound internet access from private subnets
   - Security groups with strict ingress/egress rules

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **ECS Fargate** for containerized workloads
- Use **RDS Aurora** for encrypted database storage
- Use **EFS** for shared file storage with encryption
- Use **ElastiCache Redis** for session management
- Use **API Gateway** with **WAF** integration for secure API access
- Use **Secrets Manager** to fetch existing secrets (do not create new ones)
- Use **NAT Gateway** for private subnet internet access
- All data must be encrypted at rest using KMS keys with automatic key rotation
- All data in transit must be encrypted using TLS/SSL
- Resource names must include a **string suffix** for uniqueness (EnvironmentSuffix parameter)
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy to **eu-central-1** region
- Implement strict network segmentation with no direct public access to databases or containers

### Constraints

- HIPAA compliance is mandatory - all PHI data must be encrypted at rest and in transit
- Network architecture must use private subnets for databases and containers
- No direct public internet access to RDS, ElastiCache, or ECS tasks
- All encryption must use AWS KMS with automatic key rotation enabled
- Comprehensive audit logging to CloudWatch Logs for all API calls and data access
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging throughout the infrastructure
- Security groups must implement least-privilege access controls
- Multi-AZ deployment required for RDS and ElastiCache for high availability

## Success Criteria

- **Functionality**: Complete HIPAA-compliant infrastructure with all 7 AWS services deployed
- **Encryption**: All data stores (RDS, EFS, ElastiCache) encrypted at rest with KMS
- **Network Security**: Strict segmentation with databases and containers in private subnets
- **High Availability**: RDS Aurora and ElastiCache deployed across multiple AZs
- **API Security**: API Gateway integrated with WAF for request filtering and protection
- **Secrets Management**: Database credentials and API keys fetched from existing Secrets Manager entries
- **Resource Naming**: All resources include EnvironmentSuffix parameter for uniqueness
- **Code Quality**: Valid CloudFormation YAML, well-structured, properly documented
- **Compliance**: Audit logging enabled for all security-sensitive operations

## What to deliver

- Complete CloudFormation YAML template implementation
- VPC with public and private subnets across multiple AZs
- ECS Fargate cluster with auto-scaling task definitions
- RDS Aurora cluster with encryption, automated backups, and Multi-AZ
- EFS file system with encryption at rest
- ElastiCache Redis cluster with encryption in transit and Multi-AZ
- API Gateway with WAF integration and security rules
- NAT Gateway for private subnet internet access
- KMS keys for encryption with automatic rotation
- Security groups implementing least-privilege access
- IAM roles and policies following least-privilege principle
- CloudWatch log groups for audit trails
- Documentation on architecture and deployment
