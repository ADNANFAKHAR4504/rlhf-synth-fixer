# Infrastructure Requirements

I need to set up a basic cloud environment on AWS for development purposes. Please create the infrastructure using Pulumi TypeScript that meets these requirements:

## Core Requirements
1. Deploy all resources in the us-east-1 region
2. Create one EC2 instance of type t2.micro
3. Create one S3 bucket with versioning enabled
4. Tag all resources with 'Environment' set to 'Development'

## Additional Specifications
- The EC2 instance should use the latest Amazon Linux 2 AMI
- Configure basic security group for the EC2 instance allowing SSH access
- The S3 bucket should have server-side encryption enabled
- Use AWS Systems Manager Session Manager for secure access to EC2 instead of traditional SSH keys
- Implement S3 bucket notifications using Amazon EventBridge for monitoring object changes

## Infrastructure Code Requirements
- Use Pulumi TypeScript
- Provide complete infrastructure code in separate code blocks for each file
- Ensure all resources follow AWS best practices for security and cost optimization
- Include proper resource dependencies and outputs

Please provide the complete infrastructure code that I can deploy immediately.