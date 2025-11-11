```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: Production-ready infrastructure with HA, security, and compliance
  features for PCI DSS payment processing application

# ============================================================================
# MAPPINGS - Region-specific configurations
# ============================================================================
Mappings:
  RegionAZs:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b
      AZ3: us-east-1c
    us-east-2:
      AZ1: us-east-2a
      AZ2: us-east-2b
      AZ3: us-east-2c
    us-west-1:
      AZ1: us-west-1a
      AZ2: us-west-1b
      AZ3: us-west-1c
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b
      AZ3: us-west-2c
    eu-west-1:
      AZ1: eu-west-1a
      AZ2: eu-west-1b
      AZ3: eu-west-1c
    eu-central-1:
      AZ1: eu-central-1a
      AZ2: eu-central-1b
      AZ3: eu-central-1c
    ap-south-1:
      AZ1: ap-south-1a
      AZ2: ap-south-1b
      AZ3: ap-south-1c
    ap-east-1:
      AZ1: ap-east-1a
      AZ2: ap-east-1b
      AZ3: ap-east-1c

# ============================================================================
# METADATA - Interface for better parameter organization in Console
# ============================================================================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Environment Configuration
        Parameters:
          - Environment
          - ProjectName
          - Owner
          - CostCenter
      - Label:
          default: Network Configuration - IMPORTANT
        Parameters:
          - VPCCIDR
          - NumberOfAvailabilityZones
          - UseCustomAZs
          - CustomAZ1
          - CustomAZ2
          - CustomAZ3
          - EnableNATGatewayHA
      - Label:
          default: Application Configuration
        Parameters:
          - InstanceType
          - MinInstances
          - MaxInstances
          - DesiredInstances
          - KeyPairName
          - LatestAmiId
      - Label:
          default: Database Configuration
        Parameters:
          - DBWriterInstanceClass
          - DBReaderInstanceClass
          - DBBackupRetentionPeriod
          - DBMasterUsername
          - DBMasterPassword
      - Label:
          default: Security & Compliance
        Parameters:
          - SSLCertificateArn
          - LogRetentionDays
      - Label:
          default: Monitoring & Alerts
        Parameters:
          - NotificationEmail
          - CPUAlarmThreshold
          - DatabaseConnectionsThreshold
    ParameterLabels:
      Environment:
        default: Deployment Environment
      VPCCIDR:
        default: VPC CIDR Block
      NumberOfAvailabilityZones:
        default: Number of Availability Zones
      UseCustomAZs:
        default: Use Custom AZ Names?
      CustomAZ1:
        default: Custom First Availability Zone
      CustomAZ2:
        default: Custom Second Availability Zone
      CustomAZ3:
        default: Custom Third Availability Zone

# ============================================================================
# PARAMETERS
# ============================================================================
Parameters:
  Environment:
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    Description: Environment name for tagging and configuration

  ProjectName:
    Type: String
    Default: PaymentProcessor
    Description: Project name for resource naming and tagging
    MinLength: 1
    MaxLength: 50

  Owner:
    Type: String
    Default: admin@example.com
    Description: Owner email for tagging and notifications
    AllowedPattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
    ConstraintDescription: Must be a valid email address

  CostCenter:
    Type: String
    Default: FinTech-001
    Description: Cost center for billing and cost allocation
    MinLength: 1
    MaxLength: 50

  # Network Parameters
  VPCCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/16$

  NumberOfAvailabilityZones:
    Type: Number
    Default: 2
    AllowedValues:
      - 1
      - 2
      - 3
    Description: Number of availability zones to deploy resources across. ALB and RDS require at least 2 AZs.

  UseCustomAZs:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Set to true if you want to specify custom AZ names, otherwise uses region defaults

  CustomAZ1:
    Type: String
    Default: ''
    Description: Custom first AZ (only used if UseCustomAZs is true)

  CustomAZ2:
    Type: String
    Default: ''
    Description: Custom second AZ (only used if UseCustomAZs is true)

  CustomAZ3:
    Type: String
    Default: ''
    Description: Custom third AZ (only used if UseCustomAZs is true)

  EnableNATGatewayHA:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable NAT Gateway in all AZs for HA (false uses single NAT for dev/staging)

  # Application Parameters
  InstanceType:
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
    Description: EC2 instance type for application servers

  MinInstances:
    Type: Number
    Default: 1
    MinValue: 1
    MaxValue: 10
    Description: Minimum number of EC2 instances in Auto Scaling Group

  MaxInstances:
    Type: Number
    Default: 3
    MinValue: 1
    MaxValue: 20
    Description: Maximum number of EC2 instances in Auto Scaling Group

  DesiredInstances:
    Type: Number
    Default: 1
    MinValue: 1
    MaxValue: 20
    Description: Desired number of EC2 instances in Auto Scaling Group

  # Using SSM Parameter for latest AMI instead of hardcoding
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID from SSM Parameter Store

  # Database Parameters
  DBWriterInstanceClass:
    Type: String
    Default: db.r6g.large
    AllowedValues:
      - db.r6g.large
      - db.r6g.xlarge
      - db.r6g.2xlarge
    Description: Instance class for Aurora writer instance

  DBReaderInstanceClass:
    Type: String
    Default: db.r6g.large
    AllowedValues:
      - db.r6g.large
      - db.r6g.xlarge
    Description: Instance class for Aurora reader instances

  DBBackupRetentionPeriod:
    Type: Number
    Default: 30
    MinValue: 30
    MaxValue: 35
    Description: Number of days to retain automated database backups (PCI DSS requires 30+)

  # Security Parameters
  SSLCertificateArn:
    Type: String
    Default: ''
    Description: ARN of the SSL certificate in ACM for HTTPS listener (leave empty to disable HTTPS)
    AllowedPattern: ^$|^arn:aws:acm:[a-z0-9-]+:[0-9]+:certificate/[a-f0-9-]+$

  LogRetentionDays:
    Type: Number
    Default: 90
    AllowedValues:
      - 30
      - 60
      - 90
      - 180
      - 365
    Description: Days to retain logs before transitioning to Glacier

  # Monitoring Parameters
  NotificationEmail:
    Type: String
    Default: admin@example.com
    Description: Email address for CloudWatch alarm notifications
    AllowedPattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

  CPUAlarmThreshold:
    Type: Number
    Default: 80
    MinValue: 50
    MaxValue: 95
    Description: CPU utilization threshold for scaling and alerts (percentage)

  DatabaseConnectionsThreshold:
    Type: Number
    Default: 80
    MinValue: 50
    MaxValue: 95
    Description: Database connections threshold for alerts (percentage of max)

  # Database credentials
  DBMasterUsername:
    Type: String
    Default: admin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    NoEcho: false

  DBMasterPassword:
    Type: String
    Default: ChangeMe123!
    Description: Database master password (CHANGE THIS!)
    MinLength: 8
    MaxLength: 41
    NoEcho: true

  KeyPairName:
    Type: String
    Default: ''
    AllowedPattern: '^$|[A-Za-z0-9._-]{1,255}$'
    Description: EC2 Key Pair for SSH access (leave empty to disable SSH access)

# ============================================================================
# CONDITIONS - Environment-specific configurations
# ============================================================================
Conditions:
  IsProduction: !Equals
    - !Ref Environment
    - Production
  HasKeyPairName: !Not
    - !Equals
      - !Ref KeyPairName
      - ''
  UseCustomAZSelection: !Equals
    - !Ref UseCustomAZs
    - 'true'
  HasTwoAZs: !Equals
    - !Ref NumberOfAvailabilityZones
    - 2
  HasThreeAZs: !Equals
    - !Ref NumberOfAvailabilityZones
    - 3
  HasAtLeastTwoAZs: !Or
    - !Condition HasTwoAZs
    - !Condition HasThreeAZs
  UseAZ2: !Condition HasAtLeastTwoAZs
  UseAZ3: !Condition HasThreeAZs
  EnableHighAvailabilityNAT: !And
    - !Equals
      - !Ref EnableNATGatewayHA
      - 'true'
    - !Condition IsProduction
    - !Condition UseAZ2
  EnableHighAvailabilityNATInAZ3: !And
    - !Condition EnableHighAvailabilityNAT
    - !Condition UseAZ3
  HasValidCertificate: !Not
    - !Equals
      - !Ref SSLCertificateArn
      - ''
  UseHTTPS: !And
    - !Condition UseAZ2
    - !Condition HasValidCertificate

# ============================================================================
# RESOURCES
# ============================================================================
Resources:
  # ==========================================================================
  # NETWORKING - VPC, Subnets, Gateways
  # ==========================================================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-VPC
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-IGW
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets - For ALB tier
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 0
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ1
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ1
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Public-Subnet-1
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Condition: UseAZ2
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 1
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ2
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ2
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Public-Subnet-2
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseAZ3
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 2
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ3
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ3
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Public-Subnet-3
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private Application Subnets - For EC2 instances
  PrivateAppSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 3
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ1
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-App-Subnet-1
        - Key: Type
          Value: Private-App
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateAppSubnet2:
    Type: AWS::EC2::Subnet
    Condition: UseAZ2
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 4
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ2
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-App-Subnet-2
        - Key: Type
          Value: Private-App
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateAppSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseAZ3
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 5
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ3
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-App-Subnet-3
        - Key: Type
          Value: Private-App
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private Database Subnets - For RDS Aurora cluster
  PrivateDBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 6
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ1
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-DB-Subnet-1
        - Key: Type
          Value: Private-DB
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateDBSubnet2:
    Type: AWS::EC2::Subnet
    Condition: UseAZ2
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 7
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ2
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-DB-Subnet-2
        - Key: Type
          Value: Private-DB
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateDBSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseAZ3
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select
        - 8
        - !Cidr
          - !Ref VPCCIDR
          - 16
          - 8
      AvailabilityZone: !If
        - UseCustomAZSelection
        - !Ref CustomAZ3
        - !FindInMap
          - RegionAZs
          - !Ref AWS::Region
          - AZ3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-DB-Subnet-3
        - Key: Type
          Value: Private-DB
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # NAT Gateways and Elastic IPs - Conditional HA setup
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-EIP-1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    Condition: EnableHighAvailabilityNAT
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-EIP-2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    Condition: EnableHighAvailabilityNATInAZ3
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-EIP-3
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-Gateway-1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Condition: EnableHighAvailabilityNAT
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-Gateway-2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Condition: EnableHighAvailabilityNATInAZ3
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-NAT-Gateway-3
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Tables - Simplified routing logic
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Public-RouteTable
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

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
    Condition: UseAZ2
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseAZ3
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private route tables - Conditional based on HA NAT setup
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-RouteTable-1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Condition: EnableHighAvailabilityNAT
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-RouteTable-2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Condition: EnableHighAvailabilityNAT
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Condition: EnableHighAvailabilityNATInAZ3
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-Private-RouteTable-3
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRoute3:
    Type: AWS::EC2::Route
    Condition: EnableHighAvailabilityNATInAZ3
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  # Route table associations - Conditional based on HA NAT
  PrivateAppSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateAppSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateAppSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseAZ2
    Properties:
      SubnetId: !Ref PrivateAppSubnet2
      RouteTableId: !If
        - EnableHighAvailabilityNAT
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable1

  PrivateAppSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseAZ3
    Properties:
      SubnetId: !Ref PrivateAppSubnet3
      RouteTableId: !If
        - EnableHighAvailabilityNATInAZ3
        - !Ref PrivateRouteTable3
        - !Ref PrivateRouteTable1

  PrivateDBSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateDBSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateDBSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseAZ2
    Properties:
      SubnetId: !Ref PrivateDBSubnet2
      RouteTableId: !If
        - EnableHighAvailabilityNAT
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable1

  PrivateDBSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseAZ3
    Properties:
      SubnetId: !Ref PrivateDBSubnet3
      RouteTableId: !If
        - EnableHighAvailabilityNATInAZ3
        - !Ref PrivateRouteTable3
        - !Ref PrivateRouteTable1

  # ==========================================================================
  # SECURITY GROUPS - Network isolation for different tiers
  # ==========================================================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer - allows
        HTTPS/HTTP from internet
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from Internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from Internet (for redirect to HTTPS)
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ALB-SG
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application instances - allows traffic only from ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB only
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-App-SG
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Aurora database cluster - allows MySQL only
        from app tier
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: Allow MySQL from Application tier only
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DB-SG
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================================================
  # CLOUDWATCH LOG GROUPS - Pre-create for application logging
  # ==========================================================================

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/${ProjectName}/${Environment}/application
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================================================
  # APPLICATION LOAD BALANCER - Internet-facing load balancer with HTTPS
  # ==========================================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Condition: UseAZ2
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-ALB
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets: !If
        - UseAZ3
        - - !Ref PublicSubnet1
          - !Ref PublicSubnet2
          - !Ref PublicSubnet3
        - - !Ref PublicSubnet1
          - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ALB
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      # Stickiness configuration for session management
      TargetGroupAttributes:
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400' # 1 day in seconds
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-TargetGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: UseHTTPS
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      SslPolicy: ELBSecurityPolicy-TLS-1-2-Ext-2018-06 # PCI DSS compliant SSL policy
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: UseAZ2
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions: !If
        - HasValidCertificate
        - - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: '443'
              StatusCode: HTTP_301
        - - Type: forward
            TargetGroupArn: !Ref ALBTargetGroup

  # ==========================================================================
  # EC2 LAUNCH TEMPLATE & AUTO SCALING - Application tier compute resources
  # ==========================================================================

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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource:
                  - !Sub ${ApplicationLogsBucket.Arn}/*
        - PolicyName: SSMParameterAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource:
                  - !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/myapp/*
                Condition:
                  StringEquals:
                    ssm:SecureString: 'true'
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-EC2-Role
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${ProjectName}-${Environment}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId # Using SSM parameter for latest AMI
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPairName, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: !If
                - IsProduction
                - 100
                - 30
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
              Iops: 3000
              Throughput: 125
        UserData: !Base64
          Fn::Sub: |
            #!/bin/bash
            # Update system and install dependencies
            yum update -y
            yum install -y amazon-cloudwatch-agent aws-cli jq

            # Install payment processing application dependencies (example)
            yum install -y httpd mod_ssl python3 python3-pip
            pip3 install boto3 cryptography pymysql

            # Start and enable services
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint for ALB
            echo "OK" > /var/www/html/health

            # Setup payment processing application (placeholder)
            cat > /var/www/html/index.html <<EOF
            <!DOCTYPE html>
            <html>
            <head><title>${ProjectName} Payment Gateway</title></head>
            <body>
            <h1>${Environment} Payment Processing System</h1>
            <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
            <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch agent for comprehensive monitoring
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "${ProjectName}/${Environment}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                      {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},
                      {"name": "cpu_usage_system", "rename": "CPU_SYSTEM", "unit": "Percent"}
                    ],
                    "totalcpu": false,
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"},
                      {"name": "inodes_free", "rename": "INODES_FREE", "unit": "Count"}
                    ],
                    "metrics_collection_interval": 60,
                    "resources": ["/", "/var/log"]
                  },
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"},
                      {"name": "mem_available", "rename": "MEM_AVAILABLE", "unit": "Bytes"}
                    ],
                    "metrics_collection_interval": 60
                  },
                  "netstat": {
                    "measurement": [
                      {"name": "tcp_established", "rename": "TCP_ESTABLISHED", "unit": "Count"},
                      {"name": "tcp_time_wait", "rename": "TCP_TIME_WAIT", "unit": "Count"}
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/${ProjectName}/${Environment}/application",
                        "log_stream_name": "{instance_id}/httpd-access",
                        "timestamp_format": "%b %d %H:%M:%S"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/${ProjectName}/${Environment}/application",
                        "log_stream_name": "{instance_id}/httpd-error",
                        "timestamp_format": "%b %d %H:%M:%S"
                      },
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/${ProjectName}/${Environment}/application",
                        "log_stream_name": "{instance_id}/system-messages",
                        "timestamp_format": "%b %d %H:%M:%S"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

            echo "CloudWatch agent started successfully"

        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${ProjectName}-${Environment}-Instance
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref Owner
              - Key: CostCenter
                Value: !Ref CostCenter
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub ${ProjectName}-${Environment}-Volume
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref Owner
              - Key: CostCenter
                Value: !Ref CostCenter
              - Key: iac-rlhf-amazon
                Value: 'true'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${ProjectName}-${Environment}-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref DesiredInstances
      VPCZoneIdentifier: !If
        - UseAZ3
        - - !Ref PrivateAppSubnet1
          - !Ref PrivateAppSubnet2
          - !Ref PrivateAppSubnet3
        - !If
          - UseAZ2
          - - !Ref PrivateAppSubnet1
            - !Ref PrivateAppSubnet2
          - - !Ref PrivateAppSubnet1
      TargetGroupARNs: !If
        - UseAZ2
        - - !Ref ALBTargetGroup
        - !Ref AWS::NoValue
      HealthCheckType: !If
        - UseAZ2
        - ELB
        - EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true

  # Target tracking scaling policy for better performance
  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !Ref CPUAlarmThreshold

  # ==========================================================================
  # RDS AURORA CLUSTER - Multi-AZ MySQL cluster with encryption
  # ==========================================================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Condition: UseAZ2
    Properties:
      DBSubnetGroupName: !Sub ${ProjectName}-${Environment}-db-subnet-group
      DBSubnetGroupDescription: Subnet group for Aurora cluster across multiple AZs
      SubnetIds: !If
        - UseAZ3
        - - !Ref PrivateDBSubnet1
          - !Ref PrivateDBSubnet2
          - !Ref PrivateDBSubnet3
        - - !Ref PrivateDBSubnet1
          - !Ref PrivateDBSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DBSubnetGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for RDS Aurora cluster encryption at rest
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
            Condition:
              StringEquals:
                kms:ViaService: !Sub rds.${AWS::Region}.amazonaws.com
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-RDS-KMS-Key
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/${ProjectName}-${Environment}-rds-key
      TargetKeyId: !Ref DBKMSKey

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Aurora MySQL 8.0 Cluster Parameter Group with optimized settings
      Family: aurora-mysql8.0
      Parameters:
        slow_query_log: 1
        long_query_time: 2
        log_output: FILE
        innodb_print_all_deadlocks: 1
        performance_schema: 1
        max_connections: 1000 # Increased for payment processing load
        binlog_format: MIXED
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DBClusterParameterGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Aurora MySQL 8.0 Instance Parameter Group
      Family: aurora-mysql8.0
      Parameters:
        slow_query_log: 1
        general_log: 0
        log_queries_not_using_indexes: 1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DBParameterGroup
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseCredentialsSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${ProjectName}-${Environment}-db-credentials
      Description: Master credentials for Aurora cluster
      SecretString: !Sub |
        {
          "username": "${DBMasterUsername}",
          "password": "${DBMasterPassword}"
        }
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DBCredentialsSecret
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    Condition: UseAZ2
    Properties:
      DBClusterIdentifier: !Sub ${ProjectName}-${Environment}-aurora-cluster
      Engine: aurora-mysql
      EngineMode: provisioned
      EngineVersion: 8.0.mysql_aurora.3.10.0
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseCredentialsSecret}::username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseCredentialsSecret}::password}}'
      DatabaseName: paymentdb # Payment processing database
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      StorageEncrypted: true
      KmsKeyId: !Ref DBKMSKey
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      DeletionProtection: false
      EnableIAMDatabaseAuthentication: true # Additional security layer
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-AuroraCluster
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraInstanceWriter:
    Type: AWS::RDS::DBInstance
    Condition: UseAZ2
    Properties:
      DBInstanceIdentifier: !Sub ${ProjectName}-${Environment}-aurora-writer
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !Ref DBWriterInstanceClass
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-mysql
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: !If
        - IsProduction
        - 31
        - 7
      PerformanceInsightsKMSKeyId: !Ref DBKMSKey
      MonitoringInterval: !If
        - IsProduction
        - 60
        - 0
      MonitoringRoleArn: !If
        - IsProduction
        - !GetAtt RDSEnhancedMonitoringRole.Arn
        - !Ref AWS::NoValue
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-AuroraWriter
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraInstanceReader1:
    Type: AWS::RDS::DBInstance
    Condition: UseAZ2
    DependsOn: AuroraInstanceWriter
    Properties:
      DBInstanceIdentifier: !Sub ${ProjectName}-${Environment}-aurora-reader-1
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !Ref DBReaderInstanceClass
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-mysql
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: !If
        - IsProduction
        - 31
        - 7
      PerformanceInsightsKMSKeyId: !Ref DBKMSKey
      MonitoringInterval: !If
        - IsProduction
        - 60
        - 0
      MonitoringRoleArn: !If
        - IsProduction
        - !GetAtt RDSEnhancedMonitoringRole.Arn
        - !Ref AWS::NoValue
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-AuroraReader1
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraInstanceReader2:
    Type: AWS::RDS::DBInstance
    Condition: UseAZ3
    DependsOn: AuroraInstanceReader1
    Properties:
      DBInstanceIdentifier: !Sub ${ProjectName}-${Environment}-aurora-reader-2
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !Ref DBReaderInstanceClass
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-mysql
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: !If
        - IsProduction
        - 31
        - 7
      PerformanceInsightsKMSKeyId: !Ref DBKMSKey
      MonitoringInterval: !If
        - IsProduction
        - 60
        - 0
      MonitoringRoleArn: !If
        - IsProduction
        - !GetAtt RDSEnhancedMonitoringRole.Arn
        - !Ref AWS::NoValue
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-AuroraReader2
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Condition: IsProduction # Only create for production
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Path: /
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-RDS-MonitoringRole
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================================================
  # S3 BUCKETS - Application logs and database backups with encryption
  # ==========================================================================

  ApplicationLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref LogRetentionDays
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: !Ref LogRetentionDays
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-AppLogsBucket
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 database backup bucket encryption
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-S3-KMS-Key
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/${ProjectName}-${Environment}-s3-backup-key
      TargetKeyId: !Ref S3KMSKey

  DatabaseBackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: RetentionPolicy
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 90
              - StorageClass: DEEP_ARCHIVE
                TransitionInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-DBBackupBucket
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================================================
  # CLOUDWATCH ALARMS & SNS TOPIC - Comprehensive monitoring and alerting
  # ==========================================================================

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${ProjectName}-${Environment}-Alerts
      DisplayName: !Sub ${ProjectName} ${Environment} Alerts
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${ProjectName}-${Environment}-HighCPU
      AlarmDescription: Triggers when CPU exceeds threshold for 2 consecutive periods
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

  # Database connections alarm with percentage calculation
  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: UseAZ2
    Properties:
      AlarmName: !Sub ${ProjectName}-${Environment}-DB-HighConnections
      AlarmDescription: Alarm when database connections exceed threshold percentage
      Metrics:
        - Id: current_connections
          MetricStat:
            Metric:
              Namespace: AWS/RDS
              MetricName: DatabaseConnections
              Dimensions:
                - Name: DBClusterIdentifier
                  Value: !Ref AuroraCluster
            Period: 300
            Stat: Average
          ReturnData: false
        - Id: max_connections
          Expression: '1000' # Max connections set in parameter group
          ReturnData: false
        - Id: connection_percentage
          Expression: (current_connections / max_connections) * 100
          Label: Connection Percentage
          ReturnData: true
      EvaluationPeriods: 2
      Threshold: !Ref DatabaseConnectionsThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  UnhealthyTargetsAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: UseAZ2
    Properties:
      AlarmName: !Sub ${ProjectName}-${Environment}-UnhealthyTargets
      AlarmDescription: Alarm when any target becomes unhealthy
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 1
      Threshold: 0.5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  TargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: UseAZ2
    Properties:
      AlarmName: !Sub ${ProjectName}-${Environment}-HighResponseTime
      AlarmDescription: Alarm when target response time exceeds 2 seconds
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  # ==========================================================================
  # AWS CONFIG - Proper dependency order for Config resources
  # ==========================================================================

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ConfigBucket
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

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
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringLike:
                AWS:SourceAccount: !Ref AWS::AccountId
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringLike:
                AWS:SourceAccount: !Ref AWS::AccountId
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub ${ConfigBucket.Arn}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
              StringLike:
                AWS:SourceAccount: !Ref AWS::AccountId

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub ${ConfigBucket.Arn}/*
                Condition:
                  StringEquals:
                    s3:x-amz-acl: bucket-owner-full-control
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-${Environment}-ConfigRole
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda function to configure and start AWS Config once prerequisites are ready
  ConfigRecorderStarterRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: ConfigRecorderControl
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:PutConfigurationRecorder
                  - config:DeleteConfigurationRecorder
                  - config:PutDeliveryChannel
                  - config:DeleteDeliveryChannel
                  - config:StartConfigurationRecorder
                  - config:StopConfigurationRecorder
                  - config:DescribeConfigurationRecorderStatus
                  - config:DescribeDeliveryChannels
                  - config:DescribeConfigurationRecorders
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource: !GetAtt ConfigRole.Arn

  ConfigRecorderStarterFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${ProjectName}-${Environment}-ConfigStarter
      Handler: index.handler
      Runtime: python3.9
      Role: !GetAtt ConfigRecorderStarterRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import boto3
          import json
          import urllib.request
          import time

          def send_response(event, context, response_status, response_data):
              response_body = json.dumps({
                  'Status': response_status,
                  'Reason': f'See the details in CloudWatch Log Stream: {context.log_stream_name}',
                  'PhysicalResourceId': context.log_stream_name,
                  'StackId': event['StackId'],
                  'RequestId': event['RequestId'],
                  'LogicalResourceId': event['LogicalResourceId'],
                  'Data': response_data
              })
              
              response_url = event['ResponseURL']
              req = urllib.request.Request(response_url, data=response_body.encode('utf-8'), method='PUT')
              urllib.request.urlopen(req)

          config_client = boto3.client('config')

          def handler(event, context):
              try:
                  request_type = event['RequestType']
                  recorder_name = event['ResourceProperties']['ConfigRecorderName']
                  delivery_channel_name = event['ResourceProperties']['DeliveryChannelName']
                  role_arn = event['ResourceProperties']['ConfigRoleArn']
                  bucket_name = event['ResourceProperties']['ConfigBucketName']
                  sns_topic = event['ResourceProperties']['ConfigTopicArn']
                  
                  if request_type == 'Create' or request_type == 'Update':
                      # Create / update configuration recorder
                      config_client.put_configuration_recorder(
                          ConfigurationRecorder={
                              'name': recorder_name,
                              'roleARN': role_arn,
                              'recordingGroup': {
                                  'allSupported': True,
                                  'includeGlobalResourceTypes': True
                              }
                          }
                      )

                      # Create / update delivery channel
                      delivery_channel = {
                          'name': delivery_channel_name,
                          's3BucketName': bucket_name,
                          'configSnapshotDeliveryProperties': {
                              'deliveryFrequency': 'TwentyFour_Hours'
                          }
                      }
                      if sns_topic:
                          delivery_channel['snsTopicARN'] = sns_topic

                      config_client.put_delivery_channel(DeliveryChannel=delivery_channel)

                      # Wait for delivery channel to become available
                      for _ in range(12):
                          response = config_client.describe_delivery_channels()
                          if response.get('DeliveryChannels'):
                              break
                          time.sleep(5)
                      else:
                          raise Exception("Delivery channel not available after waiting")

                      # Start the configuration recorder
                      config_client.start_configuration_recorder(
                          ConfigurationRecorderName=recorder_name
                      )
                      print(f"Started Config Recorder: {recorder_name}")
                      send_response(event, context, 'SUCCESS', {})
                  
                  elif request_type == 'Delete':
                      # Stop the configuration recorder before deletion
                      try:
                          config_client.stop_configuration_recorder(
                              ConfigurationRecorderName=recorder_name
                          )
                          print(f"Stopped Config Recorder: {recorder_name}")
                      except:
                          pass  # Ignore errors on deletion

                      # Delete delivery channel
                      try:
                          config_client.delete_delivery_channel(
                              DeliveryChannelName=delivery_channel_name
                          )
                      except:
                          pass

                      # Delete configuration recorder
                      try:
                          config_client.delete_configuration_recorder(
                              ConfigurationRecorderName=recorder_name
                          )
                      except:
                          pass

                      send_response(event, context, 'SUCCESS', {})
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  send_response(event, context, 'FAILED', {
                      'Error': str(e)
                  })

  # Custom Resource to configure and start AWS Config after prerequisites are ready
  ConfigRecorderStarter:
    Type: AWS::CloudFormation::CustomResource
    DependsOn:
      - ConfigBucketPolicy
    Properties:
      ServiceToken: !GetAtt ConfigRecorderStarterFunction.Arn
      ConfigRecorderName: !Sub ${ProjectName}-${Environment}-Recorder
      DeliveryChannelName: !Sub ${ProjectName}-${Environment}-DeliveryChannel
      ConfigRoleArn: !GetAtt ConfigRole.Arn
      ConfigBucketName: !Ref ConfigBucket
      ConfigTopicArn: !Ref SNSTopic

  # Config Rules for compliance (only create after recorder is started)
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStarter
    Properties:
      ConfigRuleName: s3-bucket-encryption-enabled
      Description: Checks that S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  S3BucketVersioningRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStarter
    Properties:
      ConfigRuleName: s3-bucket-versioning-enabled
      Description: Checks that S3 buckets have versioning enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_VERSIONING_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStarter
    Condition: UseAZ2
    Properties:
      ConfigRuleName: rds-storage-encrypted
      Description: Checks that RDS instances have encrypted storage
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED
      Scope:
        ComplianceResourceTypes:
          - AWS::RDS::DBInstance

  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStarter
    Properties:
      ConfigRuleName: required-tags
      Description: Checks that resources have required tags for governance
      InputParameters: |
        {
          "tag1Key": "Environment",
          "tag2Key": "Project",
          "tag3Key": "Owner",
          "tag4Key": "CostCenter",
          "tag5Key": "iac-rlhf-amazon"
        }
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance
          - AWS::S3::Bucket

# ========
# OUTPUTS 
# ========
Outputs:
  VPCId:
    Description: VPC ID for network references
    Value: !Ref VPC
    Export:
      Name: !Sub ${ProjectName}-${Environment}-VPC

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PublicSubnet1

  PublicSubnet2Id:
    Condition: UseAZ2
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PublicSubnet2

  PublicSubnet3Id:
    Condition: UseAZ3
    Description: Public Subnet 3 ID
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PublicSubnet3

  PrivateAppSubnet1Id:
    Description: Private App Subnet 1 ID
    Value: !Ref PrivateAppSubnet1
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateAppSubnet1

  PrivateAppSubnet2Id:
    Condition: UseAZ2
    Description: Private App Subnet 2 ID
    Value: !Ref PrivateAppSubnet2
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateAppSubnet2

  PrivateAppSubnet3Id:
    Condition: UseAZ3
    Description: Private App Subnet 3 ID
    Value: !Ref PrivateAppSubnet3
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateAppSubnet3

  PrivateDBSubnet1Id:
    Description: Private DB Subnet 1 ID
    Value: !Ref PrivateDBSubnet1
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateDBSubnet1

  PrivateDBSubnet2Id:
    Condition: UseAZ2
    Description: Private DB Subnet 2 ID
    Value: !Ref PrivateDBSubnet2
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateDBSubnet2

  PrivateDBSubnet3Id:
    Condition: UseAZ3
    Description: Private DB Subnet 3 ID
    Value: !Ref PrivateDBSubnet3
    Export:
      Name: !Sub ${ProjectName}-${Environment}-PrivateDBSubnet3

  ALBDNSName:
    Condition: UseAZ2
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${ProjectName}-${Environment}-ALB-DNS

  ALBArn:
    Condition: UseAZ2
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub ${ProjectName}-${Environment}-ALB-ARN

  ALBHostedZone:
    Condition: UseAZ2
    Description: ALB Hosted Zone ID for Route53 alias records
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub ${ProjectName}-${Environment}-ALB-HostedZone

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${ProjectName}-${Environment}-ASG-Name

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub ${ProjectName}-${Environment}-LaunchTemplate-ID

  AuroraClusterEndpoint:
    Condition: UseAZ2
    Description: Aurora Cluster Writer Endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DB-Writer-Endpoint

  AuroraReaderEndpoint:
    Condition: UseAZ2
    Description: Aurora Cluster Reader Endpoint
    Value: !GetAtt AuroraCluster.ReadEndpoint.Address
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DB-Reader-Endpoint

  AuroraClusterPort:
    Condition: UseAZ2
    Description: Aurora Cluster Port
    Value: !GetAtt AuroraCluster.Endpoint.Port
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DB-Port

  ApplicationLogsBucketName:
    Description: Application Logs S3 Bucket Name
    Value: !Ref ApplicationLogsBucket
    Export:
      Name: !Sub ${ProjectName}-${Environment}-AppLogs-Bucket

  ApplicationLogsBucketArn:
    Description: Application Logs S3 Bucket ARN
    Value: !GetAtt ApplicationLogsBucket.Arn
    Export:
      Name: !Sub ${ProjectName}-${Environment}-AppLogs-Bucket-ARN

  DatabaseBackupBucketName:
    Description: Database Backup S3 Bucket Name
    Value: !Ref DatabaseBackupBucket
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DBBackup-Bucket

  DatabaseBackupBucketArn:
    Description: Database Backup S3 Bucket ARN
    Value: !GetAtt DatabaseBackupBucket.Arn
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DBBackup-Bucket-ARN

  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${ProjectName}-${Environment}-ALB-SG

  ApplicationSecurityGroupId:
    Description: Application Security Group ID
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub ${ProjectName}-${Environment}-App-SG

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${ProjectName}-${Environment}-DB-SG

  SNSTopicArn:
    Description: SNS Topic ARN for Alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${ProjectName}-${Environment}-SNS-Topic

  ConfigBucketName:
    Description: AWS Config Bucket Name
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub ${ProjectName}-${Environment}-Config-Bucket

  DBKMSKeyId:
    Description: RDS KMS Key ID
    Value: !Ref DBKMSKey
    Export:
      Name: !Sub ${ProjectName}-${Environment}-RDS-KMS-Key

  S3KMSKeyId:
    Description: S3 KMS Key ID
    Value: !Ref S3KMSKey
    Export:
      Name: !Sub ${ProjectName}-${Environment}-S3-KMS-Key

  DeploymentNotes:
    Description: Important deployment information
    Value: !Sub |
      Stack deployed with ${NumberOfAvailabilityZones} AZ(s)
      ${ProjectName} ${Environment} Infrastructure Deployment
    Export:
      Name: !Sub ${ProjectName}-${Environment}-Notes
```