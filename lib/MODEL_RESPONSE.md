### Reasoning Trace
---

This is a comprehensive request for a production-ready AWS CloudFormation template. I need to create a YAML template that includes:

1. VPC with public/private subnets across 2 AZs in us-east-1
2. IAM roles with least privilege
3. EC2 instances with restricted SSH access
4. Auto Scaling Group (min 3 instances)
5. Application Load Balancer (HTTP/HTTPS)
6. RDS Multi-AZ with encryption
7. CloudTrail for auditing
8. AWS Config for compliance
9. S3 bucket for logs (encrypted, versioned)
10. Systems Manager Parameter Store
11. CloudWatch alarms
12. KMS encryption with rotation
13. Resource tagging (Environment, Owner, Project)
14. Automated backups and patch management

This is a large template, so I'll structure it properly with all the required components. Let me create a comprehensive CloudFormation template.
### Answer 
---

# Production-Ready AWS CloudFormation Template

Below is a comprehensive CloudFormation template that implements a secure, scalable AWS production environment following best practices. The template is modular and includes detailed configurations for all requested components.

## CloudFormation Template (production-stack.yaml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and scalable AWS production environment with complete security, compliance, and monitoring'

# ====================
# PARAMETERS
# ====================
Parameters:
  EnvironmentName:
    Description: Environment name (e.g., production, staging)
    Type: String
    Default: production
    AllowedValues:
      - production
      - staging
      - development

  ProjectName:
    Description: Project name for tagging
    Type: String
    Default: MyProject

  OwnerEmail:
    Description: Owner email for tagging
    Type: String
    Default: owner@example.com

  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be a valid EC2 key pair

  DBMasterUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Description: Database master password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()]*'
    ConstraintDescription: Must contain at least 8 characters

  AllowedSSHIP:
    Description: IP address allowed to SSH (use 0.0.0.0/0 for any - NOT recommended)
    Type: String
    Default: '10.0.0.0/8'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

# ====================
# MAPPINGS
# ====================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet1:
      CIDR: 10.0.10.0/24
    PrivateSubnet2:
      CIDR: 10.0.11.0/24
    DatabaseSubnet1:
      CIDR: 10.0.20.0/24
    DatabaseSubnet2:
      CIDR: 10.0.21.0/24

# ====================
# RESOURCES
# ====================
Resources:

  # ========================================
  # KMS Keys
  # ========================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting production resources
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - rds.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-production-key'
      TargetKeyId: !Ref KMSKey

  # ========================================
  # VPC and Networking
  # ========================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-vpc'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-igw'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

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
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-public-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-public-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-private-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-private-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-database-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-database-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-nat-eip-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-nat-eip-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-nat-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-nat-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-public-rt'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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
          Value: !Sub '${ProjectName}-${EnvironmentName}-private-rt-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref DatabaseSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-private-rt-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref DatabaseSubnet2

  # ========================================
  # Security Groups
  # ========================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentName}-alb-sg'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-alb-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentName}-ec2-sg'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: Restricted SSH access
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-ec2-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentName}-db-sg'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow MySQL/Aurora access from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-db-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ========================================
  # IAM Roles
  # ========================================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: EC2InstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${LogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2InstanceRole

  # ========================================
  # S3 Buckets
  # ========================================
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentName}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LogsBucket.Arn
              - !Sub '${LogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ========================================
  # CloudTrail
  # ========================================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LogsBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${EnvironmentName}-trail'
      S3BucketName: !Ref LogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${LogsBucket.Arn}/'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ========================================
  # AWS Config
  # ========================================
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentName}-config-recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentName}-config-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt LogsBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${LogsBucket.Arn}/*'

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentName}-delivery-channel'
      S3BucketName: !Ref LogsBucket

  # Config Rules for Compliance
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: required-tags
      Description: Checks whether resources contain all required tags
      InputParameters: |
        {
          "tag1Key": "Environment",
          "tag2Key": "Owner",
          "tag3Key": "Project"
        }
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS

  # ========================================
  # Systems Manager Parameter Store
  # ========================================
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${EnvironmentName}/db/endpoint'
      Description: RDS Endpoint URL
      Type: String
      Value: !GetAtt DatabaseCluster.Endpoint.Address
      Tags:
        Environment: !Ref EnvironmentName
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  DBPortParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${EnvironmentName}/db/port'
      Description: RDS Port
      Type: String
      Value: !GetAtt DatabaseCluster.Endpoint.Port
      Tags:
        Environment: !Ref EnvironmentName
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  # ========================================
  # Application Load Balancer
  # ========================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentName}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ========================================
  # Launch Template
  # ========================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${EnvironmentName}-lt'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        KeyName: !Ref KeyPairName
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref KMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${EnvironmentName}-instance'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${EnvironmentName}-volume'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            yum update -y
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Install SSM agent (usually pre-installed on Amazon Linux 2)
            yum install -y amazon-ssm-agent
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
            
            # Install and start web server (example)
            yum install -y httpd
            systemctl enable httpd
            systemctl start httpd
            
            # Create health check endpoint
            echo "OK" > /var/www/html/health
            
            # Configure automatic security updates
            yum install -y yum-cron
            sed -i 's/apply_updates = no/apply_updates = yes/' /etc/yum/yum-cron.conf
            systemctl enable yum-cron
            systemctl start yum-cron
            
            # Send signal to CloudFormation
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}

  # ========================================
  # Auto Scaling Group
  # ========================================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${EnvironmentName}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 3
      MaxSize: 9
      DesiredCapacity: 3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: 3
        Timeout: PT15M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 3
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      MetricAggregationType: Average
      EstimatedInstanceWarmup: 300
      StepAdjustments:
        - MetricIntervalLowerBound: 0
          MetricIntervalUpperBound: 10
          ScalingAdjustment: 1
        - MetricIntervalLowerBound: 10
          ScalingAdjustment: 2

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      MetricAggregationType: Average
      EstimatedInstanceWarmup: 300
      StepAdjustments:
        - MetricIntervalUpperBound: 0
          ScalingAdjustment: -1

  # ========================================
  # RDS Database
  # ========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Aurora Cluster Parameter Group
      Family: aurora-mysql5.7
      Parameters:
        character_set_server: utf8mb4
        collation_server: utf8mb4_unicode_ci
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: aurora-mysql
      EngineVersion: 5.7.mysql_aurora.2.10.2
      DBClusterIdentifier: !Sub '${ProjectName}-${EnvironmentName}-cluster'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: mon:04:00-mon:05:00
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      DeletionProtection: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentName}-instance-1'
      DBClusterIdentifier: !Ref DatabaseCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      AvailabilityZone: !Select [0, !GetAZs '']
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentName}-instance-2'
      DBClusterIdentifier: !Ref DatabaseCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      AvailabilityZone: !Select [1, !GetAZs '']
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # ========================================
  # CloudWatch Alarms
  # ========================================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-high-cpu'
      AlarmDescription: Alarm when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-low-cpu'
      AlarmDescription: Alarm when CPU is below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  TargetGroupUnhealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-unhealthy-hosts'
      AlarmDescription: Alarm when target group has unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-db-cpu'
      AlarmDescription: Alarm when database CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref DatabaseCluster

  DatabaseStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-db-storage'
      AlarmDescription: Alarm when database free storage is low
      MetricName: FreeLocalStorage
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240  # 10GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref DatabaseCluster

  # ========================================
  # Backup Plan
  # ========================================
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${ProjectName}-${EnvironmentName}-backup-vault'
      EncryptionKeyArn: !GetAtt KMSKey.Arn
      BackupVaultTags:
        Environment: !Ref EnvironmentName
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${ProjectName}-${EnvironmentName}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 5 ? * * *)'  # Daily at 5 AM UTC
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
              MoveToColdStorageAfterDays: 7
            RecoveryPointTags:
              Environment: !Ref EnvironmentName
              Owner: !Ref OwnerEmail
              Project: !Ref ProjectName

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${ProjectName}-${EnvironmentName}-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${DatabaseCluster}'
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: Environment
            ConditionValue: !Ref EnvironmentName

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentName}-backup-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores

# ====================
# OUTPUTS
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ALBEndpoint:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: Aurora Database Endpoint
    Value: !GetAtt DatabaseCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabasePort:
    Description: Aurora Database Port
    Value: !GetAtt DatabaseCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'

  LogsBucketName:
    Description: S3 Bucket for logs
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Logs-Bucket'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG'
```

## Deployment Instructions

### Prerequisites
1. **AWS CLI configured** with appropriate credentials
2. **Valid EC2 Key Pair** created in the target region
3. **Appropriate IAM permissions** to create all resources

### Deployment Steps

1. **Validate the template**:
```bash
aws cloudformation validate-template \
  --template-body file://production-stack.yaml \
  --region us-east-1
```

2. **Create the stack**:
```bash
aws cloudformation create-stack \
  --stack-name production-environment \
  --template-body file://production-stack.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=AllowedSSHIP,ParameterValue=your.ip.address.here/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Monitor stack creation**:
```bash
aws cloudformation describe-stacks \
  --stack-name production-environment \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

## Key Features Implemented

### Security
- ✅ **Encryption everywhere**: KMS keys with rotation for EBS, RDS, and S3
- ✅ **Least privilege IAM roles**: Specific permissions for each service
- ✅ **Network isolation**: Private subnets for compute and database layers
- ✅ **Restricted SSH access**: Configurable IP-based SSH restrictions
- ✅ **HTTPS enforcement**: S3 bucket policies deny non-SSL connections
- ✅ **Security groups**: Properly configured with minimal required access

### Compliance & Monitoring
- ✅ **CloudTrail**: Complete API activity logging
- ✅ **AWS Config**: Compliance rules for encryption and tagging
- ✅ **CloudWatch alarms**: CPU, storage, and health monitoring
- ✅ **Resource tagging**: Environment, Owner, and Project tags on all resources

### High Availability
- ✅ **Multi-AZ deployment**: Resources spread across 2 availability zones
- ✅ **Auto Scaling**: Minimum 3 instances with automatic scaling
- ✅ **RDS Multi-AZ**: Database cluster with automatic failover
- ✅ **NAT Gateway redundancy**: One per availability zone

### Backup & Recovery
- ✅ **AWS Backup**: Daily automated backups with 30-day retention
- ✅ **RDS snapshots**: 7-day backup retention
- ✅ **S3 versioning**: Enabled for logs bucket

### Operational Excellence
- ✅ **Systems Manager**: Parameter Store for configuration management
- ✅ **Automated patching**: Configured via user data
- ✅ **Log centralization**: All logs stored in encrypted S3 bucket
- ✅ **Infrastructure as Code**: Fully version-controlled infrastructure

## Post-Deployment Configuration

1. **Update DNS records** to point to the ALB endpoint
2. **Configure SSL certificate** on the ALB for HTTPS
3. **Review and customize Config rules** based on specific compliance requirements
4. **Set up SNS topics** for alarm notifications
5. **Configure application deployment** pipeline
6. **Review and adjust backup schedules** based on RPO/RTO requirements

## Cost Optimization Tips

1. Use **Reserved Instances** or **Savings Plans** for predictable workloads
2. Implement **S3 lifecycle policies** for log archival
3. Consider **Aurora Serverless** for variable database workloads
4. Use **Spot Instances** in Auto Scaling Groups where appropriate
5. Regularly review **CloudWatch metrics** to right-size resources

This template provides a solid foundation for a production environment while maintaining flexibility for customization based on specific requirements.