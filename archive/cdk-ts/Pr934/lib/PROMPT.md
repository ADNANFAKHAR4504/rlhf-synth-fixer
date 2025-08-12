I need to build a highly available web application infrastructure on AWS that can handle traffic across multiple regions. The application needs to be resilient and automatically recover from failures.

Here are my requirements:

1. **Auto Scaling Groups**: I need Auto Scaling Groups in both us-east-1 and eu-west-1 regions, each maintaining at least 3 EC2 instances to handle user traffic. The instances should automatically recover from failures within one minute. I want to use the new AWS Lambda integration for lifecycle hooks to handle custom scaling events.

2. **Multi-region S3 Setup**: I need S3 buckets configured for multi-region replication between us-east-1 and eu-west-1 to ensure data is available in both regions. I'd like to use S3 Cross-Region Replication with the new S3 Metadata feature for better visibility and monitoring.

3. **Application Load Balancer**: Each region should have an Application Load Balancer that distributes traffic across multiple Availability Zones to the EC2 instances.

4. **Global Content Delivery**: I need Amazon CloudFront distribution with AWS WAF v2 for global content delivery and advanced security protection. The WAF should include rate limiting and geo-blocking capabilities to protect against DDoS attacks and malicious traffic.

5. **Distributed Tracing**: I want AWS X-Ray integrated throughout the infrastructure for distributed tracing and performance monitoring. This should trace requests from CloudFront through the load balancers to the EC2 instances, providing detailed insights into application performance.

6. **Auto Recovery**: The system must automatically detect and recover from instance failures in under one minute using health checks and replacement mechanisms.

7. **Security**: All components should follow AWS security best practices with proper IAM roles, security groups, and least privilege access.

The infrastructure should be deployed using AWS CDK with TypeScript. I need the complete infrastructure code with proper error handling and resource organization. Each file should be in a separate code block so I can easily copy the code into the appropriate files.

Please provide the infrastructure code that implements all these requirements.