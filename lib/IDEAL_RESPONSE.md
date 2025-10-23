```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-ready AWS infrastructure for financial services application with comprehensive security controls'

Parameters:
  TrustedIPRange:
    Type: String
    Default: "10.0.0.0/8"
    Description: CIDR block for trusted IP range allowed for SSH access
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  NotificationEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
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
    Properties:
      Description: KMS key for encrypting EBS volumes and S3 buckets
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
          - Sid: Allow CloudWatch Logs to use the key
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt*'
              - 'kms:Decrypt*'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:Describe*'
            Resource: '*'
            Condition:
              ArnLike:
                "kms:EncryptionContext:aws:logs:arn": !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
          - Sid: Allow EC2 to use the key
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:RevokeGrant' 
              - 'kms:GenerateDataKeyWithoutPlaintext'
              - 'kms:DescribeKey'
              - 'kms:ReEncrypt*'
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: true
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:Encrypt'
              - 'kms:DescribeKey'
              - 'kms:ReEncrypt*'
            Resource: '*'
          - Sid: Allow IAM roles to use the key
            Effect: Allow
            Principal:
              AWS: '*'
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'aws:PrincipalAccount': !Ref 'AWS::AccountId'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'  
          - Sid: Allow AutoScaling service to use the key
            Effect: Allow
            Principal:
              Service: autoscaling.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:RevokeGrant'
              - 'kms:DescribeKey'
              - 'kms:ReEncrypt*'
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: true
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
            - !Ref AWS::StackName
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
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
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
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
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
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
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
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
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
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
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
          Value: !Sub '${AWS::StackName}-DatabaseSubnet1'
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
          Value: !Sub '${AWS::StackName}-DatabaseSubnet2'
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
          Value: !Sub '${AWS::StackName}-NATEIP1'
        - Key: Environment
          Value: Production

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATEIP2'
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
          Value: !Sub '${AWS::StackName}-NATGateway1'
        - Key: Environment
          Value: Production

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NATGateway2'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
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
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
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
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
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
          Value: !Sub '${AWS::StackName}-BastionSG'
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
          Value: !Sub '${AWS::StackName}-ApplicationSG'
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
          Value: !Sub '${AWS::StackName}-DatabaseSG'
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
          Value: !Sub '${AWS::StackName}-ALBSG'
        - Key: Environment
          Value: Production

  # VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    DependsOn: KMSKey
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
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${AWS::StackName}'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${AWS::StackName}:*'
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
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}${ResourceSuffix}'
      RetentionInDays: 90

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    DependsOn: 
      - VPCFlowLogGroup
      - VPCFlowLogRole
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPCFlowLog'
        - Key: Environment
          Value: Production

  # S3 Buckets
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-app'
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
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-log'
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
              AWS: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/alb/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
              ArnLike:
                aws:SourceArn: !Sub 'arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:loadbalancer/*'
            
  BackupReplicaBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-bkp-rep'
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
    DependsOn:
      - BackupReplicaBucket
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-bkp'
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
    DependsOn: KMSKey
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
      Tags:
        - Key: Environment
          Value: Production

  # Create instance profile after role to avoid circular dependency
  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    DependsOn:
      - ApplicationRole
      - KMSKey
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
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-ct'
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
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}-logs'
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
    DependsOn:
      - CloudTrailBucketPolicy
      - ApplicationDataBucket
      - KMSKey
      - CloudTrailLogGroup
    Properties:
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogRole.Arn
      TrailName: !Sub '${AWS::StackName}-trail${ResourceSuffix}'
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
      TopicName: !Sub '${AWS::StackName}-alarms${ResourceSuffix}'
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
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
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
      AlarmName: !Sub '${AWS::StackName}-UnauthorizedAPICalls'
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
      AlarmName: !Sub '${AWS::StackName}-RootAccountUsage'
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
      AlarmName: !Sub '${AWS::StackName}-S3BucketPolicyChanges'
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
      AlarmName: !Sub '${AWS::StackName}-SecurityGroupChanges'
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
    DependsOn: CloudTrailLogGroup
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "UnauthorizedAPICalls"

  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    DependsOn: CloudTrailLogGroup
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "RootAccountUsage"

  S3BucketPolicyChangesMetricFilter:
    Type: AWS::Logs::MetricFilter
    DependsOn: CloudTrailLogGroup
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.eventSource = "s3.amazonaws.com") && (($.eventName = "PutBucketPolicy") || ($.eventName = "DeleteBucketPolicy")) }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: "CloudTrailMetrics"
          MetricName: "S3BucketPolicyChanges"

  SecurityGroupChangesMetricFilter:
    Type: AWS::Logs::MetricFilter
    DependsOn: CloudTrailLogGroup
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
          - - !Sub '${AWS::StackName}-ALB'
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
      Tags:
        - Key: Environment
          Value: Production
      
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-TG'
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
          - - !Sub '${AWS::StackName}-LaunchTemplate'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}'
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
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: Production
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Volume'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
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
          - - !Sub '${AWS::StackName}-ASG'
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
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-db-subnet-group'
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
          Value: !Sub '${AWS::StackName}-db-secret${ResourceSuffix}'
        - Key: Environment
          Value: Production

  # RDS MySQL instance (non-Aurora) — simpler, widely supported engine/version
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    DependsOn:
      - DBSecret
      - KMSKey
      - DBSubnetGroup
    Properties:
      DBInstanceIdentifier: !Join 
        - ""
        - - !Ref AWS::StackName
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
      DeletionProtection: true
      MultiAZ: true
      Tags:
        - Key: Environment
          Value: Production

  # Config for compliance monitoring
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn: ConfigRole
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-config-recorder'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DependsOn: 
      - ConfigBucket
      - ConfigBucketPolicy
      - AlarmTopic
    Properties:
      Name:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-config-delivery'
            - !Ref ResourceSuffix
            - !Select [0, !Split ["-", !Select [2, !Split ["/", !Ref AWS::StackId]]]]
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref AlarmTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Join:
          - "-"
          - - !Sub '${AWS::StackName}-cfg'
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
      Name: !Sub '${AWS::StackName}-VPC'

  ApplicationLoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  ApplicationDataBucketName:
    Description: Application Data S3 Bucket Name
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppBucket'

  DBEndpoint:
    Description: Database Endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  AlarmTopicArn:
    Description: SNS Topic ARN for CloudWatch Alarms
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlarmTopic'
```