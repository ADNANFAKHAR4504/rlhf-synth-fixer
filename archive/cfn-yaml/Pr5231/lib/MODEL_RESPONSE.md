### Reasoning Trace
---

This is a comprehensive request for a production-grade CloudFormation template. Let me break down what needs to be included:

1. **Networking**:
   - VPC with 2 AZs
   - 2 public and 2 private subnets
   - Internet Gateway
   - NAT Gateway with Elastic IP
   - Route tables

2. **Compute Layer**:
   - Dynamic Key Pair creation (AWS::EC2::KeyPair)
   - Store private key in Secrets Manager
   - Fetch latest Amazon Linux 2 AMI from SSM
   - Launch Template with UserData
   - Auto Scaling Group (2-5 instances)
   - Application Load Balancer
   - Security Groups

3. **Database Layer**:
   - RDS instance (MySQL/PostgreSQL)
   - Multi-AZ, encrypted
   - DB Subnet Group

4. **Monitoring & Logging**:
   - S3 bucket for logs
   - CloudWatch monitoring
   - CloudTrail

5. **IAM & Security**:
   - EC2 IAM Role with least privilege
   - Instance Profile

6. **Parameters** for all configurable values

7. **Outputs** for key resources

Key considerations:
- No hardcoded values
- Cross-region/cross-account compatible
- Use intrinsic functions
- Follow AWS best practices
- Dynamic naming with Environment parameter

Let me create this comprehensive template:
### Answer 
---

# CloudFormation Template: web-application-infra.yaml

Here's a production-grade CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-AZ web application infrastructure with auto-scaling, RDS, and monitoring'

Parameters:
  Environment:
    Type: String
    Default: 'Dev'
    Description: 'Environment name (Dev, Staging, Prod)'
    AllowedValues:
      - Dev
      - Staging
      - Prod

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

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
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for private subnet 2'

  AdminSshCidr:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block for SSH access (recommend restricting this)'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  DbEngine:
    Type: String
    Default: 'mysql'
    Description: 'Database engine'
    AllowedValues:
      - mysql
      - postgres

  DbName:
    Type: String
    Default: 'webapp'
    Description: 'Database name'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DbUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    NoEcho: true

  DbPassword:
    Type: String
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    NoEcho: true

  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 1

  MaxSize:
    Type: Number
    Default: 5
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 1

  DesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of instances in Auto Scaling Group'
    MinValue: 1

  DbInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

Mappings:
  DbEngineMapping:
    mysql:
      Engine: 'mysql'
      Port: 3306
      Family: 'mysql8.0'
    postgres:
      Engine: 'postgres'
      Port: 5432
      Family: 'postgres15'

Resources:
  # Networking Resources
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-Subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-Subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Private-Subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Private-Subnet-2'

  NatEip:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-NAT-EIP'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-NAT-Gateway'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-RT'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Private-RT'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

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

  # Security Groups
  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP from Internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ALB-SG'

  Ec2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref AlbSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminSshCidr
          Description: 'Allow SSH from admin CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-EC2-SG'

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !FindInMap [DbEngineMapping, !Ref DbEngine, Port]
          ToPort: !FindInMap [DbEngineMapping, !Ref DbEngine, Port]
          SourceSecurityGroupId: !Ref Ec2SecurityGroup
          Description: 'Allow database access from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-RDS-SG'

  # IAM Resources
  Ec2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-EC2-Role'
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
        - PolicyName: !Sub '${Environment}-EC2-Policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${LogBucket.Arn}'
                  - !Sub '${LogBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': !Sub '${Environment}-WebApp'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-EC2-Role'

  Ec2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-EC2-Profile'
      Roles:
        - !Ref Ec2Role

  # Key Pair and Secret
  KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub '${Environment}-KeyPair'
      KeyType: rsa
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-KeyPair'

  KeyPairSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}-KeyPair-PrivateKey'
      Description: 'Private key for EC2 instances'
      SecretString: !GetAtt KeyPair.KeyMaterial
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-KeyPair-Secret'

  # S3 Bucket for Logs
  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-LogBucket'

  LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowELBLogDelivery
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 's3:PutObject'
            Resource: !Sub '${LogBucket.Arn}/alb-logs/*'
          - Sid: AllowCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt LogBucket.Arn
          - Sid: AllowCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogBucket.Arn}/cloudtrail/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LogBucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-Trail'
      S3BucketName: !Ref LogBucket
      S3KeyPrefix: 'cloudtrail'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Trail'

  # Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref AlbSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LogBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ALB'

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref Vpc
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-TG'

  AlbListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPair
        IamInstanceProfile:
          Arn: !GetAtt Ec2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref Ec2SecurityGroup
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd aws-cfn-bootstrap amazon-cloudwatch-agent
            
            # Configure web server
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment} Environment</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "metrics": {
                "namespace": "${Environment}-WebApp",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": false
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
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json
            
            # Send signal back to CloudFormation
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
      TagSpecifications:
        - ResourceType: launch-template
          Tags:
            - Key: Name
              Value: !Sub '${Environment}-LaunchTemplate'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - PrivateRoute
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-ASG'
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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: !Ref DesiredCapacity
        Timeout: PT10M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT10M
        WaitOnResourceSignals: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 60

  # Database Resources
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-DB-SubnetGroup'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-DB-SubnetGroup'

  DbParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${Environment}-DB-ParameterGroup'
      Description: 'Parameter group for RDS database'
      Family: !FindInMap [DbEngineMapping, !Ref DbEngine, Family]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-DB-ParameterGroup'

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-Database'
      DBName: !Ref DbName
      Engine: !FindInMap [DbEngineMapping, !Ref DbEngine, Engine]
      MasterUsername: !Ref DbUsername
      MasterUserPassword: !Ref DbPassword
      DBInstanceClass: !Ref DbInstanceClass
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DbSubnetGroup
      VPCSecurityGroups:
        - !Ref DbSecurityGroup
      DBParameterGroupName: !Ref DbParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RdsEnhancedMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Database'

  RdsEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-RDS-EnhancedMonitoring'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-RDS-EnhancedMonitoringRole'

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref Vpc
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  AlbDnsName:
    Description: 'Application Load Balancer DNS name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ALB-DNS'

  AlbUrl:
    Description: 'Application URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  KeyPairName:
    Description: 'EC2 Key Pair name'
    Value: !Ref KeyPair
    Export:
      Name: !Sub '${Environment}-KeyPair-Name'

  KeyPairSecretArn:
    Description: 'ARN of the secret containing the private key'
    Value: !Ref KeyPairSecret
    Export:
      Name: !Sub '${Environment}-KeyPair-SecretArn'

  RdsEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-RDS-Endpoint'

  RdsPort:
    Description: 'RDS database port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${Environment}-RDS-Port'

  LogBucketName:
    Description: 'S3 bucket for logs'
    Value: !Ref LogBucket
    Export:
      Name: !Sub '${Environment}-LogBucket'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${Environment}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${Environment}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${Environment}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${Environment}-PrivateSubnet2-ID'
```

## Key Features of This Template:

### 1. **Fully Automated & Cross-Region Compatible**
- Uses SSM parameter store to fetch the latest Amazon Linux 2 AMI dynamically
- No hardcoded region-specific values
- Automatically generates EC2 key pair and stores private key in Secrets Manager

### 2. **High Availability & Scalability**
- Multi-AZ deployment across two availability zones
- Auto Scaling Group with CPU-based scaling policy
- Application Load Balancer for traffic distribution
- Multi-AZ RDS database for data persistence

### 3. **Security Best Practices**
- Network isolation with public/private subnets
- NAT Gateway for secure outbound internet access from private subnets
- Security groups with least-privilege access
- Database encryption at rest
- IAM roles with minimal required permissions
- CloudTrail for audit logging

### 4. **Monitoring & Logging**
- CloudWatch detailed monitoring for EC2 instances
- Application Load Balancer access logs to S3
- CloudTrail audit logs
- RDS enhanced monitoring
- CloudWatch agent configuration for system metrics

### 5. **Parameterization**
- All environment-specific values are parameterized
- Dynamic resource naming using Environment parameter
- Configurable instance types, database settings, and scaling parameters

### 6. **Production-Ready Features**
- Lifecycle policies for log retention
- Database backup configuration
- Rolling update policy for Auto Scaling Group
- CloudFormation signal for deployment validation
- Proper deletion policies for stateful resources

## Deployment Instructions:

1. Save the template as `web-application-infra.yaml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name my-webapp-stack \
  --template-body file://web-application-infra.yaml \
  --parameters ParameterKey=DbPassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM
```

3. Monitor the stack creation:
```bash
aws cloudformation describe-stacks --stack-name my-webapp-stack --query 'Stacks[0].StackStatus'
```

4. Access the application:
```bash
aws cloudformation describe-stacks --stack-name my-webapp-stack --query 'Stacks[0].Outputs[?OutputKey==`AlbUrl`].OutputValue' --output text
```

This template follows AWS Well-Architected Framework principles and can be deployed in any AWS account and region without modification.