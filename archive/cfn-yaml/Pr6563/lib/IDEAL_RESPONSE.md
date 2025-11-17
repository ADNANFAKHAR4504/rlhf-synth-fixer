```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Cross-account executable template for VPC, subnet, and EC2 instance with proper naming convention'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
  
  VpcCidr:
    Type: String
    Description: 'CIDR block for the VPC'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/(1[6-9]|2[0-8])$'
    ConstraintDescription: 'Must be a valid CIDR block'
  
  SubnetCidr:
    Type: String
    Description: 'CIDR block for the public subnet'
    Default: '10.0.1.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/(1[6-9]|2[0-8])$'
    ConstraintDescription: 'Must be a valid CIDR block'
  
  InstanceType:
    Type: String
    Description: 'EC2 instance type'
    Default: 't2.micro'
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
      - t3.micro
      - t3.small
      - t3.medium
    ConstraintDescription: 'Must be a valid EC2 instance type'
  
  KeyPairName:
    Type: String
    Description: 'Name for the EC2 key pair'
    Default: 'MyKeyPair'
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must start with alphanumeric and contain only alphanumeric characters and hyphens'

  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
  
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref SubnetCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
  
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
  
  AttachGateway:
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'
  
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
  
  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable
  
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg'
      GroupDescription: 'Security group for web server allowing SSH and HTTP'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'Allow SSH from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from anywhere'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-security-group'
  
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-${KeyPairName}'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
  
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
      InstanceType: !Ref InstanceType
      KeyName: !Ref EC2KeyPair
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance'
        - Key: Environment
          Value: 'Testing'

Outputs:
  # VPC Outputs
  VpcId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-id'
  
  VpcCidrBlock:
    Description: 'CIDR block of the VPC'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-cidr'
  
  VpcDefaultNetworkAcl:
    Description: 'Default Network ACL ID of the VPC'
    Value: !GetAtt VPC.DefaultNetworkAcl
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-default-nacl'
  
  VpcDefaultSecurityGroup:
    Description: 'Default Security Group ID of the VPC'
    Value: !GetAtt VPC.DefaultSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-default-sg'
  
  # Subnet Outputs
  PublicSubnetId:
    Description: 'ID of the public subnet'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-id'
  
  PublicSubnetCidrBlock:
    Description: 'CIDR block of the public subnet'
    Value: !Ref SubnetCidr
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-cidr'
  
  PublicSubnetAvailabilityZone:
    Description: 'Availability Zone of the public subnet'
    Value: !GetAtt PublicSubnet.AvailabilityZone
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-az'
  
  # Internet Gateway Outputs
  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw-id'
  
  # Route Table Outputs
  PublicRouteTableId:
    Description: 'ID of the public route table'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt-id'
  
  # Security Group Outputs
  WebServerSecurityGroupId:
    Description: 'ID of the web server security group'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg-id'
  
  WebServerSecurityGroupName:
    Description: 'Name of the web server security group'
    Value: !GetAtt WebServerSecurityGroup.GroupName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg-name'
  
  # Key Pair Outputs
  EC2KeyPairId:
    Description: 'ID of the EC2 key pair'
    Value: !Ref EC2KeyPair
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair-id'
  
  EC2KeyPairFingerprint:
    Description: 'Fingerprint of the EC2 key pair'
    Value: !GetAtt EC2KeyPair.KeyFingerprint
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair-fingerprint'
  
  # EC2 Instance Outputs
  WebServerInstanceId:
    Description: 'ID of the EC2 web server instance'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-id'
  
  InstancePublicIp:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt WebServerInstance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-public-ip'
  
  InstancePrivateIp:
    Description: 'Private IP address of the EC2 instance'
    Value: !GetAtt WebServerInstance.PrivateIp
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-private-ip'
  
  InstancePublicDnsName:
    Description: 'Public DNS name of the EC2 instance'
    Value: !GetAtt WebServerInstance.PublicDnsName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-public-dns'
  
  InstancePrivateDnsName:
    Description: 'Private DNS name of the EC2 instance'
    Value: !GetAtt WebServerInstance.PrivateDnsName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-private-dns'
  
  InstanceAvailabilityZone:
    Description: 'Availability Zone of the EC2 instance'
    Value: !GetAtt WebServerInstance.AvailabilityZone
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-az'
  
  InstanceState:
    Description: 'State of the EC2 instance'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-state'
  
  # AMI and Instance Type Information
  InstanceImageId:
    Description: 'AMI ID used for the EC2 instance'
    Value: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-ami-id'
  
  InstanceType:
    Description: 'Instance type of the EC2 instance'
    Value: !Ref InstanceType
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-type'
  
  # Stack Information
  StackName:
    Description: 'Name of the CloudFormation stack'
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-stack-name'
  
  StackRegion:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-stack-region'
  
  EnvironmentSuffix:
    Description: 'Environment suffix used for resource naming'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-environment-suffix'
  