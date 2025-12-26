```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade secure infrastructure baseline with encryption at rest, least-privilege IAM, and comprehensive monitoring'

Parameters:
  ProjectName:
    Type: String
    Default: iac-nova-model-breaking
    Description: 'Project name used for resource naming and tagging'
  
  Environment:
    Type: String
    Default: prod
    Description: 'Environment name (prod, staging, dev)'
  
  Region:
    Type: String
    Default: !Ref 'AWS::Region'
    Description: 'AWS region for deployment'
  
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
  
  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.1.0/24,10.0.2.0/24'
    Description: 'CIDR blocks for public subnets (2 values)'
  
  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.10.0/24,10.0.20.0/24'
    Description: 'CIDR blocks for private subnets (2 values)'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
  
  InstanceType:
    Type: String
    Default: t3.micro
    Description: 'EC2 instance type'
  
  AlertEmail:
    Type: String
    Description: 'Email address for CloudWatch alarms'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  
  AllowSshCidr:
    Type: String
    Default: 0.0.0.0/0
    Description: 'CIDR block allowed for SSH access to bastion'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

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

  # Security Groups
  BastionSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowSshCidr
          Description: 'SSH access from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  AppSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-app-sg'
      GroupDescription: 'Security group for application instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSG
          Description: 'SSH access from bastion'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  # KMS Keys
  KmsKeyData:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for data encryption - ${ProjectName} ${Environment}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EC2 instances
            Effect: Allow
            Principal:
              AWS: !GetAtt InstanceRole.Arn
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow S3 service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-data-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  KmsKeyDataAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}/${Environment}/data'
      TargetKeyId: !Ref KmsKeyData

  KmsKeyLogs:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for logs encryption - ${ProjectName} ${Environment}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow SNS
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow EC2 instances for logs
            Effect: Allow
            Principal:
              AWS: !GetAtt InstanceRole.Arn
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncrypt*
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-logs-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  KmsKeyLogsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}/${Environment}/logs'
      TargetKeyId: !Ref KmsKeyLogs

  # S3 Buckets
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKeyData
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-data'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  AppDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${AppDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': aws:kms
          - Sid: DenyWrongKMSKey
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${AppDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt KmsKeyData.Arn
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt AppDataBucket.Arn
              - !Sub '${AppDataBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false
          - Sid: DenyPublicAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt AppDataBucket.Arn
              - !Sub '${AppDataBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl':
                  - public-read
                  - public-read-write
                  - authenticated-read

  TrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-trail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKeyLogs
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-trail-logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  TrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt TrailLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${TrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                's3:x-amz-server-side-encryption': aws:kms
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt KmsKeyLogs.Arn
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TrailLogsBucket.Arn
              - !Sub '${TrailLogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # IAM Roles
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-instance-role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt AppDataBucket.Arn
                Condition:
                  StringLike:
                    's3:prefix': !Sub 'apps/${Environment}/*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${AppDataBucket}/apps/${Environment}/*'
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/cloudwatch/${ProjectName}-${Environment}*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                  - kms:Encrypt
                  - kms:GenerateDataKey
                  - kms:GenerateDataKeyWithoutPlaintext
                  - kms:ReEncrypt*
                Resource:
                  - !GetAtt KmsKeyData.Arn
                  - !GetAtt KmsKeyLogs.Arn
        - PolicyName: EC2Describe
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeTags
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-instance-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-instance-profile'
      Roles:
        - !Ref InstanceRole

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-cloudtrail-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsDelivery
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudTrailLogGroup}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  # EC2 Instances
  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSG
      IamInstanceProfile: !Ref InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref KmsKeyData
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          amazon-linux-extras install -y amazon-ssm-agent
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  AppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref AppSG
      IamInstanceProfile: !Ref InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref KmsKeyData
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          amazon-linux-extras install -y amazon-ssm-agent
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  # CloudWatch Log Groups
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt KmsKeyLogs.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail-logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/cloudwatch/${ProjectName}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt KmsKeyLogs.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security
        - Key: DataClassification
          Value: Confidential

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: TrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-trail'
      S3BucketName: !Ref TrailLogsBucket
      S3KeyPrefix: AWSLogs
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      KMSKeyId: !Ref KmsKeyLogs
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-trail'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Region
          Value: !Ref Region
        - Key: Owner
          Value: Security

  # SNS Topic for Alarms
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName:
```