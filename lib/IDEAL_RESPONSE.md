# AWS CloudFormation Template: Secure AWS Infrastructure

This CloudFormation template sets up a secure, production-ready AWS infrastructure in the `us-west-2` region, featuring a VPC, EC2 instances, RDS database, Lambda function, Application Load Balancer (ALB), and CloudTrail for comprehensive monitoring and auditing.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated secure AWS infrastructure with VPC, EC2, RDS, Lambda, ALB, CloudTrail, and Config'

Parameters:
  ProjectName:
    Type: String
    Default: 'secureenv'
    Description: 'Prefix for naming all resources'
  AllowedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR range allowed for HTTP/HTTPS access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  AllowedSSHCIDR:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
    MinLength: 1
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'SSM parameter for latest Amazon Linux 2 AMI'

Mappings:
  ELBAccountIds:
    ap-south-1:
      AccountId: "718504428378"
    us-east-1:
      AccountId: "127311923021"
    us-east-2:
      AccountId: "033677994240"
    us-west-1:
      AccountId: "027434742980"
    us-west-2:
      AccountId: "797873946194"

Resources:
  # VPC Configuration
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Internet Gateway
  SecureEnvInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

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
          Value: !Sub '${ProjectName}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Private Subnets
  SecureEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # NAT Gateways
  SecureEnvNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgateway-1-eip'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgateway-2-eip'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGateway1EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgateway-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGateway2EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgateway-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Route Tables
  SecureEnvPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

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
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from specified CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP from specified CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP from specified CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS from specified CIDR'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-alb-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

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
          Value: !Sub '${ProjectName}-db-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # IAM Roles and Policies
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: !Sub '${ProjectName}-ec2-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureEnvApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureEnvApplicationBucket.Arn
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-appdata'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ec2-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref SecureEnvEC2Role

  SecureEnvLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: !Sub '${ProjectName}-lambda-policy'
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
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-appdata'
              - Effect: Allow
                Action:
                  - config:StartConfigurationRecorder
                  - config:StopConfigurationRecorder
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-cloudtrail-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${ProjectName}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-config-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource:
                  - !GetAtt SecureEnvConfigBucket.Arn
                  - !Sub '${SecureEnvConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - config:Put*
                  - config:Get*
                  - config:Describe*
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-config-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # S3 Buckets
  SecureEnvCloudTrailBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: cloudtrail-logs-transition
            Status: Enabled
            ExpirationInDays: 2555
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvApplicationBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-application-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: app-objects
            Status: Enabled
            ExpirationInDays: 3650
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-application-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvAccessLogsBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: access-logs-transition
            Status: Enabled
            ExpirationInDays: 2555
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-access-logs-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowELBAccessLogs
            Effect: Allow
            Principal:
              AWS: !Sub 
                - "arn:aws:iam::${ELBAccountId}:root"
                - { ELBAccountId: !FindInMap [ELBAccountIds, !Ref "AWS::Region", AccountId] }
            Action: s3:PutObject
            Resource: !Sub "${SecureEnvAccessLogsBucket.Arn}/alb-access-logs/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  SecureEnvConfigBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-config-${AWS::AccountId}-${AWS::Region}'
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
          Value: !Sub '${ProjectName}-config-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

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
            Resource: !Sub '${SecureEnvCloudTrailBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSCloudTrailWriteMultiRegion
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${SecureEnvCloudTrailBucket.Arn}/AWSLogs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # CloudTrail
  SecureEnvCloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-loggroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: SecureEnvCloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-cloudtrail'
      S3BucketName: !Ref SecureEnvCloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt SecureEnvCloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt SecureEnvCloudTrailRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvUnauthorizedMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref SecureEnvCloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: !Sub '${ProjectName}-metrics'
          MetricValue: '1'

  SecureEnvUnauthorizedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-unauthorized-calls'
      MetricName: UnauthorizedAPICalls
      Namespace: !Sub '${ProjectName}-metrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  # RDS Subnet Group
  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: !Sub '${ProjectName} RDS subnet group'
      SubnetIds:
        - !Ref SecureEnvPrivateSubnet1
        - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-subnet-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # RDS Instance
  SecureEnvDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      Name: !Sub '/${ProjectName}/database/credentials'
      Description: !Sub 'Database credentials for ${ProjectName}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-secret'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${SecureEnvDatabaseSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref SecureEnvDatabaseSecurityGroup
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false
      EnablePerformanceInsights: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # DynamoDB Table
  SecureEnvDynamoDBTable:
    Type: AWS::DynamoDB::Table
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      TableName: !Sub '${ProjectName}-appdata'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-appdata-table'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Lambda Function
  SecureEnvLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-lambda-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecureEnvLambdaRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          def lambda_handler(event, context):
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table(os.environ['TABLE_NAME'])
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from SecureEnv Lambda!')
              }
      Environment:
        Variables:
          TABLE_NAME: !Ref SecureEnvDynamoDBTable
          ENVIRONMENT: Production
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecureEnvWebServerSecurityGroup
        SubnetIds:
          - !Ref SecureEnvPrivateSubnet1
          - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-function'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # AWS Config Resources
  SecureEnvConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-config-recorder'
      RoleARN: !GetAtt SecureEnvConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecureEnvDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref SecureEnvConfigBucket

  SecureEnvStartConfigRecorderFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
      Role: !GetAtt SecureEnvLambdaRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse
          def handler(event, context):
              try:
                  request_type = event['RequestType']
                  recorder = event['ResourceProperties']['RecorderName']
                  client = boto3.client('config')
                  if request_type == 'Create':
                      client.start_configuration_recorder(ConfigurationRecorderName=recorder)
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                  elif request_type == 'Delete':
                      try:
                          client.stop_configuration_recorder(ConfigurationRecorderName=recorder)
                          cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      except client.exceptions.NoRunningConfigurationRecorderException:
                          # Recorder already stopped, proceed with deletion
                          cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print("Error:", str(e))
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-start-config-recorder'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvStartConfigRecorder:
    Type: Custom::StartRecorder
    DependsOn:
      - SecureEnvConfigBucket
      - SecureEnvConfigRole
      - SecureEnvDeliveryChannel
    Properties:
      ServiceToken: !GetAtt SecureEnvStartConfigRecorderFunction.Arn
      RecorderName: !Ref SecureEnvConfigRecorder

  SecureEnvConfigRuleIAMPasswordPolicy:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureEnvStartConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-iam-password-policy'
      Description: 'Checks if password policy is compliant'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_PASSWORD_POLICY

  # EC2 Instances
  SecureEnvWebServer1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: !Ref LatestAmiId
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
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          yum install -y amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
          systemctl enable amazon-cloudwatch-agent
          echo "<h1>SecureEnv Web Server 1</h1>" > /usr/share/nginx/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-server-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvWebServer2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: !Ref LatestAmiId
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
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          yum install -y amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
          systemctl enable amazon-cloudwatch-agent
          echo "<h1>SecureEnv Web Server 2</h1>" > /usr/share/nginx/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-server-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  # Application Load Balancer
  SecureEnvApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: SecureEnvAccessLogsBucketPolicy
    Properties:
      Name: !Sub '${ProjectName}-alb'
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
          Value: !Sub '${ProjectName}-alb'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-target-group'
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
          Value: !Sub '${ProjectName}-target-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

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

  SecureEnvDynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref SecureEnvDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  SecureEnvCloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt SecureEnvCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
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