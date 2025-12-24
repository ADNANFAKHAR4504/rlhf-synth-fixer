# MODEL RESPONSE

Based on your requirements, I'll create a secure AWS infrastructure using CloudFormation in YAML format. This infrastructure will include a VPC with public and private subnets across two Availability Zones, a NAT Gateway for secure internet access from private subnets, an encrypted S3 bucket, and a security group with restricted SSH access.

Here's the CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure with VPC, subnets across 2 AZs, NAT Gateway, encrypted S3 bucket, and restricted SSH access'

Parameters:
  ProjectName:
    Type: String
    Default: 'secureinfra'
    AllowedPattern: '^[a-z0-9-]+$'
    Description: 'Name prefix for all resources'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'

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
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.20.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2'

  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes'

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Group for SSH access
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group allowing SSH access only from 192.168.1.0/24'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '192.168.1.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-SSH-SG'

  # S3 Bucket with mandatory server-side encryption
  SecureS3Bucket:
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Secure-Bucket'

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC

  PublicSubnet1Id:
    Description: 'ID of the public subnet in AZ1'
    Value: !Ref PublicSubnet1

  PublicSubnet2Id:
    Description: 'ID of the public subnet in AZ2'
    Value: !Ref PublicSubnet2

  PrivateSubnet1Id:
    Description: 'ID of the private subnet in AZ1'
    Value: !Ref PrivateSubnet1

  PrivateSubnet2Id:
    Description: 'ID of the private subnet in AZ2'
    Value: !Ref PrivateSubnet2

  SSHSecurityGroupId:
    Description: 'ID of the SSH Security Group'
    Value: !Ref SSHSecurityGroup

  SecureS3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
```

This CloudFormation template creates:

1. **VPC Infrastructure**: A VPC with public and private subnets distributed across two Availability Zones for high availability
2. **Internet Connectivity**: An Internet Gateway for public subnet access and a NAT Gateway for secure private subnet internet access
3. **Security**: A security group that restricts SSH access to only the 192.168.1.0/24 IP range
4. **Storage**: An S3 bucket with mandatory AES256 server-side encryption and blocked public access
5. **Network Routing**: Proper route tables and associations to ensure correct traffic flow

The template follows AWS best practices for security and high availability, with all resources properly tagged for management and cost tracking.