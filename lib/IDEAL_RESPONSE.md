Of course. As an expert AWS Cloud Solutions Architect, I will provide a complete, production-ready, and reusable AWS CloudFormation template for the **"AWS Nova Model"** project.

This template adheres to Infrastructure as Code ($IaC$) best practices, focusing on high availability, scalability, security, and disaster recovery. It is fully parameterized to enable deployment across multiple AWS accounts and regions using CloudFormation StackSets.

-----

### AWS Nova Model - CloudFormation Template

Below is the complete YAML template. It includes detailed comments explaining each resource and its configuration, aligning with the specified architectural requirements.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Production-ready CloudFormation template for the 'AWS Nova Model' project.
  This template provisions a highly available, scalable, and secure web application
  infrastructure using an ALB, Auto Scaling Group, Route 53, S3, and AWS Backup.
  Designed for deployment via CloudFormation StackSets.

# ------------------------------------------------------------
# Parameters
# ------------------------------------------------------------
Parameters:
  AWSRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'The AWS Region where the resources will be deployed. Default is us-east-1 for testing.'
    AllowedValues:
      - us-east-1
      - us-east-2
      - us-west-1
      - us-west-2
      - eu-west-1
      - eu-central-1
      - ap-southeast-1
      - ap-northeast-1

  ProjectName:
    Type: String
    Default: 'novamodel'
    Description: 'A prefix used to name all resources. Must be all lowercase letters.'

  Environment:
    Type: String
    Default: 'prod'
    Description: The deployment environment (e.g., dev, staging, prod).
    AllowedValues: [dev, staging, prod, test]

  VPCId:
    Type: AWS::EC2::VPC::Id
    Description: The ID of the VPC where the infrastructure will be deployed.

  PublicSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: A list of at least three public subnet IDs for the Application Load Balancer and EC2 instances.

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: The AMI ID for the EC2 instances. Uses the latest Amazon Linux 2 AMI by default.

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: EC2 instance type for the application servers.

  CertificateArn:
    Type: String
    Description: The ARN of the ACM SSL/TLS certificate for the ALB's HTTPS listener.
    Default: 'arn:aws:acm:us-east-1:718240086340:certificate/6f65b67a-bb90-471b-ab0b-8727ad2d7583'

  DomainName:
    Type: String
    Description: The fully qualified domain name (e.g., api.novamodel.com) to be used in Route 53.
    Default: 'app.tap-us-east-1.turing229221.com'

  HostedZoneId:
    Type: AWS::Route53::HostedZone::Id
    Description: The ID of the Route 53 Hosted Zone that corresponds to the DomainName.
    Default: 'Z0457876OLTG958Q3IXN'

  ASGMinSize:
    Type: Number
    Default: 2
    Description: The minimum number of EC2 instances in the Auto Scaling Group.

  ASGMaxSize:
    Type: Number
    Default: 6
    Description: The maximum number of EC2 instances in the Auto Scaling Group.

  ASGDesiredCapacity:
    Type: Number
    Default: 2
    Description: The desired number of EC2 instances in the Auto Scaling Group.

# ------------------------------------------------------------
# Resources
# ------------------------------------------------------------
Resources:
  # --- Security & IAM ---

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-albsg'
      GroupDescription: 'Security group for the Application Load Balancer. Allows public HTTP/HTTPS traffic.'
      VpcId: !Ref VPCId
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
          Value: !Sub '${ProjectName}-${Environment}-albsg'

  EC2InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-ec2sg'
      GroupDescription: 'Security group for EC2 instances. Allows traffic only from the ALB.'
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2sg'

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Path: '/'
      Policies:
        - PolicyName: !Sub '${ProjectName}-${Environment}-ec2policy'
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
                  - 's3:GetObject'
                Resource: !Sub 'arn:aws:s3:::${ApplicationS3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ApplicationS3Bucket.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2instanceprofile'
      Path: '/'
      Roles:
        - !Ref EC2InstanceRole

  # --- Storage ---

  ApplicationS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      # Bucket name now includes the region for better identification and global uniqueness.
      BucketName: !Sub '${AWS::AccountId}-${ProjectName}-${Environment}-data-bucket-${AWSRegion}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-databucket'

  # --- Networking & Load Balancing ---

  ALBLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Subnets: !Ref PublicSubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
      VpcId: !Ref VPCId
      Port: 80
      Protocol: HTTP
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      Matcher:
        HttpCode: '200'
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg'

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALBLoadBalancer
      Port: 443
      Protocol: HTTPS
      SslPolicy: 'ELBSecurityPolicy-2016-08'
      Certificates:
        - CertificateArn: !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ALBListenerHTTPRedirect:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALBLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            Host: '#{host}'
            Path: '/#{path}'
            Query: '#{query}'
            StatusCode: HTTP_301

  # --- Compute & Auto Scaling ---

  AppLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-launchtemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        Monitoring:
          Enabled: true
        SecurityGroupIds:
          - !Ref EC2InstanceSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-instance'
              - Key: Backup
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-volume'

  AppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      VPCZoneIdentifier: !Ref PublicSubnetIds
      LaunchTemplate:
        LaunchTemplateId: !Ref AppLaunchTemplate
        Version: !GetAtt AppLaunchTemplate.LatestVersionNumber
      MinSize: !Ref ASGMinSize
      MaxSize: !Ref ASGMaxSize
      DesiredCapacity: !Ref ASGDesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      NotificationConfigurations:
        - TopicARN: !Ref NotificationSNSTopic
          NotificationTypes:
            - 'autoscaling:EC2_INSTANCE_LAUNCH'
            - 'autoscaling:EC2_INSTANCE_TERMINATE'
            - 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR'
            - 'autoscaling:EC2_INSTANCE_TERMINATE_ERROR'
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg'
          PropagateAtLaunch: true

  # --- Scaling Policies and Alarms ---

  ScaleOutPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AppAutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      Cooldown: '300'
      StepAdjustments:
        - MetricIntervalLowerBound: 0
          ScalingAdjustment: 1

  ScaleInPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AppAutoScalingGroup
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      Cooldown: '600'
      StepAdjustments:
        - MetricIntervalUpperBound: 0
          ScalingAdjustment: -1

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-alarm-high'
      AlarmDescription: 'Alarm to scale out when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AppAutoScalingGroup
      AlarmActions:
        - !Ref ScaleOutPolicy
        - !Ref NotificationSNSTopic

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-alarm-low'
      AlarmDescription: 'Alarm to scale in when CPU drops below 30%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AppAutoScalingGroup
      AlarmActions:
        - !Ref ScaleInPolicy
        - !Ref NotificationSNSTopic

  # --- DNS & Health Checks ---

  ALBHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTPS
        FullyQualifiedDomainName: !GetAtt ALBLoadBalancer.DNSName
        Port: 443
        ResourcePath: /
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-healthcheck'

  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      Name: !Ref DomainName
      Type: A
      HostedZoneId: !Ref HostedZoneId
      AliasTarget:
        DNSName: !GetAtt ALBLoadBalancer.DNSName
        HostedZoneId: !GetAtt ALBLoadBalancer.CanonicalHostedZoneID
      HealthCheckId: !Ref ALBHealthCheck

  # --- Monitoring & Notifications ---

  NotificationSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-notifications'
      DisplayName: !Sub '${ProjectName} ${Environment} Notifications'

  HighUnhealthyHostsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-highunhealthyhostsalarm'
      AlarmDescription: 'Alarm for a high number of unhealthy hosts in the ALB Target Group'
      Namespace: AWS/ApplicationELB
      MetricName: UnHealthyHostCount
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref NotificationSNSTopic
      OKActions:
        - !Ref NotificationSNSTopic

  # --- Backup & Disaster Recovery ---

  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${ProjectName}-${Environment}-backupvault'

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${ProjectName}-${Environment}-dailybackupplan'
        BackupPlanRule:
          - RuleName: DailyBackupRule
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 5 * * ? *)'
            Lifecycle:
              DeleteAfterDays: 7

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !GetAtt BackupPlan.BackupPlanId
      BackupSelection:
        SelectionName: !Sub '${ProjectName}-${Environment}-ec2-selection'
        IamRoleArn: !GetAtt BackupServiceRole.Arn
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: 'Backup'
            ConditionValue: 'true'

  BackupServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-backupservicerole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup'

# ------------------------------------------------------------
# Outputs
# ------------------------------------------------------------
Outputs:
  ALBDNSName:
    Description: The DNS name of the Application Load Balancer.
    Value: !GetAtt ALBLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNSName'

  ApplicationS3BucketName:
    Description: The name of the S3 bucket for application data.
    Value: !Ref ApplicationS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  NotificationSNSTopicArn:
    Description: The ARN of the SNS topic for notifications. Subscriptions can be added to this topic for processing alerts.
    Value: !Ref NotificationSNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'

  Route53DomainName:
    Description: The configured domain name pointing to the ALB.
    Value: !Ref DomainName
    Export:
      Name: !Sub '${AWS::StackName}-DomainName'
```
