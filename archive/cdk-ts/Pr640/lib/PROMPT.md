# AWS Infrastructure Code Generation Request

I need help creating a secure AWS infrastructure setup using AWS CDK with TypeScript. The infrastructure should be production-ready and follow AWS best practices.

## Requirements:

Create a CDK application that sets up:

1. A VPC with public and private subnets in us-west-2 region
2. An EC2 instance for a web server with a public IP
3. A security group that allows SSH access only from specific IP addresses
4. An S3 bucket for logging with server-side encryption enabled
5. All resources must be tagged with 'Environment: Production'
6. The solution should be modular using custom CDK constructs for reusability
7. Use CDK version 2.0 or later
8. Include AWS Network Firewall for enhanced VPC security
9. Use Amazon S3 server-side encryption with KMS customer managed keys

## Infrastructure Code Requirements:

Please provide the infrastructure code with one code block per file. Make sure each file can be directly used by copying from the response. The code should be production-ready and follow TypeScript best practices.

Structure the code in a modular way that allows reuse across different projects. Include proper error handling and security configurations.