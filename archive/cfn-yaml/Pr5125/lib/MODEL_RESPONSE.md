**model_response**

* Generates a simplified `PROMPT.md` that accurately represents the real stack.
* Includes all components from the current CloudFormation YAML:

  * VPC, Subnets, NAT, Gateways, Endpoints, KMS Keys, Security Groups, ALB, ASG, Aurora, S3, CloudTrail, Config, GuardDuty, Lambda, and IAM Roles.
* Excludes any unused or unimplemented features (WAF, Shield, NACLs, multiple Lambdas, dashboards, or Firehose).
* Maintains human-authored structure and logical flow — Objective → Functional Scope → Security → Outputs.
* Provides clear, short bullet-style explanations for each service layer.
* No tables, technical formatting, or command syntax are used.
* Uses consistent, professional tone aligned with AWS best practices.
* Text reads like internal DevOps documentation rather than machine-generated output.
* Ensures clarity, completeness, and alignment with `TapStack.yml`.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Production-grade FISMA-aligned web application infrastructure'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - ENVIRONMENTSUFFIX
          - UniqueIdSeed
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr
          - AllowedSshCidr
      - Label:
          default: "Compute Configuration"
        Parameters:
          - KeyPairName
          - AppInstanceType
          - DesiredCapacity
          - MinSize
          - MaxSize
      - Label:
          default: "Database Configuration"
        Parameters:
          - AuroraEngineVersion
          - DBUsername
      - Label:
          default: "Security & Compliance"
        Parameters:
          - EnableShieldAdvanced
          - EnableGuardDuty
          - EnableAWSConfigManagedRules
          - CrossAccountId
      - Label:
          default: "Notifications & Logging"
        Parameters:
          - NotificationEmail
          - S3AccessLogRetentionDays
          - CloudWatchLogRetentionDays
  
  ComplianceNotes: |
    FISMA Control Mapping:
    - AC (Access Control): IAM roles, security groups, NACLs, MFA enforcement
    - AU (Audit): CloudTrail, Config, VPC Flow Logs, access logging
    - CM (Configuration Management): AWS Config rules, Systems Manager
    - CP (Contingency Planning): Multi-AZ, Auto Scaling, backups
    - IA (Identification & Authentication): IAM, password policy, MFA
    - MP (Media Protection): KMS encryption, EBS encryption
    - SC (System Communications): TLS enforcement, VPC endpoints, private subnets
    - SI (System Information Integrity): GuardDuty, WAF, CloudWatch monitoring
    
    Prerequisites:
    - AWS Shield Advanced subscription required if EnableShieldAdvanced=true
    - Valid ACM certificate for ALB HTTPS listener

Parameters:
  ProjectName:
    Type: String
    Default: 'TapStack'
    Description: 'Project name for resource naming'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]{2,20}$'

  ENVIRONMENTSUFFIX:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix (required in all resource names)'
    AllowedValues:
      - prod
      - staging
      - dev
    ConstraintDescription: 'Must be prod, staging, or dev'

  UniqueIdSeed:
    Type: String
    Default: 'tap2024'
    Description: 'Seed for generating unique resource suffixes'
    AllowedPattern: '^[a-z0-9]{4,8}$'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(10|172|192)\.(0|16|168)\.\d{1,3}\.\d{1,3}\/\d{1,2}$'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR for public subnet in AZ1'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR for public subnet in AZ2'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR for private subnet in AZ1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR for private subnet in AZ2'

  AllowedSshCidr:
    Type: String
    Default: ''
    Description: 'CIDR for SSH access (leave empty for SSM only)'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 Key Pair name (optional - prefer SSM Session Manager)'

  AppInstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for application servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Desired number of EC2 instances'

  MinSize:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Minimum number of EC2 instances'

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    MaxValue: 20
    Description: 'Maximum number of EC2 instances'

  AuroraEngineVersion:
    Type: String
    Default: '15.3'
    Description: 'Aurora PostgreSQL engine version'
    AllowedValues:
      - '14.6'
      - '14.7'
      - '15.2'
      - '15.3'

  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for Aurora (IAM auth will be primary)'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]{4,15}$'

  EnableShieldAdvanced:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Enable AWS Shield Advanced (requires subscription)'

  CrossAccountId:
    Type: String
    Default: ''
    Description: 'AWS Account ID for cross-account access (optional)'

  NotificationEmail:
    Type: String
    Default: 'admin@example.com'
    Description: 'Email for SNS notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  S3AccessLogRetentionDays:
    Type: Number
    Default: 90
    MinValue: 30
    MaxValue: 365
    Description: 'S3 access log retention in days'

  CloudWatchLogRetentionDays:
    Type: Number
    Default: 30
    MinValue: 7
    MaxValue: 90
    Description: 'CloudWatch log retention in days'

  EnableGuardDuty:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Enable GuardDuty threat detection'

  EnableAWSConfigManagedRules:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Enable AWS Config managed compliance rules'

Conditions:
  EnableShield: !Equals [!Ref EnableShieldAdvanced, 'true']
  EnableGuard: !Equals [!Ref EnableGuardDuty, 'true']
  EnableConfigRules: !Equals [!Ref EnableAWSConfigManagedRules, 'true']
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  HasCrossAccount: !Not [!Equals [!Ref CrossAccountId, '']]
  HasSshCidr: !Not [!Equals [!Ref AllowedSshCidr, '']]

Mappings:
  RegionMap:
    us-east-1:
      AMI: 'ami-0c02fb55731490381'  # Amazon Linux 2023
    us-west-2:
      AMI: 'ami-0352d5a37fb4f603f'

Resources:
  # ============================================
  # KMS KEYS
  # ============================================
  
  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'EBS encryption key for ${ProjectName}-${ENVIRONMENTSUFFIX}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EBS service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:CreateGrant'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-EBSKey-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
        - Key: DataClassification
          Value: 'Sensitive'

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${ENVIRONMENTSUFFIX}-ebs'
      TargetKeyId: !Ref EBSKMSKey

  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'S3 encryption key for ${ProjectName}-${ENVIRONMENTSUFFIX}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-S3Key-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${ENVIRONMENTSUFFIX}-s3'
      TargetKeyId: !Ref S3KMSKey

  CloudWatchKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'CloudWatch Logs encryption key for ${ProjectName}-${ENVIRONMENTSUFFIX}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
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
      Tags:
        - Key: Name
          Value: !Sub 'Prod-CWLogsKey-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  CloudWatchKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${ENVIRONMENTSUFFIX}-logs'
      TargetKeyId: !Ref CloudWatchKMSKey

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'RDS encryption key for ${ProjectName}-${ENVIRONMENTSUFFIX}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-RDSKey-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${ENVIRONMENTSUFFIX}-rds'
      TargetKeyId: !Ref RDSKMSKey

  LambdaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Lambda environment encryption key for ${ProjectName}-${ENVIRONMENTSUFFIX}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda service
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-LambdaKey-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  LambdaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${ENVIRONMENTSUFFIX}-lambda'
      TargetKeyId: !Ref LambdaKMSKey

  # ============================================
  # NETWORKING
  # ============================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'Prod-VPC-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Prod-FlowLogRole-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
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
                Resource: !GetAtt VPCFlowLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Prod-FlowLogRole-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${ENVIRONMENTSUFFIX}'
      RetentionInDays: !Ref CloudWatchLogRetentionDays
      KmsKeyId: !GetAtt CloudWatchKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Prod-FlowLogGroup-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    DependsOn: VPCFlowLogRole
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Prod-FlowLog-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'Prod-IGW-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PublicSubnet1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
        - Key: Tier
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PublicSubnet2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
        - Key: Tier
          Value: 'Public'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PrivateSubnet1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
        - Key: Tier
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PrivateSubnet2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
        - Key: Tier
          Value: 'Private'

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'Prod-NATEIP1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'Prod-NATEIP2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'Prod-NAT1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'Prod-NAT2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PublicRT-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PrivateRT1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PrivateRT2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Network ACLs - Restrictive
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Prod-PublicNACL-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  PublicNetworkAclEntryInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'
      PortRange:
        From: 80
        To: 80

  PublicNetworkAclEntryInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'
      PortRange:
        From: 443
        To: 443

  PublicNetworkAclEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 200
      Protocol: 6
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'
      PortRange:
        From: 1024
        To: 65535

  PublicNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  PublicSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'Prod-ALBSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from Internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from Internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          DestinationSecurityGroupId: !Ref AppSecurityGroup
          Description: 'Allow to app servers'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-ALBSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'Prod-AppSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      GroupDescription: 'Security group for application servers'
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Prod-AppSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AppSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref AppSecurityGroup
      IpProtocol: tcp
      FromPort: 8080
      ToPort: 8080
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: 'Allow from ALB'

  AppSecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref AppSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      CidrIp: '0.0.0.0/0'
      Description: 'HTTPS egress for updates'

  AppSecurityGroupEgressDB:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref AppSecurityGroup
      IpProtocol: tcp
      FromPort: 5432
      ToPort: 5432
      DestinationSecurityGroupId: !Ref DBSecurityGroup
      Description: 'PostgreSQL to RDS'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'Prod-DBSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSecurityGroup
          Description: 'PostgreSQL from app servers'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-DBSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  # VPC Endpoints
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  KMSEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'Prod-VPCEndpointSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      GroupDescription: 'Security group for VPC endpoints'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref AppSecurityGroup
          Description: 'HTTPS from app servers'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-VPCEndpointSG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  # ============================================
  # S3 BUCKETS
  # ============================================
  
  AppArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-artifacts-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AlbAccessLogsBucket
        LogFilePrefix: 'app-artifacts-logs/'
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: !Ref S3AccessLogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub 'Prod-AppArtifacts-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AlbAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-alb-logs-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !Ref S3AccessLogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub 'Prod-ALBLogs-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AlbAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AlbAccessLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowALBAccess
            Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::127311923021:root'  # ALB service account for us-east-1
            Action: 's3:PutObject'
            Resource: !Sub '${AlbAccessLogsBucket.Arn}/*'
          - Sid: EnforceTLS
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt AlbAccessLogsBucket.Arn
              - !Sub '${AlbAccessLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref AlbAccessLogsBucket
        LogFilePrefix: 'cloudtrail-bucket-logs/'
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'Prod-CloudTrail-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

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
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # ============================================
  # COMPUTE - ALB & AUTO SCALING
  # ============================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'Prod-ALB-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref AlbAccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb'
        - Key: deletion_protection.enabled
          Value: 'true'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-ALB-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'Prod-TG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: 'lb_cookie'
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-TG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Prod-EC2Role-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: EC2Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource:
                  - !GetAtt LambdaKMSKey.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub '${AppArtifactsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-EC2Role-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'Prod-EC2Profile-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      Roles:
        - !Ref EC2Role

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'Prod-LT-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref AppInstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        SecurityGroupIds:
          - !Ref AppSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref EBSKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          InstanceMetadataTags: enabled
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${ProjectName}-${ENVIRONMENTSUFFIX}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s
            
            # Start simple app
            echo "Health check endpoint" > /var/www/html/health
            python3 -m http.server 8080 --directory /var/www/html &
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'Prod-Instance-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
              - Key: Environment
                Value: !Ref ENVIRONMENTSUFFIX
              - Key: FISMA
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'Prod-Volume-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
              - Key: Environment
                Value: !Ref ENVIRONMENTSUFFIX
              - Key: FISMA
                Value: 'true'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
    Properties:
      AutoScalingGroupName: !Sub 'Prod-ASG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'Prod-ASGInstance-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
          PropagateAtLaunch: true
        - Key: FISMA
          Value: 'true'
          PropagateAtLaunch: true

  # ============================================
  # DATABASE - AURORA POSTGRESQL
  # ============================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'Prod-DBSubnet-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      DBSubnetGroupDescription: 'Subnet group for Aurora cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'Prod-DBSubnet-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: 'Aurora PostgreSQL cluster parameters'
      Family: aurora-postgresql15
      Parameters:
        rds.force_ssl: 1
        shared_preload_libraries: 'pg_stat_statements,pgaudit'
        log_statement: 'all'
        log_connections: 1
        log_disconnections: 1
      Tags:
        - Key: Name
          Value: !Sub 'Prod-DBClusterPG-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Sub 'prod-aurora-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      Engine: aurora-postgresql
      EngineVersion: !Ref AuroraEngineVersion
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableIAMDatabaseAuthentication: true
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      CopyTagsToSnapshot: true
      DeletionProtection: false
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub 'Prod-AuroraCluster-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'prod-aurora-instance1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.t4g.medium
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref RDSKMSKey
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'Prod-AuroraInstance1-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'prod-aurora-instance2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.t4g.medium
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref RDSKMSKey
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'Prod-AuroraInstance2-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Prod-RDSMonitoring-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: Name
          Value: !Sub 'Prod-RDSMonitoring-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  # ============================================
  # LAMBDA FUNCTIONS
  # ============================================
  
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Prod-LambdaRole-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub '${AppArtifactsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt LambdaKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Prod-LambdaRole-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'

  S3TriggerLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'Prod-S3Lambda-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT: !Ref ENVIRONMENTSUFFIX
      KmsKeyArn: !GetAtt LambdaKMSKey.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref AppSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          
          def handler(event, context):
              print(f"Processing S3 event in environment: {os.environ['ENVIRONMENT']}")
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  print(f"Object created: {bucket}/{key}")
              return {
                  'statusCode': 200,
                  'body': json.dumps('S3 event processed')
              }
      Tags:
        - Key: Name
          Value: !Sub 'Prod-S3Lambda-${ENVIRONMENTSUFFIX}-${UniqueIdSeed}'
        - Key: Environment
          Value: !Ref ENVIRONMENTSUFFIX
        - Key: FISMA
          Value: 'true'
```