# AWS CloudFormation Template Requirements
Create a secure and scalable AWS CloudFormation template (JSON format) to automate the deployment of a production-ready cloud environment. The template's goal is to provision all required AWS resources with robust security, compliance, and operational best practices, ensuring all infrastructure is protected, monitored, and efficiently managed.

# Environment Setup

- Define IAM roles and policies with least privilege
- Enforce Multi-Factor Authentication (MFA) for all IAM users
- Use AWS Config and AWS Config Rules to monitor compliance and track configuration changes
- Create a VPC with both public and private subnets (use 10.0.0.0/16, 10.0.1.0/24 for public, 10.0.2.0/24 for private)
- Secure traffic using Security Groups with least privilege (restrict SSH to specific IPs)
- Deploy AWS WAF to protect web applications from exploits
- Use encrypted EBS volumes for all EC2 instances
- Ensure RDS databases are not publicly accessible
- Enable logging and monitoring with CloudWatch and CloudTrail
- Set up AWS Shield for DDoS protection on critical resources
- Encrypt all in-transit data with SSL/TLS
- Apply AWS tag policies and naming conventions for resource management

# Constraints

- IAM roles and policies must be tightly scoped to least privilege
- Use AWS Config rules to monitor compliance
- Implement VPC with public and private subnets for enhanced security
- Security Groups must manage traffic in a least privilege manner and restrict SSH to specific IPs
- MFA must be enabled for all IAM users
- Deploy AWS WAF for web protection
- EBS volumes for EC2 must be encrypted
- RDS must not be publicly accessible
- Enable CloudWatch and CloudTrail for logging and monitoring
- Use AWS Shield for DDoS protection
- Encrypt all in-transit data with SSL/TLS
- Tag all resources following AWS best practices
- Track configuration changes with AWS Config and Config Rules
- Template must pass AWS CloudFormation validation and cfn-lint
- Do not hardcode region; use environment variable or parameter
- Use dynamic references over parameters for secrets (e.g., passwords)
- Do not use 'Fn::Sub' unless variables are required
- Do not include additional properties not allowed by resource types (e.g., 'BackupPolicy' for DynamoDB is not valid)
- 'IsLogging' is a required property for AWS::CloudTrail::Trail

# Output Expectations

- A single, production-ready CloudFormation JSON template implementing all requirements above
- The template must:
  - Deploy all specified AWS resources without error
  - Use descriptive logical resource names
  - Follow AWS best practices and security guidelines
  - Pass AWS CloudFormation validation and cfn-lint checks
