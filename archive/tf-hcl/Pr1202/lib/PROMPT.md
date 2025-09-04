# Infrastructure as Code Request

I need help creating a secure infrastructure setup using Terraform for a new project. Here are the requirements:

## Core Infrastructure Components

1. **S3 Bucket Setup**
   - Create an S3 bucket with Server-Side Encryption (SSE-S3) enabled
   - Configure bucket to block all public access
   - Use "ProjectName-s3bucket" naming pattern

2. **EC2 Instance Configuration**
   - Deploy an EC2 instance using the latest Amazon Linux 2 AMI
   - Ensure the instance has EBS encryption enabled by default
   - Use "ProjectName-webserver" naming pattern

3. **IAM Role and Permissions**
   - Create an IAM role following principle of least privilege
   - Role should allow EC2 instance to access the S3 bucket securely
   - Include policies only for required S3 operations

4. **CloudFront Distribution**
   - Set up CloudFront distribution to serve content from the S3 bucket
   - Configure using Origin Access Control (OAC) instead of legacy OAI
   - Enable HTTPS-only connections with automatic HTTP to HTTPS redirects

5. **Security Requirements**
   - All data transfer between EC2, CloudFront, and S3 must be encrypted via TLS
   - Implement AWS Shield Standard protection for DDoS defense
   - Use SigV4 authentication for S3 access through CloudFront

## Additional Requirements

- Deploy in us-east-1 region
- Follow AWS security best practices
- Enable appropriate logging and monitoring where possible
- Use latest CloudFront security features available in 2025

Please provide the complete Terraform HCL code with proper resource dependencies and security configurations. Make sure all components work together securely and follow current AWS recommendations.