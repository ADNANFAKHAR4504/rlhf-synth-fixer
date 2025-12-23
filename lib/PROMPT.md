Need to deploy a multi-region security infrastructure using CDK TypeScript. The setup should handle a web application with proper security controls across us-west-1 and us-east-1.

Core architecture:
- VPC with EC2 instances running web servers, connected to RDS database in private subnets
- API Gateway integrated with Lambda functions for the application backend
- Lambda functions query the RDS database through VPC endpoints
- KMS encrypts data at rest for both RDS and S3 storage
- S3 buckets receive CloudTrail logs from both regions, with cross-region access logging enabled
- WAFv2 sits in front of API Gateway, blocking SQL injection attempts before reaching Lambda
- Security groups control traffic: SSH restricted to 203.0.113.0/24, database only accessible from Lambda and EC2
- IAM roles grant Lambda least-privilege access to RDS, S3, and CloudWatch
- AWS Inspector scans EC2 instances and Lambda code for vulnerabilities
- Security Hub aggregates findings from Inspector, CloudTrail, and GuardDuty

The web flow works like this:
1. User request hits API Gateway protected by WAF
2. WAF validates request, blocks malicious patterns
3. API Gateway invokes Lambda function
4. Lambda connects to RDS through VPC endpoint to fetch/store data
5. Lambda writes response logs to CloudWatch
6. All API calls captured by CloudTrail and sent to S3
7. Inspector continuously scans for vulnerabilities
8. Security Hub collects all security findings

All resources must be tagged with Environment and Project labels. The infrastructure needs to deploy cleanly across both regions with proper cleanup support.