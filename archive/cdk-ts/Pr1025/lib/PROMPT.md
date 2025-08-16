I need to create a robust AWS web application infrastructure using CDK TypeScript for a production environment. The infrastructure should be highly available, secure, and include modern AWS features for monitoring and protection.

Requirements:
1. VPC with public and private subnets across multiple availability zones in us-west-2
2. EC2 instances with proper AMI configuration and user data scripts for application setup
3. RDS database with db.t3.micro instance, encrypted storage, and restricted access
4. S3 buckets with server-side encryption and access logging enabled
5. IAM roles with least privilege access policies
6. Security groups with proper ingress/egress rules
7. Include AWS WAF for web application protection with simplified configuration
8. Add Amazon Inspector for continuous vulnerability monitoring
9. Use modular CDK constructs for organization and reusability
10. Include CloudWatch monitoring and alerting

The solution should use CDK TypeScript with separate constructs for each major component. Make sure to include proper error handling, tagging, and follow AWS security best practices. Please provide infrastructure code in separate code blocks for each file.