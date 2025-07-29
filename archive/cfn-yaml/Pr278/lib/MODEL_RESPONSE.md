```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy a high-availability web application in us-west-2

Resources:
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties: 
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: ProdVPC

  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref ProdVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdPublicSubnet1

  ProdPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref ProdVPC
      AvailabilityZone: us-west-2b
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdPublicSubnet2

  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProdInternetGateway

  ProdIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  ProdRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdRouteTable

  ProdRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdIGWAttachment
    Properties:
      RouteTableId: !Ref ProdRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProdInternetGateway

  ProdSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet1
      RouteTableId: !Ref ProdRouteTable

  ProdSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet2
      RouteTableId: !Ref ProdRouteTable

  ProdALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP traffic from the internet
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: ProdALBSecurityGroup

  ProdEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP traffic from ALB
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ProdALBSecurityGroup
      Tags:
        - Key: Name
          Value: ProdEC2SecurityGroup

  ProdInstance1:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI in us-west-2
      SubnetId: !Ref ProdPublicSubnet1
      SecurityGroupIds:
        - !Ref ProdEC2SecurityGroup
      Tags:
        - Key: Name
          Value: ProdInstance1

  ProdInstance2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI in us-west-2
      SubnetId: !Ref ProdPublicSubnet2
      SecurityGroupIds:
        - !Ref ProdEC2SecurityGroup
      Tags:
        - Key: Name
          Value: ProdInstance2

  ProdLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ProdLoadBalancer
      Subnets: 
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      SecurityGroups: 
        - !Ref ProdALBSecurityGroup
      Scheme: internet-facing
      Tags:
        - Key: Name
          Value: ProdLoadBalancer

  ProdTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ProdTargetGroup
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProdVPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 5
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: '200'
      Targets:
        - Id: !Ref ProdInstance1
        - Id: !Ref ProdInstance2

  ProdListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ProdLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ProdTargetGroup
```

This CloudFormation template creates a high-availability web application infrastructure in the `us-west-2` region. It includes a VPC with two public subnets, two EC2 instances in different Availability Zones, an Application Load Balancer, and necessary security groups. The ALB is configured to distribute HTTP traffic to the instances, with health checks to ensure availability. The template is ready for deployment and adheres to the specified naming conventions.