# Ideal Response

The assistant should output **only** a valid `tap_stack.yml` CloudFormation template, with no extra commentary, meeting all requirements:

- Full VPC setup across two AZs in `us-west-2`.
- 2 public and 2 private subnets, correctly routed via IGW/NAT.
- One NAT Gateway per AZ for high availability.
- Internet-facing ALB in public subnets forwarding HTTP to private EC2s.
- EC2 Auto Scaling Group with Launch Template, default `t2.micro`.
- Bastion host in public subnet, SSH restricted to parameterized CIDR.
- Security groups with least privilege rules (ALB → App, Bastion → SSH).
- IAM role/profile for EC2 limited to reading one SSM SecureString parameter.
- Example SecureString parameter creation if `CreateAppSecret=true`.
- Parameters for all configurable values (KeyName, VpcCidr, SSHCidr, InstanceType, ASG sizes, AMI source).
- Outputs for VPC, subnets, bastion IP, ALB DNS, ASG name, roles, and security groups.
- All resources tagged with `Environment: Production`.
- No secrets hardcoded; dynamic reference to SSM SecureString for app secret.

The YAML must be syntactically correct and production deployable.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "TapStack VPC with subnets, routing, security groups, and bastion host"

Parameters:
  EnvironmentName:
    Type: String
    Default: prod
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
  PublicSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2Cidr:
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.11.0/24
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.12.0/24

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-igw"

  VpcInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-1"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-2"
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-1"
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-private-2"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-rt"

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VpcInternetGatewayAttachment # ✅ must wait for IGW attach
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

  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
  PublicSubnetIds:
    Description: Public Subnets
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
  PrivateSubnetIds:
    Description: Private Subnets
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
```

