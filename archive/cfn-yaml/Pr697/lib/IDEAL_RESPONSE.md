```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - EnvironmentSuffix
    ParameterLabels:
      EnvironmentSuffix:
        default: "Environment"

# Parameters section for configurable values
Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID from Systems Manager Parameter Store'
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Conditions:
  IsUsWest2: !Equals [ !Ref "AWS::Region", "us-west-2" ]

# Resources section - defines all AWS resources
Resources:
  # Region check resource - fails deployment if not in us-west-2
  RegionCheck:
    Type: AWS::CloudFormation::WaitConditionHandle
    Condition: IsUsWest2
    Metadata:
      Comment: "This resource exists only to enforce us-west-2 region restriction"
  # VPC and Networking Components
  WebAppVPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'WebApp-VPC'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Internet Gateway for public internet access
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: 'WebApp-IGW'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref WebAppVPC

  # Public Subnet 1 in first Availability Zone
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref WebAppVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'WebApp-Public-Subnet-1'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Public Subnet 2 in second Availability Zone (required for ELB)
  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref WebAppVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'WebApp-Public-Subnet-2'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Route Table for public subnets
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: 'WebApp-Public-Routes'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Default public route to Internet Gateway
  DefaultPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate public subnets with route table
  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Security Group for EC2 instances
  WebServerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'WebApp-SecurityGroup'
      GroupDescription: 'Security group for web application EC2 instances'
      VpcId: !Ref WebAppVPC
      # Inbound rules
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'Allow SSH access from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTP traffic from Load Balancer'
      # Outbound rules (unrestricted)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'WebApp-EC2-SecurityGroup'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Security Group for Load Balancer
  LoadBalancerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'WebApp-LoadBalancer-SecurityGroup'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'WebApp-LoadBalancer-SecurityGroup'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # IAM Role for EC2 instances
  WebAppEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      # Attach managed policy for S3 read-only access
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Tags:
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Instance Profile for EC2 instances
  WebAppInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref WebAppEC2Role

  # Launch Template for Auto Scaling Group
  WebAppLaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName:
        Fn::Sub: "WebApp-LaunchTemplate-${EnvironmentSuffix}"
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: 't2.micro'
        IamInstanceProfile:
          Arn: !GetAtt WebAppInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        # User data script to install and start Apache web server
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from WebApp Instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: 'instance'
            Tags:
              - Key: Name
                Value: 'WebApp-Instance'
              - Key: Environment
                Value: 'Production'
              - Key: Application
                Value: 'WebApp'

  # Application Load Balancer
  WebAppLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Name: 'WebApp-LoadBalancer'
      Scheme: 'internet-facing'
      Type: 'application'
      IpAddressType: 'ipv4'
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: 'WebApp-LoadBalancer'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Target Group for Load Balancer
  WebAppTargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: 'WebApp-TargetGroup'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref WebAppVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/'
      HealthCheckProtocol: 'HTTP'
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: 'instance'
      Tags:
        - Key: Name
          Value: 'WebApp-TargetGroup'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'WebApp'

  # Load Balancer Listener
  WebAppListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      DefaultActions:
        - Type: 'forward'
          TargetGroupArn: !Ref WebAppTargetGroup
      LoadBalancerArn: !Ref WebAppLoadBalancer
      Port: 80
      Protocol: 'HTTP'

  # Auto Scaling Group
  WebAppAutoScalingGroup:
    Type: 'AWS::AutoScaling::AutoScalingGroup'
    Properties:
      AutoScalingGroupName: 'WebApp-AutoScalingGroup'
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
      HealthCheckType: 'ELB'
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: 'WebApp-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: 'Production'
          PropagateAtLaunch: true
        - Key: Application
          Value: 'WebApp'
          PropagateAtLaunch: true

  # Auto Scaling Policy for Scale Up
  WebAppScaleUpPolicy:
    Type: 'AWS::AutoScaling::ScalingPolicy'
    Properties:
      AdjustmentType: 'ChangeInCapacity'
      AutoScalingGroupName: !Ref WebAppAutoScalingGroup
      Cooldown: '300'
      ScalingAdjustment: '1'
      PolicyType: 'SimpleScaling'

  # Auto Scaling Policy for Scale Down
  WebAppScaleDownPolicy:
    Type: 'AWS::AutoScaling::ScalingPolicy'
    Properties:
      AdjustmentType: 'ChangeInCapacity'
      AutoScalingGroupName: !Ref WebAppAutoScalingGroup
      Cooldown: '300'
      ScalingAdjustment: '-1'
      PolicyType: 'SimpleScaling'

  # CloudWatch Alarm for High CPU (Scale Up)
  CPUAlarmHigh:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: 'WebApp-CPU-High'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
      MetricName: 'CPUUtilization'
      Namespace: 'AWS/EC2'
      Statistic: 'Average'
      Period: '300'
      EvaluationPeriods: '2'
      Threshold: '70'
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'AutoScalingGroupName'
          Value: !Ref WebAppAutoScalingGroup
      AlarmActions:
        - !Ref WebAppScaleUpPolicy

  # CloudWatch Alarm for Low CPU (Scale Down)
  CPUAlarmLow:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: 'WebApp-CPU-Low'
      AlarmDescription: 'Alarm when CPU falls below 25%'
      MetricName: 'CPUUtilization'
      Namespace: 'AWS/EC2'
      Statistic: 'Average'
      Period: '300'
      EvaluationPeriods: '2'
      Threshold: '25'
      ComparisonOperator: 'LessThanThreshold'
      Dimensions:
        - Name: 'AutoScalingGroupName'
          Value: !Ref WebAppAutoScalingGroup
      AlarmActions:
        - !Ref WebAppScaleDownPolicy
  
# Outputs section - returns important values
Outputs:
  LoadBalancerDNS:
    Description: 'Public DNS name of the Application Load Balancer'
    Value: !GetAtt WebAppLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  LoadBalancerURL:
    Description: 'URL of the Application Load Balancer'
    Value: !Sub 'http://${WebAppLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerURL'

  VPCId:
    Description: 'VPC ID for the web application'
    Value: !Ref WebAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'
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
```
