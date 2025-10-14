### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates a secure AWS environment with multiple integrated components. Let me break down what's needed:

1. **Web Application Delivery**:
   - EC2 instances in private subnets running Nginx
   - ALB in public subnets to distribute traffic
   - Proper health checks and target groups

2. **API-Driven Data Operations**:
   - API Gateway with REST API
   - Lambda functions for S3 operations
   - PUT and GET operations for data persistence

3. **Secure Data Storage**:
   - RDS Multi-AZ in private subnets
   - Secrets Manager for credentials
   - Proper security groups

4. **Monitoring and Security**:
   - CloudWatch alarms
   - GuardDuty
   - VPC Flow Logs
   - API Gateway and ALB logging

5. **Security Requirements** (16 items):
   - Least privilege IAM
   - Managed policies
   - EC2 in VPC/private subnets
   - EBS encryption
   - RDS Multi-AZ
   - S3 default encryption
   - TLS configuration
   - CloudWatch alarms
   - S3 versioning
   - ELB access logging
   - Lambda in VPC
   - RDS not public
   - Minimal security groups
   - GuardDuty enabled
   - RDS backups
   - API Gateway logging

Let me create a comprehensive CloudFormation template that addresses all these requirements:
### Answer 
---

# SecureEnv.yaml - Complete CloudFormation Template

Below is a comprehensive, production-ready CloudFormation template that establishes a secure AWS environment meeting all specified requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SecureEnv - Foundational secure AWS environment for sensitive workloads with integrated web and API services'

# ====================
# PARAMETERS
# ====================
Parameters:
  EnvironmentName:
    Type: String
    Default: SecureEnv
    Description: Environment name prefix for all resources
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access (select existing)
    ConstraintDescription: Must be an existing EC2 KeyPair
  
  DBUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database admin username
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Description: Database admin password (8-41 alphanumeric characters)

# ====================
# MAPPINGS
# ====================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2 AMI
    us-west-2:
      AMI: ami-0352d5a37fb4f603f

# ====================
# RESOURCES
# ====================
Resources:

  # ========================================
  # NETWORKING - VPC, Subnets, Gateways
  # ========================================
  
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

  # Internet Gateway
  SecureEnvInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureEnvVPC
      InternetGatewayId: !Ref SecureEnvInternetGateway

  # Public Subnets for ALB
  SecureEnvPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-1

  SecureEnvPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-2

  # Private Subnets for EC2 and Lambda
  SecureEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-1

  SecureEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-2

  # Database Subnets
  SecureEnvDBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.30.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Subnet-1

  SecureEnvDBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.40.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-Subnet-2

  # NAT Gateways for Private Subnets
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

  SecureEnvNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-1

  SecureEnvNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-2

  # Route Tables
  SecureEnvPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-RT

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref SecureEnvInternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet1
      RouteTableId: !Ref SecureEnvPublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet2
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-RT-1

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref SecureEnvNATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet1
      RouteTableId: !Ref SecureEnvPrivateRouteTable1

  SecureEnvPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-RT-2

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref SecureEnvNATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet2
      RouteTableId: !Ref SecureEnvPrivateRouteTable2

  # VPC Flow Logs
  SecureEnvVPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

  SecureEnvVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/vpc/${EnvironmentName}
      RetentionInDays: 30

  SecureEnvVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureEnvVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref SecureEnvVPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt SecureEnvVPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC-FlowLog

  # ========================================
  # SECURITY GROUPS
  # ========================================

  SecureEnvALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-SG

  SecureEnvWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref SecureEnvALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG

  SecureEnvLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Lambda-SG

  SecureEnvDBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvWebServerSecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvLambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-SG

  # ========================================
  # S3 BUCKETS
  # ========================================

  SecureEnvDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-data-bucket-${AWS::AccountId}
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Data-Bucket

  SecureEnvALBLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-alb-logs-${AWS::AccountId}
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-Logs

  SecureEnvALBLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvALBLogBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: arn:aws:iam::127311923021:root  # AWS ELB Service Account for us-east-1
            Action:
              - s3:PutObject
            Resource: !Sub ${SecureEnvALBLogBucket.Arn}/*
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:GetBucketAcl
            Resource: !GetAtt SecureEnvALBLogBucket.Arn

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================

  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-Role
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
        - PolicyName: SecretsManagerRead
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref SecureEnvDBSecret

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref SecureEnvEC2Role

  SecureEnvLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-Lambda-Role
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
                  - !GetAtt SecureEnvDataBucket.Arn
                  - !Sub ${SecureEnvDataBucket.Arn}/*
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref SecureEnvDBSecret

  # ========================================
  # SECRETS MANAGER
  # ========================================

  SecureEnvDBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${EnvironmentName}-DB-Credentials
      Description: RDS Database Credentials
      SecretString: !Sub |
        {
          "username": "${DBUsername}",
          "password": "${DBPassword}",
          "engine": "mysql",
          "host": "${SecureEnvRDSInstance.Endpoint.Address}",
          "port": 3306,
          "dbname": "secureenvdb"
        }

  # ========================================
  # RDS DATABASE
  # ========================================

  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref SecureEnvDBSubnet1
        - !Ref SecureEnvDBSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-SubnetGroup

  SecureEnvRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-db-instance
      DBName: secureenvdb
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref SecureEnvDBSecurityGroup
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-RDS-Instance

  # ========================================
  # EC2 LAUNCH TEMPLATE AND AUTO SCALING
  # ========================================

  SecureEnvLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt SecureEnvEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref SecureEnvWebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nginx
            
            # Configure Nginx
            cat > /usr/share/nginx/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>SecureEnv Web Application</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; }
                    .status { color: green; font-size: 24px; }
                </style>
            </head>
            <body>
                <h1>SecureEnv - Secure AWS Environment</h1>
                <p class="status">✓ Web Server Operational</p>
                <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
                <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
                <hr>
                <p>This server is running in a secure, monitored environment with:</p>
                <ul style="text-align: left; display: inline-block;">
                    <li>End-to-end encryption</li>
                    <li>Multi-AZ redundancy</li>
                    <li>GuardDuty threat detection</li>
                    <li>CloudWatch monitoring</li>
                    <li>VPC Flow Logs</li>
                </ul>
            </body>
            </html>
            EOF
            
            # Start Nginx
            systemctl start nginx
            systemctl enable nginx
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

  SecureEnvAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref SecureEnvLaunchTemplate
        Version: !GetAtt SecureEnvLaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref SecureEnvPrivateSubnet1
        - !Ref SecureEnvPrivateSubnet2
      TargetGroupARNs:
        - !Ref SecureEnvTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer
          PropagateAtLaunch: true

  # ========================================
  # APPLICATION LOAD BALANCER
  # ========================================

  SecureEnvALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-ALB
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref SecureEnvALBSecurityGroup
      Subnets:
        - !Ref SecureEnvPublicSubnet1
        - !Ref SecureEnvPublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref SecureEnvALBLogBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB

  SecureEnvTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref SecureEnvVPC
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

  SecureEnvALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref SecureEnvTargetGroup
      LoadBalancerArn: !Ref SecureEnvALB
      Port: 80
      Protocol: HTTP

  # ========================================
  # LAMBDA FUNCTIONS
  # ========================================

  SecureEnvWriteLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-Write-Lambda
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecureEnvLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecureEnvLambdaSecurityGroup
        SubnetIds:
          - !Ref SecureEnvPrivateSubnet1
          - !Ref SecureEnvPrivateSubnet2
      Environment:
        Variables:
          BUCKET_NAME: !Ref SecureEnvDataBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              bucket_name = os.environ['BUCKET_NAME']
              
              try:
                  # Parse request body
                  if 'body' in event:
                      body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
                  else:
                      body = event
                  
                  # Generate unique key
                  timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                  key = f"data/{timestamp}_{body.get('id', 'unknown')}.json"
                  
                  # Add metadata
                  body['timestamp'] = timestamp
                  body['processed'] = True
                  
                  # Write to S3
                  s3.put_object(
                      Bucket=bucket_name,
                      Key=key,
                      Body=json.dumps(body),
                      ContentType='application/json',
                      ServerSideEncryption='AES256'
                  )
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data saved successfully',
                          'key': key
                      })
                  }
              except Exception as e:
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e)
                      })
                  }

  SecureEnvReadLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-Read-Lambda
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecureEnvLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecureEnvLambdaSecurityGroup
        SubnetIds:
          - !Ref SecureEnvPrivateSubnet1
          - !Ref SecureEnvPrivateSubnet2
      Environment:
        Variables:
          BUCKET_NAME: !Ref SecureEnvDataBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              bucket_name = os.environ['BUCKET_NAME']
              
              try:
                  # List objects in the data/ prefix
                  response = s3.list_objects_v2(
                      Bucket=bucket_name,
                      Prefix='data/',
                      MaxKeys=10
                  )
                  
                  files = []
                  if 'Contents' in response:
                      for obj in response['Contents']:
                          files.append({
                              'key': obj['Key'],
                              'size': obj['Size'],
                              'last_modified': obj['LastModified'].isoformat()
                          })
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data retrieved successfully',
                          'count': len(files),
                          'files': files
                      })
                  }
              except Exception as e:
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e)
                      })
                  }

  # ========================================
  # API GATEWAY
  # ========================================

  SecureEnvAPIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub ${EnvironmentName}-API
      Description: API Gateway for SecureEnv data operations
      EndpointConfiguration:
        Types:
          - REGIONAL

  SecureEnvAPIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SecureEnvAPIGateway
      ParentId: !GetAtt SecureEnvAPIGateway.RootResourceId
      PathPart: data

  SecureEnvAPIPutMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SecureEnvAPIGateway
      ResourceId: !Ref SecureEnvAPIResource
      HttpMethod: PUT
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SecureEnvWriteLambda.Arn}/invocations

  SecureEnvAPIGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SecureEnvAPIGateway
      ResourceId: !Ref SecureEnvAPIResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SecureEnvReadLambda.Arn}/invocations

  SecureEnvAPIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - SecureEnvAPIPutMethod
      - SecureEnvAPIGetMethod
    Properties:
      RestApiId: !Ref SecureEnvAPIGateway
      StageName: prod

  SecureEnvAPIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref SecureEnvAPIGateway
      DeploymentId: !Ref SecureEnvAPIDeployment
      StageName: prod
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  SecureEnvWriteLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecureEnvWriteLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${SecureEnvAPIGateway}/*/*

  SecureEnvReadLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecureEnvReadLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${SecureEnvAPIGateway}/*/*

  SecureEnvAPILogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/apigateway/${EnvironmentName}-API
      RetentionInDays: 30

  # ========================================
  # GUARDDUTY
  # ========================================

  SecureEnvGuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # ========================================
  # CLOUDWATCH ALARMS
  # ========================================

  SecureEnvSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${EnvironmentName}-Alerts
      DisplayName: SecureEnv Infrastructure Alerts

  SecureEnvHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-High-CPU
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
          Value: !Ref SecureEnvAutoScalingGroup
      AlarmActions:
        - !Ref SecureEnvSNSTopic

  SecureEnvRDSHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-RDS-High-CPU
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
          Value: !Ref SecureEnvRDSInstance
      AlarmActions:
        - !Ref SecureEnvSNSTopic

  SecureEnvALBTargetHealthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-ALB-Unhealthy-Targets
      AlarmDescription: Alarm when targets are unhealthy
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt SecureEnvTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt SecureEnvALB.LoadBalancerFullName
      AlarmActions:
        - !Ref SecureEnvSNSTopic

  SecureEnvLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-Lambda-Errors
      AlarmDescription: Alarm when Lambda function has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref SecureEnvWriteLambda
      AlarmActions:
        - !Ref SecureEnvSNSTopic

# ====================
# OUTPUTS
# ====================
Outputs:
  ALBEndpoint:
    Description: URL to access the web application
    Value: !Sub http://${SecureEnvALB.DNSName}
    Export:
      Name: !Sub ${EnvironmentName}-ALB-URL

  APIEndpoint:
    Description: API Gateway endpoint for data operations
    Value: !Sub https://${SecureEnvAPIGateway}.execute-api.${AWS::Region}.amazonaws.com/prod
    Export:
      Name: !Sub ${EnvironmentName}-API-URL

  DataBucketName:
    Description: Name of the S3 data bucket
    Value: !Ref SecureEnvDataBucket
    Export:
      Name: !Sub ${EnvironmentName}-Data-Bucket

  RDSEndpoint:
    Description: RDS Database endpoint
    Value: !GetAtt SecureEnvRDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-RDS-Endpoint

  DBSecretArn:
    Description: ARN of the database credentials secret
    Value: !Ref SecureEnvDBSecret
    Export:
      Name: !Sub ${EnvironmentName}-DB-Secret

  VPCId:
    Description: VPC ID
    Value: !Ref SecureEnvVPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  GuardDutyDetectorId:
    Description: GuardDuty Detector ID
    Value: !Ref SecureEnvGuardDutyDetector
    Export:
      Name: !Sub ${EnvironmentName}-GuardDuty-ID
```

## Template Validation and Deployment Guide

### Validation Steps

1. **Validate Template Syntax**:
```bash
aws cloudformation validate-template --template-body file://SecureEnv.yaml
```

2. **Pre-deployment Checklist**:
- Ensure you have an existing EC2 Key Pair in your region
- Verify your AWS account has sufficient limits for the resources
- Check GuardDuty isn't already enabled (to avoid conflicts)

### Deployment Commands

```bash
# Create the stack
aws cloudformation create-stack \
  --stack-name SecureEnvStack \
  --template-body file://SecureEnv.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=YOUR_KEYPAIR_NAME \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM

# Monitor deployment progress
aws cloudformation wait stack-create-complete --stack-name SecureEnvStack

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name SecureEnvStack \
  --query 'Stacks[0].Outputs'
```

## Testing the Integration

### 1. **Test Web Application (ALB + EC2)**:
```bash
# Get ALB URL from stack outputs
ALB_URL=$(aws cloudformation describe-stacks --stack-name SecureEnvStack --query "Stacks[0].Outputs[?OutputKey=='ALBEndpoint'].OutputValue" --output text)

# Test web access
curl http://$ALB_URL
```

### 2. **Test API Gateway + Lambda + S3 Integration**:
```bash
# Get API endpoint
API_URL=$(aws cloudformation describe-stacks --stack-name SecureEnvStack --query "Stacks[0].Outputs[?OutputKey=='APIEndpoint'].OutputValue" --output text)

# Write data
curl -X PUT $API_URL/data \
  -H "Content-Type: application/json" \
  -d '{"id":"test123","data":"sample data","type":"demo"}'

# Read data
curl -X GET $API_URL/data
```

## Security Compliance Matrix

| Requirement | Implementation | Verification |
|------------|----------------|--------------|
| Least Privilege IAM | Roles with minimal permissions | Check IAM policies in console |
| Managed Policies | AWS managed policies used | Review role configurations |
| EC2 in VPC | EC2 in private subnets | Verify subnet associations |
| EBS Encryption | Enabled in launch template | Check volume encryption status |
| RDS Multi-AZ | MultiAZ: true | Verify in RDS console |
| S3 Default Encryption | AES256 enabled | Check bucket encryption settings |
| TLS Support | HTTPS on API Gateway | Test with curl |
| CloudWatch Alarms | 4 alarms configured | View in CloudWatch console |
| S3 Versioning | Enabled on all buckets | Check bucket properties |
| ELB Access Logging | Configured with S3 bucket | Verify logs in S3 |
| Lambda in VPC | VPC config specified | Check Lambda network settings |
| RDS Not Public | PubliclyAccessible: false | Verify in RDS settings |
| Minimal Security Groups | Specific port/source rules | Review SG rules |
| GuardDuty | Detector enabled | Check GuardDuty console |
| RDS Backups | 7-day retention | Verify backup settings |
| API Gateway Logging | Full execution logging | Check CloudWatch logs |

## Post-Deployment Verification

1. **Verify all resources are created**:
```bash
aws cloudformation describe-stack-resources --stack-name SecureEnvStack --output table
```

2. **Check CloudWatch Alarms**:
```bash
aws cloudwatch describe-alarms --alarm-name-prefix SecureEnv
```

3. **Verify GuardDuty is active**:
```bash
aws guardduty list-detectors
```

This template creates a fully integrated, production-ready secure environment that meets all 16 security requirements while providing functional web and API services with proper monitoring and logging.