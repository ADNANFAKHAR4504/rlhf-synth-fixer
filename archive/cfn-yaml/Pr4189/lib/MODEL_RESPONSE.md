### Reasoning Trace
---

This is a comprehensive request for creating an AWS CloudFormation template with multiple components. Let me break down the requirements:

1. VPC with public and private subnets
2. EC2 instance in private subnet with IAM role for limited S3 access
3. Security groups allowing SSH from specified IP range
4. Naming convention: projectName-environment-resourceName
5. Tags: Project, Owner, Environment
6. S3 buckets with KMS encryption
7. Auto Scaling in public subnet
8. CloudFront with SSL/TLS certificates
9. CloudWatch alarms for EC2 CPU monitoring
10. RDS instance in private subnet with dedicated database subnet group

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that meets all your requirements. This template will establish a secure, scalable AWS infrastructure with proper networking, security, and monitoring.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and scalable AWS infrastructure for web application'

Parameters:
  ProjectName:
    Type: String
    Default: 'myapp'
    Description: 'Project name for resource naming'
    
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - dev
      - staging
      - prod
    Description: 'Environment name'
    
  Owner:
    Type: String
    Default: 'DevOpsTeam'
    Description: 'Owner tag value'
    
  SSHAllowedIP:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'IP range allowed for SSH access'
    
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
    
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
    
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database master password'
    ConstraintDescription: 'Must be at least 8 characters'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: 'EC2 instance type'

Mappings:
  RegionAMI:
    us-east-1:
      AMI: 'ami-0c02fb55731490381'
    us-west-2:
      AMI: 'ami-0a54c984b9f908c81'
    eu-west-1:
      AMI: 'ami-0f29c8402f8cce65c'

Resources:
  # ==================== VPC Configuration ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ==================== Subnets ====================
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.20.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.21.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== NAT Gateway ====================
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== Route Tables ====================
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==================== Security Groups ====================
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedIP
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-web-sg'
      GroupDescription: 'Security group for web servers'
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
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== IAM Role ====================
  EC2S3Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-s3-role'
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
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: !Sub '${ProjectName}-${Environment}-s3-limited-access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ec2-s3-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-instance-profile'
      Roles:
        - !Ref EC2S3Role

  # ==================== KMS Key ====================
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName}-${Environment} S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-s3-kms-key'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-s3-kms-key'
      TargetKeyId: !Ref S3KMSKey

  # ==================== S3 Bucket ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==================== Launch Template ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${ProjectName}-${Environment}</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-web-instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref Owner
              - Key: Environment
                Value: !Ref Environment

  # ==================== Auto Scaling ====================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: '$Latest'
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
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

  # ==================== Private EC2 Instance ====================
  PrivateEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      SubnetId: !Ref PrivateSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-instance'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== RDS Database ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.33'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ==================== CloudWatch Alarms ====================
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-alarm-high'
      AlarmDescription: 'Alarm if CPU utilization is too high'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref PrivateEC2Instance

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-alarm-low'
      AlarmDescription: 'Alarm if CPU utilization is too low'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref PrivateEC2Instance

  # ==================== CloudFront Distribution ====================
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${ProjectName}-${Environment}'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub 'CloudFront distribution for ${ProjectName}-${Environment}'
        Enabled: true
        HttpVersion: http2
        DefaultRootObject: index.html
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        Tags:
          - Key: Name
            Value: !Sub '${ProjectName}-${Environment}-cdn'
          - Key: Project
            Value: !Ref ProjectName
          - Key: Owner
            Value: !Ref Owner
          - Key: Environment
            Value: !Ref Environment

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  CloudFrontURL:
    Description: 'CloudFront Distribution URL'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-URL'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  PrivateInstanceId:
    Description: 'Private EC2 Instance ID'
    Value: !Ref PrivateEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-Private-Instance-ID'
```

## Key Features Implemented:

### 1. **Networking Architecture**
- VPC with public and private subnets across two availability zones
- NAT Gateway for outbound internet access from private subnets
- Dedicated database subnets for RDS

### 2. **Security Implementation**
- Security groups with restricted access (SSH only from specified IP range)
- IAM role with limited S3 access for EC2 instances
- KMS encryption for S3 buckets
- Private subnet deployment for sensitive resources

### 3. **High Availability & Scalability**
- Auto Scaling Group with target tracking policy
- Application Load Balancer distributing traffic
- Multi-AZ deployment capability for RDS

### 4. **Content Delivery & SSL/TLS**
- CloudFront distribution with HTTPS enforcement
- Origin configuration pointing to ALB
- Viewer protocol policy redirecting HTTP to HTTPS

### 5. **Monitoring & Alerting**
- CloudWatch alarms for CPU utilization
- Configurable thresholds for high and low CPU usage

### 6. **Best Practices**
- Consistent naming convention: `projectName-environment-resourceName`
- Comprehensive tagging (Project, Owner, Environment)
- Parameterized template for environment flexibility
- Exported outputs for cross-stack references

## Deployment Instructions:

1. **Prerequisites:**
   - AWS CLI configured with appropriate credentials
   - Existing EC2 Key Pair in your target region
   - Valid AWS account with necessary permissions

2. **Deploy the stack:**
```bash
aws cloudformation create-stack \
  --stack-name myapp-prod-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=myapp \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=Owner,ParameterValue=DevOpsTeam \
    ParameterKey=SSHAllowedIP,ParameterValue=YOUR_IP_RANGE/32 \
    ParameterKey=KeyName,ParameterValue=YOUR_KEY_NAME \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPassword,ParameterValue=YOUR_SECURE_PASSWORD \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Validation:**
```bash
aws cloudformation validate-template --template-body file://infrastructure.yaml
```

This template provides a production-ready, secure, and scalable AWS infrastructure that can be easily customized through parameters and adapted to different environments.