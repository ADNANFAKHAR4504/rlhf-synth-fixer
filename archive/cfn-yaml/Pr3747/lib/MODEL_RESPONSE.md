### Reasoning Trace

---

Let's break down the requirements for this CloudFormation template:

1. **Parameter-driven approach:**
   - Template takes an "Environment" parameter (dev, test, prod)
   - Based on this parameter, fetches a config file from S3 (e.g., dev.json)
   - Uses values from this config file for environment-specific settings

2. **Infrastructure components to create:**
   - VPC with public and private subnets
   - Auto Scaling Group of EC2 instances
   - Application Load Balancer
   - RDS instance in a private subnet
   - Route 53 record pointing to the ALB
   - CloudTrail configuration
   - KMS keys for encryption
   - CloudWatch alarms
   - SNS topic for alerts

3. **Environment-specific configurations:**
   - EC2 instance types
   - Auto Scaling limits
   - RDS instance class
   - Database credentials from Secrets Manager
   - API keys from Secrets Manager
   - Route 53 subdomain
   - CloudWatch alarm thresholds

Let me create this template with all these components. I'll divide it into logical sections:

1. Parameters section
2. Custom resources to fetch and parse the S3 config file
3. VPC and networking resources
4. Security groups
5. KMS keys
6. RDS database
7. EC2 Launch Configuration and Auto Scaling Group
8. Application Load Balancer
9. Route 53 DNS record
10. CloudTrail configuration
11. CloudWatch alarms
12. SNS topic

Let's start with the YAML CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'E-Commerce Platform Infrastructure Template'

Parameters:
  Environment:
    Description: Environment name (dev, test, prod)
    Type: String
    AllowedValues:
      - dev
      - test
      - prod
    Default: dev

  ConfigBucket:
    Description: S3 bucket containing environment configuration files
    Type: String

  DomainName:
    Description: Base domain name for the application (e.g., our-ecomm-store.com)
    Type: String

  DatabaseSecretPath:
    Description: Path in Secrets Manager for database credentials
    Type: String
    Default: /ecommerce/{Environment}/DatabaseCredentials

  PaymentProcessorKeyPath:
    Description: Path in Secrets Manager for payment processor API key
    Type: String
    Default: /ecommerce/{Environment}/PaymentProcessorKey

Resources:
  # Custom resource to fetch the environment config file from S3
  ConfigFetcher:
    Type: Custom::S3ConfigFetcher
    Properties:
      ServiceToken: !GetAtt ConfigFetcherFunction.Arn
      Bucket: !Ref ConfigBucket
      Key: !Sub '${Environment}.json'

  # Lambda function that fetches the config file
  ConfigFetcherFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt ConfigFetcherRole.Arn
      Runtime: python3.8
      Timeout: 30
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse

          s3 = boto3.client('s3')

          def handler(event, context):
              try:
                  if event['RequestType'] in ['Create', 'Update']:
                      bucket = event['ResourceProperties']['Bucket']
                      key = event['ResourceProperties']['Key']
                      
                      response = s3.get_object(Bucket=bucket, Key=key)
                      config_content = response['Body'].read().decode('utf-8')
                      config = json.loads(config_content)
                      
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, config)
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  cfnresponse.send(event, context, cfnresponse.FAILED, {"Error": str(e)})

  # IAM Role for the Lambda function
  ConfigFetcherRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: S3ReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::${ConfigBucket}/${Environment}.json'

  # VPC and Network Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !GetAtt ConfigFetcher.CIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.PrivateSubnet1CIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-private-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.PrivateSubnet2CIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-private-2'

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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-nat-2'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-rt'

  PublicRoute:
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
          Value: !Sub '${Environment}-ecommerce-private-rt-1'

  PrivateRoute1:
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
          Value: !Sub '${Environment}-ecommerce-private-rt-2'

  PrivateRoute2:
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
          Value: !Sub '${Environment}-ecommerce-alb-sg'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Web Servers
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
          CidrIp: !GetAtt ConfigFetcher.SSHAllowedCIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-webserver-sg'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !GetAtt ConfigFetcher.DBPort
          ToPort: !GetAtt ConfigFetcher.DBPort
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-db-sg'

  # KMS Key for Encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} e-commerce environment'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - kms:Create*
              - kms:Describe*
              - kms:Enable*
              - kms:List*
              - kms:Put*
              - kms:Update*
              - kms:Revoke*
              - kms:Disable*
              - kms:Get*
              - kms:Delete*
              - kms:ScheduleKeyDeletion
              - kms:CancelKeyDeletion
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: '*'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Ref AWS::AccountId

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/ecommerce-${Environment}'
      TargetKeyId: !Ref EncryptionKey

  # Database Resources
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub 'Subnet group for ${Environment} e-commerce database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      Engine: !GetAtt ConfigFetcher.DBEngine
      EngineVersion: !GetAtt ConfigFetcher.DBEngineVersion
      DBInstanceClass: !GetAtt ConfigFetcher.DBInstanceClass
      AllocatedStorage: !GetAtt ConfigFetcher.DBAllocatedStorage
      StorageType: !GetAtt ConfigFetcher.DBStorageType
      DBName: !GetAtt ConfigFetcher.DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecretPath}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecretPath}:SecretString:password}}'
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: !GetAtt ConfigFetcher.DBMultiAZ
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
      BackupRetentionPeriod: !GetAtt ConfigFetcher.DBBackupRetentionPeriod
      DeletionProtection: !GetAtt ConfigFetcher.DBDeletionProtection
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-db'

  # EC2 Resources
  WebServerRole:
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${DatabaseSecretPath}-*'
                  - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${PaymentProcessorKeyPath}-*'

  WebServerProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebServerRole

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-ecommerce-launch-template'
      LaunchTemplateData:
        ImageId: !GetAtt ConfigFetcher.EC2AMI
        InstanceType: !GetAtt ConfigFetcher.EC2InstanceType
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Name: !Ref WebServerProfile
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: !GetAtt ConfigFetcher.EC2VolumeSize
              VolumeType: gp2
              Encrypted: true
              KmsKeyId: !Ref EncryptionKey
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cfn-bootstrap

            # Install and configure CloudWatch agent
            yum install -y amazon-cloudwatch-agent

            # Get application config
            aws secretsmanager get-secret-value --secret-id ${DatabaseSecretPath} --region ${AWS::Region} --query SecretString --output text > /etc/db-credentials.json
            aws secretsmanager get-secret-value --secret-id ${PaymentProcessorKeyPath} --region ${AWS::Region} --query SecretString --output text > /etc/payment-processor-key.json

            # Set up application (This would be replaced with your actual application setup)
            echo "Setting up e-commerce application for ${Environment} environment"

            # Signal completion
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource WebServerAutoScalingGroup --region ${AWS::Region}

  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !GetAtt ConfigFetcher.ASGMinSize
      MaxSize: !GetAtt ConfigFetcher.ASGMaxSize
      DesiredCapacity: !GetAtt ConfigFetcher.ASGDesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-webserver'
          PropagateAtLaunch: true

  # Scale Up Policy
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !GetAtt ConfigFetcher.ASGCPUTargetValue

  # Load Balancer Resources
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-ecommerce-alb'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Type: application
      Scheme: internet-facing
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-alb'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckPath: !GetAtt ConfigFetcher.ALBHealthCheckPath
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-tg'

  # DNS Record
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Sub 'api-${Environment}.${DomainName}.'
      Type: A
      AliasTarget:
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName

  # CloudTrail Configuration
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${Environment}-ecommerce-cloudtrail'
      VersioningConfiguration:
        Status: Enabled
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
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      KMSKeyId: !Ref EncryptionKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-cloudtrail'

  # SNS Topic for Alarms
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-ecommerce-alerts'
      KmsMasterKeyId: !Ref EncryptionKey

  # CloudWatch Alarms
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-ecommerce-high-cpu-alarm'
      AlarmDescription: !Sub 'Alarm when CPU exceeds threshold in ${Environment} environment'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: !GetAtt ConfigFetcher.CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      OKActions:
        - !Ref AlertTopic

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PublicSubnets:
    Description: Public subnets
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'

  PrivateSubnets:
    Description: Private subnets
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  ApplicationLoadBalancerDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNS'

  ApplicationURL:
    Description: URL of the e-commerce application
    Value: !Sub 'https://api-${Environment}.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-URL'

  DatabaseEndpoint:
    Description: Endpoint of the RDS database
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  EncryptionKeyARN:
    Description: ARN of the KMS key used for encryption
    Value: !GetAtt EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyARN'

  AlertTopicARN:
    Description: ARN of the SNS topic used for alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopicARN'
```

Hmm, I notice that the way I'm trying to use the ConfigFetcher custom resource might not work the way I intended. Let me refactor this to use AWS::CloudFormation::Stack to merge with the external config JSON file in a more CloudFormation-friendly way.

Let's rewrite the template with a different approach:

1. We'll create a Lambda function as a custom resource that fetches the config file from S3
2. This custom resource will output the configuration as attributes that can be referenced via !GetAtt
3. We'll then use these attributes throughout the template

Let me adjust the template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'E-Commerce Platform Infrastructure Template'

Parameters:
  Environment:
    Description: Environment name (dev, test, prod)
    Type: String
    AllowedValues:
      - dev
      - test
      - prod
    Default: dev

  ConfigBucket:
    Description: S3 bucket containing environment configuration files
    Type: String

  DomainName:
    Description: Base domain name for the application (e.g., our-ecomm-store.com)
    Type: String

Mappings:
  EnvironmentSecrets:
    dev:
      DatabaseSecretPath: /ecommerce/dev/DatabaseCredentials
      PaymentProcessorKeyPath: /ecommerce/dev/PaymentProcessorKey
    test:
      DatabaseSecretPath: /ecommerce/test/DatabaseCredentials
      PaymentProcessorKeyPath: /ecommerce/test/PaymentProcessorKey
    prod:
      DatabaseSecretPath: /ecommerce/prod/DatabaseCredentials
      PaymentProcessorKeyPath: /ecommerce/prod/PaymentProcessorKey

Resources:
  # Custom resource to fetch the environment config file from S3
  ConfigFetcher:
    Type: Custom::S3ConfigFetcher
    Properties:
      ServiceToken: !GetAtt ConfigFetcherFunction.Arn
      Bucket: !Ref ConfigBucket
      Key: !Sub '${Environment}.json'
      Environment: !Ref Environment

  # Lambda function that fetches the config file
  ConfigFetcherFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt ConfigFetcherRole.Arn
      Runtime: python3.8
      Timeout: 30
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse

          s3 = boto3.client('s3')

          def handler(event, context):
              response_data = {}
              try:
                  if event['RequestType'] in ['Create', 'Update']:
                      bucket = event['ResourceProperties']['Bucket']
                      key = event['ResourceProperties']['Key']
                      environment = event['ResourceProperties']['Environment']
                      
                      # Get config file from S3
                      s3_response = s3.get_object(Bucket=bucket, Key=key)
                      config_content = s3_response['Body'].read().decode('utf-8')
                      config = json.loads(config_content)
                      
                      # Return all config properties as custom resource attributes
                      response_data = config
                      
                      # Add default values if not in config
                      if 'VPC' not in response_data:
                          response_data['VPC'] = {
                              'CIDR': '10.0.0.0/16',
                              'PublicSubnet1CIDR': '10.0.1.0/24',
                              'PublicSubnet2CIDR': '10.0.2.0/24',
                              'PrivateSubnet1CIDR': '10.0.3.0/24',
                              'PrivateSubnet2CIDR': '10.0.4.0/24'
                          }
                      
                      if 'EC2' not in response_data:
                          response_data['EC2'] = {
                              'InstanceType': 't3.micro',
                              'AMI': 'ami-0c55b159cbfafe1f0',
                              'VolumeSize': 20
                          }
                      
                      if 'RDS' not in response_data:
                          response_data['RDS'] = {
                              'Engine': 'mysql',
                              'EngineVersion': '8.0.23',
                              'InstanceClass': 'db.t3.micro',
                              'AllocatedStorage': 20,
                              'StorageType': 'gp2',
                              'DBName': f'ecommerce_{environment}',
                              'Port': 3306,
                              'MultiAZ': False,
                              'BackupRetentionPeriod': 7,
                              'DeletionProtection': False
                          }
                      
                      if 'ASG' not in response_data:
                          response_data['ASG'] = {
                              'MinSize': 1,
                              'MaxSize': 3,
                              'DesiredCapacity': 2,
                              'CPUTargetValue': 70
                          }
                      
                      if 'ALB' not in response_data:
                          response_data['ALB'] = {
                              'HealthCheckPath': '/health'
                          }
                      
                      if 'CloudWatch' not in response_data:
                          response_data['CloudWatch'] = {
                              'CPUAlarmThreshold': 80
                          }
                      
                      if 'Security' not in response_data:
                          response_data['Security'] = {
                              'SSHAllowedCIDR': '0.0.0.0/0'
                          }
                          
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
              except Exception as e:
                  print(str(e))
                  cfnresponse.send(event, context, cfnresponse.FAILED, {"Error": str(e)})

  # IAM Role for the Lambda function
  ConfigFetcherRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: S3ReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::${ConfigBucket}/${Environment}.json'

  # VPC and Network Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !GetAtt ConfigFetcher.VPC.CIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.VPC.PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.VPC.PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.VPC.PrivateSubnet1CIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-private-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !GetAtt ConfigFetcher.VPC.PrivateSubnet2CIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-private-2'

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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-nat-2'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-public-rt'

  PublicRoute:
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
          Value: !Sub '${Environment}-ecommerce-private-rt-1'

  PrivateRoute1:
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
          Value: !Sub '${Environment}-ecommerce-private-rt-2'

  PrivateRoute2:
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
          Value: !Sub '${Environment}-ecommerce-alb-sg'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Web Servers
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
          CidrIp: !GetAtt ConfigFetcher.Security.SSHAllowedCIDR
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-webserver-sg'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !GetAtt ConfigFetcher.RDS.Port
          ToPort: !GetAtt ConfigFetcher.RDS.Port
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-db-sg'

  # KMS Key for Encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} e-commerce environment'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - kms:Create*
              - kms:Describe*
              - kms:Enable*
              - kms:List*
              - kms:Put*
              - kms:Update*
              - kms:Revoke*
              - kms:Disable*
              - kms:Get*
              - kms:Delete*
              - kms:ScheduleKeyDeletion
              - kms:CancelKeyDeletion
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: '*'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Ref AWS::AccountId

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/ecommerce-${Environment}'
      TargetKeyId: !Ref EncryptionKey

  # Database Resources
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub 'Subnet group for ${Environment} e-commerce database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      Engine: !GetAtt ConfigFetcher.RDS.Engine
      EngineVersion: !GetAtt ConfigFetcher.RDS.EngineVersion
      DBInstanceClass: !GetAtt ConfigFetcher.RDS.InstanceClass
      AllocatedStorage: !GetAtt ConfigFetcher.RDS.AllocatedStorage
      StorageType: !GetAtt ConfigFetcher.RDS.StorageType
      DBName: !GetAtt ConfigFetcher.RDS.DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${EnvironmentSecrets.DatabaseSecretPath}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${EnvironmentSecrets.DatabaseSecretPath}:SecretString:password}}'
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: !GetAtt ConfigFetcher.RDS.MultiAZ
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
      BackupRetentionPeriod: !GetAtt ConfigFetcher.RDS.BackupRetentionPeriod
      DeletionProtection: !GetAtt ConfigFetcher.RDS.DeletionProtection
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-db'

  # EC2 Resources
  WebServerRole:
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource:
                  - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${!FindInMap [EnvironmentSecrets, !Ref Environment, DatabaseSecretPath]}-*'
                  - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${!FindInMap [EnvironmentSecrets, !Ref Environment, PaymentProcessorKeyPath]}-*'

  WebServerProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebServerRole

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-ecommerce-launch-template'
      LaunchTemplateData:
        ImageId: !GetAtt ConfigFetcher.EC2.AMI
        InstanceType: !GetAtt ConfigFetcher.EC2.InstanceType
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Name: !Ref WebServerProfile
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: !GetAtt ConfigFetcher.EC2.VolumeSize
              VolumeType: gp2
              Encrypted: true
              KmsKeyId: !Ref EncryptionKey
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cfn-bootstrap

            # Install and configure CloudWatch agent
            yum install -y amazon-cloudwatch-agent

            # Get application config
            aws secretsmanager get-secret-value --secret-id ${!FindInMap [EnvironmentSecrets, !Ref Environment, DatabaseSecretPath]} --region ${AWS::Region} --query SecretString --output text > /etc/db-credentials.json
            aws secretsmanager get-secret-value --secret-id ${!FindInMap [EnvironmentSecrets, !Ref Environment, PaymentProcessorKeyPath]} --region ${AWS::Region} --query SecretString --output text > /etc/payment-processor-key.json

            # Set up application (This would be replaced with your actual application setup)
            echo "Setting up e-commerce application for ${Environment} environment"

            # Signal completion
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource WebServerAutoScalingGroup --region ${AWS::Region}

  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !GetAtt ConfigFetcher.ASG.MinSize
      MaxSize: !GetAtt ConfigFetcher.ASG.MaxSize
      DesiredCapacity: !GetAtt ConfigFetcher.ASG.DesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-webserver'
          PropagateAtLaunch: true

  # Scale Up Policy
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !GetAtt ConfigFetcher.ASG.CPUTargetValue

  # Load Balancer Resources
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-ecommerce-alb'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Type: application
      Scheme: internet-facing
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-alb'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckPath: !GetAtt ConfigFetcher.ALB.HealthCheckPath
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-tg'

  # DNS Record
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Sub 'api-${Environment}.${DomainName}.'
      Type: A
      AliasTarget:
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName

  # CloudTrail Configuration
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${Environment}-ecommerce-cloudtrail'
      VersioningConfiguration:
        Status: Enabled
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
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      KMSKeyId: !Ref EncryptionKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ecommerce-cloudtrail'

  # SNS Topic for Alarms
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-ecommerce-alerts'
      KmsMasterKeyId: !Ref EncryptionKey

  # CloudWatch Alarms
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-ecommerce-high-cpu-alarm'
      AlarmDescription: !Sub 'Alarm when CPU exceeds threshold in ${Environment} environment'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: !GetAtt ConfigFetcher.CloudWatch.CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      OKActions:
        - !Ref AlertTopic

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PublicSubnets:
    Description: Public subnets
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'

  PrivateSubnets:
    Description: Private subnets
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  ApplicationLoadBalancerDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNS'

  ApplicationURL:
    Description: URL of the e-commerce application
    Value: !Sub 'https://api-${Environment}.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-URL'

  DatabaseEndpoint:
    Description: Endpoint of the RDS database
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  EncryptionKeyARN:
    Description: ARN of the KMS key used for encryption
    Value: !GetAtt EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyARN'

  AlertTopicARN:
    Description: ARN of the SNS topic used for alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopicARN'
```

I notice an issue with the FindInMap function. Let me correct that:

```yaml
WebServerRole:
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
      - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
    Policies:
      - PolicyName: SecretsManagerAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource:
                - !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${!FindInMap ['EnvironmentSecrets', ${Environment}, 'DatabaseSecretPath']}-*"
                - !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${!FindInMap ['EnvironmentSecrets', ${Environment}, 'PaymentProcessorKeyPath']}-*"
```

And also in the UserData section:

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    yum update -y
    yum install -y aws-cfn-bootstrap

    # Install and configure CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Get application config
    aws secretsmanager get-secret-value --secret-id ${!FindInMap ['EnvironmentSecrets', ${Environment}, 'DatabaseSecretPath']} --region ${AWS::Region} --query SecretString --output text > /etc/db-credentials.json
    aws secretsmanager get-secret-value --secret-id ${!FindInMap ['EnvironmentSecrets', ${Environment}, 'PaymentProcessorKeyPath']} --region ${AWS::Region} --query SecretString --output text > /etc/payment-processor-key.json
```

Wait, I'm mixing up my syntax. Let me fix the FindInMap in a way that works with !Sub:

```yaml
UserData:
  Fn::Base64:
    Fn::Sub:
      - |
        #!/bin/bash
        yum update -y
        yum install -y aws-cfn-bootstrap

        # Install and configure CloudWatch agent
        yum install -y amazon-cloudwatch-agent

        # Get application config
        aws secretsmanager get-secret-value --secret-id ${DatabaseSecretPath} --region ${AWS::Region} --query SecretString --output text > /etc/db-credentials.json
        aws secretsmanager get-secret-value --secret-id ${PaymentProcessorKeyPath} --region ${AWS::Region} --query SecretString --output text > /etc/payment-processor-key.json

        # Set up application (This would be replaced with your actual application setup)
        echo "Setting up e-commerce application for ${Environment} environment"

        # Signal completion
        /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource WebServerAutoScalingGroup --region ${AWS::Region}
      - DatabaseSecretPath:
          !FindInMap [EnvironmentSecrets, !Ref Environment, DatabaseSecretPath]
        PaymentProcessorKeyPath:
          !FindInMap [
            EnvironmentSecrets,
            !Ref Environment,
            PaymentProcessorKeyPath,
          ]
```

And the same for the IAM role:

```yaml
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '
### Answer
---

```
