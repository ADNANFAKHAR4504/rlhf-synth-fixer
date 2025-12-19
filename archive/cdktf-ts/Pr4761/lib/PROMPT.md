Hey team,

RetailCo is launching a new e-commerce platform that needs to process and store credit card transactions securely. We've been asked to build a PCI-DSS compliant payment processing system that can handle sensitive payment data while maintaining proper audit trails for compliance reporting. The business is particularly concerned about data security and wants everything encrypted at rest with proper access controls.

The infrastructure needs to support their payment processing application, store transaction data in a secure database, manage session state for shopping carts, and run containerized application services. They're dealing with credit card information, so we need to follow PCI-DSS compliance requirements strictly.

I've been tasked with creating this using **CDKTF with TypeScript** for the us-west-2 region. The security team has given us specific requirements about encryption, network isolation, and credential management that we need to follow carefully.

## What we need to build

Create a PCI-DSS compliant payment processing infrastructure using **CDKTF with TypeScript** that securely handles credit card transaction data with proper encryption, network isolation, and credential rotation.

### Core Requirements

1. **Database Layer**
   - Multi-AZ PostgreSQL RDS instance for transaction data storage
   - Deploy in private subnets with no public access
   - Enable encryption at rest using KMS keys
   - Automatic backup retention for compliance

2. **Secrets Management**
   - AWS Secrets Manager for encrypting sensitive payment information
   - Store database credentials securely
   - Implement automatic secret rotation every 30 days
   - Encrypt secrets using KMS keys

3. **Caching Layer**
   - ElastiCache Redis cluster for session management
   - Multi-AZ deployment for high availability
   - Enable encryption at rest and in-transit
   - Deploy in private subnets

4. **Application Layer**
   - ECS cluster for running containerized payment application
   - ECS task definitions with proper IAM roles
   - Deploy in private subnets with load balancer access
   - Auto-scaling configuration for high availability

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **AWS RDS PostgreSQL** for transaction storage with Multi-AZ enabled
- Use **AWS Secrets Manager** for credential and sensitive data encryption
- Use **AWS ElastiCache Redis** for session state management
- Use **AWS ECS** for containerized application deployment
- Deploy to **us-west-2** region
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- All data encrypted at rest using AWS KMS customer-managed keys
- Network isolation using VPC with public and private subnets
- Database and cache in private subnets only

### Security and Compliance Constraints

- All data must be encrypted at rest using AWS KMS customer-managed keys
- All data must be encrypted in transit using TLS
- Database must be deployed in private subnets with no public access
- ElastiCache must be deployed in private subnets
- Implement automatic secret rotation for database credentials every 30 days
- Use security groups with least privilege access
- Enable encryption for all storage services
- All resources must be destroyable (no Retain deletion policies)
- Include proper IAM roles with least privilege permissions
- Enable CloudWatch logging for audit trails

### High Availability Requirements

- RDS Multi-AZ deployment for database failover
- ElastiCache Multi-AZ deployment for cache redundancy
- ECS service with multiple tasks across availability zones
- Application Load Balancer for ECS service distribution
- Auto-scaling policies for ECS tasks

## Success Criteria

- **Functionality**: All AWS services deployed and properly integrated (RDS, Secrets Manager, ElastiCache, ECS)
- **Security**: All data encrypted at rest with KMS, database in private subnets, automatic secret rotation enabled
- **High Availability**: Multi-AZ deployments for RDS and ElastiCache, ECS auto-scaling configured
- **Compliance**: PCI-DSS requirements met (encryption, audit logging, access controls, secret rotation)
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Network Isolation**: Proper VPC setup with public/private subnet separation
- **Code Quality**: TypeScript, well-tested, properly documented

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with public and private subnets across multiple availability zones
- KMS keys for encryption at rest
- RDS PostgreSQL Multi-AZ instance with encryption
- Secrets Manager secrets with automatic 30-day rotation
- ElastiCache Redis cluster with Multi-AZ and encryption
- ECS cluster with Fargate tasks and Application Load Balancer
- Security groups with least privilege access rules
- IAM roles and policies following least privilege principle
- CloudWatch log groups for audit trails
- Unit tests for all infrastructure components
- Integration tests verifying resource connectivity
- Documentation and deployment instructions
