I'll create a comprehensive CloudFormation template that addresses all your security requirements. This template will establish a secure foundation for your multi-account AWS setup.

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
    Description: 'Email address for security alerts'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'

Resources:
  # KMS Key for S3 Encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
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
      AliasName: !Sub 'alias/${ProjectName}-s3-encryption'
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
          Value: !Sub '${ProjectName}-vpc'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.101.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.102.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'

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
          Value: !Sub '${ProjectName}-public-rt'

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
      GroupName: !Sub '${ProjectName}-web-sg'
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
          Value: !Sub '${ProjectName}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-db-sg'
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
          Value: !Sub '${ProjectName}-db-sg'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ec2-role'
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
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3EncryptionKey.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-ec2-profile'
      Roles:
        - !Ref EC2Role

  APIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-apigateway-role'
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
    Properties:
      BucketName: !Sub '${ProjectName}-secure-bucket-${AWS::AccountId}'
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
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-logging-bucket-${AWS::AccountId}'
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
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${AWS::AccountId}'
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
      TrailName: !Sub '${ProjectName}-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::IAM::Role
              Values:
                - 'arn:aws:iam::*:role/*'
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket}/*'

  # CloudWatch Log Groups
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}'
      RetentionInDays: 30

  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}'
      RetentionInDays: 30

  # SNS Topic for Security Alerts
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-security-alerts'
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
      AlarmName: !Sub '${ProjectName}-unauthorized-access'
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
          Value: !Sub '${ProjectName}-api'

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-root-account-usage'
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
      Name: !Sub '${ProjectName}-api'
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

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
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

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-vpc-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-private-subnet-2-id'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-web-sg-id'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-db-sg-id'

  S3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ProjectName}-s3-bucket-name'

  KMSKeyId:
    Description: 'KMS Key ID for S3 Encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${ProjectName}-kms-key-id'

  APIGatewayURL:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${APIGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${ProjectName}-api-url'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${ProjectName}-ec2-instance-profile-arn'
```

## Key Security Features Implemented

### **IAM Roles & Least Privilege**

- **EC2 Role**: Minimal permissions for S3 access and CloudWatch logging
- **API Gateway Role**: Limited to CloudWatch logs only
- **Instance Profile**: Secure attachment for EC2 instances

### **S3 Encryption**

- **KMS Encryption**: Custom KMS key for all S3 buckets
- **Bucket Policies**: Block all public access
- **Versioning**: Enabled for data protection
- **Access Logging**: Comprehensive audit trail

### **CloudTrail Logging**

- **Multi-region**: Captures events across all regions
- **IAM Focus**: Specifically monitors IAM role activities
- **Log Validation**: Ensures log integrity
- **S3 Integration**: Secure storage with encryption

### **API Gateway Security**

- **HTTPS Only**: Policy enforces secure transport
- **Access Logging**: Detailed request/response logging
- **Regional Endpoint**: Better security than edge-optimized
- **Metrics & Tracing**: Full observability enabled

### **Security Groups**

- **Restrictive Ingress**: Only from trusted IP ranges
- **Minimal Egress**: HTTPS outbound only for web tier
- **Layered Security**: Separate groups for web and database tiers

### **VPC Configuration**

- **Private Subnets**: Database and application tiers isolated
- **Public Subnets**: Only for load balancers and NAT gateways
- **Multi-AZ**: High availability across availability zones

### **Security Monitoring**

- **CloudWatch Alarms**: Unauthorized access detection
- **Root Account Monitoring**: Alerts on root account usage
- **SNS Integration**: Email notifications for security events
- **Metric Filters**: Custom security metrics

## Validation & Deployment

To validate this template:

```bash
# Install cfn-lint
pip install cfn-lint

# Validate the template
cfn-lint secure-aws-template.yaml

# Deploy the template
aws cloudformation create-stack \
  --stack-name project-x-security \
  --template-body file://secure-aws-template.yaml \
  --parameters ParameterKey=NotificationEmail,ParameterValue=security@yourcompany.com \
  --capabilities CAPABILITY_NAMED_IAM
```

## Multi-Account Considerations

For your multi-account setup, consider:

1. **Deploy this template in each account** as a foundation
2. **Use AWS Organizations SCPs** to enforce these security policies
3. **Centralize logging** to a dedicated security account
4. **Cross-account roles** for centralized monitoring
5. **AWS Config** for compliance monitoring across accounts

This template provides a solid security foundation that can be extended based on your specific application requirements while maintaining the principle of least privilege and defense in depth.
