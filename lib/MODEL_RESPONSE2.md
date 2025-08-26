AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with IAM cross-account roles, encrypted S3 buckets, CloudTrail, and VPC Flow Logs'

Parameters:
  TrustedAccountId:
    Type: String
    Description: 'AWS Account ID that will be trusted for cross-account access'
    AllowedPattern: '[0-9]{12}'
    ConstraintDescription: 'Must be a valid 12-digit AWS Account ID'
  
  ExternalId:
    Type: String
    Description: 'External ID for additional security in cross-account role assumption'
    MinLength: 8
    MaxLength: 1224
    NoEcho: true
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

Resources:
  # ========================================
  # KMS Keys for Encryption
  # ========================================
  
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
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
            Resource: '*'
          - Sid: Allow VPC Flow Logs to encrypt logs
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
      KeyRotationEnabled: true

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secure-infrastructure-s3-key
      TargetKeyId: !Ref S3KMSKey

  # ========================================
  # IAM Roles and Policies
  # ========================================

  CrossAccountRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureCrossAccountRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${TrustedAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': !Ref ExternalId
              Bool:
                'aws:SecureTransport': 'true'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Policies:
        - PolicyName: SecureCrossAccountPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${CloudTrailBucket}/*'
                  - !GetAtt CloudTrailBucket.Arn
              - Effect: Deny
                Action: '*'
                Resource: '*'
                Condition:
                  Bool:
                    'aws:SecureTransport': 'false'
      Tags:
        - Key: Purpose
          Value: CrossAccountAccess
        - Key: Security
          Value: High

  # ========================================
  # S3 Buckets with Encryption
  # ========================================

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
      Tags:
        - Key: Purpose
          Value: CloudTrailLogs
        - Key: Encryption
          Value: KMS

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
            Resource: !GetAtt CloudTrailBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureInfrastructureTrail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureInfrastructureTrail'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt CloudTrailBucket.Arn
              - !Sub '${CloudTrailBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  VPCFlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-vpc-flow-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
      Tags:
        - Key: Purpose
          Value: VPCFlowLogs
        - Key: Encryption
          Value: KMS

  VPCFlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref VPCFlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSVPCFlowLogsAclCheck
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt VPCFlowLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSVPCFlowLogsWrite
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${VPCFlowLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSVPCFlowLogsListBucket
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt VPCFlowLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt VPCFlowLogsBucket.Arn
              - !Sub '${VPCFlowLogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ========================================
  # CloudWatch Log Groups
  # ========================================

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudtrail/secure-infrastructure
      RetentionInDays: 90

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/vpc/flowlogs
      RetentionInDays: 30

  # ========================================
  # CloudTrail Configuration
  # ========================================

  SecureCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: SecureInfrastructureTrail
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref S3KMSKey
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailCloudWatchLogsRole.Arn
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
      Tags:
        - Key: Purpose
          Value: SecurityAuditing
        - Key: Compliance
          Value: Required

  CloudTrailCloudWatchLogsRole:
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
        - PolicyName: CloudTrailCloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:PutLogEvents'
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                Resource: !Sub '${CloudTrailLogGroup}:*'

  # ========================================
  # VPC and Networking
  # ========================================

  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureInfrastructureVPC
        - Key: Purpose
          Value: SecureInfrastructure

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: PrivateSubnet1
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: PrivateSubnet2
        - Key: Type
          Value: Private

  # ========================================
  # VPC Flow Logs - FIXED VERSION
  # ========================================

  VPCFlowLogsToS3:
    Type: AWS::EC2::FlowLog
    DependsOn: VPCFlowLogsBucketPolicy
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !Sub '${VPCFlowLogsBucket}/AWSLogs/'
      LogFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}'
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: SecureVPCFlowLogs
        - Key: Purpose
          Value: SecurityMonitoring

  VPCFlowLogsRole:
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
        - PolicyName: VPCFlowLogsDeliveryRolePolicy
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
                Resource: !Sub '${VPCFlowLogsLogGroup}:*'

  VPCFlowLogsToCloudWatch:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: SecureVPCFlowLogsCloudWatch
        - Key: Purpose
          Value: RealTimeMonitoring

  # ========================================
  # Security Groups
  # ========================================

  DefaultSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Default security group with restrictive rules'
      VpcId: !Ref SecureVPC
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
          Description: 'HTTP outbound'
      Tags:
        - Key: Name
          Value: DefaultSecurityGroup
        - Key: Purpose
          Value: RestrictiveDefault

Outputs:
  CrossAccountRoleArn:
    Description: 'ARN of the cross-account IAM role'
    Value: !GetAtt CrossAccountRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CrossAccountRoleArn'

  CloudTrailBucketName:
    Description: 'Name of the CloudTrail S3 bucket'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucket'

  VPCFlowLogsBucketName:
    Description: 'Name of the VPC Flow Logs S3 bucket'
    Value: !Ref VPCFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLogsBucket'

  VPCId:
    Description: 'ID of the secure VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  KMSKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref S3KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt SecureCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  VPCFlowLogsS3Destination:
    Description: 'S3 destination for VPC Flow Logs'
    Value: !Sub '${VPCFlowLogsBucket}/AWSLogs/'
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLogsDestination'