# Ideal\_response.md

## Goal

Produce a single **CloudFormation** template named **TapStack.yml** (YAML) for **us-east-1** that stands up a brand-new, secure baseline stack. It must **not** reference any pre-existing resources and must pass both:

* `aws cloudformation validate-template`
* `cfn-lint` (for us-east-1)

## What the ideal response contains (no extra commentary, just YAML in the final deliverable)

A fully realized **TapStack.yml** with these sections and behaviors:

### Global qualities

* Consistent tagging on all taggable resources: `Project=TapStack`, `Environment`, `Owner`, `CostCenter`.
* **Least privilege**: tight IAM inline policies scoped only to in-stack ARNs; AWS managed policies used only where appropriate (e.g., SSM core).
* **Security by default**:

  * S3 buckets use **SSE-KMS** with the in-stack CMK; TLS enforced via `aws:SecureTransport`.
  * EBS volumes encrypted (no explicit `KmsKeyId` in the LT to avoid CMK readiness races).
  * VPC interface endpoints ensure private TLS access to AWS services.
* **No region-unsupported resource types**; names and IDs respect service constraints (e.g., S3 DNS rules).
* **No AWS Config resources** (per the updated prompt removing “delivery channel” and all Config pieces).
* **No ACM/HTTPS** listeners; ALB is HTTP-only by design.

### Parameters

* `ProjectName` (lowercase, DNS-safe), `EnvironmentName` (`dev|staging|prod`), `Owner`, `CostCenter`.
* `AllowedIngressCIDRForAlbHttp` (default `0.0.0.0/0`, IPv4 CIDR pattern).
* `InstanceType`, `MinCapacity`, `MaxCapacity`, `AppPort` (default 8080), `LogRetentionDays` (sane allowed values).
* Optional toggle: `EnableGuardDuty` (`true|false`).

### Mappings & Conditions

* AZ mapping for `us-east-1` with two distinct AZs.
* `IsProd` condition to tune lifecycle/retention.
* `CreateGuardDuty` condition driven by `EnableGuardDuty`.

### KMS

* One CMK with alias like `alias/tapstack-kms`.
* Key policy granting:

  * Root account full admin
  * **CloudTrail** usage (generate data keys / decrypt as required)
  * **CloudWatch Logs** usage for encryption
* Key rotation enabled.

### S3 Buckets (all new; public access blocked)

* **access-logs** bucket (SSE-KMS, versioning, TLS-only, lifecycle ok).
* **trail-logs** bucket (SSE-KMS, versioning, Object Ownership set appropriately, lifecycle transitions + expiration, **server access logging to the access-logs bucket**, TLS-only, deny unencrypted puts, allow CloudTrail principal per AWS sample policy).
* **lambda-artifacts** bucket (SSE-KMS, versioning, TLS-only).

### Networking

* New VPC `10.0.0.0/16`.
* Two **public** and two **private** subnets across distinct AZs.
* IGW attached.
* One NAT Gateway in a public subnet; private route tables default route via NAT; public route tables default route to IGW.
* **VPC Endpoints**:

  * Gateway: **S3** (policy scoped to the buckets in this stack).
  * Interface: **KMS**, **CloudWatch Logs**, **SSM**, **EC2 Messages** (restricted SG and least-privilege policies).

### Security Groups

* **ALB SG**: inbound TCP/80 from `AllowedIngressCIDRForAlbHttp`; egress to app port within VPC (and minimal web egress if necessary).
* **EC2 SG**: inbound only from ALB SG on `AppPort`; **no SSH**; egress limited to HTTPS (0.0.0.0/0) and to interface endpoints.
* **Lambda SG**: no inbound; egress minimal (HTTPS to interface endpoints).

### ALB & Target Group

* ALB in public subnets, HTTP:80 listener forwarding to target group.
* Target group for **instance** targets on `AppPort` with health checks (`/health`).

### WAFv2

* Regional WebACL enabling AWS Managed rule groups:

  * CommonRuleSet
  * KnownBadInputs
  * AmazonIpReputationList
  * AnonymousIpList
* Association resource binding WebACL to the ALB.

### EC2 (Private, via SSM)

* **Launch Template**:

  * Latest AL2023 AMI via SSM parameter reference.
  * Instance type param, **no key pair**.
  * Encrypted gp3 root EBS, but **no explicit `KmsKeyId`**.
  * Instance profile/role:

    * `AmazonSSMManagedInstanceCore`
    * Minimal CloudWatch Logs permissions (only the specific log group ARN).
    * Optional read to a **specific prefix** in the artifacts bucket.
  * User data runs a tiny HTTP app on `AppPort` and configures CW Agent to ship system logs.
* **Auto Scaling Group**:

  * Private subnets; min/max from params (e.g., 1/2).
  * Health check type ELB; grace period set.
  * Attached to target group.

### Lambda

* One example function (Python or Node.js):

  * Tight execution role:

    * minimal CloudWatch Logs access (function’s log group).
    * KMS decrypt/datakey for its env vars.
  * Environment encrypted with the CMK; KMS ARN set.
  * Optional VPC attachment (private subnets + Lambda SG).
  * Dedicated log group with explicit retention.

### CloudTrail

* Multi-region trail, includes global service events, **log file validation enabled**.
* Writes to **trail-logs** bucket (SSE-KMS with CMK) and to a CloudWatch Logs log group (retention set).
* CloudTrail logs role for CW Logs integration.
* S3 bucket policy includes:

  * TLS-only
  * Deny unencrypted puts
  * Allow `cloudtrail.amazonaws.com` with `bucket-owner-full-control` and `SourceArn` condition.

### GuardDuty (toggle)

* `AWS::GuardDuty::Detector` with `Enable=true` gated by `CreateGuardDuty` condition to avoid AlreadyExists errors.

### CloudWatch

* Log groups with retention for:

  * EC2 app/system logs (used by CW Agent)
  * Lambda function
  * CloudTrail integration

### IAM (explicit roles)

* **EC2InstanceRole**, **LambdaExecutionRole**, **CloudTrailLogsRole**; all least-privilege and scoped to in-stack ARNs (S3 buckets, log groups, KMS key).

### Outputs (useful and complete)

* VPCId, PublicSubnetIds, PrivateSubnetIds
* AlbArn, AlbDnsName, AlbSecurityGroupId, TargetGroupArn
* WebAclArn
* Ec2AutoScalingGroupName, Ec2InstanceProfileArn
* LambdaFunctionName, LambdaFunctionArn, LambdaLogGroupName
* TrailName, TrailArn, CloudTrailLogGroupArn
* GuardDutyDetectorId (when created)
* KmsKeyArn
* Bucket names/ARNs for: trail-logs, access-logs, lambda-artifacts
* VPC Endpoint IDs (S3/KMS/Logs/SSM/EC2Messages)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Secure baseline infrastructure with KMS, VPC, ALB, WAF, EC2, Lambda, CloudTrail, and optional GuardDuty (us-east-1)'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: "Project Configuration" }
        Parameters: [ProjectName, EnvironmentName, Owner, CostCenter]
      - Label: { default: "Network Configuration" }
        Parameters: [AllowedIngressCIDRForAlbHttp]
      - Label: { default: "Compute Configuration" }
        Parameters: [InstanceType, MinCapacity, MaxCapacity, AppPort]
      - Label: { default: "Logging & Security" }
        Parameters: [LogRetentionDays, EnableGuardDuty]

Parameters:
  ProjectName:
    Type: String
    Default: 'tapstack'
    Description: 'Lowercase project name used in resource names (must be DNS-safe for S3 buckets)'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*$'
    MaxLength: 32
  EnvironmentName:
    Type: String
    Default: 'dev'
    Description: 'Environment name'
    AllowedValues: ['dev','staging','prod']
  Owner:
    Type: String
    Default: 'devops'
    Description: 'Resource owner for tagging'
    MaxLength: 64
  CostCenter:
    Type: String
    Default: 'engineering'
    Description: 'Cost center for billing'
    MaxLength: 64
  AllowedIngressCIDRForAlbHttp:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed to access ALB HTTP port'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$'
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues: ['t3.micro','t3.small','t3.medium','t3.large']
  MinCapacity:
    Type: Number
    Default: 1
    Description: 'Minimum number of EC2 instances'
    MinValue: 1
    MaxValue: 10
  MaxCapacity:
    Type: Number
    Default: 2
    Description: 'Maximum number of EC2 instances'
    MinValue: 1
    MaxValue: 10
  AppPort:
    Type: Number
    Default: 8080
    Description: 'Application port for EC2 instances'
    MinValue: 1024
    MaxValue: 65535
  LogRetentionDays:
    Type: Number
    Default: 30
    Description: 'CloudWatch log retention in days'
    AllowedValues: [1,3,5,7,14,30,60,90,120,150,180,365,400,545,731,1827,3653]
  EnableGuardDuty:
    Type: String
    Default: 'false'
    AllowedValues: ['true','false']
    Description: 'Create a GuardDuty detector in this region (one per account/region). Set true only if none exists.'

Mappings:
  AZMapping:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b

Conditions:
  IsProd: !Equals [!Ref EnvironmentName, 'prod']
  CreateGuardDuty: !Equals [!Ref EnableGuardDuty, 'true']

Resources:
  # ---------------------- KMS ----------------------
  TapStackKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${ProjectName} customer-managed KMS key for data-at-rest encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableIAMUserPermissions
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCloudTrail
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: ['kms:GenerateDataKey*','kms:DescribeKey','kms:Decrypt']
            Resource: '*'
          - Sid: AllowCloudWatchLogs
            Effect: Allow
            Principal: { Service: !Sub 'logs.${AWS::Region}.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  TapStackKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-kms'
      TargetKeyId: !Ref TapStackKMSKey

  # ---------------------- S3 Buckets ----------------------
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration: { Status: Enabled }
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerPreferred }]
      LifecycleConfiguration:
        Rules:
          - Id: 'delete-old-access-logs'
            Status: Enabled
            ExpirationInDays: !If [IsProd, 2557, 90]
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  TrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-trail-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration: { Status: Enabled }
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerPreferred }]
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'trail-logs-access/'
      LifecycleConfiguration:
        Rules:
          - Id: 'transition-and-delete-logs'
            Status: Enabled
            Transitions:
              - { TransitionInDays: 30, StorageClass: STANDARD_IA }
              - { TransitionInDays: 90, StorageClass: GLACIER }
            ExpirationInDays: !If [IsProd, 2557, 365]
            NoncurrentVersionTransitions:
              - { TransitionInDays: 30, StorageClass: STANDARD_IA }
            NoncurrentVersionExpirationInDays: 365
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  TrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyInsecureConnections'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TrailLogsBucket.Arn
              - !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              Bool: { aws:SecureTransport: false }
          - Sid: 'DenyUnEncryptedObjectUploads'
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              StringNotEquals: { s3:x-amz-server-side-encryption: 'aws:kms' }
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt TrailLogsBucket.Arn
            Condition:
              StringEquals:
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-trail'
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: 's3:PutObject'
            Resource: !Sub '${TrailLogsBucket.Arn}/cloudtrail-logs/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: 'bucket-owner-full-control'
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-trail'

  LambdaArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-lambda-artifacts-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration: { Status: Enabled }
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerEnforced }]
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  LambdaArtifactsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LambdaArtifactsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyInsecureConnections'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LambdaArtifactsBucket.Arn
              - !Sub '${LambdaArtifactsBucket.Arn}/*'
            Condition:
              Bool: { aws:SecureTransport: false }

  # ---------------------- VPC & Networking ----------------------
  TapStackVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-vpc' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-igw' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref TapStackVPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-subnet-1' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-subnet-2' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.10.0/24'
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-subnet-1' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.11.0/24'
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-subnet-2' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-eip-1' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-gateway-1' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-rt' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: { RouteTableId: !Ref PublicRouteTable, SubnetId: !Ref PublicSubnet1 }

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: { RouteTableId: !Ref PublicRouteTable, SubnetId: !Ref PublicSubnet2 }

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-rt-1' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: { RouteTableId: !Ref PrivateRouteTable1, SubnetId: !Ref PrivateSubnet1 }

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-rt-2' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: { RouteTableId: !Ref PrivateRouteTable2, SubnetId: !Ref PrivateSubnet2 }

  # ---------------------- VPC Endpoints ----------------------
  VpcEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for VPC interface endpoints'
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: '10.0.0.0/16', Description: 'HTTPS from VPC CIDR' }
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: '0.0.0.0/0', Description: 'All outbound' }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-vpc-endpoint-sg' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  S3GatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds: [!Ref PrivateRouteTable1, !Ref PrivateRouteTable2]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: ['s3:*']
            Resource:
              - !GetAtt TrailLogsBucket.Arn
              - !Sub '${TrailLogsBucket.Arn}/*'
              - !GetAtt LambdaArtifactsBucket.Arn
              - !Sub '${LambdaArtifactsBucket.Arn}/*'
              - !GetAtt AccessLogsBucket.Arn
              - !Sub '${AccessLogsBucket.Arn}/*'

  KmsInterfaceEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref VpcEndpointSecurityGroup]

  LogsInterfaceEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref VpcEndpointSecurityGroup]

  SsmInterfaceEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref VpcEndpointSecurityGroup]

  SsmMessagesInterfaceEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref VpcEndpointSecurityGroup]

  Ec2MessagesInterfaceEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref VpcEndpointSecurityGroup]

  # ---------------------- Security Groups ----------------------
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIp: !Ref AllowedIngressCIDRForAlbHttp, Description: 'HTTP access from allowed CIDR' }
      SecurityGroupEgress:
        - { IpProtocol: tcp, FromPort: !Ref AppPort, ToPort: !Ref AppPort, CidrIp: '10.0.0.0/16', Description: 'App port to targets in VPC' }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-alb-sg' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances (no SSH)'
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: !Ref AppPort, ToPort: !Ref AppPort, CidrIp: '10.0.0.0/16', Description: 'App port from VPC' }
      SecurityGroupEgress:
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0', Description: 'HTTPS to internet for updates' }
        - { IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0', Description: 'HTTP to internet for updates' }
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, DestinationSecurityGroupId: !Ref VpcEndpointSecurityGroup, Description: 'HTTPS to VPC endpoints' }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-ec2-sg' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref TapStackVPC
      SecurityGroupEgress:
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, DestinationSecurityGroupId: !Ref VpcEndpointSecurityGroup, Description: 'HTTPS to VPC endpoints' }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-lambda-sg' }
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  # ---------------------- ALB ----------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      SecurityGroups: [!Ref ALBSecurityGroup]
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: !Ref AppPort
      Protocol: HTTP
      VpcId: !Ref TapStackVPC
      HealthCheckPath: '/health'
      HealthCheckProtocol: HTTP
      HealthCheckPort: !Ref AppPort
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions: [{ Type: forward, TargetGroupArn: !Ref ALBTargetGroup }]
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ---------------------- WAFv2 ----------------------
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-webacl'
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      Rules:
        - Name: 'AWSManagedRulesCommonRuleSet'
          Priority: 1
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesCommonRuleSet }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: 'CommonRuleSetMetric' }
        - Name: 'AWSManagedRulesKnownBadInputsRuleSet'
          Priority: 2
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesKnownBadInputsRuleSet }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: 'KnownBadInputsMetric' }
        - Name: 'AWSManagedRulesAmazonIpReputationList'
          Priority: 3
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesAmazonIpReputationList }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: 'IpReputationMetric' }
        - Name: 'AWSManagedRulesAnonymousIpList'
          Priority: 4
          OverrideAction: { None: {} }
          Statement:
            ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesAnonymousIpList }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: 'AnonymousIpMetric' }
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}WebACL'
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    DependsOn: ALBListener
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ---------------------- IAM ----------------------
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - { Effect: Allow, Principal: { Service: ec2.amazonaws.com }, Action: 'sts:AssumeRole' }
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: 'ec2-cw-logs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents','logs:DescribeLogGroups','logs:DescribeLogStreams']
                Resource: [!Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}*']
        - PolicyName: 'ec2-s3-artifacts-read'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['s3:GetObject']
                Resource: [!Sub '${LambdaArtifactsBucket.Arn}/ec2/*']
        - PolicyName: 'ec2-kms-access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - { Effect: Allow, Action: ['kms:Decrypt','kms:GenerateDataKey'], Resource: !GetAtt TapStackKMSKey.Arn }
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-ec2-profile'
      Roles: [!Ref EC2InstanceRole]

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - { Effect: Allow, Principal: { Service: lambda.amazonaws.com }, Action: 'sts:AssumeRole' }
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: 'lambda-cw-logs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - { Effect: Allow, Action: ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents'], Resource: [!Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}*'] }
        - PolicyName: 'lambda-kms-access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - { Effect: Allow, Action: ['kms:Decrypt','kms:GenerateDataKey'], Resource: !GetAtt TapStackKMSKey.Arn }
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  CloudTrailLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-cloudtrail-logs-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - { Effect: Allow, Principal: { Service: cloudtrail.amazonaws.com }, Action: 'sts:AssumeRole' }
      Policies:
        - PolicyName: 'cloudtrail-to-cw-logs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['logs:CreateLogStream','logs:PutLogEvents']
                Resource:
                  - !GetAtt CloudTrailLogGroup.Arn
                  - !Sub '${CloudTrailLogGroup.Arn}:log-stream:*'
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  # ---------------------- EC2 LT & ASG ----------------------
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-lt'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile: { Arn: !GetAtt EC2InstanceProfile.Arn }
        SecurityGroupIds: [!Ref EC2SecurityGroup]
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeSize: 8
              VolumeType: gp3
              Encrypted: true
              # No KmsKeyId here; EC2 will use the default EBS KMS key automatically
        MetadataOptions: { HttpTokens: required, HttpEndpoint: enabled }
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent python3
            cat > /home/ec2-user/app.py << 'EOF'
            #!/usr/bin/env python3
            from http.server import HTTPServer, BaseHTTPRequestHandler
            import json, time
            class Handler(BaseHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/health':
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status':'healthy','ts':time.time()}).encode())
                    else:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(b'<h1>TapStack App</h1>')
            if __name__ == '__main__':
                HTTPServer(('0.0.0.0', ${AppPort}), Handler).serve_forever()
            EOF
            chmod +x /home/ec2-user/app.py
            cat > /etc/systemd/system/tapstack-app.service << 'EOF'
            [Unit]
            Description=TapStack Application Server
            After=network.target
            [Service]
            Type=simple
            User=ec2-user
            ExecStart=/usr/bin/python3 /home/ec2-user/app.py
            Restart=always
            [Install]
            WantedBy=multi-user.target
            EOF
            systemctl enable tapstack-app
            systemctl start tapstack-app
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${ProjectName}",
                        "log_stream_name": "{instance_id}/system"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name, Value: !Sub '${ProjectName}-instance' }
              - { Key: Project, Value: !Ref ProjectName }
              - { Key: Environment, Value: !Ref EnvironmentName }
              - { Key: Owner, Value: !Ref Owner }
              - { Key: CostCenter, Value: !Ref CostCenter }

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinCapacity
      MaxSize: !Ref MaxCapacity
      DesiredCapacity: !Ref MinCapacity
      VPCZoneIdentifier: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      TargetGroupARNs: [!Ref ALBTargetGroup]
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-asg', PropagateAtLaunch: false }
        - { Key: Project, Value: !Ref ProjectName, PropagateAtLaunch: true }
        - { Key: Environment, Value: !Ref EnvironmentName, PropagateAtLaunch: true }
        - { Key: Owner, Value: !Ref Owner, PropagateAtLaunch: true }
        - { Key: CostCenter, Value: !Ref CostCenter, PropagateAtLaunch: true }

  # ---------------------- Lambda ----------------------
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-function'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-function'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      VpcConfig:
        SecurityGroupIds: [!Ref LambdaSecurityGroup]
        SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      Environment:
        Variables:
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT: !Ref EnvironmentName
          KMS_KEY_ID: !Ref TapStackKMSKey
      KmsKeyArn: !GetAtt TapStackKMSKey.Arn
      Code:
        ZipFile: |
          import json, os, logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          def lambda_handler(event, context):
              logger.info("event: %s", json.dumps(event))
              return {"statusCode": 200, "body": json.dumps({"message": f"Hello from {os.environ.get('PROJECT_NAME')} Lambda", "environment": os.environ.get('ENVIRONMENT')})}
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  # ---------------------- CloudWatch Log Groups ----------------------
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}'
      RetentionInDays: !If [IsProd, 365, !Ref LogRetentionDays]
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  # ---------------------- CloudTrail ----------------------
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: TrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-trail'
      S3BucketName: !Ref TrailLogsBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - { ReadWriteType: All, IncludeManagementEvents: true }
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogsRole.Arn
      KMSKeyId: !Ref TapStackKMSKey
      IsLogging: true
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

  # ---------------------- GuardDuty (optional) ----------------------
  GuardDutyDetector:
    Condition: CreateGuardDuty
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - { Key: Project, Value: !Ref ProjectName }
        - { Key: Environment, Value: !Ref EnvironmentName }
        - { Key: Owner, Value: !Ref Owner }
        - { Key: CostCenter, Value: !Ref CostCenter }

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref TapStackVPC
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpc-id' }
  PublicSubnetIds:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-public-subnet-ids' }
  PrivateSubnetIds:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-private-subnet-ids' }
  AlbArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-alb-arn' }
  AlbDnsName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-alb-dns' }
  AlbSecurityGroupId:
    Description: 'ALB Security Group ID'
    Value: !Ref ALBSecurityGroup
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-alb-sg-id' }
  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref ALBTargetGroup
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-tg-arn' }
  WebAclArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-webacl-arn' }
  Ec2AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-asg-name' }
  Ec2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-ec2-profile-arn' }
  LambdaFunctionName:
    Description: 'Lambda function name'
    Value: !Ref LambdaFunction
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-lambda-name' }
  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt LambdaFunction.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-lambda-arn' }
  LambdaLogGroupName:
    Description: 'Lambda log group name'
    Value: !Ref LambdaLogGroup
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-lambda-loggroup' }
  TrailName:
    Description: 'CloudTrail name'
    Value: !Ref CloudTrail
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-trail-name' }
  TrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-trail-arn' }
  CloudTrailLogGroupArn:
    Description: 'CloudTrail CloudWatch Log Group ARN'
    Value: !GetAtt CloudTrailLogGroup.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-trail-loggroup-arn' }
  KmsKeyArn:
    Description: 'KMS key ARN'
    Value: !GetAtt TapStackKMSKey.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-kms-arn' }
  AccessLogsBucketName:
    Description: 'Access logs bucket name'
    Value: !Ref AccessLogsBucket
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-access-logs-bucket' }
  TrailLogsBucketName:
    Description: 'CloudTrail logs bucket name'
    Value: !Ref TrailLogsBucket
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-trail-logs-bucket' }
  LambdaArtifactsBucketName:
    Description: 'Lambda artifacts bucket name'
    Value: !Ref LambdaArtifactsBucket
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-lambda-artifacts-bucket' }
  S3GatewayEndpointId:
    Description: 'S3 Gateway Endpoint ID'
    Value: !Ref S3GatewayEndpoint
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpce-s3' }
  KmsInterfaceEndpointId:
    Description: 'KMS Interface Endpoint ID'
    Value: !Ref KmsInterfaceEndpoint
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpce-kms' }
  LogsInterfaceEndpointId:
    Description: 'Logs Interface Endpoint ID'
    Value: !Ref LogsInterfaceEndpoint
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpce-logs' }
  SsmInterfaceEndpointId:
    Description: 'SSM Interface Endpoint ID'
    Value: !Ref SsmInterfaceEndpoint
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpce-ssm' }
  Ec2MessagesInterfaceEndpointId:
    Description: 'EC2 Messages Interface Endpoint ID'
    Value: !Ref Ec2MessagesInterfaceEndpoint
    Export: { Name: !Sub '${ProjectName}-${EnvironmentName}-vpce-ec2messages' }
```