```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready CloudFormation template for secure, compliant infrastructure'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet in AZ1'
    
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet in AZ2'
    
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for private subnet in AZ1'
    
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for private subnet in AZ2'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
    
  AlertEmail:
    Type: String
    Description: 'Email address for alerts'
    
  DynamoDBTableName:
    Type: String
    Default: 'SecureTable'
    Description: 'DynamoDB table name'
    
  Project:
    Type: String
    Default: 'SecureInfrastructure'
    Description: 'Project name for tagging'
    
  Environment:
    Type: String
    Default: 'Production'
    Description: 'Environment name for tagging'
    AllowedValues:
      - Development
      - Staging
      - Production

Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for CloudTrail and CloudWatch Logs encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Project}-${Environment}-key'
      TargetKeyId: !Ref KMSKey

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-VPC'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-IGW'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2a
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-Public-Subnet-AZ1'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2b
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-Public-Subnet-AZ2'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2a
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-Private-Subnet-AZ1'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2b
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-Private-Subnet-AZ2'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-NAT-EIP'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-NAT-Gateway'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-Public-Routes'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${Project}-${Environment}-Private-Routes-AZ1'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${Project}-${Environment}-Private-Routes-AZ2'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Project}-${Environment}-SSH-SG'
      GroupDescription: 'Security group for SSH access from specific CIDR'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 203.0.113.0/24
          Description: 'SSH access from allowed CIDR'
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-SSH-SG'
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Project}-${Environment}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${CloudTrailBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref CloudTrailBucket
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Project}-${Environment}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Project}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        SecurityGroupIds:
          - !Ref SSHSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Project}-${Environment}-Instance'
              - Key: Project
                Value: !Ref Project
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Project}-${Environment}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 4
      DesiredCapacity: 2
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Project}-${Environment}-ASG'
          PropagateAtLaunch: false
        - Key: Project
          Value: !Ref Project
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  # S3 Bucket for CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Project}-${Environment}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
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
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

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
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt CloudTrailBucket.Arn
              - !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # CloudWatch Log Group
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Project}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt KMSKey.Arn

  # CloudTrail Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Project}-${Environment}-CloudTrail-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${Project}-${Environment}-CloudTrail'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref DynamoDBTableName
      BillingMode: ON_DEMAND
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Metric Filter
  UnauthorizedOperationMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricNamespace: 'CloudTrailMetrics'
          MetricName: 'UnauthorizedOperationCount'
          MetricValue: '1'
          DefaultValue: 0

  # CloudWatch Alarm
  UnauthorizedOperationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Project}-${Environment}-UnauthorizedOperations'
      AlarmDescription: 'Alarm for unauthorized operations detected in CloudTrail'
      MetricName: 'UnauthorizedOperationCount'
      Namespace: 'CloudTrailMetrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  # SNS Topic
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Project}-${Environment}-SecurityAlerts'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SNSTopic
      Endpoint: !Ref AlertEmail

  # Lambda Role
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Project}-${Environment}-Lambda-Role'
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
        - PolicyName: SNSPublishPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function
  AlertLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Project}-${Environment}-SecurityAlertHandler'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaRole.Arn
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          def lambda_handler(event, context):
              sns = boto3.client('sns')
              topic_arn = os.environ['SNS_TOPIC_ARN']
              
              # Parse the CloudWatch Alarm
              message = json.loads(event['Records'][0]['Sns']['Message'])
              
              enriched_message = {
                  'AlarmName': message['AlarmName'],
                  'AlarmDescription': message['AlarmDescription'],
                  'NewStateValue': message['NewStateValue'],
                  'NewStateReason': message['NewStateReason'],
                  'StateChangeTime': message['StateChangeTime'],
                  'Region': message['Region'],
                  'AccountId': message['AWSAccountId'],
                  'Timestamp': datetime.utcnow().isoformat(),
                  'Severity': 'HIGH',
                  'AlertType': 'SECURITY_INCIDENT'
              }
              
              subject = f"SECURITY ALERT: {message['AlarmName']}"
              
              sns.publish(
                  TopicArn=topic_arn,
                  Subject=subject,
                  Message=json.dumps(enriched_message, indent=2)
              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Alert processed successfully')
              }
      Tags:
        - Key: Project
          Value: !Ref Project
        - Key: Environment
          Value: !Ref Environment

  # Lambda Permission for SNS
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AlertLambdaFunction
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref SNSTopic

  # SNS Subscription for Lambda
  SNSLambdaSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: lambda
      TopicArn: !Ref SNSTopic
      Endpoint: !GetAtt AlertLambdaFunction.Arn

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW-ID'

  NatGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NAT-ID'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  InstanceProfileName:
    Description: 'EC2 Instance Profile Name'
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub '${AWS::StackName}-InstanceProfile-Name'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

  CloudWatchLogGroupName:
    Description: 'CloudWatch Log Group Name'
    Value: !Ref CloudTrailLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroup-Name'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  DynamoDBTableArn:
    Description: 'DynamoDB Table ARN'
    Value: !GetAtt DynamoDBTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-ARN'

  SNSTopicArn:
    Description: 'SNS Topic ARN'
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-ARN'

  LambdaFunctionName:
    Description: 'Lambda Function Name'
    Value: !Ref AlertLambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Name'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt AlertLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'
```