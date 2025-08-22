```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure Multi-Tier Cloud Infrastructure with comprehensive security, monitoring, and auditing capabilities"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: "Security Configuration"
        Parameters:
          - AllowedSSHCidr
          - InstanceType
      - Label:
          default: "AWS Config Configuration"
        Parameters:
          - ExistingConfigRecorderName
          - ExistingConfigDeliveryChannelName

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  AllowedSSHCidr:
    Type: String
    Default: "203.0.113.0/24"
    Description: "CIDR block allowed for SSH access to EC2 instances"
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$'
    ConstraintDescription: "Must be a valid CIDR block"

  InstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type for compute resources"
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  ExistingConfigRecorderName:
    Type: String
    Default: "TapConfigRecorder-pr287"
    Description: "Name of the existing AWS Config Configuration Recorder to use"

  ExistingConfigDeliveryChannelName:
    Type: String
    Default: "TapConfigDeliveryChannel-pr28"
    Description: "Name of the existing AWS Config Delivery Channel to use"

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316 # Amazon Linux 2023
    us-west-2:
      AMI: ami-008fe2fc65df48dac # Amazon Linux 2023
    eu-west-1:
      AMI: ami-01dd271720c1ba44f # Amazon Linux 2023

Resources:
  # ========================================
  # NETWORKING LAYER
  # ========================================

  # VPC Configuration
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: "10.0.0.0/16"
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "secure-vpc-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "igw-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

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
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: "10.0.1.0/24"
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "public-subnet-1-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: "Public"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: "10.0.2.0/24"
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "public-subnet-2-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: "Public"

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: "10.0.10.0/24"
      Tags:
        - Key: Name
          Value: !Sub "private-subnet-1-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: "Private"

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: "10.0.11.0/24"
      Tags:
        - Key: Name
          Value: !Sub "private-subnet-2-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: "Private"

  # NAT Gateways for Private Subnet Internet Access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "nat-eip-1-${EnvironmentSuffix}"

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "nat-eip-2-${EnvironmentSuffix}"

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "nat-gateway-1-${EnvironmentSuffix}"

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "nat-gateway-2-${EnvironmentSuffix}"

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "public-rt-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
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
          Value: !Sub "private-rt-1-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: "0.0.0.0/0"
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
          Value: !Sub "private-rt-2-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: "0.0.0.0/0"
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
      GroupName: !Sub "private-instance-sg-${EnvironmentSuffix}"
      GroupDescription: "Security group for private EC2 instances with restricted SSH access"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: "SSH access from allowed CIDR range"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: "0.0.0.0/0"
          Description: "All outbound traffic"
      Tags:
        - Key: Name
          Value: !Sub "private-instance-sg-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================

  # EC2 Instance Role
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
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
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # CloudTrail Service Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # Config Service Role (needed for Config bucket access)
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Policies:
        - PolicyName: ConfigS3DeliveryPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource: !Sub "${ConfigBucket.Arn}"
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource: !Sub "${ConfigBucket.Arn}/*"
                Condition:
                  StringEquals:
                    "s3:x-amz-acl": "bucket-owner-full-control"
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ========================================
  # S3 BUCKETS
  # ========================================

  # S3 Bucket for Application Data
  SecureApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "secure-app-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
        LogFilePrefix: "app-bucket-access-logs/"
      Tags:
        - Key: Name
          Value: !Sub "secure-app-bucket-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # S3 Bucket for AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "config-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
          Value: !Sub "config-bucket-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${ConfigBucket.Arn}"
            Condition:
              StringEquals:
                "AWS:SourceAccount": !Ref "AWS::AccountId"
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub "${ConfigBucket.Arn}"
            Condition:
              StringEquals:
                "AWS:SourceAccount": !Ref "AWS::AccountId"
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${ConfigBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
                "AWS:SourceAccount": !Ref "AWS::AccountId"

  # S3 Bucket for CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "cloudtrail-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
          Value: !Sub "cloudtrail-bucket-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${CloudTrailBucket.Arn}"
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/security-trail-${EnvironmentSuffix}"
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/security-trail-${EnvironmentSuffix}"

  # S3 Bucket for Access Logs
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "access-logs-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
          Value: !Sub "access-logs-bucket-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ========================================
  # EC2 INSTANCES
  # ========================================

  # EC2 Instance in Private Subnet 1
  PrivateInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
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
                      "log_group_name": "instance-logs-${EnvironmentSuffix}",
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
          Value: !Sub "private-instance-1-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Backup
          Value: "Required"

  # EC2 Instance in Private Subnet 2
  PrivateInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
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
                      "log_group_name": "instance-logs-${EnvironmentSuffix}",
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
          Value: !Sub "private-instance-2-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Backup
          Value: "Required"

  # ========================================
  # CLOUDWATCH LOGS
  # ========================================

  # CloudWatch Log Group for Instance Logs
  InstanceLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "instance-logs-${EnvironmentSuffix}"
      RetentionInDays: 30
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group for S3 Access Logs
  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "s3-access-logs-${EnvironmentSuffix}"
      RetentionInDays: 90
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group for CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "cloudtrail-logs-${EnvironmentSuffix}"
      RetentionInDays: 365
      Tags:
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ========================================
  # AWS CONFIG
  # ========================================

  # AWS Config Rules (automatically use existing ConfigurationRecorder: TapConfigRecorder-pr287)
  # and existing ConfigDeliveryChannel: TapConfigDeliveryChannel-pr28
  S3BucketPublicAccessProhibited:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub "s3-bucket-public-read-prohibited-${EnvironmentSuffix}"
      Description: "Checks that your Amazon S3 buckets do not allow public read access"
      Source:
        Owner: AWS
        SourceIdentifier: "S3_BUCKET_PUBLIC_READ_PROHIBITED"

  S3BucketPublicWriteProhibited:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub "s3-bucket-public-write-prohibited-${EnvironmentSuffix}"
      Description: "Checks that your Amazon S3 buckets do not allow public write access"
      Source:
        Owner: AWS
        SourceIdentifier: "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"

  EC2SecurityGroupAttachedToENI:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub "ec2-security-group-attached-to-eni-${EnvironmentSuffix}"
      Description: "Checks that security groups are attached to Amazon EC2 instances or ENIs"
      Source:
        Owner: AWS
        SourceIdentifier: "EC2_SECURITY_GROUP_ATTACHED_TO_ENI"

  # ========================================
  # AWS CLOUDTRAIL
  # ========================================

  # CloudTrail for Audit Logging
  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "security-trail-${EnvironmentSuffix}"
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: "cloudtrail-logs"
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      Tags:
        - Key: Name
          Value: !Sub "security-trail-${EnvironmentSuffix}"
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: "ID of the VPC"
    Value: !Ref SecureVPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnet1Id:
    Description: "ID of Public Subnet 1"
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet1Id"

  PublicSubnet2Id:
    Description: "ID of Public Subnet 2"
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet2Id"

  PrivateSubnet1Id:
    Description: "ID of Private Subnet 1"
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet1Id"

  PrivateSubnet2Id:
    Description: "ID of Private Subnet 2"
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet2Id"

  PrivateInstance1Id:
    Description: "ID of Private EC2 Instance 1"
    Value: !Ref PrivateInstance1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateInstance1Id"

  PrivateInstance2Id:
    Description: "ID of Private EC2 Instance 2"
    Value: !Ref PrivateInstance2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateInstance2Id"

  SecureApplicationBucketName:
    Description: "Name of the secure application S3 bucket"
    Value: !Ref SecureApplicationBucket
    Export:
      Name: !Sub "${AWS::StackName}-SecureApplicationBucketName"

  ConfigBucketName:
    Description: "Name of the AWS Config S3 bucket"
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub "${AWS::StackName}-ConfigBucketName"

  CloudTrailBucketName:
    Description: "Name of the CloudTrail S3 bucket"
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailBucketName"

  SecurityCloudTrailArn:
    Description: "ARN of the CloudTrail"
    Value: !GetAtt SecurityCloudTrail.Arn
    Export:
      Name: !Sub "${AWS::StackName}-SecurityCloudTrailArn"

  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"

  ExistingConfigRecorderName:
    Description: "Name of the existing AWS Config Configuration Recorder being used"
    Value: !Ref ExistingConfigRecorderName
    Export:
      Name: !Sub "${AWS::StackName}-ExistingConfigRecorderName"

  ExistingConfigDeliveryChannelName:
    Description: "Name of the existing AWS Config Delivery Channel being used"
    Value: !Ref ExistingConfigDeliveryChannelName
    Export:
      Name: !Sub "${AWS::StackName}-ExistingConfigDeliveryChannelName"
```
