Create infrastructure code in Pulumi TypeScript for a static website hosting solution with the following requirements:

## Requirements

Build a static website infrastructure using AWS services for a small business website expecting 3,000 monthly visitors.

### Core Components

1. **S3 Bucket for Content Storage**
   - Create an S3 bucket to store static website files
   - Enable static website hosting on the bucket
   - Configure index.html as the index document and error.html as the error document
   - Apply bucket policy for public read access to website content
   - Enable server-side encryption with Amazon S3 managed keys (SSE-S3)
   - Block public write access while allowing public read for website files

2. **CloudFront Distribution**
   - Set up CloudFront distribution with the S3 bucket as origin
   - Configure SSL certificate using AWS Certificate Manager
   - Use TLSv1.2 or higher as the minimum protocol version
   - Enable caching with default TTL of 3600 seconds
   - Configure custom error pages for 403 and 404 errors
   - Enable compression for text-based content
   - Set up origin access identity to secure S3 bucket access

3. **Route 53 DNS Configuration**
   - Create a hosted zone for the domain
   - Configure A record with alias to CloudFront distribution
   - Add AAAA record for IPv6 support

4. **CloudWatch Monitoring**
   - Enable CloudWatch metrics for the CloudFront distribution
   - Track metrics for requests, bytes downloaded, and error rates
   - Set up basic alarms for high error rates (4xx and 5xx errors)

5. **Log Storage and Lifecycle**
   - Create separate S3 bucket for CloudFront access logs
   - Configure lifecycle policy on logs bucket to transition logs to Glacier after 30 days
   - Delete logs automatically after 90 days
   - Apply lifecycle policy to the main website bucket to delete incomplete multipart uploads after 7 days

### Security Requirements

- Restrict S3 bucket to allow only CloudFront origin access identity
- Block all public access except through CloudFront
- Use HTTPS only for CloudFront viewer protocol policy
- Enable AWS managed SSL certificate for the distribution

### Performance Optimization

- Use S3 Transfer Acceleration for faster uploads if needed
- Configure CloudFront with multiple edge locations for global access
- Set appropriate cache behaviors for different content types

Provide the complete Pulumi TypeScript infrastructure code organized in logical files. Include all necessary imports, resource definitions, and exports. Each file should be in its own code block with the filename clearly indicated.