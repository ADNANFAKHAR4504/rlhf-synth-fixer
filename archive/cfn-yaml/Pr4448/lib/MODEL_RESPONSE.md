### Reasoning Trace

---

This is a comprehensive request for a CloudFormation template that needs to include:

1. **Networking**:
   - VPC with multiple subnets across AZs
   - VPC Flow Logs enabled

2. **IAM**:
   - EC2 IAM role with read-only S3 access
   - Resource-based policies with tag restrictions

3. **Storage**:
   - S3 buckets with versioning and KMS encryption
   - EBS volumes with default encryption

4. **Monitoring & Compliance**:
   - CloudTrail for logging
   - CloudWatch alarms for unauthorized access
   - AWS Config rules for compliance

5. **Tagging**:
   - Consistent tagging strategy with project and environment

Let me create a comprehensive CloudFormation template that addresses all these requirements.

### Answer

---

Here's a comprehensive, production-ready CloudFormation template that implements a secure and compliant AWS infrastructure:

```yaml
# secure_compliance_infra.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Compliant Cloud Infrastructure with Encryption, Monitoring, and Compliance Controls'

Parameters:
  ProjectName:
    Type: String
    Default: 'SecureInfra'
    Description: 'Project identifier for resource tagging'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]{2,20}$'
    ConstraintDescription: 'Must start with a letter and contain only alphanumeric characters and hyphens'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - development
      - staging
      - production
    Description: 'Environment identifier for resource tagging'

  AlertEmail:
    Type: String
    Description: 'Email address for CloudWatch alarm notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.20.0/24'

Resources:
  # ==========================================
  # KMS Keys for Encryption
  # ==========================================

  MasterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Master KMS key for infrastructure encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
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
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-master-kms-key'

  MasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-master-key'
      TargetKeyId: !Ref MasterKMSKey

  # ==========================================
  # VPC and Networking
  # ==========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Type
          Value: Private

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # ==========================================
  # VPC Flow Logs
  # ==========================================

  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt MasterKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-flow-log'

  # ==========================================
  # S3 Buckets with Encryption
  # ==========================================

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      VersioningConfiguration:
        Status: Enabled
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
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 's3-access-logs/'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3ReadOnlyWithTagRestriction
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: ListBuckets
                Effect: Allow
                Action:
                  - 's3:ListAllMyBuckets'
                  - 's3:GetBucketLocation'
                Resource: '*'
              - Sid: ReadOnlyAccessWithTags
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:ListBucket'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !Sub 'arn:aws:s3:::${ApplicationBucket}'
                  - !Sub 'arn:aws:s3:::${ApplicationBucket}/*'
                Condition:
                  StringEquals:
                    's3:ExistingObjectTag/Project': !Ref ProjectName
                    's3:ExistingObjectTag/Environment': !Ref Environment
        - PolicyName: KMSDecryptPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt MasterKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile'
      Roles:
        - !Ref EC2InstanceRole

  # ==========================================
  # CloudTrail Configuration
  # ==========================================

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt MasterKMSKey.Arn

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
        - PolicyName: CloudTrailLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-trail'
      S3BucketName: !Ref LoggingBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationBucket.Arn}/'
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      KMSKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ==========================================
  # SNS Topic for Alarms
  # ==========================================

  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-security-alarms'
      DisplayName: Security and Compliance Alarms
      KmsMasterKeyId: !Ref MasterKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # CloudWatch Alarms
  # ==========================================

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-unauthorized-api-calls'
      AlarmDescription: 'Alarm when unauthorized API calls are detected'
      MetricName: UnauthorizedAPICalls
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: notBreaching

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-root-account-usage'
      AlarmDescription: 'Alarm when root account is used'
      MetricName: RootAccountUsage
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: notBreaching

  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'

  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricName: RootAccountUsage
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'

  # ==========================================
  # AWS Config
  # ==========================================

  ConfigRecorderRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: S3BucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt LoggingBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${LoggingBucket.Arn}/*'
                Condition:
                  StringLike:
                    's3:x-amz-acl': bucket-owner-full-control

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-config-recorder'
      RoleArn: !GetAtt ConfigRecorderRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-config-delivery'
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: 'config/'
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  # ==========================================
  # AWS Config Rules
  # ==========================================

  S3BucketPublicReadProhibited:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-s3-public-read-prohibited'
      Description: 'Checks that S3 buckets do not allow public read access'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  S3BucketSSLRequestsOnly:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-s3-ssl-requests-only'
      Description: 'Checks that S3 bucket policies require SSL'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SSL_REQUESTS_ONLY

  S3BucketEncryption:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-s3-encryption-enabled'
      Description: 'Checks that S3 buckets have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_DEFAULT_ENCRYPTION_KMS

  EBSEncryption:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-ebs-encrypted-volumes'
      Description: 'Checks that EBS volumes are encrypted'
      Source:
        Owner: AWS
        SourceIdentifier: EC2_EBS_ENCRYPTION_BY_DEFAULT

  RequiredTags:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-required-tags'
      Description: 'Checks that resources contain required tags'
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - 'AWS::EC2::Instance'
          - 'AWS::EC2::Volume'
          - 'AWS::EC2::SecurityGroup'
          - 'AWS::S3::Bucket'
      InputParameters: !Sub |
        {
          "tag1Key": "Project",
          "tag2Key": "Environment"
        }

  # ==========================================
  # EBS Default Encryption
  # ==========================================

  EnableEBSEncryptionByDefault:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-enable-ebs-encryption'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt EnableEBSEncryptionRole.Arn
      Code:
        ZipFile: |
          import boto3
          import json
          import cfnresponse

          def handler(event, context):
              try:
                  ec2 = boto3.client('ec2')
                  
                  if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                      # Enable EBS encryption by default
                      response = ec2.enable_ebs_encryption_by_default()
                      
                      # Set the default KMS key
                      if 'KmsKeyId' in event['ResourceProperties']:
                          ec2.put_ebs_encryption_by_default(
                              DefaultKmsKeyId=event['ResourceProperties']['KmsKeyId']
                          )
                      
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Status': 'Enabled'})
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Status': 'No action taken'})
                      
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  EnableEBSEncryptionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: EBSEncryptionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:EnableEbsEncryptionByDefault'
                  - 'ec2:ModifyEbsDefaultKmsKeyId'
                  - 'ec2:GetEbsEncryptionByDefault'
                  - 'ec2:GetEbsDefaultKmsKeyId'
                  - 'ec2:DisableEbsEncryptionByDefault'
                  - 'ec2:ResetEbsDefaultKmsKeyId'
                Resource: '*'

  InvokeEBSEncryption:
    Type: Custom::EnableEBSEncryption
    Properties:
      ServiceToken: !GetAtt EnableEBSEncryptionByDefault.Arn
      KmsKeyId: !GetAtt MasterKMSKey.Arn

  # ==========================================
  # Security Groups
  # ==========================================

  DefaultSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Default security group with restricted access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !GetAtt VPC.CidrBlock
          Description: 'Allow HTTPS within VPC'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow outbound HTTPS'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-default-sg'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-2-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-2-id'

  KMSKeyId:
    Description: 'Master KMS Key ID'
    Value: !Ref MasterKMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-id'

  KMSKeyArn:
    Description: 'Master KMS Key ARN'
    Value: !GetAtt MasterKMSKey.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-arn'

  EC2InstanceProfileName:
    Description: 'EC2 Instance Profile Name'
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ec2-instance-profile'

  ApplicationBucketName:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-app-bucket'

  LoggingBucketName:
    Description: 'Logging S3 Bucket Name'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-log-bucket'

  SecurityGroupId:
    Description: 'Default Security Group ID'
    Value: !Ref DefaultSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-default-sg-id'

  AlarmTopicArn:
    Description: 'SNS Topic ARN for Security Alarms'
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${ProjectName}-${Environment}-alarm-topic-arn'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudtrail-arn'

  ConfigRecorderName:
    Description: 'AWS Config Recorder Name'
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${ProjectName}-${Environment}-config-recorder'
```

## Key Features Implemented

### 1. **Network Architecture**

- Multi-AZ VPC deployment with public and private subnets for high availability
- VPC Flow Logs enabled with KMS encryption for comprehensive network monitoring
- Internet Gateway and route tables properly configured

### 2. **Encryption at Rest**

- Master KMS key for all encryption operations
- S3 buckets with server-side encryption using KMS
- EBS volumes encrypted by default through Lambda custom resource
- CloudTrail and CloudWatch logs encrypted with KMS

### 3. **IAM Security**

- EC2 role with least-privilege S3 access restricted by resource tags
- Separate roles for CloudTrail, Config, and VPC Flow Logs
- Tag-based access control implementation

### 4. **Monitoring & Auditing**

- CloudTrail configured for all regions with log file validation
- CloudWatch alarms for unauthorized API calls and root account usage
- VPC Flow Logs for network traffic analysis
- Metric filters for security event detection

### 5. **Compliance Controls**

- AWS Config rules checking:
  - S3 bucket public access prevention
  - SSL-only S3 access
  - S3 and EBS encryption enforcement
  - Required tag compliance
- Config snapshots delivered daily

### 6. **Consistent Tagging**

- All resources tagged with Project and Environment
- Follows `project-environment` naming convention
- Tag-based compliance rules enforced

## Deployment Instructions

1. **Validate the template**:

```bash
aws cloudformation validate-template \
  --template-body file://secure_compliance_infra.yaml \
  --region ca-central-1
```

2. **Deploy the stack**:

```bash
aws cloudformation create-stack \
  --stack-name secure-compliance-infrastructure \
  --template-body file://secure_compliance_infra.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=SecureInfra \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ca-central-1
```

3. **Monitor deployment**:

```bash
aws cloudformation describe-stacks \
  --stack-name secure-compliance-infrastructure \
  --region ca-central-1 \
  --query 'Stacks[0].StackStatus'
```

## Security Best Practices Implemented

- **Defense in depth**: Multiple layers of security controls
- **Least privilege access**: IAM roles with minimal required permissions
- **Encryption everywhere**: All data at rest encrypted with KMS
- **Comprehensive logging**: All API calls, network traffic, and configuration changes logged
- **Automated compliance**: Config rules automatically check compliance status
- **Alert on anomalies**: CloudWatch alarms for suspicious activities
- **Version control**: S3 versioning enabled for data protection
- **Network segmentation**: Public and private subnet separation

This template provides a production-ready foundation for secure and compliant AWS infrastructure that can be extended based on specific organizational requirements.
