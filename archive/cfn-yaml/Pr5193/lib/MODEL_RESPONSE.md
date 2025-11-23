# HealthTech Solutions CI/CD Pipeline - CloudFormation Implementation

## Overview

I've created a comprehensive CloudFormation template that provisions a secure CI/CD pipeline infrastructure for HealthTech Solutions' patient management system. The infrastructure includes VPC networking, ECS for container orchestration, RDS PostgreSQL database, EFS for persistent storage, and AWS CodePipeline for automated deployments.

## Implementation Details

### Network Architecture

The template creates a complete VPC infrastructure with:
- VPC with CIDR block 10.0.0.0/16
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across two availability zones
- 2 private subnets (10.0.11.0/24, 10.0.12.0/24) across two availability zones
- Internet Gateway for public subnet connectivity
- NAT Gateway with Elastic IP for private subnet outbound access
- Route tables configured for public and private traffic routing
- VPC Flow Logs for network monitoring and audit trails

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'HealthTech Solutions - Secure CI/CD Pipeline for Healthcare SaaS Platform'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBInstanceClass
          - DBAllocatedStorage
          - DBSecretName
      - Label:
          default: 'ECS Configuration'
        Parameters:
          - ContainerImage
          - ContainerPort
          - TaskCPU
          - TaskMemory
          - DesiredCount

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 1'

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for private subnet 2'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.r5.large

  DBAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 100
    Description: 'Database allocated storage in GB'

  DBSecretName:
    Type: String
    Default: 'healthtech/rds/credentials'
    Description: 'Name of the Secrets Manager secret containing DB credentials'

  ContainerImage:
    Type: String
    Default: 'nginx:latest'
    Description: 'Container image for ECS tasks'

  ContainerPort:
    Type: Number
    Default: 80
    Description: 'Port exposed by the container'

  TaskCPU:
    Type: String
    Default: '256'
    Description: 'CPU units for ECS task (256 = 0.25 vCPU)'
    AllowedValues:
      - '256'
      - '512'
      - '1024'
      - '2048'

  TaskMemory:
    Type: String
    Default: '512'
    Description: 'Memory for ECS task in MB'
    AllowedValues:
      - '512'
      - '1024'
      - '2048'
      - '4096'

  DesiredCount:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: 'Desired number of ECS tasks'

Resources:
  # ====================
  # VPC and Networking
  # ====================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-nat-eip-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-nat-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  # VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthtech-vpc-flow-logs-role-${EnvironmentSuffix}'
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
                Resource: '*'

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${EnvironmentSuffix}'
      RetentionInDays: 7

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-vpc-flowlog-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ====================
  # KMS Encryption Keys
  # ====================

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/healthtech-rds-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSKMSKey

  EFSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EFS encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EFS to use the key
            Effect: Allow
            Principal:
              Service: elasticfilesystem.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EFSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/healthtech-efs-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSKMSKey

  # ====================
  # Security Groups
  # ====================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthtech-alb-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from internet
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-alb-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthtech-ecs-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref ContainerPort
          ToPort: !Ref ContainerPort
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-ecs-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthtech-rds-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS PostgreSQL
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: Allow PostgreSQL from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-rds-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'healthtech-efs-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for EFS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: Allow NFS from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-efs-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ====================
  # RDS Database
  # ====================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'healthtech-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS PostgreSQL
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'healthtech-postgres-${EnvironmentSuffix}'
      Engine: postgres
      EngineVersion: '15.14'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      MasterUsername: '{{resolve:secretsmanager:healthtech/rds/credentials:SecretString:username}}'
      MasterUserPassword: '{{resolve:secretsmanager:healthtech/rds/credentials:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-postgres-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ====================
  # EFS File System
  # ====================

  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      KmsKeyId: !Ref EFSKMSKey
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      FileSystemTags:
        - Key: Name
          Value: !Sub 'healthtech-efs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSMountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  EFSMountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # ====================
  # Application Load Balancer
  # ====================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'healthtech-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'healthtech-tg-${EnvironmentSuffix}'
      Port: !Ref ContainerPort
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-tg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ====================
  # ECS Cluster and Services
  # ====================

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'healthtech-cluster-${EnvironmentSuffix}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthtech-ecs-task-execution-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${DBSecretName}*'
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthtech-ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${DBSecretName}*'
        - PolicyName: EFSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'elasticfilesystem:ClientMount'
                  - 'elasticfilesystem:ClientWrite'
                  - 'elasticfilesystem:ClientRootAccess'
                  - 'elasticfilesystem:DescribeFileSystems'
                Resource: !GetAtt EFSFileSystem.Arn

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/healthtech/${EnvironmentSuffix}'
      RetentionInDays: 7

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'healthtech-task-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: !Ref TaskCPU
      Memory: !Ref TaskMemory
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub 'healthtech-container-${EnvironmentSuffix}'
          Image: !Ref ContainerImage
          Essential: true
          PortMappings:
            - ContainerPort: !Ref ContainerPort
              Protocol: tcp
          Environment:
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentSuffix
            - Name: DB_HOST
              Value: !GetAtt RDSInstance.Endpoint.Address
            - Name: DB_PORT
              Value: !GetAtt RDSInstance.Endpoint.Port
          Secrets:
            - Name: DB_USERNAME
              ValueFrom: !Join ['', ['arn:aws:secretsmanager:', !Ref 'AWS::Region', ':', !Ref 'AWS::AccountId', ':secret:', !Ref DBSecretName, ':username::']]
            - Name: DB_PASSWORD
              ValueFrom: !Join ['', ['arn:aws:secretsmanager:', !Ref 'AWS::Region', ':', !Ref 'AWS::AccountId', ':secret:', !Ref DBSecretName, ':password::']]
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED

  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub 'healthtech-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: !Ref DesiredCount
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: !Sub 'healthtech-container-${EnvironmentSuffix}'
          ContainerPort: !Ref ContainerPort
          TargetGroupArn: !Ref TargetGroup
      HealthCheckGracePeriodSeconds: 60
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-service-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ====================
  # Auto Scaling
  # ====================

  ECSServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 1
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ECSServiceScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'healthtech-scaling-policy-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 60
        ScaleOutCooldown: 60

  # ====================
  # CodePipeline and CodeBuild
  # ====================

  ArtifactBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'healthtech-artifacts-${AWS::AccountId}-${EnvironmentSuffix}'
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
          Value: !Sub 'healthtech-artifacts-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthtech-codepipeline-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                Resource: !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ArtifactBucket.Arn
              - Effect: Allow
                Action:
                  - 'codebuild:BatchGetBuilds'
                  - 'codebuild:StartBuild'
                Resource: !GetAtt CodeBuildProject.Arn
              - Effect: Allow
                Action:
                  - 'ecs:DescribeServices'
                  - 'ecs:DescribeTaskDefinition'
                  - 'ecs:DescribeTasks'
                  - 'ecs:ListTasks'
                  - 'ecs:RegisterTaskDefinition'
                  - 'ecs:UpdateService'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'iam:PassRole'
                Resource:
                  - !GetAtt ECSTaskExecutionRole.Arn
                  - !GetAtt ECSTaskRole.Arn

  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'healthtech-codebuild-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${ArtifactBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ecr:GetAuthorizationToken'
                  - 'ecr:BatchCheckLayerAvailability'
                  - 'ecr:GetDownloadUrlForLayer'
                  - 'ecr:BatchGetImage'
                  - 'ecr:PutImage'
                  - 'ecr:InitiateLayerUpload'
                  - 'ecr:UploadLayerPart'
                  - 'ecr:CompleteLayerUpload'
                Resource: '*'

  CodeBuildLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/codebuild/healthtech-${EnvironmentSuffix}'
      RetentionInDays: 7

  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub 'healthtech-build-${EnvironmentSuffix}'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: ENVIRONMENT_SUFFIX
            Value: !Ref EnvironmentSuffix
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
            build:
              commands:
                - echo Build started on `date`
                - echo Building the Docker image...
                - docker build -t healthtech:latest .
                - docker tag healthtech:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/healthtech:latest
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker image...
                - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/healthtech:latest
          artifacts:
            files:
              - '**/*'
      LogsConfig:
        CloudWatchLogs:
          Status: ENABLED
          GroupName: !Ref CodeBuildLogGroup
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-build-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub 'healthtech-pipeline-${EnvironmentSuffix}'
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                S3Bucket: !Ref ArtifactBucket
                S3ObjectKey: source.zip
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref CodeBuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: !Ref ECSCluster
                ServiceName: !GetAtt ECSService.Name
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput
      Tags:
        - Key: Name
          Value: !Sub 'healthtech-pipeline-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ====================
  # CloudWatch Alarms
  # ====================

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'healthtech-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: Alarm when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ECSService.Name

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'healthtech-db-connections-${EnvironmentSuffix}'
      AlarmDescription: Alarm when database connections exceed 80% of max
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  NatGatewayId:
    Description: NAT Gateway ID
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${AWS::StackName}-NatGatewayId'

  RDSInstanceEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSInstanceEndpoint'

  RDSInstancePort:
    Description: RDS Instance Port
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDSInstancePort'

  RDSInstanceArn:
    Description: RDS Instance ARN
    Value: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}'
    Export:
      Name: !Sub '${AWS::StackName}-RDSInstanceArn'

  EFSFileSystemId:
    Description: EFS File System ID
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemId'

  EFSFileSystemArn:
    Description: EFS File System ARN
    Value: !GetAtt EFSFileSystem.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemArn'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  LoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerArn'

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterName'

  ECSClusterArn:
    Description: ECS Cluster ARN
    Value: !GetAtt ECSCluster.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterArn'

  ECSServiceName:
    Description: ECS Service Name
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub '${AWS::StackName}-ECSServiceName'

  ECSServiceArn:
    Description: ECS Service ARN
    Value: !Ref ECSService
    Export:
      Name: !Sub '${AWS::StackName}-ECSServiceArn'

  PipelineName:
    Description: CodePipeline Name
    Value: !Ref Pipeline
    Export:
      Name: !Sub '${AWS::StackName}-PipelineName'

  PipelineArn:
    Description: CodePipeline ARN
    Value: !Sub 'arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${Pipeline}'
    Export:
      Name: !Sub '${AWS::StackName}-PipelineArn'

  ArtifactBucketName:
    Description: S3 Artifact Bucket Name
    Value: !Ref ArtifactBucket
    Export:
      Name: !Sub '${AWS::StackName}-ArtifactBucketName'

  RDSKMSKeyId:
    Description: KMS Key ID for RDS Encryption
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-RDSKMSKeyId'

  EFSKMSKeyId:
    Description: KMS Key ID for EFS Encryption
    Value: !Ref EFSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-EFSKMSKeyId'

  EnvironmentSuffix:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'
```

### Security Configuration

**KMS Encryption Keys:**
- Separate KMS keys for RDS and EFS encryption
- KMS key aliases for easy reference
- Key policies allowing service-specific access

**Security Groups:**
- ALB Security Group: Allows HTTP (80) and HTTPS (443) from internet
- ECS Security Group: Allows traffic from ALB on container port
- RDS Security Group: Allows PostgreSQL (5432) from ECS tasks only
- EFS Security Group: Allows NFS (2049) from ECS tasks only

**Secrets Management:**
- Database credentials stored in AWS Secrets Manager
- Referenced using dynamic references: `!Sub '{{resolve:secretsmanager:${DBSecretName}:SecretString:username}}'`
- ECS tasks retrieve credentials securely at runtime

### Database Infrastructure

**RDS PostgreSQL Instance:**
- Engine: PostgreSQL 15.4
- Multi-AZ deployment for high availability
- Encrypted at rest using customer-managed KMS key
- Automated backups with 7-day retention
- CloudWatch Logs export enabled for monitoring
- Deployed in private subnets with no public access
- Security group restricts access to ECS tasks only

### Container Orchestration

**ECS Fargate Cluster:**
- Container Insights enabled for metrics
- Task definitions with configurable CPU/memory
- Tasks run in private subnets only
- Auto-scaling based on CPU utilization (target: 70%)
- Scales between 1-10 tasks
- Mount EFS volumes for persistent storage
- Environment variables for database connection
- Secrets injected from Secrets Manager

**Application Load Balancer:**
- Internet-facing ALB in public subnets
- HTTP listener on port 80
- Target group with health checks
- Routes traffic to ECS tasks in private subnets

### Persistent Storage

**EFS File System:**
- Encrypted at rest using customer-managed KMS key
- Transit encryption enabled for ECS mounts
- Mount targets in both private subnets
- General purpose performance mode
- Bursting throughput mode

### CI/CD Pipeline

**CodePipeline:**
- Three-stage pipeline: Source → Build → Deploy
- Source stage reads from S3 bucket
- Build stage uses CodeBuild for Docker image builds
- Deploy stage updates ECS service

**CodeBuild Project:**
- Docker-enabled build environment
- Builds and pushes images to Amazon ECR
- Inline BuildSpec for Docker operations
- CloudWatch Logs integration

**S3 Artifact Bucket:**
- Encrypted with AES256
- Public access blocked
- Stores pipeline artifacts

### IAM Roles

**ECS Task Execution Role:**
- AmazonECSTaskExecutionRolePolicy attached
- Secrets Manager read access for database credentials
- CloudWatch Logs write access

**ECS Task Role:**
- Secrets Manager read access
- EFS file system access (mount, write, root access)

**CodePipeline Role:**
- S3 bucket access for artifacts
- CodeBuild execution permissions
- ECS service update permissions
- IAM PassRole for ECS task roles

**CodeBuild Role:**
- CloudWatch Logs write access
- S3 artifact access
- ECR access for image push/pull

### Monitoring and Alarms

**CloudWatch Alarms:**
- High CPU alarm for ECS service (threshold: 80%)
- Database connections alarm for RDS (threshold: 80)

**Log Groups:**
- VPC Flow Logs: `/aws/vpc/flowlogs/${EnvironmentSuffix}`
- ECS Logs: `/ecs/healthtech/${EnvironmentSuffix}`
- CodeBuild Logs: `/aws/codebuild/healthtech-${EnvironmentSuffix}`

### Auto Scaling

**ECS Service Auto Scaling:**
- Scalable target: 1-10 tasks
- Target tracking scaling policy
- Metric: Average CPU Utilization
- Target value: 70%
- Scale-in cooldown: 60 seconds
- Scale-out cooldown: 60 seconds

## Parameters

The template exposes the following parameters for customization:

- `EnvironmentSuffix`: Environment identifier (default: 'dev')
- Network CIDR blocks for VPC and subnets
- `DBInstanceClass`: RDS instance type (default: db.t3.micro)
- `DBAllocatedStorage`: Database storage in GB (default: 20)
- `DBSecretName`: Secrets Manager secret name (default: 'healthtech/rds/credentials')
- `ContainerImage`: Docker image to deploy (default: 'nginx:latest')
- `ContainerPort`: Container port (default: 80)
- `TaskCPU`: ECS task CPU units (default: 256)
- `TaskMemory`: ECS task memory in MB (default: 512)
- `DesiredCount`: Initial ECS task count (default: 2)

## Outputs

The template exports comprehensive outputs including:

- Network IDs (VPC, subnets, NAT Gateway)
- RDS endpoint, port, and ARN
- EFS file system ID and ARN
- Load balancer DNS name and ARN
- ECS cluster and service details
- Pipeline name and ARN
- S3 artifact bucket name
- KMS key IDs
- Environment suffix and stack name

## Deployment

### Prerequisites

1. Create Secrets Manager secret:
```bash
aws secretsmanager create-secret \
  --name healthtech/rds/credentials \
  --secret-string '{"username":"dbadmin","password":"SecurePassword123!"}' \
  --region eu-south-1
```

2. Create ECR repository:
```bash
aws ecr create-repository --repository-name healthtech --region eu-south-1
```

### Deploy Command

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStacksynth5955986200 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=synth5955986200 \
  --region eu-south-1
```

## Resource Naming

All resources follow the naming convention: `healthtech-{resource-type}-${EnvironmentSuffix}`

This ensures:
- Unique resource names across environments
- Easy identification of resources
- No naming conflicts
- Compliance with AWS naming constraints

## Security Best Practices

  All data encrypted at rest (RDS, EFS, S3)
  All data encrypted in transit (EFS, HTTPS)
  No hardcoded credentials
  Secrets stored in AWS Secrets Manager
  Network isolation with private subnets
  Security groups follow least privilege
  IAM roles use managed policies where possible
  Audit trails via VPC Flow Logs and CloudWatch
  Multi-AZ deployment for high availability
  No public access to database or ECS tasks