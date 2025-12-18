```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure infrastructure with encryption, monitoring, and least-privilege access controls'

Parameters:
  EC2AMIId:
    Type: AWS::EC2::Image::Id
    Description: 'AMI ID for EC2 instance'
    Default: 'ami-0c02fb55956c7d316' # Amazon Linux 2 AMI (update as needed)

  EC2InstanceType:
    Type: String
    Description: 'EC2 instance type'
    Default: 't3.medium'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

  AllowedSSHCIDR:
    Type: String
    Description: 'CIDR block allowed for SSH access'
    Default: '10.0.0.0/8'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

  Environment:
    Type: String
    Description: 'Environment name'
    Default: 'prod'

Resources:
  # ===== KMS Keys for Encryption =====
  ProdKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Production KMS key for encryption at rest'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow EC2 Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      KeyUsage: ENCRYPT_DECRYPT
      KeySpec: SYMMETRIC_DEFAULT

  ProdKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-security-key'
      TargetKeyId: !Ref ProdKMSKey

  # ===== VPC and Networking =====
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  ProdVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  # Public Subnet for NAT Gateway
  ProdPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet'

  # Private Subnet for EC2
  ProdPrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet'

  # NAT Gateway
  ProdNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip'

  ProdNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNATGatewayEIP.AllocationId
      SubnetId: !Ref ProdPublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway'

  # Route Tables
  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'

  ProdPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt'

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

  ProdPublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet
      RouteTableId: !Ref ProdPrivateRouteTable

  # ===== Security Groups =====
  ProdEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for production EC2 instance'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ProdALBSecurityGroup
          Description: 'HTTPS from ALB'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for package updates'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for secure connections'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'DNS TCP'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'DNS UDP'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-sg'

  ProdALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for ALB (if needed for future use)'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from internet'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-sg'

  # ===== IAM Roles and Policies =====
  ProdEC2Role:
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
        - PolicyName: !Sub '${Environment}-s3-access-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub '${ProdS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref ProdS3Bucket
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt ProdKMSKey.Arn
        - PolicyName: !Sub '${Environment}-cloudwatch-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !GetAtt ProdCloudWatchLogGroup.Arn

  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-ec2-instance-profile'
      Roles:
        - !Ref ProdEC2Role

  # ===== S3 Bucket with Security Controls =====
  ProdS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-secure-bucket-${AWS::AccountId}-${AWS::Region}'
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
      LoggingConfiguration:
        DestinationBucketName: !Ref ProdS3LoggingBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref ProdCloudWatchLogGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-secure-bucket'

  ProdS3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProdKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-access-logs-bucket'

  ProdS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ProdS3Bucket}/*'
              - !Ref ProdS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowEC2RoleAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt ProdEC2Role.Arn
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource: !Sub '${ProdS3Bucket}/*'

  # ===== EC2 Instance =====
  ProdEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref EC2AMIId
      InstanceType: !Ref EC2InstanceType
      SubnetId: !Ref ProdPrivateSubnet
      SecurityGroupIds:
        - !Ref ProdEC2SecurityGroup
      IamInstanceProfile: !Ref ProdEC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref ProdKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent

          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "metrics": {
              "namespace": "CWAgent",
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
                },
                "netstat": {
                  "measurement": ["tcp_established", "tcp_time_wait"],
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
                      "log_group_name": "${ProdCloudWatchLogGroup}",
                      "log_stream_name": "{instance_id}/var/log/messages"
                    }
                  ]
                }
              }
            }
          }
          EOF

          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-instance'

  # ===== CloudWatch Resources =====
  ProdCloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-logs'
      RetentionInDays: 30
      KmsKeyId: !GetAtt ProdKMSKey.Arn

  # CloudWatch Alarms
  ProdCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-cpu-utilization'
      AlarmDescription: 'Alarm when CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
      AlarmActions:
        - !Ref ProdSNSTopic

  ProdNetworkInAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-network-in'
      AlarmDescription: 'Alarm when NetworkIn exceeds threshold'
      MetricName: NetworkIn
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1000000000 # 1GB in bytes
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
      AlarmActions:
        - !Ref ProdSNSTopic

  ProdNetworkOutAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-network-out'
      AlarmDescription: 'Alarm when NetworkOut exceeds threshold'
      MetricName: NetworkOut
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1000000000 # 1GB in bytes
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
      AlarmActions:
        - !Ref ProdSNSTopic

  # SNS Topic for Alarms
  ProdSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-alerts'
      KmsMasterKeyId: !Ref ProdKMSKey

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref ProdVPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref ProdPrivateSubnet
    Export:
      Name: !Sub '${Environment}-private-subnet-id'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref ProdEC2Instance
    Export:
      Name: !Sub '${Environment}-ec2-instance-id'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${Environment}-s3-bucket-name'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref ProdKMSKey
    Export:
      Name: !Sub '${Environment}-kms-key-id'

  CloudWatchLogGroup:
    Description: 'CloudWatch Log Group'
    Value: !Ref ProdCloudWatchLogGroup
    Export:
      Name: !Sub '${Environment}-log-group'
```
