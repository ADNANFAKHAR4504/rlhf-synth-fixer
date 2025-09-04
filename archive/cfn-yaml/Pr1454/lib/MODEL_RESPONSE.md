```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-grade multi-tier application infrastructure'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID where resources will be deployed
  
  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Subnet IDs for Auto Scaling Group (minimum 2 AZs)
  
  DynamoDBTableName:
    Type: String
    Default: ProductionAppTable
    Description: Name for the DynamoDB table
    MinLength: 3
    MaxLength: 255
  
  APIGatewayName:
    Type: String
    Default: ProductionAPI
    Description: Name for the API Gateway
    MinLength: 1
    MaxLength: 1024
  
  NetworkTrafficThreshold:
    Type: Number
    Default: 1000000000
    Description: Network traffic threshold in bytes for CloudWatch Alarm
    MinValue: 1000000
  
  AllowedIPBlock:
    Type: String
    Default: 10.0.0.0/8
    Description: IP block allowed by WAF (CIDR notation)
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for production application encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for DynamoDB
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/production-app-key
      TargetKeyId: !Ref KMSKey

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-secure-bucket-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Environment
          Value: Production

  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-access-logs-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  # S3 Bucket Policy
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowReadOnlyAccessToEC2Role
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
              - s3:ListBucket
            Resource:
              - !Sub '${S3Bucket}/*'
              - !Ref S3Bucket
          - Sid: DenyAllOtherAccess
            Effect: Deny
            NotPrincipal:
              AWS: 
                - !GetAtt EC2InstanceRole.Arn
                - !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 's3:*'
            Resource:
              - !Sub '${S3Bucket}/*'
              - !Ref S3Bucket

  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref DynamoDBTableName
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: Production

  # IAM Role for EC2 instances
  EC2InstanceRole:
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
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:ListBucket
                Resource:
                  - !Sub '${S3Bucket}/*'
                  - !Ref S3Bucket
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances - HTTPS only
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Environment
          Value: Production

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-launch-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "CWAgent",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Environment
                Value: Production
          - ResourceType: volume
            Tags:
              - Key: Environment
                Value: Production

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      VPCZoneIdentifier: !Ref SubnetIds
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # SNS Topic for alarms
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-alarms'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarm
  NetworkTrafficAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-high-network-traffic'
      AlarmDescription: Alarm when network traffic exceeds threshold
      MetricName: NetworkIn
      Namespace: AWS/EC2
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref NetworkTrafficThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  # WAF IP Set
  WAFIPSet:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: !Sub '${AWS::StackName}-allowed-ips'
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses:
        - !Ref AllowedIPBlock
      Tags:
        - Key: Environment
          Value: Production

  # WAF WebACL
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-webacl'
      Scope: REGIONAL
      DefaultAction:
        Block: {}
      Rules:
        - Name: AllowSpecificIPs
          Priority: 1
          Statement:
            IPSetReferenceStatement:
              Arn: !GetAtt WAFIPSet.Arn
          Action:
            Allow: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AllowSpecificIPs
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-webacl'
      Tags:
        - Key: Environment
          Value: Production

  # API Gateway
  APIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Ref APIGatewayName
      Description: Production API Gateway
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: Production

  APIGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref APIGateway
      ParentId: !GetAtt APIGateway.RootResourceId
      PathPart: health

  APIGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref APIGateway
      ResourceId: !Ref APIGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"status": "healthy"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIGatewayMethod
    Properties:
      RestApiId: !Ref APIGateway
      StageName: prod

  # Associate WAF with API Gateway
  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${APIGateway}/stages/prod'
      WebACLArn: !GetAtt WAFWebACL.Arn

  # CloudWatch Log Group for API Gateway
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${APIGatewayName}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

Outputs:
  S3BucketName:
    Description: Name of the created S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  DynamoDBTableArn:
    Description: ARN of the DynamoDB table
    Value: !GetAtt DynamoDBTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASGName'

  APIGatewayInvokeURL:
    Description: Invoke URL for the API Gateway
    Value: !Sub 'https://${APIGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayURL'

  WAFWebACLArn:
    Description: ARN of the WAF WebACL
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WAFWebACLArn'

  CloudWatchAlarmArn:
    Description: ARN of the CloudWatch Alarm
    Value: !Sub 'arn:aws:cloudwatch:${AWS::Region}:${AWS::AccountId}:alarm:${NetworkTrafficAlarm}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudWatchAlarmArn'

  KMSKeyId:
    Description: ID of the KMS key used for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  SNSTopicArn:
    Description: ARN of the SNS topic for alarms
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'
```