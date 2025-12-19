# Complete Production-Grade AWS CloudFormation Template for SOC 2 Compliance

Here is the complete, fully functional CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure infrastructure for SOC 2 compliance - Fintech environment'

Parameters:
  CorporateIPRange:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'Corporate IP range for SSH access'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$'
  
  NotificationEmail:
    Type: String
    Description: 'Email address for security notifications'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  
  KeyAdministratorArn:
    Type: String
    Description: 'ARN of the IAM user/role that will administer KMS keys'
    Default: 'arn:aws:iam::123456789012:root'
  
  DBUsername:
    Type: String
    Description: 'Database master username'
    Default: 'dbadmin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBPassword:
    Type: String
    Description: 'Database master password'
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  DomainName:
    Type: String
    Description: 'Domain name for SSL certificate'
    Default: 'example.com'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: 'Latest Amazon Linux 2 AMI ID'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890

Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']

Resources:
  # VPC and Networking
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: prod-vpc
        - Key: environment
          Value: production

  ProdPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: prod-private-subnet-1
        - Key: environment
          Value: production

  ProdPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: prod-private-subnet-2
        - Key: environment
          Value: production

  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.101.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-1
        - Key: environment
          Value: production

  ProdPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.102.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-2
        - Key: environment
          Value: production

  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: prod-igw
        - Key: environment
          Value: production

  ProdVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  ProdNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdEIPForNAT.AllocationId
      SubnetId: !Ref ProdPublicSubnet1
      Tags:
        - Key: Name
          Value: prod-nat-gateway
        - Key: environment
          Value: production

  ProdEIPForNAT:
    Type: AWS::EC2::EIP
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-nat-eip
        - Key: environment
          Value: production

  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: prod-public-rt
        - Key: environment
          Value: production

  ProdPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: prod-private-rt
        - Key: environment
          Value: production

  ProdPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdInternetGateway

  ProdPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdNATGateway

  ProdPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet1
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet2
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet1
      RouteTableId: !Ref ProdPrivateRouteTable

  ProdPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet2
      RouteTableId: !Ref ProdPrivateRouteTable

  # KMS Key for Encryption
  ProdKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Production environment customer-managed KMS key'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:Decrypt'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
            Resource: '*'
          - Sid: Allow EBS Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow SNS Service
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: prod-kms-key
        - Key: environment
          Value: production

  ProdKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/prod-encryption-key
      TargetKeyId: !Ref ProdKMSKey

  # S3 Buckets with Encryption
  ProdCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 2555  # 7 years for compliance
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: prod-cloudtrail-bucket
        - Key: environment
          Value: production

  ProdConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-config-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: prod-config-bucket
        - Key: environment
          Value: production

  ProdApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-application-data-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: prod-application-bucket
        - Key: environment
          Value: production

  # CloudTrail Bucket Policy
  ProdCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ProdCloudTrailBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/prod-cloudtrail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ProdCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/prod-cloudtrail'

  # Config Bucket Policy
  ProdConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ProdConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ProdConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ProdConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  # CloudWatch Log Group for CloudTrail
  ProdCloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudtrail/prod-trail
      RetentionInDays: 365
      KmsKeyId: !GetAtt ProdKMSKey.Arn
      Tags:
        - Key: Name
          Value: prod-cloudtrail-logs
        - Key: environment
          Value: production

  # CloudTrail Role
  ProdCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-cloudtrail-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !Sub '${ProdCloudTrailLogGroup.Arn}:*'
      Tags:
        - Key: Name
          Value: prod-cloudtrail-role
        - Key: environment
          Value: production

  # CloudTrail
  ProdCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: ProdCloudTrailBucketPolicy
    Properties:
      TrailName: prod-cloudtrail
      S3BucketName: !Ref ProdCloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: 
                - 'arn:aws:s3:::*/*'
            - Type: 'AWS::Lambda::Function'
              Values: 
                - 'arn:aws:lambda:*'
      CloudWatchLogsLogGroupArn: !Sub '${ProdCloudTrailLogGroup.Arn}:*'
      CloudWatchLogsRoleArn: !GetAtt ProdCloudTrailRole.Arn
      KMSKeyId: !Ref ProdKMSKey
      Tags:
        - Key: Name
          Value: prod-cloudtrail
        - Key: environment
          Value: production

  # AWS Config Service Role
  ProdConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-config-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ProdConfigBucket.Arn
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub '${ProdConfigBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control
              - Effect: Allow
                Action: s3:GetObject
                Resource: !Sub '${ProdConfigBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: prod-config-role
        - Key: environment
          Value: production

  # AWS Config Configuration Recorder
  ProdConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: prod-config-recorder
      RoleARN: !GetAtt ProdConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # AWS Config Delivery Channel
  ProdConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: prod-config-delivery-channel
      S3BucketName: !Ref ProdConfigBucket

  # AWS Config Rules
  ProdConfigRuleMFA:
    Type: AWS::Config::ConfigRule
    DependsOn: ProdConfigRecorder
    Properties:
      ConfigRuleName: prod-iam-user-mfa-enabled
      Description: 'Checks whether the AWS Identity and Access Management users have multi-factor authentication (MFA) enabled'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED
      Tags:
        - Key: Name
          Value: prod-mfa-config-rule
        - Key: environment
          Value: production

  # SNS Topic for Security Notifications
  ProdSecurityNotificationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: prod-security-notifications
      DisplayName: 'Production Security Notifications'
      KmsMasterKeyId: !Ref ProdKMSKey
      Tags:
        - Key: Name
          Value: prod-security-notifications
        - Key: environment
          Value: production

  ProdSecurityNotificationsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref ProdSecurityNotificationsTopic
      Endpoint: !Ref NotificationEmail

  # SNS Topic Policy for CloudWatch Events
  ProdSNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref ProdSecurityNotificationsTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchEventsToPublish
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sns:Publish
            Resource: !Ref ProdSecurityNotificationsTopic

  # CloudWatch Metric Filter for Unauthorized Operations
  ProdUnauthorizedOperationMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref ProdCloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricNamespace: 'ProdSecurity'
          MetricName: 'UnauthorizedOperations'
          MetricValue: '1'

  # CloudWatch Alarm for Unauthorized Operations
  ProdUnauthorizedOperationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-unauthorized-operations
      AlarmDescription: 'Alarm for unauthorized operations or access denied events'
      MetricName: 'UnauthorizedOperations'
      Namespace: 'ProdSecurity'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref ProdSecurityNotificationsTopic
      Tags:
        - Key: Name
          Value: prod-unauthorized-operations-alarm
        - Key: environment
          Value: production

  # CloudWatch Events Rule for Config Compliance
  ProdConfigComplianceRule:
    Type: AWS::Events::Rule
    Properties:
      Name: prod-config-compliance-rule
      Description: 'Trigger SNS notification for non-compliant resources'
      EventPattern:
        source:
          - aws.config
        detail-type:
          - Config Rules Compliance Change
        detail:
          newEvaluationResult:
            complianceType:
              - NON_COMPLIANT
      State: ENABLED
      Targets:
        - Arn: !Ref ProdSecurityNotificationsTopic
          Id: 'ConfigComplianceTarget'

  # Security Groups
  ProdALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-alb-sg
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: prod-alb-sg
        - Key: environment
          Value: production

  ProdWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-web-sg
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ProdALBSecurityGroup
          Description: 'HTTP access from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ProdALBSecurityGroup
          Description: 'HTTPS access from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref CorporateIPRange
          Description: 'SSH access from corporate network'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: prod-web-sg
        - Key: environment
          Value: production

  ProdDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-db-sg
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: prod-db-sg
        - Key: environment
          Value: production

  # IAM Role for EC2 Instances
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-ec2-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ProdApplicationBucket.Arn
                  - !Sub '${ProdApplicationBucket.Arn}/*'
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
      Tags:
        - Key: Name
          Value: prod-ec2-role
        - Key: environment
          Value: production

  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: prod-ec2-instance-profile
      Roles:
        - !Ref ProdEC2Role

  # RDS Subnet Group
  ProdDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: prod-db-subnet-group
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref ProdPrivateSubnet1
        - !Ref ProdPrivateSubnet2
      Tags:
        - Key: Name
          Value: prod-db-subnet-group
        - Key: environment
          Value: production

  # RDS Instance
  ProdRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: prod-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref ProdKMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref ProdDatabaseSecurityGroup
      DBSubnetGroupName: !Ref ProdDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: prod-database
        - Key: environment
          Value: production

  # Application Load Balancer
  ProdApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: prod-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ProdALBSecurityGroup
      Subnets:
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      Tags:
        - Key: Name
          Value: prod-alb
        - Key: environment
          Value: production

  # ACM Certificate
  ProdSSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      