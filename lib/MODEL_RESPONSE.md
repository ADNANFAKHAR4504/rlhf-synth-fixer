# Secure Web Application Infrastructure CloudFormation Template

I'll create a production-ready CloudFormation template that implements all the specified requirements with security best practices, high availability, and scalability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure web application infrastructure with ALB and Auto Scaling - Batch 003 Project 166'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - 'development'
      - 'staging'
      - 'production'
    Description: 'Environment name for resource tagging and naming'
    ConstraintDescription: 'Must be development, staging, or production'

  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - 't3.micro'
      - 't3.small'
      - 't3.medium'
      - 't3.large'
      - 'm5.large'
      - 'm5.xlarge'
    Description: 'EC2 instance type for web servers'
    ConstraintDescription: 'Must be a valid EC2 instance type'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'Optional: EC2 Key Pair for emergency access (leave empty for no SSH access)'
    ConstraintDescription: 'Must be the name of an existing EC2 KeyPair or empty'

  MinSize:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Minimum number of EC2 instances in Auto Scaling Group'
    ConstraintDescription: 'Must be between 2 and 10'

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    MaxValue: 20
    Description: 'Maximum number of EC2 instances in Auto Scaling Group'
    ConstraintDescription: 'Must be between 2 and 20'

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Desired number of EC2 instances in Auto Scaling Group'
    ConstraintDescription: 'Must be between 2 and 10'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for VPC'
    ConstraintDescription: 'Must be a valid CIDR range'

  EnablePrivateSubnets:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Enable private subnets for enhanced security'

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  CreatePrivateSubnets: !Equals [!Ref EnablePrivateSubnets, 'true']
  IsProduction: !Equals [!Ref Environment, 'production']

# =============================================================================
# MAPPINGS
# =============================================================================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.4.0/24'
    PrivateSubnet1:
      CIDR: '10.0.2.0/24'
    PrivateSubnet2:
      CIDR: '10.0.3.0/24'

# =============================================================================
# RESOURCES
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING
  # ---------------------------------------------------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'IaC-AWS-Nova-Model-Breaking'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
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
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Private Subnets (Conditional)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Condition: CreatePrivateSubnets
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Condition: CreatePrivateSubnets
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  # NAT Gateways (Conditional)
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: CreatePrivateSubnets
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    Condition: CreatePrivateSubnets
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-2'
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Condition: CreatePrivateSubnets
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Condition: CreatePrivateSubnets
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'
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

  # Private Route Tables (Conditional)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Condition: CreatePrivateSubnets
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-routes-1'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Condition: CreatePrivateSubnets
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: CreatePrivateSubnets
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Condition: CreatePrivateSubnets
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-routes-2'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Condition: CreatePrivateSubnets
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: CreatePrivateSubnets
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow HTTP traffic to web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-webserver-sg'
      GroupDescription: 'Security group for web server instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP outbound for package updates'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS outbound for package updates'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'Allow DNS queries'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'Allow DNS queries'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-webserver-sg'
        - Key: Environment
          Value: !Ref Environment

  # Optional SSH Security Group Rule
  WebServerSSHRule:
    Type: AWS::EC2::SecurityGroupIngress
    Condition: HasKeyPair
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      CidrIp: 10.0.0.0/16
      Description: 'Allow SSH from VPC (emergency access only)'

  # ---------------------------------------------------------------------------
  # IAM ROLES AND POLICIES
  # ---------------------------------------------------------------------------
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-webserver-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: WebServerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - ec2:DescribeVolumes
                  - ec2:DescribeTags
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-webserver-role'
        - Key: Environment
          Value: !Ref Environment

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-webserver-profile'
      Roles:
        - !Ref WebServerRole

  # ---------------------------------------------------------------------------
  # LAUNCH TEMPLATE
  # ---------------------------------------------------------------------------
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-webserver-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt WebServerInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeType: gp3
              VolumeSize: 20
              DeleteOnTermination: true
              Encrypted: !If [IsProduction, true, false]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Create a simple web page
            cat > /var/www/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>Secure Web Application - ${Environment}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
                    .container { background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    .info { margin: 20px 0; }
                    .status { color: #27ae60; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">🚀 Secure Web Application Infrastructure</h1>
                    <div class="info">
                        <p><strong>Environment:</strong> ${Environment}</p>
                        <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                        <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                        <p><strong>Status:</strong> <span class="status"> Healthy</span></p>
                        <p><strong>Project:</strong> IaC - AWS Nova Model Breaking</p>
                        <p><strong>Stack:</strong> ${AWS::StackName}</p>
                    </div>
                    <hr>
                    <p><em>This infrastructure follows AWS Well-Architected Framework principles with security, reliability, and scalability built-in.</em></p>
                </div>
                
                <script>
                    // Fetch instance metadata
                    fetch('http://169.254.169.254/latest/meta-data/instance-id')
                        .then(response => response.text())
                        .then(data => document.getElementById('instance-id').textContent = data)
                        .catch(() => document.getElementById('instance-id').textContent = 'N/A');
                    
                    fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
                        .then(response => response.text())
                        .then(data => document.getElementById('az').textContent = data)
                        .catch(() => document.getElementById('az').textContent = 'N/A');
                </script>
            </body>
            </html>
            EOF
            
            # Create health check endpoint
            cat > /var/www/html/health << 'EOF'
            OK
            EOF
            
            # Start and enable httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 300
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 300,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 300
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/httpd/access_log",
                                    "log_group_name": "${AWS::StackName}-webserver-access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/httpd/error_log",
                                    "log_group_name": "${AWS::StackName}-webserver-error",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Signal CloudFormation
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-webserver'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: 'IaC-AWS-Nova-Model-Breaking'

  # ---------------------------------------------------------------------------
  # APPLICATION LOAD BALANCER
  # ---------------------------------------------------------------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: access_logs.s3.enabled
          Value: 'false'
        - Key: deletion_protection.enabled
          Value: !If [IsProduction, 'true', 'false']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: Environment
          Value: !Ref Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '300'
        - Key: stickiness.enabled
          Value: 'false'
        - Key: load_balancing.cross_zone.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ---------------------------------------------------------------------------
  # AUTO SCALING GROUP
  # ---------------------------------------------------------------------------
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier: !If
        - CreatePrivateSubnets
        - [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
        - [!Ref PublicSubnet1, !Ref PublicSubnet2]
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      DefaultCooldown: 300
      TerminationPolicies:
        - OldestInstance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: 'IaC-AWS-Nova-Model-Breaking'
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: !Ref DesiredCapacity
        Timeout: PT15M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT15M
        WaitOnResourceSignals: true

  # ---------------------------------------------------------------------------
  # SCALING POLICIES AND CLOUDWATCH ALARMS
  # ---------------------------------------------------------------------------
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cpu-high'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
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

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cpu-low'
      AlarmDescription: 'Alarm when CPU is below 25%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # ---------------------------------------------------------------------------
  # CLOUDWATCH LOG GROUPS
  # ---------------------------------------------------------------------------
  WebServerAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}-webserver-access'
      RetentionInDays: !If [IsProduction, 90, 7]

  WebServerErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}-webserver-error'
      RetentionInDays: !If [IsProduction, 90, 7]

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnets:
    Description: 'List of public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Condition: CreatePrivateSubnets
    Description: 'List of private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  LoadBalancerURL:
    Description: 'URL of the