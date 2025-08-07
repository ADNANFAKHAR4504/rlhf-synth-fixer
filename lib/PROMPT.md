I need to set up a secure AWS infrastructure for hosting a web application. The setup needs to be HIPAA compliant and include the following components:

1. Use AWS Secrets Manager for database passwords and sensitive information
2. Deploy everything in us-west-2 region 
3. Create IAM roles with minimal required permissions
4. Set up security groups that restrict access to specific IP addresses
5. Encrypt all data at rest using AWS KMS
6. Enable logging with S3 storage and CloudWatch monitoring
7. Deploy EC2 instances across multiple availability zones for high availability
8. Include an RDS database with automatic backups
9. Protect public resources with AWS WAF v2 with automatic DDoS protection
10. Ensure HTTPS encryption for all data in transit using Application Load Balancer

I want to use AWS WAF v2's new automatic application layer DDoS protection feature and the resource-level DDoS protection for Application Load Balancers that was released in 2025. The infrastructure should follow security best practices and be ready for production deployment.

Please provide infrastructure code with one code block per file that I can use to deploy this secure environment.