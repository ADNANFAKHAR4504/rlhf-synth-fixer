```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-ready AWS infrastructure for financial services application with comprehensive security controls'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix for all resources and domain
    Default: dev

  TrustedIPRange:
    Type: String
    Default: "10.0.0.0/8"
    Description: CIDR block for trusted IP range allowed for SSH access
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  NotificationEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    Default: "demo@gmail.com"
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
  DBEngine:
    Type: String
    Default: "mysql"
    Description: Database engine to use
    AllowedValues:
      - "mysql"
      - "aurora-mysql"
      
  DBEngineVersion:
    Type: String
    Default: "8.0.39"
    Description: Database engine version for non-Aurora MySQL. Use a supported RDS MySQL version like 8.0.39.
    AllowedValues:
      - "8.0.39"
      - "8.0.37"
      - "8.0.33"
      - "5.7.38"
      
  ResourceSuffix:
    Type: String
    Default: ""
    Description: Optional suffix to append to resource names for uniqueness. Used for S3 buckets to avoid naming conflicts.

Mappings:
  # AWS ELB Account IDs by region - needed for ALB access logging
  RegionToELBAccountId:
    us-east-1:
      AccountId: "127311923021"
    us-east-2:
      AccountId: "033677994240"
    us-west-1:
      AccountId: "027434742980"
    us-west-2:
      AccountId: "797873946194"
    af-south-1:
      AccountId: "098369216593"
    ca-central-1:
      AccountId: "985666609251"
    eu-central-1:
      AccountId: "054676820928"
    eu-west-1:
      AccountId: "156460612806"
    eu-west-2:
      AccountId: "652711504416"
    eu-west-3:
      AccountId: "009996457667"
    eu-north-1:
      AccountId: "897822967062"
    eu-south-1:
      AccountId: "635631232127"
    ap-east-1:
      AccountId: "754344448648"
    ap-northeast-1:
      AccountId: "582318560864"
    ap-northeast-2:
      AccountId: "600734575887"
    ap-northeast-3:
      AccountId: "383597477331"
    ap-southeast-1:
      AccountId: "114774131450"
    ap-southeast-2:
      AccountId: "783225319266"
    ap-southeast-3:
      AccountId: "589379963580"
    ap-south-1:
      AccountId: "718504428378"
    me-south-1:
      AccountId: "076674570225"
    sa-east-1:
      AccountId: "507241528517"
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
    DatabaseSubnet1:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.21.0/24'


Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: KMS key for encrypting EBS volumes and S3 buckets
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - logs.amazonaws.com
                - rds.amazonaws.com
                - cloudtrail.amazonaws.com
                - ec2.amazonaws.com
                - autoscaling.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow CloudWatch Logs for VPC Flow Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/*'
          - Sid: Allow CloudWatch Logs for CloudTrail
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'
      Tags:
        - Key: Environment
          Value: Production

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName:
        Fn::Join:
          - "-"
          - - "alias/financial-services"
            - !Ref EnvironmentSuffix
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      TargetKeyId: !Ref KMSKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-VPC'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-IGW'
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-PublicSubnet1'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-PublicSubnet2'
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-PrivateSubnet1'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-PrivateSubnet2'
        - Key: Environment
          Value: Production

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-DatabaseSubnet1'
        - Key: Environment
          Value: Production

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-DatabaseSubnet2'
        - Key: Environment
          Value: Production

  # Elastic IPs for NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NATEIP1'
        - Key: Environment
          Value: Production

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NATEIP2'
        - Key: Environment
          Value: Production

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NATGateway1'
        - Key: Environment
          Value: Production

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NATGateway2'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-PublicRouteTable'
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${EnvironmentSuffix}-PrivateRouteTable1'
        - Key: Environment
          Value: Production

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${EnvironmentSuffix}-PrivateRouteTable2'
        - Key: Environment
          Value: Production

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion host with restricted SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIPRange
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-BastionSG'
        - Key: Environment
          Value: Production

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIPRange
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-ApplicationSG'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-DatabaseSG'
        - Key: Environment
          Value: Production

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
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-ALBSG'
        - Key: Environment
          Value: Production

  # VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: 
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${EnvironmentSuffix}${ResourceSuffix}'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${EnvironmentSuffix}${ResourceSuffix}:*'
              - Effect: Allow
                Action:
                  - 'kms:Encrypt'
                  - 'kms:Decrypt'
                  - 'kms:ReEncrypt*'
                  - 'kms:GenerateDataKey*'
                  - 'kms:DescribeKey'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${EnvironmentSuffix}${ResourceSuffix}'
      RetentionInDays: 90

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-VPCFlowLog'
        - Key: Environment
          Value: Production

  # S3 Buckets
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-app'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
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
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: application-data/
      Tags:
        - Key: Environment
          Value: Production

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-log'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      Tags:
        - Key: Environment
          Value: Production
  
  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/alb/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: ELBLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: ELBLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: !FindInMap [RegionToELBAccountId, !Ref "AWS::Region", AccountId]
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/alb/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
            
  BackupReplicaBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-bkp-rep'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  BackupBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-bkp'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Id: BackupReplicationRule
            Priority: 1
            Status: Enabled
            Filter: {}
            DeleteMarkerReplication:
              Status: Disabled
            Destination:
              Bucket: !GetAtt BackupReplicaBucket.Arn
              ReplicationTime:
                Status: Enabled
                Time:
                  Minutes: 15
              Metrics:
                Status: Enabled
                EventThreshold:
                  Minutes: 15
              StorageClass: GLACIER_IR
      Tags:
        - Key: Environment
          Value: Production
          
  # Replication is configured directly in the BackupBucket resource

  # IAM Roles
  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: ApplicationS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: 
                  - !Sub '${ApplicationDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ApplicationDataBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:GenerateDataKeyWithoutPlaintext'
                  - 'kms:Encrypt'
                  - 'kms:ReEncrypt*'
                  - 'kms:DescribeKey'
                  - 'kms:CreateGrant'
                  - 'kms:RevokeGrant'
                Resource: !GetAtt KMSKey.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref DBSecret
      Tags:
        - Key: Environment
          Value: Production

  # Create instance profile after role to avoid circular dependency
  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ApplicationRole

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      Tags:
        - Key: Environment
          Value: Production

  S3ReplicationPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: S3ReplicationPolicy
      Roles:
        - !Ref S3ReplicationRole
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 's3:ListBucket'
              - 's3:GetReplicationConfiguration'
            Resource: !GetAtt BackupBucket.Arn
          - Effect: Allow
            Action:
              - 's3:GetObjectVersionForReplication'
              - 's3:GetObjectVersionAcl'
              - 's3:GetObjectVersionTagging'
            Resource: !Sub '${BackupBucket.Arn}/*'
          - Effect: Allow
            Action:
              - 's3:ReplicateObject'
              - 's3:ReplicateDelete'
              - 's3:ReplicateTags'
            Resource: !Sub '${BackupReplicaBucket.Arn}/*'
          - Effect: Allow
            Action:
              - 'kms:Encrypt'
            Resource: !GetAtt KMSKey.Arn

  # CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-ct'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 365
      Tags:
        - Key: Environment
          Value: Production

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
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${EnvironmentSuffix}-logs'
      RetentionInDays: 365
      KmsKeyId: !GetAtt KMSKey.Arn
  
  CloudTrailLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailToCloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogRole.Arn
      TrailName: !Sub '${EnvironmentSuffix}-trail${ResourceSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      # Management events only - data events added later to avoid circular dependencies
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: "AWS::S3::Object"
              Values:
                - !Sub "arn:aws:s3:::${ApplicationDataBucket}/"
                - !Sub "arn:aws:s3:::${BackupBucket}/"
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      Tags:
        - Key: Environment
          Value: Production

  # SNS Topic for Alarms
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentSuffix}-alarms${ResourceSuffix}'
      DisplayName: Financial Services Application Alarms
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-HighCPU'
      AlarmDescription: Alert when CPU utilization exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref ApplicationAutoScalingGroup

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    DependsOn: CloudTrail
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-UnauthorizedAPICalls'
      AlarmDescription: Alert on unauthorized API calls
      MetricName: UnauthorizedAPICalls
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    DependsOn: CloudTrail
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-RootAccountUsage'
      AlarmDescription: Alert when root account is used
      MetricName: RootAccountUsage
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  S3BucketPolicyChangesAlarm:
    Type: AWS::CloudWatch::Alarm
    DependsOn: CloudTrail
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-S3BucketPolicyChanges'
      AlarmDescription: Alert on S3 bucket policy changes
      MetricName: S3BucketPolicyChanges
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  SecurityGroupChangesAlarm:
    Type: AWS::CloudWatch::Alarm
    DependsOn: CloudTrail
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-SecurityGroupChanges'
      AlarmDescription: Alert on security group changes
      MetricName: SecurityGroupChanges
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlarmTopic

  # Add all of these Metric Filter resources
  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "UnauthorizedAPICalls"

  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "RootAccountUsage"

  S3BucketPolicyChangesMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.eventSource = "s3.amazonaws.com") && (($.eventName = "PutBucketPolicy") || ($.eventName = "DeleteBucketPolicy")) }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "S3BucketPolicyChanges"

  SecurityGroupChangesMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.eventName = "AuthorizeSecurityGroupIngress") || ($.eventName = "AuthorizeSecurityGroupEgress") || ($.eventName = "RevokeSecurityGroupIngress") || ($.eventName = "RevokeSecurityGroupEgress") || ($.eventName = "CreateSecurityGroup") || ($.eventName = "DeleteSecurityGroup") }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "SecurityGroupChanges"

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: LoggingBucketPolicy
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-ALB'
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LoggingBucket
        - Key: access_logs.s3.prefix
          Value: 'alb'
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Environment
          Value: Production
      
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-TG'
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Environment
          Value: Production
  
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template for EC2 instances
  ApplicationLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    DependsOn: 
      - KMSKey
      - KMSKeyAlias
    Properties:
      LaunchTemplateName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-LaunchTemplate'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}'
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt ApplicationInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentSuffix}-Instance'
              - Key: Environment
                Value: Production
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentSuffix}-Volume'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            dnf update -y
            # Install httpd for a simple health check, python3, pip, boto3, pymysql, and the cloudwatch agent
            dnf install -y httpd python3 python3-pip amazon-cloudwatch-agent
            pip3 install boto3 pymysql

            # Get resource names
            RDS_ENDPOINT="${DBInstance.Endpoint.Address}"
            SECRET_ARN="${DBSecret}"
            REGION="${AWS::Region}"
            S3_BUCKET="${ApplicationDataBucket}"

            # Create Python server script
            cat > /home/ec2-user/server.py << 'EOFPYTHON'
            #!/usr/bin/env python3
            import pymysql
            import json
            import boto3
            import ssl
            from http.server import HTTPServer, BaseHTTPRequestHandler
            import os
            import time
            from datetime import datetime

            def get_db_creds():
                client = boto3.client('secretsmanager', region_name=os.environ.get('AWS_REGION'))
                secret_value = client.get_secret_value(SecretId=os.environ.get('SECRET_ARN'))
                return json.loads(secret_value['SecretString'])

            def test_rds_connection():
                try:
                    secret = get_db_creds()
                    connection = pymysql.connect(
                        host=os.environ.get('RDS_ENDPOINT'),
                        user=secret['username'],
                        password=secret['password'],
                        connect_timeout=5
                    )
                    connection.close()
                    return {
                        'status': 'SUCCESS',
                        'message': 'Connected to RDS successfully'
                    }
                except Exception as e:
                    return {
                        'status': 'FAILED',
                        'message': str(e)
                    }

            def test_s3_connection():
                try:
                    s3_client = boto3.client('s3', region_name=os.environ.get('AWS_REGION'))
                    bucket_name = os.environ.get('S3_BUCKET')
                    s3_client.head_bucket(Bucket=bucket_name)
                    return {
                        'status': 'SUCCESS',
                        'message': 'Connected to S3 successfully',
                        'bucket_name': bucket_name
                    }
                except Exception as e:
                    return {
                        'status': 'FAILED',
                        'message': str(e),
                        'bucket_name': os.environ.get('S3_BUCKET')
                    }

            class RequestHandler(BaseHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/health':
                        rds_result = test_rds_connection()
                        s3_result = test_s3_connection()
                        
                        all_healthy = (rds_result['status'] == 'SUCCESS' and 
                                       s3_result['status'] == 'SUCCESS')
                        
                        response_code = 200 if all_healthy else 503
                        response_body = {
                            'status': 'healthy' if all_healthy else 'unhealthy',
                            'rds': rds_result['status'].lower(),
                            's3': s3_result['status'].lower()
                        }
                        
                        self.send_response(response_code)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps(response_body).encode())
                    else:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(b"Financial Services Application - OK")
                
                def log_message(self, format, *args):
                    pass

            if __name__ == '__main__':
                http_server = HTTPServer(('0.0.0.0', 80), RequestHandler)
                print('HTTP Server started on port 80')
                http_server.serve_forever()
            EOFPYTHON

            # Set environment variables for the server script
            export RDS_ENDPOINT="$RDS_ENDPOINT"
            export SECRET_ARN="$SECRET_ARN"
            export AWS_REGION="$REGION"
            export S3_BUCKET="$S3_BUCKET"

            # Make script executable and run
            chmod +x /home/ec2-user/server.py
            nohup python3 /home/ec2-user/server.py > /var/log/server.log 2>&1 &

            # Configure CloudWatch agent (existing config)
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "FinancialServices",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization"}
                    ],
                    "resources": ["/"]
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/financial-services",
                        "log_stream_name": "{instance_id}/messages"
                      },
                      {
                        "file_path": "/var/log/server.log",
                        "log_group_name": "/aws/ec2/financial-services",
                        "log_stream_name": "{instance_id}/server.log"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              
  # Auto Scaling Group
  ApplicationAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-ASG'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref ApplicationLaunchTemplate
        Version: !GetAtt ApplicationLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBSubnetGroupName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-db-subnet-group'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # Secrets Manager for DB credentials
  # Using a timestamp-based suffix instead of explicit name to avoid collisions
  DBSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: RDS database master credentials
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-db-secret${ResourceSuffix}'
        - Key: Environment
          Value: Production

  # RDS MySQL instance (non-Aurora) — simpler, widely supported engine/version
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Join 
        - ""
        - - !Ref EnvironmentSuffix
          - "db"
          - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      DBInstanceClass: db.t3.medium
      Engine: !Ref DBEngine
      EngineVersion: !Ref DBEngineVersion
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: false
      MultiAZ: true
      Tags:
        - Key: Environment
          Value: Production

  # Config for compliance monitoring
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-config-recorder'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    DependsOn: 
      - ConfigBucketPolicy
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-config-delivery'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref AlarmTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${EnvironmentSuffix}-cfg'
            - !Ref AWS::AccountId
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

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
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
        - PolicyName: ConfigServicePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'config:Put*'
                  - 'config:Get*'
                  - 'config:List*'
                  - 'config:Describe*'
                  - 'config:BatchGet*'
                  - 'config:Select*'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'iam:GetRole'
                  - 'iam:ListRoles'
                  - 'iam:GetPolicy'
                  - 'iam:ListPolicies'
                  - 'iam:GetPolicyVersion'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  # GuardDuty for threat detection
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentSuffix}-VPC'

  ApplicationLoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentSuffix}-ALB-DNS'

  ApplicationDataBucketName:
    Description: Application Data S3 Bucket Name
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${EnvironmentSuffix}-AppBucket'

  DBEndpoint:
    Description: Database Endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentSuffix}-DBEndpoint'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${EnvironmentSuffix}-KMSKey'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${EnvironmentSuffix}-CloudTrail'

  AlarmTopicArn:
    Description: SNS Topic ARN for CloudWatch Alarms
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${EnvironmentSuffix}-AlarmTopic'
```
