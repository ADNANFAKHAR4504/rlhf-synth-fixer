```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure AWS environment in us-west-2 with comprehensive security controls'

Metadata:
  cfn-lint:
    config:
      ignore_checks:
        - W1030

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [production, staging, development]
    Description: Deployment environment

  Owner:
    Type: String
    Default: security-team
    Description: Owner/team for tagging

  TrustedCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: CIDR block for trusted SSH access
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$'

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$'

  KeyPairName:
    Type: String
    Default: ''
    Description: EC2 Key Pair for SSH access (optional)

  SecondAvailabilityZone:
    Type: String
    Default: ''
    Description: Optional explicit second Availability Zone (e.g., us-east-1b). If empty, fallback is used.

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
    Description: Latest Amazon Linux 2023 AMI

  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: Database administrator username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  ExistingKMSKeyArn:
    Type: String
    Default: ''
    Description: Optional existing KMS Key ARN to reuse

  ExistingVPCId:
    Type: String
    Default: ''
    Description: Optional existing VPC ID to reuse

  ExistingInternetGatewayId:
    Type: String
    Default: ''
    Description: Optional existing Internet Gateway ID to reuse

  ExistingPublicSubnetId:
    Type: String
    Default: ''
    Description: Optional existing Public Subnet ID to reuse

  ExistingPrivateSubnetId:
    Type: String
    Default: ''
    Description: Optional existing Private Subnet ID to reuse

  ExistingNatGatewayId:
    Type: String
    Default: ''
    Description: Optional existing NAT Gateway ID to reuse

  ExistingDatabaseSubnet1Id:
    Type: String
    Default: ''
    Description: Optional existing Database Subnet 1 ID to reuse

  ExistingDatabaseSubnet2Id:
    Type: String
    Default: ''
    Description: Optional existing Database Subnet 2 ID to reuse

  ExistingDatabaseSubnetGroupName:
    Type: String
    Default: ''
    Description: Optional existing Database Subnet Group name to reuse

  ExistingDatabaseSecretArn:
    Type: String
    Default: ''
    Description: Optional existing Database Secret ARN to reuse

  ExistingDatabaseInstanceId:
    Type: String
    Default: ''
    Description: Optional existing Database Instance ID to reuse

  ExistingBackupVaultName:
    Type: String
    Default: ''
    Description: Optional existing Backup Vault name to reuse

  ExistingCloudTrailName:
    Type: String
    Default: ''
    Description: Optional existing CloudTrail name to reuse

  ExistingCloudTrailBucketName:
    Type: String
    Default: ''
    Description: Optional existing CloudTrail Bucket name to reuse

  ExistingConfigBucketName:
    Type: String
    Default: ''
    Description: Optional existing Config Bucket name to reuse

  ExistingGuardDutyDetectorId:
    Type: String
    Default: ''
    Description: Optional existing GuardDuty Detector ID to reuse

  ExistingLambdaFunctionName:
    Type: String
    Default: ''
    Description: Optional existing Lambda Function name to reuse

  ExistingEC2InstanceId:
    Type: String
    Default: ''
    Description: Optional existing EC2 Instance ID to reuse

  ExistingBillingAlarmName:
    Type: String
    Default: ''
    Description: Optional existing CloudWatch Billing Alarm name to reuse

  ExistingConfigDeliveryChannelName:
    Type: String
    Default: ''
    Description: Optional existing AWS Config Delivery Channel name to reuse

  ExistingConfigRecorderName:
    Type: String
    Default: ''
    Description: Optional existing AWS Config Configuration Recorder name to reuse

  EnableConfigDeliveryChannel:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Set to 'true' to create a new Config Delivery Channel if none exists

  EnableConfigRecorder:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Set to 'true' to create a new Config Configuration Recorder if none exists

  EnableEBSEncryption:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Whether to enable EBS encryption by default (true/false)

  ExistingWebServerSecurityGroupId:
    Type: String
    Default: ''
    Description: Optional existing Web Server Security Group ID to reuse

  ExistingDatabaseSecurityGroupId:
    Type: String
    Default: ''
    Description: Optional existing Database Security Group ID to reuse

  ExistingLambdaSecurityGroupId:
    Type: String
    Default: ''
    Description: Optional existing Lambda Security Group ID to reuse

  ExistingEC2RoleArn:
    Type: String
    Default: ''
    Description: Optional existing EC2 Role ARN to reuse

  ExistingEC2InstanceProfileArn:
    Type: String
    Default: ''
    Description: Optional existing EC2 Instance Profile ARN to reuse

  ExistingLambdaExecutionRoleArn:
    Type: String
    Default: ''
    Description: Optional existing Lambda Execution Role ARN to reuse

  ExistingSecureS3BucketName:
    Type: String
    Default: ''
    Description: Optional existing Secure S3 Bucket name to reuse

  ExistingS3AccessLogsBucketName:
    Type: String
    Default: ''
    Description: Optional existing S3 Access Logs Bucket name to reuse

Conditions:
  # KMS Conditions
  UseExistingKMS: !Not [!Equals [!Ref ExistingKMSKeyArn, '']]
  CreateKMS: !Equals [!Ref ExistingKMSKeyArn, '']

  HasSecondAZ: !Not [!Equals [!Ref SecondAvailabilityZone, '']]
  HasTwoSubnetAZs: !Or
    - Condition: HasSecondAZ
    - Condition: UseExistingDatabaseSubnet1
    - Condition: UseExistingDatabaseSubnet2

  # VPC Conditions
  CreateVPC: !Equals [!Ref ExistingVPCId, '']
  UseExistingInternetGateway:
    !Not [!Equals [!Ref ExistingInternetGatewayId, '']]
  CreateInternetGateway: !Equals [!Ref ExistingInternetGatewayId, '']
  UseExistingPublicSubnet: !Not [!Equals [!Ref ExistingPublicSubnetId, '']]
  CreatePublicSubnet: !Equals [!Ref ExistingPublicSubnetId, '']
  UseExistingPrivateSubnet: !Not [!Equals [!Ref ExistingPrivateSubnetId, '']]
  CreatePrivateSubnet: !Equals [!Ref ExistingPrivateSubnetId, '']
  UseExistingDatabaseSubnet1:
    !Not [!Equals [!Ref ExistingDatabaseSubnet1Id, '']]
  CreateDatabaseSubnet1: !Equals [!Ref ExistingDatabaseSubnet1Id, '']
  UseExistingDatabaseSubnet2:
    !Not [!Equals [!Ref ExistingDatabaseSubnet2Id, '']]
  CreateDatabaseSubnet2: !Equals [!Ref ExistingDatabaseSubnet2Id, '']
  UseExistingNatGateway: !Not [!Equals [!Ref ExistingNatGatewayId, '']]
  CreateNatGateway: !Equals [!Ref ExistingNatGatewayId, '']

  # Security Group Conditions
  UseExistingWebServerSecurityGroup:
    !Not [!Equals [!Ref ExistingWebServerSecurityGroupId, '']]
  CreateWebServerSecurityGroup:
    !Equals [!Ref ExistingWebServerSecurityGroupId, '']
  UseExistingDatabaseSecurityGroup:
    !Not [!Equals [!Ref ExistingDatabaseSecurityGroupId, '']]
  CreateDatabaseSecurityGroup:
    !Equals [!Ref ExistingDatabaseSecurityGroupId, '']
  UseExistingLambdaSecurityGroup:
    !Not [!Equals [!Ref ExistingLambdaSecurityGroupId, '']]
  CreateLambdaSecurityGroup: !Equals [!Ref ExistingLambdaSecurityGroupId, '']

  # IAM Conditions
  UseExistingEC2Role: !Not [!Equals [!Ref ExistingEC2RoleArn, '']]
  CreateEC2Role: !Equals [!Ref ExistingEC2RoleArn, '']
  UseExistingEC2InstanceProfile:
    !Not [!Equals [!Ref ExistingEC2InstanceProfileArn, '']]
  CreateEC2InstanceProfile: !Equals [!Ref ExistingEC2InstanceProfileArn, '']
  UseExistingLambdaExecutionRole:
    !Not [!Equals [!Ref ExistingLambdaExecutionRoleArn, '']]
  CreateLambdaExecutionRole: !Equals [!Ref ExistingLambdaExecutionRoleArn, '']

  # S3 Conditions
  UseExistingSecureS3Bucket:
    !Not [!Equals [!Ref ExistingSecureS3BucketName, '']]
  CreateSecureS3Bucket: !Equals [!Ref ExistingSecureS3BucketName, '']
  UseExistingS3AccessLogsBucket:
    !Not [!Equals [!Ref ExistingS3AccessLogsBucketName, '']]
  CreateS3AccessLogsBucket: !Equals [!Ref ExistingS3AccessLogsBucketName, '']

  # RDS Conditions
  UseExistingDatabaseSubnetGroup:
    !Not [!Equals [!Ref ExistingDatabaseSubnetGroupName, '']]
  UseExistingDatabaseSecret: !Not [!Equals [!Ref ExistingDatabaseSecretArn, '']]
  CreateDatabaseSecret: !Equals [!Ref ExistingDatabaseSecretArn, '']
  UseExistingDatabaseInstance:
    !Not [!Equals [!Ref ExistingDatabaseInstanceId, '']]

  # Backup Conditions
  UseExistingBackupVault: !Not [!Equals [!Ref ExistingBackupVaultName, '']]
  CreateBackupVault: !Equals [!Ref ExistingBackupVaultName, '']
  EnableBackup: !Or
    - Condition: CreateBackupVault
    - Condition: UseExistingBackupVault

  # CloudTrail Conditions
  UseExistingCloudTrail: !Not [!Equals [!Ref ExistingCloudTrailName, '']]
  CreateCloudTrail: !Equals [!Ref ExistingCloudTrailName, '']
  UseExistingCloudTrailBucket:
    !Not [!Equals [!Ref ExistingCloudTrailBucketName, '']]
  CreateCloudTrailBucket: !Equals [!Ref ExistingCloudTrailBucketName, '']
  CreateCloudTrailBucketPolicy:
    !And [Condition: CreateCloudTrailBucket, Condition: CreateCloudTrail]

  # Config Conditions
  UseExistingConfigBucket: !Not [!Equals [!Ref ExistingConfigBucketName, '']]
  CreateConfigBucket: !Equals [!Ref ExistingConfigBucketName, '']
  UseExistingConfigRecorder:
    !Not [!Equals [!Ref ExistingConfigRecorderName, '']]
  CreateConfigRecorder:
    !And [
      !Equals [!Ref ExistingConfigRecorderName, ''],
      !Equals [!Ref EnableConfigRecorder, 'true'],
      Condition: CreateConfigBucket,
    ]
  CreateConfigDeliveryChannel:
    !And [
      !Equals [!Ref ExistingConfigDeliveryChannelName, ''],
      !Equals [!Ref ExistingConfigBucketName, ''],
      !Equals [!Ref EnableConfigDeliveryChannel, 'true'],
    ]

  # Other Service Conditions
  UseExistingGuardDutyDetector:
    !Not [!Equals [!Ref ExistingGuardDutyDetectorId, '']]
  CreateGuardDutyDetector: !Equals [!Ref ExistingGuardDutyDetectorId, '']
  UseExistingLambdaFunction:
    !Not [!Equals [!Ref ExistingLambdaFunctionName, '']]
  CreateLambdaFunction: !Equals [!Ref ExistingLambdaFunctionName, '']
  UseExistingEC2Instance: !Not [!Equals [!Ref ExistingEC2InstanceId, '']]
  CreateEC2Instance: !Equals [!Ref ExistingEC2InstanceId, '']

  # Billing Alarm Conditions
  UseExistingBillingAlarm: !Not [!Equals [!Ref ExistingBillingAlarmName, '']]
  CreateBillingAlarm: !Equals [!Ref ExistingBillingAlarmName, '']

  # General Conditions
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

  EnableBackupAndHasTwoAZs:
    !And [Condition: EnableBackup, Condition: HasTwoSubnetAZs]
  ShouldEnableEBSEncryption: !Equals [!Ref EnableEBSEncryption, 'true']

Resources:
  # =========================
  # KMS Key for Encryption
  # =========================
  SecureKMSKey:
    Condition: CreateKMS
    Type: AWS::KMS::Key
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Description: KMS Key for secure environment encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowServices
            Effect: Allow
            Principal:
              Service:
                - cloudtrail.amazonaws.com
                - s3.amazonaws.com
                - rds.amazonaws.com
                - backup.amazonaws.com
                - lambda.amazonaws.com
                - !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  SecureKMSKeyAlias:
    Condition: CreateKMS
    Type: AWS::KMS::Alias
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AliasName: !Sub
        - 'alias/secure-environment-key-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      TargetKeyId: !Ref SecureKMSKey

  # =========================
  # VPC Configuration
  # =========================
  SecureVPC:
    Condition: CreateVPC
    Type: AWS::EC2::VPC
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'SecureVPC-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Condition: CreateInternetGateway
    Type: AWS::EC2::InternetGateway
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'SecureVPC-IGW-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Condition: CreateVPC
    Type: AWS::EC2::VPCGatewayAttachment
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      InternetGatewayId:
        !If [
          UseExistingInternetGateway,
          !Ref ExistingInternetGatewayId,
          !Ref InternetGateway,
        ]
      VpcId: !Ref SecureVPC

  # Subnets (public and private)
  PublicSubnet:
    Condition: CreatePublicSubnet
    Type: AWS::EC2::Subnet
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Public Subnet-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet:
    Condition: CreatePrivateSubnet
    Type: AWS::EC2::Subnet
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Private Subnet-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSubnet1:
    Condition: CreateDatabaseSubnet1
    Type: AWS::EC2::Subnet
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Database Subnet 1-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSubnet2:
    Condition: CreateDatabaseSubnet2
    Type: AWS::EC2::Subnet
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      AvailabilityZone:
        !If [HasSecondAZ, !Ref SecondAvailabilityZone, !Select [0, !GetAZs '']]
      CidrBlock: !Select [4, !Cidr [!Ref VpcCIDR, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Database Subnet 2-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateway for private subnets
  NatGatewayEIP:
    Condition: CreateNatGateway
    Type: AWS::EC2::EIP
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway:
    Condition: CreateNatGateway
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId:
        !If [
          UseExistingPublicSubnet,
          !Ref ExistingPublicSubnetId,
          !Ref PublicSubnet,
        ]
      Tags:
        - Key: Name
          Value: !Sub 'NAT Gateway-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Condition: CreateVPC
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'Public Route Table-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DefaultPublicRoute:
    Condition: CreateVPC
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId:
        !If [
          UseExistingInternetGateway,
          !Ref ExistingInternetGatewayId,
          !Ref InternetGateway,
        ]

  PublicSubnetRouteTableAssociation:
    Condition: CreateVPC
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId:
        !If [
          UseExistingPublicSubnet,
          !Ref ExistingPublicSubnetId,
          !Ref PublicSubnet,
        ]

  PrivateRouteTable:
    Condition: CreateVPC
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'Private Route Table-${Environment}-${AWS::StackName}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DefaultPrivateRoute:
    Condition: CreateVPC
    Type: AWS::EC2::Route
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        !If [UseExistingNatGateway, !Ref ExistingNatGatewayId, !Ref NatGateway]

  PrivateSubnetRouteTableAssociation:
    Condition: CreateVPC
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId:
        !If [
          UseExistingPrivateSubnet,
          !Ref ExistingPrivateSubnetId,
          !Ref PrivateSubnet,
        ]

  # VPC Flow Logs
  VPCFlowLogRole:
    Condition: CreateVPC
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: flowlogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  VPCFlowLogGroup:
    Condition: CreateVPC
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      LogGroupName: !Sub
        - '/aws/vpc/flowlogs/${Environment}-${AWS::StackName}-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      RetentionInDays: 30
      KmsKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  VPCFlowLog:
    Condition: CreateVPC
    Type: AWS::EC2::FlowLog
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # Security Groups
  # =========================
  WebServerSecurityGroup:
    Condition: CreateWebServerSecurityGroup
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      GroupName: !Sub 'WebServerSecurityGroup-${Environment}-${AWS::StackName}'
      GroupDescription: Security group for web servers
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedCIDR
          Description: SSH access from trusted CIDR
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'WebServerSecurityGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecurityGroup:
    Condition: CreateDatabaseSecurityGroup
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      GroupName: !Sub 'DatabaseSecurityGroup-${Environment}-${AWS::StackName}'
      GroupDescription: Security group for database servers
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId:
            !If [
              UseExistingWebServerSecurityGroup,
              !Ref ExistingWebServerSecurityGroupId,
              !Ref WebServerSecurityGroup,
            ]
          Description: MySQL access from web servers
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSecurityGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  LambdaSecurityGroup:
    Condition: CreateLambdaSecurityGroup
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      GroupName: !Sub 'LambdaSecurityGroup-${Environment}-${AWS::StackName}'
      GroupDescription: Security group for Lambda functions
      VpcId: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS outbound
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId:
            !If [
              UseExistingDatabaseSecurityGroup,
              !Ref ExistingDatabaseSecurityGroupId,
              !Ref DatabaseSecurityGroup,
            ]
          Description: Database access
      Tags:
        - Key: Name
          Value: !Sub 'LambdaSecurityGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # IAM Roles and Policies
  # =========================
  EC2Role:
    Condition: CreateEC2Role
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  !If [
                    UseExistingSecureS3Bucket,
                    !Sub 'arn:aws:s3:::${ExistingSecureS3BucketName}/*',
                    !Sub '${SecureS3Bucket.Arn}/*',
                  ]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Condition: CreateEC2InstanceProfile
    Type: AWS::IAM::InstanceProfile
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Roles:
        - !If [UseExistingEC2Role, !Ref ExistingEC2RoleArn, !Ref EC2Role]

  LambdaExecutionRole:
    Condition: CreateLambdaExecutionRole
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource:
                  !If [
                    UseExistingKMS,
                    !Ref ExistingKMSKeyArn,
                    !GetAtt SecureKMSKey.Arn,
                  ]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # S3 Buckets with Encryption
  # =========================
  SecureS3Bucket:
    Condition: CreateSecureS3Bucket
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub
        - 'secure-${AWS::AccountId}-${AWS::Region}-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName:
          !If [
            UseExistingS3AccessLogsBucket,
            !Ref ExistingS3AccessLogsBucketName,
            !Ref S3AccessLogsBucket,
          ]
        LogFilePrefix: access-logs/
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'SecureS3Bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3AccessLogsBucket:
    Condition: CreateS3AccessLogsBucket
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub
        - 'logs-${AWS::AccountId}-${AWS::Region}-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
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
        - Key: Name
          Value: !Sub 'S3AccessLogsBucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # S3 Bucket Policy to enforce TLS
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Bucket:
        !If [
          UseExistingSecureS3Bucket,
          !Ref ExistingSecureS3BucketName,
          !Ref SecureS3Bucket,
        ]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !If [
                  UseExistingSecureS3Bucket,
                  !Sub 'arn:aws:s3:::${ExistingSecureS3BucketName}',
                  !GetAtt SecureS3Bucket.Arn,
                ]
              - !If [
                  UseExistingSecureS3Bucket,
                  !Sub 'arn:aws:s3:::${ExistingSecureS3BucketName}/*',
                  !Sub '${SecureS3Bucket.Arn}/*',
                ]
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  # =========================
  # RDS Database with Backup
  # =========================
  DatabaseSubnetGroup:
    Condition: HasTwoSubnetAZs
    Type: AWS::RDS::DBSubnetGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      DBSubnetGroupName: !Sub 'DatabaseSubnetGroup-${Environment}-${AWS::StackName}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !If [
            UseExistingDatabaseSubnet1,
            !Ref ExistingDatabaseSubnet1Id,
            !Ref DatabaseSubnet1,
          ]
        - !If [
            UseExistingDatabaseSubnet2,
            !Ref ExistingDatabaseSubnet2Id,
            !Ref DatabaseSubnet2,
          ]
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSubnetGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecret:
    Condition: CreateDatabaseSecret
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Name: !Sub
        - 'production-database-password-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      Description: Database password for secure environment
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseInstance:
    Condition: HasTwoSubnetAZs
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      DBInstanceIdentifier: 'secure-database-production-tapstack'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword:
        !If [
          UseExistingDatabaseSecret,
          !Sub '{{resolve:secretsmanager:${ExistingDatabaseSecretArn}:SecretString:password}}',
          !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}',
        ]
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      VPCSecurityGroups:
        - !If [
            UseExistingDatabaseSecurityGroup,
            !Ref ExistingDatabaseSecurityGroupId,
            !Ref DatabaseSecurityGroup,
          ]
      DBSubnetGroupName:
        !If [
          UseExistingDatabaseSubnetGroup,
          !Ref ExistingDatabaseSubnetGroupName,
          !Ref DatabaseSubnetGroup,
        ]
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'SecureDatabase-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # AWS Backup for RDS
  BackupVault:
    Condition: CreateBackupVault
    Type: AWS::Backup::BackupVault
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BackupVaultName: !Sub
        - 'SecureBackupVault-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      EncryptionKeyArn:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      BackupVaultTags:
        Name: !Sub 'SecureBackupVault-${Environment}'
        Environment: !Ref Environment
        Owner: !Ref Owner

  BackupPlan:
    Condition: EnableBackup
    Type: AWS::Backup::BackupPlan
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BackupPlan:
        BackupPlanName: !Sub
          - 'SecureBackupPlan-production-tapstack-${Suffix}'
          - {
              Suffix:
                !Select [
                  0,
                  !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
                ],
            }
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault:
              !If [
                UseExistingBackupVault,
                !Ref ExistingBackupVaultName,
                !Ref BackupVault,
              ]
            ScheduleExpression: 'cron(0 2 ? * * *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
            RecoveryPointTags:
              Environment: !Ref Environment
              Owner: !Ref Owner

  BackupSelection:
    Condition: EnableBackupAndHasTwoAZs
    Type: AWS::Backup::BackupSelection
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: DatabaseBackupSelection
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !If [
              UseExistingDatabaseInstance,
              !Ref ExistingDatabaseInstanceId,
              !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${DatabaseInstance}',
            ]

  BackupRole:
    Condition: EnableBackup
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # CloudTrail for API Activity
  # =========================
  CloudTrailLogGroup:
    Condition: CreateCloudTrail
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      LogGroupName: !Sub
        - '/aws/cloudtrail/${Environment}-${AWS::StackName}-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      RetentionInDays: 90
      KmsKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailRole:
    Condition: CreateCloudTrail
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
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
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrail:
    Condition: CreateCloudTrail
    Type: AWS::CloudTrail::Trail
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      TrailName: !Sub
        - 'SecureEnvironmentTrail-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      S3BucketName:
        !If [
          UseExistingCloudTrailBucket,
          !Ref ExistingCloudTrailBucketName,
          !Ref CloudTrailBucket,
        ]
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      KMSKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
      IsLogging: true
      Tags:
        - Key: Name
          Value: !Sub 'SecureEnvironmentTrail-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailBucket:
    Condition: CreateCloudTrailBucket
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub
        - 'trail-${AWS::AccountId}-${AWS::Region}-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'CloudTrailBucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailBucketPolicy:
    Condition: CreateCloudTrailBucketPolicy
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
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub
                  - 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureEnvironmentTrail-production-tapstack-${Suffix}'
                  - {
                      Suffix:
                        !Select [
                          0,
                          !Split [
                            '-',
                            !Select [2, !Split ['/', !Ref 'AWS::StackId']],
                          ],
                        ],
                    }
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub
                  - 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureEnvironmentTrail-production-tapstack-${Suffix}'
                  - {
                      Suffix:
                        !Select [
                          0,
                          !Split [
                            '-',
                            !Select [2, !Split ['/', !Ref 'AWS::StackId']],
                          ],
                        ],
                    }

  # =========================
  # AWS Config for Compliance
  # =========================
  ConfigRole:
    Condition: CreateConfigBucket
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ConfigBucket.Arn}/*'
        - PolicyName: AWSConfigCorePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:BatchGet*
                  - config:Get*
                  - config:Describe*
                  - config:Put*
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ConfigBucket:
    Condition: CreateConfigBucket
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub
        - 'config-${AWS::AccountId}-${AWS::Region}-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
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
        - Key: Name
          Value: !Sub 'ConfigBucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ConfigBucketPolicy:
    Condition: CreateConfigBucket
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref AWS::AccountId

  ConfigurationRecorder:
    Condition: CreateConfigRecorder
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name:
        !Sub [
          'SecureEnvironmentRecorder-${Environment}-${AWS::StackName}-${Suffix}',
          {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          },
        ]
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Condition: CreateConfigDeliveryChannel
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name:
        !Sub [
          'SecureEnvironmentDeliveryChannel-${Environment}-${AWS::StackName}-${Suffix}',
          {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          },
        ]
      S3BucketName: !Ref ConfigBucket

  # Config Rules
  S3BucketPublicAccessProhibitedRule:
    Condition: CreateConfigRecorder
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 's3-bucket-public-access-prohibited-${Environment}-${AWS::StackName}'
      Description: Checks that your Amazon S3 buckets do not allow public read access
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_ACCESS_PROHIBITED

  RootAccessKeyCheckRule:
    Condition: CreateConfigRecorder
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'root-access-key-check-${Environment}-${AWS::StackName}'
      Description: Checks whether the root user access key is available
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_ACCESS_KEY_CHECK

  EBSEncryptionByDefaultRule:
    Condition: CreateConfigRecorder
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'ec2-ebs-encryption-by-default-${Environment}-${AWS::StackName}'
      Description: Check that Amazon Elastic Block Store (EBS) encryption is enabled by default
      Source:
        Owner: AWS
        SourceIdentifier: EC2_EBS_ENCRYPTION_BY_DEFAULT

  # =========================
  # GuardDuty for Threat Detection
  # =========================
  GuardDutyDetector:
    Condition: CreateGuardDutyDetector
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      DataSources:
        S3Logs:
          Enable: true
        MalwareProtection:
          ScanEc2InstanceWithFindings:
            EbsVolumes: true
        Kubernetes:
          AuditLogs:
            Enable: true
      Tags:
        - Key: Name
          Value: !Sub 'GuardDutyDetector-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # Lambda Function in VPC
  # =========================
  SecureLambdaFunction:
    Condition: CreateLambdaFunction
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub
        - 'SecureFunction-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      Runtime: python3.9
      Handler: index.lambda_handler
      Role:
        !If [
          UseExistingLambdaExecutionRole,
          !Ref ExistingLambdaExecutionRoleArn,
          !GetAtt LambdaExecutionRole.Arn,
        ]
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def lambda_handler(event, context):
              # Example of using KMS key from environment
              kms_key_id = os.environ.get('KMS_KEY_ID')
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Hello from secure Lambda!',
                      'kms_key': kms_key_id
                  })
              }
      VpcConfig:
        SecurityGroupIds:
          - !If [
              UseExistingLambdaSecurityGroup,
              !Ref ExistingLambdaSecurityGroupId,
              !Ref LambdaSecurityGroup,
            ]
        SubnetIds:
          - !If [
              UseExistingPrivateSubnet,
              !Ref ExistingPrivateSubnetId,
              !Ref PrivateSubnet,
            ]
      Environment:
        Variables:
          KMS_KEY_ID:
            !If [
              UseExistingKMS,
              !Ref ExistingKMSKeyArn,
              !GetAtt SecureKMSKey.Arn,
            ]
      KmsKeyArn:
        !If [UseExistingKMS, !Ref ExistingKMSKeyArn, !GetAtt SecureKMSKey.Arn]
      Timeout: 30
      Tags:
        - Key: Name
          Value: !Sub 'SecureLambdaFunction-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # EC2 Instance in VPC with Hardened AMI
  # =========================
  EC2Instance:
    Condition: CreateEC2Instance
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      NetworkInterfaces:
        - AssociatePublicIpAddress: false
          DeviceIndex: 0
          GroupSet:
            - !If [
                UseExistingWebServerSecurityGroup,
                !Ref ExistingWebServerSecurityGroupId,
                !Ref WebServerSecurityGroup,
              ]
          SubnetId:
            !If [
              UseExistingPrivateSubnet,
              !Ref ExistingPrivateSubnetId,
              !Ref PrivateSubnet,
            ]
      IamInstanceProfile:
        !If [
          UseExistingEC2InstanceProfile,
          !Ref ExistingEC2InstanceProfileArn,
          !Ref EC2InstanceProfile,
        ]
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId:
              !If [
                UseExistingKMS,
                !Ref ExistingKMSKeyArn,
                !GetAtt SecureKMSKey.Arn,
              ]
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: !Sub 'EC2Instance-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =========================
  # IAM Password Policy
  # =========================
  IAMPasswordPolicyRole:
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
        - PolicyName: IAMPasswordPolicyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:UpdateAccountPasswordPolicy
                  - iam:GetAccountPasswordPolicy
                Resource: '*'

  IAMPasswordPolicyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub
        - 'IAMPasswordPolicy-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt IAMPasswordPolicyRole.Arn
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import json

          def lambda_handler(event, context):
              try:
                  iam = boto3.client('iam')
                  
                  if event['RequestType'] == 'Delete':
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      return
                  
                  # Update account password policy
                  iam.update_account_password_policy(
                      MinimumPasswordLength=12,
                      RequireSymbols=True,
                      RequireNumbers=True,
                      RequireUppercaseCharacters=True,
                      RequireLowercaseCharacters=True,
                      AllowUsersToChangePassword=True,
                      MaxPasswordAge=90,
                      PasswordReusePrevention=24
                  )
                  
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  IAMPasswordPolicy:
    Type: AWS::CloudFormation::CustomResource
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      ServiceToken: !GetAtt IAMPasswordPolicyFunction.Arn

  # =========================
  # EBS Encryption by Default (Custom Resource)
  # =========================
  EBSEncryptionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
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
        - PolicyName: EBSEncryptionAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:EnableEbsEncryptionByDefault
                  - ec2:DisableEbsEncryptionByDefault
                  - ec2:GetEbsEncryptionByDefault
                  - ec2:ModifyEbsDefaultKmsKeyId
                  - ec2:GetEbsDefaultKmsKeyId
                  - ec2:ResetEbsDefaultKmsKeyId
                Resource: '*'

  EBSEncryptionFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      FunctionName: !Sub
        - 'EBSEncryption-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt EBSEncryptionRole.Arn
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import json

          def lambda_handler(event, context):
              try:
                  ec2 = boto3.client('ec2')
                  
                  if event['RequestType'] == 'Delete':
                      # Optionally disable encryption by default on delete
                      # ec2.disable_ebs_encryption_by_default()
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      return
                  
                  # Enable EBS encryption by default
                  ec2.enable_ebs_encryption_by_default()
                  
                  # Set default KMS key
                  kms_key_id = event['ResourceProperties'].get('KmsKeyId')
                  if kms_key_id:
                      ec2.modify_ebs_default_kms_key_id(KmsKeyId=kms_key_id)
                  
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  EBSEncryptionByDefault:
    Condition: ShouldEnableEBSEncryption
    Type: AWS::CloudFormation::CustomResource
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      ServiceToken: !GetAtt EBSEncryptionFunction.Arn
      KmsKeyId:
        !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]

  # =========================
  # Billing Alarm (for Cost Explorer)
  # =========================
  BillingAlarm:
    Condition: CreateBillingAlarm
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      AlarmName: !Sub
        - 'HighBillingAlarm-${Environment}-${AWS::StackName}-${AWS::Region}-${Suffix}'
        - { Suffix: !Select [2, !Split ['/', !Ref 'AWS::StackId']] }
      AlarmDescription: Alarm for high billing costs
      MetricName: EstimatedCharges
      Namespace: AWS/Billing
      Statistic: Maximum
      Period: 86400
      EvaluationPeriods: 1
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Currency
          Value: USD
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

Outputs:
  VPCId:
    Description: VPC ID
    Value: !If [CreateVPC, !Ref SecureVPC, !Ref ExistingVPCId]
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  KMSKeyArn:
    Description: KMS Key ARN
    Value: !If [CreateKMS, !GetAtt SecureKMSKey.Arn, !Ref ExistingKMSKeyArn]
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  S3BucketName:
    Description: S3 Bucket Name
    Value:
      !If [
        UseExistingSecureS3Bucket,
        !Ref ExistingSecureS3BucketName,
        !Ref SecureS3Bucket,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  RDSInstanceId:
    Condition: HasTwoSubnetAZs
    Description: RDS Instance ID
    Value:
      !If [
        UseExistingDatabaseInstance,
        !Ref ExistingDatabaseInstanceId,
        !Ref DatabaseInstance,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Instance-ID'

  EC2InstanceId:
    Description: EC2 Instance ID
    Value:
      !If [UseExistingEC2Instance, !Ref ExistingEC2InstanceId, !Ref EC2Instance]
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance-ID'

  LambdaFunctionName:
    Description: Lambda Function Name
    Value:
      !If [
        UseExistingLambdaFunction,
        !Ref ExistingLambdaFunctionName,
        !Ref SecureLambdaFunction,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Function-Name'

  CloudTrailName:
    Description: CloudTrail Name
    Value:
      !If [UseExistingCloudTrail, !Ref ExistingCloudTrailName, !Ref CloudTrail]
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Name'

  GuardDutyDetectorId:
    Description: GuardDuty Detector ID
    Value:
      !If [
        UseExistingGuardDutyDetector,
        !Ref ExistingGuardDutyDetectorId,
        !Ref GuardDutyDetector,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-GuardDuty-Detector-ID'

  ConfigBucketName:
    Description: AWS Config Bucket Name
    Value:
      !If [
        UseExistingConfigBucket,
        !Ref ExistingConfigBucketName,
        !Ref ConfigBucket,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket-Name'

  ConfigRecorderName:
    Description: AWS Config Recorder Name
    Value:
      !If [
        UseExistingConfigRecorder,
        !Ref ExistingConfigRecorderName,
        !If [
          CreateConfigRecorder,
          !Ref ConfigurationRecorder,
          !Sub 'NoConfigRecorder-${AWS::StackName}',
        ],
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Config-Recorder-Name'

  BillingAlarmName:
    Description: Billing Alarm Name
    Value:
      !If [
        UseExistingBillingAlarm,
        !Ref ExistingBillingAlarmName,
        !Ref BillingAlarm,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-Billing-Alarm-Name'

