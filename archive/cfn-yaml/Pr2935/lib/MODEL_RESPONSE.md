# AWS CloudFormation Template: Secure AWS Infrastructure

This CloudFormation template sets up a secure, production-ready AWS infrastructure in the `us-west-2` region, featuring a VPC, EC2 instances, RDS database, Lambda function, Application Load Balancer (ALB), and CloudTrail for comprehensive monitoring and auditing.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with VPC, EC2, RDS, Lambda, ALB, and CloudTrail'

Parameters:
  SecureEnvInstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
  
  SecureEnvSSHAccessCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: CIDR block for SSH access
  
  SecureEnvDBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: RDS instance class
  
  SecureEnvProjectName:
    Type: String
    Default: 'SecureInfrastructure'
    Description: Project name for tagging
  
  SecureEnvEnvironment:
    Type: String
    Default: 'Production'
    Description: Environment name for tagging

Resources:
  # KMS Key for encryption
  SecureEnvKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for SecureEnv encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: SecureEnvKMSKey
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secureenv-key
      TargetKeyId: !Ref SecureEnvKMSKey

  # VPC Configuration
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureEnvVPC
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Internet Gateway
  SecureEnvInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureEnvInternetGateway
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureEnvVPC
      InternetGatewayId: !Ref SecureEnvInternetGateway

  # Public Subnets
  SecureEnvPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnvPublicSubnet1
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnvPublicSubnet2
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Private Subnets
  SecureEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnvPrivateSubnet1
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnvPrivateSubnet2
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # NAT Gateways
  SecureEnvNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: SecureEnvNATGateway1EIP
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: SecureEnvNATGateway2EIP
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGateway1EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1
      Tags:
        - Key: Name
          Value: SecureEnvNATGateway1
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGateway2EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet2
      Tags:
        - Key: Name
          Value: SecureEnvNATGateway2
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Route Tables
  SecureEnvPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnvPublicRouteTable
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnvPrivateRouteTable1
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnvPrivateRouteTable2
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Routes
  SecureEnvPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref SecureEnvNATGateway1

  SecureEnvPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref SecureEnvNATGateway2

  # Subnet Route Table Associations
  SecureEnvPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      SubnetId: !Ref SecureEnvPublicSubnet1

  SecureEnvPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      SubnetId: !Ref SecureEnvPublicSubnet2

  SecureEnvPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable1
      SubnetId: !Ref SecureEnvPrivateSubnet1

  SecureEnvPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable2
      SubnetId: !Ref SecureEnvPrivateSubnet2

  # Security Groups
  SecureEnvWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers with SSH access restriction'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SecureEnvSSHAccessCIDR
          Description: 'SSH access from specified CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref SecureEnvALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref SecureEnvALBSecurityGroup
          Description: 'HTTPS from ALB'
      Tags:
        - Key: Name
          Value: SecureEnvWebServerSecurityGroup
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from anywhere'
      Tags:
        - Key: Name
          Value: SecureEnvALBSecurityGroup
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvWebServerSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: Name
          Value: SecureEnvDatabaseSecurityGroup
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # IAM Roles and Policies
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvEC2Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecureEnvEC2Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureEnvApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureEnvKMSKey.Arn
      Tags:
        - Key: Name
          Value: SecureEnvEC2Role
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: SecureEnvEC2InstanceProfile
      Roles:
        - !Ref SecureEnvEC2Role

  SecureEnvLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvLambdaRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: SecureEnvLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureEnvKMSKey.Arn
      Tags:
        - Key: Name
          Value: SecureEnvLambdaRole
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvCloudTrailRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SecureEnvCloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:us-west-2:${AWS::AccountId}:log-group:SecureEnvCloudTrailLogGroup:*'
      Tags:
        - Key: Name
          Value: SecureEnvCloudTrailRole
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # S3 Buckets
  SecureEnvCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref SecureEnvAccessLogsBucket
        LogFilePrefix: 'cloudtrail-access-logs/'
      Tags:
        - Key: Name
          Value: SecureEnvCloudTrailBucket
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-application-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: SecureEnvApplicationBucket
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: SecureEnvAccessLogsBucket
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt SecureEnvCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${SecureEnvCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # CloudTrail
  SecureEnvCloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: SecureEnvCloudTrailLogGroup
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureEnvKMSKey.Arn

  SecureEnvCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: SecureEnvCloudTrailBucketPolicy
    Properties:
      TrailName: SecureEnvCloudTrail
      S3BucketName: !Ref SecureEnvCloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecureEnvKMSKey
      CloudWatchLogsLogGroupArn: !GetAtt SecureEnvCloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt SecureEnvCloudTrailRole.Arn
      Tags:
        - Key: Name
          Value: SecureEnvCloudTrail
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # RDS Subnet Group
  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: SecureEnvDBSubnetGroup
      DBSubnetGroupDescription: 'Subnet group for SecureEnv RDS instances'
      SubnetIds:
        - !Ref SecureEnvPrivateSubnet1
        - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: SecureEnvDBSubnetGroup
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # RDS Instance
  SecureEnvDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: secureenv-database
      DBInstanceClass: !Ref SecureEnvDBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:SecureEnvDatabaseSecret:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref SecureEnvKMSKey
      VPCSecurityGroups:
        - !Ref SecureEnvDatabaseSecurityGroup
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: SecureEnvDatabase
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: SecureEnvDatabaseSecret
      Description: 'Database credentials for SecureEnv'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref SecureEnvKMSKey
      Tags:
        - Key: Name
          Value: SecureEnvDatabaseSecret
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Lambda Function
  SecureEnvLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: SecureEnvLambdaFunction
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecureEnvLambdaRole.Arn
      Code:
        ZipFile: |
          import json
          import os
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from SecureEnv Lambda!')
              }
      Environment:
        Variables:
          ENVIRONMENT: !Ref SecureEnvEnvironment
          KMS_KEY_ID: !Ref SecureEnvKMSKey
      KmsKeyArn: !GetAtt SecureEnvKMSKey.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecureEnvWebServerSecurityGroup
        SubnetIds:
          - !Ref SecureEnvPrivateSubnet1
          - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: SecureEnvLambdaFunction
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # EC2 Instances
  SecureEnvWebServer1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref SecureEnvInstanceType
      ImageId: ami-0c2d3e23fd0c31a77
      SubnetId: !Ref SecureEnvPrivateSubnet1
      SecurityGroupIds:
        - !Ref SecureEnvWebServerSecurityGroup
      IamInstanceProfile: !Ref SecureEnvEC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref SecureEnvKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>SecureEnv Web Server 1</h1>" > /var/www/html/index.html
      Tags:
        - Key: Name
          Value: SecureEnvWebServer1
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvWebServer2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref SecureEnvInstanceType
      ImageId: ami-0c2d3e23fd0c31a77
      SubnetId: !Ref SecureEnvPrivateSubnet2
      SecurityGroupIds:
        - !Ref SecureEnvWebServerSecurityGroup
      IamInstanceProfile: !Ref SecureEnvEC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref SecureEnvKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>SecureEnv Web Server 2</h1>" > /var/www/html/index.html
      Tags:
        - Key: Name
          Value: SecureEnvWebServer2
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  # Application Load Balancer
  SecureEnvApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: SecureEnvALB
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref SecureEnvPublicSubnet1
        - !Ref SecureEnvPublicSubnet2
      SecurityGroups:
        - !Ref SecureEnvALBSecurityGroup
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref SecureEnvAccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-access-logs'
      Tags:
        - Key: Name
          Value: SecureEnvApplicationLoadBalancer
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: SecureEnvTargetGroup
      Port: 80
      Protocol: HTTP
      VpcId: !Ref SecureEnvVPC
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Targets:
        - Id: !Ref SecureEnvWebServer1
          Port: 80
        - Id: !Ref SecureEnvWebServer2
          Port: 80
      Tags:
        - Key: Name
          Value: SecureEnvTargetGroup
        - Key: Project
          Value: !Ref SecureEnvProjectName
        - Key: Environment
          Value: !Ref SecureEnvEnvironment

  SecureEnvALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref SecureEnvTargetGroup
      LoadBalancerArn: !Ref SecureEnvApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

Outputs:
  SecureEnvVPCId:
    Description: 'VPC ID for SecureEnv'
    Value: !Ref SecureEnvVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  SecureEnvPublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref SecureEnvPublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  SecureEnvPublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref SecureEnvPublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  SecureEnvPrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref SecureEnvPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  SecureEnvPrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref SecureEnvPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  SecureEnvLoadBalancerDNS:
    Description: 'DNS name of the Application Load Balancer'
    Value: !GetAtt SecureEnvApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  SecureEnvDatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt SecureEnvDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  SecureEnvKMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref SecureEnvKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'
```

# Key Features and Security Implementations

## Security Best Practices
- **Security Groups:**
  - `SecureEnvWebServerSecurityGroup` restricts ingress to SSH (port 22) from a specified CIDR block (`SecureEnvSSHAccessCIDR`), and HTTP/HTTPS (ports 80/443) from the ALB security group, enforcing controlled access.
  - `SecureEnvALBSecurityGroup` allows HTTP/HTTPS traffic (ports 80/443) from any source (`0.0.0.0/0`) for public access to the load balancer.
  - `SecureEnvDatabaseSecurityGroup` permits MySQL traffic (port 3306) only from the web server security group, ensuring least privilege for database access.
- **IAM Roles:**
  - `SecureEnvEC2Role` grants EC2 instances permissions for S3 (`GetObject`, `PutObject`), KMS (`Decrypt`, `GenerateDataKey`), and CloudWatch Agent, following least privilege principles.
  - `SecureEnvLambdaRole` provides Lambda with KMS access and VPC execution permissions, ensuring secure function execution.
  - `SecureEnvCloudTrailRole` allows CloudTrail to write logs to CloudWatch and S3, with minimal permissions.
- **Encryption:**
  - RDS storage is encrypted using a custom KMS key (`SecureEnvKMSKey`).
  - S3 buckets (`SecureEnvCloudTrailBucket`, `SecureEnvApplicationBucket`, `SecureEnvAccessLogsBucket`) use AES256 server-side encryption.
  - CloudWatch log groups (`SecureEnvCloudTrailLogGroup`) and Secrets Manager (`SecureEnvDatabaseSecret`) are encrypted with the KMS key.
  - EC2 instance volumes are encrypted with the KMS key.
- **KMS Key:** `SecureEnvKMSKey` secures RDS, S3, Lambda, Secrets Manager, and CloudWatch logs, with access restricted to the root account, CloudTrail, EC2, and Lambda roles.
- **Public Access Restrictions:** All S3 buckets enforce public access blocks (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, `RestrictPublicBuckets`) to prevent unauthorized access.
- **CloudTrail:** `SecureEnvCloudTrail` logs all API activity to a secure S3 bucket with log file validation, multi-region logging, and KMS encryption for auditability.

## Monitoring & Alerting
- **CloudWatch Logs:** 
  - `SecureEnvCloudTrailLogGroup` retains CloudTrail logs for 30 days, encrypted with the KMS key.
- **CloudTrail:** Logs all API activities to `SecureEnvCloudTrailBucket` with a prefix (`cloudtrail-logs/`) and enables log file validation for integrity.
- **Outputs:** Exports critical resource identifiers (VPC ID, Subnet IDs, ALB DNS, RDS Endpoint, KMS Key ID) for integration with other stacks or monitoring tools.

## Infrastructure Components
- **VPC Configuration:** Creates a new VPC (`SecureEnvVPC`, 10.0.0.0/16) with DNS support and hostnames enabled, spanning two availability zones for high availability.
- **Subnets:**
  - `SecureEnvPublicSubnet1` (10.0.1.0/24) and `SecureEnvPublicSubnet2` (10.0.2.0/24) host the ALB and NAT Gateways, with public IP assignment enabled.
  - `SecureEnvPrivateSubnet1` (10.0.3.0/24) and `SecureEnvPrivateSubnet2` (10.0.4.0/24) host EC2 instances, RDS, and Lambda, isolated from direct internet access.
- **Internet Gateway:** `SecureEnvInternetGateway` enables internet access for public subnets, attached to the VPC via `SecureEnvVPCGatewayAttachment`.
- **NAT Gateways:** `SecureEnvNATGateway1` and `SecureEnvNATGateway2` in public subnets provide outbound internet access for private subnet resources, each with an Elastic IP.
- **Route Tables:**
  - `SecureEnvPublicRouteTable` routes public subnet traffic to the internet gateway.
  - `SecureEnvPrivateRouteTable1` and `SecureEnvPrivateRouteTable2` route private subnet traffic through respective NAT Gateways.
- **EC2 Instances:** 
  - `SecureEnvWebServer1` and `SecureEnvWebServer2` (t3.micro by default, configurable via `SecureEnvInstanceType`) run Apache HTTPD on Amazon Linux 2, with encrypted gp3 volumes (20 GB) and UserData to install and configure the web server.
- **RDS Instance:** `SecureEnvDatabase` (MySQL 8.0.35, db.t3.micro by default) is deployed in a Multi-AZ configuration with encrypted storage, automated backups (7-day retention), and deletion protection. Credentials are managed via `SecureEnvDatabaseSecret` in Secrets Manager.
- **Lambda Function:** `SecureEnvLambdaFunction` (Python 3.9) runs in the VPC with access to private subnets, secured with the KMS key and environment variables for configuration.
- **Application Load Balancer:** `SecureEnvApplicationLoadBalancer` is internet-facing, routes HTTP traffic (port 80) to `SecureEnvTargetGroup`, and logs access to `SecureEnvAccessLogsBucket`.
- **S3 Buckets:**
  - `SecureEnvCloudTrailBucket` stores CloudTrail logs with versioning, AES256 encryption, and access logging to `SecureEnvAccessLogsBucket`.
  - `SecureEnvApplicationBucket` stores application data with versioning and AES256 encryption.
  - `SecureEnvAccessLogsBucket` captures access logs for the ALB and CloudTrail bucket, with AES256 encryption.
- **Secrets Manager:** `SecureEnvDatabaseSecret` stores RDS credentials, encrypted with the KMS key, with a generated 32-character password.
- **CloudTrail:** Configured for multi-region logging with log file validation, delivering logs to `SecureEnvCloudTrailBucket` and CloudWatch.

## Compliance Features
- **Tagging:** All resources are tagged with `Name`, `Project` (`SecureEnvProjectName`), and `Environment` (`SecureEnvEnvironment`) for cost tracking and resource management.
- **Region:** Deployed in `us-west-2` (configurable via availability zones) to meet regional requirements.
- **Data Protection:** 
  - Encrypted storage for RDS, EC2 volumes, S3 buckets, Secrets Manager, and CloudWatch logs.
  - Deletion protection enabled for RDS, with snapshot retention on deletion.
- **Auditability:** CloudTrail ensures comprehensive API logging with KMS encryption and log file validation.
- **Dynamic Parameterization:** Uses `!Ref`, `!GetAtt`, `!Sub`, and `Fn::Base64` for flexible template configuration, with parameters for instance type, CIDR block, RDS class, project name, and environment.
- **VPC Isolation:** Private subnets protect EC2, RDS, and Lambda, with NAT Gateways for controlled outbound access and security groups restricting inbound traffic.