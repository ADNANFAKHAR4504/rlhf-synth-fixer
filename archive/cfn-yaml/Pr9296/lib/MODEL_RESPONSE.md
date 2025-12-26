```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available, scalable web application stack'

Parameters:
  Environment:
    Type: String
    Default: prod
    Description: Environment name
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access

Resources:
  # VPC
  prod-vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  # Internet Gateway
  prod-internet-gateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-internet-gateway'

  prod-internet-gateway-attachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref prod-vpc
      InternetGatewayId: !Ref prod-internet-gateway

  # Public Subnets
  prod-public-subnet-1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref prod-vpc
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  prod-public-subnet-2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref prod-vpc
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  # Private Subnets
  prod-private-subnet-1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref prod-vpc
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  prod-private-subnet-2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref prod-vpc
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'

  # Route Tables
  prod-public-route-table:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref prod-vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-route-table'

  prod-private-route-table:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref prod-vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-route-table'

  # Routes
  prod-public-route:
    Type: AWS::EC2::Route
    DependsOn: prod-internet-gateway-attachment
    Properties:
      RouteTableId: !Ref prod-public-route-table
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref prod-internet-gateway

  # Route Table Associations
  prod-public-subnet-1-association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref prod-public-subnet-1
      RouteTableId: !Ref prod-public-route-table

  prod-public-subnet-2-association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref prod-public-subnet-2
      RouteTableId: !Ref prod-public-route-table

  prod-private-subnet-1-association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref prod-private-subnet-1
      RouteTableId: !Ref prod-private-route-table

  prod-private-subnet-2-association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref prod-private-subnet-2
      RouteTableId: !Ref prod-private-route-table

  # Security Groups
  prod-alb-security-group:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-alb-security-group'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref prod-vpc
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
          Value: !Sub '${Environment}-alb-security-group'

  prod-ec2-security-group:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-ec2-security-group'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref prod-vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref prod-alb-security-group
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-security-group'

  prod-rds-security-group:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-rds-security-group'
      GroupDescription: Security group for RDS MySQL instance
      VpcId: !Ref prod-vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref prod-ec2-security-group
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-security-group'

  # IAM Role for EC2 instances
  prod-ec2-role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-role'
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
        - PolicyName: !Sub '${Environment}-s3-access-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${prod-s3-bucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  prod-ec2-instance-profile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-ec2-instance-profile'
      Roles:
        - !Ref prod-ec2-role

  # Launch Template
  prod-launch-template:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316
        InstanceType: t3.micro
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt prod-ec2-instance-profile.Arn
        SecurityGroupIds:
          - !Ref prod-ec2-security-group
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment} environment</h1>" > /var/www/html/index.html
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${Environment}/httpd/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${Environment}/httpd/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "CWAgent",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      "used_percent"
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

  # Application Load Balancer
  prod-application-load-balancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-application-load-balancer'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref prod-alb-security-group
      Subnets:
        - !Ref prod-public-subnet-1
        - !Ref prod-public-subnet-2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-application-load-balancer'

  prod-target-group:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-target-group'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref prod-vpc
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-target-group'

  prod-alb-listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref prod-target-group
      LoadBalancerArn: !Ref prod-application-load-balancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  prod-auto-scaling-group:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-auto-scaling-group'
      LaunchTemplate:
        LaunchTemplateId: !Ref prod-launch-template
        Version: !GetAtt prod-launch-template.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref prod-public-subnet-1
        - !Ref prod-public-subnet-2
      TargetGroupARNs:
        - !Ref prod-target-group
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-auto-scaling-group'
          PropagateAtLaunch: true

  # RDS Subnet Group
  prod-rds-subnet-group:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-rds-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS MySQL instance
      SubnetIds:
        - !Ref prod-private-subnet-1
        - !Ref prod-private-subnet-2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-subnet-group'

  # RDS MySQL Instance
  prod-rds-mysql:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-rds-mysql'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      DBName: webapp
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${prod-rds-secret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref prod-rds-security-group
      DBSubnetGroupName: !Ref prod-rds-subnet-group
      BackupRetentionPeriod: 7
      MultiAZ: true
      PubliclyAccessible: false
      StorageEncrypted: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt prod-rds-monitoring-role.Arn
      EnablePerformanceInsights: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-mysql'

  # RDS Secret
  prod-rds-secret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}-rds-secret'
      Description: RDS MySQL master password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'

  # RDS Monitoring Role
  prod-rds-monitoring-role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # S3 Bucket for static assets
  prod-s3-bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-static-assets-${AWS::AccountId}-${AWS::Region}'
      PublicReadPolicy: true
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-s3-bucket'

  prod-s3-bucket-policy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref prod-s3-bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: s3:GetObject
            Resource: !Sub '${prod-s3-bucket}/*'

  # CloudWatch Log Groups
  prod-httpd-access-log-group:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}/httpd/access'
      RetentionInDays: 14

  prod-httpd-error-log-group:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}/httpd/error'
      RetentionInDays: 14

  # CloudWatch Alarms
  prod-asg-cpu-alarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-asg-cpu-alarm'
      AlarmDescription: CPU utilization alarm for Auto Scaling Group
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref prod-auto-scaling-group
      AlarmActions:
        - !Ref prod-scale-up-policy

  prod-rds-cpu-alarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-rds-cpu-alarm'
      AlarmDescription: CPU utilization alarm for RDS instance
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref prod-rds-mysql

  # Auto Scaling Policies
  prod-scale-up-policy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref prod-auto-scaling-group
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  prod-scale-down-policy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref prod-auto-scaling-group
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  prod-asg-cpu-low-alarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-asg-cpu-low-alarm'
      AlarmDescription: Low CPU utilization alarm for Auto Scaling Group
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref prod-auto-scaling-group
      AlarmActions:
        - !Ref prod-scale-down-policy

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt prod-application-load-balancer.DNSName
    Export:
      Name: !Sub '${Environment}-LoadBalancerDNS'

  S3BucketName:
    Description: Name of the S3 bucket for static assets
    Value: !Ref prod-s3-bucket
    Export:
      Name: !Sub '${Environment}-S3BucketName'

  RDSEndpoint:
    Description: RDS MySQL endpoint
    Value: !GetAtt prod-rds-mysql.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-RDSEndpoint'
```