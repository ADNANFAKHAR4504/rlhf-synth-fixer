# CloudFormation S3 Security Template Generation Prompt

## Context and Role
You are an expert AWS DevSecOps engineer specializing in secure infrastructure as code. Your task is to create a comprehensive CloudFormation template that implements enterprise-grade security controls for S3 bucket management.

## Specific Task
Generate a complete CloudFormation template in JSON format that creates a secure S3 infrastructure with automated compliance monitoring and remediation capabilities.

## Technical Requirements

### Core S3 Security Requirements
1. **Encryption**: All S3 buckets must use AWS KMS encryption with customer-managed keys
2. **Versioning**: Enable versioning on all S3 buckets
3. **Access Logging**: Configure access logging to a dedicated logging bucket
4. **Public Access**: Block all public access through bucket policies and ACLs
5. **MFA Protection**: Require MFA for object version deletion operations

### Monitoring and Compliance
6. **CloudTrail**: Configure comprehensive logging for all S3 bucket operations
7. **SNS Notifications**: Set up alerts for critical security events
8. **Lambda Automation**: Implement automatic remediation for policy violations
9. **Cross-Account Backup**: Configure regular backups to a separate AWS account

### Security and Access Control
10. **IAM Roles**: Implement least privilege access with specific roles for different operations
11. **Resource Naming**: Use 'corp-{environment}' prefix for all bucket names
12. **Regional Deployment**: Deploy all resources in us-east-1 region

## Output Format Requirements
- **File Format**: Valid JSON CloudFormation template
- **Structure**: Include Parameters, Resources, and Outputs sections
- **Documentation**: Add comprehensive Description fields for all resources
- **Validation**: Ensure template passes CloudFormation validation

## Template Structure Guidelines

### Parameters Section
Include parameters for:
- Environment name (dev/staging/prod)
- KMS key ARN (optional, with default)
- Cross-account backup destination
- SNS notification email
- Lambda function deployment package location

### Resources Section
Create resources in logical order:
1. KMS keys and aliases
2. IAM roles and policies
3. S3 buckets (main and logging)
4. CloudTrail configuration
5. SNS topic and subscriptions
6. Lambda functions for remediation
7. CloudWatch alarms and metrics

### Outputs Section
Export critical resource identifiers:
- Bucket ARNs and names
- IAM role ARNs
- KMS key IDs
- CloudTrail ARN
- SNS topic ARN

## Specific Implementation Details

### KMS Configuration
- Create customer-managed KMS key with rotation enabled
- Include key policy allowing CloudTrail and S3 service access
- Create alias for easy reference

### IAM Roles Specification
Create separate roles for:
- S3 read-only access
- S3 write access with conditions
- Lambda execution role
- CloudTrail service role
- Cross-account replication role

### Lambda Function Requirements
The remediation Lambda should:
- Trigger on CloudWatch Events for S3 configuration changes
- Check bucket compliance against security policies
- Automatically fix common misconfigurations
- Send detailed notifications via SNS

### CloudTrail Configuration
- Enable for all S3 bucket operations
- Include data events and management events
- Store logs in encrypted S3 bucket
- Configure log file validation

## Example Environment Variables
```
Environment: "prod"
BackupAccountId: "123456789012"
NotificationEmail: "security-team@company.com"
```

## Validation Criteria
The template must:
- Pass CloudFormation template validation
- Follow AWS security best practices
- Include proper error handling
- Support multiple environments through parameters
- Be deployable without manual intervention

## Output Instructions
1. Provide the complete JSON template
2. Include brief explanations for complex configurations
3. Highlight any assumptions made
4. Suggest deployment best practices
5. Include basic testing recommendations

Generate a production-ready CloudFormation template that a security team can confidently deploy in an enterprise AWS environment.