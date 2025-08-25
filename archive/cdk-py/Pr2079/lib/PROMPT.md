I need help creating a comprehensive secure AWS environment for my application using AWS CDK with Python. I'm looking to implement best practices for a production-ready infrastructure with multiple security layers.

Here are the specific security components I need to implement:

1. S3 buckets with server-side encryption and versioning enabled
2. AWS Lambda functions with proper environment variable management for secrets
3. IAM roles following the principle of least privilege
4. EC2 instances deployed within a VPC with proper subnet isolation
5. API Gateway with CloudWatch logging and AWS WAF integration
6. CloudTrail for logging management events to an encrypted S3 bucket
7. AWS Config to monitor security configuration changes
8. RDS database instances that are not publicly accessible with encryption at rest
9. Security group rules that restrict access to specific IP ranges
10. S3 bucket policies that restrict unauthorized access
11. Application Load Balancer with SSL termination using ACM certificates
12. Default EBS encryption for all volumes
13. Bastion host setup for secure SSH access to private instances
14. CloudFront distribution with security headers and AWS WAF integration

I also want to incorporate some of the latest AWS security features like the enhanced AWS Security Hub for centralized security findings and AWS Shield Advanced for DDoS protection.

The infrastructure should be deployed in the us-east-1 region with proper tagging for cost allocation and compliance. All data should be encrypted both at rest and in transit, and I need comprehensive logging and monitoring across all services.

Can you provide AWS CDK Python code that implements all these security components in a well-structured way? Please organize the code into separate files for better maintainability, with one main stack file and separate construct files for different service groups.