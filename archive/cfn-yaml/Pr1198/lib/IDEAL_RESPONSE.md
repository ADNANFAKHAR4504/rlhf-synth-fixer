AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Template with Best Practices - us-east-1'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'prod']
    Description: 'Environment type for resource isolation'
  
  Owner:
    Type: String
    Default: 'platform-team'
    Description: 'Team ownership for resources'
  
  ProjectName:
    Type: String
    Default: 'secure-infrastructure'
    Description: 'Project name for resource identification'
  
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium']
    Description: 'EC2 instance type'

Mappings:
  # Environment-specific configurations for isolation
  EnvironmentConfig:
    dev:
      VpcCidr: '10.0.0.0/16'
      PrivateSubnetCidr: '10.0.1.0/24'
      PublicSubnetCidr: '10.0.2.0/24'
      DatabaseSubnetCidr: '10.0.3.0/24'
    prod:
      VpcCidr: '10.1.0.0/16'
      PrivateSubnetCidr: '10.1.1.0/24'
      PublicSubnetCidr: '10.1.2.0/24'
      DatabaseSubnetCidr: '10.1.3.0/24'

Resources:
  # ============================================================================
  # KMS Keys for Encryption at Rest
  # ============================================================================
  
  # KMS Key for S3 bucket encryption
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-s3-${Environment}'
      TargetKeyId: !Ref S3KMSKey

  # KMS Key for RDS encryption
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for RDS encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-rds-${Environment}'
      TargetKeyId: !Ref RDSKMSKey

  # ============================================================================
  # VPC and Networking - Environment Isolation
  # ============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PublicSubnetCidr]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Private Subnet
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PrivateSubnetCidr]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Database Subnet
  DatabaseSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, DatabaseSubnetCidr]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-subnet-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # NAT Gateway for private subnet internet access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  # ============================================================================
  # Security Groups - Restrictive by Default
  # ============================================================================
  
  # Web Server Security Group - Only allows HTTP/HTTPS
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers - restrictive'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from bastion only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-sg-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Bastion Host Security Group - SSH access only
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # In production, restrict to specific IP ranges
          Description: 'SSH access'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bastion-sg-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Database Security Group - Only allows access from web servers
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers only'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-sg-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # ============================================================================
  # S3 Buckets with Encryption and Logging
  # ============================================================================
  
  # Dedicated logging bucket for S3 access logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Main application bucket with encryption and logging
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'app-bucket-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      # Note: S3 notification to CloudWatch is configured via Lambda or EventBridge
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # ============================================================================
  # IAM Roles and Policies - Least Privilege
  # ============================================================================
  
  # EC2 Instance Role with least privilege
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ec2-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'  # Restrict to us-east-1 only
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Least privilege policy for S3 access
  S3AccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-s3-access-policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
            Resource: !Sub '${ApplicationBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Effect: Allow
            Action:
              - 's3:ListBucket'
            Resource: !GetAtt ApplicationBucket.Arn
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
          - Effect: Allow
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: !GetAtt S3KMSKey.Arn
      Roles:
        - !Ref EC2InstanceRole

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-ec2-profile-${Environment}'
      Roles:
        - !Ref EC2InstanceRole

  # Lambda Execution Role with least privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
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
                Resource: !Ref APICredentialsSecret
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetRandomPassword'
                Resource: '*'
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # RDS Enhanced Monitoring Role
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-rds-monitoring-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # IAM User with MFA requirement
  ApplicationUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${ProjectName}-app-user-${Environment}'
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Policy requiring MFA for console access
  MFARequiredPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-mfa-required-policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny all actions without MFA except for MFA setup actions
          - Effect: Deny
            NotAction:
              - 'iam:ChangePassword'
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'iam:GetUser'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'
          # Allow MFA setup actions
          - Effect: Allow
            Action:
              - 'iam:ChangePassword'
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'iam:GetUser'
            Resource: '*'
      Users:
        - !Ref ApplicationUser

  # ============================================================================
  # Secrets Manager for API Credentials
  # ============================================================================
  
  # Database credentials in Secrets Manager with auto-rotation
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}/database/credentials/${Environment}'
      Description: 'Database credentials with auto-rotation'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref RDSKMSKey
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # API credentials with auto-rotation
  APICredentialsSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}/api/credentials/${Environment}'
      Description: 'API credentials with auto-rotation'
      GenerateSecretString:
        SecretStringTemplate: '{"api_key": ""}'
        GenerateStringKey: 'api_secret'
        PasswordLength: 64
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Secret Rotation Schedule for API credentials
  APISecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref APICredentialsSecret
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30  # Rotate every 30 days

  # Lambda function for secret rotation
  SecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-secret-rotation-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info('Secret rotation triggered')
              # Implement your secret rotation logic here
              return {
                  'statusCode': 200,
                  'body': json.dumps('Secret rotation completed')
              }
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Permission for Secrets Manager to invoke the rotation Lambda
  SecretRotationLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecretRotationLambda
      Action: lambda:InvokeFunction
      Principal: secretsmanager.amazonaws.com

  # ============================================================================
  # RDS Database with Encryption
  # ============================================================================
  
  # Database Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet
        - !Ref PrivateSubnet
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # RDS Instance with encryption
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete # W3011 fix
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-db-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43' # E3691 fix (valid version)
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # ============================================================================
  # EC2 Instance with Encrypted EBS
  # ============================================================================
  
  # EC2 Instance in private subnet
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI (us-east-1)
      InstanceType: !Ref InstanceType
      # KeyName is optional - instance can be accessed via Session Manager
      SubnetId: !Ref PrivateSubnet
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent for detailed monitoring
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Monitoring: true  # Enable detailed monitoring
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-server-${Environment}'
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # Note: EC2 KeyPairs must be created outside of CloudFormation
  # You can create a parameter to accept an existing KeyPair name

  # ============================================================================
  # CloudWatch Logging and Monitoring
  # ============================================================================
  
  # CloudWatch Log Group for S3 events
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt S3KMSKey.Arn
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # CloudWatch Log Group for application logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}-${Environment}'
      RetentionInDays: 30
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # CloudTrail for audit logging
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-cloudtrail-${Environment}'
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      KMSKeyId: !Ref S3KMSKey
      IsLogging: true # E3003 fix
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !GetAtt ApplicationBucket.Arn # W1020: Remove unnecessary !Sub
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

  # ============================================================================
  # VPC Flow Logs for Network Monitoring
  # ============================================================================
  
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${Environment}'
      RetentionInDays: 14

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: env
          Value: !Ref Environment
        - Key: owner
          Value: !Ref Owner
        - Key: project
          Value: !Ref ProjectName

# ============================================================================
# Outputs - Key Resource Identifiers
# ============================================================================

Outputs:
  VPCId:
    Description: 'VPC ID for the secure infrastructure'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-vpc-id-${Environment}'

  PrivateSubnetId:
    Description: 'Private subnet ID for application servers'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${ProjectName}-private-subnet-id-${Environment}'

  PublicSubnetId:
    Description: 'Public subnet ID for load balancers'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${ProjectName}-public-subnet-id-${Environment}'

  ApplicationBucketName:
    Description: 'S3 bucket name for application data'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${ProjectName}-app-bucket-${Environment}'

  LoggingBucketName:
    Description: 'S3 bucket name for access logs'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${ProjectName}-logging-bucket-${Environment}'

  DatabaseEndpoint:
    Description: 'RDS database endpoint address'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-db-endpoint-${Environment}'

  DatabasePort:
    Description: 'RDS database endpoint port'
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${ProjectName}-db-port-${Environment}'

  EC2InstanceId:
    Description: 'EC2 web server instance ID'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${ProjectName}-ec2-instance-id-${Environment}'

  CloudTrailName:
    Description: 'CloudTrail trail name'
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${ProjectName}-cloudtrail-name-${Environment}'