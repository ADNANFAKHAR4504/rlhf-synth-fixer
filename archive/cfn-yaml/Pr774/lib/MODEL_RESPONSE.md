```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Scalable, secure, and highly available web service infrastructure with VPC, ALB, ASG, and VPC endpoints'

# ==============================================================================
# PARAMETERS - Allow customization for different deployments
# ==============================================================================
Parameters:
  ProjectName:
    Type: String
    Default: 'WebService'
    Description: 'Name prefix for all resources'
    
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for the Auto Scaling Group'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
      
  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in ASG'
    MinValue: 1
    MaxValue: 10
    
  MaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of instances in ASG'
    MinValue: 1
    MaxValue: 20
    
  DesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of instances in ASG'
    MinValue: 1
    MaxValue: 10
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access (optional but recommended for troubleshooting)'
    
  SSLCertificateArn:
    Type: String
    Default: ''
    Description: 'ARN of SSL certificate for HTTPS listener (leave empty to skip HTTPS)'

# ==============================================================================
# CONDITIONS - Control resource creation based on parameters
# ==============================================================================
Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref SSLCertificateArn, '']]

# ==============================================================================
# MAPPINGS - Static data for resource configuration
# ==============================================================================
Mappings:
  # Latest Amazon Linux 2 AMI IDs by region
  AmiMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-east-2:
      AMI: ami-0f924dc71d44d23e2
    us-west-1:
      AMI: ami-0d382e80be7ffdae5
    us-west-2:
      AMI: ami-0c2d3e23becf81fe8
    eu-west-1:
      AMI: ami-0a8e758f5e873d1c1
    eu-central-1:
      AMI: ami-0ec7f9846da6b0f61
    ap-southeast-1:
      AMI: ami-0c802847a7dd848c0
    ap-northeast-1:
      AMI: ami-0f36dcfcc94112ea1

# ==============================================================================
# RESOURCES - Infrastructure components
# ==============================================================================
Resources:
  # ------------------------------------------------------------------------------
  # VPC and Internet Gateway
  # ------------------------------------------------------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'
        - Key: Project
          Value: !Ref ProjectName

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ------------------------------------------------------------------------------
  # Public Subnets (2 AZs for high availability)
  # ------------------------------------------------------------------------------
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]  # 10.0.0.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-1'
        - Key: Type
          Value: Public
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]  # 10.0.1.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-2'
        - Key: Type
          Value: Public
        - Key: Project
          Value: !Ref ProjectName

  # ------------------------------------------------------------------------------
  # Private Subnets (2 AZs for high availability)
  # ------------------------------------------------------------------------------
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]  # 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-1'
        - Key: Type
          Value: Private
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]  # 10.0.3.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-2'
        - Key: Type
          Value: Private
        - Key: Project
          Value: !Ref ProjectName

  # ------------------------------------------------------------------------------
  # NAT Gateways and Elastic IPs
  # ------------------------------------------------------------------------------
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-1'
        - Key: Project
          Value: !Ref ProjectName

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-2'
        - Key: Project
          Value: !Ref ProjectName

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-1'
        - Key: Project
          Value: !Ref ProjectName

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway-2'
        - Key: Project
          Value: !Ref ProjectName

  # ------------------------------------------------------------------------------
  # Route Tables and Routes
  # ------------------------------------------------------------------------------
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-RT'
        - Key: Project
          Value: !Ref ProjectName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-RT-1'
        - Key: Project
          Value: !Ref ProjectName

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-RT-2'
        - Key: Project
          Value: !Ref ProjectName

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ------------------------------------------------------------------------------
  # VPC Endpoints for S3 and DynamoDB
  # ------------------------------------------------------------------------------
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - 'arn:aws:s3:::*'
              - 'arn:aws:s3:::*/*'

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
            Resource: '*'

  # ------------------------------------------------------------------------------
  # Security Groups
  # ------------------------------------------------------------------------------
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
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
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow HTTP to web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-SG'
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers in private subnets'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'Allow SSH from bastion host'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebServer-SG'
        - Key: Project
          Value: !Ref ProjectName

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for bastion host (optional)'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'Allow SSH from internet (restrict this in production)'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow SSH to web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Bastion-SG'
        - Key: Project
          Value: !Ref ProjectName

  # ------------------------------------------------------------------------------
  # IAM Role for EC2 Instances
  # ------------------------------------------------------------------------------
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - 'arn:aws:s3:::*'
                  - 'arn:aws:s3:::*/*'
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: '*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # ------------------------------------------------------------------------------
  # Launch Template for Auto Scaling Group
  # ------------------------------------------------------------------------------
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [AmiMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple web page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>Web Service - ${ProjectName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .header { background: #232f3e; color: white; padding: 20px; border-radius: 5px; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
                    .info { background: #e8f4fd; padding: 15px; border-left: 4px solid #2196f3; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 ${ProjectName} Web Service</h1>
                        <p>Highly Available, Scalable, and Secure</p>
                    </div>
                    <div class="content">
                        <h2>Service Information</h2>
                        <div class="info">
                            <strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)<br>
                            <strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)<br>
                            <strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)<br>
                            <strong>Private IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
                        </div>
                        <h3>Architecture Features</h3>
                        <ul>
                            <li>✅ Multi-AZ deployment for high availability</li>
                            <li>✅ Auto Scaling Group for elasticity</li>
                            <li>✅ Application Load Balancer for traffic distribution</li>
                            <li>✅ Private subnets for enhanced security</li>
                            <li>✅ NAT Gateways for secure outbound connectivity</li>
                            <li>✅ VPC Endpoints for S3 and DynamoDB</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
            EOF
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
                "metrics": {
                    "namespace": "${ProjectName}/EC2",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/httpd/access_log",
                                    "log_group_name": "/aws/ec2/${ProjectName}/httpd/access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/httpd/error_log",
                                    "log_group_name": "/aws/ec2/${ProjectName}/httpd/error",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer'
              - Key: Project
                Value: !Ref ProjectName
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer-Volume'
              - Key: Project
                Value: !Ref ProjectName

  # ------------------------------------------------------------------------------
  # Application Load Balancer
  # ------------------------------------------------------------------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB'
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-TG'
        - Key: Project
          Value: !Ref ProjectName

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn

  # ------------------------------------------------------------------------------
  # Auto Scaling Group
  # ------------------------------------------------------------------------------
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # ------------------------------------------------------------------------------
  # Auto Scaling Policies
  # ------------------------------------------------------------------------------
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

  # ------------------------------------------------------------------------------
  # CloudWatch Alarms for Auto Scaling
  # ------------------------------------------------------------------------------
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-CPU-High'
      AlarmDescription: 'Scale up on high CPU'
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
      AlarmName: !Sub '${ProjectName}-CPU-Low'
      AlarmDescription: 'Scale down on low CPU'
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

# ==============================================================================
# OUTPUTS - Return important resource information
# ==============================================================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-VPC-ID'

  PublicSubnets:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-Public-Subnets'

  PrivateSubnets:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-Private-Subnets'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${ProjectName}-ALB-URL'

  LoadBalancerSecureURL:
    Condition: HasSSLCertificate
    Description: 'Application Load Balancer HTTPS URL'
    Value: !Sub 'https://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${ProjectName}-ALB-HTTPS-URL'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-ALB-DNS'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${ProjectName}-ASG-Name'

  NATGatewayIPs:
    Description: 'NAT Gateway Public IPs'
    Value: !Join [',', [!Ref NATGateway1EIP, !Ref NATGateway
```
