# Ideal CloudFormation Response

This document outlines the key design elements and best practices implemented in the provided CloudFormation template. It provisions a complete, production-ready AWS network environment including a VPC, public and private subnets, an internet gateway, NAT gateway, EC2 instances, and associated networking components.

---

## 1. Parameter Design and Validation

### Key Parameters:

- **`KeyName`**  
  Defined with type `AWS::EC2::KeyPair::KeyName`, ensuring that a valid, pre-existing EC2 Key Pair is required. This prevents launch errors related to SSH access.

- **`SshCidrBlock`**  
  Parameter is named clearly and includes regex validation to ensure only valid IPv4 CIDR blocks are allowed (e.g., `203.0.113.0/32`). This enhances security and input robustness.

- **Other Parameters**  
  Include `VpcCidrBlock`, `PublicSubnetCidrBlock`, `PrivateSubnetCidrBlock`, and more—all using descriptive names and helpful default values. Grouped under logical `ParameterGroups` for better UI organization in the AWS console.

---

## 2. Network Architecture

### VPC and Subnets:

- **VPC**  
  Created with DNS hostnames and DNS support enabled, supporting dynamic name resolution inside the network.

- **Public & Private Subnets**  
  Defined with separate CIDR blocks, spread across different availability zones for redundancy.

### Public Internet Access:

- **`MapPublicIpOnLaunch: true`**  
  Enabled for the public subnet so that instances launched there automatically receive public IPs.

- **Internet Gateway**  
  Properly created and attached to the VPC via a `VPCGatewayAttachment`.

- **Public Route Table**  
  Configured with a route (`0.0.0.0/0`) pointing to the Internet Gateway. This route table is correctly associated with the public subnet.

---

## 3. NAT Gateway and Private Routing

- **NAT Gateway**  
  Provisioned in the public subnet using an Elastic IP (EIP). Ensures instances in the private subnet can access the internet securely for updates and outbound traffic.

- **Private Route Table**  
  Created and linked to the private subnet with a default route to the NAT Gateway.

- **`DependsOn` Directives**  
  Explicitly used for the NAT Gateway and routes to ensure the Internet Gateway is attached before dependent resources are created. This ensures consistent provisioning order.

---

## 4. Security Group Configuration

- A security group allows:
  - SSH (`tcp/22`) from the IP range specified in `SshCidrBlock`
  - HTTP (`tcp/80`) access from the same CIDR
- Follows least privilege principle while enabling essential access for remote administration and web services.

---

## 5. EC2 Instances

- **Public Instance**  
  Deployed in the public subnet with public IP and SSH access enabled via the security group.

- **Private Instance**  
  Launched in the private subnet without direct internet access. Can access the internet via NAT Gateway if needed.

- Both instances:
  - Use a parameterized AMI (`AmiId`)
  - Use the same instance type (`InstanceType`)
  - Use the validated `KeyName` for SSH

---

## 6. Outputs Section

- The template includes rich `Outputs` to expose critical resources:
  - `VPCId`, `PublicSubnetId`, `PrivateSubnetId`
  - `PublicInstanceId`, `PrivateInstanceId`
  - `PublicInstancePublicIP`

These outputs support automation, debugging, and integration with other stacks or external scripts.

---

## Summary

This template represents a complete and secure VPC architecture following AWS best practices. It includes:

- Strong parameter validation and naming  
- Secure public/private subnet design  
- Proper routing with NAT and IGW  
- Clean, dependable resource relationships  
- Usable outputs for easy access and integration

It is suitable for a wide range of real-world use cases—from training environments to scalable production workloads.

## Template:
AWSTemplateFormatVersion: '2010-09-09'
Description: TAP Stack VPC with Public & Private Subnets, NAT Gateway, and EC2 Instances

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidrBlock
          - PublicSubnetCidrBlock
          - PrivateSubnetCidrBlock
      - Label:
          default: "Instance Configuration"
        Parameters:
          - InstanceType
          - KeyName
          - AmiId
          - SshCidrBlock
    ParameterLabels:
      EnvironmentSuffix:
        default: "Environment Suffix"

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix for resource naming (e.g., dev, test, prod)
    Default: dev
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must be alphanumeric only

  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for the VPC

  PublicSubnetCidrBlock:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for the public subnet

  PrivateSubnetCidrBlock:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for the private subnet

  SshCidrBlock:
    Type: String
    Description: IP CIDR range allowed to SSH into EC2 (e.g., 203.0.113.0/32)
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Default: '203.0.2.0/32'
    ConstraintDescription: Must be a valid IPv4 CIDR block

  InstanceType:
    Type: String
    Default: 't2.micro'
    Description: EC2 instance type

  KeyName:
    Type: 'AWS::EC2::KeyPair::KeyName'
    Default: iac-rlhf-aws-trainer-instance
    Description: Name of an existing EC2 KeyPair

  AmiId:
    Type: AWS::EC2::Image::Id
    Default: ami-0871b7e0b83ae16c4
    Description: AMI ID to use for EC2 instances (e.g., Amazon Linux 2 AMI)

Resources:

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub VPC-${EnvironmentSuffix}

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidrBlock
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet-${EnvironmentSuffix}

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidrBlock
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet-${EnvironmentSuffix}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub InternetGateway-${EnvironmentSuffix}

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub PublicRouteTable-${EnvironmentSuffix}

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub NatEIP-${EnvironmentSuffix}

  NatGateway:
    Type: AWS::EC2::NatGateway
    DependsOn: InternetGatewayAttachment
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub NatGateway-${EnvironmentSuffix}

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub PrivateRouteTable-${EnvironmentSuffix}

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SshCidrBlock
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref SshCidrBlock
      Tags:
        - Key: Name
          Value: !Sub InstanceSecurityGroup-${EnvironmentSuffix}

  PublicInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !Ref AmiId
      SecurityGroupIds:
        - !Ref SecurityGroup
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub PublicInstance-${EnvironmentSuffix}

  PrivateInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !Ref AmiId
      SecurityGroupIds:
        - !Ref SecurityGroup
      SubnetId: !Ref PrivateSubnet
      Tags:
        - Key: Name
          Value: !Sub PrivateInstance-${EnvironmentSuffix}

Outputs:
  VPCId:
    Description: ID of the created VPC
    Value: !Ref VPC

  PublicSubnetId:
    Description: ID of the public subnet
    Value: !Ref PublicSubnet

  PrivateSubnetId:
    Description: ID of the private subnet
    Value: !Ref PrivateSubnet

  PublicInstanceId:
    Description: ID of the EC2 instance in the public subnet
    Value: !Ref PublicInstance

  PrivateInstanceId:
    Description: ID of the EC2 instance in the private subnet
    Value: !Ref PrivateInstance

  PublicInstancePublicIP:
    Description: Public IP of the EC2 instance in the public subnet
    Value: !GetAtt PublicInstance.PublicIp
