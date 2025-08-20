# Terraform Infrastructure for Secure AWS Resource Configuration

I need help creating Terraform HCL infrastructure code that automates the security configuration of AWS resources. Please create the infrastructure code that meets the following requirements:

1. **IAM Security**: Define IAM roles and policies for secure access to Amazon S3 following the least privilege principle. The roles should be prefixed with 'corp' per our naming convention.

2. **S3 Security Configuration**: Configure Amazon S3 buckets with logging enabled for security audits. All buckets should be prefixed with 'corp' and have proper security controls.

3. **Multi-Region Support**: Use Terraform variables to allow deployment across different AWS regions with environment-specific configurations. Default to us-east-1 region.

4. **CloudWatch Monitoring**: Set up CloudWatch alarms to trigger alerts when there are unauthorized access attempts to resources.

5. **Security Best Practices**: Ensure the infrastructure follows AWS security best practices including proper encryption, access controls, and monitoring.

6. **AWS Shield Integration**: Include AWS Shield Advanced configuration for DDoS protection as part of the security setup.

7. **Amazon Macie Configuration**: Set up Amazon Macie for data loss prevention and sensitive data discovery in S3 buckets.

Please provide the complete Terraform infrastructure code with separate files for provider configuration and main resources. The code should be production-ready and follow Terraform best practices for security and maintainability.