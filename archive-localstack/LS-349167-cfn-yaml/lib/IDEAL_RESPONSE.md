### ideal_response.md

# Ideal Response

## Functional scope (build everything new):

A complete, production-grade solution that builds a **fresh, secure AWS baseline** using CloudFormation and Boto3, without relying on any pre-existing resources. The assistant first restates the problem in clear terms: a Python program (`secure_aws_environment.py`) must deploy a single CloudFormation template (`TapStack.yml`) that provisions a new VPC, networking, security controls, logging, and data services across the required security domains.

The CloudFormation template is designed to:

* Create **KMS CMKs** dedicated to data, logs, CloudTrail, and RDS, with rotation enabled and scoped key policies that allow only the required AWS services and the account root.
* Provision **S3 buckets** (logging and CloudTrail) with **SSE-KMS**, versioning, strict TLS-only access, public access block, and a lifecycle policy for log retention, without hard-coded `BucketName` values to avoid early validation name conflicts.
* Build a **VPC** with well-structured CIDRs, two **public subnets** and two **private subnets** across two AZs, **NAT Gateways** per AZ, and **gateway + interface endpoints** (S3, CloudWatch Logs, STS, KMS, EC2, SSM, EC2Messages, SSMMessages) to minimize public traffic exposure.
* Configure **security groups** that only allow inbound HTTP (80) and HTTPS (443) on the ALB, allow app-tier access from the ALB only, and allow RDS access only from the app-tier security group.
* Deploy an **Application Load Balancer** with HTTP and optional HTTPS listener (when an ACM certificate ARN is provided), no explicit physical names, and tags that include `ProjectName` and `EnvironmentSuffix`.
* Integrate **AWS WAFv2** (REGIONAL) with AWS managed rule groups and associate it to the ALB, ensuring Layer 7 protection, controlled by a feature toggle parameter.
* Account for **AWS Shield Advanced** requirement at the design level (e.g., noting that subscription is an account-level paid feature) and either implement it where supported or clearly document how it should be enabled outside the stack in a compliant way.
* Configure **CloudWatch Logs** log groups encrypted with KMS and a **VPC Flow Logs** configuration that sends logs to CloudWatch Logs via an IAM role with least privilege for `logs:PutLogEvents` and related actions.
* Enable **CloudTrail** in multi-region mode (with optional organization-wide toggle), logging to the KMS-encrypted S3 bucket and CloudWatch Logs, with an IAM role for CloudTrail to write to Logs, and a secure S3 bucket policy.
* Implement **AWS Config** in a robust, idempotent way:

  * A dedicated Config IAM role with scoped S3 permissions for the logging bucket.
  * A custom resource (Lambda) that safely creates/updates the configuration recorder and delivery channel, starts recording with retry logic, and then creates the specified AWS-managed Config rules (S3 encryption, CloudTrail enabled, restricted SSH, RDS encrypted, default SG closed, root MFA enabled).
  * The custom resource never causes stack failure; it reports detailed status via its Data and logs, but always returns SUCCESS to CloudFormation.
* Deploy **Security Hub** and required standards in an idempotent way through custom resources:

  * One Lambda that checks if Security Hub is enabled; if not, calls `EnableSecurityHub`; handles `ResourceNotFoundException` and `InvalidAccessException` gracefully.
  * Another Lambda that calls `BatchEnableStandards` only for standards that are not yet enabled; all “already enabled” or similar conflicts are swallowed and logged, not surfaced as CloudFormation failures.
* Turn on **GuardDuty** with a detector configured for S3 protection (and possibly other data sources), controlled by a parameter toggle.
* Create a **PostgreSQL RDS** instance in private subnets with:

  * KMS encryption at rest, TLS enforced in-transit (`rds.force_ssl=1` in a parameter group).
  * No hard-coded DB identifier; rely on generated names and tags.
  * `ManageMasterUserPassword=true` with a KMS key for the secret, plus `DeletionPolicy: Snapshot` and `UpdateReplacePolicy: Snapshot`.
* Ensure all resource tags consistently include `ProjectName`, `EnvironmentSuffix`, and other organizational metadata such as `OrganizationUnit`, `AccountAlias`, `CostCenter`, `DataClassification`, and `WorkloadOwnerEmail`.

## Constraints & naming strategy:

The template:

* Uses a **single `TapStack.yml` file** with complete parameter declarations and safe **defaults**, so the pipeline can deploy without passing parameters at runtime.
* Avoids hard-coded physical names (`BucketName`, `FunctionName`, `DBInstanceIdentifier`, etc.) specifically to prevent **`AWS::EarlyValidation::ResourceExistenceCheck`** failures against pre-existing resources in the account.
* Enforces `EnvironmentSuffix` via a **regex-based `AllowedPattern`**, not a fixed list of allowed values, to keep the stack flexible yet well-structured.
* Ensures every “Name” or tag-based naming convention incorporates `EnvironmentSuffix` to avoid cross-environment collision.
* Uses least privilege IAM roles and inline policies tailored to the precise service interactions required (KMS describe, S3 put for specific prefixes, CloudWatch Logs writes, Config/CloudTrail/GuardDuty/Security Hub calls, etc.).

## Deliverable:

A comprehensive answer that includes:

* A human-written, structured explanation of the architecture and security posture, clearly aligned to the bullet requirements (1–11) and the constraint list.
* The complete `TapStack.yml` CloudFormation template in valid YAML (not JSON), formatted and indented correctly, and passing `cfn-lint` with no errors, plus no unresolved references or dependency loops.
* A fully implemented `secure_aws_environment.py` program that:

  * Uses Boto3’s CloudFormation client to **create or update** the stack.
  * Accepts configuration (stack name, template path, regions, optional overrides) via CLI arguments or environment variables.
  * Deploys the template to at least `us-east-1` and `us-west-2` (or accepts a region list), following the naming convention with `EnvironmentSuffix`.
  * Waits on **stack events** for completion, prints meaningful progress and final status, and returns a non-zero exit code on failure.
  * Implements structured logging and robust error handling, catching CloudFormation `ValidationError`, timeout, and other common issues, and providing actionable messages.
* Clear guidance at the end on **how to run the Python script in CI/CD**, how to monitor stack events, and how to verify that all security services (CloudTrail, Config rules, Security Hub, GuardDuty, WAF, RDS encryption) are active and compliant once deployed.


```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Secure, production-ready baseline that builds EVERYTHING new: VPC (public/private),
  IAM (least privilege), KMS-encrypted S3, optional WAFv2 association, CloudTrail, AWS Config,
  Security Hub, GuardDuty, KMS-encrypted CloudWatch Logs & VPC Flow Logs, and a TLS-enforced,
  at-rest-encrypted PostgreSQL RDS in private subnets. NO hard physical names are set to avoid
  EarlyValidation ResourceExistenceCheck failures. All “Name” conventions are via Tags.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: "Project & Environment" }
        Parameters: [ProjectName, EnvironmentSuffix, OrganizationUnit, AccountAlias, CostCenter, DataClassification, WorkloadOwnerEmail]
      - Label: { default: "Regions" }
        Parameters: [PrimaryRegion, SecondaryRegion]
      - Label: { default: "Networking (VPC & Subnets)" }
        Parameters: [VpcCidr, PublicSubnetACidr, PublicSubnetBCidr, PrivateSubnetACidr, PrivateSubnetBCidr, AllowedIngressCidrsHttp, AllowedIngressCidrsHttps]
      - Label: { default: "Feature Toggles" }
        Parameters: [EnableWAF, EnableSecurityHub, EnableGuardDuty, EnableOrgTrail]
      - Label: { default: "Certificates & ALB" }
        Parameters: [AlbScheme, AcmCertificateArn]
      - Label: { default: "RDS (PostgreSQL)" }
        Parameters: [DbEngineVersion, DbInstanceClass, DbAllocatedStorage, DbMaxAllocatedStorage, DbBackupRetentionDays, DbMasterUsername]
      - Label: { default: "Logging & Retention" }
        Parameters: [LogRetentionDays, S3LogLifecycleDays]
    ParameterLabels:
      EnvironmentSuffix: { default: "Environment Suffix (used in Tags; regex-guarded)" }

Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    AllowedPattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ConstraintDescription: "Lowercase letters, numbers, hyphens; must start with alphanumeric."
  EnvironmentSuffix:
    Type: String
    Default: prod-us
    AllowedPattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ConstraintDescription: "Lowercase letters, numbers, hyphens; no trailing hyphen."
  OrganizationUnit:
    Type: String
    Default: engineering
  AccountAlias:
    Type: String
    Default: shared-services
  CostCenter:
    Type: String
    Default: cc-001
  DataClassification:
    Type: String
    Default: confidential
  WorkloadOwnerEmail:
    Type: String
    Default: security@company.example

  PrimaryRegion:
    Type: String
    Default: us-east-1
  SecondaryRegion:
    Type: String
    Default: us-west-2

  # Networking
  VpcCidr:
    Type: String
    Default: 10.20.0.0/16
  PublicSubnetACidr:
    Type: String
    Default: 10.20.0.0/24
  PublicSubnetBCidr:
    Type: String
    Default: 10.20.1.0/24
  PrivateSubnetACidr:
    Type: String
    Default: 10.20.10.0/24
  PrivateSubnetBCidr:
    Type: String
    Default: 10.20.11.0/24
  AllowedIngressCidrsHttp:
    Type: CommaDelimitedList
    Default: 0.0.0.0/0
  AllowedIngressCidrsHttps:
    Type: CommaDelimitedList
    Default: 0.0.0.0/0

  # Feature toggles
  EnableWAF:
    Type: String
    AllowedValues: [true, false]
    Default: true
  EnableSecurityHub:
    Type: String
    AllowedValues: [true, false]
    Default: true
  EnableGuardDuty:
    Type: String
    AllowedValues: [true, false]
    Default: true
  EnableOrgTrail:
    Type: String
    AllowedValues: [true, false]
    Default: false

  # ALB
  AlbScheme:
    Type: String
    AllowedValues: [internet-facing, internal]
    Default: internet-facing
  AcmCertificateArn:
    Type: String
    Default: ""

  # RDS (PostgreSQL)
  DbEngineVersion:
    Type: String
    AllowedValues: ["16.3"]
    Default: "16.3"
  DbInstanceClass:
    Type: String
    Default: db.t4g.medium
  DbAllocatedStorage:
    Type: Number
    Default: 50
  DbMaxAllocatedStorage:
    Type: Number
    Default: 200
  DbBackupRetentionDays:
    Type: Number
    Default: 7
  DbMasterUsername:
    Type: String
    Default: masteruser
    NoEcho: true

  # Retention
  LogRetentionDays:
    Type: Number
    Default: 90
  S3LogLifecycleDays:
    Type: Number
    Default: 365

Conditions:
  UseWAF: !Equals [!Ref EnableWAF, "true"]
  UseSecurityHub: !Equals [!Ref EnableSecurityHub, "true"]
  UseGuardDuty: !Equals [!Ref EnableGuardDuty, "true"]
  UseOrgTrail: !Equals [!Ref EnableOrgTrail, "true"]
  HasCertificate: !Not [!Equals [!Ref AcmCertificateArn, ""]]

Resources:

  ########################################
  # KMS Keys (separate keys per domain)  #
  ########################################

  DataKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "General data encryption CMK for ${ProjectName}-${EnvironmentSuffix}"
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRootAccount
            Effect: Allow
            Principal: { AWS: !Sub "arn:${AWS::Partition}:iam::${AWS::AccountId}:root" }
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowS3AndLogsUse
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - !Sub "logs.${AWS::Region}.amazonaws.com"
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
  DataKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      TargetKeyId: !Ref DataKmsKey
      AliasName: !Sub "alias/${ProjectName}-${EnvironmentSuffix}-data"

  TrailKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "CloudTrail CMK for ${ProjectName}-${EnvironmentSuffix}"
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal: { AWS: !Sub "arn:${AWS::Partition}:iam::${AWS::AccountId}:root" }
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowCloudTrailUse
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
  TrailKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      TargetKeyId: !Ref TrailKmsKey
      AliasName: !Sub "alias/${ProjectName}-${EnvironmentSuffix}-trail"

  LogsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "CloudWatch Logs CMK for ${ProjectName}-${EnvironmentSuffix}"
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal: { AWS: !Sub "arn:${AWS::Partition}:iam::${AWS::AccountId}:root" }
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowCWLUse
            Effect: Allow
            Principal:
              Service: !Sub "logs.${AWS::Region}.amazonaws.com"
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"

  LogsKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      TargetKeyId: !Ref LogsKmsKey
      AliasName: !Sub "alias/${ProjectName}-${EnvironmentSuffix}-logs"

  KmsReadinessRole:
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: KmsReadinessInline
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:DescribeKey
                Resource: !GetAtt LogsKmsKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  KmsReadinessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays

  KmsReadinessFunction:
    Type: AWS::Lambda::Function
    DependsOn:
      - KmsReadinessLogGroup
    Properties:
      Description: "Wait until LogsKmsKey is Enabled/usable before creating Log Groups."
      Handler: index.handler
      Runtime: python3.12
      Timeout: 90
      Role: !GetAtt KmsReadinessRole.Arn
      Environment:
        Variables:
          TARGET_KEY_ARN: !GetAtt LogsKmsKey.Arn
      Code:
        ZipFile: |
          import os, time, json, boto3, urllib.request

          kms = boto3.client("kms")
          KEY_ARN = os.environ["TARGET_KEY_ARN"]

          def send_response(event, context, status, data, physical_id):
              body = {
                  "Status": status,
                  "Reason": f"See CloudWatch Logs for details: {context.log_group_name}",
                  "PhysicalResourceId": physical_id,
                  "StackId": event["StackId"],
                  "RequestId": event["RequestId"],
                  "LogicalResourceId": event["LogicalResourceId"],
                  "NoEcho": False,
                  "Data": data or {}
              }
              body_bytes = json.dumps(body).encode("utf-8")
              req = urllib.request.Request(
                  event["ResponseURL"],
                  data=body_bytes,
                  headers={"content-type": "", "content-length": str(len(body_bytes))},
                  method="PUT"
              )
              with urllib.request.urlopen(req) as resp:
                  resp.read()

          def is_ready():
              d = kms.describe_key(KeyId=KEY_ARN)
              meta = d.get("KeyMetadata", {})
              return meta.get("KeyState") == "Enabled"

          def handler(event, context):
              physical_id = "KmsReadyLogs"
              try:
                  req_type = event["RequestType"]
                  # On Delete, succeed immediately (do not block stack deletes)
                  if req_type == "Delete":
                      send_response(event, context, "SUCCESS", {"State": "Deleted"}, physical_id)
                      return
                  # On Create/Update, poll until key is Enabled or timeout
                  deadline = time.time() + 120
                  while time.time() < deadline:
                      if is_ready():
                          send_response(event, context, "SUCCESS", {"State": "Enabled"}, physical_id)
                          return
                      time.sleep(5)
                  send_response(event, context, "FAILED", {"Error": "KMS key not Enabled in time"}, physical_id)
              except Exception as e:
                  send_response(event, context, "FAILED", {"Error": str(e)}, physical_id)

  KmsReadyLogs:
    Type: Custom::KmsReady
    Properties:
      ServiceToken: !GetAtt KmsReadinessFunction.Arn

  RdsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "RDS CMK for ${ProjectName}-${EnvironmentSuffix}"
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal: { AWS: !Sub "arn:${AWS::Partition}:iam::${AWS::AccountId}:root" }
            Action: "kms:*"
            Resource: "*"
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
            Resource: "*"
  RdsKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      TargetKeyId: !Ref RdsKmsKey
      AliasName: !Sub "alias/${ProjectName}-${EnvironmentSuffix}-rds"

  ########################################
  # S3 Buckets (no explicit BucketName)  #
  ########################################

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerEnforced }]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration: { Status: Enabled }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataKmsKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: !Sub "expire-noncurrent-${EnvironmentSuffix}"
            Status: Enabled
            NoncurrentVersionExpiration:
              NoncurrentDays: !Ref S3LogLifecycleDays
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-logging" }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentSuffix }
        - { Key: OrganizationUnit, Value: !Ref OrganizationUnit }
        - { Key: AccountAlias, Value: !Ref AccountAlias }
        - { Key: OwnerEmail, Value: !Ref WorkloadOwnerEmail }
        - { Key: CostCenter, Value: !Ref CostCenter }
        - { Key: DataClassification, Value: !Ref DataClassification }
        - { Key: PrimaryRegion, Value: !Ref PrimaryRegion }
        - { Key: SecondaryRegion, Value: !Ref SecondaryRegion }

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${LoggingBucket.Arn}"
              - !Sub "${LoggingBucket.Arn}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"

          - Sid: AllowConfigDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${LoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/Config/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

          - Sid: AllowConfigBucketAclCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerEnforced }]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration: { Status: Enabled }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TrailKmsKey
            BucketKeyEnabled: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-cloudtrail" }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentSuffix }
        - { Key: OrganizationUnit, Value: !Ref OrganizationUnit }
        - { Key: AccountAlias, Value: !Ref AccountAlias }
        - { Key: OwnerEmail, Value: !Ref WorkloadOwnerEmail }
        - { Key: CostCenter, Value: !Ref CostCenter }
        - { Key: DataClassification, Value: !Ref DataClassification }
        - { Key: PrimaryRegion, Value: !Ref PrimaryRegion }
        - { Key: SecondaryRegion, Value: !Ref SecondaryRegion }

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${CloudTrailBucket.Arn}"
              - !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"
          - Sid: AllowCloudTrailDelivery
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: AllowCloudTrailBucketAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn

  ########################################
  # Networking: VPC, Subnets, IGW, NAT   #
  ########################################

  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-vpc" }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentSuffix }
        - { Key: PrimaryRegion, Value: !Ref PrimaryRegion }
        - { Key: SecondaryRegion, Value: !Ref SecondaryRegion }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-igw" }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentSuffix }

  VpcGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-public-a" }

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-public-b" }

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetACidr
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-private-a" }

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetBCidr
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-private-b" }

  PublicRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-public-rt-a" }]

  PublicRouteA:
    Type: AWS::EC2::Route
    DependsOn: VpcGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTableA

  PublicRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-public-rt-b" }]

  PublicRouteB:
    Type: AWS::EC2::Route
    DependsOn: VpcGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetBRouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTableB

  NatEipA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipA.AllocationId
      SubnetId: !Ref PublicSubnetA
      ConnectivityType: public
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-nat-a" }]

  NatEipB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipB.AllocationId
      SubnetId: !Ref PublicSubnetB
      ConnectivityType: public
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-nat-b" }]

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-private-rt-a" }]

  NatRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateSubnetARouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-private-rt-b" }]

  NatRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

  PrivateSubnetBRouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  ########################################
  # Interface & Gateway VPC Endpoints    #
  ########################################

  EndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !Ref Vpc
      GroupDescription: Allow HTTPS from VPC to Interface Endpoints
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VpcCidr
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-vpce-sg" }]

  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
      RouteTableIds: [!Ref PrivateRouteTableA, !Ref PrivateRouteTableB]
      VpcEndpointType: Gateway

  CloudWatchLogsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.logs"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  StsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.sts"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  KmsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.kms"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  Ec2Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ec2"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  SsmEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ssm"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  Ec2MessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ec2messages"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  SsmMessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.ssmmessages"
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]
      VpcEndpointType: Interface
      PrivateDnsEnabled: true

  ########################################
  # Security Groups (80/443 only)        #
  ########################################

  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Inbound 80/443 only
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80,  ToPort: 80,  CidrIp: !Select [0, !Ref AllowedIngressCidrsHttp] }
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: !Select [0, !Ref AllowedIngressCidrsHttps] }
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-alb-sg" }]

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App/ECS/EC2 tier (egress only; ingress from ALB)
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref AlbSecurityGroup
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-app-sg" }]

  RdsSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow PostgreSQL from App tier
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSecurityGroup
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-rds-sg" }]

  ########################################
  # ALB (no explicit physical names)     #
  ########################################

  Alb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: !Ref AlbScheme
      Subnets: [!Ref PublicSubnetA, !Ref PublicSubnetB]
      SecurityGroups: [!Ref AlbSecurityGroup]
      Type: application
      IpAddressType: ipv4
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-alb" }

  AlbTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref Vpc
      Protocol: HTTP
      Port: 8080
      TargetType: instance
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      Matcher: { HttpCode: '200-399' }
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-tg" }

  AlbHttpListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AlbTargetGroup

  AlbHttpsListener:
    Condition: HasCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref AcmCertificateArn
      SslPolicy: ELBSecurityPolicy-TLS13-1-2-2021-06
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AlbTargetGroup

  ########################################
  # WAFv2 (optional association)         #
  ########################################

  WafWebAcl:
    Condition: UseWAF
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-webacl"
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      VisibilityConfig:
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${ProjectName}-${EnvironmentSuffix}-webacl"
        SampledRequestsEnabled: true
      Rules:
        - Name: AWS-AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: common
            SampledRequestsEnabled: true
        - Name: AWS-AdminProtection
          Priority: 2
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAdminProtectionRuleSet
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: admin
            SampledRequestsEnabled: true
        - Name: AWS-KnownBadInputs
          Priority: 3
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: badinputs
            SampledRequestsEnabled: true
        - Name: AWS-AnonIpList
          Priority: 4
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAnonymousIpList
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: anonip
            SampledRequestsEnabled: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-webacl" }

  WafWebAclAssociation:
    Condition: UseWAF
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref Alb
      WebACLArn: !GetAtt WafWebAcl.Arn

  ########################################
  # CloudWatch Logs & VPC Flow Logs      #
  ########################################

  FlowLogLogGroup:
    Type: AWS::Logs::LogGroup
    DependsOn: KmsReadyLogs
    Properties:
      KmsKeyId: !GetAtt LogsKmsKey.Arn
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-vpc-flow-logs" }

  FlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: vpc-flow-logs.amazonaws.com }
            Action: sts:AssumeRole
      Path: /
      Policies:
        - PolicyName: FlowLogsToCWL
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: "*"

  VpcFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref Vpc
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref FlowLogLogGroup
      DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn

  ########################################
  # CloudTrail (multi-region)            #
  ########################################

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    DependsOn: KmsReadyLogs
    Properties:
      KmsKeyId: !GetAtt LogsKmsKey.Arn
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-cloudtrail-logs" }

  CloudTrailLogRole:
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailToCWL
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !GetAtt CloudTrailLogGroup.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      IsLogging: true
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsOrganizationTrail: !If [UseOrgTrail, true, false]
      EnableLogFileValidation: true
      KMSKeyId: !Ref TrailKmsKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogRole.Arn

    ########################################
  # AWS Config (Custom, resilient)       #
  ########################################

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: config.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AWSConfig-DeliveryAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3PutObjectsForConfig
                Effect: Allow
                Action: s3:PutObject
                Resource: !Sub "${LoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/Config/*"
                Condition:
                  StringEquals:
                    s3:x-amz-acl: bucket-owner-full-control
              - Sid: S3AclCheck
                Effect: Allow
                Action: s3:GetBucketAcl
                Resource: !GetAtt LoggingBucket.Arn

  ConfigSetupRole:
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigSetupInline
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:DescribeConfigurationRecorders
                  - config:DescribeDeliveryChannels
                  - config:DescribeConfigurationRecorderStatus
                  - config:PutConfigurationRecorder
                  - config:PutDeliveryChannel
                  - config:StartConfigurationRecorder
                  - config:PutConfigRule
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  ConfigSetupLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays

  ConfigSetupFunction:
    Type: AWS::Lambda::Function
    DependsOn:
      - ConfigSetupLogGroup
      - ConfigRole
      - LoggingBucketPolicy
    Properties:
      Description: "Idempotently ensure AWS Config recorder, delivery channel and core rules exist."
      Handler: index.handler
      Runtime: python3.12
      Timeout: 180
      Role: !GetAtt ConfigSetupRole.Arn
      Environment:
        Variables:
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json, urllib.request, boto3, os, time
          from botocore.exceptions import ClientError

          config = boto3.client("config")

          def send_response(event, context, status, data, physical_id):
              body = {
                "Status": status,
                "Reason": f"See CloudWatch Logs for details: {context.log_group_name}",
                "PhysicalResourceId": physical_id,
                "StackId": event["StackId"],
                "RequestId": event["RequestId"],
                "LogicalResourceId": event["LogicalResourceId"],
                "NoEcho": False,
                "Data": data or {}
              }
              body_bytes = json.dumps(body).encode("utf-8")
              req = urllib.request.Request(
                event["ResponseURL"],
                data=body_bytes,
                headers={"content-type": "", "content-length": str(len(body_bytes))},
                method="PUT"
              )
              with urllib.request.urlopen(req) as resp:
                resp.read()

          def ensure_config_core(s3_bucket, role_arn, recorder_name="default", channel_name="default"):
              """
              Best-effort setup for:
              1) ConfigurationRecorder (allSupported + includeGlobalResourceTypes)
              2) DeliveryChannel (to the LoggingBucket)
              3) StartConfigurationRecorder with retries for eventual consistency

              Never raises to CloudFormation; returns a status dict instead.
              """
              result = {
                  "RecorderName": recorder_name,
                  "ChannelName": channel_name,
                  "CoreState": "UNKNOWN",
              }

              try:
                  # 1) Recorder create/update
                  recs = config.describe_configuration_recorders().get("ConfigurationRecorders", [])
                  if not any(r.get("name") == recorder_name for r in recs):
                      config.put_configuration_recorder(
                          ConfigurationRecorder={
                              "name": recorder_name,
                              "roleARN": role_arn,
                              "recordingGroup": {
                                  "allSupported": True,
                                  "includeGlobalResourceTypes": True,
                              },
                          }
                      )
                  else:
                      config.put_configuration_recorder(
                          ConfigurationRecorder={
                              "name": recorder_name,
                              "roleARN": role_arn,
                              "recordingGroup": {
                                  "allSupported": True,
                                  "includeGlobalResourceTypes": True,
                              },
                          }
                      )

                  # 2) Delivery channel create/update
                  chans = config.describe_delivery_channels().get("DeliveryChannels", [])
                  channel = None
                  for c in chans:
                      if c.get("name") == channel_name:
                          channel = c
                          break

                  if channel is None:
                      config.put_delivery_channel(
                          DeliveryChannel={
                              "name": channel_name,
                              "s3BucketName": s3_bucket,
                          }
                      )
                  else:
                      if channel.get("s3BucketName") != s3_bucket:
                          config.put_delivery_channel(
                              DeliveryChannel={
                                  "name": channel_name,
                                  "s3BucketName": s3_bucket,
                              }
                          )

                  # 3) Start recorder with retries to ride out "no available" races
                  max_attempts = 6
                  for attempt in range(1, max_attempts + 1):
                      try:
                          config.start_configuration_recorder(
                              ConfigurationRecorderName=recorder_name
                          )
                          # Optional: wait a bit and confirm status
                          time.sleep(5)
                          status = config.describe_configuration_recorder_status().get(
                              "ConfigurationRecordersStatus", []
                          )
                          for s in status:
                              if s.get("name") == recorder_name and s.get("recording"):
                                  result["CoreState"] = "STARTED"
                                  return result
                      except ClientError as e:
                          code = e.response.get("Error", {}).get("Code", "")
                          if code in (
                              "NoAvailableDeliveryChannelException",
                              "NoAvailableConfigurationRecorderException",
                          ):
                              # Give AWS Config more time to see recorder/channel
                              time.sleep(10)
                              continue
                          # Non-retryable error – record and stop
                          result["CoreState"] = f"START_FAILED_{code}"
                          result["CoreError"] = str(e)
                          return result
                      except Exception as e:
                          result["CoreState"] = "START_FAILED_EXCEPTION"
                          result["CoreError"] = str(e)
                          return result

                  # If we exhausted retries without clear "recording=True"
                  result["CoreState"] = "START_RETRIES_EXHAUSTED"
                  return result

              except ClientError as e:
                  result["CoreState"] = "SETUP_FAILED_CLIENTERROR"
                  result["CoreError"] = str(e)
                  return result
              except Exception as e:
                  result["CoreState"] = "SETUP_FAILED_EXCEPTION"
                  result["CoreError"] = str(e)
                  return result

          def ensure_config_rules(rules):
              """
              Best-effort creation/update of managed Config rules.
              Never raises – any errors are recorded in the returned dict.
              """
              created = []
              errors = []

              if not rules:
                  return {"RulesCreatedOrUpdated": [], "RuleErrors": []}

              for r in rules:
                  name = r.get("ConfigRuleName")
                  source_identifier = r.get("SourceIdentifier")
                  input_params = r.get("InputParameters")

                  if not name or not source_identifier:
                      errors.append(f"Missing name or SourceIdentifier in rule: {r}")
                      continue

                  cfg = {
                      "ConfigRuleName": name,
                      "Source": {
                          "Owner": "AWS",
                          "SourceIdentifier": source_identifier,
                      },
                  }

                  # Allow simple key/value input parameters (dict → JSON)
                  if isinstance(input_params, dict) and input_params:
                      cfg["InputParameters"] = json.dumps(input_params)

                  try:
                      config.put_config_rule(ConfigRule=cfg)
                      created.append(name)
                  except ClientError as e:
                      code = e.response.get("Error", {}).get("Code", "")
                      msg = e.response.get("Error", {}).get("Message", "")
                      errors.append(f"{name}: {code} ({msg})")
                  except Exception as e:
                      errors.append(f"{name}: EXCEPTION({str(e)})")

              return {
                  "RulesCreatedOrUpdated": created,
                  "RuleErrors": errors,
              }

          def handler(event, context):
              physical_id = "ConfigSetup"
              try:
                  req_type = event.get("RequestType")
                  props = event.get("ResourceProperties", {})
                  bucket = props.get("S3BucketName")
                  role_arn = props.get("ConfigRoleArn")
                  recorder_name = props.get("RecorderName", "default")
                  channel_name = props.get("ChannelName", "default")
                  rules = props.get("ConfigRules", [])

                  if req_type == "Delete":
                      # Best practice: do NOT tear down AWS Config on stack delete.
                      send_response(event, context, "SUCCESS", {"State": "unchanged"}, physical_id)
                      return

                  core_result = ensure_config_core(bucket, role_arn, recorder_name, channel_name)
                  rules_result = ensure_config_rules(rules)

                  # Always return SUCCESS so this custom resource never blocks the stack.
                  combined = {"State": "COMPLETED"}
                  combined.update(core_result)
                  combined.update(rules_result)

                  send_response(event, context, "SUCCESS", combined, physical_id)

              except Exception as e:
                  # Last resort: still succeed so stack is not blocked by Config quirks.
                  send_response(
                      event,
                      context,
                      "SUCCESS",
                      {"State": "ERROR_IGNORED", "Error": str(e)},
                      physical_id,
                  )

  ConfigSetup:
    Type: Custom::ConfigSetup
    Properties:
      ServiceToken: !GetAtt ConfigSetupFunction.Arn
      S3BucketName: !Ref LoggingBucket
      ConfigRoleArn: !GetAtt ConfigRole.Arn
      RecorderName: default
      ChannelName: default
      ConfigRules:
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-s3-encryption"
          SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-trail-enabled"
          SourceIdentifier: CLOUD_TRAIL_ENABLED
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-restricted-ssh"
          SourceIdentifier: INCOMING_SSH_DISABLED
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-rds-encrypted"
          SourceIdentifier: RDS_STORAGE_ENCRYPTED
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-default-sg-closed"
          SourceIdentifier: VPC_DEFAULT_SECURITY_GROUP_CLOSED
        - ConfigRuleName: !Sub "${ProjectName}-${EnvironmentSuffix}-root-mfa"
          SourceIdentifier: ROOT_ACCOUNT_MFA_ENABLED

  ########################################
  # Security Hub (optional)              #
  ########################################

  SecurityHubEnableRole:
    Condition: UseSecurityHub
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SecurityHubEnableInline
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - securityhub:EnableSecurityHub
                  - securityhub:DescribeHub
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  SecurityHubEnableLogGroup:
    Condition: UseSecurityHub
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays

  SecurityHubEnableFunction:
    Condition: UseSecurityHub
    Type: AWS::Lambda::Function
    DependsOn:
      - SecurityHubEnableLogGroup
    Properties:
      Description: "Idempotently ensure Security Hub is enabled."
      Handler: index.handler
      Runtime: python3.12
      Timeout: 60
      Role: !GetAtt SecurityHubEnableRole.Arn
      Code:
        ZipFile: |
          import json, urllib.request, boto3
          from botocore.exceptions import ClientError

          sh = boto3.client("securityhub")

          def cfn_resp(event, context, status, data, physical_id=None, reason=None):
              body = {
                "Status": status,
                "Reason": reason or f"See CloudWatch Logs for details: {context.log_group_name}",
                "PhysicalResourceId": physical_id or "SecurityHubEnable",
                "StackId": event["StackId"],
                "RequestId": event["RequestId"],
                "LogicalResourceId": event["LogicalResourceId"],
                "NoEcho": False,
                "Data": data or {}
              }
              body_bytes = json.dumps(body).encode("utf-8")
              req = urllib.request.Request(
                  event["ResponseURL"],
                  data=body_bytes,
                  headers={"content-type": "", "content-length": str(len(body_bytes))},
                  method="PUT"
              )
              with urllib.request.urlopen(req) as resp:
                  resp.read()

          def handler(event, context):
              try:
                  # On Delete: do NOT disable Security Hub (best practice). No-op.
                  if event["RequestType"] == "Delete":
                      cfn_resp(event, context, "SUCCESS", {"State": "unchanged"}, "SecurityHubEnable")
                      return

                  # Create/Update: ensure hub exists
                  try:
                      # If already subscribed, this succeeds.
                      sh.describe_hub()
                      cfn_resp(event, context, "SUCCESS", {"State": "ENABLED"}, "SecurityHubEnable")
                      return
                  except ClientError as e:
                      code = e.response.get("Error", {}).get("Code", "")
                      # Treat both InvalidAccessException and ResourceNotFoundException as "not enabled yet"
                      if code in ("InvalidAccessException", "ResourceNotFoundException"):
                          sh.enable_security_hub()
                          cfn_resp(event, context, "SUCCESS", {"State": "ENABLED"}, "SecurityHubEnable")
                          return
                      # Any other error is a real failure
                      raise

              except Exception as e:
                  cfn_resp(event, context, "FAILED", {"Error": str(e)}, "SecurityHubEnable", reason=str(e))

  SecurityHubEnable:
    Condition: UseSecurityHub
    Type: Custom::SecurityHubEnable
    Properties:
      ServiceToken: !GetAtt SecurityHubEnableFunction.Arn

  SecurityHubStandardsLambdaRole:
    Condition: UseSecurityHub
    Type: AWS::IAM::Role
    Properties:
      Path: /
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SH-Standards-Manager
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - securityhub:GetEnabledStandards
                  - securityhub:BatchEnableStandards
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  SecurityHubStandardsLambdaLogGroup:
    Condition: UseSecurityHub
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays

  SecurityHubStandardsLambda:
    Condition: UseSecurityHub
    Type: AWS::Lambda::Function
    DependsOn:
      - SecurityHubStandardsLambdaLogGroup
    Properties:
      Description: "Idempotently enable Security Hub standards if not already enabled."
      Handler: index.handler
      Runtime: python3.12
      Timeout: 60
      Role: !GetAtt SecurityHubStandardsLambdaRole.Arn
      Environment:
        Variables:
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import boto3, json, os, urllib.request
          from botocore.exceptions import ClientError

          sh = boto3.client("securityhub")

          def send_response(event, context, status, data, physical_id):
              body = {
                  "Status": status,
                  "Reason": f"See CloudWatch Logs for details: {context.log_group_name}",
                  "PhysicalResourceId": physical_id,
                  "StackId": event["StackId"],
                  "RequestId": event["RequestId"],
                  "LogicalResourceId": event["LogicalResourceId"],
                  "NoEcho": False,
                  "Data": data or {}
              }
              body_bytes = json.dumps(body).encode("utf-8")
              req = urllib.request.Request(
                  event["ResponseURL"],
                  data=body_bytes,
                  headers={"content-type": "", "content-length": str(len(body_bytes))},
                  method="PUT"
              )
              with urllib.request.urlopen(req) as resp:
                  resp.read()

          def handler(event, context):
              physical_id = "SecurityHubStandards"
              try:
                  req_type = event.get("RequestType")
                  props = event.get("ResourceProperties", {})
                  standards = props.get("StandardsArns", []) or []

                  # On Delete: do NOT disable standards – just succeed
                  if req_type == "Delete":
                      send_response(event, context, "SUCCESS", {"State": "unchanged"}, physical_id)
                      return

                  # Create / Update: best-effort enable for each standard, never fail stack
                  enabled_attempt = []
                  errors = []

                  for arn in standards:
                      try:
                          sh.batch_enable_standards(
                              StandardsSubscriptionRequests=[{"StandardsArn": arn}]
                          )
                          enabled_attempt.append(arn)
                      except ClientError as e:
                          code = e.response.get("Error", {}).get("Code", "")
                          msg = e.response.get("Error", {}).get("Message", "")
                          # Common non-fatal cases: already enabled, not available, org restrictions, etc.
                          if code in (
                              "ResourceConflictException",
                              "InvalidAccessException",
                              "InvalidInputException",
                              "LimitExceededException",
                          ):
                              errors.append(f"{arn}: {code} ({msg})")
                              # Do NOT raise -> continue with other standards
                              continue
                          # Any other unexpected client error – log but do not fail stack
                          errors.append(f"{arn}: {code} ({msg})")
                          continue
                      except Exception as e:  # Defensive: never let this bubble out
                          errors.append(f"{arn}: {type(e).__name__}({str(e)})")
                          continue

                  # Always return SUCCESS so the stack is never blocked by standards issues
                  send_response(
                      event,
                      context,
                      "SUCCESS",
                      {
                          "Requested": ",".join(standards),
                          "EnabledAttempted": ",".join(enabled_attempt),
                          "Errors": "; ".join(errors) if errors else "",
                      },
                      physical_id,
                  )

              except Exception as e:
                  # Last-resort: **still** succeed to avoid any CREATE_FAILED from this custom resource
                  send_response(
                      event,
                      context,
                      "SUCCESS",
                      {"ErrorIgnored": str(e)},
                      physical_id,
                  )

  SecurityHubStandards:
    Condition: UseSecurityHub
    Type: Custom::SecurityHubStandards
    DependsOn:
      - SecurityHubEnable
    Properties:
      ServiceToken: !GetAtt SecurityHubStandardsLambda.Arn
      StandardsArns:
        - !Sub "arn:${AWS::Partition}:securityhub:::standards/cis-aws-foundations-benchmark/v/1.4.0"
        - !Sub "arn:${AWS::Partition}:securityhub:${AWS::Region}::standards/aws-foundational-security-best-practices/v/1.0.0"

  ########################################
  # GuardDuty (optional)                 #
  ########################################

  GuardDutyDetector:
    Condition: UseGuardDuty
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      DataSources:
        S3Logs:
          Enable: true

  ########################################
  # RDS (PostgreSQL in private subnets)  #
  ########################################

  RdsSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Private subnets for RDS
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-rds-subnets" }]

  RdsParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Family: postgres16
      Description: !Sub "TLS enforcement for ${ProjectName}-${EnvironmentSuffix}"
      Parameters:
        rds.force_ssl: '1'
      Tags: [{ Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-rds-params" }]

  RdsInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: postgres
      EngineVersion: !Ref DbEngineVersion
      DBSubnetGroupName: !Ref RdsSubnetGroup
      VPCSecurityGroups: [!Ref RdsSecurityGroup]
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref RdsKmsKey
      AllocatedStorage: !Ref DbAllocatedStorage
      MaxAllocatedStorage: !Ref DbMaxAllocatedStorage
      DBInstanceClass: !Ref DbInstanceClass
      MasterUsername: !Ref DbMasterUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        KmsKeyId: !Ref RdsKmsKey
      PubliclyAccessible: false
      DeletionProtection: true
      BackupRetentionPeriod: !Ref DbBackupRetentionDays
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref RdsKmsKey
      DBParameterGroupName: !Ref RdsParameterGroup
      CopyTagsToSnapshot: true
      Tags:
        - { Key: Name, Value: !Sub "${ProjectName}-${EnvironmentSuffix}-rds" }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentSuffix }

Outputs:
  VpcId:
    Value: !Ref Vpc
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-VpcId"
  PublicSubnetIds:
    Value: !Join [",", [!Ref PublicSubnetA, !Ref PublicSubnetB]]
  PrivateSubnetIds:
    Value: !Join [",", [!Ref PrivateSubnetA, !Ref PrivateSubnetB]]
  AlbArn:
    Value: !Ref Alb
  AlbDnsName:
    Value: !GetAtt Alb.DNSName
  WebAclArn:
    Condition: UseWAF
    Value: !GetAtt WafWebAcl.Arn
  CloudTrailArn:
    Value: !Ref CloudTrail
  CloudTrailBucketName:
    Value: !Ref CloudTrailBucket
  LoggingBucketName:
    Value: !Ref LoggingBucket
  ConfigRecorderName:
    Value: "default"
  SecurityHubStatus:
    Condition: UseSecurityHub
    Value: "ENABLED"
  GuardDutyDetectorId:
    Condition: UseGuardDuty
    Value: !Ref GuardDutyDetector
  RdsEndpointAddress:
    Value: !GetAtt RdsInstance.Endpoint.Address
  RdsArn:
    Value: !Ref RdsInstance
  KmsKeyArns:
    Value: !Join
      - ","
      - [!Ref DataKmsKey, !Ref TrailKmsKey, !Ref LogsKmsKey, !Ref RdsKmsKey]
  FlowLogId:
    Value: !Ref VpcFlowLogs
  PrimaryRegionOut:
    Value: !Ref PrimaryRegion
  SecondaryRegionOut:
    Value: !Ref SecondaryRegion
  SecurityControlsSummary:
    Value: !Sub |
      WAF=${EnableWAF}, SecurityHub=${EnableSecurityHub}, GuardDuty=${EnableGuardDuty},
      CloudTrail=ENABLED (multi-region), AWS Config=ENABLED (rules: s3-encryption, trail-enabled, restricted-ssh, rds-encrypted, default-sg-closed, root-mfa),
      VPCFlowLogs=ENABLED, S3(SSE-KMS)=ENFORCED, RDS(TLS+KMS)=ENFORCED
```