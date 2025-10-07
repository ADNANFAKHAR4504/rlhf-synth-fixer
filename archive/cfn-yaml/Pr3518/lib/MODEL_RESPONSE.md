AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Global eBook Delivery System with S3, CloudFront, and KMS encryption'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - prod
    Description: Environment name

  DomainName:
    Type: String
    Description: Custom domain name for eBook delivery (e.g., ebooks.publisher.com)

  HostedZoneId:
    Type: AWS::Route53::HostedZone::Id
    Description: Route 53 Hosted Zone ID for the domain

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

Conditions:
  CreateKmsKey: !Equals [ !Ref KmsKeyAlias, '' ]
  EnableLoggingCondition: !Equals [ !Ref EnableLogging, 'true' ]

Resources:
  # S3 Bucket for eBook Storage
  EbooksS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'ebooks-storage-${Environment}-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: TransitionOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 60
                StorageClass: GLACIER
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
      AccessControl: LogDeliveryWrite

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
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
          ResponseHeadersPolicyId: 5cc3b908-e619-4b99-88e5-2cf7f45965bd  # Managed-CORS-With-Preflight
          
        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: /error-403.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /error-404.html
            ErrorCachingMinTTL: 300
            
        Aliases:
          - !Ref DomainName
          
        ViewerCertificate:
          AcmCertificateArn: !Ref SSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
          
        Logging: !If
          - EnableLoggingCondition
          - Bucket: !GetAtt LoggingBucket.DomainName
            Prefix: 'cloudfront-logs/'
            IncludeCookies: false
          - !Ref AWS::NoValue
            
        WebACLId: !If
          - IsProd
          - !Ref CloudFrontWebACL
          - !Ref AWS::NoValue
          
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # SSL Certificate
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZoneId
      ValidationMethod: DNS
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Route 53 Record
  Route53Record:
    Type: AWS::Route53::RecordSetGroup
    Properties:
      HostedZoneId: !Ref HostedZoneId
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          AliasTarget:
            HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
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

  # WAF Web ACL (Production only)
  CloudFrontWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: IsProd
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

Conditions:
  IsProd: !Equals [ !Ref Environment, 'prod' ]

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
    Value: !Ref DomainName
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