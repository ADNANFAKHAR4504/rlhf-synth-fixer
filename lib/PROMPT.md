I need to set up a static website hosting infrastructure on AWS using CloudFormation in YAML format. 

The setup needs an S3 bucket that feeds content to a CloudFront distribution. CloudFront pulls files from the S3 origin and distributes them globally. The S3 bucket policy grants read access only to CloudFront's origin access identity, while blocking all other public access.

## What I need:

**S3 Configuration:**
- Static website hosting enabled on the bucket
- Bucket policy connected to CloudFront OAI that allows s3:GetObject
- Public access blocks prevent direct internet access

**CloudFront Distribution:**
- Origin configured to pull content from the S3 bucket endpoint
- Origin access identity authenticates CloudFront requests to S3
- Edge locations cache and serve content globally

**IAM and Security:**
- S3 bucket policy grants CloudFront OAI permission to fetch objects
- IAM policy attached to the bucket restricts access to CloudFront only
- All user requests flow through CloudFront which fetches from S3

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

The infrastructure should be production-ready with CloudFront serving as the public-facing CDN that retrieves content from the secured S3 bucket.
