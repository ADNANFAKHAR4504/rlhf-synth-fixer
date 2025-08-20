Create a complete and production-ready CloudFormation YAML template that provisions a secure, serverless application infrastructure on AWS.

Environment Constraints:
Region: us-east-1
All AWS resource names must be prefixed with secure-
All Lambda functions must run inside a VPC for enhanced security

Infrastructure Requirements:

1. Network Layer:
One VPC with a CIDR block of 10.1.0.0/16
At least two private subnets (in different Availability Zones) for Lambda functions
At least one public subnet for NAT Gateway
Internet Gateway for outbound access (via NAT Gateway)
NAT Gateway for private subnets to access the internet (e.g., for Lambda function dependencies)
2. Serverless Application Layer:
At least two AWS Lambda functions, each running inside the VPC (private subnets)
Lambda functions must have appropriate IAM roles, following the principle of least privilege
An API Gateway to trigger the Lambda functions
3. Secrets & Configuration:
Use AWS Systems Manager Parameter Store (with SecureString) to manage sensitive configuration such as API keys
Lambda functions must have permission to read parameters from Parameter Store
4. Monitoring & Budgeting:
Set up a CloudWatch Alarm that triggers on Lambda function errors (e.g., Error count > 0 in 5 minutes)
Integrate the alarm with an SNS topic for notifications
Include a budget alert for Lambda costs, with a limit of $10/month (use AWS Budgets and SNS for notifications)
5. Security:
All IAM roles and policies must be defined in the template, with least privilege access
Lambda functions must NOT have public internet access (only outbound via NAT)
No secrets or sensitive data should be stored in Lambda environment variables

Template Features:
Use Parameters for:
Environment name
Lambda runtime (e.g., python3.12, nodejs20.x)

Include Outputs for:

- API Gateway endpoint URL
- Lambda function ARNs
- SSM Parameter ARNs
- CloudWatch Alarm name
