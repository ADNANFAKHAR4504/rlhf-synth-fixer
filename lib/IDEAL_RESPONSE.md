# ideal_response.md

# Objective

Deliver a single, production-ready CloudFormation template named **TapStack.yml** that provisions a brand-new, secure AWS environment in **us-west-2**. The template must be self-contained, fully parameterized with sensible defaults, extensively commented, and pass validation and lint checks without issues.

# Functional scope (build everything new):

* **Networking**

  * 1 VPC with DNS support/hostnames enabled
  * 2 public subnets and 2 private subnets across distinct AZs
  * Internet Gateway, 2 NAT Gateways (one per AZ), route tables and associations
* **Compute**

  * Bastion host in a public subnet with SSH restricted to a parameterized CIDR
  * Application EC2 instance in a private subnet, latest Amazon Linux (SSM AMI), IAM instance profile
  * Optional KeyPair use; default to SSM Session Manager if no key provided
* **Storage & Logging**

  * S3 **application** bucket with SSE-KMS, access logging to a dedicated **logs** bucket
  * S3 **logs** bucket with SSE-KMS, TLS-only enforcement and delivery permissions for CloudTrail and S3 server access logs
* **Database**

  * RDS instance (Multi-AZ, private subnets only, storage encrypted with KMS, deletion protection, 7-day backups)
  * Credentials managed with **AWS Secrets Manager** (dynamic reference for password)
* **Security**

  * Security groups: Bastion (SSH from AllowedSshCidr), App EC2 (SSH from Bastion), RDS (DB port from App SG, engine-aware port)
  * IAM roles/policies following least privilege (App EC2 read-only access to its S3 bucket, SSM core)
  * KMS CMKs dedicated for S3, RDS, CloudTrail, and CloudWatch Logs with appropriate service principals
* **Observability**

  * CloudTrail (management events) delivering to the logs bucket with log file validation and KMS encryption
  * CloudWatch alarms: EC2 CPU > 80%, EC2 status check failed, RDS CPU > 80% (SNS topic + optional email subscription)

# Constraints and best practices enforced

* Region fixed to **us-west-2**
* All taggable resources include `Environment=Production` and `Project=tapstack`
* S3 public access fully blocked; bucket policies enforce TLS
* EC2 uses latest Amazon Linux AMI via SSM public parameter
* Private subnets gain outbound access through NAT Gateways
* SSH restricted by `AllowedSshCidr`
* Secrets handled via **Secrets Manager** dynamic references (no plaintext parameters)
* Template passes `aws cloudformation validate-template` and is **cfn-lint clean**
* Single-file delivery with comments before each major block

# Parameters & defaults

* Networking: `VpcCidr`, per-subnet CIDRs (sensible non-overlapping defaults)
* Access control: `AllowedSshCidr` default to a placeholder documentation range
* EC2: `AppInstanceType`, `BastionInstanceType`, `KeyName` default empty (SSM enabled)
* RDS: `DbEngine` (postgres default), `DbEngineVersion`, `DbInstanceClass`, `DbName`, `DbUsername`
* Notifications: `AlarmEmail` optional (creates SNS subscription when provided)
* Metadata includes ParameterGroups and ParameterLabels to improve console UX

# Deliverable:

* **TapStack.yml** (single file) containing:

  * Template header, Description, and Metadata (Parameter groups/labels)
  * Fully defined Parameters with safe defaults
  * Conditions to handle optional email subscription and optional KeyPair
  * Dedicated KMS keys and aliases (S3, RDS, CloudTrail, CloudWatch Logs)
  * VPC, subnets, IGW, NATs, route tables and associations
  * S3 logs bucket and app bucket with encryption, logging, and strict policies
  * Security groups with explicit, minimal ingress rules
  * IAM roles, instance profiles, and least-privilege policies
  * Secrets Manager secret for DB password with generated value
  * CloudTrail trail writing to logs bucket with KMS
  * SNS topic and conditional email subscription
  * CloudWatch alarms for EC2 and RDS
  * Bastion EC2 (public) and App EC2 (private) using SSM AMI, optional KeyPair
  * RDS DBSubnetGroup and Multi-AZ DBInstance in private subnets
  * Comprehensive Outputs (IDs, ARNs, endpoints, bucket names, EIP, instance IDs)

# Validation & quality criteria

* Lints clean (no warnings/errors that violate organizational policy)
* Change set creation succeeds **without** requiring external parameter input
* Networking routes are correct; private subnets have NAT egress, no public exposure for DB or app EC2
* Bucket policies deny non-TLS and block public access
* Secrets never appear in plaintext
* All resources are new; no imports or references to pre-existing infrastructure
* Documentation comments clearly explain intent and verification steps

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Production-Ready Secure AWS Infrastructure in us-west-2'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - Environment
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr
          - AllowedSshCidr
      - Label:
          default: "EC2 Configuration"
        Parameters:
          - KeyName
          - AppInstanceType
          - BastionInstanceType
      - Label:
          default: "Database Configuration"
        Parameters:
          - DbEngine
          - DbEngineVersion
          - DbInstanceClass
          - DbName
          - DbUsername
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - AlarmEmail
    ParameterLabels:
      ProjectName: { default: "Project Name" }
      Environment: { default: "Environment" }
      VpcCidr: { default: "VPC CIDR Block" }
      PublicSubnet1Cidr: { default: "Public Subnet 1 CIDR Block" }
      PublicSubnet2Cidr: { default: "Public Subnet 2 CIDR Block" }
      PrivateSubnet1Cidr: { default: "Private Subnet 1 CIDR Block" }
      PrivateSubnet2Cidr: { default: "Private Subnet 2 CIDR Block" }
      AllowedSshCidr: { default: "Allowed SSH CIDR Block" }
      KeyName: { default: "EC2 Key Pair Name (optional)" }
      AppInstanceType: { default: "Application Instance Type" }
      BastionInstanceType: { default: "Bastion Host Instance Type" }
      DbEngine: { default: "Database Engine" }
      DbEngineVersion: { default: "Database Engine Version" }
      DbInstanceClass: { default: "Database Instance Class" }
      DbName: { default: "Database Name" }
      DbUsername: { default: "Database Username" }
      AlarmEmail: { default: "Alarm Notification Email" }

Parameters:
  ProjectName:
    Type: String
    Default: "tapstack"
    AllowedPattern: "^[a-z0-9-]+$"
    Description: "Lowercase project slug used in names and tags (must be lowercase to satisfy S3 naming rules)."

  Environment:
    Type: String
    Default: "Production"
    AllowedValues: ["Production","Staging","Development"]
    Description: "Environment type"

  VpcCidr:
    Type: String
    Default: "10.0.0.0/16"
    Description: "CIDR block for the VPC"

  PublicSubnet1Cidr:
    Type: String
    Default: "10.0.0.0/24"
    Description: "CIDR block for Public Subnet 1"

  PublicSubnet2Cidr:
    Type: String
    Default: "10.0.1.0/24"
    Description: "CIDR block for Public Subnet 2"

  PrivateSubnet1Cidr:
    Type: String
    Default: "10.0.10.0/24"
    Description: "CIDR block for Private Subnet 1"

  PrivateSubnet2Cidr:
    Type: String
    Default: "10.0.11.0/24"
    Description: "CIDR block for Private Subnet 2"

  AllowedSshCidr:
    Type: String
    Default: "203.0.113.0/24"
    Description: "CIDR block allowed for SSH access to the Bastion host"

  # Optional to avoid create-change-set failures; when empty, instances are created without a key pair (use SSM Session Manager).
  KeyName:
    Type: String
    Default: ""
    Description: "Existing EC2 KeyPair name to enable SSH access (leave empty to skip)."

  AppInstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type for the application instances"

  BastionInstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type for the Bastion host"

  DbEngine:
    Type: String
    Default: "postgres"
    AllowedValues: ["mysql","postgres","mariadb"]
    Description: "Database engine type"

  DbEngineVersion:
    Type: String
    Default: "16.3"
    Description: "Database engine version"

  DbInstanceClass:
    Type: String
    Default: "db.t3.micro"
    Description: "Database instance class"

  DbName:
    Type: String
    Default: "appdb"
    Description: "Database name"

  DbUsername:
    Type: String
    Default: "dbadmin"
    AllowedPattern: "^[A-Za-z0-9_]+$"
    MinLength: 1
    MaxLength: 16
    Description: "Database admin username (stored in secret too)."

  AlarmEmail:
    Type: String
    Description: "Email address to notify for CloudWatch Alarms (optional)"
    Default: ""

Conditions:
  CreateSNSSubscription: !Not [!Equals [!Ref AlarmEmail, ""]]
  IsPostgres: !Equals [!Ref DbEngine, "postgres"]
  HasKeyPair: !Not [!Equals [!Ref KeyName, ""]]

Resources:
  # ----------------------------
  # KMS Keys (least-privileged)
  # ----------------------------

  TapStackS3KMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'S3KeyPolicy'
        Statement:
          - Sid: 'AllowRootAdmin'
            Effect: 'Allow'
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'AllowS3UseOfKey'
            Effect: 'Allow'
            Principal: { Service: 's3.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackS3KMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-s3'
      TargetKeyId: !Ref TapStackS3KMSKey

  TapStackRDSKMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS key for RDS encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'RDSKeyPolicy'
        Statement:
          - Sid: 'AllowRootAdmin'
            Effect: 'Allow'
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'AllowRDSUseOfKey'
            Effect: 'Allow'
            Principal: { Service: 'rds.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackRDSKMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-rds'
      TargetKeyId: !Ref TapStackRDSKMSKey

  TapStackCloudTrailKMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS key for CloudTrail encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'CloudTrailKeyPolicy'
        Statement:
          - Sid: 'AllowRootAdmin'
            Effect: 'Allow'
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'AllowCloudTrailUseOfKey'
            Effect: 'Allow'
            Principal: { Service: 'cloudtrail.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackCloudTrailKMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-cloudtrail'
      TargetKeyId: !Ref TapStackCloudTrailKMSKey

  TapStackCloudWatchKMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS key for CloudWatch Logs encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'CloudWatchKeyPolicy'
        Statement:
          - Sid: 'AllowRootAdmin'
            Effect: 'Allow'
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'AllowLogsUseOfKey'
            Effect: 'Allow'
            Principal: { Service: 'logs.us-west-2.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackCloudWatchKMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-cloudwatch'
      TargetKeyId: !Ref TapStackCloudWatchKMSKey

  # ----------------------------
  # Networking (VPC / Subnets)
  # ----------------------------

  TapStackVPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-vpc' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-igw' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackInternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref TapStackVPC
      InternetGatewayId: !Ref TapStackInternetGateway

  TapStackPublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-az1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-az2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-az1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-az2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackEIP1:
    Type: 'AWS::EC2::EIP'
    DependsOn: TapStackInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-eip-nat1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackEIP2:
    Type: 'AWS::EC2::EIP'
    DependsOn: TapStackInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-eip-nat2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackNATGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt TapStackEIP1.AllocationId
      SubnetId: !Ref TapStackPublicSubnet1
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-az1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackNATGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt TapStackEIP2.AllocationId
      SubnetId: !Ref TapStackPublicSubnet2
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-az2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-rt-public' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-rt-private-az1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-rt-private-az2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: TapStackInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref TapStackPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref TapStackInternetGateway

  TapStackPrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref TapStackPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref TapStackNATGateway1

  TapStackPrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref TapStackPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref TapStackNATGateway2

  TapStackPublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref TapStackPublicSubnet1
      RouteTableId: !Ref TapStackPublicRouteTable

  TapStackPublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref TapStackPublicSubnet2
      RouteTableId: !Ref TapStackPublicRouteTable

  TapStackPrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref TapStackPrivateSubnet1
      RouteTableId: !Ref TapStackPrivateRouteTable1

  TapStackPrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref TapStackPrivateSubnet2
      RouteTableId: !Ref TapStackPrivateRouteTable2

  # ---------------------------------------------
  # S3 Buckets (App bucket + centralized logs)
  # ---------------------------------------------

  # Omit explicit BucketName to avoid naming regex/warnings; AWS will assign a compliant name.
  TapStackLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt TapStackS3KMSKey.Arn
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToStandardIA'
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-logs' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackLogsBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref TapStackLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyNonTLSAccess'
            Effect: 'Deny'
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${TapStackLogsBucket}'
              - !Sub 'arn:aws:s3:::${TapStackLogsBucket}/*'
            Condition:
              Bool: { 'aws:SecureTransport': false }
          - Sid: 'AWSCloudTrailWrite'
            Effect: 'Allow'
            Principal: { Service: 'cloudtrail.amazonaws.com' }
            Action: ['s3:PutObject']
            Resource: !Sub 'arn:aws:s3:::${TapStackLogsBucket}/cloudtrail/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' }
          - Sid: 'AWSCloudTrailGetAcl'
            Effect: 'Allow'
            Principal: { Service: 'cloudtrail.amazonaws.com' }
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${TapStackLogsBucket}'
          - Sid: 'S3ServerAccessLogsWrite'
            Effect: 'Allow'
            Principal: { Service: 'logging.s3.amazonaws.com' }
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${TapStackLogsBucket}/app-bucket-logs/*'
            Condition:
              StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' }
          - Sid: 'S3ServerAccessLogsAclRead'
            Effect: 'Allow'
            Principal: { Service: 'logging.s3.amazonaws.com' }
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${TapStackLogsBucket}'

  TapStackAppBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt TapStackS3KMSKey.Arn
      LoggingConfiguration:
        DestinationBucketName: !Ref TapStackLogsBucket
        LogFilePrefix: 'app-bucket-logs/'
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-app' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackAppBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref TapStackAppBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyNonTLSAccess'
            Effect: 'Deny'
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}'
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}/*'
            Condition:
              Bool: { 'aws:SecureTransport': false }
          - Sid: 'DenyNonAWSPrincipals'
            Effect: 'Deny'
            NotPrincipal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}'
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}/*'

  # ---------------------------------------------
  # Security Groups
  # ---------------------------------------------

  TapStackBastionSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Bastion host'
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 22, ToPort: 22, CidrIp: !Ref AllowedSshCidr }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-sg-bastion' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackAppSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Application instances'
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-sg-app' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackAppSecurityGroupIngressSSH:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref TapStackAppSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      SourceSecurityGroupId: !Ref TapStackBastionSecurityGroup

  TapStackRDSSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for RDS instance'
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-sg-rds' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackRDSSecurityGroupIngressDB:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref TapStackRDSSecurityGroup
      IpProtocol: tcp
      FromPort: !If [IsPostgres, 5432, 3306]
      ToPort: !If [IsPostgres, 5432, 3306]
      SourceSecurityGroupId: !Ref TapStackAppSecurityGroup

  # ---------------------------------------------
  # IAM Roles & Policies (least-privilege)
  # ---------------------------------------------

  TapStackAppEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal: { Service: 'ec2.amazonaws.com' }
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Path: '/'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackAppEC2Policy:
    Type: 'AWS::IAM::Policy'
    Properties:
      PolicyName: !Sub '${ProjectName}-app-ec2'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'S3ReadAppBucket'
            Effect: 'Allow'
            Action: ['s3:GetObject','s3:ListBucket']
            Resource:
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}'
              - !Sub 'arn:aws:s3:::${TapStackAppBucket}/*'
          - Sid: 'UseS3KmsKey'
            Effect: 'Allow'
            Action: ['kms:Decrypt','kms:GenerateDataKey']
            Resource: !GetAtt TapStackS3KMSKey.Arn
          - Sid: 'PutAppMetrics'
            Effect: 'Allow'
            Action: ['cloudwatch:PutMetricData','ec2:DescribeTags']
            Resource: '*'
      Roles: [ !Ref TapStackAppEC2Role ]

  TapStackAppInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Path: '/'
      Roles: [ !Ref TapStackAppEC2Role ]

  TapStackBastionEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal: { Service: 'ec2.amazonaws.com' }
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Path: '/'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackBastionInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Path: '/'
      Roles: [ !Ref TapStackBastionEC2Role ]

  # ---------------------------------------------
  # Secrets Manager (DB password via dynamic ref)
  # ---------------------------------------------

  TapStackDBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}/rds/master'
      Description: 'Master credentials for RDS (username + generated password)'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DbUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 20
        ExcludeCharacters: '"@/\''()[]{}:;,#$%&*+|<>?`~ '
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  # ---------------------------------------------
  # CloudTrail (management events to logs bucket)
  # ---------------------------------------------

  TapStackCloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn:
      - TapStackLogsBucketPolicy
      - TapStackCloudTrailKMSKeyAlias
    Properties:
      S3BucketName: !Ref TapStackLogsBucket
      S3KeyPrefix: 'cloudtrail/'
      IsLogging: true
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      KMSKeyId: !GetAtt TapStackCloudTrailKMSKey.Arn
      TrailName: 'TapStack-CloudTrail'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  # ---------------------------------------------
  # SNS (for CloudWatch Alarms)
  # ---------------------------------------------

  TapStackSNSTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      DisplayName: !Sub '${ProjectName} Alarms'
      TopicName: !Sub '${ProjectName}-alarms'
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackSNSSubscription:
    Type: 'AWS::SNS::Subscription'
    Condition: CreateSNSSubscription
    Properties:
      Protocol: email
      Endpoint: !Ref AlarmEmail
      TopicArn: !Ref TapStackSNSTopic

  # ---------------------------------------------
  # CloudWatch Alarms
  # ---------------------------------------------

  TapStackAppCPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmDescription: !Sub 'Alarm if CPU > 80% for 5 minutes on ${ProjectName} App Instance'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - { Name: InstanceId, Value: !Ref TapStackAppInstance }
      AlarmActions: [ !Ref TapStackSNSTopic ]
      InsufficientDataActions: [ !Ref TapStackSNSTopic ]
      OKActions: [ !Ref TapStackSNSTopic ]
      TreatMissingData: breaching

  TapStackAppStatusCheckAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmDescription: !Sub 'Alarm if status check fails for ${ProjectName} App Instance'
      MetricName: StatusCheckFailed
      Namespace: AWS/EC2
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - { Name: InstanceId, Value: !Ref TapStackAppInstance }
      AlarmActions: [ !Ref TapStackSNSTopic ]
      InsufficientDataActions: [ !Ref TapStackSNSTopic ]
      OKActions: [ !Ref TapStackSNSTopic ]
      TreatMissingData: breaching

  TapStackRDSCPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmDescription: !Sub 'Alarm if RDS CPU > 80% for 5 minutes on ${ProjectName} DB'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - { Name: DBInstanceIdentifier, Value: !Ref TapStackRDSInstance }
      AlarmActions: [ !Ref TapStackSNSTopic ]
      InsufficientDataActions: [ !Ref TapStackSNSTopic ]
      OKActions: [ !Ref TapStackSNSTopic ]
      TreatMissingData: breaching

  # ---------------------------------------------
  # EC2 Instances (Bastion & App)
  # ---------------------------------------------

  TapStackBastionEIP:
    Type: 'AWS::EC2::EIP'
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-eip-bastion' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackBastionHost:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: !Ref BastionInstanceType
      SecurityGroupIds: [ !Ref TapStackBastionSecurityGroup ]
      SubnetId: !Ref TapStackPublicSubnet1
      IamInstanceProfile: !Ref TapStackBastionInstanceProfile
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-bastion' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }
      # Conditionally attach KeyName only if provided to avoid parameter requirement
      KeyName: !If [ HasKeyPair, !Ref KeyName, !Ref "AWS::NoValue" ]

  TapStackBastionEIPAssociation:
    Type: 'AWS::EC2::EIPAssociation'
    Properties:
      AllocationId: !GetAtt TapStackBastionEIP.AllocationId
      InstanceId: !Ref TapStackBastionHost

  TapStackAppInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: !Ref AppInstanceType
      SecurityGroupIds: [ !Ref TapStackAppSecurityGroup ]
      SubnetId: !Ref TapStackPrivateSubnet1
      IamInstanceProfile: !Ref TapStackAppInstanceProfile
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Optional: fetch CloudWatch agent config from SSM if configured
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-app-ec2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }
      KeyName: !If [ HasKeyPair, !Ref KeyName, !Ref "AWS::NoValue" ]

  # ---------------------------------------------
  # RDS (Multi-AZ in private subnets, encrypted)
  # ---------------------------------------------

  TapStackDBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupDescription: !Sub '${ProjectName} database subnet group'
      SubnetIds:
        - !Ref TapStackPrivateSubnet1
        - !Ref TapStackPrivateSubnet2
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

  TapStackRDSInstance:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBName: !Ref DbName
      Engine: !Ref DbEngine
      EngineVersion: !Ref DbEngineVersion
      DBInstanceClass: !Ref DbInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !GetAtt TapStackRDSKMSKey.Arn
      MasterUsername: !Ref DbUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${TapStackDBSecret}::password}}'
      DBSubnetGroupName: !Ref TapStackDBSubnetGroup
      VPCSecurityGroups: [ !Ref TapStackRDSSecurityGroup ]
      MultiAZ: true
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      DeletionProtection: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-rds' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: Project, Value: !Ref ProjectName }

Outputs:
  # Networking
  VpcId:
    Description: 'The ID of the VPC'
    Value: !Ref TapStackVPC
  PublicSubnet1:
    Description: 'The ID of Public Subnet 1'
    Value: !Ref TapStackPublicSubnet1
  PublicSubnet2:
    Description: 'The ID of Public Subnet 2'
    Value: !Ref TapStackPublicSubnet2
  PrivateSubnet1:
    Description: 'The ID of Private Subnet 1'
    Value: !Ref TapStackPrivateSubnet1
  PrivateSubnet2:
    Description: 'The ID of Private Subnet 2'
    Value: !Ref TapStackPrivateSubnet2

  # Security Groups
  BastionSecurityGroupId:
    Description: 'The ID of the Bastion Security Group'
    Value: !Ref TapStackBastionSecurityGroup
  AppSecurityGroupId:
    Description: 'The ID of the Application Security Group'
    Value: !Ref TapStackAppSecurityGroup
  RDSSecurityGroupId:
    Description: 'The ID of the RDS Security Group'
    Value: !Ref TapStackRDSSecurityGroup

  # S3 & KMS
  AppBucketName:
    Description: 'Name of the Application S3 Bucket'
    Value: !Ref TapStackAppBucket
  LogsBucketName:
    Description: 'Name of the Logs S3 Bucket'
    Value: !Ref TapStackLogsBucket
  S3KMSKeyArn:
    Description: 'ARN of the S3 KMS Key'
    Value: !GetAtt TapStackS3KMSKey.Arn
  RDSKMSKeyArn:
    Description: 'ARN of the RDS KMS Key'
    Value: !GetAtt TapStackRDSKMSKey.Arn
  CloudTrailKMSKeyArn:
    Description: 'ARN of the CloudTrail KMS Key'
    Value: !GetAtt TapStackCloudTrailKMSKey.Arn
  CloudWatchKMSKeyArn:
    Description: 'ARN of the CloudWatch KMS Key'
    Value: !GetAtt TapStackCloudWatchKMSKey.Arn

  # RDS
  RDSEndpoint:
    Description: 'Endpoint of the RDS instance'
    Value: !GetAtt TapStackRDSInstance.Endpoint.Address
  RDSArn:
    Description: 'ARN of the RDS instance'
    Value: !GetAtt TapStackRDSInstance.DBInstanceArn

  # EC2 & Trail & SNS
  BastionEIP:
    Description: 'Elastic IP of the Bastion Host'
    Value: !Ref TapStackBastionEIP
  AppInstanceId:
    Description: 'Instance ID of the Application EC2'
    Value: !Ref TapStackAppInstance
  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt TapStackCloudTrail.Arn
  SNSTopicArn:
    Description: 'ARN of the SNS Topic for Alarms'
    Value: !Ref TapStackSNSTopic
```

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "TapStack - Production-Ready Secure AWS Infrastructure in us-west-2",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Project Configuration"
                    },
                    "Parameters": [
                        "ProjectName",
                        "Environment"
                    ]
                },
                {
                    "Label": {
                        "default": "Network Configuration"
                    },
                    "Parameters": [
                        "VpcCidr",
                        "PublicSubnet1Cidr",
                        "PublicSubnet2Cidr",
                        "PrivateSubnet1Cidr",
                        "PrivateSubnet2Cidr",
                        "AllowedSshCidr"
                    ]
                },
                {
                    "Label": {
                        "default": "EC2 Configuration"
                    },
                    "Parameters": [
                        "KeyName",
                        "AppInstanceType",
                        "BastionInstanceType"
                    ]
                },
                {
                    "Label": {
                        "default": "Database Configuration"
                    },
                    "Parameters": [
                        "DbEngine",
                        "DbEngineVersion",
                        "DbInstanceClass",
                        "DbName",
                        "DbUsername"
                    ]
                },
                {
                    "Label": {
                        "default": "Monitoring Configuration"
                    },
                    "Parameters": [
                        "AlarmEmail"
                    ]
                }
            ],
            "ParameterLabels": {
                "ProjectName": {
                    "default": "Project Name"
                },
                "Environment": {
                    "default": "Environment"
                },
                "VpcCidr": {
                    "default": "VPC CIDR Block"
                },
                "PublicSubnet1Cidr": {
                    "default": "Public Subnet 1 CIDR Block"
                },
                "PublicSubnet2Cidr": {
                    "default": "Public Subnet 2 CIDR Block"
                },
                "PrivateSubnet1Cidr": {
                    "default": "Private Subnet 1 CIDR Block"
                },
                "PrivateSubnet2Cidr": {
                    "default": "Private Subnet 2 CIDR Block"
                },
                "AllowedSshCidr": {
                    "default": "Allowed SSH CIDR Block"
                },
                "KeyName": {
                    "default": "EC2 Key Pair Name (optional)"
                },
                "AppInstanceType": {
                    "default": "Application Instance Type"
                },
                "BastionInstanceType": {
                    "default": "Bastion Host Instance Type"
                },
                "DbEngine": {
                    "default": "Database Engine"
                },
                "DbEngineVersion": {
                    "default": "Database Engine Version"
                },
                "DbInstanceClass": {
                    "default": "Database Instance Class"
                },
                "DbName": {
                    "default": "Database Name"
                },
                "DbUsername": {
                    "default": "Database Username"
                },
                "AlarmEmail": {
                    "default": "Alarm Notification Email"
                }
            }
        }
    },
    "Parameters": {
        "ProjectName": {
            "Type": "String",
            "Default": "tapstack",
            "AllowedPattern": "^[a-z0-9-]+$",
            "Description": "Lowercase project slug used in names and tags (must be lowercase to satisfy S3 naming rules)."
        },
        "Environment": {
            "Type": "String",
            "Default": "Production",
            "AllowedValues": [
                "Production",
                "Staging",
                "Development"
            ],
            "Description": "Environment type"
        },
        "VpcCidr": {
            "Type": "String",
            "Default": "10.0.0.0/16",
            "Description": "CIDR block for the VPC"
        },
        "PublicSubnet1Cidr": {
            "Type": "String",
            "Default": "10.0.0.0/24",
            "Description": "CIDR block for Public Subnet 1"
        },
        "PublicSubnet2Cidr": {
            "Type": "String",
            "Default": "10.0.1.0/24",
            "Description": "CIDR block for Public Subnet 2"
        },
        "PrivateSubnet1Cidr": {
            "Type": "String",
            "Default": "10.0.10.0/24",
            "Description": "CIDR block for Private Subnet 1"
        },
        "PrivateSubnet2Cidr": {
            "Type": "String",
            "Default": "10.0.11.0/24",
            "Description": "CIDR block for Private Subnet 2"
        },
        "AllowedSshCidr": {
            "Type": "String",
            "Default": "203.0.113.0/24",
            "Description": "CIDR block allowed for SSH access to the Bastion host"
        },
        "KeyName": {
            "Type": "String",
            "Default": "",
            "Description": "Existing EC2 KeyPair name to enable SSH access (leave empty to skip)."
        },
        "AppInstanceType": {
            "Type": "String",
            "Default": "t3.micro",
            "Description": "EC2 instance type for the application instances"
        },
        "BastionInstanceType": {
            "Type": "String",
            "Default": "t3.micro",
            "Description": "EC2 instance type for the Bastion host"
        },
        "DbEngine": {
            "Type": "String",
            "Default": "postgres",
            "AllowedValues": [
                "mysql",
                "postgres",
                "mariadb"
            ],
            "Description": "Database engine type"
        },
        "DbEngineVersion": {
            "Type": "String",
            "Default": "16.3",
            "Description": "Database engine version"
        },
        "DbInstanceClass": {
            "Type": "String",
            "Default": "db.t3.micro",
            "Description": "Database instance class"
        },
        "DbName": {
            "Type": "String",
            "Default": "appdb",
            "Description": "Database name"
        },
        "DbUsername": {
            "Type": "String",
            "Default": "dbadmin",
            "AllowedPattern": "^[A-Za-z0-9_]+$",
            "MinLength": 1,
            "MaxLength": 16,
            "Description": "Database admin username (stored in secret too)."
        },
        "AlarmEmail": {
            "Type": "String",
            "Description": "Email address to notify for CloudWatch Alarms (optional)",
            "Default": ""
        }
    },
    "Conditions": {
        "CreateSNSSubscription": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "AlarmEmail"
                        },
                        ""
                    ]
                }
            ]
        },
        "IsPostgres": {
            "Fn::Equals": [
                {
                    "Ref": "DbEngine"
                },
                "postgres"
            ]
        },
        "HasKeyPair": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "KeyName"
                        },
                        ""
                    ]
                }
            ]
        }
    },
    "Resources": {
        "TapStackS3KMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS key for S3 bucket encryption",
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Id": "S3KeyPolicy",
                    "Statement": [
                        {
                            "Sid": "AllowRootAdmin",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowS3UseOfKey",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "s3.amazonaws.com"
                            },
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackS3KMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${ProjectName}-s3"
                },
                "TargetKeyId": {
                    "Ref": "TapStackS3KMSKey"
                }
            }
        },
        "TapStackRDSKMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS key for RDS encryption",
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Id": "RDSKeyPolicy",
                    "Statement": [
                        {
                            "Sid": "AllowRootAdmin",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowRDSUseOfKey",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "rds.amazonaws.com"
                            },
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackRDSKMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${ProjectName}-rds"
                },
                "TargetKeyId": {
                    "Ref": "TapStackRDSKMSKey"
                }
            }
        },
        "TapStackCloudTrailKMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS key for CloudTrail encryption",
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Id": "CloudTrailKeyPolicy",
                    "Statement": [
                        {
                            "Sid": "AllowRootAdmin",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowCloudTrailUseOfKey",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackCloudTrailKMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${ProjectName}-cloudtrail"
                },
                "TargetKeyId": {
                    "Ref": "TapStackCloudTrailKMSKey"
                }
            }
        },
        "TapStackCloudWatchKMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS key for CloudWatch Logs encryption",
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Id": "CloudWatchKeyPolicy",
                    "Statement": [
                        {
                            "Sid": "AllowRootAdmin",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowLogsUseOfKey",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "logs.us-west-2.amazonaws.com"
                            },
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "ArnLike": {
                                    "kms:EncryptionContext:aws:logs:arn": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                                    }
                                }
                            }
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackCloudWatchKMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${ProjectName}-cloudwatch"
                },
                "TargetKeyId": {
                    "Ref": "TapStackCloudWatchKMSKey"
                }
            }
        },
        "TapStackVPC": {
            "Type": "AWS::EC2::VPC",
            "Properties": {
                "CidrBlock": {
                    "Ref": "VpcCidr"
                },
                "EnableDnsSupport": true,
                "EnableDnsHostnames": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-vpc"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackInternetGateway": {
            "Type": "AWS::EC2::InternetGateway",
            "Properties": {
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-igw"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackInternetGatewayAttachment": {
            "Type": "AWS::EC2::VPCGatewayAttachment",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "InternetGatewayId": {
                    "Ref": "TapStackInternetGateway"
                }
            }
        },
        "TapStackPublicSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "CidrBlock": {
                    "Ref": "PublicSubnet1Cidr"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": "us-west-2"
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-public-az1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPublicSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "CidrBlock": {
                    "Ref": "PublicSubnet2Cidr"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": "us-west-2"
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-public-az2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPrivateSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "CidrBlock": {
                    "Ref": "PrivateSubnet1Cidr"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": "us-west-2"
                        }
                    ]
                },
                "MapPublicIpOnLaunch": false,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-private-az1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPrivateSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "CidrBlock": {
                    "Ref": "PrivateSubnet2Cidr"
                },
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": "us-west-2"
                        }
                    ]
                },
                "MapPublicIpOnLaunch": false,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-private-az2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackEIP1": {
            "Type": "AWS::EC2::EIP",
            "DependsOn": "TapStackInternetGatewayAttachment",
            "Properties": {
                "Domain": "vpc",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-eip-nat1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackEIP2": {
            "Type": "AWS::EC2::EIP",
            "DependsOn": "TapStackInternetGatewayAttachment",
            "Properties": {
                "Domain": "vpc",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-eip-nat2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackNATGateway1": {
            "Type": "AWS::EC2::NatGateway",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "TapStackEIP1",
                        "AllocationId"
                    ]
                },
                "SubnetId": {
                    "Ref": "TapStackPublicSubnet1"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-nat-az1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackNATGateway2": {
            "Type": "AWS::EC2::NatGateway",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "TapStackEIP2",
                        "AllocationId"
                    ]
                },
                "SubnetId": {
                    "Ref": "TapStackPublicSubnet2"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-nat-az2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPublicRouteTable": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-rt-public"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPrivateRouteTable1": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-rt-private-az1"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPrivateRouteTable2": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-rt-private-az2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackPublicRoute": {
            "Type": "AWS::EC2::Route",
            "DependsOn": "TapStackInternetGatewayAttachment",
            "Properties": {
                "RouteTableId": {
                    "Ref": "TapStackPublicRouteTable"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "GatewayId": {
                    "Ref": "TapStackInternetGateway"
                }
            }
        },
        "TapStackPrivateRoute1": {
            "Type": "AWS::EC2::Route",
            "Properties": {
                "RouteTableId": {
                    "Ref": "TapStackPrivateRouteTable1"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "TapStackNATGateway1"
                }
            }
        },
        "TapStackPrivateRoute2": {
            "Type": "AWS::EC2::Route",
            "Properties": {
                "RouteTableId": {
                    "Ref": "TapStackPrivateRouteTable2"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "TapStackNATGateway2"
                }
            }
        },
        "TapStackPublicSubnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "TapStackPublicSubnet1"
                },
                "RouteTableId": {
                    "Ref": "TapStackPublicRouteTable"
                }
            }
        },
        "TapStackPublicSubnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "TapStackPublicSubnet2"
                },
                "RouteTableId": {
                    "Ref": "TapStackPublicRouteTable"
                }
            }
        },
        "TapStackPrivateSubnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "TapStackPrivateSubnet1"
                },
                "RouteTableId": {
                    "Ref": "TapStackPrivateRouteTable1"
                }
            }
        },
        "TapStackPrivateSubnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "TapStackPrivateSubnet2"
                },
                "RouteTableId": {
                    "Ref": "TapStackPrivateRouteTable2"
                }
            }
        },
        "TapStackLogsBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "BlockPublicPolicy": true,
                    "IgnorePublicAcls": true,
                    "RestrictPublicBuckets": true
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Fn::GetAtt": [
                                        "TapStackS3KMSKey",
                                        "Arn"
                                    ]
                                }
                            }
                        }
                    ]
                },
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "TransitionToStandardIA",
                            "Status": "Enabled",
                            "Transitions": [
                                {
                                    "TransitionInDays": 90,
                                    "StorageClass": "STANDARD_IA"
                                }
                            ]
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-logs"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackLogsBucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "TapStackLogsBucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyNonTLSAccess",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}/*"
                                }
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": false
                                }
                            }
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "s3:PutObject"
                            ],
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}/cloudtrail/AWSLogs/${AWS::AccountId}/*"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            }
                        },
                        {
                            "Sid": "AWSCloudTrailGetAcl",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "s3:GetBucketAcl",
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}"
                            }
                        },
                        {
                            "Sid": "S3ServerAccessLogsWrite",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "logging.s3.amazonaws.com"
                            },
                            "Action": "s3:PutObject",
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}/app-bucket-logs/*"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            }
                        },
                        {
                            "Sid": "S3ServerAccessLogsAclRead",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "logging.s3.amazonaws.com"
                            },
                            "Action": "s3:GetBucketAcl",
                            "Resource": {
                                "Fn::Sub": "arn:aws:s3:::${TapStackLogsBucket}"
                            }
                        }
                    ]
                }
            }
        },
        "TapStackAppBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "BlockPublicPolicy": true,
                    "IgnorePublicAcls": true,
                    "RestrictPublicBuckets": true
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Fn::GetAtt": [
                                        "TapStackS3KMSKey",
                                        "Arn"
                                    ]
                                }
                            }
                        }
                    ]
                },
                "LoggingConfiguration": {
                    "DestinationBucketName": {
                        "Ref": "TapStackLogsBucket"
                    },
                    "LogFilePrefix": "app-bucket-logs/"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-app"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackAppBucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "TapStackAppBucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyNonTLSAccess",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}/*"
                                }
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": false
                                }
                            }
                        },
                        {
                            "Sid": "DenyNonAWSPrincipals",
                            "Effect": "Deny",
                            "NotPrincipal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}/*"
                                }
                            ]
                        }
                    ]
                }
            }
        },
        "TapStackBastionSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "Security group for Bastion host",
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 22,
                        "ToPort": 22,
                        "CidrIp": {
                            "Ref": "AllowedSshCidr"
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-sg-bastion"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackAppSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "Security group for Application instances",
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-sg-app"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackAppSecurityGroupIngressSSH": {
            "Type": "AWS::EC2::SecurityGroupIngress",
            "Properties": {
                "GroupId": {
                    "Ref": "TapStackAppSecurityGroup"
                },
                "IpProtocol": "tcp",
                "FromPort": 22,
                "ToPort": 22,
                "SourceSecurityGroupId": {
                    "Ref": "TapStackBastionSecurityGroup"
                }
            }
        },
        "TapStackRDSSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "Security group for RDS instance",
                "VpcId": {
                    "Ref": "TapStackVPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-sg-rds"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackRDSSecurityGroupIngressDB": {
            "Type": "AWS::EC2::SecurityGroupIngress",
            "Properties": {
                "GroupId": {
                    "Ref": "TapStackRDSSecurityGroup"
                },
                "IpProtocol": "tcp",
                "FromPort": {
                    "Fn::If": [
                        "IsPostgres",
                        5432,
                        3306
                    ]
                },
                "ToPort": {
                    "Fn::If": [
                        "IsPostgres",
                        5432,
                        3306
                    ]
                },
                "SourceSecurityGroupId": {
                    "Ref": "TapStackAppSecurityGroup"
                }
            }
        },
        "TapStackAppEC2Role": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
                ],
                "Path": "/",
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackAppEC2Policy": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyName": {
                    "Fn::Sub": "${ProjectName}-app-ec2"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "S3ReadAppBucket",
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:ListBucket"
                            ],
                            "Resource": [
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}"
                                },
                                {
                                    "Fn::Sub": "arn:aws:s3:::${TapStackAppBucket}/*"
                                }
                            ]
                        },
                        {
                            "Sid": "UseS3KmsKey",
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": {
                                "Fn::GetAtt": [
                                    "TapStackS3KMSKey",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Sid": "PutAppMetrics",
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                                "ec2:DescribeTags"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Roles": [
                    {
                        "Ref": "TapStackAppEC2Role"
                    }
                ]
            }
        },
        "TapStackAppInstanceProfile": {
            "Type": "AWS::IAM::InstanceProfile",
            "Properties": {
                "Path": "/",
                "Roles": [
                    {
                        "Ref": "TapStackAppEC2Role"
                    }
                ]
            }
        },
        "TapStackBastionEC2Role": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
                ],
                "Path": "/",
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackBastionInstanceProfile": {
            "Type": "AWS::IAM::InstanceProfile",
            "Properties": {
                "Path": "/",
                "Roles": [
                    {
                        "Ref": "TapStackBastionEC2Role"
                    }
                ]
            }
        },
        "TapStackDBSecret": {
            "Type": "AWS::SecretsManager::Secret",
            "Properties": {
                "Name": {
                    "Fn::Sub": "${ProjectName}/rds/master"
                },
                "Description": "Master credentials for RDS (username + generated password)",
                "GenerateSecretString": {
                    "SecretStringTemplate": {
                        "Fn::Sub": "{\"username\":\"${DbUsername}\"}"
                    },
                    "GenerateStringKey": "password",
                    "PasswordLength": 20,
                    "ExcludeCharacters": "\"@/\\'()[]{}:;,#$%&*+|<>?`~ "
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackCloudTrail": {
            "Type": "AWS::CloudTrail::Trail",
            "DependsOn": [
                "TapStackLogsBucketPolicy",
                "TapStackCloudTrailKMSKeyAlias"
            ],
            "Properties": {
                "S3BucketName": {
                    "Ref": "TapStackLogsBucket"
                },
                "S3KeyPrefix": "cloudtrail/",
                "IsLogging": true,
                "EnableLogFileValidation": true,
                "IncludeGlobalServiceEvents": true,
                "IsMultiRegionTrail": false,
                "KMSKeyId": {
                    "Fn::GetAtt": [
                        "TapStackCloudTrailKMSKey",
                        "Arn"
                    ]
                },
                "TrailName": "TapStack-CloudTrail",
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackSNSTopic": {
            "Type": "AWS::SNS::Topic",
            "Properties": {
                "DisplayName": {
                    "Fn::Sub": "${ProjectName} Alarms"
                },
                "TopicName": {
                    "Fn::Sub": "${ProjectName}-alarms"
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackSNSSubscription": {
            "Type": "AWS::SNS::Subscription",
            "Condition": "CreateSNSSubscription",
            "Properties": {
                "Protocol": "email",
                "Endpoint": {
                    "Ref": "AlarmEmail"
                },
                "TopicArn": {
                    "Ref": "TapStackSNSTopic"
                }
            }
        },
        "TapStackAppCPUAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmDescription": {
                    "Fn::Sub": "Alarm if CPU > 80% for 5 minutes on ${ProjectName} App Instance"
                },
                "MetricName": "CPUUtilization",
                "Namespace": "AWS/EC2",
                "Statistic": "Average",
                "Period": 300,
                "EvaluationPeriods": 1,
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "InstanceId",
                        "Value": {
                            "Ref": "TapStackAppInstance"
                        }
                    }
                ],
                "AlarmActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "InsufficientDataActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "OKActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "TreatMissingData": "breaching"
            }
        },
        "TapStackAppStatusCheckAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmDescription": {
                    "Fn::Sub": "Alarm if status check fails for ${ProjectName} App Instance"
                },
                "MetricName": "StatusCheckFailed",
                "Namespace": "AWS/EC2",
                "Statistic": "Maximum",
                "Period": 300,
                "EvaluationPeriods": 1,
                "Threshold": 0,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "InstanceId",
                        "Value": {
                            "Ref": "TapStackAppInstance"
                        }
                    }
                ],
                "AlarmActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "InsufficientDataActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "OKActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "TreatMissingData": "breaching"
            }
        },
        "TapStackRDSCPUAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmDescription": {
                    "Fn::Sub": "Alarm if RDS CPU > 80% for 5 minutes on ${ProjectName} DB"
                },
                "MetricName": "CPUUtilization",
                "Namespace": "AWS/RDS",
                "Statistic": "Average",
                "Period": 300,
                "EvaluationPeriods": 1,
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "DBInstanceIdentifier",
                        "Value": {
                            "Ref": "TapStackRDSInstance"
                        }
                    }
                ],
                "AlarmActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "InsufficientDataActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "OKActions": [
                    {
                        "Ref": "TapStackSNSTopic"
                    }
                ],
                "TreatMissingData": "breaching"
            }
        },
        "TapStackBastionEIP": {
            "Type": "AWS::EC2::EIP",
            "Properties": {
                "Domain": "vpc",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-eip-bastion"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackBastionHost": {
            "Type": "AWS::EC2::Instance",
            "Properties": {
                "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}",
                "InstanceType": {
                    "Ref": "BastionInstanceType"
                },
                "SecurityGroupIds": [
                    {
                        "Ref": "TapStackBastionSecurityGroup"
                    }
                ],
                "SubnetId": {
                    "Ref": "TapStackPublicSubnet1"
                },
                "IamInstanceProfile": {
                    "Ref": "TapStackBastionInstanceProfile"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-bastion"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ],
                "KeyName": {
                    "Fn::If": [
                        "HasKeyPair",
                        {
                            "Ref": "KeyName"
                        },
                        {
                            "Ref": "AWS::NoValue"
                        }
                    ]
                }
            }
        },
        "TapStackBastionEIPAssociation": {
            "Type": "AWS::EC2::EIPAssociation",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "TapStackBastionEIP",
                        "AllocationId"
                    ]
                },
                "InstanceId": {
                    "Ref": "TapStackBastionHost"
                }
            }
        },
        "TapStackAppInstance": {
            "Type": "AWS::EC2::Instance",
            "Properties": {
                "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}",
                "InstanceType": {
                    "Ref": "AppInstanceType"
                },
                "SecurityGroupIds": [
                    {
                        "Ref": "TapStackAppSecurityGroup"
                    }
                ],
                "SubnetId": {
                    "Ref": "TapStackPrivateSubnet1"
                },
                "IamInstanceProfile": {
                    "Ref": "TapStackAppInstanceProfile"
                },
                "UserData": {
                    "Fn::Base64": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n# Optional: fetch CloudWatch agent config from SSM if configured\n"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-app-ec2"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ],
                "KeyName": {
                    "Fn::If": [
                        "HasKeyPair",
                        {
                            "Ref": "KeyName"
                        },
                        {
                            "Ref": "AWS::NoValue"
                        }
                    ]
                }
            }
        },
        "TapStackDBSubnetGroup": {
            "Type": "AWS::RDS::DBSubnetGroup",
            "Properties": {
                "DBSubnetGroupDescription": {
                    "Fn::Sub": "${ProjectName} database subnet group"
                },
                "SubnetIds": [
                    {
                        "Ref": "TapStackPrivateSubnet1"
                    },
                    {
                        "Ref": "TapStackPrivateSubnet2"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "TapStackRDSInstance": {
            "Type": "AWS::RDS::DBInstance",
            "Properties": {
                "DBName": {
                    "Ref": "DbName"
                },
                "Engine": {
                    "Ref": "DbEngine"
                },
                "EngineVersion": {
                    "Ref": "DbEngineVersion"
                },
                "DBInstanceClass": {
                    "Ref": "DbInstanceClass"
                },
                "AllocatedStorage": 20,
                "StorageType": "gp3",
                "StorageEncrypted": true,
                "KmsKeyId": {
                    "Fn::GetAtt": [
                        "TapStackRDSKMSKey",
                        "Arn"
                    ]
                },
                "MasterUsername": {
                    "Ref": "DbUsername"
                },
                "MasterUserPassword": {
                    "Fn::Sub": "{{resolve:secretsmanager:${TapStackDBSecret}::password}}"
                },
                "DBSubnetGroupName": {
                    "Ref": "TapStackDBSubnetGroup"
                },
                "VPCSecurityGroups": [
                    {
                        "Ref": "TapStackRDSSecurityGroup"
                    }
                ],
                "MultiAZ": true,
                "PubliclyAccessible": false,
                "BackupRetentionPeriod": 7,
                "DeletionProtection": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-rds"
                        }
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        }
    },
    "Outputs": {
        "VpcId": {
            "Description": "The ID of the VPC",
            "Value": {
                "Ref": "TapStackVPC"
            }
        },
        "PublicSubnet1": {
            "Description": "The ID of Public Subnet 1",
            "Value": {
                "Ref": "TapStackPublicSubnet1"
            }
        },
        "PublicSubnet2": {
            "Description": "The ID of Public Subnet 2",
            "Value": {
                "Ref": "TapStackPublicSubnet2"
            }
        },
        "PrivateSubnet1": {
            "Description": "The ID of Private Subnet 1",
            "Value": {
                "Ref": "TapStackPrivateSubnet1"
            }
        },
        "PrivateSubnet2": {
            "Description": "The ID of Private Subnet 2",
            "Value": {
                "Ref": "TapStackPrivateSubnet2"
            }
        },
        "BastionSecurityGroupId": {
            "Description": "The ID of the Bastion Security Group",
            "Value": {
                "Ref": "TapStackBastionSecurityGroup"
            }
        },
        "AppSecurityGroupId": {
            "Description": "The ID of the Application Security Group",
            "Value": {
                "Ref": "TapStackAppSecurityGroup"
            }
        },
        "RDSSecurityGroupId": {
            "Description": "The ID of the RDS Security Group",
            "Value": {
                "Ref": "TapStackRDSSecurityGroup"
            }
        },
        "AppBucketName": {
            "Description": "Name of the Application S3 Bucket",
            "Value": {
                "Ref": "TapStackAppBucket"
            }
        },
        "LogsBucketName": {
            "Description": "Name of the Logs S3 Bucket",
            "Value": {
                "Ref": "TapStackLogsBucket"
            }
        },
        "S3KMSKeyArn": {
            "Description": "ARN of the S3 KMS Key",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackS3KMSKey",
                    "Arn"
                ]
            }
        },
        "RDSKMSKeyArn": {
            "Description": "ARN of the RDS KMS Key",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackRDSKMSKey",
                    "Arn"
                ]
            }
        },
        "CloudTrailKMSKeyArn": {
            "Description": "ARN of the CloudTrail KMS Key",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackCloudTrailKMSKey",
                    "Arn"
                ]
            }
        },
        "CloudWatchKMSKeyArn": {
            "Description": "ARN of the CloudWatch KMS Key",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackCloudWatchKMSKey",
                    "Arn"
                ]
            }
        },
        "RDSEndpoint": {
            "Description": "Endpoint of the RDS instance",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackRDSInstance",
                    "Endpoint.Address"
                ]
            }
        },
        "RDSArn": {
            "Description": "ARN of the RDS instance",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackRDSInstance",
                    "DBInstanceArn"
                ]
            }
        },
        "BastionEIP": {
            "Description": "Elastic IP of the Bastion Host",
            "Value": {
                "Ref": "TapStackBastionEIP"
            }
        },
        "AppInstanceId": {
            "Description": "Instance ID of the Application EC2",
            "Value": {
                "Ref": "TapStackAppInstance"
            }
        },
        "CloudTrailArn": {
            "Description": "ARN of the CloudTrail",
            "Value": {
                "Fn::GetAtt": [
                    "TapStackCloudTrail",
                    "Arn"
                ]
            }
        },
        "SNSTopicArn": {
            "Description": "ARN of the SNS Topic for Alarms",
            "Value": {
                "Ref": "TapStackSNSTopic"
            }
        }
    }
}
```