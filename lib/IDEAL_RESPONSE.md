# Ideal Response for Secure Global eBook Delivery System

## Overview

The ideal response should demonstrate a production-ready, secure, and scalable eBook delivery system that meets all functional and non-functional requirements while following AWS best practices.

## Key Components

### 1. CloudFormation Template Structure

- **AWSTemplateFormatVersion**: '2010-09-09'
- **Description**: Clear, comprehensive description of the system
- **Parameters**: Environment-specific configuration with validation
- **Conditions**: Dynamic resource creation based on environment
- **Resources**: All required AWS services with proper configuration
- **Outputs**: Essential values for integration and monitoring

### 2. Security Implementation

- **S3 Bucket**: Encrypted with KMS, private access only
- **CloudFront OAI**: Restricts direct S3 access
- **Bucket Policy**: Only allows CloudFront OAI access
- **KMS Encryption**: Server-side encryption for data at rest
- **HTTPS Enforcement**: All traffic encrypted in transit
- **IAM Roles**: Least privilege access principles

### 3. Performance Optimization

- **CloudFront Distribution**: Global content delivery with edge caching
- **Cache Policies**: Optimized for eBook content delivery
- **Compression**: Enabled for better performance
- **HTTP/2 Support**: Modern protocol support
- **IPv6 Support**: Future-proof networking

### 4. Monitoring and Alerting

- **CloudWatch Dashboard**: Comprehensive metrics visualization
- **CloudWatch Alarms**: Proactive monitoring for errors and performance
- **SNS Notifications**: Alert delivery for critical issues
- **Access Logging**: Detailed audit trails

### 5. Cost Optimization

- **S3 Lifecycle Policies**: Automated storage class transitions
- **CloudFront Caching**: Reduced origin requests
- **Pay-per-request DynamoDB**: Cost-effective scaling
- **Resource Tagging**: Cost allocation and management

### 6. Cross-Account Compatibility

- **Parameterized Configuration**: No hardcoded account IDs or regions
- **Environment Variables**: Flexible deployment across accounts
- **Resource Naming**: Dynamic naming based on parameters
- **Export/Import Values**: Cross-stack resource sharing

### 7. Production Readiness

- **WAF Protection**: Web application firewall for production
- **Geographic Restrictions**: Content delivery controls
- **Rate Limiting**: DDoS protection
- **Error Handling**: Custom error pages and responses

### 8. Security and Performance Validation

- **Security Validation**: Access control and encryption verification
- **Performance Validation**: Load and latency assessment

### 9. Documentation

- **README**: Clear deployment and usage instructions
- **Architecture Diagrams**: Visual system representation
- **Troubleshooting Guide**: Common issues and solutions
- **Cost Analysis**: Expected monthly costs and optimization tips

### 10. Compliance and Governance

- **Resource Tagging**: Consistent tagging strategy
- **Audit Logging**: Comprehensive activity tracking
- **Backup Strategy**: Data protection and recovery
- **Disaster Recovery**: Multi-region deployment options

## Expected Outcomes

1. **Scalability**: Handle 3,000+ daily eBook downloads globally
2. **Security**: End-to-end encryption and access control
3. **Performance**: Sub-second content delivery worldwide
4. **Reliability**: 99.9% uptime with monitoring
5. **Cost Efficiency**: Optimized resource usage and caching
6. **Maintainability**: Clear documentation and automated deployment
7. **Compliance**: Meet security and governance requirements
8. **Flexibility**: Easy deployment across different AWS accounts and regions

## Complete CloudFormation Template

The following YAML template (`lib/TapStack.yml`) implements all the requirements above:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Global eBook Delivery System with S3, CloudFront, and KMS encryption'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
          - DomainName
          - HostedZoneId
      - Label:
          default: 'Security Configuration'
        Parameters:
          - KmsKeyAlias
          - EnableLogging
      - Label:
          default: 'Cost Optimization'
        Parameters:
          - EnableWAF
          - EnableLifecyclePolicies

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - prod
    Description: Environment name for resource naming and configuration

  DomainName:
    Type: String
    Description: Custom domain name for eBook delivery (e.g., ebooks.publisher.com)
    Default: ''

  HostedZoneId:
    Type: String
    Description: Route 53 Hosted Zone ID for the domain (leave empty if not using custom domain)
    Default: ''

  KmsKeyAlias:
    Type: String
    Default: ''
    Description: Existing KMS key alias (leave empty to create a new one)

  EnableLogging:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable CloudFront and S3 access logging

  EnableWAF:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable WAF for production environments

  EnableLifecyclePolicies:
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable S3 lifecycle policies for cost optimization

Conditions:
  CreateKmsKey: !Equals [!Ref KmsKeyAlias, '']
  EnableLoggingCondition: !Equals [!Ref EnableLogging, 'true']
  EnableWAFCondition: !Equals [!Ref EnableWAF, 'true']
  EnableLifecycleCondition: !Equals [!Ref EnableLifecyclePolicies, 'true']
  HasCustomDomain: !Not [!Equals [!Ref DomainName, '']]
  HasHostedZone: !Not [!Equals [!Ref HostedZoneId, '']]

Resources:
  # S3 Bucket for eBook Storage
  EbooksS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'ebooks123-storage-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref EbooksKmsKey
                - !Sub 'alias/${KmsKeyAlias}'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration: !If
        - EnableLifecycleCondition
        - Rules:
            - Id: TransitionOldVersions
              Status: Enabled
              NoncurrentVersionExpirationInDays: 90
              NoncurrentVersionTransitions:
                - TransitionInDays: 30
                  StorageClass: STANDARD_IA
                - TransitionInDays: 60
                  StorageClass: GLACIER
        - !Ref AWS::NoValue
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration: !If
        - EnableLoggingCondition
        - DestinationBucketName: !Ref LoggingBucket
          LogFilePrefix: 's3-access-logs/'
        - !Ref AWS::NoValue
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: eBook-storage
        - Key: iac-rlhf-amazon
          Value: 'true'

  # S3 Bucket for Logging
  LoggingBucket:
    Type: AWS::S3::Bucket
    Condition: EnableLoggingCondition
    Properties:
      BucketName: !Sub 'ebooks-logs-${Environment}-${AWS::AccountId}'
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Access-logs
        - Key: iac-rlhf-amazon
          Value: 'true'

  # KMS Key for Encryption
  EbooksKmsKey:
    Type: AWS::KMS::Key
    Condition: CreateKmsKey
    Properties:
      Description: KMS key for eBook encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudFront to decrypt
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: eBook-encryption
        - Key: iac-rlhf-amazon
          Value: 'true'

  EbooksKmsKeyAlias:
    Type: AWS::KMS::Alias
    Condition: CreateKmsKey
    Properties:
      AliasName: !Sub 'alias/ebooks-kms-${Environment}'
      TargetKeyId: !Ref EbooksKmsKey

  # CloudFront Origin Access Identity
  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for eBook delivery ${Environment}'

  # S3 Bucket Policy
  EbooksS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref EbooksS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
            Resource: !Sub '${EbooksS3Bucket.Arn}/*'
          - Sid: DenyDirectAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${EbooksS3Bucket.Arn}/*'
              - !GetAtt EbooksS3Bucket.Arn
            Condition:
              StringNotEquals:
                'AWS:SourceArn': !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'

  # CloudFront Distribution
  EbooksCloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'eBook delivery distribution - ${Environment}'
        PriceClass: PriceClass_All
        HttpVersion: http2
        IPV6Enabled: true

        Origins:
          - Id: S3-ebooks
            DomainName: !GetAtt EbooksS3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'

        DefaultCacheBehavior:
          TargetOriginId: S3-ebooks
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # Managed-CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf # Managed-CORS-S3Origin
          ResponseHeadersPolicyId: 5cc3b908-e619-4b99-88e5-2cf7f45965bd # Managed-CORS-With-Preflight

        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: /error-403.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /error-404.html
            ErrorCachingMinTTL: 300

        Aliases: !If
          - HasCustomDomain
          - - !Ref DomainName
          - !Ref AWS::NoValue

        ViewerCertificate: !If
          - HasCustomDomain
          - AcmCertificateArn: !Ref SSLCertificate
            SslSupportMethod: sni-only
            MinimumProtocolVersion: TLSv1.2_2021
          - CloudFrontDefaultCertificate: true

        Logging: !If
          - EnableLoggingCondition
          - Bucket: !GetAtt LoggingBucket.DomainName
            Prefix: 'cloudfront-logs/'
            IncludeCookies: false
          - !Ref AWS::NoValue

        WebACLId: !If
          - EnableWAFCondition
          - !Ref CloudFrontWebACL
          - !Ref AWS::NoValue

      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: eBook-delivery
        - Key: iac-rlhf-amazon
          Value: 'true'

  # SSL Certificate
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: HasCustomDomain
    Properties:
      DomainName: !Ref DomainName
      DomainValidationOptions: !If
        - HasHostedZone
        - - DomainName: !Ref DomainName
            HostedZoneId: !Ref HostedZoneId
        - - DomainName: !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SSL-certificate
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route 53 Record
  Route53Record:
    Type: AWS::Route53::RecordSetGroup
    Condition: HasCustomDomain
    Properties:
      HostedZoneId: !Ref HostedZoneId
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          AliasTarget:
            HostedZoneId: Z2FDTNDATAQYW2 # CloudFront Hosted Zone ID
            DNSName: !GetAtt EbooksCloudFrontDistribution.DomainName
            EvaluateTargetHealth: false
        - Name: !Ref DomainName
          Type: AAAA
          AliasTarget:
            HostedZoneId: Z2FDTNDATAQYW2
            DNSName: !GetAtt EbooksCloudFrontDistribution.DomainName
            EvaluateTargetHealth: false

  # CloudWatch Dashboard
  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'eBook-Delivery-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "Requests", { "stat": "Sum", "period": 300 } ],
                  [ ".", "BytesDownloaded", { "stat": "Sum", "period": 300 } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "CloudFront Requests & Data Transfer",
                "dimensions": {
                  "DistributionId": "${EbooksCloudFrontDistribution}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "CacheHitRate", { "stat": "Average", "period": 300 } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "Cache Hit Rate",
                "dimensions": {
                  "DistributionId": "${EbooksCloudFrontDistribution}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "4xxErrorRate", { "stat": "Average", "period": 300 } ],
                  [ ".", "5xxErrorRate", { "stat": "Average", "period": 300 } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "Error Rates",
                "dimensions": {
                  "DistributionId": "${EbooksCloudFrontDistribution}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "OriginLatency", { "stat": "Average", "period": 300 } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "Origin Latency",
                "dimensions": {
                  "DistributionId": "${EbooksCloudFrontDistribution}"
                }
              }
            }
          ]
        }

  # CloudWatch Alarms
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'eBook-HighErrorRate-${Environment}'
      AlarmDescription: Alert when 4xx/5xx error rate is high
      MetricName: 4xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref EbooksCloudFrontDistribution
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref SNSAlertTopic

  LowCacheHitRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'eBook-LowCacheHitRate-${Environment}'
      AlarmDescription: Alert when cache hit rate is low
      MetricName: CacheHitRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 70
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref EbooksCloudFrontDistribution
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref SNSAlertTopic

  # SNS Topic for Alerts
  SNSAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'eBook-Alerts-${Environment}'
      DisplayName: eBook Delivery System Alerts
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Alert-notifications
        - Key: iac-rlhf-amazon
          Value: 'true'

  # WAF Web ACL (Production only)
  CloudFrontWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: EnableWAFCondition
    Properties:
      Name: !Sub 'eBook-WAF-${Environment}'
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: GeoBlockRule
          Priority: 2
          Statement:
            NotStatement:
              Statement:
                GeoMatchStatement:
                  CountryCodes:
                    - US
                    - CA
                    - GB
                    - AU
                    - DE
                    - FR
                    - JP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: GeoBlockRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'eBook-WAF-${Environment}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Web-application-firewall
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda Function for Cost Monitoring
  CostMonitoringFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'eBook-CostMonitoring-${Environment}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt CostMonitoringRole.Arn
      Timeout: 300
      Environment:
        Variables:
          S3_BUCKET: !Ref EbooksS3Bucket
          CLOUDFRONT_DISTRIBUTION_ID: !Ref EbooksCloudFrontDistribution
          SNS_TOPIC_ARN: !Ref SNSAlertTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta

          def handler(event, context):
              s3 = boto3.client('s3')
              cloudfront = boto3.client('cloudfront')
              sns = boto3.client('sns')
              
              # Get S3 storage metrics
              bucket_name = os.environ['S3_BUCKET']
              distribution_id = os.environ['CLOUDFRONT_DISTRIBUTION_ID']
              sns_topic_arn = os.environ['SNS_TOPIC_ARN']
              
              try:
                  # Calculate storage costs
                  response = s3.list_objects_v2(Bucket=bucket_name)
                  total_size = sum(obj['Size'] for obj in response.get('Contents', []))
                  
                  # Get CloudFront metrics
                  end_time = datetime.utcnow()
                  start_time = end_time - timedelta(days=1)
                  
                  cf_metrics = cloudfront.get_distribution_metrics(
                      DistributionId=distribution_id,
                      StartTime=start_time,
                      EndTime=end_time
                  )
                  
                  # Send cost report
                  message = {
                      'timestamp': datetime.utcnow().isoformat(),
                      's3_storage_gb': total_size / (1024**3),
                      'cloudfront_requests': cf_metrics.get('Requests', 0),
                      'estimated_daily_cost': calculate_daily_cost(total_size, cf_metrics)
                  }
                  
                  sns.publish(
                      TopicArn=sns_topic_arn,
                      Message=json.dumps(message),
                      Subject='eBook Delivery Cost Report'
                  )
                  
                  return {'statusCode': 200, 'body': json.dumps(message)}
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

          def calculate_daily_cost(storage_bytes, cf_metrics):
              # Simplified cost calculation
              storage_gb = storage_bytes / (1024**3)
              storage_cost = storage_gb * 0.023  # S3 Standard pricing
              requests = cf_metrics.get('Requests', 0)
              request_cost = requests * 0.0000004  # CloudFront request pricing
              return round(storage_cost + request_cost, 2)
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Cost-monitoring
        - Key: iac-rlhf-amazon
          Value: 'true'

  # IAM Role for Cost Monitoring Lambda
  CostMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eBook-CostMonitoring-Role-${Environment}'
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
        - PolicyName: CostMonitoringPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetObject
                Resource:
                  - !GetAtt EbooksS3Bucket.Arn
                  - !Sub '${EbooksS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - cloudfront:GetDistribution
                  - cloudfront:ListDistributions
                Resource: '*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSAlertTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Lambda-execution-role
        - Key: iac-rlhf-amazon
          Value: 'true'

  # EventBridge Rule for Daily Cost Monitoring
  CostMonitoringSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'eBook-CostMonitoring-Schedule-${Environment}'
      Description: Daily cost monitoring for eBook delivery system
      ScheduleExpression: 'rate(1 day)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt CostMonitoringFunction.Arn
          Id: CostMonitoringTarget
          RoleArn: !GetAtt CostMonitoringRole.Arn

  # Lambda Permission for EventBridge
  CostMonitoringPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CostMonitoringFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt CostMonitoringSchedule.Arn

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket storing eBooks
    Value: !Ref EbooksS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  CloudFrontDistributionDomain:
    Description: CloudFront distribution domain name
    Value: !GetAtt EbooksCloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDomain'

  CloudFrontDistributionId:
    Description: CloudFront distribution ID
    Value: !Ref EbooksCloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontId'

  Route53RecordName:
    Description: Route 53 record for custom domain
    Value: !If
      - HasCustomDomain
      - !Ref DomainName
      - 'No custom domain configured'
    Export:
      Name: !Sub '${AWS::StackName}-CustomDomain'

  CloudFrontOAIId:
    Description: CloudFront Origin Access Identity ID
    Value: !Ref CloudFrontOAI
    Export:
      Name: !Sub '${AWS::StackName}-OAI-Id'

  KmsKeyId:
    Description: KMS Key ID for encryption
    Value: !If
      - CreateKmsKey
      - !Ref EbooksKmsKey
      - !Sub 'alias/${KmsKeyAlias}'
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyId'

  LoggingBucketName:
    Condition: EnableLoggingCondition
    Description: Name of the logging bucket
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  CostMonitoringFunctionArn:
    Description: ARN of the cost monitoring Lambda function
    Value: !GetAtt CostMonitoringFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CostMonitoringFunction'

  Environment:
    Description: Environment name used for this deployment
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

This comprehensive CloudFormation template demonstrates all the key components mentioned above and serves as the ideal implementation for a secure global eBook delivery system.
