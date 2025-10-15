# Ideal Infrastructure as Code (IaC) Solution

This document provides the optimal CloudFormation template for a production-grade secure infrastructure with VPC, S3, RDS, Lambda, EBS, and ALB.

## AWS CloudFormation Template

```yaml
# filepath: /home/aafaq/projects/iac-test-automations/lib/TapStack.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure infrastructure with VPC, S3, RDS, Lambda, EBS, and ALB'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentName
          - EnvironmentSuffix
          - OwnerEmail
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
          - DBInstanceClass
          - DBBackupRetentionPeriod

# ==========================================
# Parameters
# ==========================================
Parameters:
  EnvironmentName:
    Type: String
    Default: 'Prod'
    AllowedValues:
      - Dev
      - Staging
      - Prod
    Description: Environment name for tagging and naming resources
  
  OwnerEmail:
    Type: String
    Default: 'devops@company.com'
    Description: Owner email for tagging resources
  
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database admin account username
  
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.r5.large
    Description: Database instance class
  
  DBBackupRetentionPeriod:
    Type: Number
    Default: 7
    MinValue: 1
    MaxValue: 35
    Description: The number of days to retain automated backups
  
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

# ==========================================
# Mappings
# ==========================================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.21.0/24'
  
  EnvironmentSettings:
    Dev:
      DeletionPolicy: Delete
      MultiAZ: false
      InstanceType: t3.micro
    Staging:
      DeletionPolicy: Snapshot
      MultiAZ: false
      InstanceType: t3.small
    Prod:
      DeletionPolicy: Snapshot
      MultiAZ: true
      InstanceType: t3.medium

# ==========================================
# Resources
# ==========================================
Resources:

  # =========================
  # VPC and Networking
  # =========================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC-Main-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW-Main-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

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
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Public-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Public-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Private-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Private-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Database-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Subnet-Database-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EIP-NAT-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EIP-NAT-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RouteTable-Public'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${EnvironmentName}-RouteTable-Private-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${EnvironmentName}-RouteTable-Private-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref DatabaseSubnet1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref DatabaseSubnet2

  # =========================
  # Security Groups
  # =========================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-SG-ALB-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from Internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from Internet (for redirect to HTTPS)
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SG-ALB'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-SG-Lambda-${EnvironmentSuffix}'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to AWS services
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SG-Lambda'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-SG-Database-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SG-Database'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # Security Group Rules (separate to avoid circular dependencies)
  LambdaToDatabaseRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref LambdaSecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
      Description: MySQL to RDS

  DatabaseFromLambdaRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref DatabaseSecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Description: MySQL from Lambda

  # =========================
  # S3 Buckets
  # =========================
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      # Ensure bucket name is always lowercase and valid
      BucketName: !Sub 'tapstack-appdata-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-S3-AppData-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  ApplicationDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: 
              - !Sub '${ApplicationDataBucket.Arn}'
              - !Sub '${ApplicationDataBucket.Arn}/*'
            Condition:
              Bool:
                aws:SecureTransport: false

  # =========================
  # Secrets Manager
  # =========================
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-db-secret-${EnvironmentSuffix}'
      Description: RDS MySQL database credentials
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-Secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # Secret rotation
  SecretRotationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-Lambda-SecretRotation-${EnvironmentSuffix}'
      Description: Rotates RDS MySQL secrets
      Handler: lambda_function.lambda_handler
      Runtime: python3.9
      Role: !GetAtt SecretRotationFunctionRole.Arn
      Timeout: 30
      Environment:
        Variables:
          SECRETS_MANAGER_ENDPOINT: !Sub 'https://secretsmanager.${AWS::Region}.amazonaws.com'
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        Name: !Sub '${EnvironmentName}-Lambda-SecretRotation'
        Environment: !Ref EnvironmentName
        Owner: !Ref OwnerEmail

  SecretRotationFunctionRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: SecretRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                Resource: !Ref DBSecret

  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DBSecret
      RotationLambdaARN: !GetAtt SecretRotationFunction.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # =========================
  # RDS Database
  # =========================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-DBSubnetGroup-Main-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DBSubnetGroup-Main'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: !FindInMap [EnvironmentSettings, !Ref EnvironmentName, DeletionPolicy]
    UpdateReplacePolicy: !FindInMap [EnvironmentSettings, !Ref EnvironmentName, DeletionPolicy]
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-rds-mysql-${EnvironmentSuffix}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: !FindInMap [EnvironmentSettings, !Ref EnvironmentName, MultiAZ]
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      DeletionProtection: !If [IsProd, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-MySQL-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'

  # =========================
  # Lambda Functions
  # =========================
  LambdaDLQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${EnvironmentName}-SQS-LambdaDLQ-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SQS-LambdaDLQ'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-Role-LambdaExecution-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: LambdaVPCAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: VPCAccess
                Effect: Allow
                Action:
                  - 'ec2:CreateNetworkInterface'
                  - 'ec2:DescribeNetworkInterfaces'
                  - 'ec2:DeleteNetworkInterface'
                  - 'ec2:AttachNetworkInterface'
                  - 'ec2:DetachNetworkInterface'
                Resource: '*'
              - Sid: CloudWatchLogs
                Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
        - PolicyName: LambdaApplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ReadAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${ApplicationDataBucket.Arn}/*'
              - Sid: S3ListAccess
                Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ApplicationDataBucket.Arn
              - Sid: DLQAccess
                Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt LambdaDLQueue.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Role-LambdaExecution'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-Lambda-DataProcessor-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              # Sample Lambda function
              print(f"Environment: {os.environ.get('ENVIRONMENT')}")
              print(f"Processing event: {json.dumps(event)}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Data processed successfully',
                      'environment': os.environ.get('ENVIRONMENT')
                  })
              }
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      DeadLetterConfig:
        TargetArn: !GetAtt LambdaDLQueue.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentName
          S3_BUCKET: !Ref ApplicationDataBucket
          DB_ENDPOINT: !GetAtt RDSInstance.Endpoint.Address
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Lambda-DataProcessor'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  LambdaFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunction}'
      RetentionInDays: 30

  # Lambda function monitoring alarm
  LambdaErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Alarm-Lambda-Errors-${EnvironmentSuffix}'
      AlarmDescription: Alarm if Lambda function errors exceed threshold
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 1
      MetricName: Errors
      Namespace: AWS/Lambda
      Period: 60
      Statistic: Sum
      Threshold: 0
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      AlarmActions:
        - !Ref SNSAlertTopic

  # =========================
  # Application Load Balancer
  # =========================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB-Main-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ApplicationDataBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: deletion_protection.enabled
          Value: !If [IsProd, 'true', 'false']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-Main'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG-Default-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TG-Default'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  ALBHTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            Host: '#{host}'
            Path: '/#{path}'
            Query: '#{query}'
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub 'app-${EnvironmentSuffix}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ACM-Certificate'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  ALBHTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: '200'
            ContentType: text/plain
            MessageBody: 'Service is running'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # =========================
  # EBS Volume (attached to EC2 for demonstration)
  # =========================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-Role-EC2Instance-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: EC2CloudWatchPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: CloudWatchAccess
                Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Role-EC2Instance'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2InstanceRole

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-SG-EC2-${EnvironmentSuffix}'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH from VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SG-EC2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !FindInMap [EnvironmentSettings, !Ref EnvironmentName, InstanceType]
      ImageId: !Ref LatestAmiId
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch agent
          cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/bin/config.json
          {
            "agent": {
              "metrics_collection_interval": 60,
              "run_as_user": "root"
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "${EnvironmentName}-EC2-SystemLogs-${EnvironmentSuffix}",
                      "log_stream_name": "{instance_id}"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "metrics_collected": {
                "disk": {
                  "measurement": ["used_percent"],
                  "resources": ["*"],
                  "append_dimensions": {
                    "InstanceId": "${!aws:InstanceId}"
                  }
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "append_dimensions": {
                    "InstanceId": "${!aws:InstanceId}"
                  }
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
          
          echo "Environment: ${EnvironmentName}" > /var/log/environment.log
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Instance'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  AdditionalEBSVolume:
    Type: AWS::EC2::Volume
    DeletionPolicy: Snapshot
    Properties:
      Size: 20
      VolumeType: gp3
      Encrypted: true
      AvailabilityZone: !GetAtt EC2Instance.AvailabilityZone
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EBS-DataVolume'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  EBSVolumeAttachment:
    Type: AWS::EC2::VolumeAttachment
    Properties:
      Device: /dev/sdf
      VolumeId: !Ref AdditionalEBSVolume
      InstanceId: !Ref EC2Instance

  # =========================
  # SNS Topic for Alerts
  # =========================
  SNSAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub '${EnvironmentName}-SNS-Alerts-${EnvironmentSuffix}'
      TopicName: !Sub '${EnvironmentName}-SNS-Alerts-${EnvironmentSuffix}'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SNS-Alerts'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSAlertTopic
      Protocol: email
      Endpoint: !Ref OwnerEmail

  # =========================
  # CloudWatch Log Groups
  # =========================
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
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

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${EnvironmentName}-${EnvironmentSuffix}'
      RetentionInDays: 7

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-FlowLog-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail

  # =========================
  # CloudWatch Alarms
  # =========================
  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Alarm-RDS-CPU-${EnvironmentSuffix}'
      AlarmDescription: Alarm if database CPU exceeds threshold
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 3
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Period: 300
      Statistic: Average
      Threshold: 80
      TreatMissingData: notBreaching
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSAlertTopic

  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Alarm-RDS-Storage-${EnvironmentSuffix}'
      AlarmDescription: Alarm if free storage space is low
      ComparisonOperator: LessThanThreshold
      EvaluationPeriods: 2
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Period: 300
      Statistic: Average
      Threshold: 2000000000  # 2GB in bytes
      TreatMissingData: notBreaching
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSAlertTopic

  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Alarm-EC2-CPU-${EnvironmentSuffix}'
      AlarmDescription: Alarm if EC2 CPU exceeds threshold
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 3
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Period: 300
      Statistic: Average
      Threshold: 80
      TreatMissingData: notBreaching
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance
      AlarmActions:
        - !Ref SNSAlertTopic

# ==========================================
# Conditions
# ==========================================
Conditions:
  IsProd: !Equals [!Ref EnvironmentName, Prod]

# ==========================================
# Outputs
# ==========================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID-${EnvironmentSuffix}'

  VPCCidr:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${EnvironmentName}-VPC-CIDR-${EnvironmentSuffix}'

  ApplicationDataBucketArn:
    Description: Application Data S3 Bucket ARN
    Value: !GetAtt ApplicationDataBucket.Arn
    Export:
      Name: !Sub '${EnvironmentName}-S3-AppData-ARN-${EnvironmentSuffix}'

  ApplicationDataBucketName:
    Description: Application Data S3 Bucket Name
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${EnvironmentName}-S3-AppData-Name-${EnvironmentSuffix}'

  RDSEndpoint:
    Description: RDS MySQL Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-RDS-Endpoint-${EnvironmentSuffix}'

  RDSConnectionString:
    Description: RDS MySQL Connection String (without password)
    Value: !Sub 'mysql://${DBMasterUsername}:****@${RDSInstance.Endpoint.Address}:${RDSInstance.Endpoint.Port}/mysql'

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${EnvironmentName}-Lambda-DataProcessor-ARN-${EnvironmentSuffix}'

  LambdaDLQArn:
    Description: Lambda Dead Letter Queue ARN
    Value: !GetAtt LambdaDLQueue.Arn
    Export:
      Name: !Sub '${EnvironmentName}-SQS-LambdaDLQ-ARN-${EnvironmentSuffix}'

  ApplicationLoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${EnvironmentName}-ALB-ARN-${EnvironmentSuffix}'

  ApplicationLoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-ALB-DNS-${EnvironmentSuffix}'

  ApplicationLoadBalancerURL:
    Description: Application Load Balancer URL (HTTP)
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  ApplicationLoadBalancerSecureURL:
    Description: Application Load Balancer URL (HTTPS)
    Value: !Sub 'https://${ApplicationLoadBalancer.DNSName}'

  EC2InstanceId:
    Description: EC2 Instance ID
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${EnvironmentName}-EC2-Instance-ID-${EnvironmentSuffix}'

  AdditionalEBSVolumeId:
    Description: Additional EBS Volume ID
    Value: !Ref AdditionalEBSVolume
    Export:
      Name: !Sub '${EnvironmentName}-EBS-DataVolume-ID-${EnvironmentSuffix}'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${EnvironmentName}-EnvironmentSuffix-${EnvironmentSuffix}'
```
## Features
### Secure Network Architecture:
VPC with public, private, and database subnets across multiple AZs
Properly configured NAT Gateways for outbound connectivity
Security groups with least privilege access

### Data Storage:
Encrypted S3 bucket with lifecycle policies and versioning
Encrypted RDS MySQL database with multi-AZ and backup configuration
Encrypted EBS volumes

### Compute & Application Services:
Lambda functions with VPC access and proper error handling via DLQ
EC2 instance with SSM access and CloudWatch agent for monitoring
Application Load Balancer with HTTPS support

### Security Features:
TLS/SSL for data-in-transit with ACM certificate
Secrets rotation via AWS Secrets Manager
Security group ingress/egress rules following least privilege

### Monitoring & Logging:
CloudWatch Log Groups with retention policies
VPC Flow Logs for network monitoring
CloudWatch Alarms for key metrics
SNS Topic for alerts

### Best Practices:
Environment-specific configurations via mappings
Consistent tagging strategy
Appropriate deletion policies for different environments
Export values for cross-stack referencing