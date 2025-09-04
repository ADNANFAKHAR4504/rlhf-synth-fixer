You are an expert AWS Solutions Architect specializing in secure, production-grade AWS CloudFormation templates. Your task is to design a secure AWS cloud environment using CloudFormation with the exact requirements below.

Requirements:

1.	API Gateway Must be configured to log all access logs to CloudWatch Logs with proper retention settings.
2.	S3 Buckets Must have server-side encryption enabled using AES-256 and block all public access.
3.	IAM Roles Must follow the least privilege principle and grant only necessary permissions for resources to function.
4.	AWS WAF Must be attached to the API Gateway to protect against common web exploits (SQL injection, XSS, etc.).
5.	Region Constraint All resources must be deployed in us-east-1.
6.	Networking All networking components (VPC, subnets, route tables, security groups, etc.) must be contained within a single VPC.
7.	Validation The template must pass AWS CloudFormation Linter (cfn-lint) validation and be deployable without errors in a fresh AWS account.

Output format:
• Provide a single YAML CloudFormation template that:
• Includes Parameters, Resources, and Outputs.
• Contains descriptive comments for each major section.
• Fully meets the above security and architectural requirements.
• Ensure all AWS resource types, property names, and values strictly follow AWS CloudFormation specifications.
