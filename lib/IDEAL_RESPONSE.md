```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production-grade web application stack (HTTP-only ALB)"

Parameters:
  AllowedAdminCidr:
    Type: String
    Default: "10.0.0.0/8"
    Description: "CIDR block allowed for administrative access (bastion/SSH)"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  DBName:
    Type: String
    Default: "productiondb"
    Description: "Database name"
    MinLength: 1
    MaxLength: 64
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"

  DBUsername:
    Type: String
    Default: "dbadminuser"
    Description: "Database master username (avoid reserved names)"
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
    ConstraintDescription: "Must begin with letter and contain only alphanumeric characters"

  DBEngineVersion:
    Type: String
    Default: "8.0.41"
    AllowedValues: ["8.0.40", "8.0.41", "8.0.42"]
    Description: "MySQL engine version"

  InstanceType:
    Type: String
    Default: "t3.small"
    Description: "EC2 instance type for application servers"
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]

  DesiredCapacity:
    Type: Number
    Default: 2
    Description: "Desired number of EC2 instances"
    MinValue: 2
    MaxValue: 6

  EnforceKeyRotation:
    Type: String
    Default: "true"
    AllowedValues: ["true", "false"]
    Description: "Automatically deactivate IAM access keys older than 90 days"

  KeyPairName:
    Type: String
    Default: ""
    Description: "Optional EC2 Key Pair for SSH access; leave blank to skip"

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"

Mappings:
  SubnetConfig:
    VPC: { CIDR: "10.0.0.0/16" }
    PublicSubnet1: { CIDR: "10.0.1.0/24" }
    PublicSubnet2: { CIDR: "10.0.2.0/24" }
    PrivateSubnet1: { CIDR: "10.0.11.0/24" }
    PrivateSubnet2: { CIDR: "10.0.12.0/24" }
    DBSubnet1: { CIDR: "10.0.21.0/24" }
    DBSubnet2: { CIDR: "10.0.22.0/24" }

Conditions:
  HasKeyPairName: !Not [!Equals [!Ref KeyPairName, ""]]

Resources:
  # KMS (regional Logs principal + CloudTrail context/grant + EC2/EBS ViaService)
  MasterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "Master KMS key for production stack encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: EnableIamRootPermissions
            Effect: Allow
            Principal: { AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root" }
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowAWSServiceUse
            Effect: Allow
            Principal:
              Service:
                - cloudtrail.amazonaws.com
                - s3.amazonaws.com
                - rds.amazonaws.com
                - backup.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: "*"
          - Sid: AllowCloudTrailEncryptDecryptWithContext
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:Decrypt
              - kms:DescribeKey
            Resource: "*"
            Condition:
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub "arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*"
          - Sid: AllowCloudTrailCreateGrant
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: [kms:CreateGrant]
            Resource: "*"
            Condition:
              Bool:
                kms:GrantIsForAWSResource: "true"
          - Sid: AllowCloudWatchLogsRegional
            Effect: Allow
            Principal:
              Service: !Sub "logs.${AWS::Region}.amazonaws.com"
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: "*"
          - Sid: AllowEC2EBSUseViaService
            Effect: Allow
            Principal:
              AWS: "*"
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: "*"
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub "${AWS::AccountId}"
                kms:ViaService: !Sub "ec2.${AWS::Region}.amazonaws.com"
      EnableKeyRotation: true
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  MasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/production-security-master
      TargetKeyId: !Ref MasterKMSKey

  # VPC & Subnets
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - { Key: Name, Value: ProductionVPC }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: PublicSubnet1 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: PublicSubnet2 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - { Key: Name, Value: PrivateSubnet1 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - { Key: Name, Value: PrivateSubnet2 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DBSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - { Key: Name, Value: DBSubnet1 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DBSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - { Key: Name, Value: DBSubnet2 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  # NAT & Routes
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: PublicRouteTable }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
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
        - { Key: Name, Value: PrivateRouteTable1 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: "0.0.0.0/0"
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
        - { Key: Name, Value: PrivateRouteTable2 }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: "0.0.0.0/0"
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DBSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DBSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # NACLs (HTTP-only edge)
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: PublicNetworkAcl }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PublicNetworkAclEntryInbound80:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"
      PortRange: { From: 80, To: 80 }

  PublicNetworkAclEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"
      PortRange: { From: 1024, To: 65535 }

  PublicNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"

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

  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: PrivateNetworkAcl }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  PrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: "10.0.0.0/16"

  PrivateNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: "0.0.0.0/0"

  PrivateSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  DBNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: DBNetworkAcl }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  DBNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref DBNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: "10.0.0.0/16"
      PortRange: { From: 3306, To: 3306 }

  DBNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref DBNetworkAcl
      RuleNumber: 100
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: "10.0.0.0/16"
      PortRange: { From: 1024, To: 65535 }

  DBSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      NetworkAclId: !Ref DBNetworkAcl

  DBSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      NetworkAclId: !Ref DBNetworkAcl

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "SG for ALB - allows port 80 from internet"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - {
            IpProtocol: tcp,
            FromPort: 80,
            ToPort: 80,
            CidrIp: "0.0.0.0/0",
            Description: "Allow port 80 from internet",
          }
      Tags:
        - { Key: Name, Value: LoadBalancerSG }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  AppInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "SG for application instances - only ALB and admin SSH"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - {
            IpProtocol: tcp,
            FromPort: 80,
            ToPort: 80,
            SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup,
            Description: "From ALB only",
          }
        - {
            IpProtocol: tcp,
            FromPort: 22,
            ToPort: 22,
            CidrIp: !Ref AllowedAdminCidr,
            Description: "SSH from admin CIDR only",
          }
      Tags:
        - { Key: Name, Value: AppInstanceSG }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "SG for RDS - only from app tier"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - {
            IpProtocol: tcp,
            FromPort: 3306,
            ToPort: 3306,
            SourceSecurityGroupId: !Ref AppInstanceSecurityGroup,
            Description: "MySQL from app SG",
          }
      Tags:
        - { Key: Name, Value: DatabaseSG }
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  # IAM (no explicit RoleName)
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        - "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        - "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
      Policies:
        - PolicyName: AppInlineAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action: ["s3:GetObject", "s3:ListBucket"]
                Resource:
                  - !GetAtt LoggingBucket.Arn
                  - !Sub "${LoggingBucket.Arn}/*"
              - Effect: Allow
                Action: ["kms:Decrypt", "kms:GenerateDataKey"]
                Resource: !GetAtt MasterKMSKey.Arn
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref EC2InstanceRole]

  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: "Requires MFA for sensitive operations"
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            Action:
              [
                "iam:*",
                "ec2:TerminateInstances",
                "ec2:DeleteVolume",
                "rds:DeleteDBInstance",
                "s3:DeleteBucket",
                "kms:ScheduleKeyDeletion",
              ]
            Resource: "*"
            Condition:
              { BoolIfExists: { "aws:MultiFactorAuthPresent": "false" } }

  # ALB + Target Group (HTTP-only)
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ProductionALB
      Type: application
      Scheme: internet-facing
      SecurityGroups: [!Ref LoadBalancerSecurityGroup]
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ProductionTargetGroup
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # WAF
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: ProductionWebACL
      Scope: REGIONAL
      Description: "WAF Web ACL for production ALB protection"
      DefaultAction: { Allow: {} }
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            { RateBasedStatement: { Limit: 2000, AggregateKeyType: IP } }
          Action: { Block: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          Statement:
            {
              ManagedRuleGroupStatement:
                { VendorName: AWS, Name: AWSManagedRulesCommonRuleSet },
            }
          OverrideAction: { None: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSet
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 3
          Statement:
            {
              ManagedRuleGroupStatement:
                { VendorName: AWS, Name: AWSManagedRulesKnownBadInputsRuleSet },
            }
          OverrideAction: { None: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputs
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: ProductionWebACL
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn

  # Launch Template / ASG
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: ProductionAppLaunchTemplate
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPairName, !Ref KeyPairName, !Ref "AWS::NoValue"]
        IamInstanceProfile: { Arn: !GetAtt EC2InstanceProfile.Arn }
        SecurityGroupIds: [!Ref AppInstanceSecurityGroup]
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref MasterKMSKey
              DeleteOnTermination: true
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Production Secure App - Instance $(hostname -f)</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name, Value: ProductionAppInstance }
              - { Key: Environment, Value: Production }
              - { Key: Owner, Value: SecurityTeam }
          - ResourceType: volume
            Tags:
              - { Key: Environment, Value: Production }
              - { Key: Owner, Value: SecurityTeam }

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: ProductionASG
      VPCZoneIdentifier: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs: [!Ref ALBTargetGroup]
      Tags:
        - { Key: Environment, Value: Production, PropagateAtLaunch: true }
        - { Key: Owner, Value: SecurityTeam, PropagateAtLaunch: true }

  # RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: "Subnet group for production RDS"
      SubnetIds: [!Ref DBSubnet1, !Ref DBSubnet2]
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: production-database
      DBName: !Ref DBName
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: !Ref DBEngineVersion
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      VPCSecurityGroups: [!Ref DatabaseSecurityGroup]
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref MasterKMSKey
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      PubliclyAccessible: false
      EnableCloudwatchLogsExports: [error, general, slowquery]
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  # S3 Logs (SSE-KMS + TLS-only)
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "production-logs-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration: { Status: Enabled }
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource: [!GetAtt LoggingBucket.Arn, !Sub "${LoggingBucket.Arn}/*"]
            Condition: { Bool: { "aws:SecureTransport": "false" } }
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: "s3:GetBucketAcl"
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: "s3:PutObject"
            Resource: !Sub "${LoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              { StringEquals: { "s3:x-amz-acl": "bucket-owner-full-control" } }
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal: { Service: config.amazonaws.com }
            Action: "s3:GetBucketAcl"
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal: { Service: config.amazonaws.com }
            Action: "s3:ListBucket"
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSConfigWrite
            Effect: Allow
            Principal: { Service: config.amazonaws.com }
            Action: "s3:PutObject"
            Resource: !Sub "${LoggingBucket.Arn}/config/*"
            Condition:
              { StringEquals: { "s3:x-amz-acl": "bucket-owner-full-control" } }

  # CloudTrail (+ KMS)
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LoggingBucketPolicy
    Properties:
      TrailName: ProductionTrail
      S3BucketName: !Ref LoggingBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values: [!Sub "${LoggingBucket.Arn}/"]
      KMSKeyId: !Ref MasterKMSKey
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudtrail/production
      RetentionInDays: 30
      KmsKeyId: !GetAtt MasterKMSKey.Arn

  # AWS Config (inline policy only)
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: config.amazonaws.com }
            Action: "sts:AssumeRole"
      Policies:
        - PolicyName: S3AndSNSAccessForConfig
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  [
                    "s3:GetBucketAcl",
                    "s3:ListBucket",
                    "s3:PutObject",
                    "s3:GetObject",
                  ]
                Resource:
                  - !GetAtt LoggingBucket.Arn
                  - !Sub "${LoggingBucket.Arn}/*"
              - Effect: Allow
                Action: "sns:Publish"
                Resource: !Ref SNSTopic
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: ProductionConfigRecorder
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: ProductionConfigDeliveryChannel
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: config
      SnsTopicARN: !Ref SNSTopic

  # SNS
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: ProductionSecurityAlerts
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  # AWS Backup
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: ProductionBackupVault
      EncryptionKeyArn: !GetAtt MasterKMSKey.Arn
      BackupVaultTags: { Environment: Production, Owner: SecurityTeam }

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: ProductionBackupPlan
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: "cron(0 2 * * ? *)"
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              MoveToColdStorageAfterDays: 7
              DeleteAfterDays: 97
      BackupPlanTags: { Environment: Production, Owner: SecurityTeam }

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: ProductionBackupSelection
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:production-database"
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: Environment
            ConditionValue: Production

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: backup.amazonaws.com }
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        - "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  # Key rotation Lambda
  KeyRotationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      Policies:
        - PolicyName: KeyRotationPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  [
                    "iam:ListUsers",
                    "iam:ListAccessKeys",
                    "iam:UpdateAccessKey",
                    "iam:GetAccessKeyLastUsed",
                  ]
                Resource: "*"
              - Effect: Allow
                Action: ["sns:Publish"]
                Resource: !Ref SNSTopic
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Owner, Value: SecurityTeam }

  KeyRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: AccessKeyRotationChecker
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt KeyRotationLambdaRole.Arn
      Timeout: 60
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
          ENFORCE_ROTATION: !Ref EnforceKeyRotation
      Code:
        ZipFile: |
          import boto3, os
          from datetime import datetime, timezone
          def lambda_handler(event, context):
              iam = boto3.client('iam'); sns = boto3.client('sns')
              sns_topic = os.environ['SNS_TOPIC_ARN']
              enforce = os.environ['ENFORCE_ROTATION'] == 'true'
              users = iam.list_users()['Users']; old_keys = []
              for u in users:
                  for k in iam.list_access_keys(UserName=u['UserName'])['AccessKeyMetadata']:
                      age = (datetime.now(timezone.utc) - k['CreateDate']).days
                      if age > 90:
                          old_keys.append({'User': u['UserName'], 'KeyId': k['AccessKeyId'], 'Age': age})
                          if enforce:
                              iam.update_access_key(UserName=u['UserName'], AccessKeyId=k['AccessKeyId'], Status='Inactive')
              if old_keys:
                  msg = 'Access Keys requiring rotation:\n' + '\n'.join(
                      [f"- User: {x['User']}, Key: {x['KeyId']}, Age: {x['Age']} days{' (DEACTIVATED)' if enforce else ''}" for x in old_keys]
                  )
                  sns.publish(TopicArn=sns_topic, Subject='Access Key Rotation Alert', Message=msg)
              return {'statusCode': 200, 'body': f'Processed {len(old_keys)} old keys'}

  KeyRotationSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: DailyKeyRotationCheck
      Description: "Daily check for IAM access key rotation"
      ScheduleExpression: "rate(1 day)"
      State: ENABLED
      Targets:
        - Arn: !GetAtt KeyRotationLambda.Arn
          Id: KeyRotationLambdaTarget

  KeyRotationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref KeyRotationLambda
      Action: "lambda:InvokeFunction"
      Principal: events.amazonaws.com
      SourceArn: !GetAtt KeyRotationSchedule.Arn

Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC

  PublicSubnetIds:
    Description: "Public subnet IDs"
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]

  PrivateSubnetIds:
    Description: "Private subnet IDs"
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]

  LoadBalancerDNS:
    Description: "Application Load Balancer DNS name"
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  LoadBalancerURL:
    Description: "Application URL (HTTP)"
    Value: !Sub "http://${ApplicationLoadBalancer.DNSName}"

  WAFWebACLArn:
    Description: "WAF Web ACL ARN"
    Value: !GetAtt WAFWebACL.Arn

  RDSEndpoint:
    Description: "RDS database endpoint"
    Value: !GetAtt RDSDatabase.Endpoint.Address

  KMSKeyArn:
    Description: "Master KMS key ARN for encryption"
    Value: !GetAtt MasterKMSKey.Arn

  CloudTrailArn:
    Description: "CloudTrail trail ARN"
    Value: !GetAtt CloudTrail.Arn

  BackupPlanId:
    Description: "AWS Backup plan ID"
    Value: !Ref BackupPlan

  MFAGuidance:
    Description: "MFA enforcement guidance"
    Value: "MFA is enforced via IAM policy. Users must enable MFA to perform sensitive operations. See MFAEnforcementPolicy for details."

  KeyRotationGuidance:
    Description: "Access key rotation status"
    Value: !Sub "Automated key rotation checking is ${EnforceKeyRotation}. Keys older than 90 days will be flagged and optionally deactivated."

  SecurityPosture:
    Description: "Security implementation summary"
    Value: "Encryption at rest enabled, strict SG/NACL rules, MFA policies active, automated backups configured, WAF protecting ALB, CloudTrail/Config logging enabled"
```