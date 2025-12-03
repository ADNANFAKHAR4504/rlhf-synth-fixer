# Automated Compliance Monitoring System

## Objective
Create a Pulumi TypeScript program to deploy an automated compliance monitoring system using AWS Config, Lambda functions, CloudWatch Events, SNS topics, and S3 for storage.

## Requirements

### 1. AWS Config Setup
- Configure AWS Config with custom rules for:
  - EC2 instance types validation
  - S3 bucket encryption enforcement
  - RDS backup retention compliance
- Use Config aggregator for us-east-1 region
- **CRITICAL**: Do NOT create a new Config Recorder (AWS allows only one per region/account). Assume one already exists or skip recorder creation.
- Use ONLY valid AWS managed rule source identifiers (verify against AWS documentation)
- Config-triggered rules should NOT specify `maximumExecutionFrequency`

### 2. Lambda Functions
- **Processing Function**: Process compliance events from Config
- **Aggregation Function**: Aggregate compliance data across resources
- **Remediation Function**: Automated remediation for non-compliant resources
- Runtime: Node.js 18.x
- **CRITICAL**: Package compiled JavaScript files (.js), NOT TypeScript source (.ts)
- Proper handler paths pointing to compiled code
- IAM roles with least-privilege access

### 3. CloudWatch Events
- EventBridge rules triggering Lambda functions every 6 hours
- Proper event patterns for Config compliance changes
- Target Lambda functions with appropriate permissions

### 4. SNS Topics
- Email notifications for compliance violations
- Retry policies for message delivery
- Email subscriptions with proper protocols

### 5. S3 Bucket
- Store compliance reports and logs
- KMS encryption required
- Lifecycle policies: 30-day retention for reports
- Proper bucket policies and access controls

### 6. CloudWatch Integration
- CloudWatch Dashboard for compliance metrics
- CloudWatch Logs for Lambda execution (7-day retention)
- **CRITICAL**: Add proper KMS key policies to allow CloudWatch Logs service to use encryption keys
- Log groups must have encryption enabled

### 7. KMS Key Policies
- CloudWatch Logs service must have decrypt/generateDataKey permissions
- Include service principal: `logs.us-east-1.amazonaws.com`
- Include account root principal for key management

### 8. IAM Configuration
- Least-privilege IAM roles for all Lambda functions
- Specific resource ARNs (no wildcards where possible)
- Config service role with proper permissions
- Lambda execution roles with CloudWatch Logs access

### 9. Comprehensive Tagging
- All resources tagged with:
  - Environment
  - Project
  - ManagedBy
  - Purpose

### 10. Output Configuration
- Export all resource ARNs and IDs
- Output format: JSON
- Include CloudFormation-style outputs for integration tests

## Constraints

- **Lambda Runtime**: Node.js 18.x only
- **S3 Encryption**: KMS encryption mandatory
- **Config Evaluation**: 6-hour frequency for periodic rules
- **SNS**: Retry policies required
- **CloudWatch Logs**: 7-day retention minimum
- **IAM**: Least-privilege with specific ARNs
- **Reports**: JSON format
- **Region**: us-east-1

## Common Pitfalls to Avoid

1. **Config Recorder Limit**: AWS allows only ONE Config Recorder per region. Do not attempt to create a new one.
2. **Invalid Rule Identifiers**: Use only valid AWS managed rule source identifiers (e.g., `ENCRYPTED_VOLUMES`, `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`, `DB_INSTANCE_BACKUP_ENABLED`)
3. **Lambda Packaging**: Ensure TypeScript is compiled to JavaScript before packaging. Handler paths must point to .js files.
4. **KMS Key Policies**: CloudWatch Logs service requires explicit permissions to use KMS keys for encryption.
5. **Config Rule Frequency**: Config-triggered rules do not support `maximumExecutionFrequency` parameter.
6. **IAM Permissions**: Ensure all services have necessary permissions to perform their functions.

## Success Criteria

1. All infrastructure deploys successfully without errors
2. 100% test coverage (unit + integration tests)
3. All Lambda functions properly packaged and executable
4. Config rules evaluate compliance correctly
5. CloudWatch Dashboard displays metrics
6. SNS notifications send successfully
7. S3 bucket stores compliance reports
8. All resources properly tagged
9. Clean resource destruction with pulumi destroy
10. Complete documentation in MODEL_FAILURES.md and IDEAL_RESPONSE.md
