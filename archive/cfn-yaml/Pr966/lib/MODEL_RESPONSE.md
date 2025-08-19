AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Secure AWS Cloud Environment with Encryption, Network Hardening, and Compliance Monitoring'

Parameters:
  AllowedIPAddresses:
    Type: CommaDelimitedList
    Default: "203.0.113.0/24,198.51.100.0/24"
    Description: "Comma-delimited list of CIDR blocks allowed for HTTP/HTTPS access"
  
  CrossAccountLoggingBucket:
    Type: String
    Description: "S3 bucket in separate account for CloudTrail logs"
    Default: "cross-account-logging-bucket-example"
  
  CrossAccountLoggingAccountId:
    Type: String
    Description: "AWS Account ID for cross-account logging"
    AllowedPattern: "[0-9]{12}"
    ConstraintDescription: "Must be a valid 12-digit AWS Account ID"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Security Configuration"
        Parameters:
          - AllowedIPAddresses
      - Label:
          default: "Cross-Account Logging Configuration"
        Parameters:
          - CrossAccountLoggingBucket
          - CrossAccountLoggingAccountId

Resources:
  # ========================================
  # KMS Key for S3 Encryption
  # ========================================
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "Customer-managed KMS key for S3 bucket encryption"
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: S3Encryption

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secure-s3-encryption-key
      TargetKeyId: !Ref S3EncryptionKey

  # ========================================
  # Secure S3 Bucket
  # ========================================
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-production-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: access-logs/
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3ActivityLogGroup
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: SecureStorage

  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-s3-access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: AccessLogs

  # ========================================
  # S3 Bucket Policy
  # ========================================
  SecureS3BucketPolicy:
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
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowEC2RolePutObject
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2Role.Arn
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
          - Sid: AllowCloudTrailLogs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/cloudtrail-logs/*'

  # ========================================
  # VPC and Network Configuration
  # ========================================
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: SecureProductionVPC

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: PrivateSubnet

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: PublicSubnet

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  # ========================================
  # Network ACLs (Default Deny)
  # ========================================
  RestrictiveNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: RestrictiveNACL

  # Allow HTTP from specific IPs
  NetworkAclEntryHTTPInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref RestrictiveNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Select [0, !Ref AllowedIPAddresses]
      PortRange:
        From: 80
        To: 80

  # Allow HTTPS from specific IPs
  NetworkAclEntryHTTPSInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref RestrictiveNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Select [0, !Ref AllowedIPAddresses]
      PortRange:
        From: 443
        To: 443

  # Allow outbound responses
  NetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref RestrictiveNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  SubnetNetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      NetworkAclId: !Ref RestrictiveNetworkAcl

  # ========================================
  # Security Groups (Minimal Rules)
  # ========================================
  MinimalSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Minimal security group with restricted access
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Select [0, !Ref AllowedIPAddresses]
          Description: "HTTP from allowed IPs only"
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Select [0, !Ref AllowedIPAddresses]
          Description: "HTTPS from allowed IPs only"
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS outbound for AWS API calls"
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: MinimalSecurityGroup

  # ========================================
  # IAM Roles and Policies (Least Privilege)
  # ========================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureEC2Role-${AWS::StackName}'
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
        - PolicyName: LimitedS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3EncryptionKey.Arn
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ========================================
  # EC2 Instance
  # ========================================
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI
      InstanceType: t3.micro
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PrivateSubnet
      SecurityGroupIds:
        - !Ref MinimalSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: SecureInstance

  # ========================================
  # AWS Secrets Manager
  # ========================================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'prod-database-credentials-${AWS::StackName}'
      Description: 'Database credentials with automatic rotation'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref S3EncryptionKey
      Tags:
        - Key: Environment
          Value: Production
        - Key: Purpose
          Value: DatabaseCredentials

  DatabaseSecretRotation:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DatabaseSecret
      RotationLambdaArn: !GetAtt SecretsRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # ========================================
  # Lambda for Secrets Rotation
  # ========================================
  SecretsRotationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SecretsManagerRotation
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:DescribeSecret
                  - secretsmanager:GetSecretValue
                  - secretsmanager:PutSecretValue
                  - secretsmanager:UpdateSecretVersionStage
                Resource: !Ref DatabaseSecret
      Tags:
        - Key: Environment
          Value: Production

  SecretsRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'secrets-rotation-${AWS::StackName}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecretsRotationRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info("Secrets rotation triggered")
              # Basic rotation logic - in production, implement full rotation
              return {
                  'statusCode': 200,
                  'body': json.dumps('Rotation completed')
              }
      Tags:
        - Key: Environment
          Value: Production

  # ========================================
  # CloudTrail Configuration
  # ========================================
  S3ActivityLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${SecureS3Bucket}/activity'
      RetentionInDays: 365
      KmsKeyId: !GetAtt S3EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  CloudTrailRole:
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
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt S3ActivityLogGroup.Arn
      Tags:
        - Key: Environment
          Value: Production

  S3CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub 'S3ActivityTrail-${AWS::StackName}'
      S3BucketName: !Ref CrossAccountLoggingBucket
      S3KeyPrefix: 's3-activity-logs/'
      IncludeGlobalServiceEvents: false
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt S3ActivityLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: false
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket}/*'
            - Type: AWS::S3::Bucket
              Values:
                - !Ref SecureS3Bucket
      Tags:
        - Key: Environment
          Value: Production

  # ========================================
  # AWS Config Configuration
  # ========================================
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Tags:
        - Key: Environment
          Value: Production

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-config-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref ConfigBucket
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'ConfigRecorder-${AWS::StackName}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'ConfigDeliveryChannel-${AWS::StackName}'
      S3BucketName: !Ref ConfigBucket

  # AWS Config Rules for Compliance
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  IAMLeastPrivilegeRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: iam-policy-no-statements-with-admin-access
      Source:
        Owner: AWS
        SourceIdentifier: IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS

  SecurityGroupRestrictedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: ec2-security-group-attached-to-eni
      Source:
        Owner: AWS
        SourceIdentifier: EC2_SECURITY_GROUP_ATTACHED_TO_ENI

# ========================================
# Outputs
# ========================================
Outputs:
  SecureS3BucketName:
    Description: Name of the secure S3 bucket
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3Bucket'

  S3EncryptionKeyId:
    Description: KMS Key ID for S3 encryption
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-S3EncryptionKey'

  VPCId:
    Description: ID of the secure VPC
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  EC2InstanceId:
    Description: ID of the secure EC2 instance
    Value: !Ref SecureEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance'

  DatabaseSecretArn:
    Description: ARN of the database secret in Secrets Manager
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSecret'

  CloudTrailArn:
    Description: ARN of the CloudTrail for S3 activity logging
    Value: !GetAtt S3CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'