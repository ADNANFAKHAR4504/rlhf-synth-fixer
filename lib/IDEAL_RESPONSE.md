```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >-
  Secure, production-ready multi-region infrastructure (us-east-1 and eu-central-1).
  Adheres to AWS security best practices and enterprise requirements.

Parameters:
  EnvironmentName:
    Type: String
    Default: production
    Description: 'Deployment environment name'
  KMSKeyIDUSEast1:
    Type: String
    Description: 'Customer Managed KMS Key ID for us-east-1'
  KMSKeyIDEUCentral1:
    Type: String
    Description: 'Customer Managed KMS Key ID for eu-central-1'
  VPCUSEast1CIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: 'VPC CIDR block for us-east-1'
  VPCEUCentral1CIDR:
    Type: String
    Default: 10.1.0.0/16
    Description: 'VPC CIDR block for eu-central-1'
  EC2InstanceType:
    Type: String
    Default: m5.large
    AllowedValues: ['t3.medium', 't3.large', 'm5.large', 'm5.xlarge']
    Description: 'EC2 Instance type'
  RDSInstanceType:
    Type: String
    Default: db.m5.large
    AllowedValues: ['db.m5.large', 'db.m5.xlarge']
    Description: 'RDS Instance type'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c94855ba95c71c99
      AZ1: us-east-1a
      AZ2: us-east-1b
      RegionTag: us-east-1
    eu-central-1:
      AMI: ami-047bb4163c506cd98
      AZ1: eu-central-1a
      AZ2: eu-central-1b
      RegionTag: eu-central-1

Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']
  IsEUCentral1: !Equals [!Ref 'AWS::Region', 'eu-central-1']

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !If [IsUSEast1, !Ref VPCUSEast1CIDR, !Ref VPCEUCentral1CIDR]
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-prod-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Public Subnets (2, mapped to separate AZs)
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.1.0/24', '10.1.1.0/24']
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-a-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Region
          Value: !Ref 'AWS::Region'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.2.0/24', '10.1.2.0/24']
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-b-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Private Subnets (2, mapped to separate AZs)
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.11.0/24', '10.1.11.0/24']
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-a-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Region
          Value: !Ref 'AWS::Region'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !If [IsUSEast1, '10.0.12.0/24', '10.1.12.0/24']
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-b-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Internet Gateway and Attach
  IGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-prod-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName

  IGWAttach:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref IGW
      VpcId: !Ref VPC

  # Elastic IPs for NAT Gateways
  NATEIPA:
    Type: AWS::EC2::EIP
    DependsOn: IGWAttach
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-natgw-a-${AWS::Region}'

  NATEIPB:
    Type: AWS::EC2::EIP
    DependsOn: IGWAttach
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-natgw-b-${AWS::Region}'

  # NAT Gateways (one per public subnet)
  NATGatewayA:
    Type: AWS::EC2::NatGateway
    DependsOn: IGWAttach
    Properties:
      AllocationId: !GetAtt NATEIPA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub 'natgw-a-${AWS::Region}'

  NATGatewayB:
    Type: AWS::EC2::NatGateway
    DependsOn: IGWAttach
    Properties:
      AllocationId: !GetAtt NATEIPB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'natgw-b-${AWS::Region}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${AWS::Region}'

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-a-rt-${AWS::Region}'

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-b-rt-${AWS::Region}'

  # Routes & Associations
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: IGWAttach
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IGW

  PublicSubnetARouteTableAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetARouteTableAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateSubnetBRouteTableAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGatewayA

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGatewayB

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-secure-logs-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                !If [IsUSEast1, !Ref KMSKeyIDUSEast1, !Ref KMSKeyIDEUCentral1]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Private DB Subnet Group'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'dbsubnetgrp-${AWS::Region}'
        - Key: ManagedBy
          Value: CloudFormation

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: !Ref RDSInstanceType
      Engine: postgres
      DBSubnetGroupName: !Ref RDSSubnetGroup
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !If [IsUSEast1, !Ref KMSKeyIDUSEast1, !Ref KMSKeyIDEUCentral1]
      MasterUsername: admin
      MasterUserPassword: '{{resolve:secretsmanager:rds-master:SecretString:password}}'
      DBName: prodappdb
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Region
          Value: !Ref 'AWS::Region'
      DeletionProtection: true

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'RDS Security Group, restricted'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VPCUSEast1CIDR
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Region
          Value: !Ref 'AWS::Region'

  # IAM Role for EC2
  EC2IAMRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ec2-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [ec2.amazonaws.com]
            Action: ['sts:AssumeRole']
      Policies:
        - PolicyName: ec2-minimal
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:Describe*
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Region
          Value: !Ref 'AWS::Region'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'role-ec2-${AWS::Region}'
      Roles: [!Ref EC2IAMRole]

  # Security Group for EC2
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'EC2 Security Group, restricted'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.11.23/32
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Cluster (minimal example)
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'prod-ecs-${AWS::Region}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: IaC-AWS-Nova-Model
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::Region}-metrics'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/${AWS::Region}-metrics'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ecs/${AWS::Region}-metrics'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # CloudTrail for S3 API activities
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      S3BucketName: !Ref S3Bucket
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values: [!Sub 'arn:aws:s3:::prod-secure-logs-${AWS::Region}/']
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
  PublicSubnetAId:
    Description: 'Public Subnet A'
    Value: !Ref PublicSubnetA
  PublicSubnetBId:
    Description: 'Public Subnet B'
    Value: !Ref PublicSubnetB
  PrivateSubnetAId:
    Description: 'Private Subnet A'
    Value: !Ref PrivateSubnetA
  PrivateSubnetBId:
    Description: 'Private Subnet B'
    Value: !Ref PrivateSubnetB
  S3BucketName:
    Description: 'Secure S3 bucket'
    Value: !Ref S3Bucket
  RDSInstanceEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
  EC2SecurityGroupId:
    Description: 'EC2 Security Group'
    Value: !Ref EC2SecurityGroup
  RDSSecurityGroupId:
    Description: 'RDS Security Group'
    Value: !Ref RDSSecurityGroup
  ECSClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref ECSCluster
```
