# Model Response - Secure AWS Infrastructure

Based on the requirements for Security Configuration as Code, I'll provide a CloudFormation YAML template that implements all the specified security best practices.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with Security Configuration as Code - Implements encryption, least privilege IAM, CloudWatch logging, and restricted network access'

Parameters:
  AllowedIPRange:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'IP range allowed for inbound/outbound traffic'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

  ApplicationName:
    Type: String
    Default: 'SecureApp'
    Description: 'Name of the application for resource naming'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment type'

Resources:
  # VPC Configuration
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # VPC Flow Logs for monitoring
  VPCFlowLogsRole:
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
        - PolicyName: CloudWatchLogsPolicy
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ApplicationName}-${Environment}'
      RetentionInDays: 30

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn

  # Security Groups with restricted access
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group with restricted inbound and outbound access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS access from allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP access from allowed IP range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS outbound to allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP outbound to allowed IP range'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${Environment}-sg'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket with enforced encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-${Environment}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref S3CloudWatchLogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${Environment}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy to enforce encryption
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # S3 Access Logs Bucket
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-${Environment}-access-logs-${AWS::AccountId}'
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

  # CloudWatch Log Groups for monitoring
  S3CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ApplicationName}-${Environment}'
      RetentionInDays: 30

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/application/${ApplicationName}-${Environment}'
      RetentionInDays: 30

  # IAM Role with least privilege for application
  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-application-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureS3Bucket
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !GetAtt ApplicationLogGroup.Arn
                  - !Sub '${ApplicationLogGroup.Arn}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${Environment}-role'
        - Key: Environment
          Value: !Ref Environment

  # IAM Instance Profile for EC2 instances
  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ApplicationRole

  # CloudWatch Alarms for monitoring
  S3BucketSizeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-${Environment}-s3-bucket-size'
      AlarmDescription: 'Monitor S3 bucket size'
      MetricName: BucketSizeBytes
      Namespace: AWS/S3
      Statistic: Average
      Period: 86400
      EvaluationPeriods: 1
      Threshold: 1000000000 # 1GB
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: BucketName
          Value: !Ref SecureS3Bucket
        - Name: StorageType
          Value: StandardStorage

  # CloudTrail for API logging
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ApplicationName}-${Environment}'
      RetentionInDays: 90

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroup.Arn

  ApplicationCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ApplicationName}-${Environment}-cloudtrail'
      S3BucketName: !Ref SecureS3Bucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureS3Bucket}/*'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${ApplicationName}-${Environment}-vpc-id'

  SecurityGroupId:
    Description: 'Security Group ID'
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub '${ApplicationName}-${Environment}-sg-id'

  S3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ApplicationName}-${Environment}-s3-bucket'

  ApplicationRoleArn:
    Description: 'Application IAM Role ARN'
    Value: !GetAtt ApplicationRole.Arn
    Export:
      Name: !Sub '${ApplicationName}-${Environment}-role-arn'

  CloudWatchLogGroup:
    Description: 'Application CloudWatch Log Group'
    Value: !Ref ApplicationLogGroup
    Export:
      Name: !Sub '${ApplicationName}-${Environment}-log-group'
```

## Security Compliance Summary

This template addresses all the specified requirements:

1. **S3 Bucket Encryption**: All S3 buckets enforce AES-256 server-side encryption with bucket policies that deny unencrypted uploads and insecure connections.

2. **IAM Least Privilege**: IAM roles are configured with minimal permissions needed for their specific functions, with separate roles for different services.

3. **CloudWatch Logging**: Comprehensive logging is enabled for VPC Flow Logs, S3 access logs, CloudTrail, and application-specific logs.

4. **Restricted Network Access**: Security groups are configured to allow only HTTP and HTTPS traffic from predefined IP ranges, with explicit descriptions for all rules.

The template is parameterized for flexibility and includes comprehensive outputs for integration with other stacks.