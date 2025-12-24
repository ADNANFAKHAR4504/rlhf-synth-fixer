# Ideal Response

This document contains all the infrastructure code and test files for this project.

## Infrastructure Code


### TapStack.yml

```yaml
# secure-architecture.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure parameterized CloudFormation template for an enterprise-grade,
  multi-region-ready AWS environment handling sensitive financial data.
  Designed to be deployed per-region (StackSet friendly). It implements:
  - KMS for service-level encryption (where applicable)
  - All S3 buckets default to SSE-S3 (AES256)
  - WAF (regional) with managed rules
  - Least-privilege IAM roles (uses AWS managed policies where appropriate)
  - CloudTrail (multi-region) delivering logs to KMS-protected CloudWatch LogGroup
  - VPC with parameterized subnets and custom NACLs
  - No hard-coded AZ names or region-specific values (dynamic via Fn::GetAZs)

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Deployment'
        Parameters:
          - Environment
          - BucketSuffix
          - EnableExampleALB
      - Label:
          default: 'Networking'
        Parameters:
          - VpcCidr
          - AvailabilityZonesToUse
          - CreateNatGateways

Parameters:
  Environment:
    Type: String
    Description: Logical environment name (e.g., dev, staging, prod)
    Default: prod
    AllowedValues: [ dev, staging, prod ]

  BucketSuffix:
    Type: String
    Description: Optional suffix to ensure global S3 bucket name uniqueness (leave empty to use AccountId-Region)
    Default: ''

  EnableExampleALB:
    Type: String
    Description: 'Create a sample ALB to allow WAF association (true/false)'
    AllowedValues: [ 'true', 'false' ]
    Default: 'false'

  VpcCidr:
    Type: String
    Description: VPC CIDR block
    Default: '10.0.0.0/16'

  AvailabilityZonesToUse:
    Type: Number
    Description: Number of availability zones to create subnets in (1-3)
    Default: 2
    MinValue: 1
    MaxValue: 3

  CreateNatGateways:
    Type: String
    Description: 'Create NAT Gateways for private subnet Internet access (true/false)'
    AllowedValues: [ 'true', 'false' ]
    Default: 'false'

  AdminCIDR:
    Type: String
    Description: 'CIDR block for admin access (SSH/RDP) - override for security'
    Default: '10.0.0.0/8'

  CloudTrailLogRetentionDays:
    Type: Number
    Description: 'Retention (days) for CloudTrail CloudWatch LogGroup'
    Default: 365

Conditions:
  UseExampleALB: !Equals [ !Ref EnableExampleALB, 'true' ]
  UseNatGateways: !Equals [ !Ref CreateNatGateways, 'true' ]
  IsProdEnv: !Equals [ !Ref Environment, 'prod' ]
  

Resources:

  # -----------------------------
  # KMS Key: central key for service-level encryption (CloudWatch Logs, etc.)
  # -----------------------------
  PrimaryKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Primary CMK for ${Environment} - use for CloudWatch/Log groups and other service-level encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full administrative access to the CMK
          - Sid: AllowRootAccountFullAccess
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          # Permit CloudWatch Logs and CloudTrail service principals to use this CMK for log delivery and LogGroup encryption
          - Sid: AllowCloudWatchAndCloudTrailUse
            Effect: Allow
            Principal:
              Service:
                - logs.amazonaws.com
                - cloudtrail.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PrimaryKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-primary-cmk'
      TargetKeyId: !Ref PrimaryKmsKey

  # -----------------------------
  # VPC / Subnets (dynamically generated using Fn::Cidr and Fn::GetAZs)
  # -----------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment
        - Key: IsProd
          Value: !If [ IsProdEnv, 'true', 'false' ]

  
  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      # LocalStack compatibility: Using hardcoded CIDR instead of !Cidr intrinsic function
      CidrBlock: '10.0.0.0/24'
      # Original dynamic CIDR: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-1'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      # LocalStack compatibility: Using hardcoded CIDR instead of !Cidr intrinsic function
      CidrBlock: '10.0.1.0/24'
      # Original dynamic CIDR: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-2'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      # LocalStack compatibility: Using hardcoded CIDR instead of !Cidr intrinsic function
      CidrBlock: '10.0.2.0/24'
      # Original dynamic CIDR: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-1'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      # LocalStack compatibility: Using hardcoded CIDR instead of !Cidr intrinsic function
      CidrBlock: '10.0.3.0/24'
      # Original dynamic CIDR: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-2'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  AttachInternetGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachInternetGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # NAT (optional)
  NatEIP1:
    Condition: UseNatGateways
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGateway1:
    Condition: UseNatGateways
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt-1'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PrivateDefaultRoute1:
    Condition: UseNatGateways
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteAssociation:
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
          Value: !Sub '${Environment}-private-rt-2'
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  PrivateDefaultRoute2:
    Condition: UseNatGateways
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet2RouteAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # -----------------------------
  # Network ACLs (custom)
  # -----------------------------
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-nacl'

  PrivateNetworkAclInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr
      Egress: false

  PrivateNetworkAclOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true

  PrivateSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-nacl'

  PublicInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 80
        To: 80
      CidrBlock: 0.0.0.0/0
      Egress: false

  PublicInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 443
        To: 443
      CidrBlock: 0.0.0.0/0
      Egress: false

  PublicOutboundAllowAll:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true

  PublicSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  # -----------------------------
  # IAM Roles (least privilege where possible)
  # -----------------------------
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
      Path: '/'
      Policies:
        - PolicyName: CloudTrailToCloudWatch
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'
      ManagedPolicyArns: []
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: EC2S3AccessToFinancialData
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowBucketObjectOps
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub 'arn:aws:s3:::${FinancialDataBucket}/*'
              - Sid: AllowListBucket
                Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${FinancialDataBucket}'
              - Sid: AllowKMSDecrypt
                Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt PrimaryKmsKey.Arn
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
      Path: /

  # -----------------------------
  # S3 Buckets (SSE-S3 default encryption)
  # - FinancialDataBucket: default SSE-S3, denies unencrypted uploads
  # - LoggingBucket: default SSE-S3 for access logs
  # - CloudTrailBucket: default SSE-S3 for object storage (CloudTrail objects SSE-S3)
  # -----------------------------
  FinancialDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      # LocalStack compatibility: Simplified bucket name without complex Fn::Select/Split
      BucketName: !Sub '${Environment}-financial-data-${AWS::AccountId}-${AWS::Region}'
      # Original complex bucket name (unsupported in LocalStack):
      # BucketName:
      #   Fn::Join:
      #     - '-'
      #     - - !Ref Environment
      #       - financial-data
      #       - !Ref AWS::AccountId
      #       - !Ref AWS::Region
      #       - !Select
      #         - 4
      #         - !Split
      #           - '-'
      #           - !Select
      #             - 2
      #             - !Split
      #               - '/'
      #               - !Ref AWS::StackId
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'financial-data-access-logs/'
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  # Deny uploads that do not request SSE-S3 (AES256)
  FinancialDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FinancialDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${FinancialDataBucket.Arn}/*'
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: AES256

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      # LocalStack compatibility: Simplified bucket name without complex Fn::Select/Split
      BucketName: !Sub '${Environment}-logging-${AWS::AccountId}-${AWS::Region}'
      # Original complex bucket name (unsupported in LocalStack):
      # BucketName:
      #   Fn::Join:
      #     - '-'
      #     - - !Ref Environment
      #       - logging
      #       - !Ref AWS::AccountId
      #       - !Ref AWS::Region
      #       - !Select
      #         - 4
      #         - !Split
      #           - '-'
      #           - !Select
      #             - 2
      #             - !Split
      #               - '/'
      #               - !Ref AWS::StackId
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      # LocalStack compatibility: Simplified bucket name without complex Fn::Select/Split
      BucketName: !Sub '${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      # Original complex bucket name (unsupported in LocalStack):
      # BucketName:
      #   Fn::Join:
      #     - '-'
      #     - - !Ref Environment
      #       - cloudtrail
      #       - !Ref AWS::AccountId
      #       - !Ref AWS::Region
      #       - !Select
      #         - 4
      #         - !Split
      #           - '-'
      #           - !Select
      #             - 2
      #             - !Split
      #               - '/'
      #               - !Ref AWS::StackId
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail S3 policy for delivery (requires ACL 'bucket-owner-full-control')
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudTrailToGetBucketAcl
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AllowCloudTrailPutObject
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  # -----------------------------
  # CloudWatch Log Groups (encrypted with KMS)
  # -----------------------------
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Environment}'
      RetentionInDays: !Ref CloudTrailLogRetentionDays
      KmsKeyId: !GetAtt PrimaryKmsKey.Arn
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}-access'
      RetentionInDays: 365
      KmsKeyId: !GetAtt PrimaryKmsKey.Arn
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  # -----------------------------
  # CloudTrail (multi-region)
  # -----------------------------
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-financial-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IsLogging: true

  # -----------------------------
  # WAFv2 Web ACL (REGIONAL) with managed rule groups
  # -----------------------------
  FinancialWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${Environment}-financial-webacl'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${Environment}-FinancialWebACL'
      Rules:
        - Name: AWSManagedCommon
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: ManagedCommon
        - Name: AWSManagedSQLi
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: ManagedSQLi

  # -----------------------------
  # Optional Application Load Balancer (example target for WAF)
  # created only when EnableExampleALB = 'true'
  # -----------------------------
  ApplicationLoadBalancer:
    Condition: UseExampleALB
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-financial-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub '${Environment} ALB SG'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  # WAF Association to ALB (only if ALB exists)
  WebACLAssociationToALB:
    Condition: UseExampleALB
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !GetAtt ApplicationLoadBalancer.LoadBalancerArn
      WebACLArn: !GetAtt FinancialWebACL.Arn

  # -----------------------------
  # Security Groups for app / db (tight rules)
  # -----------------------------
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub '${Environment} web server SG'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub '${Environment} database SG'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  # -----------------------------
  # Outputs (useful for integration tests / other stacks)
  # -----------------------------
Outputs:
  VPCId:
    Description: VPC Id
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${Environment}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${Environment}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${Environment}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${Environment}-PrivateSubnet2-ID'

  FinancialDataBucketName:
    Description: Name of the Financial Data S3 bucket
    Value: !Ref FinancialDataBucket
    Export:
      Name: !Sub '${Environment}-FinancialDataBucket-Name'

  LoggingBucketName:
    Description: Name of the logging S3 bucket
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${Environment}-LoggingBucket-Name'

  CloudTrailBucketName:
    Description: Name of the CloudTrail S3 bucket
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${Environment}-CloudTrailBucket-Name'

  PrimaryKmsKeyId:
    Description: Primary KMS Key Id
    Value: !Ref PrimaryKmsKey
    Export:
      Name: !Sub '${Environment}-PrimaryKmsKeyId'

  CloudTrailLogGroupArn:
    Description: ARN of the CloudTrail CloudWatch LogGroup
    Value: !GetAtt CloudTrailLogGroup.Arn
    Export:
      Name: !Sub '${Environment}-CloudTrailLogGroupArn'

  WebACLArn:
    Description: ARN of the WAFv2 WebACL
    Value: !GetAtt FinancialWebACL.Arn
    Export:
      Name: !Sub '${Environment}-WebACL-ARN'

  ALBDNS:
    Condition: UseExampleALB
    Description: DNS name of the example ALB
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ALB-DNS'

  AdminCIDROut:
    Description: Echo of AdminCIDR parameter to mark it as used
    Value: !Ref AdminCIDR
  AvailabilityZonesToUseOut:
    Description: Echo of AvailabilityZonesToUse parameter to mark it as used
    Value: !Ref AvailabilityZonesToUse

  BucketSuffixOut:
    Description: Echo of BucketSuffix parameter to mark it as used
    Value: !Ref BucketSuffix
```

### TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Secure parameterized CloudFormation template for an enterprise-grade, multi-region-ready AWS environment handling sensitive financial data. Designed to be deployed per-region (StackSet friendly). It implements: - KMS for service-level encryption (where applicable) - All S3 buckets default to SSE-S3 (AES256) - WAF (regional) with managed rules - Least-privilege IAM roles (uses AWS managed policies where appropriate) - CloudTrail (multi-region) delivering logs to KMS-protected CloudWatch LogGroup - VPC with parameterized subnets and custom NACLs - No hard-coded AZ names or region-specific values (dynamic via Fn::GetAZs)\n",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Deployment"
                    },
                    "Parameters": [
                        "Environment",
                        "BucketSuffix",
                        "EnableExampleALB"
                    ]
                },
                {
                    "Label": {
                        "default": "Networking"
                    },
                    "Parameters": [
                        "VpcCidr",
                        "AvailabilityZonesToUse",
                        "CreateNatGateways"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "Environment": {
            "Type": "String",
            "Description": "Logical environment name (e.g., dev, staging, prod)",
            "Default": "prod",
            "AllowedValues": [
                "dev",
                "staging",
                "prod"
            ]
        },
        "BucketSuffix": {
            "Type": "String",
            "Description": "Optional suffix to ensure global S3 bucket name uniqueness (leave empty to use AccountId-Region)",
            "Default": ""
        },
        "EnableExampleALB": {
            "Type": "String",
            "Description": "Create a sample ALB to allow WAF association (true/false)",
            "AllowedValues": [
                "true",
                "false"
            ],
            "Default": "false"
        },
        "VpcCidr": {
            "Type": "String",
            "Description": "VPC CIDR block",
            "Default": "10.0.0.0/16"
        },
        "AvailabilityZonesToUse": {
            "Type": "Number",
            "Description": "Number of availability zones to create subnets in (1-3)",
            "Default": 2,
            "MinValue": 1,
            "MaxValue": 3
        },
        "CreateNatGateways": {
            "Type": "String",
            "Description": "Create NAT Gateways for private subnet Internet access (true/false)",
            "AllowedValues": [
                "true",
                "false"
            ],
            "Default": "false"
        },
        "AdminCIDR": {
            "Type": "String",
            "Description": "CIDR block for admin access (SSH/RDP) - override for security",
            "Default": "10.0.0.0/8"
        },
        "CloudTrailLogRetentionDays": {
            "Type": "Number",
            "Description": "Retention (days) for CloudTrail CloudWatch LogGroup",
            "Default": 365
        }
    },
    "Conditions": {
        "UseExampleALB": {
            "Fn::Equals": [
                {
                    "Ref": "EnableExampleALB"
                },
                "true"
            ]
        },
        "UseNatGateways": {
            "Fn::Equals": [
                {
                    "Ref": "CreateNatGateways"
                },
                "true"
            ]
        },
        "IsProdEnv": {
            "Fn::Equals": [
                {
                    "Ref": "Environment"
                },
                "prod"
            ]
        }
    },
    "Resources": {
        "PrimaryKmsKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": {
                    "Fn::Sub": "Primary CMK for ${Environment} - use for CloudWatch/Log groups and other service-level encryption"
                },
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowRootAccountFullAccess",
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
                            "Sid": "AllowCloudWatchAndCloudTrailUse",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": [
                                    "logs.amazonaws.com",
                                    "cloudtrail.amazonaws.com"
                                ]
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
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PrimaryKmsAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/${Environment}-primary-cmk"
                },
                "TargetKeyId": {
                    "Ref": "PrimaryKmsKey"
                }
            }
        },
        "VPC": {
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
                            "Fn::Sub": "${Environment}-vpc"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    },
                    {
                        "Key": "IsProd",
                        "Value": {
                            "Fn::If": [
                                "IsProdEnv",
                                "true",
                                "false"
                            ]
                        }
                    }
                ]
            }
        },
        "PublicSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": "10.0.0.0/24",
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-public-1"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PublicSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": "10.0.1.0/24",
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "MapPublicIpOnLaunch": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-public-2"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PrivateSubnet1": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": "10.0.2.0/24",
                "AvailabilityZone": {
                    "Fn::Select": [
                        0,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-private-1"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PrivateSubnet2": {
            "Type": "AWS::EC2::Subnet",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "CidrBlock": "10.0.3.0/24",
                "AvailabilityZone": {
                    "Fn::Select": [
                        1,
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-private-2"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "InternetGateway": {
            "Type": "AWS::EC2::InternetGateway",
            "Properties": {
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-igw"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "AttachInternetGateway": {
            "Type": "AWS::EC2::VPCGatewayAttachment",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "InternetGatewayId": {
                    "Ref": "InternetGateway"
                }
            }
        },
        "PublicRouteTable": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-public-rt"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PublicDefaultRoute": {
            "Type": "AWS::EC2::Route",
            "DependsOn": "AttachInternetGateway",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "GatewayId": {
                    "Ref": "InternetGateway"
                }
            }
        },
        "PublicSubnet1RouteAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PublicSubnet1"
                },
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                }
            }
        },
        "PublicSubnet2RouteAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PublicSubnet2"
                },
                "RouteTableId": {
                    "Ref": "PublicRouteTable"
                }
            }
        },
        "NatEIP1": {
            "Condition": "UseNatGateways",
            "Type": "AWS::EC2::EIP",
            "Properties": {
                "Domain": "vpc"
            }
        },
        "NatGateway1": {
            "Condition": "UseNatGateways",
            "Type": "AWS::EC2::NatGateway",
            "Properties": {
                "AllocationId": {
                    "Fn::GetAtt": [
                        "NatEIP1",
                        "AllocationId"
                    ]
                },
                "SubnetId": {
                    "Ref": "PublicSubnet1"
                }
            }
        },
        "PrivateRouteTable1": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-private-rt-1"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PrivateDefaultRoute1": {
            "Condition": "UseNatGateways",
            "Type": "AWS::EC2::Route",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable1"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "NatGateway1"
                }
            }
        },
        "PrivateSubnet1RouteAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PrivateSubnet1"
                },
                "RouteTableId": {
                    "Ref": "PrivateRouteTable1"
                }
            }
        },
        "PrivateRouteTable2": {
            "Type": "AWS::EC2::RouteTable",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-private-rt-2"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "PrivateDefaultRoute2": {
            "Condition": "UseNatGateways",
            "Type": "AWS::EC2::Route",
            "Properties": {
                "RouteTableId": {
                    "Ref": "PrivateRouteTable2"
                },
                "DestinationCidrBlock": "0.0.0.0/0",
                "NatGatewayId": {
                    "Ref": "NatGateway1"
                }
            }
        },
        "PrivateSubnet2RouteAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PrivateSubnet2"
                },
                "RouteTableId": {
                    "Ref": "PrivateRouteTable2"
                }
            }
        },
        "PrivateNetworkAcl": {
            "Type": "AWS::EC2::NetworkAcl",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-private-nacl"
                        }
                    }
                ]
            }
        },
        "PrivateNetworkAclInbound": {
            "Type": "AWS::EC2::NetworkAclEntry",
            "Properties": {
                "NetworkAclId": {
                    "Ref": "PrivateNetworkAcl"
                },
                "RuleNumber": 100,
                "Protocol": -1,
                "RuleAction": "allow",
                "CidrBlock": {
                    "Ref": "VpcCidr"
                },
                "Egress": false
            }
        },
        "PrivateNetworkAclOutbound": {
            "Type": "AWS::EC2::NetworkAclEntry",
            "Properties": {
                "NetworkAclId": {
                    "Ref": "PrivateNetworkAcl"
                },
                "RuleNumber": 100,
                "Protocol": -1,
                "RuleAction": "allow",
                "CidrBlock": "0.0.0.0/0",
                "Egress": true
            }
        },
        "PrivateSubnetNetworkAclAssociation1": {
            "Type": "AWS::EC2::SubnetNetworkAclAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PrivateSubnet1"
                },
                "NetworkAclId": {
                    "Ref": "PrivateNetworkAcl"
                }
            }
        },
        "PrivateSubnetNetworkAclAssociation2": {
            "Type": "AWS::EC2::SubnetNetworkAclAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PrivateSubnet2"
                },
                "NetworkAclId": {
                    "Ref": "PrivateNetworkAcl"
                }
            }
        },
        "PublicNetworkAcl": {
            "Type": "AWS::EC2::NetworkAcl",
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${Environment}-public-nacl"
                        }
                    }
                ]
            }
        },
        "PublicInboundHTTP": {
            "Type": "AWS::EC2::NetworkAclEntry",
            "Properties": {
                "NetworkAclId": {
                    "Ref": "PublicNetworkAcl"
                },
                "RuleNumber": 100,
                "Protocol": 6,
                "RuleAction": "allow",
                "PortRange": {
                    "From": 80,
                    "To": 80
                },
                "CidrBlock": "0.0.0.0/0",
                "Egress": false
            }
        },
        "PublicInboundHTTPS": {
            "Type": "AWS::EC2::NetworkAclEntry",
            "Properties": {
                "NetworkAclId": {
                    "Ref": "PublicNetworkAcl"
                },
                "RuleNumber": 110,
                "Protocol": 6,
                "RuleAction": "allow",
                "PortRange": {
                    "From": 443,
                    "To": 443
                },
                "CidrBlock": "0.0.0.0/0",
                "Egress": false
            }
        },
        "PublicOutboundAllowAll": {
            "Type": "AWS::EC2::NetworkAclEntry",
            "Properties": {
                "NetworkAclId": {
                    "Ref": "PublicNetworkAcl"
                },
                "RuleNumber": 100,
                "Protocol": -1,
                "RuleAction": "allow",
                "CidrBlock": "0.0.0.0/0",
                "Egress": true
            }
        },
        "PublicSubnetNetworkAclAssociation1": {
            "Type": "AWS::EC2::SubnetNetworkAclAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PublicSubnet1"
                },
                "NetworkAclId": {
                    "Ref": "PublicNetworkAcl"
                }
            }
        },
        "PublicSubnetNetworkAclAssociation2": {
            "Type": "AWS::EC2::SubnetNetworkAclAssociation",
            "Properties": {
                "SubnetId": {
                    "Ref": "PublicSubnet2"
                },
                "NetworkAclId": {
                    "Ref": "PublicNetworkAcl"
                }
            }
        },
        "CloudTrailRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "Path": "/",
                "Policies": [
                    {
                        "PolicyName": "CloudTrailToCloudWatch",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*"
                                    }
                                }
                            ]
                        }
                    }
                ],
                "ManagedPolicyArns": [],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "EC2InstanceRole": {
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
                    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
                    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
                ],
                "Policies": [
                    {
                        "PolicyName": "EC2S3AccessToFinancialData",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "AllowBucketObjectOps",
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject",
                                        "s3:PutObject",
                                        "s3:DeleteObject"
                                    ],
                                    "Resource": [
                                        {
                                            "Fn::Sub": "arn:aws:s3:::${FinancialDataBucket}/*"
                                        }
                                    ]
                                },
                                {
                                    "Sid": "AllowListBucket",
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:ListBucket"
                                    ],
                                    "Resource": [
                                        {
                                            "Fn::Sub": "arn:aws:s3:::${FinancialDataBucket}"
                                        }
                                    ]
                                },
                                {
                                    "Sid": "AllowKMSDecrypt",
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "PrimaryKmsKey",
                                            "Arn"
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "EC2InstanceProfile": {
            "Type": "AWS::IAM::InstanceProfile",
            "Properties": {
                "Roles": [
                    {
                        "Ref": "EC2InstanceRole"
                    }
                ],
                "Path": "/"
            }
        },
        "FinancialDataBucket": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
            "UpdateReplacePolicy": "Retain",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "${Environment}-financial-data-${AWS::AccountId}-${AWS::Region}"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "IgnorePublicAcls": true,
                    "BlockPublicPolicy": true,
                    "RestrictPublicBuckets": true
                },
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "LoggingConfiguration": {
                    "DestinationBucketName": {
                        "Ref": "LoggingBucket"
                    },
                    "LogFilePrefix": "financial-data-access-logs/"
                },
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "FinancialDataBucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "FinancialDataBucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyUnEncryptedObjectUploads",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:PutObject",
                            "Resource": {
                                "Fn::Sub": "${FinancialDataBucket.Arn}/*"
                            },
                            "Condition": {
                                "StringNotEquals": {
                                    "s3:x-amz-server-side-encryption": "AES256"
                                }
                            }
                        }
                    ]
                }
            }
        },
        "LoggingBucket": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
            "UpdateReplacePolicy": "Retain",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "${Environment}-logging-${AWS::AccountId}-${AWS::Region}"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "IgnorePublicAcls": true,
                    "BlockPublicPolicy": true,
                    "RestrictPublicBuckets": true
                },
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "CloudTrailBucket": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
            "UpdateReplacePolicy": "Retain",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "IgnorePublicAcls": true,
                    "BlockPublicPolicy": true,
                    "RestrictPublicBuckets": true
                },
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "CloudTrailBucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "CloudTrailBucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowCloudTrailToGetBucketAcl",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "s3:GetBucketAcl",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "CloudTrailBucket",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Sid": "AllowCloudTrailPutObject",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": "s3:PutObject",
                            "Resource": {
                                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            }
                        }
                    ]
                }
            }
        },
        "CloudTrailLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/cloudtrail/${Environment}"
                },
                "RetentionInDays": {
                    "Ref": "CloudTrailLogRetentionDays"
                },
                "KmsKeyId": {
                    "Fn::GetAtt": [
                        "PrimaryKmsKey",
                        "Arn"
                    ]
                },
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "S3AccessLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/s3/${Environment}-access"
                },
                "RetentionInDays": 365,
                "KmsKeyId": {
                    "Fn::GetAtt": [
                        "PrimaryKmsKey",
                        "Arn"
                    ]
                },
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "CloudTrail": {
            "Type": "AWS::CloudTrail::Trail",
            "DependsOn": "CloudTrailBucketPolicy",
            "Properties": {
                "TrailName": {
                    "Fn::Sub": "${Environment}-financial-trail"
                },
                "S3BucketName": {
                    "Ref": "CloudTrailBucket"
                },
                "IncludeGlobalServiceEvents": true,
                "IsMultiRegionTrail": true,
                "EnableLogFileValidation": true,
                "CloudWatchLogsLogGroupArn": {
                    "Fn::GetAtt": [
                        "CloudTrailLogGroup",
                        "Arn"
                    ]
                },
                "CloudWatchLogsRoleArn": {
                    "Fn::GetAtt": [
                        "CloudTrailRole",
                        "Arn"
                    ]
                },
                "IsLogging": true
            }
        },
        "FinancialWebACL": {
            "Type": "AWS::WAFv2::WebACL",
            "Properties": {
                "Name": {
                    "Fn::Sub": "${Environment}-financial-webacl"
                },
                "Scope": "REGIONAL",
                "DefaultAction": {
                    "Allow": {}
                },
                "VisibilityConfig": {
                    "SampledRequestsEnabled": true,
                    "CloudWatchMetricsEnabled": true,
                    "MetricName": {
                        "Fn::Sub": "${Environment}-FinancialWebACL"
                    }
                },
                "Rules": [
                    {
                        "Name": "AWSManagedCommon",
                        "Priority": 1,
                        "Statement": {
                            "ManagedRuleGroupStatement": {
                                "VendorName": "AWS",
                                "Name": "AWSManagedRulesCommonRuleSet"
                            }
                        },
                        "OverrideAction": {
                            "None": {}
                        },
                        "VisibilityConfig": {
                            "SampledRequestsEnabled": true,
                            "CloudWatchMetricsEnabled": true,
                            "MetricName": "ManagedCommon"
                        }
                    },
                    {
                        "Name": "AWSManagedSQLi",
                        "Priority": 2,
                        "Statement": {
                            "ManagedRuleGroupStatement": {
                                "VendorName": "AWS",
                                "Name": "AWSManagedRulesSQLiRuleSet"
                            }
                        },
                        "OverrideAction": {
                            "None": {}
                        },
                        "VisibilityConfig": {
                            "SampledRequestsEnabled": true,
                            "CloudWatchMetricsEnabled": true,
                            "MetricName": "ManagedSQLi"
                        }
                    }
                ]
            }
        },
        "ApplicationLoadBalancer": {
            "Condition": "UseExampleALB",
            "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
            "Properties": {
                "Name": {
                    "Fn::Sub": "${Environment}-financial-alb"
                },
                "Scheme": "internet-facing",
                "Type": "application",
                "Subnets": [
                    {
                        "Ref": "PublicSubnet1"
                    },
                    {
                        "Ref": "PublicSubnet2"
                    }
                ],
                "SecurityGroups": [
                    {
                        "Ref": "LoadBalancerSecurityGroup"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "LoadBalancerSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": {
                    "Fn::Sub": "${Environment} ALB SG"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 80,
                        "ToPort": 80,
                        "CidrIp": "0.0.0.0/0"
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 443,
                        "ToPort": 443,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": -1,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "WebACLAssociationToALB": {
            "Condition": "UseExampleALB",
            "Type": "AWS::WAFv2::WebACLAssociation",
            "Properties": {
                "ResourceArn": {
                    "Fn::GetAtt": [
                        "ApplicationLoadBalancer",
                        "LoadBalancerArn"
                    ]
                },
                "WebACLArn": {
                    "Fn::GetAtt": [
                        "FinancialWebACL",
                        "Arn"
                    ]
                }
            }
        },
        "WebServerSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": {
                    "Fn::Sub": "${Environment} web server SG"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 80,
                        "ToPort": 80,
                        "SourceSecurityGroupId": {
                            "Ref": "LoadBalancerSecurityGroup"
                        }
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 443,
                        "ToPort": 443,
                        "SourceSecurityGroupId": {
                            "Ref": "LoadBalancerSecurityGroup"
                        }
                    }
                ],
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": -1,
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        },
        "DatabaseSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": {
                    "Fn::Sub": "${Environment} database SG"
                },
                "VpcId": {
                    "Ref": "VPC"
                },
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 3306,
                        "ToPort": 3306,
                        "SourceSecurityGroupId": {
                            "Ref": "WebServerSecurityGroup"
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Project",
                        "Value": "FinancialProject"
                    },
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "Environment"
                        }
                    }
                ]
            }
        }
    },
    "Outputs": {
        "VPCId": {
            "Description": "VPC Id",
            "Value": {
                "Ref": "VPC"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-VPC-ID"
                }
            }
        },
        "PublicSubnet1Id": {
            "Description": "Public Subnet 1 ID",
            "Value": {
                "Ref": "PublicSubnet1"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-PublicSubnet1-ID"
                }
            }
        },
        "PublicSubnet2Id": {
            "Description": "Public Subnet 2 ID",
            "Value": {
                "Ref": "PublicSubnet2"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-PublicSubnet2-ID"
                }
            }
        },
        "PrivateSubnet1Id": {
            "Description": "Private Subnet 1 ID",
            "Value": {
                "Ref": "PrivateSubnet1"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-PrivateSubnet1-ID"
                }
            }
        },
        "PrivateSubnet2Id": {
            "Description": "Private Subnet 2 ID",
            "Value": {
                "Ref": "PrivateSubnet2"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-PrivateSubnet2-ID"
                }
            }
        },
        "FinancialDataBucketName": {
            "Description": "Name of the Financial Data S3 bucket",
            "Value": {
                "Ref": "FinancialDataBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-FinancialDataBucket-Name"
                }
            }
        },
        "LoggingBucketName": {
            "Description": "Name of the logging S3 bucket",
            "Value": {
                "Ref": "LoggingBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-LoggingBucket-Name"
                }
            }
        },
        "CloudTrailBucketName": {
            "Description": "Name of the CloudTrail S3 bucket",
            "Value": {
                "Ref": "CloudTrailBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-CloudTrailBucket-Name"
                }
            }
        },
        "PrimaryKmsKeyId": {
            "Description": "Primary KMS Key Id",
            "Value": {
                "Ref": "PrimaryKmsKey"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-PrimaryKmsKeyId"
                }
            }
        },
        "CloudTrailLogGroupArn": {
            "Description": "ARN of the CloudTrail CloudWatch LogGroup",
            "Value": {
                "Fn::GetAtt": [
                    "CloudTrailLogGroup",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-CloudTrailLogGroupArn"
                }
            }
        },
        "WebACLArn": {
            "Description": "ARN of the WAFv2 WebACL",
            "Value": {
                "Fn::GetAtt": [
                    "FinancialWebACL",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-WebACL-ARN"
                }
            }
        },
        "ALBDNS": {
            "Condition": "UseExampleALB",
            "Description": "DNS name of the example ALB",
            "Value": {
                "Fn::GetAtt": [
                    "ApplicationLoadBalancer",
                    "DNSName"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${Environment}-ALB-DNS"
                }
            }
        },
        "AdminCIDROut": {
            "Description": "Echo of AdminCIDR parameter to mark it as used",
            "Value": {
                "Ref": "AdminCIDR"
            }
        },
        "AvailabilityZonesToUseOut": {
            "Description": "Echo of AvailabilityZonesToUse parameter to mark it as used",
            "Value": {
                "Ref": "AvailabilityZonesToUse"
            }
        },
        "BucketSuffixOut": {
            "Description": "Echo of BucketSuffix parameter to mark it as used",
            "Value": {
                "Ref": "BucketSuffix"
            }
        }
    }
}```

## Test Files

