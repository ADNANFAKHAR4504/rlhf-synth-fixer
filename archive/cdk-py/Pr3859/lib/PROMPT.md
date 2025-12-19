I need to deploy a portfolio showcase platform in AWS us-east-2 region that displays around 3,100 creative works daily. The platform needs to handle visitor traffic efficiently with proper analytics and security.

The infrastructure should include:

1. An S3 bucket configured for static website hosting to store portfolio assets like HTML, CSS, JavaScript, and images.

2. A CloudFront distribution with origin access control pointing to the S3 bucket, including custom error pages for 404 and 500 errors. Configure managed cache policies for optimal performance and enable Gzip/Brotli compression.

3. Route 53 hosted zone configuration for domain management with appropriate DNS records pointing to the CloudFront distribution.

4. Lambda@Edge function for automatic image optimization that resizes images based on query parameters. The function should handle viewer requests and transform images on-the-fly using common image widths.

5. AWS WAF Web ACL attached to the CloudFront distribution with rate-based rules to protect against bot attacks. Set a reasonable rate limit for requests per 5-minute period.

6. S3 bucket policy that restricts access to CloudFront only using origin access control, preventing direct public access to the bucket.

7. CloudWatch dashboard for monitoring viewer analytics including request counts, error rates, and data transfer metrics from CloudFront.

8. S3 lifecycle policies for the logs bucket that automatically transitions objects to cheaper storage classes and deletes them after 90 days.

9. Multiple cache behaviors in CloudFront for different content types - one for HTML files with shorter TTL, one for static assets like CSS/JS with longer TTL, and one for images routed through Lambda@Edge.

10. All logging should be enabled with CloudFront access logs stored in a separate S3 bucket.

Please provide the complete infrastructure code with one code block per file. Include all necessary imports and ensure resources are properly connected.
