# CloudFormation Template for Secure and Scalable Web Access Layer

I'll create a production-ready CloudFormation YAML template that provisions all the required components for your secure and scalable web access layer.

## Architecture Overview

The solution includes:
- S3 bucket for static content with proper security
- CloudFront distribution for global content delivery
- ACM SSL certificate for HTTPS
- Route 53 DNS configuration
- CloudWatch monitoring and alarms
- IAM roles with least-privilege access

## CloudFormation Template

Here's the complete CloudFormation YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready CloudFormation template for secure and scalable web access layer with S3, CloudFront, Route 53, and CloudWatch monitoring'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Domain and SSL Configuration (Optional)'
        Parameters:
          - DomainName
          - HostedZoneId
          - CertificateArn
    ParameterLabels:
      DomainName:
        default: 'Custom Domain Name'
      HostedZoneId:
        default: 'Route 53 Hosted Zone ID'
      EnvironmentSuffix:
        default: 'Environment Suffix'
      CertificateArn:
        default: 'ACM Certificate ARN'

Parameters:
  DomainName:
    Type: String
    Description: 'Custom domain name (e.g., example.com). Leave empty to use CloudFront default domain'
    Default: ''
    AllowedPattern: '^$|^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$'
    ConstraintDescription: 'Must be a valid domain name or empty'

  HostedZoneId:
    Type: String
    Description: 'Route 53 Hosted Zone ID. Required if DomainName is provided'
    Default: ''
    AllowedPattern: '^$|^Z[A-Z0-9]+$'
    ConstraintDescription: 'Must be a valid Route 53 Hosted Zone ID or empty'

  EnvironmentSuffix:
    Type: String
    Description: 'Environment suffix (e.g., dev, staging, prod)'
    Default: 'prod'
    MinLength: 1
    MaxLength: 20
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  CertificateArn:
    Type: String
    Description: 'ARN of ACM certificate in us-east-1 (for CloudFront). Leave empty to create new (requires DomainName and HostedZoneId)'
    Default: ''
    AllowedPattern: '^$|^arn:aws:acm:us-east-1:[0-9]{12}:certificate/[a-f0-9-]+$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN in us-east-1 region or empty'

Conditions:
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]
  HasHostedZoneId: !Not [!Equals [!Ref HostedZoneId, '']]
  HasCertificateArn: !Not [!Equals [!Ref CertificateArn, '']]
  CreateCertificate: !And
    - !Condition HasDomainName
    - !Condition HasHostedZoneId
    - !Not [!Condition HasCertificateArn]
  CreateDNSRecords: !And
    - !Condition HasDomainName
    - !Condition HasHostedZoneId
  UseCertificate: !Or
    - !Condition HasCertificateArn
    - !Condition CreateCertificate

Resources:
  # S3 Buckets
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'website-content-${AWS::Region}-${EnvironmentSuffix}-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudfront-logs-${AWS::Region}-${EnvironmentSuffix}-${AWS::AccountId}'
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

  # CloudFront Configuration
  CloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub 'oac-${AWS::Region}-${EnvironmentSuffix}'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:GetObject'
            Resource: !Sub '${WebsiteBucket.Arn}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # ACM Certificate (Conditional)
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: CreateCertificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZoneId

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution for ${EnvironmentSuffix} environment'
        DefaultRootObject: index.html
        HttpVersion: http2and3
        IPV6Enabled: true
        PriceClass: PriceClass_100

        Aliases: !If
          - HasDomainName
          - - !Ref DomainName
            - !Sub 'www.${DomainName}'
          - !Ref AWS::NoValue

        ViewerCertificate: !If
          - UseCertificate
          - AcmCertificateArn: !If
              - HasCertificateArn
              - !Ref CertificateArn
              - !Ref SSLCertificate
            SslSupportMethod: sni-only
            MinimumProtocolVersion: TLSv1.2_2021
          - CloudFrontDefaultCertificate: true

        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            OriginAccessControlId: !Ref CloudFrontOAC
            S3OriginConfig: {}

        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf
          ResponseHeadersPolicyId: 67f7725c-6f97-4210-82d7-5512b31e9d03

        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 404
            ResponsePagePath: /404.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /404.html
            ErrorCachingMinTTL: 300

        Logging:
          Bucket: !GetAtt LogsBucket.DomainName
          Prefix: cloudfront/
          IncludeCookies: false

  # Route 53 DNS Records (Conditional)
  DNSRecordIPv4:
    Type: AWS::Route53::RecordSet
    Condition: CreateDNSRecords
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2
        EvaluateTargetHealth: false

  DNSRecordIPv6:
    Type: AWS::Route53::RecordSet
    Condition: CreateDNSRecords
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: AAAA
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2
        EvaluateTargetHealth: false

  # IAM Roles
  CloudWatchMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - cloudwatch.amazonaws.com
                - lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub 'monitoring-policy-${AWS::Region}-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudfront:GetDistribution'
                  - 'cloudfront:GetDistributionConfig'
                  - 'cloudfront:ListDistributions'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt WebsiteBucket.Arn
                  - !GetAtt LogsBucket.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'cloudwatch:GetMetricData'
                Resource: '*'

  # CloudWatch Alarms
  CloudFront4xxErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'cloudfront-4xx-errors-${AWS::Region}-${EnvironmentSuffix}'
      AlarmDescription: 'Triggers when CloudFront 4xx error rate exceeds 5%'
      MetricName: 4xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref CloudFrontDistribution

  CloudFront5xxErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'cloudfront-5xx-errors-${AWS::Region}-${EnvironmentSuffix}'
      AlarmDescription: 'Triggers when CloudFront 5xx error rate exceeds 1%'
      MetricName: 5xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref CloudFrontDistribution

  CloudFrontCacheHitRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'cloudfront-cache-hit-rate-${AWS::Region}-${EnvironmentSuffix}'
      AlarmDescription: 'Triggers when cache hit rate falls below 70%'
      MetricName: CacheHitRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref CloudFrontDistribution

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'website-monitoring-${AWS::Region}-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/CloudFront", "Requests", "DistributionId", "${CloudFrontDistribution}"]
                ],
                "view": "timeSeries",
                "region": "us-east-1",
                "title": "CloudFront Requests"
              }
            }
          ]
        }

Outputs:
  CloudFrontDistributionURL:
    Description: 'CloudFront distribution domain name (HTTPS URL)'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontURL'

  WebsiteBucketName:
    Description: 'S3 bucket name for uploading website content'
    Value: !Ref WebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteBucket'

  CloudWatchDashboardURL:
    Description: 'CloudWatch Dashboard URL for monitoring'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${MonitoringDashboard}'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardURL'

  WebsiteURL:
    Description: 'Primary website URL'
    Value: !If
      - HasDomainName
      - !Sub 'https://${DomainName}'
      - !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteURL'
```

## Key Features

1. **Security**: S3 buckets have public access blocked and use Origin Access Control (OAC) for CloudFront access only
2. **SSL/TLS**: Automatic ACM certificate creation with DNS validation
3. **Global Delivery**: CloudFront distribution with optimized caching policies
4. **Monitoring**: CloudWatch alarms for error rates, cache hit rate, and request counts
5. **Flexibility**: Parameterized for different environments and optional custom domain
6. **Best Practices**: IAM roles with least-privilege access, encryption, lifecycle policies

## Usage

Deploy with custom domain:
```bash
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name website-stack \
  --parameter-overrides \
    DomainName=example.com \
    HostedZoneId=Z1234567890ABC \
    EnvironmentSuffix=prod
```

Deploy without custom domain (uses CloudFront URL):
```bash
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name website-stack \
  --parameter-overrides \
    EnvironmentSuffix=dev
```