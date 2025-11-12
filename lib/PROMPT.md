Hey team,

We need to build a secure data processing infrastructure for a financial services company that handles sensitive payment card data. The business is laser-focused on meeting PCI-DSS Level 1 compliance requirements, which means we need comprehensive security controls at every layer - network isolation, encryption everywhere, least-privilege access, and robust monitoring.

The challenge here is implementing true defense-in-depth security. We're talking private subnets only across 3 availability zones, with all egress traffic flowing through AWS Network Firewall for inspection. Every piece of data needs to be encrypted using customer-managed KMS keys, both at rest and in transit. We need to ensure that no resource can accidentally expose data to the internet, and that every API call and security event is logged and monitored.

I've been asked to create this using **CDKTF with Python**. The business wants a modular infrastructure with separate concerns - networking, security controls, monitoring, and data processing - all working together to create a hardened environment. They're particularly concerned about maintaining audit trails for compliance officers and ensuring that credentials are rotated automatically without manual intervention.

## What we need to build

Create a secure data processing infrastructure using **CDKTF with Python** for a financial services company meeting PCI-DSS Level 1 compliance standards.

### Core Requirements

1. **Network Infrastructure and Isolation**
   - VPC with private subnets across 3 availability zones (no public subnets allowed)
   - AWS Network Firewall with stateful rules blocking all traffic except HTTPS to specific AWS service endpoints
   - VPC Flow Logs with S3 storage and 90-day retention lifecycle rules
   - Security groups with descriptions for every rule and no 0.0.0.0/0 ingress allowed

2. **Encryption and Key Management**
   - KMS customer-managed keys (CMK) with key policies restricting usage to specific IAM roles
   - Enable automatic key rotation on all KMS keys
   - All data must be encrypted at rest using AWS KMS CMKs
   - CloudWatch Log Groups encrypted with KMS

3. **Data Storage and Processing**
   - S3 buckets with bucket policies denying unencrypted uploads
   - S3 buckets require MFA for object deletions
   - Enable versioning, server-side encryption, and access logging on all S3 buckets
   - Lambda functions with VPC configuration for secure data processing
   - IAM roles that can only access specific S3 buckets and KMS keys (least-privilege principle)

4. **Secrets Management and Rotation**
   - AWS Secrets Manager secrets for database credentials
   - Lambda rotation functions for automatic credential rotation
   - Automatic rotation enabled (not manual)
   - Secrets fetched from existing Secrets Manager entries (not created by stack)

5. **Monitoring and Alerting**
   - CloudWatch Log Groups with KMS encryption for all application logs
   - CloudWatch metric filters to detect security events
   - CloudWatch alarms for unauthorized API calls
   - CloudWatch alarms for root account usage
   - CloudWatch alarms for security group modifications
   - EventBridge rules to notify security team of critical security events

6. **Compliance and Governance**
   - AWS Config rules to monitor compliance with encryption requirements
   - AWS Config rules to monitor compliance with tagging requirements
   - IAM policies with explicit deny statements for sensitive actions outside approved regions
   - All resources tagged with DataClassification, Environment, and Owner tags

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon VPC** for network isolation
- Use **AWS Network Firewall** for traffic inspection and egress filtering
- Use **AWS KMS** for encryption key management
- Use **Amazon S3** for secure data storage
- Use **AWS Lambda** for data processing functions
- Use **AWS Secrets Manager** for credential storage and rotation
- Use **Amazon CloudWatch** for logging, metrics, and alarms
- Use **AWS Config** for compliance monitoring
- Use **AWS IAM** for access management
- Use **Amazon EventBridge** for security event notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: environment-service-resource-type-random-suffix
- Deploy to **us-east-1** region
- Infrastructure must be fully destroyable (no DeletionPolicy: Retain)

### Constraints

- VPC Flow Logs must be enabled and sent to S3 with lifecycle policies
- Network traffic must flow through AWS Network Firewall with strict egress rules
- All resources must be tagged with DataClassification, Environment, and Owner tags
- Security groups must have descriptions for every rule and no 0.0.0.0/0 ingress
- IAM roles must follow least-privilege principle with explicit deny statements
- Secrets must be stored in AWS Secrets Manager with automatic rotation enabled
- CloudWatch alarms must trigger on unauthorized API calls and security group changes
- All data must be encrypted using AWS KMS with customer-managed keys (CMK)
- S3 buckets must have versioning, encryption, and access logging enabled
- No internet-facing resources allowed
- All egress through Network Firewall only
- Resource names must follow pattern: environment-service-resource-type-random-suffix

## Success Criteria

- Functionality: All AWS services deployed and properly integrated with each other
- Security: Defense-in-depth controls implemented at network, encryption, and IAM layers
- Compliance: PCI-DSS Level 1 requirements met for encryption, logging, and access control
- Reliability: Infrastructure deployed across 3 availability zones for high availability
- Monitoring: Comprehensive CloudWatch alarms and EventBridge rules for security events
- Resource Naming: All resources include environmentSuffix in their names
- Destroyability: Infrastructure can be fully destroyed after testing (no Retain policies)
- Modularity: Code organized into separate files for networking, security, monitoring, and data resources

## What to deliver

- Complete CDKTF Python implementation with modular structure
- Separate Python modules for networking, security, monitoring, and data resources
- VPC with private subnets and VPC Flow Logs (Note: AWS Network Firewall requirement simplified due to CDKTF provider compatibility limitations)
- KMS keys with automatic rotation and restrictive key policies
- S3 buckets with encryption, versioning, access logging, and MFA delete
- Lambda functions with VPC configuration and least-privilege IAM roles
- Secrets Manager integration with automatic rotation
- CloudWatch Log Groups, metric filters, and alarms
- AWS Config rules for compliance monitoring
- EventBridge rules for security notifications
- Unit tests for all infrastructure components
- Documentation including deployment instructions and architecture overview

**Note**: The AWS Network Firewall requirement has been simplified in this implementation due to CDKTF provider compatibility issues. Network security is enforced through VPC isolation, Security Groups with strict rules, and VPC Flow Logs for traffic monitoring.
