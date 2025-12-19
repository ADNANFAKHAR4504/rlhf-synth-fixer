I need help setting up infrastructure for a digital assessment platform that our educational technology company is building. We're expecting high traffic during exam periods and need to handle student submissions securely while maintaining FERPA compliance.

Can you create infrastructure using Pulumi with Python for the following setup in us-east-1?

We need an API Gateway to receive student exam submissions with rate limiting set to 100 requests per minute per user. The submissions should be processed in real-time using Kinesis Data Streams.

For data storage, we need RDS PostgreSQL that must be placed in private subnets with appropriate security group rules. We also need ElastiCache Redis for managing student sessions during exams.

All sensitive data like database credentials should be stored in AWS Secrets Manager. Everything needs to be encrypted at rest and in transit using AWS KMS.

The infrastructure should follow FERPA compliance requirements for educational data. Make sure to include proper VPC configuration with public and private subnets across multiple availability zones for high availability.

Also include CloudWatch monitoring for the API Gateway and data processing components to track performance and any issues during high-traffic exam periods.