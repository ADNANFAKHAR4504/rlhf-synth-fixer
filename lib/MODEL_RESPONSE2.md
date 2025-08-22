I'll create a comprehensive, production-ready CloudFormation template that meets all your security requirements and follows AWS best practices. This template is designed for expert-level security infrastructure.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Expert-Level AWS Security Infrastructure - Production Ready with Full Compliance'

Parameters:
  TeamName:
    Type: String
    Default: 'security'
    Description: 'Team name for resource naming convention'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment type for tagging and configuration'

  Owner:
    Type: String
    Default: 'infrastructure-team'
    Description: 'Resource owner for mandatory tagging'

  DBUsername:
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    Description: 'RDS master username (4-16 alphanumeric characters)'

  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 12
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]+$'
    Description: 'RDS master password (12-41 characters, alphanumeric and special chars)'

  CentralSecurityAccountId:
    Type: String
    AllowedPattern: '^[0-9]{12}$'
    Description: 'AWS Account ID for central security account (GuardDuty findings aggregation)'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for emergency access only (SSH will be disabled by default)'

Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023 AMI
      ELBAccountId: '797873946194'  # ELB service account for us-west-2
    us-east-1:
      AMI: ami-0abcdef1234567890
      ELBAccountId: '127311923021'  # ELB service account for us-east-1
    eu-west-1:
      AMI: ami-0d71ea30463e0ff8d
      ELBAccountId: '156460612806'  # ELB service account for eu-west-1

Conditions:
  IsProductionEnvironment: !Equals [!Ref Environment, 'prod']

Resources:
  # ===== KMS ENCRYPTION KEYS =====
  SecurityKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${TeamName} security infrastructure encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail Encryption
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:Decrypt
            Resource: '*'
            Condition:
              StringEquals:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-SecurityTrail'
          - Sid: Allow Lambda Environment Variable Encryption
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow RDS Encryption
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:GenerateDataKey*
            Resource: '*'
          - Sid: Allow DynamoDB Encryption
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:GenerateDataKey*
            Resource: '*'
      KeyRotationEnabled: true
      Tags:
        - Key: Name
          Value: !Sub 'KMS-${TeamName}-SecurityKey'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  SecurityKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${TeamName}-security-key-${Environment}'
      TargetKeyId: !Ref SecurityKMSKey

  # ===== VPC AND NETWORKING =====
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${TeamName}-SecureInfrastructure'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # VPC Flow Logs for security monitoring
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-${TeamName}-VPCFlowLogs'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsDeliveryRolePolicy
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
      Tags:
        - Key: Name
          Value: !Sub 'Role-${TeamName}-VPCFlowLogs'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${TeamName}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecurityKMSKey.Arn

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'FlowLogs-${TeamName}-VPC'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets across multiple AZs for high availability
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false  # Security best practice - no auto-assign public IPs
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Public-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Public-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  # Private Subnets for secure resources
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Private-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Private-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  # Database Subnets (isolated)
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Database-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Database-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  # NAT Gateways for high availability
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EIP-${TeamName}-NAT-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EIP-${TeamName}-NAT-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'NAT-${TeamName}-Gateway-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'NAT-${TeamName}-Gateway-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Public'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Private-1a'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Private-1b'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Database Route Table (no internet access)
  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Database'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref DatabaseRouteTable

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref DatabaseRouteTable

  # ===== SECURITY GROUPS =====
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SG-${TeamName}-ALB'
      GroupDescription: 'Security group for Application Load Balancer - Restrictive HTTPS only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP redirect to HTTPS'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'HTTP to EC2 instances'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'HTTPS to EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-ALB'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SG-${TeamName}-EC2'
      GroupDescription: 'Security group for EC2 instances - No SSH access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB only'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for updates'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: 'MySQL to RDS'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-EC2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SG-${TeamName}-RDS'
      GroupDescription: 'Security group for RDS database - EC2 access only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL from EC2 instances only'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL from Lambda functions only'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-RDS'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SG-${TeamName}-Lambda'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS APIs'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: 'MySQL to RDS'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-Lambda'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== S3 BUCKETS WITH AES-256 ENCRYPTION =====
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-secure-${AWS::AccountId}-${AWS::Region}'
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
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogGroup
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-SecureBucket'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-alb-logs-${AWS::AccountId}-${AWS::Region}'
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 60
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-ALBLogs'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: !Sub 
                - 'arn:aws:iam::${ELBAccountId}:root'
                - ELBAccountId: !FindInMap [RegionMap, !Ref 'AWS::Region', ELBAccountId]
            Action: s3:PutObject
            Resource: !Sub '${ALBLogsBucket}/AWSLogs/${AWS::AccountId}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              AWS: !Sub 
                - 'arn:aws:iam::${ELBAccountId}:root'
                - ELBAccountId: !FindInMap [RegionMap, !Ref 'AWS::Region', ELBAccountId]
            Action: s3:GetBucketAcl
            Resource: !Ref ALBLogsBucket
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Ref ALBLogsBucket
              - !Sub '${ALBLogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 2555  # 7 years for compliance
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-CloudTrail'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailLogsBucket
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-SecurityTrail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/CloudTrail-${TeamName}-SecurityTrail'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Ref CloudTrailLogsBucket
              - !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ===== IAM ROLES AND POLICIES (LEAST PRIVILEGE) =====
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-${TeamName}-EC2Instance'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore  # For Systems Manager instead of SSH
      Policies:
        - PolicyName: S3SecureBucketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureS3Bucket
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn
      Tags:
        - Key: Name
          Value: