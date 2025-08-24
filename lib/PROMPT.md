AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation Template for a Secure, Highly Available Web Application

Parameters:
DBUsername:
Type: String
Default: admin
NoEcho: true
DBPassword:
Type: String
Default: password
NoEcho: true
KeyPairName:
Type: String
Description: EC2 Key Pair Name
LatestAmiId:
Type: String
Description: Latest Amazon Linux 2 AMI ID
Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Resources:

# Networking

VPC:
Type: AWS::EC2::VPC
Properties:
CidrBlock: 10.0.0.0/16
EnableDnsSupport: 'true'
EnableDnsHostnames: 'true'
Tags: - Key: Environment
Value: Production

PublicSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
CidrBlock: 10.0.0.0/24
AvailabilityZone: us-east-1a
MapPublicIpOnLaunch: 'true'
Tags: - Key: Environment
Value: Production

PublicSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
CidrBlock: 10.0.1.0/24
AvailabilityZone: us-east-1b
MapPublicIpOnLaunch: 'true'
Tags: - Key: Environment
Value: Production

PrivateSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
CidrBlock: 10.0.10.0/24
AvailabilityZone: us-east-1a
Tags: - Key: Environment
Value: Production

PrivateSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
CidrBlock: 10.0.11.0/24
AvailabilityZone: us-east-1b
Tags: - Key: Environment
Value: Production

InternetGateway:
Type: AWS::EC2::InternetGateway
Properties:
Tags: - Key: Environment
Value: Production

AttachGateway:
Type: AWS::EC2::VPCGatewayAttachment
Properties:
VpcId: !Ref VPC
InternetGatewayId: !Ref InternetGateway

NatGatewayEIP1:
Type: AWS::EC2::EIP
Properties:
Domain: vpc

NatGatewayEIP2:
Type: AWS::EC2::EIP
Properties:
Domain: vpc

NatGateway1:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGatewayEIP1.AllocationId
SubnetId: !Ref PublicSubnet1
Tags: - Key: Environment
Value: Production

NatGateway2:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGatewayEIP2.AllocationId
SubnetId: !Ref PublicSubnet2
Tags: - Key: Environment
Value: Production

PublicRouteTable:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Environment
Value: Production

PublicRoute:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PublicRouteTable
DestinationCidrBlock: 0.0.0.0/0
GatewayId: !Ref InternetGateway

PrivateRouteTable1:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Environment
Value: Production

PrivateRoute1:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable1
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway1

PrivateRouteTable2:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Environment
Value: Production

PrivateRoute2:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable2
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway2

# Load Balancing & Compute

ALB:
Type: AWS::ElasticLoadBalancingV2::LoadBalancer
Properties:
Name: !Sub '${AWS::StackName}-alb'
Subnets: - !Ref PublicSubnet1 - !Ref PublicSubnet2
SecurityGroups: - !Ref ALBSecurityGroup
Tags: - Key: Environment
Value: Production

ALBSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupDescription: Allow inbound HTTP from the internet
VpcId: !Ref VPC
SecurityGroupIngress: - IpProtocol: tcp
FromPort: '80'
ToPort: '80'
CidrIp: 0.0.0.0/0
Tags: - Key: Environment
Value: Production

TargetGroup:
Type: AWS::ElasticLoadBalancingV2::TargetGroup
Properties:
Name: !Sub '${AWS::StackName}-tg'
Port: '80'
Protocol: HTTP
VpcId: !Ref VPC
TargetType: instance
HealthCheckProtocol: HTTP
HealthCheckPort: '80'
HealthCheckPath: /
Matcher:
HttpCode: '200'
Tags: - Key: Environment
Value: Production

Listener:
Type: AWS::ElasticLoadBalancingV2::Listener
Properties:
LoadBalancerArn: !Ref ALB
Port: '80'
Protocol: HTTP
DefaultActions: - Type: forward
TargetGroupArn: !Ref TargetGroup

LaunchTemplate:
Type: AWS::EC2::LaunchTemplate
Properties:
LaunchTemplateName: !Sub '${AWS::StackName}-lt'
LaunchTemplateData:
InstanceType: t3.micro
ImageId: !Ref LatestAmiId
KeyName: !Ref KeyPairName
SecurityGroupIds: - !Ref EC2SecurityGroup
UserData:
Fn::Base64: !Sub |
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
TagSpecifications: - ResourceType: instance
Tags: - Key: Environment
Value: Production

EC2SecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupDescription: Allow inbound HTTP from the ALB
VpcId: !Ref VPC
SecurityGroupIngress: - IpProtocol: tcp
FromPort: '80'
ToPort: '80'
SourceSecurityGroupId: !Ref ALBSecurityGroup
Tags: - Key: Environment
Value: Production

AutoScalingGroup:
Type: AWS::AutoScaling::AutoScalingGroup
Properties:
VPCZoneIdentifier: - !Ref PrivateSubnet1 - !Ref PrivateSubnet2
LaunchTemplate:
LaunchTemplateId: !Ref LaunchTemplate
Version: !GetAtt LaunchTemplate.LatestVersionNumber
MinSize: '2'
MaxSize: '4'
DesiredCapacity: '2'
HealthCheckType: ELB
Tags: - Key: Environment
Value: Production
PropagateAtLaunch: 'true'

# Database

DBSubnetGroup:
Type: AWS::RDS::DBSubnetGroup
Properties:
DBSubnetGroupDescription: !Sub '${AWS::StackName} DB Subnet Group'
SubnetIds: - !Ref PrivateSubnet1 - !Ref PrivateSubnet2
Tags: - Key: Environment
Value: Production

RDSInstance:
Type: AWS::RDS::DBInstance
Properties:
DBInstanceClass: db.t3.micro
Engine: mysql
MasterUsername: !Ref DBUsername
MasterUserPassword: !Ref DBPassword
DBSubnetGroupName: !Ref DBSubnetGroup
VPCSecurityGroups: - !Ref RDSSecurityGroup
Tags: - Key: Environment
Value: Production

RDSSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupDescription: Allow inbound MySQL from the EC2 instances
VpcId: !Ref VPC
SecurityGroupIngress: - IpProtocol: tcp
FromPort: '3306'
ToPort: '3306'
SourceSecurityGroupId: !Ref EC2SecurityGroup
Tags: - Key: Environment
Value: Production

# Outputs

Outputs:
ALBDNSName:
Description: DNS Name of the Application Load Balancer
Value: !GetAtt ALB.DNSName
Export:
Name: !Sub '${AWS::StackName}-ALBDNSName'

VPCID:
Description: VPC ID
Value: !Ref VPC
Export:
Name: !Sub '${AWS::StackName}-VPCID'

PublicSubnet1ID:
Description: Public Subnet 1 ID
Value: !Ref PublicSubnet1
Export:
Name: !Sub '${AWS::StackName}-PublicSubnet1ID'

PublicSubnet2ID:
Description: Public Subnet 2 ID
Value: !Ref PublicSubnet2
Export:
Name: !Sub '${AWS::StackName}-PublicSubnet2ID'

PrivateSubnet1ID:
Description: Private Subnet 1 ID
Value: !Ref PrivateSubnet1
Export:
Name: !Sub '${AWS::StackName}-PrivateSubnet1ID'

PrivateSubnet2ID:
Description: Private Subnet 2 ID
Value: !Ref PrivateSubnet2
Export:
Name: !Sub '${AWS::StackName}-PrivateSubnet2ID'

RDSInstanceEndpoint:
Description: RDS Instance Endpoint
Value: !GetAtt RDSInstance.Endpoint.Address
Export:
Name: !Sub '${AWS::StackName}-RDSInstanceEndpoint'
