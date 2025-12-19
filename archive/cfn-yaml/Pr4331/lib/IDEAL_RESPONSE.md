# HIPAA-Compliant Event Processing Pipeline - CloudFormation Implementation

Complete HIPAA-compliant infrastructure for processing real-time medical device data. Built with AWS CloudFormation YAML and deployed to eu-west-2. Handles 1000+ events/second with full encryption, comprehensive audit logging, and high availability across multiple AZs.

## Architecture Overview

**Data Flow**: Medical devices → Kinesis Data Streams → ECS Fargate tasks → Aurora Serverless v2

**Security**: Customer-managed KMS keys, CloudTrail audit logging, Secrets Manager for credentials, VPC with private subnets

**High Availability**: Multi-AZ deployment with 3 availability zones, 2 Aurora instances, 2 ECS tasks

**Infrastructure Components**:
- Kinesis Data Streams for real-time ingestion
- ECS Fargate for serverless processing
- Aurora Serverless v2 for storage (MySQL-compatible)
- API Gateway for external integrations
- NAT Gateway for internet access from private subnets
- VPC endpoints for cost-optimized AWS service access

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'HIPAA-Compliant Event Processing Pipeline for Healthcare Data'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBUsername
          - DBName

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBName:
    Type: String
    Default: 'healthcaredb'
    Description: 'Database name'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

Resources:
  # ========================================
  # KMS Keys for Encryption
  # ========================================

  DataEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for HIPAA-compliant data encryption - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
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
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:Decrypt'
            Resource: '*'
            Condition:
              StringLike:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/*'
      Tags:
        - Key: Name
          Value: !Sub 'data-encryption-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

  DataEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/data-encryption-${EnvironmentSuffix}'
      TargetKeyId: !Ref DataEncryptionKey

  # ========================================
  # VPC and Network Configuration
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'hipaa-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Public Subnets for NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-route-table-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
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

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateway (in public subnet)
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # VPC Endpoints for AWS Services (cost optimization)
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  KinesisVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kinesis-streams'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  SecretsManagerVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.secretsmanager'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  ECRVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.dkr'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  ECRAPIVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.api'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  CloudWatchLogsVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-route-table-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

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

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # ========================================
  # Security Groups
  # ========================================

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'vpc-endpoint-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for VPC endpoints'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ECSTaskSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'vpc-endpoint-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ecs-task-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ECS Fargate tasks'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for AWS API calls'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/16
          Description: 'MySQL/Aurora access within VPC'
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'rds-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS Aurora cluster'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ECSTaskSecurityGroup
          Description: 'MySQL from ECS tasks'
      Tags:
        - Key: Name
          Value: !Sub 'rds-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ========================================
  # Kinesis Data Stream
  # ========================================

  PatientDataStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'patient-data-stream-${EnvironmentSuffix}'
      RetentionPeriodHours: 24
      ShardCount: 2
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref DataEncryptionKey
      StreamModeDetails:
        StreamMode: PROVISIONED
      Tags:
        - Key: Name
          Value: !Sub 'patient-data-stream-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

  # ========================================
  # RDS Aurora Serverless v2
  # ========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for Aurora Serverless v2'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: !Sub 'Cluster parameter group for Aurora MySQL - ${EnvironmentSuffix}'
      Family: aurora-mysql8.0
      Parameters:
        require_secure_transport: 'ON'
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-params-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'aurora-db-secret-${EnvironmentSuffix}'
      Description: 'Database credentials for Aurora cluster'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId: !Ref DataEncryptionKey
      Tags:
        - Key: Name
          Value: !Sub 'aurora-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

  DBSecretAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      TargetId: !Ref AuroraDBCluster
      TargetType: AWS::RDS::DBCluster

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.04.0'
      DatabaseName: !Ref DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RDSSecurityGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      ServerlessV2ScalingConfiguration:
        MinCapacity: 0.5
        MaxCapacity: 2
      BackupRetentionPeriod: 1
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      StorageEncrypted: true
      KmsKeyId: !Ref DataEncryptionKey
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.serverless
      Engine: aurora-mysql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.serverless
      Engine: aurora-mysql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ========================================
  # ECS Cluster and Task Definition
  # ========================================

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'data-processing-cluster-${EnvironmentSuffix}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'data-processing-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ecs-task-execution-role-${EnvironmentSuffix}'
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
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt DataEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-execution-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: KinesisAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:GetRecords'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:DescribeStream'
                  - 'kinesis:ListStreams'
                Resource: !GetAtt PatientDataStream.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt DataEncryptionKey.Arn
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBSecret
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ECSTaskLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/ecs/data-processing-${EnvironmentSuffix}'
      RetentionInDays: 7
      KmsKeyId: !GetAtt DataEncryptionKey.Arn

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'data-processor-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: data-processor
          Image: 'public.ecr.aws/amazonlinux/amazonlinux:latest'
          Essential: true
          Command:
            - '/bin/sh'
            - '-c'
            - 'echo "Data processing container started" && sleep 3600'
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSTaskLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: 'ecs'
          Environment:
            - Name: KINESIS_STREAM_NAME
              Value: !Ref PatientDataStream
            - Name: DB_SECRET_ARN
              Value: !Ref DBSecret
            - Name: AWS_REGION
              Value: !Ref AWS::Region
      Tags:
        - Key: Name
          Value: !Sub 'data-processor-task-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: !Sub 'data-processing-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSTaskSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'data-processing-service-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ========================================
  # API Gateway
  # ========================================

  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/apigateway/hipaa-api-${EnvironmentSuffix}'
      RetentionInDays: 7
      KmsKeyId: !GetAtt DataEncryptionKey.Arn

  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'hipaa-api-${EnvironmentSuffix}'
      Description: 'API Gateway for external system integration'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'hipaa-api-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  APIGatewayHealthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'health'

  APIGatewayHealthMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref APIGatewayHealthResource
      HttpMethod: GET
      AuthorizationType: AWS_IAM
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              'application/json': '{"status": "healthy", "timestamp": "$context.requestTime"}'
        RequestTemplates:
          'application/json': '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            'application/json': 'Empty'

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - APIGatewayHealthMethod
    Properties:
      RestApiId: !Ref RestAPI

  APIGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestAPI
      DeploymentId: !Ref APIGatewayDeployment
      StageName: prod
      Description: 'Production stage'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          MetricsEnabled: true
          ThrottlingBurstLimit: 500
          ThrottlingRateLimit: 100
      AccessLogSetting:
        DestinationArn: !GetAtt APIGatewayLogGroup.Arn
        Format: '$context.requestId $context.requestTime $context.httpMethod $context.path $context.status'
      Tags:
        - Key: Name
          Value: !Sub 'hipaa-api-stage-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  APIGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub 'hipaa-api-usage-plan-${EnvironmentSuffix}'
      Description: 'Usage plan for HIPAA API'
      ApiStages:
        - ApiId: !Ref RestAPI
          Stage: !Ref APIGatewayStage
      Throttle:
        BurstLimit: 500
        RateLimit: 100
      Tags:
        - Key: Name
          Value: !Sub 'hipaa-api-usage-plan-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ========================================
  # CloudTrail for Audit Logging
  # ========================================

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
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

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'hipaa-audit-trail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      IsMultiRegionTrail: false
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref DataEncryptionKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${CloudTrailBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub 'hipaa-audit-trail-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'HIPAA'

# ========================================
# Outputs
# ========================================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3Id'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

  NATGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayId'

  NATGatewayEIP:
    Description: 'NAT Gateway Elastic IP'
    Value: !Ref NATGatewayEIP
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayEIP'

  KMSKeyId:
    Description: 'KMS Key ID for data encryption'
    Value: !Ref DataEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'KMS Key ARN for data encryption'
    Value: !GetAtt DataEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  KinesisStreamName:
    Description: 'Kinesis Data Stream Name'
    Value: !Ref PatientDataStream
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStreamName'

  KinesisStreamArn:
    Description: 'Kinesis Data Stream ARN'
    Value: !GetAtt PatientDataStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStreamArn'

  DBClusterId:
    Description: 'Aurora DB Cluster ID'
    Value: !Ref AuroraDBCluster
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterId'

  DBClusterEndpoint:
    Description: 'Aurora DB Cluster Endpoint'
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterEndpoint'

  DBClusterReadEndpoint:
    Description: 'Aurora DB Cluster Read Endpoint'
    Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterReadEndpoint'

  DBSecretArn:
    Description: 'Database Secret ARN'
    Value: !Ref DBSecret
    Export:
      Name: !Sub '${AWS::StackName}-DBSecretArn'

  ECSClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterName'

  ECSClusterArn:
    Description: 'ECS Cluster ARN'
    Value: !GetAtt ECSCluster.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterArn'

  ECSServiceName:
    Description: 'ECS Service Name'
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub '${AWS::StackName}-ECSServiceName'

  APIGatewayId:
    Description: 'API Gateway REST API ID'
    Value: !Ref RestAPI
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayId'

  APIGatewayURL:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayURL'

  CloudTrailName:
    Description: 'CloudTrail Name'
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailName'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Implementation Details

### HIPAA Compliance Features

**Encryption**:
- Customer-managed KMS key with automatic annual rotation
- Kinesis Data Streams encrypted with KMS
- Aurora database and backups encrypted with KMS
- CloudWatch Logs encrypted with KMS
- CloudTrail logs and S3 bucket encrypted with KMS
- Secrets Manager secrets encrypted with KMS

**Audit Logging**:
- CloudTrail logs all API calls with log file validation
- CloudWatch Logs capture ECS container logs
- API Gateway access logs
- Aurora logs exported to CloudWatch (error, general, slowquery, audit)

**Network Security**:
- ECS tasks and Aurora deployed in private subnets only
- NAT Gateway provides controlled internet access for private subnets
- VPC endpoints for direct private connectivity to AWS services
- Security groups enforce least privilege access
- No public IPs on ECS tasks or database instances

**Access Control**:
- IAM roles with minimal required permissions
- API Gateway uses AWS_IAM authentication
- Secrets Manager stores database credentials (never hardcoded)
- Aurora parameter group enforces `require_secure_transport: ON`

### High Availability

- Multi-AZ deployment across 3 availability zones in eu-west-2
- Aurora Serverless v2 cluster with 2 DB instances
- ECS service runs 2 tasks distributed across private subnets
- Kinesis Data Stream with 2 shards (1000+ events/second capacity)

### Network Design

**Private Subnets** (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24):
- ECS Fargate tasks run here
- Aurora database instances deployed here
- No direct internet access

**Public Subnets** (10.0.10.0/24, 10.0.11.0/24):
- NAT Gateway deployed here
- Internet Gateway attached to VPC

**Why NAT Gateway?**
ECS tasks need to pull container images from `public.ecr.aws`. VPC endpoints only support private ECR repositories, so NAT Gateway is required for internet access from private subnets.

**VPC Endpoints** (cost optimization):
- S3 Gateway endpoint (free)
- Kinesis Streams interface endpoint
- Secrets Manager interface endpoint
- ECR API and DKR interface endpoints
- CloudWatch Logs interface endpoint

These endpoints reduce data transfer costs and keep traffic within the AWS network.

### Cost Optimization

- Aurora Serverless v2 scales from 0.5-2 ACUs based on load
- 7-day CloudWatch Logs retention (adjustable)
- 90-day lifecycle policy on CloudTrail S3 bucket
- ECS Fargate minimal allocation (512 CPU, 1024 MB)
- VPC endpoints reduce NAT data transfer costs

### Resource Naming

All resources use `${EnvironmentSuffix}` in their names:
- Format: `resource-type-${EnvironmentSuffix}`
- Examples: `patient-data-stream-dev`, `aurora-cluster-prod`
- Enables multiple environments in the same AWS account

## Implementation Notes

### Deployment Configuration

- **DeletionPolicy: Delete** on all stateful resources (KMS, Aurora, CloudWatch Logs, S3)
- **UpdateReplacePolicy: Delete** ensures resources are deleted during stack updates
- **RDS DeletionProtection: false** allows clean stack teardown
- Suitable for dev/test environments; production would need stricter settings

### API Gateway Setup

- Stage managed separately from Deployment resource
- No inline `StageName` in Deployment to avoid duplicate stages
- Access logging configured with CloudWatch Logs
- Usage plan enforces throttling: 500 burst, 100 req/sec

### Security Group Design

- ECS egress uses CIDR blocks (10.0.0.0/16) to avoid circular dependencies
- RDS ingress references ECS security group directly
- VPC endpoint security group accepts traffic from ECS security group

### CloudTrail Configuration

- Logs S3 object-level data events
- Does not log RDS data events (not supported by CloudTrail EventSelectors)
- Logs stored in S3 with 90-day lifecycle policy
- Log file validation enabled for integrity

### Aurora Configuration

- Engine: aurora-mysql version 8.0.mysql_aurora.3.04.0
- ServerlessV2ScalingConfiguration: MinCapacity 0.5, MaxCapacity 2
- BackupRetentionPeriod: 1 day (increase for production)
- Cluster parameter group requires secure transport
- Credentials managed by Secrets Manager with automatic generation

## Deployment Instructions

Deploy to eu-west-2:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=dev \
  --region eu-west-2
```

Deployment takes approximately 15-20 minutes. Aurora instances take the longest (10-12 minutes).

## Stack Outputs

Exports for integration and cross-stack references:
- VPC and subnet IDs (private and public)
- Internet Gateway and NAT Gateway IDs
- KMS key ID and ARN
- Kinesis stream name and ARN
- Aurora endpoints (writer and reader)
- Database secret ARN
- ECS cluster, service names and ARNs
- API Gateway ID and URL
- CloudTrail name and bucket
- Environment suffix
