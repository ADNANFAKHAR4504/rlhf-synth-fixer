# Infrastructure Security Requirements

We need to build a secure AWS infrastructure using Terraform for our financial services platform. This is a critical system that handles sensitive financial data, so security is our top priority.

## Key Security Requirements

Our infrastructure must follow these security practices:

- **IAM Security**: Create IAM roles with minimal required permissions only
- **Encryption**: Use AWS KMS for encrypting data at rest, and TLS 1.2+ for data in transit
- **Network Security**: Lock down security groups to specific ports and IP ranges only
- **Monitoring**: Set up comprehensive logging with CloudTrail that sends audit logs to a dedicated S3 bucket
- **Access Control**: Require MFA for all users and rotate passwords every 90 days
- **Data Protection**: Enable S3 bucket encryption and versioning for all storage

## What We're Building

You'll be creating Terraform HCL files that deploy a multi-region AWS infrastructure. This needs to handle our financial services workload while meeting strict compliance requirements.

The infrastructure should use a consistent naming pattern like prod-web-server.

## Your Task

As a DevOps engineer on our team, you need to:

1. Set up IAM roles that follow the principle of least privilege
2. Configure encryption for all data, both at rest and in transit
3. Create security groups that allow access only from specific IP ranges and ports
4. Implement logging and monitoring with CloudTrail that connects to S3 for storing audit logs
5. Set up user access controls with MFA and password rotation
6. Use Terraform modules to organize IAM policies, security groups, and network ACLs

## Important Notes

- No security groups should allow 0.0.0.0/0 access except for ports 80 and 443
- Use Terraform lifecycle policies to prevent accidental deletion of critical resources
- All CloudTrail logs must be encrypted with KMS and sent to an S3 bucket configured for log retention
- The solution needs to pass our security validation tests

Deliver a complete Terraform configuration that meets these requirements and can be deployed safely in our production environment.
