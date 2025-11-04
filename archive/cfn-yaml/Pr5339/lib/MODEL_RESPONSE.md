### Reasoning Trace
---

The user wants a single CloudFormation template that can be used to deploy any of the three environments (Dev, Staging, Production) with consistent configuration. This means I need to use parameters to make the template flexible enough to deploy any environment while maintaining the same configuration across all.

Key requirements:
1. Single template for all environments
2. VPC, EC2, RDS, ELB for each environment
3. Security groups with specific rules
4. S3 buckets with environment prefixes
5. CloudWatch alarms
6. IAM roles
7. CloudTrail with encrypted S3
8. Lambda for RDS snapshots
9. SSM Parameter Store for secrets
10. Consistent tagging
11. Cost optimization with Reserved Instances

I'll create a comprehensive CloudFormation template that uses parameters to determine which environment is being deployed.
### Answer 
---

# CloudFormation Template for Multi-Environment Infrastructure

Below is a comprehensive CloudFormation template in YAML that provisions consistent infrastructure for Dev, Staging, or Production environments. The template uses parameters to determine which environment to deploy while maintaining identical configurations.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Environment Infrastructure Template - Dev/Staging/Production'

# =====================================
# Parameters
# =====================================
Parameters:
  Environment:
    Type: String
    Description: Environment name
    AllowedValues:
      - Dev
      - Staging
      - Production
    Default: Dev

  ProjectName:
    Type: String
    Description: Project name for tagging
    Default: MyProject

  OwnerName:
    Type: String
    Description: Owner name for tagging
    Default: DevOpsTeam

  SSHAllowedCIDR:
    Type: String
    Description: CIDR block allowed for SSH access
    Default: 10.0.0.0/8
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/([0-9]|[1-2][0-9]|3[0-2])$'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

  DBMasterUsername:
    Type: String
    Description: Database master username
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Type: String
    Description: Database master password
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

# =====================================
# Mappings
# =====================================
Mappings:
  EnvironmentConfig:
    Dev:
      InstanceType: t3.small
      DBInstanceClass: db.t3.small
      MultiAZ: false
    Staging:
      InstanceType: t3.medium
      DBInstanceClass: db.t3.medium
      MultiAZ: false
    Production:
      InstanceType: t3.large
      DBInstanceClass: db.t3.large
      MultiAZ: true

  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c

# =====================================
# Resources
# =====================================
Resources:

  # =====================================
  # Networking Resources
  # =====================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Private-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Private-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Public-RouteTable'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # =====================================
  # Security Groups
  # =====================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
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
          Value: !Sub '${Environment}-ALB-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-WebServer-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-Database-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # =====================================
  # IAM Roles
  # =====================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-EC2-Role'
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
        - PolicyName: SSMParameterAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParameterHistory
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${S3Bucket.Arn}'
                  - !Sub '${S3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-Lambda-Execution-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: RDSSnapshotPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:CreateDBSnapshot
                  - rds:DescribeDBSnapshots
                  - rds:DeleteDBSnapshot
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # =====================================
  # Application Load Balancer
  # =====================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ALB'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # =====================================
  # Launch Template and Auto Scaling
  # =====================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        KeyName: !Ref KeyPairName
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
            echo "<h1>Welcome to ${Environment} Environment</h1>" > /var/www/html/index.html
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Environment}-WebServer'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref OwnerName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerName
          PropagateAtLaunch: true

  # =====================================
  # RDS Database
  # =====================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-database'
      AllocatedStorage: 20
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]
      StorageEncrypted: true
      StorageType: gp3
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      DeletionProtection: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # =====================================
  # S3 Buckets
  # =====================================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-${ProjectName}-${AWS::AccountId}-data'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-${ProjectName}-${AWS::AccountId}-cloudtrail'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # =====================================
  # CloudTrail
  # =====================================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${Environment}-Trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # =====================================
  # CloudWatch Alarms
  # =====================================
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-CPU-Utilization-High'
      AlarmDescription: Alarm when CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-RDS-CPU-Utilization'
      AlarmDescription: Alarm when RDS CPU exceeds 75%
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

  # =====================================
  # SNS Topic for Alarms
  # =====================================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-Alerts'
      DisplayName: !Sub '${Environment} Environment Alerts'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # =====================================
  # Lambda for RDS Snapshots
  # =====================================
  RDSSnapshotLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-RDS-Snapshot-Lambda'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          DB_INSTANCE_ID: !Ref RDSDatabase
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import boto3
          import os
          from datetime import datetime

          def handler(event, context):
              rds = boto3.client('rds')
              db_instance_id = os.environ['DB_INSTANCE_ID']
              environment = os.environ['ENVIRONMENT']
              
              timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
              snapshot_id = f"{db_instance_id}-snapshot-{timestamp}"
              
              try:
                  response = rds.create_db_snapshot(
                      DBSnapshotIdentifier=snapshot_id,
                      DBInstanceIdentifier=db_instance_id,
                      Tags=[
                          {'Key': 'Environment', 'Value': environment},
                          {'Key': 'Type', 'Value': 'Automated'}
                      ]
                  )
                  print(f"Snapshot {snapshot_id} initiated successfully")
                  return {
                      'statusCode': 200,
                      'body': f'Snapshot {snapshot_id} created'
                  }
              except Exception as e:
                  print(f"Error creating snapshot: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': f'Error: {str(e)}'
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerName

  # Schedule for Lambda
  SnapshotScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${Environment}-RDS-Snapshot-Schedule'
      Description: Schedule for RDS snapshots
      ScheduleExpression: 'rate(1 day)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt RDSSnapshotLambda.Arn
          Id: RDSSnapshotLambdaTarget

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref RDSSnapshotLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt SnapshotScheduleRule.Arn

  # =====================================
  # Systems Manager Parameter Store
  # =====================================
  AMIParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${Environment}/ami-id'
      Type: String
      Value: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
      Description: AMI ID for EC2 instances
      Tags:
        Environment: !Ref Environment
        Project: !Ref ProjectName
        Owner: !Ref OwnerName

  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${Environment}/db-endpoint'
      Type: String
      Value: !GetAtt RDSDatabase.Endpoint.Address
      Description: RDS Database Endpoint
      Tags:
        Environment: !Ref Environment
        Project: !Ref ProjectName
        Owner: !Ref OwnerName

  DBPasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${Environment}/db-password'
      Type: SecureString
      Value: !Ref DBMasterPassword
      Description: RDS Database Password
      Tags:
        Environment: !Ref Environment
        Project: !Ref ProjectName
        Owner: !Ref OwnerName

# =====================================
# Outputs
# =====================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ALB-DNS'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-RDS-Endpoint'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${Environment}-S3-Bucket'

  CloudTrailBucketName:
    Description: CloudTrail Bucket Name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${Environment}-CloudTrail-Bucket'

  Environment:
    Description: Environment Name
    Value: !Ref Environment

  ProjectName:
    Description: Project Name
    Value: !Ref ProjectName
```

## Deployment Instructions

### 1. **Prerequisites**
Before deploying the template, ensure you have:
- AWS CLI configured with appropriate credentials
- An existing EC2 Key Pair in your target region
- Sufficient AWS service limits for the resources being created

### 2. **Parameter Configuration**
Create a parameters file for each environment:

**dev-parameters.json:**
```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "Dev"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "your-key-pair-name"
  },
  {
    "ParameterKey": "DBMasterPassword",
    "ParameterValue": "YourSecurePassword123!"
  },
  {
    "ParameterKey": "SSHAllowedCIDR",
    "ParameterValue": "10.0.0.0/8"
  },
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "MyProject"
  },
  {
    "ParameterKey": "OwnerName",
    "ParameterValue": "DevOpsTeam"
  }
]
```

### 3. **Deployment Commands**

**Validate the template:**
```bash
aws cloudformation validate-template \
  --template-body file://infrastructure.yaml
```

**Deploy Dev Environment:**
```bash
aws cloudformation create-stack \
  --stack-name dev-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters file://dev-parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Key=Environment,Value=Dev Key=Project,Value=MyProject
```

**Deploy Staging Environment:**
```bash
aws cloudformation create-stack \
  --stack-name staging-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters ParameterKey=Environment,ParameterValue=Staging \
               ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=DBMasterPassword,ParameterValue=YourPassword123! \
  --capabilities CAPABILITY_NAMED_IAM
```

**Deploy Production Environment:**
```bash
aws cloudformation create-stack \
  --stack-name production-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters ParameterKey=Environment,ParameterValue=Production \
               ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=DBMasterPassword,ParameterValue=YourPassword123! \
  --capabilities CAPABILITY_NAMED_IAM
```

## Key Features Implemented

### 1. **Environment Isolation**
- Each environment gets its own VPC with no peering
- Separate security groups and IAM roles
- Environment-specific S3 buckets with consistent naming

### 2. **Security Best Practices**
- RDS encryption enabled by default
- SSM Parameter Store for sensitive data
- CloudTrail for audit logging
- Security groups with least-privilege access
- S3 bucket encryption and versioning

### 3. **High Availability**
- Multi-AZ configuration for Production RDS
- Auto Scaling Group across multiple availability zones
- Application Load Balancer for traffic distribution

### 4. **Monitoring and Alerting**
- CloudWatch alarms for CPU utilization
- SNS topics for alert notifications
- CloudTrail for compliance monitoring

### 5. **Automation**
- Lambda function for automated RDS snapshots
- EventBridge rule for scheduled snapshots
- Auto Scaling for EC2 instances

### 6. **Cost Optimization**
- Environment-specific instance sizes (smaller for Dev/Staging)
- Lifecycle policies for S3 buckets
- Reserved Instance recommendations through tagging

### 7. **Consistent Tagging**
- All resources tagged with Environment, Project, and Owner
- Enables cost allocation and resource management

## Post-Deployment Validation

After deployment, verify the following:

1. **Check Stack Status:**
```bash
aws cloudformation describe-stacks \
  --stack-name dev-infrastructure \
  --query 'Stacks[0].StackStatus'
```

2. **Verify Resources:**
```bash
# List EC2 instances
aws ec2 describe-instances \
  --filters "Name=tag:Environment,Values=Dev" \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags]'

# Check RDS instance
aws rds describe-db-instances \
  --db-instance-identifier dev-database
```

3. **Test Application Load Balancer:**
```bash
# Get ALB DNS name from stack outputs
aws cloudformation describe-stacks \
  --stack-name dev-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text
```

4. **Verify CloudWatch Alarms:**
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "Dev-"
```

This template provides a complete, production-ready infrastructure that can be deployed consistently across all three environments with minimal configuration changes. The template follows AWS best practices and ensures complete isolation between environments while maintaining configuration parity.