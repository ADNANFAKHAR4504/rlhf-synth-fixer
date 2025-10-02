# Infrastructure Requirements

Create infrastructure code using Pulumi with TypeScript to deploy a static website for a media startup that serves 2,800 daily content viewers.

## Technical Requirements

1. **Static Website Hosting**
   - Create an S3 bucket in us-east-2 region for static content storage
   - Configure the bucket for static website hosting
   - Implement S3 bucket policy allowing public read access for website content
   - Block public write access to the S3 bucket

2. **Content Delivery Network**
   - Set up CloudFront distribution with the S3 bucket as origin
   - Enable TLS 1.3 as the minimum protocol version
   - Configure proper cache behaviors for static assets
   - Use CloudFront Origin Access Control (OAC) for secure S3 access

3. **DNS Management**
   - Create a Route 53 hosted zone for the domain
   - Configure alias records pointing to the CloudFront distribution

4. **Monitoring and Logging**
   - Enable CloudWatch request metrics for the CloudFront distribution
   - Create an S3 bucket for CloudFront access logs
   - Implement S3 lifecycle rules to archive logs after 60 days to Glacier storage class

5. **AWS Features to Include**
   - Use CloudFront Real-time Logs configuration for immediate log streaming to CloudWatch
   - Implement CloudFront Response Headers Policy for security headers (X-Frame-Options, Content-Security-Policy)

## Implementation Details

Generate Pulumi TypeScript infrastructure code with:
- Proper resource naming and tagging
- Environment-based configuration using Pulumi config
- Export relevant outputs (CloudFront URL, S3 bucket name, Route 53 nameservers)
- Use Pulumi's native AWS provider

Provide the complete infrastructure code in TypeScript format, organized in appropriate files.