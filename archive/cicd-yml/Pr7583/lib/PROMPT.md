Hey team,

We need to build a secure CI/CD pipeline infrastructure for a Japanese e-commerce company's payment processing service. They're looking to deploy containerized payment applications with proper security and compliance measures that meet PCI DSS requirements.

The business team is concerned about handling customer transaction data securely and wants automated deployments that don't compromise security. They need the ability to run multiple containerized payment services while maintaining strict isolation and encryption for sensitive data like database credentials. The service will be processing real customer payments, so reliability and security are absolutely critical.

This needs to be implemented using **Pulumi with Go** for the infrastructure as code. The team has standardized on Pulumi for its strong typing and Go for its performance characteristics.

## What we need to build

Create a CI/CD pipeline infrastructure using **Pulumi with Go** for an e-commerce payment processing service with secure database handling and automated deployments.

### Core Requirements

1. **Container Orchestration**
   - ECS cluster for running containerized payment services
   - Support for multiple payment processing containers
   - Proper task definitions with resource limits

2. **Database Infrastructure**
   - RDS PostgreSQL instance in multi-AZ configuration for transaction data
   - Encryption at rest enabled
   - Automated backups configured
   - Proper subnet group configuration for high availability

3. **CI/CD Pipeline**
   - CodePipeline setup for automated deployments
   - CodeBuild integration for building container images
   - S3 bucket for pipeline artifacts
   - Proper IAM roles for pipeline execution

4. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Automatic secrets rotation implemented
   - Secure credential injection into ECS tasks

5. **Network Security**
   - VPC with private subnets across at least two availability zones
   - Security groups with proper isolation
   - Network segmentation for payment processing compliance

### Technical Requirements

- All infrastructure defined using **Pulumi with Go**
- Use **ECS (Elastic Container Service)** for containerized payment services
- Use **RDS PostgreSQL** with Multi-AZ deployment for transaction database
- Use **CodePipeline and CodeBuild** for automated CI/CD
- Use **AWS Secrets Manager** with rotation for database credentials
- Use **VPC with private subnets** for network isolation
- Deploy to **us-east-1** region (despite background mentioning Tokyo, constraints specify us-east-1)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All resources must be immediately testable and verifiable

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources must include environmentSuffix parameter
  - Format: `resourceName-${environmentSuffix}` or use environmentSuffix in naming
  - This ensures uniqueness across parallel deployments
  - Never use hardcoded environment names (prod, dev, stage)
- **Destroyability**: All resources must be destroyable after testing
  - FORBIDDEN: RemovalPolicy.RETAIN or retention policies
  - FORBIDDEN: DeletionProtection flags set to true
  - RDS instances must use DeletionProtection: false
  - S3 buckets must allow deletion
- **Service-Specific Requirements**:
  - AWS Config: Use IAM policy `service-role/AWS_ConfigRole` if Config is needed
  - Lambda: If using Node.js 18+, use AWS SDK v3 or extract from event object
  - SecretsManager: Implement rotation configuration for database credentials

### Constraints

- All resources must be deployed in us-east-1 with at least two availability zones
- RDS instance must be configured with encryption at rest and automated backups
- Secrets rotation must be implemented for database credentials using SecretsManager
- Infrastructure must comply with PCI DSS requirements for payment processing
- Proper isolation and security measures must be implemented
- Security groups must restrict access appropriately
- No public internet access for database instances
- IAM roles must follow least privilege principle
- Include proper error handling and logging with CloudWatch

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that can deploy containerized applications to ECS
- **Security**: Database credentials stored in Secrets Manager with rotation, encryption at rest enabled
- **High Availability**: Multi-AZ deployment for RDS, ECS tasks across multiple availability zones
- **Compliance**: Network isolation with private subnets, security groups properly configured
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch logging enabled for ECS tasks and pipeline execution
- **Code Quality**: Go code following Pulumi best practices, properly typed, well-documented

## What to deliver

- Complete Pulumi Go implementation in lib/tap_stack.go
- ECS cluster with task definitions for payment services
- RDS PostgreSQL Multi-AZ instance with encryption
- CodePipeline with CodeBuild integration
- AWS Secrets Manager setup with rotation
- VPC with private subnets and security groups
- IAM roles and policies for all services
- S3 bucket for pipeline artifacts
- CloudWatch log groups for monitoring
- Unit tests for all infrastructure components
- Documentation and deployment instructions in lib/README.md
