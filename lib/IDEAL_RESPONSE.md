```yaml


AWSTemplateFormatVersion: '2010-09-09'
Description: 'High Availability Web Application with Multi-AZ deployment, Auto Scaling, RDS, KMS-encrypted S3, WAF (no in-template association), and monitoring — us-east-1 only'

Mappings:
  Existing:
    ARNs:
      AlbArn: "arn:aws:elasticloadbalancing:us-east-1:718240086340:loadbalancer/app/prod-alb/41e6894136de4a2a"
    ALB:
      DnsName: "prod-alb-300581770.us-east-1.elb.amazonaws.com"
      CanonicalHostedZoneId: "Z35SXDOTRQ7X7K"  # ALB HostedZoneId for us-east-1

Resources:
  ############################################
  # Networking: VPC, Subnets, Routing, NAT
  ############################################
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.30.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-vpc' }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-igw' }

  AttachIgw:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.30.0.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-a' }

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.30.1.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-b' }

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.30.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-a' }

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.30.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-b' }

  PublicRT:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-rt' }

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachIgw
    Properties:
      RouteTableId: !Ref PublicRT
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  AssocPublicA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRT

  AssocPublicB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRT

  NatEipA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGwA:
    Type: AWS::EC2::NatGateway
    DependsOn: AttachIgw
    Properties:
      AllocationId: !GetAtt NatEipA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-a' }

  NatEipB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGwB:
    Type: AWS::EC2::NatGateway
    DependsOn: AttachIgw
    Properties:
      AllocationId: !GetAtt NatEipB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-b' }

  PrivateRTA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-rt-a' }

  PrivateRTB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-rt-b' }

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRTA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGwA

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRTB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGwB

  AssocPrivateA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRTA

  AssocPrivateB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRTB

  ############################################
  # Security Groups
  ############################################
  InstanceSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP from within the VPC (ALB subnets instances)
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.30.0.0/16
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-instance-sg' }

  DBSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow MySQL from instances only
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: !Ref InstanceSG }
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db-sg' }

  ############################################
  # IAM: EC2 least-privilege + SSM integration
  ############################################
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Path: /
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-ec2-role' }

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [ !Ref EC2Role ]
      Path: /

  ############################################
  # Web Tier: TG + LT + ASG (CPU target tracking)
  ############################################
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckPath: /
      Matcher:
        HttpCode: '200-399'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        InstanceType: t2.micro
        IamInstanceProfile: { Arn: !GetAtt EC2InstanceProfile.Arn }
        SecurityGroupIds: [ !Ref InstanceSG ]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum -y install httpd
            systemctl enable httpd
            echo "<h1>Highly Available Web App - ${AWS::StackName}</h1>" > /var/www/html/index.html
            systemctl start httpd

  ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB                # use target group health
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref TargetGroup
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web'
          PropagateAtLaunch: true

  CpuTargetTracking:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref ASG
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 50.0

  ############################################
  # Database: Multi-AZ RDS (no public access)
  ############################################
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Private subnets for RDS
      SubnetIds: [ !Ref PrivateSubnetA, !Ref PrivateSubnetB ]
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db-subnets' }

  DBSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Description: RDS master credentials (auto-generated password)
      GenerateSecretString:
        SecretStringTemplate: '{"username":"dbadmin"}'
        GenerateStringKey: password
        PasswordLength: 16

  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: mysql
      DBInstanceClass: db.t3.medium
      MultiAZ: true
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: dbadmin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      VPCSecurityGroups: [ !Ref DBSG ]
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      EnableIAMDatabaseAuthentication: false
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db' }

  ############################################
  # S3: KMS-encrypted bucket (single-region)
  ############################################
  S3KmsKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Description: CMK for S3 server-side encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableRootPermissions
            Effect: Allow
            Principal: { AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root' }
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-s3-kms' }

  PrimaryBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      VersioningConfiguration: { Status: Enabled }
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-primary' }

  ############################################
  # WAFv2: Create WebACL (association done outside to avoid NotFound)
  ############################################
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-webacl'
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-webacl'
      Rules:
        - Name: AWSManagedCommon
          Priority: 1
          OverrideAction: { None: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWSManagedCommon
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet

  ############################################
  # Route 53: Hosted Zone + Alias A records to existing ALB
  ############################################
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Sub '${AWS::StackName}.ha.example.com'

  AlbAliasPrimary:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'app.${AWS::StackName}.ha.example.com.'
      Type: A
      AliasTarget:
        DNSName: !FindInMap [ Existing, ALB, DnsName ]
        HostedZoneId: !FindInMap [ Existing, ALB, CanonicalHostedZoneId ]
        EvaluateTargetHealth: true
      SetIdentifier: primary
      Failover: PRIMARY

  AlbAliasSecondary:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'app.${AWS::StackName}.ha.example.com.'
      Type: A
      TTL: '60'
      ResourceRecords:
        - 198.51.100.10
      SetIdentifier: secondary
      Failover: SECONDARY

  ############################################
  # CloudWatch: Alarm + Simple Dashboard
  ############################################
  HighCpuAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Average ASG CPU > 80% for 5 minutes'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - { Name: AutoScalingGroupName, Value: !Ref ASG }
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  Dashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0, "y": 0, "width": 12, "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${ASG}" ]
                ],
                "title": "ASG CPU Utilization",
                "stat": "Average",
                "period": 300,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 0, "width": 12, "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${DBInstance}" ]
                ],
                "title": "RDS CPU Utilization",
                "stat": "Average",
                "period": 300,
                "region": "${AWS::Region}"
              }
            }
          ]
        }

Outputs:
  TargetGroupArn:
    Description: In-stack Target Group ARN used by ASG
    Value: !Ref TargetGroup
  AlbReused:
    Description: Existing ALB ARN (not associated by this stack)
    Value: !FindInMap [ Existing, ARNs, AlbArn ]
  AlbDNS:
    Description: Existing ALB DNS name aliased in Route53
    Value: !FindInMap [ Existing, ALB, DnsName ]
  ZoneName:
    Description: Route53 zone that hosts the app record
    Value: !Sub '${AWS::StackName}.ha.example.com'
  AppFQDN:
    Description: Primary app DNS
    Value: !Sub 'app.${AWS::StackName}.ha.example.com'



```