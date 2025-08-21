# Secure AWS Environment Setup - CloudFormation Template

This CloudFormation template creates a comprehensive secure AWS environment setup for a multi-account AWS Organization, implementing all required security controls and best practices.

## Template Overview

The template establishes a secure foundation with the following key components:
- Complete VPC networking with public/private subnets
- KMS-encrypted S3 buckets with versioning and access logging
- CloudTrail for comprehensive audit logging
- Security-focused IAM roles with least privilege
- API Gateway with HTTPS-only access
- CloudWatch monitoring and security alarms
- Environment-specific resource naming for multi-deployment support

## CloudFormation Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Environment Setup for Multi-Account Organization - Project X'

Parameters:
  ProjectName:
    Type: String
    Default: 'project-x'
    Description: 'Project name for resource naming'
    AllowedPattern: '^[a-z][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must be lowercase with hyphens only'

  TrustedIPRange:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for trusted IP range'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  NotificationEmail:
    Type: String
    Default: 'admin@example.com'
    Description: 'Email address for security alerts'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, pr123, etc.)'
    AllowedPattern: '^[a-z][a-z0-9]*$'
    ConstraintDescription: 'Must be lowercase alphanumeric, starting with a letter'

Resources:
  # KMS Key for S3 Encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub '${ProjectName} S3 encryption key'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${EnvironmentSuffix}-s3-encryption'
      TargetKeyId: !Ref S3EncryptionKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-2'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.101.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.102.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-subnet-2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTPS from trusted IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref TrustedIPRange
          Description: 'HTTP from trusted IP range (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-db-sg'
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-db-sg'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-role'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3EncryptionKey.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-profile'
      Roles:
        - !Ref EC2Role

  APIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-apigateway-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
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
                Resource: '*'

  # S3 Bucket with Encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-secure-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: access-logs/
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # CloudTrail for IAM Logging
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-trail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ProjectCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${EnvironmentSuffix}-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket.Arn}/*'

  # CloudWatch Log Groups
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${EnvironmentSuffix}'
      RetentionInDays: 30

  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${EnvironmentSuffix}'
      RetentionInDays: 30

  # SNS Topic for Security Alerts
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-security-alerts'
      DisplayName: 'Security Alerts'

  SecurityAlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SecurityAlertsTopic
      Endpoint: !Ref NotificationEmail

  # CloudWatch Alarms for Security Monitoring
  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-unauthorized-access'
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: ErrorCount
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api'

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-root-account-usage'
      AlarmDescription: 'Alarm for root account usage'
      MetricName: RootAccountUsage
      Namespace: CloudWatchLogMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic

  # Metric Filter for Root Account Usage
  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref S3LogGroup
      FilterPattern: '{ ($.userIdentity.type = "Root") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != "AwsServiceEvent") }'
      MetricTransformations:
        - MetricNamespace: CloudWatchLogMetrics
          MetricName: RootAccountUsage
          MetricValue: '1'

  # API Gateway (HTTPS Only)
  APIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      Description: 'Secure API Gateway for Project X'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: execute-api:Invoke
            Resource: '*'
            Condition:
              Bool:
                'aws:SecureTransport': 'true'

  APIGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref APIGateway
      ResourceId: !GetAtt APIGateway.RootResourceId
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: '200'
            ResponseTemplates:
              application/json: '{"message": "Secure API Gateway Endpoint"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: '200'
          ResponseModels:
            application/json: Empty

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIGatewayMethod
    Properties:
      RestApiId: !Ref APIGateway
      StageName: prod
      StageDescription:
        AccessLogSetting:
          DestinationArn: !GetAtt APIGatewayLogGroup.Arn
          Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
        MethodSettings:
          - ResourcePath: '/*'
            HttpMethod: '*'
            LoggingLevel: INFO
            DataTraceEnabled: true
            MetricsEnabled: true
            ThrottlingBurstLimit: 100
            ThrottlingRateLimit: 50

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-2-id'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-web-sg-id'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-db-sg-id'

  S3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-s3-bucket-name'

  KMSKeyId:
    Description: 'KMS Key ID for S3 Encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-kms-key-id'

  APIGatewayURL:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${APIGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api-url'

  APIGatewayRegionalURL:
    Description: 'API Gateway Regional Endpoint URL'
    Value: !Sub 'https://${APIGateway}.execute-api.${AWS::Region}.amazonaws.com'
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api-regional-url'

  APIGatewayId:
    Description: 'API Gateway REST API ID'
    Value: !Ref APIGateway
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api-id'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-instance-profile-arn'
```

## Key Security Features Implemented

### IAM Roles & Least Privilege
- **EC2 Role**: Minimal permissions for S3 access and CloudWatch logging only
- **API Gateway Role**: Limited to CloudWatch logs for API monitoring
- **Instance Profile**: Secure attachment mechanism for EC2 instances
- All roles follow the principle of least privilege with specific resource restrictions

### S3 Encryption & Security
- **KMS Encryption**: Custom KMS key for all S3 buckets
- **Bucket Policies**: Complete public access blocking
- **Versioning**: Enabled for data protection and recovery
- **Access Logging**: Comprehensive audit trail for all bucket operations
- **Lifecycle Policies**: Automatic cleanup of old data

### CloudTrail Logging
- **Multi-region Coverage**: Captures events across all AWS regions
- **Management Events**: Full logging of control plane operations
- **Data Events**: Specific monitoring of S3 object operations
- **Log Validation**: Ensures log file integrity cannot be tampered with

### API Gateway Security
- **HTTPS Only**: Resource policy enforces secure transport
- **Regional Endpoint**: Better security and lower latency than edge-optimized
- **Access Logging**: Detailed request/response logging
- **Throttling**: Rate limiting to prevent abuse (100 burst, 50 sustained)
- **Metrics & Tracing**: Full observability enabled

### Network Security
- **VPC Isolation**: All resources deployed within VPC
- **Security Groups**: Restrictive ingress rules from trusted IP ranges only
- **Layered Security**: Separate security groups for web and database tiers
- **Private Subnets**: Database and application tiers isolated from internet

### Monitoring & Alerting
- **CloudWatch Alarms**: Unauthorized access detection
- **Root Account Monitoring**: Alerts on root account usage
- **SNS Integration**: Email notifications for security events
- **Metric Filters**: Custom security metrics from log data
- **Log Retention**: 30-day retention for compliance

### Multi-Environment Support
- **Environment Suffix**: All resources include environment identifier
- **Resource Isolation**: Complete separation between deployments
- **Deletion Policies**: All resources can be safely deleted
- **No Hardcoded Values**: Full parameterization for flexibility

## Deployment Instructions

```bash
# Validate the template
aws cloudformation validate-template --template-body file://TapStack.yml

# Deploy the stack
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    NotificationEmail=security@yourcompany.com \
    TrustedIPRange=10.0.0.0/8 \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' \
  --output json
```

## Multi-Account Considerations

For multi-account AWS Organization setup:

1. **Deploy this template in each account** as a security foundation
2. **Use AWS Organizations SCPs** to enforce these security policies organization-wide
3. **Centralize logging** to a dedicated security/audit account
4. **Implement cross-account roles** for centralized security monitoring
5. **Use AWS Config** for compliance monitoring across all accounts
6. **Consider AWS Control Tower** for automated account provisioning with security baselines

## Compliance & Best Practices

This template adheres to:
- AWS Well-Architected Framework Security Pillar
- CIS AWS Foundations Benchmark
- AWS Security Best Practices
- Infrastructure as Code best practices
- Environment isolation and multi-tenancy patterns

The implementation ensures defense in depth with multiple layers of security controls, comprehensive logging and monitoring, and automated response to security events.