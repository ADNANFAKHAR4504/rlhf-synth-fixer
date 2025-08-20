# Highly Secure AWS CloudFormation Infrastructure Template

I'll create a comprehensive CloudFormation template that meets all your security requirements. This template includes a VPC with public/private subnets, secure RDS instance, S3 logging bucket, and EC2 instances with proper IAM roles.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly secure cloud infrastructure following AWS security best practices'

Parameters:
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'
  
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: 'Must contain only alphanumeric characters with minimum 8 characters'

  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: 'EC2 instance type'

Resources:
  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'SecureVPC'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'SecureIGW'
        - Key: Environment
          Value: Production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'PublicSubnet1'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'PublicSubnet2'
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.3.0/24'
      Tags:
        - Key: Name
          Value: 'PrivateSubnet1'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.4.0/24'
      Tags:
        - Key: Name
          Value: 'PrivateSubnet2'
        - Key: Environment
          Value: Production

  # NAT Gateway for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: Production

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: 'NatGateway1'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'PublicRouteTable'
        - Key: Environment
          Value: Production

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
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'PrivateRouteTable1'
        - Key: Environment
          Value: Production

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

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'WebServerSecurityGroup'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
          Description: 'SSH access from VPC only'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: 'WebServerSecurityGroup'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'DatabaseSecurityGroup'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers only'
      Tags:
        - Key: Name
          Value: 'DatabaseSecurityGroup'
        - Key: Environment
          Value: Production

  # S3 Bucket for Application Logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-app-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
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
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Environment
          Value: Production

  # S3 Bucket for Access Logs
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-access-logs-${AWS::AccountId}-${AWS::Region}'
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
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldAccessLogs'
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Group
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/s3/secure-app-logs'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production

  # IAM Role for EC2 Instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'SecureEC2Role'
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
        - PolicyName: 'S3LoggingPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${LoggingBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref LoggingBucket
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'SecureEC2InstanceProfile'
      Roles:
        - !Ref EC2Role

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: 'secure-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # RDS Parameter Group
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: 'secure-mysql-params'
      Description: 'Secure MySQL parameter group'
      Family: 'mysql8.0'
      Parameters:
        slow_query_log: 1
        log_queries_not_using_indexes: 1
        innodb_file_per_table: 1
      Tags:
        - Key: Environment
          Value: Production

  # RDS Database Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: 'secure-production-db'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: 'gp3'
      StorageEncrypted: true
      KmsKeyId: 'alias/aws/rds'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Environment
          Value: Production

  # Launch Template for EC2 Instances
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: 'SecureLaunchTemplate'
      LaunchTemplateData:
        ImageId: 'ami-0c2d3e23b7e6c8c2c'  # Amazon Linux 2023 AMI in us-west-2
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            yum install -y awslogs
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/secure-instances",
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
              -a fetch-config -m ec2 -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeType: 'gp3'
              VolumeSize: 20
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpEndpoint: enabled
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        Monitoring:
          Enabled: true
        TagSpecifications:
          - ResourceType: 'instance'
            Tags:
              - Key: Name
                Value: 'SecureWebServer'
              - Key: Environment
                Value: Production
          - ResourceType: 'volume'
            Tags:
              - Key: Environment
                Value: Production

  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: 'SecureWebServer'
        - Key: Environment
          Value: Production

  # CloudWatch Log Group for EC2 instances
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/secure-instances'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoggingBucketName:
    Description: 'Name of the S3 logging bucket'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  DatabaseEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  WebServerInstanceId:
    Description: 'ID of the web server instance'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-ID'

  WebServerPublicIP:
    Description: 'Public IP of the web server'
    Value: !GetAtt WebServerInstance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-PublicIP'
```

## Key Security Features Implemented

### 🔐 **Network Security**
- **VPC with public/private subnets** across multiple AZs
- **Security groups** with minimal required access
- **NAT Gateway** for secure outbound internet access from private subnets
- **No direct internet access** to database subnets

### 🛡️ **Data Encryption**
- **S3 buckets** with AES-256 encryption at rest
- **RDS instance** with encryption at rest using AWS KMS
- **EBS volumes** encrypted for EC2 instances

### 👤 **IAM Security**
- **IAM roles** for EC2 instances (no embedded credentials)
- **Least privilege** access policies
- **Instance profiles** for secure service access

### 📊 **S3 Logging Configuration**
- **Versioning enabled** on logging bucket
- **Server access logging** configured
- **Public access blocked** on all buckets
- **Lifecycle policies** for log retention

### 🗄️ **RDS Security**
- **Private subnets only** (non-publicly accessible)
- **Encrypted storage** enabled
- **Security group** allowing access only from web servers
- **Automated backups** and **deletion protection**
- **CloudWatch logs** export enabled

### 📋 **Compliance Features**
- **All resources tagged** with Environment: Production
- **CloudWatch monitoring** enabled
- **IMDSv2 enforced** on EC2 instances
- **Detailed logging** throughout the infrastructure

## Deployment Instructions

1. **Save** the template as `secure-infrastructure.yaml`
2. **Deploy** using AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-production-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

This template provides a **production-ready, highly secure infrastructure** that follows AWS security best practices and meets all your specified requirements.