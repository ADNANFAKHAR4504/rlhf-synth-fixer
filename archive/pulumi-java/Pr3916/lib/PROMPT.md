I need to create infrastructure for a news portal that serves 7,200 daily readers. The portal needs dynamic content delivery with geographic distribution in the us-east-1 region.

Requirements:
- S3 bucket for storing article content
- CloudFront distribution with multiple origin configurations for content delivery
- Lambda@Edge functions for request routing and A/B testing
- Route 53 hosted zone with geolocation routing policies for regional content
- WAF web ACL attached to CloudFront with rate limiting (2000 requests per 5 minutes)
- CloudWatch dashboard and alarms for monitoring viewer metrics
- S3 lifecycle policy to archive content after 120 days to Glacier

For security, use Origin Access Control (OAC) to restrict S3 bucket access to CloudFront only. The CloudFront distribution should support multiple cache behaviors for different content types. Configure the Lambda@Edge function to run at viewer-request stage for A/B testing routing.

Please provide the complete Pulumi infrastructure code in Java. Create separate files for each logical component (storage, CDN, DNS, security, monitoring). Make sure all resources are properly configured and follow AWS best practices.
