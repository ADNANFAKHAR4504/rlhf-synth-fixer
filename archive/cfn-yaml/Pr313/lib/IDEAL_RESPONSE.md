```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and scalable web application infrastructure with VPC, ALB, Auto Scaling Group, and EC2 instances'

# =============================================================================
# PARAMETERS SECTION
# =============================================================================
Parameters:
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
    Description: Latest Amazon Linux 2023 AMI ID from SSM Parameter Store

  EnvironmentSuffix:
    Type: String
    Description: Suffix for the environment (e.g., dev, prod)
    Default: dev
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.

  ProjectName:
    Type: String
    Description: Name of the project for resource tagging
    Default: SecureWebApp
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.

  VpcCIDR:
    Description: CIDR block for this VPC
    Type: String
    Default: 10.192.0.0/16
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$

  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in the first Availability Zone
    Type: String
    Default: 10.192.10.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in the second Availability Zone
    Type: String
    Default: 10.192.11.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for the private subnet in the first Availability Zone
    Type: String
    Default: 10.192.20.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for the private subnet in the second Availability Zone
    Type: String
    Default: 10.192.21.0/24

  InstanceType:
    Description: EC2 instance type for web servers
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

# =============================================================================
# RESOURCES SECTION
# =============================================================================
Resources:

  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING RESOURCES
  # ---------------------------------------------------------------------------
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-VPC
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-IGW
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets (for ALB)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Public-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Public-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets (for EC2 instances - more secure)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Private-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Private-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateways for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-NAT-Gateway-1-EIP
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-NAT-Gateway-2-EIP
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-NAT-Gateway-AZ1
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-NAT-Gateway-AZ2
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Public-Routes
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Private-Routes-AZ1
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-Private-Routes-AZ2
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------

  # ALB Security Group - allows HTTP/HTTPS from internet
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from anywhere
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.192.0.0/16
          Description: Allow HTTP traffic to web servers
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-ALB-SecurityGroup
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # Web Server Security Group - only allows traffic from ALB
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web server instances - allows traffic only from ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB only
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP for package updates
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS for package updates
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-WebServer-SecurityGroup
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # ---------------------------------------------------------------------------
  # IAM ROLES AND INSTANCE PROFILE
  # ---------------------------------------------------------------------------

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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-EC2-Instance-Role
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # ---------------------------------------------------------------------------
  # APPLICATION LOAD BALANCER
  # ---------------------------------------------------------------------------

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentSuffix}-ALB
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-ALB
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentSuffix}-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-TG
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

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
  # LAUNCH TEMPLATE AND AUTO SCALING GROUP
  # ---------------------------------------------------------------------------

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentSuffix}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            dnf update -y
            
            # Install and configure Apache
            dnf install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple HTML page with instance information
            cat <<EOF > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>SecureWebApp - ${EnvironmentSuffix}</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        padding: 40px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: rgba(255,255,255,0.1); 
                        padding: 30px; 
                        border-radius: 15px; 
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
                    }
                    h1 { text-align: center; margin-bottom: 30px; font-size: 2.5em; }
                    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
                    .info-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); }
                    .info-card h3 { margin-top: 0; color: #ffd700; }
                    .status { color: #00ff88; font-weight: bold; font-size: 1.2em; }
                    .metadata { font-family: 'Courier New', monospace; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 SecureWebApp</h1>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <h3>📊 Environment Info</h3>
                            <p><strong>Environment:</strong> ${EnvironmentSuffix}</p>
                            <p><strong>Project:</strong> SecureWebApp</p>
                            <p><strong>Status:</strong> <span class="status">✅ Online & Secure</span></p>
                        </div>
                        
                        <div class="info-card">
                            <h3>🖥️ Instance Details</h3>
                            <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                            <p><strong>Instance Type:</strong> ${InstanceType}</p>
                            <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                        </div>
                        
                        <div class="info-card">
                            <h3>🏗️ Infrastructure</h3>
                            <p><strong>VPC:</strong> Custom VPC</p>
                            <p><strong>Subnet:</strong> Private Subnet</p>
                            <p><strong>Load Balancer:</strong> Application Load Balancer</p>
                        </div>
                        
                        <div class="info-card">
                            <h3>🔒 Security Features</h3>
                            <p>✅ Traffic restricted to ALB only</p>
                            <p>✅ Private subnet deployment</p>
                            <p>✅ Auto Scaling enabled</p>
                            <p>✅ Health checks active</p>
                        </div>
                    </div>
                    
                    <div class="metadata">
                        <strong>Instance Metadata:</strong><br>
                        <span id="metadata">Fetching metadata...</span>
                    </div>
                </div>
                
                <script>
                    // Fetch instance metadata
                    Promise.all([
                        fetch('http://169.254.169.254/latest/meta-data/instance-id'),
                        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone'),
                        fetch('http://169.254.169.254/latest/meta-data/local-ipv4'),
                        fetch('http://169.254.169.254/latest/meta-data/ami-id')
                    ]).then(responses => 
                        Promise.all(responses.map(r => r.text()))
                    ).then(([instanceId, az, localIp, amiId]) => {
                        document.getElementById('instance-id').textContent = instanceId;
                        document.getElementById('az').textContent = az;
                        document.getElementById('metadata').innerHTML = 
                            'Instance ID: ' + instanceId + '<br>' +
                            'Local IP: ' + localIp + '<br>' +
                            'AMI ID: ' + amiId + '<br>' +
                            'Deployment Time: ' + new Date().toISOString();
                    }).catch(error => {
                        document.getElementById('instance-id').textContent = 'Metadata fetch failed';
                        document.getElementById('az').textContent = 'Metadata fetch failed';
                        document.getElementById('metadata').textContent = 'Unable to fetch metadata: ' + error.message;
                    });
                </script>
            </body>
            </html>
            EOF
            
            # Install CloudWatch agent
            dnf install -y amazon-cloudwatch-agent
            
            # Signal that the instance is ready
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentSuffix}-WebServer
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Project
                Value: !Ref ProjectName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    CreationPolicy:
      ResourceSignal:
        Count: 2
        Timeout: PT10M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT10M
        WaitOnResourceSignals: true
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentSuffix}-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentSuffix}-ASG
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true

  # ---------------------------------------------------------------------------
  # AUTO SCALING POLICIES
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
      AlarmName: !Sub ${EnvironmentSuffix}-CPU-High
      AlarmDescription: Scale up on high CPU utilization
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
      AlarmName: !Sub ${EnvironmentSuffix}-CPU-Low
      AlarmDescription: Scale down on low CPU utilization
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

# =============================================================================
# OUTPUTS SECTION
# =============================================================================
Outputs:
  VPCId:
    Description: ID of the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentSuffix}-VPC-ID

  PublicSubnets:
    Description: List of public subnet IDs
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub ${EnvironmentSuffix}-PUBLIC-SUBNETS

  PrivateSubnets:
    Description: List of private subnet IDs
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub ${EnvironmentSuffix}-PRIVATE-SUBNETS

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentSuffix}-ALB-DNS

  ApplicationLoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub ${EnvironmentSuffix}-ALB-URL

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${EnvironmentSuffix}-ASG-NAME

  EC2InstanceRole:
    Description: ARN of the IAM role for EC2 instances
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub ${EnvironmentSuffix}-EC2-INSTANCE-ROLE

  WebServerSecurityGroup:
    Description: Security group ID for web servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentSuffix}-WEB-SECURITY-GROUP

  ALBSecurityGroup:
    Description: Security group ID for Application Load Balancer
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${EnvironmentSuffix}-ALB-SECURITY-GROUP```
