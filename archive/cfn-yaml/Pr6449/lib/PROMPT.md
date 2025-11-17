Hey team,

We need to build a security-hardened payment processing infrastructure for a financial services company that's working on PCI-DSS compliance. They're handling payment card data and need defense-in-depth security layers with network isolation, encryption at rest and in transit, and comprehensive audit logging.

The business is serious about security here. We're talking production workloads in us-east-1 with RDS PostgreSQL running in Multi-AZ configuration, S3 for encrypted document storage, and a VPC spanning 3 availability zones. Everything needs to be tagged properly for compliance tracking with Environment, CostCenter, and DataClassification tags.

I've been asked to create this infrastructure using **CloudFormation with YAML**. The security team has been very specific about their requirements, so we need to make sure we hit all of them.

## What we need to build

Create a security-hardened infrastructure using **CloudFormation with YAML** for payment card data processing that meets PCI-DSS compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - VPC with private subnets across 3 availability zones for RDS deployment
   - Security groups allowing only HTTPS (443) traffic between application and database tiers
   - VPC Flow Logs enabled for all network interfaces, writing to S3 bucket

2. **Database Layer**
   - RDS PostgreSQL instance deployed in private subnets with Multi-AZ configuration
   - Database encryption enabled using KMS with automatic key rotation
   - Database accessible only from application tier via security groups

3. **Storage and Encryption**
   - S3 bucket with server-side AES-256 encryption and versioning for audit logs
   - S3 bucket configured with public access blocking
   - KMS key with automatic rotation for RDS encryption

4. **Access Management**
   - IAM roles with specific permissions for EC2 instances to access RDS and S3
   - No wildcard permissions allowed in IAM policies
   - Least-privilege principle enforced across all IAM roles

5. **Logging and Monitoring**
   - CloudWatch Log Groups with 90-day retention for application logs
   - CloudTrail logging enabled with log file validation
   - VPC Flow Logs capturing all network traffic

### Optional Enhancements

If time permits, consider adding:
- AWS Config rules for continuous compliance monitoring
- Secrets Manager for database credentials rotation
- GuardDuty for threat detection

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** for network isolation across 3 availability zones
- Use **RDS PostgreSQL** with encryption and Multi-AZ deployment
- Use **S3** for audit log storage with encryption and versioning
- Use **KMS** for encryption key management with automatic rotation
- Use **IAM** for role-based access control
- Use **CloudWatch Logs** for application logging with retention policies
- Use **CloudTrail** for audit logging with validation
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `ResourceType-${EnvironmentSuffix}`
- Deploy to **us-east-1** region
- Tag all resources with Environment, CostCenter, and DataClassification

### Constraints

- All S3 buckets must use AES-256 encryption and block public access
- RDS instances must be deployed in private subnets only
- All traffic between services must use TLS 1.2 or higher
- Security groups must follow least-privilege principle with no 0.0.0.0/0 ingress rules
- IAM roles must not contain any wildcard (*) permissions
- All resources must have CloudTrail logging enabled with log file validation
- KMS keys must have automatic rotation enabled
- VPC Flow Logs must be enabled for all network interfaces
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All resources deploy successfully and work together
- **Security**: Network isolation enforced, encryption at rest and in transit configured
- **Compliance**: PCI-DSS requirements met with comprehensive audit logging
- **Reliability**: Multi-AZ RDS configuration provides high availability
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Code Quality**: Clean YAML, well-documented, follows CloudFormation best practices

## What to deliver

- Complete CloudFormation YAML template
- VPC with private subnets across 3 AZs and security groups
- RDS PostgreSQL with KMS encryption and Multi-AZ deployment
- S3 bucket with encryption, versioning, and public access blocking
- IAM roles with least-privilege permissions
- CloudWatch Log Groups and VPC Flow Logs
- KMS key with automatic rotation
- CloudTrail configuration with validation
- Documentation and deployment instructions
