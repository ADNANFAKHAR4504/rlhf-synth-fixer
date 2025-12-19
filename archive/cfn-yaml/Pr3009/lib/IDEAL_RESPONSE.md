AWSTemplateFormatVersion: '2010-09-09'
Description: 'Comprehensive security-focused multi-service AWS infrastructure for medium-sized enterprise'

Parameters:
  Environment:
    Type: String
    Default: 'Production'
    AllowedValues: ['Development', 'Staging', 'Production']
    Description: 'Environment type for resource tagging and configuration'
  
  EnvironmentSuffix:
    Type: String
    Default: 'iac'
    Description: 'Suffix for resource tagging and configuration'
  
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([0-9]|[1-2][0-9]|3[0-2])$'
  
  VPCCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
  
  PrivateSubnetCidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for private subnet'
  
  PublicSubnetCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet'
  
  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database administrator username'
    NoEcho: true

Resources:
  # ==============================================
  # KMS Keys for Encryption
  # ==============================================
  
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
          - Sid: Allow cloudtrail Service
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
          - Sid: Allow Log Service
            Effect: Allow
            Principal:
              Service: logs.us-east-1.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-s3-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-s3-encryption-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref S3KMSKey

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for RDS encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-rds-encryption-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSKMSKey

  # ==============================================
  # VPC and Networking Components
  # ==============================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw-${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnetCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-${EnvironmentSuffix}'

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetCidr
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-${EnvironmentSuffix}'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-routes-${EnvironmentSuffix}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # ==============================================
  # Security Groups
  # ==============================================
  
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-web-security-group'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-database-security-group-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # IAM Roles and Policies
  # ==============================================
  
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-role-${EnvironmentSuffix}'
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
                  - s3:DeleteObject
                Resource: 
                  - !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationBucket.Arn
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: 
                  - !GetAtt S3KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-ec2-instance-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  WebApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-web-app-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DatabaseAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${DatabaseInstance}'
        - PolicyName: S3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource: 
                  - !GetAtt ApplicationBucket.Arn
                  - !Sub '${ApplicationBucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # S3 Buckets with Security Configuration
  # ==============================================
  
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: 'prod-secure-app-bucket-iac'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-application-bucket'
        - Key: Environment
          Value: !Ref Environment

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

          - Sid: AWSCloudTrailGetBucketAcl
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:Get*
            Resource: !GetAtt LoggingBucket.Arn


  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: 'prod-security-logs-bucket-iac'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetentionRule
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-logging-bucket'
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # RDS Database with Security Configuration
  # ==============================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet
        - !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}/database/credentials-iacsss'
      Description: 'Database credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      KmsKeyId: !GetAtt RDSKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-secure-database-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.37'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSKMSKey.Arn
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-database'
        - Key: Environment
          Value: !Ref Environment

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # ==============================================
  # CloudTrail Configuration
  # ==============================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${Environment}-security-cloudtrail-${EnvironmentSuffix}'
      S3BucketName: !Ref LoggingBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !GetAtt S3KMSKey.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub 'arn:aws:s3:::${ApplicationBucket}/'
                - !Sub 'arn:aws:s3:::${ApplicationBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # CloudWatch Logging and Monitoring
  # ==============================================
  
  SecurityLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/${Environment}-${EnvironmentSuffix}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt S3KMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${Environment}-${EnvironmentSuffix}'
      RetentionInDays: 90

  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-unauthorized-access-alarm-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: ErrorCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching

  SecurityAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-security-alerts-${EnvironmentSuffix}'
      KmsMasterKeyId: !GetAtt S3KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # AWS WAF Configuration
  # ==============================================
  
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${Environment}-web-acl-${EnvironmentSuffix}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
        - Name: RateLimitRule
          Priority: 3
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRuleMetric
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${Environment}WebACLMetric'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==============================================
  # EC2 Instance with Security Configuration
  # ==============================================
  
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI (update as needed)
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch Agent
          cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/secure",
                      "log_group_name": "${SecurityLogGroup}",
                      "log_stream_name": "{instance_id}-secure",
                      "timezone": "UTC"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "namespace": "AWS/EC2/Custom",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                  ]
                },
                "disk": {
                  "measurement": [
                    "used_percent"
                  ]
                },
                "mem": {
                  "measurement": [
                    "mem_used_percent"
                  ]
                }
              }
            }
          }
          EOF
          
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
          
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-server'
        - Key: Environment
          Value: !Ref Environment

# ==============================================
# Outputs
# ==============================================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VPC-ID-${EnvironmentSuffix}'

  S3BucketName:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${Environment}-App-Bucket-${EnvironmentSuffix}'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-DB-Endpoint-${EnvironmentSuffix}'

  WebACLArn:
    Description: 'Web ACL ARN for WAF'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${Environment}-WebACL-ARN-${EnvironmentSuffix}'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${Environment}-CloudTrail-ARN-${EnvironmentSuffix}'

  SecurityLogGroupArn:
    Description: 'Security Log Group ARN'
    Value: !GetAtt SecurityLogGroup.Arn
    Export:
      Name: !Sub '${Environment}-Security-LogGroup-ARN-${EnvironmentSuffix}'

  S3KMSKeyId:
    Description: 'S3 KMS Key ID'
    Value: !Ref S3KMSKey
    Export:
      Name: !Sub '${Environment}-S3-KMS-Key-${EnvironmentSuffix}'

  RDSKMSKeyId:
    Description: 'RDS KMS Key ID'
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub '${Environment}-RDS-KMS-Key-${EnvironmentSuffix}'
