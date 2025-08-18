# AWS Secure & Highly Available Application Infrastructure

Below is a complete AWS CloudFormation template that meets all your requirements. This template deploys a secure, highly available infrastructure with proper tagging, encryption, monitoring, and compliance features.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Highly Available Application Infrastructure with comprehensive security, monitoring, and compliance features'

# Parameters for customization and reusability
Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming and tagging'
    AllowedValues: ['dev', 'staging', 'prod']
  
  TeamEmail:
    Type: String
    Default: 'devops-team@company.com'
    Description: 'Team email for resource ownership tagging'
  
  EC2AMIId:
    Type: AWS::EC2::Image::Id
    Default: 'ami-0c02fb55956c7d316'  # Amazon Linux 2 AMI in us-west-2
    Description: 'AMI ID for EC2 instances'
  
  DBUsername:
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    Description: 'Database administrator username'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database administrator password'
    Default: 'TempPassword123!'

# Mappings for AZ-specific configurations
Mappings:
  RegionConfig:
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b

Resources:
  # ===========================================
  # KMS Keys for Encryption
  # ===========================================
  
  # KMS Key for general encryption needs
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${EnvironmentSuffix} application encryption'
      KeyPolicy:
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
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'app-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # KMS Key Alias for easier reference
  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/app-${EnvironmentSuffix}-key'
      TargetKeyId: !Ref ApplicationKMSKey

  # ===========================================
  # VPC and Networking - High Availability Design
  # ===========================================
  
  # VPC with DNS support for proper service resolution
  ApplicationVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'app-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Internet Gateway for public subnet internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'app-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref ApplicationVPC

  # Public Subnets across multiple AZs for high availability
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ApplicationVPC
      AvailabilityZone: !FindInMap [RegionConfig, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'app-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ApplicationVPC
      AvailabilityZone: !FindInMap [RegionConfig, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'app-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Private Subnets for database and internal resources
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ApplicationVPC
      AvailabilityZone: !FindInMap [RegionConfig, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'app-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ApplicationVPC
      AvailabilityZone: !FindInMap [RegionConfig, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'app-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # NAT Gateways for private subnet internet access (HA across AZs)
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'app-nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'app-nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'app-nat-gw-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'app-nat-gw-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Route Tables and Routes
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ApplicationVPC
      Tags:
        - Key: Name
          Value: !Sub 'app-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  DefaultPublicRoute:
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

  # Private Route Tables (separate for each AZ for HA)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ApplicationVPC
      Tags:
        - Key: Name
          Value: !Sub 'app-private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  DefaultPrivateRoute1:
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
      VpcId: !Ref ApplicationVPC
      Tags:
        - Key: Name
          Value: !Sub 'app-private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  DefaultPrivateRoute2:
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

  # ===========================================
  # Security Groups - Least Privilege Access
  # ===========================================
  
  # Security Group for web servers (only HTTP/HTTPS inbound)
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'app-web-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for web servers - HTTP/HTTPS only'
      VpcId: !Ref ApplicationVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP inbound traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS inbound traffic'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'app-web-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Security Group for database access
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'app-db-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for database - internal access only'
      VpcId: !Ref ApplicationVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow MySQL access from web servers'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'Allow MySQL access from Lambda functions'
      Tags:
        - Key: Name
          Value: !Sub 'app-db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # Security Group for Lambda functions
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'app-lambda-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref ApplicationVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'app-lambda-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # IAM Roles and Policies - Least Privilege
  # ===========================================
  
  # EC2 Instance Role with minimal required permissions
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'app-ec2-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy  # AWS managed policy for CloudWatch
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationS3Bucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'app-ec2-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'app-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

  # Lambda Execution Role with VPC and minimal permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'app-lambda-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole  # AWS managed policy
      Policies:
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt ApplicationDynamoDBTable.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'app-lambda-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # S3 Bucket with Encryption and Security
  # ===========================================
  
  ApplicationS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-storage-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3CloudWatchLogGroup
      Tags:
        - Key: Name
          Value: !Sub 'app-storage-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # S3 Bucket for access logs
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-access-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'app-access-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # RDS Database - Multi-AZ for High Availability
  # ===========================================
  
  # DB Subnet Group for Multi-AZ deployment
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'app-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'app-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # RDS Instance with Multi-AZ and encryption
  ApplicationDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'app-database-${EnvironmentSuffix}'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      MultiAZ: true  # High Availability requirement
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: !Sub 'app-database-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # DynamoDB Table with Point-in-Time Recovery
  # ===========================================
  
  ApplicationDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'app-dynamodb-${EnvironmentSuffix}'
      BillingMode: 'PAY_PER_REQUEST'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref ApplicationKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true  # High Availability requirement
      StreamSpecification:
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      Tags:
        - Key: Name
          Value: !Sub 'app-dynamodb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # Lambda Function with Encryption
  # ===========================================
  
  ApplicationLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'app-lambda-${EnvironmentSuffix}'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              # Sample Lambda function
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from Lambda!')
              }
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ApplicationDynamoDBTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      KmsKeyArn: !GetAtt ApplicationKMSKey.Arn  # Encrypt environment variables
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'app-lambda-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # EC2 Instances
  # ===========================================
  
  # Launch Template for consistent EC2 configuration
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'app-launch-template-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Ref EC2AMIId
        InstanceType: 't3.micro'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            # Configure CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -c default -s
        TagSpecifications:
          - ResourceType: 'instance'
            Tags:
              - Key: Name
                Value: !Sub 'app-instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Owner
                Value: !Ref TeamEmail

  # EC2 Instance in first AZ
  ApplicationEC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'app-instance-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # EC2 Instance in second AZ for HA
  ApplicationEC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'app-instance-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # ===========================================
  # CloudWatch Monitoring and Compliance
  # ===========================================
  
  # CloudWatch Log Group for application logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/application/${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'app-log-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # CloudWatch Log Group for Lambda function
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/app-lambda-${EnvironmentSuffix}'
      RetentionInDays: 14
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'app-lambda-log-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # CloudWatch Log Group for S3 access logs
  S3CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'app-s3-log-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # CloudWatch Alarm for unauthorized API access attempts
  UnauthorizedAPIAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'UnauthorizedAPIAccess-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for detecting unauthorized API access attempts'
      MetricName: 'UnauthorizedAPICalls'
      Namespace: 'AWS/CloudTrail'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref SecurityNotificationTopic
      Tags:
        - Key: Name
          Value: !Sub 'unauthorized-api-alarm-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref TeamEmail

  # CloudWatch Alarm for high error rates
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties: