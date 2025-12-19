Ideal Response for TapStack.yml CloudFormation Template
The ideal response is a complete, valid AWS CloudFormation template in YAML format, named TapStack.yml, that fully satisfies the requirements for a secure, compliant FinTech application infrastructure across multiple AWS accounts and regions. Below is a detailed description of the expected behavior and content of the template.
Expected Behavior and Requirements

Template Structure:

The template must be in YAML format, adhering to the 2010-09-09 AWSTemplateFormatVersion.
It must include sections for Parameters, Mappings, Conditions, Resources, and Outputs for modularity and reusability.
Parameters must include customizable inputs like EnvironmentName (e.g., Production, Staging, Development), CostCenter, and VPC/subnet CIDR blocks with defaults and constraints (e.g., AllowedValues for Environment).
All resources must be created anew without referencing existing resources, ensuring a standalone stack.


VPC and Networking:

Creates a new VPC with a specified CIDR (e.g., 10.0.0.0/16) and public/private subnets across at least two availability zones.
Configures an Internet Gateway and public route table for internet access in public subnets.
Enables VPC Flow Logs to CloudWatch Logs to monitor IP traffic, with an IAM role for logging permissions.
Security groups restrict ingress/egress to only ports 80 (HTTP) and 443 (HTTPS) for public-facing resources (e.g., ALB) and necessary ports (e.g., 5432 for RDS) within the VPC CIDR.


S3 Buckets:

Creates at least two S3 buckets: one for application data and one for CloudTrail logs.
Buckets are private by default with PublicAccessBlockConfiguration to block all public access.
Versioning is enabled on all buckets.
Server-side encryption is enabled using AWS-managed keys (SSE-S3 or KMS).
Lifecycle policies transition non-current versions to Glacier after 30 days and delete after 365 days.


DynamoDB:

Creates a DynamoDB table with encryption at rest using AWS-managed KMS keys.
Uses on-demand billing mode for scalability.
Includes a simple key schema (e.g., partition key Id).


RDS:

Deploys a PostgreSQL RDS instance in a private subnet with Multi-AZ for high availability.
Enables encryption at rest with AWS-managed KMS keys.
Uses a DB subnet group and a security group allowing access only from within the VPC (port 5432).
References a Secrets Manager secret for the master password.


IAM:

Creates IAM users (e.g., fintech-admin) with least-privilege managed policies for accessing S3, DynamoDB, and RDS resources.
Enforces MFA on all IAM users via a virtual MFA device.
Includes roles for Lambda and VPC Flow Logs with minimal permissions.


CloudTrail:

Configures a multi-region CloudTrail trail, storing logs in the secure S3 bucket.
Enables log file validation and encryption.


Automation and Remediation:

Includes a Lambda function to remediate non-compliant configurations (e.g., enforcing S3 bucket privacy).
Lambda is triggered by a CloudWatch Events rule (e.g., daily schedule).
Includes an IAM role for Lambda with permissions for S3 and CloudWatch Logs.


Tagging:

All resources are tagged with Environment (e.g., Production) and CostCenter (e.g., Finance) for cost allocation and troubleshooting.


Outputs:

Exports key resource identifiers (e.g., VPC ID, S3 bucket names, RDS endpoint, Lambda ARN) for validation and cross-stack references.


Security and Compliance:

All data at rest (S3, DynamoDB, RDS) is encrypted.
Data in transit uses TLS (e.g., HTTPS for ALB, secure RDS connections).
Security groups follow least-privilege principles, with no open ports except 80/443 for public access.
The template passes AWS Config compliance checks and can be deployed without errors.



Validation Criteria

The template deploys successfully in AWS CloudFormation without errors.
All resources are created within the specified VPC and adhere to security constraints.
Compliance tests verify:
S3 buckets are private, versioned, encrypted, with lifecycle policies.
DynamoDB and RDS have encryption enabled.
IAM users have MFA and least-privilege policies.
CloudTrail is multi-region and logs to a secure bucket.
VPC Flow Logs are enabled.
Security groups restrict traffic appropriately.
All resources are tagged correctly.
Lambda remediation function corrects non-compliant S3 bucket settings.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  AWS CloudFormation template for a secure, compliant FinTech application infrastructure
  with VPC, S3, DynamoDB, RDS, CloudTrail, Lambda for remediation, and strict IAM policies.

# Parameters for customizable inputs
Parameters:
  EnvironmentName:
    Type: String
    Description: Environment for the stack (e.g., production, staging, development)
    AllowedValues: [production, staging, development]
    Default: production
  CostCenter:
    Type: String
    Description: Cost center for tagging (e.g., finance, it)
    Default: finance
  VPCCidrBlock:
    Type: String
    Description: CIDR block for the VPC
    Default: 10.0.0.0/16
    AllowedPattern: ^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$
  PublicSubnet1Cidr:
    Type: String
    Description: CIDR block for public subnet 1
    Default: 10.0.1.0/24
  PublicSubnet2Cidr:
    Type: String
    Description: CIDR block for public subnet 2
    Default: 10.0.2.0/24
  PrivateSubnet1Cidr:
    Type: String
    Description: CIDR block for private subnet 1
    Default: 10.0.3.0/24
  PrivateSubnet2Cidr:
    Type: String
    Description: CIDR block for private subnet 2
    Default: 10.0.4.0/24

# Mappings for region-specific configurations
Mappings:
  RegionMap:
    us-east-1:
      AvailabilityZone1: us-east-1a
      AvailabilityZone2: us-east-1b
    us-west-2:
      AvailabilityZone1: us-west-2a
      AvailabilityZone2: us-west-2b

# Resources section
Resources:
  # VPC Configuration
  FinTechVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-fintech-vpc
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinTechVPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinTechVPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-subnet2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinTechVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone1]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinTechVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AvailabilityZone2]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-internet-gateway
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref FinTechVPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinTechVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-public-route-table
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  # NAT Gateway for Private Subnets
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway-eip
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-nat-gateway
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Table for Private Subnets
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinTechVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-route-table
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  # VPC Flow Logs
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
        - PolicyName: vpc-flow-logs-policy
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

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/vpc/${EnvironmentName}-flow-logs
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceId: !Ref FinTechVPC
      ResourceType: VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # KMS Key for Encryption
  FinTechKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for FinTech application encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action:
              - kms:*
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow Secrets Manager to use the key
            Effect: Allow
            Principal:
              Service: secretsmanager.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  FinTechKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/${EnvironmentName}-fintech-key
      TargetKeyId: !Ref FinTechKMSKey

  # Secrets Manager for RDS Credentials
  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${EnvironmentName}-fintech-rds-credentials
      Description: RDS credentials for FinTech application
      GenerateSecretString:
        SecretStringTemplate: '{"username": "fintechadmin"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref FinTechKMSKey
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Buckets
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-fintech-data-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref FinTechKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: GlacierTransitionRule
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: 30
            NoncurrentVersionExpiration:
              NoncurrentDays: 365
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  DataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !GetAtt DataBucket.Arn
              - !Sub ${DataBucket.Arn}/*
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-fintech-logs-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref FinTechKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !GetAtt LogBucket.Arn
              - !Sub ${LogBucket.Arn}/*
            Condition:
              Bool:
                aws:SecureTransport: 'false'
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub ${LogBucket.Arn}/AWSLogs/${AWS::AccountId}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - s3:GetBucketAcl
            Resource: !GetAtt LogBucket.Arn

  # DynamoDB Table
  FinTechTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-fintech-table
      AttributeDefinitions:
        - AttributeName: Id
          AttributeType: S
      KeySchema:
        - AttributeName: Id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref FinTechKMSKey
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS Instance
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS instance
      VpcId: !Ref FinTechVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VPCCidrBlock
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-rds-security-group
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-fintech-db
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15.8'
      MasterUsername: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}'
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref FinTechKMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # IAM Roles and Policies
  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-admin-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: 'true'
      Policies:
        - PolicyName: admin-access-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:*
                  - dynamodb:*
                  - rds:*
                  - lambda:*
                  - kms:*
                  - cloudtrail:*
                  - logs:*
                  - ec2:Describe*
                  - secretsmanager:*
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  DeveloperRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-developer-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: 'true'
      Policies:
        - PolicyName: developer-access-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt DataBucket.Arn
                  - !Sub ${DataBucket.Arn}/*
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt FinTechTable.Arn
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                Resource: '*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref RDSSecret
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudTrail Configuration
  CloudTrailRole:
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
        - PolicyName: cloudtrail-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource: !Sub ${LogBucket.Arn}/AWSLogs/${AWS::AccountId}/*
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/cloudtrail/${EnvironmentName}-fintech-trail
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - LogBucketPolicy
    Properties:
      TrailName: !Sub ${EnvironmentName}-fintech-trail
      S3BucketName: !Ref LogBucket
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      IsLogging: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Lambda for Remediation
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
      Policies:
        - PolicyName: lambda-remediation-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutBucketPublicAccessBlock
                  - s3:GetBucketPublicAccessBlock
                  - s3:GetBucketAcl
                  - s3:GetBucketPolicy
                  - s3:PutBucketPolicy
                Resource: !GetAtt DataBucket.Arn
              - Effect: Allow
                Action:
                  - tag:GetResources
                  - tag:TagResources
                  - tag:UntagResources
                Resource: '*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt FinTechKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  RemediationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-remediation-lambda
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: !Sub |
          import json
          import boto3
          import cfnresponse

          def handler(event, context):
              s3 = boto3.client('s3')
              responseData = {}
              try:
                  # Enforce S3 bucket public access block
                  s3.put_bucket_public_access_block(
                      Bucket='${DataBucket}',
                      PublicAccessBlockConfiguration={
                          'BlockPublicAcls': True,
                          'IgnorePublicAcls': True,
                          'BlockPublicPolicy': True,
                          'RestrictPublicBuckets': True
                      }
                  )
                  responseData['Status'] = 'SUCCESS'
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData)
              except Exception as e:
                  responseData['Error'] = str(e)
                  cfnresponse.send(event, context, cfnresponse.FAILED, responseData)
      Runtime: python3.9
      Timeout: 60
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Application Load Balancer
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref FinTechVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-alb-security-group
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-fintech-alb
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing
      Type: application
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter

# Outputs for key resource references
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref FinTechVPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCId
  DataBucketName:
    Description: S3 Data Bucket Name
    Value: !Ref DataBucket
    Export:
      Name: !Sub ${EnvironmentName}-DataBucketName
  LogBucketName:
    Description: S3 Log Bucket Name
    Value: !Ref LogBucket
    Export:
      Name: !Sub ${EnvironmentName}-LogBucketName
  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref FinTechTable
    Export:
      Name: !Sub ${EnvironmentName}-DynamoDBTableName
  RDSEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-RDSEndpoint
  RDSSecretArn:
    Description: Secrets Manager Secret ARN for RDS
    Value: !Ref RDSSecret
    Export:
      Name: !Sub ${EnvironmentName}-RDSSecretArn
  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt RemediationLambda.Arn
    Export:
      Name: !Sub ${EnvironmentName}-LambdaFunctionArn
  ALBArn:
    Description: Application Load Balancer ARN
    Value: !GetAtt ApplicationLoadBalancer.LoadBalancerArn
    Export:
      Name: !Sub ${EnvironmentName}-ALBArn
```
