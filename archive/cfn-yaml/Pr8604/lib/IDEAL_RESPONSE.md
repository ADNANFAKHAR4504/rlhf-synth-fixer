# Secure AWS Enterprise CloudFormation Template

This CloudFormation template provisions a secure AWS environment for handling sensitive enterprise data with comprehensive security controls.

## Template Overview

The template creates a fully secure AWS infrastructure that meets all enterprise security requirements including:

- IAM roles and policies following least privilege principles
- KMS encryption for all data at rest
- Private S3 buckets with public access blocked
- MFA enforcement for IAM users
- VPC endpoints with restricted access
- CloudTrail audit logging with encryption
- CloudWatch monitoring and alerting for security events

## Template Files

### lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS environment for handling sensitive enterprise data with comprehensive security controls'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'

  CorporateIPRange:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'Corporate IP range for VPC endpoint access (CIDR notation)'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$'

  NotificationEmail:
    Type: String
    Description: 'Email address for security alerts'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Resources:
  # =============================================================================
  # KMS Key for Encryption
  # =============================================================================
  EnterpriseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for encrypting sensitive enterprise data'
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
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:Decrypt'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'

  EnterpriseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/enterprise-security-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref EnterpriseKMSKey

  # =============================================================================
  # IAM Roles and Policies (Least Privilege)
  # =============================================================================
  SecureDataAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'

  SecureDataAccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: SecureDataAccessPolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3AccessWithEncryption
            Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Ref SecureDataBucket
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt EnterpriseKMSKey.Arn
          - Sid: AllowKMSAccess
            Effect: Allow
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: !GetAtt EnterpriseKMSKey.Arn
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Action: 's3:PutObject'
            Resource: !Sub '${SecureDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
      Roles:
        - !Ref SecureDataAccessRole

  # CloudTrail Service Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                  - 'logs:DescribeLogGroups'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'

  # =============================================================================
  # S3 Buckets (Private by Default)
  # =============================================================================
  SecureDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-enterprise-data-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EnterpriseKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'

  SecureDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Ref SecureDataBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-logging-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EnterpriseKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetention
            Status: Enabled
            ExpirationInDays: 2555 # 7 years retention
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EnterpriseKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

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
            Action: 's3:GetBucketAcl'
            Resource: !Ref CloudTrailBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt EnterpriseKMSKey.Arn

  # =============================================================================
  # VPC and VPC Endpoints
  # =============================================================================
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureEnterpriseVPC

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet2

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for VPC endpoints - restrict to corporate IP ranges'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref CorporateIPRange
          Description: 'HTTPS access from corporate network'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: VPCEndpointSecurityGroup

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  KMSVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup
      PrivateDnsEnabled: true

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # =============================================================================
  # CloudTrail Configuration
  # =============================================================================
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/enterprise-audit-${EnvironmentSuffix}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt EnterpriseKMSKey.Arn

  EnterpriseCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'EnterpriseSecurityTrail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref EnterpriseKMSKey
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureDataBucket}/*'

  # =============================================================================
  # CloudWatch Monitoring and Alarms
  # =============================================================================
  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/access-logs-${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt EnterpriseKMSKey.Arn

  SecurityAlertsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/alerts-${EnvironmentSuffix}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt EnterpriseKMSKey.Arn

  # SNS Topic for Security Alerts
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'SecurityAlerts-${EnvironmentSuffix}'
      KmsMasterKeyId: !Ref EnterpriseKMSKey
      Subscription:
        - Protocol: email
          Endpoint: !Ref NotificationEmail

  # Metric Filters and Alarms
  FailedMFALoginMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") || ($.responseElements.assumeRoleFailure.code = "MultiFactorAuthentication") }'
      MetricTransformations:
        - MetricNamespace: 'Security/Authentication'
          MetricName: 'FailedMFALogins'
          MetricValue: '1'
          DefaultValue: 0

  FailedMFALoginAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'Failed-MFA-Login-Attempts'
      AlarmDescription: 'Alert on failed MFA login attempts'
      MetricName: 'FailedMFALogins'
      Namespace: 'Security/Authentication'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic
      TreatMissingData: notBreaching

  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricNamespace: 'Security/API'
          MetricName: 'UnauthorizedAPICalls'
          MetricValue: '1'
          DefaultValue: 0

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'Unauthorized-API-Calls'
      AlarmDescription: 'Alert on unauthorized API calls'
      MetricName: 'UnauthorizedAPICalls'
      Namespace: 'Security/API'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic

  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricNamespace: 'Security/RootAccess'
          MetricName: 'RootAccountUsage'
          MetricValue: '1'
          DefaultValue: 0

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'Root-Account-Usage'
      AlarmDescription: 'Alert on root account usage'
      MetricName: 'RootAccountUsage'
      Namespace: 'Security/RootAccess'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic

  # =============================================================================
  # MFA Enforcement Policy
  # =============================================================================
  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: 'EnforceMFAPolicy'
      Description: 'Policy to enforce MFA for all IAM users'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - 'iam:GetAccountPasswordPolicy'
              - 'iam:ListVirtualMFADevices'
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
              - 'iam:DeleteVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
            Resource:
              - 'arn:aws:iam::*:mfa/${aws:username}'
              - 'arn:aws:iam::*:user/${aws:username}'
          - Sid: DenyAllExceptUnlessMFAAuthenticated
            Effect: Deny
            NotAction:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

Outputs:
  KMSKeyId:
    Description: 'KMS Key ID for enterprise encryption'
    Value: !Ref EnterpriseKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  KMSKeyArn:
    Description: 'KMS Key ARN for enterprise encryption'
    Value: !GetAtt EnterpriseKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  SecureDataBucket:
    Description: 'S3 bucket for secure enterprise data'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureDataBucket'

  SecureDataAccessRoleArn:
    Description: 'IAM role ARN for secure data access'
    Value: !GetAtt SecureDataAccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecureDataAccessRole'

  VPCId:
    Description: 'VPC ID for secure environment'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  CloudTrailArn:
    Description: 'CloudTrail ARN for audit logging'
    Value: !GetAtt EnterpriseCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  SecurityAlertsTopicArn:
    Description: 'SNS Topic ARN for security alerts'
    Value: !Ref SecurityAlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAlerts'
```

## Key Security Features

### 1. IAM Roles and Policies (Least Privilege)

- **SecureDataAccessRole**: Requires MFA authentication with time-based session limits
- **SecureDataAccessPolicy**: Enforces encryption for all S3 operations
- **CloudTrailRole**: Limited permissions for CloudTrail service operations
- **MFAEnforcementPolicy**: Denies all actions unless MFA is present

### 2. KMS Encryption

- Central KMS key for encrypting all sensitive data
- Key policies allow CloudTrail and CloudWatch Logs services
- All S3 buckets use KMS encryption
- SNS topics encrypted with KMS

### 3. S3 Security

- **Public Access Blocked**: All buckets have PublicAccessBlockConfiguration enabled
- **Encryption Enforced**: Bucket policies deny unencrypted uploads
- **Secure Transport**: HTTPS required for all S3 operations
- **Versioning**: Enabled on secure data bucket for data protection
- **Lifecycle Policies**: Automatic archival and retention management

### 4. MFA Enforcement

- Role assumption requires MFA authentication
- MFA age validation (max 3600 seconds)
- Policy denies actions without MFA present

### 5. VPC Endpoints and Network Security

- Private subnets with no internet gateway
- VPC endpoints for S3 and KMS services
- Security groups restrict access to corporate IP ranges
- Private DNS enabled for seamless integration

### 6. CloudTrail Audit Logging

- Multi-region trail for global coverage
- Log file validation enabled
- Encrypted with KMS
- Logs sent to CloudWatch for real-time monitoring
- Event selectors for S3 data events

### 7. CloudWatch Monitoring and Alerting

- Metric filters for security events:
  - Failed MFA login attempts
  - Unauthorized API calls
  - Root account usage
- CloudWatch alarms with SNS notifications
- Encrypted log groups with retention policies

## Deployment

Deploy the template using AWS CLI:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    CorporateIPRange="10.0.0.0/8" \
    NotificationEmail="security@example.com" \
  --region us-east-1
```

## Compliance

This template addresses all security requirements:

- IAM roles follow least privilege principle
- KMS encryption for all data at rest
- S3 buckets configured as private by default
- MFA enforcement for IAM users
- VPC endpoints with corporate IP restrictions
- CloudTrail enabled with encryption
- CloudWatch alarms for unauthorized access attempts
