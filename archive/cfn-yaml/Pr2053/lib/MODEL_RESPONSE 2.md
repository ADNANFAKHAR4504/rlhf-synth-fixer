The error indicates that your CloudFormation stack is in ROLLBACK_COMPLETE state, which means a previous deployment failed and rolled back. You need to delete the existing stack first before deploying again. However, I also notice the Lambda function code was truncated in my previous response, which likely caused the deployment failure.

Here's the complete, corrected TapStack.yml file:
```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Secure FinTech Infrastructure with Multi-Region Support'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'Production'
    AllowedValues:
      - 'Production'
      - 'Staging'
      - 'Development'
    Description: 'Environment name for resource tagging and configuration'
  
  CostCenter:
    Type: String
    Default: 'Finance'
    AllowedValues:
      - 'Finance'
      - 'IT'
      - 'Operations'
    Description: 'Cost center for resource allocation'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: 'CIDR block for the VPC'
  
  DBUsername:
    Type: String
    Default: 'tapuser'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: 'Database master username'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Description: 'Database master password (8-41 characters)'
    Default: 'TempPass123'

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, 'Production']

Resources:
  # KMS Key for encryption
  TapKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for TapStack encryption'
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
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/tapstack-${EnvironmentName}'
      TargetKeyId: !Ref TapKMSKey

  # VPC and Networking
  TapVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'TapVPC-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Internet Gateway
  TapInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TapIGW-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref TapInternetGateway
      VpcId: !Ref TapVPC

  # Public Subnets
  TapPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidr1}.${VpcCidr2}.1.0/24'
        - VpcCidr1: !Select [0, !Split ['.', !Ref VpcCidr]]
          VpcCidr2: !Select [1, !Split ['.', !Ref VpcCidr]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet1-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidr1}.${VpcCidr2}.2.0/24'
        - VpcCidr1: !Select [0, !Split ['.', !Ref VpcCidr]]
          VpcCidr2: !Select [1, !Split ['.', !Ref VpcCidr]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet2-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Private Subnets
  TapPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidr1}.${VpcCidr2}.3.0/24'
        - VpcCidr1: !Select [0, !Split ['.', !Ref VpcCidr]]
          VpcCidr2: !Select [1, !Split ['.', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet1-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Sub
        - '${VpcCidr1}.${VpcCidr2}.4.0/24'
        - VpcCidr1: !Select [0, !Split ['.', !Ref VpcCidr]]
          VpcCidr2: !Select [1, !Split ['.', !Ref VpcCidr]]
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet2-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # NAT Gateways
  TapNatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: TapInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW1EIP-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapNatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: TapInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW2EIP-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt TapNatGateway1EIP.AllocationId
      SubnetId: !Ref TapPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW1-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapNatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt TapNatGateway2EIP.AllocationId
      SubnetId: !Ref TapPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW2-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Tables
  TapPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicRoutes-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: TapInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref TapPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref TapInternetGateway

  TapPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref TapPublicRouteTable
      SubnetId: !Ref TapPublicSubnet1

  TapPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref TapPublicRouteTable
      SubnetId: !Ref TapPublicSubnet2

  TapPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateRoutes1-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref TapPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref TapNatGateway1

  TapPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref TapPrivateRouteTable1
      SubnetId: !Ref TapPrivateSubnet1

  TapPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapVPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateRoutes2-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref TapPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref TapNatGateway2

  TapPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref TapPrivateRouteTable2
      SubnetId: !Ref TapPrivateSubnet2

  # VPC Flow Logs
  TapVPCFlowLogRole:
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
        - PolicyName: TapVPCFlowLogDeliveryRolePolicy
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${EnvironmentName}'
      RetentionInDays: 90

  TapVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref TapVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref TapVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt TapVPCFlowLogRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Security Groups
  TapWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapWebSG-${EnvironmentName}'
      GroupDescription: 'Security group for web tier - allows HTTP/HTTPS'
      VpcId: !Ref TapVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'TapWebSG-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapApplicationSG-${EnvironmentName}'
      GroupDescription: 'Security group for application tier'
      VpcId: !Ref TapVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref TapWebSecurityGroup
          Description: 'Application access from web tier'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'TapApplicationSG-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapDatabaseSG-${EnvironmentName}'
      GroupDescription: 'Security group for database tier'
      VpcId: !Ref TapVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref TapApplicationSecurityGroup
          Description: 'PostgreSQL access from application tier'
      Tags:
        - Key: Name
          Value: !Sub 'TapDatabaseSG-${EnvironmentName}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Buckets
  TapDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-data-${AWS::AccountId}-${EnvironmentName}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: 30
            NoncurrentVersionExpirationInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-logs-${AWS::AccountId}-${EnvironmentName}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: 30
            NoncurrentVersionExpirationInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-cloudtrail-${AWS::AccountId}-${EnvironmentName}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TapCloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt TapCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${TapCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # DynamoDB Table
  TapTransactionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'TapTransactions-${EnvironmentName}'
      BillingMode: ON_DEMAND
      AttributeDefinitions:
        - AttributeName: TransactionId
          AttributeType: S
        - AttributeName: UserId
          AttributeType: S
        - AttributeName: Timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: TransactionId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserIndex
          KeySchema:
            - AttributeName: UserId
              KeyType: HASH
            - AttributeName: Timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: alias/aws/dynamodb
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS Subnet Group
  TapDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for TapStack RDS'
      SubnetIds:
        - !Ref TapPrivateSubnet1
        - !Ref TapPrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS Instance
  TapDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'tap-db-${EnvironmentName}'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '13.7'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref TapKMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref TapDBSubnetGroup
      VPCSecurityGroups:
        - !Ref TapDatabaseSecurityGroup
      MultiAZ: !If [IsProduction, true, false]
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # IAM Roles and Policies
  TapAdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TapAdminRole-${EnvironmentName}-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: true
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDeveloperRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TapDeveloperRole-${EnvironmentName}-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: true
      Policies:
        - PolicyName: TapDeveloperPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub '${TapDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !GetAtt TapDataBucket.Arn
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt TapTransactionsTable.Arn
                  - !Sub '${TapTransactionsTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                Resource: '*'
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource: !GetAtt TapRemediationFunction.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapAdminUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub 'tap-admin-${EnvironmentName}-${AWS::Region}'
      Policies:
        - PolicyName: AssumeAdminRole
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: sts:AssumeRole
                Resource: !GetAtt TapAdminRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  TapDeveloperUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub 'tap-developer-${EnvironmentName}-${AWS::Region}'
      Policies:
        - PolicyName: AssumeDeveloperRole
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: sts:AssumeRole
                Resource: !GetAtt TapDeveloperRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Lambda Execution Role
  TapLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TapLambdaExecutionRole-${EnvironmentName}-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: TapRemediationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketPublicAccessBlock
                  - s3:PutBucketPublicAccessBlock
                  - s3:GetBucketEncryption
                  - s3:PutBucketEncryption
                  - s3:GetBucketVersioning
                  - s3:PutBucketVersioning
                  - s3:GetBucketTagging
                  - s3:PutBucketTagging
                Resource: '*'
              - Effect: Allow
                Action:
                  - dynamodb:DescribeTable
                  - dynamodb:UpdateTable
                Resource: '*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:ModifyDBInstance
                Resource: '*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Lambda Function for Remediation
  TapRemediationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'TapRemediation-${EnvironmentName}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt TapLambdaExecutionRole.Arn
      Timeout: 300
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentName
          COST_CENTER: !Ref CostCenter
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              print(f"Received event: {json.
              ```