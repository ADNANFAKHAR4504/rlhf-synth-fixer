```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-grade baseline infrastructure for high-profile sensitive applications'

Parameters:
  AllowedIpRanges:
    Type: CommaDelimitedList
    Default: "203.0.113.0/24,198.51.100.10/32"
    Description: List of CIDR blocks allowed for ingress traffic
    
  ACMCertificateArn:
    Type: String
    Description: ARN of ACM certificate for HTTPS listener
    AllowedPattern: "arn:aws:acm:.*"
    
  HostedZoneName:
    Type: String
    Default: "example.com."
    Description: Domain name for Route 53 hosted zone (must end with dot)
    AllowedPattern: ".*\\.$"
    
  Environment:
    Type: String
    Default: "Production"
    Description: Environment tag value
    AllowedValues: ["Production", "Staging", "Development"]

Resources:
  # KMS Key for encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting resources
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: "*"
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub "logs.${AWS::Region}.amazonaws.com"
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
          - Sid: Allow Config
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: "*"
          - Sid: Allow S3
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: "*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${AWS::StackName}-encryption-key"
      TargetKeyId: !Ref EncryptionKey

  # Route 53 DNSSEC KMS Key
  DNSSECKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Route 53 DNSSEC
      KeySpec: ECC_NIST_P256
      KeyUsage: SIGN_VERIFY
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow Route 53 DNSSEC
            Effect: Allow
            Principal:
              Service: dnssec-route53.amazonaws.com
            Action:
              - kms:DescribeKey
              - kms:GetPublicKey
              - kms:Sign
            Resource: "*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DNSSECKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${AWS::StackName}-dnssec-key"
      TargetKeyId: !Ref DNSSECKey

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-vpc"
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-public-subnet-1"
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-public-subnet-2"
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-igw"
        - Key: Environment
          Value: !Ref Environment

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
        - Key: Name
          Value: !Sub "${AWS::StackName}-public-rt"
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Select [0, !Ref AllowedIpRanges]
          Description: HTTPS from allowed IP range 1
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Select [1, !Ref AllowedIpRanges]
          Description: HTTPS from allowed IP range 2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-alb-sg"
        - Key: Environment
          Value: !Ref Environment

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Select [0, !Ref AllowedIpRanges]
          Description: SSH from allowed IP range 1
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Select [1, !Ref AllowedIpRanges]
          Description: SSH from allowed IP range 2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-instance-sg"
        - Key: Environment
          Value: !Ref Environment

  # S3 Buckets
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-access-logs-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AccessLogsBucket
      PolicyDocument:
        Statement:
          - Sid: S3ServerAccessLogsPolicy
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${AccessLogsBucket}/*"
            Condition:
              ArnEquals:
                "aws:SourceArn": !Sub "${ApplicationBucket}"
              StringEquals:
                "aws:SourceAccount": !Ref AWS::AccountId

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-application-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: application-bucket-logs/
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref CloudWatchLogGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-cloudtrail-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: cloudtrail-bucket-logs/
      Tags:
        - Key: Environment
          Value: !Ref Environment

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${CloudTrailBucket}"
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-trail"
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": bucket-owner-full-control
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-trail"

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-config-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: config-bucket-logs/
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${ConfigBucket}"
            Condition:
              StringEquals:
                "AWS:SourceAccount": !Ref AWS::AccountId
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub "${ConfigBucket}"
            Condition:
              StringEquals:
                "AWS:SourceAccount": !Ref AWS::AccountId
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${ConfigBucket}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": bucket-owner-full-control
                "AWS:SourceAccount": !Ref AWS::AccountId

  # CloudWatch Log Groups
  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/${AWS::StackName}/application"
      RetentionInDays: 30
      KmsKeyId: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/${AWS::StackName}/cloudtrail"
      RetentionInDays: 90
      KmsKeyId: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/${AWS::StackName}/vpcflowlogs"
      RetentionInDays: 30
      KmsKeyId: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub "${CloudWatchLogGroup}:*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "${CloudTrailLogGroup}:*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigDeliveryPermissions
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !Sub "${ConfigBucket}"
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub "${ConfigBucket}/*"
                Condition:
                  StringEquals:
                    "s3:x-amz-acl": bucket-owner-full-control
              - Effect: Allow
                Action: s3:GetObject
                Resource: !Sub "${ConfigBucket}/*"
              - Effect: Allow
                Action: sns:Publish
                Resource: !Ref ConfigTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment

  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogDeliveryRolePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub "${VPCFlowLogGroup}:*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # MFA Enforcement Policy
  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "${AWS::StackName}-MFA-Enforcement"
      Description: Enforces MFA for all actions except MFA setup
      PolicyDocument:
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:GetAccountSummary
              - iam:ListVirtualMFADevices
            Resource: "*"
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: !Sub "arn:aws:iam::${AWS::AccountId}:user/${aws:username}"
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - iam:CreateVirtualMFADevice
              - iam:DeleteVirtualMFADevice
              - iam:EnableMFADevice
              - iam:ListMFADevices
              - iam:ResyncMFADevice
            Resource:
              - !Sub "arn:aws:iam::${AWS::AccountId}:mfa/${aws:username}"
              - !Sub "arn:aws:iam::${AWS::AccountId}:user/${aws:username}"
          - Sid: DenyAllExceptUnlessSignedInWithMFA
            Effect: Deny
            NotAction:
              - iam:CreateVirtualMFADevice
              - iam:EnableMFADevice
              - iam:GetUser
              - iam:ListMFADevices
              - iam:ListVirtualMFADevices
              - iam:ResyncMFADevice
              - sts:GetSessionToken
              - iam:ChangePassword
              - iam:GetAccountPasswordPolicy
              - iam:GetAccountSummary
            Resource: "*"
            Condition:
              BoolIfExists:
                "aws:MultiFactorAuthPresent": "false"

  AllUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub "${AWS::StackName}-AllUsers"
      ManagedPolicyArns:
        - !Ref MFAEnforcementPolicy

  # EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-kernel-5.10-hvm-x86_64-gp3}}"
      InstanceType: t3.micro
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref InstanceSecurityGroup
      SubnetId: !Ref PublicSubnet1
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 8
            Encrypted: true
            KmsKeyId: !Ref EncryptionKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-instance"
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::EC2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-alb"
        - Key: Environment
          Value: !Ref Environment

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-tg"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      Tags:
        - Key: Environment
          Value: !Ref Environment

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificateArn

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${AWS::StackName}-trail"
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: cloudtrail-logs
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      KMSKeyId: !Ref EncryptionKey
      CloudWatchLogsLogGroupArn: !Sub "${CloudTrailLogGroup}:*"
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: "AWS::S3::Object"
              Values:
                - !Sub "${ApplicationBucket}/*"
                - !Sub "${ConfigBucket}/*"
                - !Sub "${CloudTrailBucket}/*"
                - !Sub "${AccessLogsBucket}/*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # AWS Config
  ConfigTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${AWS::StackName}-config-topic"
      KmsMasterKeyId: !Ref EncryptionKey
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub "${AWS::StackName}-recorder"
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub "${AWS::StackName}-delivery-channel"
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: config
      SnsTopicARN: !Ref ConfigTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: Daily

  # Config Rules
  S3BucketLoggingEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-logging-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_LOGGING_ENABLED

  S3BucketSSEEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  CloudTrailEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: cloud-trail-enabled
      Source:
        Owner: AWS
        SourceIdentifier: CLOUD_TRAIL_ENABLED

  VPCFlowLogsEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: vpc-flow-logs-enabled
      Source:
        Owner: AWS
        SourceIdentifier: VPC_FLOW_LOGS_ENABLED

  IAMUserMFAEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: iam-user-mfa-enabled
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED

  RestrictedSSHRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: incoming-ssh-disabled
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED

  # VPC Flow Logs
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
        - Key: Environment
          Value: !Ref Environment

  # Route 53 Hosted Zone and DNSSEC
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref HostedZoneName
      HostedZoneConfig:
        Comment: !Sub "Hosted zone for ${HostedZoneName}"
      HostedZoneTags:
        - Key: Environment
          Value: !Ref Environment

  KeySigningKey:
    Type: AWS::Route53::KeySigningKey
    Properties:
      HostedZoneId: !Ref HostedZone
      KeyManagementServiceArn: !GetAtt DNSSECKey.Arn
      Name: !Sub "${AWS::StackName}-ksk"
      Status: ACTIVE

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPC-ID"

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-DNS"

  InstanceId:
    Description: EC2 Instance ID
    Value: !Ref EC2Instance
    Export:
      Name: !Sub "${AWS::StackName}-Instance-ID"

  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: