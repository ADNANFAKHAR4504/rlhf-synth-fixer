```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Meridian Financial Services - Production-Grade Containerized Transaction Processing Infrastructure with Multi-Region Support'

# ==================== METADATA ====================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentName
      - Label:
          default: 'Application Configuration'
        Parameters:
          - ContainerImage
          - ContainerRegistryURL
          - DeployECSService
          - DomainName
          - CertificateArn
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DatabaseMasterUsername
          - DatabaseInstanceClass
      - Label:
          default: 'Compliance and Tagging'
        Parameters:
          - CostCenter
          - DataClassification
          - LogRetentionYears
      - Label:
          default: 'Backup and DR Configuration'
        Parameters:
          - BackupAccountId
          - BackupVaultName
      - Label:
          default: 'Alerting Configuration'
        Parameters:
          - DevOpsEmailAddress

# ==================== PARAMETERS ====================
Parameters:
  EnvironmentName:
    Type: String
    Default: 'production'
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name for resource tagging and configuration

  CostCenter:
    Type: String
    Default: 'FIN-TECH-001'
    Description: Cost center code for billing allocation

  DataClassification:
    Type: String
    Default: 'Highly-Confidential'
    AllowedValues:
      - Public
      - Internal
      - Confidential
      - Highly-Confidential
    Description: Data classification level for compliance

  DevOpsEmailAddress:
    Type: String
    Default: 'devops@meridianfinancial.com'
    Description: Email address for operational alerts
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  BackupAccountId:
    Type: String
    Description: AWS Account ID for cross-account backup replication
    AllowedPattern: '^[0-9]{12}$'
    Default: '123456789012'  # Update with actual backup account ID

  BackupVaultName:
    Type: String
    Default: 'meridian-dr-vault'
    Description: Name of the backup vault in DR account

  LambdaLayerS3Bucket:
    Type: String
    Default: ''
    Description: 'S3 bucket containing psycopg2 Lambda layer (leave empty to skip layer)'

  LambdaLayerS3Key:
    Type: String
    Default: 'psycopg2-py39.zip'
    Description: S3 key for psycopg2 Lambda layer

  ContainerImage:
    Type: String
    Default: 'transaction-processor'
    Description: Container image name (without registry URL and tag)

  ContainerRegistryURL:
    Type: String
    Default: ''
    Description: 'ECR registry URL (leave empty to use default AccountId.dkr.ecr.Region.amazonaws.com)'

  DomainName:
    Type: String
    Default: 'app.meridianfinancial.com'
    Description: Domain name for the application

  CertificateArn:
    Type: String
    Default: ''
    Description: 'ACM Certificate ARN (leave empty to create new, or set to skip certificate)'

  CreateSSLCertificate:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Set to true to create SSL certificate for dummy domain (requires domain validation)'

  DeployECSService:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Deploy ECS Service. Set to true ONLY after container image has been pushed to ECR. The template does not create container images - only the infrastructure to run them.'

  DatabaseMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: Master username for Aurora PostgreSQL
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DatabaseInstanceClass:
    Type: String
    Default: 'db.r6g.xlarge'
    Description: Database instance class
    AllowedValues:
      - db.r6g.large
      - db.r6g.xlarge
      - db.r6g.2xlarge
      - db.r6g.4xlarge

  LogRetentionYears:
    Type: Number
    Default: 7
    Description: Number of years to retain logs for compliance
    MinValue: 1
    MaxValue: 10

# ==================== MAPPINGS ====================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PublicSubnet3:
      CIDR: '10.0.3.0/24'
    PrivateSubnet1:
      CIDR: '10.0.11.0/24'
    PrivateSubnet2:
      CIDR: '10.0.12.0/24'
    PrivateSubnet3:
      CIDR: '10.0.13.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.21.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.22.0/24'
    DatabaseSubnet3:
      CIDR: '10.0.23.0/24'

# ==================== CONDITIONS ====================
Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, 'production']
  CreateCertificate: !And
    - !Equals [!Ref CertificateArn, '']
    - !Equals [!Ref CreateSSLCertificate, 'true']
  HasCertificate: !Or
    - !Equals [!Ref CreateSSLCertificate, 'true']
    - !Not [!Equals [!Ref CertificateArn, '']]
  UseDefaultECR: !Equals [!Ref ContainerRegistryURL, '']
  HasBackupAccount: !Not [!Equals [!Ref BackupAccountId, '123456789012']]
  HasLambdaLayer: !Not [!Equals [!Ref LambdaLayerS3Bucket, '']]
  ShouldDeployECS: !Equals [!Ref DeployECSService, 'true']

# ==================== RESOURCES ====================
Resources:
  # ==================== ECR Repository ====================
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Ref ContainerImage
      ImageScanningConfiguration:
        ScanOnPush: true
      ImageTagMutability: MUTABLE
      EncryptionConfiguration:
        EncryptionType: AES256
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                  "tagStatus": "any",
                  "countType": "imageCountMoreThan",
                  "countNumber": 10
                },
                "action": {
                  "type": "expire"
                }
              }
            ]
          }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== KMS Keys ====================
  CloudWatchLogsKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Customer managed KMS key for CloudWatch Logs encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: iac-rlhf-amazon
          Value: 'true'

  CloudWatchLogsKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/meridian-cloudwatch-logs-${EnvironmentName}'
      TargetKeyId: !Ref CloudWatchLogsKMSKey

  # ==================== SSL/TLS Certificate ====================
  ApplicationCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: CreateCertificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: DNS
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== NETWORKING ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-meridian-vpc'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # VPC Flow Logs for compliance
  VPCFlowLogsRole:
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
                Resource: '*'
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Sub '/aws/vpc/flowlogs/${EnvironmentName}'
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-meridian-igw'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
          Value: !Sub '${EnvironmentName}-public-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Public'
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
          Value: !Sub '${EnvironmentName}-public-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Public'
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
          Value: !Sub '${EnvironmentName}-public-subnet-az3'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Public'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private Subnets for ECS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-ECS'
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
          Value: !Sub '${EnvironmentName}-private-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-ECS'
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
          Value: !Sub '${EnvironmentName}-private-subnet-az3'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-ECS'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Database Subnets (separate from application tier)
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-database-subnet-az1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-Database'
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-database-subnet-az2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-Database'
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet3, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-database-subnet-az3'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private-Database'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # NAT Gateways and Elastic IPs
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip-az1'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip-az2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip-az3'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-gateway-az1'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-gateway-az2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-gateway-az3'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-routes'
        - Key: iac-rlhf-amazon
          Value: 'true'

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
          Value: !Sub '${EnvironmentName}-private-routes-az1'
        - Key: iac-rlhf-amazon
          Value: 'true'

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
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-routes-az2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

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
          Value: !Sub '${EnvironmentName}-private-routes-az3'
        - Key: iac-rlhf-amazon
          Value: 'true'

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Database Route Table Associations
  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref DatabaseSubnet1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref DatabaseSubnet2

  DatabaseSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref DatabaseSubnet3

  # ==================== VPC ENDPOINTS (Cost Optimization) ====================
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3

  ECRApiVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.api'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  ECRDkrVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ecr.dkr'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  SecretsManagerVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.secretsmanager'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  CloudWatchLogsVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # ==================== SECURITY GROUPS ====================
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: HTTPS from ECS tasks
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpce-sg'
        - Key: iac-rlhf-amazon
          Value: 'true'

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
          Description: HTTPS from Internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from Internet (redirect to HTTPS)
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-alb-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Traffic from ALB
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ecs-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Aurora PostgreSQL
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: PostgreSQL from ECS tasks
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: PostgreSQL from Lambda rotation function
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-database-sg'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-lambda-sg'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== SECRETS MANAGER ====================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-meridian-db-credentials'
      Description: Aurora PostgreSQL database credentials
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId: !Ref SecretsManagerKMSKey
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: iac-rlhf-amazon
          Value: 'true'

  SecretsManagerKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Secrets Manager encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Secrets Manager
            Effect: Allow
            Principal:
              Service: secretsmanager.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecretRotation:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn: 
      - DatabaseSecretAttachment
      - AuroraPrimaryInstance
    Properties:
      SecretId: !Ref DatabaseSecret
      RotationLambdaARN: !GetAtt DatabaseSecretRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # Production-ready rotation Lambda
  DatabaseSecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-db-secret-rotation'
      PackageType: Zip
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt DatabaseSecretRotationRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Code:
        ZipFile: |
          import boto3
          import json
          import logging
          import os
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def handler(event, context):
              """Secrets Manager RDS PostgreSQL rotation handler"""
              arn = event['SecretId']
              token = event['Token']
              step = event['Step']
              
              # Setup clients
              sm_client = boto3.client('secretsmanager')
              
              metadata = sm_client.describe_secret(SecretId=arn)
              
              if step == "createSecret":
                  create_secret(sm_client, arn, token)
              elif step == "setSecret":
                  set_secret(sm_client, arn, token)
              elif step == "testSecret":
                  test_secret(sm_client, arn, token)
              elif step == "finishSecret":
                  finish_secret(sm_client, arn, token)
              else:
                  logger.error(f"Unknown step: {step}")
                  raise ValueError(f"Unknown step: {step}")
              
              return {"statusCode": 200}
          
          def create_secret(sm_client, arn, token):
              """Create a new secret version"""
              try:
                  sm_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
                  logger.info("createSecret: Secret version already exists")
              except sm_client.exceptions.ResourceNotFoundException:
                  # Get current secret
                  current = sm_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
                  secret = json.loads(current['SecretString'])
                  
                  # Generate new password
                  response = sm_client.get_random_password(
                      PasswordLength=32,
                      ExcludeCharacters='"@/\\'
                  )
                  secret['password'] = response['RandomPassword']
                  
                  # Store new version
                  sm_client.put_secret_value(
                      SecretId=arn,
                      ClientRequestToken=token,
                      SecretString=json.dumps(secret),
                      VersionStages=['AWSPENDING']
                  )
                  logger.info("createSecret: Successfully created new secret version")
          
          def set_secret(sm_client, arn, token):
              """Set the pending secret in the database"""
              import psycopg2
              
              # Get pending secret
              pending = sm_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
              pending_dict = json.loads(pending['SecretString'])
              
              # Get current secret for connection
              current = sm_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
              current_dict = json.loads(current['SecretString'])
              
              # Update password in database
              try:
                  conn = psycopg2.connect(
                      host=current_dict['host'],
                      port=current_dict.get('port', 5432),
                      database=current_dict.get('dbname', 'postgres'),
                      user=current_dict['username'],
                      password=current_dict['password']
                  )
                  
                  with conn.cursor() as cursor:
                      cursor.execute(
                          f"ALTER USER {pending_dict['username']} WITH PASSWORD %s",
                          (pending_dict['password'],)
                      )
                  conn.commit()
                  conn.close()
                  logger.info("setSecret: Successfully set password in database")
              except Exception as e:
                  logger.error(f"setSecret: Failed to set password: {str(e)}")
                  raise
          
          def test_secret(sm_client, arn, token):
              """Test the pending secret"""
              import psycopg2
              
              # Get pending secret
              pending = sm_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
              pending_dict = json.loads(pending['SecretString'])
              
              # Test connection
              try:
                  conn = psycopg2.connect(
                      host=pending_dict['host'],
                      port=pending_dict.get('port', 5432),
                      database=pending_dict.get('dbname', 'postgres'),
                      user=pending_dict['username'],
                      password=pending_dict['password']
                  )
                  conn.close()
                  logger.info("testSecret: Successfully tested new password")
              except Exception as e:
                  logger.error(f"testSecret: Failed to connect with new password: {str(e)}")
                  raise
          
          def finish_secret(sm_client, arn, token):
              """Finish the rotation by updating version stages"""
              metadata = sm_client.describe_secret(SecretId=arn)
              
              for version in metadata.get('VersionIdsToStages', {}):
                  if "AWSCURRENT" in metadata['VersionIdsToStages'][version]:
                      if version == token:
                          logger.info("finishSecret: Version already current")
                          return
                      
                      # Move staging labels
                      sm_client.update_secret_version_stage(
                          SecretId=arn,
                          VersionStage="AWSCURRENT",
                          MoveToVersionId=token,
                          RemoveFromVersionId=version
                      )
                      logger.info("finishSecret: Successfully updated secret version")
                      return
      Layers: !If
        - HasLambdaLayer
        - [!Ref DatabaseRotationLambdaLayer]
        - !Ref AWS::NoValue
      Environment:
        Variables:
          SECRETS_MANAGER_ENDPOINT: !Sub 'https://secretsmanager.${AWS::Region}.amazonaws.com'
      Timeout: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda Layer for psycopg2
  DatabaseRotationLambdaLayer:
    Type: AWS::Lambda::LayerVersion
    Condition: HasLambdaLayer
    Properties:
      LayerName: !Sub '${EnvironmentName}-psycopg2-layer'
      Description: PostgreSQL client library for Python
      Content:
        S3Bucket: !Ref LambdaLayerS3Bucket
        S3Key: !Ref LambdaLayerS3Key
      CompatibleRuntimes:
        - python3.9

  DatabaseSecretRotationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: SecretRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                  - 'secretsmanager:GetRandomPassword'
                Resource: !Ref DatabaseSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt SecretsManagerKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecretRotationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DatabaseSecretRotationLambda
      Action: 'lambda:InvokeFunction'
      Principal: secretsmanager.amazonaws.com

  DatabaseSecretAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref AuroraCluster
      TargetType: AWS::RDS::DBCluster

  # ==================== AURORA DATABASE ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-aurora-subnet-group'
      DBSubnetGroupDescription: Subnet group for Aurora PostgreSQL
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
        - !Ref DatabaseSubnet3
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Custom cluster parameter group for Aurora PostgreSQL
      Family: aurora-postgresql14
      Parameters:
        shared_preload_libraries: 'pg_stat_statements,pgaudit'
        log_statement: 'all'
        log_min_duration_statement: 1000
        pgaudit.log: 'ALL'
        pgaudit.log_catalog: 'on'
        pgaudit.log_level: 'log'
        pgaudit.log_parameter: 'on'
        pgaudit.log_relation: 'on'
        pgaudit.log_statement_once: 'on'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Custom parameter group for Aurora PostgreSQL instances
      Family: aurora-postgresql14
      Parameters:
        max_connections: !If [IsProduction, '1000', '500']
        shared_buffers: !If [IsProduction, '2097152', '1048576']  # 16GB/8GB in 8KB pages
        effective_cache_size: !If [IsProduction, '6291456', '3145728']  # 48GB/24GB in 8KB pages
        work_mem: !If [IsProduction, '16384', '8192']  # 128MB/64MB in KB
        maintenance_work_mem: !If [IsProduction, '524288', '262144']  # 4GB/2GB in KB
        random_page_cost: '1.1'
        default_statistics_target: '100'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      EngineVersion: '14.6'
      DBClusterIdentifier: !Sub '${EnvironmentName}-meridian-aurora-cluster'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DatabaseName: meridian_transactions
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
      DeletionProtection: false
      EnableIAMDatabaseAuthentication: true
      CopyTagsToSnapshot: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Aurora database encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraPrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-meridian-aurora-primary'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !Ref DatabaseInstanceClass
      Engine: aurora-postgresql
      DBParameterGroupName: !Ref DBParameterGroup
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      PerformanceInsightsRetentionPeriod: !If [IsProduction, 731, 7]  # 2 years for prod
      PerformanceInsightsKMSKeyId: !Ref DatabaseKMSKey
      EnablePerformanceInsights: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  AuroraSecondaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-meridian-aurora-secondary'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !Ref DatabaseInstanceClass
      Engine: aurora-postgresql
      DBParameterGroupName: !Ref DBParameterGroup
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      PerformanceInsightsRetentionPeriod: !If [IsProduction, 731, 7]
      PerformanceInsightsKMSKeyId: !Ref DatabaseKMSKey
      EnablePerformanceInsights: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  EnhancedMonitoringRole:
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== BACKUP AND DR ====================
  BackupReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-backup-replication-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: 'sts:AssumeRole'
          - !If
            - HasBackupAccount
            - Effect: Allow
              Principal:
                AWS: !Sub 'arn:aws:iam::${BackupAccountId}:root'
              Action: 'sts:AssumeRole'
              Condition:
                StringEquals:
                  'sts:ExternalId': !Sub '${EnvironmentName}-backup-replication'
            - !Ref AWS::NoValue
      Policies:
        - PolicyName: BackupReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:CreateDBSnapshot'
                  - 'rds:CopyDBSnapshot'
                  - 'rds:DescribeDBSnapshots'
                  - 'rds:ModifyDBSnapshotAttribute'
                  - 'rds:CopyDBClusterSnapshot'
                  - 'rds:CreateDBClusterSnapshot'
                  - 'rds:DescribeDBClusterSnapshots'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kms:CreateGrant'
                  - 'kms:DescribeKey'
                Resource: !GetAtt BackupKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${EnvironmentName}-meridian-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 2 * * ? *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              MoveToColdStorageAfterDays: !If [IsProduction, 30, 7]
              DeleteAfterDays: !If [IsProduction, 365, 120]
            RecoveryPointTags:
              Environment: !Ref EnvironmentName
              DataClassification: !Ref DataClassification
            CopyActions:
              - DestinationBackupVaultArn: !Sub 'arn:aws:backup:${AWS::Region}:${BackupAccountId}:backup-vault:${BackupVaultName}'
                Lifecycle:
                  MoveToColdStorageAfterDays: 7
                  DeleteAfterDays: 2555  # 7 years in days (7*365, ensures >90 days after MoveToColdStorage)
          - RuleName: WeeklyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 3 ? * 1 *)'  # Weekly on Monday
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              MoveToColdStorageAfterDays: !If [IsProduction, 90, 30]
              DeleteAfterDays: !If [IsProduction, 730, 180]
            RecoveryPointTags:
              Environment: !Ref EnvironmentName
              BackupType: 'Weekly'
      BackupPlanTags:
        Environment: !Ref EnvironmentName
        iac-rlhf-amazon: 'true'

  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${EnvironmentName}-meridian-backup-vault'
      EncryptionKeyArn: !GetAtt BackupKMSKey.Arn
      BackupVaultTags:
        Environment: !Ref EnvironmentName
        DataClassification: !Ref DataClassification
        iac-rlhf-amazon: 'true'

  BackupKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for AWS Backup encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow AWS Backup
            Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action:
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - !If
            - HasBackupAccount
            - Sid: Allow cross-account access
              Effect: Allow
              Principal:
                AWS: !Sub 'arn:aws:iam::${BackupAccountId}:root'
              Action:
                - 'kms:Decrypt'
                - 'kms:DescribeKey'
              Resource: '*'
            - !Ref AWS::NoValue
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${EnvironmentName}-aurora-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}'
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: DataClassification
            ConditionValue: !Ref DataClassification

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== ECS CLUSTER AND SERVICES ====================
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${EnvironmentName}-meridian-cluster'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Configuration:
        ExecuteCommandConfiguration:
          Logging: OVERRIDE
          LogConfiguration:
            CloudWatchLogGroupName: !Ref ECSLogGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/${EnvironmentName}-meridian'
      RetentionInDays: !Ref LogRetentionYears  # Dynamic retention
      KmsKeyId: !GetAtt CloudWatchLogsKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: iac-rlhf-amazon
          Value: 'true'

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-ecs-task-execution-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: SecretAndRegistryAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: 
                  - !GetAtt SecretsManagerKMSKey.Arn
                  - !GetAtt CloudWatchLogsKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'ecr:GetAuthorizationToken'
                  - 'ecr:BatchCheckLayerAvailability'
                  - 'ecr:GetDownloadUrlForLayer'
                  - 'ecr:BatchGetImage'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-ecs-task-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: TaskPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt SecretsManagerKMSKey.Arn
                  - !GetAtt CloudWatchLogsKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ECSLogGroup.Arn
              - Effect: Allow
                Action:
                  - 'xray:PutTraceSegments'
                  - 'xray:PutTelemetryRecords'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'ssmmessages:CreateControlChannel'
                  - 'ssmmessages:CreateDataChannel'
                  - 'ssmmessages:OpenControlChannel'
                  - 'ssmmessages:OpenDataChannel'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub '${EnvironmentName}-meridian-task'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '2048'  # 2 vCPU
      Memory: '4096'  # 4 GB
      ExecutionRoleArn: !Ref ECSTaskExecutionRole
      TaskRoleArn: !Ref ECSTaskRole
      ContainerDefinitions:
        - Name: transaction-processor
          Image: !If
            - UseDefaultECR
            - !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ContainerImage}:latest'
            - !Sub '${ContainerRegistryURL}/${ContainerImage}:latest'
          Essential: true
          User: '1000:1000'  # Non-root user
          LinuxParameters:
            InitProcessEnabled: true
          PortMappings:
            - ContainerPort: 8080
              Protocol: tcp
          Environment:
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentName
            - Name: DB_HOST
              Value: !GetAtt AuroraCluster.Endpoint.Address
            - Name: DB_PORT
              Value: '5432'
            - Name: DB_NAME
              Value: meridian_transactions
            - Name: AWS_REGION
              Value: !Ref AWS::Region
            - Name: LOG_LEVEL
              Value: !If [IsProduction, 'INFO', 'DEBUG']
            - Name: STARTUP_DELAY_SECONDS
              Value: '30'
          Secrets:
            - Name: DB_USERNAME
              ValueFrom: !Sub '${DatabaseSecret}:username::'
            - Name: DB_PASSWORD
              ValueFrom: !Sub '${DatabaseSecret}:password::'
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          StopTimeout: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== APPLICATION LOAD BALANCER ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: ALBAccessLogsBucketPolicy
    Properties:
      Name: !Sub '${EnvironmentName}-meridian-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBAccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: !Sub '${EnvironmentName}/alb'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBAccessLogsBucket:
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
          - Id: DeleteOldAccessLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowALBAccessLogs
            Effect: Allow
            Principal:
              Service:
                - 'delivery.logs.amazonaws.com'
                - 'logdelivery.elasticloadbalancing.amazonaws.com'
            Action:
              - 's3:PutObject'
            Resource: !Sub '${ALBAccessLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'aws:SourceAccount': !Ref AWS::AccountId
          - Sid: AllowALBBucketCheck
            Effect: Allow
            Principal:
              Service:
                - 'delivery.logs.amazonaws.com'
                - 'logdelivery.elasticloadbalancing.amazonaws.com'
            Action:
              - 's3:GetBucketAcl'
              - 's3:PutBucketAcl'
            Resource: !GetAtt ALBAccessLogsBucket.Arn
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-meridian-tg'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200-299'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
        - Key: load_balancing.algorithm.type
          Value: least_outstanding_requests
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Blue-Green Target Group for deployments
  ALBTargetGroupBlueGreen:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-meridian-tg-bg'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200-299'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: BlueGreenDeployment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # HTTP Listener
  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions: !If
        - HasCertificate
        - - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: '443'
              StatusCode: HTTP_301
        - - Type: forward
            TargetGroupArn: !Ref ALBTargetGroup

  # HTTPS Listener (only if certificate is available)
  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasCertificate
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !If 
          - CreateCertificate
          - !Ref ApplicationCertificate
          - !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Listener Rule for Blue-Green deployments
  ALBListenerRuleBlueGreen:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Condition: HasCertificate
    Properties:
      ListenerArn: !Ref ALBListenerHTTPS
      Priority: 100
      Conditions:
        - Field: http-header
          HttpHeaderConfig:
            HttpHeaderName: X-Deployment-Version
            Values:
              - blue-green-test
      Actions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroupBlueGreen
        
  ECSService:
    Type: AWS::ECS::Service
    Condition: ShouldDeployECS
    DependsOn: 
      - ALBListenerHTTP
      - AuroraPrimaryInstance
      - ECRApiVPCEndpoint
      - ECRDkrVPCEndpoint
      - CloudWatchLogsVPCEndpoint
      - SecretsManagerVPCEndpoint
    Properties:
      ServiceName: !Sub '${EnvironmentName}-meridian-service'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: !If [IsProduction, 3, 2]
      LaunchType: FARGATE
      PlatformVersion: LATEST
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
      LoadBalancers:
        - ContainerName: transaction-processor
          ContainerPort: 8080
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 180
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 50
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true
      DeploymentController:
        Type: ECS
      EnableECSManagedTags: true
      EnableExecuteCommand: true
      PropagateTags: SERVICE
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== AUTO SCALING ====================
  ServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Condition: ShouldDeployECS
    Properties:
      MaxCapacity: !If [IsProduction, 20, 10]
      MinCapacity: !If [IsProduction, 3, 2]
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !GetAtt AutoScalingRole.Arn
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ServiceScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Condition: ShouldDeployECS
    Properties:
      PolicyName: !Sub '${EnvironmentName}-cpu-scaling-policy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  ServiceScalingPolicyMemory:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Condition: ShouldDeployECS
    Properties:
      PolicyName: !Sub '${EnvironmentName}-memory-scaling-policy'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization
        TargetValue: 75.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  AutoScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: AutoScalingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ecs:DescribeServices'
                  - 'ecs:UpdateService'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricAlarm'
                  - 'cloudwatch:DescribeAlarms'
                  - 'cloudwatch:DeleteAlarms'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== MONITORING AND ALERTING ====================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentName}-meridian-ops-alerts'
      DisplayName: Meridian Operational Alerts
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SNSTopic
      Endpoint: !Ref DevOpsEmailAddress

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${EnvironmentName}-meridian-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
                  [".", "MemoryUtilization", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ECS Resource Utilization"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                  [".", "RequestCount", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ALB Performance"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                  [".", "CPUUtilization", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Aurora Database Metrics"
              }
            }
          ]
        }

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: ShouldDeployECS
    Properties:
      AlarmName: !Sub '${EnvironmentName}-ecs-high-cpu'
      AlarmDescription: Alarm when ECS service CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !GetAtt ECSService.Name
        - Name: ClusterName
          Value: !Ref ECSCluster
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-aurora-high-connections'
      AlarmDescription: Alarm when database connections exceed threshold
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsProduction, 900, 450]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster
      AlarmActions:
        - !Ref SNSTopic

  ALBUnhealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-alb-unhealthy-hosts'
      AlarmDescription: Alarm when target group has unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic

  # ==================== ROLLBACK TRIGGERS ====================
  RollbackAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: ShouldDeployECS
    Properties:
      AlarmName: !Sub '${EnvironmentName}-stack-rollback-trigger'
      AlarmDescription: Triggers CloudFormation stack rollback on critical failures
      MetricName: HealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Minimum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      TreatMissingData: breaching

# ==================== OUTPUTS ====================
Outputs:
  # VPC and Networking Outputs
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-vpc-id'

  VPCCidrBlock:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${EnvironmentName}-vpc-cidr'

  PublicSubnetIds:
    Description: Comma-delimited list of public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${EnvironmentName}-public-subnet-ids'

  PrivateSubnetIds:
    Description: Comma-delimited list of private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${EnvironmentName}-private-subnet-ids'

  DatabaseSubnetIds:
    Description: Comma-delimited list of database subnet IDs
    Value: !Join [',', [!Ref DatabaseSubnet1, !Ref DatabaseSubnet2, !Ref DatabaseSubnet3]]
    Export:
      Name: !Sub '${EnvironmentName}-database-subnet-ids'

  # ECR Repository Output
  ECRRepositoryURI:
    Description: ECR Repository URI
    Value: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}'
    Export:
      Name: !Sub '${EnvironmentName}-ecr-repository-uri'

  # Load Balancer Outputs
  LoadBalancerURL:
    Description: Application Load Balancer URL
    Value: !If
      - HasCertificate
      - !Sub 'https://${ApplicationLoadBalancer.DNSName}'
      - !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${EnvironmentName}-alb-url'

  LoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${EnvironmentName}-alb-arn'

  LoadBalancerDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-alb-dns'

  LoadBalancerZoneId:
    Description: Application Load Balancer Canonical Hosted Zone ID
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${EnvironmentName}-alb-zone-id'

  # ECS Outputs
  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${EnvironmentName}-ecs-cluster'

  ECSClusterArn:
    Description: ECS Cluster ARN
    Value: !GetAtt ECSCluster.Arn
    Export:
      Name: !Sub '${EnvironmentName}-ecs-cluster-arn'

  ECSServiceName:
    Condition: ShouldDeployECS
    Description: ECS Service Name
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub '${EnvironmentName}-ecs-service-name'

  ECSServiceArn:
    Condition: ShouldDeployECS
    Description: ECS Service ARN
    Value: !Ref ECSService
    Export:
      Name: !Sub '${EnvironmentName}-ecs-service-arn'

  TaskDefinitionArn:
    Description: ECS Task Definition ARN
    Value: !Ref TaskDefinition
    Export:
      Name: !Sub '${EnvironmentName}-task-definition-arn'

  # Database Outputs
  DatabaseEndpoint:
    Description: Aurora Cluster Write Endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-db-endpoint'

  DatabaseReadEndpoint:
    Description: Aurora Cluster Read Endpoint
    Value: !GetAtt AuroraCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-db-read-endpoint'

  DatabasePort:
    Description: Aurora Cluster Port
    Value: !GetAtt AuroraCluster.Endpoint.Port
    Export:
      Name: !Sub '${EnvironmentName}-db-port'

  DatabaseSecretArn:
    Description: Database Secret ARN
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${EnvironmentName}-db-secret'

  DatabaseName:
    Description: Database Name
    Value: meridian_transactions
    Export:
      Name: !Sub '${EnvironmentName}-db-name'

  # Security Groups
  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-alb-sg'

  ECSSecurityGroupId:
    Description: ECS Security Group ID
    Value: !Ref ECSSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-ecs-sg'

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-db-sg'

  # Monitoring Outputs
  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${EnvironmentName}-sns-topic'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${EnvironmentName}-meridian-dashboard'
    Export:
      Name: !Sub '${EnvironmentName}-dashboard-url'

  # Target Groups for Blue-Green Deployments
  ALBTargetGroupArn:
    Description: Primary Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${EnvironmentName}-tg-arn'

  ALBTargetGroupBlueGreenArn:
    Description: Blue-Green Target Group ARN
    Value: !Ref ALBTargetGroupBlueGreen
    Export:
      Name: !Sub '${EnvironmentName}-tg-bg-arn'

  # Backup and DR Outputs
  BackupVaultArn:
    Description: Backup Vault ARN
    Value: !GetAtt BackupVault.BackupVaultArn
    Export:
      Name: !Sub '${EnvironmentName}-backup-vault-arn'

  BackupPlanId:
    Description: Backup Plan ID
    Value: !Ref BackupPlan
    Export:
      Name: !Sub '${EnvironmentName}-backup-plan-id'

  BackupVaultName:
    Description: Backup Vault Name
    Value: !Sub '${EnvironmentName}-meridian-backup-vault'
    Export:
      Name: !Sub '${EnvironmentName}-backup-vault-name'

  BackupRoleArn:
    Description: Backup Role ARN
    Value: !GetAtt BackupRole.Arn
    Export:
      Name: !Sub '${EnvironmentName}-backup-role-arn'

  # Log Groups
  ECSLogGroupArn:
    Description: ECS CloudWatch Log Group ARN
    Value: !GetAtt ECSLogGroup.Arn
    Export:
      Name: !Sub '${EnvironmentName}-ecs-log-group-arn'

  # KMS Keys
  CloudWatchLogsKMSKeyArn:
    Description: CloudWatch Logs KMS Key ARN
    Value: !GetAtt CloudWatchLogsKMSKey.Arn
    Export:
      Name: !Sub '${EnvironmentName}-logs-kms-key'

  DatabaseKMSKeyArn:
    Description: Database KMS Key ARN
    Value: !GetAtt DatabaseKMSKey.Arn
    Export:
      Name: !Sub '${EnvironmentName}-db-kms-key'
```