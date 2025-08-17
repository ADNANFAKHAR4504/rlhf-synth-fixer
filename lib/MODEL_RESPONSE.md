```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready regional environment with VPC, EC2 Auto Scaling, RDS, S3, and AWS Config'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'prod-us-east-1'
    Description: 'Environment name for resource naming'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: 'CIDR block for VPC'
  
  AZCount:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 3
    Description: 'Number of Availability Zones to use'
  
  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.1.0/24,10.0.2.0/24'
    Description: 'CIDR blocks for public subnets'
  
  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.10.0/24,10.0.20.0/24'
    Description: 'CIDR blocks for private subnets'
  
  S3BucketName:
    Type: String
    Description: 'Globally unique S3 bucket name'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    MinLength: 3
    MaxLength: 63
  
  EnableS3Replication:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: 'Enable S3 Cross-Region Replication'
  
  ReplicationDestinationBucketArn:
    Type: String
    Default: ''
    Description: 'ARN of destination bucket for S3 replication (optional)'
  
  DBSecretArn:
    Type: String
    Description: 'ARN of Secrets Manager secret containing database credentials'
  
  DBInstanceClass:
    Type: String
    Default: 'db.m5.large'
    AllowedValues: ['db.m5.large']
    Description: 'RDS instance class'
  
  DBName:
    Type: String
    Default: 'appdb'
    Description: 'Database name'
  
  DBEngine:
    Type: String
    Default: 'postgres'
    AllowedValues: ['postgres', 'mysql']
    Description: 'Database engine'
  
  EC2InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.medium']
    Description: 'EC2 instance type'
  
  AsgMinSize:
    Type: Number
    Default: 2
    MinValue: 2
    Description: 'Auto Scaling Group minimum size'
  
  AsgMaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    Description: 'Auto Scaling Group maximum size'
  
  AsgDesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    Description: 'Auto Scaling Group desired capacity'
  
  AllowedCidrIngress:
    Type: CommaDelimitedList
    Default: '0.0.0.0/0'
    Description: 'CIDR blocks allowed for SSH/HTTP/HTTPS access'
  
  HostedZoneId:
    Type: String
    Default: ''
    Description: 'Route 53 Hosted Zone ID for DNS records (optional)'
  
  ACMCertificateArn:
    Type: String
    Default: ''
    Description: 'ACM Certificate ARN for HTTPS listener (optional)'
  
  DBDeletionProtection:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: 'Enable RDS deletion protection'
  
  Project:
    Type: String
    Default: 'MyProject'
    Description: 'Project name for tagging'
  
  Owner:
    Type: String
    Default: 'DevOps'
    Description: 'Owner for tagging'

Conditions:
  EnableReplication: !And
    - !Equals [!Ref EnableS3Replication, 'true']
    - !Not [!Equals [!Ref ReplicationDestinationBucketArn, '']]
  
  CreateRoute53Records: !Not [!Equals [!Ref HostedZoneId, '']]
  
  EnableHTTPS: !Not [!Equals [!Ref ACMCertificateArn, '']]
  
  UseThreeAZs: !Equals [!Ref AZCount, 3]

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpc'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-igw'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

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
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-1'
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
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-1'
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
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-routes'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

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
          Value: !Sub '${EnvironmentName}-private-routes-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

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
          Value: !Sub '${EnvironmentName}-private-routes-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Network ACLs
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-nacl'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

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
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-nacl'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr

  PrivateOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

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

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
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
          Value: !Sub '${EnvironmentName}-alb-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  WebTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-web-sg'
      GroupDescription: 'Security group for web tier instances'
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
          Value: !Sub '${EnvironmentName}-web-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [!Equals [!Ref DBEngine, 'postgres'], 5432, 3306]
          ToPort: !If [!Equals [!Ref DBEngine, 'postgres'], 5432, 3306]
          SourceSecurityGroupId: !Ref WebTierSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # IAM Roles and Policies
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-ec2-instance-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
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
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt S3Bucket.Arn
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DBSecretArn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-ec2-instance-profile'
      Roles:
        - !Ref EC2InstanceRole

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: EnableReplication
    Properties:
      RoleName: !Sub '${EnvironmentName}-s3-replication-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObjectVersionForReplication
                  - s3:GetObjectVersionAcl
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt S3Bucket.Arn
              - Effect: Allow
                Action:
                  - s3:ReplicateObject
                  - s3:ReplicateDelete
                Resource: !Sub '${ReplicationDestinationBucketArn}/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-launch-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebTierSecurityGroup
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
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      TagSpecifications:
        - ResourceType: launch-template
          Tags:
            - Key: Name
              Value: !Sub '${EnvironmentName}-launch-template'
            - Key: Environment
              Value: !Ref EnvironmentName
            - Key: Project
              Value: !Ref Project
            - Key: Owner
              Value: !Ref Owner

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref AsgMinSize
      MaxSize: !Ref AsgMaxSize
      DesiredCapacity: !Ref AsgDesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-asg-instance'
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

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-alb'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-tg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: EnableHTTPS
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificateArn

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-subnet-group'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-db'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: !Ref DBEngine
      DBName: !Ref DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecretArn}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecretArn}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      DeletionProtection: !Ref DBDeletionProtection
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls
```