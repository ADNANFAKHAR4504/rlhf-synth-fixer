```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Instance Configuration"
        Parameters:
          - InstanceType
          - KeyPairName
          - LatestAmiId
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBUsername
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - AlertEmail
    ParameterLabels:
      InstanceType:
        default: "EC2 Instance Type"
      KeyPairName:
        default: "EC2 Key Pair Name (leave empty to create new)"
      LatestAmiId:
        default: "Latest Amazon Linux 2 AMI ID"
      DBInstanceClass:
        default: "RDS Instance Class"
      DBUsername:
        default: "Database Username"
      # DBPassword parameter removed - using Secrets Manager dynamic reference
      VpcCIDR:
        default: "VPC CIDR Block"
      PublicSubnet1CIDR:
        default: "Public Subnet 1 CIDR"
      PublicSubnet2CIDR:
        default: "Public Subnet 2 CIDR"
      PrivateSubnet1CIDR:
        default: "Private Subnet 1 CIDR"
      PrivateSubnet2CIDR:
        default: "Private Subnet 2 CIDR"
      EnvironmentSuffix:
        default: "Environment Suffix"
      AlertEmail:
        default: "Alert Email Address"

Parameters:
  # Instance Configuration
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    Description: EC2 instance type for web servers
  
  KeyPairName:
    Type: String
    Default: ''
    Description: EC2 Key Pair name for SSH access (leave empty to create a new one)
  
  LatestAmiId:
    Type: AWS::EC2::Image::Id
    Default: ami-12345678
    Description: Latest Amazon Linux 2 AMI ID
  
  # Database Configuration
  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
    Description: RDS instance class
  
  DBUsername:
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database admin username
  
  # DBPassword parameter removed - using Secrets Manager dynamic reference instead
  
  # Network Configuration
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
  
  PublicSubnet1CIDR:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for public subnet 1
  
  PublicSubnet2CIDR:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for public subnet 2
  
  PrivateSubnet1CIDR:
    Type: String
    Default: 10.0.3.0/24
    Description: CIDR block for private subnet 1
  
  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.4.0/24
    Description: CIDR block for private subnet 2
  
  # Environment Configuration
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: Must contain only lowercase alphanumeric characters

  # Monitoring Configuration
  AlertEmail:
    Type: String
    Default: admin@example.com
    Description: Email address for CloudWatch alerts

Conditions:
  CreateKeyPair: !Equals [!Ref KeyPairName, '']

Resources:
  # ========== Key Pair ==========
  KeyPair:
    Type: AWS::EC2::KeyPair
    Condition: CreateKeyPair
    Properties:
      KeyName: !Sub '${AWS::StackName}-keypair'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-KeyPair'

  # ========== VPC and Networking ==========
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
  
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
  
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
      AvailabilityZone: !Select 
        - 0
        - !GetAZs ''
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ1'
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs ''
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ2'
  
  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 0
        - !GetAZs ''
      CidrBlock: !Ref PrivateSubnet1CIDR
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ1'
  
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs ''
      CidrBlock: !Ref PrivateSubnet2CIDR
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ2'
  
  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-AZ1'
  
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-AZ1'
  
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'
  
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
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ1'
  
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
  
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2
  
  # ========== Security Groups ==========
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from internet
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SecurityGroup'
  
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP access from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref VpcCIDR
          Description: SSH access from VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SecurityGroup'
  
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL access from web servers only
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SecurityGroup'
  
  # ========== S3 Bucket for Application Data ==========
  ApplicationS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tapstack-${EnvironmentSuffix}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ApplicationData'
  
  # ========== IAM Roles and Policies ==========
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
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${ApplicationS3Bucket}/*'
                  - !GetAtt ApplicationS3Bucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-Role'
  
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
  
  # ========== Launch Template ==========
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId  # Latest Amazon Linux 2 AMI
        InstanceType: !Ref InstanceType
        KeyName: !If 
          - CreateKeyPair
          - !Ref KeyPair
          - !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
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
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Create a simple web page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>Secure Web Application</title>
            </head>
            <body>
                <h1>Welcome to the Secure Web Application</h1>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                <p>Stack: ${AWS::StackName}</p>
            </body>
            </html>
            EOF
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
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
                }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer'
  
  # ========== Auto Scaling Group ==========
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: $Latest
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false
  
  # ========== Application Load Balancer ==========
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
  
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TargetGroup'
  
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
  
  # ========== Database Password Parameter (LocalStack-compatible) ==========
  # Note: Replaced Secrets Manager with SSM Parameter for LocalStack compatibility
  DatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/database/password'
      Description: Database password for TAP Stack
      Type: String
      Value: 'TempPassword123!'  # LocalStack-compatible static password
      Tags:
        Name: !Sub '${AWS::StackName}-DatabasePassword'

  # ========== RDS Database ==========
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnetGroup'
  
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DependsOn: DatabasePasswordParameter
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.42'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:ssm:/${AWS::StackName}/database/password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: false  # LocalStack Community doesn't support Multi-AZ
      PubliclyAccessible: false
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false  # Disabled for LocalStack cleanup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database'
  
  # ========== SNS Topic for Alerts ==========
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Alerts'
      DisplayName: CloudWatch Alerts
      KmsMasterKeyId: alias/aws/sns
  
  AlertSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref AlertTopic
      Endpoint: !Ref AlertEmail
  
  # ========== CloudWatch Alarms ==========
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alarm when EC2 CPU exceeds 80%
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
        - !Ref AlertTopic
      TreatMissingData: notBreaching
  
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DatabaseHighCPU'
      AlarmDescription: Alarm when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching
  
  DatabaseFreeStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DatabaseLowStorage'
      AlarmDescription: Alarm when RDS free storage is below 2GB
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2000000000  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching
  
  # ========== Auto Scaling Policies ==========
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
      AlarmDescription: Scale up on high CPU
      AlarmActions:
        - !Ref ScaleUpPolicy
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
  
  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down on low CPU
      AlarmActions:
        - !Ref ScaleDownPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  
  LoadBalancerDNS:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
  
  LoadBalancerURL:
    Description: Application Load Balancer URL
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'
  
  DatabaseEndpoint:
    Description: RDS Database endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
  
  AutoScalingGroupName:
    Description: Auto Scaling Group name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'
  
  S3BucketName:
    Description: S3 bucket name for application data
    Value: !Ref ApplicationS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'
  
  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
  
  KeyPairName:
    Description: Name of the EC2 Key Pair
    Value: !If 
      - CreateKeyPair
      - !Ref KeyPair
      - !Ref KeyPairName
    Export:
      Name: !Sub '${AWS::StackName}-KeyPair-Name'
  
  # Additional outputs for integration testing
  LoadBalancerArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ALB-ARN'
  
  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TG-ARN'
  
  DatabasePort:
    Description: RDS Database port
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
  
  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-Stack-Name'
  
  EnvironmentSuffix:
    Description: Environment suffix used for resource naming
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-Environment-Suffix'
```
