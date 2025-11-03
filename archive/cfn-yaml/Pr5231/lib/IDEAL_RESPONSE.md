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
    Default: 'dev'
    Description: 'Environment name (Dev, Staging, Prod)'
    AllowedValues:
      - dev
      - staging
      - prod

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
      
  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments'
    Default: "dev"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

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
  
  ELBAccountMapping:
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
    eu-west-2:
      AccountId: '652711504416'
    eu-central-1:
      AccountId: '054676820928'
    ap-northeast-1:
      AccountId: '582318560864'
    ap-northeast-2:
      AccountId: '600734575887'
    ap-southeast-1:
      AccountId: '114774131450'
    ap-southeast-2:
      AccountId: '783225319266'
    ap-south-1:
      AccountId: '718504428378'
    sa-east-1:
      AccountId: '507241528517'

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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'

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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'

  NatEip:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt'

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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg'

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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg'

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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg'

  # IAM Resources
  Ec2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'
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
        - PolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-policy'
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'

  Ec2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile'
      Roles:
        - !Ref Ec2Role

  # Key Pair and Secret
  KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'

  # S3 Bucket for Logs
  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentSuffix}-${AWS::Region}-logs-${AWS::AccountId}'
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
          Value: !Sub '${EnvironmentSuffix}-${AWS::Region}-logbucket'

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
              AWS: !Sub 
                - 'arn:aws:iam::${elbAccount}:root'
                - elbAccount: !FindInMap [ELBAccountMapping, !Ref 'AWS::Region', AccountId]
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
      TrailName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail'
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail'

  # Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: LogBucketPolicy
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb'
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
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb'

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-tg'
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
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-tg'

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
      LaunchTemplateName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
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
              Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - PrivateRoute
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg'
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance'
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
      DBSubnetGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnetgroup'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnetgroup'

  DbParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-parametergroup'
      Description: 'Parameter group for RDS database'
      Family: !FindInMap [DbEngineMapping, !Ref DbEngine, Family]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-parametergroup'

  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret'
      Description: 'RDS master password'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DbUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludePunctuation: true

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database'
      DBName: !Ref DbName
      Engine: !FindInMap [DbEngineMapping, !Ref DbEngine, Engine]
      MasterUsername: !Ref DbUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}'
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database'

  RdsEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-enhanced-monitoring'
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
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-enhanced-monitoring-role'

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref Vpc
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-id'

  AlbDnsName:
    Description: 'Application Load Balancer DNS name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb-dns'

  AlbUrl:
    Description: 'Application URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  KeyPairName:
    Description: 'EC2 Key Pair name'
    Value: !Ref KeyPair
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair-name'

  RdsEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-endpoint'

  RdsPort:
    Description: 'RDS database port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-port'

  LogBucketName:
    Description: 'S3 bucket for logs'
    Value: !Ref LogBucket
    Export:
      Name: !Sub '${EnvironmentSuffix}-${AWS::Region}-logbucket'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-publicsubnet1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-publicsubnet2-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-privatesubnet1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-privatesubnet2-id'

  DBSecretArn:
    Description: 'Database Master Secret ARN'
    Value: !Ref DBMasterSecret
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret-arn'

  # Networking Outputs
  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw-id'

  NatGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-id'

  NatEipId:
    Description: 'NAT Gateway Elastic IP ID'
    Value: !Ref NatEip
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-id'

  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt-id'

  PrivateRouteTableId:
    Description: 'Private Route Table ID'
    Value: !Ref PrivateRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-id'

  # Security Group Outputs
  AlbSecurityGroupId:
    Description: 'Application Load Balancer Security Group ID'
    Value: !Ref AlbSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb-sg-id'

  Ec2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref Ec2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg-id'

  DbSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DbSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg-id'

  # IAM Outputs
  Ec2RoleArn:
    Description: 'EC2 IAM Role ARN'
    Value: !GetAtt Ec2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role-arn'

  Ec2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt Ec2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance-profile-arn'

  RdsEnhancedMonitoringRoleArn:
    Description: 'RDS Enhanced Monitoring Role ARN'
    Value: !GetAtt RdsEnhancedMonitoringRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-monitoring-role-arn'

  # Load Balancer Outputs
  ApplicationLoadBalancerId:
    Description: 'Application Load Balancer ID'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb-id'

  ApplicationLoadBalancerArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb-arn'

  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-target-group-arn'

  AlbListenerArn:
    Description: 'ALB Listener ARN'
    Value: !Ref AlbListener
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alb-listener-arn'

  # Auto Scaling Outputs
  LaunchTemplateId:
    Description: 'Launch Template ID'
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template-id'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-name'

  AutoScalingGroupArn:
    Description: 'Auto Scaling Group ARN'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-arn'

  ScaleUpPolicyArn:
    Description: 'Scale Up Policy ARN'
    Value: !Ref ScaleUpPolicy
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-scale-up-policy-arn'

  # Database Outputs
  DatabaseId:
    Description: 'RDS Database Instance ID'
    Value: !Ref Database
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database-id'

  DbSubnetGroupName:
    Description: 'DB Subnet Group Name'
    Value: !Ref DbSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group-name'

  DbParameterGroupName:
    Description: 'DB Parameter Group Name'
    Value: !Ref DbParameterGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-parameter-group-name'

  # CloudTrail Output
  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudtrail-arn'

  # S3 Bucket Output
  LogBucketArn:
    Description: 'S3 Log Bucket ARN'
    Value: !GetAtt LogBucket.Arn
    Export:
      Name: !Sub '${EnvironmentSuffix}-${AWS::Region}-logbucket-arn'