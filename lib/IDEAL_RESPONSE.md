Ideal respnse is as below
```
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  CloudFormation template to create a secure and scalable infrastructure 
  with separate Development and Production VPCs, Subnets, Security Groups, 
  and an Auto Scaling Group in Production. All resources are in us-east-1.

Resources:
  # ------------------------------------------------------------
  # Development Environment Resources
  # ------------------------------------------------------------

  # Development VPC
  DevVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: DevVPC

  # Development Public Subnet
  DevPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ] # Dynamically select the first AZ
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: DevPublicSubnet

  # Development Private Subnet
  DevPrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ] # Dynamically select the second AZ
      Tags:
        - Key: Name
          Value: DevPrivateSubnet

  # Internet Gateway for Dev VPC
  DevInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: DevInternetGateway
  
  AttachDevGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref DevVPC
      InternetGatewayId: !Ref DevInternetGateway

  # Route Table for Dev Public Subnet
  DevPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: DevPublicRouteTable
  
  DevPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachDevGateway
    Properties:
      RouteTableId: !Ref DevPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref DevInternetGateway

  AssociateDevPublicSubnetRouteTable:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPublicSubnet
      RouteTableId: !Ref DevPublicRouteTable

  # Development Security Group for SSH
  DevSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: "Dev SSH Access"
      GroupDescription: "Allow SSH access from a specific IP"
      VpcId: !Ref DevVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.5/32
      Tags:
        - Key: Name
          Value: DevSecurityGroup

  # ------------------------------------------------------------
  # Production Environment Resources
  # ------------------------------------------------------------

  # Production VPC
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 192.168.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: ProdVPC

  # Production Public Subnet
  ProdPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 192.168.1.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ] # Dynamically select the first AZ
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdPublicSubnet

  # Production Private Subnet
  ProdPrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 192.168.2.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ] # Dynamically select the second AZ
      Tags:
        - Key: Name
          Value: ProdPrivateSubnet

  # Internet Gateway for Prod VPC
  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProdInternetGateway

  AttachProdGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  # EIP and NAT Gateway for Prod Private Subnet
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachProdGateway
    Properties:
      Domain: vpc
  
  ProdNatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref ProdPublicSubnet
      Tags:
        - Key: Name
          Value: ProdNatGateway

  # Route Tables for Prod VPC
  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdPublicRouteTable
  
  ProdPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachProdGateway
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProdInternetGateway

  AssociateProdPublicSubnetRouteTable:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet
      RouteTableId: !Ref ProdPublicRouteTable
      
  ProdPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdPrivateRouteTable

  ProdPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProdNatGateway

  AssociateProdPrivateSubnetRouteTable:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet
      RouteTableId: !Ref ProdPrivateRouteTable

  # Production Security Group for Web Traffic
  ProdSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: "Prod Web Access"
      GroupDescription: "Allow HTTP and HTTPS access from the internet"
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: ProdSecurityGroup

  # Auto Scaling Group resources for Production
  ProdLaunchConfiguration:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      LaunchConfigurationName: ProdWebServersLaunchConfig
      ImageId: "ami-0c55b159cbfafe1f0" # Amazon Linux 2 in us-east-1
      InstanceType: "t2.micro"
      SecurityGroups:
        - !Ref ProdSecurityGroup

  ProdAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: ProdAutoScalingGroup
      VPCZoneIdentifier:
        - !Ref ProdPrivateSubnet # Deploy instances in the private subnet
      LaunchConfigurationName: !Ref ProdLaunchConfiguration
      MinSize: "1"
      MaxSize: "3"
      DesiredCapacity: "1"
      Tags:
        - Key: Name
          Value: ProdWebServerInstance
          PropagateAtLaunch: true

# ------------------------------------------------------------
# Outputs Section
# ------------------------------------------------------------
Outputs:
  DevelopmentVPCID:
    Description: "The VPC ID of the Development environment"
    Value: !Ref DevVPC
    Export:
      Name: !Sub "${AWS::StackName}-DevVPCID"

  ProductionVPCID:
    Description: "The VPC ID of the Production environment"
    Value: !Ref ProdVPC
    Export:
      Name: !Sub "${AWS::StackName}-ProdVPCID"

  ProductionPublicSubnetIDs:
    Description: "The Subnet ID of the Production public subnet"
    Value: !Ref ProdPublicSubnet
    Export:
      Name: !Sub "${AWS::StackName}-ProdPublicSubnetID"

  ProductionPrivateSubnetIDs:
    Description: "The Subnet ID of the Production private subnet"
    Value: !Ref ProdPrivateSubnet
    Export:
      Name: !Sub "${AWS::StackName}-ProdPrivateSubnetID"

  ProductionAutoScalingGroupName:
    Description: "The name of the Production Auto Scaling Group"
    Value: !Ref ProdAutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-ProdASGName"
```