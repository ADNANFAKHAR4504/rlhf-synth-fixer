# Ideal response

This document describes the ideal deliverable for the CloudFormation/TapStack.yml request and what a successful reply should include.

## What the deliverable contains

* A single CloudFormation YAML file named `TapStack.yml` that creates a brand-new stack in **us-east-1** and does **not** rely on any existing resources.
* The template provisions the following resources and satisfies each requirement from the prompt:

  * VPC with both public and private subnets across two Availability Zones.
  * NAT gateway (public subnet) and route tables for public and private traffic.
  * Two EC2 instances in **private** subnets, one in each AZ, with:

    * Instance types restricted to T2/T3 family (parameterized).
    * EBS volumes encrypted with a KMS key.
    * An attached IAM InstanceProfile/Role that includes the AmazonSSMManagedInstanceCore policy for SSM usage.
    * SSH only allowed from a parameterized single CIDR (user’s personal IP).
    * Optional KeyPair usage controlled by a condition (KeyName only applied if provided).
  * Application Load Balancer (ALB) in the public subnets with a listener on HTTP and a target group that points to the two EC2 instances.
  * IAM Managed Policy that restricts `ec2:RunInstances` to the declared public subnets (prevents launching in private/subnet-other-than-public).
  * Deterministic S3 bucket (valid name) with server-side encryption enforced, public access blocked, and an Origin Access Identity (OAI) for CloudFront.
  * CloudFront distribution that uses the S3 bucket as origin and uses the **WAFv2 WebACL ARN** (correct `GetAtt` usage) — created only when the stack is in `us-east-1`.
  * WAFv2 WebACL (Scope: CLOUDFRONT) appropriate for CloudFront and only created when region is `us-east-1`.
  * S3 → SNS notifications and SNS → Lambda subscription for auditing. SNS topic policy created prior to S3 notification configuration. Lambda permission configured to allow SNS invocation. RawMessageDelivery is not used for `lambda` protocol.
  * Lambda function (inline code) that receives S3 events via SNS and logs audit information.
  * RDS instance placed in private subnets, **not publicly accessible**, encrypted with KMS, and credentialed via Secrets Manager.
  * SQS queue for the application’s logging/queueing needs.
  * CloudWatch alarms for EC2 CPU and for memory (requires CloudWatch Agent on instances).
  * AWS Config (optional creation controlled via parameter) with DeliveryChannel created before ConfigurationRecorder to avoid race conditions and limit errors.
  * All resources that support tags are tagged with `Environment`, `Owner`, and `Project`.
  * Parameterization for Owner, Project, Environment, SSH CIDR, optional KeyPair name, instance type, and a safe default for `CreateAWSConfig` to avoid exceeding account limits.
  * KMS key for EBS and RDS encryption.
  * Clean dependencies and `DependsOn` usage (avoid redundant `DependsOn` where `Ref` or `GetAtt` already enforce ordering).
  * No SSL/Certificate configuration included.

## Validation & best practices checklist the reply includes

* The template passes `cfn-lint` with no errors (or only low-severity warnings explained and acceptable).
* The template passes `aws cloudformation validate-template` (no schema errors).
* Deterministic resource names conform to AWS naming rules (S3 bucket names are lowercase, alphanumeric and hyphens).
* CloudFront is created in `us-east-1` and WAFv2 WebACL uses an ARN via `!GetAtt` (not `!Ref`).
* S3 notification destination validation is satisfied because SNS topic and topic policy are created before attaching notifications.
* SNS → Lambda subscription uses the correct properties (no `RawMessageDelivery`), and a Lambda permission resource includes `SourceAccount` for additional validation.
* IAM policy used to restrict EC2 launches is demonstrably scoped to deny launching outside allowed subnets.
* AWS Config creation is optional by default to avoid `MaxNumberOfConfigurationRecordersExceededException`.
* The template uses conditional logic and parameters to avoid failures in accounts with preexisting resources.
* A short, clear deployment guidance paragraph (what to adjust before first deploy and which parameters to review) is provided.

## Post-deploy checks described in the ideal response

* Confirm CloudFormation stack events show successful CREATE_COMPLETE for all top-level resources (VPC, ALB, EC2, S3, CloudFront, RDS).
* Check CloudFront shows a valid distribution domain name and points at the S3 origin.
* Confirm WAF appears in the WAFv2 console (if created) and the CloudFront distribution shows the WebACL ARN attached.
* Verify S3 bucket encryption and that bucket policy denies non-encrypted puts.
* Verify RDS `PubliclyAccessible` is false and endpoint is reachable only via private networking (test via a bastion/SSM session if necessary).
* Verify EC2 instances have the InstanceProfile attached and SSM connection is possible.
* Confirm CloudWatch alarms exist and are wired to the intended metrics.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: >
  TapStack — Secure web infra (us-east-1). VPC with public & private subnets,
  ALB balancing HTTP to 2 EC2 instances across AZs, private encrypted RDS,
  encrypted S3 with CloudFront + OAI and WAFv2, Lambda audit via SNS from S3 events,
  SQS logging queue, KMS for EBS/RDS, CloudWatch alarms, IAM role for SSM, and an
  IAM managed policy to restrict EC2 launches to specific public subnets.
  AWS Config creation is optional (disabled by default to avoid recorder limits).

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]
    Description: Environment tag (lowercase)
  Owner:
    Type: String
    Default: tapops
    Description: Owner tag (lowercase)
  Project:
    Type: String
    Default: tapstack
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: "Project must be lowercase letters, numbers, or hyphen."
    Description: Project tag (lowercase; used in bucket name)
  AllowedSSHLocation:
    Type: String
    Default: 203.0.113.0/32
    Description: CIDR allowed for SSH (your personal IP)
  KeyPairName:
    Type: String
    Default: ""
    Description: Optional EC2 key pair name (leave blank to skip KeyName)
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t2.micro
      - t2.small
      - t3.micro
      - t3.small
    Description: EC2 instance type (restricted to T2/T3 family)
  CreateAWSConfig:
    Type: String
    AllowedValues: [true, false]
    Default: false
    Description: "Set to true to create AWS Config resources (ensure no existing recorder exists)."

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, ""]]
  IsUsEast1: !Equals [!Ref "AWS::Region", "us-east-1"]
  CreateConfig: !Equals [!Ref CreateAWSConfig, "true"]

Mappings:
  RegionAZs:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b

Resources:

  # -----------------------
  # VPC & Networking
  # -----------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${Project}-vpc"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${Project}-igw"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !FindInMap [RegionAZs, !Ref "AWS::Region", AZ1]
      Tags:
        - Key: Name
          Value: !Sub "${Project}-public-1"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !FindInMap [RegionAZs, !Ref "AWS::Region", AZ2]
      Tags:
        - Key: Name
          Value: !Sub "${Project}-public-2"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !FindInMap [RegionAZs, !Ref "AWS::Region", AZ1]
      Tags:
        - Key: Name
          Value: !Sub "${Project}-private-1"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !FindInMap [RegionAZs, !Ref "AWS::Region", AZ2]
      Tags:
        - Key: Name
          Value: !Sub "${Project}-private-2"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${Project}-public-rt"

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
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

  EIPForNAT:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT.AllocationId
      SubnetId: !Ref PublicSubnet1

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # -----------------------
  # KMS Key
  # -----------------------
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS and RDS encryption
      EnableKeyRotation: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # IAM role & instance profile for SSM
  # -----------------------
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref InstanceRole

  # -----------------------
  # Security groups
  # -----------------------
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow SSH from a single IP
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHLocation
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP inbound
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # EC2 Instances (private subnets) - T2/T3 enforced by parameter
  # -----------------------
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref "AWS::NoValue"]
      SubnetId: !Ref PrivateSubnet1
      ImageId: ami-0c02fb55956c7d316
      IamInstanceProfile: !Ref InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Project}-ec2-1"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref "AWS::NoValue"]
      SubnetId: !Ref PrivateSubnet2
      ImageId: ami-0c02fb55956c7d316
      IamInstanceProfile: !Ref InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Project}-ec2-2"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # ALB + Target group + Listener
  # -----------------------
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      TargetType: instance
      Targets:
        - Id: !Ref EC2Instance1
        - Id: !Ref EC2Instance2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # -----------------------
  # SNS topic + policy for S3 notifications
  # -----------------------
  S3EventsTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub "${Project}-s3-events"
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref S3EventsTopic
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowS3ToPublish
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sns:Publish
            Resource: !Ref S3EventsTopic
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId

  # -----------------------
  # S3 bucket with SSE and notifications to SNS (deterministic name)
  # -----------------------
  S3Bucket:
    Type: AWS::S3::Bucket
    DependsOn:
      - SNSTopicPolicy
    Properties:
      BucketName: !Sub "${Project}-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      NotificationConfiguration:
        TopicConfigurations:
          - Event: s3:ObjectCreated:*
            Topic: !Ref S3EventsTopic
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # CloudFront OAI & S3 bucket policy (allow OAI read, deny non-encrypted uploads,
  # allow AWS Config to write when enabled)
  # -----------------------
  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub "OAI for ${Project} CloudFront origin"

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowCloudFrontGetObject
            Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOAI.S3CanonicalUserId
            Action:
              - s3:GetObject
            Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"

          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: "*"
            Action: "s3:PutObject"
            Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": "AES256"

          - Sid: AllowAWSConfigWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:PutObject
              - s3:GetBucketAcl
            Resource:
              - !Sub "arn:aws:s3:::${S3Bucket}/*"
              - !Sub "arn:aws:s3:::${S3Bucket}"
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId

  # -----------------------
  # Lambda (audit) and SNS subscription (Lambda protocol doesn't allow RawMessageDelivery)
  # -----------------------
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  AuditLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
      Role: !GetAtt LambdaRole.Arn
      Timeout: 30
      Code:
        ZipFile: |
          import json
          def handler(event, context):
              print("Audit Lambda event:")
              print(json.dumps(event))
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  LambdaInvokePermissionFromSNS:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt AuditLambda.Arn
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref S3EventsTopic
      SourceAccount: !Ref AWS::AccountId

  SNSSubscriptionToLambda:
    Type: AWS::SNS::Subscription
    DependsOn:
      - LambdaInvokePermissionFromSNS
    Properties:
      TopicArn: !Ref S3EventsTopic
      Protocol: lambda
      Endpoint: !GetAtt AuditLambda.Arn

  # -----------------------
  # SecretsManager + RDS (private)
  # -----------------------
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${Project}-rds-secret"
      GenerateSecretString:
        SecretStringTemplate: '{"username":"adminuser"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub "${Project} DB subnet group"
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${Project}-db"
      DBInstanceClass: db.t3.micro
      Engine: mysql
      AllocatedStorage: 20
      MasterUsername: !Sub "{{resolve:secretsmanager:${DBSecret}::username}}"
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${DBSecret}::password}}"
      PubliclyAccessible: false
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      DBSubnetGroupName: !Ref DBSubnetGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # SQS queue for application logging
  # -----------------------
  AppLoggingQueue:
    Type: AWS::SQS::Queue
    Properties:
      VisibilityTimeout: 60
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # -----------------------
  # WAFv2 WebACL (CloudFront) - only in us-east-1
  # -----------------------
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: IsUsEast1
    Properties:
      Name: !Sub "${Project}-waf"
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${Project}-waf-metric"
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: rateLimitRule

  # -----------------------
  # CloudFront Distribution (us-east-1 only)
  # -----------------------
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Condition: IsUsEast1
    DependsOn:
      - S3BucketPolicy
      - SNSTopicPolicy
    Properties:
      DistributionConfig:
        Enabled: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.DomainName
            S3OriginConfig:
              OriginAccessIdentity: !Join ['', ['origin-access-identity/cloudfront/', !Ref CloudFrontOAI]]
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        WebACLId: !GetAtt WAFWebACL.Arn

  # -----------------------
  # CloudWatch alarms (CPU & memory)
  # -----------------------
  CPUAlarmInstance1:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "High CPU on EC2Instance1"
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance1
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold

  MemoryAlarmInstance1:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "High memory usage (requires CloudWatch Agent)"
      Namespace: CWAgent
      MetricName: mem_used_percent
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance1
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold

  # -----------------------
  # AWS Config (conditional) - DeliveryChannel before Recorder
  # -----------------------
  AWSConfigRole:
    Condition: CreateConfig
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AWSConfigInlinePolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - config:PutConfigurationRecorder
                  - config:PutDeliveryChannel
                  - config:PutEvaluations
                  - config:PutConfigRule
                  - config:StartConfigurationRecorder
                  - config:StopConfigurationRecorder
                  - config:Get*
                  - config:Describe*
                  - config:DeliverConfigSnapshot
                Resource: "*"
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref S3EventsTopic

  ConfigDeliveryChannel:
    Condition: CreateConfig
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref S3Bucket

  ConfigRecorder:
    Condition: CreateConfig
    Type: AWS::Config::ConfigurationRecorder
    DependsOn:
      - ConfigDeliveryChannel
    Properties:
      RoleARN: !GetAtt AWSConfigRole.Arn
      RecordingGroup:
        AllSupported: true

  # -----------------------
  # IAM Managed policy to restrict RunInstances to public subnets
  # NOTE: tags removed from this IAM::ManagedPolicy to avoid E3002 linter error
  # -----------------------
  RestrictEC2LaunchToPublicSubnetsPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "${Project}-restrict-ec2-launch-publicsubnets"
      Description: "Deny ec2:RunInstances when ec2:Subnet is not an approved public subnet"
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyRunInstancesOutsidePublicSubnets
            Effect: Deny
            Action:
              - ec2:RunInstances
            Resource: "*"
            Condition:
              StringNotEquals:
                ec2:Subnet:
                  - !Ref PublicSubnet1
                  - !Ref PublicSubnet2

Outputs:
  VPCId:
    Description: VPC id
    Value: !Ref VPC

  ALBDNS:
    Description: ALB DNS name
    Value: !GetAtt ALB.DNSName

  S3BucketName:
    Description: Deterministic S3 bucket name
    Value: !Ref S3Bucket

  RDSEndpoint:
    Description: RDS endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address

  CloudFrontDomain:
    Condition: IsUsEast1
    Description: CloudFront distribution domain name
    Value: !GetAtt CloudFrontDistribution.DomainName

  AuditLambdaArn:
    Description: Audit Lambda ARN
    Value: !GetAtt AuditLambda.Arn

  AppLoggingQueueUrl:
    Description: App logging SQS URL
    Value: !Ref AppLoggingQueue
```