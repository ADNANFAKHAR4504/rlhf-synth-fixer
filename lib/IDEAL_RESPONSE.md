
---

## 🌟 `ideal_response.md`

This file defines what an ideal response from a model should contain: fully working template, explanation, secure handling, best practices, and deployment guidance.

---

### 📗 **ideal_response.md**

```markdown
## ✅ Ideal Model Output for Secure CloudFormation Template (us-east-1)

---

### 📌 Objective

Design a CloudFormation YAML template to set up a production-ready EC2 environment in `us-east-1`, including:

- Networking (VPC, subnets, gateway, routes)
- Security (subnet-bound SG rules, SSH IP filter)
- Compute (2 EC2 instances in different subnets)
- Secure keypair management (with Secrets Manager)
- Region locking and tagging

---

### ✅ Key Design Principles

- **Region Locked**: via `Conditions` block (`IsUSEast1`)
- **No 0.0.0.0/0 on HTTP**: ingress limited to subnet CIDRs only
- **KeyPair Management**:
  - Creates EC2 KeyPair
  - Stores KeyPair name in Secrets Manager (Note: private key still needs external handling)
- **Intrinsic Functions**: uses `!Ref`, `!Sub`, `!GetAtt` effectively
- **Tagging**: all resources tagged with `Environment: production`

---

### 🔐 Security Group Rules

- **Port 80 (HTTP)**: allowed only from Subnet A & B CIDRs
- **Port 22 (SSH)**: allowed only from trusted CIDR (parameterized)
- **Egress**: open by default (`0.0.0.0/0`)

---

### 📁 Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Basic Production-Ready AWS Environment in us-east-1 with secure EC2 and networking

Parameters:
  EnvironmentName:
    Type: String
    Default: production
    Description: The environment name (e.g., dev, staging, production)

  KeyPairName:
    Type: String
    Default: production-keypair
    Description: The EC2 KeyPair name to use (must be created externally)

  VPCCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC

  SubnetACIDR:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for public subnet A

  SubnetBCIDR:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for public subnet B

  AllowedSSHLocation:
    Type: String
    Default: 203.0.113.0/32
    Description: IP range (CIDR) allowed for SSH access

Conditions:
  IsUSEast1: !Equals [ !Ref "AWS::Region", "us-east-1" ]

Resources:
  # 1. Create a new EC2 Key Pair and store the private key in Secrets Manager
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Condition: IsUSEast1
    Properties:
      KeyName: !Ref KeyPairName
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  KeyPairSecret:
    Type: AWS::SecretsManager::Secret
    Condition: IsUSEast1
    Properties:
      Name: !Sub 'ec2/keypair/${EC2KeyPair}'
      Description: 'Private key for EC2 instances in TapStack'
      SecretString: !Sub '{"KeyPairId":"${EC2KeyPair}","KeyPairName":"${EC2KeyPair}"}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
  #VPC with internet gateway and Route tables and Subnets
  VPC:
    Type: AWS::EC2::VPC
    Condition: IsUSEast1
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Condition: IsUSEast1
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-igw"
        - Key: Environment
          Value: !Ref EnvironmentName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public-rt"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRoute:
    Type: AWS::EC2::Route
    Condition: IsUSEast1
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref SubnetACIDR
      AvailabilityZone: !Select [ 0, !GetAZs us-east-1 ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-subnet-a"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref SubnetBCIDR
      AvailabilityZone: !Select [ 1, !GetAZs us-east-1 ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-subnet-b"
        - Key: Environment
          Value: !Ref EnvironmentName

  SubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  SubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable
  # Security groups to allow inbound
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsUSEast1
    Properties:
      GroupDescription: Allow HTTP from subnets and SSH from trusted IP
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref SubnetACIDR
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref SubnetBCIDR
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHLocation
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-sg"
        - Key: Environment
          Value: !Ref EnvironmentName

  EC2InstanceA:
    Type: AWS::EC2::Instance
    Condition: IsUSEast1
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 in us-east-1
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnetA
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-instance-a"
        - Key: Environment
          Value: !Ref EnvironmentName

  EC2InstanceB:
    Type: AWS::EC2::Instance
    Condition: IsUSEast1
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 in us-east-1
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnetB
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-instance-b"
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  VPCId:
    Condition: IsUSEast1
    Description: The ID of the created VPC
    Value: !Ref VPC

  PublicSubnetAId:
    Condition: IsUSEast1
    Description: ID of Subnet A
    Value: !Ref PublicSubnetA

  PublicSubnetBId:
    Condition: IsUSEast1
    Description: ID of Subnet B
    Value: !Ref PublicSubnetB
  EC2InstanceAId:
    Condition: IsUSEast1
    Description: ID of EC2 instance in subnet A
    Value: !Ref EC2InstanceA

  EC2InstanceBId:
    Condition: IsUSEast1
    Description: ID of EC2 instance in subnet B
    Value: !Ref EC2InstanceB
  KeyPairName:
    Condition: IsUSEast1
    Description: EC2 KeyPair used
    Value: !Ref KeyPairName
  EC2InstanceAPublicIP:
    Condition: IsUSEast1
    Description: Public IP of EC2 instance in subnet A
    Value: !GetAtt EC2InstanceA.PublicIp

  EC2InstanceBPublicIP:
    Condition: IsUSEast1
    Description: Public IP of EC2 instance in subnet B
    Value: !GetAtt EC2InstanceB.PublicIp