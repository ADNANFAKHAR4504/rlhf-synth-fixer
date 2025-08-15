# Prompt

You are an expert AWS Infrastructure Engineer tasked with securing an AWS environment spanning the `us-east-1` and `us-west-2` regions. All resource names must start with `SecureEnv-` and follow a private IP naming convention. The environment must comply with industry standards for security and data protection, and resources are organized under a single AWS account. 

The stack will include:  
**S3 buckets**, **RDS databases**, **EC2 instances**, **VPCs/subnets**, **security groups**, **IAM roles**, **AWS WAF**, and **AWS Config**.

## Requirements

- **KMS Encryption:** Encrypt all S3 data with AWS KMS.  
- **IAM Least Privilege:** Keep IAM roles limited to the permissions they absolutely need.  
- **VPC Logging:** Enable VPC logging for monitoring and audits.  
- **AWS Config:** Track resource changes and keep us compliant.  
- **CloudTrail Security:** Enable CloudTrail and make sure logs can’t be tampered with.  
- **MFA:** Require multi-factor authentication for every IAM user.  
- **AWS WAF:** Block SQL injection and XSS attacks.  
- **GuardDuty:** Turn on Amazon GuardDuty for threat detection.  
- **RDS Encryption:** Encrypt RDS databases at rest and in transit.  
- **Secure VPC Design:** Proper subnetting, routing, and NAT gateways for internet access when needed.  
- **EC2 Metadata Protection:** Block instance metadata from unauthorized scripts.  
- **Security Groups:** Limit inbound and outbound traffic to only what’s necessary.  
- **EBS Encryption:** Encrypt all EBS volumes using KMS.

## Expected Output

A working CloudFormation YAML file named: `secure_configuration.yml`. The template must satisfy all constraints above. It should deploy successfully in the outlined AWS environment.
```yaml
secure_configuration.yml
```

