```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade web application infrastructure with ALB, Auto Scaling, RDS, and monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource names to support parallel deployments (e.g., PR number)"
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"
  
  DBMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      
  SNSEmailAddress:
    Type: String
    Description: 'Email address for CloudWatch alarm notifications'
    Default: 'ops@example.com'
    
  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

Resources:
  # Database Secret
  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret'
      Description: 'RDS master password'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludePunctuation: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-secret"

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc"

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw"

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2"

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1"

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2"

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-1"

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.22.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-2"

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt"

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-1"

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-2"

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-1"

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-2"

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-1"

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DBSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-2"

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DBSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
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
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg"

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg"

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg"

  # S3 Bucket for logs
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-logs"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-logs-bucket"

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${LogsBucket.Arn}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LogsBucket.Arn

          - Sid: ELBAccessLogsWrite
            Effect: Allow
            Principal:
              AWS: !Sub 
                - "arn:aws:iam::${ELBAccount}:root"
                - ELBAccount: !FindInMap [ELBAccountId, !Ref "AWS::Region", AccountId]
            Action: s3:PutObject
            Resource: !Sub "${LogsBucket.Arn}/alb-logs/*"

  # IAM Roles and Policies
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub "arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy"
      Policies:
        - PolicyName: S3LogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                  - s3:GetObject
                  - s3:GetObjectAcl
                Resource: !Sub "${LogsBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt LogsBucket.Arn
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - cloudwatch:GetMetricStatistics
                  - cloudwatch:ListMetrics
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"
      Roles:
        - !Ref EC2InstanceRole

  # RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"
      AllocatedStorage: '20'
      StorageType: gp2
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: LogsBucketPolicy
    Properties:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-alb"
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb"

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-tg"
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-target-group"

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template and Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template"
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd mysql amazon-cloudwatch-agent
            
            # Configure web server
            systemctl start httpd
            systemctl enable httpd
            
            # Create simple web page
            cat > /var/www/html/index.html <<EOF
            <html>
            <head><title>Web App</title></head>
            <body>
            <h1>Web Application</h1>
            <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
            <p>Stack: ${AWS::StackName}</p>
            <p>Region: ${AWS::Region}</p>
            <p>Environment: ${EnvironmentSuffix}</p>
            </body>
            </html>
            EOF
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "agent": {
                "run_as_user": "root"
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}",
                        "log_stream_name": "{instance_id}/apache-access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}",
                        "log_stream_name": "{instance_id}/apache-error"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ]
                  },
                  "disk": {
                    "measurement": [
                      "used_percent"
                    ],
                    "resources": [
                      "*"
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance"

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-instance"
          PropagateAtLaunch: true

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  # CloudWatch Alarms and SNS Topic
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alerts"
      DisplayName: CloudWatch Alarms
      Subscription:
        - Endpoint: !Ref SNSEmailAddress
          Protocol: email

  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-cpu-high"
      AlarmDescription: EC2 instance CPU utilization
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
      TreatMissingData: breaching

  ALBLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-latency"
      AlarmDescription: ALB target response time
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  ALB5XXAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-5xx"
      AlarmDescription: ALB 5XX errors
      MetricName: HTTPCode_Target_5XX_Count
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-cpu"
      AlarmDescription: RDS CPU utilization
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
      TreatMissingData: breaching

  RDSFreeStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-storage"
      AlarmDescription: RDS free storage space
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  RDSConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-connections"
      AlarmDescription: RDS database connections
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  # CloudWatch Log Groups
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/ec2/${AWS::StackName}"
      RetentionInDays: 30

Mappings:
  ELBAccountId:
    us-east-1:
      AccountId: '127311923021'
    us-east-2:
      AccountId: '033677994240'
    us-west-1:
      AccountId: '027434742980'
    us-west-2:
      AccountId: '797873946194'
    eu-west-1:
      AccountId: '156460612806'
    eu-central-1:
      AccountId: '054676820928'
    ap-southeast-1:
      AccountId: '114774131450'
    ap-southeast-2:
      AccountId: '783225319266'

Outputs:
  # VPC and Networking Outputs
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-vpc-id"
      
  VpcCidr:
    Description: VPC CIDR block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-vpc-cidr"
      
  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub "${AWS::StackName}-igw-id"
      
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-public-subnet-1-id"
      
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-public-subnet-2-id"
      
  PublicSubnetIds:
    Description: All Public Subnet IDs (comma-separated)
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-public-subnet-ids"
      
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-private-subnet-1-id"
      
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-private-subnet-2-id"
      
  PrivateSubnetIds:
    Description: All Private Subnet IDs (comma-separated)
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-private-subnet-ids"
      
  DBSubnet1Id:
    Description: Database Subnet 1 ID
    Value: !Ref DBSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-db-subnet-1-id"
      
  DBSubnet2Id:
    Description: Database Subnet 2 ID
    Value: !Ref DBSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-db-subnet-2-id"
      
  DBSubnetIds:
    Description: All Database Subnet IDs (comma-separated)
    Value: !Join [',', [!Ref DBSubnet1, !Ref DBSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-db-subnet-ids"
      
  NatGateway1Id:
    Description: NAT Gateway 1 ID
    Value: !Ref NatGateway1
    Export:
      Name: !Sub "${AWS::StackName}-nat-gateway-1-id"
      
  NatGateway2Id:
    Description: NAT Gateway 2 ID
    Value: !Ref NatGateway2
    Export:
      Name: !Sub "${AWS::StackName}-nat-gateway-2-id"
      
  # Security Group Outputs
  ALBSecurityGroupId:
    Description: Application Load Balancer Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-alb-sg-id"
      
  EC2SecurityGroupId:
    Description: EC2 Instances Security Group ID
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-ec2-sg-id"
      
  RDSSecurityGroupId:
    Description: RDS Database Security Group ID
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-rds-sg-id"
      
  # S3 Bucket Outputs
  LogsBucketName:
    Description: S3 bucket for logs
    Value: !Ref LogsBucket
    Export:
      Name: !Sub "${AWS::StackName}-logs-bucket"
      
  LogsBucketArn:
    Description: S3 logs bucket ARN
    Value: !GetAtt LogsBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-logs-bucket-arn"
      
  LogsBucketDomainName:
    Description: S3 logs bucket domain name
    Value: !GetAtt LogsBucket.DomainName
    Export:
      Name: !Sub "${AWS::StackName}-logs-bucket-domain"
      
  # IAM Outputs
  EC2InstanceRoleArn:
    Description: EC2 Instance IAM Role ARN
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ec2-role-arn"
      
  EC2InstanceProfileArn:
    Description: EC2 Instance Profile ARN
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ec2-profile-arn"
      
  # Database Outputs
  RDSEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-rds-endpoint"
      
  RDSPort:
    Description: RDS database port
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-rds-port"
      
  RDSInstanceId:
    Description: RDS database instance identifier
    Value: !Ref RDSInstance
    Export:
      Name: !Sub "${AWS::StackName}-rds-instance-id"
      
  DBSubnetGroupName:
    Description: Database subnet group name
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub "${AWS::StackName}-db-subnet-group"
      
  DBSecretArn:
    Description: RDS database master password secret ARN
    Value: !Ref DBMasterSecret
    Export:
      Name: !Sub "${AWS::StackName}-db-secret-arn"
      
  # Load Balancer Outputs
  ALBEndpoint:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-alb-endpoint"
      
  ALBArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub "${AWS::StackName}-alb-arn"
      
  ALBFullName:
    Description: Application Load Balancer full name
    Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
    Export:
      Name: !Sub "${AWS::StackName}-alb-full-name"
      
  ALBHostedZoneId:
    Description: Application Load Balancer hosted zone ID
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub "${AWS::StackName}-alb-hosted-zone-id"
      
  ALBTargetGroupArn:
    Description: ALB Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub "${AWS::StackName}-alb-target-group-arn"
      
  ALBTargetGroupFullName:
    Description: ALB Target Group full name
    Value: !GetAtt ALBTargetGroup.TargetGroupFullName
    Export:
      Name: !Sub "${AWS::StackName}-alb-target-group-full-name"
      
  # Auto Scaling Outputs
  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub "${AWS::StackName}-launch-template-id"
      
  LaunchTemplateVersion:
    Description: Launch Template latest version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub "${AWS::StackName}-launch-template-version"
      
  AutoScalingGroupName:
    Description: Auto Scaling Group name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-asg-name"
      
  AutoScalingGroupArn:
    Description: Auto Scaling Group ARN
    Value: !Sub "arn:${AWS::Partition}:autoscaling:${AWS::Region}:${AWS::AccountId}:autoScalingGroup:*:autoScalingGroupName/${AutoScalingGroup}"
    Export:
      Name: !Sub "${AWS::StackName}-asg-arn"
      
  # Monitoring Outputs
  SNSTopicArn:
    Description: SNS Topic ARN for CloudWatch alarms
    Value: !Ref SNSTopic
    Export:
      Name: !Sub "${AWS::StackName}-sns-topic-arn"
      
  WebAppLogGroupName:
    Description: CloudWatch Log Group name for web application
    Value: !Ref WebAppLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-log-group-name"
      
  WebAppLogGroupArn:
    Description: CloudWatch Log Group ARN for web application
    Value: !GetAtt WebAppLogGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-log-group-arn"
      
  # CloudWatch Alarm Outputs
  EC2CPUAlarmName:
    Description: EC2 CPU alarm name
    Value: !Ref EC2CPUAlarm
    Export:
      Name: !Sub "${AWS::StackName}-ec2-cpu-alarm"
      
  ALBLatencyAlarmName:
    Description: ALB latency alarm name
    Value: !Ref ALBLatencyAlarm
    Export:
      Name: !Sub "${AWS::StackName}-alb-latency-alarm"
      
  ALB5XXAlarmName:
    Description: ALB 5XX error alarm name
    Value: !Ref ALB5XXAlarm
    Export:
      Name: !Sub "${AWS::StackName}-alb-5xx-alarm"
      
  RDSCPUAlarmName:
    Description: RDS CPU alarm name
    Value: !Ref RDSCPUAlarm
    Export:
      Name: !Sub "${AWS::StackName}-rds-cpu-alarm"
      
  RDSStorageAlarmName:
    Description: RDS storage alarm name
    Value: !Ref RDSFreeStorageAlarm
    Export:
      Name: !Sub "${AWS::StackName}-rds-storage-alarm"
      
  RDSConnectionsAlarmName:
    Description: RDS connections alarm name
    Value: !Ref RDSConnectionsAlarm
    Export:
      Name: !Sub "${AWS::StackName}-rds-connections-alarm"
      
  # Useful URLs and Connection Strings
  ApplicationURL:
    Description: Application URL (HTTP)
    Value: !Sub "http://${ApplicationLoadBalancer.DNSName}"
    Export:
      Name: !Sub "${AWS::StackName}-app-url"
      
  DatabaseConnectionString:
    Description: Database connection string template (password from Secrets Manager)
    Value: !Sub "mysql://${DBMasterUsername}:<PASSWORD>@${RDSInstance.Endpoint.Address}:${RDSInstance.Endpoint.Port}/mysql"
    Export:
      Name: !Sub "${AWS::StackName}-db-connection-string"
      
  # Stack Information
  StackName:
    Description: CloudFormation stack name
    Value: !Ref "AWS::StackName"
    Export:
      Name: !Sub "${AWS::StackName}-stack-name"
      
  EnvironmentSuffix:
    Description: Environment suffix used for resources
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-environment-suffix"
      
  Region:
    Description: AWS Region where stack is deployed
    Value: !Ref "AWS::Region"
    Export:
      Name: !Sub "${AWS::StackName}-region"