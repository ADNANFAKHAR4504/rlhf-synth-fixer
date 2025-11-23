Hey team,

We need to build a secure data processing infrastructure for our financial services client who handles sensitive customer information. They need comprehensive security controls that meet PCI-DSS compliance requirements, and I've been asked to create this using **Terraform with HCL**.

The business is really focused on defense-in-depth security here. They want multiple layers of protection - network isolation, encryption everywhere, strict access controls, and active threat monitoring. The infrastructure needs to process customer data securely while meeting all their regulatory requirements.

This is going to be deployed in the us-east-1 region across three availability zones for high availability. The architecture uses VPC isolation with private subnets only - no public internet access at all. We'll use VPC endpoints to access AWS services like S3 and DynamoDB without leaving the AWS network.

## What we need to build

Create a secure data processing infrastructure using **Terraform with HCL** for a financial services environment. The infrastructure must implement comprehensive security controls and meet PCI-DSS compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR 10.0.0.0/16 spanning 3 availability zones
   - Private subnets only (no public subnets or internet gateways)
   - VPC endpoints for S3 and DynamoDB with restrictive endpoint policies
   - Resource names must include **environment_suffix** for uniqueness (e.g., vpc-${var.environment_suffix})

2. **Security Groups and Network ACLs**
   - Security groups allowing only HTTPS (port 443) and PostgreSQL (port 5432) traffic
   - No 0.0.0.0/0 inbound rules permitted
   - Network ACLs with explicit deny rules for unauthorized ports: 20-21 (FTP), 23 (Telnet), 135-139 (NetBIOS), 445 (SMB), 3389 (RDP)

3. **Data Storage and Encryption**
   - S3 buckets with customer-managed KMS encryption
   - S3 versioning enabled on all buckets
   - S3 access logging configured
   - DynamoDB table for metadata storage

4. **Secrets Management**
   - Secrets Manager for database credentials
   - Automatic 30-day rotation configured
   - Secure retrieval by Lambda functions

5. **Compute Resources**
   - Lambda functions for data processing
   - VPC connectivity with private subnet attachment
   - IAM roles following least privilege principle
   - Explicit deny policies for sensitive actions (e.g., iam:PassRole, sts:AssumeRole to prevent privilege escalation)

6. **Threat Detection and Monitoring**
   - GuardDuty detector with S3 protection enabled (note: GuardDuty is account-level, one detector per account/region)
   - SNS topic for HIGH severity findings notifications
   - CloudWatch log groups with 90-day retention
   - KMS encryption for all CloudWatch logs

7. **Compliance Tagging**
   - All resources tagged with DataClassification='Sensitive'
   - All resources tagged with ComplianceScope='PCI-DSS'
   - Consistent naming with environment suffix for resource uniqueness

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS VPC** for network isolation
- Use **AWS KMS** for customer-managed encryption keys
- Use **Amazon S3** with versioning and encryption
- Use **AWS Lambda** with VPC connectivity
- Use **Amazon DynamoDB** for metadata
- Use **AWS IAM** with least privilege roles
- Use **AWS Security Groups** and **Network ACLs** for network security
- Use **AWS VPC Endpoints** for private AWS service access
- Use **AWS GuardDuty** for threat detection (account-level service)
- Use **Amazon SNS** for alert notifications
- Use **Amazon CloudWatch Logs** with encryption
- Use **AWS Secrets Manager** with rotation
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: resource-type-${var.environment_suffix}
- All resources must be destroyable (no Retain policies or DeletionProtection)

### Constraints

- No public subnets or internet gateways permitted
- VPC endpoints required for all AWS service access
- Customer-managed KMS keys required (not AWS-managed)
- IAM roles must have explicit deny statements for privilege escalation
- Security groups cannot use 0.0.0.0/0 for inbound rules
- CloudWatch logs must have 90-day retention minimum
- All credentials stored in Secrets Manager only
- GuardDuty is account-level (one detector per account) - document if already exists
- All resources must support clean destroy operations

## Success Criteria

- **Network Security**: VPC with private subnets only, VPC endpoints configured, Network ACLs blocking unauthorized ports
- **Data Protection**: S3 encryption with KMS, versioning enabled, access logging configured
- **Access Control**: IAM roles with least privilege, explicit deny policies, no credential hardcoding
- **Threat Detection**: GuardDuty enabled with S3 protection, SNS notifications for HIGH findings
- **Compliance**: All resources tagged with DataClassification and ComplianceScope
- **Logging**: CloudWatch log groups with 90-day retention and KMS encryption
- **Secrets Management**: Database credentials in Secrets Manager with 30-day rotation
- **Resource Naming**: All named resources include environment_suffix variable
- **Code Quality**: Modular Terraform HCL, well-organized, properly documented

## What to deliver

- Complete Terraform HCL configuration in modular structure
- Separate .tf files for networking, security, storage, compute, and monitoring
- Variables file with environment_suffix and other environment-specific settings
- Outputs file with critical resource IDs, ARNs, and endpoints
- Provider configuration for AWS with us-east-1 region
- All AWS services listed above properly configured
- Comprehensive security controls meeting PCI-DSS requirements
- Documentation explaining GuardDuty account-level limitation if applicable
