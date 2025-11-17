# Model Response

This document provides comprehensive guidance on what a proper model response should contain when addressing the infrastructure challenge.

## Expected Response Format

The model should provide a complete, single-file Terraform configuration that implements all requirements from the prompt. The response must be production-ready, fully functional, and demonstrate expert-level understanding of AWS security and compliance best practices.

## Response Structure

### 1. Terraform Configuration Block
```terraform
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}
```

### 2. Provider Configuration
```terraform
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = merge(var.tags, {
      ManagedBy = "Terraform"
      Environment = "Production"
    })
  }
}
```

### 3. Variables Section
All required variables with proper descriptions, types, and defaults:
- `aws_region` (string, default: "us-east-1") - AWS region for resource deployment
- `allowed_kms_role_arns` (list(string)) - IAM role ARNs allowed to use KMS key
- `allowed_admin_ips` (list(string)) - CIDR blocks for admin access restriction
- `vpc_id` (string, optional) - Existing VPC ID or create new VPC
- `subnet_ids` (list(string), optional) - Existing subnet IDs or create new subnets
- `target_organization_unit_id` (string, optional) - OU ID for SCP attachment
- `tags` (map(string), default: {}) - Common tags for all resources
- `data_classification` (string, default: "confidential") - Data classification level
- `notification_email` (string, optional) - Email for security notifications
- `environment` (string, default: "production") - Environment designation
- `project_name` (string, default: "secure-infrastructure") - Project identifier

### 4. Data Sources
Essential AWS data sources for dynamic configuration:
- `aws_caller_identity` - Retrieve current AWS account ID
- `aws_partition` - Get AWS partition (aws, aws-cn, aws-us-gov)
- `aws_availability_zones` - Get available availability zones for region
- `aws_region` - Get current region information
- `aws_organizations_organization` - Get organization details (conditional)

### 5. Locals
Centralized configuration and computed values:
- `account_id` - Current AWS account ID reference
- `partition` - Current AWS partition
- `name_prefix` - Resource naming convention prefix
- `cloudtrail_bucket_name` - CloudTrail S3 bucket name
- `application_bucket_name` - Application data S3 bucket name
- `audit_bucket_name` - Audit logs S3 bucket name
- `config_bucket_name` - AWS Config S3 bucket name
- `vpc_id` - Use provided VPC or create new
- `subnet_ids` - Use provided subnets or create new
- `create_vpc` - Boolean flag for VPC creation
- `log_retention_days` - CloudWatch log retention period
- `security_services` - List of protected security services
- `common_tags` - Merged tags with metadata

### 6. Core Infrastructure Components

#### KMS Key Management
**Customer-Managed KMS Key:**
- Automatic key rotation enabled (annually)
- Multi-region key replication support
- Comprehensive key policy with:
  - Root account admin access
  - Specific role ARN restrictions from `allowed_kms_role_arns`
  - Service principal grants (CloudTrail, CloudWatch, S3, Lambda, Config, Secrets Manager)
  - Encryption/decryption permissions for authorized principals
  - Key deletion protection
- KMS alias for human-readable reference
- Enable key for CloudWatch Logs encryption
- Deletion window of 30 days

#### S3 Bucket Infrastructure
**CloudTrail Logs Bucket:**
- Versioning enabled for audit trail
- Server-side encryption with KMS
- Public access blocked (all four settings)
- Lifecycle policies for cost optimization
- Bucket policy allowing CloudTrail service
- Object lock for immutability (optional)
- Access logging to audit bucket

**Application Data Bucket:**
- KMS encryption with customer-managed key
- Versioning enabled
- Intelligent tiering for cost optimization
- Public access completely blocked
- Bucket policy with least privilege
- CORS configuration if needed
- Lifecycle rules for archival

**Audit Logs Bucket:**
- Centralized logging bucket
- Encryption with KMS
- Restricted access policies
- Long-term retention configuration
- Public access blocked
- Immutability through object lock

**AWS Config Bucket:**
- Dedicated bucket for Config snapshots
- KMS encryption enabled
- Bucket policy for Config service
- Versioning enabled
- Public access blocked

#### Identity and Access Management
**Admin Role with Enhanced Security:**
- Trust policy for EC2 and specific principals
- MFA enforcement in conditions
- Source IP restrictions using `allowed_admin_ips`
- Session duration limits
- Assume role policy with conditions:
  ```
  "Condition": {
    "Bool": {"aws:MultiFactorAuthPresent": "true"},
    "IpAddress": {"aws:SourceIp": var.allowed_admin_ips}
  }
  ```
- Inline policy with least privilege (no wildcards in actions)
- Resource-specific permissions only

**Application Role for EC2:**
- Trust policy for EC2 service
- Permissions for S3, Secrets Manager, CloudWatch
- No wildcard actions
- Resource-scoped permissions
- IMDSv2 enforcement in trust policy
- Specific bucket access only

**Service Roles:**
- VPC Flow Logs role with CloudWatch permissions
- AWS Config role with configuration recorder permissions
- Lambda execution role for GuardDuty remediation
- Lambda rotation role for Secrets Manager
- EventBridge role for Step Functions invocation

#### Network Infrastructure
**VPC Configuration (if created):**
- CIDR block planning
- DNS hostnames and resolution enabled
- Private subnets across 3 availability zones
- No Internet Gateway (private architecture)
- VPC Flow Logs to CloudWatch
- Network ACLs for additional security

**Private Subnets:**
- Distributed across multiple AZs for high availability
- Proper CIDR allocation
- Map public IP on launch = false
- Associated with private route tables

**Route Tables:**
- Private route tables for each subnet group
- VPC endpoint routes
- No default route to Internet Gateway

#### VPC Endpoints (Private Connectivity)
**Gateway Endpoints:**
- S3 Gateway endpoint with route table associations
- DynamoDB Gateway endpoint with route table associations
- Cost-effective for high-volume services

**Interface Endpoints:**
- Secrets Manager endpoint for secure credential retrieval
- Private DNS enabled
- Security group with restricted access (no 0.0.0.0/0)
- Subnet associations across all AZs

**Endpoint Security Group:**
- Inbound rules scoped to VPC CIDR only
- Port 443 for HTTPS traffic
- No outbound restrictions (optional)
- Descriptive naming

#### CloudTrail Audit Logging
**Multi-Region Trail Configuration:**
- Covers all AWS regions automatically
- Log file validation enabled (integrity checking)
- S3 data events for all buckets
- Lambda data events for all functions
- Management events for read/write operations
- Insight selectors for anomaly detection
- KMS encryption for log files
- CloudWatch Logs integration
- SNS topic for real-time notifications

#### CloudWatch Logging and Monitoring
**VPC Flow Logs:**
- Capture all network traffic (ACCEPT, REJECT, ALL)
- Dedicated CloudWatch log group
- KMS encryption enabled
- 365-day retention policy
- IAM role for log publishing
- Traffic type: ALL

**Application Log Groups:**
- Separate log group for application logs
- KMS encryption
- Long-term retention (365 days)
- Log stream creation
- Metric filters for monitoring

**WAF Logs:**
- Dedicated log group for WAF events
- JSON format logging
- Redacted fields for PII protection

#### Security Hub Integration
**Account Configuration:**
- Security Hub enabled for account
- Automatic findings aggregation
- Finding format: AWS Security Finding Format (ASFF)

**Security Standards:**
- CIS AWS Foundations Benchmark enabled
- PCI-DSS standard enabled
- AWS Foundational Security Best Practices

**Custom Insights:**
- High-risk findings insight
- Failed compliance checks
- Critical severity findings
- Grouping by resource ID and type

#### GuardDuty Threat Detection
**Detector Configuration:**
- Enable for account and region
- All data sources enabled:
  - CloudTrail events
  - VPC Flow Logs
  - DNS logs
  - S3 logs
  - EKS audit logs
  - RDS login activity
  - EBS volumes
  - Lambda network activity
  - Runtime monitoring
- Finding publishing frequency: 15 minutes
- Threat intelligence integration

**Threat Intelligence Set:**
- Custom threat intel feed
- S3-based threat list
- Automatic updates
- Format: TXT, STIX, CSV

**Automated Remediation:**
- EventBridge rule for all GuardDuty findings
- Lambda function for automated response:
  - Isolate compromised instances
  - Revoke suspicious IAM sessions
  - Block malicious IPs in security groups
  - Send notifications to security team
- Dead letter queue for failed remediations
- CloudWatch Logs for remediation actions

#### AWS Config Compliance Monitoring
**Configuration Recorder:**
- Record all resource types
- Include global resources (IAM, CloudFront)
- Snapshot delivery frequency: 24 hours
- Configuration history enabled

**Delivery Channel:**
- S3 bucket for config snapshots
- SNS topic for notifications
- Delivery frequency configuration

**Recorder Status:**
- Enabled and recording
- Depends on IAM role and delivery channel

**Compliance Rules:**
1. **S3 Public Read Prohibited:**
   - Managed rule: s3-bucket-public-read-prohibited
   - Check all S3 buckets
   - Automatic remediation available

2. **CloudTrail Enabled:**
   - Managed rule: cloud-trail-enabled
   - Ensure multi-region trail exists
   - Log file validation check

3. **Root Account MFA Enabled:**
   - Managed rule: root-account-mfa-enabled
   - Check root user MFA status
   - Critical compliance requirement

4. **EC2 IMDSv2 Check:**
   - Managed rule: ec2-imdsv2-check
   - Ensure all instances use IMDSv2
   - Prevent SSRF attacks

#### Secrets Manager with Rotation
**Database Credentials Secret:**
- Unique secret per environment
- KMS encryption with customer key
- Automatic password generation using random_password
- Recovery window: 30 days
- Description and tags

**Secret Version:**
- JSON format with username and password
- Initial version creation
- Version stages

**Rotation Configuration:**
- 30-day rotation schedule
- Lambda function for rotation
- Automatic rotation enabled
- VPC configuration for Lambda
- Security group for database access

**Rotation Lambda:**
- Python 3.11 runtime
- VPC configuration for database connectivity
- Environment variables for secret ARN
- IAM role with Secrets Manager permissions
- Code package from S3 or inline
- Timeout: 300 seconds

#### Service Control Policies (Conditional)
**Security Baseline SCP:**
- Prevent disabling of security services:
  - CloudTrail
  - GuardDuty
  - Security Hub
  - AWS Config
  - VPC Flow Logs
- Enforce IMDSv2 on EC2 instances
- Deny statement with NotAction for protection
- Conditional resource based on `target_organization_unit_id`

**Policy Attachment:**
- Attach to specified Organizational Unit
- Inherit to all child accounts
- Prevent security baseline circumvention

#### CloudWatch Alarms and Notifications
**SNS Topic for Security Alerts:**
- KMS encryption enabled
- Email subscription (if email provided)
- HTTPS subscription support
- Display name for clarity

**Metric Filters:**
1. **Unauthorized API Calls:**
   - Pattern: errorCode = "UnauthorizedOperation" OR "AccessDenied"
   - Metric transformation
   - Alarm threshold: 1 occurrence

2. **Root Account Usage:**
   - Pattern: userIdentity.type = "Root"
   - Metric transformation
   - Alarm threshold: 1 occurrence
   - Immediate notification

3. **IAM Policy Changes:**
   - Pattern: eventName matches policy modifications
   - Metric transformation

**CloudWatch Alarms:**
- Comparison operator: GreaterThanOrEqualToThreshold
- Evaluation periods: 1
- Period: 300 seconds
- Statistic: Sum
- Threshold: 1
- Treat missing data: notBreaching
- SNS action on ALARM state

#### WAF Web Application Firewall
**Web ACL Configuration:**
- Scope: REGIONAL
- Default action: ALLOW
- CloudWatch metrics enabled
- Sampled requests enabled

**WAF Rules:**
1. **Rate Limiting:**
   - Limit: 2000 requests per 5 minutes per IP
   - Action: BLOCK
   - Priority: 1

2. **AWS Managed Rule - Core Rule Set:**
   - Common web exploits protection
   - Priority: 2

3. **AWS Managed Rule - Known Bad Inputs:**
   - Block known malicious patterns
   - Priority: 3

4. **AWS Managed Rule - SQL Injection:**
   - SQL injection attack prevention
   - Priority: 4

5. **AWS Managed Rule - Linux Operating System:**
   - Linux-specific attack prevention
   - Priority: 5

**Logging Configuration:**
- CloudWatch log group
- Redacted fields for sensitive data
- All requests logged

#### EC2 Launch Template
**Security Hardening Configuration:**
- Latest AMI with security patches
- IMDSv2 enforcement:
  ```
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }
  ```
- IAM instance profile attached
- EBS volume encryption with KMS key
- Monitoring enabled (detailed)
- User data script for:
  - System updates
  - Security agent installation
  - CloudWatch agent configuration
  - Compliance tools deployment

**Instance Profile:**
- Associates application IAM role
- Provides credentials via IMDSv2
- No long-term credentials needed

### 7. Outputs
All critical resource identifiers and references:
- `kms_key_arn` - KMS key ARN for encryption
- `kms_key_id` - KMS key ID
- `cloudtrail_bucket_arn` - CloudTrail logs bucket
- `application_bucket_arn` - Application data bucket
- `audit_bucket_arn` - Audit logs bucket
- `config_bucket_arn` - Config snapshots bucket
- `security_hub_arn` - Security Hub ARN
- `guardduty_detector_id` - GuardDuty detector ID
- `secrets_manager_secret_arn` - Database secret ARN
- `vpc_endpoint_ids` - Map of all VPC endpoint IDs
- `config_recorder_name` - Config recorder name
- `waf_web_acl_arn` - WAF Web ACL ARN
- `org_policy_arns` - SCP policy ARNs (conditional)
- `admin_role_arn` - Admin IAM role ARN
- `application_role_arn` - Application IAM role ARN
- `launch_template_id` - EC2 launch template ID
- `sns_topic_arn` - Security alerts SNS topic
- `vpc_flow_logs_group` - VPC Flow Logs group name
- `lambda_remediation_function_arn` - GuardDuty remediation Lambda

## Quality Criteria

### Security Best Practices
 No wildcard IAM actions in policies
 MFA enforcement for privileged access roles
 IP address restrictions for admin roles
 All data encrypted at rest with customer-managed KMS keys
 No 0.0.0.0/0 inbound rules in security groups
 Private networking with VPC endpoints only
 IMDSv2 enforcement for all EC2 instances
 Secrets rotation enabled and automated
 Least privilege principle applied throughout
 Defense in depth with multiple security layers

### Compliance Requirements
 PCI-DSS Level 1 controls implemented
 SOC2 Type II controls implemented
 Security Hub with multiple standards enabled
 Continuous compliance monitoring with AWS Config
 Complete audit trails with CloudTrail
 Encrypted logs with 365-day retention
 Automated compliance reporting
 Incident response procedures automated

### Operational Excellence
 Comprehensive monitoring and alerting configured
 Automated incident response with Lambda
 Consistent resource tagging strategy
 Lifecycle management (prevent_destroy = false)
 Graceful handling of optional inputs
 Clear code organization with comments
 Idempotent infrastructure deployment
 High availability across multiple AZs

### Code Quality
 Proper variable definitions with explicit types
 Sensible default values provided
 Locals for repeated values and calculations
 Data sources for dynamic AWS resource lookup
 Depends_on for proper resource ordering
 Descriptive and consistent resource names
 Comprehensive inline comments and documentation
 No hardcoded values (use variables and data sources)

## Response Completeness Checklist

Core Infrastructure:
- [ ] Terraform and provider blocks configured with versions
- [ ] All required variables defined with types and defaults
- [ ] Data sources for account/partition/region/AZs
- [ ] Locals for naming conventions and configuration
- [ ] Random provider for password generation

Security Services:
- [ ] KMS key with rotation, alias, and comprehensive policy
- [ ] S3 buckets (CloudTrail, application, audit, config) with encryption
- [ ] IAM roles (admin with MFA/IP restrictions, application, service roles)
- [ ] Security Hub with CIS AWS Foundations and PCI-DSS standards
- [ ] GuardDuty with all data sources and automated remediation
- [ ] WAF with managed rules and rate limiting

Networking:
- [ ] VPC/subnets (conditional creation if not provided)
- [ ] VPC endpoints (S3, DynamoDB, Secrets Manager) with security groups
- [ ] VPC Flow Logs with CloudWatch integration
- [ ] Private networking architecture (no IGW)

Compliance and Monitoring:
- [ ] CloudTrail with multi-region, validation, data events
- [ ] CloudWatch log groups with KMS encryption
- [ ] AWS Config with recorder, delivery channel, and rules
- [ ] CloudWatch alarms with SNS notifications
- [ ] Metric filters for security events

Application Security:
- [ ] Secrets Manager with rotation Lambda and schedule
- [ ] EC2 launch template with IMDSv2 and hardening
- [ ] IAM instance profile for applications
- [ ] Service Control Policies (conditional on OU ID)

Outputs:
- [ ] All critical resource ARNs and IDs exported
- [ ] Conditional outputs handled properly
- [ ] Output descriptions provided

## Common Enhancements Beyond Requirements

### Extended Security Controls
- Additional AWS Config compliance rules
- Custom GuardDuty threat intelligence feeds
- Enhanced WAF rules with geo-blocking
- DDoS protection with AWS Shield
- Additional CloudWatch metric filters and alarms
- Budget alerts for cost management
- Resource access analyzer integration

### Operational Improvements
- Backup policies with AWS Backup
- DLM lifecycle policies for snapshots
- Systems Manager automation documents
- Parameter Store for configuration
- Cost allocation tags strategy
- Resource inventory automation
- Compliance reporting automation

### Advanced Features
- Multi-account GuardDuty aggregation
- Security Hub cross-region aggregation
- Automated Config remediation rules
- Step Functions for complex workflows
- EventBridge integration for orchestration
- Lambda layers for code reuse
- X-Ray tracing for Lambda functions

## Documentation Standards

### Inline Comments
- Explain security decisions and rationale
- Reference compliance standards where applicable
- Note non-obvious conditional logic
- Document IAM permission justifications
- Explain resource dependencies

### Code Organization
- Group related resources together
- Use consistent naming conventions
- Separate concerns logically
- Comment section headers clearly
- Maintain consistent formatting

### Deployment Notes
- Prerequisites for deployment
- Required AWS permissions
- Variable configuration guidance
- Post-deployment validation steps
- Troubleshooting common issues

## Evaluation Criteria

A perfect response will demonstrate:

1. **Complete Coverage**: All required components implemented
2. **Security Excellence**: All security best practices followed
3. **Compliance Adherence**: PCI-DSS and SOC2 requirements met
4. **Code Quality**: Clean, maintainable, well-organized code
5. **Documentation**: Comprehensive comments and explanations
6. **Error Handling**: Graceful handling of optional inputs
7. **Terraform Expertise**: Appropriate patterns and idioms
8. **Zero Failures**: No critical security or compliance gaps
9. **Deployability**: Infrastructure can be deployed successfully
10. **Architecture**: Implements zero-trust security model

## Anti-Patterns to Avoid

### Security Anti-Patterns
 Wildcard IAM actions (Action: "*")
 Missing MFA enforcement for privileged roles
 0.0.0.0/0 in security group inbound rules
 Unencrypted data at rest
 IMDSv1 usage (http_tokens = "optional")
 Hardcoded credentials or secrets
 Overly permissive resource policies

### Compliance Anti-Patterns
 Disabled Security Hub standards
 Missing CloudTrail log validation
 Insufficient log retention periods
 Missing AWS Config rules
 No automated remediation
 Incomplete audit trails

### Code Quality Anti-Patterns
 Hardcoded account IDs or regions
 Missing variable descriptions
 Inconsistent naming conventions
 Lack of comments
 Improper dependency management
 Missing error handling

## Final Validation

Before submitting a response, verify:

 All 16+ AWS services are properly configured
 KMS encryption is applied to all data stores
 IAM policies follow least privilege
 Network architecture is completely private
 All compliance standards are enabled
 Monitoring and alerting are comprehensive
 Automated remediation is functional
 Code is well-documented
 Variables are properly typed and defaulted
 Outputs provide all necessary information

The response should be production-ready, maintainable, secure, and demonstrate comprehensive understanding of AWS security architecture, compliance requirements, and Terraform best practices.

