```yaml
# Nova Production Multi-Region Secure Infrastructure
# This template creates a secure, multi-region AWS infrastructure following CIP guidelines
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Nova Production Multi-Region Secure Infrastructure with VPC Peering, Encryption, and Least Privilege Access'

Parameters:
  ProjectName:
    Type: String
    Default: 'nova'
    Description: 'Project name for resource naming'

  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource naming'

  PrimaryRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Primary AWS Region'

  SecondaryRegion:
    Type: String
    Default: 'us-west-2'
    Description: 'Secondary AWS Region'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS instances'
    NoEcho: true

  DBMasterPassword:
    Type: String
    MinLength: 12
    MaxLength: 41
    NoEcho: true
    Description: 'Master password for RDS instances (12-41 characters)'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023
      AZ1: us-east-1a
      AZ2: us-east-1b
    us-west-2:
      AMI: ami-008fe2fc65df48dac  # Amazon Linux 2023
      AZ1: us-west-2a
      AZ2: us-west-2b

Conditions:
  IsPrimaryRegion: !Equals [!Ref 'AWS::Region', !Ref PrimaryRegion]
  IsSecondaryRegion: !Equals [!Ref 'AWS::Region', !Ref SecondaryRegion]

Resources:
  # ====================================
  # KMS Keys for Encryption
  # ====================================

  NovaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${ProjectName}-${Environment} Customer Managed KMS Key for ${AWS::Region}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption/decryption
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - ec2.amazonaws.com
                - logs.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  NovaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref NovaKMSKey

  # ====================================
  # VPC and Network Infrastructure
  # ====================================

  NovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.0.0/16'
        - '10.1.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-${AWS::Region}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  NovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw-${AWS::Region}'

  NovaVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaVPC
      InternetGatewayId: !Ref NovaInternetGateway

  # Public Subnets
  NovaPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.1.0/24'
        - '10.1.1.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1-${AWS::Region}'
        - Key: Type
          Value: Public

  NovaPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.2.0/24'
        - '10.1.2.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2-${AWS::Region}'
        - Key: Type
          Value: Public

  # Private Subnets
  NovaPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.3.0/24'
        - '10.1.3.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1-${AWS::Region}'
        - Key: Type
          Value: Private

  NovaPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.4.0/24'
        - '10.1.4.0/24'
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2-${AWS::Region}'
        - Key: Type
          Value: Private

  # NAT Gateway for Private Subnet Internet Access
  NovaEIPNAT:
    Type: AWS::EC2::EIP
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-${AWS::Region}'

  NovaNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NovaEIPNAT.AllocationId
      SubnetId: !Ref NovaPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-${AWS::Region}'

  # Route Tables
  NovaPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt-${AWS::Region}'

  NovaPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt-${AWS::Region}'

  # Routes
  NovaPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref NovaInternetGateway

  NovaPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NovaNATGateway

  # Route Table Associations
  NovaPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet1
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet2
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet1
      RouteTableId: !Ref NovaPrivateRouteTable

  NovaPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet2
      RouteTableId: !Ref NovaPrivateRouteTable

  # ====================================
  # Network ACLs for Additional Security
  # ====================================

  NovaPrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-nacl-${AWS::Region}'

  # Allow inbound HTTPS from public subnets
  NovaPrivateNetworkAclInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NovaPrivateNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 443
        To: 443
      CidrBlock: !If
        - IsPrimaryRegion
        - '10.0.0.0/16'
        - '10.1.0.0/16'

  # Allow outbound HTTPS
  NovaPrivateNetworkAclOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NovaPrivateNetworkAcl
      RuleNumber: 100
      Protocol: 6
      Egress: true
      RuleAction: allow
      PortRange:
        From: 443
        To: 443
      CidrBlock: '0.0.0.0/0'

  # Associate NACL with private subnets
  NovaPrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet1
      NetworkAclId: !Ref NovaPrivateNetworkAcl

  NovaPrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet2
      NetworkAclId: !Ref NovaPrivateNetworkAcl

  # ====================================
  # Security Groups
  # ====================================

  # Security Group for EC2 instances
  NovaEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Nova EC2 instances'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !If
            - IsPrimaryRegion
            - '10.0.0.0/16'
            - '10.1.0.0/16'
          Description: 'HTTPS from VPC'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !If
            - IsPrimaryRegion
            - '10.0.1.0/24'
            - '10.1.1.0/24'
          Description: 'SSH from public subnet 1 only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          DestinationSecurityGroupId: !Ref NovaRDSSecurityGroup
          Description: 'PostgreSQL to RDS'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-sg-${AWS::Region}'

  # Security Group for RDS instances
  NovaRDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Nova RDS instances'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref NovaEC2SecurityGroup
          Description: 'PostgreSQL from EC2 instances only'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rds-sg-${AWS::Region}'

  # ====================================
  # IAM Roles and Policies
  # ====================================

  # IAM Role for EC2 instances
  NovaEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role-${AWS::Region}'
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
        - PolicyName: NovaS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub '${NovaS3Bucket}/*'
                  - !If
                    - IsPrimaryRegion
                    - !Sub '${NovaS3BackupBucket}/*'
                    - !Ref 'AWS::NoValue'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !Ref NovaS3Bucket
                  - !If
                    - IsPrimaryRegion
                    - !Ref NovaS3BackupBucket
                    - !Ref 'AWS::NoValue'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt NovaKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}-${Environment}*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-role'

  NovaEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile-${AWS::Region}'
      Roles:
        - !Ref NovaEC2Role

  # ====================================
  # S3 Buckets with Cross-Region Replication
  # ====================================

  # Primary S3 Bucket (us-east-1)
  NovaS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-primary-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      ReplicationConfiguration: !If
        - IsPrimaryRegion
        - Role: !GetAtt NovaS3ReplicationRole.Arn
          Rules:
            - Id: ReplicateToSecondaryRegion
              Status: Enabled
              Prefix: ''
              Destination:
                Bucket: !Sub 'arn:aws:s3:::${ProjectName}-${Environment}-backup-${AWS::AccountId}-${SecondaryRegion}'
                StorageClass: STANDARD_IA
                EncryptionConfiguration:
                  ReplicaKmsKeyID: !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${ProjectName}-${Environment}-key'
        - !Ref 'AWS::NoValue'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-primary-bucket'

  # Backup S3 Bucket (us-west-2) - Only created in secondary region
  NovaS3BackupBucket:
    Type: AWS::S3::Bucket
    Condition: IsSecondaryRegion
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-backup-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-backup-bucket'

  # S3 Replication Role (only in primary region)
  NovaS3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: IsPrimaryRegion
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObjectVersionForReplication
                  - s3:GetObjectVersionAcl
                Resource: !Sub '${NovaS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref NovaS3Bucket
              - Effect: Allow
                Action:
                  - s3:ReplicateObject
                  - s3:ReplicateDelete
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-${Environment}-backup-${AWS::AccountId}-${SecondaryRegion}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt NovaKMSKey.Arn
              - Effect: Allow
                Action:
                  - kms:GenerateDataKey
                Resource: !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${ProjectName}-${Environment}-key'

  # ====================================
  # EC2 Instances
  # ====================================

  NovaEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      SubnetId: !Ref NovaPrivateSubnet1
      SecurityGroupIds:
        - !Ref NovaEC2SecurityGroup
      IamInstanceProfile: !Ref NovaEC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref NovaKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/${ProjectName}-${Environment}",
                      "log_stream_name": "{instance_id}/messages"
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
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-${AWS::Region}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # ====================================
  # RDS Database
  # ====================================

  NovaDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group-${AWS::Region}'
      DBSubnetGroupDescription: 'Subnet group for Nova RDS instances'
      SubnetIds:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'

  NovaRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-postgres-${AWS::Region}'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15.4'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref NovaKMSKey
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref NovaRDSSecurityGroup
      DBSubnetGroupName: !Ref NovaDBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-postgres'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # ====================================
  # CloudWatch Log Groups
  # ====================================

  NovaEC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt NovaKMSKey.Arn

  NovaVPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${Environment}-${AWS::Region}'
      RetentionInDays: 14
      KmsKeyId: !GetAtt NovaKMSKey.Arn

  # ====================================
  # VPC Flow Logs
  # ====================================

  NovaVPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsDeliveryRolePolicy
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
                Resource: !GetAtt NovaVPCFlowLogsGroup.Arn

  NovaVPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref NovaVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref NovaVPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt NovaVPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-flow-logs'

  # ====================================
  # CloudWatch Alarms
  # ====================================

  NovaEC2HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-ec2-high-cpu-${AWS::Region}'
      AlarmDescription: 'Alarm when EC2 CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref NovaEC2Instance
      TreatMissingData: notBreaching

  NovaRDSLowStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-rds-low-storage-${AWS::Region}'
      AlarmDescription: 'Alarm when RDS free storage space is low'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2000000000  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref NovaRDSInstance
      TreatMissingData: notBreaching

# ====================================
# Outputs
# ====================================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref NovaVPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id-${AWS::Region}'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref NovaPrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-1-${AWS::Region}'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref NovaPrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-2-${AWS::Region}'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref NovaEC2Instance
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ec2-instance-${AWS::Region}'

  RDSInstanceId:
    Description: 'RDS Instance ID'
    Value: !Ref NovaRDSInstance
    Export:
      Name: !Sub '${ProjectName}-${Environment}-rds-instance-${AWS::Region}'

  S3BucketName:
    Description: 'Primary S3 Bucket Name'
    Value: !Ref NovaS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-s3-bucket-${AWS::Region}'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref NovaKMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms
```
