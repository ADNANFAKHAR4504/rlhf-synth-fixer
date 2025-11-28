# ideal_response.md

## Objective

Design and deliver a single, production-ready CloudFormation template (`TapStack.yml`) that uses Python/Boto3-managed infrastructure requirements as guidance, but provisions a **net-new** AWS environment in `us-east-1`. The template must be self-contained with initialized parameters (defaults), conditions, resources, and outputs so it can be deployed non-interactively via CI/CD. All names must embed `ENVIRONMENT_SUFFIX` to avoid collisions. Security, encryption, logging, and least-privilege practices are mandatory.

## Functional scope (build everything new)

* Create a dedicated VPC with public and private subnets across two Availability Zones, Internet Gateway, NAT Gateway, and routing for north-south and east-west traffic.
* Provision security groups that allow only the required ingress paths:

  * Bastion: SSH from a controlled CIDR.
  * Application: HTTP from a configurable CIDR and SSH only from the bastion security group.
  * RDS: database port only from the application security group.
* Launch a bastion EC2 instance in a public subnet and an application EC2 instance in a private subnet, each with distinct IAM instance roles and SSM access.
* Create an S3 data bucket with versioning, lifecycle management, server-side encryption with KMS, access logging to a separate S3 logs bucket, and TLS-only enforcement.
* Create a Lambda function (Python runtime) that is:

  * Encrypted with KMS and granted least-privilege IAM.
  * Triggered by S3 object create events from the data bucket.
  * Integrated with API Gateway using a proxy integration.
* Create a DynamoDB table (primary key + sort key) with KMS encryption and Application Auto Scaling policies for read and write throughput.
* Create an RDS instance (Multi-AZ) encrypted with KMS, credentials sourced from Secrets Manager, isolated in private subnets, not publicly accessible.
* Create an SNS topic encrypted with KMS for notifications and optional email subscription.
* Create CloudWatch log groups encrypted with KMS (Lambda and API Gateway), plus example alarms for EC2 status checks and Lambda errors.
* Create CloudTrail with a dedicated, KMS-encrypted S3 bucket and a key policy and bucket policy aligned with CloudTrail’s SourceArn and encryption context requirements.
* Define all required IAM roles and inline policies with least privilege for EC2, Lambda, API Gateway logging, and Application Auto Scaling.

## Constraints and standards

* Region fixed to `us-east-1`.
* All data at rest encrypted using the template’s primary KMS CMK.
* All resources tagged with project and environment context.
* All parameters include safe defaults so the stack can deploy via pipelines without CLI prompts.
* Resource names include `ENVIRONMENT_SUFFIX`.
* Avoid hard-coded AllowedValues for the environment; prefer a safe regex pattern constraint.
* Enforce TLS for S3 access; block public access on buckets; keep RDS private; restrict SSH paths.

## Naming and parameters (resilient)

* `ProjectName` used as a short, lowercase slug, combined with `EnvironmentSuffix` for names and tags.
* `EnvironmentSuffix` must follow a safe lowercase, digits, hyphen regex; no fixed enumerations.
* Reasonable defaults for VPC and subnet CIDRs, instance types, RDS class and storage, DynamoDB min/max capacity, and email subscription (optional).

## Security, encryption, and IAM (least privilege)

* Single CMK with rotation enabled, key policy granting access to:

  * Account root admin.
  * CloudWatch Logs, Lambda, RDS, DynamoDB, SNS, Secrets Manager, S3 (as required), and CloudTrail.
* CloudTrail KMS permissions include context-bound access for the trail ARN with `GrantIsForAWSResource` and `ViaService`.
* S3 bucket policies enforce TLS and grant CloudTrail write permission with exact `aws:SourceArn` matching the trail ARN and `aws:SourceAccount` scoped to the account.
* IAM roles scoped to the minimum actions necessary for each service integration.

## Observability and auditing

* CloudWatch log groups per service, encrypted with KMS and with a sane retention period.
* API Gateway account logging role configured; access logs enabled at the stage.
* Example CloudWatch alarms for EC2 status checks and Lambda errors.
* CloudTrail enabled with log file validation, multi-service support, and KMS encryption.

## Cost and reliability considerations

* Use t-class instances by default.
* Single NAT Gateway to balance cost and egress needs.
* Provisioned DynamoDB with autoscaling targets to control throughput.
* Multi-AZ RDS for availability; disable public access; modest storage defaults.
* Optional email subscription to avoid unused SNS endpoints.

## Deliverable

A single file named `TapStack.yml` containing:

* Parameters with defaults and regex constraints.
* Conditions used to adapt behavior and validate region.
* All resources and their dependencies to build a new environment with no external references.
* Outputs for VPC, subnets, EC2 instance IDs, S3 buckets, Lambda name, API invoke URL, DynamoDB table, RDS endpoint and port, SNS topic ARN, KMS key ARN, and CloudTrail bucket.

## Acceptance and validation

* Lints cleanly with CloudFormation linters.
* Deploys cleanly in `us-east-1` without manual parameters.
* Creates the CloudTrail trail with proper KMS grants and bucket access (no “insufficient permissions” errors).
* Lambda triggers on S3 object create events and publishes to SNS.
* API Gateway integrates with Lambda and emits access logs.
* DynamoDB scaling targets and policies become active.
* RDS is Multi-AZ, encrypted, using credentials from Secrets Manager, and reachable only from the application security group.
* S3 lifecycle policies transition and expire noncurrent versions as configured.

## Non-goals

* No reuse of pre-existing resources.
* No cross-region deployments.
* No third-party constructs or macros outside native CloudFormation resources.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack - Full new build of a production-ready, KMS-encrypted, VPC-based environment in us-east-1
  with S3+Lifecycle, Lambda+S3 trigger+API Gateway, DynamoDB (auto-scaling), RDS Multi-AZ, SNS, CloudWatch
  metrics/alarms, CloudTrail auditing, bastion host, and IAM least-privilege. All names include ENVIRONMENT_SUFFIX.

# =============================================================================
# PARAMETERS (defaults provided so pipeline deploys without CLI inputs)
# =============================================================================
Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    Description: Project/system slug (lowercase, used in tags and names)
    AllowedPattern: '^[a-z][a-z0-9-]{2,30}$'
    ConstraintDescription: 3-31 chars, start with letter, lowercase letters/digits/hyphens.

  EnvironmentSuffix:
    Type: String
    Default: dev-us
    Description: Suffix appended to resource names to avoid collisions across environments
    AllowedPattern: '^[a-z0-9-]{2,20}$'
    ConstraintDescription: 2-20 chars, lowercase letters, digits, hyphens only.

  VpcCidr:
    Type: String
    Default: 10.20.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/(1[6-9]|2[0-8])$'

  PublicSubnetACidr:
    Type: String
    Default: 10.20.10.0/24
  PublicSubnetBCidr:
    Type: String
    Default: 10.20.11.0/24
  PrivateSubnetACidr:
    Type: String
    Default: 10.20.20.0/24
  PrivateSubnetBCidr:
    Type: String
    Default: 10.20.21.0/24

  BastionAllowedCidr:
    Type: String
    Default: 0.0.0.0/0
    Description: CIDR allowed to SSH to bastion (tighten in production)

  AppHttpAllowedCidr:
    Type: String
    Default: 0.0.0.0/0
    Description: CIDR allowed to reach application HTTP port 80

  BastionInstanceType:
    Type: String
    Default: t3.micro
  AppInstanceType:
    Type: String
    Default: t3.micro

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64

  RDSEngine:
    Type: String
    Default: postgres
    AllowedValues: [postgres, mysql]
  RDSVersion:
    Type: String
    Default: '16.11'  # Postgres version (ignored if mysql selected)
  RDSInstanceClass:
    Type: String
    Default: db.t3.micro
  RDSAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 16384

  DynamoReadMin:
    Type: Number
    Default: 1
  DynamoReadMax:
    Type: Number
    Default: 10
  DynamoWriteMin:
    Type: Number
    Default: 1
  DynamoWriteMax:
    Type: Number
    Default: 10

  EmailSubscription:
    Type: String
    Default: ''
    Description: Optional email for SNS subscription (leave blank to skip)
    AllowedPattern: '^$|^[^@]+@[^@]+\.[^@]+$'

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', us-east-1]
  HasEmailSubscription: !Not [!Equals [!Ref EmailSubscription, ""]]
  UsePostgres: !Equals [!Ref RDSEngine, postgres]

# =============================================================================
# RESOURCES
# =============================================================================
Resources:

  # ----------------------------
  # KMS: single CMK used across services (S3, DynamoDB, RDS, Logs, SNS, Secrets, CloudTrail)
  # ----------------------------
  PrimaryKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Primary CMK for ${ProjectName}-${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # 1) Full admin for the account root
          - Sid: AllowAccountRootAdmin
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

          # 2) CloudWatch Logs (for KMS-encrypted log groups)
          - Sid: AllowCloudWatchLogsUse
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
            Condition:
              ArnLike:
                kms:EncryptionContext:aws:logs:arn: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'

          # 3) Lambda (env var encryption / runtime use)
          - Sid: AllowLambdaUse
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 'lambda.${AWS::Region}.amazonaws.com'

          # 4) RDS storage encryption
          - Sid: AllowRDSUse
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
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 'rds.${AWS::Region}.amazonaws.com'

          # 5) DynamoDB SSE-KMS
          - Sid: AllowDynamoDBUse
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 'dynamodb.${AWS::Region}.amazonaws.com'

          # 6) SNS topic encryption
          - Sid: AllowSNSUse
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 'sns.${AWS::Region}.amazonaws.com'

          # 7) Secrets Manager encryption (DB credentials)
          - Sid: AllowSecretsManagerUse
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
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 'secretsmanager.${AWS::Region}.amazonaws.com'

          # 8) CloudTrail DescribeKey
          - Sid: AllowCloudTrailDescribeKey
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${EnvironmentSuffix}-trail'

          # 9) CloudTrail GenerateDataKey for encryption
          - Sid: AllowCloudTrailEncryptLogs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: kms:GenerateDataKey*
            Resource: '*'
            Condition:
              StringEquals:
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${EnvironmentSuffix}-trail'
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'

          # 10) CloudTrail Decrypt
          - Sid: AllowCloudTrailDecrypt
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: kms:Decrypt
            Resource: '*'

          # 11) S3 for SSE-KMS during log delivery
          - Sid: AllowS3ForCloudTrailSSEKMS
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:ViaService: !Sub 's3.${AWS::Region}.amazonaws.com'
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'

          # 12) Allow account principals to decrypt logs
          - Sid: AllowPrincipalsDecryptLogs
            Effect: Allow
            Principal:
              AWS: '*'
            Action: kms:Decrypt
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Sub '${AWS::AccountId}'
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'

      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-primary-kms'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrimaryKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${EnvironmentSuffix}-primary'
      TargetKeyId: !Ref PrimaryKmsKey

  # ----------------------------
  # NETWORKING (VPC, Subnets, IGW, NAT)
  # ----------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-a'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-b'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetACidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-a'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetBCidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-b'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
    DependsOn: VPCGatewayAttachment

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  NatEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-nat-eip'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-nat'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-rt'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTable

  # ----------------------------
  # SECURITY GROUPS
  # ----------------------------
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Bastion SSH
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref BastionAllowedCidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-bastion-sg'

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App HTTP + SSH (restricted)
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AppHttpAllowedCidr
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-app-sg'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS access from app
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [UsePostgres, 5432, 3306]
          ToPort: !If [UsePostgres, 5432, 3306]
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-sg'

  # ----------------------------
  # EC2: Bastion + Application instances
  # ----------------------------
  BastionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-bastion-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  BastionInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref BastionRole]
      InstanceProfileName: !Sub '${ProjectName}-${EnvironmentSuffix}-bastion-profile'

  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref BastionInstanceType
      ImageId: !Ref LatestAmiId
      IamInstanceProfile: !Ref BastionInstanceProfile
      SubnetId: !Ref PublicSubnetA
      SecurityGroupIds: [!Ref BastionSecurityGroup]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-bastion'

  AppRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-app-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-app-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: Logs
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                Resource: '*'
              - Sid: S3Limited
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::${ProjectName}-${EnvironmentSuffix}-data/*'
              - Sid: KMSUse
                Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt PrimaryKmsKey.Arn
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref AppRole]
      InstanceProfileName: !Sub '${ProjectName}-${EnvironmentSuffix}-app-profile'

  ApplicationInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref AppInstanceType
      ImageId: !Ref LatestAmiId
      IamInstanceProfile: !Ref AppInstanceProfile
      SubnetId: !Ref PrivateSubnetA
      SecurityGroupIds: [!Ref ApplicationSecurityGroup]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-app'

  # ----------------------------
  # S3: Data bucket + access logging bucket + lifecycle + policy + notifications
  # ----------------------------
  S3BucketLogging:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref PrimaryKmsKey
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerPreferred }]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-logs'

  S3Bucket:
    Type: AWS::S3::Bucket
    DependsOn:
      - LambdaPermissionForS3
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-data'
      VersioningConfiguration: { Status: Enabled }
      LoggingConfiguration:
        DestinationBucketName: !Ref S3BucketLogging
        LogFilePrefix: !Sub 's3/${ProjectName}-${EnvironmentSuffix}/'
      LifecycleConfiguration:
        Rules:
          - Id: TransitionOldVersions
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 90
            NoncurrentVersionExpirationInDays: 365
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref PrimaryKmsKey
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerPreferred }]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt LambdaFunction.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-data'

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${S3Bucket}'
              - !Sub 'arn:aws:s3:::${S3Bucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  # ----------------------------
  # LAMBDA (inline) + S3 event + API Gateway
  # ----------------------------
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-s3-handler'
      RetentionInDays: 30
      KmsKeyId: !GetAtt PrimaryKmsKey.Arn

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: Logs
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-${EnvironmentSuffix}-s3-handler:*'
              - Sid: S3Access
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-${EnvironmentSuffix}-data/*'
              - Sid: KMSUse
                Effect: Allow
                Action: [kms:Encrypt, kms:Decrypt, kms:GenerateDataKey]
                Resource: !GetAtt PrimaryKmsKey.Arn
              - Sid: PublishSNS
                Effect: Allow
                Action: sns:Publish
                Resource: !Ref NotificationsTopic
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-s3-handler'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      Environment:
        Variables:
          TOPIC_ARN: !Ref NotificationsTopic
      KmsKeyArn: !GetAtt PrimaryKmsKey.Arn
      Code:
        ZipFile: |
          import json, os, boto3
          sns = boto3.client('sns')
          def handler(event, context):
              msg = json.dumps(event)
              sns.publish(TopicArn=os.environ['TOPIC_ARN'], Message=msg, Subject='S3 Event')
              return {'statusCode': 200, 'body': 'ok'}

  LambdaPermissionForS3:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref LambdaFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub 'arn:aws:s3:::${ProjectName}-${EnvironmentSuffix}-data'

  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigw/${ProjectName}-${EnvironmentSuffix}-api'
      RetentionInDays: 30
      KmsKeyId: !GetAtt PrimaryKmsKey.Arn

  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      EndpointConfiguration: { Types: [REGIONAL] }

  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
      PathPart: status

  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${funArn}/invocations'
          - { funArn: !GetAtt LambdaFunction.Arn }

  LambdaPermissionForApi:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref LambdaFunction
      Principal: apigateway.amazonaws.com

  ApiGatewayCWRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCWRole.Arn

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      Description: Initial deployment
    DependsOn: ApiGatewayMethod

  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: v1
      RestApiId: !Ref ApiGatewayRestApi
      DeploymentId: !Ref ApiGatewayDeployment
      MethodSettings:
        - HttpMethod: "*"
          ResourcePath: "/*"
          MetricsEnabled: true
          DataTraceEnabled: true
          LoggingLevel: INFO
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status"}'

  # ----------------------------
  # DYNAMODB + APPLICATION AUTO SCALING
  # ----------------------------
  DynamoTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${EnvironmentSuffix}-items'
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoReadMin
        WriteCapacityUnits: !Ref DynamoWriteMin
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref PrimaryKmsKey
        SSEType: KMS
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-items'

  AppScalingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-appscaling-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: application-autoscaling.amazonaws.com }
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: dynamo-autoscaling
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeTable
                  - dynamodb:UpdateTable
                  - cloudwatch:PutMetricAlarm
                  - cloudwatch:DeleteAlarms
                  - cloudwatch:DescribeAlarms
                Resource: '*'

  DynamoReadScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: !Ref DynamoReadMax
      MinCapacity: !Ref DynamoReadMin
      ResourceId: !Sub 'table/${ProjectName}-${EnvironmentSuffix}-items'
      RoleARN: !GetAtt AppScalingRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  DynamoReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-dynamo-read-policy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization

  DynamoWriteScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: !Ref DynamoWriteMax
      MinCapacity: !Ref DynamoWriteMin
      ResourceId: !Sub 'table/${ProjectName}-${EnvironmentSuffix}-items'
      RoleARN: !GetAtt AppScalingRole.Arn
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  DynamoWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-dynamo-write-policy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization

  # ----------------------------
  # RDS (Multi-AZ) + Secrets Manager
  # ----------------------------
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub '${ProjectName}-${EnvironmentSuffix} DB subnets'
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      DBSubnetGroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-dbsubnets'

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-db-secret'
      Description: DB master credentials
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${ProjectName}_admin"}'
        GenerateStringKey: password
        ExcludeCharacters: "\"@/\\'"
        PasswordLength: 20
        ExcludePunctuation: true
      KmsKeyId: !Ref PrimaryKmsKey

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentSuffix}-rds'
      Engine: !Ref RDSEngine
      EngineVersion: !If [UsePostgres, !Ref RDSVersion, '8.0.35']
      DBInstanceClass: !Ref RDSInstanceClass
      AllocatedStorage: !Ref RDSAllocatedStorage
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref PrimaryKmsKey
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      VPCSecurityGroups: [!Ref RDSSecurityGroup]
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      DeletionProtection: false
      BackupRetentionPeriod: 7

  # ----------------------------
  # SNS (encrypted)
  # ----------------------------
  NotificationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-notifications'
      KmsMasterKeyId: !Ref PrimaryKmsKey

  NotificationsSubscriptionEmail:
    Type: AWS::SNS::Subscription
    Condition: HasEmailSubscription
    Properties:
      TopicArn: !Ref NotificationsTopic
      Protocol: email
      Endpoint: !Ref EmailSubscription

  # ----------------------------
  # CLOUDWATCH ALARMS (examples)
  # ----------------------------
  AlarmEC2StatusCheck:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-statuscheck'
      MetricName: StatusCheckFailed
      Namespace: AWS/EC2
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ApplicationInstance
      AlarmActions: [!Ref NotificationsTopic]

  AlarmLambdaErrors:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-errors'
      Namespace: AWS/Lambda
      MetricName: Errors
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref NotificationsTopic]

  # ----------------------------
  # CLOUDTRAIL (auditing) -> logs to S3 (encrypted)
  # ----------------------------
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-cloudtrail-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref PrimaryKmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerPreferred }]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-cloudtrail-logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${EnvironmentSuffix}-trail'

  Trail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${EnvironmentSuffix}-trail'
      S3BucketName: !Ref CloudTrailBucket
      IsMultiRegionTrail: false
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      IsLogging: true
      KMSKeyId: !Ref PrimaryKmsKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-trail'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  RegionAssert:
    Description: Template is intended for us-east-1 (informational)
    Value: !If [IsUSEast1, 'OK: us-east-1', !Sub 'Deployed in ${AWS::Region}']

  VpcId:
    Value: !Ref VPC
  PublicSubnetAId:
    Value: !Ref PublicSubnetA
  PublicSubnetBId:
    Value: !Ref PublicSubnetB
  PrivateSubnetAId:
    Value: !Ref PrivateSubnetA
  PrivateSubnetBId:
    Value: !Ref PrivateSubnetB

  BastionInstanceId:
    Value: !Ref BastionInstance
  AppInstanceId:
    Value: !Ref ApplicationInstance

  DataBucketName:
    Value: !Ref S3Bucket
  LogsBucketName:
    Value: !Ref S3BucketLogging

  LambdaName:
    Value: !Ref LambdaFunction
  ApiInvokeUrl:
    Value: !Sub 'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiGatewayStage}'

  DynamoTableName:
    Value: !Ref DynamoTable

  RDSEndpoint:
    Value: !GetAtt RDSInstance.Endpoint.Address
  RDSPort:
    Value: !GetAtt RDSInstance.Endpoint.Port

  SnsTopicArn:
    Value: !Ref NotificationsTopic

  KmsKeyArn:
    Value: !GetAtt PrimaryKmsKey.Arn

  CloudTrailBucketOut:
    Value: !Ref CloudTrailBucket
```