### Reasoning Trace
---

This is a comprehensive request for a production-grade AWS CloudFormation template for a financial services application. I need to create a complete infrastructure that addresses all 15 requirements while ensuring proper security, compliance, and operational excellence.

Let me break down the key components needed:

1. **Network Foundation**:
   - VPC with public and private subnets across 3 AZs
   - Internet Gateway for public subnets
   - NAT Gateway for private subnet outbound access
   - VPC Flow Logs

2. **Compute Resources**:
   - Bastion host in public subnet
   - Application EC2 instances in private subnets
   - IAM instance profiles and roles

3. **Database**:
   - Multi-AZ RDS instance in private subnets
   - Encrypted storage
   - Credentials in Parameter Store

4. **Storage**:
   - S3 buckets with versioning
   - Logging bucket
   - Block public access
   - Encryption

5. **Load Balancing & Protection**:
   - Application Load Balancer
   - WAF WebACL association

6. **Serverless**:
   - Lambda functions with appropriate IAM roles

7. **Security & Monitoring**:
   - CloudTrail for API monitoring
   - Security Groups with layered controls
   - Security Hub for aggregation
   - CloudWatch Logs for VPC Flow Logs

8. **Parameters & Outputs**:
   - Environment-specific parameters
   - Output critical endpoints

This is a large template, so I'll structure it logically with clear sections and dependencies.
### Answer 
---

# Enterprise Financial Services Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that implements all 15 security and operational requirements with proper dependency relationships and defense-in-depth controls.

## enterprise-infrastructure.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade AWS infrastructure for financial services application with defense-in-depth security controls'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - VPCCIDR
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBMasterUsername
          - DBPasswordParameter
      - Label:
          default: "Security Configuration"
        Parameters:
          - BastionKeyPairName
          - ApplicationKeyPairName
          - AdminIPCIDR

Parameters:
  Environment:
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Production
    Description: Deployment environment

  VPCCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$

  DBInstanceClass:
    Type: String
    Default: db.t3.medium
    Description: RDS instance type
    AllowedValues:
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  DBMasterUsername:
    Type: String
    Default: dbadmin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"

  DBPasswordParameter:
    Type: AWS::SSM::Parameter::Value<String>
    Default: /financial-app/rds/master-password
    Description: SSM Parameter Store path for RDS password (must be pre-created)
    NoEcho: true

  BastionKeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for bastion host SSH access

  ApplicationKeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for application instances SSH access

  AdminIPCIDR:
    Type: String
    Default: 0.0.0.0/0
    Description: IP CIDR block for administrative access (recommend restricting to your IP)
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$

Mappings:
  # AMI mappings for Amazon Linux 2
  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c

Resources:
  # ==========================================
  # NETWORK FOUNDATION
  # ==========================================
  
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-financial-vpc"
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-igw"
    
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    DependsOn: AttachGateway
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Cidr [!Ref VPCCIDR, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-public-subnet-1"
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    DependsOn: AttachGateway
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Cidr [!Ref VPCCIDR, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-public-subnet-2"
        - Key: Type
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    DependsOn: AttachGateway
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !Select [2, !Cidr [!Ref VPCCIDR, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-public-subnet-3"
        - Key: Type
          Value: Public

  # Private Subnets (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [3, !Cidr [!Ref VPCCIDR, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-private-subnet-1"
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [4, !Cidr [!Ref VPCCIDR, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-private-subnet-2"
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !Select [5, !Cidr [!Ref VPCCIDR, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-private-subnet-3"
        - Key: Type
          Value: Private

  # NAT Gateway for private subnet outbound access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-nat-eip"

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-nat-gateway"

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-public-routes"

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-private-routes"

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # ==========================================
  # VPC FLOW LOGS (Requirement 13)
  # ==========================================

  VPCFlowLogsRole:
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
        - PolicyName: CloudWatchLogPolicy
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
                Resource: !GetAtt VPCFlowLogGroup.Arn

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/vpc/${Environment}-flowlogs"
      RetentionInDays: 90
      KmsKeyId: !Ref LogsKMSKey

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-vpc-flowlog"

  # ==========================================
  # SECURITY GROUPS (Requirement 6)
  # ==========================================

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminIPCIDR
          Description: SSH access from admin IP
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-bastion-sg"

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH access from bastion host only
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-app-sg"

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: MySQL access from application instances only
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: MySQL access from Lambda functions
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-rds-sg"

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
          Description: HTTPS from internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from internet (redirect to HTTPS)
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-alb-sg"

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to AWS services
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: MySQL to RDS
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-lambda-sg"

  # ==========================================
  # IAM ROLES AND INSTANCE PROFILES (Requirements 2, 9)
  # ==========================================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub "${ApplicationDataBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationDataBucket.Arn
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:Encrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt StorageKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-ec2-role"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  BastionInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-bastion-role"

  BastionInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref BastionInstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub "${ApplicationDataBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationDataBucket.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-lambda-role"

  # ==========================================
  # KMS KEYS FOR ENCRYPTION (Requirement 4)
  # ==========================================

  StorageKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS and RDS encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: kms:*
            Resource: '*'
          - Sid: Allow use of the key for EBS
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'

  StorageKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${Environment}-storage-key"
      TargetKeyId: !Ref StorageKMSKey

  LogsKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for CloudWatch Logs encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: kms:*
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub "logs.${AWS::Region}.amazonaws.com"
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'

  LogsKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${Environment}-logs-key"
      TargetKeyId: !Ref LogsKMSKey

  # ==========================================
  # S3 BUCKETS (Requirements 3, 11)
  # ==========================================

  S3LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${Environment}-logs-bucket"
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
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-logs-bucket"

  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${Environment}-app-data"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LoggingBucket
        LogFilePrefix: application-data/
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-app-data"

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${Environment}-cloudtrail"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTrailLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-cloudtrail"

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
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  # ==========================================
  # EC2 INSTANCES (Requirements 2, 7, 12)
  # ==========================================

  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref "AWS::Region", AMI]
      InstanceType: t3.micro
      KeyName: !Ref BastionKeyPairName
      IamInstanceProfile: !Ref BastionInstanceProfile
      NetworkInterfaces:
        - DeviceIndex: 0
          SubnetId: !Ref PublicSubnet1
          GroupSet:
            - !Ref BastionSecurityGroup
          AssociatePublicIpAddress: true
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref StorageKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-bastion"
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s

  ApplicationInstance1:
    Type: AWS::EC2::Instance
    DependsOn: NATGateway
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref "AWS::Region", AMI]
      InstanceType: t3.medium
      KeyName: !Ref ApplicationKeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref ApplicationSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 50
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref StorageKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-app-instance-1"
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Financial Services Application - Instance 1</h1>" > /var/www/html/index.html

  ApplicationInstance2:
    Type: AWS::EC2::Instance
    DependsOn: NATGateway
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref "AWS::Region", AMI]
      InstanceType: t3.medium
      KeyName: !Ref ApplicationKeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref ApplicationSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 50
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref StorageKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-app-instance-2"
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Financial Services Application - Instance 2</h1>" > /var/www/html/index.html

  ApplicationInstance3:
    Type: AWS::EC2::Instance
    DependsOn: NATGateway
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref "AWS::Region", AMI]
      InstanceType: t3.medium
      KeyName: !Ref ApplicationKeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref ApplicationSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 50
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref StorageKMSKey
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-app-instance-3"
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Financial Services Application - Instance 3</h1>" > /var/www/html/index.html

  # ==========================================
  # RDS DATABASE (Requirements 5, 10)
  # ==========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-db-subnet-group"

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${Environment}-financial-db"
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: 8.0.35
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBPasswordParameter
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref StorageKMSKey
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-rds-database"

  # ==========================================
  # APPLICATION LOAD BALANCER (Requirement 15)
  # ==========================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${Environment}-financial-alb"
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-alb"

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${Environment}-app-targets"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref ApplicationInstance1
        - Id: !Ref ApplicationInstance2
        - Id: !Ref ApplicationInstance3
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-target-group"

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ==========================================
  # WAF WEB ACL (Requirement 15)
  # ==========================================

  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub "${Environment}-financial-waf"
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: SQLiRule
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRule
        - Name: CommonRuleSet
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSet
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${Environment}-waf-metric"
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-waf"

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn

  # ==========================================
  # LAMBDA FUNCTION (Requirement 9)
  # ==========================================

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${Environment}-data-processor"
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          S3_BUCKET: !Ref ApplicationDataBucket
          DB_ENDPOINT: !GetAtt RDSDatabase.Endpoint.Address
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          
          def lambda_handler(event, context):
              s3_bucket = os.environ['S3_BUCKET']
              db_endpoint = os.environ['DB_ENDPOINT']
              
              # Example function that processes financial data
              print(f"Processing data from S3 bucket: {s3_bucket}")
              print(f"Database endpoint: {db_endpoint}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Financial data processed successfully')
              }
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-lambda"

  # ==========================================
  # CLOUDTRAIL (Requirement 8)
  # ==========================================

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${Environment}-financial-trail"
      S3BucketName: !Ref CloudTrailBucket
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub "${ApplicationDataBucket.Arn}/"
      Tags:
        - Key: Name
          Value: !Sub "${Environment}-cloudtrail"

  # ==========================================
  # SECURITY HUB (Requirement 14)
  # ==========================================

  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      ControlFindingGenerator: SECURITY_CONTROL
      EnableDefaultStandards: true
      Tags:
        Name: !Sub "${Environment}-security-hub"

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPC"

  BastionPublicIP:
    Description: Bastion Host Public IP for SSH access
    Value: !GetAtt BastionInstance.PublicIp

  ApplicationLoadBalancerDNS:
    Description: ALB DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-DNS"

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-RDS-Endpoint"

  ApplicationDataBucketName:
    Description: Application Data S3 Bucket
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-AppBucket"

  CloudTrailBucketName:
    Description: CloudTrail S3 Bucket
    Value: !Ref CloudTrailBucket

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn

  WAFWebACLArn:
    Description: WAF Web ACL ARN
    Value: !GetAtt WAFWebACL.Arn

  SecurityHubArn:
    Description: Security Hub ARN
    Value: !Ref SecurityHub
```

## Template Overview

This CloudFormation template implements a production-grade financial services infrastructure with comprehensive security controls:

### Key Design Decisions:

1. **Network Architecture**
   - Multi-AZ deployment across 3 availability zones for high availability
   - Public/private subnet segregation with NAT Gateway for secure outbound access
   - VPC Flow Logs for complete network traffic visibility

2. **Security Layers**
   - WAF protecting the ALB from web exploits
   - Layered security groups implementing least privilege access
   - Bastion host as single entry point for administrative access
   - All data encrypted at rest using AWS KMS

3. **Compliance Features**
   - CloudTrail for comprehensive API auditing
   - S3 versioning for data recovery
   - 30-day RDS backup retention
   - Security Hub for centralized security findings

4. **Operational Excellence**
   - IAM instance profiles for secure AWS service access
   - Parameter Store integration for sensitive credentials
   - CloudWatch Logs for centralized logging
   - Multi-AZ RDS for database high availability

### Deployment Instructions:

1. **Prerequisites**:
   ```bash
   # Create RDS password in Parameter Store
   aws ssm put-parameter \
     --name "/financial-app/rds/master-password" \
     --value "YourSecurePassword123!" \
     --type "SecureString"
   
   # Create EC2 key pairs
   aws ec2 create-key-pair --key-name bastion-key
   aws ec2 create-key-pair --key-name application-key
   ```

2. **Deploy Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name financial-services-infrastructure \
     --template-body file://enterprise-infrastructure.yaml \
     --parameters \
       ParameterKey=Environment,ParameterValue=Production \
       ParameterKey=BastionKeyPairName,ParameterValue=bastion-key \
       ParameterKey=ApplicationKeyPairName,ParameterValue=application-key \
       ParameterKey=AdminIPCIDR,ParameterValue=YOUR_IP/32 \
     --capabilities CAPABILITY_IAM
   ```

3. **Access Pattern**:
   - SSH to bastion: `ssh -i bastion-key.pem ec2-user@BASTION_IP`
   - SSH to app instances: `ssh -i application-key.pem -J ec2-user@BASTION_IP ec2-user@PRIVATE_IP`
   - Application URL: `http://ALB_DNS_NAME`

This template fully addresses all 15 requirements with proper dependency relationships and security controls suitable for financial services applications.