# Secure Infrastructure Setup for ProjectX

Hey, I need help setting up a secure AWS infrastructure for our new project. We're using CDK with TypeScript and need to deploy everything in us-east-1.

## What I need:

I need to create a secure production environment with these components working together:

- **S3 bucket** that stores sensitive data with AES-256 encryption and blocks all public access. The bucket should enforce SSL-only connections through a bucket policy.

- **IAM role** that can only read from the S3 bucket above. The role should require MFA for assumption and be restricted to a specific user called "prod-ops-user". 

- **Security group** in a VPC that only allows HTTPS traffic from our office IP range (203.0.113.0/24) and blocks all other inbound traffic. For outbound, it should only allow HTTPS connections.

- **VPC** with proper subnets to host the security group and provide network isolation.

The IAM role needs to connect to the S3 bucket with minimal permissions - just ListBucket and GetObject. The security group should protect any EC2 instances we might launch later.

Everything needs to use consistent naming with "prod-secure" prefix and support different environments through a suffix parameter. All resources should be tagged with Environment=Production.

Can you help me build this with CDK? I want to make sure we follow security best practices and the infrastructure is production-ready.