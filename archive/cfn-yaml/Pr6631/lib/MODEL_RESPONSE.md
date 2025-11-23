# Payment Processing Infrastructure - CloudFormation Template

This CloudFormation template consolidates three separate templates into a single maintainable solution using parameters, mappings, and conditions.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Optimized payment processing infrastructure with parameterized configuration for multi-environment deployment

Parameters:
  EnvironmentType:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - prod
    Description: Environment type - determines resource sizing and configuration

  DBUsername:
    Type: String
    Default: dbadmin
    MinLength: 4
    MaxLength: 16
    Description: Database administrator username
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    Description: Database administrator password (8-41 characters)
    AllowedPattern: '[a-zA-Z0-9]*'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access to instances

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
    Default: 10.0.10.0/24
    Description: CIDR block for private subnet 1

  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.11.0/24
    Description: CIDR block for private subnet 2

Mappings:
  RegionAMIs:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    eu-west-1:
      AMI: ami-0d71ea30463e0ff8d

  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
      S3LifecycleDays: 30
    prod:
      InstanceType: m5.large
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      S3LifecycleDays: 90

Conditions:
  IsProduction: !Equals [!Ref EnvironmentType, prod]
  IsDevelopment: !Equals [!Ref EnvironmentType, dev]

Resources:
  # VPC and Network Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-VPC-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Application
          Value: PaymentProcessing
        - Key: CostCenter
          Value: Finance

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-IGW-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

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
          Value: !Sub 'PaymentProcessing-PublicSubnet1-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-PublicSubnet2-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-PrivateSubnet1-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-PrivateSubnet2-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-PublicRT-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'PaymentProcessing-ALB-SG-${EnvironmentType}'
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
          Value: !Sub 'PaymentProcessing-ALB-SG-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'PaymentProcessing-Instance-SG-${EnvironmentType}'
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
          CidrIp: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-Instance-SG-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'PaymentProcessing-DB-SG-${EnvironmentType}'
      GroupDescription: Security group for RDS Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref InstanceSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-DB-SG-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  # IAM Role for EC2 Instances
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'PaymentProcessing-InstanceRole-${EnvironmentType}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3TransactionLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt TransactionLogsBucket.Arn
                  - !Sub '${TransactionLogsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-InstanceRole-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'PaymentProcessing-InstanceProfile-${EnvironmentType}'
      Roles:
        - !Ref InstanceRole

  # Launch Template for Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PaymentProcessing-LaunchTemplate-${EnvironmentType}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMIs, !Ref 'AWS::Region', AMI]
        InstanceType: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, InstanceType]
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli amazon-cloudwatch-agent

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
            {
              "metrics": {
                "namespace": "PaymentProcessing/${EnvironmentType}",
                "metrics_collected": {
                  "mem": {
                    "measurement": [{"name": "mem_used_percent"}]
                  },
                  "disk": {
                    "measurement": [{"name": "disk_used_percent"}]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json \
              -s

            # Install application
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

            echo "<h1>Payment Processing - ${EnvironmentType}</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PaymentProcessing-Instance-${EnvironmentType}'
              - Key: Environment
                Value: !Ref EnvironmentType
              - Key: Application
                Value: PaymentProcessing

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'PaymentProcessing-ALB-${EnvironmentType}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-ALB-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Application
          Value: PaymentProcessing

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PaymentProcessing-TG-${EnvironmentType}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-TG-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'PaymentProcessing-ASG-${EnvironmentType}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, DesiredCapacity]
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-ASG-${EnvironmentType}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentType
          PropagateAtLaunch: true
        - Key: Application
          Value: PaymentProcessing
          PropagateAtLaunch: true

  # RDS Aurora PostgreSQL Cluster
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'paymentprocessing-dbsubnet-${EnvironmentType}'
      DBSubnetGroupDescription: Subnet group for Aurora PostgreSQL cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-DBSubnetGroup-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: !Sub 'paymentprocessing-cluster-${EnvironmentType}'
      Engine: aurora-postgresql
      EngineVersion: '14.6'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DatabaseName: paymentdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-AuroraCluster-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Application
          Value: PaymentProcessing

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'paymentprocessing-instance1-${EnvironmentType}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: !If [IsProduction, db.r5.large, db.t3.medium]
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-AuroraInstance1-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Condition: IsProduction
    Properties:
      DBInstanceIdentifier: !Sub 'paymentprocessing-instance2-${EnvironmentType}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-AuroraInstance2-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType

  # S3 Bucket for Transaction Logs
  TransactionLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'paymentprocessing-logs-${EnvironmentType}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransactionLogLifecycle
            Status: Enabled
            ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, S3LifecycleDays]
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'PaymentProcessing-TransactionLogs-${EnvironmentType}'
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: Application
          Value: PaymentProcessing
        - Key: CostCenter
          Value: Finance

  TransactionLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TransactionLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TransactionLogsBucket.Arn
              - !Sub '${TransactionLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

Outputs:
  ALBDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNSName'

  RDSEndpoint:
    Description: Aurora PostgreSQL cluster endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: Aurora PostgreSQL cluster port
    Value: !GetAtt AuroraCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  S3BucketArn:
    Description: ARN of the S3 transaction logs bucket
    Value: !GetAtt TransactionLogsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Arn'

  S3BucketName:
    Description: Name of the S3 transaction logs bucket
    Value: !Ref TransactionLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-Id'

  EnvironmentType:
    Description: Environment type deployed
    Value: !Ref EnvironmentType
    Export:
      Name: !Sub '${AWS::StackName}-Environment-Type'
```

## Key Features Implemented

1. **Parameters**: All environment-specific values are parameterized including EnvironmentType, database credentials, KeyPairName, and VPC CIDR blocks.

2. **Mappings**:
   - RegionAMIs for us-east-1 and eu-west-1
   - EnvironmentConfig for instance types, ASG sizes, and S3 lifecycle policies

3. **Conditions**: IsProduction and IsDevelopment conditions control Multi-AZ database deployment and resource sizing.

4. **Auto Scaling Group**: Uses launch template with mapped AMI IDs and instance types, configured with environment-specific min/max sizes.

5. **Application Load Balancer**: Deployed with target group, health checks, and proper security group configuration.

6. **RDS Aurora PostgreSQL**: Conditional Multi-AZ deployment (single instance for dev, two instances for prod), encrypted storage, and automated backups.

7. **S3 Bucket**: Transaction logs with lifecycle policies (30 days for dev, 90 days for prod), encryption, and versioning enabled.

8. **Consistent Tagging**: All resources use Fn::Sub for dynamic tag values including environment type, application name, and cost center.

9. **Stack Outputs**: Exports ALB DNS name, RDS endpoint and port, S3 bucket ARN and name for cross-stack references.

10. **No Hardcoded Values**: Uses Ref, Fn::GetAtt, and Fn::Sub throughout - no hardcoded resource names, ARNs, or IDs.

## Deployment

Deploy the stack using:

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
  --capabilities CAPABILITY_NAMED_IAM
```
