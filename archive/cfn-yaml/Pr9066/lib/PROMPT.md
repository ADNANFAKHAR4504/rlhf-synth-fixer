I need to create a comprehensive security-focused CloudFormation template in YAML format for AWS us-west-2 region. The infrastructure should implement a complete security monitoring and compliance architecture with the following integrated components:

1. **KMS Encryption Hub**: Create customer-managed KMS keys that connect to all S3 buckets for encrypting logs and data storage throughout the infrastructure

2. **Centralized Logging Architecture**:
   - Deploy S3 buckets that are encrypted with the KMS keys from step 1
   - Configure CloudTrail that writes to these encrypted S3 buckets for audit logging
   - Set up VPC Flow Logs that stream to the same encrypted S3 bucket infrastructure for network traffic monitoring
   - Ensure S3 bucket policies that allow CloudTrail and VPC Flow Logs to write to the buckets

3. **Network Security Layer**:
   - Deploy a VPC with public and private subnets
   - Attach VPC Flow Logs to the VPC that writes to the encrypted S3 buckets
   - Create Security Groups attached to the VPC subnets that control inbound traffic on SSH port 22 and HTTP/HTTPS ports 80/443 from specific IP ranges

4. **Identity & Access Management**:
   - Create IAM roles with strict assume role policies that connect to AWS services
   - Configure an IAM role that allows CloudTrail to write to S3 buckets
   - Configure an IAM role that allows VPC Flow Logs to write to S3 buckets
   - Configure an IAM role that allows AWS Config to write to S3 buckets

5. **Compliance & Monitoring Integration**:
   - Enable AWS Config that connects to the IAM role to continuously monitor resource configurations across the VPC, S3 buckets, and security groups
   - AWS Config writes to the encrypted S3 buckets with configuration snapshots and compliance findings
   - Enable GuardDuty with Malware Protection that connects to S3 to scan objects in the logging buckets
   - Integrate AWS Security Hub that connects to AWS Config, GuardDuty, and CloudTrail to aggregate security findings for centralized monitoring

Please ensure all service integrations follow AWS security best practices, use proper IAM policies for cross-service access, and include appropriate resource tags for tracking. Generate the complete infrastructure code with one code block per file. The main template should be comprehensive and production-ready.
