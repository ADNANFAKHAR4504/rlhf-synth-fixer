# AWS CDK Infrastructure Requirements

I need to set up a robust cloud environment in AWS using AWS CDK with TypeScript that meets the following requirements:

1. Create an S3 bucket with versioning enabled for storing application logs
2. Secure the S3 bucket with a custom IAM policy that restricts access to only specified IAM roles
3. Deploy an EC2 instance using a custom AMI across at least two availability zones for resilience 
4. Associate an Elastic IP address with the EC2 instance
5. Implement a Load Balancer to manage incoming traffic and route it to the EC2 instance
6. Deploy all resources in the us-west-1 region
7. Follow naming conventions: project-environment-resource format
8. Use CDK version 2.0 or higher
9. Ensure configuration complies with security policies and operational standards

For the S3 implementation, please leverage the latest security features where S3 Block Public Access is enabled by default and server-side encryption with Amazon S3 managed keys (SSE-S3) is automatically configured.

For the EC2 implementation, consider using the latest instance types and take advantage of enhanced security features including support for UEFI-based instances on Nitro systems.

Please provide the complete infrastructure code with one code block per file that can be deployed using cdk deploy.