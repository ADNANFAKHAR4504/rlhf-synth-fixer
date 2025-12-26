```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy a secure, reusable AWS infrastructure for a static web application.

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for the environment (e.g., dev, prod)
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.

  ApplicationName:
    Type: String
    Description: Name of the application
    Default: 'webapp'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.

  DomainAlias:
    Type: String
    Description: Domain alias for CloudFront distribution (optional)
    Default: ''

  CertificateArn:
    Type: String
    Description: ACM Certificate ARN for custom domain (required if DomainAlias is specified)
    Default: ''

Conditions:
  HasDomainAlias: !Not [!Equals [!Ref DomainAlias, '']]
  HasCertificate: !And 
    - !Not [!Equals [!Ref CertificateArn, '']]
    - !Not [!Equals [!Ref DomainAlias, '']]  #  FIXED: Only use certificate if domain is also provided

Resources:
  # S3 Bucket for web app content
  WebAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${EnvironmentSuffix}-web-app-bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: !Ref ApplicationName

  # CloudFront Origin Access Control (OAC)
  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${ApplicationName}-${EnvironmentSuffix}-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4
        Description: !Sub 'OAC for ${ApplicationName}-${EnvironmentSuffix}'

  # Response Headers Policy for Security
  ResponseHeadersPolicy:
    Type: AWS::CloudFront::ResponseHeadersPolicy
    Properties:
      ResponseHeadersPolicyConfig:
        Name: !Sub '${ApplicationName}-${EnvironmentSuffix}-security-headers'
        SecurityHeadersConfig:
          StrictTransportSecurity:
            AccessControlMaxAgeSec: 31536000
            IncludeSubdomains: true
            Override: true
          ContentTypeOptions:
            Override: true
          FrameOptions:
            FrameOption: DENY
            Override: true
          ReferrerPolicy:
            ReferrerPolicy: strict-origin-when-cross-origin
            Override: true
          ContentSecurityPolicy:
            ContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
            Override: true

  # S3 Bucket for CloudFront logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: true
        IgnorePublicAcls: false
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${EnvironmentSuffix}-cloudfront-logs'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: !Ref ApplicationName

  # CloudFront Distribution (CREATE THIS FIRST)
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-${EnvironmentSuffix}-distribution'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: !Ref ApplicationName
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt WebAppS3Bucket.RegionalDomainName
            Id: S3Origin
            #  FIXED: Add S3OriginConfig when using OAC
            S3OriginConfig:
              OriginAccessIdentity: ''  # Empty for OAC
            OriginAccessControlId: !Ref CloudFrontOriginAccessControl
        Enabled: true
        DefaultRootObject: index.html
        Aliases: !If 
          - HasDomainAlias
          - [!Ref DomainAlias]
          - !Ref "AWS::NoValue"
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          ResponseHeadersPolicyId: !Ref ResponseHeadersPolicy
          Compress: true
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
        ViewerCertificate: !If
          - HasCertificate
          - AcmCertificateArn: !Ref CertificateArn
            SslSupportMethod: sni-only
            MinimumProtocolVersion: TLSv1.2_2021
          - CloudFrontDefaultCertificate: true
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          IncludeCookies: false
          Prefix: !Sub 'cloudfront-logs/${ApplicationName}-${EnvironmentSuffix}/'
        PriceClass: PriceClass_100
        HttpVersion: http2
        IPV6Enabled: true

  #  FIXED: S3 Bucket Policy AFTER CloudFront Distribution
  WebAppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebAppS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub 'arn:aws:s3:::${WebAppS3Bucket}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'


Outputs:
  S3BucketName:
    Description: Name of the S3 bucket for web app content
    Value: !Ref WebAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3BucketDomainName:
    Description: Regional domain name of the S3 bucket
    Value: !GetAtt WebAppS3Bucket.RegionalDomainName
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketDomainName'

  LoggingBucketName:
    Description: Name of the S3 bucket for CloudFront logs
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucketName'

  CloudFrontDistributionDomainName:
    Description: Domain name of the CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionDomainName'

  CloudFrontDistributionId:
    Description: ID of the CloudFront distribution
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionId'

  CloudFrontOriginAccessControlId:
    Description: CloudFront Origin Access Control ID
    Value: !Ref CloudFrontOriginAccessControl
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontOriginAccessControlId'

  #  ADDED: Website URL output
  WebsiteURL:
    Description: URL of the CloudFront distribution
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteURL'

  #  ADDED: Custom domain URL if configured
  CustomDomainURL:
    Condition: HasDomainAlias
    Description: Custom domain URL
    Value: !Sub 'https://${DomainAlias}'
    Export:
      Name: !Sub '${AWS::StackName}-CustomDomainURL'
```