# AWS CloudFormation Template: Secure Infrastructure

I'll create a comprehensive CloudFormation template that meets all your security and infrastructure requirements. Here's the complete template:

## secure-infrastructure.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and optimized AWS infrastructure with comprehensive security controls, monitoring, and cost management'

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]
    Description: Environment name for resource naming convention
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for private subnet 1
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for private subnet 2
  
  DatabaseSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: CIDR block for database subnet 1
  
  DatabaseSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: CIDR block for database subnet 2
  
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium]
    Description: EC2 instance type
  
  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    AllowedValues: [db.t3.micro, db.t3.small, db.t3.medium]
    Description: RDS instance class
  
  CostAlertThreshold:
    Type: Number
    Default: 100
    Description: Monthly cost alert threshold in USD

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-008fe2fc65df48dac
    eu-west-1:
      AMI: ami-01dd271720c1ba44f

Resources:
  # ===== VPC AND NETWORKING =====
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SecureInfrastructure

  # Private Subnets for EC2 Instances
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Ref DatabaseSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Ref DatabaseSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  # Route Tables
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-route-table'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-route-table'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref DatabaseRouteTable

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref DatabaseRouteTable

  # Network ACLs
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-network-acl'
        - Key: Environment
          Value: !Ref Environment

  PrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr

  PrivateNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  # ===== SECURITY GROUPS =====
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-ec2-security-group'
      GroupDescription: Security group for EC2 instances with least privilege access
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH access from bastion host only
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTP access from load balancer only
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTPS access from load balancer only
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS outbound for updates and API calls
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: MySQL access to database
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-security-group'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-database-security-group'
      GroupDescription: Security group for RDS database with restricted access
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: MySQL access from EC2 instances only
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-security-group'
        - Key: Environment
          Value: !Ref Environment

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-bastion-security-group'
      GroupDescription: Security group for bastion host (if needed for maintenance)
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: SSH access (restrict to specific IPs in production)
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-bastion-security-group'
        - Key: Environment
          Value: !Ref Environment

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-loadbalancer-security-group'
      GroupDescription: Security group for load balancer
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from internet
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-loadbalancer-security-group'
        - Key: Environment
          Value: !Ref Environment

  # ===== IAM ROLES AND POLICIES =====
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureS3Bucket
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-role'
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-ec2-instance-profile'
      Roles:
        - !Ref EC2Role

  # ===== S3 BUCKETS =====
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionToIA
            Status: Enabled
            TransitionInDays: 30
            StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            TransitionInDays: 90
            StorageClass: GLACIER
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: access-logs/
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SecureStorage

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-logging-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-logging-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Logging

  # ===== EC2 INSTANCES =====
  SecureEC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "metrics": {
              "namespace": "AWS/EC2/Custom",
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 60,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-instance-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SecureCompute

  SecureEC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "metrics": {
              "namespace": "AWS/EC2/Custom",
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 60,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-instance-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SecureCompute

  # ===== RDS DATABASE =====
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-database-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  DatabaseParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${Environment}-database-parameter-group'
      Description: Custom parameter group for enhanced security
      Family: mysql8.0
      Parameters:
        slow_query_log: 1
        long_query_time: 2
        log_queries_not_using_indexes: 1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-parameter-group'
        - Key: Environment
          Value: !Ref Environment

  SecureDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-secure-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: admin
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBParameterGroupName: !Ref DatabaseParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-database'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SecureDatabase

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-monitoring-role'
        - Key: Environment
          Value: !Ref Environment

  # ===== CLOUDTRAIL =====
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldCloudTrailLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail-logs'
        - Key: Environment
          Value: !Ref Environment

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  SecureCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-secure-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket}/*'
            - Type: AWS::S3::Bucket
              Values:
                - !Ref SecureS3Bucket
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

  # ===== CLOUDWATCH =====
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}-secure-bucket'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-s3-log-group'
        - Key: Environment
          Value: !Ref Environment

  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-secure-instances'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-log-group'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-cpu-utilization'
      AlarmDescription: Alarm when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref SecureEC2Instance1
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-high-cpu-alarm'
        - Key: Environment
          Value: !Ref Environment

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-database-high-connections'
      AlarmDescription: Alarm when database connections exceed 80% of max
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 16
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureDatabase
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-connections-alarm'
        - Key: Environment
          Value: !Ref Environment

  # ===== AWS BUDGETS =====
  CostBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetName: !Sub '${Environment}-monthly-cost-budget'
        BudgetLimit:
          Amount: !Ref CostAlertThreshold
          Unit: USD
        TimeUnit: MONTHLY
        BudgetType: COST
        CostFilters:
          TagKey:
            - Environment
          TagValue:
            - !Ref Environment
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
          Subscribers:
            - SubscriptionType: EMAIL
              Address: admin@example.com
        - Notification:
            NotificationType: FORECASTED
            ComparisonOperator: GREATER_THAN
            Threshold: 100
          Subscribers:
            - SubscriptionType: EMAIL
              Address: admin@example.com

Outputs:
  VPCId:
    Description: ID of the created VPC
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  PrivateSubnet1Id:
    Description: ID of Private Subnet 1
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${Environment}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: ID of Private Subnet 2
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${Environment}-private-subnet-2-id'

  DatabaseSubnetGroupName:
    Description: Name of the database subnet group
    Value: !Ref DatabaseSubnetGroup
    Export:
      Name: !Sub '${Environment}-database-subnet-group-name'

  SecureS3BucketName:
    Description: Name of the secure S3 bucket
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${Environment}-secure-s3-bucket-name'

  DatabaseEndpoint:
    Description: RDS Database endpoint
    Value: !GetAtt SecureDatabase.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-database-endpoint'

  EC2Instance1Id:
    Description: ID of EC2 Instance 1
    Value: !Ref SecureEC2Instance1
    Export:
      Name: !Sub '${Environment}-ec2-instance-1-id'

  EC2Instance2Id:
    Description: ID of EC2 Instance 2
    Value: !Ref SecureEC2Instance2
    Export:
      Name: !Sub '${Environment}-ec2-instance-2-id'

  CloudTrailArn:
    Description: ARN of the CloudTrail
    Value: !GetAtt SecureCloudTrail.Arn
    Export:
      Name: !Sub '${Environment}-cloudtrail-arn'

  EC2SecurityGroupId:
    Description: ID of the EC2 Security Group
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${Environment}-ec2-security-group-id'

  DatabaseSecurityGroupId:
    Description: ID of the Database Security Group
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${Environment}-database-security-group-id'
```

## Key Security Features Implemented

### 🔒 **Network Security**
- **Private Subnets Only**: All EC2 instances and databases are deployed in private subnets with no public IP addresses
- **Security Groups**: Implement least privilege access with specific port and source restrictions
- **Network ACLs**: Additional layer of subnet-level security controls
- **VPC Isolation**: Complete network isolation with proper CIDR segmentation

### 🛡️ **Data Protection**
- **S3 Encryption**: All S3 buckets use server-side encryption (SSE-S3)
- **EBS Encryption**: All EBS volumes are encrypted at rest
- **
