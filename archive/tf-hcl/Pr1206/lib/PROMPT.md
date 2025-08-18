I need to create a secure, high-availability web application infrastructure on AWS using Terraform. The infrastructure must include:

1. A VPC with public and private subnets across at least two Availability Zones for high availability.

2. An RDS database instance deployed in private subnets with no public access. Use Aurora Serverless v2 to reduce deployment time.

3. EC2 instances in public subnets that can access the internet through a NAT gateway.

4. IAM roles following the principle of least privilege for all resources and proper application access controls.

5. S3 buckets with server-side encryption using AWS KMS and restricted access through bucket policies.

6. A CloudFront distribution protected by AWS WAF to defend against web exploits.

7. Comprehensive logging for all services using CloudWatch with alerts for unusual activity through GuardDuty.

8. Security monitoring and compliance using AWS Config and AWS Shield for DDoS protection.

Additionally, incorporate these latest AWS security features:
- Use AWS Shield Network Security Posture Management for enhanced network security analysis
- Implement Amazon Inspector Code Security for vulnerability detection

Please provide the complete Terraform infrastructure code with separate files for better organization. Each file should be provided in its own code block.