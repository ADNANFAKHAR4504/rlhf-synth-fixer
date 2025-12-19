Hey team,

We need to build a secure data processing infrastructure for handling sensitive financial transactions. This is for a financial services company that needs to comply with PCI-DSS requirements, so security and compliance are absolutely critical here. The whole system needs to enforce strict access controls, encrypt data at rest and in transit, and provide comprehensive audit logging to meet regulatory standards.

I've been asked to create this infrastructure using **CloudFormation with JSON**. The business has been clear that we need to follow PCI-DSS requirements closely, which means every aspect of this infrastructure needs to be locked down tight. We're talking customer-managed encryption keys, VPC isolation, no direct internet access for processing components, and audit trails for everything.

The data processing workflow will center around Lambda functions running in private subnets, pulling data from S3 buckets with strict versioning and encryption controls. All storage needs to be encrypted with customer-managed KMS keys, and we need to ensure that IAM permissions follow the principle of least privilege with no wildcards allowed.

## What we need to build

Create a secure data processing infrastructure using **CloudFormation with JSON** for PCI-DSS compliant financial transaction processing in AWS.

### Core Requirements

1. **S3 Storage with Security Controls**
   - Create S3 bucket with AES-256 encryption enabled
   - Enable versioning on all buckets
   - Implement lifecycle policies for data management
   - Block all public access

2. **Lambda Processing in VPC**
   - Deploy Lambda function in VPC private subnets for data processing
   - No direct internet access for Lambda functions
   - Configure appropriate timeout and memory settings
   - Implement error handling and retry logic

3. **Encryption Key Management**
   - Configure customer-managed KMS keys for all encryption operations
   - Use KMS keys for S3, Lambda environment variables, and any other encrypted resources
   - Enable key rotation for compliance

4. **IAM Security**
   - Implement IAM roles with explicit permissions for each service
   - Follow principle of least privilege
   - No wildcard permissions allowed
   - Each service gets its own dedicated role

5. **Network Infrastructure**
   - Set up VPC with 2 private subnets across different availability zones
   - No internet gateway (private subnets only)
   - NAT instances for controlled outbound traffic if needed
   - Proper subnet CIDR allocation

6. **VPC Flow Logs**
   - Enable VPC flow logs for network monitoring
   - Store logs with 90-day retention minimum
   - Use CloudWatch Logs for storage

7. **Security Groups**
   - Configure security groups with explicit ingress and egress rules
   - No 0.0.0.0/0 CIDR blocks allowed
   - Define specific port ranges and protocols

8. **Resource Tagging**
   - Add required tags to all resources: Environment, Owner, CostCenter
   - Ensure consistent tagging across all infrastructure

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Deploy to **us-east-1** region
- Use **S3** for secure data storage with encryption and versioning
- Use **Lambda** for serverless data processing in VPC
- Use **KMS** for customer-managed encryption keys
- Use **VPC** with private subnets only across 2 availability zones
- Use **CloudWatch Logs** for VPC flow logs with 90-day retention
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: Use CloudFormation parameter substitution with !Sub
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

### Constraints

- All S3 buckets must have versioning enabled and use AES-256 encryption
- Lambda functions must run within a VPC with no direct internet access
- All IAM roles must follow the principle of least privilege with no wildcard permissions
- All encryption operations must use customer-managed KMS keys
- VPC flow logs must be enabled and stored for at least 90 days
- All resources must be tagged with Environment, Owner, and CostCenter
- Security groups must explicitly define all ingress and egress rules with no 0.0.0.0/0 CIDR blocks
- All API endpoints must use HTTPS with TLS 1.2 or higher
- No public internet access for any compute resources
- All data must be encrypted at rest and in transit

### Optional Enhancements

If time permits and it makes sense for the architecture:
- Add AWS Config rules for compliance monitoring to automate compliance checking
- Implement CloudTrail for API audit logging to enhance security auditing
- Add SNS topic for security alerts to enable real-time security notifications

## Success Criteria

- **Functionality**: S3 bucket with encryption and versioning, Lambda function in VPC private subnet, KMS encryption for all resources
- **Security**: Customer-managed KMS keys, no wildcard IAM permissions, VPC isolation, no public access, explicit security group rules
- **Compliance**: VPC flow logs with 90-day retention, proper resource tagging, PCI-DSS aligned architecture
- **Network**: VPC with 2 private subnets across different AZs, no internet gateway, controlled outbound via NAT if needed
- **Resource Naming**: All resources include EnvironmentSuffix parameter for uniqueness
- **Destroyability**: No Retain deletion policies, all resources can be fully deleted
- **Code Quality**: Valid CloudFormation JSON, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template implementation
- S3 bucket with encryption, versioning, and lifecycle policies
- Lambda function configured for VPC deployment in private subnets
- KMS customer-managed keys for encryption operations
- VPC with 2 private subnets across different availability zones
- VPC flow logs with CloudWatch Logs storage and 90-day retention
- Security groups with explicit rules and no 0.0.0.0/0 CIDR blocks
- IAM roles with least privilege permissions for all services
- Proper resource tagging on all infrastructure components
- Documentation with deployment instructions
- Integration tests to verify the deployed infrastructure
