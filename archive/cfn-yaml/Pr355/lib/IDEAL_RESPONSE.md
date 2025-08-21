# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production-grade secure infrastructure for AWS application deployment with comprehensive security controls"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
          - ApplicationName
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - AllowedSSHCidr
      - Label:
          default: "Security Configuration"
        Parameters:
          - ExistingGuardDutyDetectorId

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  ApplicationName:
    Type: String
    Default: "secure-app"
    Description: "Name of the application for resource naming"
    AllowedPattern: "^[a-zA-Z0-9-]+$"
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"

  VpcCidr:
    Type: String
    Default: "10.0.0.0/16"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: "CIDR block for the VPC"

  AllowedSSHCidr:
    Type: String
    Default: "203.0.113.0/24"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    Description: "CIDR block allowed for SSH access (replace with your IP range)"

  ExistingGuardDutyDetectorId:
    Type: String
    Default: "d56d7ed660944653bca5fce5f3570782"
    Description: "ID of the existing GuardDuty detector to use instead of creating a new one"

Resources:
  # =============================================================================
  # IAM Roles and Instance Profiles (Requirement 2, 5)
  # =============================================================================
  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      Path: "/"
      Policies:
        - PolicyName: "AppPolicy"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              # S3 permissions - restricted to specific buckets
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:GetObjectVersion
                  - s3:DeleteObjectVersion
                Resource:
                  - !Sub "${ApplicationBucket.Arn}/*"
                  - !Sub "${ApplicationLogBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetBucketLocation
                  - s3:GetBucketVersioning
                  - s3:GetBucketAcl
                  - s3:GetBucketLogging
                Resource:
                  - !GetAtt ApplicationBucket.Arn
                  - !GetAtt ApplicationLogBucket.Arn
              # DynamoDB permissions - restricted to specific table
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:BatchGetItem
                  - dynamodb:BatchWriteItem
                Resource:
                  - !GetAtt TurnAroundPromptTable.Arn
                  - !Sub "${TurnAroundPromptTable.Arn}/index/*"
              # KMS permissions - restricted to application key
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:GenerateDataKeyWithoutPlaintext
                  - kms:DescribeKey
                Resource: !GetAtt ApplicationKMSKey.Arn
              # CloudWatch Logs permissions - restricted to application log groups
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource:
                  - !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ApplicationName}-${EnvironmentSuffix}-*"
                  - !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${ApplicationName}-${EnvironmentSuffix}"
                  - !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/rds/instance/${ApplicationName}-${EnvironmentSuffix}-*"
              # RDS permissions - restricted to specific database
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                  - rds:DescribeDBSubnetGroups
                Resource:
                  - !Sub "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${ApplicationName}-${EnvironmentSuffix}-db"
                  - !Sub "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:subgrp:${ApplicationName}-dbsubnet"
              # Secrets Manager permissions - restricted to database secret
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                  - secretsmanager:DescribeSecret
                Resource: !Ref DatabaseSecret
              # EC2 VPC permissions for Lambda execution (these need to remain broad for VPC operations)
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                  - ec2:AttachNetworkInterface
                  - ec2:DetachNetworkInterface
                Resource: "*"
              - Effect: Allow
                Action:
                  - ec2:DescribeSubnets
                  - ec2:DescribeSecurityGroups
                  - ec2:DescribeVpcs
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-role"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: "/"
      Roles: [!Ref ApplicationRole]
  # =============================================================================
  # KMS Keys for Encryption (Requirement 2)
  # =============================================================================
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "KMS key for ${ApplicationName} application encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
            Resource: "*"
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey*"
            Resource: "*"
          - Sid: Allow GuardDuty to use the key
            Effect: Allow
            Principal:
              Service: guardduty.amazonaws.com
            Action:
              - "kms:GenerateDataKey*"
              - "kms:Decrypt"
            Resource: "*"
          - Sid: Allow CloudWatch Logs to use the key
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - "kms:Encrypt"
              - "kms:Decrypt"
              - "kms:ReEncrypt*"
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
            Resource: "*"
            Condition:
              ArnEquals:
                "kms:EncryptionContext:aws:logs:arn": !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${ApplicationName}-${EnvironmentSuffix}"
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-kms-key"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${ApplicationName}-${EnvironmentSuffix}-key"
      TargetKeyId: !Ref ApplicationKMSKey

  # =============================================================================
  # VPC and Networking (Requirement 9)
  # =============================================================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-public-subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-public-subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-private-subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-private-subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-igw"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-nat-eip-1"

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-nat-1"

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-nat-eip-2"

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-nat-2"

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-public-routes"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
          Value: !Sub "${ApplicationName}-private-routes-1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-private-routes-2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  # =============================================================================
  # S3 Buckets with Versioning and Access Logging (Requirement 8)
  # =============================================================================
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ApplicationName}-${EnvironmentSuffix}-bucket"
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref ApplicationLogBucket
        LogFilePrefix: "access-logs/"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-bucket"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ApplicationName}-${EnvironmentSuffix}-log-bucket"
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-log-bucket"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationLogBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${ApplicationLogBucket.Arn}"
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ApplicationName}-${EnvironmentSuffix}-trail"
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${ApplicationLogBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": bucket-owner-full-control
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ApplicationName}-${EnvironmentSuffix}-trail"
  # =============================================================================
  # CloudTrail Logging (Requirement 9)
  # =============================================================================
  ApplicationTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: ApplicationLogBucketPolicy
    Properties:
      TrailName: !Sub "${ApplicationName}-${EnvironmentSuffix}-trail"
      S3BucketName: !Ref ApplicationLogBucket
      IsLogging: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      IsMultiRegionTrail: true
      KMSKeyId: !Ref ApplicationKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-trail"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
  # =============================================================================
  # Secrets Manager for Database Password (Security Best Practice)
  # =============================================================================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${ApplicationName}-${EnvironmentSuffix}-db-password"
      Description: "Master password for the RDS database instance"
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref ApplicationKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-db-secret"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =============================================================================
  # RDS Multi-AZ Database (Requirement 10)
  # =============================================================================
  ApplicationDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub "${ApplicationName} DB subnet group"
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-dbsubnet"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${ApplicationName}-${EnvironmentSuffix}-db"
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: "8.0.35"
      MasterUsername: admin
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      DBSubnetGroupName: !Ref ApplicationDBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      PubliclyAccessible: false
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-db"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
  # =============================================================================
  # Lambda Function and Global Accelerator (Requirement 11)
  # =============================================================================
  ApplicationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${ApplicationName}-${EnvironmentSuffix}-lambda"
      Handler: index.handler
      Role: !GetAtt ApplicationRole.Arn
      Code:
        ZipFile: |
          def handler(event, context):
              return {"statusCode": 200, "body": "Hello from Lambda!"}
      Runtime: python3.11
      Timeout: 10
      VpcConfig:
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          ENV: !Ref EnvironmentSuffix
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-lambda"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationAccelerator:
    Type: AWS::GlobalAccelerator::Accelerator
    Properties:
      Name: !Sub "${ApplicationName}-${EnvironmentSuffix}-accelerator"
      Enabled: true
      IpAddressType: IPV4
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-accelerator"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
  # =============================================================================
  # CloudFront Distribution (Requirement 12)
  # =============================================================================
  ApplicationCloudFront:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        Origins:
          - Id: s3origin
            DomainName: !GetAtt ApplicationBucket.DomainName
            S3OriginConfig: {}
        DefaultCacheBehavior:
          TargetOriginId: s3origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD]
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        HttpVersion: http2
        PriceClass: PriceClass_100
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-cloudfront"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =============================================================================
  # Security Groups with Restricted Access (Requirement 9)
  # =============================================================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for Application Load Balancer"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: "HTTP access from internet"
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS access from internet"
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
          Description: "HTTP to web servers in VPC"
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-alb-sg"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for web servers"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: "HTTP from ALB"
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: "SSH from allowed CIDR"
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS outbound"
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/16
          Description: "MySQL to database in VPC"
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-web-sg"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for RDS database"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: "MySQL from web servers"
      Tags:
        - Key: Name
          Value: !Sub "${ApplicationName}-db-sg"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =============================================================================
  # DynamoDB Table for Application Data (Original requirement)
  # =============================================================================
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
      AttributeDefinitions:
        - AttributeName: "id"
          AttributeType: "S"
      KeySchema:
        - AttributeName: "id"
          KeyType: "HASH"
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref ApplicationKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  ApplicationRoleArn:
    Description: "ARN of the application IAM role"
    Value: !GetAtt ApplicationRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationRoleArn"

  ApplicationInstanceProfile:
    Description: "Name of the application instance profile"
    Value: !Ref ApplicationInstanceProfile
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationInstanceProfile"

  ApplicationBucketName:
    Description: "Name of the application S3 bucket"
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationBucketName"

  ApplicationLogBucketName:
    Description: "Name of the application S3 log bucket"
    Value: !Ref ApplicationLogBucket
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationLogBucketName"

  ApplicationTrailName:
    Description: "Name of the CloudTrail trail"
    Value: !Ref ApplicationTrail
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationTrailName"

  ApplicationDBEndpoint:
    Description: "Endpoint of the RDS instance"
    Value: !GetAtt ApplicationDB.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationDBEndpoint"

  DatabaseSecretArn:
    Description: "ARN of the database password secret in Secrets Manager"
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecretArn"

  ApplicationLambdaArn:
    Description: "ARN of the Lambda function"
    Value: !GetAtt ApplicationLambda.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationLambdaArn"

  ApplicationAcceleratorDns:
    Description: "DNS name of the Global Accelerator"
    Value: !GetAtt ApplicationAccelerator.DnsName
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationAcceleratorDns"

  ApplicationCloudFrontDomain:
    Description: "Domain name of the CloudFront distribution"
    Value: !GetAtt ApplicationCloudFront.DomainName
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationCloudFrontDomain"
  # VPC and Networking Outputs
  VPCId:
    Description: "ID of the VPC"
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnet1Id:
    Description: "ID of Public Subnet 1"
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet1Id"

  PublicSubnet2Id:
    Description: "ID of Public Subnet 2"
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet2Id"

  PrivateSubnet1Id:
    Description: "ID of Private Subnet 1"
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet1Id"

  PrivateSubnet2Id:
    Description: "ID of Private Subnet 2"
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet2Id"

  # Security Outputs
  ApplicationKMSKeyId:
    Description: "ID of the Application KMS Key"
    Value: !Ref ApplicationKMSKey
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationKMSKeyId"

  ApplicationKMSKeyArn:
    Description: "ARN of the Application KMS Key"
    Value: !GetAtt ApplicationKMSKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationKMSKeyArn"

  TurnAroundPromptTableName:
    Description: "Name of the DynamoDB table"
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableName"

  TurnAroundPromptTableArn:
    Description: "ARN of the DynamoDB table"
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableArn"

  ExistingGuardDutyDetectorId:
    Description: "ID of the existing GuardDuty Detector"
    Value: !Ref ExistingGuardDutyDetectorId
    Export:
      Name: !Sub "${AWS::StackName}-ExistingGuardDutyDetectorId"

  # Stack Information
  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"

```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
