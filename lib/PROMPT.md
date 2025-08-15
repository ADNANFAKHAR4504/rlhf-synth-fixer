# Prompt

You are an expert AWS Infrastructure Engineer tasked with securing an AWS environment spanning the `us-east-1` and `us-west-2` regions. All resource names must start with `SecureEnv-` and follow a private IP naming convention. The environment must comply with industry standards for security and data protection, and resources are organized under a single AWS account.  

The infrastructure includes:  
- **S3 buckets**  
- **RDS databases**  
- **EC2 instances**  
- **VPCs and subnets**  
- **Security Groups**  
- **IAM roles**  
- **AWS WAF setups**  
- **AWS Config** 

## Constraints & Requirements

1. **KMS Encryption:** Use AWS Key Management Service (KMS) to encrypt all S3 bucket data.  
2. **IAM Least Privilege:** Ensure IAM roles follow the principle of least privilege.  
3. **VPC Logging:** Enable logging for VPCs for monitoring and auditing.  
4. **AWS Config:** Track all resource changes and maintain compliance.  
5. **CloudTrail:** Log all account activity; ensure it cannot be tampered with.  
6. **MFA:** Implement Multi-Factor Authentication for all IAM users.  
7. **AWS WAF:** Protect web applications against SQL injection and XSS attacks.  
8. **GuardDuty:** Enable Amazon GuardDuty for threat detection and anomaly monitoring.  
9. **RDS Encryption:** Ensure all RDS databases are encrypted at rest and in transit.  
10. **Secure VPC:** Configure VPC with appropriate subnetting, routing, and NAT gateways for Internet access when needed.  
11. **EC2 Metadata Protection:** Block instance metadata access from scripts.  
12. **Security Groups:** Control inbound and outbound traffic for instances.  
13. **EBS Encryption:** Ensure all EBS volumes are encrypted using KMS keys.  

## Expected Output

- A fully functional CloudFormation YAML template named:  
  ```yaml
  secure_configuration.yml
  ```
- The template must satisfy all constraints above.
- It should deploy successfully in the outlined AWS environment.
