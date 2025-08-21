```yaml
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
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
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
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
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

  # Attach Internet Gateway to Dev VPC
  DevAttachGateway:
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

  # Route for Dev Public Subnet to Internet Gateway
  DevPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: DevAttachGateway
    Properties:
      RouteTableId: !Ref DevPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref DevInternetGateway

  # Associate Dev Public Subnet with Route Table
  DevPublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPublicSubnet
      RouteTableId: !Ref DevPublicRouteTable

  # NAT Gateway Elastic IP for Dev Environment
  DevNatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: DevAttachGateway
    Properties:
      Domain: vpc

  # NAT Gateway for Dev Private Subnet
  DevNatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt DevNatGatewayEIP.AllocationId
      SubnetId: !Ref DevPublicSubnet

  # Route Table for Dev Private Subnet
  DevPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: DevPrivateRouteTable

  # Route for Dev Private Subnet to NAT Gateway
  DevPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref DevPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref DevNatGateway

  # Associate Dev Private Subnet with Route Table
  DevPrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DevPrivateSubnet
      RouteTableId: !Ref DevPrivateRouteTable

  # Development Security Group
  DevSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Development environment
      VpcId: !Ref DevVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: Allow SSH access
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP access
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
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
      CidrBlock: 10.1.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: ProdVPC

  # Production Public Subnet 1
  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.1.1.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdPublicSubnet1

  # Production Public Subnet 2
  ProdPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.1.2.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdPublicSubnet2

  # Production Private Subnet 1
  ProdPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.1.3.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: ProdPrivateSubnet1

  # Production Private Subnet 2
  ProdPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.1.4.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: ProdPrivateSubnet2

  # Internet Gateway for Prod VPC
  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProdInternetGateway

  # Attach Internet Gateway to Prod VPC
  ProdAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  # Route Table for Prod Public Subnets
  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdPublicRouteTable

  # Route for Prod Public Subnets to Internet Gateway
  ProdPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdAttachGateway
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProdInternetGateway

  # Associate Prod Public Subnet 1 with Route Table
  ProdPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet1
      RouteTableId: !Ref ProdPublicRouteTable

  # Associate Prod Public Subnet 2 with Route Table
  ProdPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet2
      RouteTableId: !Ref ProdPublicRouteTable

  # NAT Gateway Elastic IP 1 for Prod Environment
  ProdNatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: ProdAttachGateway
    Properties:
      Domain: vpc

  # NAT Gateway 1 for Prod Private Subnet
  ProdNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNatGatewayEIP1.AllocationId
      SubnetId: !Ref ProdPublicSubnet1

  # NAT Gateway Elastic IP 2 for Prod Environment
  ProdNatGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: ProdAttachGateway
    Properties:
      Domain: vpc

  # NAT Gateway 2 for Prod Private Subnet
  ProdNatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNatGatewayEIP2.AllocationId
      SubnetId: !Ref ProdPublicSubnet2

  # Route Table for Prod Private Subnet 1
  ProdPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdPrivateRouteTable1

  # Route for Prod Private Subnet 1 to NAT Gateway 1
  ProdPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProdNatGateway1

  # Associate Prod Private Subnet 1 with Route Table
  ProdPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet1
      RouteTableId: !Ref ProdPrivateRouteTable1

  # Route Table for Prod Private Subnet 2
  ProdPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: ProdPrivateRouteTable2

  # Route for Prod Private Subnet 2 to NAT Gateway 2
  ProdPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProdNatGateway2

  # Associate Prod Private Subnet 2 with Route Table
  ProdPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet2
      RouteTableId: !Ref ProdPrivateRouteTable2

  # Production Web Security Group
  ProdWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Production Web servers
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP access
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: ProdWebSecurityGroup

  # Production Backend Security Group
  ProdBackendSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Production Backend servers
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup
          Description: Allow SSH from Web Security Group
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup
          Description: Allow MySQL from Web Security Group
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup
          Description: Allow PostgreSQL from Web Security Group
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: ProdBackendSecurityGroup

  # IAM Role for EC2 Instances
  EC2InstanceRole:
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Name
          Value: EC2InstanceRole

  # Instance Profile for EC2 Instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Launch Template for Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: ProdLaunchTemplate
      LaunchTemplateData:
        ImageId: ami-0e86e20dae9224db8  # Amazon Linux 2023 AMI in us-east-1
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ProdWebSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from Production Auto Scaling Group Instance</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: ProdASGInstance
              - Key: Environment
                Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ProdALB
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      SecurityGroups:
        - !Ref ProdWebSecurityGroup
      Tags:
        - Key: Name
          Value: ProdALB

  # Target Group for ALB
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ProdTargetGroup
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProdVPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: ProdTargetGroup

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: ProdAutoScalingGroup
      VPCZoneIdentifier:
        - !Ref ProdPrivateSubnet1
        - !Ref ProdPrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 4
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: ProdASGInstance
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # Scaling Policy - Scale Up
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: 1
      Cooldown: 300

  # Scaling Policy - Scale Down
  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: -1
      Cooldown: 300

  # CloudWatch Alarm - High CPU
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ProdHighCPU
      AlarmDescription: Alarm when CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  # CloudWatch Alarm - Low CPU
  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ProdLowCPU
      AlarmDescription: Alarm when CPU is below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

# ------------------------------------------------------------
# Outputs
# ------------------------------------------------------------
Outputs:
  # Development Outputs
  DevVPCId:
    Description: Development VPC ID
    Value: !Ref DevVPC
    Export:
      Name: !Sub ${AWS::StackName}-DevVPCId

  DevPublicSubnetId:
    Description: Development Public Subnet ID
    Value: !Ref DevPublicSubnet
    Export:
      Name: !Sub ${AWS::StackName}-DevPublicSubnetId

  DevPrivateSubnetId:
    Description: Development Private Subnet ID
    Value: !Ref DevPrivateSubnet
    Export:
      Name: !Sub ${AWS::StackName}-DevPrivateSubnetId

  DevSecurityGroupId:
    Description: Development Security Group ID
    Value: !Ref DevSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-DevSecurityGroupId

  # Production Outputs
  ProdVPCId:
    Description: Production VPC ID
    Value: !Ref ProdVPC
    Export:
      Name: !Sub ${AWS::StackName}-ProdVPCId

  ProdPublicSubnet1Id:
    Description: Production Public Subnet 1 ID
    Value: !Ref ProdPublicSubnet1
    Export:
      Name: !Sub ${AWS::StackName}-ProdPublicSubnet1Id

  ProdPublicSubnet2Id:
    Description: Production Public Subnet 2 ID
    Value: !Ref ProdPublicSubnet2
    Export:
      Name: !Sub ${AWS::StackName}-ProdPublicSubnet2Id

  ProdPrivateSubnet1Id:
    Description: Production Private Subnet 1 ID
    Value: !Ref ProdPrivateSubnet1
    Export:
      Name: !Sub ${AWS::StackName}-ProdPrivateSubnet1Id

  ProdPrivateSubnet2Id:
    Description: Production Private Subnet 2 ID
    Value: !Ref ProdPrivateSubnet2
    Export:
      Name: !Sub ${AWS::StackName}-ProdPrivateSubnet2Id

  ProdWebSecurityGroupId:
    Description: Production Web Security Group ID
    Value: !Ref ProdWebSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-ProdWebSecurityGroupId

  ProdBackendSecurityGroupId:
    Description: Production Backend Security Group ID
    Value: !Ref ProdBackendSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-ProdBackendSecurityGroupId

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${AWS::StackName}-AutoScalingGroupName

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${AWS::StackName}-ALBDNSName

  ApplicationLoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub http://${ApplicationLoadBalancer.DNSName}
    Export:
      Name: !Sub ${AWS::StackName}-ALBURL
```