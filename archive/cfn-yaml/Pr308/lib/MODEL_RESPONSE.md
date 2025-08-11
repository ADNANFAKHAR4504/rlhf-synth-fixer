Insert here the Model Response that failedAWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-Tier Cloud Infrastructure with comprehensive security, monitoring, and auditing capabilities'

Parameters:
  AllowedSSHCidr:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$'
  
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for compute resources'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
  
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - development
      - staging
      - production

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023
    us-west-2:
      AMI: ami-008fe2fc65df48dac  # Amazon Linux 2023
    eu-west-1:
      AMI: ami-01dd271720c1ba44f  # Amazon Linux 2023

Resources:
  # ========================================
  # NETWORKING LAYER
  # ========================================
  
  # VPC Configuration
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  # NAT Gateways for Private Subnet Internet Access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt-1'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt-2'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ========================================
  # SECURITY GROUPS
  # ========================================
  
  # Security Group for Private EC2 Instances
  PrivateInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-private-instance-sg'
      GroupDescription: 'Security group for private EC2 instances with restricted SSH access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: 'SSH access from allowed CIDR range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP access from load balancer'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTPS access from load balancer'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-instance-sg'
        - Key: Environment
          Value: !Ref Environment

  # Security Group for Load Balancer (if needed)
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-lb-sg'
      GroupDescription: 'Security group for load balancer'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from internet'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-lb-sg'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================
  
  # EC2 Instance Role
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-instance-role'
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
        - PolicyName: EC2CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-ec2-instance-profile'
      Roles:
        - !Ref EC2InstanceRole

  # AWS Config Service Role
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-config-service-role'
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
        - PolicyName: ConfigS3DeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource: !Sub '${ConfigBucket.Arn}'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub '${ConfigBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': 'bucket-owner-full-control'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail Service Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-cloudtrail-role'
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
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # S3 BUCKETS
  # ========================================
  
  # S3 Bucket for Application Data
  SecureApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-app-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'app-bucket-access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-app-bucket'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket for AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-config-bucket-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-config-bucket'
        - Key: Environment
          Value: !Ref Environment

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
            Action: s3:GetBucketAcl
            Resource: !Sub '${ConfigBucket.Arn}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub '${ConfigBucket.Arn}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  # S3 Bucket for CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-cloudtrail-bucket-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail-bucket'
        - Key: Environment
          Value: !Ref Environment

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
            Action: s3:GetBucketAcl
            Resource: !Sub '${CloudTrailBucket.Arn}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Environment}-security-trail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Environment}-security-trail'

  # S3 Bucket for Access Logs
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-access-logs-bucket-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-access-logs-bucket'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # EC2 INSTANCES
  # ========================================
  
  # EC2 Instance in Private Subnet 1
  PrivateInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch Agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "agent": {
              "metrics_collection_interval": 60,
              "run_as_user": "cwagent"
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "${Environment}-instance-logs",
                      "log_stream_name": "{instance_id}/var/log/messages"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "namespace": "CWAgent",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                  ],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": [
                    "used_percent"
                  ],
                  "metrics_collection_interval": 60,
                  "resources": [
                    "*"
                  ]
                },
                "mem": {
                  "measurement": [
                    "mem_used_percent"
                  ],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch Agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-instance-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Backup
          Value: 'Required'

  # EC2 Instance in Private Subnet 2
  PrivateInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch Agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "agent": {
              "metrics_collection_interval": 60,
              "run_as_user": "cwagent"
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "${Environment}-instance-logs",
                      "log_stream_name": "{instance_id}/var/log/messages"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "namespace": "CWAgent",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                  ],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": [
                    "used_percent"
                  ],
                  "metrics_collection_interval": 60,
                  "resources": [
                    "*"
                  ]
                },
                "mem": {
                  "measurement": [
                    "mem_used_percent"
                  ],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch Agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-instance-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Backup
          Value: 'Required'

  # ========================================
  # CLOUDWATCH LOGS
  # ========================================
  
  # CloudWatch Log Group for Instance Logs
  InstanceLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${Environment}-instance-logs'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for S3 Access Logs
  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${Environment}-s3-access-logs'
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${Environment}-cloudtrail-logs'
      RetentionInDays: 365
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # AWS CONFIG
  # ========================================
  
  # AWS Config Configuration Recorder
  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${Environment}-config-recorder'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
        ResourceTypes: []

  # AWS Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${Environment}-config-delivery-channel'
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: 'config-history'
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: 'TwentyFour_Hours'

  # AWS Config Rules
  S3BucketPublicAccessProhibited:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: 's3-bucket-public-access-prohibited'
      Description: 'Checks that your Amazon S3 buckets do not allow public access'
      Source:
        Owner: AWS
        SourceIdentifier: 'S3_BUCKET_PUBLIC_ACCESS_PROHIBITED'

  RootAccessKeyCheck:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: 'root-access-key-check'
      Description: 'Checks whether the root user access key is available'
      Source:
        Owner: AWS
        SourceIdentifier: 'ROOT_ACCESS_KEY_CHECK'

  EC2SecurityGroupAttachedToENI:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: 'ec2-security-group-attached-to-eni'
      Description: 'Checks that security groups are attached to Amazon EC2 instances or ENIs'
      Source:
        Owner: AWS
        SourceIdentifier: 'EC2_SECURITY_GROUP_ATTACHED_TO_ENI'

  # ========================================
  # AWS CLOUDTRAIL
  # ========================================
  
  # CloudTrail for Audit Logging
  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-security-trail'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup.Arn}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureApplicationBucket}/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - !Sub '${SecureApplicationBucket}'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-security-trail'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # CLOUDWATCH ALARMS
  # ========================================
  
  # CloudWatch Alarm