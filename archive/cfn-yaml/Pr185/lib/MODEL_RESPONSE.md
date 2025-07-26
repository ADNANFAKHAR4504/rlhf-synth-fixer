```
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
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.

  DomainAlias:
    Type: String
    Description: Domain alias for CloudFront distribution (optional)
    Default: ''

Resources:
  WebAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ApplicationName}-${EnvironmentSuffix}-web-app-bucket'
      AccessControl: Private
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${ApplicationName}-${EnvironmentSuffix}'

  WebAppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebAppS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId
            Action: s3:GetObject
            Resource: !Sub 'arn:aws:s3:::${ApplicationName}-${EnvironmentSuffix}-web-app-bucket/*'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt WebAppS3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'
        Enabled: true
        DefaultRootObject: index.html
        Aliases:
          - !If [HasDomainAlias, !Ref DomainAlias, !Ref "AWS::NoValue"]
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
          TargetOriginId: S3Origin
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          ViewerProtocolPolicy: redirect-to-https
        ViewerCertificate:
          CloudFrontDefaultCertificate: true

Conditions:
  HasDomainAlias: !Not [!Equals [!Ref DomainAlias, '']]

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref WebAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  WebsiteEndpoint:
    Description: Website endpoint URL
    Value: !GetAtt WebAppS3Bucket.WebsiteURL
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteEndpoint'

  CloudFrontDistributionDomainName:
    Description: Domain name of the CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionDomainName'

```