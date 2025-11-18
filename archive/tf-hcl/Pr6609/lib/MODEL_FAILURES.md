# Model Failures

This document catalogs common failure patterns and mistakes that models might make when attempting to implement the secure infrastructure challenge.

## 1. Security Violations

### Critical Failures
- Using wildcard (*) actions in IAM policies
- Missing MFA enforcement conditions
- Security groups allowing 0.0.0.0/0 inbound access
- Unencrypted S3 buckets or missing KMS encryption
- Missing public access blocks on S3 buckets
- Using default AWS-managed keys instead of customer-managed KMS keys

### IAM Policy Mistakes
- Not implementing IP address restrictions
- Missing Bool condition for aws:MultiFactorAuthPresent
- Using Action: "*" for privileged roles
- Overly broad Resource specifications
- Missing NumericLessThan condition for MFA age

## 2. Compliance Gaps

### Missing Security Services
- Not enabling Security Hub
- Missing GuardDuty configuration
- No AWS Config setup
- CloudTrail not configured or missing
- VPC Flow Logs not enabled

### Configuration Errors
- Security Hub without CIS Benchmark enabled
- GuardDuty without threat intelligence feeds
- Config without compliance rules
- CloudTrail without log file validation
- Missing GuardDuty-to-Security Hub integration

## 3. Network Security Issues

### VPC Misconfigurations
- Creating public subnets when only private required
- Not spanning 3 availability zones
- Missing VPC endpoints
- Using Internet Gateway for sensitive workloads

### VPC Endpoint Failures
- Missing S3 Gateway endpoint
- Missing DynamoDB Gateway endpoint
- Missing Secrets Manager Interface endpoint
- Incorrect security group configurations
- Not using private DNS for interface endpoints

## 4. Encryption Failures

### KMS Issues
- Not enabling automatic key rotation
- Missing key policy restrictions
- Allowing all principals to use the key
- Not specifying allowed role ARNs
- Missing service principals for CloudTrail/CloudWatch

### Data Encryption Gaps
- S3 buckets without server-side encryption
- CloudWatch Logs not encrypted
- EBS volumes not encrypted
- Missing KMS key for Secrets Manager
- Not enforcing TLS 1.2+

## 5. Monitoring and Logging Deficiencies

### CloudWatch Problems
- Missing log groups
- Insufficient log retention periods
- No metric filters for security events
- Missing alarms for unauthorized API calls
- No root account usage monitoring

### Audit Trail Issues
- CloudTrail not multi-region
- Missing data events for S3/Lambda
- No insight selectors
- Missing SNS notifications
- Incorrect bucket policies for CloudTrail

## 6. Secrets Management Errors

### Secrets Manager Mistakes
- Hardcoded passwords
- Missing automatic rotation configuration
- No rotation Lambda function
- Incorrect rotation schedule (not 30 days)
- Missing KMS encryption

### Rotation Function Issues
- Lambda without VPC configuration
- Missing IAM permissions
- Incorrect secret structure
- No error handling in rotation code

## 7. WAF Configuration Failures

### Missing Protections
- No rate limiting rules
- Missing OWASP managed rule sets
- No SQL injection protection
- Missing known bad inputs rules
- No logging configuration

### Rule Misconfiguration
- Incorrect rule priorities
- Wrong action types (allow vs block)
- Missing CloudWatch metrics
- No sampled requests enabled

## 8. Service Control Policy Issues

### SCP Mistakes
- Not preventing security service disabling
- Missing IMDSv2 enforcement
- Incorrect condition operators
- Wrong resource specifications
- Not handling missing OU ID gracefully

### Attachment Errors
- Trying to attach when no OU provided
- Missing count conditions
- Incorrect target_id references

## 9. Terraform Best Practices Violations

### Code Quality Issues
- Missing variable descriptions
- No default values where appropriate
- Hardcoded values instead of variables
- Inconsistent resource naming
- Missing tags on resources

### Lifecycle Management
- Setting prevent_destroy = true (explicitly forbidden)
- Missing lifecycle blocks on critical resources
- Incorrect depends_on usage
- Circular dependencies

## 10. Resource Configuration Errors

### EC2/Launch Template Issues
- Not enforcing IMDSv2 (http_tokens != required)
- Missing EBS encryption
- No IAM instance profile
- Missing monitoring configuration
- Incorrect metadata options

### EventBridge/Lambda Integration
- Missing Lambda permissions for EventBridge
- Incorrect event patterns
- Lambda without error handling
- Missing environment variables
- No timeout configuration

## 11. Output Definition Failures

### Missing Outputs
- KMS key ARN not exposed
- S3 bucket ARNs not output
- Security Hub ARN missing
- GuardDuty detector ID not available
- VPC endpoint IDs not mapped

### Output Mistakes
- Sensitive values not marked
- Missing descriptions
- Incorrect value references
- Conditional outputs without proper checks

## 12. Variable Definition Issues

### Common Mistakes
- Missing required variables
- Incorrect default values
- No type constraints
- Missing validation rules
- Sensitive variables not marked

### Specific Variable Errors
- aws_region not defaulting to us-east-1
- allowed_kms_role_arns without default empty list
- allowed_admin_ips without sensible defaults
- Missing vpc_id and subnet_ids variables
- target_organization_unit_id without default

## 13. Integration Failures

### Service Integration Issues
- GuardDuty findings not forwarded to Security Hub
- Config not triggering on resource changes
- CloudWatch alarms without SNS topics
- Lambda not invoked by EventBridge
- WAF not logging to CloudWatch

### Cross-Service Dependencies
- Missing depends_on for S3 bucket policy before CloudTrail
- Config delivery channel before recorder status
- Security Hub account before standards subscription
- KMS key before encrypted resources

## Summary of Most Critical Failures

1. **Security Group with 0.0.0.0/0** - Immediate disqualification
2. **Wildcard IAM Actions** - Violates least privilege requirement
3. **Missing MFA Enforcement** - Non-compliant with requirements
4. **No KMS Encryption** - Fails encryption requirements
5. **prevent_destroy = true** - Explicitly forbidden in constraints
6. **Missing Security Services** - Incomplete implementation
7. **No VPC Endpoints** - Allows internet traffic
8. **IMDSv2 Not Enforced** - Violates EC2 security requirements

These failures represent the most common and critical mistakes that would result in a non-compliant or insecure infrastructure implementation.
