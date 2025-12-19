### Reasoning Trace

---

This is a comprehensive request for a production-ready CloudFormation template. Let me break down the requirements:

1. **VPC and Networking:**
   - VPC with 2 public and 2 private subnets across multiple AZs
   - Internet Gateway for public subnets
   - NAT Gateways in public subnets for private subnet outbound connectivity
   - Appropriate route tables
   - 'prod-' naming convention

2. **Auto Scaling and Compute:**
   - Auto Scaling Group based on CPU utilization
   - EC2 instances with security groups
   - 'prod-' prefix for naming

3. **Load Balancing:**
   - Application Load Balancer
   - SSL certificate from ACM
   - Multi-AZ deployment
   - 'prod-' naming convention

4. **IAM Roles:**
   - Least privilege principle
   - EC2 instance roles
   - 'prod-' prefix

5. **Database:**
   - RDS db.t3.micro instance
   - Private subnet deployment
   - Security groups for EC2 access only
   - 'prod-' naming convention

6. **Storage:**
   - S3 bucket with logging enabled
   - Proper access controls
   - 'prod-' prefix

7. **Monitoring and Logging:**
   - CloudWatch monitoring
   - CloudWatch alarm for 5xx errors
   - Metrics and logging for critical components

8. **Template Features:**
   - YAML syntax
   - us-west-1 region
   - Parameters for flexibility
   - Outputs section
   - Valid CloudFormation template

Let me create a comprehensive CloudFormation template that addresses all these requirements.

### Answer

---

# AWS CloudFormation Template for Production Web Application

Below is a comprehensive CloudFormation template in YAML that meets all your requirements for a production-ready web application environment:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready web application infrastructure with VPC, Auto Scaling, ALB, RDS, and monitoring'

# ====================
# Parameters
# ====================
Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  DBUsername:
    Type: String
    Description: Database master username
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBPassword:
    Type: String
    Description: Database master password
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters

  CertificateArn:
    Type: String
    Description: ARN of SSL certificate from AWS Certificate Manager
    Default: ''

  InstanceType:
    Type: String
    Description: EC2 instance type for application servers
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

  MinSize:
    Type: Number
    Description: Minimum number of EC2 instances in Auto Scaling Group
    Default: 2
    MinValue: 1

  MaxSize:
    Type: Number
    Description: Maximum number of EC2 instances in Auto Scaling Group
    Default: 6
    MinValue: 2

  DesiredCapacity:
    Type: Number
    Description: Desired number of EC2 instances in Auto Scaling Group
    Default: 2
    MinValue: 1

# ====================
# Mappings
# ====================
Mappings:
  RegionMap:
    us-west-1:
      AMI: ami-0c02fb55731490381 # Amazon Linux 2 AMI

# ====================
# Conditions
# ====================
Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref CertificateArn, '']]

# ====================
# Resources
# ====================
Resources:
  # ====================
  # VPC and Networking
  # ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: prod-vpc

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: prod-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: prod-private-subnet-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: prod-private-subnet-2

  # NAT Gateways and EIPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-nat-eip-1

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-nat-eip-2

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: prod-nat-gateway-1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: prod-nat-gateway-2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: prod-public-route-table

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: prod-private-route-table-1

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: prod-private-route-table-2

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ====================
  # Security Groups
  # ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-alb-sg
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
          Value: prod-alb-sg

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-ec2-sg
      GroupDescription: Security group for EC2 instances
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
          CidrIp: 10.0.0.0/16 # SSH from within VPC only
      Tags:
        - Key: Name
          Value: prod-ec2-sg

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: prod-rds-sg
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: prod-rds-sg

  # ====================
  # IAM Roles
  # ====================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: prod-ec2-role
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
        - PolicyName: prod-s3-access-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !GetAtt S3Bucket.Arn
      Tags:
        - Key: Name
          Value: prod-ec2-role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: prod-ec2-instance-profile
      Roles:
        - !Ref EC2InstanceRole

  # ====================
  # S3 Storage
  # ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-storage-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LoggingBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Name
          Value: prod-storage-bucket

  S3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-logs-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: prod-logging-bucket

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: S3ServerAccessLogsPolicy
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub '${S3LoggingBucket.Arn}/*'

  # ====================
  # Load Balancer
  # ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: prod-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: prod-alb

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: prod-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: prod-target-group

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn

  # ====================
  # Auto Scaling
  # ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: prod-launch-template
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Production Web Server - Instance ID: $(ec2-metadata --instance-id | cut -d ' ' -f2)</h1>" > /var/www/html/index.html

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: prod-web-server

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - NATGateway1
      - NATGateway2
    Properties:
      AutoScalingGroupName: prod-asg
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: prod-asg-instance
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  # ====================
  # Database
  # ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: prod-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: prod-db-subnet-group

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: prod-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: prod-database

  # ====================
  # Monitoring and Alarms
  # ====================
  ALB5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-alb-5xx-errors
      AlarmDescription: Alarm when ALB experiences 5xx errors
      MetricName: HTTPCode_Target_5XX_Count
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
      AlarmActions:
        - !Ref SNSTopic

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-high-cpu-utilization
      AlarmDescription: Alarm when average CPU exceeds 80%
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

  UnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-unhealthy-hosts
      AlarmDescription: Alarm when we have unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: prod-database-cpu-high
      AlarmDescription: Alarm when database CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: prod-alerts
      DisplayName: Production Environment Alerts

# ====================
# Outputs
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  SNSTopicArn:
    Description: SNS Topic ARN for Alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'
```

## Template Features and Architecture

### Key Components Explained:

1. **Networking Architecture**:
   - Creates a VPC with CIDR `10.0.0.0/16`
   - Deploys 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`) for ALB and NAT Gateways
   - Deploys 2 private subnets (`10.0.10.0/24`, `10.0.11.0/24`) for EC2 instances and RDS
   - Each availability zone has its own NAT Gateway for high availability

2. **Security Groups**:
   - **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from the internet
   - **EC2 Security Group**: Only accepts traffic from ALB and SSH from within VPC
   - **RDS Security Group**: Only accepts MySQL connections from EC2 instances

3. **Auto Scaling Configuration**:
   - Uses target tracking scaling policy based on CPU utilization (70% threshold)
   - Health checks via ELB ensure unhealthy instances are replaced
   - Instances deployed across multiple AZs for fault tolerance

4. **Load Balancing**:
   - Application Load Balancer distributes traffic across healthy instances
   - Supports both HTTP and HTTPS (when certificate ARN is provided)
   - Health checks configured at target group level

5. **Database Setup**:
   - RDS MySQL instance in private subnets
   - Automated backups with 7-day retention
   - CloudWatch logs enabled for monitoring

6. **Storage**:
   - Main S3 bucket with versioning and encryption
   - Separate logging bucket with lifecycle policy (90-day retention)
   - Bucket policies enforce security best practices

7. **Monitoring**:
   - CloudWatch alarms for:
     - ALB 5xx errors (as requested)
     - High CPU utilization
     - Unhealthy hosts
     - Database CPU usage
   - All alarms publish to SNS topic for notifications

### Deployment Instructions:

1. **Prerequisites**:
   - Create an EC2 Key Pair in us-west-1 region
   - (Optional) Request/import SSL certificate in ACM

2. **Deploy the Stack**:

```bash
aws cloudformation create-stack \
  --stack-name production-web-app \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-keypair-name \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:... \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
```

3. **Stack Validation**:

```bash
aws cloudformation validate-template \
  --template-body file://template.yaml \
  --region us-west-1
```

### Security Best Practices Implemented:

- **Least Privilege IAM**: EC2 instances only have access to specific S3 bucket
- **Network Isolation**: Database and application servers in private subnets
- **Encryption**: S3 buckets and RDS database encrypted at rest
- **No Direct Internet Access**: Private resources use NAT Gateways for outbound connectivity
- **Security Groups**: Restrictive inbound rules based on source
- **Logging**: Comprehensive logging for S3, RDS, and CloudWatch

This template provides a solid foundation for a production web application with high availability, scalability, and security built-in. The modular design allows for easy customization through parameters while maintaining best practices.
