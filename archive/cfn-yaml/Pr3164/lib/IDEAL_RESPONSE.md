# Static Website Deployment using AWS CloudFormation with YAML in Single Output File

I'll help you deploy a static website using AWS CloudFormation with YAML. This solution will include S3 bucket hosting, CloudFront distribution with SSL, Route 53 DNS management, KMS encryption, and CloudWatch monitoring - all designed to handle ~5,000 daily visitors cost-effectively.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Static Website Infrastructure with S3, CloudFront, Route53, and KMS encryption'

Parameters:
  DomainName:
    Type: String
    Description: 'Custom domain name for the website (e.g., example.com). Leave blank to skip domain setup.'
    Default: ''
    AllowedPattern: '^([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,})?$'
    ConstraintDescription: 'Must be a valid domain name or empty'
  
  EnvironmentSuffix:
    Type: String
    Description: 'Environment suffix to append to resource names (e.g., dev, staging, prod)'
    Default: 'dev'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'
  
  EnableSSL:
    Type: String
    Description: 'Enable HTTPS/SSL for CloudFront distribution'
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
  
  ACMCertificateArn:
    Type: String
    Description: 'ARN of ACM certificate in us-east-1 (required if EnableSSL is true, otherwise leave empty)'
    Default: ''
    AllowedPattern: '^(arn:aws:acm:us-east-1:[0-9]{12}:certificate\/[a-z0-9-]+)?$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN in us-east-1 region or empty'

Conditions:
  UseSSL: !Equals [!Ref EnableSSL, 'true']
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]
  NoDomainName: !Equals [!Ref DomainName, '']

Resources:
  # Route 53 Hosted Zone
  HostedZone:
    Type: AWS::Route53::HostedZone
    Condition: HasDomainName
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName} static website - ${EnvironmentSuffix}'
      HostedZoneTags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-hosted-zone-${EnvironmentSuffix}'
        - Key: Purpose
          Value: StaticWebsiteHosting
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # KMS Key for S3 Encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for encrypting static website S3 bucket - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableIAMUserPermissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      EnableKeyRotation: true

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-encryption-${EnvironmentSuffix}'
      TargetKeyId: !Ref S3EncryptionKey

  # Logging Bucket
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - HasDomainName
        - !Join ['-', [!Ref DomainName, 'logs', !Ref EnvironmentSuffix, !Ref 'AWS::AccountId']]
        - !Join ['-', ['logs', !Ref EnvironmentSuffix, !Ref 'AWS::AccountId']]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-logging-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: S3ServerAccessLogsPolicy
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId
          - Sid: CloudFrontLogsPolicy
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LoggingBucket.Arn}/*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId

  # Website Bucket (S3)
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - HasDomainName
        - !Join ['-', [!Ref DomainName, 'website', !Ref EnvironmentSuffix, !Ref 'AWS::AccountId']]
        - !Join ['-', ['website', !Ref EnvironmentSuffix, !Ref 'AWS::AccountId']]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
            BucketKeyEnabled: true 
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-website-bucket-${EnvironmentSuffix}'
        - Key: Purpose
          Value: StaticWebsiteHosting
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudFront Origin Access Control
  CloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${AWS::StackName}-OAC-${EnvironmentSuffix}'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # Website Bucket Policy (allows CloudFront OAC access)
  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontGetObject
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:GetObject'
            Resource: !Sub '${WebsiteBucket.Arn}/*'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId

  # CloudFront Distribution (with Domain & SSL)
  CloudFrontDistributionSSLWithDomain:
    Type: AWS::CloudFront::Distribution
    Condition: HasDomainName
    DependsOn: LoggingBucketPolicy
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution for ${DomainName} - ${EnvironmentSuffix}'
        DefaultRootObject: index.html
        Aliases: !If
          - UseSSL
          - - !Ref DomainName
            - !Sub 'www.${DomainName}'
          - !Ref AWS::NoValue
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref CloudFrontOAC
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: !If [UseSSL, 'redirect-to-https', 'allow-all']
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD]
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies: {Forward: none}
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
        ViewerCertificate: !If
          - UseSSL
          - {AcmCertificateArn: !Ref ACMCertificateArn, SslSupportMethod: sni-only, MinimumProtocolVersion: TLSv1.2_2021}
          - {CloudFrontDefaultCertificate: true}
        HttpVersion: http2
        PriceClass: PriceClass_100
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          Prefix: 'cloudfront-logs/'
          IncludeCookies: false
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /error.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: /error.html
            ErrorCachingMinTTL: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudfront-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudFront Distribution (without Domain)
  CloudFrontDistributionNoDomain:
    Type: AWS::CloudFront::Distribution
    Condition: NoDomainName
    DependsOn: LoggingBucketPolicy
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution - ${EnvironmentSuffix}'
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref CloudFrontOAC
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: !If [UseSSL, 'redirect-to-https', 'allow-all']
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD]
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies: {Forward: none}
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
        ViewerCertificate: {CloudFrontDefaultCertificate: true}
        HttpVersion: http2
        PriceClass: PriceClass_100
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          Prefix: 'cloudfront-logs/'
          IncludeCookies: false
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /error.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: /error.html
            ErrorCachingMinTTL: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudfront-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route53 Records
  Route53RecordRoot:
    Type: AWS::Route53::RecordSet
    Condition: HasDomainName
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistributionSSLWithDomain.DomainName
        HostedZoneId: Z2FDTNDATAQYW2
        EvaluateTargetHealth: false

  Route53RecordWWW:
    Type: AWS::Route53::RecordSet
    Condition: HasDomainName
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistributionSSLWithDomain.DomainName
        HostedZoneId: Z2FDTNDATAQYW2
        EvaluateTargetHealth: false

  # CloudWatch Log Group
  WebsiteLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/static-website/${AWS::StackName}-${EnvironmentSuffix}'
      RetentionInDays: 30

  # CloudWatch Alarms
  CloudFront4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cloudfront-4xx-errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when 4xx error rate exceeds 5%'
      MetricName: 4xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !If 
            - HasDomainName
            - !Ref CloudFrontDistributionSSLWithDomain
            - !Ref CloudFrontDistributionNoDomain

  CloudFront5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cloudfront-5xx-errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when 5xx error rate exceeds 1%'
      MetricName: 5xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !If 
            - HasDomainName
            - !Ref CloudFrontDistributionSSLWithDomain
            - !Ref CloudFrontDistributionNoDomain

Outputs:
  HostedZoneId:
    Condition: HasDomainName
    Description: 'Route53 Hosted Zone ID'
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'

  NameServers:
    Condition: HasDomainName
    Description: 'Name servers for the hosted zone'
    Value: !Join [', ', !GetAtt HostedZone.NameServers]

  WebsiteBucketName:
    Description: 'S3 bucket hosting website'
    Value: !Ref WebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteBucket'

  WebsiteBucketArn:
    Description: 'ARN of the website bucket'
    Value: !GetAtt WebsiteBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteBucketArn'

  LoggingBucketName:
    Description: 'S3 bucket for logs'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  CloudFrontDistributionId:
    Description: 'CloudFront Distribution ID'
    Value: !If 
      - HasDomainName
      - !Ref CloudFrontDistributionSSLWithDomain
      - !Ref CloudFrontDistributionNoDomain
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionId'

  CloudFrontDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !If 
      - HasDomainName
      - !GetAtt CloudFrontDistributionSSLWithDomain.DomainName
      - !GetAtt CloudFrontDistributionNoDomain.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDomain'

  WebsiteURL:
    Description: 'URL of the website'
    Value: !If 
      - HasDomainName
      - !If 
        - UseSSL
        - !Sub 'https://${DomainName}'
        - !Sub 'http://${DomainName}'
      - !Sub 'https://${CloudFrontDistributionNoDomain.DomainName}'

  KMSKeyId:
    Description: 'KMS Key ID for S3 encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'KMS Key ARN for S3 encryption'
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
```

## Key Features Implemented:

1. **S3 Static Website Hosting**: 
   - Website bucket with KMS encryption
   - Separate logging bucket for access logs
   - Proper lifecycle policies for cost optimization

2. **CloudFront Distribution**:
   - Global content delivery with low latency
   - Origin Access Control (OAC) for secure S3 access
   - Custom error pages and caching optimization
   - Cost-effective PriceClass_100 for most edge locations

3. **Route 53 DNS Management**:
   - Hosted zone creation with proper name server configuration
   - A records for root and www subdomain
   - Conditional creation based on domain parameter

4. **SSL/HTTPS Support**:
   - Flexible SSL configuration via parameters
   - Support for custom ACM certificates
   - Automatic HTTPS redirection when SSL enabled

5. **KMS Encryption**:
   - Dedicated KMS key for S3 data encryption at rest
   - Key rotation enabled for enhanced security
   - Proper access policies for CloudFront

6. **CloudWatch Monitoring**:
   - Log group for centralized logging
   - CloudWatch alarms for 4xx and 5xx error monitoring
   - 30-day log retention for cost optimization

7. **Security Best Practices**:
   - Public access blocked on S3 buckets
   - Origin Access Control instead of legacy OAI
   - Proper IAM policies with least privilege

This infrastructure is designed to handle ~5,000 daily visitors efficiently while maintaining security and cost-effectiveness through proper caching, lifecycle policies, and optimized CloudFront settings.