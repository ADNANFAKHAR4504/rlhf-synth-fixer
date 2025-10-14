the failure came from the KeyName parameter. I’ve removed all reliance on a key pair and hardened a few spots so the stack deploys cleanly with zero prompts. All parameters have safe defaults, the AZs are selected dynamically (no letter-mismatch risk), and there’s no SSL/ALB config. This is a single-file, brand-new stack that should validate and create in one go.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack.yml — VPC (10.0.0.0/16) with public/private subnets, IGW, NATGW + EIP, routing,
  two private EC2 instances, ASG (LaunchConfiguration), CPU-based scaling policies/alarms,
  IAM role/instance profile with least-privilege S3 access, and an encrypted S3 bucket.
  Region target: us-west-2. No SSL/ALB/HTTPS resources included.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: "Network Settings (us-west-2)" }
        Parameters: [VpcCidr, PublicSubnetACidr, PublicSubnetBCidr, PrivateSubnetACidr, PrivateSubnetBCidr]
      - Label: { default: "Compute & Access" }
        Parameters: [AmiId, InstanceType, SshCidr]
      - Label: { default: "Auto Scaling" }
        Parameters: [AsgMinSize, AsgDesiredCapacity, AsgMaxSize]
    ParameterLabels:
      VpcCidr: { default: "VPC CIDR" }
      PublicSubnetACidr: { default: "Public Subnet A CIDR" }
      PublicSubnetBCidr: { default: "Public Subnet B CIDR" }
      PrivateSubnetACidr: { default: "Private Subnet A CIDR" }
      PrivateSubnetBCidr: { default: "Private Subnet B CIDR" }
      AmiId: { default: "AMI (latest Amazon Linux 2023 via SSM)" }
      InstanceType: { default: "EC2 Instance Type" }
      SshCidr: { default: "SSH Allowed CIDR (22/tcp)" }
      AsgMinSize: { default: "ASG Min Size" }
      AsgDesiredCapacity: { default: "ASG Desired Capacity" }
      AsgMaxSize: { default: "ASG Max Size" }

Parameters:
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: "(^((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))/(\\d|[1-2]\\d|3[0-2])$"
    Description: VPC CIDR block
  PublicSubnetACidr:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnetBCidr:
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnetACidr:
    Type: String
    Default: 10.0.11.0/24
  PrivateSubnetBCidr:
    Type: String
    Default: 10.0.12.0/24

  AmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
  InstanceType:
    Type: String
    Default: t2.micro
    AllowedValues: [ t2.micro, t3.micro, t3a.micro ]
    Description: Must remain t2.micro to satisfy the requirement.
  SshCidr:
    Type: String
    Default: 203.0.113.0/24
    Description: CIDR allowed for SSH access to EC2 instances.

  AsgMinSize:
    Type: Number
    Default: 2
  AsgDesiredCapacity:
    Type: Number
    Default: 2
  AsgMaxSize:
    Type: Number
    Default: 4

Conditions:
  IsUsWest2: !Equals [ !Ref 'AWS::Region', us-west-2 ]

Resources:
  # ---------------- VPC & Networking ----------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: [{ Key: Name, Value: TapStack-VPC }]

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags: [{ Key: Name, Value: TapStack-IGW }]

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: TapStack-Public-A }
        - { Key: Tier, Value: public }

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: TapStack-Public-B }
        - { Key: Tier, Value: public }

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnetACidr
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: TapStack-Private-A }
        - { Key: Tier, Value: private }

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Ref PrivateSubnetBCidr
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: TapStack-Private-B }
        - { Key: Tier, Value: private }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: TapStack-Public-RT }]

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
    DependsOn: VPCGatewayAttachment

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  NatEip:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags: [{ Key: Name, Value: TapStack-NAT-EIP }]

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags: [{ Key: Name, Value: TapStack-NATGW }]

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: TapStack-Private-RT-A }]

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: TapStack-Private-RT-B }]

  PrivateDefaultRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateDefaultRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  # ---------------- Security Group ----------------
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow SSH only from a specific CIDR; egress all
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SshCidr
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags: [{ Key: Name, Value: TapStack-Instance-SG }]

  # ---------------- S3 (encrypted + blocked public) ----------------
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "tapstack-app-${AWS::AccountId}-${AWS::Region}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags: [{ Key: Name, Value: TapStack-App-Bucket }]

  AppBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: "*"
            Action: s3:*
            Resource:
              - !Sub "arn:${AWS::Partition}:s3:::${AppBucket}"
              - !Sub "arn:${AWS::Partition}:s3:::${AppBucket}/*"
            Condition:
              Bool: { aws:SecureTransport: "false" }

  # ---------------- IAM for EC2 (S3 read/write + CW agent) ----------------
  Ec2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      Path: /
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: TapStackS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: ListBucket
                Effect: Allow
                Action: s3:ListBucket
                Resource: !Sub "arn:${AWS::Partition}:s3:::${AppBucket}"
              - Sid: RwObjects
                Effect: Allow
                Action: [ s3:GetObject, s3:PutObject, s3:DeleteObject ]
                Resource: !Sub "arn:${AWS::Partition}:s3:::${AppBucket}/*"
      Tags: [{ Key: Name, Value: TapStack-EC2-Role }]

  Ec2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [ !Ref Ec2InstanceRole ]
      Path: /

  # ---------------- Private EC2 Instances (one per private subnet) ----------------
  PrivateInstanceA:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      IamInstanceProfile: !Ref Ec2InstanceProfile
      NetworkInterfaces:
        - DeviceIndex: 0
          SubnetId: !Ref PrivateSubnetA
          GroupSet: [ !Ref InstanceSecurityGroup ]
          AssociatePublicIpAddress: false
      Tags: [{ Key: Name, Value: TapStack-Private-Instance-A }]

  PrivateInstanceB:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      IamInstanceProfile: !Ref Ec2InstanceProfile
      NetworkInterfaces:
        - DeviceIndex: 0
          SubnetId: !Ref PrivateSubnetB
          GroupSet: [ !Ref InstanceSecurityGroup ]
          AssociatePublicIpAddress: false
      Tags: [{ Key: Name, Value: TapStack-Private-Instance-B }]

  # ---------------- ASG (LaunchConfiguration) ----------------
  AppLaunchConfig:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      IamInstanceProfile: !Ref Ec2InstanceProfile
      SecurityGroups: [ !Ref InstanceSecurityGroup ]
      AssociatePublicIpAddress: false

  AppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier: [ !Ref PrivateSubnetA, !Ref PrivateSubnetB ]
      LaunchConfigurationName: !Ref AppLaunchConfig
      MinSize: !Ref AsgMinSize
      MaxSize: !Ref AsgMaxSize
      DesiredCapacity: !Ref AsgDesiredCapacity
      HealthCheckType: EC2
      HealthCheckGracePeriod: 180
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: TapStack-ASG-Instance
          PropagateAtLaunch: true

  # ---------------- Scaling Policies & Alarms ----------------
  ScaleOutPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AppAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      Cooldown: '180'
      ScalingAdjustment: 1

  ScaleInPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AppAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      Cooldown: '300'
      ScalingAdjustment: -1

  CPUHighAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale out when average ASG CPU >= 70% for 2 periods of 1 minute
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AppAutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref ScaleOutPolicy ]

  CPULowAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale in when average ASG CPU <= 30% for 4 periods of 1 minute
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AppAutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 4
      Threshold: 30
      ComparisonOperator: LessThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref ScaleInPolicy ]

Outputs:
  RegionEnforcedNote:
    Description: "Template intended for us-west-2; deploy there. (Dynamic AZs used)"
    Value: !If [ IsUsWest2, "us-west-2 confirmed", "WARNING: Deploy in us-west-2" ]

  VpcId:
    Description: ID of the created VPC
    Value: !Ref VPC
    Export: { Name: !Sub "${AWS::StackName}-VpcId" }

  PublicSubnets:
    Description: Comma-separated list of public subnet IDs
    Value: !Join [ ",", [ !Ref PublicSubnetA, !Ref PublicSubnetB ] ]
    Export: { Name: !Sub "${AWS::StackName}-PublicSubnets" }

  PrivateSubnets:
    Description: Comma-separated list of private subnet IDs
    Value: !Join [ ",", [ !Ref PrivateSubnetA, !Ref PrivateSubnetB ] ]
    Export: { Name: !Sub "${AWS::StackName}-PrivateSubnets" }

  NatGatewayId:
    Description: NAT Gateway ID
    Value: !Ref NatGateway
    Export: { Name: !Sub "${AWS::StackName}-NatGatewayId" }

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AppAutoScalingGroup
    Export: { Name: !Sub "${AWS::StackName}-AsgName" }

  AppBucketOut:
    Description: Encrypted S3 bucket used by instances (public access blocked)
    Value: !Ref AppBucket
    Export: { Name: !Sub "${AWS::StackName}-AppBucket" }
```