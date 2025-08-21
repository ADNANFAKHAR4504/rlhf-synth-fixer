# Highly Available VPC CloudFormation Template

Based on the detailed prompt requirements, I'll create a comprehensive CloudFormation template for a highly available network infrastructure spanning two Availability Zones.

## Template Implementation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Available VPC with public and private subnets across two AZs, NAT Gateways, Security Groups, and IAM roles for EC2 S3 access'

# Parameters section for template reusability
# Parameters section with default values for AZs
Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnetACidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for the first public subnet'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnetBCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for the second public subnet'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnetACidr:
    Type: String
    Default: '10.0.101.0/24'
    Description: 'CIDR block for the first private subnet'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnetBCidr:
    Type: String
    Default: '10.0.102.0/24'
    Description: 'CIDR block for the second private subnet'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  AvailabilityZoneA:
    Type: String # Changed from AWS::EC2::AvailabilityZone::Name to String
    Description: 'First Availability Zone for high availability deployment'
    Default: 'us-west-2a'

  AvailabilityZoneB:
    Type: String # Changed from AWS::EC2::AvailabilityZone::Name to String
    Description: 'Second Availability Zone for high availability deployment'
    Default: 'us-west-2b'

  Environment:
    Type: String
    Default: 'Development'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - Development
      - Staging
      - Production

  ProjectName:
    Type: String
    Default: 'HighAvailabilityVPC'
    Description: 'Project name for resource tagging'
Resources:
  # VPC Definition - Main network container
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MyVPC

  # Public Subnet in first Availability Zone
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      AvailabilityZone: !Ref AvailabilityZoneA
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-A'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: Public

  # Public Subnet in second Availability Zone
  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      AvailabilityZone: !Ref AvailabilityZoneB
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-B'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: Public

  # Private Subnet in first Availability Zone
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      AvailabilityZone: !Ref AvailabilityZoneA
      CidrBlock: !Ref PrivateSubnetACidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-A'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: Private

  # Private Subnet in second Availability Zone
  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      AvailabilityZone: !Ref AvailabilityZoneB
      CidrBlock: !Ref PrivateSubnetBCidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-B'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Type
          Value: Private

  # Elastic IP for NAT Gateway A
  NatGatewayAEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-A-EIP'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Elastic IP for NAT Gateway B
  NatGatewayBEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-B-EIP'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateway in Public Subnet A for high availability
  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayAEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-A'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateway in Public Subnet B for high availability
  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayBEIP.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-B'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Route-Table'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Default route for public subnets to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet A with Public Route Table
  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetA

  # Associate Public Subnet B with Public Route Table
  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetB

  # Route Table for Private Subnet A
  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Route-Table-A'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Default route for Private Subnet A to NAT Gateway A
  DefaultPrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  # Associate Private Subnet A with Private Route Table A
  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      SubnetId: !Ref PrivateSubnetA

  # Route Table for Private Subnet B
  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Route-Table-B'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Default route for Private Subnet B to NAT Gateway B
  DefaultPrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

  # Associate Private Subnet B with Private Route Table B
  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      SubnetId: !Ref PrivateSubnetB

  # Security Group for Public Subnets - allows HTTP/HTTPS from anywhere
  PublicSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-Public-SG'
      GroupDescription: 'Security group for resources in public subnets - allows HTTP and HTTPS from anywhere'
      VpcId: !Ref MyVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Security-Group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Security Group for Private Subnets - allows traffic from public security group
  PrivateSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-Private-SG'
      GroupDescription: 'Security group for resources in private subnets - allows traffic from public security group'
      VpcId: !Ref MyVPC
      SecurityGroupIngress:
        - IpProtocol: -1
          SourceSecurityGroupId: !Ref PublicSecurityGroup
          Description: 'Allow all traffic from public security group'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Security-Group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for EC2 instances to access S3
  EC2S3AccessRole:
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
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore # Optional: for Systems Manager access
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - 'arn:aws:s3:::*'
                  - 'arn:aws:s3:::*/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Instance Profile for EC2 instances to use the IAM role
  EC2S3AccessInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2S3AccessRole

# Outputs section for referencing created resources
Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref MyVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetAId:
    Description: 'ID of Public Subnet A'
    Value: !Ref PublicSubnetA
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-A-ID'

  PublicSubnetBId:
    Description: 'ID of Public Subnet B'
    Value: !Ref PublicSubnetB
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-B-ID'

  PrivateSubnetAId:
    Description: 'ID of Private Subnet A'
    Value: !Ref PrivateSubnetA
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-A-ID'

  PrivateSubnetBId:
    Description: 'ID of Private Subnet B'
    Value: !Ref PrivateSubnetB
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-B-ID'

  PublicSecurityGroupId:
    Description: 'ID of the Public Security Group'
    Value: !Ref PublicSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Public-Security-Group-ID'

  PrivateSecurityGroupId:
    Description: 'ID of the Private Security Group'
    Value: !Ref PrivateSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Private-Security-Group-ID'

  EC2S3AccessRoleArn:
    Description: 'ARN of the IAM Role for EC2 S3 access'
    Value: !GetAtt EC2S3AccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-S3-Access-Role-ARN'

  EC2S3AccessInstanceProfileArn:
    Description: 'ARN of the Instance Profile for EC2 S3 access'
    Value: !GetAtt EC2S3AccessInstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-S3-Access-Instance-Profile-ARN'

  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-Internet-Gateway-ID'

  NatGatewayAId:
    Description: 'ID of NAT Gateway A'
    Value: !Ref NatGatewayA
    Export:
      Name: !Sub '${AWS::StackName}-NAT-Gateway-A-ID'

  NatGatewayBId:
    Description: 'ID of NAT Gateway B'
    Value: !Ref NatGatewayB
    Export:
      Name: !Sub '${AWS::StackName}-NAT-Gateway-B-ID'
```

## Key Features Implemented

### Network Structure
- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Public Subnets**: 10.0.1.0/24 (us-west-2a) and 10.0.2.0/24 (us-west-2b) with auto-assign public IPs
- **Private Subnets**: 10.0.101.0/24 (us-west-2a) and 10.0.102.0/24 (us-west-2b)

### Internet Connectivity
- **Internet Gateway**: Single IGW attached to VPC for public internet access
- **NAT Gateways**: Two NAT gateways (one per AZ) with dedicated Elastic IPs
- **Routing**: Proper route tables with default routes configured

### Security Configuration
- **Public Security Group**: Allows HTTP (80) and HTTPS (443) from anywhere (0.0.0.0/0)
- **Private Security Group**: Allows all traffic from public security group only
- **IAM Role**: EC2 service role with S3 permissions (GetObject, PutObject, DeleteObject, ListBucket)

### Template Best Practices
- **Parameterized**: All CIDR blocks and AZs configurable via parameters with validation patterns
- **Comprehensive Outputs**: All major resource IDs exported with proper naming
- **Resource Tagging**: Consistent tagging across all resources (Name, Environment, Project)
- **Comments**: Clear documentation throughout the template
- **Dependencies**: Proper DependsOn relationships for resource creation order

This template creates a production-ready, highly available VPC infrastructure that meets all specified requirements while following AWS best practices for security, reliability, and maintainability.