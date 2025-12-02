### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that needs to implement a multi-tier web application with enterprise-grade requirements. Let me break down the key requirements:

1. **Network Foundation**:
   - VPC with public and private subnets
   - At least 2 availability zones
   - Network isolation and redundancy

2. **Application Tier**:
   - Application Load Balancer (ALB)
   - Auto Scaling group with EC2 instances
   - Dynamic scaling based on demand

3. **Database Tier**:
   - Amazon RDS with Multi-AZ deployment
   - Automatic failover capabilities

4. **Security Requirements**:
   - Security groups with restricted access
   - Network ACLs
   - IAM roles with specific permissions for S3, RDS, CloudWatch
   - SSE-S3 encryption for S3
   - CloudWatch Logs for audit trails

5. **Standards**:
   - Naming convention: `<project>-<environment>-<resource-type>`
   - Project: webapp
   - Environment: prod
   - Region agnostic
   - Production-ready with parameters, outputs, and metadata

Let me create a comprehensive CloudFormation template that addresses all these requirements:
### Answer 
---

# Enterprise Web Application CloudFormation Template

Below is a comprehensive CloudFormation template that orchestrates a production-ready, highly available, and secure web application infrastructure. This template implements all the requirements including multi-tier architecture, security best practices, and enterprise-grade scalability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-grade web application infrastructure with multi-tier architecture, high availability, and comprehensive security'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - VPCCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: "Application Configuration"
        Parameters:
          - InstanceType
          - KeyPairName
          - MinSize
          - MaxSize
          - DesiredCapacity
          - TargetCPUUtilization
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBUsername
          - DBPassword
          - DBAllocatedStorage
      - Label:
          default: "Security Configuration"
        Parameters:
          - AllowedIPRange

Parameters:
  VPCCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for public subnet 1

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for public subnet 2

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.10.0/24'
    Description: CIDR block for private subnet 1

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: CIDR block for private subnet 2

  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
    Description: EC2 instance type for application servers

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

  MinSize:
    Type: Number
    Default: 2
    MinValue: 1
    Description: Minimum number of EC2 instances in Auto Scaling group

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    Description: Maximum number of EC2 instances in Auto Scaling group

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 1
    Description: Desired number of EC2 instances in Auto Scaling group

  TargetCPUUtilization:
    Type: Number
    Default: 70
    MinValue: 10
    MaxValue: 90
    Description: Target CPU utilization percentage for auto scaling

  DBInstanceClass:
    Type: String
    Default: db.t3.small
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge
    Description: Database instance class

  DBUsername:
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database master username

  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+=-]*'
    Description: Database master password

  DBAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 1000
    Description: Allocated storage for database (GB)

  AllowedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: IP range allowed to access the application (CIDR notation)
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

Mappings:
  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c
    ap-southeast-1:
      AMI: ami-0e5182fad1edfaa68

Resources:
  # ========================================
  # NETWORK INFRASTRUCTURE
  # ========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: webapp-prod-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: webapp-prod-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-prod-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-prod-public-subnet-2

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: webapp-prod-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: webapp-prod-private-subnet-2

  # NAT Gateways for private subnet internet access
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: webapp-prod-nat-1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: webapp-prod-nat-2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-public-rt

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-private-rt-1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-private-rt-2

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Network ACLs
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-prod-public-nacl

  PublicNetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref AllowedIPRange

  PublicNetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PublicSubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  # ========================================
  # SECURITY GROUPS
  # ========================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      GroupName: webapp-prod-alb-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
      Tags:
        - Key: Name
          Value: webapp-prod-alb-sg

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      GroupName: webapp-prod-webserver-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref VPCCIDR
      Tags:
        - Key: Name
          Value: webapp-prod-webserver-sg

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      GroupName: webapp-prod-database-sg
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: webapp-prod-database-sg

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================
  
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: webapp-prod-ec2-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: webapp-prod-s3-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
        - PolicyName: webapp-prod-cloudwatch-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource:
                  - !GetAtt ApplicationLogGroup.Arn
                  - !Sub '${ApplicationLogGroup.Arn}:*'
        - PolicyName: webapp-prod-ssm-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/webapp/prod/*'
      Tags:
        - Key: Name
          Value: webapp-prod-ec2-role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: webapp-prod-ec2-profile
      Roles:
        - !Ref EC2Role

  # ========================================
  # S3 BUCKET
  # ========================================
  
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-prod-storage-${AWS::AccountId}'
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
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LogBucket
        LogFilePrefix: 'webapp-prod-storage-logs/'
      Tags:
        - Key: Name
          Value: webapp-prod-s3-bucket

  S3LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-prod-logs-${AWS::AccountId}'
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: webapp-prod-s3-log-bucket

  # ========================================
  # CLOUDWATCH LOG GROUPS
  # ========================================
  
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/webapp/prod/application
      RetentionInDays: 30

  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/webapp/prod/alb
      RetentionInDays: 30

  # ========================================
  # DATABASE LAYER
  # ========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: webapp-prod-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: webapp-prod-db-subnet-group

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: webapp-prod-database
      Engine: mysql
      EngineVersion: '8.0.28'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: webapp-prod-rds

  # ========================================
  # APPLICATION LOAD BALANCER
  # ========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: webapp-prod-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: webapp-prod-alb

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: webapp-prod-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: webapp-prod-target-group

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ========================================
  # LAUNCH TEMPLATE AND AUTO SCALING
  # ========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: webapp-prod-launch-template
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: webapp-prod-instance
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd mysql amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${ApplicationLogGroup}",
                        "log_stream_name": "{instance_id}/apache_access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${ApplicationLogGroup}",
                        "log_stream_name": "{instance_id}/apache_error"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Configure web server
            echo "<h1>WebApp Production Server</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
            
            # Store database endpoint in SSM Parameter Store
            aws ssm put-parameter --name /webapp/prod/db/endpoint --value ${DatabaseInstance.Endpoint.Address} --type String --region ${AWS::Region}
            
            systemctl start httpd
            systemctl enable httpd

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
    Properties:
      AutoScalingGroupName: webapp-prod-asg
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: "1Minute"
          Metrics:
            - GroupInServiceInstances
            - GroupPendingInstances
            - GroupTerminatingInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: webapp-prod-asg-instance
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::TargetTrackingScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !Ref TargetCPUUtilization

  # ========================================
  # CLOUDWATCH ALARMS
  # ========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-high-cpu
      AlarmDescription: Alarm when CPU exceeds 80%
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

  UnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-unhealthy-hosts
      AlarmDescription: Alarm when we have unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: webapp-prod-db-connections
      AlarmDescription: Alarm when database connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance

# ========================================
# OUTPUTS
# ========================================

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  LoadBalancerURL:
    Description: Application Load Balancer URL
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-url'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-db-endpoint'

  S3BucketName:
    Description: S3 Bucket for Application Storage
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'

  ApplicationLogGroup:
    Description: CloudWatch Log Group for Application Logs
    Value: !Ref ApplicationLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-app-log-group'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-asg-name'

  SecurityGroupWebServer:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-webserver-sg'

  SecurityGroupDatabase:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-database-sg'
```

## Key Features Implemented

### 1. **Network Architecture**
- **VPC with Multi-AZ Design**: Spans two availability zones for high availability
- **Public/Private Subnet Segregation**: Public subnets for ALB, private subnets for application and database tiers
- **NAT Gateways**: Redundant NAT gateways for outbound internet connectivity from private subnets
- **Network ACLs**: Additional layer of network security with customizable IP restrictions

### 2. **Security Implementation**
- **Defense in Depth**: Multiple security layers including NACLs, Security Groups, and IAM policies
- **Least Privilege IAM**: Role with minimal required permissions for S3, RDS, and CloudWatch
- **Encryption at Rest**: SSE-S3 for S3 buckets, encrypted RDS storage
- **Network Isolation**: Private subnets for application and database tiers

### 3. **High Availability & Scalability**
- **Multi-AZ RDS**: Automatic failover capability for database
- **Auto Scaling Group**: Dynamic capacity adjustment based on CPU utilization
- **Application Load Balancer**: Distributes traffic across multiple instances
- **Health Checks**: ELB health checks ensure only healthy instances receive traffic

### 4. **Monitoring & Logging**
- **CloudWatch Integration**: Comprehensive logging to CloudWatch Logs
- **CloudWatch Alarms**: Proactive monitoring for CPU, unhealthy hosts, and database connections
- **Metrics Collection**: Detailed Auto Scaling metrics at 1-minute granularity
- **S3 Access Logging**: Audit trail for S3 bucket access

### 5. **Operational Excellence**
- **Consistent Naming Convention**: All resources follow `webapp-prod-<resource-type>` pattern
- **Region Agnostic**: Uses mappings and intrinsic functions for cross-region deployment
- **Parameterized Configuration**: Extensive parameters for customization without template modification
- **Resource Tagging**: Consistent tagging for resource management and cost allocation

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - EC2 Key Pair created in the target region
   - Update the AMI mappings if deploying to regions not included

2. **Deploy the Stack**:
```bash
aws cloudformation create-stack \
  --stack-name webapp-production \
  --template-body file://webapp-infrastructure.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Monitor Stack Creation**:
```bash
aws cloudformation describe-stacks \
  --stack-name webapp-production \
  --query 'Stacks[0].StackStatus'
```

4. **Access the Application**:
   - Once the stack creation is complete, retrieve the ALB URL from the outputs
   - Access the application at `http://<ALB-DNS-Name>`

## Security Considerations

- **Change default passwords**: Always use strong, unique passwords for database access
- **Restrict IP ranges**: Update `AllowedIPRange` parameter to limit access to known IP addresses
- **Enable AWS WAF**: Consider adding AWS WAF to the ALB for additional application security
- **Regular Updates**: Ensure EC2 instances are regularly patched and updated
- **Backup Strategy**: Implement additional backup strategies beyond the default RDS backups

This template provides a production-ready foundation that can be extended with additional features such as ElastiCache for session management, CloudFront for content delivery, or Lambda functions for serverless processing.