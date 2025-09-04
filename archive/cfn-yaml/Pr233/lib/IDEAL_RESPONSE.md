```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template to set up a VPC, subnets, route tables, NAT Gateway, and EC2 instances.

Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair.
    Default: your-dev-key

Resources:
  vpcDevelopment:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Development

  publicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref vpcDevelopment
      CidrBlock: 10.0.0.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: 
        !Select 
          - 0
          - !GetAZs 
              Ref: AWS::Region
      Tags:
        - Key: Environment
          Value: Development

  privateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref vpcDevelopment
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: 
        !Select 
          - 1
          - !GetAZs 
              Ref: AWS::Region
      Tags:
        - Key: Environment
          Value: Development

  internetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Development

  attachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref vpcDevelopment
      InternetGatewayId: !Ref internetGateway

  publicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref vpcDevelopment
      Tags:
        - Key: Environment
          Value: Development

  publicRoute:
    Type: AWS::EC2::Route
    DependsOn: attachGateway
    Properties:
      RouteTableId: !Ref publicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref internetGateway

  publicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref publicSubnet
      RouteTableId: !Ref publicRouteTable

  elasticIP:
    Type: AWS::EC2::EIP
    DependsOn: attachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: Development

  natGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt elasticIP.AllocationId
      SubnetId: !Ref publicSubnet
      Tags:
        - Key: Environment
          Value: Development

  privateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref vpcDevelopment
      Tags:
        - Key: Environment
          Value: Development

  privateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref privateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref natGateway

  privateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref privateSubnet
      RouteTableId: !Ref privateRouteTable

  securityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH access
      VpcId: !Ref vpcDevelopment
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 198.51.100.0/24
      Tags:
        - Key: Environment
          Value: Development

  publicInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Ref LatestAmiId
      KeyName: !Ref KeyName
      SubnetId: !Ref publicSubnet
      SecurityGroupIds:
        - !Ref securityGroup
      Tags:
        - Key: Environment
          Value: Development

  privateInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Ref LatestAmiId
      KeyName: !Ref KeyName
      SubnetId: !Ref privateSubnet
      SecurityGroupIds:
        - !Ref securityGroup
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref vpcDevelopment
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref publicSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnetId"

  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref privateSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnetId"

  NATGatewayId:
    Description: NAT Gateway ID
    Value: !Ref natGateway
    Export:
      Name: !Sub ${AWS::StackName}-NATGatewayId

  NatEIPAllocationId:
    Description: Elastic IP Allocation ID for NAT Gateway
    Value: !GetAtt elasticIP.AllocationId
    Export:
      Name: !Sub ${AWS::StackName}-NatEIPAllocationId

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref internetGateway
    Export:
      Name: !Sub ${AWS::StackName}-InternetGatewayId

  SecurityGroupId:
    Description: Security Group ID
    Value: !Ref securityGroup
    Export:
      Name: !Sub ${AWS::StackName}-SecurityGroupId

  PublicInstanceId:
    Description: EC2 Public Instance ID
    Value: !Ref publicInstance
    Export:
      Name: !Sub ${AWS::StackName}-PublicInstanceId

  PrivateInstanceId:
    Description: EC2 Private Instance ID
    Value: !Ref privateInstance
    Export:
      Name: !Sub ${AWS::StackName}-PrivateInstanceId
```