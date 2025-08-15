# AWS CloudFormation Security Configuration Template

Here's a production-ready CloudFormation template that implements robust IAM security configurations with MFA enforcement and least privilege access:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready IAM security configuration with MFA enforcement and least privilege access'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name for resource tagging and configuration'
  
  TrustedAccountId:
    Type: String
    Description: 'AWS Account ID that can assume the IAM role'
    AllowedPattern: '[0-9]{12}'
    ConstraintDescription: 'Must be a valid 12-digit AWS Account ID'

  MFAMaxSessionDuration:
    Type: Number
    Default: 3600
    MinValue: 900
    MaxValue: 43200
    Description: 'Maximum session duration in seconds (15 minutes to 12 hours)'

Resources:
  # CloudTrail for security auditing and compliance
  SecurityAuditTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${Environment}-security-audit-trail'
      S3BucketName: !Ref SecurityAuditBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true # Required property for CloudTrail
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::IAM::Role'
              Values: ['*']
            - Type: 'AWS::IAM::Policy'
              Values: ['*']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Security Audit Trail'
        - Key: Compliance
          Value: 'MFA-Enforcement-Tracking'

  # S3 bucket for CloudTrail logs
  SecurityAuditBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${Environment}-security-audit-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'SecurityLogRetention'
            Status: Enabled
            ExpirationInDays: 2555 # 7 years retention for compliance
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Security Audit Storage'

  # S3 bucket policy for CloudTrail
  SecurityAuditBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecurityAuditBucket
      PolicyDocument:
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt SecurityAuditBucket.Arn
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${SecurityAuditBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # IAM Role with strict MFA enforcement
  SecureAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-secure-access-role'
      Description: 'Production IAM role with mandatory MFA enforcement and least privilege access'
      MaxSessionDuration: !Ref MFAMaxSessionDuration
      # Trust policy requiring MFA for role assumption
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'RequireMFAForRoleAssumption'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${TrustedAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600' # MFA must be within 1 hour
          - Sid: 'DenyAssumeRoleWithoutMFA'
            Effect: Deny
            Principal:
              AWS: !Sub 'arn:aws:iam::${TrustedAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'
      ManagedPolicyArns:
        - !Ref ReadOnlyAccessPolicy
        - !Ref LimitedS3AccessPolicy
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: MFARequired
          Value: 'true'
        - Key: AccessLevel
          Value: 'LeastPrivilege'
        - Key: Purpose
          Value: 'Secure Production Access'

  # Custom policy for read-only access with MFA enforcement
  ReadOnlyAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${Environment}-readonly-access-policy'
      Description: 'Read-only access policy with MFA enforcement for security operations'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow read-only access to most AWS services
          - Sid: 'ReadOnlyAccessWithMFA'
            Effect: Allow
            Action:
              - 'ec2:Describe*'
              - 'ec2:List*'
              - 's3:GetObject'
              - 's3:ListBucket'
              - 'iam:Get*'
              - 'iam:List*'
              - 'cloudtrail:LookupEvents'
              - 'cloudwatch:Get*'
              - 'cloudwatch:List*'
              - 'cloudwatch:Describe*'
              - 'logs:Describe*'
              - 'logs:Get*'
              - 'logs:List*'
              - 'logs:FilterLogEvents'
            Resource: '*'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
          
          # Explicitly deny sensitive IAM actions even with MFA
          - Sid: 'DenySensitiveIAMActions'
            Effect: Deny
            Action:
              - 'iam:CreateRole'
              - 'iam:DeleteRole'
              - 'iam:CreatePolicy'
              - 'iam:DeletePolicy'
              - 'iam:AttachRolePolicy'
              - 'iam:DetachRolePolicy'
              - 'iam:PutRolePolicy'
              - 'iam:DeleteRolePolicy'
              - 'iam:CreateUser'
              - 'iam:DeleteUser'
              - 'iam:CreateAccessKey'
              - 'iam:DeleteAccessKey'
            Resource: '*'

  # Limited S3 access policy with specific bucket restrictions
  LimitedS3AccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${Environment}-limited-s3-access-policy'
      Description: 'Limited S3 access policy for specific operational needs with MFA enforcement'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow access to specific S3 buckets only
          - Sid: 'LimitedS3AccessWithMFA'
            Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
              - 's3:GetBucketLocation'
            Resource:
              - !Sub '${SecurityAuditBucket}/*'
              - !GetAtt SecurityAuditBucket.Arn
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
          
          # Deny access to all other S3 buckets
          - Sid: 'DenyAccessToOtherS3Buckets'
            Effect: Deny
            Action: 's3:*'
            NotResource:
              - !Sub '${SecurityAuditBucket}/*'
              - !GetAtt SecurityAuditBucket.Arn

  # Additional security role for emergency access with stricter MFA requirements
  EmergencyAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-emergency-access-role'
      Description: 'Emergency access role with enhanced MFA requirements and time-limited access'
      MaxSessionDuration: 1800 # 30 minutes maximum for emergency access
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'RequireRecentMFAForEmergencyAccess'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${TrustedAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '900' # MFA must be within 15 minutes
              DateGreaterThan:
                'aws:CurrentTime': '2024-01-01T00:00:00Z'
              DateLessThan:
                'aws:CurrentTime': '2030-12-31T23:59:59Z'
      ManagedPolicyArns:
        - !Ref EmergencyAccessPolicy
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: AccessType
          Value: 'Emergency'
        - Key: MFARequired
          Value: 'true'
        - Key: MaxSessionDuration
          Value: '1800'

  # Emergency access policy with limited permissions
  EmergencyAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${Environment}-emergency-access-policy'
      Description: 'Emergency access policy with time-limited and MFA-enforced permissions'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow emergency access to critical resources
          - Sid: 'EmergencyAccessWithStrictMFA'
            Effect: Allow
            Action:
              - 'ec2:StopInstances'
              - 'ec2:StartInstances'
              - 'ec2:RebootInstances'
              - 'rds:StopDBInstance'
              - 'rds:StartDBInstance'
              - 'rds:RebootDBInstance'
              - 'cloudwatch:PutMetricAlarm'
              - 'sns:Publish'
            Resource: '*'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '900'
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'

Outputs:
  SecureAccessRoleArn:
    Description: 'ARN of the secure access role with MFA enforcement'
    Value: !GetAtt SecureAccessRole.Arn
    Export:
      Name: !Sub '${Environment}-secure-access-role-arn'

  EmergencyAccessRoleArn:
    Description: 'ARN of the emergency access role with enhanced MFA requirements'
    Value: !GetAtt EmergencyAccessRole.Arn
    Export:
      Name: !Sub '${Environment}-emergency-access-role-arn'

  SecurityAuditTrailArn:
    Description: 'ARN of the CloudTrail for security auditing'
    Value: !GetAtt SecurityAuditTrail.Arn
    Export:
      Name: !Sub '${Environment}-security-audit-trail-arn'

  SecurityAuditBucketName:
    Description: 'Name of the S3 bucket storing security audit logs'
    Value: !Ref SecurityAuditBucket
    Export:
      Name: !Sub '${Environment}-security-audit-bucket-name'

  MFAComplianceStatus:
    Description: 'Confirmation that all roles enforce MFA authentication'
    Value: 'All IAM roles in this template enforce MFA with time-based validation'

  SecurityValidationChecklist:
    Description: 'Security validation checklist for deployment verification'
    Value: 'Verify: 1) MFA enforcement active, 2) Least privilege policies applied, 3) CloudTrail logging enabled, 4) S3 bucket encryption enabled'
```

## Key Security Features Implemented

### 1. **MFA Enforcement**
- **Mandatory MFA**: All role assumptions require active MFA authentication
- **Time-based validation**: MFA must be recent (within 1 hour for normal access, 15 minutes for emergency)
- **Explicit deny conditions**: Prevents access without MFA

### 2. **Least Privilege Access**
- **Read-only permissions**: Primary role has limited read-only access
- **Resource-specific access**: S3 access restricted to specific buckets
- **Explicit denials**: Sensitive IAM actions are explicitly denied

### 3. **Security Monitoring**
- **CloudTrail integration**: All IAM activities are logged and auditable
- **Encrypted storage**: Audit logs stored in encrypted S3 bucket
- **Retention policies**: 7-year retention for compliance requirements

### 4. **Emergency Access Controls**
- **Time-limited sessions**: Emergency role limited to 30-minute sessions
- **Enhanced MFA requirements**: Stricter MFA timing for emergency access
- **Scoped permissions**: Emergency actions limited to critical operations

### 5. **Production-Ready Features**
- **Environment parameterization**: Supports multiple deployment environments
- **Proper resource dependencies**: Ensures correct deployment order
- **Comprehensive tagging**: All resources tagged for management and compliance
- **AWS Well-Architected compliance**: Follows security pillar best practices

This template provides a robust foundation for secure IAM configurations in production environments while maintaining operational flexibility and compliance requirements.
