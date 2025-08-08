```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Failure Recovery and High Availability Stack - Production-ready web application infrastructure with multi-AZ deployment, auto-scaling, and comprehensive monitoring'

# This template is designed to be StackSet-ready by:
# 1. Using parameters for all configurable values instead of hardcoded account-specific data
# 2. Leveraging AWS::Region and AWS::AccountId pseudo parameters for dynamic resource naming
# 3. Using mappings for region-specific values like AMI IDs
# 4. Avoiding dependencies on external resources that may not exist in target accounts

Parameters:
  pInstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
    Description: EC2 instance type for the web application servers

  pHostedZoneName:
    Type: String
    Description: Route 53 hosted zone name (e.g., example.com.)
    AllowedPattern: '^[a-zA-Z0-9.-]+\.$'
    ConstraintDescription: Must be a valid domain name ending with a dot

  pAcmCertificateArn:
    Type: String
    Description: ARN of the ACM certificate for HTTPS listener
    AllowedPattern: '^arn:aws:acm:[a-z0-9-]+:[0-9]+:certificate/[a-f0-9-]+$'
    ConstraintDescription: Must be a valid ACM certificate ARN

Mappings:
  # Amazon Linux 2 AMI IDs by region - updated regularly
  RegionMap:
    us-west-2:
      AMI: ami-0c2d3e23b7e0a8e9f
    us-east-1:
      AMI: ami-0abcdef1234567890
    eu-west-1:
      AMI: ami-0987654321abcdef0

Resources:
  # ============================================================================
  # NETWORKING INFRASTRUCTURE
  # ============================================================================

  # VPC with DNS support for Route 53 integration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: StackName
          Value: !Ref AWS::StackName

  # Internet Gateway for public subnet internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: StackName
          Value: !Ref AWS::StackName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets across three AZs for ALB and NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: StackName
          Value: !Ref AWS::StackName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: StackName
          Value: !Ref AWS::StackName

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-3'
        - Key: StackName
          Value: !Ref AWS::StackName

  # Private Subnets for application servers
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: StackName
          Value: !Ref AWS::StackName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: StackName
          Value: !Ref AWS::StackName

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.13.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-3'
        - Key: StackName
          Value: !Ref AWS::StackName

  # NAT Gateway for private subnet outbound internet access
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip'
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway'
        - Key: StackName
          Value: !Ref AWS::StackName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'
        - Key: StackName
          Value: !Ref AWS::StackName

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt'
        - Key: StackName
          Value: !Ref AWS::StackName

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet3

  # ============================================================================
  # SECURITY GROUPS
  # ============================================================================

  # ALB Security Group - allows HTTP/HTTPS from internet
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-alb-sg'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from internet
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: StackName
          Value: !Ref AWS::StackName

  # EC2 Security Group - allows traffic only from ALB
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ec2-sg'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Application port from ALB
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-sg'
        - Key: StackName
          Value: !Ref AWS::StackName

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================

  # IAM Role for EC2 instances with least-privilege permissions
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: StackName
          Value: !Ref AWS::StackName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-ec2-profile'
      Roles:
        - !Ref EC2InstanceRole

  # ============================================================================
  # APPLICATION LOAD BALANCER
  # ============================================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: StackName
          Value: !Ref AWS::StackName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 8080
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
          Value: !Sub '${AWS::StackName}-tg'
        - Key: StackName
          Value: !Ref AWS::StackName

  # HTTPS Listener (primary)
  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref pAcmCertificateArn

  # HTTP Listener (redirects to HTTPS)
  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ============================================================================
  # AUTO SCALING GROUP AND LAUNCH TEMPLATE
  # ============================================================================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref pInstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Simple web server for demonstration
            yum install -y python3
            cat > /home/ec2-user/app.py << 'EOF'
            #!/usr/bin/env python3
            import http.server
            import socketserver
            import json
            from datetime import datetime

            class HealthHandler(http.server.SimpleHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/':
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        response = {
                            'status': 'healthy',
                            'timestamp': datetime.now().isoformat(),
                            'instance_id': '${AWS::StackName}'
                        }
                        self.wfile.write(json.dumps(response).encode())
                    else:
                        super().do_GET()

            PORT = 8080
            with socketserver.TCPServer(("", PORT), HealthHandler) as httpd:
                httpd.serve_forever()
            EOF

            chmod +x /home/ec2-user/app.py
            nohup python3 /home/ec2-user/app.py > /var/log/app.log 2>&1 &
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-instance'
              - Key: StackName
                Value: !Ref AWS::StackName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      NotificationConfigurations:
        - TopicARN: !Ref SNSAlarmTopic
          NotificationTypes:
            - autoscaling:EC2_INSTANCE_LAUNCH
            - autoscaling:EC2_INSTANCE_LAUNCH_ERROR
            - autoscaling:EC2_INSTANCE_TERMINATE
            - autoscaling:EC2_INSTANCE_TERMINATE_ERROR
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg'
          PropagateAtLaunch: false
        - Key: StackName
          Value: !Ref AWS::StackName
          PropagateAtLaunch: true

  # Target Tracking Scaling Policy
  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # ============================================================================
  # ROUTE 53 DNS AND HEALTH CHECKS
  # ============================================================================

  # Route 53 Alias Record pointing to ALB
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Ref pHostedZoneName
      Name: !Ref pHostedZoneName
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

  # Route 53 Health Check for ALB endpoint
  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-health-check'
        - Key: StackName
          Value: !Ref AWS::StackName

  # ============================================================================
  # MONITORING AND NOTIFICATIONS
  # ============================================================================

  # SNS Topic for operational alerts
  SNSAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-alerts'
      DisplayName: !Sub '${AWS::StackName} Operational Alerts'
      Tags:
        - Key: StackName
          Value: !Ref AWS::StackName

  # CloudWatch Alarm for high CPU utilization
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-high-cpu'
      AlarmDescription: Alarm when CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/AutoScaling
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSAlarmTopic
      OKActions:
        - !Ref SNSAlarmTopic

  # ============================================================================
  # BACKUP CONFIGURATION
  # ============================================================================

  # AWS Backup Vault
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${AWS::StackName}-backup-vault'
      EncryptionKeyArn: alias/aws/backup
      BackupVaultTags:
        StackName: !Ref AWS::StackName

  # IAM Role for AWS Backup
  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-backup-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
      Tags:
        - Key: StackName
          Value: !Ref AWS::StackName

  # Backup Plan with daily snapshots and 7-day retention
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${AWS::StackName}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 2 ? * * *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 7
      BackupPlanTags:
        StackName: !Ref AWS::StackName

  # Backup Selection to target resources with StackName tag
  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${AWS::StackName}-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        Conditions:
          StringEquals:
            'aws:ResourceTag/StackName':
              - !Ref AWS::StackName
        Resources:
          - '*'

# ============================================================================
# OUTPUTS
# ============================================================================

Outputs:
  ApplicationURL:
    Description: URL of the application
    Value: !Sub 'https://${pHostedZoneName}'
    Export:
      Name: !Sub '${AWS::StackName}-app-url'

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-dns'

  VPCId:
    Description: ID of the VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  SNSTopicArn:
    Description: ARN of the SNS topic for alerts
    Value: !Ref SNSAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-sns-topic'

  BackupVaultName:
    Description: Name of the backup vault
    Value: !Ref BackupVault
    Export:
      Name: !Sub '${AWS::StackName}-backup-vault'
```
