### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template. Let me break down the requirements:

1. VPC with 10.0.0.0/16 CIDR
2. 2 public subnets in different AZs
3. 2 private subnets in different AZs
4. Internet Gateway for public subnets
5. NAT Gateways for private subnets
6. S3 bucket with KMS encryption
7. EC2 instances in private subnets
8. IAM role for EC2 instances (S3 and CloudWatch permissions)
9. RDS PostgreSQL in private subnet with backup
10. Security groups with restricted SSH access
11. CloudWatch alarm for EC2 CPU > 70%
12. Consistent tagging (Project, Environment, Owner)
13. Outputs for VPC ID and subnet IDs

Let me create a comprehensive CloudFormation template in YAML format that addresses all these requirements.
### Answer 
---

# Comprehensive CloudFormation Template for Secure Modern Application Infrastructure

Below is a complete CloudFormation template that implements all the specified requirements. The template follows AWS best practices and includes detailed configurations for networking, security, compute, storage, and monitoring.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Comprehensive secure cloud infrastructure for modern application deployment'

# ========================
# Parameters
# ========================
Parameters:
  ProjectName:
    Type: String
    Default: 'ModernApp'
    Description: 'Project name for tagging resources'
    
  Environment:
    Type: String
    Default: 'Production'
    AllowedValues:
      - Development
      - Staging
      - Production
    Description: 'Environment for deployment'
    
  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Owner of the resources'
    
  AuthorizedSSHIP:
    Type: String
    Default: '203.0.113.0/32'
    Description: 'Authorized IP range for SSH access (CIDR notation)'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS PostgreSQL database'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    
  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS PostgreSQL database'
    MinLength: 8
    MaxLength: 128
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]*$'
    
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

# ========================
# Mappings
# ========================
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

# ========================
# Resources
# ========================
Resources:

  # ========================
  # VPC Configuration
  # ========================
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # Internet Gateway
  # ========================
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  AttachGateway:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ========================
  # Public Subnets
  # ========================
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicSubnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicSubnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Type
          Value: Public

  # ========================
  # Private Subnets
  # ========================
  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateSubnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateSubnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Type
          Value: Private

  # ========================
  # NAT Gateways
  # ========================
  NATGateway1EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NATGW1-EIP'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NATGateway2EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NATGW2-EIP'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NATGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NATGW-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NATGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NATGW-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # Route Tables
  # ========================
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicRouteTable'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: AttachGateway
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

  PrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateRouteTable-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateRouteTable-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ========================
  # KMS Key for S3 Encryption
  # ========================
  S3KMSKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: !Sub 'KMS key for S3 bucket encryption - ${ProjectName}'
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow EC2 instances to use the key
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2Role.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-S3-KMS-Key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3KMSKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-s3-encryption'
      TargetKeyId: !Ref S3KMSKey

  # ========================
  # S3 Bucket
  # ========================
  S3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-data'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KMSKey
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DataBucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # IAM Role for EC2 Instances
  # ========================
  EC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EC2-Role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # ========================
  # Security Groups
  # ========================
  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${ProjectName}-EC2-SG'
      GroupDescription: 'Security group for EC2 instances with restricted SSH access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AuthorizedSSHIP
          Description: 'SSH access from authorized IP'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: 'HTTPS from within VPC'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
          Description: 'HTTP from within VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EC2-SecurityGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  RDSSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${ProjectName}-RDS-SG'
      GroupDescription: 'Security group for RDS PostgreSQL instance'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'PostgreSQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-RDS-SecurityGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # EC2 Launch Template
  # ========================
  EC2LaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          InstanceMetadataTags: enabled
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat << EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "${ProjectName}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                      {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},
                      "cpu_time_guest"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                    ],
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
                        "log_group_name": "/aws/ec2/${ProjectName}/system",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
              -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-Instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner

  # ========================
  # EC2 Instances
  # ========================
  EC2Instance1:
    Type: 'AWS::EC2::Instance'
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Instance-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2Instance2:
    Type: 'AWS::EC2::Instance'
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Instance-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # RDS Subnet Group
  # ========================
  DBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DBSubnetGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # RDS PostgreSQL Instance
  # ========================
  RDSPostgreSQLInstance:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-postgres-db'
      DBName: 'appdb'
      Engine: postgres
      EngineVersion: '15.4'
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PostgreSQL'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ========================
  # CloudWatch Alarms
  # ========================
  EC2Instance1CPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-Instance1-HighCPU'
      AlarmDescription: 'Alarm when EC2 instance CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance1
      TreatMissingData: notBreaching

  EC2Instance2CPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-Instance2-HighCPU'
      AlarmDescription: 'Alarm when EC2 instance CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance2
      TreatMissingData: notBreaching

  RDSHighCPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-RDS-HighCPU'
      AlarmDescription: 'Alarm when RDS instance CPU exceeds 75%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSPostgreSQLInstance
      TreatMissingData: notBreaching

  RDSLowStorageAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-RDS-LowStorage'
      AlarmDescription: 'Alarm when RDS free storage is less than 2GB'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSPostgreSQLInstance
      TreatMissingData: notBreaching

# ========================
# Outputs
# ========================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket-Name'

  RDSEndpoint:
    Description: 'RDS PostgreSQL Endpoint'
    Value: !GetAtt RDSPostgreSQLInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  EC2Instance1Id:
    Description: 'EC2 Instance 1 ID'
    Value: !Ref EC2Instance1
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance1-ID'

  EC2Instance2Id:
    Description: 'EC2 Instance 2 ID'
    Value: !Ref EC2Instance2
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance2-ID'

  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2SecurityGroup-ID'

  RDSSecurityGroupId:
    Description: 'RDS Security Group ID'
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-RDSSecurityGroup-ID'
```

## Template Overview and Key Features

### **Architecture Components**

This CloudFormation template creates a comprehensive, production-ready infrastructure with the following components:

1. **Networking Layer**
   - VPC with 10.0.0.0/16 CIDR block
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
   - 2 private subnets (10.0.10.0/24, 10.0.11.0/24) across different AZs
   - Internet Gateway for public subnet internet access
   - 2 NAT Gateways (one per AZ) for private subnet outbound connectivity
   - Properly configured route tables for each subnet type

2. **Security Layer**
   - KMS key for S3 bucket encryption
   - Security groups with principle of least privilege
   - SSH access restricted to authorized IP ranges
   - Instance metadata service v2 enforced for enhanced security
   - VPC flow logs capability (can be added if needed)

3. **Storage Layer**
   - S3 bucket with KMS server-side encryption
   - Versioning enabled for data protection
   - Public access blocked by default
   - Lifecycle policies for old version cleanup

4. **Compute Layer**
   - EC2 instances deployed in private subnets
   - Launch template for consistent instance configuration
   - IAM roles with specific permissions for S3 and CloudWatch
   - CloudWatch agent pre-configured for monitoring

5. **Database Layer**
   - RDS PostgreSQL instance in private subnets
   - Multi-AZ deployment capability via subnet group
   - Automated backups with 7-day retention
   - Encryption at rest enabled

6. **Monitoring & Alerting**
   - CloudWatch alarms for EC2 CPU utilization > 70%
   - RDS monitoring for CPU and storage
   - CloudWatch Logs integration for centralized logging
   - Custom metrics collection via CloudWatch agent

### **Best Practices Implemented**

1. **High Availability**: Resources distributed across multiple availability zones
2. **Security**: 
   - Defense in depth with multiple security layers
   - Encryption at rest and in transit capabilities
   - Principle of least privilege for IAM roles
3. **Tagging Strategy**: Consistent tags (Project, Environment, Owner) on all resources
4. **Infrastructure as Code**: Fully parameterized template for reusability
5. **Cost Optimization**: NAT Gateways in each AZ to minimize cross-AZ data transfer costs
6. **Operational Excellence**: Comprehensive monitoring and alerting setup

### **Deployment Instructions**

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Valid AWS account with necessary permissions
   - Parameter values prepared (especially DB password)

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name modern-app-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=AuthorizedSSHIP,ParameterValue=YOUR_IP_ADDRESS/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Monitor stack creation**:
```bash
aws cloudformation describe-stacks \
  --stack-name modern-app-infrastructure \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### **Customization Options**

The template includes several parameters that can be customized:
- **ProjectName**: Change the project identifier
- **Environment**: Select Development, Staging, or Production
- **Owner**: Specify the resource owner
- **AuthorizedSSHIP**: Set your specific IP for SSH access
- **Database credentials**: Provide secure credentials for RDS

### **Outputs for Integration**

The template exports critical resource IDs that can be referenced by other stacks:
- VPC and Subnet IDs for additional resource deployment
- Security Group IDs for network access configuration
- S3 Bucket name for data storage operations
- RDS endpoint for database connections

This template provides a solid foundation for modern application deployment while maintaining security, scalability, and operational best practices.