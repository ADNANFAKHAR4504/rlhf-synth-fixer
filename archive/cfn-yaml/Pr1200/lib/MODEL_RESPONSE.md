# AWS Secure Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that meets all your security requirements. Here's the complete solution:

## secure_configuration.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Environment with comprehensive security controls'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name'
  
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS instance'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

Resources:
  # ============================================================================
  # KMS Keys for Encryption
  # ============================================================================
  SecureEnvKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for SecureEnv encryption'
      KeyPolicy:
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
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'

  SecureEnvKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/SecureEnv-MasterKey
      TargetKeyId: !Ref SecureEnvKMSKey

  # ============================================================================
  # VPC Configuration
  # ============================================================================
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureEnv-VPC

  # Internet Gateway
  SecureEnvInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureEnv-IGW

  SecureEnvAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureEnvVPC
      InternetGatewayId: !Ref SecureEnvInternetGateway

  # Public Subnets
  SecureEnvPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnv-Public-Subnet-1

  SecureEnvPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnv-Public-Subnet-2

  # Private Subnets
  SecureEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnv-Private-Subnet-1

  SecureEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnv-Private-Subnet-2

  # NAT Gateway
  SecureEnvNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvAttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: SecureEnv-NAT-EIP

  SecureEnvNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGatewayEIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1
      Tags:
        - Key: Name
          Value: SecureEnv-NAT-Gateway

  # Route Tables
  SecureEnvPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnv-Public-RT

  SecureEnvPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnv-Private-RT

  # Routes
  SecureEnvPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: SecureEnvAttachGateway
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref SecureEnvNATGateway

  # Route Table Associations
  SecureEnvPublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet1
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet2
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet1
      RouteTableId: !Ref SecureEnvPrivateRouteTable

  SecureEnvPrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet2
      RouteTableId: !Ref SecureEnvPrivateRouteTable

  # VPC Flow Logs
  SecureEnvVPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnv-VPCFlowLog-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: SecureEnv-VPCFlowLog-Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  SecureEnvVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/vpc/flowlogs/SecureEnv
      RetentionInDays: 90

  SecureEnvVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureEnvVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref SecureEnvVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt SecureEnvVPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: SecureEnv-VPC-FlowLog

  # ============================================================================
  # Security Groups
  # ============================================================================
  SecureEnvWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: SecureEnv-Web-SG
      GroupDescription: Security group for web servers
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref SecureEnvBastionSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: SecureEnv-Web-SG

  SecureEnvBastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: SecureEnv-Bastion-SG
      GroupDescription: Security group for bastion host
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict this to your IP range in production
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: SecureEnv-Bastion-SG

  SecureEnvDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: SecureEnv-Database-SG
      GroupDescription: Security group for RDS database
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvWebSecurityGroup
      Tags:
        - Key: Name
          Value: SecureEnv-Database-SG

  # ============================================================================
  # IAM Roles and Policies
  # ============================================================================
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnv-EC2-Role
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
        - PolicyName: SecureEnv-EC2-S3-Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureEnvS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureEnvS3Bucket

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: SecureEnv-EC2-InstanceProfile
      Roles:
        - !Ref SecureEnvEC2Role

  # ============================================================================
  # S3 Bucket with KMS Encryption
  # ============================================================================
  SecureEnvS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-secure-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureEnvKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref SecureEnvS3LoggingBucket
        LogFilePrefix: access-logs/
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref SecureEnvS3LogGroup
      Tags:
        - Key: Name
          Value: SecureEnv-Secure-Bucket

  SecureEnvS3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureEnvKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: SecureEnv-Access-Logs-Bucket

  SecureEnvS3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/s3/SecureEnv
      RetentionInDays: 90

  # ============================================================================
  # RDS Database with Encryption
  # ============================================================================
  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: SecureEnv-DB-SubnetGroup
      DBSubnetGroupDescription: Subnet group for SecureEnv RDS
      SubnetIds:
        - !Ref SecureEnvPrivateSubnet1
        - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: SecureEnv-DB-SubnetGroup

  SecureEnvRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: SecureEnv-MySQL-DB
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref SecureEnvKMSKey
      VPCSecurityGroups:
        - !Ref SecureEnvDatabaseSecurityGroup
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      Tags:
        - Key: Name
          Value: SecureEnv-MySQL-DB

  # ============================================================================
  # EC2 Instances
  # ============================================================================
  SecureEnvLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: SecureEnv-LaunchTemplate
      LaunchTemplateData:
        ImageId: ami-0c55b159cbfafe1d0  # Amazon Linux 2 AMI (update for your region)
        InstanceType: t3.micro
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref SecureEnvWebSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt SecureEnvEC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref SecureEnvKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "SecureEnv/EC2",
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
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/SecureEnv",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: SecureEnv-Web-Server

  SecureEnvWebInstance:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref SecureEnvLaunchTemplate
        Version: !GetAtt SecureEnvLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref SecureEnvPrivateSubnet1
      Tags:
        - Key: Name
          Value: SecureEnv-Web-Instance

  SecureEnvBastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c55b159cbfafe1d0  # Amazon Linux 2 AMI
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SecurityGroupIds:
        - !Ref SecureEnvBastionSecurityGroup
      SubnetId: !Ref SecureEnvPublicSubnet1
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref SecureEnvKMSKey
            DeleteOnTermination: true
      MetadataOptions:
        HttpTokens: required
        HttpPutResponseHopLimit: 1
        HttpEndpoint: enabled
      Tags:
        - Key: Name
          Value: SecureEnv-Bastion-Host

  # ============================================================================
  # CloudTrail for Audit Logging
  # ============================================================================
  SecureEnvCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureEnvKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: SecureEnv-CloudTrail-Bucket

  SecureEnvCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvCloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref SecureEnvCloudTrailBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${SecureEnvCloudTrailBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  SecureEnvCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: SecureEnvCloudTrailBucketPolicy
    Properties:
      TrailName: SecureEnv-CloudTrail
      S3BucketName: !Ref SecureEnvCloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecureEnvKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureEnvS3Bucket}/*'
      Tags:
        - Key: Name
          Value: SecureEnv-CloudTrail

  # ============================================================================
  # AWS Config for Compliance
  # ============================================================================
  SecureEnvConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnv-Config-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: SecureEnv-Config-S3-Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !Ref SecureEnvConfigBucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureEnvConfigBucket}/*'

  SecureEnvConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-config-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureEnvKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: SecureEnv-Config-Bucket

  SecureEnvConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: SecureEnv-Config-DeliveryChannel
      S3BucketName: !Ref SecureEnvConfigBucket

  SecureEnvConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: SecureEnv-Config-Recorder
      RoleARN: !GetAtt SecureEnvConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Rules
  SecureEnvConfigRuleS3Encryption:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureEnvConfigurationRecorder
    Properties:
      ConfigRuleName: SecureEnv-S3-Bucket-Server-Side-Encryption-Enabled
      Description: Checks that S3 buckets have server-side encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  SecureEnvConfigRuleRDSEncryption:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureEnvConfigurationRecorder
    Properties:
      ConfigRuleName: SecureEnv-RDS-Storage-Encrypted
      Description: Checks whether storage encryption is enabled for RDS DB instances
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED

  # ============================================================================
  # GuardDuty
  # ============================================================================
  SecureEnvGuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Name
          Value: SecureEnv-GuardDuty-Detector

  # ============================================================================
  # AWS WAF
  # ============================================================================
  SecureEnvWAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: SecureEnv-WebACL
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: SecureEnv-SQLInjectionRule
          Priority: 1
          Statement:
            SqliMatchStatement:
              FieldToMatch:
                Body: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SecureEnv-SQLInjectionRule
        - Name: SecureEnv-XSSRule
          Priority: 2
          Statement:
            XssMatchStatement:
              FieldToMatch:
                Body: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SecureEnv-XSSRule
        - Name: SecureEnv-AWSManagedRulesCommonRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SecureEnv-CommonRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: SecureEnv-WebACL
      Tags:
        - Key: Name
          Value: SecureEnv-WebACL

  # ============================================================================
  # CloudWatch Log Groups
  # ============================================================================
  SecureEnvEC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/ec2/SecureEnv
      RetentionInDays: 90

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref SecureEnvVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref SecureEnvPublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref SecureEnvPublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref SecureEnvPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref SecureEnvPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSub