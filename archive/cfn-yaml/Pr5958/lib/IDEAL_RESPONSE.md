```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PayFlow Solutions - Highly Available Fintech Infrastructure with Blue-Green Deployment Capabilities'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - ApplicationVersion
      - Label:
          default: "Network Configuration"
        Parameters:
          - VPCCIDR
          - DomainName
          - CreateCertificate
          - ExistingCertificateArn
          - CertificateValidationMethod
      - Label:
          default: "Compute Configuration"
        Parameters:
          - KeyPairName
          - InstanceTypeSmall
          - InstanceTypeMedium
          - InstanceTypeLarge
          - MinCapacityBlue
          - MaxCapacityBlue
          - DesiredCapacityBlue
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBMasterUsername
          - DBInstanceClassWriter
          - DBInstanceClassReader
          - DBBackupRetentionPeriod
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - PagerDutyEmail
          - ErrorRateThreshold
          - LatencyThreshold
          - DBConnectionThreshold
      - Label:
          default: "Deployment Configuration"
        Parameters:
          - BlueWeight
          - GreenWeight
          - ProductionWeight
          - CanaryWeight

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - production
      - staging
      - dev
    Description: Environment name for resource tagging and naming
  
  ApplicationVersion:
    Type: String
    Default: "1.0.0"
    Description: Application version for deployment tracking
  
  VPCCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  
  DomainName:
    Type: String
    Default: ""
    Description: Primary domain name for the application
  
  CreateCertificate:
    Type: String
    Default: "false"
    AllowedValues:
      - "true"
      - "false"
    Description: Whether to create a new ACM certificate 
  
  ExistingCertificateArn:
    Type: String
    Default: ""
    Description: ARN of an existing ACM certificate 
  
  CertificateValidationMethod:
    Type: String
    Default: EMAIL
    AllowedValues:
      - DNS
      - EMAIL
    Description: Certificate validation method
  
  KeyPairName:
    Type: String
    Default: ""
    Description: EC2 Key Pair name for SSH access
  
  InstanceTypeSmall:
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.medium
      - t3a.medium
      - m5.large
    Description: Small instance type for mixed instance policy
  
  InstanceTypeMedium:
    Type: String
    Default: t3.large
    AllowedValues:
      - t3.large
      - t3a.large
      - m5.large
    Description: Medium instance type for mixed instance policy
  
  InstanceTypeLarge:
    Type: String
    Default: m5.large
    AllowedValues:
      - m5.large
      - m5a.large
      - m5n.large
    Description: Large instance type for mixed instance policy
  
  MinCapacityBlue:
    Type: Number
    Default: 3
    MinValue: 3
    Description: Minimum capacity for Blue Auto Scaling Group
  
  MaxCapacityBlue:
    Type: Number
    Default: 15
    MinValue: 3
    MaxValue: 50
    Description: Maximum capacity for Blue Auto Scaling Group
  
  DesiredCapacityBlue:
    Type: Number
    Default: 6
    MinValue: 3
    Description: Desired capacity for Blue Auto Scaling Group
  
  DBMasterUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
    Description: Database master username
  
  DBInstanceClassWriter:
    Type: String
    Default: db.r6g.xlarge
    AllowedValues:
      - db.r6g.large
      - db.r6g.xlarge
      - db.r6g.2xlarge
    Description: Instance class for Aurora writer instance
  
  DBInstanceClassReader:
    Type: String
    Default: db.r6g.large
    AllowedValues:
      - db.r6g.large
      - db.r6g.xlarge
    Description: Instance class for Aurora reader instances
  
  DBBackupRetentionPeriod:
    Type: Number
    Default: 7
    MinValue: 1
    MaxValue: 35
    Description: Database backup retention period in days
  
  PagerDutyEmail:
    Type: String
    Default: alerts@example.com
    Description: PagerDuty integration email for critical alerts
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: 'Must be a valid email address'
  
  ErrorRateThreshold:
    Type: Number
    Default: 1
    MinValue: 0.5
    MaxValue: 5
    Description: Error rate threshold percentage for alarms
  
  LatencyThreshold:
    Type: Number
    Default: 500
    MinValue: 100
    MaxValue: 2000
    Description: P99 latency threshold in milliseconds
  
  DBConnectionThreshold:
    Type: Number
    Default: 80
    MinValue: 50
    MaxValue: 95
    Description: Database connection threshold percentage
  
  BlueWeight:
    Type: Number
    Default: 100
    MinValue: 0
    MaxValue: 100
    Description: Traffic weight for Blue target group (0-100)
  
  GreenWeight:
    Type: Number
    Default: 0
    MinValue: 0
    MaxValue: 100
    Description: Traffic weight for Green target group (0-100)
  
  ProductionWeight:
    Type: Number
    Default: 90
    MinValue: 0
    MaxValue: 100
    Description: Route 53 traffic weight for production (0-100)
  
  CanaryWeight:
    Type: Number
    Default: 10
    MinValue: 0
    MaxValue: 100
    Description: Route 53 traffic weight for canary (0-100)

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, ""]]
  CreateNewCertificate: !And
    - !Equals [!Ref CreateCertificate, "true"]
    - !Not [!Equals [!Ref DomainName, ""]]
  UseExistingCertificate: !And
    - !Equals [!Ref CreateCertificate, "false"]
    - !Not [!Equals [!Ref ExistingCertificateArn, ""]]
  HasSSLCertificate: !Or
    - !Condition CreateNewCertificate
    - !Condition UseExistingCertificate
  HasCustomDomain: !Not [!Equals [!Ref DomainName, ""]]

Resources:
  # =====================================
  # VPC and Networking Infrastructure
  # =====================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: "true"

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-IGW'
        - Key: iac-rlhf-amazon
          Value: "true"

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Public-Subnet-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Public-Subnet-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Public-Subnet-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  # Private Subnets for EC2 (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Private-Subnet-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Private-Subnet-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Private-Subnet-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  # Database Subnets (3 AZs)
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [6, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-Subnet-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [7, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-Subnet-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  DBSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [8, !Cidr [!Ref VPCCIDR, 24, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-Subnet-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  # NAT Gateways for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-EIP-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-EIP-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-EIP-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-NAT-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Public-Routes'
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Private-Routes-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
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
          Value: !Sub 'PF-${Environment}-Private-Routes-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Private-Routes-3'
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # =====================================
  # Security Groups
  # =====================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer - allows HTTP/HTTPS traffic
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from internet
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-ALB-SG'
        - Key: iac-rlhf-amazon
          Value: "true"

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances - allows traffic only from ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS traffic from ALB
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow webhook traffic from ALB
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-EC2-SG'
        - Key: iac-rlhf-amazon
          Value: "true"

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Aurora cluster - allows PostgreSQL traffic only from EC2
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow PostgreSQL traffic from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-RDS-SG'
        - Key: iac-rlhf-amazon
          Value: "true"

  # =====================================
  # S3 Bucket for ALB Logs
  # =====================================
  
  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'pf-alb-logs-${AWS::AccountId}-${Environment}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
        - Key: Name
          Value: !Sub 'PF-${Environment}-ALB-Logs'
        - Key: iac-rlhf-amazon
          Value: "true"

  ALBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowALBLogDelivery
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub '${ALBLogsBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          - Sid: AllowALBAccessLogsCheck
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action:
              - s3:GetBucketAcl
              - s3:ListBucket
            Resource: !GetAtt ALBLogsBucket.Arn

  # =====================================
  # Application Load Balancer
  # =====================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: ALBLogsBucketPolicy
    Properties:
      Name: !Sub 'PF-${Environment}-ALB-${AWS::Region}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBLogsBucket
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-ALB'
        - Key: iac-rlhf-amazon
          Value: "true"

  # Target Groups for Blue-Green Deployment
  BlueTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PF-${Environment}-BTG-${AWS::Region}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health/deep
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Blue-TG'
        - Key: Deployment
          Value: Blue
        - Key: Version
          Value: !Ref ApplicationVersion
        - Key: iac-rlhf-amazon
          Value: "true"

  GreenTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PF-${Environment}-GTG-${AWS::Region}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health/deep
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Green-TG'
        - Key: Deployment
          Value: Green
        - Key: Version
          Value: !Ref ApplicationVersion
        - Key: iac-rlhf-amazon
          Value: "true"

  WebhookTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PF-${Environment}-WTG-${AWS::Region}'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Webhook-TG'
        - Key: iac-rlhf-amazon
          Value: "true"

  # =====================================
  # ACM Certificate (Conditional)
  # =====================================
  
  ALBCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: CreateNewCertificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: !Ref CertificateValidationMethod
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Certificate'
        - Key: iac-rlhf-amazon
          Value: "true"

  # ALB Listeners
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: !If
            - HasSSLCertificate
            - redirect
            - forward
          RedirectConfig: !If
            - HasSSLCertificate
            - Protocol: HTTPS
              Port: 443
              StatusCode: HTTP_301
            - !Ref AWS::NoValue
          ForwardConfig: !If
            - HasSSLCertificate
            - !Ref AWS::NoValue
            - TargetGroups:
                - TargetGroupArn: !Ref BlueTargetGroup
                  Weight: !Ref BlueWeight
                - TargetGroupArn: !Ref GreenTargetGroup
                  Weight: !Ref GreenWeight
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          ForwardConfig:
            TargetGroups:
              - TargetGroupArn: !Ref BlueTargetGroup
                Weight: !Ref BlueWeight
              - TargetGroupArn: !Ref GreenTargetGroup
                Weight: !Ref GreenWeight
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !If
            - CreateNewCertificate
            - !Ref ALBCertificate
            - !Ref ExistingCertificateArn

  # Listener Rules for Path-Based Routing (HTTP)
  APIListenerRuleHTTP:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          ForwardConfig:
            TargetGroups:
              - TargetGroupArn: !Ref BlueTargetGroup
                Weight: !Ref BlueWeight
              - TargetGroupArn: !Ref GreenTargetGroup
                Weight: !Ref GreenWeight
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /api/*
      ListenerArn: !Ref HTTPListener
      Priority: 10

  WebhookListenerRuleHTTP:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref WebhookTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /webhooks/*
      ListenerArn: !Ref HTTPListener
      Priority: 20

  # Listener Rules for Path-Based Routing (HTTPS)
  APIListenerRuleHTTPS:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasSSLCertificate
    Properties:
      Actions:
        - Type: forward
          ForwardConfig:
            TargetGroups:
              - TargetGroupArn: !Ref BlueTargetGroup
                Weight: !Ref BlueWeight
              - TargetGroupArn: !Ref GreenTargetGroup
                Weight: !Ref GreenWeight
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /api/*
      ListenerArn: !Ref HTTPSListener
      Priority: 10

  WebhookListenerRuleHTTPS:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasSSLCertificate
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref WebhookTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /webhooks/*
      ListenerArn: !Ref HTTPSListener
      Priority: 20

  # =====================================
  # IAM Roles and Instance Profiles
  # =====================================
  
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'PF-${Environment}-EC2-Role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParameterHistory
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/pf/${Environment}/*/*'
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                  - secretsmanager:DescribeSecret
                Resource: !Ref DatabaseSecret
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt DatabaseKMSKey.Arn
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-EC2-Role-${AWS::Region}'
        - Key: iac-rlhf-amazon
          Value: "true"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'PF-${Environment}-EC2-Profile-${AWS::Region}'
      Roles:
        - !Ref EC2Role

  # =====================================
  # Launch Templates
  # =====================================
  
  BlueLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PF-${Environment}-Blue-LT-${AWS::Region}'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id}}'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !If
          - HasKeyPair
          - !Ref KeyPairName
          - !Ref 'AWS::NoValue'
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/sda1
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Blue-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Deployment
                Value: Blue
              - Key: Version
                Value: !Ref ApplicationVersion
              - Key: iac-rlhf-amazon
                Value: "true"
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Blue-Volume'
              - Key: iac-rlhf-amazon
                Value: "true"
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install application dependencies
            apt-get install -y python3-pip nginx awscli postgresql-client
            pip3 install flask requests boto3 psycopg2-binary
            
            # Create API application
            mkdir -p /opt/api
            cat > /opt/api/app.py <<'EOF'
            from flask import Flask, request, jsonify
            import json
            import os
            import boto3
            from datetime import datetime
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            app = Flask(__name__)
            
            # AWS clients
            ssm = boto3.client('ssm', region_name='${AWS::Region}')
            secrets = boto3.client('secretsmanager', region_name='${AWS::Region}')
            cloudwatch = boto3.client('cloudwatch', region_name='${AWS::Region}')
            ec2 = boto3.client('ec2', region_name='${AWS::Region}')
            
            # Get instance metadata
            instance_id = os.popen('ec2-metadata --instance-id | cut -d " " -f 2').read().strip()
            az = os.popen('ec2-metadata --availability-zone | cut -d " " -f 2').read().strip()
            
            @app.route('/', methods=['GET'])
            def root():
                return 'OK', 200
            
            @app.route('/health/deep', methods=['GET'])
            def health_deep():
                return 'Healthy - Blue Deployment - Version ${ApplicationVersion}', 200
            
            @app.route('/health/status', methods=['GET']) 
            def health_status():
                return 'OK', 200
            
            @app.route('/api/v1/health', methods=['GET'])
            def api_health():
                response = {
                    'status': 'healthy',
                    'deployment': 'Blue',
                    'version': '${ApplicationVersion}',
                    'instance_id': instance_id,
                    'availability_zone': az
                }
                return jsonify(response), 200, {'x-deployment': 'blue', 'x-az': az}
            
            @app.route('/api/v1/transactions', methods=['GET', 'POST'])
            def transactions():
                if request.method == 'POST':
                    data = request.get_json()
                    if data.get('amount', 0) < 0:
                        return jsonify({'error': 'Invalid amount'}), 400
                    return jsonify(data), 201
                else:
                    return jsonify([]), 200
            
            @app.route('/api/v1/transactions/<transaction_id>', methods=['GET'])
            def get_transaction(transaction_id):
                return jsonify({
                    'transactionId': transaction_id,
                    'amount': 1000,
                    'status': 'completed'
                }), 200
            
            @app.route('/api/v1/transactions/latest', methods=['GET'])
            def latest_transactions():
                return jsonify([]), 200
            
            @app.route('/api/v1/az-info', methods=['GET'])
            def az_info():
                return jsonify({'availabilityZone': az}), 200, {'x-az': az}
            
            @app.route('/api/v1/trigger-error-500', methods=['GET'])
            def trigger_error():
                return 'Internal Server Error', 500
            
            @app.route('/api/v1/webhooks/status/<transaction_id>', methods=['GET'])
            def webhook_status(transaction_id):
                return jsonify({'delivered': True}), 200
            
            if __name__ == '__main__':
                app.run(host='0.0.0.0', port=8000)
            EOF
            
            # Configure nginx for routing
            cat > /etc/nginx/sites-available/default <<EOF
            server {
                listen 80;
                
                location /health/deep {
                    proxy_pass http://localhost:8000;
                    proxy_set_header Host \$host;
                }
                
                location /health/status {
                    proxy_pass http://localhost:8000;
                    proxy_set_header Host \$host;
                }
                
                location /api/ {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                    proxy_connect_timeout 30s;
                    proxy_send_timeout 30s;
                    proxy_read_timeout 30s;
                }
                
                location / {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                }
            }
            EOF
            
            # Create systemd service for API
            cat > /etc/systemd/system/api.service <<EOF
            [Unit]
            Description=PayFlow API Service
            After=network.target
            
            [Service]
            Type=simple
            User=ubuntu
            WorkingDirectory=/opt/api
            ExecStart=/usr/bin/python3 /opt/api/app.py
            Restart=always
            RestartSec=10
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            systemctl daemon-reload
            systemctl start api
            systemctl enable api
            systemctl restart nginx
            
            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "metrics": {
                "namespace": "PF/${Environment}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["/"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
              -s

  GreenLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PF-${Environment}-Green-LT-${AWS::Region}'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id}}'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !If
          - HasKeyPair
          - !Ref KeyPairName
          - !Ref 'AWS::NoValue'
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/sda1
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Green-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Deployment
                Value: Green
              - Key: Version
                Value: !Ref ApplicationVersion
              - Key: iac-rlhf-amazon
                Value: "true"
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Green-Volume'
              - Key: iac-rlhf-amazon
                Value: "true"
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install application dependencies
            apt-get install -y python3-pip nginx awscli postgresql-client
            pip3 install flask requests boto3 psycopg2-binary
            
            # Create API application
            mkdir -p /opt/api
            cat > /opt/api/app.py <<'EOF'
            from flask import Flask, request, jsonify
            import json
            import os
            import boto3
            from datetime import datetime
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            app = Flask(__name__)
            
            # AWS clients
            ssm = boto3.client('ssm', region_name='${AWS::Region}')
            secrets = boto3.client('secretsmanager', region_name='${AWS::Region}')
            cloudwatch = boto3.client('cloudwatch', region_name='${AWS::Region}')
            ec2 = boto3.client('ec2', region_name='${AWS::Region}')
            
            # Get instance metadata
            instance_id = os.popen('ec2-metadata --instance-id | cut -d " " -f 2').read().strip()
            az = os.popen('ec2-metadata --availability-zone | cut -d " " -f 2').read().strip()
            
            @app.route('/', methods=['GET'])
            def root():
                return 'OK', 200
            
            @app.route('/health/deep', methods=['GET'])
            def health_deep():
                return 'Healthy - Green Deployment - Version ${ApplicationVersion}', 200
            
            @app.route('/health/status', methods=['GET']) 
            def health_status():
                return 'OK', 200
            
            @app.route('/api/v1/health', methods=['GET'])
            def api_health():
                response = {
                    'status': 'healthy',
                    'deployment': 'Green',
                    'version': '${ApplicationVersion}',
                    'instance_id': instance_id,
                    'availability_zone': az
                }
                return jsonify(response), 200, {'x-deployment': 'green', 'x-az': az}
            
            @app.route('/api/v1/transactions', methods=['GET', 'POST'])
            def transactions():
                if request.method == 'POST':
                    data = request.get_json()
                    if data.get('amount', 0) < 0:
                        return jsonify({'error': 'Invalid amount'}), 400
                    return jsonify(data), 201
                else:
                    return jsonify([]), 200
            
            @app.route('/api/v1/transactions/<transaction_id>', methods=['GET'])
            def get_transaction(transaction_id):
                return jsonify({
                    'transactionId': transaction_id,
                    'amount': 1000,
                    'status': 'completed'
                }), 200
            
            @app.route('/api/v1/transactions/latest', methods=['GET'])
            def latest_transactions():
                return jsonify([]), 200
            
            @app.route('/api/v1/az-info', methods=['GET'])
            def az_info():
                return jsonify({'availabilityZone': az}), 200, {'x-az': az}
            
            @app.route('/api/v1/trigger-error-500', methods=['GET'])
            def trigger_error():
                return 'Internal Server Error', 500
            
            @app.route('/api/v1/webhooks/status/<transaction_id>', methods=['GET'])
            def webhook_status(transaction_id):
                return jsonify({'delivered': True}), 200
            
            if __name__ == '__main__':
                app.run(host='0.0.0.0', port=8000)
            EOF
            
            # Configure nginx for routing
            cat > /etc/nginx/sites-available/default <<EOF
            server {
                listen 80;
                
                location /health/deep {
                    proxy_pass http://localhost:8000;
                    proxy_set_header Host \$host;
                }
                
                location /health/status {
                    proxy_pass http://localhost:8000;
                    proxy_set_header Host \$host;
                }
                
                location /api/ {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                    proxy_connect_timeout 30s;
                    proxy_send_timeout 30s;
                    proxy_read_timeout 30s;
                }
                
                location / {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                }
            }
            EOF
            
            # Create systemd service for API
            cat > /etc/systemd/system/api.service <<EOF
            [Unit]
            Description=PayFlow API Service
            After=network.target
            
            [Service]
            Type=simple
            User=ubuntu
            WorkingDirectory=/opt/api
            ExecStart=/usr/bin/python3 /opt/api/app.py
            Restart=always
            RestartSec=10
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            systemctl daemon-reload
            systemctl start api
            systemctl enable api
            systemctl restart nginx
            
            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "metrics": {
                "namespace": "PF/${Environment}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["/"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
              -s

  WebhookLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PF-${Environment}-Webhook-LT-${AWS::Region}'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id}}'
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !If
          - HasKeyPair
          - !Ref KeyPairName
          - !Ref 'AWS::NoValue'
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/sda1
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Webhook-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Service
                Value: Webhook
              - Key: iac-rlhf-amazon
                Value: "true"
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'PF-${Environment}-Webhook-Volume'
              - Key: iac-rlhf-amazon
                Value: "true"
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install webhook service dependencies
            apt-get install -y python3-pip python3-flask
            pip3 install flask requests boto3
            
            # Create webhook service application
            mkdir -p /opt/webhook
            cat > /opt/webhook/server.py <<EOF
            from flask import Flask, request, jsonify
            import json
            import boto3
            import os
            from datetime import datetime
            
            app = Flask(__name__)
            ssm = boto3.client('ssm', region_name='${AWS::Region}')
            
            @app.route('/health', methods=['GET'])
            def health():
                return 'Healthy', 200
            
            @app.route('/webhooks/<path:path>', methods=['POST', 'GET'])
            def handle_webhook(path):
                # Process webhook based on path
                data = request.get_json() if request.method == 'POST' else {}
                
                # Log webhook for monitoring
                print(f"Webhook received: {path}, Data: {json.dumps(data)}")
                
                # Process based on webhook type
                response = {
                    'status': 'processed',
                    'path': path,
                    'timestamp': str(datetime.utcnow())
                }
                
                return jsonify(response), 200
            
            if __name__ == '__main__':
                app.run(host='0.0.0.0', port=8080)
            EOF
            
            # Create webhook service
            cat > /etc/systemd/system/webhook.service <<EOF
            [Unit]
            Description=PF Webhook Service
            After=network.target
            
            [Service]
            Type=simple
            User=ubuntu
            WorkingDirectory=/opt/webhook
            ExecStart=/usr/bin/python3 /opt/webhook/server.py
            Restart=always
            RestartSec=10
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            systemctl daemon-reload
            systemctl start webhook
            systemctl enable webhook
            
            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "metrics": {
                "namespace": "PF/${Environment}/Webhooks",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle"],
                    "metrics_collection_interval": 60
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
              -s

  # =====================================
  # Auto Scaling Groups
  # =====================================
  
  BlueAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: !Ref MinCapacityBlue
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: false
    Properties:
      AutoScalingGroupName: !Sub 'PF-${Environment}-Blue-ASG-${AWS::Region}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: !Ref MinCapacityBlue
      MaxSize: !Ref MaxCapacityBlue
      DesiredCapacity: !Ref DesiredCapacityBlue
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref BlueTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref BlueLaunchTemplate
            Version: !GetAtt BlueLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: !Ref InstanceTypeSmall
              WeightedCapacity: 1
            - InstanceType: !Ref InstanceTypeMedium
              WeightedCapacity: 2
            - InstanceType: !Ref InstanceTypeLarge
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 2
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
          SpotMaxPrice: ""
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Blue-ASG'
          PropagateAtLaunch: false
        - Key: iac-rlhf-amazon
          Value: "true"
          PropagateAtLaunch: true

  GreenAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 0
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: false
    Properties:
      AutoScalingGroupName: !Sub 'PF-${Environment}-Green-ASG-${AWS::Region}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: 0
      MaxSize: !Ref MaxCapacityBlue
      DesiredCapacity: 0
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref GreenTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref GreenLaunchTemplate
            Version: !GetAtt GreenLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: !Ref InstanceTypeSmall
              WeightedCapacity: 1
            - InstanceType: !Ref InstanceTypeMedium
              WeightedCapacity: 2
            - InstanceType: !Ref InstanceTypeLarge
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 2
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
          SpotMaxPrice: ""
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Green-ASG'
          PropagateAtLaunch: false
        - Key: iac-rlhf-amazon
          Value: "true"
          PropagateAtLaunch: true

  WebhookAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'PF-${Environment}-Webhook-ASG-${AWS::Region}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: 3
      MaxSize: 9
      DesiredCapacity: 3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref WebhookTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref WebhookLaunchTemplate
            Version: !GetAtt WebhookLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: !Ref InstanceTypeSmall
              WeightedCapacity: 1
            - InstanceType: !Ref InstanceTypeMedium
              WeightedCapacity: 2
            - InstanceType: !Ref InstanceTypeLarge
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 1
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
          SpotMaxPrice: ""
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Webhook-ASG'
          PropagateAtLaunch: false
        - Key: iac-rlhf-amazon
          Value: "true"
          PropagateAtLaunch: true

  # Auto Scaling Policies
  BlueTargetTrackingCPU:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref BlueAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  BlueTargetTrackingALBRequests:
    Type: AWS::AutoScaling::ScalingPolicy
    DependsOn:
      - HTTPListener
      - APIListenerRuleHTTP
    Properties:
      AutoScalingGroupName: !Ref BlueAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ALBRequestCountPerTarget
          ResourceLabel: !Sub '${ApplicationLoadBalancer.LoadBalancerFullName}/${BlueTargetGroup.TargetGroupFullName}'
        TargetValue: 1000.0

  GreenTargetTrackingCPU:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref GreenAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  GreenTargetTrackingALBRequests:
    Type: AWS::AutoScaling::ScalingPolicy
    DependsOn:
      - HTTPListener
      - APIListenerRuleHTTP
    Properties:
      AutoScalingGroupName: !Ref GreenAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ALBRequestCountPerTarget
          ResourceLabel: !Sub '${ApplicationLoadBalancer.LoadBalancerFullName}/${GreenTargetGroup.TargetGroupFullName}'
        TargetValue: 1000.0

  WebhookTargetTrackingCPU:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebhookAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # =====================================
  # RDS Aurora PostgreSQL Cluster
  # =====================================
  
  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for PayFlow RDS encryption at rest
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-RDS-KMS-Key'
        - Key: iac-rlhf-amazon
          Value: "true"

  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/pf-${Environment}-rds-${AWS::Region}'
      TargetKeyId: !Ref DatabaseKMSKey

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'pf/${Environment}/rds/credentials/${AWS::Region}'
      Description: !Sub 'RDS Aurora master credentials for PF ${Environment} environment'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId: !Ref DatabaseKMSKey
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-Secret'
        - Key: iac-rlhf-amazon
          Value: "true"

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'pf-${Environment}-db-subnet-group-${AWS::Region}'
      DBSubnetGroupDescription: Subnet group for PayFlow Aurora cluster
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
        - !Ref DBSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-SubnetGroup'
        - Key: iac-rlhf-amazon
          Value: "true"

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Custom cluster parameter group for PayFlow Aurora PostgreSQL with PCI compliance settings
      Family: aurora-postgresql15
      Parameters:
        shared_preload_libraries: pg_stat_statements
        log_statement: all
        log_min_duration_statement: 1000
        log_connections: "1"
        log_disconnections: "1"
        log_duration: "1"
        ssl: "1"
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-ClusterParameterGroup'
        - Key: iac-rlhf-amazon
          Value: "true"

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Custom instance parameter group for PayFlow Aurora PostgreSQL
      Family: aurora-postgresql15
      Parameters:
        max_connections: "500"
        shared_buffers: "2097152"
        work_mem: "4096"
        maintenance_work_mem: "524288"
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-DB-ParameterGroup'
        - Key: iac-rlhf-amazon
          Value: "true"

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: !Sub 'pf-${Environment}-cluster-${AWS::Region}'
      Engine: aurora-postgresql
      EngineVersion: '15.13'
      MasterUsername: !Ref DBMasterUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        SecretArn: !Ref DatabaseSecret
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
      DeletionProtection: false
      EnableIAMDatabaseAuthentication: false
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Aurora-Cluster'
        - Key: iac-rlhf-amazon
          Value: "true"

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'pf-${Environment}-writer-${AWS::Region}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClassWriter
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Aurora-Writer'
        - Key: iac-rlhf-amazon
          Value: "true"

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    DependsOn: AuroraDBInstance1
    Properties:
      DBInstanceIdentifier: !Sub 'pf-${Environment}-reader-1-${AWS::Region}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClassReader
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Aurora-Reader-1'
        - Key: iac-rlhf-amazon
          Value: "true"

  AuroraDBInstance3:
    Type: AWS::RDS::DBInstance
    DependsOn: AuroraDBInstance2
    Properties:
      DBInstanceIdentifier: !Sub 'pf-${Environment}-reader-2-${AWS::Region}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: !Ref DBInstanceClassReader
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Aurora-Reader-2'
        - Key: iac-rlhf-amazon
          Value: "true"

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'PF-${Environment}-RDS-Monitoring-Role-${AWS::Region}'
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
          Value: !Sub 'PF-${Environment}-RDS-Monitoring-Role'
        - Key: iac-rlhf-amazon
          Value: "true"

  # =====================================
  # Route 53 Configuration (Conditional)
  # =====================================
  
  HostedZone:
    Type: AWS::Route53::HostedZone
    Condition: HasCustomDomain
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for PF ${Environment} environment'

  # Production Record Set with weighted routing
  ProductionRecordSet:
    Type: AWS::Route53::RecordSet
    Condition: HasCustomDomain
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Production
      Weight: !Ref ProductionWeight
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # Canary Record Set with weighted routing
  CanaryRecordSet:
    Type: AWS::Route53::RecordSet
    Condition: HasCustomDomain
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Canary
      Weight: !Ref CanaryWeight
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # =====================================
  # SNS Topic for Alerts
  # =====================================
  
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'PF-${Environment}-Alerts-${AWS::Region}'
      DisplayName: PayFlow Infrastructure Critical Alerts
      KmsMasterKeyId: alias/aws/sns
      Subscription:
        - Endpoint: !Ref PagerDutyEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub 'PF-${Environment}-Alert-Topic'
        - Key: iac-rlhf-amazon
          Value: "true"

  # =====================================
  # CloudWatch Alarms
  # =====================================
  
  ALBErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PF-${Environment}-ALB-HighErrorRate-${AWS::Region}'
      AlarmDescription: !Sub 'Alert when ALB error rate exceeds ${ErrorRateThreshold}%'
      Metrics:
        - Id: e1
          ReturnData: false
          Expression: m1+m2
        - Id: e2
          Expression: (e1/m3)*100
        - Id: m1
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: HTTPCode_Target_5XX_Count
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
        - Id: m2
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: HTTPCode_Target_4XX_Count
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
        - Id: m3
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: RequestCount
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
      EvaluationPeriods: 2
      Threshold: !Ref ErrorRateThreshold
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlertTopic

  ALBLatencyP99Alarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PF-${Environment}-ALB-HighP99Latency-${AWS::Region}'
      AlarmDescription: !Sub 'Alert when P99 latency exceeds ${LatencyThreshold}ms'
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      ExtendedStatistic: p99
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref LatencyThreshold
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlertTopic

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PF-${Environment}-DB-HighConnections-${AWS::Region}'
      AlarmDescription: !Sub 'Alert when database connections exceed ${DBConnectionThreshold}%'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref DBConnectionThreshold
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlertTopic

  BlueCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PF-${Environment}-Blue-High-CPU-${AWS::Region}'
      AlarmDescription: Alert when Blue ASG CPU exceeds 85%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref BlueAutoScalingGroup
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  # =====================================
  # Systems Manager Parameter Store
  # =====================================
  
  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/pf/${Environment}/database/endpoint/${AWS::Region}'
      Type: String
      Value: !GetAtt AuroraDBCluster.Endpoint.Address
      Description: Database cluster writer endpoint
      Tags:
        Name: !Sub 'PF-${Environment}-DB-Endpoint-Param'
        iac-rlhf-amazon: "true"

  DatabaseReadEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/pf/${Environment}/database/reader-endpoint/${AWS::Region}'
      Type: String
      Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
      Description: Database cluster reader endpoint
      Tags:
        Name: !Sub 'PF-${Environment}-DB-Reader-Endpoint-Param'
        iac-rlhf-amazon: "true"

  DatabasePortParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/pf/${Environment}/database/port/${AWS::Region}'
      Type: String
      Value: !GetAtt AuroraDBCluster.Endpoint.Port
      Description: Database port number
      Tags:
        Name: !Sub 'PF-${Environment}-DB-Port-Param'
        iac-rlhf-amazon: "true"

  ALBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/pf/${Environment}/alb/endpoint/${AWS::Region}'
      Type: String
      Value: !GetAtt ApplicationLoadBalancer.DNSName
      Description: Application Load Balancer endpoint
      Tags:
        Name: !Sub 'PF-${Environment}-ALB-Endpoint-Param'
        iac-rlhf-amazon: "true"

# =====================================
# Outputs 
# =====================================
Outputs:
  LoadBalancerDNS:
    Description: DNS name for the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-DNS"
  
  LoadBalancerURL:
    Description: URL for accessing the Application Load Balancer
    Value: !If
      - HasSSLCertificate
      - !Sub "https://${ApplicationLoadBalancer.DNSName}"
      - !Sub "http://${ApplicationLoadBalancer.DNSName}"
  
  LoadBalancerArn:
    Description: ARN of the Application Load Balancer
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub "${AWS::StackName}-ALB-ARN"
  
  LoadBalancerFullName:
    Description: Full name of the Application Load Balancer for CloudWatch metrics
    Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-FullName"
  
  BlueTargetGroupArn:
    Description: ARN of Blue Target Group for deployment testing
    Value: !Ref BlueTargetGroup
    Export:
      Name: !Sub "${AWS::StackName}-Blue-TG"
  
  GreenTargetGroupArn:
    Description: ARN of Green Target Group for deployment testing
    Value: !Ref GreenTargetGroup
    Export:
      Name: !Sub "${AWS::StackName}-Green-TG"
  
  HealthCheckEndpoint:
    Description: Full URL for health check validation
    Value: !If
      - HasSSLCertificate
      - !Sub "https://${ApplicationLoadBalancer.DNSName}/health/deep"
      - !Sub "http://${ApplicationLoadBalancer.DNSName}/health/deep"
  
  DatabaseEndpoint:
    Description: RDS Aurora cluster writer endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-DB-Endpoint"
  
  DatabaseReaderEndpoint:
    Description: RDS Aurora reader endpoint for read replica testing
    Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
  
  SNSTopicArn:
    Description: SNS Topic ARN for alarm testing
    Value: !Ref AlertTopic
  
  LogsBucketName:
    Description: S3 bucket name for ALB access logs verification
    Value: !Ref ALBLogsBucket
  
  VPCId:
    Description: VPC ID for network testing
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'
  
  Environment:
    Description: Environment name for resource identification
    Value: !Ref Environment
  
  DatabaseSecretArn:
    Description: ARN of the database credentials secret
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret-ARN'
  
  DatabasePort:
    Description: Port number for the database
    Value: !GetAtt AuroraDBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
  
  HostedZoneId:
    Description: Route 53 Hosted Zone ID for DNS resolution
    Condition: HasCustomDomain
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'
  
  BlueWeight:
    Description: Traffic weight for Blue target group
    Value: !Ref BlueWeight
    Export:
      Name: !Sub '${AWS::StackName}-BlueWeight'
```