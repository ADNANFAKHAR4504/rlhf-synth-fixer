# Ideal Response

This document contains all the infrastructure code and test files for this project.

## Infrastructure Code

### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready multi-region security configuration template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: 'Environment Configuration' }
        Parameters: [ProjectName, Environment, PrimaryRegion, SecondaryRegion]
      - Label: { default: 'Network Configuration' }
        Parameters:
          [
            VpcCidr,
            PublicSubnetCidr1,
            PublicSubnetCidr2,
            PrivateSubnetCidr1,
            PrivateSubnetCidr2,
            DatabaseSubnetCidr1,
            DatabaseSubnetCidr2,
            EnableNATGateway,
            EnableVPCFlowLogs,
          ]
      - Label: { default: 'Security Configuration' }
        Parameters:
          [
            KMSKeyAlias,
            NotificationEmail,
            AllowedIPRanges,
            EnableGuardDuty,
            EnableCloudTrail,
          ]
    ParameterLabels:
      ProjectName:
        default: 'Project Name'
      Environment:
        default: 'Environment'
      PrimaryRegion:
        default: 'Primary AWS Region'
      SecondaryRegion:
        default: 'Secondary AWS Region'
      VpcCidr:
        default: 'VPC CIDR Block'
      PublicSubnetCidr1:
        default: 'Public Subnet 1 CIDR'
      PublicSubnetCidr2:
        default: 'Public Subnet 2 CIDR'
      PrivateSubnetCidr1:
        default: 'Private Subnet 1 CIDR'
      PrivateSubnetCidr2:
        default: 'Private Subnet 2 CIDR'
      DatabaseSubnetCidr1:
        default: 'Database Subnet 1 CIDR'
      DatabaseSubnetCidr2:
        default: 'Database Subnet 2 CIDR'
      EnableNATGateway:
        default: 'Enable NAT Gateway'
      EnableVPCFlowLogs:
        default: 'Enable VPC Flow Logs'
      KMSKeyAlias:
        default: 'KMS Key Alias'
      NotificationEmail:
        default: 'Notification Email'
      AllowedIPRanges:
        default: 'Allowed IP Ranges'
      EnableGuardDuty:
        default: 'Enable GuardDuty'
      EnableCloudTrail:
        default: 'Enable CloudTrail'

Parameters:
  ProjectName:
    Type: String
    Description: 'Project name for resource naming'
    AllowedPattern: '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'
    ConstraintDescription: 'Must be 3-63 characters, start/end with alphanumeric, contain only lowercase letters, numbers, and hyphens'
    Default: 'secureapp'
    MinLength: 3
    MaxLength: 63

  Environment:
    Type: String
    Description: 'Deployment environment'
    AllowedValues: [dev, test, staging, prod]
    Default: 'prod'

  PrimaryRegion:
    Type: String
    Description: 'Primary AWS Region'
    Default: 'us-east-1'
    AllowedValues:
      - us-east-1
      - us-west-2
      - eu-west-1
      - eu-central-1
      - ap-southeast-1
      - ap-northeast-1

  SecondaryRegion:
    Type: String
    Description: 'Secondary AWS Region for disaster recovery'
    Default: 'us-west-2'
    AllowedValues:
      - us-east-1
      - us-west-2
      - eu-west-1
      - eu-central-1
      - ap-southeast-1
      - ap-northeast-1

  VpcCidr:
    Type: String
    Description: 'VPC CIDR block (must be /16 to /28)'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'
    ConstraintDescription: 'Must be a valid CIDR block between /16 and /28'

  PublicSubnetCidr1:
    Type: String
    Description: 'CIDR block for Public Subnet 1'
    Default: '10.0.1.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  PublicSubnetCidr2:
    Type: String
    Description: 'CIDR block for Public Subnet 2'
    Default: '10.0.2.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  PrivateSubnetCidr1:
    Type: String
    Description: 'CIDR block for Private Subnet 1'
    Default: '10.0.10.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  PrivateSubnetCidr2:
    Type: String
    Description: 'CIDR block for Private Subnet 2'
    Default: '10.0.20.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  DatabaseSubnetCidr1:
    Type: String
    Description: 'CIDR block for Database Subnet 1 (private)'
    Default: '10.0.100.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  DatabaseSubnetCidr2:
    Type: String
    Description: 'CIDR block for Database Subnet 2 (private)'
    Default: '10.0.200.0/24'
    AllowedPattern: '^(([0-9]{1,3}\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'

  AllowedIPRanges:
    Type: CommaDelimitedList
    Description: 'Allowed IP ranges for management access (comma-separated)'
    Default: '10.0.0.0/8,172.16.0.0/12,192.168.0.0/16'

  KMSKeyAlias:
    Type: String
    Description: 'KMS Key Alias suffix'
    Default: 'security-key'
    AllowedPattern: '^[a-zA-Z0-9/_-]+$'
    MinLength: 1
    MaxLength: 256

  NotificationEmail:
    Type: String
    Description: 'Email address for security notifications and alerts'
    Default: 'admin@example.com'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

  EnableVPCFlowLogs:
    Type: String
    Description: 'Enable VPC Flow Logs for network monitoring'
    Default: 'true'
    AllowedValues: ['true', 'false']

  EnableNATGateway:
    Type: String
    Description: 'Enable NAT Gateway for private subnet internet access'
    Default: 'true'
    AllowedValues: ['true', 'false']

  EnableGuardDuty:
    Type: String
    Description: 'Enable GuardDuty detector creation (set to false if already exists)'
    Default: 'false'
    AllowedValues: ['true', 'false']

  EnableCloudTrail:
    Type: String
    Description: 'Enable CloudTrail creation (set to false if trail limit reached or already exists)'
    Default: 'false'
    AllowedValues: ['true', 'false']

Conditions:
  IsPrimaryRegion: !Equals [!Ref 'AWS::Region', !Ref PrimaryRegion]
  IsProductionEnvironment: !Equals [!Ref Environment, 'prod']
  EnableNATGatewayCondition: !Equals [!Ref EnableNATGateway, 'true']
  EnableVPCFlowLogsCondition: !Equals [!Ref EnableVPCFlowLogs, 'true']
  EnableGuardDutyCondition:
    !And [!Equals [!Ref EnableGuardDuty, 'true'], !Condition IsPrimaryRegion]
  EnableCloudTrailCondition:
    !And [!Equals [!Ref EnableCloudTrail, 'true'], !Condition IsPrimaryRegion]

Resources:
  ### VPC & Networking ###
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Type
          Value: 'Public'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Type
          Value: 'Public'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Type
          Value: 'Private'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Type
          Value: 'Private'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Database Subnets (Private)
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-1'
        - Key: Type
          Value: 'Database'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-2'
        - Key: Type
          Value: 'Database'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateway
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: EnableNATGatewayCondition
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    Condition: EnableNATGatewayCondition
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Condition: EnableNATGatewayCondition
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-1'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Condition: EnableNATGatewayCondition
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Condition: EnableNATGatewayCondition
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Condition: EnableNATGatewayCondition
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet2

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds: [!Ref DatabaseSubnet1, !Ref DatabaseSubnet2]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Condition: EnableVPCFlowLogsCondition
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogPolicy
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

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Condition: EnableVPCFlowLogsCondition
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${Environment}-${AWS::StackName}'
      RetentionInDays: !If [IsProductionEnvironment, 90, 14]

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Condition: EnableVPCFlowLogsCondition
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-flow-logs'

  ### KMS Key ###
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Master encryption key for ${ProjectName}-${Environment} resources'
      EnableKeyRotation: true
      KeySpec: SYMMETRIC_DEFAULT
      KeyUsage: ENCRYPT_DECRYPT
      MultiRegion: false
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'EnableIAMUserPermissions'
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'AllowCloudTrail'
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail'
          - Sid: 'AllowRDS'
            Effect: Allow
            Principal: { Service: rds.amazonaws.com }
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'rds.${AWS::Region}.amazonaws.com'
          - Sid: 'AllowDynamoDB'
            Effect: Allow
            Principal: { Service: dynamodb.amazonaws.com }
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'dynamodb.${AWS::Region}.amazonaws.com'
          - Sid: 'AllowS3'
            Effect: Allow
            Principal: { Service: s3.amazonaws.com }
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
          - Sid: 'AllowSecretsManager'
            Effect: Allow
            Principal: { Service: secretsmanager.amazonaws.com }
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'secretsmanager.${AWS::Region}.amazonaws.com'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-master-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAliasResource:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-${KMSKeyAlias}'
      TargetKeyId: !Ref KMSKey

  ### Security Groups ###
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-web-sg'
      VpcId: !Ref VPC
      GroupDescription: 'Web SG'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-db-sg'
      VpcId: !Ref VPC
      GroupDescription: 'Database SG'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-lambda-sg'
      VpcId: !Ref VPC
      GroupDescription: 'Lambda SG'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ManagementSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-management-sg'
      VpcId: !Ref VPC
      GroupDescription: 'Management access from allowed IP ranges'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Select [0, !Ref AllowedIPRanges]
          Description: 'SSH access from first allowed IP range'
        - IpProtocol: tcp
          FromPort: 3389
          ToPort: 3389
          CidrIp: !Select [0, !Ref AllowedIPRanges]
          Description: 'RDP access from first allowed IP range'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-management-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ### S3 Buckets ###
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DependsOn: SecurityLambdaPermission
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            NoncurrentVersionExpirationInDays: !If [
                IsProductionEnvironment,
                2555,
                365,
              ] # 7 years for prod, 1 year for others
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt SecurityLambdaFunction.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyInsecureTransport'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}'
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
            Condition:
              Bool: { 'aws:SecureTransport': false }

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Condition: EnableCloudTrailCondition
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: EnableCloudTrailCondition
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail'
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail'
          - Sid: 'DenyInsecureTransport'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}'
              - !Sub 'arn:aws:s3:::${CloudTrailS3Bucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  ### IAM Roles ###
  MFAEnforcedRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: sts:AssumeRole
            Condition: { Bool: { 'aws:MultiFactorAuthPresent': true } }
      ManagedPolicyArns: ['arn:aws:iam::aws:policy/ReadOnlyAccess']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-mfa-enforced-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: CloudWatchLogsPolicy
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
        - PolicyName: SNSPublishPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SecurityNotificationTopic
        - PolicyName: SQSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt LambdaDeadLetterQueue.Arn
        - PolicyName: KMSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey*
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-execution-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ### CloudWatch Logs ###
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}-${AWS::StackName}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}-${AWS::StackName}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  SecurityLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/${ProjectName}-${Environment}-${AWS::StackName}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  ### CloudTrail ###
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: EnableCloudTrailCondition
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey

  ### GuardDuty ###
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Condition: EnableGuardDutyCondition
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  ### RDS ###
  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-rds-secret'
      GenerateSecretString:
        SecretStringTemplate: '{"username":"admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-rds-${AWS::StackName}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.39'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups: [!Ref DatabaseSecurityGroup]
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: !If [IsProductionEnvironment, 7, 1]
      MultiAZ: !If [IsProductionEnvironment, true, false]
      PubliclyAccessible: false
      DeletionProtection: false

  ### DynamoDB ###
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${Environment}-dynamodb-table-${AWS::StackName}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true

  ### SNS Topic for Security Notifications ###
  SecurityNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-security-notifications'
      DisplayName: 'Security Notifications'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-security-notifications'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  SecurityNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SecurityNotificationTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  ### Lambda ###
  SecurityLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-security-function-${AWS::StackName}'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 512
      VpcConfig:
        SecurityGroupIds: [!Ref LambdaSecurityGroup]
        SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      Environment:
        Variables:
          LOG_LEVEL: INFO
          SNS_TOPIC_ARN: !Ref SecurityNotificationTopic
          ENVIRONMENT: !Ref Environment
      DeadLetterConfig:
        TargetArn: !GetAtt LambdaDeadLetterQueue.Arn
      Code:
        ZipFile: |
          import json
          import logging
          import boto3
          import os
          from typing import Dict, Any

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(getattr(logging, os.environ.get('LOG_LEVEL', 'INFO')))

          # Initialize AWS clients
          sns_client = boto3.client('sns')

          def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
              """
              Security monitoring Lambda function
              Processes security events and sends notifications
              """
              try:
                  logger.info(f"Security function executed with event: {json.dumps(event, default=str)}")
                  
                  # Process the security event
                  event_type = event.get('eventType', 'unknown')
                  severity = event.get('severity', 'medium')
                  
                  # Send notification for high severity events
                  if severity in ['high', 'critical']:
                      send_security_notification(event_type, event)
                  
                  # Log the event for audit trail
                  logger.info(f"Processed security event: {event_type} with severity: {severity}")
                  
                  return {
                      "statusCode": 200,
                      "body": json.dumps({
                          "message": "Security event processed successfully",
                          "eventType": event_type,
                          "severity": severity,
                          "timestamp": context.aws_request_id
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing security event: {str(e)}")
                  
                  # Send error notification
                  send_error_notification(str(e), event)
                  
                  return {
                      "statusCode": 500,
                      "body": json.dumps({
                          "error": "Failed to process security event",
                          "message": str(e)
                      })
                  }

          def send_security_notification(event_type: str, event: Dict[str, Any]) -> None:
              """Send security notification via SNS"""
              try:
                  topic_arn = os.environ.get('SNS_TOPIC_ARN')
                  if not topic_arn:
                      logger.warning("SNS_TOPIC_ARN not configured")
                      return
                  
                  message = f"""
          Security Alert - {event_type.upper()}

          Environment: {os.environ.get('ENVIRONMENT', 'unknown')}
          Event Type: {event_type}
          Severity: {event.get('severity', 'unknown')}
          Timestamp: {event.get('timestamp', 'unknown')}

          Details: {json.dumps(event, indent=2, default=str)}
                  """
                  
                  sns_client.publish(
                      TopicArn=topic_arn,
                      Message=message,
                      Subject=f"Security Alert: {event_type}"
                  )
                  
                  logger.info("Security notification sent successfully")
                  
              except Exception as e:
                  logger.error(f"Failed to send security notification: {str(e)}")

          def send_error_notification(error_msg: str, event: Dict[str, Any]) -> None:
              """Send error notification via SNS"""
              try:
                  topic_arn = os.environ.get('SNS_TOPIC_ARN')
                  if not topic_arn:
                      return
                  
                  message = f"""
          Lambda Function Error

          Environment: {os.environ.get('ENVIRONMENT', 'unknown')}
          Error: {error_msg}
          Event: {json.dumps(event, indent=2, default=str)}
                  """
                  
                  sns_client.publish(
                      TopicArn=topic_arn,
                      Message=message,
                      Subject="Lambda Function Error"
                  )
                  
              except Exception as e:
                  logger.error(f"Failed to send error notification: {str(e)}")
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-security-function'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  SecurityLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecurityLambdaFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId

  LambdaDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${Environment}-lambda-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-dlq'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ### WAF ###
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-web-acl'
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-${Environment}-WebACL'

Outputs:
  # Network Outputs
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  # Security Outputs
  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  KMSKeyArn:
    Description: 'KMS Key ARN'
    Value: !GetAtt KMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Web-SG-ID'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DB-SG-ID'

  LambdaSecurityGroupId:
    Description: 'Lambda Security Group ID'
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-SG-ID'

  # Storage Outputs
  SecureS3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-Secure-S3-Bucket'

  CloudTrailS3BucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value:
      !If [
        EnableCloudTrailCondition,
        !Ref CloudTrailS3Bucket,
        'N/A - CloudTrail Disabled or Not Primary Region',
      ]

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  # Database Outputs
  RDSSecretName:
    Description: 'RDS Secret Name in Secrets Manager'
    Value: !Ref RDSSecret
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Secret'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: 'RDS Instance Port'
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  # Compute Outputs
  LambdaFunctionArn:
    Description: 'Security Lambda Function ARN'
    Value: !GetAtt SecurityLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  LambdaFunctionName:
    Description: 'Security Lambda Function Name'
    Value: !Ref SecurityLambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Name'

  # Monitoring & Security Outputs
  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value:
      !If [
        EnableGuardDutyCondition,
        !Ref GuardDutyDetector,
        'N/A - GuardDuty Disabled or Not Primary Region',
      ]

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value:
      !If [
        EnableCloudTrailCondition,
        !GetAtt CloudTrail.Arn,
        'N/A - CloudTrail Disabled or Not Primary Region',
      ]

  WebACLArn:
    Description: 'WAF WebACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACL-ARN'

  SecurityNotificationTopicArn:
    Description: 'SNS Topic ARN for Security Notifications'
    Value: !Ref SecurityNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic-ARN'

  VPCFlowLogsGroup:
    Description: 'VPC Flow Logs CloudWatch Log Group'
    Value:
      !If [
        EnableVPCFlowLogsCondition,
        !Ref VPCFlowLogsGroup,
        'N/A - VPC Flow Logs Disabled',
      ]

  # Environment Information
  Environment:
    Description: 'Deployment Environment'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

  ProjectName:
    Description: 'Project Name'
    Value: !Ref ProjectName
    Export:
      Name: !Sub '${AWS::StackName}-Project-Name'

  SecondaryRegion:
    Description: 'Secondary AWS Region for disaster recovery'
    Value: !Ref SecondaryRegion
    Export:
      Name: !Sub '${AWS::StackName}-Secondary-Region'
```

### TapStack.json

````json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Production-ready multi-region security configuration template",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "ProjectName",
                        "Environment",
                        "PrimaryRegion",
                        "SecondaryRegion"
                    ]
                },
                {
                    "Label": {
                        "default": "Network Configuration"
                    },
                    "Parameters": [
                        "VpcCidr",
                        "PublicSubnetCidr1",
                        "PublicSubnetCidr2",
                        "PrivateSubnetCidr1",
                        "PrivateSubnetCidr2",
                        "DatabaseSubnetCidr1",
                        "DatabaseSubnetCidr2",
                        "EnableNATGateway",
                        "EnableVPCFlowLogs"
                    ]
                },
                {
                    "Label": {
                        "default": "Security Configuration"
                    },
                    "Parameters": [
                        "KMSKeyAlias",
                        "NotificationEmail",
                        "AllowedIPRanges",
                        "EnableGuardDuty",
                        "EnableCloudTrail"
                    ]
                }
            ],
            "ParameterLabels": {
                "ProjectName": {
                    "default": "Project Name"
                },
                "Environment": {
                    "default": "Environment"
                },
                "PrimaryRegion": {
                    "default": "Primary AWS Region"
                },
                "SecondaryRegion": {
                    "default": "Secondary AWS Region"
                },
                "VpcCidr": {
                    "default": "VPC CIDR Block"
                },
                "PublicSubnetCidr1": {
                    "default": "Public Subnet 1 CIDR"
                },
                "PublicSubnetCidr2": {
                    "default": "Public Subnet 2 CIDR"
                },
                "PrivateSubnetCidr1": {
                    "default": "Private Subnet 1 CIDR"
                },
                "PrivateSubnetCidr2": {
                    "default": "Private Subnet 2 CIDR"
                },
                "DatabaseSubnetCidr1": {
                    "default": "Database Subnet 1 CIDR"
                },
                "DatabaseSubnetCidr2": {
                    "default": "Database Subnet 2 CIDR"
                },
                "EnableNATGateway": {
                    "default": "Enable NAT Gateway"
                },
                "EnableVPCFlowLogs": {
                    "default": "Enable VPC Flow Logs"
                },
                "KMSKeyAlias": {
                    "default": "KMS Key Alias"
                },
                "NotificationEmail": {
                    "default": "Notification Email"
                },
                "AllowedIPRanges": {
                    "default": "Allowed IP Ranges"
                },
                "EnableGuardDuty": {
                    "default": "Enable GuardDuty"
                },
                "EnableCloudTrail": {
                    "default": "Enable CloudTrail"
                }
            }
        }
    },
    "Parameters": {
        "ProjectName": {
            "Type": "String",
            "Description": "Project name for resource naming",
            "AllowedPattern": "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",
            "ConstraintDescription": "Must be 3-63 characters, start/end with alphanumeric, contain only lowercase letters, numbers, and hyphens",
            "Default": "secureapp",
            "MinLength": 3,
            "MaxLength": 63
        },
        "Environment": {
            "Type": "String",
            "Description": "Deployment environment",
            "AllowedValues": [
                "dev",
                "test",
                "staging",
                "prod"
            ],
            "Default": "prod"
        },
        "PrimaryRegion": {
            "Type": "String",
            "Description": "Primary AWS Region",
            "Default": "us-east-1",
            "AllowedValues": [
                "us-east-1",
                "us-west-2",
                "eu-west-1",
                "eu-central-1",
                "ap-southeast-1",
                "ap-northeast-1"
            ]
        },
        "SecondaryRegion": {
            "Type": "String",
            "Description": "Secondary AWS Region for disaster recovery",
            "Default": "us-west-2",
            "AllowedValues": [
                "us-east-1",
                "us-west-2",
                "eu-west-1",
                "eu-central-1",
                "ap-southeast-1",
                "ap-northeast-1"
            ]
        },
        "VpcCidr": {
            "Type": "String",
            "Description": "VPC CIDR block (must be /16 to /28)",
            "Default": "10.0.0.0/16",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$",
            "ConstraintDescription": "Must be a valid CIDR block between /16 and /28"
        },
        "PublicSubnetCidr1": {
            "Type": "String",
            "Description": "CIDR block for Public Subnet 1",
            "Default": "10.0.1.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "PublicSubnetCidr2": {
            "Type": "String",
            "Description": "CIDR block for Public Subnet 2",
            "Default": "10.0.2.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "PrivateSubnetCidr1": {
            "Type": "String",
            "Description": "CIDR block for Private Subnet 1",
            "Default": "10.0.10.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "PrivateSubnetCidr2": {
            "Type": "String",
            "Description": "CIDR block for Private Subnet 2",
            "Default": "10.0.20.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "DatabaseSubnetCidr1": {
            "Type": "String",
            "Description": "CIDR block for Database Subnet 1 (private)",
            "Default": "10.0.100.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "DatabaseSubnetCidr2": {
            "Type": "String",
            "Description": "CIDR block for Database Subnet 2 (private)",
            "Default": "10.0.200.0/24",
            "AllowedPattern": "^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$"
        },
        "AllowedIPRanges": {
            "Type": "CommaDelimitedList",
            "Description": "Allowed IP ranges for management access (comma-separated)",
            "Default": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        "KMSKeyAlias": {
            "Type": "String",
            "Description": "KMS Key Alias suffix",
            "Default": "security-key",
            "AllowedPattern": "^[a-zA-Z0-9/_-]+$",
            "MinLength": 1,
            "MaxLength": 256
        },
        "NotificationEmail": {
            "Type": "String",
            "Description": "Email address for security notifications and alerts",
            "Default": "admin@example.com",
            "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            "ConstraintDescription": "Must be a valid email address"
        },
        "EnableVPCFlowLogs": {
            "Type": "String",
            "Description": "Enable VPC Flow Logs for network monitoring",
            "Default": "true",
            "AllowedValues": [
                "true",
                "false"
            ]
        },
        "EnableNATGateway": {
            "Type": "String",
            "Description": "Enable NAT Gateway for private subnet internet access",
            "Default": "true",
            "AllowedValues": [
                "true",
                "false"
            ]
        },
        "EnableGuardDuty": {
            "Type": "String",
            "Description": "Enable GuardDuty detector creation (set to false if already exists)",
            "Default": "false",
            "AllowedValues": [
                "true",
                "false"
            ]
        },
        "EnableCloudTrail": {
            "Type": "String",
            "Description": "Enable CloudTrail creation (set to false if trail limit reached or already exists)",
            "Default": "false",
            "AllowedValues": [
                "true",
                "false"
            ]
        }
    },
    "Conditions": {
        "IsPrimaryRegion": {
            "Fn::Equals": [
                {
                    "Ref": "AWS::Region"
                },
                {
                    "Ref": "PrimaryRegion"
                }
            ]
        },
        "IsProductionEnvironment": {
            "Fn::Equals": [
                {
                    "Ref": "Environment"
                },
                "prod"
            ]
        },
        "EnableNATGatewayCondition": {
            "Fn::Equals": [
                {
                    "Ref": "EnableNATGateway"
                },
                "true"
            ]
        },
        "EnableVPCFlowLogsCondition": {
            "Fn::Equals": [
                {
                    "Ref": "EnableVPCFlowLogs"
                },
                "true"
            ]
        },
        "EnableGuardDutyCondition": {
            "Fn::And": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "EnableGuardDuty"
                        },
                        "true"
                    ]
                },
                {
                    "Condition": "IsPrimaryRegion"
                }
            ]
        },
        "EnableCloudTrailCondition": {
            "Fn::And": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "EnableCloudTrail"
                        },
                        "true"
                    ]
                },
                {
                    "Condition": "IsPrimaryRegion"
                }
            ]
        }
    },
    "Resources": {
        "VPC": {
            "Type": "AWS::EC2::VPC",
            "Properties": {
                "CidrBlock": {
                    "Ref": "VpcCidr"
                },
                "EnableDnsSupport": true,
                "EnableDnsHostnames": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-vpc"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "InternetGateway": {
            "Type": "AWS::EC2::InternetGateway",
            "Properties": {
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-igw"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "InternetGatewayAttachment": {
            "Type": "AWS::EC2::VPCGatewayAttachment",
            "Properties": {
                "InternetGatewayId": {
                    "Ref": "InternetGateway"
                },
                "VpcId": {
                    "Ref": "VPC"
                }
            }
        },
        "PublicSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "PublicSubnetCidr1"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-public-subnet-1"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Public"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "PublicSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "PublicSubnetCidr2"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-public-subnet-2"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Public"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "PrivateSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "PrivateSubnetCidr1"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-private-subnet-1"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Private"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "PrivateSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "PrivateSubnetCidr2"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-private-subnet-2"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Private"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DatabaseSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "DatabaseSubnetCidr1"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-db-subnet-1"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Database"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DatabaseSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": {
                    "Ref": "DatabaseSubnetCidr2"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-db-subnet-2"
                        }
                    },
                    {
                        "Key": "Type",
                        "Value": "Database"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "NATGateway1EIP": {
            "Type": "AWS::EC2::EIP",
            "Condition": "EnableNATGatewayCondition",
            "DependsOn": "InternetGatewayAttachment",
            "Properties": {
                "Domain": "vpc",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-nat-eip-1"
                        }
                    }
                ]
            }
        },
        "NATGateway2EIP": {
            "Type": "AWS::EC2::EIP",
            "Condition": "EnableNATGatewayCondition",
            "DependsOn": "InternetGatewayAttachment",
            "Properties": {
                "Domain": "vpc",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-nat-eip-2"
                        }
                    }
                ]
            }
        },
        "NATGateway1": {
            "Type": "AWS::EC2::NatGateway",
            "Condition": "EnableNATGatewayCondition",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "NATGateway1EIP",
                        "AllocationId"
                    ]
                },
                "SubnetId": {
                    "Ref": "PublicSubnet1"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-nat-gateway-1"
                        }
                    }
                ]
            }
        },
        "NATGateway2": {
            "Type": "AWS::EC2::NatGateway",
            "Condition": "EnableNATGatewayCondition",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "NATGateway2EIP",
                        "AllocationId"
                    ]
                },
                "SubnetId": {
                    "Ref": "PublicSubnet2"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-nat-gateway-2"
                        }
                    }
                ]
            }
        },
        "PublicRouteTable": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-public-rt"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DefaultPublicRoute": {
            "Type": "AWS::EC2::Route",
            "DependsOn": "InternetGatewayAttachment",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "GatewayId": {
                    "Ref": "InternetGateway"
                }
            }
        },
        "PublicSubnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                },
                "SubnetId": {
                    "Ref": "PublicSubnet1"
                }
            }
        },
        "PublicSubnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                },
                "SubnetId": {
                    "Ref": "PublicSubnet2"
                }
            }
        },
        "PrivateRouteTable1": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-private-rt-1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DefaultPrivateRoute1": {
            "Type": "AWS::EC2::Route",
            "Condition": "EnableNATGatewayCondition",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable1"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "NATGateway1"
                }
            }
        },
        "PrivateSubnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable1"
                },
                "SubnetId": {
                    "Ref": "PrivateSubnet1"
                }
            }
        },
        "PrivateRouteTable2": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-private-rt-2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DefaultPrivateRoute2": {
            "Type": "AWS::EC2::Route",
            "Condition": "EnableNATGatewayCondition",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable2"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "NATGateway2"
                }
            }
        },
        "PrivateSubnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable2"
                },
                "SubnetId": {
                    "Ref": "PrivateSubnet2"
                }
            }
        },
        "DatabaseRouteTable": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-db-rt"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "DatabaseSubnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "DatabaseRouteTable"
                },
                "SubnetId": {
                    "Ref": "DatabaseSubnet1"
                }
            }
        },
        "DatabaseSubnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "RouteTableId": {
                    "Ref": "DatabaseRouteTable"
                },
                "SubnetId": {
                    "Ref": "DatabaseSubnet2"
                }
            }
        },
        "DatabaseSubnetGroup": {
            "Type": "AWS::RDS::DBSubnetGroup",
            "Properties": {
                "DBSubnetGroupName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-db-subnet-group"
                },
                "DBSubnetGroupDescription": "Subnet group for RDS instances",
                "SubnetIds": [
                    {
                        "Ref": "DatabaseSubnet1"
                    },
                    {
                        "Ref": "DatabaseSubnet2"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-db-subnet-group"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "VPCFlowLogsRole": {
            "Type": "AWS::IAM::Role",
            "Condition": "EnableVPCFlowLogsCondition",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "vpc-flow-logs.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "Policies": [
                    {
                        "PolicyName": "CloudWatchLogPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents",
                                        "logs:DescribeLogGroups",
                                        "logs:DescribeLogStreams"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                    }
                ]
            }
        },
        "VPCFlowLogsGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Condition": "EnableVPCFlowLogsCondition",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/vpc/flowlogs/${ProjectName}-${Environment}-${AWS::StackName}"
                },
                "RetentionInDays": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        90,
                        14
                    ]
                }
            }
        },
        "VPCFlowLogs": {
            "Type": "AWS::EC2::FlowLog",
            "Condition": "EnableVPCFlowLogsCondition",
            "Properties": {
                "ResourceType": "VPC",
                "ResourceId": {
                    "Ref": "VPC"
                },
                "TrafficType": "ALL",
                "LogDestinationType": "cloud-watch-logs",
                "LogGroupName": {
                    "Ref": "VPCFlowLogsGroup"
                },
                "DeliverLogsPermissionArn": {
                    "Fn::GetAtt": [
                        "VPCFlowLogsRole",
                        "Arn"
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-vpc-flow-logs"
                        }
                    }
                ]
            }
        },
        "KMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": {
                    "Fn::Sub": "Master encryption key for ${ProjectName}-${Environment} resources"
                },
                "EnableKeyRotation": true,
                "KeySpec": "SYMMETRIC_DEFAULT",
                "KeyUsage": "ENCRYPT_DECRYPT",
                "MultiRegion": false,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "EnableIAMUserPermissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowCloudTrail",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey",
                                "kms:Encrypt",
                                "kms:ReEncrypt*",
                                "kms:CreateGrant"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "kms:EncryptionContext:aws:cloudtrail:arn": {
                                        "Fn::Sub": "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "AllowRDS",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "rds.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey*",
                                "kms:ReEncrypt*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "kms:ViaService": {
                                        "Fn::Sub": "rds.${AWS::Region}.amazonaws.com"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "AllowDynamoDB",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "dynamodb.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey*",
                                "kms:ReEncrypt*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "kms:ViaService": {
                                        "Fn::Sub": "dynamodb.${AWS::Region}.amazonaws.com"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "AllowS3",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "s3.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey*",
                                "kms:ReEncrypt*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "kms:ViaService": {
                                        "Fn::Sub": "s3.${AWS::Region}.amazonaws.com"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "AllowSecretsManager",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "secretsmanager.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey*",
                                "kms:ReEncrypt*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "kms:ViaService": {
                                        "Fn::Sub": "secretsmanager.${AWS::Region}.amazonaws.com"
                                    }
                                }
                            }
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-master-key"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "KMSKeyAliasResource": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${ProjectName}-${Environment}-${KMSKeyAlias}"
                },
                "TargetKeyId": {
                    "Ref": "KMSKey"
                }
            }
        },
        "WebSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-web-sg"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "GroupDescription": "Web SG",
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 443,
                        "ToPort": 443,
                        "CidrIp": "0.0.0.0/0"
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 80,
                        "ToPort": 80,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": -1,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-web-sg"
                        }
                    }
                ]
            }
        },
        "DatabaseSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-db-sg"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "GroupDescription": "Database SG",
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 3306,
                        "ToPort": 3306,
                        "SourceSecurityGroupId": {
                            "Ref": "WebSecurityGroup"
                        }
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 5432,
                        "ToPort": 5432,
                        "SourceSecurityGroupId": {
                            "Ref": "WebSecurityGroup"
                        }
                    }
                ],
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": -1,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-db-sg"
                        }
                    }
                ]
            }
        },
        "LambdaSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-lambda-sg"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "GroupDescription": "Lambda SG",
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 443,
                        "ToPort": 443,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-lambda-sg"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "ManagementSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-management-sg"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "GroupDescription": "Management access from allowed IP ranges",
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 22,
                        "ToPort": 22,
                        "CidrIp": {
                            "Fn::Select": [
                                0,
                                {
                                    "Ref": "AllowedIPRanges"
                                }
                            ]
                        },
                        "Description": "SSH access from first allowed IP range"
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 3389,
                        "ToPort": 3389,
                        "CidrIp": {
                            "Fn::Select": [
                                0,
                                {
                                    "Ref": "AllowedIPRanges"
                                }
                            ]
                        },
                        "Description": "RDP access from first allowed IP range"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-management-sg"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "SecureS3Bucket": {
            "Type": "AWS::S3::Bucket",
            "DependsOn": "SecurityLambdaPermission",
            "DeletionPolicy": "Retain",
            "UpdateReplacePolicy": "Retain",
            "Properties": {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Ref": "KMSKey"
                                }
                            },
                            "BucketKeyEnabled": true
                        }
                    ]
                },
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "TransitionToIA",
                            "Status": "Enabled",
                            "Transitions": [
                                {
                                    "TransitionInDays": 30,
                                    "StorageClass": "STANDARD_IA"
                                },
                                {
                                    "TransitionInDays": 90,
                                    "StorageClass": "GLACIER"
                                },
                                {
                                    "TransitionInDays": 365,
                                    "StorageClass": "DEEP_ARCHIVE"
                                }
                            ]
                        },
                        {
                            "Id": "DeleteOldVersions",
                            "Status": "Enabled",
                            "NoncurrentVersionTransitions": [
                                {
                                    "TransitionInDays": 30,
                                    "StorageClass": "STANDARD_IA"
                                },
                                {
                                    "TransitionInDays": 90,
                                    "StorageClass": "GLACIER"
                                }
                            ],
                            "NoncurrentVersionExpirationInDays": {
                                "Fn::If": [
                                    "IsProductionEnvironment",
                                    2555,
                                    365
                                ]
                            }
                        },
                        {
                            "Id": "DeleteIncompleteMultipartUploads",
                            "Status": "Enabled",
                            "AbortIncompleteMultipartUpload": {
                                "DaysAfterInitiation": 7
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "IgnorePublicAcls": true,
                    "BlockPublicPolicy": true,
                    "RestrictPublicBuckets": true
                },
                "NotificationConfiguration": {
                    "LambdaConfigurations": [
                        {
                            "Event": "s3:ObjectCreated:*",
                            "Function": {
                                "Fn::GetAtt": [
                                    "SecurityLambdaFunction",
                                    "Arn"
                                ]
                            }
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-secure-bucket"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "SecureS3BucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "SecureS3Bucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyInsecureTransport",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${SecureS3Bucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${SecureS3Bucket}/*"
                                }
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": false
                                }
                            }
                        }
                    ]
                }
            }
        },
        "CloudTrailS3Bucket": {
            "Type": "AWS::S3::Bucket",
            "Condition": "EnableCloudTrailCondition",
            "DeletionPolicy": "Retain",
            "UpdateReplacePolicy": "Retain",
            "Properties": {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Ref": "KMSKey"
                                }
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "IgnorePublicAcls": true,
                    "BlockPublicPolicy": true,
                    "RestrictPublicBuckets": true
                }
            }
        },
        "CloudTrailS3BucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Condition": "EnableCloudTrailCondition",
            "Properties": {
                "Bucket": {
                    "Ref": "CloudTrailS3Bucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "s3:GetBucketAcl",
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${CloudTrailS3Bucket}"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "AWS:SourceArn": {
                                        "Fn::Sub": "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "s3:PutObject",
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${CloudTrailS3Bucket}/AWSLogs/${AWS::AccountId}/*"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control",
                                    "AWS:SourceArn": {
                                        "Fn::Sub": "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${Environment}-cloudtrail"
                                    }
                                }
                            }
                        },
                        {
                            "Sid": "DenyInsecureTransport",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${CloudTrailS3Bucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${CloudTrailS3Bucket}/*"
                                }
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": false
                                }
                            }
                        }
                    ]
                }
            }
        },
        "MFAEnforcedRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "sts:AssumeRole",
                            "Condition": {
                                "Bool": {
                                    "aws:MultiFactorAuthPresent": true
                                }
                            }
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/ReadOnlyAccess"
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-mfa-enforced-role"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "LambdaExecutionRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
                ],
                "Policies": [
                    {
                        "PolicyName": "CloudWatchLogsPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents",
                                        "logs:DescribeLogGroups",
                                        "logs:DescribeLogStreams"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "PolicyName": "SNSPublishPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sns:Publish"
                                    ],
                                    "Resource": {
                                        "Ref": "SecurityNotificationTopic"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "PolicyName": "SQSPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sqs:SendMessage"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "LambdaDeadLetterQueue",
                                            "Arn"
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "PolicyName": "KMSPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey*"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "KMSKey",
                                            "Arn"
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-lambda-execution-role"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "S3LogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/s3/${ProjectName}-${Environment}-${AWS::StackName}"
                },
                "RetentionInDays": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        365,
                        30
                    ]
                }
            }
        },
        "LambdaLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/lambda/${ProjectName}-${Environment}-${AWS::StackName}"
                },
                "RetentionInDays": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        365,
                        30
                    ]
                }
            }
        },
        "SecurityLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/security/${ProjectName}-${Environment}-${AWS::StackName}"
                },
                "RetentionInDays": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        365,
                        30
                    ]
                }
            }
        },
        "CloudTrail": {
            "Type": "AWS::CloudTrail::Trail",
            "Condition": "EnableCloudTrailCondition",
            "Properties": {
                "TrailName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-cloudtrail"
                },
                "S3BucketName": {
                    "Ref": "CloudTrailS3Bucket"
                },
                "IncludeGlobalServiceEvents": true,
                "IsMultiRegionTrail": true,
                "IsLogging": true,
                "EnableLogFileValidation": true,
                "KMSKeyId": {
                    "Ref": "KMSKey"
                }
            }
        },
        "GuardDutyDetector": {
            "Type": "AWS::GuardDuty::Detector",
            "Condition": "EnableGuardDutyCondition",
            "Properties": {
                "Enable": true,
                "FindingPublishingFrequency": "FIFTEEN_MINUTES"
            }
        },
        "RDSSecret": {
            "Type": "AWS::SecretsManager::Secret",
            "Properties": {
                "Name": {
                    "Fn::Sub": "${ProjectName}-${Environment}-rds-secret"
                },
                "GenerateSecretString": {
                    "SecretStringTemplate": "{\"username\":\"admin\"}",
                    "GenerateStringKey": "password",
                    "PasswordLength": 32,
                    "ExcludeCharacters": "\"@/\\"
                }
            }
        },
        "RDSInstance": {
            "Type": "AWS::RDS::DBInstance",
            "DeletionPolicy": "Snapshot",
            "UpdateReplacePolicy": "Snapshot",
            "Properties": {
                "DBInstanceIdentifier": {
                    "Fn::Sub": "${ProjectName}-${Environment}-rds-${AWS::StackName}"
                },
                "DBInstanceClass": "db.t3.micro",
                "Engine": "mysql",
                "EngineVersion": "8.0.39",
                "MasterUsername": "admin",
                "MasterUserPassword": {
                    "Fn::Sub": "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"
                },
                "AllocatedStorage": 20,
                "StorageEncrypted": true,
                "KmsKeyId": {
                    "Ref": "KMSKey"
                },
                "VPCSecurityGroups": [
                    {
                        "Ref": "DatabaseSecurityGroup"
                    }
                ],
                "DBSubnetGroupName": {
                    "Ref": "DatabaseSubnetGroup"
                },
                "BackupRetentionPeriod": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        7,
                        1
                    ]
                },
                "MultiAZ": {
                    "Fn::If": [
                        "IsProductionEnvironment",
                        true,
                        false
                    ]
                },
                "PubliclyAccessible": false,
                "DeletionProtection": false
            }
        },
        "DynamoDBTable": {
            "Type": "AWS::DynamoDB::Table",
            "Properties": {
                "TableName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-dynamodb-table-${AWS::StackName}"
                },
                "BillingMode": "PAY_PER_REQUEST",
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "SSESpecification": {
                    "SSEEnabled": true,
                    "SSEType": "KMS",
                    "KMSMasterKeyId": {
                        "Ref": "KMSKey"
                    }
                },
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": true
                }
            }
        },
        "SecurityNotificationTopic": {
            "Type": "AWS::SNS::Topic",
            "Properties": {
                "TopicName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-security-notifications"
                },
                "DisplayName": "Security Notifications",
                "KmsMasterKeyId": {
                    "Ref": "KMSKey"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-security-notifications"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "SecurityNotificationSubscription": {
            "Type": "AWS::SNS::Subscription",
            "Properties": {
                "TopicArn": {
                    "Ref": "SecurityNotificationTopic"
                },
                "Protocol": "email",
                "Endpoint": {
                    "Ref": "NotificationEmail"
                }
            }
        },
        "SecurityLambdaFunction": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "FunctionName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-security-function-${AWS::StackName}"
                },
                "Runtime": "python3.12",
                "Handler": "index.lambda_handler",
                "Role": {
                    "Fn::GetAtt": [
                        "LambdaExecutionRole",
                        "Arn"
                    ]
                },
                "Timeout": 300,
                "MemorySize": 512,
                "VpcConfig": {
                    "SecurityGroupIds": [
                        {
                            "Ref": "LambdaSecurityGroup"
                        }
                    ],
                    "SubnetIds": [
                        {
                            "Ref": "PrivateSubnet1"
                        },
                        {
                            "Ref": "PrivateSubnet2"
                        }
                    ]
                },
                "Environment": {
                    "Variables": {
                        "LOG_LEVEL": "INFO",
                        "SNS_TOPIC_ARN": {
                            "Ref": "SecurityNotificationTopic"
                        },
                        "ENVIRONMENT": {
                            "Ref": "Environment"
                        }
                    }
                },
                "DeadLetterConfig": {
                    "TargetArn": {
                        "Fn::GetAtt": [
                            "LambdaDeadLetterQueue",
                            "Arn"
                        ]
                    }
                },
                "Code": {
                    "ZipFile": "import json\nimport logging\nimport boto3\nimport os\nfrom typing import Dict, Any\n\n# Configure logging\nlogger = logging.getLogger()\nlogger.setLevel(getattr(logging, os.environ.get('LOG_LEVEL', 'INFO')))\n\n# Initialize AWS clients\nsns_client = boto3.client('sns')\n\ndef lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:\n    \"\"\"\n    Security monitoring Lambda function\n    Processes security events and sends notifications\n    \"\"\"\n    try:\n        logger.info(f\"Security function executed with event: {json.dumps(event, default=str)}\")\n        \n        # Process the security event\n        event_type = event.get('eventType', 'unknown')\n        severity = event.get('severity', 'medium')\n        \n        # Send notification for high severity events\n        if severity in ['high', 'critical']:\n            send_security_notification(event_type, event)\n        \n        # Log the event for audit trail\n        logger.info(f\"Processed security event: {event_type} with severity: {severity}\")\n        \n        return {\n            \"statusCode\": 200,\n            \"body\": json.dumps({\n                \"message\": \"Security event processed successfully\",\n                \"eventType\": event_type,\n                \"severity\": severity,\n                \"timestamp\": context.aws_request_id\n            })\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error processing security event: {str(e)}\")\n        \n        # Send error notification\n        send_error_notification(str(e), event)\n        \n        return {\n            \"statusCode\": 500,\n            \"body\": json.dumps({\n                \"error\": \"Failed to process security event\",\n                \"message\": str(e)\n            })\n        }\n\ndef send_security_notification(event_type: str, event: Dict[str, Any]) -> None:\n    \"\"\"Send security notification via SNS\"\"\"\n    try:\n        topic_arn = os.environ.get('SNS_TOPIC_ARN')\n        if not topic_arn:\n            logger.warning(\"SNS_TOPIC_ARN not configured\")\n            return\n        \n        message = f\"\"\"\nSecurity Alert - {event_type.upper()}\n\nEnvironment: {os.environ.get('ENVIRONMENT', 'unknown')}\nEvent Type: {event_type}\nSeverity: {event.get('severity', 'unknown')}\nTimestamp: {event.get('timestamp', 'unknown')}\n\nDetails: {json.dumps(event, indent=2, default=str)}\n        \"\"\"\n        \n        sns_client.publish(\n            TopicArn=topic_arn,\n            Message=message,\n            Subject=f\"Security Alert: {event_type}\"\n        )\n        \n        logger.info(\"Security notification sent successfully\")\n        \n    except Exception as e:\n        logger.error(f\"Failed to send security notification: {str(e)}\")\n\ndef send_error_notification(error_msg: str, event: Dict[str, Any]) -> None:\n    \"\"\"Send error notification via SNS\"\"\"\n    try:\n        topic_arn = os.environ.get('SNS_TOPIC_ARN')\n        if not topic_arn:\n            return\n        \n        message = f\"\"\"\nLambda Function Error\n\nEnvironment: {os.environ.get('ENVIRONMENT', 'unknown')}\nError: {error_msg}\nEvent: {json.dumps(event, indent=2, default=str)}\n        \"\"\"\n        \n        sns_client.publish(\n            TopicArn=topic_arn,\n            Message=message,\n            Subject=\"Lambda Function Error\"\n        )\n        \n    except Exception as e:\n        logger.error(f\"Failed to send error notification: {str(e)}\")\n"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-security-function"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "SecurityLambdaPermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Ref": "SecurityLambdaFunction"
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "s3.amazonaws.com",
                "SourceAccount": {
                    "Ref": "AWS::AccountId"
                }
            }
        },
        "LambdaDeadLetterQueue": {
            "Type": "AWS::SQS::Queue",
            "Properties": {
                "QueueName": {
                    "Fn::Sub": "${ProjectName}-${Environment}-lambda-dlq"
                },
                "MessageRetentionPeriod": 1209600,
                "KmsMasterKeyId": {
                    "Ref": "KMSKey"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-${Environment}-lambda-dlq"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "WebACL": {
            "Type": "AWS::WAFv2::WebACL",
            "Properties": {
                "Name": {
                    "Fn::Sub": "${ProjectName}-${Environment}-web-acl"
                },
                "Scope": "REGIONAL",
                "DefaultAction": {
                    "Allow": {}
                },
                "Rules": [
                    {
                        "Name": "AWSManagedRulesCommonRuleSet",
                        "Priority": 1,
                        "OverrideAction": {
                            "None": {}
                        },
                        "Statement": {
                            "ManagedRuleGroupStatement": {
                                "VendorName": "AWS",
                                "Name": "AWSManagedRulesCommonRuleSet"
                            }
                        },
                        "VisibilityConfig": {
                            "SampledRequestsEnabled": true,
                            "CloudWatchMetricsEnabled": true,
                            "MetricName": "CommonRuleSetMetric"
                        }
                    }
                ],
                "VisibilityConfig": {
                    "SampledRequestsEnabled": true,
                    "CloudWatchMetricsEnabled": true,
                    "MetricName": {
                        "Fn::Sub": "${ProjectName}-${Environment}-WebACL"
                    }
                }
            }
        }
    },
    "Outputs": {
        "VPCId": {
            "Description": "VPC ID",
            "Value": {
                "Ref": "VPC"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-VPC-ID"
                }
            }
        },
        "PublicSubnet1Id": {
            "Description": "Public Subnet 1 ID",
            "Value": {
                "Ref": "PublicSubnet1"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID"
                }
            }
        },
        "PublicSubnet2Id": {
            "Description": "Public Subnet 2 ID",
            "Value": {
                "Ref": "PublicSubnet2"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID"
                }
            }
        },
        "PrivateSubnet1Id": {
            "Description": "Private Subnet 1 ID",
            "Value": {
                "Ref": "PrivateSubnet1"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-PrivateSubnet1-ID"
                }
            }
        },
        "PrivateSubnet2Id": {
            "Description": "Private Subnet 2 ID",
            "Value": {
                "Ref": "PrivateSubnet2"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-PrivateSubnet2-ID"
                }
            }
        },
        "KMSKeyId": {
            "Description": "KMS Key ID for encryption",
            "Value": {
                "Ref": "KMSKey"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-KMS-Key-ID"
                }
            }
        },
        "KMSKeyArn": {
            "Description": "KMS Key ARN",
            "Value": {
                "Fn::GetAtt": [
                    "KMSKey",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-KMS-Key-ARN"
                }
            }
        },
        "WebSecurityGroupId": {
            "Description": "Web Security Group ID",
            "Value": {
                "Ref": "WebSecurityGroup"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Web-SG-ID"
                }
            }
        },
        "DatabaseSecurityGroupId": {
            "Description": "Database Security Group ID",
            "Value": {
                "Ref": "DatabaseSecurityGroup"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-DB-SG-ID"
                }
            }
        },
        "LambdaSecurityGroupId": {
            "Description": "Lambda Security Group ID",
            "Value": {
                "Ref": "LambdaSecurityGroup"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Lambda-SG-ID"
                }
            }
        },
        "SecureS3BucketName": {
            "Description": "Secure S3 Bucket Name",
            "Value": {
                "Ref": "SecureS3Bucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Secure-S3-Bucket"
                }
            }
        },
        "CloudTrailS3BucketName": {
            "Description": "CloudTrail S3 Bucket Name",
            "Value": {
                "Fn::If": [
                    "EnableCloudTrailCondition",
                    {
                        "Ref": "CloudTrailS3Bucket"
                    },
                    "N/A - CloudTrail Disabled or Not Primary Region"
                ]
            }
        },
        "DynamoDBTableName": {
            "Description": "DynamoDB Table Name",
            "Value": {
                "Ref": "DynamoDBTable"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-DynamoDB-Table"
                }
            }
        },
        "RDSSecretName": {
            "Description": "RDS Secret Name in Secrets Manager",
            "Value": {
                "Ref": "RDSSecret"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-RDS-Secret"
                }
            }
        },
        "RDSEndpoint": {
            "Description": "RDS Instance Endpoint",
            "Value": {
                "Fn::GetAtt": [
                    "RDSInstance",
                    "Endpoint.Address"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-RDS-Endpoint"
                }
            }
        },
        "RDSPort": {
            "Description": "RDS Instance Port",
            "Value": {
                "Fn::GetAtt": [
                    "RDSInstance",
                    "Endpoint.Port"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-RDS-Port"
                }
            }
        },
        "LambdaFunctionArn": {
            "Description": "Security Lambda Function ARN",
            "Value": {
                "Fn::GetAtt": [
                    "SecurityLambdaFunction",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Lambda-ARN"
                }
            }
        },
        "LambdaFunctionName": {
            "Description": "Security Lambda Function Name",
            "Value": {
                "Ref": "SecurityLambdaFunction"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Lambda-Name"
                }
            }
        },
        "GuardDutyDetectorId": {
            "Description": "GuardDuty Detector ID",
            "Value": {
                "Fn::If": [
                    "EnableGuardDutyCondition",
                    {
                        "Ref": "GuardDutyDetector"
                    },
                    "N/A - GuardDuty Disabled or Not Primary Region"
                ]
            }
        },
        "CloudTrailArn": {
            "Description": "CloudTrail ARN",
            "Value": {
                "Fn::If": [
                    "EnableCloudTrailCondition",
                    {
                        "Fn::GetAtt": [
                            "CloudTrail",
                            "Arn"
                        ]
                    },
                    "N/A - CloudTrail Disabled or Not Primary Region"
                ]
            }
        },
        "WebACLArn": {
            "Description": "WAF WebACL ARN",
            "Value": {
                "Fn::GetAtt": [
                    "WebACL",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebACL-ARN"
                }
            }
        },
        "SecurityNotificationTopicArn": {
            "Description": "SNS Topic ARN for Security Notifications",
            "Value": {
                "Ref": "SecurityNotificationTopic"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-SNS-Topic-ARN"
                }
            }
        },
        "VPCFlowLogsGroup": {
            "Description": "VPC Flow Logs CloudWatch Log Group",
            "Value": {
                "Fn::If": [
                    "EnableVPCFlowLogsCondition",
                    {
                        "Ref": "VPCFlowLogsGroup"
                    },
                    "N/A - VPC Flow Logs Disabled"
                ]
            }
        },
        "Environment": {
            "Description": "Deployment Environment",
            "Value": {
                "Ref": "Environment"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Environment"
                }
            }
        },
        "ProjectName": {
            "Description": "Project Name",
            "Value": {
                "Ref": "ProjectName"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Project-Name"
                }
            }
        },
        "SecondaryRegion": {
            "Description": "Secondary AWS Region for disaster recovery",
            "Value": {
                "Ref": "SecondaryRegion"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Secondary-Region"
                }
            }
        }
    }
}```

## Test Files

````
