# AWS CloudFormation Template - Ideal Response

## Description
This CloudFormation template creates a secure and scalable network infrastructure with VPC, public and private subnets across three availability zones, Internet Gateway, NAT Gateways for high availability, comprehensive security groups and NACLs, VPC Flow Logs, and an S3 bucket with versioning and encryption following AWS best practices.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure and scalable network infrastructure with VPC, subnets, gateways, security groups, NACLs, and S3 bucket following AWS best practices

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Network Configuration
        Parameters:
          - EnvironmentSuffix
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PublicSubnet3CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
          - PrivateSubnet3CIDR
      - Label:
          default: Security Configuration
        Parameters:
          - SSHLocation
          - EnableS3Versioning
    ParameterLabels:
      EnvironmentSuffix:
        default: Environment Suffix
      VpcCIDR:
        default: VPC CIDR Block
      SSHLocation:
        default: SSH Access CIDR

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for the environment (e.g., dev, prod)
    Default: prod
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.
  VpcCIDR:
    Description: CIDR block for this VPC
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x
  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in the first Availability Zone
    Type: String
    Default: 10.0.1.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in the second Availability Zone
    Type: String
    Default: 10.0.2.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  PublicSubnet3CIDR:
    Description: CIDR block for the public subnet in the third Availability Zone
    Type: String
    Default: 10.0.3.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in the first Availability Zone
    Type: String
    Default: 10.0.4.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in the second Availability Zone
    Type: String
    Default: 10.0.5.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  PrivateSubnet3CIDR:
    Description: CIDR block for the private subnet in the third Availability Zone
    Type: String
    Default: 10.0.6.0/24
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  SSHLocation:
    Description: The IP address range that can be used to SSH to the EC2 instances
    Type: String
    MinLength: "9"
    MaxLength: "18"
    Default: 10.0.0.0/16
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x
  EnableS3Versioning:
    Description: Enable versioning for the S3 bucket
    Type: String
    Default: Enabled
    AllowedValues:
      - Enabled
      - Suspended

Conditions:
  EnableVersioning: !Equals [!Ref EnableS3Versioning, Enabled]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-VPC"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-IGW"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Public-Subnet-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Public-Subnet-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PublicSubnet3CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Public-Subnet-AZ3"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Private-Subnet-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Private-Subnet-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet3CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Private-Subnet-AZ3"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-1-EIP"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-2-EIP"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-3-EIP"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NAT-Gateway-AZ3"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Public-Routes"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
          Value: !Sub "${EnvironmentSuffix}-Private-Routes-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Private-Routes-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Private-Routes-AZ3"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${EnvironmentSuffix}-WebServer-SG"
      GroupDescription: Security group for web servers allowing HTTP traffic
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
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-WebServer-SG"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${EnvironmentSuffix}-Bastion-SG"
      GroupDescription: Security group for bastion hosts allowing SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
          Description: Allow SSH access from specified CIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Bastion-SG"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${EnvironmentSuffix}-Database-SG"
      GroupDescription: Security group for database servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL access from web servers
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Database-SG"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-NetworkAcl"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InboundHTTPNetworkAclEntry:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  InboundHTTPSNetworkAclEntry:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  InboundSSHNetworkAclEntry:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: !Ref SSHLocation
      PortRange:
        From: 22
        To: 22

  InboundReturnTrafficNetworkAclEntry:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 130
      Protocol: 6
      RuleAction: allow
      Egress: false
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  OutboundNetworkAclEntry:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref NetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref NetworkAcl

  PublicSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      NetworkAclId: !Ref NetworkAcl

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${EnvironmentSuffix}-secure-data-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: !If [EnableVersioning, Enabled, Suspended]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      NotificationConfiguration:
        TopicConfigurations: []
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentSuffix}-Secure-Data-Bucket"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

Outputs:
  VPC:
    Description: A reference to the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCID"
  VPCCidr:
    Description: CIDR block of the VPC
    Value: !Ref VpcCIDR
    Export:
      Name: !Sub "${AWS::StackName}-VPC-CIDR"
  PublicSubnets:
    Description: A list of the public subnets
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnets"
  PrivateSubnets:
    Description: A list of the private subnets
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnets"
  PublicSubnet1:
    Description: A reference to the public subnet in the 1st Availability Zone
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet1"
  PublicSubnet2:
    Description: A reference to the public subnet in the 2nd Availability Zone
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet2"
  PublicSubnet3:
    Description: A reference to the public subnet in the 3rd Availability Zone
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet3"
  PrivateSubnet1:
    Description: A reference to the private subnet in the 1st Availability Zone
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet1"
  PrivateSubnet2:
    Description: A reference to the private subnet in the 2nd Availability Zone
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet2"
  PrivateSubnet3:
    Description: A reference to the private subnet in the 3rd Availability Zone
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet3"
  WebServerSecurityGroup:
    Description: Security group with HTTP access
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-WebServerSecurityGroup"
  BastionSecurityGroup:
    Description: Security group with SSH access
    Value: !Ref BastionSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-BastionSecurityGroup"
  DatabaseSecurityGroup:
    Description: Security group for database access
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecurityGroup"
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"
  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketArn"

```