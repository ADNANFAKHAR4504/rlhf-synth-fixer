A startup needs a secure and scalable web access layer for around 2,000 daily users. The system must serve static content globally with SSL protection and basic monitoring. Please generate a single, production-ready CloudFormation YAML template file that provisions the following:

Core Requirements

    •	S3 bucket for hosting static website content (with public access blocked and proper bucket policies for CloudFront access only).
    •	ACM certificate for SSL/TLS, validated via Route 53 DNS.
    •	CloudFront distribution configured with the ACM certificate for HTTPS delivery and the S3 bucket as the origin.
    •	Route 53 hosted zone and record set to map the domain name to the CloudFront distribution.
    •	CloudWatch metrics and alarms for monitoring request counts, 4xx/5xx errors, and cache hit rate.
    •	IAM roles and policies granting least-privilege access for CloudFront, S3, and monitoring resources.
    •	Parameterize key values such as DomainName, HostedZoneId, EnvironmentSuffix, and CertificateArn for flexibility.
    •	Include appropriate Outputs like the CloudFront distribution URL, S3 bucket name, and CloudWatch dashboard URL.
