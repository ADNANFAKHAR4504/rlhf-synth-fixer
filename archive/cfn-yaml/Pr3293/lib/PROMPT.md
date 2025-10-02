I need CloudFormation YAML infrastructure code for a static website hosting solution for a small business.

Requirements:

1. Storage and Content Delivery:
   - Create an S3 bucket for static website content storage
   - Configure CloudFront distribution with the S3 bucket as origin
   - Enable TLS 1.3 security policy (TLSv1.3_2021 or later) for CloudFront
   - Configure Origin Access Control (OAC) to ensure S3 is only accessible through CloudFront

2. DNS Configuration:
   - Set up Route 53 hosted zone for the website domain
   - Create alias records pointing to the CloudFront distribution

3. Security:
   - Configure S3 bucket policy allowing public read access only through CloudFront
   - Restrict S3 write access to authorized IAM principals only
   - Enable S3 bucket versioning for content protection

4. Monitoring and Logging:
   - Enable CloudWatch metrics for the S3 bucket
   - Configure S3 request metrics for monitoring access patterns
   - Set up CloudFront access logs stored in a separate S3 bucket
   - Implement lifecycle policy on the logs bucket to archive logs to Glacier after 45 days

5. Cost Optimization:
   - Use S3 Intelligent-Tiering for automatic cost optimization on the content bucket
   - Configure CloudFront caching behaviors with appropriate TTL values

The solution should handle approximately 2,500 monthly visitors with secure global access. Target deployment region is us-west-2.

Please provide the complete CloudFormation template as separate code blocks for each file needed.