Model provided best response is as below
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Production Environment Infrastructure with centralized logging, monitoring, and compliance'

Parameters:
  CostCenterTag:
    Type: String
    Description: Cost center tag for resource allocation
    Default: 'CC-PROD-01'
  
  ProjectIDTag:
    Type: String
    Description: Project ID tag for resource tracking
    Default: 'PROJ-SEC-INFRA'
  
  LoggingAccountId:
    Type: String
    Description: AWS Account ID for centralized logging
    AllowedPattern: '[0-9]{12}'
    ConstraintDescription: 'Must be a valid AWS Account ID (12 digits)'
  
  VpcCidr:
    Type: String
    Description: CIDR block for the VPC
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    ConstraintDescription: 'CIDR block must be in the format x.x.x.x/16-28'
  
  PublicSubnet1Cidr:
    Type: String
    Description: CIDR block for the public subnet 1
    Default: '10.0.0.0/24'
    
  PublicSubnet2Cidr:
    Type: String
    Description: CIDR block for the public subnet 2
    Default: '10.0.1.0/24'
    
  PrivateSubnet1Cidr:
    Type: String
    Description: CIDR block for the private subnet 1
    Default: '10.0.2.0/24'
    
  PrivateSubnet2Cidr:
    Type: String
    Description: CIDR block for the private subnet 2
    Default: '10.0.3.0/24'
    
  EnvironmentType:
    Type: String
    Description: Environment type
    Default: 'Production'
    AllowedValues:
      - 'Production'
      - 'Staging'
      - 'Development'
  
  DeploymentRegion:
    Type: String
    Description: Region to deploy resources
    Default: 'us-west-2'
    AllowedValues:
      - 'us-west-2'
      - 'us-east-1'
      
  DatabaseBackupRetentionPeriod:
    Type: Number
    Description: RDS backup retention period in days (minimum 7)
    Default: 7
    MinValue: 7
    MaxValue: 35
    
  DatabaseInstanceType:
    Type: String
    Description: RDS instance type
    Default: 'db.t3.medium'
    AllowedValues:
      - 'db.t3.small'
      - 'db.t3.medium'
      - 'db.t3.large'
      - 'db.m5.large'
      
  DatabasePassword:
    Type: String
    NoEcho: true
    Description: Password for the database
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Mappings:
  RegionMap:
    us-west-2:
      "AMI": "ami-0c55b159cbfafe1f0"
      "AZs": ["us-west-2a", "us-west-2b"]
    us-east-1:
      "AMI": "ami-0b5eea76982371e91"
      "AZs": ["us-east-1a", "us-east-1b"]

Conditions:
  IsPrimary: !Equals [!Ref DeploymentRegion, 'us-west-2']

Resources:
  # IAM Roles with least privilege
  LoggingServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 'logs.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSCloudTrailRole'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag

  CloudWatchLoggingServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 'cloudwatch.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      Policies:
        - PolicyName: CloudWatchLoggingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  WebServerRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: WebServerS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: 
                  - !Sub 'arn:aws:s3:::${AppCodeBucket}/*'
                  - !Sub 'arn:aws:s3:::${AppConfigBucket}/*'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  # AWS Config for compliance auditing
  ConfigRecorderRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 'config.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag

  ConfigRecorder:
    Type: 'AWS::Config::ConfigurationRecorder'
    Properties:
      Name: 'SecureEnvironmentConfigRecorder'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResources: true
      RoleARN: !GetAtt ConfigRecorderRole.Arn
  
  ConfigDeliveryChannel:
    Type: 'AWS::Config::DeliveryChannel'
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: 'One_Hour'
      S3BucketName: !Ref ConfigBucket
  
  ConfigBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Retain
    Properties:
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag

  ConfigBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: 'config.amazonaws.com'
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: 'config.amazonaws.com'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}/AWSLogs/${AWS::AccountId}/Config/*'

  # IAM Role Compliance Rules
  IAMPolicyNoStatementsWithFullAccess:
    Type: 'AWS::Config::ConfigRule'
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: 'iam-policy-no-statements-with-full-access'
      Description: 'Checks if AWS Identity and Access Management (IAM) policies that you create have Allow statements that grant permissions to all actions on all resources.'
      Source:
        Owner: 'AWS'
        SourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS'
  
  # CloudTrail for account auditing
  CloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn: CloudTrailBucketPolicy
    Properties:
      IsLogging: true
      IsMultiRegionTrail: true
      S3BucketName: !Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt LoggingServiceRole.Arn
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  CloudTrailLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: 'CloudTrail/logs'
      RetentionInDays: 90
      
  CloudTrailBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Retain
    Properties:
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'ArchiveAfter90Days'
            Status: 'Enabled'
            ExpirationInDays: 2555  # 7 years
            Transitions:
              - TransitionInDays: 90
                StorageClass: 'STANDARD_IA'
              - TransitionInDays: 180
                StorageClass: 'GLACIER'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  CloudTrailBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          # Allow access from the logging account
          - Sid: CrossAccountAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${LoggingAccountId}:root'
            Action: 's3:GetObject'
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}/AWSLogs/${AWS::AccountId}/*'

  # VPC and Networking
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  VPCFlowLog:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref VPC
      TrafficType: 'ALL'
      LogDestinationType: 's3'
      LogDestination: !Sub 'arn:aws:s3:::${FlowLogBucket}'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  FlowLogBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Retain
    Properties:
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'ArchiveAfter30Days'
            Status: 'Enabled'
            ExpirationInDays: 365
            Transitions:
              - TransitionInDays: 30
                StorageClass: 'STANDARD_IA'
              - TransitionInDays: 90
                StorageClass: 'GLACIER'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  FlowLogBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref FlowLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: 'delivery.logs.amazonaws.com'
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${FlowLogBucket}'
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: 'delivery.logs.amazonaws.com'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${FlowLogBucket}/VPCFlowLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          # Allow access from the logging account
          - Sid: CrossAccountAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${LoggingAccountId}:root'
            Action: 's3:GetObject'
            Resource: !Sub 'arn:aws:s3:::${FlowLogBucket}/VPCFlowLogs/${AWS::AccountId}/*'
  
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  VPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
  
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', 'AZs']]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', 'AZs']]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', 'AZs']]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', 'AZs']]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
  
  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable
  
  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable
  
  ElasticIP1:
    Type: 'AWS::EC2::EIP'
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EIP1'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  ElasticIP2:
    Type: 'AWS::EC2::EIP'
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EIP2'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  NatGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt ElasticIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway1'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  NatGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt ElasticIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway2'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  PrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1
  
  PrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2
  
  PrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1
  
  PrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2
  
  # Strict Security Groups
  WebServerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for web servers with HTTP/HTTPS access'
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
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServerSG'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  DatabaseSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for database instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          FromPort: -1
          ToPort: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSG'
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  # CloudWatch Alarms for IAM Threat Detection
  RootAccountLoginAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmDescription: 'Alarm if root account is used for console login'
      MetricName: 'RootAccountLoginAttempts'
      Namespace: 'CloudTrailMetrics'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      AlarmActions:
        - !Ref SecurityNotificationTopic
      Dimensions:
        - Name: 'By Event Name'
          Value: 'ConsoleLogin'

  SecurityNotificationTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      DisplayName: 'Security Notifications'
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  # Database Configuration
  DBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  RDSInstance:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      AllocatedStorage: 20
      BackupRetentionPeriod: !Ref DatabaseBackupRetentionPeriod
      DBInstanceClass: !Ref DatabaseInstanceType
      DBSubnetGroupName: !Ref DBSubnetGroup
      Engine: 'mysql'
      EngineVersion: '8.0.23'
      MasterUsername: 'admin'
      MasterUserPassword: !Ref DatabasePassword
      MultiAZ: true
      StorageEncrypted: true
      StorageType: 'gp2'
      VPCSecurityGroups:
        - !GetAtt DatabaseSecurityGroup.GroupId
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  # S3 Buckets for Application
  AppCodeBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  AppConfigBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: ProjectID
          Value: !Ref ProjectIDTag
  
  # DDoS Protection and WAF
  WebACL:
    Type: 'AWS::WAFv2::WebACL'
    Properties:
      Name: !Sub '${AWS::StackName}-WebACL'
      Scope: 'REGIONAL'
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-WebACLMetrics'
      Rules:
        - Name: 'AWSManagedRulesCommonRuleSet'
          Priority: 1
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'AWSManagedRulesCommonRuleSetMetric'
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesCommonRuleSet'
        - Name: 'AWSManagedRulesSQLiRuleSet'
          Priority: 2
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'AWSManagedRulesSQLiRuleSetMetric'
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesSQLiRuleSet'

Outputs:
  VPC:
    Description: 'VPC ID'
    Value: !Ref VPC
  
  PublicSubnet1:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
  
  PublicSubnet2:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
  
  PrivateSubnet1:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
  
  PrivateSubnet2:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
  
  WebServerSecurityGroup:
    Description: 'Security Group ID for Web Servers'
    Value: !Ref WebServerSecurityGroup
  
  DatabaseSecurityGroup:
    Description: 'Security Group ID for Database'
    Value: !Ref DatabaseSecurityGroup
  
  DBSubnetGroup:
    Description: 'DB Subnet Group Name'
    Value: !Ref DBSubnetGroup
  
  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
  
  AppCodeBucketName:
    Description: 'S3 Bucket Name for Application Code'
    Value: !Ref AppCodeBucket
  
  AppConfigBucketName:
    Description: 'S3 Bucket Name for Application Configuration'
    Value: !Ref AppConfigBucket
  
  WebACLArn:
    Description: 'ARN of the Web ACL'
    Value: !GetAtt WebACL.Arn
```