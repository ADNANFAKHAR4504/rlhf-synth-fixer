```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Single-region VPC with subnets, RDS, IAM, CloudWatch, and S3

Parameters:
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.4.0/24

Resources:

  ### VPC & Subnets ###
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: [{ Key: Name, Value: "MyVPC" }]

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR

  ### NAT Gateway ###
  NatEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  ### Route Tables ###
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  ### RDS ###
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: "RDS Subnet Group"
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: rds-db-secret
      Description: "Auto-generated DB credentials"
      GenerateSecretString:
        SecretStringTemplate: '{"username":"admin"}'
        GenerateStringKey: "password"
        PasswordLength: 20
        ExcludeCharacters: "@/\"'\\"
      Tags:
        - Key: Name
          Value: rds-db-secret

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: mysql
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      MasterUsername: '{{resolve:secretsmanager:rds-db-secret:SecretString:username}}'
      MasterUserPassword: '{{resolve:secretsmanager:rds-db-secret:SecretString:password}}'
      DBSubnetGroupName: !Ref RDSSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PubliclyAccessible: false

  ### IAM ###
  EC2IAMRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LoggingPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:*
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub arn:aws:s3:::${LogBucket}/*

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref EC2IAMRole]

  ### CloudWatch Alarm ###
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub High-CPU-RDS-${AWS::StackName}
      AlarmDescription: "High CPU on RDS instance"
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance

  ### S3 Bucket for Logging ###
  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
  
  MyHostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: tapstack2144.com.

  MyDNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref MyHostedZone
      Name: app.tapstack2144.com.
      Type: CNAME
      TTL: 300
      ResourceRecords:
        - !GetAtt RDSInstance.Endpoint.Address

Outputs:
  VPCId:
    Value: !Ref VPC
  PublicSubnets:
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
  PrivateSubnets:
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
  RDSInstanceEndpoint:
    Value: !GetAtt RDSInstance.Endpoint.Address
  RDSInstanceIdentifier:
    Value: !Ref RDSInstance
  LoggingBucket:
    Value: !Ref LogBucket
  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
  HostedZoneId:
    Description: "Route 53 Hosted Zone ID"
    Value: !Ref MyHostedZone

```