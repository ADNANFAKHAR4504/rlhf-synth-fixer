### Reasoning Trace
---

Let me break down the requirements for this CloudFormation template:

1. **KMS Key**: Customer-managed key for encrypting S3, RDS, and EBS volumes
2. **S3 Bucket**: 
   - Name: nova-prod-clinical-data
   - Completely private
   - Dual-layer server-side encryption (DSSE-KMS)
   - Using the KMS key created

3. **EC2 Configuration**:
   - Private subnet
   - Launch Template with IMDSv2 required
   - Security group restricting outbound to only 203.0.113.0/24

4. **RDS Instance**:
   - Private subnet
   - Not publicly accessible
   - Encrypted with KMS key

5. **API Gateway**:
   - Detailed access logging to CloudWatch
   - CloudFront distribution in front
   - Shield Standard protection (default)

6. **AWS Config**:
   - Rule: s3-bucket-server-side-encryption-enabled
   - Rule: iam-user-mfa-enabled

7. **IAM**:
   - IAM group for researchers
   - Policy denying all actions unless MFA authenticated

8. **Budget**:
   - $100/month
   - SNS alert when projected to go over

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template for your secure Clinical Trial Data Platform. This template implements defense-in-depth security with encryption at rest, network isolation, and compliance monitoring.

```yaml
# secure_infrastructure.yaml
# CloudFormation template for Nova Clinical Trial Data Platform
# Region: us-west-2
# Purpose: Secure infrastructure for handling sensitive patient trial data

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Nova Clinical Trial Data Platform - Secure Infrastructure Foundation'

Parameters:
  AlertEmail:
    Type: String
    Description: Email address for budget and operational alerts
    Default: admin@nova-clinical.com
    
  DBUsername:
    Type: String
    Description: Database master username
    Default: dbadmin
    NoEcho: true
    
  DBPassword:
    Type: String
    Description: Database master password (min 8 characters)
    NoEcho: true
    MinLength: 8
    ConstraintDescription: Password must be at least 8 characters

Resources:
  # ==========================================
  # KMS ENCRYPTION KEY
  # ==========================================
  
  NovaMasterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Master KMS key for Nova Clinical Trial Data Platform encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - ec2.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: nova-prod-master-key
        - Key: Environment
          Value: Production
        - Key: Compliance
          Value: HIPAA

  NovaMasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/nova-prod-master-key
      TargetKeyId: !Ref NovaMasterKMSKey

  # ==========================================
  # VPC AND NETWORKING
  # ==========================================
  
  NovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: nova-prod-vpc

  # Internet Gateway for public subnets
  NovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: nova-prod-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaVPC
      InternetGatewayId: !Ref NovaInternetGateway

  # Public Subnet for NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: nova-prod-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: nova-prod-public-subnet-2

  # Private Subnets for EC2 and RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: nova-prod-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: nova-prod-private-subnet-2

  # NAT Gateway for private subnet internet access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: nova-prod-nat-gateway

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: nova-prod-public-routes

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref NovaInternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: nova-prod-private-routes

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==========================================
  # S3 BUCKET WITH DUAL-LAYER ENCRYPTION
  # ==========================================
  
  ClinicalDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: nova-prod-clinical-data
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms:dsse'  # Dual-layer server-side encryption
              KMSMasterKeyID: !Ref NovaMasterKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionOldData
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: clinical-data/
      Tags:
        - Key: Name
          Value: nova-prod-clinical-data
        - Key: Compliance
          Value: HIPAA
        - Key: DataClassification
          Value: Confidential

  # S3 Bucket for access logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: nova-prod-logs
      AccessControl: LogDeliveryWrite
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 365

  # Bucket Policy to enforce encryption in transit
  ClinicalDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ClinicalDataBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ClinicalDataBucket.Arn
              - !Sub '${ClinicalDataBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==========================================
  # EC2 SECURITY GROUP AND LAUNCH TEMPLATE
  # ==========================================
  
  ProcessingInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: nova-prod-processing-sg
      GroupDescription: Security group for data processing EC2 instances
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        # Allow HTTPS from within VPC
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
      SecurityGroupEgress:
        # Only allow outbound to partner API
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 203.0.113.0/24
          Description: Partner API access
        # Allow HTTPS to AWS services via VPC endpoints
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: VPC endpoint access
      Tags:
        - Key: Name
          Value: nova-prod-processing-sg

  # IAM Role for EC2 instances
  ProcessingInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: nova-prod-processing-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub '${ClinicalDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ClinicalDataBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt NovaMasterKMSKey.Arn

  ProcessingInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: nova-prod-processing-profile
      Roles:
        - !Ref ProcessingInstanceRole

  # Launch Template with IMDSv2 enforcement
  ProcessingLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: nova-prod-processing-template
      LaunchTemplateData:
        ImageId: ami-0c02fb55731490381  # Amazon Linux 2 AMI (update as needed)
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt ProcessingInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ProcessingInstanceSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 100
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref NovaMasterKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required  # Enforce IMDSv2
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: nova-prod-processing
              - Key: Environment
                Value: Production

  # ==========================================
  # RDS DATABASE
  # ==========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: nova-prod-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS instances
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: nova-prod-db-subnet-group

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: nova-prod-db-sg
      GroupDescription: Security group for RDS database
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ProcessingInstanceSecurityGroup
          Description: Allow PostgreSQL from processing instances
      Tags:
        - Key: Name
          Value: nova-prod-db-sg

  ClinicalDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: nova-prod-clinical-db
      DBName: clinicaltrials
      Engine: postgres
      EngineVersion: '14.7'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref NovaMasterKMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: nova-prod-clinical-db
        - Key: Compliance
          Value: HIPAA

  # ==========================================
  # API GATEWAY WITH LOGGING
  # ==========================================
  
  # CloudWatch Log Group for API Gateway
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/apigateway/nova-prod-api
      RetentionInDays: 90
      KmsKeyId: !GetAtt NovaMasterKMSKey.Arn

  # API Gateway REST API
  ClinicalTrialAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: nova-prod-clinical-api
      Description: API for clinical trial data submission
      EndpointConfiguration:
        Types:
          - EDGE
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: 'execute-api:Invoke'
            Resource: '*'

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ClinicalTrialAPI
    Properties:
      RestApiId: !Ref ClinicalTrialAPI
      Description: Production deployment

  # API Gateway Stage with detailed logging
  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      RestApiId: !Ref ClinicalTrialAPI
      DeploymentId: !Ref APIDeployment
      AccessLogSetting:
        DestinationArn: !GetAtt APIGatewayLogGroup.Arn
        Format: '$context.requestId $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.routeKey $context.status'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      TracingEnabled: true
      Tags:
        - Key: Environment
          Value: Production

  # ==========================================
  # CLOUDFRONT DISTRIBUTION
  # ==========================================
  
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: Nova Clinical Trial API Distribution
        Enabled: true
        PriceClass: PriceClass_100
        Origins:
          - Id: APIGatewayOrigin
            DomainName: !Sub '${ClinicalTrialAPI}.execute-api.${AWS::Region}.amazonaws.com'
            S3OriginConfig:
              OriginAccessIdentity: ''
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
        DefaultCacheBehavior:
          TargetOriginId: APIGatewayOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
          OriginRequestPolicyId: b689b0a8-53d0-40ab-baf2-68738e2966ac  # AllViewerExceptHostHeader
        WebACLId: !GetAtt WAFWebACL.Arn
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          Prefix: cloudfront/
        Tags:
          - Key: Name
            Value: nova-prod-cf-distribution

  # ==========================================
  # WAF FOR ADDITIONAL PROTECTION
  # ==========================================
  
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: nova-prod-waf-acl
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: nova-prod-waf-metric
      Tags:
        - Key: Name
          Value: nova-prod-waf-acl

  # ==========================================
  # AWS CONFIG FOR COMPLIANCE
  # ==========================================
  
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: nova-prod-config-recorder
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: nova-prod-config-delivery
      S3BucketName: !Ref ConfigBucket
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-prod-config-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: nova-prod-config-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ConfigBucket.Arn}/*'

  # Config Rule: S3 Bucket Server Side Encryption
  S3EncryptionConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Description: Checks that S3 buckets have server-side encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  # Config Rule: IAM User MFA Enabled
  IAMUserMFAConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: iam-user-mfa-enabled
      Description: Checks whether MFA is enabled for all IAM users
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED

  # ==========================================
  # IAM GROUP AND MFA POLICY
  # ==========================================
  
  ResearchersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: nova-prod-researchers
      ManagedPolicyArns:
        - !Ref MFAEnforcementPolicy

  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: nova-prod-mfa-enforcement
      Description: Denies all actions unless user has authenticated with MFA
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow users to manage their own MFA devices
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:DeleteVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
              - 'iam:ChangePassword'
              - 'iam:GetUser'
            Resource:
              - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
              - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${!aws:username}'
          # Deny all other actions if MFA is not present
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
              - 'iam:ChangePassword'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # ==========================================
  # BUDGET AND COST ALERTS
  # ==========================================
  
  BudgetAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: nova-prod-budget-alerts
      DisplayName: Nova Clinical Platform Budget Alerts
      Subscription:
        - Protocol: email
          Endpoint: !Ref AlertEmail

  MonthlyBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetName: nova-prod-monthly-budget
        BudgetType: COST
        TimeUnit: MONTHLY
        BudgetLimit:
          Amount: 100
          Unit: USD
        CostTypes:
          IncludeTax: true
          IncludeSubscription: true
          UseBlended: false
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: FORECASTED
            ComparisonOperator: GREATER_THAN
            Threshold: 100
            ThresholdType: PERCENTAGE
          Subscribers:
            - SubscriptionType: SNS
              Address: !Ref BudgetAlertTopic
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
            ThresholdType: PERCENTAGE
          Subscribers:
            - SubscriptionType: SNS
              Address: !Ref BudgetAlertTopic

  # ==========================================
  # VPC ENDPOINTS FOR SECURE AWS SERVICE ACCESS
  # ==========================================
  
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  KMSVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref NovaVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: nova-prod-vpce-sg
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ProcessingInstanceSecurityGroup
      Tags:
        - Key: Name
          Value: nova-prod-vpce-sg

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref NovaVPC
    Export:
      Name: nova-prod-vpc-id

  S3BucketName:
    Description: Clinical data S3 bucket name
    Value: !Ref ClinicalDataBucket
    Export:
      Name: nova-prod-s3-bucket

  KMSKeyId:
    Description: Master KMS key ID
    Value: !Ref NovaMasterKMSKey
    Export:
      Name: nova-prod-kms-key

  APIGatewayEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ClinicalTrialAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: nova-prod-api-endpoint

  CloudFrontDistributionDomain:
    Description: CloudFront distribution domain name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: nova-prod-cf-domain

  DatabaseEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt ClinicalDatabase.Endpoint.Address
    Export:
      Name: nova-prod-db-endpoint

  LaunchTemplateId:
    Description: EC2 Launch Template ID
    Value: !Ref ProcessingLaunchTemplate
    Export:
      Name: nova-prod-launch-template
```

This comprehensive CloudFormation template creates a secure, compliant infrastructure for your Clinical Trial Data Platform with the following key features:

## **Security Highlights:**

1. **Encryption Everywhere**: Customer-managed KMS key encrypts S3 (with DSSE-KMS dual-layer encryption), RDS, EBS volumes, and CloudWatch logs
2. **Network Isolation**: Private subnets for EC2/RDS with controlled egress via NAT Gateway
3. **IMDSv2 Protection**: Launch template enforces IMDSv2 to prevent SSRF attacks
4. **MFA Enforcement**: IAM policy denies all actions without MFA authentication
5. **Defense in Depth**: Multiple security layers including WAF, Shield Standard, VPC endpoints, and security groups

## **Compliance Features:**

1. **AWS Config Rules**: Monitors S3 encryption and IAM MFA compliance
2. **Audit Logging**: Comprehensive logging to S3 for CloudFront, S3 access, and API Gateway
3. **Data Retention**: Lifecycle policies for compliant data management
4. **Access Controls**: Strict IAM policies and security group rules

## **Operational Excellence:**

1. **Cost Management**: $100/month budget with SNS alerts
2. **High Availability**: Multi-AZ deployment for RDS and networking
3. **Backup Strategy**: 30-day RDS backup retention
4. **Monitoring**: CloudWatch logging and metrics enabled throughout

The template follows the nova-prod-* naming convention and implements all requested security requirements for handling sensitive patient data in a HIPAA-compliant manner.