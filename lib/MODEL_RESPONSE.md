```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High-availability web application infrastructure for Nova - Complete IaC template with VPC, ALB, ASG, Route53, and monitoring'

Parameters:
  HostedZoneId:
    Type: String
    Description: 'Route 53 Hosted Zone ID for DNS record creation'
    AllowedPattern: '^Z[A-Z0-9]+$'
    ConstraintDescription: 'Must be a valid Route 53 Hosted Zone ID'

  DomainName:
    Type: String
    Description: 'Domain name for the application (e.g., nova.yourdomain.com)'
    Default: 'nova.example.com'
    AllowedPattern: '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid domain name'

  CertificateArn:
    Type: String
    Description: 'ARN of the ACM certificate for SSL/TLS termination'
    AllowedPattern: '^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate/[a-f0-9-]+$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN'

  NotificationEmail:
    Type: String
    Description: 'Email address for CloudWatch alarms and notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

  InstanceType:
    Type: String
    Description: 'EC2 instance type for web servers'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
    ConstraintDescription: 'Must be a valid EC2 instance type'

  MinSize:
    Type: Number
    Description: 'Minimum number of instances in Auto Scaling Group'
    Default: 2
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Type: Number
    Description: 'Maximum number of instances in Auto Scaling Group'
    Default: 6
    MinValue: 2
    MaxValue: 20

  DesiredCapacity:
    Type: Number
    Description: 'Desired number of instances in Auto Scaling Group'
    Default: 3
    MinValue: 1
    MaxValue: 15

Mappings:
  AZConfig:
    us-east-1:
      AZs: ['us-east-1a', 'us-east-1b', 'us-east-1c']
    us-west-2:
      AZs: ['us-west-2a', 'us-west-2b', 'us-west-2c']
    eu-west-1:
      AZs: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c']
    ap-southeast-1:
      AZs: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c']

Resources:
  # VPC and Networking
  NovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: Nova-VPC
        - Key: Application
          Value: Nova

  NovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: Nova-IGW
        - Key: Application
          Value: Nova

  NovaVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaVPC
      InternetGatewayId: !Ref NovaInternetGateway

  # Public Subnets
  NovaPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Nova-Public-Subnet-1
        - Key: Application
          Value: Nova

  NovaPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Nova-Public-Subnet-2
        - Key: Application
          Value: Nova

  NovaPublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Nova-Public-Subnet-3
        - Key: Application
          Value: Nova

  # Private Subnets
  NovaPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: Nova-Private-Subnet-1
        - Key: Application
          Value: Nova

  NovaPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: Nova-Private-Subnet-2
        - Key: Application
          Value: Nova

  NovaPrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: !Select [2, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: Nova-Private-Subnet-3
        - Key: Application
          Value: Nova

  # NAT Gateways
  NovaNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: Nova-NAT-EIP-1
        - Key: Application
          Value: Nova

  NovaNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: Nova-NAT-EIP-2
        - Key: Application
          Value: Nova

  NovaNATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: Nova-NAT-EIP-3
        - Key: Application
          Value: Nova

  NovaNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NovaNATGateway1EIP.AllocationId
      SubnetId: !Ref NovaPublicSubnet1
      Tags:
        - Key: Name
          Value: Nova-NAT-Gateway-1
        - Key: Application
          Value: Nova

  NovaNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NovaNATGateway2EIP.AllocationId
      SubnetId: !Ref NovaPublicSubnet2
      Tags:
        - Key: Name
          Value: Nova-NAT-Gateway-2
        - Key: Application
          Value: Nova

  NovaNATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NovaNATGateway3EIP.AllocationId
      SubnetId: !Ref NovaPublicSubnet3
      Tags:
        - Key: Name
          Value: Nova-NAT-Gateway-3
        - Key: Application
          Value: Nova

  # Route Tables
  NovaPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: Nova-Public-Route-Table
        - Key: Application
          Value: Nova

  NovaPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: NovaVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref NovaInternetGateway

  NovaPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet1
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet2
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet3
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: Nova-Private-Route-Table-1
        - Key: Application
          Value: Nova

  NovaPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NovaNATGateway1

  NovaPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet1
      RouteTableId: !Ref NovaPrivateRouteTable1

  NovaPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: Nova-Private-Route-Table-2
        - Key: Application
          Value: Nova

  NovaPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NovaNATGateway2

  NovaPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet2
      RouteTableId: !Ref NovaPrivateRouteTable2

  NovaPrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: Nova-Private-Route-Table-3
        - Key: Application
          Value: Nova

  NovaPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NovaNATGateway3

  NovaPrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPrivateSubnet3
      RouteTableId: !Ref NovaPrivateRouteTable3

  # Security Groups
  NovaALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: Nova-ALB-SecurityGroup
      GroupDescription: 'Security group for Nova Application Load Balancer - allows HTTPS traffic from internet'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic for redirect to HTTPS'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: Nova-ALB-SecurityGroup
        - Key: Application
          Value: Nova

  NovaEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: Nova-EC2-SecurityGroup
      GroupDescription: 'Security group for Nova EC2 instances - allows traffic from ALB only'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref NovaALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref NovaALBSecurityGroup
          Description: 'Allow HTTPS traffic from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: Nova-EC2-SecurityGroup
        - Key: Application
          Value: Nova

  # IAM Roles and Policies
  NovaEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Nova-EC2-Role-${AWS::Region}'
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
      Policies:
        - PolicyName: NovaS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${NovaS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref NovaS3Bucket
        - PolicyName: NovaCloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/nova/*'
      Tags:
        - Key: Name
          Value: Nova-EC2-Role
        - Key: Application
          Value: Nova

  NovaEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'Nova-EC2-InstanceProfile-${AWS::Region}'
      Roles:
        - !Ref NovaEC2Role

  # S3 Bucket for persistent storage
  NovaS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-app-storage-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: NovaLifecycleRule
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            NoncurrentVersionExpirationInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: Nova-Storage-Bucket
        - Key: Application
          Value: Nova

  # Launch Template
  NovaLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: Nova-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt NovaEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref NovaEC2SecurityGroup
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent

            # Create a simple web page
            cat > /var/www/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>Nova Application</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
                    .container { background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h1 { color: #333; }
                    .info { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Nova Application</h1>
                    <div class="info">
                        <p><strong>Status:</strong> Running</p>
                        <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                        <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                        <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
                    </div>
                    <p>Welcome to the Nova high-availability web application!</p>
                </div>
            </body>
            </html>
            EOF

            # Create health check endpoint
            cat > /var/www/html/health << 'EOF'
            OK
            EOF

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "Nova/Application",
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
                                    "log_group_name": "/nova/httpd/access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/httpd/error_log",
                                    "log_group_name": "/nova/httpd/error",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: Nova-WebServer
              - Key: Application
                Value: Nova

  # Application Load Balancer
  NovaApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: Nova-ALB
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref NovaALBSecurityGroup
      Subnets:
        - !Ref NovaPublicSubnet1
        - !Ref NovaPublicSubnet2
        - !Ref NovaPublicSubnet3
      Tags:
        - Key: Name
          Value: Nova-ALB
        - Key: Application
          Value: Nova

  NovaTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: Nova-TargetGroup
      Protocol: HTTP
      Port: 80
      VpcId: !Ref NovaVPC
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: Nova-TargetGroup
        - Key: Application
          Value: Nova

  NovaHTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NovaTargetGroup
      LoadBalancerArn: !Ref NovaApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  NovaHTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref NovaApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  NovaAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: Nova-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref NovaLaunchTemplate
        Version: !GetAtt NovaLaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
        - !Ref NovaPrivateSubnet3
      TargetGroupARNs:
        - !Ref NovaTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      DefaultCooldown: 300
      NotificationConfigurations:
        - TopicARN: !Ref NovaSNSTopic
          NotificationTypes:
            - autoscaling:EC2_INSTANCE_LAUNCH
            - autoscaling:EC2_INSTANCE_TERMINATE
            - autoscaling:EC2_INSTANCE_LAUNCH_ERROR
            - autoscaling:EC2_INSTANCE_TERMINATE_ERROR
      Tags:
        - Key: Name
          Value: Nova-ASG-Instance
          PropagateAtLaunch: true
        - Key: Application
          Value: Nova
          PropagateAtLaunch: true

  # Auto Scaling Policies
  NovaScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref NovaAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  NovaScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref NovaAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  NovaCPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Nova-CPU-High
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
          Value: !Ref NovaAutoScalingGroup
      AlarmActions:
        - !Ref NovaScaleUpPolicy
        - !Ref NovaSNSTopic

  NovaCPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Nova-CPU-Low
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
          Value: !Ref NovaAutoScalingGroup
      AlarmActions:
        - !Ref NovaScaleDownPolicy

  # SNS Topic for notifications
  NovaSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: Nova-Notifications
      DisplayName: 'Nova Application Notifications'
      Tags:
        - Key: Name
          Value: Nova-SNS-Topic
        - Key: Application
          Value: Nova

  NovaSNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref NovaSNSTopic
      Endpoint: !Ref NotificationEmail

  # Route 53 Health Check and DNS Record
  NovaHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /health
      FullyQualifiedDomainName: !GetAtt NovaApplicationLoadBalancer.DNSName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: Nova-HealthCheck
        - Key: Application
          Value: Nova

  NovaDNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      SetIdentifier: 'Nova-Primary'
      Failover: PRIMARY
      HealthCheckId: !Ref NovaHealthCheck
      AliasTarget:
        DNSName: !GetAtt NovaApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt NovaApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # CloudWatch Log Groups
  NovaHttpdAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/nova/httpd/access'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: Nova-Httpd-Access-Logs
        - Key: Application
          Value: Nova

  NovaHttpdErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/nova/httpd/error'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: Nova-Httpd-Error-Logs
```
