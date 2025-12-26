I need to set up a static website hosting infrastructure on AWS using CloudFormation in YAML format. 

The setup needs an S3 bucket serving as the origin for a CloudFront distribution. CloudFront should pull content from S3, and the bucket must block public access - only CloudFront can fetch files through an origin access identity or origin access control.

## What I need:

**S3 Configuration:**
- Static website hosting enabled on the bucket
- Bucket policy that allows CloudFront to read objects
- Public access completely blocked at the bucket level

**CloudFront Distribution:**
- Origin pointing to the S3 bucket
- Origin access identity configured to authenticate with S3
- Distribution serves content globally with edge caching

**IAM and Security:**
- Bucket policy granting s3:GetObject permission to CloudFront's OAI
- Deny all other access to bucket contents
- All traffic flows through CloudFront only

**Parameters for reusability:**
- Environment suffix like dev or prod
- Application name
- Optional domain alias

## Technical requirements:

- Deploy to us-east-1 region
- Use CloudFormation YAML format
- Name the template: `static_web_app_infra.yaml`
- Must pass cfn-lint validation

## Required outputs:

- S3 bucket name
- Website endpoint URL
- CloudFront distribution domain name

The infrastructure should be production-ready and follow AWS best practices for static website hosting with CloudFront CDN.
