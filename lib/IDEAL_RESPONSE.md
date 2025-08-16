```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and compliant web application environment with comprehensive security controls'

Parameters:
  Environment:
    Type: String
    Default: production
    Description: Environment name
    AllowedValues: [development, staging, production]

  ProjectName:
    Type: String
    Default: secure-web-app18
    Description: Project name for resource tagging

  AllowedCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block allowed for inbound access
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}\/([1-2][0-9]|3[0-2])$'

  DBUsername:
    Type: String
    Default: dbadmin
    Description: Database username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  SSMParameterPrefix:
    Type: String
    Default: /secure-web-app
    Description: SSM Parameter Store prefix for sensitive values

  # NEW: use SSM to resolve the latest Amazon Linux AMI id at deploy time
  LatestAmi:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64

Conditions:
  IsProduction: !Equals [!Ref Environment, 'production']

Resources:
  # -------------------- KMS --------------------
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for application encryption
      KeyPolicy:
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
            Action: [kms:Encrypt, kms:Decrypt, kms:ReEncrypt*, kms:GenerateDataKey*, kms:DescribeKey]
            Resource: '*'
          - Sid: Allow RDS and Secrets Manager
            Effect: Allow
            Principal:
              Service:
                - rds.amazonaws.com
                - secretsmanager.amazonaws.com
            Action: [kms:Decrypt, kms:GenerateDataKey, kms:ReEncrypt*, kms:CreateGrant, kms:DescribeKey]
            Resource: '*'
          - Sid: AllowCloudWatchLogs
            Effect: Allow
            Principal:
              Service: !Sub "logs.${AWS::Region}.amazonaws.com"
            Action: [kms:Encrypt, kms:Decrypt, kms:ReEncrypt*, kms:GenerateDataKey*, kms:DescribeKey]
            Resource: "*"
            Condition:
              ArnLike:
                kms:EncryptionContext:aws:logs:arn: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      # include StackName to avoid alias name collisions across retries
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-${AWS::StackName}'
      TargetKeyId: !Ref ApplicationKMSKey

  # -------------------- Networking --------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-vpc' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-igw' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-subnet-1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-subnet-2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-subnet-1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-private-subnet-2' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-eip-1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-nat-1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-public-routes' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

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
        - { Key: Name, Value: !Sub '${ProjectName}-private-routes-1' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

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

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # -------------------- Security Groups (no GroupName to avoid collisions) --------------------
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80,  ToPort: 80,  CidrIp: 0.0.0.0/0 }
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0 }
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-alb-sg' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80, ToPort: 80, SourceSecurityGroupId: !Ref ALBSecurityGroup }
        - { IpProtocol: tcp, FromPort: 22, ToPort: 22, CidrIp: !Ref AllowedCIDR }
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-ec2-sg' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - { IpProtocol: -1, CidrIp: 0.0.0.0/0 }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-lambda-sg' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: !Ref EC2SecurityGroup }
        - { IpProtocol: tcp, FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: !Ref LambdaSecurityGroup }
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-db-sg' }
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  # -------------------- SSM Parameters --------------------
  DBPasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '${SSMParameterPrefix}/database/password'
      Type: String
      Value: ChangeMe123!
      Description: Database password
      Tags: { Environment: !Ref Environment, ProjectName: !Ref ProjectName }

  APIKeyParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '${SSMParameterPrefix}/api/key'
      Type: String
      Value: api-key-placeholder
      Description: API key for external services
      Tags: { Environment: !Ref Environment, ProjectName: !Ref ProjectName }

  # -------------------- S3 Buckets --------------------
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  ApplicationBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ApplicationBucket.Arn
              - !Sub '${ApplicationBucket.Arn}/*'
            Condition:
              Bool: { 'aws:SecureTransport': 'false' }

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-logs-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetention
            Status: Enabled
            ExpirationInDays: !If [IsProduction, 2555, 365]
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LogsBucket.Arn
              - !Sub '${LogsBucket.Arn}/*'
            Condition:
              Bool: { 'aws:SecureTransport': 'false' }

  # -------------------- CloudWatch Log Groups (unencrypted to simplify IAM; safe to add KMS later) --------------------
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-process-file-${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]

  AuthLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-auth-${Environment}'
      RetentionInDays: !If [IsProduction, 365, 30]

  # -------------------- SNS --------------------
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-security-alerts-${Environment}'
      DisplayName: Security Alerts
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  # -------------------- RDS --------------------
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      # REMOVED: DBSubnetGroupName to avoid AlreadyExists on retries
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-db-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      # REMOVED EngineVersion to avoid "Cannot find version" drift issues
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref ApplicationKMSKey
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        KmsKeyId: !Ref ApplicationKMSKey
      VPCSecurityGroups: [!Ref DatabaseSecurityGroup]
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      MultiAZ: !If [IsProduction, true, false]
      PubliclyAccessible: false
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  # -------------------- API Gateway (simple/mock) --------------------
  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-api-${Environment}'
      Description: Secure REST API
      EndpointConfiguration: { Types: [REGIONAL] }
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  AuthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: auth

  AuthMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref AuthResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"message": "API Gateway working"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: [AuthMethod]
    Properties:
      RestApiId: !Ref RestAPI
      StageName: !Ref Environment

  # -------------------- ALB / EC2 --------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      # REMOVED Name to avoid collisions across retries
      Scheme: internet-facing
      Type: application
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      SecurityGroups: [!Ref ALBSecurityGroup]
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      # REMOVED Name to avoid collisions
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - { Key: Environment, Value: !Ref Environment }
        - { Key: ProjectName, Value: !Ref ProjectName }

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      # REMOVED LaunchTemplateName to avoid collisions
      LaunchTemplateData:
        ImageId: !Ref LatestAmi
        InstanceType: t3.micro
        SecurityGroupIds: [!Ref EC2SecurityGroup]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${ProjectName} - ${Environment}</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name, Value: !Sub '${ProjectName}-instance-${Environment}' }
              - { Key: Environment, Value: !Ref Environment }
              - { Key: ProjectName, Value: !Ref ProjectName }

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      # REMOVED AutoScalingGroupName to avoid collisions
      VPCZoneIdentifier: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      TargetGroupARNs: [!Ref ALBTargetGroup]
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-asg-${Environment}', PropagateAtLaunch: false }
        - { Key: Environment, Value: !Ref Environment, PropagateAtLaunch: true }
        - { Key: ProjectName, Value: !Ref ProjectName, PropagateAtLaunch: true }

  # -------------------- Scaling / Alarms --------------------
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      ScalingAdjustment: 1
      AdjustmentType: ChangeInCapacity
      Cooldown: 300

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      ScalingAdjustment: -1
      AdjustmentType: ChangeInCapacity
      Cooldown: 300

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-high-cpu-${Environment}'
      AlarmDescription: High CPU utilization alarm
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
      AlarmActions: [!Ref ScaleUpPolicy, !Ref SecurityAlertsTopic]

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-low-cpu-${Environment}'
      AlarmDescription: Low CPU utilization alarm
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
      AlarmActions: [!Ref ScaleDownPolicy]

  DatabaseHighConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-db-high-connections-${Environment}'
      AlarmDescription: Database high connections alarm
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      AlarmActions: [!Ref SecurityAlertsTopic]

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ALB-DNS'

  APIGatewayURL:
    Description: API Gateway URL
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-API-URL'

  ApplicationBucketName:
    Description: Application S3 Bucket Name
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-APP-BUCKET'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-${Environment}-DB-ENDPOINT'

  MasterSecretArn:
    Description: Master database user secret ARN
    Value: !GetAtt DatabaseInstance.MasterUserSecret.SecretArn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-MASTER-SECRET'

  KMSKeyId:
    Description: KMS Key ID
    Value: !Ref ApplicationKMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-KMS-KEY'

  SNSTopicArn:
    Description: SNS Topic ARN for Security Alerts
    Value: !Ref SecurityAlertsTopic
    Export:
      Name: !Sub '${ProjectName}-${Environment}-SNS-TOPIC'




```