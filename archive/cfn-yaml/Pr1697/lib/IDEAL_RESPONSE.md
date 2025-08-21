```yml
AWSTemplateFormatVersion: "2010-09-09"
Description: Scalable and secure web application infrastructure with VPC, ALB, Auto Scaling, RDS, and S3 - Self-sufficient stack for us-east-1
Parameters:
  DBUsername:
    Type: String
    Default: admin
    Description: Database administrator username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters
  Environment:
    Type: String
    Default: Production
    Description: Environment name for resource tagging
    AllowedValues:
      - Production
      - Staging
      - Development
Conditions:
  IsProduction:
    Fn::Equals:
      - Ref: Environment
      - Production
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-VPC
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Project
          Value: WebApp
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: ${AWS::StackName}-VPC-Flow-Log-Role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCFlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - Fn::Sub: arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/${AWS::StackName}
                  - Fn::Sub: arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/${AWS::StackName}:log-stream:*
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  VPCFlowLogs:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName:
        Fn::Sub: /aws/vpc/flowlogs/${AWS::StackName}
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  VPCFlowLogsPolicy:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId:
        Ref: VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName:
        Ref: VPCFlowLogs
      DeliverLogsPermissionArn:
        Fn::GetAtt:
          - VPCFlowLogRole
          - Arn
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-IGW
        - Key: Environment
          Value:
            Ref: Environment
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId:
        Ref: InternetGateway
      VpcId:
        Ref: VPC
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ""
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Public-Subnet-1
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Type
          Value: Public
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ""
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Public-Subnet-2
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Type
          Value: Public
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ""
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Private-Subnet-1
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Type
          Value: Private
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ""
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Private-Subnet-2
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Type
          Value: Private
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-NAT-EIP
        - Key: Environment
          Value:
            Ref: Environment
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - NatGatewayEIP
          - AllocationId
      SubnetId:
        Ref: PublicSubnet1
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-NAT-Gateway
        - Key: Environment
          Value:
            Ref: Environment
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Public-Routes
        - Key: Environment
          Value:
            Ref: Environment
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId:
        Ref: PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId:
        Ref: InternetGateway
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: PublicRouteTable
      SubnetId:
        Ref: PublicSubnet1
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: PublicRouteTable
      SubnetId:
        Ref: PublicSubnet2
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Private-Routes
        - Key: Environment
          Value:
            Ref: Environment
  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: NatGateway
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable
      SubnetId:
        Ref: PrivateSubnet1
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable
      SubnetId:
        Ref: PrivateSubnet2
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName:
        Fn::Sub: ${AWS::StackName}-ALB-SecurityGroup
      GroupDescription: Security group for Application Load Balancer
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-ALB-SecurityGroup
        - Key: Environment
          Value:
            Ref: Environment
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName:
        Fn::Sub: ${AWS::StackName}-WebServer-SecurityGroup
      GroupDescription: Security group for web servers
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId:
            Ref: ALBSecurityGroup
          Description: HTTP access from ALB only
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId:
            Ref: ALBSecurityGroup
          Description: HTTPS access from ALB only
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH access from VPC only (for debugging)
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.3.0/24
          Description: Database access to private subnet 1
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.4.0/24
          Description: Database access to private subnet 2
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS outbound for AWS services
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP outbound for package updates
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-WebServer-SecurityGroup
        - Key: Environment
          Value:
            Ref: Environment
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName:
        Fn::Sub: ${AWS::StackName}-Database-SecurityGroup
      GroupDescription: Security group for RDS database
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.3.0/24
          Description: MySQL access from private subnet 1
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.4.0/24
          Description: MySQL access from private subnet 2
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Database-SecurityGroup
        - Key: Environment
          Value:
            Ref: Environment
  ALBLogDeliveryRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: ${AWS::StackName}-ALB-Log-Delivery-Role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ALBLogDeliveryPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource:
                  Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
                Condition:
                  StringEquals:
                    s3:x-amz-acl: bucket-owner-full-control
              - Effect: Allow
                Action:
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource:
                  Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: ${AWS::StackName}-EC2-Role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  Fn::Sub: arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${AWS::StackName}-Database-Credentials-*
                Condition:
                  StringEquals:
                    aws:RequestTag/Environment:
                      Ref: Environment
        - PolicyName: S3Access
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
                  - Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
                Condition:
                  StringEquals:
                    aws:RequestTag/Environment:
                      Ref: Environment
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName:
        Fn::Sub: ${AWS::StackName}-EC2-InstanceProfile
      Roles:
        - Ref: EC2Role
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name:
        Fn::Sub: ${AWS::StackName}-Database-Credentials
      Description: Database credentials for web application
      GenerateSecretString:
        SecretStringTemplate:
          Fn::Sub: '{"username": "${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Project
          Value: WebApp
  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description:
        Fn::Sub: KMS Key for ${AWS::StackName} RDS Database encryption
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              AWS:
                Fn::Sub: arn:${AWS::Partition}:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: "*"
          - Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Database-KMS-Key
        - Key: Environment
          Value:
            Ref: Environment
        - Key: Purpose
          Value: RDS Encryption
  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName:
        Fn::Sub: alias/${AWS::StackName}-database-key
      TargetKeyId:
        Ref: DatabaseKMSKey
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName:
        Fn::Sub: ${AWS::StackName}-database-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - Ref: PrivateSubnet1
        - Ref: PrivateSubnet2
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Database-SubnetGroup
        - Key: Environment
          Value:
            Ref: Environment
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier:
        Fn::Sub: ${AWS::StackName}-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: 8.0.43
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId:
        Ref: DatabaseKMSKey
      MultiAZ: true
      DBSubnetGroupName:
        Ref: DatabaseSubnetGroup
      VPCSecurityGroups:
        - Ref: DatabaseSecurityGroup
      MasterUsername:
        Fn::Sub: "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}"
      MasterUserPassword:
        Fn::Sub: "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      DeletionProtection:
        Fn::If:
          - IsProduction
          - true
          - false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Database
        - Key: Environment
          Value:
            Ref: Environment
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn:
      - S3BucketPolicy
      - ALBLogDeliveryRole
    Properties:
      Name:
        Fn::Sub: ${AWS::StackName}-ALB
      Scheme: internet-facing
      Type: application
      Subnets:
        - Ref: PublicSubnet1
        - Ref: PublicSubnet2
      SecurityGroups:
        - Ref: ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: "60"
        - Key: access_logs.s3.enabled
          Value: "true"
        - Key: access_logs.s3.bucket
          Value:
            Ref: S3Bucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-ALB
        - Key: Environment
          Value:
            Ref: Environment
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name:
        Fn::Sub: ${AWS::StackName}-TargetGroup
      Port: 80
      Protocol: HTTP
      VpcId:
        Ref: VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: "30"
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-TargetGroup
        - Key: Environment
          Value:
            Ref: Environment
  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn:
            Ref: ALBTargetGroup
      LoadBalancerArn:
        Ref: ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName:
        Fn::Sub: ${AWS::StackName}-LaunchTemplate
      LaunchTemplateData:
        ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn:
            Fn::GetAtt:
              - EC2InstanceProfile
              - Arn
        SecurityGroupIds:
          - Ref: WebServerSecurityGroup
        UserData:
          Fn::Base64:
            Fn::Sub:
              "#!/bin/bash\n# Update system\nyum update -y\n\n# Install required packages\nyum install -y httpd php php-mysqlnd mysql\n\n# Start and enable Apache\nsystemctl start httpd\nsystemctl enable httpd\n\n# Create a simple PHP application\ncat > /var/www/html/index.php << 'EOF'\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Web Application</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        .container { max-width: 800px; margin: 0 auto; }\n        .info { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <h1>Web Application Server</h1>\n        <div class=\"info\">\n            <h3>Instance Information:</h3>\n            <p><strong>Instance ID:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/instance-id'); ?></p>\n            <p><strong>Availability Zone:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/placement/availability-zone');\
              \ ?></p>\n            <p><strong>Region:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/placement/region'); ?></p>\n            <p><strong>Launch Time:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/launch-time'); ?></p>\n        </div>\n        <div class=\"info\">\n            <h3>Stack Information:</h3>\n            <p><strong>Stack Name:</strong> ${AWS::StackName}</p>\n            <p><strong>Environment:</strong> ${Environment}</p>\n        </div>\n    </div>\n</body>\n</html>\nEOF\n\n# Set proper permissions\nchown apache:apache /var/www/html/index.php\nchmod 644 /var/www/html/index.php\n\n# Create health check endpoint\necho \"OK\" > /var/www/html/health\nchown apache:apache /var/www/html/health\nchmod 644 /var/www/html/health\n\n# Install and configure CloudWatch agent\nyum install -y amazon-cloudwatch-agent\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard\n"
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value:
                  Fn::Sub: ${AWS::StackName}-Instance
              - Key: Environment
                Value:
                  Ref: Environment
              - Key: Project
                Value: WebApp
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName:
        Fn::Sub: ${AWS::StackName}-ASG
      VPCZoneIdentifier:
        - Ref: PrivateSubnet1
        - Ref: PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId:
          Ref: LaunchTemplate
        Version:
          Fn::GetAtt:
            - LaunchTemplate
            - LatestVersionNumber
      MinSize: 2
      MaxSize: 5
      DesiredCapacity: 2
      TargetGroupARNs:
        - Ref: ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Cooldown: 300
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value:
            Ref: Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: WebApp
          PropagateAtLaunch: true
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: ${AWS::StackName}-High-CPU-Usage
      AlarmDescription: Alarm when CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value:
            Ref: AutoScalingGroup
      AlarmActions:
        - Ref: ScaleUpPolicy
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: ${AWS::StackName}-Low-CPU-Usage
      AlarmDescription: Alarm when CPU is below 25%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value:
            Ref: AutoScalingGroup
      AlarmActions:
        - Ref: ScaleDownPolicy
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      PolicyName:
        Fn::Sub: ${AWS::StackName}-ScaleUp
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName:
        Ref: AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      PolicyName:
        Fn::Sub: ${AWS::StackName}-ScaleDown
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName:
        Ref: AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName:
        Fn::Sub: tapstack-logs-tapstackpr1697-${AWS::AccountId}-${AWS::Region}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: ALBLogsLifecycle
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 90
            ExpirationInDays: 2555
      Tags:
        - Key: Name
          Value:
            Fn::Sub: ${AWS::StackName}-Static-Content
        - Key: Environment
          Value:
            Ref: Environment
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: S3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action:
              - s3:PutObject
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action:
              - s3:GetBucketLocation
              - s3:ListBucket
              - s3:GetEncryptionConfiguration
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
          - Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:PutObject
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Effect: Allow
            Principal:
              AWS: arn:aws:iam::127311923021:root
            Action:
              - s3:PutObject
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:GetBucketLocation
              - s3:ListBucket
              - s3:GetEncryptionConfiguration
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
          - Effect: Allow
            Principal:
              AWS: arn:aws:iam::127311923021:root
            Action:
              - s3:GetBucketLocation
              - s3:ListBucket
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
          - Effect: Allow
            Principal:
              AWS:
                Fn::GetAtt:
                  - ALBLogDeliveryRole
                  - Arn
            Action:
              - s3:PutObject
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
          - Effect: Allow
            Principal:
              AWS:
                Fn::Sub: arn:${AWS::Partition}:iam::${AWS::AccountId}:root
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}/*
          - Effect: Allow
            Principal:
              AWS:
                Fn::Sub: arn:${AWS::Partition}:iam::${AWS::AccountId}:root
            Action:
              - s3:GetBucketLocation
              - s3:ListBucket
              - s3:GetBucketVersioning
              - s3:GetEncryptionConfiguration
            Resource:
              Fn::Sub: arn:${AWS::Partition}:s3:::${S3Bucket}
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName:
        Fn::Sub: /aws/ec2/${AWS::StackName}
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value:
            Ref: Environment
Outputs:
  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value:
      Fn::GetAtt:
        - ApplicationLoadBalancer
        - DNSName
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-ALB-DNS
  ApplicationLoadBalancerURL:
    Description: URL to access the Application Load Balancer
    Value:
      Fn::Sub: http://${ApplicationLoadBalancer.DNSName}
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-ALB-URL
  VPCId:
    Description: VPC ID
    Value:
      Ref: VPC
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-VPC-ID
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value:
      Fn::GetAtt:
        - Database
        - Endpoint.Address
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-DB-Endpoint
  S3BucketName:
    Description: S3 Bucket Name for Static Content and ALB Logs
    Value:
      Ref: S3Bucket
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-S3-Bucket
  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value:
      Ref: AutoScalingGroup
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-ASG-Name
  StackRegion:
    Description: AWS Region where the stack is deployed
    Value:
      Ref: AWS::Region
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-Region
  ALBLogDeliveryRoleArn:
    Description: ARN of the ALB Log Delivery IAM Role
    Value:
      Fn::GetAtt:
        - ALBLogDeliveryRole
        - Arn
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-ALB-Log-Delivery-Role-ARN
  DatabaseKMSKeyId:
    Description: KMS Key ID used for RDS Database encryption
    Value:
      Ref: DatabaseKMSKey
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-Database-KMS-Key-ID
  DatabaseKMSKeyArn:
    Description: KMS Key ARN used for RDS Database encryption
    Value:
      Fn::GetAtt:
        - DatabaseKMSKey
        - Arn
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-Database-KMS-Key-ARN
```