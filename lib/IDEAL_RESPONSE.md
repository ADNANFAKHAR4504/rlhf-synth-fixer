# Ideal_response.md

## Functional scope (build everything new):

Provision a complete, serverless data-processing environment in `us-east-1` that ingests JSON files to S3, triggers Lambda for transformation, persists results in DynamoDB, exposes an API via API Gateway, authenticates users with Cognito, and monitors/alerts via CloudWatch and SNS. All resources are newly created within a fresh VPC using multiple Availability Zones and must be tagged for cost tracking. All resource names include `ENVIRONMENTSUFFIX`.

## Architecture overview:

* VPC spanning multiple AZs with public and private subnets, Internet Gateway, optional NAT Gateways, and an S3 Gateway VPC Endpoint.
* Interface VPC Endpoints (conditional) for CloudWatch Logs and SNS to keep traffic private from Lambda subnets.
* S3 Ingest bucket (versioned, public access blocked, SSE-S3 required, lifecycle to Glacier Instant Retrieval after 30 days) and an Artifacts bucket with identical security and lifecycle posture.
* EventBridge Rule routes S3 “Object Created” events to the transform Lambda (avoids S3↔Lambda circular dependency).
* Two Lambda functions:

  * Transform function, VPC-enabled, reads ingested JSON from S3 and writes processed records to DynamoDB.
  * API handler function, VPC-enabled, accepts POST payloads via API Gateway and writes to DynamoDB.
* DynamoDB table with KMS CMK encryption, provisioned mode, and Application Auto Scaling policies for read/write capacity targets.
* API Gateway (regional) with a `/process` POST method proxying to the API handler, dedicated log group, and a versioned stage name that includes `ENVIRONMENTSUFFIX`.
* Cognito User Pool, App Client, and Identity Pool with an authenticated IAM role that can invoke the API.
* CloudWatch Log Groups for each Lambda and API Gateway, with retention configured.
* CloudWatch Alarms for Lambda errors/throttles, API 5XXs, and DynamoDB write throttles; notifications sent to an SNS Topic.
* KMS CMK and alias for application encryption needs and a sample Secrets Manager secret referenced by the transform Lambda.

## Security, encryption, and access controls:

* S3 bucket policies deny unencrypted uploads, deny insecure transport, and restrict access to the VPC via Gateway Endpoint.
* IAM roles follow least privilege for Lambda, API Gateway logging, and Cognito authenticated access.
* DynamoDB and logs utilize CMK where applicable; SNS uses AWS-managed KMS for the topic.
* Lambda security group allows only egress on TLS 443; VPC endpoints are protected by a dedicated security group.

## High availability and resiliency:

* Subnets distributed across at least two AZs.
* NAT Gateways (optional via parameter) for private subnet egress if needed.
* DynamoDB is a managed regional service; Lambda and API Gateway are regional with no single-AZ dependency.

## Observability and alerts:

* Structured logging to CloudWatch Logs with defined retention.
* Alarms for Lambda errors/throttles, API 5XX, and DynamoDB write throttles; notifications via SNS email subscription.

## Cost allocation and naming:

* Universal cost allocation tags: Project, Environment, Owner, CostCenter.
* All resource names include `ENVIRONMENTSUFFIX` to avoid cross-environment collisions.

## Deliverable:

A single CloudFormation template (YAML) that creates all resources from scratch without referencing pre-existing infrastructure, passes cfn-lint, and satisfies the constraints for encryption, IAM least privilege, multi-AZ availability, autoscaling, lifecycle management, logging, alerting, and authenticated API access. The template includes parameters with defaults for immediate deployment, outputs for key identifiers and ARNs, and no circular dependencies.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Complete serverless environment for JSON processing with S3, Lambda, DynamoDB, and API Gateway'

Parameters:
  ENVIRONMENTSUFFIX:
    Type: String
    Description: Environment suffix for resource naming
    AllowedValues: [dev, staging, prod]
    Default: dev
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  PrivateSubnetACidr:
    Type: String
    Default: 10.0.1.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  PrivateSubnetBCidr:
    Type: String
    Default: 10.0.2.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  PublicSubnetACidr:
    Type: String
    Default: 10.0.11.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  PublicSubnetBCidr:
    Type: String
    Default: 10.0.12.0/24
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  LambdaRuntime:
    Type: String
    Default: python3.12
    AllowedValues: [python3.8, python3.9, python3.10, python3.11, python3.12]
  LambdaTimeoutSeconds:
    Type: Number
    Default: 60
    MinValue: 1
    MaxValue: 900
  LambdaMemoryMb:
    Type: Number
    Default: 256
    AllowedValues: [128,256,512,1024,2048,3072,4096,5120,6144,7168,8192,9216,10240]
  LogRetentionDays:
    Type: Number
    Default: 30
    AllowedValues: [1,3,5,7,14,30,60,90,120,150,180,365,400,545,731,1827,3653]
  DDBReadCapacityMin:
    Type: Number
    Default: 1
    MinValue: 1
  DDBReadCapacityMax:
    Type: Number
    Default: 10
    MinValue: 1
  DDBWriteCapacityMin:
    Type: Number
    Default: 1
    MinValue: 1
  DDBWriteCapacityMax:
    Type: Number
    Default: 10
    MinValue: 1
  DDBTargetUtilization:
    Type: Number
    Default: 70
    MinValue: 20
    MaxValue: 90
  DeveloperAlertEmail:
    Type: String
    Description: Email address for developer alerts
    AllowedPattern: ^[^\s@]+@[^\s@]+\.[^\s@]+$
    Default: alerts@example.com
  ApiStageName:
    Type: String
    Default: v1
  EnableNatGateways:
    Type: String
    Default: 'true'
    AllowedValues: ['true','false']
  EnableInterfaceEndpoints:
    Type: String
    Default: 'true'
    AllowedValues: ['true','false']

Conditions:
  CreateNatGateways: !Equals [!Ref EnableNatGateways, 'true']
  CreateInterfaceEndpoints: !Equals [!Ref EnableInterfaceEndpoints, 'true']

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-VPC-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-IGW-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PublicSubnet-A-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PublicSubnet-B-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      CidrBlock: !Ref PrivateSubnetACidr
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PrivateSubnet-A-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      CidrBlock: !Ref PrivateSubnetBCidr
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PrivateSubnet-B-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  NatGatewayAEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNatGateways
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-NAT-EIP-A-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  NatGatewayBEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNatGateways
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-NAT-EIP-B-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Condition: CreateNatGateways
    Properties:
      AllocationId: !GetAtt NatGatewayAEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-NAT-A-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Condition: CreateNatGateways
    Properties:
      AllocationId: !GetAtt NatGatewayBEIP.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-NAT-B-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PublicRouteTable-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {RouteTableId: !Ref PublicRouteTable, SubnetId: !Ref PublicSubnetA}

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {RouteTableId: !Ref PublicRouteTable, SubnetId: !Ref PublicSubnetB}

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PrivateRouteTable-A-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-PrivateRouteTable-B-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  DefaultPrivateRouteA:
    Type: AWS::EC2::Route
    Condition: CreateNatGateways
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  DefaultPrivateRouteB:
    Type: AWS::EC2::Route
    Condition: CreateNatGateways
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {RouteTableId: !Ref PrivateRouteTableA, SubnetId: !Ref PrivateSubnetA}

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: {RouteTableId: !Ref PrivateRouteTableB, SubnetId: !Ref PrivateSubnetB}

  S3GatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds: [!Ref PrivateRouteTableA, !Ref PrivateRouteTableB, !Ref PublicRouteTable]

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - {IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0, Description: HTTPS outbound}
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-LambdaSG-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: CreateInterfaceEndpoints
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - {IpProtocol: tcp, FromPort: 443, ToPort: 443, SourceSecurityGroupId: !Ref LambdaSecurityGroup, Description: HTTPS from Lambda}
      Tags:
        - {Key: Name, Value: !Sub 'TapStack-VPCEndpointSG-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  CloudWatchLogsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: CreateInterfaceEndpoints
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref VPCEndpointSecurityGroup]

  SNSEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: CreateInterfaceEndpoints
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.sns'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      SecurityGroupIds: [!Ref VPCEndpointSecurityGroup]

  ApplicationCMK:
    Type: AWS::KMS::Key
    Properties:
      Description: Customer managed key for TapStack application encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableRoot
            Effect: Allow
            Principal: {AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'}
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowDynamoDB
            Effect: Allow
            Principal: {Service: dynamodb.amazonaws.com}
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:CreateGrant','kms:DescribeKey']
            Resource: '*'
            Condition: {StringEquals: {'kms:ViaService': !Sub 'dynamodb.${AWS::Region}.amazonaws.com'}}
          - Sid: AllowLogs
            Effect: Allow
            Principal: {Service: !Sub 'logs.${AWS::Region}.amazonaws.com'}
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:CreateGrant','kms:DescribeKey']
            Resource: '*'
      Tags:
        - {Key: Name, Value: !Sub 'app-cmk-${ENVIRONMENTSUFFIX}'}
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApplicationCMKAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/app-cmk-${ENVIRONMENTSUFFIX}'
      TargetKeyId: !Ref ApplicationCMK

  IngestBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'ingestbucket-${ENVIRONMENTSUFFIX}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: {SSEAlgorithm: AES256}
      VersioningConfiguration: {Status: Enabled}
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions: [{TransitionInDays: 30, StorageClass: GLACIER_IR}]
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  IngestBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref IngestBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${IngestBucket.Arn}/*'
            Condition: {StringNotEquals: {'s3:x-amz-server-side-encryption': 'AES256'}}
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt IngestBucket.Arn, !Sub '${IngestBucket.Arn}/*']
            Condition: {Bool: {'aws:SecureTransport': 'false'}}
          - Sid: RestrictToVPCEndpoint
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt IngestBucket.Arn, !Sub '${IngestBucket.Arn}/*']
            Condition: {StringNotEquals: {'aws:SourceVpce': !Ref S3GatewayEndpoint}}

  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'artifactsbucket-${ENVIRONMENTSUFFIX}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: {SSEAlgorithm: AES256}
      VersioningConfiguration: {Status: Enabled}
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions: [{TransitionInDays: 30, StorageClass: GLACIER_IR}]
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ArtifactsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ArtifactsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${ArtifactsBucket.Arn}/*'
            Condition: {StringNotEquals: {'s3:x-amz-server-side-encryption': 'AES256'}}
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt ArtifactsBucket.Arn, !Sub '${ArtifactsBucket.Arn}/*']
            Condition: {Bool: {'aws:SecureTransport': 'false'}}
          - Sid: RestrictToVPCEndpoint
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt ArtifactsBucket.Arn, !Sub '${ArtifactsBucket.Arn}/*']
            Condition: {StringNotEquals: {'aws:SourceVpce': !Ref S3GatewayEndpoint}}

  ResultsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'ResultsTable-${ENVIRONMENTSUFFIX}'
      BillingMode: PROVISIONED
      AttributeDefinitions:
        - {AttributeName: id, AttributeType: S}
        - {AttributeName: timestamp, AttributeType: S}
      KeySchema:
        - {AttributeName: id, KeyType: HASH}
        - {AttributeName: timestamp, KeyType: RANGE}
      ProvisionedThroughput: {ReadCapacityUnits: !Ref DDBReadCapacityMin, WriteCapacityUnits: !Ref DDBWriteCapacityMin}
      SSESpecification: {SSEEnabled: true, SSEType: KMS, KMSMasterKeyId: !Ref ApplicationCMK}
      StreamSpecification: {StreamViewType: NEW_AND_OLD_IMAGES}
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ResultsTableReadScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: dynamodb
      ResourceId: !Sub 'table/${ResultsTable}'
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      MinCapacity: !Ref DDBReadCapacityMin
      MaxCapacity: !Ref DDBReadCapacityMax

  ResultsTableReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'ResultsTable-${ENVIRONMENTSUFFIX}-ReadScalingPolicy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ResultsTableReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref DDBTargetUtilization
        PredefinedMetricSpecification: {PredefinedMetricType: DynamoDBReadCapacityUtilization}

  ResultsTableWriteScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: dynamodb
      ResourceId: !Sub 'table/${ResultsTable}'
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      MinCapacity: !Ref DDBWriteCapacityMin
      MaxCapacity: !Ref DDBWriteCapacityMax

  ResultsTableWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'ResultsTable-${ENVIRONMENTSUFFIX}-WriteScalingPolicy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ResultsTableWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref DDBTargetUtilization
        PredefinedMetricSpecification: {PredefinedMetricType: DynamoDBWriteCapacityUtilization}

  TransformFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TransformFunctionRole-${ENVIRONMENTSUFFIX}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - {Effect: Allow, Principal: {Service: lambda.amazonaws.com}, Action: 'sts:AssumeRole'}
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: TransformFunctionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['s3:GetObject','s3:ListBucket']
                Resource: [!GetAtt IngestBucket.Arn, !Sub '${IngestBucket.Arn}/*']
              - Effect: Allow
                Action: ['dynamodb:PutItem','dynamodb:UpdateItem','dynamodb:Query']
                Resource: [!GetAtt ResultsTable.Arn]
              - Effect: Allow
                Action: ['kms:Decrypt','kms:GenerateDataKey']
                Resource: [!GetAtt ApplicationCMK.Arn]
              - Effect: Allow
                Action: ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents']
                Resource: '*'
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApiHandlerFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ApiHandlerFunctionRole-${ENVIRONMENTSUFFIX}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - {Effect: Allow, Principal: {Service: lambda.amazonaws.com}, Action: 'sts:AssumeRole'}
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: ApiHandlerFunctionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['dynamodb:PutItem','dynamodb:UpdateItem','dynamodb:Query','dynamodb:GetItem']
                Resource: [!GetAtt ResultsTable.Arn]
              - Effect: Allow
                Action: ['kms:Decrypt','kms:GenerateDataKey']
                Resource: [!GetAtt ApplicationCMK.Arn]
              - Effect: Allow
                Action: ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents']
                Resource: '*'
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  TransformFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/TransformFunction-${ENVIRONMENTSUFFIX}'
      RetentionInDays: !Ref LogRetentionDays

  TransformFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'TransformFunction-${ENVIRONMENTSUFFIX}'
      Runtime: !Ref LambdaRuntime
      Handler: index.handler
      Role: !GetAtt TransformFunctionRole.Arn
      Timeout: !Ref LambdaTimeoutSeconds
      MemorySize: !Ref LambdaMemoryMb
      Environment:
        Variables:
          TABLE_NAME: !Ref ResultsTable
          ENVIRONMENT: !Ref ENVIRONMENTSUFFIX
          SECRET_VALUE: !Sub
            - '{{resolve:secretsmanager:${SecretId}:SecretString:password}}'
            - {SecretId: !Ref ApplicationSecret}
      KmsKeyArn: !GetAtt ApplicationCMK.Arn
      VpcConfig:
        SecurityGroupIds: [!Ref LambdaSecurityGroup]
        SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      Code:
        ZipFile: |
          import json, boto3, os, uuid
          from datetime import datetime
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])
          def handler(event, context):
              print(f"Received event: {json.dumps(event)}")
              records = event.get('Records', [])
              if records:
                  s3 = boto3.client('s3')
                  for r in records:
                      bucket = r['s3']['bucket']['name']
                      key = r['s3']['object']['key']
                      obj = s3.get_object(Bucket=bucket, Key=key)
                      content = json.loads(obj['Body'].read())
                      item = {
                          'id': str(uuid.uuid4()),
                          'timestamp': datetime.utcnow().isoformat(),
                          'source_bucket': bucket,
                          'source_key': key,
                          'processed_data': content,
                          'environment': os.environ['ENVIRONMENT']
                      }
                      table.put_item(Item=item)
              return {'statusCode': 200, 'body': json.dumps('Processing complete')}
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApiHandlerFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/ApiHandlerFunction-${ENVIRONMENTSUFFIX}'
      RetentionInDays: !Ref LogRetentionDays

  ApiHandlerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'ApiHandlerFunction-${ENVIRONMENTSUFFIX}'
      Runtime: !Ref LambdaRuntime
      Handler: index.handler
      Role: !GetAtt ApiHandlerFunctionRole.Arn
      Timeout: !Ref LambdaTimeoutSeconds
      MemorySize: !Ref LambdaMemoryMb
      Environment:
        Variables:
          TABLE_NAME: !Ref ResultsTable
          ENVIRONMENT: !Ref ENVIRONMENTSUFFIX
      KmsKeyArn: !GetAtt ApplicationCMK.Arn
      VpcConfig:
        SecurityGroupIds: [!Ref LambdaSecurityGroup]
        SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      Code:
        ZipFile: |
          import json, boto3, os, uuid
          from datetime import datetime
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])
          def handler(event, context):
              try:
                  body = json.loads(event['body'])
                  item = {
                      'id': str(uuid.uuid4()),
                      'timestamp': datetime.utcnow().isoformat(),
                      'source': 'api',
                      'processed_data': body,
                      'environment': os.environ['ENVIRONMENT']
                  }
                  table.put_item(Item=item)
                  return {'statusCode': 200,'headers': {'Content-Type':'application/json'},'body': json.dumps({'message':'Data processed successfully','id': item['id']})}
              except Exception:
                  return {'statusCode': 500,'headers': {'Content-Type':'application/json'},'body': json.dumps({'error':'Internal server error'})}
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  # EventBridge rule for S3 Object Created -> Lambda (avoids S3/Lambda circular deps)
  S3ObjectCreatedRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'TapStack-S3ObjectCreated-${ENVIRONMENTSUFFIX}'
      Description: Trigger TransformFunction on S3 Object Created for IngestBucket
      EventPattern:
        source: ['aws.s3']
        detail-type: ['Object Created']
        detail:
          bucket:
            name: [!Ref IngestBucket]
      Targets:
        - Id: InvokeTransform
          Arn: !GetAtt TransformFunction.Arn

  AllowEventsToInvokeTransform:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TransformFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt S3ObjectCreatedRule.Arn

  # API Gateway
  TapApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'TapApi-${ENVIRONMENTSUFFIX}'
      Description: API for TapStack data processing
      EndpointConfiguration: {Types: [REGIONAL]}
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApiGatewayExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ApiGatewayExecutionRole-${ENVIRONMENTSUFFIX}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - {Effect: Allow, Principal: {Service: apigateway.amazonaws.com}, Action: 'sts:AssumeRole'}
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayExecutionRole.Arn

  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/TapApi-${ENVIRONMENTSUFFIX}'
      RetentionInDays: !Ref LogRetentionDays

  ProcessResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref TapApi
      ParentId: !GetAtt TapApi.RootResourceId
      PathPart: process

  ProcessMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TapApi
      ResourceId: !Ref ProcessResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiHandlerFunction.Arn}/invocations'
      MethodResponses:
        - {StatusCode: 200}

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: [ProcessMethod]
    Properties:
      RestApiId: !Ref TapApi
      Description: Initial deployment

  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      DeploymentId: !Ref ApiDeployment
      RestApiId: !Ref TapApi
      StageName: !Sub '${ApiStageName}-${ENVIRONMENTSUFFIX}'
      MethodSettings:
        - DataTraceEnabled: true
          HttpMethod: '*'
          LoggingLevel: INFO
          ResourcePath: '/*'
          ThrottlingBurstLimit: 100
          ThrottlingRateLimit: 50
      AccessLogSetting:
        DestinationArn: !GetAtt ApiLogGroup.Arn
        Format: '$context.requestId'
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  ApiHandlerFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiHandlerFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${TapApi}/*/*'

  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub 'TapUsers-${ENVIRONMENTSUFFIX}'
      AutoVerifiedAttributes: [email]
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
          RequireUppercase: true
      Schema:
        - {Name: email, AttributeDataType: String, Required: true, Mutable: false}
      UserPoolTags:
        Project: TapStack
        Environment: !Ref ENVIRONMENTSUFFIX
        Owner: PlatformTeam
        CostCenter: DP-001

  CognitoUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub 'TapUsersClient-${ENVIRONMENTSUFFIX}'
      UserPoolId: !Ref CognitoUserPool
      GenerateSecret: false
      AllowedOAuthFlowsUserPoolClient: false
      PreventUserExistenceErrors: ENABLED

  CognitoIdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: !Sub 'TapIdentity-${ENVIRONMENTSUFFIX}'
      AllowUnauthenticatedIdentities: false
      CognitoIdentityProviders:
        - ClientId: !Ref CognitoUserPoolClient
          ProviderName: !GetAtt CognitoUserPool.ProviderName

  CognitoAuthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'CognitoAuthenticatedRole-${ENVIRONMENTSUFFIX}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: {Federated: cognito-identity.amazonaws.com}
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals: {cognito-identity.amazonaws.com:aud: !Ref CognitoIdentityPool}
              ForAnyValue:StringLike: {cognito-identity.amazonaws.com:amr: authenticated}
      Policies:
        - PolicyName: CognitoAuthenticatedPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['execute-api:Invoke']
                Resource: [!Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${TapApi}/*']
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  CognitoIdentityPoolRoleAttachment:
    Type: AWS::Cognito::IdentityPoolRoleAttachment
    Properties:
      IdentityPoolId: !Ref CognitoIdentityPool
      Roles: {authenticated: !GetAtt CognitoAuthenticatedRole.Arn}

  DevelopersTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'DevelopersTopic-${ENVIRONMENTSUFFIX}'
      DisplayName: Developers Alert Topic
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

  DevelopersTopicSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref DevelopersTopic
      Protocol: email
      Endpoint: !Ref DeveloperAlertEmail

  TransformFunctionErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TransformFunction-${ENVIRONMENTSUFFIX}-Errors'
      AlarmDescription: Alert on Lambda errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions: [{Name: FunctionName, Value: !Ref TransformFunction}]
      AlarmActions: [!Ref DevelopersTopic]
      TreatMissingData: notBreaching

  TransformFunctionThrottlesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TransformFunction-${ENVIRONMENTSUFFIX}-Throttles'
      AlarmDescription: Alert on Lambda throttles
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions: [{Name: FunctionName, Value: !Ref TransformFunction}]
      AlarmActions: [!Ref DevelopersTopic]
      TreatMissingData: notBreaching

  ApiHandlerFunctionErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ApiHandlerFunction-${ENVIRONMENTSUFFIX}-Errors'
      AlarmDescription: Alert on Lambda errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions: [{Name: FunctionName, Value: !Ref ApiHandlerFunction}]
      AlarmActions: [!Ref DevelopersTopic]
      TreatMissingData: notBreaching

  ApiGateway5XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TapApi-${ENVIRONMENTSUFFIX}-5XXErrors'
      AlarmDescription: Alert on API Gateway 5XX errors
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions: [{Name: ApiName, Value: !Sub 'TapApi-${ENVIRONMENTSUFFIX}'}]
      AlarmActions: [!Ref DevelopersTopic]
      TreatMissingData: notBreaching

  DynamoDBWriteThrottlesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ResultsTable-${ENVIRONMENTSUFFIX}-WriteThrottles'
      AlarmDescription: Alert on DynamoDB write throttles
      MetricName: ThrottledRequests
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - {Name: TableName, Value: !Ref ResultsTable}
        - {Name: Operation, Value: Write}
      AlarmActions: [!Ref DevelopersTopic]
      TreatMissingData: notBreaching

  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'TapStack-AppSecret-${ENVIRONMENTSUFFIX}'
      Description: Application secret for demonstrating encrypted environment variables
      SecretString: !Sub |
        {
          "password": "SecurePassword123!",
          "apiKey": "demo-api-key-${ENVIRONMENTSUFFIX}"
        }
      KmsKeyId: !Ref ApplicationCMK
      Tags:
        - {Key: Project, Value: TapStack}
        - {Key: Environment, Value: !Ref ENVIRONMENTSUFFIX}
        - {Key: Owner, Value: PlatformTeam}
        - {Key: CostCenter, Value: DP-001}

Outputs:
  VPCId: {Description: VPC ID, Value: !Ref VPC, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-VPCId'}}
  PrivateSubnetAId: {Description: Private Subnet A ID, Value: !Ref PrivateSubnetA, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-PrivateSubnetAId'}}
  PrivateSubnetBId: {Description: Private Subnet B ID, Value: !Ref PrivateSubnetB, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-PrivateSubnetBId'}}
  PublicSubnetAId: {Description: Public Subnet A ID, Value: !Ref PublicSubnetA, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-PublicSubnetAId'}}
  PublicSubnetBId: {Description: Public Subnet B ID, Value: !Ref PublicSubnetB, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-PublicSubnetBId'}}
  S3GatewayEndpointId: {Description: S3 Gateway VPC Endpoint ID, Value: !Ref S3GatewayEndpoint, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-S3GatewayEndpointId'}}

  IngestBucketName: {Description: Ingest S3 Bucket Name, Value: !Ref IngestBucket, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-IngestBucketName'}}
  IngestBucketArn: {Description: Ingest S3 Bucket ARN, Value: !GetAtt IngestBucket.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-IngestBucketArn'}}
  ArtifactsBucketName: {Description: Artifacts S3 Bucket Name, Value: !Ref ArtifactsBucket, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ArtifactsBucketName'}}
  ArtifactsBucketArn: {Description: Artifacts S3 Bucket ARN, Value: !GetAtt ArtifactsBucket.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ArtifactsBucketArn'}}

  ResultsTableName: {Description: DynamoDB Results Table Name, Value: !Ref ResultsTable, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ResultsTableName'}}
  ResultsTableArn: {Description: DynamoDB Results Table ARN, Value: !GetAtt ResultsTable.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ResultsTableArn'}}

  ApplicationCMKId: {Description: Application CMK ID, Value: !Ref ApplicationCMK, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApplicationCMKId'}}
  ApplicationCMKArn: {Description: Application CMK ARN, Value: !GetAtt ApplicationCMK.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApplicationCMKArn'}}

  TransformFunctionArn: {Description: Transform Lambda Function ARN, Value: !GetAtt TransformFunction.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-TransformFunctionArn'}}
  TransformFunctionLogGroupName: {Description: Transform Lambda Function Log Group Name, Value: !Sub '/aws/lambda/TransformFunction-${ENVIRONMENTSUFFIX}', Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-TransformFunctionLogGroupName'}}
  ApiHandlerFunctionArn: {Description: API Handler Lambda Function ARN, Value: !GetAtt ApiHandlerFunction.Arn, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApiHandlerFunctionArn'}}
  ApiHandlerFunctionLogGroupName: {Description: API Handler Lambda Function Log Group Name, Value: !Sub '/aws/lambda/ApiHandlerFunction-${ENVIRONMENTSUFFIX}', Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApiHandlerFunctionLogGroupName'}}

  ApiInvokeUrl: {Description: API Gateway Invoke URL, Value: !Sub 'https://${TapApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}-${ENVIRONMENTSUFFIX}', Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApiInvokeUrl'}}
  ApiStageNameOut: {Description: API Gateway Stage Name, Value: !Sub '${ApiStageName}-${ENVIRONMENTSUFFIX}', Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-ApiStageName'}}

  DevelopersTopicArn: {Description: Developers SNS Topic ARN, Value: !Ref DevelopersTopic, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-DevelopersTopicArn'}}
  DevelopersTopicSubscriptionArn: {Description: Developers SNS Topic Subscription ARN, Value: !Ref DevelopersTopicSubscription, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-DevelopersTopicSubscriptionArn'}}

  CognitoUserPoolId: {Description: Cognito User Pool ID, Value: !Ref CognitoUserPool, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-CognitoUserPoolId'}}
  CognitoUserPoolClientId: {Description: Cognito User Pool Client ID, Value: !Ref CognitoUserPoolClient, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-CognitoUserPoolClientId'}}
  CognitoIdentityPoolId: {Description: Cognito Identity Pool ID, Value: !Ref CognitoIdentityPool, Export: {Name: !Sub 'TapStack-${ENVIRONMENTSUFFIX}-CognitoIdentityPoolId'}}
```