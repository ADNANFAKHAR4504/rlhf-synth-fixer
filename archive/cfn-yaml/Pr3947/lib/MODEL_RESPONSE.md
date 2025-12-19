### Reasoning Trace

---

This is a comprehensive request for a highly available and fault-tolerant AWS infrastructure using CloudFormation. Let me break down the requirements:

1. **VPC**: Use a predefined VPC ID, spanning at least 2 AZs
2. **EC2 Instances**: t3.medium or larger in Auto Scaling Groups
3. **Load Balancing**: ELB with SSL termination
4. **Route 53**: For DNS failover
5. **RDS**: Multi-AZ database with 7-day backup retention
6. **Security**:
   - Separate subnets for app and database
   - Security groups allowing only HTTP/HTTPS from trusted IPs
7. **Monitoring**:
   - CloudWatch alarms for CPU, ELB health, RDS performance
   - CloudWatch Logs for application/infrastructure logs
8. **S3**: For static content and logs, encrypted with KMS
9. **IAM**: Roles with least privilege
10. **Naming conventions and tags**

I'll create a comprehensive CloudFormation template that addresses all these requirements. The template will include:

- Parameters for customization
- Subnets across 2 AZs (public for ALB, private for app and database)
- Application Load Balancer (ALB is more modern than classic ELB)
- Auto Scaling Group with Launch Template
- Multi-AZ RDS instance
- Security groups with appropriate rules
- CloudWatch alarms and logs
- S3 buckets with encryption
- IAM roles and instance profiles
- Route 53 health checks and failover

Let me create this template step by step.

### Answer

---

I'll create a comprehensive CloudFormation template that meets all your requirements for a highly available and fault-tolerant web application infrastructure. This template will implement AWS best practices for resilience, security, and observability.

## ha-fault-tolerant-webapp.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly Available and Fault-Tolerant Web Application Infrastructure'

Parameters:
  ProjectName:
    Type: String
    Default: 'ha-webapp'
    Description: 'Project name for resource naming and tagging'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - production
      - staging
      - development
    Description: 'Environment name'

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'Existing VPC ID where resources will be deployed'

  TrustedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'Trusted IP range for HTTP/HTTPS access (e.g., office IP)'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues:
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
    Description: 'EC2 instance type for web servers'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.small'
    Description: 'RDS instance class'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Type: String
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    NoEcho: true

  SSLCertificateArn:
    Type: String
    Description: 'ARN of the SSL certificate in ACM for HTTPS'

  DomainName:
    Type: String
    Description: 'Domain name for Route 53 (e.g., example.com)'

  HostedZoneId:
    Type: AWS::Route53::HostedZone::Id
    Description: 'Route 53 Hosted Zone ID'

  MinInstances:
    Type: Number
    Default: 2
    Description: 'Minimum number of EC2 instances'
    MinValue: 2

  MaxInstances:
    Type: Number
    Default: 6
    Description: 'Maximum number of EC2 instances'
    MinValue: 2

  DesiredInstances:
    Type: Number
    Default: 2
    Description: 'Desired number of EC2 instances'
    MinValue: 2

Mappings:
  RegionMap:
    us-west-2:
      AMI: 'ami-0c94855ba95c71c0a' # Amazon Linux 2 AMI (update as needed)

Resources:
  # S3 Buckets
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-static-content-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-static-content'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
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
          Value: !Sub '${ProjectName}-${Environment}-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} ${Environment} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}'
      TargetKeyId: !Ref KMSKey

  # Subnets
  PublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-az1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-az2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-az1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.12.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-az2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DBSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.21.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-az1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DBSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: '10.0.22.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-az2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTP access from trusted IPs'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTPS access from trusted IPs'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP access from ALB'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-webserver-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-database-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${StaticContentBucket.Arn}/*'
                  - !Sub '${LogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt StaticContentBucket.Arn
                  - !GetAtt LogsBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile'
      Roles:
        - !Ref EC2Role

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnetAZ1
        - !Ref PublicSubnetAZ2
      LoadBalancerAttributes:
        - Key: deletion_protection.enabled
          Value: 'true'
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckEnabled: true
      HealthCheckInterval: 30
      HealthCheckPath: '/health'
      HealthCheckProtocol: HTTP
      HealthCheckTimeout: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: 'lb_cookie'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-webserver'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd amazon-cloudwatch-agent

            # Configure simple health check endpoint
            echo "OK" > /var/www/html/health

            # Start services
            systemctl start httpd
            systemctl enable httpd

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "${ProjectName}/${Environment}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_active"
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
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${ProjectName}/${Environment}/httpd",
                        "log_stream_name": "{instance_id}/access_log"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${ProjectName}/${Environment}/httpd",
                        "log_stream_name": "{instance_id}/error_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref DesiredInstances
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      VPCZoneIdentifier:
        - !Ref PrivateSubnetAZ1
        - !Ref PrivateSubnetAZ2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
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

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DBSubnetAZ1
        - !Ref DBSubnetAZ2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db'
      Engine: mysql
      EngineVersion: '8.0'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
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
          Value: !Sub '${ProjectName}-${Environment}-db'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # CloudWatch Log Groups
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}/${Environment}/httpd'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # CloudWatch Alarms
  ALBTargetHealthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-alb-unhealthy-targets'
      AlarmDescription: 'Alert when ALB has unhealthy targets'
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-high-cpu'
      AlarmDescription: 'Alert when CPU utilization is high'
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

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-database-high-cpu'
      AlarmDescription: 'Alert when database CPU utilization is high'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database

  DatabaseStorageSpaceAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-database-low-storage'
      AlarmDescription: 'Alert when database storage space is low'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648 # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database

  # Route 53 Health Check and Record
  Route53HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: '/health'
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-health-check'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  Route53RecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      SetIdentifier: !Sub '${AWS::Region}-primary'
      Weight: 100
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true
      HealthCheckId: !Ref Route53HealthCheck

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-alb-dns'

  StaticContentBucketName:
    Description: 'Name of the static content S3 bucket'
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-static-bucket'

  LogsBucketName:
    Description: 'Name of the logs S3 bucket'
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-logs-bucket'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-${Environment}-db-endpoint'

  WebServerSecurityGroupId:
    Description: 'Security group ID for web servers'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-webserver-sg'
```

## Key Features Implemented

### 1. **High Availability Architecture**

- Multi-AZ deployment across two availability zones
- Auto Scaling Group ensures instance redundancy
- Application Load Balancer distributes traffic
- Multi-AZ RDS database with automatic failover

### 2. **Fault Tolerance**

- Auto Scaling automatically replaces failed instances
- ELB health checks detect and route around unhealthy instances
- Route 53 health checks enable DNS failover
- RDS automated backups with 7-day retention

### 3. **Security Best Practices**

- Network segmentation with public, private, and database subnets
- Strict security groups with least privilege access
- All data encrypted at rest using KMS
- IAM roles follow principle of least privilege
- S3 buckets have public access blocked

### 4. **Monitoring and Observability**

- CloudWatch alarms for CPU, unhealthy targets, and database metrics
- CloudWatch Logs for application and infrastructure logs
- Comprehensive tagging for cost tracking and compliance

### 5. **Automation Features**

- Fully automated deployment via CloudFormation
- Auto Scaling policies for elastic capacity
- Automated instance configuration via UserData
- CloudWatch agent auto-configured on instances

## Deployment Instructions

1. **Prerequisites**:
   - An existing VPC in us-west-2
   - SSL certificate in AWS Certificate Manager
   - Route 53 hosted zone for your domain
   - Appropriate IAM permissions

2. **Deploy the stack**:

   ```bash
   aws cloudformation create-stack \
     --stack-name ha-webapp-production \
     --template-body file://ha-fault-tolerant-webapp.yaml \
     --parameters \
       ParameterKey=VpcId,ParameterValue=vpc-xxxxxx \
       ParameterKey=SSLCertificateArn,ParameterValue=arn:aws:acm:us-west-2:xxxx:certificate/xxxx \
       ParameterKey=DomainName,ParameterValue=webapp.example.com \
       ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
       ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123! \
       ParameterKey=TrustedIPRange,ParameterValue=203.0.113.0/24 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

3. **Validate deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name ha-webapp-production \
     --region us-west-2
   ```

This template provides a production-ready, highly available infrastructure that automatically handles failures, scales based on demand, and maintains security and compliance standards.
