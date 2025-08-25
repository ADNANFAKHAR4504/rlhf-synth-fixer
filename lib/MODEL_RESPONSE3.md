You're absolutely right. Let me provide the complete CloudFormation template in a more manageable way. Here's the full, corrected template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready multi-region AWS infrastructure stack for company migration initiative. Supports us-east-1 and us-west-2 with high availability, security, and compliance features.'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Deployment environment'

  CompanyIPRange:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'Company IP range for restricted access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'RDS MySQL master username'
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'RDS MySQL master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues:
      ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge']
    Description: 'EC2 instance type for application servers'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for Route 53 hosted zone'

Mappings:
  RegionMap:
    us-east-1:
      AMI: 'ami-0abcdef1234567890'
      AZ1: 'us-east-1a'
      AZ2: 'us-east-1b'
      AZ3: 'us-east-1c'
    us-west-2:
      AMI: 'ami-0fedcba0987654321'
      AZ1: 'us-west-2a'
      AZ2: 'us-west-2b'
      AZ3: 'us-west-2c'

  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet1:
      CIDR: '10.0.100.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.200.0/24'

Conditions:
  IsProduction: !Equals [!Ref Environment, 'production']
  CreateMultiAZ: !Equals [!Ref Environment, 'production']

Resources:
  # KMS Key for Encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for infrastructure encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-kms-key'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-key'
      TargetKeyId: !Ref KMSKey

  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-1'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-2'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-routes-1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-routes-2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref CompanyIPRange
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref CompanyIPRange
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref CompanyIPRange
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-sg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
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
      Tags:
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-bucket'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: !If [IsProduction, 7, 3]
      MultiAZ: !If [CreateMultiAZ, true, false]
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-mysql'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template and Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        DisableApiTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::Region}</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-web-server'
              - Key: Project
                Value: 'Migration'
              - Key: Creator
                Value: 'CloudEngineer'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg'
          PropagateAtLaunch: false
        - Key: Project
          Value: 'Migration'
          PropagateAtLaunch: true
        - Key: Creator
          Value: 'CloudEngineer'
          PropagateAtLaunch: true

  # CloudWatch Log Groups
  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}/webserver'
      RetentionInDays: 14
      KmsKeyId: !GetAtt KMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${AWS::StackName}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${AWS::StackName}-cloudtrail'
      S3BucketName: !Ref S3Bucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudtrail'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-high-cpu'
      AlarmDescription: 'Alarm when CPU exceeds 80%'
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
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-low-cpu'
      AlarmDescription: 'Alarm when CPU is below 20%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # Route 53 Hosted Zone
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName}'
      HostedZoneTags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-hosted-zone'
        - Key: Project
          Value: 'Migration'
        - Key: Creator
          Value: 'CloudEngineer'

  # Route 53 Record Set
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

  # Systems Manager Parameters
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/database/endpoint'
      Type: String
      Value: !GetAtt RDSInstance.Endpoint.Address
      Description: 'RDS MySQL endpoint'
      Tags:
        Project: 'Migration'
        Creator: 'CloudEngineer'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: 'RDS MySQL Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  HostedZoneId:
    Description: 'Route 53 Hosted Zone ID'
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZone-ID'

  WebsiteURL:
    Description: 'Website URL'
    Value: !Sub 'http://www.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-Website-URL'
```

## Key Features Implemented:

### ✅ **Multi-Region Support**

- Template works in both us-east-1 and us-west-2
- Region-specific AMI mappings
- Availability zone mappings per region

### ✅ **Network Infrastructure**

- VPC with 10.0.0.0/16 CIDR
- Public, private, and database subnets across 2 AZs
- NAT Gateways for high availability
- Proper routing tables

### ✅ **Security**

- Restrictive security groups with company IP access only
- KMS encryption for all data at rest
- IAM roles with least privilege
- CloudTrail for audit logging

### ✅ **High Availability**

- Multi-AZ RDS deployment (production)
- Auto Scaling Group across multiple AZs
- Application Load Balancer with health checks
- Route 53 for DNS management

### ✅ **Monitoring & Logging**

- CloudWatch log groups with KMS encryption
- CloudWatch alarms for scaling
- CloudTrail for API monitoring
- Systems Manager Parameter Store

### ✅ **Compliance**

- Consistent tagging strategy
- Termination protection for EC2 instances
- Encrypted storage and backups
- Proper resource naming conventions

## Deployment Instructions:

1. **Update AMI IDs**: Replace the placeholder AMI IDs in the RegionMap with actual Amazon Linux 2 AMI IDs for your regions
2. **Create Key Pair**: Ensure you have an EC2 key pair created in your target region
3. **Deploy**: Use AWS CLI or Console to deploy:

```bash
aws cloudformation create-stack \
  --stack-name migration-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

This template provides a solid foundation for your production migration with all the security, monitoring, and high availability features you requested.
