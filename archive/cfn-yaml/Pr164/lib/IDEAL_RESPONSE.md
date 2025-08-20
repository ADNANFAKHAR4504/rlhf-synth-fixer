```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template for a secure networking environment in us-east-1.

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: SecureNetworkVPC

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureNetworkIGW

  # Attach Internet Gateway to VPC
  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      # Use !Select and !GetAZs to avoid hardcoding availability zones
      AvailabilityZone: !Select [ 0, !GetAZs "" ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      # Use !Select and !GetAZs to avoid hardcoding availability zones
      AvailabilityZone: !Select [ 1, !GetAZs "" ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      # Use !Select and !GetAZs to avoid hardcoding availability zones
      AvailabilityZone: !Select [ 0, !GetAZs "" ]
      Tags:
        - Key: Name
          Value: PrivateSubnet1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      # Use !Select and !GetAZs to avoid hardcoding availability zones
      AvailabilityZone: !Select [ 1, !GetAZs "" ]
      Tags:
        - Key: Name
          Value: PrivateSubnet2

  # Elastic IP for NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: NatGatewayEIP

  # NAT Gateway in Public Subnet 1
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1 # Deploy in one of the public subnets
      Tags:
        - Key: Name
          Value: SecureNetworkNATGateway

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PublicRouteTable

  # Route for Public Route Table to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment # Ensure IGW is attached before creating route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Public Subnets with Public Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable

  # Route for Private Route Table to NAT Gateway
  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  # Associate Private Subnets with Private Route Table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Group for Public Subnets
  PublicSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP access and restricted SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
          Description: SSH access from private networks only
      SecurityGroupEgress:
        - IpProtocol: -1 # Allow all outbound traffic
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: PublicSecurityGroup

Outputs:
  VPCId:
    Description: The ID of the created VPC
    Value: !Ref VPC
  PublicSubnet1Id:
    Description: The ID of Public Subnet 1
    Value: !Ref PublicSubnet1
  PublicSubnet2Id:
    Description: The ID of Public Subnet 2
    Value: !Ref PublicSubnet2
  PrivateSubnet1Id:
    Description: The ID of Private Subnet 1
    Value: !Ref PrivateSubnet1
  PrivateSubnet2Id:
    Description: The ID of Private Subnet 2
    Value: !Ref PrivateSubnet2
  InternetGatewayId:
    Description: The ID of the Internet Gateway
    Value: !Ref InternetGateway
  PublicSecurityGroupId:
    Description: The ID of the Public Security Group
    Value: !Ref PublicSecurityGroup
```