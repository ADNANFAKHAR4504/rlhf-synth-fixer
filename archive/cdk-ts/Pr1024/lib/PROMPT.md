# Financial Services Security Infrastructure - TAP Stack

## Project Requirements

Create a comprehensive AWS CDK infrastructure solution for a financial services organization that implements enterprise-grade security controls and follows AWS best practices.

## Infrastructure Requirements

### Core Components
1. **VPC Infrastructure**
   - Multi-region capable VPC with conditional CIDR allocation
   - Primary region (us-east-1): 10.0.0.0/16
   - Secondary region (eu-west-1): 10.1.0.0/16
   - Private subnets across 2 availability zones
   - DNS resolution and hostnames enabled

2. **Encryption & Key Management**
   - Customer-managed KMS key with automatic rotation enabled
   - Human-readable KMS alias for easy identification
   - Encryption for all data at rest using the KMS key

3. **Network Security**
   - Security group for Lambda functions with minimal required access
   - HTTPS ingress from VPC CIDR only
   - HTTPS egress to internet for necessary communications
   - No public subnets to enforce private deployment model

4. **Data Storage**
   - DynamoDB table for Turn Around Prompt data
   - Pay-per-request billing mode for cost optimization
   - Point-in-time recovery enabled for data protection
   - Customer-managed KMS encryption

### Security Requirements
- All resources must be tagged for compliance and cost allocation
- Infrastructure follows principle of least privilege
- No public internet access for compute resources
- Encryption in transit and at rest for all data
- Key rotation enabled for cryptographic keys

### Operational Requirements
- Environment-specific resource naming with configurable suffix
- Comprehensive CloudFormation outputs for service integration
- Support for multiple deployment environments (dev, staging, prod)
- Infrastructure as Code with version control

## Technical Specifications

### Technology Stack
- **Platform**: AWS CDK (Cloud Development Kit)
- **Language**: TypeScript
- **Testing**: Jest with comprehensive unit and integration tests
- **Deployment**: CI/CD pipeline with automated testing

### Resource Naming Convention
- All resources include environment suffix for multi-environment support
- Format: `ResourceName${EnvironmentSuffix}`
- Example: `TurnAroundPromptTabledev`

### Outputs Required
- VPC ID for service integration
- KMS Key ID for encryption operations
- Security Group ID for Lambda deployment
- DynamoDB table name and ARN for application configuration
- Environment suffix for deployment validation

## Quality Assurance

### Unit Testing Requirements
- Minimum 70% code coverage
- Test all resource configurations
- Validate security group rules
- Verify environment-specific configurations
- Test multi-region deployment scenarios

### Integration Testing Requirements
- Validate actual AWS resource creation
- Test DynamoDB read/write operations
- Verify VPC and security group configurations
- Validate KMS key functionality and access
- Confirm resource tagging and naming conventions

## Compliance & Security

### Financial Services Compliance
- Data encryption at rest using customer-managed keys
- Network isolation using private subnets
- Audit logging capabilities through CloudTrail integration
- Secure key management with automatic rotation

### Infrastructure Security
- No hardcoded secrets or credentials
- Minimal IAM permissions following least privilege
- Network segmentation and access controls
- Encrypted inter-service communication

This infrastructure provides the foundation for a secure, scalable financial services platform that meets enterprise security requirements while maintaining operational flexibility through environment-specific deployments.