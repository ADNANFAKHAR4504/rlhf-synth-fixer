# Ideal CloudFormation Template Response

This is the **perfect implementation** of the CloudFormation template that meets all requirements.

## Template Overview
- **Purpose**: Basic development environment setup
- **Region**: us-east-1
- **Architecture**: VPC with 2 public subnets, 2 EC2 instances, Internet Gateway
- **Instance Type**: t2.micro (Free Tier eligible)
- **OS**: Amazon Linux 2

## Key Features
✅ **VPC**: 10.0.0.0/16 CIDR with DNS support  
✅ **Subnets**: Two public subnets in different AZs  
✅ **EC2**: One instance per subnet with public IPs  
✅ **Security**: SSH and HTTP access from anywhere  
✅ **Internet**: Full internet connectivity via IGW  
✅ **Tagging**: All resources tagged consistently  
✅ **Outputs**: Public DNS names for both instances  

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Basic Development Environment in us-east-1 with two public subnets,
  EC2 instances, security groups, Internet access, and tagging.

Parameters:
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances.

Mappings:
  AWSRegionToAMI:
    us-east-1:
      AMI: ami-0c02fb55956c7d316 # Latest Amazon Linux 2 AMI for us-east-1 (update as needed)

Resources:

  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Development

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Environment
          Value: Development

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Environment
          Value: Development

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Development

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  # Route for Internet Access
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Route Table to Subnet 1
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  # Associate Route Table to Subnet 2
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Group for EC2
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Development

  # EC2 Instance 1
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AWSRegionToAMI, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      NetworkInterfaces:
        - AssociatePublicIpAddress: true
          SubnetId: !Ref PublicSubnet1
          DeviceIndex: 0
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

  # EC2 Instance 2
  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AWSRegionToAMI, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      NetworkInterfaces:
        - AssociatePublicIpAddress: true
          SubnetId: !Ref PublicSubnet2
          DeviceIndex: 0
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  Instance1PublicDNS:
    Description: Public DNS of EC2 Instance 1
    Value: !GetAtt EC2Instance1.PublicDnsName
  Instance2PublicDNS:
    Description: Public DNS of EC2 Instance 2
    Value: !GetAtt EC2Instance2.PublicDnsName
```

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate permissions
- Existing EC2 KeyPair in us-east-1 region

### Deploy Command
```bash
aws cloudformation deploy \
  --template-body file://TapStack.yml \
  --stack-name development-environment \
  --parameter-overrides KeyName=your-key-pair-name \
  --region us-east-1
```

### Validate Template
```bash
aws cloudformation validate-template --template-body file://TapStack.yml
```

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                VPC (10.0.0.0/16)                       │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Public Subnet 1     │  │ Public Subnet 2         │   │
│  │ (10.0.1.0/24)       │  │ (10.0.2.0/24)           │   │
│  │ AZ: us-east-1a      │  │ AZ: us-east-1b          │   │
│  │                     │  │                         │   │
│  │ ┌─────────────────┐ │  │ ┌─────────────────────┐ │   │
│  │ │ EC2 Instance 1  │ │  │ │ EC2 Instance 2      │ │   │
│  │ │ Public IP       │ │  │ │ Public IP           │ │   │
│  │ └─────────────────┘ │  │ └─────────────────────┘ │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                      │                                  │
│         ┌────────────▼──────────────┐                   │
│         │     Route Table           │                   │
│         │   0.0.0.0/0 → IGW         │                   │
│         └────────────┬──────────────┘                   │
└──────────────────────┼──────────────────────────────────┘
                       │
                ┌──────▼──────┐
                │ Internet    │
                │ Gateway     │
                └─────────────┘
                       │
                ┌──────▼──────┐
                │  Internet   │
                └─────────────┘
```

## Resource Summary
- **1** VPC
- **2** Public Subnets
- **2** EC2 Instances (t2.micro)
- **1** Internet Gateway
- **1** Route Table
- **1** Security Group
- **2** Route Table Associations
- **All resources** properly tagged
          Value: Development

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Development

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  # Route for Internet Access
  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Route Table to Subnet 1
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  # Associate Route Table to Subnet 2
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Group for EC2
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Development

  # EC2 Instance 1
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AWSRegionToAMI, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      NetworkInterfaces:
        - AssociatePublicIpAddress: true
          SubnetId: !Ref PublicSubnet1
          DeviceIndex: 0
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

  # EC2 Instance 2
  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [AWSRegionToAMI, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      NetworkInterfaces:
        - AssociatePublicIpAddress: true
          SubnetId: !Ref PublicSubnet2
          DeviceIndex: 0
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  Instance1PublicDNS:
    Description: Public DNS of EC2 Instance 1
    Value: !GetAtt EC2Instance1.PublicDnsName
  Instance2PublicDNS:
    Description: Public DNS of EC2 Instance 2
    Value: !GetAtt EC2Instance2.PublicDnsName
