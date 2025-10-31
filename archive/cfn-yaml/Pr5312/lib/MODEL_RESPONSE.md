### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template for a financial services application with strict security requirements. Let me break down what needs to be included:

1. VPC with Multi-AZ setup
2. Private and Public Subnets across multiple AZs
3. NAT Gateways for outbound internet access
4. Security Groups with restricted SSH access
5. IAM Roles and Policies with least privilege
6. S3 Buckets with encryption, versioning, and no public access
7. RDS or EC2 instances with encrypted EBS volumes
8. CloudTrail for auditing
9. CloudWatch Alarms
10. KMS keys for encryption
11. All resources tagged with Environment: Production

Let me create a comprehensive template that includes all these components.
### Answer 
---

# CloudFormation Template for Secure Financial Services Infrastructure

Here's a comprehensive CloudFormation template that meets all your requirements for a secure, production-ready financial services application:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-ready AWS infrastructure for financial services application with comprehensive security controls'

Parameters:
  TrustedIPRange:
    Type: String
    Default: "10.0.0.0/8"
    Description: CIDR block for trusted IP range allowed for SSH access
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  NotificationEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.21.0/24'

Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting EBS volumes and S3 buckets
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/financial-services-${AWS::StackName}'
      TargetKeyId: !Ref KMSKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Environment
          Value: Production

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSubnet1'
        - Key: Environment
          Value: Production

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSubnet2'
        - Key: Environment
          Value: Production

  # Elastic IPs for NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATEIP1'
        - Key: Environment
          Value: Production

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATEIP2'
        - Key: Environment
          Value: Production

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway1'
        - Key: Environment
          Value: Production

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway2'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
        - Key: Environment
          Value: Production

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
        - Key: Environment
          Value: Production

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion host with restricted SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIPRange
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-BastionSG'
        - Key: Environment
          Value: Production

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ApplicationSG'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSG'
        - Key: Environment
          Value: Production

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALBSG'
        - Key: Environment
          Value: Production

  # VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: !GetAtt VPCFlowLogGroup.Arn
      Tags:
        - Key: Environment
          Value: Production

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt KMSKey.Arn

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPCFlowLog'
        - Key: Environment
          Value: Production

  # S3 Buckets
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: application-data/
      Tags:
        - Key: Environment
          Value: Production

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logging-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      Tags:
        - Key: Environment
          Value: Production

  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-backups-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Id: ReplicateAll
            Status: Enabled
            Priority: 1
            DeleteMarkerReplication:
              Status: Enabled
            Filter: {}
            Destination:
              Bucket: !Sub 'arn:aws:s3:::${AWS::StackName}-backups-replica-${AWS::AccountId}'
              ReplicationTime:
                Status: Enabled
                Time:
                  Minutes: 15
              Metrics:
                Status: Enabled
                EventThreshold:
                  Minutes: 15
              StorageClass: GLACIER_IR
      Tags:
        - Key: Environment
          Value: Production

  # IAM Roles
  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: ApplicationS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: 
                  - !Sub '${ApplicationDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ApplicationDataBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ApplicationRole

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !GetAtt BackupBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub '${BackupBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource: !Sub 'arn:aws:s3:::${AWS::StackName}-backups-replica-${AWS::AccountId}/*'
      Tags:
        - Key: Environment
          Value: Production

  # CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 365
      Tags:
        - Key: Environment
          Value: Production

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationDataBucket.Arn}/'
                - !Sub '${BackupBucket.Arn}/'
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      Tags:
        - Key: Environment
          Value: Production

  # SNS Topic for Alarms
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-alarms'
      DisplayName: Financial Services Application Alarms
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alert when CPU utilization exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmTopic

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnauthorizedAPICalls'
      AlarmDescription: Alert on unauthorized API calls
      MetricName: UnauthorizedAPICalls
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-RootAccountUsage'
      AlarmDescription: Alert when root account is used
      MetricName: RootAccountUsage
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  S3BucketPolicyChangesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-S3BucketPolicyChanges'
      AlarmDescription: Alert on S3 bucket policy changes
      MetricName: S3BucketPolicyChanges
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  SecurityGroupChangesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-SecurityGroupChanges'
      AlarmDescription: Alert on security group changes
      MetricName: SecurityGroupChanges
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Environment
          Value: Production

  # Launch Template for EC2 instances
  ApplicationLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: ami-0c02fb55731490381  # Amazon Linux 2 AMI (update based on region)
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt ApplicationInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref KMSKey
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: Production
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Volume'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "FinancialServices",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization"}
                    ],
                    "resources": ["/"]
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/financial-services",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

  # Auto Scaling Group
  ApplicationAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref ApplicationLaunchTemplate
        Version: !GetAtt ApplicationLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # Secrets Manager for DB credentials
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-secret'
      Description: RDS database master credentials
      KmsKeyId: !Ref KMSKey
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Environment
          Value: Production

  # RDS Database Instance
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: true
      MultiAZ: true
      Tags:
        - Key: Environment
          Value: Production

  # Config for compliance monitoring
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-config-recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-config-delivery'
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref AlarmTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-config-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
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
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: Production

  # GuardDuty for threat detection
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ApplicationLoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  ApplicationDataBucketName:
    Description: Application Data S3 Bucket Name
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppBucket'

  DBEndpoint:
    Description: Database Endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  AlarmTopicArn:
    Description: SNS Topic ARN for CloudWatch Alarms
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlarmTopic'
```

## Key Security Features Implemented

This CloudFormation template implements comprehensive security measures for a financial services application:

### 1. **Encryption at Rest**
- All EBS volumes encrypted with KMS
- S3 buckets encrypted with KMS-managed keys
- RDS database encryption enabled
- CloudWatch Logs encrypted

### 2. **Network Isolation**
- VPC with private subnets isolated from internet
- NAT Gateways for controlled outbound access
- Security groups with minimal required ports
- VPC Flow Logs for network monitoring

### 3. **Access Control**
- IAM roles following least privilege principle
- SSH access restricted to trusted IP ranges
- All S3 buckets private with public access blocked
- Database only accessible from application tier

### 4. **Monitoring & Auditing**
- CloudTrail for API activity tracking
- CloudWatch alarms for security events
- Config for compliance monitoring
- GuardDuty for threat detection
- VPC Flow Logs for network analysis

### 5. **High Availability**
- Multi-AZ deployment across 2 availability zones
- Auto Scaling Group for application resilience
- Multi-AZ RDS database
- NAT Gateways in each AZ

### 6. **Data Protection**
- S3 versioning enabled on all buckets
- Backup bucket with replication
- Database automated backups with 7-day retention
- Deletion protection on critical resources

### 7. **Compliance Features**
- All resources tagged with Environment: Production
- Log retention policies
- AWS Config for continuous compliance monitoring
- CloudTrail log file validation

## Deployment Instructions

1. **Validate the template:**
```bash
aws cloudformation validate-template --template-body file://financial-services-stack.yaml
```

2. **Run cfn-lint validation:**
```bash
cfn-lint financial-services-stack.yaml
```

3. **Deploy the stack:**
```bash
aws cloudformation create-stack \
  --stack-name financial-services-prod \
  --template-body file://financial-services-stack.yaml \
  --parameters \
    ParameterKey=TrustedIPRange,ParameterValue=YOUR_TRUSTED_CIDR \
    ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_IAM
```

4. **Monitor the stack creation:**
```bash
aws cloudformation describe-stacks --stack-name financial-services-prod
```

This template provides a robust, secure foundation for financial services applications while maintaining compliance with AWS best practices and security standards.