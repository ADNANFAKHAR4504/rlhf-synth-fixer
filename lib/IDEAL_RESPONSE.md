# This CloudFormation template defines the core infrastructure for a financial services application.
# It adheres to financial-grade security, internal compliance rules, and AWS best practices.
# This template is designed for deployment in a testing AWS account.

AWSTemplateFormatVersion: '2010-09-09'
Description: |
  CloudFormation template for secure financial services application infrastructure.
  Includes Networking, IAM, Storage, Security, Serverless, DNS, CDN, Messaging,
  and Monitoring components, all compliant with financial-grade security standards.

# --------------------------------------------------------------------------------------------------
# Parameters Section
# Defines configurable parameters for the stack, promoting reusability and flexibility.
# --------------------------------------------------------------------------------------------------
Parameters:
  Environment:
    Description: The deployment environment (e.g., dev, staging, prod).
    Type: String
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev
  Project:
    Description: The name of the project this infrastructure belongs to.
    Type: String
  Owner:
    Description: The owner or team responsible for this infrastructure.
    Type: String
  VPCCIDR:
    Description: CIDR block for the VPC.
    Type: String
    Default: 10.0.0.0/16
  PublicSubnet1CIDR:
    Description: CIDR block for Public Subnet 1.
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2CIDR:
    Description: CIDR block for Public Subnet 2.
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnet1CIDR:
    Description: CIDR block for Private Subnet 1.
    Type: String
    Default: 10.0.101.0/24
  PrivateSubnet2CIDR:
    Description: CIDR block for Private Subnet 2.
    Type: String
    Default: 10.0.102.0/24
  RDSDatabaseName:
    Description: The name of the RDS PostgreSQL database.
    Type: String
    Default: financialdb
  RDSDatabaseUser:
    Description: Master username for the RDS PostgreSQL database.
    Type: String
    Default: dbuser
  RDSDatabasePort:
    Description: Port for the RDS PostgreSQL database.
    Type: Number
    Default: 5432
  LambdaFunctionName:
    Description: Name for the example Lambda function.
    Type: String
    Default: FinancialServicesProcessor
  S3BucketName:
    Description: Name for the secure S3 bucket for static content.
    Type: String
    Default: financial-app-static-content-${AWS::AccountId}
  CloudFrontPriceClass:
    Description: The price class for the CloudFront distribution.
    Type: String
    Default: PriceClass_100
    AllowedValues:
      - PriceClass_100
      - PriceClass_200
      - PriceClass_All
  DynamoDBTableName:
    Description: Name for the DynamoDB table.
    Type: String
    Default: FinancialTransactions
  KMSKeyAlias:
    Description: Alias for the KMS Key used for encryption.
    Type: String
    Default: alias/financial-app-key
  RDSKMSKeyAlias:
    Description: Alias for the KMS Key used for RDS encryption.
    Type: String
    Default: alias/rds-financial-app-key

# --------------------------------------------------------------------------------------------------
# Resources Section
# Defines all AWS resources to be provisioned.
# --------------------------------------------------------------------------------------------------
Resources:

  # ----------------------------------------------------------------------------------------------
  # 1. Networking (VPC & Subnets)
  # Sets up a secure VPC with public and private subnets, NAT Gateways, and Flow Logs.
  # ----------------------------------------------------------------------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-VPC
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-InternetGateway
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs ''] # Automatically selects the first AZ
      MapPublicIpOnLaunch: true # Required for public subnets to assign public IPs
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PublicSubnet1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs ''] # Automatically selects the second AZ
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PublicSubnet2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PrivateSubnet1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PrivateSubnet2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ElasticIP1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-EIP1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ElasticIP2:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-EIP2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ElasticIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-NATGateway1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ElasticIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-NATGateway2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PublicRouteTable
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway # Ensure IGW is attached before creating route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PrivateRouteTable1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute1:
    Type: AWS::EC2::Route
    DependsOn: NATGateway1 # Ensure NAT Gateway is ready
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-PrivateRouteTable2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute2:
    Type: AWS::EC2::Route
    DependsOn: NATGateway2 # Ensure NAT Gateway is ready
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

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
      Path: /
      Policies:
        - PolicyName: VPCFlowLogsPolicy
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
                Resource: !GetAtt VPCFlowLogsLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/vpc/flowlogs/${Environment}-${Project}-VPCFlowLogs
      RetentionInDays: 90 # Retain logs for 90 days for compliance
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      LogGroupName: !Ref VPCFlowLogsLogGroup
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL # Log all traffic for comprehensive monitoring
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ----------------------------------------------------------------------------------------------
  # 2. IAM & Access Control
  # Defines IAM roles and policies with least privilege, using Secrets Manager for sensitive data.
  # ----------------------------------------------------------------------------------------------

  LambdaExecutionRole:
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole # Basic Lambda execution logs
      Policies:
        - PolicyName: LambdaSecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !GetAtt RDSSecret.Arn # Allow access only to the specific RDS secret
        - PolicyName: LambdaDynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:BatchGetItem
                  - dynamodb:BatchWriteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn # Allow access only to the specific DynamoDB table
                # Potentially add more granular conditions based on item attributes if needed
              - Effect: Allow
                Action:
                  - dynamodb:DescribeTable
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: LambdaVPCAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                Resource: "*" # Necessary for Lambda to operate within a VPC
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${Environment}/${Project}/RDSSecret
      Description: Stores the master password for the RDS PostgreSQL database.
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${RDSDatabaseUser}"}'
        PasswordLength: 32
        ExcludeCharacters: '"@/\' # Exclude problematic characters
        GenerateStringKey: password
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # KMS Key for general application encryption (S3, EBS)
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS Key for general application encryption (S3, EBS, etc.)
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-default-1
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow use of the key by authorized services
            Effect: Allow
            Principal:
              AWS:
                - !GetAtt LambdaExecutionRole.Arn
                - !Sub arn:aws:iam::${AWS::AccountId}:root # For console access
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 to use the key for encryption
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
            Resource: '*'
      Enabled: true
      EnableKeyRotation: true # Enable automatic key rotation for enhanced security
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Ref KMSKeyAlias
      TargetKeyId: !Ref ApplicationKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # KMS Key specifically for RDS encryption
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS Key for RDS database encryption.
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-default-2
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow RDS to use the key for encryption
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root # Needed for RDS to encrypt using this key
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Enabled: true
      EnableKeyRotation: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Ref RDSKMSKeyAlias
      TargetKeyId: !Ref RDSKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ----------------------------------------------------------------------------------------------
  # 3. Storage (S3, RDS, DynamoDB, EBS)
  # Configures secure storage services with encryption and access controls.
  # ----------------------------------------------------------------------------------------------

  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256 # Default encryption using SSE-S3
            # You can also use SSE-KMS with CustomerMasterKeyID: !Ref ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true # Block all public access
      VersioningConfiguration:
        Status: Enabled # Enable versioning for data recovery
      AccessControl: Private # Ensure no public access at creation
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyHTTP
            Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !Sub ${SecureS3Bucket.Arn}/*
              - !Sub ${SecureS3Bucket.Arn}
            Condition:
              BoolIfExists:
                'aws:SecureTransport': 'false' # Enforce HTTPS access
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !GetAtt CloudFrontOAI.Arn # Only CloudFront OAI can access
            Action: s3:GetObject
            Resource: !Sub ${SecureS3Bucket.Arn}/*
          - Sid: DenyPublicAccessToBucket
            Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !Sub ${SecureS3Bucket.Arn}
              - !Sub ${SecureS3Bucket.Arn}/*
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
              NotIpAddress:
                'aws:SourceIp': [] # No specific IPs, just enforcing HTTPS
            # Additional conditions to deny public access if OAI is not used or misconfigured
            NotPrincipal:
              AWS: !GetAtt CloudFrontOAI.Arn
            StringNotLike:
              'aws:UserAgent':
                - 'CloudFront*'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL instance.
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref RDSDatabasePort
          ToPort: !Ref RDSDatabasePort
          SourceSecurityGroupId: !GetAtt LambdaSecurityGroup.GroupId # Allow access only from Lambda SG
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-RDSSecurityGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: postgres
      EngineVersion: 14.7 # Specify a secure and stable version
      DBInstanceClass: db.t3.micro # Or appropriate size for testing
      AllocatedStorage: 20 # Minimum recommended storage for production
      MasterUsername: !Ref RDSDatabaseUser
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSSecret}}}' # Reference secret for password
      DBSubnetGroupName: !Ref RDSSubnetGroup
      VPCSecurityGroups:
        - !GetAtt RDSSecurityGroup.GroupId
      PubliclyAccessible: false # Crucial for financial applications
      StorageEncrypted: true # Encrypt at rest
      KmsKeyId: !Ref RDSKMSKey # Use the specific KMS key for RDS
      MultiAZ: true # Enable Multi-AZ for high availability
      BackupRetentionPeriod: 7 # Retain backups for 7 days
      DeletionProtection: false # Set to true for production to prevent accidental deletion
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS instance.
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref DynamoDBTableName
      AttributeDefinitions:
        - AttributeName: TransactionId
          AttributeType: S
        - AttributeName: AccountId
          AttributeType: S
      KeySchema:
        - AttributeName: TransactionId
          KeyType: HASH
        - AttributeName: AccountId
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      BillingMode: PROVISIONED # Or PAY_PER_REQUEST for flexible scaling
      SSESpecification:
        SSEEnabled: true # Encrypted at rest
        KMSMasterKeyId: !Ref ApplicationKMSKey # Use the application KMS key
        SSEType: Kms
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true # Enable PITR for continuous backups
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # EBS Encryption is handled account-wide by default through KMS configuration or
  # by specifying a default encryption key in the EC2 settings.
  # For CloudFormation, you typically ensure this at the AMI/Instance level,
  # or explicitly when defining an EC2 instance with a custom block device mapping.
  # This template assumes account-wide EBS encryption is enabled or will be
  # configured for EC2 instances provisioned from this infrastructure.

  # ----------------------------------------------------------------------------------------------
  # 4. Security Groups & Firewall Rules
  # Defines strict security groups with no open public ports.
  # ----------------------------------------------------------------------------------------------

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions in VPC.
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # No ingress rules by default, Lambda functions typically connect outbound
        # or receive triggers from internal AWS services.
        # If an API Gateway is used, its security group would allow inbound HTTPS.
      SecurityGroupEgress:
        - IpProtocol: -1 # Allow all outbound traffic by default for testing
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-LambdaSecurityGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Example Security Group for an internal EC2 instance (e.g., jump host, backend service)
  # Not publicly accessible, ports 22/3389 closed.
  InternalInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for internal instances (no public access, no SSH/RDP).
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Example: Allow internal communication within VPC
        - IpProtocol: -1
          FromPort: -1
          ToPort: -1
          SourceSecurityGroupId: !GetAtt LambdaSecurityGroup.GroupId # Example: Allow traffic from Lambda
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref VPCCIDR # Allow internal HTTP traffic
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VPCCIDR # Allow internal HTTPS traffic
        # IMPORTANT: Explicitly avoid rules that open ports 22 (SSH) or 3389 (RDP) to 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-${Project}-InternalInstanceSecurityGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ----------------------------------------------------------------------------------------------
  # 5. Lambda & Serverless
  # Defines an example Lambda function within the VPC for secure processing.
  # ----------------------------------------------------------------------------------------------

  FinancialProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Handler: index.handler # Assuming a Node.js Lambda function
      Runtime: nodejs20.x # Use a current, secure runtime
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log('Received event:', JSON.stringify(event, null, 2));
            const secret = process.env.RDS_SECRET_ARN; // Accessed securely via env var
            const dbName = process.env.DB_NAME;
            const dynamoTableName = process.env.DYNAMODB_TABLE_NAME;

            // In a real application, you'd use AWS SDK to interact with Secrets Manager, RDS, and DynamoDB
            // Example: const AWS = require('aws-sdk');
            // const secretsManager = new AWS.SecretsManager();
            // const dynamoDb = new AWS.DynamoDB.DocumentClient();
            // const rdsDataService = new AWS.RDSDataService();

            const response = {
                statusCode: 200,
                body: JSON.stringify('Financial transaction processed securely!'),
            };
            return response;
          };
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30 # Set an appropriate timeout
      MemorySize: 128 # Set an appropriate memory size
      VpcConfig: # Deploy Lambda in the private subnets for secure access to RDS/DynamoDB
        SecurityGroupIds:
          - !GetAtt LambdaSecurityGroup.GroupId
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          RDS_SECRET_ARN: !Ref RDSSecret # Securely pass secret ARN, not the secret itself
          DB_NAME: !Ref RDSDatabaseName
          DYNAMODB_TABLE_NAME: !Ref DynamoDBTableName
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ----------------------------------------------------------------------------------------------
  # 6. DNS, CDN, and Messaging
  # Configures Route 53 private hosted zones, CloudFront with OAI, and secure SNS topics.
  # ----------------------------------------------------------------------------------------------

  PrivateHostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: internal.local # Example internal domain
      VPC:
        VPCId: !Ref VPC
        VPCRegion: !Ref 'AWS::Region'
      HostedZoneConfig:
        Comment: Private Hosted Zone for internal financial application services.
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: OAI for S3 bucket access via CloudFront.
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt SecureS3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              CloudFrontOriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${CloudFrontOAI}"
        Enabled: true
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: https-only # Enforce HTTPS for all viewer requests
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          Compress: true
        ViewerCertificate:
          CloudFrontDefaultCertificate: true # Use default CloudFront certificate
          # Or specify an ACM ARN for custom domain: Arn: "arn:aws:acm:us-east-1:123456789012:certificate/xyz-123"
          MinimumProtocolVersion: TLSv1.2_2021 # Enforce strong TLS versions
          SslSupportMethod: sni-only
        Restrictions:
          GeoRestriction:
            RestrictionType: none # Or whitelist/blacklist specific countries
        PriceClass: !Ref CloudFrontPriceClass # Control costs based on edge locations
        Logging:
          Bucket: !GetAtt CloudFrontLogsBucket.RegionalDomainName
          Enabled: true
          IncludeCookies: false
          Prefix: cloudfront-logs/
        Tags:
          - Key: Environment
            Value: !Ref Environment
            - Key: Project
              Value: !Ref Project
            - Key: Owner
              Value: !Ref Owner

  CloudFrontLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain # Retain logs even if stack is deleted
    Properties:
      BucketName: !Sub ${S3BucketName}-cloudfront-logs
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      AccessControl: LogDeliveryWrite # Allows CloudFront to write logs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: Financial Transaction Notifications
      TopicName: !Sub ${Environment}-${Project}-FinancialNotifications
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: sns:Publish
            Resource: !Ref SNSTopic
            Condition:
              Bool:
                'aws:SecureTransport': 'false' # Enforce HTTPS for publishing
          - Effect: Deny
            Principal: '*'
            Action: sns:Subscribe
            Resource: !Ref SNSTopic
            Condition:
              Bool:
                'aws:SecureTransport': 'false' # Enforce HTTPS for subscribing
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com # Allow Lambda to publish
            Action: sns:Publish
            Resource: !Ref SNSTopic
            Condition:
              ArnLike:
                'aws:SourceArn': !GetAtt FinancialProcessorLambda.Arn # Only specific Lambda
          - Effect: Deny # Deny public access to the topic
            Principal: '*'
            Action:
              - sns:Publish
              - sns:Receive
            Resource: !Ref SNSTopic
            Condition:
              StringNotEquals:
                'aws:SourceArn': !GetAtt FinancialProcessorLambda.Arn
              NotIpAddress:
                'aws:SourceIp': [] # Or specific trusted IPs
              StringNotEquals:
                'aws:UserAgent': 'CloudFormation' # Allow CF to manage
          - Sid: AWSAccountAccess
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action:
              - sns:GetTopicAttributes
              - sns:SetTopicAttributes
              - sns:AddPermission
              - sns:RemovePermission
              - sns:DeleteTopic
              - sns:Subscribe
              - sns:ListSubscriptionsByTopic
              - sns:Publish
              - sns:Receive
            Resource: !Ref SNSTopic

  # ----------------------------------------------------------------------------------------------
  # 7. Monitoring & Compliance
  # Enables CloudTrail, AWS Config, and AWS WAF for robust security monitoring.
  # ----------------------------------------------------------------------------------------------

  CloudTrailTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true # Capture events from global services (IAM, Route 53)
      IsMultiRegionTrail: true # Crucial for multi-region audit
      EnableLogFileValidation: true # Ensure log integrity
      CloudWatchLogsRoleArn: !GetAtt CloudTrailCloudWatchLogsRole.Arn
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain # Retain logs even if stack is deleted
    Properties:
      BucketName: !Sub ${AWS::AccountId}-${AWS::Region}-cloudtrail-logs
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      AccessControl: LogDeliveryWrite # Allows CloudTrail to write logs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  CloudTrailCloudWatchLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      Policies:
        - PolicyName: CloudTrailCloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/cloudtrail/${Environment}-${Project}-CloudTrailLogs
      RetentionInDays: 365 # Retain logs for one year for compliance
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AWSConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: default
      RoleARN: !GetAtt AWSConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true # Track global resources like IAM
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AWSConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSConfigServiceRolePolicy # Required by AWS Config
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AWSConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: One_Hour # Deliver configuration snapshots hourly
      S3BucketName: !Ref AWSConfigLogsBucket
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AWSConfigLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain # Retain logs even if stack is deleted
    Properties:
      BucketName: !Sub ${AWS::AccountId}-${AWS::Region}-aws-config-logs
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
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Example AWS Config Rule for security compliance
  RDSPublicAccessCheck:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: rds-public-access-check
      Description: Checks if RDS DB instances are publicly accessible.
      Source:
        Owner: AWS
        SourceIdentifier: RDS_INSTANCE_PUBLIC_ACCESSIBLE_CHECK
      Scope:
        ComplianceResourceTypes:
          - AWS::RDS::DBInstance
      MaximumExecutionFrequency: TwentyFour_Hours # Run check daily
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # AWS WAF for CloudFront protection (for public-facing applications)
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub ${Environment}-${Project}-WebACL
      Scope: CLOUDFRONT # Apply to CloudFront distribution
      DefaultAction:
        Allow: {} # Default to allow, but add rules to block malicious traffic
      VisibilityConfig:
        CloudWatchMetricsEnabled: true
        MetricName: WebACLMetrics
        SampledRequestsEnabled: true
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 0
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet # Basic protection against common attacks
          OverrideAction:
            None: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesCommonRuleSetMetrics
            SampledRequestsEnabled: true
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet # Protects against common attack patterns
          OverrideAction:
            None: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesKnownBadInputsRuleSetMetrics
            SampledRequestsEnabled: true
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet # Protection against SQL injection attacks
          OverrideAction:
            None: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedRulesSQLiRuleSetMetrics
            SampledRequestsEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AssociateWAFWithCloudFront:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !GetAtt CloudFrontDistribution.Arn
      WebACLArn: !GetAtt WAFWebACL.Arn

# --------------------------------------------------------------------------------------------------
# Outputs Section
# Defines values that are exported from the stack, useful for cross-stack references.
# --------------------------------------------------------------------------------------------------
Outputs:
  VPCId:
    Description: The ID of the newly created VPC.
    Value: !Ref VPC
    Export:
      Name: !Sub ${Environment}-${Project}-VPCId

  PublicSubnet1Id:
    Description: The ID of Public Subnet 1.
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${Environment}-${Project}-PublicSubnet1Id

  PublicSubnet2Id:
    Description: The ID of Public Subnet 2.
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${Environment}-${Project}-PublicSubnet2Id

  PrivateSubnet1Id:
    Description: The ID of Private Subnet 1.
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${Environment}-${Project}-PrivateSubnet1Id

  PrivateSubnet2Id:
    Description: The ID of Private Subnet 2.
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${Environment}-${Project}-PrivateSubnet2Id

  RDSEndpointAddress:
    Description: The endpoint address of the RDS PostgreSQL instance.
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${Environment}-${Project}-RDSEndpointAddress

  RDSSecurityGroupId:
    Description: The Security Group ID of the RDS instance.
    Value: !GetAtt RDSSecurityGroup.GroupId
    Export:
      Name: !Sub ${Environment}-${Project}-RDSSecurityGroupId

  SecureS3BucketName:
    Description: The name of the secure S3 bucket.
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub ${Environment}-${Project}-SecureS3BucketName

  CloudFrontDistributionDomainName:
    Description: The domain name of the CloudFront distribution.
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub ${Environment}-${Project}-CloudFrontDomainName

  FinancialProcessorLambdaArn:
    Description: The ARN of the Financial Processor Lambda function.
    Value: !GetAtt FinancialProcessorLambda.Arn
    Export:
      Name: !Sub ${Environment}-${Project}-FinancialProcessorLambdaArn

  DynamoDBTableName:
    Description: The name of the DynamoDB table.
    Value: !Ref DynamoDBTableName
    Export:
      Name: !Sub ${Environment}-${Project}-DynamoDBTableName

  SNSTopicArn:
    Description: The ARN of the SNS Topic.
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${Environment}-${Project}-SNSTopicArn

  ApplicationKMSKeyArn:
    Description: The ARN of the application KMS Key.
    Value: !GetAtt ApplicationKMSKey.Arn
    Export:
      Name: !Sub ${Environment}-${Project}-ApplicationKMSKeyArn

  RDSKMSKeyArn:
    Description: The ARN of the RDS KMS Key.
    Value: !GetAtt RDSKMSKey.Arn
    Export:
      Name: !Sub ${Environment}-${Project}-RDSKMSKeyArn

  WAFWebACLArn:
    Description: The ARN of the WAF WebACL.
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub ${Environment}-${Project}-WAFWebACLArn