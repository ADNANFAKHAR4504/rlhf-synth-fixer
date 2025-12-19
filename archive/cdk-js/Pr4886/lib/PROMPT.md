A news platform needs to deliver 5,000 daily articles with low latency and HTTPS. The system must be secure, globally fast, and provide basic monitoring and access logs. Please produce one self-contained AWS CDK (JavaScript/TypeScript-compatible) stack file that provisions the following, with sensible defaults and parameters for easy customization:

Core requirements

    •	Amazon S3 for storing static article content (HTML, images, assets). Block public writes and enforce access via CloudFront.
    •	Amazon CloudFront distribution for global delivery, configured with an ACM certificate (in us-east-1) for HTTPS. Include cache policy and TTLs suitable for mostly-static articles.
    •	AWS Certificate Manager (ACM) integration: accept an existing certificate ARN (parameter) or document how to request one and validate via Route 53.
    •	Amazon Route 53: optional hosted zone and A/AAAA alias records to point a custom domain to the CloudFront distribution (parameterize domain name and whether to create the hosted zone).
    •	CloudWatch metrics, alarms, and a dashboard for key signals: request count, 4xx/5xx errors, cache hit ratio, and latency. Expose the dashboard URL as an output.
    •	S3 Logging Bucket: an S3 bucket to hold CloudFront and access logs with lifecycle rules to transition/archive old logs.
    •	IAM: least-privilege roles/policies for any Lambdas or invalidation automation, and an example role for CI/CD invalidation tasks.
    •	Parameters & naming: allow EnvironmentSuffix (e.g., dev/stage/prod), DomainName, CertificateArn, CreateHostedZone (boolean), PriceClass and cache TTL settings. Use EnvironmentSuffix in resource names and tags.
    •	Outputs: CloudFront distribution ID & domain name, S3 bucket names (content + logs),CloudWatch dashboard URL, and example invalidation IAM role ARN.
