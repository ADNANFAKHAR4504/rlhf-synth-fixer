# Common Model Failures for Secure AWS Infrastructure CloudFormation Templates

## S3 Security Failures

### 1. Missing Public Access Block Configuration
- **Failure**: Model doesn't configure `PublicAccessBlockConfiguration` for S3 buckets
- **Example**: S3 bucket without `BlockPublicAcls: true`, `BlockPublicPolicy: true`, etc.
- **Impact**: Buckets remain publicly accessible, violating security requirements
- **Fix**: Add `PublicAccessBlockConfiguration` with all blocks set to `true`

### 2. Missing Server-Side Encryption
- **Failure**: Model doesn't enable encryption for S3 buckets
- **Example**: No `BucketEncryption` configuration or using `AES256` instead of KMS
- **Impact**: Data stored unencrypted, violating security compliance
- **Fix**: Configure `BucketEncryption` with KMS key for enhanced security

### 3. Incorrect S3 Bucket Naming Convention
- **Failure**: Model doesn't follow `project-<name>` naming pattern
- **Example**: Bucket named `my-bucket` instead of `project-myproject-secure-bucket`
- **Impact**: Violates organizational naming standards
- **Fix**: Use `!Sub 'project-${ProjectName}-secure-bucket-${AWS::AccountId}'` pattern

### 4. Missing S3 Bucket Policy for CloudTrail
- **Failure**: Model doesn't create proper S3 bucket policy for CloudTrail access
- **Example**: CloudTrail fails with "Incorrect S3 bucket policy is detected"
- **Impact**: CloudTrail cannot write logs to S3 bucket
- **Fix**: Add bucket policy with `cloudtrail.amazonaws.com` service principal and proper permissions

## CloudWatch Monitoring Failures

### 5. Missing VPC Flow Logs Configuration
- **Failure**: Model doesn't enable VPC Flow Logs for network monitoring
- **Example**: No `AWS::EC2::FlowLog` resource or missing IAM role
- **Impact**: No visibility into network traffic for security monitoring
- **Fix**: Create VPC Flow Logs with proper IAM role and CloudWatch log group

### 6. Incorrect Metric Filter Pattern
- **Failure**: Model uses wrong filter pattern for unauthorized access detection
- **Example**: Filter pattern doesn't match VPC Flow Log format or SSH port 22
- **Impact**: CloudWatch alarm doesn't trigger for actual security events
- **Fix**: Use correct pattern: `[..., destport="22", ..., action="REJECT", ...]`

### 7. Missing CloudWatch Alarm Actions
- **Failure**: Model creates CloudWatch alarm without SNS notification
- **Example**: Alarm exists but no `AlarmActions` configured
- **Impact**: Security events not communicated to admin team
- **Fix**: Add `AlarmActions: [!Ref SecurityAlertsTopic]` to alarm configuration

## IAM Security Failures

### 8. Overly Permissive IAM Policies
- **Failure**: Model creates IAM policies with `"*"` permissions
- **Example**: `"Resource": "*"` instead of specific resource ARNs
- **Impact**: Violates principle of least privilege, security vulnerability
- **Fix**: Scope permissions to specific resources and actions needed

### 9. Missing IAM Role for EC2 Instances
- **Failure**: Model doesn't create IAM roles for EC2 instances
- **Example**: EC2 instances without `IamInstanceProfile` or using hardcoded credentials
- **Impact**: Security risk from embedded credentials or excessive permissions
- **Fix**: Create IAM role with minimal permissions and attach via instance profile

### 10. Incorrect IAM Trust Policy
- **Failure**: Model uses wrong service principal in assume role policy
- **Example**: `Service: ec2.amazonaws.com` instead of `Service: ec2.amazonaws.com`
- **Impact**: IAM role cannot be assumed by intended service
- **Fix**: Use correct service principal for each AWS service

## CloudTrail Failures

### 11. Missing CloudTrail Dependencies
- **Failure**: Model doesn't add `DependsOn` for CloudTrail on S3 bucket policy
- **Example**: CloudTrail tries to create before S3 bucket policy is applied
- **Impact**: CloudTrail creation fails with bucket policy errors
- **Fix**: Add `DependsOn: SecureS3BucketPolicy` to CloudTrail resource

### 12. Incorrect CloudTrail Configuration
- **Failure**: Model doesn't enable required CloudTrail features
- **Example**: Missing `IsMultiRegionTrail: true` or `EnableLogFileValidation: true`
- **Impact**: Incomplete API logging and security monitoring
- **Fix**: Enable all required CloudTrail features for comprehensive logging

## Network Security Failures

### 13. Insecure Security Group Configuration
- **Failure**: Model allows broad access in security groups
- **Example**: `CidrIp: 0.0.0.0/0` for SSH access instead of VPC CIDR
- **Impact**: Exposes services to entire internet
- **Fix**: Restrict access to specific CIDR blocks or security groups

### 14. Missing VPC DNS Configuration
- **Failure**: Model doesn't enable DNS hostnames and support
- **Example**: Missing `EnableDnsHostnames: true` and `EnableDnsSupport: true`
- **Impact**: DNS resolution issues within VPC
- **Fix**: Enable both DNS settings for proper VPC functionality

## SNS Notification Failures

### 15. Missing SNS Topic Encryption
- **Failure**: Model doesn't configure KMS encryption for SNS topics
- **Example**: SNS topic without `KmsMasterKeyId` configuration
- **Impact**: Sensitive notifications not encrypted
- **Fix**: Add `KmsMasterKeyId: alias/aws/sns` to SNS topic

### 16. Incorrect SNS Subscription Configuration
- **Failure**: Model doesn't properly configure SNS subscription
- **Example**: Missing `Endpoint` or incorrect `Protocol` for email notifications
- **Impact**: Admin team doesn't receive security alerts
- **Fix**: Configure proper email subscription with admin email endpoint

## Template Structure Failures

### 17. Missing Required Capabilities
- **Failure**: Model doesn't specify `CAPABILITY_IAM` for IAM resources
- **Example**: Template with IAM roles but no capabilities declaration
- **Impact**: CloudFormation deployment fails with capability errors
- **Fix**: Add `# Required Capabilities: CAPABILITY_IAM` comment or specify in deployment

### 18. Invalid Parameter Validation
- **Failure**: Model doesn't validate parameter inputs properly
- **Example**: No `AllowedPattern` for email or project name parameters
- **Impact**: Invalid inputs accepted, causing deployment issues
- **Fix**: Add proper regex patterns and constraint descriptions

### 19. Missing Resource Dependencies
- **Failure**: Model doesn't handle resource dependencies correctly
- **Example**: Resources reference other resources before they're created
- **Impact**: CloudFormation deployment fails with dependency errors
- **Fix**: Use `DependsOn` or implicit dependencies through `Ref`/`GetAtt`

### 20. Incorrect Output Configuration
- **Failure**: Model doesn't export outputs properly for cross-stack references
- **Example**: Missing `Export` configuration or incorrect export names
- **Impact**: Other stacks cannot reference created resources
- **Fix**: Add proper export configuration with consistent naming

## KMS Encryption Failures

### 21. Missing KMS Key Policy
- **Failure**: Model doesn't configure proper KMS key policy
- **Example**: KMS key without proper service principal permissions
- **Impact**: Services cannot use KMS key for encryption/decryption
- **Fix**: Add proper key policy with service principal permissions

### 22. Incorrect KMS Key Usage
- **Failure**: Model doesn't reference KMS key correctly in resources
- **Example**: Using `!Ref S3EncryptionKey` instead of `!GetAtt S3EncryptionKey.Arn`
- **Impact**: Resources cannot access KMS key for encryption
- **Fix**: Use correct KMS key reference based on context (ID vs ARN)

## Logging and Monitoring Failures

### 23. Missing Log Retention Configuration
- **Failure**: Model doesn't set log retention periods
- **Example**: CloudWatch log groups without `RetentionInDays`
- **Impact**: Logs accumulate indefinitely, increasing costs
- **Fix**: Set appropriate retention periods for different log types

### 24. Incorrect Log Group Naming
- **Failure**: Model doesn't follow AWS log group naming conventions
- **Example**: Log group name without `/aws/` prefix
- **Impact**: Difficult to organize and manage logs
- **Fix**: Use standard naming like `/aws/vpc/project-${ProjectName}/flowlogs`

## Resource Tagging Failures

### 25. Missing Resource Tags
- **Failure**: Model doesn't add consistent tagging strategy
- **Example**: Resources without `Name` and `Project` tags
- **Impact**: Difficult to manage costs and resources
- **Fix**: Add consistent tags to all resources for cost tracking and management

### 26. Incorrect Tag Values
- **Failure**: Model uses hardcoded tag values instead of parameters
- **Example**: `Value: 'myproject'` instead of `Value: !Ref ProjectName`
- **Impact**: Tags don't reflect actual project configuration
- **Fix**: Use parameter references for dynamic tag values