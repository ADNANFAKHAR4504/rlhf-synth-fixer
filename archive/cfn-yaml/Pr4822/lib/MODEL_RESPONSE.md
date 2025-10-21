### Reasoning Trace

---

This is a comprehensive request for a production-ready CloudFormation template. I need to create a complete AWS infrastructure with the following components:

1. VPC with:
   - 2 public subnets (across 2 AZs)
   - 2 private subnets (across 2 AZs)
   - Internet Gateway
   - 2 NAT Gateways (one for each private subnet)

2. Security Groups:
   - ALB security group (allow HTTP/HTTPS from internet)
   - EC2 security group (allow traffic from ALB)

3. Application Load Balancer:
   - Internet-facing
   - HTTPS listener with SSL/TLS certificate
   - Target group for EC2 instances

4. Auto Scaling:
   - Launch Template with latest Amazon Linux 2 AMI
   - Auto Scaling Group in private subnets
   - CloudWatch alarms for CPU utilization

5. S3 bucket for logging with versioning

6. Proper tagging, parameters, conditions, and outputs

Let me create a comprehensive CloudFormation template that follows AWS best practices.

### Answer

---

I'll create a comprehensive CloudFormation template that implements a secure, scalable, and highly available web application infrastructure. This template follows AWS best practices and includes all the components you've specified.

## Production-Ready CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready secure, scalable, and highly available web application infrastructure'

# ====================
# Parameters
# ====================
Parameters:
  EnvironmentName:
    Description: Environment name that will be prefixed to resources
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    ConstraintDescription: Must be Development, Staging, or Production

  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$

  PublicSubnet1CIDR:
    Description: CIDR block for public subnet 1
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for public subnet 2
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for private subnet 1
    Type: String
    Default: 10.0.10.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for private subnet 2
    Type: String
    Default: 10.0.11.0/24

  InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  MinSize:
    Description: Minimum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Description: Maximum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 6
    MinValue: 1
    MaxValue: 20

  DesiredCapacity:
    Description: Desired number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 20

  ScaleUpThreshold:
    Description: CPU utilization threshold for scaling up
    Type: Number
    Default: 70
    MinValue: 50
    MaxValue: 100

  ScaleDownThreshold:
    Description: CPU utilization threshold for scaling down
    Type: Number
    Default: 30
    MinValue: 10
    MaxValue: 50

  CertificateArn:
    Description: ARN of the SSL/TLS certificate from AWS Certificate Manager (leave empty to use HTTP only)
    Type: String
    Default: ''

  KeyPairName:
    Description: EC2 Key Pair for SSH access (optional)
    Type: AWS::EC2::KeyPair::KeyName
    Default: ''

# ====================
# Conditions
# ====================
Conditions:
  UseHTTPS: !Not [!Equals [!Ref CertificateArn, '']]
  UseKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  IsProduction: !Equals [!Ref EnvironmentName, 'Production']

# ====================
# Mappings
# ====================
Mappings:
  AWSRegionToAMI:
    us-east-1:
      AMI: ami-0c94855ba95c574c8 # Amazon Linux 2 AMI (update this periodically)

# ====================
# Resources
# ====================
Resources:
  # ==========================================
  # VPC Configuration
  # ==========================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  # ==========================================
  # Internet Gateway
  # ==========================================
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # ==========================================
  # Public Subnets
  # ==========================================
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  # ==========================================
  # Private Subnets
  # ==========================================
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      CidrBlock: !Ref PrivateSubnet1CIDR
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      CidrBlock: !Ref PrivateSubnet2CIDR
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Private

  # ==========================================
  # NAT Gateways
  # ==========================================
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-Gateway-EIP-1
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-Gateway-EIP-2
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-Gateway-1
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-Gateway-2
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # Route Tables
  # ==========================================
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Routes
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName

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
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName

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

  # ==========================================
  # Security Groups
  # ==========================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-ALB-SG
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-SG
        - Key: Environment
          Value: !Ref EnvironmentName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-WebServer-SG
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG
        - Key: Environment
          Value: !Ref EnvironmentName

  WebServerSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: Allow traffic from ALB

  # Allow instances in the same security group to communicate
  WebServerSecurityGroupIngressInternal:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: -1
      SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Description: Allow internal communication between instances

  # ==========================================
  # S3 Bucket for Logging
  # ==========================================
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !If [IsProduction, 90, 30]
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-LoggingBucket
        - Key: Environment
          Value: !Ref EnvironmentName

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn

  # ==========================================
  # IAM Role for EC2 Instances
  # ==========================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-Role
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3LoggingAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt LoggingBucket.Arn
                  - !Sub '${LoggingBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Role
        - Key: Environment
          Value: !Ref EnvironmentName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ==========================================
  # Launch Template
  # ==========================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-LaunchTemplate
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegionToAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !If [UseKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: ManagedBy
                Value: AutoScaling
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer-Volume
              - Key: Environment
                Value: !Ref EnvironmentName
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Install Apache Web Server
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

            # Create a simple index page
            cat <<EOF > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>Welcome to ${EnvironmentName}</title>
            </head>
            <body>
                <h1>Healthy - ${EnvironmentName} Environment</h1>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch agent
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "${EnvironmentName}",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ]
                  },
                  "disk": {
                    "measurement": [
                      "disk_used_percent"
                    ],
                    "resources": [
                      "/"
                    ]
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${EnvironmentName}/apache/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${EnvironmentName}/apache/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
              -s

  # ==========================================
  # Target Group
  # ==========================================
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-TG
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
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '60'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-TG
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # Application Load Balancer
  # ==========================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-ALB
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LoggingBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: deletion_protection.enabled
          Value: !If [IsProduction, 'true', 'false']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB
        - Key: Environment
          Value: !Ref EnvironmentName

  # HTTP Listener (always created, redirects to HTTPS if certificate provided)
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - !If
          - UseHTTPS
          - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: '443'
              StatusCode: HTTP_301
          - Type: forward
            TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # HTTPS Listener (only created if certificate ARN is provided)
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: UseHTTPS
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # ==========================================
  # Auto Scaling Group
  # ==========================================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - DefaultPrivateRoute1
      - DefaultPrivateRoute2
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupInServiceInstances
            - GroupPendingInstances
            - GroupTerminatingInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: ManagedBy
          Value: AutoScaling
          PropagateAtLaunch: true

  # ==========================================
  # Auto Scaling Policies
  # ==========================================
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: 1
      Cooldown: 300

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: -1
      Cooldown: 300

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-HighCPU
      AlarmDescription: Alarm when CPU exceeds threshold
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref ScaleUpThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-LowCPU
      AlarmDescription: Alarm when CPU is below threshold
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref ScaleDownThreshold
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # Target Response Time Alarm
  TargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-HighResponseTime
      AlarmDescription: Alarm when target response time is too high
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 2
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  # Unhealthy Hosts Alarm
  UnhealthyHostsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-UnhealthyHosts
      AlarmDescription: Alarm when unhealthy host count is too high
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

# ====================
# Outputs
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  VPCCidr:
    Description: VPC CIDR Block
    Value: !Ref VpcCIDR
    Export:
      Name: !Sub ${EnvironmentName}-VPC-CIDR

  PublicSubnets:
    Description: List of public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-PUBLIC-SUBNETS

  PrivateSubnets:
    Description: List of private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-PRIVATE-SUBNETS

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !If
      - UseHTTPS
      - !Sub 'https://${ApplicationLoadBalancer.DNSName}'
      - !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub ${EnvironmentName}-ALB-URL

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALB-DNS

  LoadBalancerHostedZoneID:
    Description: Hosted Zone ID of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub ${EnvironmentName}-ALB-HOSTED-ZONE-ID

  LoggingBucketName:
    Description: Name of the S3 logging bucket
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub ${EnvironmentName}-LOGGING-BUCKET

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${EnvironmentName}-ASG-NAME

  WebServerSecurityGroupId:
    Description: Security Group ID for Web Servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-WEBSERVER-SG-ID

  ALBSecurityGroupId:
    Description: Security Group ID for Application Load Balancer
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-ALB-SG-ID
```

## Key Features and Best Practices Implemented

### 1. **Security Best Practices**

- **Network Isolation**: Private subnets for EC2 instances, public subnets only for ALB
- **Security Groups**: Restrictive rules allowing only necessary traffic
- **Encryption**: S3 bucket encryption enabled for logs
- **IAM Roles**: Least privilege access for EC2 instances
- **HTTPS Support**: Optional SSL/TLS certificate integration

### 2. **High Availability**

- **Multi-AZ Deployment**: Resources spread across 2 availability zones
- **Redundant NAT Gateways**: One per AZ for fault tolerance
- **Auto Scaling**: Automatic capacity adjustment based on load
- **Health Checks**: ELB health checks for automatic instance replacement

### 3. **Scalability**

- **Auto Scaling Group**: Dynamic scaling based on CPU utilization
- **CloudWatch Alarms**: Proactive monitoring and scaling triggers
- **Load Balancing**: Traffic distribution across healthy instances

### 4. **Cost Optimization**

- **Conditional Resources**: HTTPS listener only created if certificate provided
- **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
- **Parameterized Instance Types**: Easy adjustment for different environments
- **Environment-based Retention**: Different log retention for prod vs. non-prod

### 5. **Monitoring and Logging**

- **Centralized Logging**: S3 bucket with versioning for audit trails
- **CloudWatch Integration**: Comprehensive metrics and alarms
- **Access Logs**: ALB access logs for traffic analysis
- **Instance Monitoring**: CloudWatch agent for detailed metrics

### 6. **Operational Excellence**

- **Consistent Tagging**: All resources tagged for cost tracking and compliance
- **Parameterization**: Flexible configuration for different environments
- **Outputs**: Essential information exported for cross-stack references
- **User Data**: Automated instance configuration on launch

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Valid SSL/TLS certificate in ACM (optional, for HTTPS)
   - EC2 Key Pair created (optional, for SSH access)

2. **Deploy the Stack**:

   ```bash
   aws cloudformation create-stack \
     --stack-name production-web-app \
     --template-body file://template.yaml \
     --parameters \
       ParameterKey=EnvironmentName,ParameterValue=Production \
       ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:xxx:certificate/xxx \
       ParameterKey=KeyPairName,ParameterValue=my-key-pair \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor Deployment**:

   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name production-web-app \
     --region us-east-1
   ```

4. **Get Outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name production-web-app \
     --query 'Stacks[0].Outputs' \
     --region us-east-1
   ```

This template provides a complete, production-ready infrastructure that can be easily customized through parameters while maintaining AWS best practices for security, scalability, and reliability.
