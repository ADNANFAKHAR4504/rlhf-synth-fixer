Hey team,

We need to build infrastructure for a German university's learning management system that handles thousands of concurrent students while staying GDPR compliant. The university requires a secure, scalable containerized platform that protects student data and meets European data protection standards.

I've been asked to create this using **CloudFormation with YAML**. The business needs rock-solid data protection with encryption everywhere, proper backup policies, and network isolation that meets educational compliance requirements.

The university has specific concerns about data residency and protection - everything must be deployed in Frankfurt (eu-central-1) with proper encryption at rest and in transit. They also need the ability to recover from any data loss scenarios with point-in-time recovery capabilities.

## What we need to build

Create a secure containerized learning management system infrastructure using **CloudFormation YAML** for a European university with strict GDPR compliance requirements.

### Core Requirements

1. **Container Platform**
   - ECS Fargate cluster for running the LMS application containers
   - Task definitions with proper CPU and memory allocation
   - Auto-scaling capabilities for handling concurrent student access

2. **Database Layer**
   - RDS Aurora PostgreSQL cluster for storing student data
   - Must support thousands of concurrent connections
   - 90-day backup retention with point-in-time recovery enabled
   - Encryption at rest using KMS

3. **Session Management**
   - ElastiCache Redis cluster for session caching
   - Improves performance for concurrent user sessions
   - Must be encrypted in transit

4. **Secrets Management**
   - AWS SecretsManager for database credentials
   - Automatic rotation capabilities
   - Secure retrieval by ECS tasks

5. **Persistent Storage**
   - EFS filesystem for course materials and user uploads
   - Encrypted at rest
   - Accessible from multiple ECS tasks

### Technical Requirements

- All infrastructure defined using **CloudFormation YAML**
- Use **VPC** with public and private subnets across multiple availability zones
- Use **NAT Gateway** for private subnet internet access
- Use **KMS** for encryption keys (separate keys for different services)
- Use **Security Groups** with least privilege access rules
- Use **ECS Fargate** for container orchestration
- Use **Aurora PostgreSQL** for relational database
- Use **ElastiCache Redis** for caching layer
- Use **SecretsManager** for credential management
- Use **EFS** for shared file storage
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **eu-central-1** region

### Constraints

- All data must be encrypted at rest using KMS customer managed keys
- All data must be encrypted in transit using TLS/SSL
- Database backups must be retained for 90 days minimum
- Point-in-time recovery must be enabled for databases
- All application resources must be in private subnets
- No direct internet access to application resources
- Internet access only through NAT Gateway for outbound connections
- All resources must be destroyable (no Retain deletion policies)
- Security groups must follow least privilege principle
- VPC must span at least 2 availability zones for high availability

## Success Criteria

- **Functionality**: Complete containerized LMS infrastructure with database, caching, and file storage
- **Security**: All data encrypted at rest and in transit, credentials in SecretsManager
- **Compliance**: 90-day backup retention, point-in-time recovery enabled, GDPR-compliant data protection
- **Network Isolation**: Private subnets for all resources, controlled internet access via NAT
- **High Availability**: Multi-AZ deployment for database and application tiers
- **Resource Naming**: All resources include string suffix for uniqueness
- **Code Quality**: Clean YAML, well-structured, properly documented

## What to deliver

- Complete CloudFormation YAML template implementation
- VPC with public and private subnets, NAT Gateway, Internet Gateway
- ECS Fargate cluster with task definitions and service
- Aurora PostgreSQL cluster with encryption and backup configuration
- ElastiCache Redis cluster with encryption in transit
- KMS keys for encryption at rest
- SecretsManager secret for database credentials
- EFS filesystem with encryption
- Security groups for all components with least privilege rules
- Documentation of the architecture and deployment process
