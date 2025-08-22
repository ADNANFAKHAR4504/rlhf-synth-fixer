**Prompt:** 
You are an expert AWS CloudFormation (YAML) architect. 
Your task is to design a **complete, production-grade security configuration** for a financial services company that must adhere to **strict regulatory standards including PCI-DSS compliance**. 

**Requirements:** 
1. **Tagging** All AWS resources must have the tags: `Environment` and `Owner`. 
2. **AWS Config** Evaluate EC2 compliance against **CIS Benchmark** standards. 
3. **S3 Security** All S3 buckets must use **AWS KMS encryption** with **key rotation enabled**. 
4. **IAM Security** Implement IAM roles with **least privilege** permissions for EC2 and S3 access. 
5. **Networking** Create a VPC with **three subnets** (public, private, isolated), proper routing, and security policies. 
6. **CloudTrail** Enable for the entire account with logs encrypted and stored in an S3 bucket. 
7. **RDS Security** Deploy RDS instances in **private subnets** only, restrict access, and enable encryption. 
8. **Security Groups** Restrict inbound/outbound traffic to the **minimum necessary**. 
9. **Patch Management** Automate EC2 patching using AWS Systems Manager. 
10. **Encryption in Transit** Enforce across all supported services. 
11. **WAF Protection** Use AWS WAF with CloudFront to protect web-facing resources. 
12. **Monitoring** Use CloudWatch to detect and alert on **unauthorized API calls**. 

**Constraints:** 
- All resources must be deployed in the **`us-east-1`** region. 
- Must follow **AWS security best practices** and **PCI-DSS compliance** guidelines. 
- YAML format only. 
- Output should be a **valid CloudFormation template** that can be deployed without modification. 
- Ensure modular, organized structure with clear **Parameters**, **Resources**, and **Outputs**. 

**Expected Output:** 
A **fully functional CloudFormation YAML template** that implements all above requirements in a single deployable file, optimized for readability, maintainability, and compliance.