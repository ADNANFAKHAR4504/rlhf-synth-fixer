```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Production-ready single-region environment (VPC, ALB+ASG, RDS Multi-AZ, S3, optional Route53 records). No global resources. No AWS Config.

Parameters:
  EnvironmentName:
    Type: String
    Default: prod-regional
    Description: Environment name for tagging and resource names
    AllowedPattern: "^[a-z0-9-]+$"
    ConstraintDescription: "Use lowercase letters, digits, and hyphens only."

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: CIDR block for the VPC

  AZCount:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 3
    Description: Number of Availability Zones to use (2 or 3)

  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.1.0/24,10.0.2.0/24
    Description: CIDRs for public subnets in order of AZs

  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.10.0/24,10.0.20.0/24
    Description: CIDRs for private subnets in order of AZs

  S3BucketNameOverride:
    Type: String
    Default: ""
    Description: "Optional. If set, use this as the S3 bucket name. Otherwise a unique name is generated."
    AllowedPattern: "^$|^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
    ConstraintDescription: "Must be empty or a valid lowercase S3 bucket name (3–63 chars, letters/digits/hyphens)."

  EnableS3Replication:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: Enable S3 Cross-Region Replication

  ReplicationDestinationBucketArn:
    Type: String
    Default: ""
    Description: "ARN of destination bucket for S3 replication (optional)"

  DBSecretArn:
    Type: String
    Default: ""
    Description: "Optional. If set, use this Secrets Manager ARN (JSON keys: username, password). Otherwise the stack creates a secret."

  DBInstanceClass:
    Type: String
    Default: db.m5.large
    AllowedValues: [db.m5.large]
    Description: RDS instance class (fixed by requirement)

  DBName:
    Type: String
    Default: appdb
    Description: Initial database name

  DBEngine:
    Type: String
    Default: postgres
    AllowedValues: [postgres, mysql]
    Description: Database engine

  PostgresEngineVersion:
    Type: String
    Default: "14.18"
    AllowedValues:
      - "17.5"
      - "16.9"
      - "15.13"
      - "14.18"
      - "13.21"
    Description: RDS-supported PostgreSQL minor versions

  MySqlEngineVersion:
    Type: String
    Default: "8.0.35"
    AllowedPattern: "^[0-9]+([.][0-9]+){1,2}$"
    Description: MySQL engine version (8.0 family)

  DBDeletionProtection:
    Type: String
    Default: "true"
    AllowedValues: ["true", "false"]
    Description: Enable deletion protection on RDS instance

  EC2InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues: [t3.medium]
    Description: EC2 instance type (fixed by requirement)

  AsgMinSize:
    Type: Number
    Default: 2
    MinValue: 2
    Description: Auto Scaling Group minimum size (>=2)

  AsgMaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    Description: Auto Scaling Group maximum size

  AsgDesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    Description: Auto Scaling Group desired capacity (>=2)

  AllowedCidrIngress:
    Type: CommaDelimitedList
    Default: 0.0.0.0/0
    Description: CIDR(s) allowed for SSH/HTTP/HTTPS (first entry used)

  HostedZoneId:
    Type: String
    Default: ""
    Description: Existing Route53 Hosted Zone ID to create ALIAS records (optional)

  ACMCertificateArn:
    Type: String
    Default: ""
    Description: Regional ACM certificate ARN for HTTPS on ALB (optional)

  Project:
    Type: String
    Default: MyProject
    Description: Project tag

  Owner:
    Type: String
    Default: DevOps
    Description: Owner tag

  UseNamedIam:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: "If true, use fixed IAM names (requires CAPABILITY_NAMED_IAM). If false, let CFN auto-name (only CAPABILITY_IAM required)."

Conditions:
  EnableReplication: !And
    - !Equals [!Ref EnableS3Replication, "true"]
    - !Not [!Equals [!Ref ReplicationDestinationBucketArn, ""]]
  CreateRoute53Records: !Not [!Equals [!Ref HostedZoneId, ""]]
  EnableHTTPS: !Not [!Equals [!Ref ACMCertificateArn, ""]]
  UseThreeAZs: !Equals [!Ref AZCount, 3]
  IsPostgres: !Equals [!Ref DBEngine, postgres]
  DeletionProtectionOn: !Equals [!Ref DBDeletionProtection, "true"]
  HasBucketOverride: !Not [!Equals [!Ref S3BucketNameOverride, ""]]
  HasDBSecretArn: !Not [!Equals [!Ref DBSecretArn, ""]]
  CreateDBSecret: !Equals [!Ref DBSecretArn, ""]
  UseNamedIamCond: !Equals [!Ref UseNamedIam, "true"]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: Region
          Value: !Ref "AWS::Region"

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-igw"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-az1"
        - Key: Tier
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-az2"
        - Key: Tier
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseThreeAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !Select [2, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-az3"
        - Key: Tier
          Value: public
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-az1"
        - Key: Tier
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-az2"
        - Key: Tier
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseThreeAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !Select [2, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-az3"
        - Key: Tier
          Value: private
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatEip1:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-eip-az1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatEip2:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-eip-az2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatEip3:
    Type: AWS::EC2::EIP
    Condition: UseThreeAZs
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-eip-az3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGw1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-az1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGw2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-az2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGw3:
    Type: AWS::EC2::NatGateway
    Condition: UseThreeAZs
    Properties:
      AllocationId: !GetAtt NatEip3.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-nat-az3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-rt"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  AssocPub1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  AssocPub2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  AssocPub3:
    Condition: UseThreeAZs
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PrivateRt1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-rt-az1"
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateRt2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-rt-az2"
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateRt3:
    Condition: UseThreeAZs
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-rt-az3"
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateDefaultRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRt1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGw1

  PrivateDefaultRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRt2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGw2

  PrivateDefaultRoute3:
    Condition: UseThreeAZs
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRt3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGw3

  AssocPriv1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRt1
      SubnetId: !Ref PrivateSubnet1

  AssocPriv2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRt2
      SubnetId: !Ref PrivateSubnet2

  AssocPriv3:
    Condition: UseThreeAZs
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRt3
      SubnetId: !Ref PrivateSubnet3

  PublicNacl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-nacl"

  PublicNaclInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNacl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicNaclOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNacl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  AssocPubNacl1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNacl

  AssocPubNacl2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNacl

  AssocPubNacl3:
    Condition: UseThreeAZs
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      NetworkAclId: !Ref PublicNacl

  PrivateNacl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-nacl"

  PrivateNaclInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNacl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr

  PrivateNaclOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNacl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  AssocPrivNacl1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNacl

  AssocPrivNacl2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNacl

  AssocPrivNacl3:
    Condition: UseThreeAZs
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      NetworkAclId: !Ref PrivateNacl

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB security group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Select [0, !Ref AllowedCidrIngress]
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Select [0, !Ref AllowedCidrIngress]
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-alb-sg"

  WebTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web tier instances security group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Select [0, !Ref AllowedCidrIngress]
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-web-sg"

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS security group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [IsPostgres, 5432, 3306]
          ToPort: !If [IsPostgres, 5432, 3306]
          SourceSecurityGroupId: !Ref WebTierSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-db-sg"

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        !If [
          UseNamedIamCond,
          !Sub "${EnvironmentName}-ec2-instance-role",
          !Ref "AWS::NoValue",
        ]
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: s3-access
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: ObjectsRW
                Effect: Allow
                Action: [s3:GetObject, s3:PutObject, s3:DeleteObject]
                Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
              - Sid: ListBucket
                Effect: Allow
                Action: s3:ListBucket
                Resource: !Sub "arn:aws:s3:::${S3Bucket}"
        - PolicyName: secretsmanager-read-db
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action: [secretsmanager:GetSecretValue]
                Resource: !If [HasDBSecretArn, !Ref DBSecretArn, !Ref DBSecret]

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName:
        !If [
          UseNamedIamCond,
          !Sub "${EnvironmentName}-ec2-instance-profile",
          !Ref "AWS::NoValue",
        ]
      Roles: [!Ref EC2InstanceRole]

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        !If [
          UseNamedIamCond,
          !Sub "${EnvironmentName}-rds-monitoring-role",
          !Ref "AWS::NoValue",
        ]
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: EnableReplication
    Properties:
      RoleName:
        !If [
          UseNamedIamCond,
          !Sub "${EnvironmentName}-s3-replication-role",
          !Ref "AWS::NoValue",
        ]
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole

  S3ReplicationPolicy:
    Type: AWS::IAM::Policy
    Condition: EnableReplication
    Properties:
      PolicyName: s3-replication
      Roles:
        - !Ref S3ReplicationRole
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: SourceRead
            Effect: Allow
            Action:
              - s3:GetReplicationConfiguration
              - s3:ListBucket
            Resource: !Sub "arn:aws:s3:::${S3Bucket}"
          - Sid: SourceObjectRead
            Effect: Allow
            Action:
              - s3:GetObjectVersion
              - s3:GetObjectVersionAcl
              - s3:GetObjectVersionTagging
            Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
          - Sid: DestWrite
            Effect: Allow
            Action:
              - s3:ReplicateObject
              - s3:ReplicateDelete
              - s3:ReplicateTags
            Resource: !Sub "${ReplicationDestinationBucketArn}/*"

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Condition: CreateDBSecret
    Properties:
      Name: !Sub "${EnvironmentName}/appdb/credentials"
      Description: "App DB credentials (created by CloudFormation)"
      GenerateSecretString:
        SecretStringTemplate: '{"username":"appuser"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludePunctuation: true

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${EnvironmentName}-lt"
      LaunchTemplateData:
        ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds: [!Ref WebTierSecurityGroup]
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpEndpoint: enabled
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: |
            #!/bin/bash
            set -euo pipefail
            yum update -y
            yum install -y amazon-cloudwatch-agent
            systemctl enable amazon-cloudwatch-agent
            systemctl start amazon-cloudwatch-agent

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${EnvironmentName}-alb"
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !If [UseThreeAZs, !Ref PublicSubnet3, !Ref "AWS::NoValue"]
      SecurityGroups: [!Ref ALBSecurityGroup]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-alb"

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${EnvironmentName}-tg"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: "200-399"

  ALBListenerHttp:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ALBListenerHttps:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: EnableHTTPS
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${EnvironmentName}-asg"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !If [UseThreeAZs, !Ref PrivateSubnet3, !Ref "AWS::NoValue"]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref AsgMinSize
      MaxSize: !Ref AsgMaxSize
      DesiredCapacity: !Ref AsgDesiredCapacity
      TargetGroupARNs: [!Ref ALBTargetGroup]
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-asg-instance"
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref Project
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Private subnets for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !If [UseThreeAZs, !Ref PrivateSubnet3, !Ref "AWS::NoValue"]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-db-subnets"

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${EnvironmentName}-db"
      DBInstanceClass: !Ref DBInstanceClass
      Engine: !Ref DBEngine
      EngineVersion:
        !If [IsPostgres, !Ref PostgresEngineVersion, !Ref MySqlEngineVersion]
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups: [!Ref DatabaseSecurityGroup]
      MasterUsername: !If
        - HasDBSecretArn
        - !Sub "{{resolve:secretsmanager:${DBSecretArn}:SecretString:username}}"
        - !Sub "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
      MasterUserPassword: !If
        - HasDBSecretArn
        - !Sub "{{resolve:secretsmanager:${DBSecretArn}:SecretString:password}}"
        - !Sub "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
      DBName: !Ref DBName
      BackupRetentionPeriod: 7
      DeletionProtection: !If [DeletionProtectionOn, true, false]
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-db"

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - HasBucketOverride
        - !Ref S3BucketNameOverride
        - !Sub
          - "${EnvironmentName}-${AWS::AccountId}-data-${P0}${P1}${P2}"
          - {
              P0:
                !Select [
                  0,
                  !Split ["-", !Select [2, !Split ["/", !Ref "AWS::StackId"]]],
                ],
              P1:
                !Select [
                  1,
                  !Split ["-", !Select [2, !Split ["/", !Ref "AWS::StackId"]]],
                ],
              P2:
                !Select [
                  2,
                  !Split ["-", !Select [2, !Split ["/", !Ref "AWS::StackId"]]],
                ],
            }
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      ReplicationConfiguration:
        Fn::If:
          - EnableReplication
          - Role: !GetAtt S3ReplicationRole.Arn
            Rules:
              - Id: !Sub "${EnvironmentName}-crr"
                Status: Enabled
                Filter: {}
                Destination:
                  Bucket: !Ref ReplicationDestinationBucketArn
                  AccessControlTranslation:
                    Owner: Destination
          - !Ref "AWS::NoValue"
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-data-bucket"
        - Key: Environment
          Value: !Ref EnvironmentName

  ApplicationLoadBalancerRecordA:
    Condition: CreateRoute53Records
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Sub "app.${EnvironmentName}."
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

  ApplicationLoadBalancerRecordAAAA:
    Condition: CreateRoute53Records
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Sub "app.${EnvironmentName}."
      Type: AAAA
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

Outputs:
  VpcId:
    Value: !Ref VPC
    Description: VPC ID

  PublicSubnets:
    Value: !Join
      - ","
      - - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !If [UseThreeAZs, !Ref PublicSubnet3, !Ref "AWS::NoValue"]
    Description: Public subnet IDs

  PrivateSubnets:
    Value: !Join
      - ","
      - - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !If [UseThreeAZs, !Ref PrivateSubnet3, !Ref "AWS::NoValue"]
    Description: Private subnet IDs

  SecurityGroups:
    Value:
      !Join [
        ",",
        [
          !Ref ALBSecurityGroup,
          !Ref WebTierSecurityGroup,
          !Ref DatabaseSecurityGroup,
        ],
      ]
    Description: Security group IDs

  LaunchTemplateId:
    Value: !Ref LaunchTemplate
    Description: Launch template ID

  AsgName:
    Value: !Ref AutoScalingGroup
    Description: Auto Scaling Group name

  AlbDnsName:
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Description: ALB DNS name

  S3BucketNameOut:
    Value: !Ref S3Bucket
    Description: Regional S3 bucket name

  S3BucketArnOut:
    Value: !GetAtt S3Bucket.Arn
    Description: Regional S3 bucket ARN

  RdsEndpoint:
    Value: !GetAtt RDSInstance.Endpoint.Address
    Description: RDS endpoint address

```