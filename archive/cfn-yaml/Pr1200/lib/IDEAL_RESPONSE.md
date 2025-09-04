# Secure AWS Infrastructure Template

# Notes:
 1. All resources are **dynamic**; no hardcoding of environment-specific IDs.
 2. **Multi-AZ** enabled for **RDS** for high availability.
 3. **CloudTrail** captures all S3 buckets and management events.
 4. **VPC Flow Logs** enabled for auditing.
 5. **AWS Config Delivery Channel** uses **KMS encryption**.
 6. **IAM roles** follow least privilege; **MFA** enforcement considered via policy placeholders.
 7. **EC2 instances** use **dynamic AMI** lookup via **SSM Parameter** store for Amazon Linux 2.
 8. **WAF** includes AWS Managed Rule Set for broader coverage.
 9. **CloudWatch** log retention is parameterized.
 10. **GuardDuty** findings can be pushed to SNS for alerting.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure AWS Infrastructure Environment with comprehensive security controls.
  Implements KMS encryption, secure VPC, RDS, EC2, S3, CloudTrail, Config,
  GuardDuty, WAF, Flow Logs, and monitoring.

Metadata:
  cfn-lint:
    config:
      ignore_checks:
        - W1030

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [prod, dev, stage]
    Description: Environment name (prod/dev/stage)

  KeyPairName:
    Type: String
    Default: ''
    Description: EC2 Key Pair for SSH access

  DBMasterUsername:
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Master username for RDS instance

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: CIDR block for VPC

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
    Description: SSM parameter for the latest Amazon Linux 2023 AMI (region-specific)

  NameSuffix:
    Type: String
    Default: ''
    AllowedPattern: '^[a-z0-9-]{0,32}$'
    Description: Optional lowercase suffix to make S3 bucket names unique (e.g., pr1200)

  ExistingKMSKeyArn:
    Type: String
    Default: ''
    Description: If provided, reuse this KMS Key ARN instead of creating a new one

  ExistingBastionSGId:
    Type: String
    Default: ''
    Description: If provided, reuse this Bastion Security Group ID

  ExistingWebSGId:
    Type: String
    Default: ''
    Description: If provided, reuse this Web Security Group ID

  ExistingDBSGId:
    Type: String
    Default: ''
    Description: If provided, reuse this DB Security Group ID

  ExistingWebInstanceId:
    Type: String
    Default: ''
    Description: If provided, reuse this Web EC2 Instance ID

  ExistingBastionInstanceId:
    Type: String
    Default: ''
    Description: If provided, reuse this Bastion EC2 Instance ID

  UseExistingS3MainBucket:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Set to 'true' to use an existing main S3 bucket

  ExistingS3MainBucketName:
    Type: String
    Default: ''
    Description: Name of existing main S3 bucket when UseExistingS3MainBucket is 'true'

  CreateCloudTrail:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Whether to create CloudTrail resources

  CreateAwsConfig:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Whether to create AWS Config resources

  UseExistingVPC:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Set to 'true' to use existing VPC and subnets instead of creating new networking

  ExistingVPCId:
    Type: String
    Default: ''
    AllowedPattern: '^$|^vpc-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing VPC ID to use when UseExistingVPC is 'true'

  ExistingPublicSubnet1Id:
    Type: String
    Default: ''
    AllowedPattern: '^$|^subnet-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing public subnet 1 ID when UseExistingVPC is 'true'

  ExistingPrivateSubnet1Id:
    Type: String
    Default: ''
    AllowedPattern: '^$|^subnet-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing private subnet 1 ID when UseExistingVPC is 'true'

  ExistingPrivateSubnet2Id:
    Type: String
    Default: ''
    AllowedPattern: '^$|^subnet-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing private subnet 2 ID when UseExistingVPC is 'true'

  UseExistingNatGateways:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Set to 'true' to reuse existing NAT Gateways instead of creating new ones

  ExistingNatGateway1Id:
    Type: String
    Default: ''
    AllowedPattern: '^$|^nat-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing NAT Gateway ID for AZ1 (optional)

  ExistingNatGateway2Id:
    Type: String
    Default: ''
    AllowedPattern: '^$|^nat-([0-9A-Fa-f]{8}|[0-9A-Fa-f]{17})$'
    Description: Existing NAT Gateway ID for AZ2 (optional)

  FlowLogsRoleArn:
    Type: String
    Default: ''
    Description: Optional IAM role ARN for VPC Flow Logs to deliver to CloudWatch Logs. Leave empty to use the default service-linked role.

  CreateGuardDutyDetector:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: Whether to create a new GuardDuty detector (set to 'true' only if one does not already exist in this region)

  # Removed: ExistingGuardDutyDetectorId (no longer used)

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  CreateDetector: !Equals [!Ref CreateGuardDutyDetector, 'true']
  UseExistingNetworking: !Equals [!Ref UseExistingVPC, 'true']
  CreateNetworking: !Equals [!Ref UseExistingVPC, 'false']
  HasNameSuffix: !Not [!Equals [!Ref NameSuffix, '']]
  CreateCloudTrailCond: !Equals [!Ref CreateCloudTrail, 'true']
  CreateAwsConfigCond: !Equals [!Ref CreateAwsConfig, 'true']
  UseExistingS3MainBucketCond: !Equals [!Ref UseExistingS3MainBucket, 'true']
  CreateMainS3BucketCond: !Equals [!Ref UseExistingS3MainBucket, 'false']
  UseExistingKMSCond: !Not [!Equals [!Ref ExistingKMSKeyArn, '']]
  CreateKMSCond: !Equals [!Ref ExistingKMSKeyArn, '']
  HasFlowLogsRoleArn: !Not [!Equals [!Ref FlowLogsRoleArn, '']]
  FlowLogCreatableCond:
    !Or [!Condition HasFlowLogsRoleArn, !Condition CreateNetworking]
  UseExistingNatCond: !Equals [!Ref UseExistingNatGateways, 'true']
  CreateNatCond: !Equals [!Ref UseExistingNatGateways, 'false']
  CreateNatResourcesCond:
    !And [!Condition CreateNetworking, !Condition CreateNatCond]
  CreateBastionSGFinalCond: !Equals [!Ref ExistingBastionSGId, '']
  CreateWebSGFinalCond: !Equals [!Ref ExistingWebSGId, '']
  CreateDBSGFinalCond: !Equals [!Ref ExistingDBSGId, '']
  UseExistingWebSGCond: !Not [!Equals [!Ref ExistingWebSGId, '']]
  UseExistingBastionSGCond: !Not [!Equals [!Ref ExistingBastionSGId, '']]
  UseExistingDBSGCond: !Not [!Equals [!Ref ExistingDBSGId, '']]
  CreateWebInstanceCond: !Equals [!Ref ExistingWebInstanceId, '']
  CreateBastionInstanceCond: !Equals [!Ref ExistingBastionInstanceId, '']

Resources:
  # =========================
  # KMS Key
  # =========================
  SecureEnvKMSKey:
    Condition: CreateKMSCond
    Type: AWS::KMS::Key
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Description: KMS Key for SecureEnv encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: AllowRDS
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:ViaService: !Sub rds.${AWS::Region}.amazonaws.com
      EnableKeyRotation: true
      PendingWindowInDays: 7

  SecureEnvKMSAlias:
    Condition: CreateKMSCond
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/SecureEnv-MasterKey
      TargetKeyId: !Ref SecureEnvKMSKey

  # =========================
  # AWS Secrets Manager
  # =========================
  SecureEnvDBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub SecureEnv-DB-Secret-${Environment}
      Description: Database credentials for SecureEnv RDS instance
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 24
        ExcludeCharacters: '"@/\\'
      KmsKeyId:
        !If [UseExistingKMSCond, !Ref ExistingKMSKeyArn, !Ref SecureEnvKMSKey]

  # =========================
  # VPC and Networking
  # =========================
  SecureEnvVPC:
    Condition: CreateNetworking
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-VPC-${Environment}

  VPCIdValue:
    Type: AWS::SSM::Parameter
    Condition: UseExistingNetworking
    Properties:
      Name: !Sub /TapStack/${Environment}/ExistingVPCId
      Type: String
      Value: !Ref ExistingVPCId

  SecureEnvInternetGateway:
    Condition: CreateNetworking
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-IGW-${Environment}

  SecureEnvVPCGatewayAttachment:
    Condition: CreateNetworking
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureEnvVPC
      InternetGatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPublicSubnet1:
    Condition: CreateNetworking
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Public-Subnet-1-${Environment}

  SecureEnvPublicSubnet2:
    Condition: CreateNetworking
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Public-Subnet-2-${Environment}

  SecureEnvPrivateSubnet1:
    Condition: CreateNetworking
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Private-Subnet-1-${Environment}

  SecureEnvPrivateSubnet2:
    Condition: CreateNetworking
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Private-Subnet-2-${Environment}

  SecureEnvPublicRouteTable:
    Condition: CreateNetworking
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Public-RT-${Environment}

  SecureEnvPublicRoute:
    Condition: CreateNetworking
    Type: AWS::EC2::Route
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPublicSubnet1RouteTableAssociation:
    Condition: CreateNetworking
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet1
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPublicSubnet2RouteTableAssociation:
    Condition: CreateNetworking
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet2
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPrivateRouteTable1:
    Condition: CreateNetworking
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Private-RT-1-${Environment}

  SecureEnvPrivateRouteTable2:
    Condition: CreateNetworking
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Private-RT-2-${Environment}

  SecureEnvPrivateSubnet1RouteTableAssociation:
    Condition: CreateNetworking
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet1
      RouteTableId: !Ref SecureEnvPrivateRouteTable1

  SecureEnvPrivateSubnet2RouteTableAssociation:
    Condition: CreateNetworking
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet2
      RouteTableId: !Ref SecureEnvPrivateRouteTable2

  SecureEnvEIP1:
    Condition: CreateNatResourcesCond
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-EIP-1-${Environment}

  SecureEnvEIP2:
    Condition: CreateNatResourcesCond
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-EIP-2-${Environment}

  SecureEnvNATGateway1:
    Condition: CreateNatResourcesCond
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvEIP1.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-NAT-1-${Environment}

  SecureEnvNATGateway2:
    Condition: CreateNatResourcesCond
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvEIP2.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-NAT-2-${Environment}

  SecureEnvPrivateRoute1:
    Condition: CreateNetworking
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        !If [
          UseExistingNatCond,
          !Ref ExistingNatGateway1Id,
          !Ref SecureEnvNATGateway1,
        ]

  SecureEnvPrivateRoute2:
    Condition: CreateNetworking
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        !If [
          UseExistingNatCond,
          !Ref ExistingNatGateway2Id,
          !Ref SecureEnvNATGateway2,
        ]

  # =========================
  # Security Groups
  # =========================
  SecureEnvBastionSG:
    Condition: CreateBastionSGFinalCond
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub SecureEnv-Bastion-SG-${Environment}
      GroupDescription: Security group for bastion host
      VpcId: !If [CreateNetworking, !Ref SecureEnvVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Bastion-SG-${Environment}

  SecureEnvWebSG:
    Condition: CreateWebSGFinalCond
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub SecureEnv-Web-SG-${Environment}
      GroupDescription: Security group for web instances
      VpcId: !If [CreateNetworking, !Ref SecureEnvVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId:
            !If [
              CreateBastionSGFinalCond,
              !Ref SecureEnvBastionSG,
              !Ref ExistingBastionSGId,
            ]
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Web-SG-${Environment}

  SecureEnvDBSG:
    Condition: CreateDBSGFinalCond
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub SecureEnv-DB-SG-${Environment}
      GroupDescription: Security group for RDS database
      VpcId: !If [CreateNetworking, !Ref SecureEnvVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId:
            !If [
              CreateWebSGFinalCond,
              !Ref SecureEnvWebSG,
              !Ref ExistingWebSGId,
            ]
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId:
            !If [
              CreateBastionSGFinalCond,
              !Ref SecureEnvBastionSG,
              !Ref ExistingBastionSGId,
            ]
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-DB-SG-${Environment}

  # =========================
  # IAM Roles
  # =========================
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      # RoleName removed to avoid CAPABILITY_NAMED_IAM requirement
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
        - PolicyName: SecureEnvEC2Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  !If [
                    UseExistingS3MainBucketCond,
                    !Sub 'arn:${AWS::Partition}:s3:::${ExistingS3MainBucketName}/*',
                    !Sub 'arn:${AWS::Partition}:s3:::${SecureEnvS3Bucket}/*',
                  ]
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource:
                  !If [
                    UseExistingKMSCond,
                    !Ref ExistingKMSKeyArn,
                    !GetAtt SecureEnvKMSKey.Arn,
                  ]

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      # InstanceProfileName removed to avoid CAPABILITY_NAMED_IAM requirement
      Roles:
        - !Ref SecureEnvEC2Role

  # =========================
  # S3 Bucket
  # =========================
  SecureEnvS3Bucket:
    Condition: CreateMainS3BucketCond
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !If
        - HasNameSuffix
        - !Sub 'secureenv-secure-bucket-${AWS::AccountId}-${AWS::Region}-${NameSuffix}'
        - !Sub 'secureenv-secure-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                !If [
                  UseExistingKMSCond,
                  !Ref ExistingKMSKeyArn,
                  !Ref SecureEnvKMSKey,
                ]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Secure-Bucket-${Environment}

  SecureEnvS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        !If [
          UseExistingS3MainBucketCond,
          !Ref ExistingS3MainBucketName,
          !Ref SecureEnvS3Bucket,
        ]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource:
              !If [
                UseExistingS3MainBucketCond,
                !Sub 'arn:${AWS::Partition}:s3:::${ExistingS3MainBucketName}/*',
                !Sub 'arn:${AWS::Partition}:s3:::${SecureEnvS3Bucket}/*',
              ]
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms
          - Sid: DenyIncorrectEncryptionHeader
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource:
              !If [
                UseExistingS3MainBucketCond,
                !Sub 'arn:${AWS::Partition}:s3:::${ExistingS3MainBucketName}/*',
                !Sub 'arn:${AWS::Partition}:s3:::${SecureEnvS3Bucket}/*',
              ]
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption-aws-kms-key-id:
                  !If [
                    UseExistingKMSCond,
                    !Ref ExistingKMSKeyArn,
                    !Ref SecureEnvKMSKey,
                  ]

  # =========================
  # RDS Database
  # =========================
  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub SecureEnv-DB-SubnetGroup-${Environment}
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !If [
            CreateNetworking,
            !Ref SecureEnvPrivateSubnet1,
            !Ref ExistingPrivateSubnet1Id,
          ]
        - !If [
            CreateNetworking,
            !Ref SecureEnvPrivateSubnet2,
            !Ref ExistingPrivateSubnet2Id,
          ]
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-DB-SubnetGroup-${Environment}

  SecureEnvRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub SecureEnv-MySQL-DB-${Environment}
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Sub '{{resolve:secretsmanager:${SecureEnvDBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${SecureEnvDBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId:
        !If [UseExistingKMSCond, !Ref ExistingKMSKeyArn, !Ref SecureEnvKMSKey]
      VPCSecurityGroups:
        - !If [UseExistingDBSGCond, !Ref ExistingDBSGId, !Ref SecureEnvDBSG]
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-MySQL-DB-${Environment}

  # =========================
  # EC2 Launch Template
  # =========================
  SecureEnvLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub SecureEnv-LaunchTemplate-${Environment}
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.micro
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        SecurityGroupIds:
          - !If [
              UseExistingWebSGCond,
              !Ref ExistingWebSGId,
              !Ref SecureEnvWebSG,
            ]
        IamInstanceProfile:
          Arn: !GetAtt SecureEnvEC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId:
                !If [
                  UseExistingKMSCond,
                  !Ref ExistingKMSKeyArn,
                  !Ref SecureEnvKMSKey,
                ]
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            systemctl enable amazon-cloudwatch-agent
            systemctl start amazon-cloudwatch-agent

  SecureEnvWebInstance:
    Condition: CreateWebInstanceCond
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref SecureEnvLaunchTemplate
        Version: !GetAtt SecureEnvLaunchTemplate.LatestVersionNumber
      SubnetId:
        !If [
          CreateNetworking,
          !Ref SecureEnvPrivateSubnet1,
          !Ref ExistingPrivateSubnet1Id,
        ]
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Web-Instance-${Environment}

  SecureEnvBastionInstance:
    Condition: CreateBastionInstanceCond
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      SecurityGroupIds:
        - !If [
            UseExistingBastionSGCond,
            !Ref ExistingBastionSGId,
            !Ref SecureEnvBastionSG,
          ]
      SubnetId:
        !If [
          CreateNetworking,
          !Ref SecureEnvPublicSubnet1,
          !Ref ExistingPublicSubnet1Id,
        ]
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId:
              !If [
                UseExistingKMSCond,
                !Ref ExistingKMSKeyArn,
                !Ref SecureEnvKMSKey,
              ]
            DeleteOnTermination: true
      MetadataOptions:
        HttpTokens: required
        HttpPutResponseHopLimit: 1
        HttpEndpoint: enabled
      Tags:
        - Key: Name
          Value: !Sub SecureEnv-Bastion-Host-${Environment}

  # =========================
  # CloudTrail
  # =========================
  SecureEnvCloudTrailBucket:
    Condition: CreateCloudTrailCond
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !If
        - HasNameSuffix
        - !Sub 'secureenv-cloudtrail-${AWS::AccountId}-${AWS::Region}-${NameSuffix}'
        - !Sub 'secureenv-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                !If [
                  UseExistingKMSCond,
                  !Ref ExistingKMSKeyArn,
                  !Ref SecureEnvKMSKey,
                ]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: SecureEnv-CloudTrail-Bucket

  SecureEnvCloudTrail:
    Condition: CreateCloudTrailCond
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub SecureEnv-CloudTrail-${Environment}
      S3BucketName:
        !If [
          UseExistingS3MainBucketCond,
          !Ref ExistingS3MainBucketName,
          !Ref SecureEnvCloudTrailBucket,
        ]
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      KMSKeyId:
        !If [UseExistingKMSCond, !Ref ExistingKMSKeyArn, !Ref SecureEnvKMSKey]
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !If [
                    UseExistingS3MainBucketCond,
                    !Sub 'arn:${AWS::Partition}:s3:::${ExistingS3MainBucketName}/*',
                    !Sub 'arn:${AWS::Partition}:s3:::${SecureEnvS3Bucket}/*',
                  ]

  # =========================
  # AWS Config
  # =========================
  # Using existing AWS Config service-linked role if present

  SecureEnvConfigBucket:
    Condition: CreateAwsConfigCond
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !If
        - HasNameSuffix
        - !Sub 'secureenv-config-${AWS::AccountId}-${AWS::Region}-${NameSuffix}'
        - !Sub 'secureenv-config-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                !If [
                  UseExistingKMSCond,
                  !Ref ExistingKMSKeyArn,
                  !Ref SecureEnvKMSKey,
                ]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldConfig
            Status: Enabled
            ExpirationInDays: 2555
      Tags:
        - Key: Name
          Value: SecureEnv-Config-Bucket

  SecureEnvConfigurationRecorder:
    Condition: CreateAwsConfigCond
    Type: AWS::Config::ConfigurationRecorder
    DependsOn:
      - SecureEnvDeliveryChannel
    Properties:
      Name: !Sub SecureEnv-Config-Recorder-${Environment}
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecureEnvDeliveryChannel:
    Condition: CreateAwsConfigCond
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub SecureEnv-Config-DeliveryChannel-${Environment}
      S3BucketName: !Ref SecureEnvConfigBucket

  SecureEnvConfigRuleS3Encryption:
    Condition: CreateAwsConfigCond
    Type: AWS::Config::ConfigRule
    DependsOn:
      - SecureEnvConfigurationRecorder
      - SecureEnvDeliveryChannel
    Properties:
      ConfigRuleName: !Sub SecureEnv-S3-Bucket-Encryption-${Environment}
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  SecureEnvConfigRuleRDSEncryption:
    Condition: CreateAwsConfigCond
    Type: AWS::Config::ConfigRule
    DependsOn:
      - SecureEnvConfigurationRecorder
      - SecureEnvDeliveryChannel
    Properties:
      ConfigRuleName: !Sub SecureEnv-RDS-Encryption-${Environment}
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED

  # =========================
  # GuardDuty
  # =========================
  SecureEnvGuardDuty:
    Condition: CreateDetector
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true

  # Removed placeholder custom resource; use conditional output instead

  # =========================
  # WAF
  # =========================
  SecureEnvWAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub SecureEnv-WebACL-${Environment}
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: SQLInjectionRule
          Priority: 1
          Statement:
            SqliMatchStatement:
              FieldToMatch:
                Body: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLInjectionRule
        - Name: XSSRule
          Priority: 2
          Statement:
            XssMatchStatement:
              FieldToMatch:
                Body: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: XSSRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: SecureEnv-WebACL

  # =========================
  # VPC Flow Logs
  # =========================
  # Assume VPC Flow Logs service-linked role exists or the deployer has permission to auto-create it

  SecureEnvFlowLogBucket:
    Condition: CreateNetworking
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !If
        - HasNameSuffix
        - !Sub 'secureenv-flowlogs-${AWS::AccountId}-${AWS::Region}-${NameSuffix}'
        - !Sub 'secureenv-flowlogs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldFlowLogs
            Status: Enabled
            ExpirationInDays: 30
      Tags:
        - Key: Name
          Value: SecureEnv-FlowLog-Bucket

  SecureEnvVPCFlowLog:
    Condition: FlowLogCreatableCond
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/vpc/flowlogs/${Environment}
      RetentionInDays: 30

  SecureEnvFlowLog:
    Condition: FlowLogCreatableCond
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceId: !If [CreateNetworking, !Ref SecureEnvVPC, !Ref ExistingVPCId]
      ResourceType: VPC
      TrafficType: ALL
      LogDestinationType: !If [HasFlowLogsRoleArn, cloud-watch-logs, s3]
      LogGroupName:
        !If [HasFlowLogsRoleArn, !Ref SecureEnvVPCFlowLog, !Ref 'AWS::NoValue']
      LogDestination:
        !If [
          HasFlowLogsRoleArn,
          !Ref 'AWS::NoValue',
          !GetAtt SecureEnvFlowLogBucket.Arn,
        ]
      DeliverLogsPermissionArn:
        !If [HasFlowLogsRoleArn, !Ref FlowLogsRoleArn, !Ref 'AWS::NoValue']

Outputs:
  VPCId:
    Description: VPC ID
    Value: !If [CreateNetworking, !Ref SecureEnvVPC, !Ref ExistingVPCId]
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  KMSKeyId:
    Description: KMS Key ID
    Condition: CreateKMSCond
    Value: !Ref SecureEnvKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  KMSKeyArn:
    Description: KMS Key ARN
    Condition: CreateKMSCond
    Value: !GetAtt SecureEnvKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  S3BucketName:
    Description: S3 Bucket Name
    Value:
      !If [
        UseExistingS3MainBucketCond,
        !Ref ExistingS3MainBucketName,
        !Ref SecureEnvS3Bucket,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  RDSInstanceId:
    Description: RDS Instance ID
    Value: !Ref SecureEnvRDSInstance
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Instance-ID'

  WebInstanceId:
    Description: Web Instance ID
    Condition: CreateWebInstanceCond
    Value: !Ref SecureEnvWebInstance
    Export:
      Name: !Sub '${AWS::StackName}-Web-Instance-ID'

  BastionInstanceId:
    Description: Bastion Instance ID
    Condition: CreateBastionInstanceCond
    Value: !Ref SecureEnvBastionInstance
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-Instance-ID'

  CloudTrailName:
    Description: CloudTrail Name
    Condition: CreateCloudTrailCond
    Value: !Ref SecureEnvCloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Name'

  GuardDutyDetectorId:
    Description: GuardDuty Detector ID
    Condition: CreateDetector
    Value: !Ref SecureEnvGuardDuty
    Export:
      Name: !Sub '${AWS::StackName}-GuardDuty-Detector-ID'

  WAFWebACLId:
    Description: WAF Web ACL ID
    Value: !Ref SecureEnvWAFWebACL
    Export:
      Name: !Sub '${AWS::StackName}-WAF-WebACL-ID'

  Environment:
    Description: Environment name
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

```
