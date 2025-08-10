# Healthcare Infrastructure CloudFormation Template
* AWS CloudFormation template for HIPAA-compliant healthcare healthcare application infrastructure
* Deploys to us-west-2, with KMS encryption, Secrets Manager for secrets, tagging, and safe update policies

* Fully comply with the prompt, ensuring only supported CloudFormation resource properties are used to avoid deployment errors.

* Include KMS encryption on all S3 buckets with explicit bucket policies enforcing encryption and blocking unencrypted uploads.

* Store all secrets in Secrets Manager with appropriate access policies.

* Tag all resources uniformly with the required tags.

* Keep the VPC/subnet/networking resources minimal or parameterized unless explicitly required.

* Use UpdateReplacePolicy and DeletionPolicy to avoid resource replacement where specified.

* Provide clear comments explaining compliance decisions.

* Include output values for key resource identifiers.

* Maintain clarity, style, and formatting consistent with best practices.


```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  HIPAA-compliant healthcare application infrastructure.
  All S3 buckets encrypted with KMS.
  Sensitive credentials stored in Secrets Manager.
  Resources tagged with Project: HealthApp and Environment: Production.
  Supports update without replacing critical resources.

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC

  DatabaseInstanceClass:
    Type: String
    Default: db.t3.medium
    AllowedValues:
      - db.t3.medium
      - db.t3.large
      - db.r5.large
      - db.r5.xlarge
    Description: RDS instance class

  ApplicationName:
    Type: String
    Default: healthcare-app
    Description: Application name for resource naming

Resources:

  # KMS Key for encryption of buckets and secrets
  HealthcareKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for healthcare app encryption (HIPAA compliant)'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRootAndAdmins
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowS3AndSecretsManagerUse
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - secretsmanager.amazonaws.com
                - rds.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  HealthcareKMSAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ApplicationName}-kms-key'
      TargetKeyId: !Ref HealthcareKMSKey

  # Secrets Manager secrets for database credentials and API keys
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ApplicationName}/database/credentials'
      Description: 'Database credentials for healthcare application'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "healthapp_admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      KmsKeyId: !Ref HealthcareKMSKey
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  APISecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ApplicationName}/api/keys'
      Description: 'API keys for healthcare application'
      SecretString: '{"api_key": "placeholder", "jwt_secret": "placeholder"}'
      KmsKeyId: !Ref HealthcareKMSKey
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # VPC with minimal setup for networking
  HealthcareVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # Subnets (public and private) parameterized minimal for demo
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: us-west-2a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref HealthcareVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref HealthcareVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref HealthcareVPC
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  # S3 bucket with enforced KMS encryption and secure defaults
  HealthcareDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref HealthcareKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # RDS Subnet Group for private subnet(s)
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for healthcare database'
      SubnetIds:
        - !Ref PrivateSubnet1
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # Security Group for RDS, allowing only internal VPC access
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow database access only within VPC'
      VpcId: !Ref HealthcareVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VpcCidr
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

  # RDS instance with encryption and referencing Secrets Manager for credentials
  HealthcareDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ApplicationName}-db'
      DBInstanceClass: !Ref DatabaseInstanceClass
      Engine: postgres
      EngineVersion: '13.7'
      AllocatedStorage: 100
      StorageEncrypted: true
      KmsKeyId: !Ref HealthcareKMSKey
      MasterUsername: !Join ['', [ '{{resolve:secretsmanager:', !Ref DatabaseSecret, ':SecretString:username}}' ]]
      MasterUserPassword: !Join ['', [ '{{resolve:secretsmanager:', !Ref DatabaseSecret, ':SecretString:password}}' ]]
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      DeletionProtection: true
      Tags:
        - Key: Project
          Value: HealthApp
        - Key: Environment
          Value: Production

Outputs:
  HealthcareDataBucketName:
    Description: S3 Bucket name for healthcare data
    Value: !Ref HealthcareDataBucket

  HealthcareKMSKeyId:
    Description: KMS Key ID used for encryption
    Value: !Ref HealthcareKMSKey

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt HealthcareDatabase.Endpoint.Address

  DatabaseSecretArn:
    Description: ARN of the database secret
    Value: !Ref DatabaseSecret

  VPCId:
    Description: VPC ID
    Value: !Ref HealthcareVPC

