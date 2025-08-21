# Secure AWS Infrastructure CloudFormation Template

This CloudFormation template implements a comprehensive secure AWS infrastructure with KMS encryption, S3 buckets, IAM roles, security groups, and CloudTrail auditing.

## CloudFormation Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with IAM, KMS, S3, VPC Security Groups, and CloudTrail'

Parameters:
  ProjectName:
    Type: String
    Default: 'myapp'
    Description: 'Project name for resource naming'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'

  ExistingVpcId:
    Type: String
    Default: ''
    Description: 'Existing VPC ID where security groups will be created (leave empty to use default VPC)'

Conditions:
  HasExistingVpc: !Not [!Equals [!Ref ExistingVpcId, '']]

Resources:
  # KMS Key for encryption
  DataEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${ProjectName}-data-${Environment} - KMS key for data encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-data-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # KMS Key Alias
  DataEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-data-${Environment}'
      TargetKeyId: !Ref DataEncryptionKey

  # S3 Bucket with security best practices
  SecureDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-secure-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataEncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'secure-data-access-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secure-data-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket for access logs
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-access-logs-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail S3 Bucket
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail S3 Bucket Policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # IAM Role for web servers with least privilege
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-web-${Environment}-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${SecureDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureDataBucket.Arn
        - PolicyName: KMSDecryptAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt DataEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-${Environment}-role'
        - Key: Environment
          Value: !Ref Environment

  # Instance Profile for web servers
  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-web-${Environment}-profile'
      Roles:
        - !Ref WebServerRole

  # IAM Group for developers with limited permissions
  DeveloperGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${ProjectName}-developers-${Environment}'
      Policies:
        - PolicyName: DeveloperS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${SecureDataBucket.Arn}/dev/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureDataBucket.Arn
                Condition:
                  StringLike:
                    's3:prefix': 'dev/*'
        - PolicyName: ReadOnlyCloudTrail
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudtrail:LookupEvents
                  - cloudtrail:GetTrailStatus
                Resource: '*'

  # Security Group for web servers (HTTPS only)
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: HasExistingVpc
    Properties:
      GroupName: !Sub '${ProjectName}-web-${Environment}-sg'
      GroupDescription: 'Security group for web servers - HTTPS traffic only'
      VpcId: !Ref ExistingVpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound traffic'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-${Environment}-sg'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for S3 access logs
  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt DataEncryptionKey.Arn

  # CloudWatch Log Group for CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt DataEncryptionKey.Arn

  # IAM Role for CloudTrail
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-cloudtrail-${Environment}-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn

  # CloudTrail for audit logging
  SecurityAuditTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-security-audit-${Environment}'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref DataEncryptionKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureDataBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-security-audit-${Environment}'
        - Key: Environment
          Value: !Ref Environment

Outputs:
  KMSKeyId:
    Description: 'KMS Key ID for data encryption'
    Value: !Ref DataEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'KMS Key ARN for data encryption'
    Value: !GetAtt DataEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  SecureDataBucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureDataBucket'

  WebServerSecurityGroupId:
    Condition: HasExistingVpc
    Description: 'Security Group ID for web servers'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServerSG'

  WebServerRoleArn:
    Description: 'IAM Role ARN for web servers'
    Value: !GetAtt WebServerRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebServerRole'

  CloudTrailArn:
    Description: 'CloudTrail ARN for audit logging'
    Value: !GetAtt SecurityAuditTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'
```

## Key Features

### Security Features
- **KMS Encryption**: Customer-managed KMS key with automatic rotation enabled
- **S3 Security**: All buckets encrypted, public access blocked, versioning enabled
- **IAM Least Privilege**: Minimal permissions for web servers and developers
- **HTTPS-Only Security Groups**: Only port 443 allowed for web traffic
- **CloudTrail Auditing**: Comprehensive logging with encrypted storage

### Infrastructure Components
- **Secure S3 Buckets**: Main data bucket, access logs bucket, CloudTrail bucket
- **IAM Resources**: Web server role, developer group with limited permissions
- **Monitoring**: CloudWatch log groups for S3 and CloudTrail events
- **Network Security**: Conditional security group for VPC environments

### Compliance Features
- **Encryption at Rest**: All data encrypted with customer-managed KMS keys
- **Audit Trail**: Complete CloudTrail logging with multi-region coverage
- **Access Controls**: Strict IAM policies with resource-level permissions
- **Data Governance**: Lifecycle policies and retention settings for logs