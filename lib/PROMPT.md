Create infrastructure code for a static website hosting solution that supports a marketing agency promotional campaign with the following requirements:

## Core Requirements

Build a static website hosting infrastructure on AWS that can handle 10,000 monthly visitors with global content delivery. The solution needs visitor tracking analytics and must be cost-effective while ensuring secure content delivery.

## Infrastructure Components

### Static Content Storage
Create an S3 bucket configured for static website hosting with public read access through CloudFront only. The bucket should store HTML, CSS, JavaScript, and media files for the marketing campaign website. Configure appropriate CORS settings and versioning for content management.

### Global Content Delivery
Set up a CloudFront distribution with Origin Access Control (OAC) to securely serve content from the S3 bucket. Enable compression for text-based content and configure appropriate cache behaviors for different file types. Use the default CloudFront certificate for SSL/TLS encryption.

### DNS Configuration
Configure Route 53 with an A record alias pointing to the CloudFront distribution. Create a hosted zone for the domain and ensure proper DNS resolution for the website.

### Monitoring and Analytics
Implement CloudWatch metrics to track request counts, error rates, and bandwidth usage. Enable CloudFront standard logging to capture visitor data and access patterns. Configure CloudWatch alarms for high error rates or unusual traffic patterns.

### Logging Infrastructure
Create a separate S3 bucket for storing CloudFront access logs with lifecycle policies to transition logs to cheaper storage tiers after 30 days and delete them after 90 days for cost optimization. Enable server access logging on both S3 buckets.

### Real User Monitoring
Set up CloudWatch RUM (Real User Monitoring) to track actual user experience metrics including page load times, JavaScript errors, and user sessions. This provides deeper insights into visitor behavior beyond standard CloudFront metrics.

## Technical Specifications

- Region: us-east-1
- S3 bucket with Block Public Access enabled (access only through CloudFront OAC)
- CloudFront price class: PriceClass_100 for cost optimization
- Default root object: index.html
- Error pages: Custom 404.html and 403.html pages
- Cache TTL: 24 hours for static assets, 1 hour for HTML files
- Logging retention: 30 days in S3 Standard, 60 days in S3 Standard-IA, delete after 90 days

Generate the complete CDK TypeScript infrastructure code with all necessary imports, resource configurations, and stack outputs. Include appropriate comments and ensure all resources are properly tagged for cost tracking.