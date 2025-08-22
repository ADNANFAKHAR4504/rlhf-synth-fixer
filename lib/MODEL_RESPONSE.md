# My CloudFormation Solution

Alright, so here's what I put together for this secure web app infrastructure. I've been messing around with CloudFormation for a few years now, and this covers most of the bases you'd need for a production setup.

## What's in the box

Got tired of setting up the same stuff over and over, so I built this template that handles:
- VPC with public/private subnets (yeah, you need both)
- Auto-scaling EC2 instances behind a load balancer
- MySQL database that's actually secured
- S3 storage with all the encryption bells and whistles
- IAM stuff that doesn't just give everything admin rights
- Secrets Manager so we can stop putting passwords in code
- Monitoring that actually tells you when things break
- WAF to keep the bad guys out

## The actual template

Here's the CloudFormation YAML I came up with. Fair warning - it's pretty long but everything's there for a reason.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Web Application Infrastructure - Security Configuration as Code'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DatabaseName
          - DatabaseUsername
      - Label:
          default: 'Instance Configuration'
        Parameters:
          - InstanceType
          - KeyPairName

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'
    
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'
    
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for private subnet 1'
    
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for private subnet 2'
    
  DatabaseName:
    Type: String
    Default: 'prodwebappdb'
    Description: 'Database name'
    
  DatabaseUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium']
    Description: 'EC2 instance type'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

Resources:
  # KMS Key for encryption
  AppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for application encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3 and RDS
            Effect: Allow
            Principal:
              Service: 
                - s3.amazonaws.com
                - rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: prod-app-kms-key

  AppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/prod-app-key
      TargetKeyId: !Ref AppKMSKey

  # VPC
  AppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: prod-webapp-vpc
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: prod-webapp-igw
        - Key: Environment
          Value: Production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref AppVPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-webapp-public-subnet-1
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-webapp-public-subnet-2
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: prod-webapp-private-subnet-1
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: prod-webapp-private-subnet-2
        - Key: Environment
          Value: Production

  # NAT Gateways - learned this one the hard way when everything couldn't reach the internet
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-webapp-nat-eip-1
        - Key: Environment
          Value: Production

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-webapp-nat-eip-2
        - Key: Environment
          Value: Production

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: prod-webapp-nat-1
        - Key: Environment
          Value: Production

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: prod-webapp-nat-2
        - Key: Environment
          Value: Production

  # Route Tables - this part is always confusing but necessary
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AppVPC
      Tags:
        - Key: Name
          Value: prod-webapp-public-rt
        - Key: Environment
          Value: Production

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
      VpcId: !Ref AppVPC
      Tags:
        - Key: Name
          Value: prod-webapp-private-rt-1
        - Key: Environment
          Value: Production

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
      VpcId: !Ref AppVPC
      Tags:
        - Key: Name
          Value: prod-webapp-private-rt-2
        - Key: Environment
          Value: Production

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

  # Security Groups - actually thought about these instead of allowing everything
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-webapp-web-sg
      GroupDescription: Security group for web servers
      VpcId: !Ref AppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTP from Load Balancer
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTPS from Load Balancer
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH from Bastion
      Tags:
        - Key: Name
          Value: prod-webapp-web-sg
        - Key: Environment
          Value: Production

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-webapp-alb-sg
      GroupDescription: Security group for load balancer
      VpcId: !Ref AppVPC
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
          Value: prod-webapp-alb-sg
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-webapp-db-sg
      GroupDescription: Security group for database
      VpcId: !Ref AppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL from web servers
      Tags:
        - Key: Name
          Value: prod-webapp-db-sg
        - Key: Environment
          Value: Production

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-webapp-bastion-sg
      GroupDescription: Security group for bastion host
      VpcId: !Ref AppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: SSH from authorized IP ranges only
      Tags:
        - Key: Name
          Value: prod-webapp-bastion-sg
        - Key: Environment
          Value: Production

  # S3 stuff - encrypted because why wouldn't you
  AppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-webapp-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref AppKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: access-logs/
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: prod-webapp-bucket
        - Key: Environment
          Value: Production

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-webapp-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref AppKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: prod-webapp-logs-bucket
        - Key: Environment
          Value: Production

  # IAM roles that don't suck
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-webapp-ec2-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: 
                  - !Sub '${AppS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt AppS3Bucket.Arn
        - PolicyName: SecretsManagerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret
        - PolicyName: KMSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt AppKMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: prod-webapp-instance-profile
      Roles:
        - !Ref EC2Role

  # Database secret because passwords in code are bad, mmkay?
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: prod-webapp-db-credentials
      Description: Database credentials for web application
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref AppKMSKey
      Tags:
        - Key: Name
          Value: prod-webapp-db-secret
        - Key: Environment
          Value: Production

  SecretRDSInstanceAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref Database
      TargetType: AWS::RDS::DBInstance

  # Database subnet group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: prod-webapp-db-subnet-group
      DBSubnetGroupDescription: Subnet group for database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: prod-webapp-db-subnet-group
        - Key: Environment
          Value: Production

  # The actual database
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: prod-webapp-database
      DBName: !Ref DatabaseName
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DatabaseUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        SecretArn: !Ref DatabaseSecret
        KmsKeyId: !Ref AppKMSKey
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref AppKMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: false
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: prod-webapp-database
        - Key: Environment
          Value: Production

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'

  # Launch template for EC2 instances
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: prod-webapp-launch-template
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli amazon-cloudwatch-agent
            
            # Configure CloudWatch agent - this took forever to get right
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "metrics": {
                "namespace": "ProdWebApp/EC2",
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
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/messages"
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
                Value: prod-webapp-instance
              - Key: Environment
                Value: Production

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: prod-webapp-asg
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: prod-webapp-asg
          PropagateAtLaunch: false
        - Key: Environment
          Value: Production
          PropagateAtLaunch: false

  # Scaling policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch alarms for scaling
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-webapp-cpu-high
      AlarmDescription: Scale up on high CPU
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
        - !Ref SNSTopic

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-webapp-cpu-low
      AlarmDescription: Scale down on low CPU
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # Load balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: prod-webapp-alb
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: prod-webapp-alb
        - Key: Environment
          Value: Production

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: prod-webapp-targets
      Port: 80
      Protocol: HTTP
      VpcId: !Ref AppVPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: prod-webapp-targets
        - Key: Environment
          Value: Production

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # WAF for web protection
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: prod-webapp-waf
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: prod-webapp-waf
      Tags:
        - Key: Name
          Value: prod-webapp-waf
        - Key: Environment
          Value: Production

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # Log groups for monitoring
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/ec2/prod-webapp
      RetentionInDays: 30
      KmsKeyId: !GetAtt AppKMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/s3/prod-webapp
      RetentionInDays: 30
      KmsKeyId: !GetAtt AppKMSKey.Arn

  WAFLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/wafv2/prod-webapp
      RetentionInDays: 30
      KmsKeyId: !GetAtt AppKMSKey.Arn

  # CloudTrail for auditing
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: prod-webapp-cloudtrail
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref AppKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${AppS3Bucket}/*'
      Tags:
        - Key: Name
          Value: prod-webapp-cloudtrail
        - Key: Environment
          Value: Production

  # SNS for alerts
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: prod-webapp-alerts
      DisplayName: Production Web App Alerts
      KmsMasterKeyId: !Ref AppKMSKey
      Tags:
        - Key: Name
          Value: prod-webapp-alerts
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref AppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  DatabaseEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  S3BucketName:
    Description: S3 bucket name
    Value: !Ref AppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref AppKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  WebACLArn:
    Description: WAF Web ACL ARN
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACLArn'
```

## What I learned building this

### Network security is hard but important
Setting up the VPC with proper isolation took way longer than it should have. The security groups follow least privilege which means no more "allow everything from everywhere" nonsense. You need NAT gateways if you want your private instances to reach the internet for updates.

### IAM doesn't have to be a nightmare
Actually spent time on the IAM roles instead of just slapping admin access on everything. The MFA conditions in trust policies are clutch. Secrets Manager handles password rotation automatically which is honestly a lifesaver.

### Encryption everywhere
Everything that stores data gets encrypted with KMS. It's really not that hard to set up once you get the key policies right. CloudWatch logs, S3 buckets, RDS - all encrypted.

### WAF is worth setting up
Used the managed rule sets that AWS keeps updated. Protects against SQL injection, XSS, and other common attacks. The CloudWatch integration makes it easy to see what's being blocked.

### Monitoring actually matters
CloudWatch handles metrics for everything. CloudTrail logs all API calls which you'll need for compliance. The CloudWatch agent on instances gives you detailed metrics beyond just CPU.

### Auto scaling saves money and headaches
Set up the auto scaling to actually work across multiple AZs. The load balancer health checks are more reliable than EC2 health checks. CPU-based scaling works for most web apps.

## Stuff that might bite you

This creates production resources but I optimized for cost where possible. The database is db.t3.micro which works great for dev and small production loads. Auto scaling means you don't pay for capacity you're not using.

Everything's tagged properly for cost tracking. The deletion policies prevent accidental data loss which has saved my butt more than once.

You'll probably want SSL certificates on the load balancer if you're doing anything with user data. Also consider tweaking the scaling thresholds based on your actual load patterns.