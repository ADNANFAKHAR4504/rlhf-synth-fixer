# ideal\_response.md

## Summary

This response delivers a **secure, production-grade infrastructure** for a web application in **us-east-1** that meets every requirement from the use case:

* **AWS WAF (REGIONAL)** protecting an **Application Load Balancer**.
* **WAF logging** delivered to **Kinesis Data Firehose** and stored in a **KMS-encrypted S3 bucket**.
* **Lambda threat-monitoring** function that parses WAF logs and sends alerts via **SNS**.
* **KMS keys** for S3 log encryption and SNS topic encryption.
* A fully private **VPC (“ProdVPC”)** with **3 public + 3 private subnets** across **us-east-1a/b/c**, internet egress via per-AZ **NAT Gateways**.
* **Least-privilege IAM** for Firehose, Lambda, and log readers.
* **Owner** and **Environment** tags on all resources.
* **No circular dependencies** and **zero cfn-lint errors**.
* **All parameters initialized** with sane defaults.
* **WAF Logging destination** uses the **required “aws-waf-logs-” prefix** to pass WAF validation.

## What the assistant should provide

1. A clear acknowledgement of constraints and the region/AZ layout.
2. A short architecture overview diagram description (at minimum, text explaining the data flows).
3. The **final CloudFormation template** (YAML is fine for authoring) plus a note that JSON export can be produced if strictly required.

   * The template must:

     * Name the VPC as **ProdVPC** and follow the naming convention **\[Service]-\[ResourceName]-\[Environment]**.
     * Configure WAF rulesets (e.g., Common, KnownBadInputs, IPReputation).
     * Configure **WAF Logging → Firehose → S3 (KMS)** with required stream name prefix.
     * Use **EventBridge** “Object Created” events from S3 to trigger Lambda (avoids S3→Lambda circular deps).
     * Encrypt SNS with **KMS**, and subscribe the provided email address.
     * Include **Outputs** for IDs/ARNs commonly needed downstream.
4. A concise justification of security choices (SSE-KMS, TLS-only bucket policy, least-privilege policies).
5. **Validation and deployment instructions** (see below).
6. **Post-deploy checks** list.

## Architecture (textual)

* **ALB** in public subnets (A/B/C) receives HTTP traffic, is associated with **WAF WebACL**.
* **WAF** emits logs to **Kinesis Data Firehose** stream named `aws-waf-logs-<env>-<stack>`.
* **Firehose** writes compressed logs to **S3** bucket with **SSE-KMS (LogsKmsKey)**.
* **EventBridge** fires on S3 “Object Created” → invokes **Lambda ThreatMonitor** in private subnets.
* **Lambda** analyzes log lines; on suspicious counts, publishes to **SNS ThreatAlertTopic** (encrypted with **SnsKmsKey**).
* **NAT Gateways** in each public subnet allow private subnets to reach AWS APIs (e.g., SNS, S3).

## Parameter defaults (all initialized)

* `Environment=prod`, `Owner=PlatformTeam`
* `VpcCidr=10.0.0.0/16`
* Public subnets `/24` in `10.0.1.0/24`, `10.0.2.0/24`, `10.0.3.0/24`
* Private subnets `/24` in `10.0.11.0/24`, `10.0.12.0/24`, `10.0.13.0/24`
* `AzA=us-east-1a`, `AzB=us-east-1b`, `AzC=us-east-1c`
* `AlertEmail=alerts@example.com`

## Validation & Deployment

**Lint locally:**

```
cfn-lint lib/TapStack.yml
```

**Validate with CloudFormation:**

```
aws cloudformation validate-template --region us-east-1 --template-body file://lib/TapStack.yml
```

**Deploy:**

```
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name tapstack-prod \
  --template-file lib/TapStack.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

**After deploy:**

* Confirm **SNS** subscription email.
* Verify **WebACL Association** on ALB.
* Generate some blocked requests (e.g., WAF test strings) and confirm:

  * Firehose delivery to S3 (GZIP objects land in bucket).
  * EventBridge → Lambda invocations in CloudWatch Logs.
  * SNS alerts received.

## Why this is “ideal”

* Meets every functional and non-functional constraint.
* Avoids known pitfalls:

  * WAF logging destination **name prefix** requirement.
  * **Circular dependencies** between IAM/KMS/SNS/Lambda.
  * S3→Lambda direct notifications causing ordering issues.
* Uses least-privilege IAM and TLS-only bucket policy.
* Provides explicit **Outputs** to integrate with downstream stacks.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Secure web application environment with WAF, Firehose→S3 logging, threat monitoring Lambda, and KMS encryption

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: Environment name (e.g., prod, dev)
  Owner:
    Type: String
    Default: 'PlatformTeam'
    Description: Owner tag value
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: VPC CIDR block
  PublicSubnetACidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: Public subnet A CIDR
  PublicSubnetBCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: Public subnet B CIDR
  PublicSubnetCCidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: Public subnet C CIDR
  PrivateSubnetACidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: Private subnet A CIDR
  PrivateSubnetBCidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: Private subnet B CIDR
  PrivateSubnetCCidr:
    Type: String
    Default: '10.0.13.0/24'
    Description: Private subnet C CIDR
  AzA:
    Type: String
    Default: 'us-east-1a'
    Description: Availability Zone A
  AzB:
    Type: String
    Default: 'us-east-1b'
    Description: Availability Zone B
  AzC:
    Type: String
    Default: 'us-east-1c'
    Description: Availability Zone C
  AlertEmail:
    Type: String
    Default: 'alerts@example.com'
    Description: Email for threat alerts

Conditions:
  HasAlertEmail: !Not [!Equals [!Ref AlertEmail, '']]

Resources:
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-ProdVPC-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'EC2-IGW-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PublicSubnetACidr
      AvailabilityZone: !Ref AzA
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PublicA-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PublicSubnetBCidr
      AvailabilityZone: !Ref AzB
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PublicB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PublicSubnetCCidr
      AvailabilityZone: !Ref AzC
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PublicC-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PrivateSubnetACidr
      AvailabilityZone: !Ref AzA
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PrivateA-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PrivateSubnetBCidr
      AvailabilityZone: !Ref AzB
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PrivateB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: !Ref PrivateSubnetCCidr
      AvailabilityZone: !Ref AzC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-PrivateC-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayAEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EC2-EIP-NatA-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayBEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EC2-EIP-NatB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayCEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EC2-EIP-NatC-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayAEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub 'EC2-NAT-A-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayBEIP.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'EC2-NAT-B-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NatGatewayC:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayCEIP.AllocationId
      SubnetId: !Ref PublicSubnetC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-NAT-C-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-RT-Public-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

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

  PublicSubnetCRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetC
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-RT-PrivateA-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-RT-PrivateB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRouteTableC:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub 'EC2-RT-PrivateC-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayA

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayB

  PrivateRouteC:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableC
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayC

  ALBSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub 'EC2-SG-ALB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  AppSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application instances
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSG
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub 'EC2-SG-App-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  LambdaSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda function
      VpcId: !Ref ProdVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub 'EC2-SG-Lambda-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'ELB-ALB-${Environment}'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
        - !Ref PublicSubnetC
      SecurityGroups:
        - !Ref ALBSG
      Tags:
        - Key: Name
          Value: !Sub 'ELB-ALB-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'ELB-TG-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProdVPC
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'ELB-TG-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'WAF-WebACL-${Environment}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
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
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: AWSManagedRulesAmazonIpReputationList
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAmazonIpReputationList
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: IpReputationListMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'WAF-WebACL-${Environment}'
      Tags:
        - Key: Name
          Value: !Sub 'WAF-WebACL-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  LogsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for WAF logs encryption - ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableIAMPermissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'KMS-WafLogs-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  LogsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/waflogs-${Environment}'
      TargetKeyId: !Ref LogsKmsKey

  SnsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for SNS topic encryption - ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableIAMPermissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowSNSServiceUse
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
            Condition:
              StringEquals:
                AWS:SourceAccount: !Sub '${AWS::AccountId}'
      Tags:
        - Key: Name
          Value: !Sub 'KMS-SNS-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  SnsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/sns-${Environment}'
      TargetKeyId: !Ref SnsKmsKey

  WafLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - BucketKeyEnabled: true
            ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref LogsKmsKey
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        EventBridgeConfiguration:
          EventBridgeEnabled: true
      Tags:
        - Key: Name
          Value: !Sub 'S3-WafLogs-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  WafLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WafLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${WafLogsBucket}'
              - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: 'false'
          - Sid: AllowFirehoseWrite
            Effect: Allow
            Principal:
              AWS: !GetAtt FirehoseRole.Arn
            Action:
              - s3:PutObject
              - s3:AbortMultipartUpload
            Resource:
              - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'
          - Sid: AllowLogsReadRole
            Effect: Allow
            Principal:
              AWS: !GetAtt LogsReadRole.Arn
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !Sub 'arn:aws:s3:::${WafLogsBucket}'
              - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'

  FirehoseLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/kinesisfirehose/waf-logs-${Environment}'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub 'Logs-Firehose-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  FirehoseRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-Firehose-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: firehose.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FirehoseToS3
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:AbortMultipartUpload
                  - s3:GetBucketLocation
                  - s3:GetObject
                  - s3:ListBucket
                  - s3:ListBucketMultipartUploads
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}'
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogStream
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/kinesisfirehose/waf-logs-${Environment}:*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt LogsKmsKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Role-Firehose-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # IMPORTANT: WAF requires destination names to start with 'aws-waf-logs-'.
  # Using StackName ensures uniqueness, satisfies prefix rule, and avoids conflicts.
  WafLogsDeliveryStream:
    Type: AWS::KinesisFirehose::DeliveryStream
    Properties:
      DeliveryStreamName: !Sub 'aws-waf-logs-${Environment}-${AWS::StackName}'
      DeliveryStreamType: DirectPut
      ExtendedS3DestinationConfiguration:
        BucketARN: !Sub 'arn:aws:s3:::${WafLogsBucket}'
        RoleARN: !GetAtt FirehoseRole.Arn
        BufferingHints:
          IntervalInSeconds: 300
          SizeInMBs: 5
        CompressionFormat: GZIP
        CloudWatchLoggingOptions:
          Enabled: true
          LogGroupName: !Ref FirehoseLogGroup
          LogStreamName: 'delivery'
        EncryptionConfiguration:
          KMSEncryptionConfig:
            AWSKMSKeyARN: !GetAtt LogsKmsKey.Arn

  WAFLoggingConfiguration:
    Type: AWS::WAFv2::LoggingConfiguration
    Properties:
      ResourceArn: !GetAtt WebACL.Arn
      LogDestinationConfigs:
        - !GetAtt WafLogsDeliveryStream.Arn

  ThreatAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'SNS-ThreatAlerts-${Environment}'
      KmsMasterKeyId: !Ref SnsKmsKey
      Tags:
        - Key: Name
          Value: !Sub 'SNS-ThreatAlerts-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ThreatAlertEmailSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasAlertEmail
    Properties:
      Protocol: email
      TopicArn: !Ref ThreatAlertTopic
      Endpoint: !Ref AlertEmail

  ThreatMonitoringLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-ThreatLambda-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: ThreatMonitoringPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}'
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt LogsKmsKey.Arn
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref ThreatAlertTopic
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      Tags:
        - Key: Name
          Value: !Sub 'Role-ThreatLambda-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ThreatMonitoringLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'Lambda-ThreatMonitor-${Environment}'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt ThreatMonitoringLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSG
        SubnetIds:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
          - !Ref PrivateSubnetC
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref ThreatAlertTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from collections import defaultdict
          from urllib.parse import unquote_plus

          s3 = boto3.client('s3')
          sns = boto3.client('sns')

          def _process_object(bucket, key):
              threat_count = 0
              blocked_ips = defaultdict(int)
              rule_matches = defaultdict(int)

              resp = s3.get_object(Bucket=bucket, Key=key)
              body = resp['Body'].read().decode('utf-8', errors='ignore')

              for line in body.splitlines():
                  line = line.strip()
                  if not line:
                      continue
                  try:
                      entry = json.loads(line)
                  except Exception:
                      continue

                  action = entry.get('action', '')
                  if action == 'BLOCK':
                      threat_count += 1
                      client_ip = entry.get('httpRequest', {}).get('clientIP', 'unknown')
                      blocked_ips[client_ip] += 1

                      for rg in entry.get('ruleGroupList', []):
                          term = rg.get('terminatingRule') or {}
                          rid = term.get('ruleId')
                          if rid:
                              rule_matches[rid] += 1

                      for label in entry.get('labels', []):
                          name = (label or {}).get('name', '')
                          if any(t in name.lower() for t in ['bot', 'sqli', 'xss', 'malicious']):
                              rule_matches[name] += 1

              if threat_count > 0:
                  top_ips = sorted(blocked_ips.items(), key=lambda x: x[1], reverse=True)[:5]
                  top_rules = sorted(rule_matches.items(), key=lambda x: x[1], reverse=True)[:5]

                  msg = []
                  msg.append('WAF Threat Alert')
                  msg.append(f'Total blocked requests: {threat_count}')
                  if top_ips:
                      msg.append('Top offending IPs:')
                      for ip, c in top_ips:
                          msg.append(f'  {ip}: {c}')
                  if top_rules:
                      msg.append('Top triggered rules:')
                      for r, c in top_rules:
                          msg.append(f'  {r}: {c}')
                  sns.publish(TopicArn=os.environ['SNS_TOPIC_ARN'],
                              Subject='WAF Security Alert',
                              Message='\n'.join(msg))

          def lambda_handler(event, context):
              if 'detail' in event and event.get('source') == 'aws.s3':
                  detail = event['detail']
                  bucket = detail.get('bucket', {}).get('name')
                  key = detail.get('object', {}).get('key')
                  if bucket and key:
                      _process_object(bucket, unquote_plus(key))
                  return {'statusCode': 200, 'body': 'OK'}

              for rec in event.get('Records', []):
                  if rec.get('eventSource') == 'aws:s3':
                      bucket = rec['s3']['bucket']['name']
                      key = rec['s3']['object']['key']
                      _process_object(bucket, unquote_plus(key))
              return {'statusCode': 200, 'body': 'OK'}
      Tags:
        - Key: Name
          Value: !Sub 'Lambda-ThreatMonitor-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # EventBridge notifications for S3 object creation → Lambda
  S3ObjectCreatedRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'EVT-S3ObjectCreated-${Environment}'
      State: ENABLED
      EventPattern:
        source:
          - aws.s3
        detail-type:
          - Object Created
        detail:
          bucket:
            name:
              - !Ref WafLogsBucket
      Targets:
        - Id: Target0
          Arn: !GetAtt ThreatMonitoringLambda.Arn

  LambdaInvokeFromEventsPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ThreatMonitoringLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt S3ObjectCreatedRule.Arn

  LogsReadRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-LogsRead-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LogsReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}'
                  - !Sub 'arn:aws:s3:::${WafLogsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt LogsKmsKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Role-LogsRead-${Environment}'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref ProdVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnetIds:
    Description: Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnetA, !Ref PublicSubnetB, !Ref PublicSubnetC]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: Private Subnet IDs
    Value: !Join [',', [!Ref PrivateSubnetA, !Ref PrivateSubnetB, !Ref PrivateSubnetC]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  LoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerArn'

  LoadBalancerDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNSName'

  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TargetGroupArn'

  WebACLArn:
    Description: WAF WebACL ARN
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACLArn'

  WafLogsBucketName:
    Description: WAF Logs Bucket Name
    Value: !Ref WafLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-WafLogsBucketName'

  WafLogsBucketArn:
    Description: WAF Logs Bucket ARN
    Value: !Sub 'arn:aws:s3:::${WafLogsBucket}'
    Export:
      Name: !Sub '${AWS::StackName}-WafLogsBucketArn'

  LogsKmsKeyArn:
    Description: Logs KMS Key ARN
    Value: !GetAtt LogsKmsKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LogsKmsKeyArn'

  SnsTopicArn:
    Description: SNS Topic ARN
    Value: !Ref ThreatAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SnsTopicArn'

  ThreatLambdaArn:
    Description: Threat Monitoring Lambda ARN
    Value: !GetAtt ThreatMonitoringLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ThreatLambdaArn'

  LogsReadRoleArn:
    Description: Logs Read Role ARN
    Value: !GetAtt LogsReadRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LogsReadRoleArn'

  FirehoseStreamArn:
    Description: Kinesis Data Firehose Delivery Stream ARN
    Value: !GetAtt WafLogsDeliveryStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-FirehoseStreamArn'
```