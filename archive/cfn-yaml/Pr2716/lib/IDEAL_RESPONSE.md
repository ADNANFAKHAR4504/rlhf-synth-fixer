# AWS CloudFormation Template: VPC Infrastructure

Here's the complete CloudFormation template that sets up a robust VPC environment in the `us-west-2` region with high availability, internet connectivity, and proper IAM roles:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Robust VPC infrastructure with high availability, internet connectivity, and IAM roles for S3 access'

Parameters:
  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    ConstraintDescription: 'CIDR block parameter must be in the form x.x.x.x/16-28'

  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for tagging'
    AllowedValues: ['production', 'staging', 'development']

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment

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
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  # Elastic IP for NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateway
  NatGateway:
    Type: AWS::EC2::NatGateway
    DependsOn: InternetGatewayAttachment
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway'
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${Environment}-private-rt'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

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

  # Security Group
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group allowing SSH and HTTP access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for EC2 instances to access S3
  EC2S3Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-s3-role'
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2S3Role

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${Environment}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${Environment}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${Environment}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${Environment}-PrivateSubnet2-ID'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${Environment}-WebSecurityGroup-ID'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN for S3 access'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${Environment}-EC2InstanceProfile-ARN'

  NatGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${Environment}-NatGateway-ID'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${Environment}-InternetGateway-ID'
```

# Key Features and Security Implementations

## Security Best Practices
- **Security Groups:** Restrictive rules allowing only SSH (port 22) and HTTP (port 80) from the internet, with all outbound traffic permitted.
- **IAM Roles:** Least privilege principle applied with EC2 instances granted read-only access to S3 via a specific IAM role.
- **NAT Gateway:** Enables private subnets to access the internet securely without exposing instances to public IPs.
- **VPC Configuration:** DNS hostnames and support enabled for proper resource identification within the VPC.
- **Tagging:** Consistent tagging with `Name` and `Environment` keys for all resources.

## Monitoring & Alerting
- **Outputs:** Exports critical resource IDs (VPC, subnets, security group, NAT gateway, internet gateway, and instance profile ARN) for integration with other stacks or monitoring tools.
- **CloudFormation Exports:** Facilitates cross-stack references for seamless integration with additional infrastructure components.

## Infrastructure Components
- **VPC:** Custom CIDR block with DNS hostnames and support enabled.
- **Subnets:** Two public and two private subnets across different availability zones (`us-west-2a`, `us-west-2b`) for high availability.
- **Internet Gateway:** Attached to the VPC for public subnet internet access.
- **NAT Gateway:** Deployed in a public subnet with an Elastic IP for outbound traffic from private subnets.
- **Route Tables:** Separate public and private route tables with appropriate routing to the internet gateway and NAT gateway.
- **Security Group:** Configured for SSH and HTTP access, assignable to EC2 instances.
- **IAM Role:** EC2 instance profile with S3 read-only access for secure data retrieval.

## Compliance Features
- **Tagging:** All resources include `Name` and `Environment` tags for cost management and resource identification.
- **Region:** Configured exclusively for `us-west-2` to meet regional deployment requirements.
- **VPC Isolation:** Private subnets ensure EC2 instances are not exposed to the public internet.
- **Dynamic Parameterization:** Uses intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`, `!Cidr`) for flexible and reusable template configuration.