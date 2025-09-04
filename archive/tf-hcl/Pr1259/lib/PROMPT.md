# Secure AWS Infrastructure with Terraform

I need to create a secure AWS infrastructure using Terraform HCL that implements comprehensive security best practices. The infrastructure should be deployed in us-west-2 region.

## Security Requirements

1. **Encryption at Rest**: Use AWS KMS for encrypting all storage services including S3 buckets, EBS volumes, and RDS instances

2. **Network Security**: Implement Security Groups with strict inbound traffic rules that only allow specific IP address ranges

3. **IAM Security**: Create IAM roles and policies following the principle of least privilege for all AWS services

4. **Audit Logging**: Enable AWS CloudTrail globally with encrypted logs using KMS keys for compliance tracking

5. **Configuration Monitoring**: Set up AWS Config to monitor and report changes to security-related resources

6. **EC2 Security**: Ensure all EC2 instances use encrypted AMIs and have proper security configurations

7. **S3 Security**: Enable comprehensive logging for S3 buckets with encrypted access logs

## Additional Requirements

- Use resource prefix "SecureTF" for all resources
- Include the latest AWS security features like GuardDuty and Security Hub
- Implement VPC Flow Logs for network monitoring
- All resources should follow AWS Well-Architected Framework security pillar

Please provide the complete Terraform infrastructure code with separate files for better organization. Each file should be in its own code block for easy implementation.