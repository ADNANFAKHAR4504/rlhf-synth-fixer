Of course. As an expert AWS Solutions Architect and Senior DevOps Engineer, I will construct a comprehensive, production-ready CloudFormation template that adheres to all your specified requirements. The template is designed for high availability, scalability, and security, following Infrastructure as Code (IaC) best practices.

Here is the complete, self-contained CloudFormation template in YAML format.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >-
  Project: IaC-AWS-Nova-Model. This template deploys a highly available, scalable,
  and fault-tolerant web application infrastructure in us-west-2. It includes a VPC
  with public/private subnets across 3 AZs, an Application Load Balancer, an Auto
  Scaling Group for EC2 instances, Route 53 DNS, S3, AWS Backup, and robust security
  and monitoring configurations.

# ------------------------------------------------------------#
# Parameters
# ------------------------------------------------------------#
Parameters:
  ProjectName:
    Description: The name of the project (lowercase, numbers, and hyphens only).
    Type: String
    Default: 'iac-aws-nova-model'
    # CORRECTION for W1032: Added Min/Max length constraints to prevent S3 bucket name from exceeding 63 chars.
    MinLength: 3
    MaxLength: 30
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: Must be 3-30 chars, all lowercase, and can only contain letters, numbers, and hyphens.

  VpcCidr:
    Description: The CIDR block for the VPC.
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})'

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Description: The latest Amazon Linux 2023 AMI ID.
    Default: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'

  InstanceType:
    Description: EC2 instance type for the web servers.
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t4g.micro
      - t4g.small

  ASGMinSize:
    Description: Minimum number of instances in the Auto Scaling Group.
    Type: Number
    Default: '2'

  ASGMaxSize:
    Description: Maximum number of instances in the Auto Scaling Group.
    Type: Number
    Default: '6'

  ASGDesiredCapacity:
    Description: Desired number of instances in the Auto Scaling Group.
    Type: Number
    Default: '2'

  DomainName:
    Description: The fully qualified domain name (e.g., app.example.com) for the application.
    Type: String
    AllowedPattern: (?!-)[a-zA-Z0-9-.]{1,63}(?<!-)

  HostedZoneId:
    Description: The Route 53 Hosted Zone ID for the domain (e.g., Z2FDTNDATAQYW2).
    Type: 'AWS::Route53::HostedZone::Id'

  CertificateArn:
    Description: The ARN of the ACM SSL/TLS certificate for the domain.
    Type: String

  NotificationEmail:
    Description: Email address to receive critical alerts and notifications.
    Type: String

# ------------------------------------------------------------#
# Mappings
# ------------------------------------------------------------#
Mappings:
  RegionMap:
    us-west-2:
      AZs:
        - 'us-west-2a'
        - 'us-west-2b'
        - 'us-west-2c'
      PublicSubnetCidrs:
        - '10.0.1.0/24'
        - '10.0.2.0/24'
        - '10.0.3.0/24'
      PrivateSubnetCidrs:
        - '10.0.101.0/24'
        - '10.0.102.0/24'
        - '10.0.103.0/24'

# ------------------------------------------------------------#
# Resources
# ------------------------------------------------------------#
Resources:
  # --- Networking Resources ---
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          0,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnetCidrs],
        ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicSubnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          1,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnetCidrs],
        ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicSubnet-2'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [2, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          2,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnetCidrs],
        ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicSubnet-3'

  # Private Subnets (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [0, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          0,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnetCidrs],
        ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateSubnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [1, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          1,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnetCidrs],
        ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateSubnet-2'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone:
        !Select [2, !FindInMap [RegionMap, !Ref 'AWS::Region', AZs]]
      CidrBlock:
        !Select [
          2,
          !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnetCidrs],
        ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateSubnet-3'

  # Routing
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PublicRouteTable'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # NAT Gateway for Private Subnet outbound access
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NatEIP'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NatGateway'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-PrivateRouteTable'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # --- Security Groups ---
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-ALB-SG'
      GroupDescription: 'Allow HTTP/HTTPS traffic to the Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-SG'

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-EC2-SG'
      GroupDescription: 'Allow traffic from the ALB to the EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EC2-SG'

  # --- IAM Role and Policy for EC2 Instances ---
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: !Sub '${ProjectName}-EC2-Policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: 'arn:aws:logs:*:*:*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub 'arn:aws:s3:::${S3AssetBucket}/*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-InstanceProfile'
      Roles:
        - !Ref EC2InstanceRole

  # --- S3 Bucket for Assets/Backups ---
  S3AssetBucket:
    Type: AWS::S3::Bucket
    Properties:
      # CORRECTION for W1032: Shortened the bucket name to be under the 63-character limit
      # by using only the first 8 characters of the stack's unique UUID.
      BucketName: !Join
        - '-'
        - - !Ref ProjectName
          - 'assets'
          - !Ref 'AWS::AccountId'
          - !Select [
              0,
              !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
            ]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-AssetBucket'

  # --- AWS Backup Configuration ---
  AppBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${ProjectName}-Vault'

  AppBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${ProjectName}-Daily-Plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref AppBackupVault
            ScheduleExpression: 'cron(0 5 ? * * *)'
            Lifecycle:
              DeleteAfterDays: 7

  AppBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !GetAtt AppBackupPlan.BackupPlanId
      BackupSelection:
        SelectionName: AppInstances
        IamRoleArn: !GetAtt BackupRole.Arn
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: 'Backup-Plan'
            ConditionValue: 'Nova-Model-Daily'

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-Backup-Service-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup'

  # --- Application Load Balancer and Target Group ---
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-TG'
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      HealthCheckProtocol: HTTP
      HealthCheckPath: /index.html
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      HealthCheckTimeoutSeconds: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-TG'

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-ALB'
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Type: application
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB'

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Protocol: HTTPS
      Port: 443
      Certificates:
        - CertificateArn: !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  # --- Launch Template and Auto Scaling Group ---
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        Monitoring:
          Enabled: true
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeType: gp3
              VolumeSize: 10
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-Instance'
              - Key: 'Backup-Plan'
                Value: 'Nova-Model-Daily'
        UserData: !Base64 |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Welcome to the IaC-AWS-Nova-Model Application!</h1>" > /var/www/html/index.html
          echo "<p>Deployed via CloudFormation on $(date -u +"%Y-%m-%dT%H:%M:%SZ")</p>" >> /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-ASG'
      MinSize: !Ref ASGMinSize
      MaxSize: !Ref ASGMaxSize
      DesiredCapacity: !Ref ASGDesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      NotificationConfigurations:
        - TopicARN: !Ref SNSTopic
          NotificationTypes:
            - 'autoscaling:EC2_INSTANCE_LAUNCH'
            - 'autoscaling:EC2_INSTANCE_TERMINATE'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ASG-Instance'
          PropagateAtLaunch: true

  # --- Scaling Policies and Alarms ---
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: '300'
      ScalingAdjustment: '1'

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: '300'
      ScalingAdjustment: '-1'

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-CPU-High'
      AlarmDescription: 'Scale up if CPU utilization > 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-CPU-Low'
      AlarmDescription: 'Scale down if CPU utilization < 30%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
        - !Ref SNSTopic

  # --- DNS Record ---
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        EvaluateTargetHealth: true

  # --- SNS Notifications ---
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub '${ProjectName}-Notifications'
      TopicName: !Sub '${ProjectName}-Notifications-Topic'

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SNSTopic
      Endpoint: !Ref NotificationEmail
      Protocol: email

# ------------------------------------------------------------#
# Outputs
# ------------------------------------------------------------#
Outputs:
  ApplicationURL:
    Description: The URL of the web application.
    Value: !Sub 'https://${DomainName}'

  ALBDNSName:
    Description: The DNS name of the Application Load Balancer.
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNSName'

  S3AssetBucketName:
    Description: The name of the S3 bucket for application assets.
    Value: !Ref S3AssetBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3AssetBucketName'

  SNSTopicArn:
    Description: The ARN of the SNS topic for notifications.
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'
```
