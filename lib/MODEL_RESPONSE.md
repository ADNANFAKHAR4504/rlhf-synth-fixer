### Reasoning Trace
---

Let me create a comprehensive CloudFormation template that addresses all 16 security requirements. I'll need to include:

1. VPC with public and private subnets
2. EC2 instance with encrypted EBS
3. RDS instance with Multi-AZ and backups
4. S3 bucket with encryption and versioning
5. Lambda function in VPC
6. Application Load Balancer with TLS and logging
7. API Gateway with logging
8. IAM roles with least privilege
9. Security Groups with minimal rules
10. CloudWatch Alarms
11. GuardDuty

Let me make sure each requirement is met:

1. Least Privilege IAM ✓ - Will use specific managed policies
2. Managed Policies ✓ - Will use AWS managed policies where possible
3. EC2 in VPC ✓ - EC2 will be in private subnet
4. EBS Encryption ✓ - Will enable encryption on volumes
5. RDS High Availability ✓ - Multi-AZ enabled
6. S3 Default Encryption ✓ - SSE-S3 enabled
7. TLS for In-Transit ✓ - ALB with HTTPS listener, API Gateway with TLS
8. CloudWatch Alarms ✓ - CPU and DB connection alarms
9. S3 Versioning ✓ - Enabled on bucket
10. ELB Access Logging ✓ - ALB logging to S3
11. Lambda in VPC ✓ - Lambda with VPC config
12. RDS Public Access ✓ - PubliclyAccessible: false
13. Minimal Security Groups ✓ - Specific ports and IPs only
14. GuardDuty ✓ - GuardDuty detector
15. RDS Backups ✓ - 7 day retention
16. API Gateway Logging ✓ - Full execution logging
 
I'll start assembling the infrastructure components systematically, ensuring each security requirement is precisely implemented through carefully configured AWS resources.
### Answer 
---

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SecureEnv - Foundational secure AWS environment for sensitive workloads'

Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

Resources:
  # VPC Configuration
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureEnvVPC

  SecureEnvInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureEnvIGW

  SecureEnvAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureEnvVPC
      InternetGatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnvPublicSubnet1

  SecureEnvPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: SecureEnvPublicSubnet2

  SecureEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnvPrivateSubnet1

  SecureEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureEnvVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: SecureEnvPrivateSubnet2

  SecureEnvNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: SecureEnvAttachGateway
    Properties:
      Domain: vpc

  SecureEnvNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt SecureEnvNATGateway1EIP.AllocationId
      SubnetId: !Ref SecureEnvPublicSubnet1

  SecureEnvPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureEnvVPC
      Tags:
        - Key: Name
          Value: SecureEnvPublicRouteTable

  SecureEnvPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: SecureEnvAttachGateway
    Properties:
      RouteTableId: !Ref SecureEnvPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref SecureEnvInternetGateway

  SecureEnvPublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPublicSubnet1
      RouteTableId: !Ref SecureEnvPublicRouteTable

  SecureEnvPublicSubnetRouteTableAssociation2:
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
          Value: SecureEnvPrivateRouteTable1

  SecureEnvPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref SecureEnvPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref SecureEnvNATGateway1

  SecureEnvPrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet1
      RouteTableId: !Ref SecureEnvPrivateRouteTable1

  SecureEnvPrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SecureEnvPrivateSubnet2
      RouteTableId: !Ref SecureEnvPrivateRouteTable1

  # Security Groups
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
          Description: HTTPS from Internet
      Tags:
        - Key: Name
          Value: SecureEnvALBSecurityGroup

  SecureEnvEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref SecureEnvALBSecurityGroup
          Description: HTTPS from ALB
      Tags:
        - Key: Name
          Value: SecureEnvEC2SecurityGroup

  SecureEnvRDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvEC2SecurityGroup
          Description: MySQL from EC2
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref SecureEnvLambdaSecurityGroup
          Description: MySQL from Lambda
      Tags:
        - Key: Name
          Value: SecureEnvRDSSecurityGroup

  SecureEnvLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref SecureEnvVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to AWS services
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref SecureEnvRDSSecurityGroup
          Description: MySQL to RDS
      Tags:
        - Key: Name
          Value: SecureEnvLambdaSecurityGroup

  # IAM Roles with Least Privilege
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvEC2Role
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
          Value: SecureEnvEC2Role

  SecureEnvEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: SecureEnvEC2InstanceProfile
      Roles:
        - !Ref SecureEnvEC2Role

  SecureEnvLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvLambdaRole
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
        - PolicyName: SecureEnvLambdaS3ReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt SecureEnvDataBucket.Arn
                  - !Sub '${SecureEnvDataBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: SecureEnvLambdaRole

  SecureEnvAPIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: SecureEnvAPIGatewayRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Name
          Value: SecureEnvAPIGatewayRole

  # S3 Buckets with Encryption and Versioning
  SecureEnvDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-data-${AWS::AccountId}-${AWS::Region}'
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
          Value: SecureEnvDataBucket

  SecureEnvLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureenv-logs-${AWS::AccountId}-${AWS::Region}'
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
          Value: SecureEnvLogBucket

  SecureEnvLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvLogBucket
      PolicyDocument:
        Statement:
          - Sid: AWSELBAccountAccess
            Effect: Allow
            Principal:
              AWS: arn:aws:iam::127311923021:root
            Action: 
              - s3:PutObject
            Resource: !Sub '${SecureEnvLogBucket.Arn}/alb-logs/AWSLogs/${AWS::AccountId}/*'
          - Sid: AWSELBLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt SecureEnvLogBucket.Arn

  # EC2 Instance with Encrypted EBS
  SecureEnvEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      IamInstanceProfile: !Ref SecureEnvEC2InstanceProfile
      SubnetId: !Ref SecureEnvPrivateSubnet1
      SecurityGroupIds:
        - !Ref SecureEnvEC2SecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a query -m ec2 -c default -n default
      Tags:
        - Key: Name
          Value: SecureEnvEC2Instance

  # RDS Instance with Multi-AZ and Backups
  SecureEnvDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: SecureEnvDBSubnetGroup
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref SecureEnvPrivateSubnet1
        - !Ref SecureEnvPrivateSubnet2
      Tags:
        - Key: Name
          Value: SecureEnvDBSubnetGroup

  SecureEnvRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: secureenv-database
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:SecureEnvDBPassword:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref SecureEnvRDSSecurityGroup
      DBSubnetGroupName: !Ref SecureEnvDBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      StorageEncrypted: true
      PubliclyAccessible: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: SecureEnvRDSInstance

  SecureEnvDBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: SecureEnvDBPassword
      Description: RDS Master Password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # Application Load Balancer with TLS and Logging
  SecureEnvALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: SecureEnvLogBucketPolicy
    Properties:
      Name: SecureEnvALB
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref SecureEnvPublicSubnet1
        - !Ref SecureEnvPublicSubnet2
      SecurityGroups:
        - !Ref SecureEnvALBSecurityGroup
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref SecureEnvLogBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: SecureEnvALB

  SecureEnvTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: SecureEnvTargetGroup
      Port: 443
      Protocol: HTTPS
      VpcId: !Ref SecureEnvVPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTPS
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref SecureEnvEC2Instance
      Tags:
        - Key: Name
          Value: SecureEnvTargetGroup

  SecureEnvALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref SecureEnvALB
      Port: 443
      Protocol: HTTPS
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      Certificates:
        - CertificateArn: !Ref SecureEnvCertificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref SecureEnvTargetGroup

  SecureEnvCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub 'secureenv.${AWS::Region}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: SecureEnvCertificate

  # Lambda Function in VPC
  SecureEnvLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: SecureEnvLambdaFunction
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt SecureEnvLambdaRole.Arn
      Code:
        ZipFile: |
          import json
          import os
          
          def handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Secure Lambda Function Response')
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecureEnvLambdaSecurityGroup
        SubnetIds:
          - !Ref SecureEnvPrivateSubnet1
          - !Ref SecureEnvPrivateSubnet2
      Environment:
        Variables:
          S3_BUCKET: !Ref SecureEnvDataBucket
      ReservedConcurrentExecutions: 10
      Tags:
        - Key: Name
          Value: SecureEnvLambdaFunction

  # API Gateway with Logging
  SecureEnvApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: SecureEnvApiGateway
      Description: Secure API Gateway
      EndpointConfiguration:
        Types:
          - REGIONAL
      MinimumCompressionSize: 1024

  SecureEnvApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt SecureEnvAPIGatewayRole.Arn

  SecureEnvApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - SecureEnvApiGatewayMethod
    Properties:
      RestApiId: !Ref SecureEnvApiGateway
      StageName: prod
      StageDescription:
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true
        TracingEnabled: true

  SecureEnvApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SecureEnvApiGateway
      ParentId: !GetAtt SecureEnvApiGateway.RootResourceId
      PathPart: secure

  SecureEnvApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SecureEnvApiGateway
      ResourceId: !Ref SecureEnvApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SecureEnvLambdaFunction.Arn}/invocations'

  SecureEnvApiGatewayLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecureEnvLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${SecureEnvApiGateway}/*/*'

  # GuardDuty for Threat Detection
  SecureEnvGuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # CloudWatch Alarms
  SecureEnvEC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecureEnvEC2CPUAlarm
      AlarmDescription: Alert when EC2 CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref SecureEnvEC2Instance
      TreatMissingData: breaching

  SecureEnvRDSConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecureEnvRDSConnectionAlarm
      AlarmDescription: Alert when RDS connections exceed 40
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 40
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureEnvRDSInstance
      TreatMissingData: notBreaching

  SecureEnvRDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecureEnvRDSStorageAlarm
      AlarmDescription: Alert when RDS free storage is below 2GB
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureEnvRDSInstance
      TreatMissingData: breaching

  SecureEnvLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecureEnvLambdaErrorAlarm
      AlarmDescription: Alert when Lambda function has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref SecureEnvLambdaFunction
      TreatMissingData: notBreaching

  SecureEnvALBTargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecureEnvALBTargetResponseTimeAlarm
      AlarmDescription: Alert when ALB target response time exceeds 2 seconds
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt SecureEnvALB.LoadBalancerFullName
      TreatMissingData: notBreaching

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
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  SecureEnvVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/vpc/flowlogs
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
          Value: SecureEnvVPCFlowLog

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref SecureEnvVPC
    Export:
      Name: SecureEnvVPCId

  ALBDNSName:
    Description: ALB DNS Name
    Value: !GetAtt SecureEnvALB.DNSName
    Export:
      Name: SecureEnvALBDNS

  ApiGatewayUrl:
    Description: API Gateway URL
    Value: !Sub 'https://${SecureEnvApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: SecureEnvApiGatewayUrl

  DataBucketName:
    Description: Data Bucket Name
    Value: !Ref SecureEnvDataBucket
    Export:
      Name: SecureEnvDataBucket

  RDSEndpoint:
    Description: RDS Endpoint
    Value: !GetAtt SecureEnvRDSInstance.Endpoint.Address
    Export:
      Name: SecureEnvRDSEndpoint
```