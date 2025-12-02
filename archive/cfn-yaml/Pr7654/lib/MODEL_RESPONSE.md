# Multi-Environment Infrastructure - CloudFormation Implementation

This implementation provides a comprehensive CloudFormation template for deploying consistent infrastructure across dev, staging, and production environments using StackSets.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-Environment Infrastructure Stack with consistent configuration across dev, staging, and production

Parameters:
  EnvironmentType:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment type for deployment

  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to avoid conflicts
    MinLength: 1
    MaxLength: 20
    AllowedPattern: '[a-z0-9-]+'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

Mappings:
  EnvironmentConfig:
    dev:
      VpcCidr: 10.0.0.0/16
      PublicSubnet1Cidr: 10.0.1.0/24
      PublicSubnet2Cidr: 10.0.2.0/24
      PrivateSubnet1Cidr: 10.0.3.0/24
      PrivateSubnet2Cidr: 10.0.4.0/24
      InstanceType: t3.micro
      LambdaMemory: 128
      CPUAlarmThreshold: 80
      RDSBackupRetention: 0
      RDSMultiAZ: false
    staging:
      VpcCidr: 10.1.0.0/16
      PublicSubnet1Cidr: 10.1.1.0/24
      PublicSubnet2Cidr: 10.1.2.0/24
      PrivateSubnet1Cidr: 10.1.3.0/24
      PrivateSubnet2Cidr: 10.1.4.0/24
      InstanceType: t3.small
      LambdaMemory: 256
      CPUAlarmThreshold: 70
      RDSBackupRetention: 7
      RDSMultiAZ: false
    prod:
      VpcCidr: 10.2.0.0/16
      PublicSubnet1Cidr: 10.2.1.0/24
      PublicSubnet2Cidr: 10.2.2.0/24
      PrivateSubnet1Cidr: 10.2.3.0/24
      PrivateSubnet2Cidr: 10.2.4.0/24
      InstanceType: t3.medium
      LambdaMemory: 512
      CPUAlarmThreshold: 60
      RDSBackupRetention: 30
      RDSMultiAZ: true

Conditions:
  IsProd: !Equals [!Ref EnvironmentType, prod]
  IsStaging: !Equals [!Ref EnvironmentType, staging]
  EnableVersioning: !Or [!Condition IsProd, !Condition IsStaging]
  EnableMultiAZ: !Condition IsProd

Resources:
  # VPC Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub vpc-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub igw-${EnvironmentSuffix}
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
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub nat-eip-1-${EnvironmentSuffix}

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub nat-eip-2-${EnvironmentSuffix}

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub nat-gateway-1-${EnvironmentSuffix}

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub nat-gateway-2-${EnvironmentSuffix}

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub public-rt-${EnvironmentSuffix}
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub private-rt-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub private-rt-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
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
          Value: !Sub alb-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ec2-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub rds-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub lambda-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub alb-${EnvironmentSuffix}
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
          Value: !Sub alb-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub tg-${EnvironmentSuffix}
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub tg-${EnvironmentSuffix}
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

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ec2-role-${EnvironmentSuffix}
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
        - Key: Name
          Value: !Sub ec2-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ec2-profile-${EnvironmentSuffix}
      Roles:
        - !Ref EC2InstanceRole

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub lt-${EnvironmentSuffix}
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, InstanceType]
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
            echo "<h1>Hello from ${EnvironmentType} environment</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ec2-instance-${EnvironmentSuffix}
              - Key: Environment
                Value: !Ref EnvironmentType

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - PrivateRoute1
      - PrivateRoute2
    Properties:
      AutoScalingGroupName: !Sub asg-${EnvironmentSuffix}
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub asg-${EnvironmentSuffix}
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentType
          PropagateAtLaunch: true

  # Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, CPUAlarmThreshold]

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub db-subnet-group-${EnvironmentSuffix}
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub db-subnet-group-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # RDS MySQL Database
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub rds-mysql-${EnvironmentSuffix}
      Engine: mysql
      EngineVersion: 8.0.35
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      StorageType: gp2
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:ssm-secure:/database/${EnvironmentType}/password:1}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MultiAZ: !If [EnableMultiAZ, true, false]
      BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, RDSBackupRetention]
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      PubliclyAccessible: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub rds-mysql-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # S3 Buckets
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub fintech-${EnvironmentSuffix}-static-assets
      VersioningConfiguration:
        Status: !If [EnableVersioning, Enabled, Suspended]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub fintech-${EnvironmentSuffix}-static-assets
        - Key: Environment
          Value: !Ref EnvironmentType

  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub fintech-${EnvironmentSuffix}-app-data
      VersioningConfiguration:
        Status: !If [EnableVersioning, Enabled, Suspended]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub fintech-${EnvironmentSuffix}-app-data
        - Key: Environment
          Value: !Ref EnvironmentType

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub lambda-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaS3RDSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ApplicationDataBucket.Arn
                  - !Sub ${ApplicationDataBucket.Arn}/*
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*
      Tags:
        - Key: Name
          Value: !Sub lambda-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # Lambda Function
  DataProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub data-processor-${EnvironmentSuffix}
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, LambdaMemory]
      Timeout: 60
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentType
          BUCKET_NAME: !Ref ApplicationDataBucket
          DB_HOST: !GetAtt RDSDatabase.Endpoint.Address
      Code:
        ZipFile: |
          import json
          import os

          def lambda_handler(event, context):
              environment = os.environ.get('ENVIRONMENT', 'unknown')
              bucket = os.environ.get('BUCKET_NAME', 'unknown')

              print(f"Processing data in {environment} environment")
              print(f"Target bucket: {bucket}")

              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': f'Data processed successfully in {environment}',
                      'environment': environment
                  })
              }
      Tags:
        - Key: Name
          Value: !Sub data-processor-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # SNS Topic for Alarms
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub alarm-topic-${EnvironmentSuffix}
      DisplayName: !Sub CloudWatch Alarms for ${EnvironmentType}
      Tags:
        - Key: Name
          Value: !Sub alarm-topic-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentType

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub high-cpu-${EnvironmentSuffix}
      AlarmDescription: !Sub Alarm when CPU exceeds ${EnvironmentType} threshold
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, CPUAlarmThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref AlarmTopic

  RDSConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub rds-connections-${EnvironmentSuffix}
      AlarmDescription: Alarm when RDS connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref AlarmTopic

  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub rds-storage-${EnvironmentSuffix}
      AlarmDescription: Alarm when RDS storage is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2000000000
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref AlarmTopic

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub lambda-errors-${EnvironmentSuffix}
      AlarmDescription: Alarm when Lambda function has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessingFunction
      AlarmActions:
        - !Ref AlarmTopic

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPC-ID

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${AWS::StackName}-ALB-DNS

  RDSEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-RDS-Endpoint

  StaticAssetsBucketName:
    Description: Name of the static assets S3 bucket
    Value: !Ref StaticAssetsBucket
    Export:
      Name: !Sub ${AWS::StackName}-StaticAssets-Bucket

  ApplicationDataBucketName:
    Description: Name of the application data S3 bucket
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub ${AWS::StackName}-AppData-Bucket

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt DataProcessingFunction.Arn
    Export:
      Name: !Sub ${AWS::StackName}-Lambda-Arn

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${AWS::StackName}-ASG-Name

  AlarmTopicArn:
    Description: ARN of the SNS topic for alarms
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub ${AWS::StackName}-Alarm-Topic
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure Deployment

CloudFormation template for deploying consistent infrastructure across dev, staging, and production environments using StackSets.

## Architecture

This template deploys:
- VPC with public and private subnets across 2 availability zones
- Application Load Balancer with Auto Scaling Group
- RDS MySQL database with environment-specific configurations
- Lambda function for data processing
- S3 buckets for static assets and application data
- CloudWatch alarms with SNS notifications
- IAM roles with least privilege permissions

## Prerequisites

Before deploying this stack, you must create the database password in Systems Manager Parameter Store:

```bash
# For dev environment
aws ssm put-parameter \
  --name /database/dev/password \
  --value "YourDevPassword123!" \
  --type SecureString \
  --region us-east-1

# For staging environment
aws ssm put-parameter \
  --name /database/staging/password \
  --value "YourStagingPassword123!" \
  --type SecureString \
  --region us-east-1

# For prod environment
aws ssm put-parameter \
  --name /database/prod/password \
  --value "YourProdPassword123!" \
  --type SecureString \
  --region us-east-1
```

## Deployment with CloudFormation StackSets

### 1. Create StackSet

```bash
aws cloudformation create-stack-set \
  --stack-set-name multi-env-infrastructure \
  --template-body file://lib/TapStack.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=LatestAmiId,ParameterValue=/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 \
  --region us-east-1
```

### 2. Deploy to Dev Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 111111111111 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001
```

### 3. Deploy to Staging Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 222222222222 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging-001
```

### 4. Deploy to Production Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 333333333333 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001
```

## Single Account Deployment (Testing)

For testing in a single account with multiple stacks:

```bash
# Deploy dev environment
aws cloudformation create-stack \
  --stack-name multi-env-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy staging environment
aws cloudformation create-stack \
  --stack-name multi-env-staging \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy production environment
aws cloudformation create-stack \
  --stack-name multi-env-prod \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Environment-Specific Configurations

The template uses Mappings to configure environment-specific values:

| Configuration | Dev | Staging | Prod |
|--------------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Type | t3.micro | t3.small | t3.medium |
| Lambda Memory | 128MB | 256MB | 512MB |
| CPU Alarm Threshold | 80% | 70% | 60% |
| RDS Backup Retention | 0 days | 7 days | 30 days |
| RDS Multi-AZ | false | false | true |
| S3 Versioning | Disabled | Enabled | Enabled |

## Testing the Deployment

After deployment, test the infrastructure:

```bash
# Get the load balancer DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name multi-env-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1)

# Test the application
curl http://$ALB_DNS

# Invoke Lambda function
aws lambda invoke \
  --function-name data-processor-dev-001 \
  --region us-east-1 \
  response.json

cat response.json
```

## Cleanup

```bash
# Delete individual stack
aws cloudformation delete-stack \
  --stack-name multi-env-dev \
  --region us-east-1

# For StackSets
aws cloudformation delete-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 111111111111 \
  --regions us-east-1 \
  --no-retain-stacks

aws cloudformation delete-stack-set \
  --stack-set-name multi-env-infrastructure
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Example with environmentSuffix=dev-001:
- VPC: vpc-dev-001
- Load Balancer: alb-dev-001
- RDS Instance: rds-mysql-dev-001
- S3 Bucket: fintech-dev-001-static-assets
- Lambda Function: data-processor-dev-001

## Security Considerations

- Database passwords stored in Systems Manager Parameter Store (SecureString)
- All S3 buckets have encryption enabled
- Public access blocked on all S3 buckets
- Security groups follow least privilege principle
- IAM roles use managed policies where appropriate
- RDS is deployed in private subnets
- Lambda functions run in VPC with security groups

## Monitoring

CloudWatch alarms are configured for:
- High CPU utilization on Auto Scaling Group (environment-specific thresholds)
- High database connections on RDS
- Low storage space on RDS
- Lambda function errors

All alarms send notifications to the SNS topic created by the stack.
```

## Deployment Notes

1. The template uses CloudFormation intrinsic functions (Mappings, Conditions, Parameters) to maintain consistency while allowing environment-specific variations
2. All resources include the environmentSuffix parameter in their names to avoid conflicts
3. DeletionPolicy is set to Delete for RDS and S3 to ensure full cleanup
4. Systems Manager Parameter Store is used for database passwords (must be created before deployment)
5. The template is designed for StackSets deployment across multiple AWS accounts
6. NAT Gateways provide internet access for private subnets (EC2, RDS, Lambda)
7. Application Load Balancer routes traffic to Auto Scaling Group instances
8. Lambda function has VPC access to communicate with RDS
9. CloudWatch alarms have environment-specific thresholds
10. S3 versioning is enabled only for staging and production
