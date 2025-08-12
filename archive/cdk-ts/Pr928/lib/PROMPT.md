I need help creating a secure web application infrastructure on AWS using CDK TypeScript. The infrastructure should be deployed in the us-west-2 region and must follow security best practices.

Here are the specific requirements:

1. Create IAM roles that follow the principle of least privilege - only grant the minimum permissions needed for each service to function
2. Tag all resources with 'Environment' = 'Production' and 'Owner' = 'DevOps'
3. Do not hardcode any sensitive information like database passwords or API keys in the code - use AWS Secrets Manager instead
4. Set up logging for security group changes to ensure we can track any modifications for security auditing

Additional requirements:
- Use AWS Security Hub for centralized security findings management
- Implement AWS GuardDuty for threat detection
- Store all secrets in AWS Secrets Manager with automatic rotation enabled
- Enable AWS CloudTrail for API logging
- Use KMS keys for encryption where possible
- Create security groups that only allow necessary traffic

Please provide the infrastructure code that implements these security requirements. I need one code block per file, making sure each file can be created by simply copying and pasting the code.