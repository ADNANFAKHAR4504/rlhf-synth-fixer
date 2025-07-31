AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Scalable Production Infrastructure with VPC, RDS, Lambda, CloudFront, and comprehensive security controls'

Parameters:
  ProjectName:
    Type: String
    Default: 'SecureApp'
    Description: 'Name of the project for resource tagging'
  
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment type for resource tagging'
  
  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Owner of the resources for cost allocation'
  
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI

Resources:
  # ============================================================================
  # KMS Keys for Encryption
  # ============================================================================
  
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for application data encryption'
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
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref ApplicationKMSKey

  # ============================================================================
  # VPC and Networking Components
  # ============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
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
      AvailabilityZone: us-east-1a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1b
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1a
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1b
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
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
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-routes'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
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
          Value: !Sub '${ProjectName}-${Environment}-private-routes-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
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
          Value: !Sub '${ProjectName}-${Environment}-private-routes-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
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

  # ============================================================================
  # Security Groups
  # ============================================================================
  
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH access from bastion host'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL access from Lambda functions'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access from anywhere (restrict in production)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-lambda-sg'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS services'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL access to database'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # IAM Roles and Policies
  # ============================================================================
  
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref ApplicationBucket
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile'
      Roles:
        - !Ref EC2InstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-role'
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
        - PolicyName: RDSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                Resource: '*'
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationBucket}/*'
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-cloudtrail-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !Sub 'arn:aws:logs:us-east-1:${AWS::AccountId}:*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # S3 Buckets with Security Features
  # ============================================================================
  
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'application-bucket-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-logging-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetentionRule
            Status: Enabled
            ExpirationInDays: 365
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-logging-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ============================================================================
  # RDS Database with Multi-AZ
  # ============================================================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref ApplicationKMSKey
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-database'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # Lambda Function with VPC Configuration
  # ============================================================================
  
  ApplicationLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-app-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          
          def lambda_handler(event, context):
              # Sample Lambda function
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Hello from Lambda!',
                      'environment': 'production'
                  })
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DATABASE_ENDPOINT: !GetAtt DatabaseInstance.Endpoint.Address
          S3_BUCKET: !Ref ApplicationBucket
          KMS_KEY_ID: !Ref ApplicationKMSKey
      KmsKeyArn: !GetAtt ApplicationKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-function'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # CloudWatch Logs
  # ============================================================================
  
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}-app-function'
      RetentionInDays: 14
      KmsKeyId: !GetAtt ApplicationKMSKey.Arn

  # ============================================================================
  # CloudTrail for API Logging
  # ============================================================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-cloudtrail'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref ApplicationKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::Lambda::Function'
              Values: 
                - !GetAtt ApplicationLambdaFunction.Arn
            - Type: 'AWS::RDS::DBCluster'
              Values: 
                - '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # SSL Certificate for CloudFront
  # ============================================================================
  
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${ProjectName}-${Environment}.example.com'
      SubjectAlternativeNames:
        - !Sub '*.${ProjectName}-${Environment}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ssl-cert'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ============================================================================
  # CloudFront Distribution
  # ============================================================================
  
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      Distribution