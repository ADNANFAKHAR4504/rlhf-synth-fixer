### Reasoning Trace

---

This is a comprehensive request for a single CloudFormation template that creates a secure, production-ready AWS environment. Let me break down what's needed:

1. Network:

   * VPC with 2 AZs
   * Public subnets (for ALB only)
   * Private subnets (for EC2 and RDS)
   * No public IPs for EC2
   * Gateway endpoints for S3 and DynamoDB
   * Interface endpoints for ssm, ssmmessages, ec2messages, logs, events, kms

2. Security Groups:

   * ALB SG: allow 80/tcp from internet
   * EC2 SG: allow 80/tcp from ALB SG only
   * RDS SG: allow DB port from EC2 SG only

3. Compute:

   * EC2 in private subnets
   * Access via SSM Session Manager
   * Instance profile with minimal permissions
   * No explicit names for IAM resources

4. Load Balancing:

   * ALB in public subnets
   * HTTP listener on port 80
   * Optional CloudFront distribution

5. Database:

   * Multi-AZ PostgreSQL 15
   * Encryption with KMS
   * Automatic backups (7+ days)
   * Deletion protection
   * Key rotation enabled

6. S3 Buckets:

   * Trail logs bucket
   * ALB access logs bucket
   * App logs bucket
   * Versioning, encryption, block public access
   * Deny non-TLS access

7. Monitoring:

   * CloudTrail with log validation
   * CloudWatch log groups and alarms

8. Security:

   * WAF v2 with managed rule groups

9. Encryption:

   * KMS keys with rotation
   * Proper key policies

10. Systems Manager:

* SSM managed policy for EC2
* CloudWatch agent for comprehensive logging and monitoring
* Centralized log collection and performance tracking
* Automated metric gathering and system insights

I'll systematically construct the template, ensuring robust logging, monitoring, and system visibility across all components.

---

I'll create a comprehensive CloudFormation template that implements all your requirements. This is a substantial template that sets up a secure, production-ready AWS environment with proper isolation, encryption, and monitoring.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure production-ready AWS environment with private compute, multi-AZ database, and comprehensive security controls'

Parameters:
  VPCCIDRBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for the VPC
    AllowedPattern: '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.).*'
  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for public subnet 1
  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for public subnet 2
  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: CIDR block for private subnet 1
  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.12.0/24'
    Description: CIDR block for private subnet 2
  DBSubnet1CIDR:
    Type: String
    Default: '10.0.21.0/24'
    Description: CIDR block for database subnet 1
  DBSubnet2CIDR:
    Type: String
    Default: '10.0.22.0/24'
    Description: CIDR block for database subnet 2
  AllowedCIDRForALB:
    Type: String
    Default: '0.0.0.0/0'
    Description: CIDR block allowed to access the ALB
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$'
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: EC2 instance type
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: RDS instance class
    AllowedValues: [db.t3.micro, db.t3.small, db.t3.medium, db.r6g.large]
  DBEngine:
    Type: String
    Default: 'postgres'
    Description: Database engine
    AllowedValues: [postgres, mysql]
  DBEngineVersion:
    Type: String
    Default: '15.4'
    Description: Database engine version
  DBBackupRetention:
    Type: Number
    Default: 7
    MinValue: 7
    MaxValue: 35
    Description: Database backup retention in days
  LogRetentionDays:
    Type: Number
    Default: 30
    Description: CloudWatch logs retention in days
    AllowedValues: [7, 14, 30, 60, 90, 180, 365]
  EnableCloudFront:
    Type: String
    Default: 'false'
    AllowedValues: ['true','false']
    Description: Enable CloudFront distribution

Mappings:
  AWSRegion2AMI:
    us-east-1: { AMI: ami-0c02fb55731490381 }
    us-west-2: { AMI: ami-0352d5a37fb4f603f }
    eu-west-1: { AMI: ami-0f29c8402f8cce65c }

Conditions:
  CreateCloudFront: !Equals [!Ref EnableCloudFront, 'true']
  IsPostgres: !Equals [!Ref DBEngine, 'postgres']

Resources:
  # ---------------- 1) NETWORK ----------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDRBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-vpc' }]

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-igw' }]

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-public-subnet-1' }]

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-public-subnet-2' }]

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-private-subnet-1' }]

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-private-subnet-2' }]

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DBSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-db-subnet-1' }]

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DBSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-db-subnet-2' }]

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-public-rt' }]

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-private-rt-1' }]

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-private-rt-2' }]

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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DBSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DBSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Gateway Endpoints
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds: [!Ref PrivateRouteTable1, !Ref PrivateRouteTable2]

  DynamoDBEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      RouteTableIds: [!Ref PrivateRouteTable1, !Ref PrivateRouteTable2]

  # Interface Endpoints
  EndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC interface endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VPCCIDRBlock
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-endpoint-sg' }]

  SSMEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  SSMMessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  EC2MessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  LogsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  EventsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.events'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  KMSEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref EndpointSecurityGroup]

  # ---------------- 2) SECURITY GROUPS ----------------
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDRForALB
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-alb-sg' }]

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VPCCIDRBlock
          Description: HTTPS to VPC interface endpoints
        - IpProtocol: tcp
          FromPort: !If [IsPostgres, 5432, 3306]
          ToPort: !If [IsPostgres, 5432, 3306]
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: Database access
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-ec2-sg' }]

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [IsPostgres, 5432, 3306]
          ToPort: !If [IsPostgres, 5432, 3306]
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-rds-sg' }]

  RDSSecurityGroupSelfRef:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref RDSSecurityGroup
      IpProtocol: -1
      SourceSecurityGroupId: !Ref RDSSecurityGroup

  # ---------------- 3) KMS KEYS ----------------
  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for RDS database encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal: { Service: rds.amazonaws.com }
            Action: ['kms:Decrypt','kms:GenerateDataKey','kms:CreateGrant','kms:DescribeKey']
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'rds.${AWS::Region}.amazonaws.com'
                'kms:CallerAccount': !Sub '${AWS::AccountId}'

  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-database-key'
      TargetKeyId: !Ref DatabaseKMSKey

  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: ['kms:GenerateDataKey*','kms:DescribeKey']
            Resource: '*'
            Condition:
              StringLike:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/*'
          - Sid: Allow CloudTrail to decrypt logs
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: ['kms:Decrypt']
            Resource: '*'

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-key'
      TargetKeyId: !Ref S3KMSKey

  LogsKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for CloudWatch Logs encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal: { Service: !Sub 'logs.${AWS::Region}.amazonaws.com' }
            Action: ['kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey','kms:CreateGrant']
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  LogsKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-logs-key'
      TargetKeyId: !Ref LogsKMSKey

  # ---------------- 4) S3 BUCKETS ----------------
  TrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-trail-logs-${AWS::AccountId}'
      VersioningConfiguration: { Status: Enabled }
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-trail-logs' }]

  TrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt TrailLogsBucket.Arn, !Sub '${TrailLogsBucket.Arn}/*']
            Condition: { Bool: { 'aws:SecureTransport': 'false' } }
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt TrailLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-trail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: 's3:PutObject'
            Resource: !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-trail'

  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-alb-logs-${AWS::AccountId}'
      VersioningConfiguration: { Status: Enabled }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: { SSEAlgorithm: AES256 }
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
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-alb-logs' }]

  ALBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt ALBLogsBucket.Arn, !Sub '${ALBLogsBucket.Arn}/*']
            Condition: { Bool: { 'aws:SecureTransport': 'false' } }
          - Sid: AllowELBLogDelivery
            Effect: Allow
            Principal:
              AWS:
                - '127311923021'   # us-east-1
                - '797873946194'   # us-west-2
                - '156460612806'   # eu-west-1
            Action: 's3:PutObject'
            Resource: !Sub '${ALBLogsBucket.Arn}/*'

  AppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-logs-${AWS::AccountId}'
      VersioningConfiguration: { Status: Enabled }
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
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-app-logs' }]

  AppLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: [!GetAtt AppLogsBucket.Arn, !Sub '${AppLogsBucket.Arn}/*']
            Condition: { Bool: { 'aws:SecureTransport': 'false' } }

  # ---------------- 5) IAM FOR EC2 ----------------
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: EC2AppPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['s3:GetObject','s3:PutObject']
                Resource: !Sub '${AppLogsBucket.Arn}/*'
              - Effect: Allow
                Action: ['kms:Decrypt','kms:GenerateDataKey']
                Resource: !GetAtt S3KMSKey.Arn
              - Effect: Allow
                Action: ['logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents','logs:DescribeLogStreams']
                Resource: '*'
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-ec2-role' }]

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref EC2Role]

  # ---------------- 6) CLOUDWATCH LOGS ----------------
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogsKMSKey.Arn

  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/alb/${AWS::StackName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogsKMSKey.Arn

  WAFLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub 'aws-waf-logs-${AWS::StackName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogsKMSKey.Arn

  WAFLogging:
    Type: AWS::WAFv2::LoggingConfiguration
    Properties:
      ResourceArn: !GetAtt WAFWebACL.Arn
      LogDestinationConfigs:
        - !GetAtt WAFLogGroup.Arn
      RedactedFields: []

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogsKMSKey.Arn

  CloudTrailLogStreamRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['logs:CreateLogStream','logs:PutLogEvents']
                Resource: !GetAtt CloudTrailLogGroup.Arn

  # ---------------- 7) COMPUTE ----------------
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegion2AMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        IamInstanceProfile: { Arn: !GetAtt EC2InstanceProfile.Arn }
        SecurityGroupIds: [!Ref EC2SecurityGroup]
        TagSpecifications:
          - ResourceType: instance
            Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-instance' }]
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Minimal user-data to keep instance private-only and SSM-managed
            echo "<h1>${AWS::StackName}</h1>" > /tmp/index.html

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs: [!Ref TargetGroup]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg-instance'
          PropagateAtLaunch: true

  # ---------------- 8) LOAD BALANCING ----------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups: [!Ref ALBSecurityGroup]
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      LoadBalancerAttributes:
        - { Key: deletion_protection.enabled, Value: 'false' }
        - { Key: access_logs.s3.enabled,    Value: 'true'  }
        - { Key: access_logs.s3.bucket,     Value: !Ref ALBLogsBucket }
        - { Key: access_logs.s3.prefix,     Value: 'alb' }
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-alb' }]

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher: { HttpCode: '200' }
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-tg' }]

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions: [{ Type: forward, TargetGroupArn: !Ref TargetGroup }]

  # ---------------- 9) DATABASE ----------------
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds: [!Ref DBSubnet1, !Ref DBSubnet2]
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-db-subnet-group' }]

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: RDS Master User Password
      GenerateSecretString:
        SecretStringTemplate: '{"username":"dbadmin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\''
      KmsKeyId: !Ref DatabaseKMSKey

  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      AllocatedStorage: 20
      DBInstanceClass: !Ref DBInstanceClass
      Engine: !Ref DBEngine
      EngineVersion: !Ref DBEngineVersion
      MasterUsername: dbadmin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups: [!Ref RDSSecurityGroup]
      BackupRetentionPeriod: !Ref DBBackupRetention
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
      EnableCloudwatchLogsExports: [!If [IsPostgres, 'postgresql', 'error']]
      DeletionProtection: true
      AutoMinorVersionUpgrade: true
      CopyTagsToSnapshot: true
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-db' }]

  # ---------------- 10) WAF ----------------
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-web-acl'
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      Rules:
        - Name: SQLiRule
          Priority: 1
          Statement: { ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesSQLiRuleSet } }
          Action: { Block: {} }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: SQLiRule }
        - Name: KnownBadInputs
          Priority: 2
          Statement: { ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesKnownBadInputsRuleSet } }
          Action: { Block: {} }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: KnownBadInputs }
        - Name: CoreRuleSet
          Priority: 3
          Statement: { ManagedRuleGroupStatement: { VendorName: AWS, Name: AWSManagedRulesCommonRuleSet } }
          Action: { Block: {} }
          VisibilityConfig: { SampledRequestsEnabled: true, CloudWatchMetricsEnabled: true, MetricName: CoreRuleSet }
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-web-acl'
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-web-acl' }]

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      WebACLArn: !GetAtt WAFWebACL.Arn
      ResourceArn: !Ref ApplicationLoadBalancer

  # ---------------- 11) CLOUDFRONT (OPTIONAL) ----------------
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Condition: CreateCloudFront
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront for ${AWS::StackName}'
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: http-only
              HTTPPort: 80
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [HEAD, GET, OPTIONS]
          CachedMethods: [HEAD, GET, OPTIONS]
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies: { Forward: all }
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        HttpVersion: http2
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-cloudfront' }]

  # ---------------- 12) MONITORING & ALARMS ----------------
  EC2StatusCheckAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ec2-status-check'
      AlarmDescription: Alert when EC2 instance fails status check
      MetricName: StatusCheckFailed
      Namespace: AWS/EC2
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions: [{ Name: AutoScalingGroupName, Value: !Ref AutoScalingGroup }]

  EC2HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ec2-high-cpu'
      AlarmDescription: Alert when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions: [{ Name: AutoScalingGroupName, Value: !Ref AutoScalingGroup }]

  TargetGroup5XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-tg-5xx-errors'
      AlarmDescription: Alert when target group has 5XX errors
      MetricName: HTTPCode_Target_5XX_Count
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - { Name: TargetGroup,  Value: !GetAtt TargetGroup.TargetGroupFullName }
        - { Name: LoadBalancer, Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName }
      TreatMissingData: notBreaching

  DBFreeableMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-db-freeable-memory'
      AlarmDescription: Alert when database memory is low
      MetricName: FreeableMemory
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 100000000
      ComparisonOperator: LessThanThreshold
      Dimensions: [{ Name: DBInstanceIdentifier, Value: !Ref DBInstance }]

  DBFreeStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-db-free-storage'
      AlarmDescription: Alert when database storage is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2000000000
      ComparisonOperator: LessThanThreshold
      Dimensions: [{ Name: DBInstanceIdentifier, Value: !Ref DBInstance }]

  # ---------------- 13) CLOUDTRAIL ----------------
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: [TrailLogsBucketPolicy]
    Properties:
      TrailName: !Sub '${AWS::StackName}-trail'
      S3BucketName: !Ref TrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${TrailLogsBucket.Arn}/'
                - !Sub '${ALBLogsBucket.Arn}/'
                - !Sub '${AppLogsBucket.Arn}/'
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogStreamRole.Arn
      KMSKeyId: !Ref S3KMSKey
      Tags: [{ Key: Name, Value: !Sub '${AWS::StackName}-trail' }]

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export: { Name: !Sub '${AWS::StackName}-vpc-id' }
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export: { Name: !Sub '${AWS::StackName}-public-subnet-1' }
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export: { Name: !Sub '${AWS::StackName}-public-subnet-2' }
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export: { Name: !Sub '${AWS::StackName}-private-subnet-1' }
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export: { Name: !Sub '${AWS::StackName}-private-subnet-2' }
  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable
  PrivateRouteTable1Id:
    Description: Private Route Table 1 ID
    Value: !Ref PrivateRouteTable1
  PrivateRouteTable2Id:
    Description: Private Route Table 2 ID
    Value: !Ref PrivateRouteTable2
  S3EndpointId:
    Description: S3 VPC Endpoint ID
    Value: !Ref S3Endpoint
  DynamoDBEndpointId:
    Description: DynamoDB VPC Endpoint ID
    Value: !Ref DynamoDBEndpoint
  SSMEndpointId:
    Description: SSM VPC Endpoint ID
    Value: !Ref SSMEndpoint
  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export: { Name: !Sub '${AWS::StackName}-alb-dns' }
  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref TargetGroup
    Export: { Name: !Sub '${AWS::StackName}-target-group-arn' }
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export: { Name: !Sub '${AWS::StackName}-db-endpoint' }
  DatabaseArn:
    Description: RDS Database ARN
    Value: !GetAtt DBInstance.DBInstanceArn
  TrailLogsBucketName:
    Description: CloudTrail Logs Bucket Name
    Value: !Ref TrailLogsBucket
  ALBLogsBucketName:
    Description: ALB Logs Bucket Name
    Value: !Ref ALBLogsBucket
  AppLogsBucketName:
    Description: Application Logs Bucket Name
    Value: !Ref AppLogsBucket
  DatabaseKMSKeyArn:
    Description: Database KMS Key ARN
    Value: !GetAtt DatabaseKMSKey.Arn
  S3KMSKeyArn:
    Description: S3 KMS Key ARN
    Value: !GetAtt S3KMSKey.Arn
  LogsKMSKeyArn:
    Description: CloudWatch Logs KMS Key ARN
    Value: !GetAtt LogsKMSKey.Arn
  ApplicationLogGroupName:
    Description: Application CloudWatch Log Group Name
    Value: !Ref ApplicationLogGroup
  CloudFrontDistributionDomainName:
    Condition: CreateCloudFront
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
```
