I'll create a comprehensive CloudFormation template for your high-availability web application. This template will be production-ready and handle AZ failures gracefully.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High Availability Web Application with Multi-AZ deployment, Auto Scaling, RDS, S3 replication, WAF, and comprehensive monitoring'

Parameters:
  EnvironmentName:
    Description: Environment name prefix for resources
    Type: String
    Default: 'ha-webapp'
  
  InstanceType:
    Description: EC2 instance type for web servers
    Type: String
    Default: 't3.medium'
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
  
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
  
  DBUsername:
    Description: Database master username
    Type: String
    Default: 'admin'
    MinLength: 4
    MaxLength: 16
  
  DBPassword:
    Description: Database master password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 32
    ConstraintDescription: Must be 8-32 characters with letters and numbers
  
  ReplicationRegion:
    Description: Region for S3 cross-region replication
    Type: String
    Default: 'us-west-2'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI
    us-west-2:
      AMI: ami-0841edc20334f9287

Resources:
  # ============================================================================
  # NETWORKING FOUNDATION
  # ============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'

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
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ3'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.13.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ3'

  # NAT Gateways for private subnet internet access
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'

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
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'

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

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1  # Using same NAT as AZ1 for cost optimization
      SubnetId: !Ref PrivateSubnet3

  # ============================================================================
  # SECURITY GROUPS
  # ============================================================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
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
          Value: !Sub '${EnvironmentName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Bastion-SG'
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict this to your IP range in production
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref S3Bucket

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # ============================================================================
  # KMS KEY FOR ENCRYPTION
  # ============================================================================

  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${EnvironmentName} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-key'
      TargetKeyId: !Ref KMSKey

  # ============================================================================
  # S3 BUCKET WITH CROSS-REGION REPLICATION
  # ============================================================================

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-primary-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Id: ReplicateToSecondaryRegion
            Status: Enabled
            Prefix: ''
            Destination:
              Bucket: !Sub 'arn:aws:s3:::${EnvironmentName}-replica-bucket-${AWS::AccountId}'
              StorageClass: STANDARD_IA
              EncryptionConfiguration:
                ReplicaKmsKeyID: !Sub 'arn:aws:kms:${ReplicationRegion}:${AWS::AccountId}:alias/${EnvironmentName}-replica-key'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObjectVersionForReplication
                  - s3:GetObjectVersionAcl
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref S3Bucket
              - Effect: Allow
                Action:
                  - s3:ReplicateObject
                  - s3:ReplicateDelete
                Resource: !Sub 'arn:aws:s3:::${EnvironmentName}-replica-bucket-${AWS::AccountId}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: '*'

  # ============================================================================
  # APPLICATION LOAD BALANCER
  # ============================================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
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
          Value: !Sub '${EnvironmentName}-ALB'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ============================================================================
  # AUTO SCALING GROUP
  # ============================================================================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Create a simple health check endpoint
            echo "OK" > /var/www/html/health
            
            # Create a simple index page
            cat > /var/www/html/index.html << EOF
            <html>
            <head><title>HA Web App</title></head>
            <body>
            <h1>High Availability Web Application</h1>
            <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            </body>
            </html>
            EOF
            
            # Install SSM agent (usually pre-installed on Amazon Linux 2)
            yum install -y amazon-ssm-agent
            systemctl start amazon-ssm-agent
            systemctl enable amazon-ssm-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-WebServer'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 3
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ASG-Instance'
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # ============================================================================
  # RDS MULTI-AZ DATABASE
  # ============================================================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-subnet-group'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-database'

  # ============================================================================
  # WAF WEB ACL
  # ============================================================================

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${EnvironmentName}-WebACL'
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
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${EnvironmentName}-WebACL'

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ============================================================================
  # ROUTE 53 HEALTH CHECKS AND DNS
  # ============================================================================

  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Sub '${EnvironmentName}.example.com'
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${EnvironmentName}'

  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS_STR_MATCH
      ResourcePath: /health
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      SearchString: "OK"
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-HealthCheck'

  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub '${EnvironmentName}.example.com'
      Type: A
      SetIdentifier: primary
      Failover: PRIMARY
      HealthCheckId: !Ref HealthCheck
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

  # ============================================================================
  # BASTION HOST
  # ============================================================================

  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Bastion'

  # ============================================================================
  # CLOUDWATCH ALARMS AND MONITORING
  # ============================================================================

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-High-CPU'
      AlarmDescription: 'Alarm when CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic

  UnhealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Unhealthy-Hosts'
      AlarmDescription: 'Alarm when unhealthy hosts detected'
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Database-High-CPU'
      AlarmDescription: 'Alarm when database CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentName}-Alerts'
      DisplayName: !Sub '${EnvironmentName} Application Alerts'

  # ============================================================================
  # SYSTEMS MANAGER AUTOMATION
  # ============================================================================

  FailoverAutomationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMAutomationRole
      Policies:
        - PolicyName: FailoverAutomationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeInstanceStatus
                  - autoscaling:DescribeAutoScalingGroups
                  - autoscaling:SetDesiredCapacity
                  - route53:ChangeResourceRecordSets
                  - route53:GetHealthCheck
                Resource: '*'

  FailoverAutomationDocument:
    Type: AWS::SSM::Document
    Properties:
      DocumentType: Automation
      DocumentFormat: YAML
      Name: !Sub '${EnvironmentName}-FailoverAutomation'
      Content:
        schemaVersion: '0.3'
        description: 'Automated failover procedures for HA web application'
        assumeRole: !GetAtt FailoverAutomationRole.Arn
        parameters:
          AutoScalingGroupName:
            type: String
            default: !Ref AutoScalingGroup
        mainSteps:
          - name: CheckInstanceHealth
            action: 'aws:executeAwsApi'
            inputs:
              Service: autoscaling
              Api: DescribeAutoScalingGroups
              AutoScalingGroupNames:
                - '{{ AutoScalingGroupName }}'
          - name: ScaleOutIfNeeded
            action: 'aws:executeAwsApi'