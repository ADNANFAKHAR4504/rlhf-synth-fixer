```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready e-commerce platform infrastructure with HA, auto-scaling, and CDN - Multi-region capable'

# ==========================================
# Metadata Section
# ==========================================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentName
          - OwnerTag
      - Label:
          default: "Domain Configuration"
        Parameters:
          - DomainName
          - CreateNewHostedZone
          - ExistingHostedZoneId
      - Label:
          default: "Compute Configuration"
        Parameters:
          - InstanceType
          - MinSize
          - MaxSize
          - DesiredCapacity
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBName
          - DBUsername
          - DBStorageSize
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - AlertEmail
          - EnableDetailedMonitoring

# ==========================================
# Parameters Section
# ==========================================
Parameters:
  EnvironmentName:
    Description: Environment name that will be prefixed to resource names
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    ConstraintDescription: Must be development, staging or production

  OwnerTag:
    Description: Owner tag for cost tracking and management
    Type: String
    Default: DevOps-Team
    MinLength: 1
    MaxLength: 255

  DomainName:
    Description: Domain name for the application (must be owned by you)
    Type: String
    Default: 'example.com'
    MinLength: 1
    MaxLength: 253
    AllowedPattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$'
    ConstraintDescription: Must be a valid domain name

  CreateNewHostedZone:
    Description: Create new Route53 hosted zone (false if zone already exists)
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'

  ExistingHostedZoneId:
    Description: Existing Route53 hosted zone ID (required when CreateNewHostedZone is false, e.g., Z1234567890ABC)
    Type: String
    Default: ''
    AllowedPattern: '^$|^Z[A-Z0-9]+$'
    ConstraintDescription: Must be a valid Route53 hosted zone ID or empty if creating new zone

  CreateCertificates:
    Description: Create ACM certificates (set to false for testing with dummy domains)
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'

  InstanceType:
    Description: EC2 instance type for web servers
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
      - m5.2xlarge
    ConstraintDescription: Must be a valid EC2 instance type

  DBInstanceClass:
    Description: Database instance type
    Type: String
    Default: db.t3.medium
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.r5.large
      - db.r5.xlarge
      - db.r5.2xlarge

  DBStorageSize:
    Description: Database storage size in GB
    Type: Number
    Default: 100
    MinValue: 20
    MaxValue: 1024
    ConstraintDescription: Must be between 20 and 1024 GB

  DBName:
    Description: Database name
    Type: String
    Default: ecommerce
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    NoEcho: true
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  MinSize:
    Description: Minimum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Description: Maximum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 6
    MinValue: 1
    MaxValue: 20

  DesiredCapacity:
    Description: Desired number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 3
    MinValue: 1
    MaxValue: 20

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID from SSM Parameter Store

  AlertEmail:
    Description: Email address for CloudWatch alarm notifications
    Type: String
    Default: 'alerts@example.com'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid email address

  EnableDetailedMonitoring:
    Description: Enable detailed CloudWatch monitoring for EC2 instances
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'

# ==========================================
# Conditions Section
# ==========================================
Conditions:
  CreateHostedZone: !Equals [!Ref CreateNewHostedZone, 'true']
  UseDetailedMonitoring: !Equals [!Ref EnableDetailedMonitoring, 'true']
  IsProduction: !Equals [!Ref EnvironmentName, 'production']
  IsUsEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']
  ShouldCreateCertificates: !Equals [!Ref CreateCertificates, 'true']
  HasHostedZone: !Or
    - !Condition CreateHostedZone
    - !Not [!Equals [!Ref ExistingHostedZoneId, '']]

# ==========================================
# Mappings Section
# ==========================================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PublicSubnet3:
      CIDR: 10.0.3.0/24
    PrivateSubnet1:
      CIDR: 10.0.11.0/24
    PrivateSubnet2:
      CIDR: 10.0.12.0/24
    PrivateSubnet3:
      CIDR: 10.0.13.0/24
    DBSubnet1:
      CIDR: 10.0.21.0/24
    DBSubnet2:
      CIDR: 10.0.22.0/24
    DBSubnet3:
      CIDR: 10.0.23.0/24

# ==========================================
# Resources Section
# ==========================================
Resources:

  # ==========================================
  # VPC Configuration
  # ==========================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # ==========================================
  # Public Subnets (for Load Balancer and NAT Gateways)
  # ==========================================
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet3, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Private Subnets for Application Tier
  # ==========================================
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet3, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Database Subnets (Isolated)
  # ==========================================
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DBSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DBSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DBSubnet3, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Subnet-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # NAT Gateways and EIPs removed - LocalStack EIP fallback does not provide

  # ==========================================
  # Route Tables and Associations
  # ==========================================
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Routes
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  # Private Route Tables for Application Tier
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private routes via NAT Gateway removed - NAT Gateways not supported in LocalStack

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private routes via NAT Gateway removed - NAT Gateways not supported in LocalStack

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private routes via NAT Gateway removed - NAT Gateways not supported in LocalStack

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Database Route Table (Isolated - No Internet Access)
  DBRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Routes
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DBRouteTable
      SubnetId: !Ref DBSubnet1

  DBSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DBRouteTable
      SubnetId: !Ref DBSubnet2

  DBSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DBRouteTable
      SubnetId: !Ref DBSubnet3

  # ==========================================
  # Security Groups
  # ==========================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
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
          Value: !Sub ${EnvironmentName}-ALB-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers in Auto Scaling group
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL/Aurora access from web servers
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # S3 Bucket for Static Content with Versioning
  # ==========================================
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-static-content-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
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
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionOldVersionsToIA
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 90
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
              - HEAD
            AllowedOrigins:
              - !Sub 'https://${DomainName}'
              - !Sub 'https://www.${DomainName}'
            MaxAge: 3600
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Static-Content
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  StaticContentBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticContentBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
            Resource: !Sub ${StaticContentBucket.Arn}/*

  # ==========================================
  # CloudFront Distribution with HTTPS Enforcement
  # ==========================================
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub OAI for ${EnvironmentName} static content

  # ACM Certificate for CloudFront (must be in us-east-1)
  # Note: Only created if CreateCertificates is true (skip for dummy domains)
  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: ShouldCreateCertificates
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
        - !Sub 'www.${DomainName}'
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !If [CreateHostedZone, !Ref HostedZone, !Ref ExistingHostedZoneId]
        - DomainName: !Sub '*.${DomainName}'
          HostedZoneId: !If [CreateHostedZone, !Ref HostedZone, !Ref ExistingHostedZoneId]
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Certificate
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ALB Certificate (region-specific)
  # Note: Only created if CreateCertificates is true (skip for dummy domains)
  ALBCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: ShouldCreateCertificates
    Properties:
      DomainName: !Sub 'api.${DomainName}'
      SubjectAlternativeNames:
        - !Sub 'app.${DomainName}'
      DomainValidationOptions:
        - DomainName: !Sub 'api.${DomainName}'
          HostedZoneId: !If [CreateHostedZone, !Ref HostedZone, !Ref ExistingHostedZoneId]
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-Certificate
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub ${EnvironmentName} CloudFront Distribution for E-commerce Platform
        DefaultRootObject: index.html
        Aliases: !If
          - ShouldCreateCertificates
          - - !Ref DomainName
            - !Sub 'www.${DomainName}'
          - !Ref 'AWS::NoValue'
        ViewerCertificate: !If
          - ShouldCreateCertificates
          - AcmCertificateArn: !Ref ACMCertificate
            MinimumProtocolVersion: TLSv1.2_2021
            SslSupportMethod: sni-only
          - CloudFrontDefaultCertificate: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticContentBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only  # ALB will handle HTTPS termination
              OriginSSLProtocols:
                - TLSv1.2
              OriginReadTimeout: 30
              OriginKeepaliveTimeout: 5
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
            Headers:
              - Host
              - Origin
              - Referer
              - Accept
              - Authorization
              - CloudFront-Forwarded-Proto
              - CloudFront-Is-Mobile-Viewer
              - CloudFront-Is-Desktop-Viewer
          MinTTL: 0
          DefaultTTL: 0
          MaxTTL: 0
        CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
              - OPTIONS
            CachedMethods:
              - GET
              - HEAD
              - OPTIONS
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            MaxTTL: 31536000
            DefaultTTL: 604800
          - PathPattern: /api/*
            TargetOriginId: ALBOrigin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
              - OPTIONS
              - PUT
              - POST
              - PATCH
              - DELETE
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: true
              Headers:
                - '*'
              Cookies:
                Forward: all
            MinTTL: 0
            DefaultTTL: 0
            MaxTTL: 0
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
        PriceClass: !If [IsProduction, PriceClass_All, PriceClass_100]
        HttpVersion: http2and3
        IPV6Enabled: true
        WebACLId: !If [IsUsEast1, !GetAtt WAFWebACL.Arn, !Ref 'AWS::NoValue']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-CloudFront
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # WAF for CloudFront Protection
  # ==========================================
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: IsUsEast1
    Properties:
      Name: !Sub ${EnvironmentName}-WebACL
      Scope: CLOUDFRONT
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
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub ${EnvironmentName}-WebACL
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WAF
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-Role-${AWS::Region}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:ListBucket
                  - s3:ListBucketVersions
                Resource:
                  - !GetAtt StaticContentBucket.Arn
                  - !Sub ${StaticContentBucket.Arn}/*
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${EnvironmentName}-*'
        # NOTE: SecretsManagerAccess policy removed - LocalStack does not support
        # RDS ManageMasterUserPassword and MasterUserSecret.SecretArn attribute
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Role
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ${EnvironmentName}-EC2-Profile-${AWS::Region}
      Roles:
        - !Ref EC2Role

  # ==========================================
  # Application Load Balancer
  # ==========================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-ALB
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: deletion_protection.enabled
          Value: 'false'
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBAccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-alb-logs-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-Logs
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowALBLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ALBAccessLogsBucket.Arn
          - Sid: AllowALBLogDelivery
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ALBAccessLogsBucket.Arn}/alb-logs/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-TG
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
        HttpCode: 200-299
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-TG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions: !If
        - ShouldCreateCertificates
        - - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: '443'
              StatusCode: HTTP_301
        - - Type: forward
            TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: ShouldCreateCertificates
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ALBCertificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # ==========================================
  # Auto Scaling Configuration
  # ==========================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        Monitoring:
          Enabled: !Ref EnableDetailedMonitoring
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerTag
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer-Volume
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerTag
              - Key: iac-rlhf-amazon
                Value: 'true'
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            yum update -y
            
            # Install required packages
            yum install -y httpd mysql jq aws-cli
            
            # Start and enable Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Create health check endpoint
            echo "OK" > /var/www/html/health
            
            # Configure Apache for the application
            cat > /var/www/html/index.html <<EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>${EnvironmentName} - E-commerce Platform</title>
            </head>
            <body>
                <h1>Welcome to ${EnvironmentName} Environment</h1>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            </body>
            </html>
            EOF
            
            # Install and configure CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "root"
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${EnvironmentName}-apache-access",
                        "log_stream_name": "{instance_id}",
                        "retention_in_days": 30
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${EnvironmentName}-apache-error",
                        "log_stream_name": "{instance_id}",
                        "retention_in_days": 30
                      },
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EnvironmentName}-system",
                        "log_stream_name": "{instance_id}",
                        "retention_in_days": 7
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "${EnvironmentName}/Application",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {
                        "name": "cpu_usage_idle",
                        "rename": "CPU_USAGE_IDLE",
                        "unit": "Percent"
                      },
                      "cpu_usage_iowait"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": false
                  },
                  "disk": {
                    "measurement": [
                      {
                        "name": "used_percent",
                        "rename": "DISK_USED_PERCENT",
                        "unit": "Percent"
                      },
                      "disk_free"
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      {
                        "name": "mem_used_percent",
                        "rename": "MEM_USED_PERCENT",
                        "unit": "Percent"
                      },
                      "mem_available"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "netstat": {
                    "measurement": [
                      {
                        "name": "tcp_established",
                        "rename": "TCP_ESTABLISHED",
                        "unit": "Count"
                      },
                      {
                        "name": "tcp_time_wait",
                        "rename": "TCP_TIME_WAIT",
                        "unit": "Count"
                      }
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
                -s
            
            # Secrets Manager retrieval commented out - LocalStack does not support RDS MasterUserSecret
            # DB_SECRET_ARN="${DBPasswordSecret}"
            # DB_SECRET=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_ARN --region ${AWS::Region} --query SecretString --output text)
            # DB_PASSWORD=$(echo $DB_SECRET | jq -r .password)
            DB_PASSWORD="localstack-placeholder"
            
            # Configure application environment variables
            cat > /etc/environment <<EOF
            DB_HOST="${RDSDatabase.Endpoint.Address}"
            DB_NAME="${DBName}"
            DB_USER="${DBUsername}"
            DB_PASSWORD=$DB_PASSWORD
            S3_BUCKET="${StaticContentBucket}"
            ENVIRONMENT="${EnvironmentName}"
            REGION="${AWS::Region}"
            EOF
            
            # Signal success to CloudFormation
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    CreationPolicy:
      ResourceSignal:
        Count: !Ref DesiredCapacity
        Timeout: PT15M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: true
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: $Latest
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupInServiceInstances
            - GroupPendingInstances
            - GroupTerminatingInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true

  # ==========================================
  # Auto Scaling Policies
  # ==========================================
  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 50

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-High-CPU
      AlarmDescription: Alarm when average CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-Low-CPU
      AlarmDescription: Alarm when average CPU is below 25%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  ALBUnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-Unhealthy-Hosts
      AlarmDescription: Alarm when we have any unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  ALBTargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-High-Response-Time
      AlarmDescription: Alarm when target response time is too high
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  RDSHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-RDS-High-CPU
      AlarmDescription: Alarm when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  RDSLowStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-RDS-Low-Storage
      AlarmDescription: Alarm when RDS free storage is below 10GB
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240  # 10GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  # ==========================================
  # RDS Database with Automated Backups
  # ==========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database in private subnets
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
        - !Ref DBSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-SubnetGroup
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${EnvironmentName}/rds/db-password
      Description: RDS database master password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        ExcludePunctuation: false

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DependsOn: DBPasswordSecret
    Properties:
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.43'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBStorageSize
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${EnvironmentName}/rds/db-password:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      # MultiAZ disabled for LocalStack - causes timeout issues
      MultiAZ: false
      # EnableCloudwatchLogsExports removed for LocalStack - causes timeout issues
      CopyTagsToSnapshot: true
      # MonitoringInterval disabled for LocalStack - causes timeout issues
      MonitoringInterval: 0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Condition: UseDetailedMonitoring
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-RDS-Monitoring-Role
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Route 53 DNS Management
  # ==========================================
  HostedZone:
    Type: AWS::Route53::HostedZone
    Condition: CreateHostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub Hosted zone for ${EnvironmentName} environment
      HostedZoneTags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-HostedZone
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  DNSRecord:
    Type: AWS::Route53::RecordSetGroup
    Condition: HasHostedZone
    Properties:
      HostedZoneId: !If [CreateHostedZone, !Ref HostedZone, !Ref ExistingHostedZoneId]
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          AliasTarget:
            HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
            DNSName: !GetAtt CloudFrontDistribution.DomainName
            EvaluateTargetHealth: false
        - Name: !Sub 'www.${DomainName}'
          Type: A
          AliasTarget:
            HostedZoneId: Z2FDTNDATAQYW2
            DNSName: !GetAtt CloudFrontDistribution.DomainName
            EvaluateTargetHealth: false
        - Name: !Sub 'api.${DomainName}'
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
            DNSName: !GetAtt ApplicationLoadBalancer.DNSName
            EvaluateTargetHealth: true

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${EnvironmentName}-Alerts
      DisplayName: !Sub ${EnvironmentName} Infrastructure Alerts
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-SNS-Topic
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # CloudWatch Log Groups
  # ==========================================
  ApacheAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub ${EnvironmentName}-apache-access
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Apache-Access-Logs
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  ApacheErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub ${EnvironmentName}-apache-error
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Apache-Error-Logs
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

  SystemLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub ${EnvironmentName}-system
      RetentionInDays: 7
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-System-Logs
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: iac-rlhf-amazon
          Value: 'true'

# ==========================================
# Outputs Section - Comprehensive Stack Information
# ==========================================
Outputs:
  VPCId:
    Description: VPC ID for the infrastructure
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCID

  VPCCidr:
    Description: VPC CIDR block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub ${EnvironmentName}-VPC-CIDR

  PublicSubnetIds:
    Description: List of public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub ${EnvironmentName}-PublicSubnets

  PrivateSubnetIds:
    Description: List of private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub ${EnvironmentName}-PrivateSubnets

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALB-DNS

  ALBArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub ${EnvironmentName}-ALB-ARN

  ALBTargetGroupArn:
    Description: Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub ${EnvironmentName}-TG-ARN

  CloudFrontDistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub ${EnvironmentName}-CloudFront-ID

  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub ${EnvironmentName}-CloudFront-Domain

  WebsiteURL:
    Description: Website URL through CloudFront
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub ${EnvironmentName}-Website-URL

  StaticContentBucketName:
    Description: S3 Bucket name for static content
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub ${EnvironmentName}-Static-Bucket

  StaticContentBucketArn:
    Description: S3 Bucket ARN for static content
    Value: !GetAtt StaticContentBucket.Arn
    Export:
      Name: !Sub ${EnvironmentName}-Static-Bucket-ARN

  ALBAccessLogsBucketName:
    Description: S3 Bucket for ALB access logs
    Value: !Ref ALBAccessLogsBucket
    Export:
      Name: !Sub ${EnvironmentName}-ALB-Logs-Bucket

  DatabaseEndpoint:
    Description: RDS Database Endpoint Address
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-DB-Endpoint

  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub ${EnvironmentName}-DB-Port

  # NOTE: DatabaseSecretArn output removed - LocalStack does not support RDS MasterUserSecret.SecretArn
  # DatabaseSecretArn:
  #   Description: ARN of the database password secret (RDS-managed)
  #   Value: !GetAtt RDSDatabase.MasterUserSecret.SecretArn
  #   Export:
  #     Name: !Sub ${EnvironmentName}-DB-Secret-ARN

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${EnvironmentName}-ASG-Name

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub ${EnvironmentName}-LaunchTemplate-ID

  LaunchTemplateVersion:
    Description: Launch Template Latest Version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub ${EnvironmentName}-LaunchTemplate-Version

  EC2RoleArn:
    Description: EC2 IAM Role ARN
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub ${EnvironmentName}-EC2-Role-ARN

  EC2InstanceProfileArn:
    Description: EC2 Instance Profile ARN
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub ${EnvironmentName}-EC2-Profile-ARN

  SNSTopicArn:
    Description: SNS Topic ARN for infrastructure alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${EnvironmentName}-SNS-Topic-ARN

  ApacheAccessLogGroupName:
    Description: CloudWatch Log Group for Apache access logs
    Value: !Ref ApacheAccessLogGroup
    Export:
      Name: !Sub ${EnvironmentName}-Apache-Access-LogGroup

  ApacheErrorLogGroupName:
    Description: CloudWatch Log Group for Apache error logs
    Value: !Ref ApacheErrorLogGroup
    Export:
      Name: !Sub ${EnvironmentName}-Apache-Error-LogGroup

  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-ALB-SG

  WebServerSecurityGroupId:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-WebServer-SG

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-Database-SG

  WAFWebACLArn:
    Description: WAF WebACL ARN for CloudFront protection (only created in us-east-1)
    Condition: IsUsEast1
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub ${EnvironmentName}-WAF-WebACL-ARN

  ACMCertificateArn:
    Condition: ShouldCreateCertificates
    Description: ACM Certificate ARN for CloudFront
    Value: !Ref ACMCertificate
    Export:
      Name: !Sub ${EnvironmentName}-ACM-Certificate-ARN

  ALBCertificateArn:
    Condition: ShouldCreateCertificates
    Description: ACM Certificate ARN for ALB
    Value: !Ref ALBCertificate
    Export:
      Name: !Sub ${EnvironmentName}-ALB-Certificate-ARN

  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref 'AWS::StackName'

  StackId:
    Description: CloudFormation Stack ID
    Value: !Ref 'AWS::StackId'

  Region:
    Description: AWS Region where stack is deployed
    Value: !Ref 'AWS::Region'

  AccountId:
    Description: AWS Account ID
    Value: !Ref 'AWS::AccountId'
```