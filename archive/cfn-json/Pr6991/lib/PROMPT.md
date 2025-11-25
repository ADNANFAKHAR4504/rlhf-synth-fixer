# Secure Financial Data Processing Pipeline

Hey team,

We need to build a secure data processing pipeline for handling financial transactions. I've been asked to create this infrastructure using **CloudFormation with JSON**. The business is serious about meeting strict compliance requirements for handling sensitive customer information - we're talking encryption at all layers, fine-grained access controls, and comprehensive audit logging for regulatory compliance.

This is for a financial services company, so security is paramount. They want every component locked down - no shortcuts, no wildcards in IAM policies, everything encrypted, and full audit trails. The pipeline needs to handle transaction data securely from ingestion through processing and storage.

The architecture will be deployed in us-east-2 across multiple availability zones for high availability. We're talking Lambda functions running in completely isolated VPCs with no internet access, DynamoDB for transaction storage with full encryption and point-in-time recovery, API Gateway with strict validation and API key requirements, and Secrets Manager handling credential rotation automatically. All AWS service communication will flow through VPC Endpoints to keep traffic off the public internet.

## What we need to build

Create a secure financial data processing infrastructure using **CloudFormation with JSON** for regulatory compliance and data protection.

### Core Infrastructure Requirements

1. **Encryption Foundation**
   - Create KMS customer-managed key with automatic key rotation enabled
   - Use this key to encrypt all services: S3, DynamoDB, Lambda environment variables, CloudWatch Logs, and Secrets Manager

2. **Data Storage Layer**
   - Deploy S3 bucket with SSE-KMS encryption using the customer-managed key
   - Enable versioning for audit trail and compliance
   - Configure lifecycle policies for long-term data archival
   - Create DynamoDB table for transaction records with encryption at rest
   - Enable point-in-time recovery for disaster recovery
   - Enable contributor insights for operational monitoring

3. **Compute and Processing**
   - Implement Lambda functions for data processing
   - Deploy Lambda in VPC private subnets with no internet access
   - Encrypt Lambda environment variables using KMS
   - Configure proper IAM execution roles with least-privilege permissions

4. **API Layer**
   - Configure API Gateway REST API for secure access
   - Enable request validation to prevent malformed requests
   - Require API keys for all endpoints
   - Enable CloudWatch logging for audit trails

5. **Secrets Management**
   - Set up Secrets Manager to store RDS database credentials
   - Configure automatic rotation every 30 days
   - Encrypt secrets with KMS customer-managed key

6. **Network Security**
   - Create VPC spanning 3 availability zones with private subnets only
   - Implement security groups with explicit ingress and egress rules
   - No NAT gateways or internet gateways - fully isolated
   - Create VPC Endpoints for S3, DynamoDB, and Secrets Manager to avoid internet traffic

7. **Monitoring and Alerting**
   - Configure CloudWatch Log Groups with KMS encryption for all services
   - Set 90-day retention policy for compliance
   - Create CloudWatch alarms for failed API requests
   - Create CloudWatch alarms for Lambda execution errors

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **KMS** for encryption key management with automatic rotation
- Use **S3** with SSE-KMS encryption, versioning, and lifecycle policies
- Use **DynamoDB** with encryption, point-in-time recovery, and contributor insights
- Use **Lambda** in VPC private subnets with KMS-encrypted environment variables
- Use **API Gateway** REST API with request validation, API keys, and logging
- Use **Secrets Manager** with automatic 30-day credential rotation
- Use **IAM** roles with explicit least-privilege permissions - no wildcard actions allowed
- Use **Security Groups** with explicit CIDR blocks and minimal required ports
- Use **CloudWatch Logs** with KMS encryption and 90-day retention
- Use **VPC Endpoints** for S3, DynamoDB, and Secrets Manager
- Use **CloudWatch Alarms** for API failures and Lambda errors
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-2** region

### Security and Compliance Constraints

- All S3 buckets must use SSE-KMS encryption with customer-managed keys (no AWS-managed keys)
- Lambda functions must run in isolated VPC environments with absolutely no internet access
- DynamoDB tables must use point-in-time recovery and encryption at rest (non-negotiable)
- IAM roles must follow least-privilege principle with no wildcard actions whatsoever
- All API Gateway endpoints must require API keys and use request validation
- CloudWatch Logs must be encrypted with KMS and have 90-day retention minimum
- Security groups must explicitly define all ingress and egress rules (no 0.0.0.0/0 unless justified)
- All resources must have cost allocation tags for compliance tracking
- Secrets Manager must rotate database credentials every 30 days automatically
- All resources must be destroyable - no Retain deletion policies or deletion protection flags
- Follow AWS Well-Architected Framework security pillar best practices

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter for uniqueness
- Use parameter format: {resource-type}-${environmentSuffix}
- All resources MUST be destroyable - absolutely no DeletionPolicy: Retain
- No deletion protection on any resources (DynamoDB, RDS, etc.)
- Template must accept environmentSuffix as a CloudFormation parameter
- All resources must support clean teardown for testing and development environments

## Success Criteria

- **Functionality**: All components deploy successfully and integrate properly
- **Security**: Full encryption at rest and in transit, no wildcard IAM permissions, VPC isolation working
- **Compliance**: All audit logging enabled, cost allocation tags present, credential rotation configured
- **Monitoring**: CloudWatch alarms triggering correctly, logs encrypted and retained properly
- **Resource Naming**: All resources include environmentSuffix in their names
- **Destroyability**: Complete stack can be deleted cleanly without manual intervention
- **Code Quality**: Valid JSON syntax, proper CloudFormation resource dependencies, well-documented

## What to deliver

- Complete CloudFormation JSON template with all required resources
- KMS key, S3 bucket, DynamoDB table, Lambda functions, API Gateway, Secrets Manager, VPC with endpoints
- IAM roles and policies following least-privilege principle
- Security groups with explicit rules
- CloudWatch Log Groups with encryption and alarms
- Proper parameter definitions including environmentSuffix
- Clear documentation on deployment and usage
- Unit tests validating the template structure and compliance requirements
