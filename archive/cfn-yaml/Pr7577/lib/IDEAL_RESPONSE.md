```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-grade web application infrastructure with multi-tier architecture, high availability, and comprehensive security - Production Ready'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - VPCCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: "Application Configuration"
        Parameters:
          - InstanceType
          - KeyPairName
          - MinSize
          - MaxSize
          - DesiredCapacity
          - TargetCPUUtilization
          - LatestAmiId
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBUsername
          - DBAllocatedStorage
          - DBBackupRetentionPeriod
      - Label:
          default: "Security Configuration"
        Parameters:
          - AllowedIPRange
          - EnableHTTPS
          - CertificateArn
          - EnableSessionManager
      - Label:
          default: "Monitoring & Logging"
        Parameters:
          - EnableDetailedMonitoring
          - LogRetentionDays
      - Label:
          default: "Cost Optimization"
        Parameters:
          - UseNATInstance
          - EnableSpotInstances
          - SpotMaxPrice

Parameters:
  # Network Parameters
  VPCCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for public subnet 1

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for public subnet 2

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.10.0/24'
    Description: CIDR block for private subnet 1

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: CIDR block for private subnet 2

  # Application Parameters
  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
      - m5a.large
      - m5a.xlarge
    Description: EC2 instance type for application servers

  KeyPairName:
    Type: String
    Description: EC2 Key Pair for SSH access (leave empty for Session Manager only access)
    Default: ''

  MinSize:
    Type: Number
    Default: 2
    MinValue: 1
    Description: Minimum number of EC2 instances in Auto Scaling group

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    Description: Maximum number of EC2 instances in Auto Scaling group

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 1
    Description: Desired number of EC2 instances in Auto Scaling group

  TargetCPUUtilization:
    Type: Number
    Default: 70
    MinValue: 10
    MaxValue: 90
    Description: Target CPU utilization percentage for auto scaling

  # Use AWS Systems Manager Parameter Store for latest AMI - Region Agnostic
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID from Systems Manager Parameter Store

  # Database Parameters
  DBInstanceClass:
    Type: String
    Default: db.t3.small
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge
      - db.r5.large
      - db.r5.xlarge
    Description: Database instance class

  DBUsername:
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database master username
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 1000
    Description: Allocated storage for database (GB)

  DBBackupRetentionPeriod:
    Type: Number
    Default: 7
    MinValue: 1
    MaxValue: 35
    Description: Database backup retention period in days

  # Security Parameters
  AllowedIPRange:
    Type: String
    Default: '10.0.0.0/8'  # More restrictive default for production
    Description: IP range allowed to access the application (CIDR notation) - Default is private IP range only
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  EnableHTTPS:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable HTTPS listener on ALB (requires valid ACM certificate)

  CertificateArn:
    Type: String
    Default: ''
    Description: ARN of ACM certificate for HTTPS (required if EnableHTTPS is true)

  EnableSessionManager:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable AWS Systems Manager Session Manager for secure instance access

  # Monitoring Parameters
  EnableDetailedMonitoring:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable detailed CloudWatch monitoring for EC2 instances

  LogRetentionDays:
    Type: Number
    Default: 30
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    Description: CloudWatch Logs retention period in days

  # Cost Optimization Parameters
  UseNATInstance:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Use NAT instances instead of NAT Gateways for cost optimization

  EnableSpotInstances:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable Spot instances in Auto Scaling group for cost optimization

  SpotMaxPrice:
    Type: String
    Default: ''
    Description: Maximum price for Spot instances (leave empty for on-demand price)

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  EnableHTTPSCondition: !Equals [!Ref EnableHTTPS, 'true']
  EnableSessionManagerCondition: !Equals [!Ref EnableSessionManager, 'true']
  UseNATInstanceCondition: !Equals [!Ref UseNATInstance, 'true']
  UseNATGatewayCondition: !Not [!Condition UseNATInstanceCondition]
  EnableSpotInstancesCondition: !Equals [!Ref EnableSpotInstances, 'true']
  HasSpotMaxPrice: !Not [!Equals [!Ref SpotMaxPrice, '']]

Resources:
  # ========================================
  # NETWORK INFRASTRUCTURE
  # ========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: webapp-prod-vpc
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Environment
          Value: prod
        - Key: Project
          Value: webapp

  # VPC Flow Logs for network monitoring
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
        - PolicyName: webapp-prod-vpc-flow-log-policy
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

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}-flow-logs'
      RetentionInDays: !Ref LogRetentionDays

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
          Value: webapp-prod-vpc-flow-log
        - Key: iac-rlhf-amazon
          Value: 'true'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: webapp-prod-igw
        - Key: iac-rlhf-amazon
          Value: 'true'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-prod-public-subnet-1
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-prod-public-subnet-2
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: webapp-prod-private-subnet-1
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: webapp-prod-private-subnet-2
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Type
          Value: Private

  # NAT Gateways for private subnet internet access (Production setup)
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: UseNATGatewayCondition
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: webapp-prod-nat-eip-1
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    Condition: UseNATGatewayCondition
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: webapp-prod-nat-eip-2
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Condition: UseNATGatewayCondition
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: webapp-prod-nat-1
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Condition: UseNATGatewayCondition
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: webapp-prod-nat-2
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-public-rt
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-private-rt-1
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-private-rt-2
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Condition: UseNATGatewayCondition
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Condition: UseNATGatewayCondition
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

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

  # Network ACLs with more granular controls
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-public-nacl
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Inbound rules for Public NACL
  PublicNetworkAclEntryInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6  # TCP
      RuleAction: allow
      CidrBlock: !Ref AllowedIPRange
      PortRange:
        From: 80
        To: 80

  PublicNetworkAclEntryInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6  # TCP
      RuleAction: allow
      CidrBlock: !Ref AllowedIPRange
      PortRange:
        From: 443
        To: 443

  PublicNetworkAclEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6  # TCP
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Outbound rules for Public NACL
  PublicNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  # Private Network ACL
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-private-nacl
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VPCCIDR

  PrivateNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PrivateSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  # ========================================
  # SECURITY GROUPS
  # ========================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      GroupName: webapp-prod-alb-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: Allow HTTP traffic
        - !If
          - EnableHTTPSCondition
          - IpProtocol: tcp
            FromPort: 443
            ToPort: 443
            CidrIp: !Ref AllowedIPRange
            Description: Allow HTTPS traffic
          - !Ref AWS::NoValue
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow traffic to web servers
      Tags:
        - Key: Name
          Value: webapp-prod-alb-sg
        - Key: iac-rlhf-amazon
          Value: 'true'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      GroupName: webapp-prod-webserver-sg
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-webserver-sg
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Web server ingress rules
  WebServerIngressHTTP:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: Allow HTTP from ALB

  WebServerIngressSSH:
    Type: AWS::EC2::SecurityGroupIngress
    Condition: HasKeyPair
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      CidrIp: !Ref VPCCIDR
      Description: Allow SSH from VPC

  WebServerEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: -1
      CidrIp: 0.0.0.0/0
      Description: Allow all outbound traffic

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      GroupName: webapp-prod-database-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL from web servers
      Tags:
        - Key: Name
          Value: webapp-prod-database-sg
        - Key: iac-rlhf-amazon
          Value: 'true'

  # VPC Endpoint Security Group for AWS Services
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      GroupName: webapp-prod-vpce-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VPCCIDR
          Description: Allow HTTPS from VPC
      Tags:
        - Key: Name
          Value: webapp-prod-vpce-sg
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ========================================
  # VPC ENDPOINTS FOR AWS SERVICES
  # ========================================

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  SSMVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: EnableSessionManagerCondition
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  SSMMessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: EnableSessionManagerCondition
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  EC2MessagesVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: EnableSessionManagerCondition
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================
  
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
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - !If
          - EnableSessionManagerCondition
          - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
          - !Ref AWS::NoValue
      Policies:
        - PolicyName: webapp-prod-s3-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                  - 's3:GetObjectVersion'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
                  - !GetAtt S3LogBucket.Arn
                  - !Sub '${S3LogBucket.Arn}/*'
        - PolicyName: webapp-prod-cloudwatch-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
        - PolicyName: webapp-prod-ssm-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:PutParameter'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/webapp/prod/*'
        - PolicyName: webapp-prod-secrets-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  - !GetAtt DatabaseInstance.MasterUserSecret.SecretArn
        - PolicyName: webapp-prod-rds-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBInstances'
                  - 'rds:DescribeDBClusters'
                Resource:
                  - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:webapp-prod-database'
      Tags:
        - Key: Name
          Value: webapp-prod-ec2-role
        - Key: iac-rlhf-amazon
          Value: 'true'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ========================================
  # SECRETS MANAGEMENT
  # ========================================


  # ========================================
  # S3 BUCKETS
  # ========================================
  
  S3Bucket:
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
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LogBucket
        LogFilePrefix: 'webapp-prod-storage-logs/'
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: webapp-prod-s3-bucket
        - Key: iac-rlhf-amazon
          Value: 'true'

  S3LogBucket:
    Type: AWS::S3::Bucket
    Properties:
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
          - Id: TransitionOldLogs
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      Tags:
        - Key: Name
          Value: webapp-prod-s3-log-bucket
        - Key: iac-rlhf-amazon
          Value: 'true'

  # S3 Bucket Policy for ALB Access Logs
  # ========================================
  # CLOUDWATCH LOG GROUPS
  # ========================================
  
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${AWS::StackName}/application'
      RetentionInDays: !Ref LogRetentionDays

  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${AWS::StackName}/alb'
      RetentionInDays: !Ref LogRetentionDays

  SystemLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${AWS::StackName}/system'
      RetentionInDays: !Ref LogRetentionDays

  # ========================================
  # DATABASE LAYER
  # ========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: iac-rlhf-amazon
          Value: 'true'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Custom parameter group for webapp production database
      Family: mysql8.0
      Parameters:
        slow_query_log: '1'
        long_query_time: '2'
        log_output: FILE
        general_log: '0'
        max_connections: '200'
      Tags:
        - Key: Name
          Value: webapp-prod-db-params
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: mysql
      EngineVersion: '8.0.43'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      MultiAZ: true
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: false
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: webapp-prod-rds
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ========================================
  # APPLICATION LOAD BALANCER
  # ========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: webapp-prod-alb
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: deletion_protection.enabled
          Value: 'false'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: webapp-prod-alb
        - Key: iac-rlhf-amazon
          Value: 'true'

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: webapp-prod-tg
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
          Value: webapp-prod-target-group
        - Key: iac-rlhf-amazon
          Value: 'true'

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - !If
          - EnableHTTPSCondition
          - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: '443'
              StatusCode: HTTP_301
          - Type: forward
            TargetGroupArn: !Ref TargetGroup

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: EnableHTTPSCondition
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ========================================
  # LAUNCH TEMPLATE AND AUTO SCALING
  # ========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: webapp-prod-launch-template
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref AWS::NoValue]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        InstanceMarketOptions: !If
          - EnableSpotInstancesCondition
          - MarketType: spot
            SpotOptions:
              SpotInstanceType: one-time
              MaxPrice: !If [HasSpotMaxPrice, !Ref SpotMaxPrice, !Ref AWS::NoValue]
          - !Ref AWS::NoValue
        Monitoring:
          Enabled: !Ref EnableDetailedMonitoring
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Iops: 3000
              Throughput: 125
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required  # IMDSv2 only
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: webapp-prod-instance
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: webapp-prod-volume
              - Key: iac-rlhf-amazon
                Value: 'true'
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd mariadb105 amazon-cloudwatch-agent aws-cli
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${ApplicationLogGroup}",
                        "log_stream_name": "{instance_id}/apache_access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${ApplicationLogGroup}",
                        "log_stream_name": "{instance_id}/apache_error"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Configure web server
            echo "<h1>WebApp Production Server</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
            
            # Start Apache first to pass health checks
            systemctl start httpd
            systemctl enable httpd
            
            # Store database endpoint in SSM Parameter Store (after httpd is running)
            aws ssm put-parameter --name /webapp/prod/db/endpoint --value ${DatabaseInstance.Endpoint.Address} --type String --overwrite --region ${AWS::Region} || true

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
    Properties:
      AutoScalingGroupName: webapp-prod-asg
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TerminationPolicies:
        - OldestInstance
      MetricsCollection:
        - Granularity: "1Minute"
          Metrics:
            - GroupInServiceInstances
            - GroupPendingInstances
            - GroupTerminatingInstances
            - GroupTotalInstances
            - GroupDesiredCapacity
            - GroupMinSize
            - GroupMaxSize
      Tags:
        - Key: Name
          Value: webapp-prod-asg-instance
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true
        - Key: Environment
          Value: prod
          PropagateAtLaunch: true

  ScalingPolicyUp:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      MetricAggregationType: Average
      StepAdjustments:
        - MetricIntervalLowerBound: 0
          MetricIntervalUpperBound: 10
          ScalingAdjustment: 1
        - MetricIntervalLowerBound: 10
          ScalingAdjustment: 2

  ScalingPolicyDown:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      MetricAggregationType: Average
      StepAdjustments:
        - MetricIntervalUpperBound: 0
          ScalingAdjustment: -1

  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !Ref TargetCPUUtilization

  # ========================================
  # CLOUDWATCH ALARMS
  # ========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-high-cpu
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
        - !Ref ScalingPolicyUp

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-low-cpu
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
        - !Ref ScalingPolicyDown

  UnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-unhealthy-hosts
      AlarmDescription: Alarm when we have unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      TreatMissingData: notBreaching

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-db-connections
      AlarmDescription: Alarm when database connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      TreatMissingData: notBreaching

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-db-cpu
      AlarmDescription: Alarm when database CPU is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance

  TargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-response-time
      AlarmDescription: Alarm when response time is high
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName


# ========================================
# OUTPUTS
# ========================================

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  VPCCIDRBlock:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-vpc-cidr'

  PublicSubnetIDs:
    Description: Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-public-subnets'

  PrivateSubnetIDs:
    Description: Private Subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-private-subnets'

  LoadBalancerURL:
    Description: Application Load Balancer URL
    Value: !Sub
      - 'http${Secure}://${DNSName}'
      - Secure: !If [EnableHTTPSCondition, 's', '']
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-url'

  LoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-alb-arn'

  LoadBalancerZoneID:
    Description: Application Load Balancer Hosted Zone ID
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${AWS::StackName}-alb-zone-id'

  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-tg-arn'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-db-endpoint'

  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-db-port'

  DatabaseSecretArn:
    Description: ARN of the database credentials secret (RDS-managed)
    Value: !GetAtt DatabaseInstance.MasterUserSecret.SecretArn
    Export:
      Name: !Sub '${AWS::StackName}-db-secret-arn'

  S3BucketName:
    Description: S3 Bucket for Application Storage
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'

  S3BucketArn:
    Description: S3 Bucket ARN
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket-arn'

  S3LogBucketName:
    Description: S3 Bucket for Logs
    Value: !Ref S3LogBucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-log-bucket'

  ApplicationLogGroup:
    Description: CloudWatch Log Group for Application Logs
    Value: !Ref ApplicationLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-app-log-group'

  SystemLogGroup:
    Description: CloudWatch Log Group for System Logs
    Value: !Ref SystemLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-system-log-group'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-asg-name'

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-launch-template-id'

  LaunchTemplateVersion:
    Description: Launch Template Latest Version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub '${AWS::StackName}-launch-template-version'

  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-alb-sg'

  WebServerSecurityGroupId:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-webserver-sg'

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-database-sg'

  EC2RoleArn:
    Description: EC2 IAM Role ARN
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ec2-role-arn'

  EC2InstanceProfileArn:
    Description: EC2 Instance Profile ARN
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ec2-instance-profile-arn'

  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref AWS::StackName

  StackRegion:
    Description: Stack Deployment Region
    Value: !Ref AWS::Region

  AccountId:
    Description: AWS Account ID
    Value: !Ref AWS::AccountId
```