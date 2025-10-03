# CloudFormation Infrastructure for Static Website

Here's the complete CloudFormation template for your static website hosting solution:

## Main Stack Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Static Website Infrastructure with S3, CloudFront, Route53, and CloudWatch Monitoring'

Parameters:
  DomainName:
    Type: String
    Description: The domain name for the website (e.g., example.com)
    Default: example.com

  SubDomain:
    Type: String
    Description: The subdomain for the website (e.g., www)
    Default: www

  EnvironmentName:
    Type: String
    Description: Environment name for resource tagging
    Default: production
    AllowedValues:
      - development
      - staging
      - production

Mappings:
  RegionMap:
    us-west-2:
      S3HostedZoneId: Z3BJ6K6RIION7M
    us-east-1:
      S3HostedZoneId: Z3AQBSTGFYJSTF

Resources:
  # S3 Bucket for Website Content
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${SubDomain}.${DomainName}-content'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: IntelligentTieringRule
            Status: Enabled
            Transitions:
              - StorageClass: INTELLIGENT_TIERING
                TransitionInDays: 0
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      MetricsConfigurations:
        - Id: EntireBucket
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: StaticWebsiteContent

  # S3 Bucket for CloudFront Logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${SubDomain}.${DomainName}-logs'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: ArchiveOldLogs
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 45
            ExpirationInDays: 365
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: CloudFrontLogs

  # Origin Access Control for CloudFront
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${SubDomain}-${DomainName}-OAC'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub 'CloudFront distribution for ${SubDomain}.${DomainName}'
        Enabled: true
        HttpVersion: http2and3
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !GetAtt OriginAccessControl.Id
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
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
          ResponseHeadersPolicyId: 67f7725c-6f97-4210-82d7-5512b31e9d03  # Managed-SecurityHeadersPolicy
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
          MinimumProtocolVersion: TLSv1.2_2021
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          Prefix: cloudfront/
          IncludeCookies: false
        PriceClass: PriceClass_100
        Tags:
          - Key: Environment
            Value: !Ref EnvironmentName

  # Bucket Policy for CloudFront Access
  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipalReadOnly
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub '${WebsiteBucket.Arn}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # Route 53 Hosted Zone
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Route 53 Record Set for www subdomain
  WebsiteRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub '${SubDomain}.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
        EvaluateTargetHealth: false

  # Route 53 Record Set for apex domain
  ApexRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
        EvaluateTargetHealth: false

  # CloudWatch Dashboard for Monitoring
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${SubDomain}-${DomainName}-Dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/S3", "BucketSizeBytes", {"stat": "Average"}, {"label": "Bucket Size"}],
                  [".", "NumberOfObjects", {"stat": "Average", "yAxis": "right"}, {"label": "Number of Objects"}]
                ],
                "period": 86400,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "S3 Bucket Metrics",
                "dimensions": {
                  "BucketName": "${WebsiteBucket}",
                  "StorageType": "StandardStorage"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/CloudFront", "Requests", {"stat": "Sum"}],
                  [".", "BytesDownloaded", {"stat": "Sum", "yAxis": "right"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "CloudFront Distribution Metrics",
                "dimensions": {
                  "DistributionId": "${CloudFrontDistribution}"
                }
              }
            }
          ]
        }

  # CloudWatch Alarm for High Traffic
  HighTrafficAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${SubDomain}-${DomainName}-HighTraffic'
      AlarmDescription: Alert when CloudFront requests exceed threshold
      MetricName: Requests
      Namespace: AWS/CloudFront
      Dimensions:
        - Name: DistributionId
          Value: !Ref CloudFrontDistribution
      Statistic: Sum
      Period: 3600
      EvaluationPeriods: 1
      Threshold: 5000
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  # S3 Request Metrics Configuration
  RequestMetricsConfiguration:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref WebsiteBucket
      MetricsConfigurations:
        - Id: EntireBucketRequests
          Prefix: ''
          TagFilters: []

Outputs:
  WebsiteURL:
    Description: URL of the website
    Value: !Sub 'https://${SubDomain}.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteURL'

  CloudFrontDistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-DistributionId'

  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDomain'

  S3BucketName:
    Description: Name of the S3 bucket hosting the website
    Value: !Ref WebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  LogsBucketName:
    Description: Name of the S3 bucket for logs
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucketName'

  HostedZoneId:
    Description: Route 53 Hosted Zone ID
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'

  NameServers:
    Description: Name servers for the Route 53 hosted zone
    Value: !Join [',', !GetAtt HostedZone.NameServers]
    Export:
      Name: !Sub '${AWS::StackName}-NameServers'

  DashboardURL:
    Description: URL to the CloudWatch Dashboard
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${SubDomain}-${DomainName}-Dashboard'
```