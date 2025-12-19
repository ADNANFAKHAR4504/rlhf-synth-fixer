# MODEL_FAILURES.md

This document outlines common failure patterns that AI models may encounter when implementing the security-focused AWS CDK Python infrastructure described in TASK_DESCRIPTION.md and PROMPT.md.

## 1. Architecture and Design Failures

### 1.1 Creating New Stack Files Instead of Updating Existing Code
**Failure Pattern:**
- Model creates separate new files like `iam_stack.py`, `s3_stack.py`, `rds_stack.py` instead of implementing nested stacks within the existing `tap_stack.py`
- Ignores the explicit instruction: "You MUST update the existing `lib/tap_stack.py` file - Do NOT create new stack files"

**Expected Behavior:**
- All nested stacks should be defined as classes within `tap_stack.py` following the pattern shown in the commented example
- No new stack files should be created

### 1.2 Not Using Nested Stack Pattern
**Failure Pattern:**
- Resources created directly in TapStack instead of using NestedStack classes
- Violates the instruction: "DO not create resources directly in this stack"

**Expected Behavior:**
- Each resource type (IAM, S3, RDS, VPC, Monitoring) should be implemented as a NestedStack class
- Pattern should follow: `class NestedIAMSecurityStack(NestedStack):`

### 1.3 Missing Props Classes for Nested Stacks
**Failure Pattern:**
- Nested stacks don't have corresponding Props classes
- Props not properly typed or structured

**Expected Behavior:**
- Each nested stack should have a corresponding Props class (e.g., `IAMStackProps`, `S3SecurityStackProps`)
- Props should include `environment_suffix` and any other required parameters

## 2. KMS Key Configuration Failures

### 2.1 Missing KMS Key Policies
**Failure Pattern:**
- KMS key created without proper resource policies for CloudWatch Logs and CloudTrail
- Services cannot use the KMS key for encryption due to missing permissions

**Expected Behavior:**
- KMS key should have policies allowing CloudWatch Logs service to use it
- KMS key should have policies allowing CloudTrail to encrypt logs
- Policies should include proper conditions and SIDs

### 2.2 KMS Key Rotation Not Enabled
**Failure Pattern:**
- `enable_key_rotation=False` or parameter not specified

**Expected Behavior:**
- KMS key must have `enable_key_rotation=True`

## 3. IAM Security Implementation Failures

### 3.1 Not Implementing IAM Access Analyzer
**Failure Pattern:**
- Model skips IAM Access Analyzer implementation
- Uses only basic IAM roles without policy analysis

**Expected Behavior:**
- IAM Access Analyzer must be created using `CfnResource` with type `AWS::AccessAnalyzer::Analyzer`
- Analyzer type should be "ACCOUNT"

### 3.2 MFA Policy Incorrectly Implemented
**Failure Pattern:**
- MFA enforcement policy missing required statements
- Policy doesn't properly deny actions when MFA is not present
- Missing statements like `DenyAllExceptListedIfNoMFA`

**Expected Behavior:**
- MFA policy should have 4 key statements: AllowViewAccountInfo, AllowManageOwnVirtualMFADevice, AllowManageOwnUserMFA, DenyAllExceptListedIfNoMFA
- Deny statement must use `not_actions` and `BoolIfExists` condition

### 3.3 IAM Role Not Following Least Privilege
**Failure Pattern:**
- Using overly broad managed policies like `AdministratorAccess`
- Granting unnecessary permissions

**Expected Behavior:**
- Use `AWSLambdaBasicExecutionRole` managed policy
- Inline policy should only grant specific log permissions to `/aws/tap/*` resources

## 4. S3 Bucket Security Failures

### 4.1 S3 Buckets Not Private by Default
**Failure Pattern:**
- Missing `block_public_access=s3.BlockPublicAccess.BLOCK_ALL`
- Public access not explicitly blocked

**Expected Behavior:**
- All S3 buckets must have `block_public_access=s3.BlockPublicAccess.BLOCK_ALL`
- This applies to both main bucket and log bucket

### 4.2 S3 Encryption Not Configured
**Failure Pattern:**
- Missing `encryption=s3.BucketEncryption.KMS` or using default encryption
- Not specifying KMS key for encryption

**Expected Behavior:**
- Main bucket must use `encryption=s3.BucketEncryption.KMS` with the shared KMS key
- Encryption key should be explicitly specified

### 4.3 S3 Access Logging Not Enabled
**Failure Pattern:**
- Main bucket created without `server_access_logs_bucket` parameter
- No log bucket created

**Expected Behavior:**
- Log bucket must be created first
- Main bucket must have `server_access_logs_bucket=log_bucket` configured

### 4.4 Incorrect Dependency Order
**Failure Pattern:**
- Main bucket created before log bucket
- Circular dependencies in logging configuration

**Expected Behavior:**
- Log bucket must be created before main bucket

## 5. RDS Database Security Failures

### 5.1 RDS Not Encrypted at Rest
**Failure Pattern:**
- Missing `storage_encrypted=True` parameter
- Not specifying KMS key for encryption

**Expected Behavior:**
- RDS instance must have `storage_encrypted=True`
- Must specify `storage_encryption_key=kms_key`

### 5.2 Secrets Manager Rotation Not Configured
**Failure Pattern:**
- Database secret created without rotation
- Rotation Lambda not created
- Missing `RotationSchedule` configuration

**Expected Behavior:**
- DatabaseSecret must have `generate_secret_string` with proper configuration
- Must use `attach_to_instance()` to link secret to RDS
- Must configure rotation using `add_rotation_schedule()` with `automatically_after` parameter

### 5.3 Database Credentials in Code
**Failure Pattern:**
- Hardcoded database passwords
- Using `master_username` and `master_user_password` instead of Secrets Manager

**Expected Behavior:**
- Use `credentials=rds.Credentials.from_secret(secret)` to link RDS to Secrets Manager
- Never hardcode credentials

## 6. VPC and Network Security Failures

### 6.1 VPC Flow Logs Not Enabled
**Failure Pattern:**
- VPC created without flow logs
- Missing CloudWatch Logs integration

**Expected Behavior:**
- VPC must have `FlowLog` configured
- Flow logs must send to CloudWatch Logs with KMS encryption
- Log group must have retention policy and removal policy

### 6.2 SSH Security Group Allowing 0.0.0.0/0
**Failure Pattern:**
- SSH security group allows unrestricted access
- Not using `allowed_ssh_ips` from props

**Expected Behavior:**
- SSH security group must iterate through `props.allowed_ssh_ips`
- Each IP should be added as separate ingress rule with `Port.tcp(22)`
- Never use `0.0.0.0/0` for SSH access

### 6.3 Missing S3 VPC Endpoint
**Failure Pattern:**
- No VPC endpoint for S3
- S3 traffic goes through NAT Gateway unnecessarily

**Expected Behavior:**
- Create Gateway VPC Endpoint for S3
- Associate with private subnets' route tables
- Use `ec2.GatewayVpcEndpointAwsService.S3`

### 6.4 DNS Settings Not Enabled
**Failure Pattern:**
- VPC created with `enable_dns_hostnames=False` or `enable_dns_support=False`

**Expected Behavior:**
- Both `enable_dns_hostnames=True` and `enable_dns_support=True` must be set

## 7. CloudTrail Configuration Failures

### 7.1 CloudTrail Not Multi-Region
**Failure Pattern:**
- `is_multi_region_trail=False` or parameter not specified

**Expected Behavior:**
- Must set `is_multi_region_trail=True`

### 7.2 CloudTrail Log File Validation Not Enabled
**Failure Pattern:**
- Missing `enable_log_file_validation=True`

**Expected Behavior:**
- Must set `enable_log_file_validation=True`

### 7.3 CloudTrail Not Using KMS Encryption
**Failure Pattern:**
- CloudTrail logs stored without encryption
- Not specifying KMS key

**Expected Behavior:**
- Must specify `encryption_key=kms_key` when creating CloudTrail

### 7.4 CloudTrail Logging to Wrong Location
**Failure Pattern:**
- Using separate bucket instead of S3 log bucket
- Not reusing existing log infrastructure

**Expected Behavior:**
- CloudTrail should use the S3 log bucket created for access logs

## 8. Monitoring Stack Failures

### 8.1 SNS Topic Not Encrypted
**Failure Pattern:**
- SNS topic created without `master_key` parameter

**Expected Behavior:**
- SNS topic must specify `master_key=kms_key`

### 8.2 Missing CloudWatch Alarms
**Failure Pattern:**
- No CloudWatch alarms for security events

**Expected Behavior:**
- Create CloudWatch log metric filters and alarms
- Alarms should notify the SNS security alert topic

## 9. AWS Config Implementation Issues

### 9.1 Config Recorder Deployment Timeouts
**Failure Pattern:**
- Config Recorder stuck in CREATE_IN_PROGRESS state
- Causes entire stack deployment to hang

**Expected Behavior:**
- AWS Config is optional (it's a constraint, not core requirement)
- Can be removed if causing deployment issues
- IAM Access Analyzer provides alternative policy analysis

### 9.2 Config Recorder Dependencies Not Set
**Failure Pattern:**
- Config rules created before Config Recorder is ready
- Delivery Channel created before Config Recorder

**Expected Behavior:**
- If implementing Config: Delivery Channel must depend on Config Recorder
- Config Rules must depend on both Config Recorder and Delivery Channel
- Use `node.add_dependency()` to establish proper order

## 10. Resource Naming and Tagging Failures

### 10.1 Not Using environment_suffix Consistently
**Failure Pattern:**
- Resources named without environment suffix
- Hardcoding environment names like "dev" or "prod"

**Expected Behavior:**
- All resource names must include `{environment_suffix}` or `environment_suffix` variable

### 10.2 Missing Required Tags
**Failure Pattern:**
- Resources not tagged

**Expected Behavior:**
- Use `Tags.of(self).add()` to tag all resources
- Required tags: Environment, ManagedBy, Project, iac-rlhf-amazon

## 11. Stack Outputs Failures

### 11.1 Missing Critical Outputs
**Failure Pattern:**
- Not exporting resource identifiers as CloudFormation outputs

**Expected Behavior:**
- Each nested stack should export key resource ARNs/IDs
- Minimum outputs: KMSKeyArn, EnvironmentSuffix, StackName

### 11.2 Outputs Without Descriptions
**Failure Pattern:**
- CfnOutput created without `description` parameter

**Expected Behavior:**
- All outputs must have descriptive `description` parameter

## 12. Removal Policy Failures

### 12.1 Same Removal Policy for All Environments
**Failure Pattern:**
- Using RETAIN for dev or DESTROY for prod
- Not differentiating by environment

**Expected Behavior:**
- Dev environment: `RemovalPolicy.DESTROY`
- Prod/other environments: `RemovalPolicy.RETAIN`
- Use conditional: `RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN`

## 13. Testing Failures

### 13.1 No Unit Tests Provided
**Failure Pattern:**
- Prompt explicitly requests unit tests
- Model provides only infrastructure code without tests

**Expected Behavior:**
- Must provide unit tests in addition to infrastructure code
- Tests should validate IAM policies, VPC config, security features

### 13.2 Unit Tests Don't Cover Security Features
**Failure Pattern:**
- Tests only verify stack creation
- Don't validate KMS rotation, S3 encryption, RDS encryption

**Expected Behavior:**
- Tests must validate security configurations
- Check for encryption enabled, rotation enabled, public access blocked

## 14. Import and Dependency Failures

### 14.1 Missing Required Imports
**Failure Pattern:**
- Using resources without importing them
- Missing imports: `aws_cloudtrail`, `aws_config`, `aws_secretsmanager`, `aws_sns`, `aws_logs`

**Expected Behavior:**
- All used AWS service modules must be imported

### 14.2 Using Deprecated CDK Constructs
**Failure Pattern:**
- Using L1 constructs where L2 constructs are available

**Expected Behavior:**
- Prefer L2 constructs (e.g., `s3.Bucket`) over L1 (e.g., `CfnBucket`)
- Only use L1 constructs when L2 not available (e.g., AccessAnalyzer)

## 15. Code Organization Failures

### 15.1 Monolithic Code
**Failure Pattern:**
- All code in one giant class

**Expected Behavior:**
- Each nested stack should be a separate class
- Logical grouping: IAM stack, S3 stack, Network stack, RDS stack, Monitoring stack

### 15.2 Poor Variable Naming
**Failure Pattern:**
- Using unclear variable names like `bucket1`, `bucket2`

**Expected Behavior:**
- Descriptive names: `log_bucket`, `main_bucket`, `execution_role`

## 16. Documentation Failures

### 16.1 Missing Docstrings
**Failure Pattern:**
- Classes and methods without docstrings

**Expected Behavior:**
- All classes should have docstrings explaining purpose

## Summary

The most critical failures to avoid:
1. Not updating existing `tap_stack.py` (creating new files instead)
2. Not using nested stack pattern
3. Missing KMS key policies for CloudWatch and CloudTrail
4. S3 buckets not private/encrypted
5. RDS not encrypted or not using Secrets Manager rotation
6. CloudTrail not multi-region or without log validation
7. No unit tests provided
8. Not using environment_suffix consistently
9. Missing required security features like IAM Access Analyzer, VPC Flow Logs, S3 VPC Endpoint