AWSTemplateFormatVersion: '2010-09-09'
Description: >-
  Production-ready scalable web application infrastructure for us-west-2:
  LaunchTemplate (EC2 t2.micro), ALB, AutoScaling (min 2 / max 5), IAM role,
  tagging (Environment=Production, Application=WebApp), and region enforcement.

# -------------------------
# Parameters
# -------------------------
Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID from SSM Parameter Store'
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Suffix for resource names (alphanumeric only)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

# -------------------------
# Conditions (region enforcement)
# -------------------------
Conditions:
  IsUsWest2: !Equals [ !Ref "AWS::Region", "us-west-2" ]
  IsNotUsWest2: !Not [ !Condition IsUsWest2 ]

# -------------------------
# Resources
# -------------------------
Resources:
  # WaitConditionHandle always created; WaitCondition will be created only when not us-west-2.
  # WaitCondition times out immediately causing stack failure — this enforces us-west-2 deployments.
  RegionFailHandle:
    Type: AWS::CloudFormation::WaitConditionHandle

  RegionFail:
    Type: AWS::CloudFormation::WaitCondition
    Condition: IsNotUsWest2
    DependsOn: RegionFailHandle
    Properties:
      Handle: !Ref RegionFailHandle
      Timeout: 1
      Count: 1

  # VPC and networking
  WebAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-IGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref WebAppVPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-Public-Subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-Public-Subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-Public-RT-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

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
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security group for EC2 instances
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow HTTP and SSH to web servers'
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH from anywhere (consider restricting in prod)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound'
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-EC2-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Security group for ALB
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'ALB SG - allow inbound HTTP'
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'ALB HTTP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound'
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-ALB-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # IAM Role and Instance Profile for EC2
  WebAppEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'WebApp-EC2-Role-${EnvironmentSuffix}'
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
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  WebAppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'WebApp-Instance-Profile-${EnvironmentSuffix}'
      Roles:
        - !Ref WebAppEC2Role

  # Launch Template (no KeyName to avoid undefined refs)
  WebAppLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "WebApp-LaunchTemplate-${EnvironmentSuffix}"
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt WebAppInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        # user data installs httpd and writes simple page
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl enable --now httpd
            echo "<h1>Hello from WebApp Instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
            echo "<p>AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'WebApp-Instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: 'Production'
              - Key: Application
                Value: 'WebApp'

  # Application Load Balancer
  WebAppLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'WebApp-LoadBalancer-${EnvironmentSuffix}'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-LoadBalancer-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  WebAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'WebApp-TargetGroup-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref WebAppVPC
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-TargetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  WebAppListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref WebAppLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebAppTargetGroup

  # AutoScaling Group
  WebAppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'WebApp-ASG-${EnvironmentSuffix}'
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref WebAppLaunchTemplate
        Version: !GetAtt WebAppLaunchTemplate.LatestVersionNumber
      MinSize: '2'
      MaxSize: '5'
      DesiredCapacity: '2'
      TargetGroupARNs:
        - !Ref WebAppTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'WebApp-ASG-Instance-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: 'Production'
          PropagateAtLaunch: true
        - Key: Application
          Value: 'WebApp'
          PropagateAtLaunch: true

  # Simple scaling policies (used by CloudWatch alarms below)
  WebAppScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebAppAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: '1'
      Cooldown: '300'

  WebAppScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebAppAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: '-1'
      Cooldown: '300'

  # CloudWatch Alarms (trigger simple scaling policies)
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'WebApp-CPU-High-${EnvironmentSuffix}'
      AlarmDescription: 'Scale up when average ASG CPU > 70%'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebAppAutoScalingGroup
      AlarmActions:
        - !Ref WebAppScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'WebApp-CPU-Low-${EnvironmentSuffix}'
      AlarmDescription: 'Scale down when average ASG CPU < 25%'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebAppAutoScalingGroup
      AlarmActions:
        - !Ref WebAppScaleDownPolicy


# -------------------------
# Outputs
# -------------------------
Outputs:
  LoadBalancerDNS:
    Description: 'Public DNS name of the Application Load Balancer'
    Value: !GetAtt WebAppLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  LoadBalancerURL:
    Description: 'URL of the Application Load Balancer'
    Value: !Sub 'http://${WebAppLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-URL'

  VPCId:
    Description: 'VPC ID for the web application'
    Value: !Ref WebAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

