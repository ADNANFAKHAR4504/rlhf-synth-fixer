I need help creating a secure cloud environment for a web application using Terraform. The infrastructure must meet these specific security requirements:

1. All resources must be deployed to the us-west-2 AWS region
2. Implement strict IAM roles following the least privilege principle
3. Use AWS Key Management Service for encrypting data in S3 buckets
4. Set up a Virtual Private Cloud with both private and public subnets for proper network segmentation
5. Deploy AWS Web Application Firewall to protect against common web attacks
6. Configure CloudWatch Logs for centralized logging with KMS encryption

Please include these modern AWS features in the solution:
- AWS WAF v2 with simplified protection rules and rate limiting capabilities
- CloudWatch Logs with KMS encryption using encryption context for enhanced security
- AWS Systems Manager Parameter Store for secure configuration management with encrypted parameters
- Amazon EventBridge custom event bus with event rules and CloudWatch Logs integration for event-driven architecture

The infrastructure should be production-ready and follow Terraform best practices. Please provide the complete Terraform configuration files with proper resource organization and dependencies.

Generate infrastructure code with one code block per file. Make sure all resources are properly configured for security and follow AWS best practices.
