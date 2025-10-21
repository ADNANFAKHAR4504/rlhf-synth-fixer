We need a secure, scalable content delivery system for a digital publisher that serves around 3,000 articles per day. The system must ensure low latency, SSL security, and detailed access metrics. Please produce one self-contained AWS CDK (TypeScript) stack file that provisions the following infrastructure components with sensible defaults and parameters for customization:

Core Requirements

    •	Amazon S3: Store static article content (HTML, images, media).
    •	Amazon CloudFront: Distribute content globally with low latency.
    •	AWS Certificate Manager (ACM): Provide an SSL certificate for HTTPS delivery.
    •	Amazon Route 53: Configure a custom domain (parameterized) for the CloudFront distribution.
    •	Amazon CloudWatch: Capture access logs, performance metrics, and cache hit ratios.
    •	S3 Logging Bucket: Store CloudFront and access logs with lifecycle management.
    •	IAM: Apply least-privilege roles and policies for S3 access and CloudFront invalidation.

Additional Requirements

    •	Parameterize domain name, certificate ARN, and environment suffix (e.g., dev, stage, prod).
    •	Output CloudFront Distribution ID, Distribution Domain Name, and Logging Bucket name.
    •	Include appropriate tags (e.g., Project, EnvironmentSuffix, Owner).
