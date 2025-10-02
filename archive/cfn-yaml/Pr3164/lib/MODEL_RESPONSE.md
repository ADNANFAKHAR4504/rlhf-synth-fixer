# Static Website Deployment using AWS CloudFormation with YAML

I'll help you create a CloudFormation template for hosting a static website on AWS. Here's a basic implementation:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Static Website with S3 and CloudFront'

Parameters:
  BucketName:
    Type: String
    Description: 'Name for the S3 bucket'
    Default: 'my-static-website'

Resources:
  # S3 Bucket for website hosting
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  # Bucket Policy for public access
  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: PublicReadGetObject
            Effect: Allow
            Principal: '*'
            Action: 's3:GetObject'
            Resource: !Sub '${WebsiteBucket}/*'

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.WebsiteURL
            CustomOriginConfig:
              HTTPPort: 80
              OriginProtocolPolicy: http-only
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: allow-all
          AllowedMethods: [GET, HEAD]
          CachedMethods: [GET, HEAD]
          ForwardedValues:
            QueryString: false
            Cookies: {Forward: none}

Outputs:
  WebsiteURL:
    Description: 'Website URL'
    Value: !GetAtt CloudFrontDistribution.DomainName
  
  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref WebsiteBucket
```

This template creates:

1. **S3 Bucket**: Configured for static website hosting with public access
2. **Bucket Policy**: Allows public read access to website content
3. **CloudFront Distribution**: Provides content delivery network functionality

## Features:
- Basic S3 static website hosting
- CloudFront for faster content delivery
- Public access configuration for website content

To deploy this, you can use the AWS CLI:
```bash
aws cloudformation create-stack --stack-name my-website --template-body file://template.yaml
```

The website will be accessible via the CloudFront distribution URL provided in the outputs.