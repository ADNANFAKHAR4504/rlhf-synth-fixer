I'll create a comprehensive CloudFormation template that addresses all your security requirements. Here's a well-structured YAML template that implements the security controls you've specified:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Environment Setup with IAM 2FA, encrypted S3, CloudTrail logging, and regional EC2 restrictions'

Parameters:
  EnvironmentName:
    Description: Name prefix for resources
    Type: String
    Default: SecureEnv

  CloudTrailBucketName:
    Description: Name for CloudTrail S3 bucket (must be globally unique)
    Type: String
    Default: secure-cloudtrail-logs-bucket-12345

Resources:
  # IAM Policy to enforce MFA for all users
  EnforceMFAPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${EnvironmentName}-EnforceMFA'
      Description: 'Policy that enforces MFA for all IAM operations'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - 'iam:GetAccountPasswordPolicy'
              - 'iam:ListVirtualMFADevices'
              - 'iam:GetAccountSummary'
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - 'iam:ChangePassword'
              - 'iam:GetUser'
            Resource: 'arn:aws:iam::*:user/${aws:username}'
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
            Resource:
              - 'arn:aws:iam::*:mfa/${aws:username}'
              - 'arn:aws:iam::*:user/${aws:username}'
          - Sid: DenyAllExceptUnlessSignedInWithMFA
            Effect: Deny
            NotAction:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
              - 'iam:ChangePassword'
              - 'iam:GetAccountPasswordPolicy'
              - 'iam:GetAccountSummary'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # IAM Group for secure users with MFA enforcement
  SecureUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${EnvironmentName}-SecureUsers'
      ManagedPolicyArns:
        - !Ref EnforceMFAPolicy

  # Sample IAM User (you can create more as needed)
  SampleSecureUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${EnvironmentName}-SampleUser'
      Groups:
        - !Ref SecureUsersGroup
      LoginProfile:
        Password: 'TempPassword123!'
        PasswordResetRequired: true

  # S3 Bucket Policy to deny public access
  S3BucketPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${EnvironmentName}-S3SecurityPolicy'
      Description: 'Policy to ensure S3 buckets are private and encrypted'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # Secure S3 Bucket with encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'

  # Apply the security policy to the S3 bucket
  SecureS3BucketPolicyAttachment:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Sub '${SecureS3Bucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref CloudTrailBucketName
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

  # CloudTrail Bucket Policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # CloudTrail for API logging
  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentName}-SecurityTrail'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - 'arn:aws:s3:::*/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - 'arn:aws:s3:::*'

  # SCP-style policy to restrict EC2 to us-west-2 (implemented as IAM policy)
  RegionalRestrictionPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${EnvironmentName}-RegionalRestriction'
      Description: 'Policy to restrict EC2 operations to us-west-2 region'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowEC2InUSWest2Only
            Effect: Allow
            Action:
              - 'ec2:*'
            Resource: '*'
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-west-2'
          - Sid: DenyEC2OutsideUSWest2
            Effect: Deny
            Action:
              - 'ec2:RunInstances'
              - 'ec2:CreateVolume'
              - 'ec2:CreateSnapshot'
              - 'ec2:CopySnapshot'
              - 'ec2:CreateImage'
              - 'ec2:CopyImage'
            Resource: '*'
            Condition:
              StringNotEquals:
                'aws:RequestedRegion': 'us-west-2'

  # Attach regional restriction to secure users group
  AttachRegionalRestriction:
    Type: AWS::IAM::GroupPolicyAttachment
    Properties:
      GroupName: !Ref SecureUsersGroup
      PolicyArn: !Ref RegionalRestrictionPolicy

  # Security Group for EC2 instances (restrictive by default)
  SecureSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-SecureSecurityGroup'
      GroupDescription: 'Secure security group with minimal access'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
          Description: 'SSH access from private networks only'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for updates'

Outputs:
  SecureS3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3Bucket'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt SecurityCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  SecureUsersGroupName:
    Description: 'Name of the secure users group with MFA enforcement'
    Value: !Ref SecureUsersGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecureUsersGroup'

  SecurityGroupId:
    Description: 'ID of the secure security group'
    Value: !Ref SecureSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup'
```

## Key Security Features Implemented:

### **IAM 2FA Enforcement**

- **MFA Policy**: Forces all users to authenticate with MFA before accessing AWS resources
- **Secure Users Group**: Automatically applies MFA requirements to all members
- **Conditional Access**: Denies all actions unless MFA is present

### **S3 Security**

- **Private Buckets**: All buckets have public access completely blocked
- **SSE-S3 Encryption**: Server-side encryption enabled by default
- **Bucket Policies**: Enforce HTTPS-only access and encrypted uploads
- **Versioning**: Enabled for data protection

### **CloudTrail Logging**

- **Multi-region Trail**: Captures API calls across all regions
- **Data Events**: Logs S3 object-level operations
- **Log File Validation**: Ensures log integrity
- **Encrypted Storage**: CloudTrail logs stored in encrypted S3 bucket

### **Regional Restrictions**

- **EC2 Regional Policy**: Restricts EC2 operations to `us-west-2` only
- **Conditional Policies**: Uses AWS condition keys to enforce geographic boundaries
- **Comprehensive Coverage**: Blocks instance creation, volume creation, and image operations outside the allowed region

## Deployment Instructions:

1. **Update Parameters**: Change the `CloudTrailBucketName` parameter to ensure global uniqueness
2. **Deploy Template**: Use AWS CLI or Console to deploy in `us-west-2`
3. **User Setup**: After deployment, users must set up MFA devices before accessing resources
4. **Validation**: Test that EC2 instances cannot be created outside `us-west-2`

This template creates a robust security foundation that meets all your requirements while following AWS best practices for infrastructure as code.
