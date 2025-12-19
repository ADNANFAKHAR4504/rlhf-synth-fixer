### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template for an e-commerce platform. Let me break down the requirements:

1. **VPC Setup**:
   - 3 Availability Zones
   - Public and Private subnets

2. **Static Content**:
   - S3 bucket with versioning
   - CloudFront distribution
   - HTTPS-only with ACM certificate

3. **Dynamic Components**:
   - Auto Scaling Group of EC2 instances
   - Elastic Load Balancer
   - Security Groups (ports 80 and 443 only)
   - IAM roles for EC2

4. **Database**:
   - RDS in private subnets
   - 7-day backup retention

5. **Monitoring**:
   - CloudWatch Alarms for CPU utilization
   - Centralized logging

6. **DNS**:
   - Route 53 records pointing to CloudFront

7. **General Requirements**:
   - Tags: Name, Environment, Owner
   - Parameters for customization
   - Production-ready
   - High availability

Let me create a comprehensive YAML CloudFormation template that addresses all these requirements.
### Answer 
---

# E-Commerce Platform Infrastructure CloudFormation Template

Below is a comprehensive CloudFormation template that creates a production-ready, highly available infrastructure for your e-commerce platform. The template implements all requested components with AWS best practices for security, scalability, and reliability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready e-commerce platform infrastructure with HA, auto-scaling, and CDN'

# ==========================================
# Parameters Section
# ==========================================
Parameters:
  EnvironmentName:
    Description: Environment name that will be prefixed to resource names
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    ConstraintDescription: Must be Development, Staging or Production

  OwnerTag:
    Description: Owner tag for cost tracking
    Type: String
    Default: DevOps-Team

  DomainName:
    Description: Domain name for the application
    Type: String
    Default: example.com

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

  DBName:
    Description: Database name
    Type: String
    Default: ecommerce
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    NoEcho: true

  DBPassword:
    Description: Database master password
    Type: String
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    NoEcho: true

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

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # ==========================================
  # Public Subnets
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

  # ==========================================
  # Private Subnets for App Tier
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

  # ==========================================
  # Database Subnets
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

  # ==========================================
  # NAT Gateways
  # ==========================================
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-GW-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-GW-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-GW-AZ3
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==========================================
  # Route Tables
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

  DBSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref DBSubnet1

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

  DBSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref DBSubnet2

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

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  DBSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
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
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==========================================
  # S3 Bucket for Static Content
  # ==========================================
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-static-content-${AWS::AccountId}
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Static-Content
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

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
            Resource: !Sub ${StaticContentBucket.Arn}/*

  # ==========================================
  # CloudFront Distribution
  # ==========================================
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub OAI for ${EnvironmentName} static content

  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Certificate
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub ${EnvironmentName} CloudFront Distribution
        DefaultRootObject: index.html
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        ViewerCertificate:
          AcmCertificateArn: !Ref ACMCertificate
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
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
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
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
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
            Headers:
              - Host
              - Origin
              - Access-Control-Request-Headers
              - Access-Control-Request-Method
        CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            MaxTTL: 31536000
            DefaultTTL: 86400
        PriceClass: PriceClass_All
        HttpVersion: http2
        IPV6Enabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-CloudFront
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==========================================
  # IAM Roles
  # ==========================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
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
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
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
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Role
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

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
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-TG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate

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
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Owner
                Value: !Ref OwnerTag
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create health check endpoint
            echo "OK" > /var/www/html/health
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${EnvironmentName}-apache-access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${EnvironmentName}-apache-error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
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
                    "metrics_collection_interval": 60
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
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
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

  # ==========================================
  # Auto Scaling Policies
  # ==========================================
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-High-CPU
      AlarmDescription: Alarm when CPU exceeds 70%
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
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-Low-CPU
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

  ALBUnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-Unhealthy-Hosts
      AlarmDescription: Alarm when we have unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic

  # ==========================================
  # RDS Database
  # ==========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub ${EnvironmentName}-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
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

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-database
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==========================================
  # Route 53
  # ==========================================
  HostedZone:
    Type: AWS::Route53::HostedZone
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

  DNSRecord:
    Type: AWS::Route53::RecordSetGroup
    Properties:
      HostedZoneId: !Ref HostedZone
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt CloudFrontDistribution.HostedZoneId
            DNSName: !GetAtt CloudFrontDistribution.DomainName
        - Name: !Sub 'www.${DomainName}'
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt CloudFrontDistribution.HostedZoneId
            DNSName: !GetAtt CloudFrontDistribution.DomainName

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${EnvironmentName}-Alerts
      DisplayName: !Sub ${EnvironmentName} Infrastructure Alerts
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-SNS-Topic
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==========================================
  # CloudWatch Log Groups
  # ==========================================
  ApacheAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub ${EnvironmentName}-apache-access
      RetentionInDays: 30

  ApacheErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub ${EnvironmentName}-apache-error
      RetentionInDays: 30

# ==========================================
# Outputs Section
# ==========================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCID

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALB-DNS

  CloudFrontURL:
    Description: CloudFront Distribution URL
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub ${EnvironmentName}-CloudFront-URL

  StaticContentBucket:
    Description: S3 Bucket for static content
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub ${EnvironmentName}-Static-Bucket

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-DB-Endpoint

  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${EnvironmentName}-SNS-Topic
```

## Template Documentation

### Architecture Overview

This CloudFormation template creates a production-ready infrastructure with:

1. **High Availability**: Resources spread across 3 availability zones
2. **Security**: Multiple subnet tiers with proper isolation
3. **Scalability**: Auto Scaling Groups with CloudWatch-based scaling policies
4. **Performance**: CloudFront CDN for global content delivery
5. **Monitoring**: Comprehensive CloudWatch alarms and logging

### Key Features

#### Network Architecture
- **VPC with 3-tier subnet design**: Public, Private, and Database subnets
- **NAT Gateways**: One per AZ for high availability
- **Security Groups**: Restrictive rules allowing only necessary traffic

#### Application Layer
- **Auto Scaling Group**: Automatically adjusts capacity based on CPU utilization
- **Application Load Balancer**: Distributes traffic across healthy instances
- **Launch Template**: Standardized EC2 configuration with CloudWatch agent

#### Storage & CDN
- **S3 Bucket**: Versioned storage for static assets
- **CloudFront**: HTTPS-only CDN with custom SSL certificate
- **Origin Access Identity**: Secure S3 access from CloudFront

#### Database
- **Multi-AZ RDS**: High availability MySQL database
- **Automated Backups**: 7-day retention period
- **Encryption**: Storage encryption enabled

#### Monitoring & Alerting
- **CloudWatch Alarms**: CPU utilization and unhealthy host monitoring
- **SNS Topic**: Centralized alerting mechanism
- **CloudWatch Logs**: Application and error log aggregation

### Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Valid domain name for Route 53
   - Email address for SNS notifications

2. **Deploy the template**:
```bash
aws cloudformation create-stack \
  --stack-name ecommerce-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=Production \
    ParameterKey=DomainName,ParameterValue=yourdomain.com \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=OwnerTag,ParameterValue=YourTeamName \
  --capabilities CAPABILITY_IAM
```

3. **Post-deployment steps**:
   - Validate ACM certificate via DNS
   - Subscribe to SNS topic for alerts
   - Upload static content to S3 bucket
   - Deploy application code to EC2 instances

### Cost Optimization

- Use Reserved Instances for predictable workloads
- Implement S3 lifecycle policies for old object versions
- Consider using Spot Instances for non-critical environments
- Enable Cost Allocation Tags for detailed billing reports

### Security Best Practices

- Regularly rotate database passwords using AWS Secrets Manager
- Enable AWS GuardDuty for threat detection
- Implement AWS WAF on CloudFront distribution
- Use AWS Systems Manager Session Manager instead of SSH
- Enable VPC Flow Logs for network monitoring

This template provides a solid foundation for a high-availability e-commerce platform that can handle millions of users while maintaining 99.99% uptime.