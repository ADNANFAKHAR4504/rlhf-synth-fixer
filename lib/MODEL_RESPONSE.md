AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Production Environment in us-west-2'

Resources:
  # VPC and Networking Resources
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: Production VPC
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: Production IGW
        - Key: Environment
          Value: Production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProductionVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet 1
        - Key: Environment
          Value: Production

  # Public Subnet 2 (for ALB redundancy)
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: us-west-2b
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet 2
        - Key: Environment
          Value: Production

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet 1
        - Key: Environment
          Value: Production

  # Private Subnet 2 (for high availability)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: us-west-2b
      CidrBlock: 10.0.4.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: Private Subnet 2
        - Key: Environment
          Value: Production

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: Public Route Table
        - Key: Environment
          Value: Production

  # Public Route
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate Public Subnets with Public Route Table
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

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: Private Route Table
        - Key: Environment
          Value: Production

  # Associate Private Subnets with Private Route Table
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

  # NAT Gateway for Private Subnets to Access Internet
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: NAT Gateway EIP
        - Key: Environment
          Value: Production

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: Production NAT Gateway
        - Key: Environment
          Value: Production

  PrivateRouteToNAT:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref ProductionVPC
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
          Value: ALB Security Group
        - Key: Environment
          Value: Production

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: EC2 Security Group
        - Key: Environment
          Value: Production

  # IAM Role for EC2 Instance
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Path: /
      Tags:
        - Key: Environment
          Value: Production

  # Custom policy for EC2 to send logs to CloudWatch
  EC2CloudWatchPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: EC2CloudWatchLogs
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
      Roles:
        - !Ref EC2Role

  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2Role

  # EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0c55b159cbfafe1f0  # Amazon Linux 2 AMI in us-west-2 (replace with current AMI)
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true  # Detailed monitoring
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y awslogs httpd
          systemctl start httpd
          systemctl enable httpd
          cat > /etc/awslogs/awslogs.conf << EOF
          [general]
          state_file = /var/lib/awslogs/agent-state
          [/var/log/httpd/access_log]
          file = /var/log/httpd/access_log
          log_group_name = ${EC2LogGroup}
          log_stream_name = {instance_id}/apache-access
          datetime_format = %d/%b/%Y:%H:%M:%S %z
          [/var/log/httpd/error_log]
          file = /var/log/httpd/error_log
          log_group_name = ${EC2LogGroup}
          log_stream_name = {instance_id}/apache-error
          datetime_format = %d/%b/%Y:%H:%M:%S %z
          EOF
          systemctl start awslogsd
          systemctl enable awslogsd
      Tags:
        - Key: Name
          Value: Production EC2
        - Key: Environment
          Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: true
        - Key: access_logs.s3.bucket
          Value: !Ref ALBLogBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: idle_timeout.timeout_seconds
          Value: '60'
      Tags:
        - Key: Name
          Value: Production ALB
        - Key: Environment
          Value: Production

  # ALB Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckPort: traffic-port
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 80
      Protocol: HTTP
      TargetType: instance
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      UnhealthyThresholdCount: 2
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: Production Target Group
        - Key: Environment
          Value: Production

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # S3 Bucket for ALB Logs with Server-Side Encryption
  ALBLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: LogDeliveryWrite
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
          - Id: DeleteAfter90Days
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: ALB Log Bucket
        - Key: Environment
          Value: Production

  # S3 Bucket Policy for ALB Logs
  ALBLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: arn:aws:iam::797873946194:root  # ALB Account ID for us-west-2
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${ALBLogBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*'
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${ALBLogBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !Sub 'arn:aws:s3:::${ALBLogBucket}'

  # CloudWatch Log Group for EC2
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EC2Instance}'
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Group for ALB
  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/alb/${ApplicationLoadBalancer}'
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: Production

  # AWS Config Configuration
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: ProductionConfigRecorder
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: Six_Hours
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: config-snapshots

  # S3 Bucket for AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
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
          - Id: DeleteAfter1Year
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: Config Bucket
        - Key: Environment
          Value: Production

  # IAM Role for AWS Config
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Path: /
      Tags:
        - Key: Environment
          Value: Production

  # Custom policy for Config to write to S3
  ConfigS3Policy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: ConfigS3Access
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 's3:PutObject'
              - 's3:GetBucketAcl'
            Resource:
              - !Sub 'arn:aws:s3:::${ConfigBucket}'
              - !Sub 'arn:aws:s3:::${ConfigBucket}/*'
      Roles:
        - !Ref ConfigRole

  # Enable AWS Config Rules for Compliance
  ConfigSecurityGroupRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: restricted-ssh
      Description: Checks whether security groups allow unrestricted SSH access
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::SecurityGroup

  ConfigRootMfaRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: root-account-mfa
      Description: Checks whether the root user of the AWS account has MFA enabled
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_ACCOUNT_MFA_ENABLED

  ConfigEncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume

  # CloudWatch Dashboard for Monitoring
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: ProductionMonitoring
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/EC2", "CPUUtilization", "InstanceId", "${EC2Instance}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-west-2",
                "title": "EC2 CPU Utilization"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-west-2",
                "title": "ALB Request Count"
              }
            }
          ]
        }

Outputs:
  VPCID:
    Description: ID of the VPC
    Value: !Ref ProductionVPC

  ALBDNSName:
    Description: DNS Name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  EC2InstanceID:
    Description: ID of the EC2 instance
    Value: !Ref EC2Instance

  ConfigBucketName:
    Description: Name of the Config S3 Bucket
    Value: !Ref ConfigBucket

  ALBLogBucketName:
    Description: Name of the ALB Logs S3 Bucket
    Value: !Ref ALBLogBucket