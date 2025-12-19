Create infrastructure code for a static website portfolio with the following requirements:

The site needs to host HTML, CSS, and JavaScript files with global low-latency access for 5,000 monthly visitors.

Set up an S3 bucket to store the website files with public read access only (not writable). Configure CloudFront as the CDN to serve content globally with HTTPS enabled. Use CloudFront's origin access control instead of legacy origin access identity for better security.

For DNS, create a Route 53 hosted zone with an A record aliased to the CloudFront distribution. The domain name should be portfolio.example.com.

Include CloudWatch monitoring to track request metrics. Set up S3 lifecycle rules to delete CloudFront logs after 90 days to control storage costs.

Use AWS WAF with CloudFront to add basic protection against common web attacks. Configure automatic certificate validation through Route 53 for the SSL certificate.

Deploy all resources to us-east-2 region except for CloudFront and Route 53 which are global services.

Generate the complete CDK TypeScript infrastructure code with one code block per file.