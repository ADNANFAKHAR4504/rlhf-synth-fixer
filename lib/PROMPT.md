You are an AWS CloudFormation expert. Please create a CloudFormation template in YAML format named 'secure_infrastructure_setup.yaml' that provisions a secure AWS infrastructure meeting these requirements:

- IAM roles with least privilege, separated by function (e.g., web server role, database role, admin role).
- VPC with both public and private subnets; web servers in public subnets, database servers in private subnets.
- All S3 buckets must have default server-side encryption enabled.
- Enable AWS CloudTrail to log all API activity across the account.
- Ensure EBS volumes attached to EC2 instances are encrypted by default.
- Enable Amazon GuardDuty and configure it for initial threat monitoring and reporting.
- Support multi-account deployments for development, staging, and production environments using parameters or mappings to adjust names and settings per environment.
- Deploy in the US-East-1 region using standard AWS naming conventions based on environment and function.
- The template must validate with AWS CloudFormation and deploy without errors.
