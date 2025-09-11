Reasoning Trace
The user is getting a validation error because the AllowedSshCidr parameter doesn't have a default value and they didn't provide one in their deployment command. Looking at my template, I can see that AllowedSshCidr is marked as required but has no default value:

AllowedSshCidr:
  Type: String
  Description: CIDR block allowed to SSH to bastion host (e.g. your office IP/32)
  AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(0|[1-9]|[1-2][0-9]|3[0-2]))$
I need to either:

Add a default value (but that would be insecure - we don't want a default open CIDR)
Make sure the user provides the parameter correctly
Or provide better guidance
Looking at their deployment command, they mentioned ParameterKey=AllowedSshCidr,ParameterValue=YOUR.IP.ADDRESS.HERE/32 but they probably didn't replace that with an actual IP.

Let me also check if there are any other issues in the template that might cause problems:

The S3 bucket names might cause conflicts if they already exist
Some of the IAM role names might conflict
The KMS alias might conflict
Let me provide a fixed version with better parameter handling and deployment instructions.

Answer
You're right! The error occurs because AllowedSshCidr is a required parameter but wasn't provided with an actual value. Let me fix this and provide better deployment guidance.

Fixed TapStack.yml
Here's the corrected template with improved parameter handling:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Production-grade secure multi-tier VPC infrastructure for us-east-1'

Parameters:
  ProjectName:
    Type: String
    Default: TapStack
    Description: Name of the project for resource tagging and naming
    
  Environment:
    Type: String
    Default: production
    AllowedValues: [dev, staging, production]
    Description: Environment for deployment
    
  Owner:
    Type: String
    Description: Owner/Team responsible for this stack
    Default: DevOpsTeam
    
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$
    
  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: "10.0.1.0/24,10.0.2.0/24"
    Description: CIDR blocks for public subnets (must be within VPC CIDR)
    
  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: "10.0.10.0/24,10.0.11.0/24"
    Description: CIDR blocks for private subnets (must be within VPC CIDR)
    
  AllowedSshCidr:
    Type: String
    Default: 10.0.0.0/8
    Description: CIDR block allowed to SSH to bastion host (CHANGE THIS! Use your public IP/32)
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(0|[1-9]|[1-2][0-9]|3[0-2]))$
    
  BastionInstanceType:
    Type: String
    Default: t3.micro
    Description: Instance type for bastion host
    AllowedValues: [t3.nano, t3.micro, t3.small, t3.medium]
    
  PrivateInstanceType:
    Type: String
    Default: t3.micro
    Description: Instance type for private instances
    AllowedValues: [t3.nano, t3.micro, t3.small, t3.medium, t3.large]
    
  EbsCleanupRetentionHours:
    Type: Number
    Default: 24
    MinValue: 1
    MaxValue: 8760
    Description: Hours after which unattached EBS volumes can be deleted (1-8760)
    
  EbsCleanupRequireTag:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Whether to require AutoDelete=true tag for EBS cleanup

  # Add unique suffix to avoid naming conflicts
  UniqueId:
    Type: String
    Default: !Sub '${AWS::AccountId}-${AWS::Region}'
    Description: Unique identifier for resource naming (auto-generated)

Conditions:
  RequireAutoDeleteTag: !Equals [!Ref EbsCleanupRequireTag, 'true']

Resources:
  # =============================================================================
  # VPC AND NETWORKING
  # =============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

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
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways
  NatEip1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatEip2:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gw-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gw-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  # Route Table Associations
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

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # =============================================================================
  # KMS ENCRYPTION
  # =============================================================================
  
  KmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} S3 encryption and CloudTrail'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to use the key
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-kms-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  KmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-key-${Environment}'
      TargetKeyId: !Ref KmsKey

  # =============================================================================
  # S3 BUCKETS
  # =============================================================================
  
  S3AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-data-${Environment}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LogsBucket
        LogFilePrefix: app-access-logs/
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-app-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-logs-${Environment}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKey
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
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            TransitionInDays: 30
            StorageClass: STANDARD_IA
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-logs-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  # S3 Bucket Policies
  S3AppBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3AppBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${S3AppBucket}/*'
              - !Sub '${S3AppBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${S3AppBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: DenyWrongKMSKey
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${S3AppBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt KmsKey.Arn

  S3LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3LogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${S3LogsBucket}/*'
              - !Sub '${S3LogsBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !Sub '${S3LogsBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${S3LogsBucket}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          - Sid: AllowS3AccessLogDelivery
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${S3LogsBucket}/app-access-logs/*'

  # =============================================================================
  # CLOUDTRAIL
  # =============================================================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-cloudtrail-${Environment}'
      S3BucketName: !Ref S3LogsBucket
      S3KeyPrefix: cloudtrail-logs
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KmsKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${S3AppBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =============================================================================
  # IAM MANAGED POLICIES
  # =============================================================================
  
  AppDataAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${ProjectName}-AppDataAccess-${Environment}'
      Description: Policy for accessing app data bucket and KMS key
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: S3BucketAccess
            Effect: Allow
            Action:
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource: !Sub '${S3AppBucket}'
          - Sid: S3ObjectAccess
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource: !Sub '${S3AppBucket}/*'
          - Sid: KMSAccess
            Effect: Allow
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:DescribeKey
            Resource: !GetAtt KmsKey.Arn

  MfaEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${ProjectName}-MfaEnforcement-${Environment}'
      Description: Policy that denies console actions without MFA
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAllExceptListActionsWithoutMFA
            Effect: Deny
            Action:
              - 'iam:*'
              - 'sts:*'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'
          - Sid: DenyConsoleSigninWithoutMFA
            Effect: Deny
            Action:
              - 'iam:CreateLoginProfile'
              - 'iam:DeleteLoginProfile'
              - 'iam:UpdateLoginProfile'
              - 'iam:ChangePassword'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  LambdaEbsCleanupPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${ProjectName}-LambdaEbsCleanup-${Environment}'
      Description: Policy for Lambda EBS cleanup function
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EC2VolumeAccess
            Effect: Allow
            Action:
              - ec2:DescribeVolumes
              - ec2:DeleteVolume
            Resource: '*'
          - Sid: CloudWatchLogs
            Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: '*'

  # =============================================================================
  # IAM ROLES AND GROUPS
  # =============================================================================
  
  BastionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-BastionRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bastion-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-PrivateInstanceRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - !Ref AppDataAccessPolicy
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-instance-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EbsCleanupLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EbsCleanupLambdaRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - !Ref LambdaEbsCleanupPolicy
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ebs-cleanup-lambda-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ConsoleUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${ProjectName}-ConsoleUsers-${Environment}'
      ManagedPolicyArns:
        - !Ref MfaEnforcementPolicy

  # Instance Profiles
  BastionInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-BastionInstanceProfile-${Environment}'
      Roles:
        - !Ref BastionRole

  PrivateInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-PrivateInstanceProfile-${Environment}'
      Roles:
        - !Ref PrivateInstanceRole

  # =============================================================================
  # SECURITY GROUPS
  # =============================================================================
  
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-bastion-sg-${Environment}'
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSshCidr
          Description: SSH access from allowed CIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bastion-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-private-sg-${Environment}'
      GroupDescription: Security group for private instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH from bastion host
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =============================================================================
  # VPC ENDPOINTS
  # =============================================================================
  
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
            Resource: '*'

  SsmEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: '*'
            Resource: '*'

  Ec2MessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup

  SsmMessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup

  VpcEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-vpc-endpoint-sg-${Environment}'
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VpcCidr
          Description: HTTPS from VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc-endpoint-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =============================================================================
  # EC2 INSTANCES
  # =============================================================================
  
  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref BastionInstanceType
      IamInstanceProfile: !Ref BastionInstanceProfile
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-ssm-agent
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent
          
          # Harden SSH
          sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
          sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
          systemctl restart sshd
          
          # Install CloudWatch agent
          yum install -y amazon-cloudwatch-agent
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bastion'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-private-lt-${Environment}'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref PrivateInstanceType
        IamInstanceProfile:
          Name: !Ref PrivateInstanceProfile
        SecurityGroupIds:
          - !Ref PrivateSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-ssm-agent amazon-cloudwatch-agent
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
            
            # Install AWS CLI v2
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            
            # Test S3 access
            aws s3 ls s3://${S3AppBucket} || echo "S3 access test failed"
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-private-instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner

  PrivateAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-private-asg-${Environment}'
      LaunchTemplate:
        LaunchTemplateId: !Ref PrivateLaunchTemplate
        Version: !GetAtt PrivateLaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-asg'
          PropagateAtLaunch: false
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true

  # =============================================================================
  # EBS CLEANUP LAMBDA
  # =============================================================================
  
  EbsCleanupLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-ebs-cleanup-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt EbsCleanupLambdaRole.Arn
      Timeout: 300
      Environment:
        Variables:
          RETENTION_HOURS: !Ref EbsCleanupRetentionHours
          REQUIRE_TAG: !Ref EbsCleanupRequireTag
      Code:
        ZipFile: !Sub |
          import boto3
          import json
          import os
          from datetime import datetime, timedelta
          
          def lambda_handler(event, context):
              ec2 = boto3.client('ec2')
              retention_hours = int(os.environ['RETENTION_HOURS'])
              require_tag = os.environ['REQUIRE_TAG'].lower() == 'true'
              
              cutoff_time = datetime.now() - timedelta(hours=retention_hours)
              deleted_volumes = []
              
              try:
                  # Get all available (unattached) volumes
                  response = ec2.describe_volumes(
                      Filters=[{'Name': 'status', 'Values': ['available']}]
                  )
                  
                  for volume in response['Volumes']:
                      volume_id = volume['VolumeId']
                      create_time = volume['CreateTime'].replace(tzinfo=None)
                      
                      # Check if volume is old enough
                      if create_time > cutoff_time:
                          continue
                      
                      # Check for AutoDelete tag if required
                      if require_tag:
                          tags = {tag['Key']: tag['Value'] for tag in volume.get('Tags', [])}
                          if tags.get('AutoDelete', '').lower() != 'true':
                              continue
                      
                      try:
                          ec2.delete_volume(VolumeId=volume_id)
                          deleted_volumes.append(volume_id)
                          print(f"Deleted volume: {volume_id}")
                      except Exception as e:
                          print(f"Failed to delete volume {volume_id}: {str(e)}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'deleted_volumes': deleted_volumes,
                          'count': len(deleted_volumes)
                      })
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ebs-cleanup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EbsCleanupScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-ebs-cleanup-schedule-${Environment}'
      Description: Daily trigger for EBS cleanup Lambda
      ScheduleExpression: 'rate(1 day)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt EbsCleanupLambda.Arn
          Id: 'EbsCleanupTarget'

  EbsCleanupLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref EbsCleanupLambda
      Principal: events.amazonaws.com
      SourceArn: !GetAtt EbsCleanupScheduleRule.Arn

# =============================================================================
# OUTPUTS
# =============================================================================

Outputs:
  VpcId:
    Description: ID of the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-VpcId-${Environment}'

  PublicSubnetIds:
    Description: List of public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-PublicSubnetIds-${Environment}'

  PrivateSubnetIds:
    Description: List of private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-PrivateSubnetIds-${Environment}'

  NatGatewayIds:
    Description: List of NAT Gateway IDs
    Value: !Join [',', [!Ref NatGateway1, !Ref NatGateway2]]
    Export:
      Name: !Sub '${ProjectName}-NatGatewayIds-${Environment}'

  InternetGatewayId:
    Description: ID of the Internet Gateway
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${ProjectName}-InternetGatewayId-${Environment}'

  S3AppBucketName:
    Description: Name of the application data S3 bucket
    Value: !Ref S3AppBucket
    Export:
      Name: !Sub '${ProjectName}-S3AppBucketName-${Environment}'

  S3LogsBucketName:
    Description: Name of the logs S3 bucket
    Value: !Ref S3LogsBucket
    Export:
      Name: !Sub '${ProjectName}-S3LogsBucketName-${Environment}'

  KmsKeyArn:
    Description: ARN of the KMS key
    Value: !GetAtt KmsKey.Arn
    Export:
      Name: !Sub '${ProjectName}-KmsKeyArn-${Environment}'

  KmsAliasName:
    Description: Alias name of the KMS key
    Value: !Ref KmsAlias
    Export:
      Name: !Sub '${ProjectName}-KmsAliasName-${Environment}'

  CloudTrailArn:
    Description: ARN of the CloudTrail
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${ProjectName}-CloudTrailArn-${Environment}'

  TrailS3LogPrefix:
    Description: S3 prefix for CloudTrail logs
    Value: cloudtrail-logs
    Export:
      Name: !Sub '${ProjectName}-TrailS3LogPrefix-${Environment}'

  BastionInstanceId:
    Description: Instance ID of the bastion host
    Value: !Ref BastionInstance
    Export:
      Name: !Sub '${ProjectName}-BastionInstanceId-${Environment}'

  BastionPublicIp:
    Description: Public IP address of the bastion host
    Value: !GetAtt BastionInstance.PublicIp
    Export:
      Name: !Sub '${ProjectName}-BastionPublicIp-${Environment}'

  PrivateInstanceProfileName:
    Description: Name of the private instance profile
    Value: !Ref PrivateInstanceProfile
    Export:
      Name: !Sub '${ProjectName}-PrivateInstanceProfileName-${Environment}'

  PrivateInstanceRoleName:
    Description: Name of the private instance role
    Value: !Ref PrivateInstanceRole
    Export:
      Name: !Sub '${ProjectName}-PrivateInstanceRoleName-${Environment}'

  EbsCleanupLambdaArn:
    Description: ARN of the EBS cleanup Lambda function
    Value: !GetAtt EbsCleanupLambda.Arn
    Export:
      Name: !Sub '${ProjectName}-EbsCleanupLambdaArn-${Environment}'

  EbsCleanupRuleName:
    Description: Name of the EBS cleanup EventBridge rule
    Value: !Ref EbsCleanupScheduleRule
    Export:
      Name: !Sub '${ProjectName}-EbsCleanupRuleName-${Environment}'

  BastionSecurityGroupId:
    Description: ID of the bastion security group
    Value: !Ref BastionSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-BastionSecurityGroupId-${Environment}'

  PrivateSecurityGroupId:
    Description: ID of the private security group
    Value: !Ref PrivateSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-PrivateSecurityGroupId-${Environment}'

  ConsoleUsersGroupName:
    Description: Name of the console users group with MFA enforcement
    Value: !Ref ConsoleUsersGroup
    Export:
      Name: !Sub '${ProjectName}-ConsoleUsersGroupName-${Environment}'
```