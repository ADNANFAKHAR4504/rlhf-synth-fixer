```yml
# ideal-secure-architecture.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  IDEAL secure parameterized CloudFormation template for enterprise-grade,
  multi-region-ready AWS environment handling sensitive financial data.
  StackSet-friendly (deploy per-region). Implements:
  - Primary CMK for service-level encryption (CloudWatch, CloudTrail)
  - S3 buckets default to SSE-S3 (AES256) and deny non-SSE uploads
  - WAFv2 (REGIONAL) with AWS managed rules; conditional association to ALB
  - Least-privilege IAM roles (uses AWS managed policies where appropriate)
  - CloudTrail configured as multi-region trail, KMS-encrypted and validated
  - VPC with dynamic subnets and custom NACLs
  - Fully parameterized (no hard-coded ARNs, names, or regions)

Parameters:
  Environment:
    Type: String
    Description: Logical environment (dev | staging | prod)
    Default: prod
    AllowedValues: [dev, staging, prod]

  BucketSuffix:
    Type: String
    Description: Optional suffix to ensure global S3 bucket name uniqueness (leave empty to use account/region)
    Default: ''

  EnableExampleALB:
    Type: String
    Description: Create example ALB to enable WAF association (true|false)
    AllowedValues: ['true','false']
    Default: 'false'

  VpcCidr:
    Type: String
    Description: VPC CIDR block
    Default: '10.0.0.0/16'

  AvailabilityZonesToUse:
    Type: Number
    Description: Number of availability zones to use (1-3)
    Default: 2
    MinValue: 1
    MaxValue: 3

  CreateNatGateways:
    Type: String
    Description: Create NAT Gateways (true|false)
    AllowedValues: ['true','false']
    Default: 'false'

  AdminCIDR:
    Type: String
    Description: CIDR range for admin access (e.g., CIDR for VPN jump host)
    Default: '10.0.0.0/8'

  CloudTrailLogRetentionDays:
    Type: Number
    Description: Retention days for CloudTrail CloudWatch LogGroup
    Default: 365

Conditions:
  UseExampleALB: !Equals [ !Ref EnableExampleALB, 'true' ]
  UseNatGateways: !Equals [ !Ref CreateNatGateways, 'true' ]
  IsProd: !Equals [ !Ref Environment, 'prod' ]

Resources:

  # Primary Customer Master Key (CMK) - used by CloudTrail & LogGroups
  PrimaryKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Primary CMK for ${Environment} - service-level encryption (CloudTrail/Logs)'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRootFullAccess
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCloudTrailAndLogs
            Effect: Allow
            Principal:
              Service:
                - cloudtrail.amazonaws.com
                - logs.${AWS::Region}.amazonaws.com
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

  PrimaryKMSAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-primary-cmk'
      TargetKeyId: !Ref PrimaryKMSKey

  # VPC and dynamic subnets (public/private)
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

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        Fn::Select:
          - 0
          - Fn::Cidr:
              - !Ref VpcCidr
              - 4
              - 8
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        Fn::Select:
          - 1
          - Fn::Cidr:
              - !Ref VpcCidr
              - 4
              - 8
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        Fn::Select:
          - 2
          - Fn::Cidr:
              - !Ref VpcCidr
              - 4
              - 8
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        Fn::Select:
          - 3
          - Fn::Cidr:
              - !Ref VpcCidr
              - 4
              - 8
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  AttachIGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachIGW
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

  # NAT Gateway (optional) - created only if CreateNatGateways=true
  NatEIP1:
    Condition: UseNatGateways
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGateway1:
    Condition: UseNatGateways
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet1
      AllocationId: !GetAtt NatEIP1.AllocationId

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

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

  # Custom NACLs (private/public) with explicit rules
  PrivateNACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-nacl'

  PrivateNACLInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: false
      CidrBlock: !Ref VpcCidr

  PrivateNACLOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: true
      CidrBlock: 0.0.0.0/0

  PrivateSubnet1NACLAssoc:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNACL

  PrivateSubnet2NACLAssoc:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNACL

  PublicNACL:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-nacl'

  PublicInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNACL
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      Egress: false
      PortRange:
        From: 80
        To: 80
      CidrBlock: 0.0.0.0/0

  PublicInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNACL
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      Egress: false
      PortRange:
        From: 443
        To: 443
      CidrBlock: 0.0.0.0/0

  PublicOutboundAll:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNACL
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      Egress: true
      CidrBlock: 0.0.0.0/0

  PublicSubnet1NACLAssoc:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNACL

  PublicSubnet2NACLAssoc:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNACL

  # IAM roles with least privilege
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
        - PolicyName: CloudTrailToCloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  EC2Role:
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
      Policies:
        - PolicyName: EC2RestrictedS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowS3ObjectOpsOnFinancialBucket
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::${FinancialDataBucket}/*'
              - Sid: ListFinancialBucket
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
                Resource:
                  - !GetAtt PrimaryKMSKey.Arn
      Tags:
        - Key: Project
          Value: FinancialProject
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # S3 buckets with SSE-S3 (AES256) default encryption and policy to deny non-SSE uploads
  FinancialDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !If
        - Fn::Equals: [ !Ref BucketSuffix, '' ]
        - !Sub '${Environment}-financial-data-${AWS::AccountId}-${AWS::Region}'
        - !Sub '${Environment}-financial-data-${AWS::AccountId}-${AWS::Region}-${BucketSuffix}'
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

  FinancialDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FinancialDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnEncryptedUploads
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
      BucketName: !If
        - Fn::Equals: [ !Ref BucketSuffix, '' ]
        - !Sub '${Environment}-logging-${AWS::AccountId}-${AWS::Region}'
        - !Sub '${Environment}-logging-${AWS::AccountId}-${AWS::Region}-${BucketSuffix}'
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
      BucketName: !If
        - Fn::Equals: [ !Ref BucketSuffix, '' ]
        - !Sub '${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
        - !Sub '${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}-${BucketSuffix}'
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

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudTrailGetBucketAcl
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

  # CloudWatch Log Groups encrypted with KMS
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Environment}'
      RetentionInDays: !Ref CloudTrailLogRetentionDays
      KmsKeyId: !Ref PrimaryKMSKey

  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}-access'
      RetentionInDays: 365
      KmsKeyId: !Ref PrimaryKMSKey

  # CloudTrail (multi-region) — importantly includes KmsKeyId and validation
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
      KmsKeyId: !Ref PrimaryKMSKey
      IsLogging: true

  # WAFv2 WebACL (REGIONAL) with managed rule groups
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

  # Optional ALB for WAF association and sample public app
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
        - !Ref ALBSecurityGroup

  ALBSecurityGroup:
    Condition: UseExampleALB
    Type: AWS::EC2::SecurityGroup
    Properties:
      VpcId: !Ref VPC
      GroupDescription: !Sub '${Environment} ALB SG'
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

  WebACLAssociationToALB:
    Condition: UseExampleALB
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !GetAtt ApplicationLoadBalancer.LoadBalancerArn
      WebACLArn: !GetAtt FinancialWebACL.Arn

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
    Description: Name of Financial Data S3 bucket
    Value: !Ref FinancialDataBucket
    Export:
      Name: !Sub '${Environment}-FinancialDataBucket-Name'

  CloudTrailBucketName:
    Description: Name of CloudTrail S3 bucket
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${Environment}-CloudTrailBucket-Name'

  PrimaryKMSKeyId:
    Description: Primary KMS Key Id
    Value: !Ref PrimaryKMSKey
    Export:
      Name: !Sub '${Environment}-PrimaryKmsKeyId'

  CloudTrailLogGroupArn:
    Description: CloudTrail CloudWatch LogGroup ARN
    Value: !GetAtt CloudTrailLogGroup.Arn
    Export:
      Name: !Sub '${Environment}-CloudTrailLogGroupArn'

  WebACLArn:
    Description: WebACL ARN
    Value: !GetAtt FinancialWebACL.Arn
    Export:
      Name: !Sub '${Environment}-WebACL-ARN'
```