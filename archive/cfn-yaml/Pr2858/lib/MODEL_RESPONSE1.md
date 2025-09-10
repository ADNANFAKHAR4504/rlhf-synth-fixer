Reasoning Trace
The error shows a circular dependency between resources. Let me analyze the dependencies:

AutoScalingGroup -> depends on EC2LaunchTemplate, ALBTargetGroup (through TargetGroupARNs)
EC2LaunchTemplate -> depends on EC2SecurityGroup
EC2SecurityGroup -> has SecurityGroupEgress that references ALBSecurityGroup (DestinationSecurityGroupId)
ALBSecurityGroup -> has SecurityGroupEgress that references EC2SecurityGroup (SourceSecurityGroupId)
ApplicationLoadBalancer -> depends on ALBSecurityGroup
ALBListener -> depends on ApplicationLoadBalancer, ALBTargetGroup
WebACLAssociation -> depends on ApplicationLoadBalancer
The circular dependency is between ALBSecurityGroup and EC2SecurityGroup - they both reference each other in their egress/ingress rules.

The fix is to:

Create the security groups without the cross-references first
Then add the cross-references using separate SecurityGroupIngress/SecurityGroupEgress resources
Also, I notice the output section was cut off at the end. Let me fix that too.

Answer
The error shows a circular dependency between the security groups. The ALBSecurityGroup references EC2SecurityGroup in its egress rules, and EC2SecurityGroup references ALBSecurityGroup in its ingress rules. Here's the corrected template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Secure baseline infrastructure with KMS, VPC, ALB, WAF, EC2, Lambda, CloudTrail, Config, and GuardDuty'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - EnvironmentName
          - Owner
          - CostCenter
      - Label:
          default: "Network Configuration"
        Parameters:
          - AllowedIngressCIDRForAlbHttp
      - Label:
          default: "Compute Configuration"
        Parameters:
          - InstanceType
          - MinCapacity
          - MaxCapacity
          - AppPort
      - Label:
          default: "Logging Configuration"
        Parameters:
          - LogRetentionDays

Parameters:
  ProjectName:
    Type: String
    Default: 'TapStack'
    Description: 'Project name for resource naming and tagging'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    MaxLength: 32
  
  EnvironmentName:
    Type: String
    Default: 'dev'
    Description: 'Environment name'
    AllowedValues: ['dev', 'staging', 'prod']
  
  Owner:
    Type: String
    Default: 'DevOps'
    Description: 'Resource owner for tagging'
    MaxLength: 64
  
  CostCenter:
    Type: String
    Default: 'Engineering'
    Description: 'Cost center for billing'
    MaxLength: 64
  
  AllowedIngressCIDRForAlbHttp:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed to access ALB HTTP port'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$'
  
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
  
  MinCapacity:
    Type: Number
    Default: 1
    Description: 'Minimum number of EC2 instances'
    MinValue: 1
    MaxValue: 10
  
  MaxCapacity:
    Type: Number
    Default: 2
    Description: 'Maximum number of EC2 instances'
    MinValue: 1
    MaxValue: 10
  
  AppPort:
    Type: Number
    Default: 8080
    Description: 'Application port for EC2 instances'
    MinValue: 1024
    MaxValue: 65535
  
  LogRetentionDays:
    Type: Number
    Default: 30
    Description: 'CloudWatch log retention in days'
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]

Mappings:
  AZMapping:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b

Conditions:
  IsProd: !Equals [!Ref EnvironmentName, 'prod']

Resources:
  # KMS Key
  TapStackKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${ProjectName} customer-managed KMS key for data-at-rest encryption'
      EnableKeyRotation: true
      KeyPolicy:
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
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:Decrypt
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: Allow Config
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:Decrypt
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  TapStackKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-kms'
      TargetKeyId: !Ref TapStackKMSKey

  # S3 Buckets
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !If [IsProd, 2557, 90]
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  TrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-trail-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'trail-logs-access/'
      LifecycleConfiguration:
        Rules:
          - Id: TransitionAndDeleteLogs
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            ExpirationInDays: !If [IsProd, 2557, 365]
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
            NoncurrentVersionExpirationInDays: 365
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  TrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TrailLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TrailLogsBucket.Arn
              - !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt TrailLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-trail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${TrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-trail'

  ConfigLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-config-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ConfigLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ConfigLogsBucket.Arn
              - !Sub '${ConfigLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  LambdaArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-lambda-artifacts-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LambdaArtifactsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LambdaArtifactsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LambdaArtifactsBucket.Arn
              - !Sub '${LambdaArtifactsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # VPC and Networking
  TapStackVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref TapStackVPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ1]
      CidrBlock: '10.0.10.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      AvailabilityZone: !FindInMap [AZMapping, !Ref 'AWS::Region', AZ2]
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

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
      VpcId: !Ref TapStackVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

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

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups (created without cross-references to avoid circular dependency)
  VpcEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '10.0.0.0/16'
          Description: 'HTTPS from VPC CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc-endpoint-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIngressCIDRForAlbHttp
          Description: 'HTTP access from allowed CIDR'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-alb-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref TapStackVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS to internet for updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP to internet for updates'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: !Ref VpcEndpointSecurityGroup
          Description: 'HTTPS to VPC endpoints'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ec2-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref TapStackVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: !Ref VpcEndpointSecurityGroup
          Description: 'HTTPS to VPC endpoints'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Security Group Rules (to break circular dependency)
  ALBToEC2SecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref ALBSecurityGroup
      IpProtocol: tcp
      FromPort: !Ref AppPort
      ToPort: !Ref AppPort
      DestinationSecurityGroupId: !Ref EC2SecurityGroup
      Description: 'App port to EC2 instances'

  EC2FromALBSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: !Ref AppPort
      ToPort: !Ref AppPort
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: 'App port from ALB'

  # VPC Endpoints
  S3VpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
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
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt TrailLogsBucket.Arn
              - !Sub '${TrailLogsBucket.Arn}/*'
              - !GetAtt ConfigLogsBucket.Arn
              - !Sub '${ConfigLogsBucket.Arn}/*'
              - !GetAtt LambdaArtifactsBucket.Arn
              - !Sub '${LambdaArtifactsBucket.Arn}/*'
              - !GetAtt AccessLogsBucket.Arn
              - !Sub '${AccessLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                'aws:SourceVpc': !Ref TapStackVPC

  KmsVpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
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
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: !GetAtt TapStackKMSKey.Arn
            Condition:
              StringEquals:
                'aws:SourceVpc': !Ref TapStackVPC

  LogsVpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
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
            Action:
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
              - 'logs:DescribeLogGroups'
              - 'logs:DescribeLogStreams'
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceVpc': !Ref TapStackVPC

  SsmVpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup

  SsmMessagesVpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup

  Ec2MessagesVpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref TapStackVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VpcEndpointSecurityGroup

  # Application Load Balancer
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-tg'
      Port: !Ref AppPort
      Protocol: HTTP
      VpcId: !Ref TapStackVPC
      HealthCheckPath: '/health'
      HealthCheckProtocol: HTTP
      HealthCheckPort: !Ref AppPort
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # WAF
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-webacl'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: AWSManagedRulesAmazonIpReputationList
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAmazonIpReputationList
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AmazonIpReputationListMetric
        - Name: AWSManagedRulesAnonymousIpList
          Priority: 4
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAnonymousIpList
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AnonymousIpListMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}WebACL'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # IAM Roles
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2InstanceRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}*'
        - PolicyName: S3ArtifactsAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource:
                  - !Sub '${LambdaArtifactsBucket.Arn}/ec2/*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2InstanceProfile'
      Roles:
        - !Ref EC2InstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-LambdaExecutionRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  CloudTrailLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-CloudTrailLogsRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ConfigRole'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: S3DeliveryAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigLogsBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetBucketAcl'
                Resource: !Sub '${ConfigLogsBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': 'bucket-owner-full-control'
        - PolicyName: KMSAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:GenerateDataKey'
                  - 'kms:DescribeKey'
                Resource: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}'
      RetentionInDays: !If [IsProd, 365, !Ref LogRetentionDays]
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-function'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt TapStackKMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # EC2 Launch Template and Auto Scaling
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-launch-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeSize: 8
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref TapStackKMSKey
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Simple HTTP server for health checks
            cat > /home/ec2-user/app.py << 'EOF'
            #!/usr/bin/env python3
            from http.server import HTTPServer, BaseHTTPRequestHandler
            import json
            import time
            
            class Handler(BaseHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/health':
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        response = {'status': 'healthy', 'timestamp': time.time()}
                        self.wfile.write(json.dumps(response).encode())
                    else:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(b'<h1>TapStack Application Server</h1>')
            
            if __name__ == '__main__':
                server = HTTPServer(('0.0.0.0', ${AppPort}), Handler)
                server.serve_forever()
            EOF
            
            chmod +x /home/ec2-user/app.py
            chown ec2-user:ec2-user /home/ec2-user/app.py
            
            # Start application as service
            cat > /etc/systemd/system/tapstack-app.service << 'EOF'
            [Unit]
            Description=TapStack Application Server
            After=network.target
            
            [Service]
            Type=simple
            User=ec2-user
            ExecStart=/usr/bin/python3 /home/ec2-user/app.py
            Restart=always
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            systemctl enable tapstack-app
            systemctl start tapstack-app
            
            # CloudWatch agent configuration
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${ProjectName}",
                        "log_stream_name": "{instance_id}/system"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref Owner
              - Key: CostCenter
                Value: !Ref CostCenter

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinCapacity
      MaxSize: !Ref MaxCapacity
      DesiredCapacity: !Ref MinCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-asg'
          PropagateAtLaunch: false
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # Lambda Function
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-function'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT: !Ref EnvironmentName
          KMS_KEY_ID: !Ref TapStackKMSKey
      KmsKeyArn: !GetAtt TapStackKMSKey.Arn
      Code:
        ZipFile: |
          import json
          import os
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
              
              project_name = os.environ.get('PROJECT_NAME', 'Unknown')
              environment = os.environ.get('ENVIRONMENT', 'Unknown')
              
              response = {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': f'Hello from {project_name} Lambda function',
                      'environment': environment,
                      'event': event
                  })
              }
              
              logger.info(f"Response: {json.dumps(response)}")
              return response
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: TrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-trail'
      S3BucketName: !Ref TrailLogsBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogsRole.Arn
      KMSKeyId: !Ref TapStackKMSKey
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # AWS Config
  ConfigConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-config-recorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${ProjectName}-config-delivery-channel'
      S3BucketName: !Ref ConfigLogsBucket
      S3KeyPrefix: 'config'
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: Daily

  # Config Rules
  S3BucketPublicReadProhibitedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-public-read-prohibited
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  S3BucketPublicWriteProhibitedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-public-write-prohibited
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_WRITE_PROHIBITED

  CloudTrailEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: cloudtrail-enabled
      Source:
        Owner: AWS
        SourceIdentifier: CLOUD_TRAIL_ENABLED

  RestrictedSSHRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: incoming-ssh-disabled
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED

  # Sample Remediation Configuration
  S3PublicReadRemediationConfiguration:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: !Ref S3BucketPublicReadProhibitedRule
      TargetType: SSM_DOCUMENT
      TargetId: AWSConfigRemediation-RemoveS3BucketPublicReadAccess
      TargetVersion: '1'
      Parameters:
        AutomationAssumeRole:
          StaticValue: !GetAtt ConfigRole.Arn
        S3BucketName:
          ResourceValue: RESOURCE_ID
      Automatic: false
      MaximumAutomaticAttempts: 1

  # GuardDuty
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

Outputs:
  # VPC and Networking
  VPCId:
    Description: VPC ID
    Value: !Ref TapStackVPC
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-VPCId'

  PublicSubnetIds:
    Description: Public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-PrivateSubnetIds'

  # Load Balancer
  AlbArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-AlbArn'

  AlbDnsName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-AlbDnsName'

  AlbSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-AlbSecurityGroupId'

  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-TargetGroupArn'

  # WAF
  WebAclArn:
    Description: WAF Web ACL ARN
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentName}-WebAclArn'

  # EC2
  Ec2AutoScalingGroupName:
    Description
```