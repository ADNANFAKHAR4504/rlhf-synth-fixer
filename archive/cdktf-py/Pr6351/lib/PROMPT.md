# Secure Data Processing Infrastructure for PCI-DSS Compliance

Hey team,

We need to build a secure data processing infrastructure for our financial services client. They're working towards PCI-DSS Level 1 compliance and need a defense-in-depth security approach with comprehensive audit logging. The business has made it clear that this needs to be built using **CDKTF with Python** to fit into their existing Terraform workflow while leveraging the CDK abstraction layer.

The client operates in the financial services space and handles sensitive payment card data, so security is paramount. They need complete network isolation with no internet-facing resources, encrypted data everywhere, automatic credential rotation, and real-time security monitoring. The infrastructure will process financial transactions and must meet strict compliance requirements.

This is a greenfield deployment in the ap-southeast-1 region across three availability zones. Everything needs to be locked down - private subnets only, all egress traffic inspected by AWS Network Firewall, KMS encryption for data at rest, and comprehensive CloudWatch monitoring for security events.

## What we need to build

Create a secure data processing platform using **CDKTF with Python** that implements defense-in-depth security controls for PCI-DSS Level 1 compliance.

### Core Requirements

1. **Network Infrastructure**
   - VPC with private subnets across 3 availability zones
   - No public subnets or internet gateways
   - VPC Flow Logs enabled with S3 storage and 90-day retention
   - All resources deployed in ap-southeast-1 region

2. **Network Security**
   - AWS Network Firewall with stateful rule groups
   - Block all traffic except HTTPS to specific AWS service endpoints
   - All egress traffic must flow through the firewall
   - Security groups with no 0.0.0.0/0 ingress rules

3. **Encryption and Key Management**
   - KMS customer-managed keys for all encryption
   - Key policies restricting usage to specific IAM roles
   - Automatic key rotation enabled
   - Separate keys for different data classifications

4. **Data Storage**
   - S3 buckets with versioning and encryption enabled
   - Bucket policies denying unencrypted uploads
   - MFA required for object deletions
   - Access logging enabled for all buckets

5. **Compute and Processing**
   - Lambda functions with VPC configuration
   - Functions deployed in private subnets
   - IAM roles with least-privilege access to specific S3 buckets and KMS keys
   - No internet access for functions

6. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Automatic rotation using Lambda functions
   - Encryption using KMS customer-managed keys
   - Secrets fetched from existing entries, not created by stack

7. **Monitoring and Logging**
   - CloudWatch Log Groups with KMS encryption
   - Metric filters for security events
   - CloudWatch alarms for unauthorized API calls
   - Alarms for root account usage
   - Alarms for security group modifications

8. **Compliance Monitoring**
   - AWS Config rules for encryption compliance
   - Config rules for tagging requirements
   - EventBridge rules for critical security events
   - Notifications to security team on violations

9. **Access Control**
   - IAM policies with explicit deny statements
   - Region restrictions for sensitive actions
   - Least-privilege principle throughout
   - No inline policies

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider version 5.x with Terraform 1.5+
- Modular structure with separate files for networking, security, monitoring, and data resources
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{environment}-{service}-{resource-type}-{environmentSuffix}`
- Deploy to **ap-southeast-1** region across 3 availability zones
- Output critical resource ARNs and IDs for integration with other systems

### Constraints

- No internet-facing resources allowed
- All egress through AWS Network Firewall only
- No 0.0.0.0/0 ingress in security groups
- All resources must be tagged with DataClassification, Environment, Owner
- All data encrypted at rest using KMS customer-managed keys
- All data encrypted in transit using TLS 1.2 or higher
- Infrastructure must be fully destroyable for CI/CD workflows
- Secrets fetched from existing AWS Secrets Manager entries
- Include proper error handling and CloudWatch logging
- All resources must support resource tagging

## Success Criteria

- **Network Isolation**: Complete isolation with private subnets only, all traffic through Network Firewall
- **Encryption**: All data encrypted at rest with KMS and in transit with TLS 1.2+
- **Access Control**: Least-privilege IAM with explicit deny statements for non-approved regions
- **Monitoring**: Real-time alarms for security events, comprehensive audit logging
- **Compliance**: AWS Config rules monitoring encryption and tagging compliance
- **Automation**: Automatic rotation for Secrets Manager credentials
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: Complete stack can be destroyed and recreated in CI/CD pipelines
- **Code Quality**: Well-structured Python using CDKTF constructs, properly documented

## What to deliver

- Complete CDKTF Python implementation with modular structure
- Separate modules for networking (VPC, subnets, Network Firewall)
- Security module for KMS keys, IAM policies, security groups
- Data module for S3 buckets with encryption and policies
- Compute module for Lambda functions with VPC configuration
- Monitoring module for CloudWatch Logs, alarms, and metric filters
- Compliance module for AWS Config rules and EventBridge
- Variable definitions for environment-specific values
- Outputs file with critical resource ARNs and IDs
- Integration with cfn-outputs/flat-outputs.json for testing

## AWS Services Required

VPC, AWS Network Firewall, KMS, S3, Lambda, Secrets Manager, VPC Flow Logs, CloudWatch Logs, CloudWatch Alarms, AWS Config, IAM, EventBridge
