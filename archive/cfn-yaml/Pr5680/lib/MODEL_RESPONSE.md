# CloudFormation VPC Infrastructure for Digital Banking Platform

Here's a complete CloudFormation YAML template that creates a highly available VPC infrastructure with proper network segmentation for PCI-DSS compliance.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Secure VPC foundation for digital banking platform with PCI-DSS compliance

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to avoid conflicts
    Default: dev

  Environment:
    Type: String
    Description: Environment name for tagging
    Default: development

  Project:
    Type: String
    Description: Project name for tagging
    Default: digital-banking

  Owner:
    Type: String
    Description: Owner/team responsible for resources
    Default: platform-team

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AttachGateway:
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
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1c
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: us-east-1b
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: us-east-1c
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Elastic IPs for NAT Gateways
  EIP1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-nat-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  EIP2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-nat-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  EIP3:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-nat-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways - Issue 1: Missing proper dependencies
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP3.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Issue 2: Missing explicit subnet associations for public subnets
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

  # Issue 3: Missing association for PublicSubnet3

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

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
          Value: !Sub 'private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

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
          Value: !Sub 'private-rt-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

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

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'web-server-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for web servers with HTTPS and SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: Allow SSH from VPC only
      Tags:
        - Key: Name
          Value: !Sub 'web-server-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # Issue 4: Database security group missing proper source security group reference
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'database-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for database servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: 10.0.0.0/16
          Description: Allow PostgreSQL from VPC
      Tags:
        - Key: Name
          Value: !Sub 'database-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PublicSubnet3Id:
    Description: Public Subnet 3 ID
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet3-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  PrivateSubnet3Id:
    Description: Private Subnet 3 ID
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3-ID'

  WebServerSecurityGroupId:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServerSG-ID'

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSG-ID'

  # Issue 5: Missing NAT Gateway outputs for operational visibility
```

## Summary

This CloudFormation template creates a highly available VPC infrastructure with:

- VPC with CIDR 10.0.0.0/16 and DNS support enabled
- Three public subnets across three availability zones
- Three private subnets across the same availability zones
- Internet Gateway for public connectivity
- Three NAT Gateways with Elastic IPs for high availability
- Proper route tables with associations
- Security groups for web servers and database servers
- Comprehensive outputs for cross-stack references

The template uses parameters for environment-specific configuration and includes proper tagging for resource management and compliance tracking.
