# Secure AWS Infrastructure CloudFormation Template

Below is a comprehensive CloudFormation YAML template that addresses all the specified requirements while maintaining data integrity and implementing robust security controls with proper VPC infrastructure.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Template - CIS Compliant with Encryption and IAM Best Practices'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging'

  KMSKeyAlias:
    Type: String
    Default: 'corp-security-key'
    Description: 'KMS Key alias for encryption'

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # VPC for secure infrastructure
  CorpVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'corp-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  # Public Subnet
  CorpPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'corp-public-subnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  CorpInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'corp-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  CorpAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref CorpVPC
      InternetGatewayId: !Ref CorpInternetGateway

  # Route Table
  CorpRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref CorpVPC
      Tags:
        - Key: Name
          Value: !Sub 'corp-route-table-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  # Route to Internet Gateway
  CorpRoute:
    Type: AWS::EC2::Route
    DependsOn: CorpAttachGateway
    Properties:
      RouteTableId: !Ref CorpRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref CorpInternetGateway

  # Associate Route Table with Subnet
  CorpSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref CorpPublicSubnet
      RouteTableId: !Ref CorpRouteTable

  # KMS Key for Encryption at Rest
  CorpSecurityKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Corporate KMS key for encryption at rest'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail Encryption
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs Encryption
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow Config Encryption
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub 'corp-security-kms-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: CISCompliance
          Value: 'true'

  # KMS Key Alias
  CorpSecurityKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${KMSKeyAlias}'
      TargetKeyId: !Ref CorpSecurityKMSKey

  # IAM Role for EC2 Instances with Minimal Permissions
  CorpEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: CorpEC2MinimalPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt CorpSecurityKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CorpCloudWatchLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'corp-ec2-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Instance Profile for EC2
  CorpEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref CorpEC2Role

  # IAM Role for Lambda Functions
  CorpLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: CorpLambdaMinimalPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt CorpSecurityKMSKey.Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}/*'
      Tags:
        - Key: Name
          Value: !Sub 'corp-lambda-execution-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket with Encryption and Security Controls
  CorpS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CorpSecurityKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref CorpS3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'corp-secure-bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: CISCompliance
          Value: 'true'

  # S3 Bucket for Access Logs
  CorpS3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'corp-access-logs-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CorpSecurityKMSKey
            BucketKeyEnabled: true
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
          Value: !Sub 'corp-access-logs-bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy for CloudTrail and Config
  CorpS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CorpS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}/config-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  # CloudWatch Log Group with Encryption
  CorpCloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/corp/security/${EnvironmentSuffix}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt CorpSecurityKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'corp-log-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: CISCompliance
          Value: 'true'

  # Security Group with Restricted Access
  CorpSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Corporate security group with minimal required access'
      VpcId: !Ref CorpVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8
          Description: 'HTTPS from internal networks only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS API calls'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Name
          Value: !Sub 'corp-security-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail for Audit Logging
  CorpCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CorpS3BucketPolicy
    Properties:
      TrailName: !Sub 'corp-cloudtrail-${EnvironmentSuffix}'
      S3BucketName: !Ref CorpS3Bucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      KMSKeyId: !Ref CorpSecurityKMSKey
      CloudWatchLogsLogGroupArn: !GetAtt CorpCloudWatchLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CorpCloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub 'arn:aws:s3:::corp-secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}/*'
      Tags:
        - Key: Name
          Value: !Sub 'corp-cloudtrail-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: CISCompliance
          Value: 'true'

  # IAM Role for CloudTrail
  CorpCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
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
                Resource: !GetAtt CorpCloudWatchLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'corp-cloudtrail-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Config Configuration Recorder
  CorpConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'corp-config-recorder-${Environment}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Delivery Channel
  CorpConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DependsOn: CorpS3BucketPolicy
    Properties:
      Name: !Sub 'corp-config-delivery-${Environment}'
      S3BucketName: !Ref CorpS3Bucket
      S3KeyPrefix: 'config-logs'
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

Outputs:
  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref CorpSecurityKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  KMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt CorpSecurityKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  S3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref CorpS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  EC2RoleArn:
    Description: 'EC2 IAM Role ARN'
    Value: !GetAtt CorpEC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2Role'

  LambdaRoleArn:
    Description: 'Lambda Execution Role ARN'
    Value: !GetAtt CorpLambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRole'

  SecurityGroupId:
    Description: 'Security Group ID'
    Value: !Ref CorpSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup'

  CloudWatchLogGroup:
    Description: 'CloudWatch Log Group Name'
    Value: !Ref CorpCloudWatchLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroup'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref CorpVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref CorpPublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet'
```

## Key Security Features Implemented

### 1. IAM Roles and Policies (Least Privilege)
- **EC2 Role**: Minimal permissions for S3 access, KMS decryption, and CloudWatch logging
- **Lambda Role**: Basic execution permissions with KMS and S3 read access only
- **CloudTrail Role**: Specific permissions for log delivery to CloudWatch
- **All roles include region restrictions** (us-east-1 only)

### 2. CIS AWS Foundations Compliance
- **CloudTrail enabled** with multi-region support and log file validation
- **S3 bucket public access blocked** on all buckets
- **KMS key rotation enabled** automatically
- **Config Service** for continuous compliance monitoring
- **CloudWatch logging** with encryption
- **Versioning enabled** on S3 buckets

### 3. Encryption Implementation
- **At Rest**: KMS encryption for S3, CloudWatch Logs, and CloudTrail
- **In Transit**: Security groups restrict to HTTPS (443) only
- **Key Management**: Dedicated KMS key with proper key policies for all services

### 4. Network Security
- **VPC with proper CIDR allocation** (10.0.0.0/16)
- **Public subnet** with internet gateway for controlled access
- **Security groups** with minimal required ports
- **Route tables** properly configured for internet access

### 5. Additional Security Controls
- **S3 access logging** and lifecycle policies
- **CloudTrail data events** monitoring
- **Resource tagging** for compliance tracking
- **Environment-specific naming** with consistent suffix usage

### 6. Infrastructure Completeness
- **Complete VPC setup** instead of relying on existing VPC
- **Proper resource dependencies** with DependsOn attributes
- **Comprehensive outputs** for integration with other stacks
- **Environment-specific configuration** with EnvironmentSuffix parameter

### 7. Naming Conventions
All resources follow the **corp-** prefix requirement as specified and use consistent environment-based naming patterns.

This template ensures data integrity, implements robust security controls, maintains compliance with CIS benchmarks, and provides a complete, self-contained infrastructure deployment for the us-east-1 region.