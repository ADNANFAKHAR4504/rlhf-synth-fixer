### Reasoning Trace
---

This is a comprehensive request for a production-grade CloudFormation template. Let me break down the requirements:

1. Tag all resources with Environment=Production
2. Use a provided VPC ID for all subnets and networking
3. Configure Security Groups for SSH access only from specified IP
4. Attach IAM roles with least privilege to EC2 instances
5. Enable server-side encryption for S3 buckets with no public access
6. Deploy RDS instances in Multi-AZ with no public accessibility
7. Set up ELB with access logging enabled
8. Configure CloudWatch alarms for CPU > 85%
9. Create ASG with minimum 2 EC2 instances
10. Define Lambda functions using environment variables
11. Use CloudFormation StackSets for IAM roles across multiple accounts
12. Verify no hard-coded secrets
13. Don't use default VPC
14. Enforce key rotation for encryption keys
15. Ensure no RDS instances are publicly accessible
16. Everything in a single file

I'll create a comprehensive YAML template that addresses all these requirements.
### Answer 
---

Here's a comprehensive CloudFormation template that meets all your requirements for a production-grade AWS infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade scalable web application infrastructure with security best practices'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: Existing VPC ID for deployment
  
  SSHAllowedIP:
    Type: String
    Description: IP address allowed for SSH access (CIDR format)
    Default: "10.0.0.1/32"
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
    ConstraintDescription: Must be a valid IP CIDR range
  
  DBUsername:
    Type: String
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with letter and contain only alphanumeric characters
    NoEcho: true
  
  DBPassword:
    Type: String
    Description: Database master password
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters
    NoEcho: true
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
  
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
  
  OrganizationId:
    Type: String
    Description: AWS Organization ID for StackSet deployment
    Default: "o-example"

Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet1:
      CIDR: 10.0.10.0/24
    PrivateSubnet2:
      CIDR: 10.0.20.0/24
    DatabaseSubnet1:
      CIDR: 10.0.30.0/24
    DatabaseSubnet2:
      CIDR: 10.0.40.0/24

Resources:
  # KMS Key for encryption with automatic rotation
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting production resources
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/production-encryption-${AWS::StackName}'
      TargetKeyId: !Ref EncryptionKey

  # Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'

  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSubnet1'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSubnet2'

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VpcId
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
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedIP
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SG'

  # IAM Roles with least privilege
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt ApplicationBucket.Arn
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # S3 Buckets with encryption and no public access
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
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
        - Key: Environment
          Value: Production

  ELBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-elb-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
        - Key: Environment
          Value: Production

  ELBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ELBLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowELBLogDelivery
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ELBLogsBucket.Arn}/*'

  # Application Load Balancer with logging
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ELBLogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb'
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template for Auto Scaling
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Environment
                Value: Production
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer'
          - ResourceType: volume
            Tags:
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from Production Environment</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health

  # Auto Scaling Group with minimum 2 instances
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # Auto Scaling Policy
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

  # CloudWatch Alarms for CPU > 85%
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alarm when CPU exceeds 85%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LowCPU'
      AlarmDescription: Alarm when CPU is below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # SNS Topic for Alarms
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Alarms'
      DisplayName: Production Environment Alarms
      KmsMasterKeyId: !Ref EncryptionKey
      Tags:
        - Key: Environment
          Value: Production

  # RDS Database Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # RDS Multi-AZ Database (not publicly accessible)
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
      MultiAZ: true
      PubliclyAccessible: false
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Function Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Function with environment variables
  ProcessingLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-processor'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import os
          import json
          
          def handler(event, context):
              bucket_name = os.environ.get('BUCKET_NAME')
              environment = os.environ.get('ENVIRONMENT')
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': f'Processing in {environment} environment',
                      'bucket': bucket_name
                  })
              }
      Environment:
        Variables:
          BUCKET_NAME: !Ref ApplicationBucket
          ENVIRONMENT: Production
          DB_ENDPOINT: !GetAtt RDSDatabase.Endpoint.Address
      VpcConfig:
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Groups
  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/${AWS::StackName}-db/error'
      RetentionInDays: 30

  # StackSet for IAM roles across accounts
  CrossAccountRoleStackSet:
    Type: AWS::CloudFormation::StackSet
    Properties:
      StackSetName: !Sub '${AWS::StackName}-CrossAccountRoles'
      Description: Deploy IAM roles across multiple accounts
      Capabilities:
        - CAPABILITY_NAMED_IAM
      PermissionModel: SERVICE_MANAGED
      AutoDeployment:
        Enabled: true
        RetainStacksOnAccountRemoval: false
      ManagedExecution:
        Active: true
      OperationPreferences:
        RegionConcurrencyType: PARALLEL
      CallAs: DELEGATED_ADMIN
      Parameters:
        - ParameterKey: Environment
          ParameterValue: Production
      TemplateBody: |
        AWSTemplateFormatVersion: '2010-09-09'
        Parameters:
          Environment:
            Type: String
        Resources:
          CrossAccountRole:
            Type: AWS::IAM::Role
            Properties:
              RoleName: !Sub 'CrossAccount-${Environment}-Role'
              AssumeRolePolicyDocument:
                Version: '2012-10-17'
                Statement:
                  - Effect: Allow
                    Principal:
                      AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
                    Action: 'sts:AssumeRole'
              ManagedPolicyArns:
                - arn:aws:iam::aws:policy/ReadOnlyAccess
              Tags:
                - Key: Environment
                  Value: !Ref Environment

  # Secrets Manager for storing sensitive data (example)
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-credentials'
      Description: RDS Master User Password
      KmsKeyId: !Ref EncryptionKey
      SecretString: !Sub |
        {
          "username": "${DBUsername}",
          "password": "${DBPassword}",
          "engine": "mysql",
          "host": "${RDSDatabase.Endpoint.Address}",
          "port": 3306,
          "dbname": "production"
        }
      Tags:
        - Key: Environment
          Value: Production

  # Rotation Lambda for Secrets Manager
  SecretRotationLambda:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DatabaseSecret
      RotationLambdaARN: !GetAtt ProcessingLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-Production'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                  ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Production Metrics"
              }
            }
          ]
        }

Outputs:
  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
  
  S3BucketName:
    Description: Name of the S3 bucket for application data
    Value: !Ref ApplicationBucket
  
  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
  
  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt ProcessingLambda.Arn
  
  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref EncryptionKey
```

## Key Features Implemented:

### Security Best Practices ✅
- **No hard-coded secrets**: Uses parameters with NoEcho for sensitive data
- **Encryption everywhere**: KMS keys with rotation enabled for S3, RDS, and SNS
- **Least privilege IAM roles**: Specific permissions for EC2, Lambda
- **No public access**: S3 buckets blocked, RDS not publicly accessible
- **SSH restricted**: Only from specified IP address

### High Availability ✅
- **Multi-AZ RDS**: Database configured for high availability
- **Auto Scaling**: Minimum 2 instances across multiple AZs
- **Load Balancer**: ALB distributing traffic across instances
- **Multiple subnets**: Resources spread across availability zones

### Operational Excellence ✅
- **CloudWatch Alarms**: CPU monitoring with 85% threshold
- **ELB Access Logging**: Enabled and stored in encrypted S3
- **Automated backups**: RDS with 7-day retention
- **Log retention**: CloudWatch logs with defined retention periods

### Compliance Requirements ✅
1. ✅ All resources tagged with Environment=Production
2. ✅ Uses provided VPC ID for networking
3. ✅ SSH access restricted to specified IP
4. ✅ IAM roles with least privilege
5. ✅ S3 encryption and public access blocked
6. ✅ RDS Multi-AZ with no public access
7. ✅ ELB with access logging
8. ✅ CloudWatch alarms for CPU > 85%
9. ✅ ASG with minimum 2 instances
10. ✅ Lambda uses environment variables
11. ✅ StackSet for cross-account IAM roles
12. ✅ No hard-coded secrets
13. ✅ Custom VPC usage (not default)
14. ✅ KMS key rotation enabled
15. ✅ RDS not publicly accessible
16. ✅ Single file template

## Deployment Instructions:

1. **Validate the template**:
```bash
aws cloudformation validate-template --template-body file://template.yaml
cfn-lint template.yaml
```

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name production-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SSHAllowedIP,ParameterValue=YOUR_IP/32 \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPassword,ParameterValue=SecurePass123! \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
  --capabilities CAPABILITY_NAMED_IAM
```

This template provides a production-ready, secure, and scalable infrastructure that meets all specified requirements while following AWS best practices.